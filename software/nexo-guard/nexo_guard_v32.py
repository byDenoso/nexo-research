"""NEXO v3.2: validacao local de admissao (decisoes A, B, C), identidade e reserva.

Sem credenciais nem I/O remoto. Compativel com nexo_guard_v31: as funcoes antigas
continuam existindo com o mesmo comportamento, exceto validate_work, que deixa de
depender de mode == 'CANDIDATOS' para exigir dados.

Mudancas sobre a v3.1:
  1. Dados exigidos por dependencia essencial da etapa, nao pelo modo.
  2. Busca empirica exige particao registrada e potencia demonstrada (decisao B).
  3. Decisao C (dossie) exige delta medido e revisao por nao autor.
  4. work_id deterministico por familia, etapa e especificacao.
  5. Reserva: uma execucao por particao, conferida contra o registro.
  6. Adaptador de vocabulario legado que preserva a string original.
"""
from __future__ import annotations
import hashlib, json, math, re
from typing import Any

VERSION = '3.2.0'
MODES = {'CANDIDATOS', 'TEORIA', 'AUDITORIA', 'HIPOTESES', 'SINTESE', 'REPLICA_CRUZADA'}
DECISIONS = {'REPLICA_PLANEJADA', 'EXTENSAO_IDENTIFICADA', 'NAO_ENCONTREI_EQUIVALENTE_NO_ESCOPO_BUSCADO', 'EQUIVALENTE_ENCONTRADO'}
STAGES = ['LIT', 'INPUT', 'SPEC', 'BASE', 'DISC', 'ROB', 'REPL', 'CLOSE']
PREP_STAGES = {'LIT', 'INPUT', 'SPEC', 'CLOSE'}          # decisao A basta
EMPIRICAL_MODES = {'CANDIDATOS', 'AUDITORIA', 'HIPOTESES'}
AXES = {
    'percurso': ['PROPOSTA', 'ANTECEDENTES', 'VIABILIDADE', 'INVESTIGACAO', 'VALIDACAO', 'SINTESE', 'ENCERRADA'],
    'operacao': ['WAIT_DEPENDENCY', 'PRONTO', 'RESERVADO', 'EXECUTANDO', 'CALCULO_CONCLUIDO', 'FALHOU_RECUPERAVEL'],
    'evidencia': ['AUSENTE', 'LOCAL', 'PENDING_UPLOAD', 'PERSISTIDO_NAO_INDEXADO', 'PERSISTIDO_VERIFICADO', 'RECOMPUTE_REQUIRED'],
    'editorial': ['NAO_AVALIADO', 'DELTA_PROSPECTIVO', 'EM_REVISAO', 'APTO_A_DOSSIE', 'AUTOR_DECIDE', 'SUBMETIDO', 'ACEITO'],
}
EXITS = {'BLOQUEADA', 'RESERVA', 'PRECEDENTE_ENCONTRADO', 'REFUTADA', 'INCONCLUSIVA'}
WIP_LIMITS = {'campanhas_empiricas': 2, 'derivacoes': 1, 'triagens': 4, 'proximas_etapas': 6}
POWER_MIN = 0.80
HASH = re.compile(r'^[0-9a-fA-F]{64}$')


# ---------- utilidades herdadas da v3.1 (inalteradas)
def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def canonical_bytes(value: Any) -> bytes:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'), allow_nan=False).encode('utf-8')

def logical_id(prefix: str, spec: dict) -> str:
    return prefix + '-' + sha256_bytes(canonical_bytes(spec))[:24]

def verify_bytes(data: bytes, expected: str) -> bool:
    return bool(HASH.fullmatch(expected)) and sha256_bytes(data) == expected.lower()


# ---------- identidade deterministica
def work_id(family_id: str, stage: str, spec_sha256: str) -> str:
    """ID logico do trabalho: sem data nem hora. Retentativa incrementa `attempt`, nao muda o ID."""
    if stage not in STAGES: raise ValueError('UNKNOWN_STAGE')
    if not HASH.fullmatch(spec_sha256): raise ValueError('SPEC_SHA_REQUIRED')
    if not family_id or re.search(r'20\d{6}T\d{4}', family_id): raise ValueError('FAMILY_ID_INVALID')
    return f'{family_id}-{stage}-{spec_sha256[:8].lower()}'

