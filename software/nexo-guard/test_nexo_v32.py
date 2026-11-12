"""Casos de aceite do plano unificado. Dados sinteticos apenas. Rodar: python test_nexo_v32.py"""
import sys, io, json
import numpy as np
import nexo_guard_v32 as g
import nexo_protocolo as p

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
H = 'a' * 64
RES = []
def check(name, cond):
    RES.append((name, bool(cond))); print(('PASS ' if cond else 'FAIL ') + name)

PRIOR = {'decision': 'EXTENSAO_IDENTIFICADA', 'methods_read': True, 'sources': ['arXiv:x'], 'spec_sha256': H}
INP = {'drive_file_id': '1abc', 'sha256': H, 'bytes_verified': True, 'index_matched': True, 'essential_ready': True}
def W(**k):
    w = {'mode': 'AUDITORIA', 'stage': 'BASE', 'spec_sha256': H, 'prior_art': PRIOR, 'requires_observational_data': True, 'inputs': [INP]}
    w.update(k); return w

# --- decisao B
check('01 auditoria empirica sem dataset essencial: B nega', 'DRIVE_INPUT_REQUIRED' in g.validate_work(W(inputs=[])))
check('02 mesma auditoria na etapa LIT: A permite localizar o recurso', g.validate_work(W(inputs=[], stage='LIT')) == [])
check('03 teoria sem catalogo, com formalismo: admitida', g.validate_work(W(mode='TEORIA', inputs=[], requires_observational_data=False, formalism='ADM')) == [])
check('04 auditoria sem declarar se usa dados: recusada', 'DATA_REQUIREMENT_UNDECLARED' in g.validate_work({k: v for k, v in W(inputs=[]).items() if k != 'requires_observational_data'}))
check('05 CANDIDATOS sem entrada continua bloqueado (v3.1 preservada)', 'DRIVE_INPUT_REQUIRED' in g.validate_work(W(mode='CANDIDATOS', inputs=[])))
check('06 requisito essencial NAO SEI bloqueia', 'ESSENTIAL_REQUIREMENT_UNSATISFIED' in g.validate_work(W(essential_requirements=[{'need': 'coef 4D', 'answer': 'NAO_SEI'}])))
check('07 proxy que muda a pergunta bloqueia', 'PROXY_CHANGES_QUESTION' in g.validate_work(W(essential_requirements=[{'need': 'coef 4D', 'answer': 'sim', 'evidence': 'x', 'proxy_used': True}])))
check('08 fotometria DR5 no lugar de espectro: tipo de produto recusado', 'PRODUCT_TYPE_MISMATCH' in g.validate_work(W(inputs=[dict(INP, product_type='fotometria', required_product_type='espectro_1d')])))
check('09 etapa de computacao longa sem ambiente', 'NO_ADMISSIBLE_ENVIRONMENT' in g.validate_work(W(compute={'tier': 'T2'})))
check('10 multi-pulso sem estado serializado', 'CHECKPOINT_STATE_REQUIRED' in g.validate_work(W(compute={'tier': 'T1'})))
PW = {'recovery_rate': 0.91, 'amplitude_unit': 'mag', 'null_false_alarm': 0.01, 'estimator_fixed_before': True}
PT = {'reservas_event_id': 'RESERVAS!2', 'registered_before_exploration': True, 'partition_sha256': H}
check('11 busca com potencia e particao: admitida', g.validate_work(W(empirical_search=True, power=PW, partition=PT)) == [])
check('12 busca com recuperacao 0/100: BLOCKED_LOW_POWER', 'BLOCKED_LOW_POWER' in g.validate_work(W(empirical_search=True, power=dict(PW, recovery_rate=0.0), partition=PT)))
check('13 busca sem particao registrada', 'PARTITION_NOT_REGISTERED' in g.validate_work(W(empirical_search=True, power=PW, partition={})))
check('14 amplitude em sigma recusada', 'PHYSICAL_AMPLITUDE_REQUIRED' in g.validate_work(W(empirical_search=True, power=dict(PW, amplitude_unit='sigma'), partition=PT)))
check('15 potencia sem nulo calibrado recusada', 'NULL_CALIBRATION_REQUIRED' in g.validate_work(W(empirical_search=True, power=dict(PW, null_false_alarm=None), partition=PT)))

# --- decisao A
OP = {'family_id': 'F01', 'hypothesis': 'h', 'rival': 'r', 'discriminant': 'd', 'falsifier': 'f', 'owner_front': 'S7',
      'antecedents': [{'id': 'arXiv:2610.18710v1', 'read_sections': ['IV.7']}], 'novelty': {'delta_sentence': 'x', 'measured_delta': None},
      'competitor_deadline': None, 'relation_to_prior_families': {'type': 'NEW'}, 'triage_budget': {'pulses': 8, 'stop_rule': 'bloqueio sem proxy'}}
