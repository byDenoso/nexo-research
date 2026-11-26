"""Gera data/curated/hubble-live.json: o diagrama de Hubble interativo da capa.

Para cada correção δ do ponto zero das supernovas do DES (−0,070 a +0,020 mag, passo 0,005),
ajusta ΛCDM e w0wa com BAO DESI DR2 + CMB comprimido (θ*, ωb, ωbc; Planck PR4 + ACT DR6 + SPT-3G)
+ Pantheon+ (só a tabela de Hoyt; a publicada é bloqueada pelo core_dde), com a magnitude absoluta
marginalizada analiticamente e o DES deslocado por δ. Guarda Δχ², w0, wa e, para desenhar,
os resíduos binados em relação ao ΛCDM do mesmo δ (DES e demais separados) e a curva w0wa − ΛCDM.
Também ajusta o offset do DES livre, para marcar o valor medido.

Convenção: o core_dde subtrai δ do módulo de distância do DES. δ = 0 são os dados publicados;
δ negativo torna o DES mais fraco (corrige um DES brilhante demais).

Uso: python scripts/emit-hubble-live.py
"""
import json
import sys
import time
from pathlib import Path

import numpy as np
from scipy.integrate import cumulative_trapezoid

CORE = Path(r'C:\ft\noite_ciencia\core_dde')
OUT = Path(__file__).resolve().parent.parent / 'data' / 'curated' / 'hubble-live.json'
if not hasattr(np, 'trapezoid'):  # numpy < 2 no ambiente compartilhado
    np.trapezoid = np.trapz
sys.path.insert(0, str(CORE))
import core_dde as K  # noqa: E402

EDGES = np.geomspace(0.01, 2.3, 14)
ZCURVE = np.geomspace(0.01, 2.3, 50)


def model_mu(L, res):
    p = res['params']
    f, _ = L.E2f(p); ok = p.get('ok', 0.0)
    dc = K._curved(cumulative_trapezoid(1 / np.sqrt(f(K.ZG)), K.ZG, initial=0), ok)
    M = L.offsets_hat(res)['M'][0]
    sn = L.sn
    mu_sn = 5 * np.log10((1 + sn.zhel) * np.interp(sn.z, K.ZG, dc)) + M
    mu_curve = 5 * np.log10((1 + ZCURVE) * np.interp(ZCURVE, K.ZG, dc)) + M
    return mu_sn, mu_curve


def binned(L, resid, mask):
    err = 1 / np.sqrt(np.clip(np.diag(L.sn.icov), 1e-12, None))
    out = []
    for lo, hi in zip(EDGES[:-1], EDGES[1:]):
        k = mask & (L.sn.z >= lo) & (L.sn.z < hi)
        if k.sum() < 4:
            continue
        w = 1 / err[k] ** 2
        out.append([round(float(np.sum(w * L.sn.z[k]) / w.sum()), 4), round(float(np.sum(w * resid[k]) / w.sum()), 4), round(float(np.sqrt(1 / w.sum())), 4), int(k.sum())])
    return out


def main():
    t0 = time.time()
    cfg = K.Config(sn='pplus_hoyt', cmb='baseline', offsets={})
    L = K.Likelihood(cfg)
    des = L.sn.groups['DES']

    # offset livre: o valor medido
    L.sn.set_offsets({'DES': 'free'})
    g = L.gain()
    off = L.offsets_hat(g['small'])['DES']
    measured = {'delta': round(off[0], 4), 'err': round(off[1], 4), 'dchi2': round(g['gain'], 2),
                'w0': round(g['big']['params']['w0'], 3), 'wa': round(g['big']['params']['wa'], 3)}
    print('livre', measured, '%.0fs' % (time.time() - t0), flush=True)

    frames = []
    sl = sb = None
    for delta in np.round(np.arange(-0.070, 0.0201, 0.005), 3):
        L.sn.set_offsets({'DES': ('fixed', float(delta))})
        rl = L.fit('lcdm', starts=[sl] if sl else None)
        starts = ([sb] + L.starts('w0wa')[:2]) if sb else L.starts('w0wa')
        rb = L.fit('w0wa', starts=starts)
        p0 = dict(rl['params']); p0.update({'w0': -1.0, 'wa': 0.0})
        pa = L.parts(p0)
        if pa is not None and sum(pa.values()) < rb['chi2']:
            rb = {'model': 'w0wa', 'chi2': float(sum(pa.values())), 'params': p0, 'parts': pa}
        sl = [rl['params'][k] for k in ('h', 'wb', 'wbc')]
        sb = [rb['params'][k] for k in ('h', 'wb', 'wbc', 'w0', 'wa')]
        mu_l, cl = model_mu(L, rl)
        mu_b, cb = model_mu(L, rb)
        resid = L.sn.mu - L.sn.shift - mu_l
        d = rl['chi2'] - rb['chi2']
        frames.append({
            'delta': float(delta), 'dchi2': round(d, 2), 'sigma': round(float(K.sigma(d, 2)), 2),
            'w0': round(rb['params']['w0'], 3), 'wa': round(rb['params']['wa'], 3),
            'h_lcdm': round(rl['params']['h'], 4), 'h_w0wa': round(rb['params']['h'], 4),
            'des': binned(L, resid, des), 'other': binned(L, resid, ~des),
            'curve': [round(float(v), 4) for v in (cb - cl)],
        })
        print('δ=%+.3f  Δχ²=%.2f  w0=%.3f wa=%.3f  %.0fs' % (delta, d, rb['params']['w0'], rb['params']['wa'], time.time() - t0), flush=True)

    out = {
        'data': 'BAO DESI DR2 + CMB (θ*, ωb, ωbc; Planck PR4 + ACT DR6 + SPT-3G) + Pantheon+ (Hoyt)',
        'n_sn': int(L.sn.n), 'n_des': int(des.sum()), 'zcurve': [round(float(z), 4) for z in ZCURVE],
        'measured': measured, 'frames': frames,
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print('ok', OUT, len(frames), 'quadros', '%.0fs' % (time.time() - t0))


if __name__ == '__main__':
    main()