def has_timestamp(identifier: str) -> bool:
    return bool(re.search(r'20\d{6}(T\d{4,6})?', identifier or ''))


# ---------- decisao A: investigar viabilidade
def validate_opportunity(op: dict) -> list[str]:
    e = []
    for k, code in [('family_id', 'FAMILY_ID_REQUIRED'), ('hypothesis', 'HYPOTHESIS_REQUIRED'), ('rival', 'RIVAL_REQUIRED'),
                    ('discriminant', 'DISCRIMINANT_REQUIRED'), ('falsifier', 'FALSIFIER_REQUIRED'), ('owner_front', 'OWNER_REQUIRED')]:
        if not op.get(k): e.append(code)
    ant = op.get('antecedents', [])
    if not ant and not op.get('search_documented'): e.append('ANTECEDENT_OR_DOCUMENTED_SEARCH_REQUIRED')
    for a in ant:
        if not a.get('id') or not a.get('read_sections'): e.append('ANTECEDENT_METHODS_NOT_READ')
    if not op.get('novelty', {}).get('delta_sentence'): e.append('PROSPECTIVE_DELTA_REQUIRED')
    rel = op.get('relation_to_prior_families', {})
    if rel.get('type') not in {'NEW', 'MERGE', 'EXTEND'}: e.append('RELATION_TO_PRIOR_REQUIRED')
    tb = op.get('triage_budget', {})
    if not tb.get('pulses') or not tb.get('stop_rule'): e.append('TRIAGE_BUDGET_AND_STOP_RULE_REQUIRED')
    # Nao bloqueiam A: delta numerico medido e prazo de concorrente (podem ser None).
    return sorted(set(e))


# ---------- decisao B: executar UMA etapa
def _check_inputs(inputs: list[dict], errors: list[str]) -> None:
    for inp in inputs:
        fid = inp.get('drive_file_id', '')
        if not fid or fid.startswith(('/', 'http', 'file:')) or fid in ('(pendente)', 'UNKNOWN'):
            errors.append('DRIVE_INPUT_REQUIRED')
        if not HASH.fullmatch(inp.get('sha256', '')): errors.append('FULL_SHA256_REQUIRED')
        if not inp.get('bytes_verified') or not inp.get('index_matched'): errors.append('INPUT_NOT_VERIFIED')
        if not inp.get('essential_ready'): errors.append('ESSENTIAL_INPUT_MISSING')
        if 'product_type' in inp and 'required_product_type' in inp and inp['product_type'] != inp['required_product_type']:
            errors.append('PRODUCT_TYPE_MISMATCH')          # ex.: fotometria DR5 no lugar de espectro 1D