check('16 A passa sem delta medido e sem prazo de concorrente', g.validate_opportunity(OP) == [])
check('17 A recusa sem rival', 'RIVAL_REQUIRED' in g.validate_opportunity(dict(OP, rival='')))

# --- decisao C
D = {'delta_card': {'antecedent': 'X (2026)', 'delta_number': 0.12, 'reader': 'especialista'},
     'reviews': [{'reviewer_is_author': False, 'verdict': 'REPRODUZIDO_INDEPENDENTEMENTE', 'independence': 'REIMPLEMENTACAO'}],
     'evidence': {'state': 'PERSISTIDO_VERIFICADO', 'verified_by': 'S5', 'producer_front': 'S7'}, 'venue': {'cost': 'ZERO'}}
check('18 C passa com delta, revisao e evidencia conferida', g.validate_dossier(D) == [])
check('19 C recusa delta nulo', 'MEASURED_DELTA_REQUIRED' in g.validate_dossier(dict(D, delta_card=dict(D['delta_card'], delta_number=None))))
check('20 C recusa revisao feita pelo autor', 'NON_AUTHOR_REVIEW_REQUIRED' in g.validate_dossier(dict(D, reviews=[dict(D['reviews'][0], reviewer_is_author=True)])))
check('21 C recusa evidencia conferida pelo proprio produtor', 'EVIDENCE_NOT_VERIFIED_BY_NON_AUTHOR' in g.validate_dossier(dict(D, evidence={'state': 'PERSISTIDO_VERIFICADO', 'verified_by': 'S7', 'producer_front': 'S7'})))
check('22 C recusa confirmacao cega sem recibo da reserva', 'HOLDOUT_RECEIPT_REQUIRED' in g.validate_dossier(dict(D, claims_blind_confirmation=True)))

# --- identidade, reserva, limites, legado
check('23 work_id deterministico e sem data', g.work_id('N31-S1-006', 'ROB', H) == 'N31-S1-006-ROB-aaaaaaaa' and not g.has_timestamp(g.work_id('N31-S1-006', 'ROB', H)))
check('24 ID legado com carimbo e detectado', g.has_timestamp('N31-S1-006-NONCPL-PHENOM-QA-V311-20261109T1905'))
L = [{'partition_id': 'P1', 'exposure': 'PARTITION_REGISTERED'}]
check('25 reserva: primeira execucao permitida', g.holdout_decision(L, 'P1', H) == 'ALLOWED_SINGLE_SHOT')
check('26 reserva: segunda execucao vira exploratoria, mesmo com outro nome de hipotese', g.holdout_decision(L + [{'partition_id': 'P1', 'exposure': 'CONFIRMATORY_RUN'}], 'P1', H) == 'EXPLORATORY_ONLY_HOLDOUT_ALREADY_EXPOSED')
check('27 reserva sem registro previo e recusada', g.holdout_decision([], 'P9', H) == 'REFUSED_PARTITION_NOT_REGISTERED')
check('28 reserva vista por outra frente impede confirmacao', g.holdout_decision(L + [{'partition_id': 'P1', 'exposure': 'READ_INDIRECT'}], 'P1', H) == 'EXPLORATORY_ONLY_HOLDOUT_ALREADY_EXPOSED')
F = [{'percurso': 'INVESTIGACAO'}, {'percurso': 'VALIDACAO'}, {'percurso': 'INVESTIGACAO'}, {'percurso': 'INVESTIGACAO', 'track': 'DERIVACAO'}, {'percurso': 'INVESTIGACAO', 'exit': 'RESERVA'}]
check('29 terceira campanha excede o limite; reserva nao conta', g.wip_check(F)['over_limit'] == ['campanhas_empiricas'])
n = g.normalize_legacy('AUDITORIA_E0_RETROSPECTIVA')
check('30 legado normalizado preserva a string original', n == {'legacy_raw': 'AUDITORIA_E0_RETROSPECTIVA', 'activity': 'AUDITORIA', 'evidence_level': 'E0', 'timing': 'RETROSPECTIVA', 'is_qa': False})
ev = []; g.add_event(ev, {'id': 'e1', 'x': 1})
check('31 mesmo evento repetido nao duplica', g.add_event(ev, {'id': 'e1', 'x': 1}) == 'EXISTS' and len(ev) == 1)
try: g.add_event(ev, {'id': 'e1', 'x': 2}); c = False
except ValueError: c = True
check('32 mesmo event_id com conteudo diferente e conflito explicito', c)
check('33 correcao de pai marca descendentes', g.descendants_to_revalidate([{'id': 'a'}, {'id': 'b', 'parents': ['a']}, {'id': 'c', 'parents': ['b']}], 'a') == ['b', 'c'])

