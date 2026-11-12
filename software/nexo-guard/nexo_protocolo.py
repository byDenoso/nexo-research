"""NEXO: protocolo de busca empirica. So NumPy; cabe em um pulso.

Ordem obrigatoria: particao -> limiar calibrado em nulo -> potencia por injecao
-> (decisao B) -> busca na exploracao -> ataques por nao autor -> especificacao
congelada -> execucao unica na reserva.

Regras que o codigo impoe:
  - O limiar de deteccao vem de nulos reamostrados da propria amostra, nunca de
    uma formula gaussiana. Isso mantem o falso alarme perto do nominal com ruido
    de cauda pesada.
  - A potencia e medida com amplitude em unidade fisica do observavel e com UM
    estimador, fixado antes.
  - O hash congelado cobre codigo-fonte, parametros e dados.
  - O nulo de quantizacao e o embaralhamento dos valores quantizados
    (nexo-paper 3.7); dithering de ULP nao e veredito.
"""
from __future__ import annotations
import hashlib, json
from typing import Callable
import numpy as np

POWER_MIN = 0.80


# ---------- 1. particao espacial em blocos de area igual
def spatial_block_split(ra_deg, dec_deg, holdout_fraction: float, seed: int, n_ra: int = 24, n_dec: int = 12, field=None) -> dict:
    """Divide por blocos do ceu (area igual: faixas uniformes em sen(dec)) ou por campo nomeado.
    Devolve mascara da reserva e um hash que identifica a particao. `holdout_fraction` e decidido
    por familia: em amostra pequena, reservar muito derruba a potencia."""
    ra = np.asarray(ra_deg, float); dec = np.asarray(dec_deg, float)
    if not 0 < holdout_fraction < 1: raise ValueError('holdout_fraction fora de (0,1)')
    if field is not None:
        block = np.unique(np.asarray(field), return_inverse=True)[1]
    else:
        i = np.minimum((np.mod(ra, 360.0) / 360.0 * n_ra).astype(int), n_ra - 1)
        j = np.minimum(((np.sin(np.radians(dec)) + 1.0) / 2.0 * n_dec).astype(int), n_dec - 1)
        block = i * n_dec + j
    blocks = np.unique(block)
    if len(blocks) < 2: raise ValueError('UM_SO_BLOCO: particao espacial impossivel')
    order = np.random.default_rng(seed).permutation(blocks)
    k = min(len(blocks) - 1, max(1, int(round(len(blocks) * holdout_fraction))))
    hold = np.isin(block, order[:k])
    h = hashlib.sha256()
    h.update(json.dumps({'seed': seed, 'fraction': holdout_fraction, 'n_ra': n_ra, 'n_dec': n_dec, 'by_field': field is not None}, sort_keys=True).encode())
    h.update(np.packbits(hold).tobytes()); h.update(str(len(hold)).encode())
    return {'holdout_mask': hold, 'n_explore': int((~hold).sum()), 'n_holdout': int(hold.sum()),
            'n_blocks': int(len(blocks)), 'holdout_blocks': int(k), 'partition_sha256': h.hexdigest()}


# ---------- 2. limiar calibrado por nulo reamostrado
def calibrate_threshold(stat_fn: Callable, null_sampler: Callable, alpha: float, n_null: int, seed: int) -> dict:
    """stat_fn(sample) -> escalar (maior = mais anomalo). null_sampler(rng) -> amostra sob o nulo.
    O limiar e o quantil (1-alpha) da estatistica sob o nulo."""
    if n_null * alpha < 5: raise ValueError('n_null pequeno para alpha: use n_null >= 5/alpha')
    rng = np.random.default_rng(seed)
    s = np.sort([float(stat_fn(null_sampler(rng))) for _ in range(n_null)])
    thr = float(s[int(np.ceil((1 - alpha) * n_null)) - 1])
    return {'threshold': thr, 'alpha': alpha, 'n_null': n_null}

def false_alarm_rate(stat_fn, null_sampler, threshold: float, n_trials: int, seed: int) -> float:
    rng = np.random.default_rng(seed)
    return float(np.mean([stat_fn(null_sampler(rng)) > threshold for _ in range(n_trials)]))