def validate_work(work: dict) -> list[str]:
    errors = []
    mode = work.get('mode')
    if mode not in MODES: errors.append('UNKNOWN_MODE')
    stage = work.get('stage', 'BASE')
    if stage not in STAGES: errors.append('UNKNOWN_STAGE')
    spec = work.get('spec_sha256', '')
    if not HASH.fullmatch(spec): errors.append('SPEC_SHA_REQUIRED')
    prior = work.get('prior_art', {})
    if prior.get('decision') not in DECISIONS or not prior.get('methods_read') or not prior.get('sources'):
        errors.append('PRIOR_ART_NOT_READY')
    if prior.get('spec_sha256') != spec: errors.append('PRIOR_ART_SPEC_MISMATCH')

    inputs = work.get('inputs', [])
    executable = stage not in PREP_STAGES
    needs = work.get('requires_observational_data')
    if needs is None:
        if mode == 'CANDIDATOS': needs = True
        elif mode in EMPIRICAL_MODES and executable: errors.append('DATA_REQUIREMENT_UNDECLARED'); needs = False
        else: needs = False
    if needs and executable and not inputs: errors.append('DRIVE_INPUT_REQUIRED')
    _check_inputs(inputs, errors)

    if executable:
        for req in work.get('essential_requirements', []):
            if req.get('answer') != 'sim' or not req.get('evidence'): errors.append('ESSENTIAL_REQUIREMENT_UNSATISFIED')
            if req.get('proxy_used'): errors.append('PROXY_CHANGES_QUESTION')
        cap = work.get('compute', {})
        if cap.get('tier') == 'T2': errors.append('NO_ADMISSIBLE_ENVIRONMENT')
        if cap.get('tier') == 'T1' and not cap.get('checkpoint_serializes_state'): errors.append('CHECKPOINT_STATE_REQUIRED')

    if work.get('empirical_search') and executable:
        part = work.get('partition', {})
        if not part.get('reservas_event_id') or not part.get('registered_before_exploration') or not HASH.fullmatch(part.get('partition_sha256', '')):
            errors.append('PARTITION_NOT_REGISTERED')
        pw = work.get('power', {})
        rec = pw.get('recovery_rate')
        if rec is None or not math.isfinite(float(rec)): errors.append('POWER_NOT_MEASURED')
        elif float(rec) < float(pw.get('threshold', POWER_MIN)): errors.append('BLOCKED_LOW_POWER')
        if pw.get('amplitude_unit') in (None, '', 'sigma', 'snr'): errors.append('PHYSICAL_AMPLITUDE_REQUIRED')
        if pw.get('null_false_alarm') is None: errors.append('NULL_CALIBRATION_REQUIRED')
        if pw.get('estimator_fixed_before') is not True: errors.append('ESTIMATOR_NOT_FROZEN')

    if mode == 'TEORIA' and not work.get('formalism'): errors.append('FORMALISM_REQUIRED')
    if mode == 'SINTESE':
        parents = work.get('parents', [])
        if len({p.get('source_result_id') for p in parents if p.get('source_result_id')}) < 2:
            errors.append('TWO_DISTINCT_PARENT_RESULTS_REQUIRED')
        if work.get('synthesis_rule', 'TWO_FRONTS') == 'TWO_FRONTS':
            if len({p.get('producer_front') for p in parents if p.get('producer_front')}) < 2:
                errors.append('TWO_PRODUCER_FRONTS_REQUIRED')
        else:                                               # regra por dependencias reais (decisao D7)
            if not work.get('independence_statement'): errors.append('INDEPENDENCE_STATEMENT_REQUIRED')
            if work.get('shared_dependencies') and not work.get('shared_dependencies_addressed'):
                errors.append('SHARED_DEPENDENCIES_NOT_ADDRESSED')
        for p in parents:
            if not p.get('achado_id') or not p.get('revision') or not HASH.fullmatch(p.get('manifest_sha256', '')) or not p.get('readback_verified') or not p.get('artifact_verified'):
                errors.append('PARENT_NOT_VERIFIED')
        if 'shared_dependencies' not in work: errors.append('DEPENDENCIES_REQUIRED')
        if not work.get('testable_consequence'): errors.append('TESTABLE_CONSEQUENCE_REQUIRED')
    if mode == 'REPLICA_CRUZADA':
        t = work.get('target', {})
        if work.get('front') == t.get('producer_front') or work.get('front') in t.get('authors', []): errors.append('REPLICA_CONFLICT')
        if not work.get('independent_implementation'): errors.append('INDEPENDENT_IMPLEMENTATION_REQUIRED')
        if not work.get('tolerances_frozen'): errors.append('TOLERANCES_REQUIRED')
        if not t.get('g3') or not t.get('artifact_verified'): errors.append('G3_TARGET_NOT_READY')
    return sorted(set(errors))