# --- protocolo
N = 1025
def stat(x): return float(np.max(x))                       # um estimador, fixado antes
def null_gauss(rng): return rng.normal(0, 0.15, N)
def null_heavy(rng): return rng.standard_t(3, N) * 0.15     # cauda pesada, como fotometria em mosaico
def inject(x, amp, rng):
    y = x.copy(); y[rng.choice(len(y), 15, replace=False)] += amp; return y
for label, ns in (('gaussiano', null_gauss), ('cauda pesada', null_heavy)):
    cal = p.calibrate_threshold(stat, ns, alpha=0.01, n_null=2000, seed=1)
    fa = p.false_alarm_rate(stat, ns, cal['threshold'], 4000, seed=2)
    check(f'34 falso alarme perto do nominal 0,01 com ruido {label}: {fa:.4f}', 0.003 <= fa <= 0.02)
cal = p.calibrate_threshold(stat, null_gauss, 0.01, 2000, 1)
lo = p.power_by_injection(stat, null_gauss, inject, 0.05, 'mag', cal['threshold'], 400, 3, 0.01)
hi = p.power_by_injection(stat, null_gauss, inject, 0.80, 'mag', cal['threshold'], 400, 3, 0.01)
check(f"35 sinal fraco e bloqueado ({lo['recovery_rate']:.2f}) e sinal forte passa ({hi['recovery_rate']:.2f})", lo['power_gate_status'] == 'BLOCKED_LOW_POWER' and hi['power_gate_status'] == 'PASSED')
md = p.min_detectable_amplitude(stat, null_gauss, inject, [0.1, 0.3, 0.5, 0.7, 0.9], 'mag', cal['threshold'], 300, 4)
check(f"36 menor amplitude detectavel a 80%: {md['min_detectable_at_80pct']} mag", md['min_detectable_at_80pct'] is not None)
try: p.power_by_injection(stat, null_gauss, inject, 3.5, 'sigma', cal['threshold'], 10, 1); c = False
except ValueError: c = True
check('37 amplitude em sigma e recusada pela biblioteca', c)
check('38 saida de potencia passa no validador', g.validate_work(W(empirical_search=True, power=hi, partition=PT)) == [])
src = 'def avaliar(df): return df > LIMIAR'
check('39 hash congelado muda quando o limiar muda', p.frozen_spec_sha256(src, {'LIMIAR': 3.0}, [H]) != p.frozen_spec_sha256(src, {'LIMIAR': 0.5}, [H]))
rng = np.random.default_rng(5); ra = rng.uniform(0, 360, 5000); dec = np.degrees(np.arcsin(rng.uniform(-1, 1, 5000)))
s1 = p.spatial_block_split(ra, dec, 0.3, seed=7); s2 = p.spatial_block_split(ra, dec, 0.3, seed=7); s3 = p.spatial_block_split(ra, dec, 0.3, seed=8)
check(f"40 particao reprodutivel e identificada por hash; fracao reservada {s1['n_holdout'] / 5000:.2f}", s1['partition_sha256'] == s2['partition_sha256'] != s3['partition_sha256'] and 0.2 < s1['n_holdout'] / 5000 < 0.4)
f2 = p.spatial_block_split([1, 2, 3, 4], [0, 0, 0, 0], 0.4, 1, field=['GOODS-N', 'GOODS-N', 'GOODS-S', 'GOODS-S'])
check('41 dois campos: um inteiro vai para a reserva', f2['n_holdout'] == 2 and f2['holdout_blocks'] == 1)
z = np.round(rng.uniform(0.5, 2.5, 600), 3); zb = np.round(rng.uniform(0.5, 2.5, 600), 3)       # pares sem relacao fisica, grade de 3 casas
q0 = p.quantization_shuffle_null(z, zb, 30.0, 500, 9)
zp = z.copy(); zp[:60] = zb[:60]                                                                  # 60 pares fisicos reais
q1 = p.quantization_shuffle_null(zp, zb, 30.0, 500, 9)
check(f"42 nulo por embaralhamento: grade sozinha nao gera sinal (p={q0['p_value']:.2f}); pares reais sao detectados (p={q1['p_value']:.3f})", q0['p_value'] > 0.05 and q1['p_value'] < 0.01)

bad = [n for n, ok in RES if not ok]
print(f'\n{len(RES) - len(bad)}/{len(RES)} casos passaram')
sys.exit(bool(bad))