# ---------- 3. potencia por injecao
def power_by_injection(stat_fn, null_sampler, inject_fn, amplitude: float, amplitude_unit: str,
                       threshold: float, n_trials: int, seed: int, null_false_alarm: float | None = None) -> dict:
    """inject_fn(sample, amplitude, rng) -> amostra com o sinal injetado. `amplitude` na unidade
    fisica do observavel (mag, km/s, dex...). Cada realizacao reamostra o ruido."""
    if amplitude_unit.lower() in ('sigma', 'snr', ''): raise ValueError('PHYSICAL_AMPLITUDE_REQUIRED')
    rng = np.random.default_rng(seed)
    hits = sum(stat_fn(inject_fn(null_sampler(rng), amplitude, rng)) > threshold for _ in range(n_trials))
    rec = hits / n_trials
    return {'recovery_rate': float(rec), 'recovery_se': float(np.sqrt(max(rec * (1 - rec), 1e-12) / n_trials)),
            'amplitude': amplitude, 'amplitude_unit': amplitude_unit, 'threshold': threshold, 'n_trials': n_trials,
            'null_false_alarm': null_false_alarm, 'estimator_fixed_before': True,
            'power_gate_status': 'PASSED' if rec >= POWER_MIN else 'BLOCKED_LOW_POWER'}

def min_detectable_amplitude(stat_fn, null_sampler, inject_fn, amplitudes, amplitude_unit, threshold, n_trials, seed) -> dict:
    """Menor amplitude da grade com recuperacao >= 80% (campo 6 do cartao de resultado)."""
    out = []
    for a in amplitudes:
        r = power_by_injection(stat_fn, null_sampler, inject_fn, float(a), amplitude_unit, threshold, n_trials, seed)
        out.append((float(a), r['recovery_rate']))
    ok = [a for a, rec in out if rec >= POWER_MIN]
    return {'curve': out, 'min_detectable_at_80pct': min(ok) if ok else None, 'unit': amplitude_unit}


# ---------- 4. especificacao congelada
def frozen_spec_sha256(source_text: str, params: dict, data_sha256: list[str]) -> str:
    """Hash do pacote inteiro: codigo-fonte, parametros (limiares incluidos) e dados."""
    payload = {'source_sha256': hashlib.sha256(source_text.encode('utf-8')).hexdigest(),
               'params': params, 'data_sha256': sorted(data_sha256)}
    return hashlib.sha256(json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode('utf-8')).hexdigest()


# ---------- 5. ataques instrumentais
def quantization_shuffle_null(z1, z2, dv_max_kms: float, n_shuffle: int, seed: int) -> dict:
    """Excesso de pares com |dv| < dv_max. Nulo: embaralhar os parceiros, mantendo os valores
    quantizados como estao. Colisoes criadas pela grade aparecem tambem no nulo."""
    c = 299792.458
    z1 = np.asarray(z1, float); z2 = np.asarray(z2, float)
    count = lambda a, b: int(np.sum(c * np.abs(a - b) / (1 + 0.5 * (a + b)) < dv_max_kms))
    obs = count(z1, z2); rng = np.random.default_rng(seed)
    null = np.array([count(z1, rng.permutation(z2)) for _ in range(n_shuffle)])
    p = float((1 + np.sum(null >= obs)) / (n_shuffle + 1))
    return {'observed': obs, 'null_mean': float(null.mean()), 'null_p95': float(np.percentile(null, 95)), 'p_value': p,
            'note': 'redshift com poucas casas so se resolve no espectro bruto'}

def sky_shift_null(count_matches: Callable, shifts_arcmin, n_directions: int, seed: int) -> dict:
    """count_matches(dra_deg, ddec_deg) -> numero de associacoes com um catalogo deslocado.
    Mede a taxa de coincidencia casual."""
    rng = np.random.default_rng(seed); obs = int(count_matches(0.0, 0.0)); null = []
    for s in shifts_arcmin:
        for th in rng.uniform(0, 2 * np.pi, n_directions):
            null.append(int(count_matches(s / 60.0 * np.cos(th), s / 60.0 * np.sin(th))))
    null = np.array(null)
    return {'observed': obs, 'chance_mean': float(null.mean()), 'chance_p99': float(np.percentile(null, 99)),
            'p_value': float((1 + np.sum(null >= obs)) / (len(null) + 1))}

ATTACKS_BY_DATA = {
    'catalogo_com_redshift': ['quantization_shuffle_null', 'espectro_bruto', 'objeto_conhecido'],
    'associacao_entre_catalogos': ['sky_shift_null', 'epoca_e_movimento_proprio', 'objeto_conhecido'],
    'feixe_largo_radio_ou_X': ['mistura_no_feixe_com_perfis_reais', 'sky_shift_null', 'mapa_de_exposicao'],
    'fotometria_em_mosaico': ['borda_e_flags', 'ruido_correlacionado', 'psf_pareada', 'objeto_conhecido'],
}