# ---------- decisao C: promover editorialmente
def validate_dossier(d: dict) -> list[str]:
    e = []
    card = d.get('delta_card', {})
    if not card.get('antecedent'): e.append('ANTECEDENT_REQUIRED')
    if card.get('delta_number') is None: e.append('MEASURED_DELTA_REQUIRED')
    if not card.get('reader'): e.append('READER_REQUIRED')
    reviews = d.get('reviews', [])
    ok = [r for r in reviews if r.get('reviewer_is_author') is False and r.get('verdict') in {'REPRODUZIDO_INDEPENDENTEMENTE', 'DIVERGENCIA_EXPLICADA'}]
    if not ok: e.append('NON_AUTHOR_REVIEW_REQUIRED')
    if any(not r.get('independence') for r in ok): e.append('INDEPENDENCE_TYPE_REQUIRED')
    ev = d.get('evidence', {})
    if ev.get('state') != 'PERSISTIDO_VERIFICADO' or ev.get('verified_by') in (None, '', ev.get('producer_front')):
        e.append('EVIDENCE_NOT_VERIFIED_BY_NON_AUTHOR')
    if d.get('claims_blind_confirmation') and not d.get('holdout_receipt_id'): e.append('HOLDOUT_RECEIPT_REQUIRED')
    if d.get('venue', {}).get('cost') not in (None, 'ZERO'): e.append('ZERO_COST_VENUE_REQUIRED')
    return sorted(set(e))


# ---------- reserva: uma execucao por particao
def holdout_decision(ledger: list[dict], partition_id: str, frozen_spec_sha256: str) -> str:
    """ledger = linhas de RESERVAS. Decide se a execucao confirmatoria pode ocorrer."""
    if not HASH.fullmatch(frozen_spec_sha256): return 'REFUSED_SPEC_NOT_FROZEN'
    rows = [r for r in ledger if r.get('partition_id') == partition_id]
    if not any(r.get('exposure') == 'PARTITION_REGISTERED' for r in rows): return 'REFUSED_PARTITION_NOT_REGISTERED'
    if any(r.get('exposure') in {'READ_DIRECT', 'READ_INDIRECT', 'CONFIRMATORY_RUN'} for r in rows):
        return 'EXPLORATORY_ONLY_HOLDOUT_ALREADY_EXPOSED'
    return 'ALLOWED_SINGLE_SHOT'


# ---------- limites de trabalho simultaneo
def wip_check(families: list[dict]) -> dict:
    """families = estado corrente (uma linha por familia). Devolve contagem e excessos."""
    live = [f for f in families if f.get('exit') not in EXITS and f.get('percurso') != 'ENCERRADA']
    n = {
        'campanhas_empiricas': sum(1 for f in live if f.get('percurso') in {'INVESTIGACAO', 'VALIDACAO'} and f.get('track') != 'DERIVACAO'),
        'derivacoes': sum(1 for f in live if f.get('percurso') in {'INVESTIGACAO', 'VALIDACAO'} and f.get('track') == 'DERIVACAO'),
        'triagens': sum(1 for f in live if f.get('percurso') == 'VIABILIDADE'),
        'proximas_etapas': sum(1 for f in live if f.get('operacao') == 'PRONTO' and f.get('percurso') in {'ANTECEDENTES', 'VIABILIDADE'}),
    }
    over = sorted(k for k, v in n.items() if v > WIP_LIMITS[k])
    return {'counts': n, 'limits': WIP_LIMITS, 'over_limit': over, 'admit_new': not over}


# ---------- adaptador de vocabulario legado (nao reescreve historico)
_ACT = [('ARTIFACT', 'TRANSPORTE'), ('ARTEFATO', 'TRANSPORTE'), ('PERSIST', 'TRANSPORTE'), ('TRANSPORT', 'TRANSPORTE'), ('RECUPERACAO', 'TRANSPORTE'),
        ('RECOVERY', 'TRANSPORTE'), ('REPLICA', 'REPLICA_CRUZADA'), ('ARBITRAGEM', 'REVISAO'), ('REVIS', 'REVISAO'), ('CURADORIA', 'CURADORIA'),
        ('AUDITORIA', 'AUDITORIA'), ('TEORIA', 'TEORIA'), ('CONTROLE', 'CONTROLE'), ('HIPOTES', 'HIPOTESES'), ('CANDIDAT', 'CANDIDATOS'),
        ('SINTESE', 'SINTESE'), ('INPUT', 'PREPARACAO'), ('PREPARACAO', 'PREPARACAO'), ('LIT', 'PREPARACAO'), ('TEST', 'TESTE')]

