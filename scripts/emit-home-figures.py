"""Gera data/curated/home-figures.json: os dados reais das três mini-figuras da capa.

1. Diagrama de Hubble: Pantheon+ (tabela de Hoyt, via core_dde, que bloqueia a publicada),
   m_B corrigida em bins de redshift, com a curva de ΛCDM plano (Ωm = 0,315) ajustada no ponto zero.
2. Espectro: NEXUS 5819, PRISM combinado (4 épocas), com as linhas marcadas em z = 5,758.
3. Contornos w0–wa: perfil de verossimilhança da combinação BAO DESI DR2 + CMB + Pantheon+ (Hoyt),
   níveis Δχ² = 2,30 e 6,18 (68% e 95% para dois parâmetros).

Uso: NEXO_CORE_DDE=<pasta do core_dde> NEXO_SPEC_NEXUS5819=<espectro combinado .txt> python scripts/emit-home-figures.py
"""
import json
import os
import sys
from pathlib import Path

import numpy as np

CORE = Path(os.environ['NEXO_CORE_DDE'])
SPEC = Path(os.environ['NEXO_SPEC_NEXUS5819'])
GRID = CORE / 'profile_likelihood' / 'out' / 'grid_C2.json'
OUT = Path(__file__).resolve().parent.parent / 'data' / 'curated' / 'home-figures.json'

if not hasattr(np, 'trapezoid'):  # numpy < 2 no ambiente compartilhado
    np.trapezoid = np.trapz
sys.path.insert(0, str(CORE))
import core_dde  # noqa: E402


def hubble():
    import pandas as pd
    d = pd.read_csv(core_dde.path_of('pplus_hoyt_dat'), sep=r'\s+', usecols=['zHD', 'm_b_corr', 'IS_CALIBRATOR'])
    full = core_dde._floats(core_dde.path_of('pplus_cov'))
    n = int(full[0])
    err = np.sqrt(np.diag(full[1:].reshape(n, n)))
    keep = (d.zHD.values > 0.01) & (d.IS_CALIBRATOR.values == 0)
    z, m, e = d.zHD.values[keep], d.m_b_corr.values[keep], err[keep]
    edges = np.geomspace(0.01, 2.3, 17)
    rows = []
    for lo, hi in zip(edges[:-1], edges[1:]):
        k = (z >= lo) & (z < hi)
        if k.sum() < 3:
            continue
        w = 1 / e[k] ** 2
        rows.append({'z': float(np.sum(w * z[k]) / w.sum()), 'm': float(np.sum(w * m[k]) / w.sum()),
                     'err': float(np.sqrt(1 / w.sum())), 'n': int(k.sum())})

    def dl(zz, om=0.315):
        zs = np.linspace(0, zz, 400)
        return (1 + zz) * np.trapezoid(1 / np.sqrt(om * (1 + zs) ** 3 + 1 - om), zs)

    shape = np.array([5 * np.log10(dl(r['z'])) for r in rows])
    mm = np.array([r['m'] for r in rows]); ww = 1 / np.array([r['err'] for r in rows]) ** 2
    off = float(np.sum(ww * (mm - shape)) / ww.sum())
    curve = [{'z': float(x), 'm': float(5 * np.log10(dl(x)) + off)} for x in np.geomspace(0.01, 2.3, 60)]
    return {'bins': rows, 'lcdm': curve, 'n_sn': int(keep.sum()), 'omega_m': 0.315}


def spectrum():
    a = np.loadtxt(SPEC)
    a = a[np.isfinite(a[:, 1]) & np.isfinite(a[:, 2])]
    a = a[(a[:, 0] > 0.7) & (a[:, 0] < 5.3)]
    z = 5.758
    lines = [('N IV]', 1486.5), ('C IV', 1549.0), ('He II', 1640.4), ('[O III]', 5008.2), ('Hα', 6564.6)]
    pts = [{'um': round(float(w), 4), 'f': round(float(f), 4)} for w, f, _ in a]
    return {'object': 'NEXUS 5819', 'z': z, 'unit': 'µJy',
            'lines': [{'name': n, 'um': round(r * (1 + z) / 1e4, 4)} for n, r in lines],
            'points': pts}


def contours():
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    g = json.load(open(GRID))
    w0, wa = np.array(g['w0']), np.array(g['wa'])
    chi2 = np.array(g['chi2'], dtype=float)
    chi2 = np.where(np.isfinite(chi2), chi2, np.nan)
    if chi2.shape != (len(w0), len(wa)):
        chi2 = chi2.T
    d = chi2 - np.nanmin(chi2)
    d = np.where(np.isnan(d), 1e3, d)
    cs = plt.contour(wa, w0, d, levels=[2.30, 6.18])
    paths = []
    for level, segs in zip([2.30, 6.18], cs.allsegs):
        for seg in segs:
            if len(seg) > 8:
                paths.append({'level': level, 'pts': [[round(float(x), 4), round(float(y), 4)] for x, y in seg]})
    best = g['cpl_global']['params']
    return {'combination': 'BAO DESI DR2 + CMB (θ*, ωb, ωbc) + Pantheon+',
            'dchi2_lcdm': round(float(g['dchi2_lcdm']), 2),
            'best': {'w0': round(best['w0'], 3), 'wa': round(best['wa'], 3)},
            'paths': paths}


if __name__ == '__main__':
    out = {'hubble': hubble(), 'spectrum': spectrum(), 'contours': contours()}
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print('ok', OUT, len(out['hubble']['bins']), 'bins;', len(out['spectrum']['points']), 'pts;', len(out['contours']['paths']), 'contornos')