def normalize_legacy(raw: str) -> dict:
    s = (raw or '').upper()
    activity = next((v for k, v in _ACT if k in s), 'DESCONHECIDO')
    level = next((x for x in ('E2', 'E1', 'E0') if re.search(rf'(^|_){x}(_|$)', s)), None)
    timing = 'RETROSPECTIVA' if re.search(r'POSTHOC|POSHOC|RETROSPECT', s) else None
    return {'legacy_raw': raw, 'activity': activity, 'evidence_level': level, 'timing': timing, 'is_qa': 'QA' in s.split('_') or '_QA' in s}


# ---------- funcoes herdadas da v3.1 (inalteradas)
def add_event(events: list[dict], event: dict) -> str:
    if not event.get('id'): raise ValueError('event id required')
    for old in events:
        if old.get('id') == event['id']:
            if canonical_bytes(old) != canonical_bytes(event): raise ValueError('EVENT_ID_CONFLICT')
            return 'EXISTS'
    events.append(event.copy())
    return 'APPENDED'

def descendants_to_revalidate(nodes: list[dict], changed_id: str) -> list[str]:
    seen = {changed_id}
    for _ in range(len(nodes)):
        new = {n['id'] for n in nodes if set(n.get('parents', [])) & seen} - seen
        if not new: break
        seen.update(new)
    return sorted(seen - {changed_id})

def backlog_targets(daily_completed_units: list[float]) -> dict:
    if not daily_completed_units:
        return {'status': 'BASELINE_REQUIRED', 'ready_horizon_days': 7, 'pipeline_horizon_days': 28, 'warning_horizon_days': 2, 'ready_units': None, 'pipeline_units': None}
    values = sorted(float(x) for x in daily_completed_units[-7:] if math.isfinite(float(x)) and float(x) >= 0)
    if not values: raise ValueError('no valid measured days')
    rate = values[max(0, math.ceil(.9 * len(values)) - 1)]
    return {'status': 'MEASURED_TARGET', 'daily_rate_units_p90': rate, 'ready_units': math.ceil(7 * rate), 'pipeline_units': math.ceil(28 * rate), 'warning_units': math.ceil(2 * rate), 'sample_days': len(values)}

def count_material(rows: list[dict]) -> int:
    kinds = {'TEST', 'DERIVATION', 'SYNTHESIS_TEST', 'INDEPENDENT_REPLICATION'}
    return len({r['scientific_id'] for r in rows if r.get('scientific_id') and r.get('material') and r.get('kind') in kinds})

def complete_attempt(state: dict, attempt: int, owner: str) -> str:
    if attempt != state.get('attempt') or owner != state.get('owner'): raise ValueError('STALE_ATTEMPT_OR_OWNER')
    return 'CALCULO_CONCLUIDO'


if __name__ == '__main__':
    import argparse, pathlib, sys
    parser = argparse.ArgumentParser()
    parser.add_argument('command', choices=['validate', 'opportunity', 'dossier', 'hash', 'targets', 'wip'])
    parser.add_argument('path')
    args = parser.parse_args(); data = pathlib.Path(args.path).read_bytes()
    if args.command == 'hash': print(sha256_bytes(data))
    elif args.command == 'targets': print(json.dumps(backlog_targets(json.loads(data)), ensure_ascii=False))
    elif args.command == 'wip': print(json.dumps(wip_check(json.loads(data)), ensure_ascii=False))
    else:
        fn = {'validate': validate_work, 'opportunity': validate_opportunity, 'dossier': validate_dossier}[args.command]
        errors = fn(json.loads(data)); print(json.dumps({'valid': not errors, 'errors': errors}, ensure_ascii=False)); sys.exit(bool(errors))
