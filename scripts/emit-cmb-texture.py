"""Gera a textura do céu de micro-ondas para o observatório da CMB.

Entrada: mapa SMICA do Planck 2015 (PR2), COM_CMB_IQU-smica_1024_R2.02_full.fits, coluna de
temperatura I, em K_CMB, coordenadas galácticas. Fonte: ESA / Planck Collaboration, via IRSA.
Saída: public/observatory/cmb-smica-2048.png e cmb-smica-1024.png (cinza de 8 bits, projeção
equirretangular, longitude galáctica 180° → −180° da esquerda para a direita, latitude +90° no topo)
e data/curated/cmb.json com a escala de temperatura e os créditos.

O cinza codifica ΔT linearmente entre −LIM e +LIM µK; a cor é aplicada no navegador.
HEALPix ang2pix implementado aqui (RING e NESTED), sem healpy.

Uso: python -I scripts/emit-cmb-texture.py D:/ft/planck_cmb/COM_CMB_IQU-smica_1024_R2.02_full.fits
"""
import json
import sys
from pathlib import Path

import numpy as np
from astropy.io import fits
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
LIM = 300.0  # µK


def _spread(v):
    v = v.astype(np.int64) & 0xFFFF
    v = (v | (v << 8)) & 0x00FF00FF
    v = (v | (v << 4)) & 0x0F0F0F0F
    v = (v | (v << 2)) & 0x33333333
    v = (v | (v << 1)) & 0x55555555
    return v


def ang2pix(nside, theta, phi, nest):
    z = np.cos(theta)
    za = np.abs(z)
    tt = np.mod(phi, 2 * np.pi) * (2 / np.pi)
    eq = za <= 2 / 3
    pix = np.zeros(theta.shape, dtype=np.int64)
    # região equatorial
    t1 = nside * (0.5 + tt[eq]); t2 = nside * z[eq] * 0.75
    jp = (t1 - t2).astype(np.int64); jm = (t1 + t2).astype(np.int64)
    # calotas
    ntt = np.minimum(3, tt[~eq].astype(np.int64)); tp = tt[~eq] - ntt
    tmp = nside * np.sqrt(3 * (1 - za[~eq]))
    cjp = np.minimum((tp * tmp).astype(np.int64), nside - 1); cjm = np.minimum(((1 - tp) * tmp).astype(np.int64), nside - 1)
    if nest:
        ifp = jp // nside; ifm = jm // nside
        face = np.where(ifp == ifm, ifp | 4, np.where(ifp < ifm, ifp, ifm + 8))
        ix = jm & (nside - 1); iy = nside - (jp & (nside - 1)) - 1
        pix[eq] = face * nside * nside + _spread(ix) + 2 * _spread(iy)
        north = z[~eq] >= 0
        face = np.where(north, ntt, ntt + 8)
        ix = np.where(north, nside - cjm - 1, cjp); iy = np.where(north, nside - cjp - 1, cjm)
        pix[~eq] = face * nside * nside + _spread(ix) + 2 * _spread(iy)
    else:
        ncap = 2 * nside * (nside - 1); npix = 12 * nside * nside
        ir = nside + 1 + jp - jm
        kshift = 1 - (ir & 1)
        ip = np.mod((jp + jm - nside + kshift + 1) // 2, 4 * nside)
        pix[eq] = ncap + (ir - 1) * 4 * nside + ip
        tpp = tt[~eq] - tt[~eq].astype(np.int64)
        jp2 = (tpp * tmp).astype(np.int64); jm2 = ((1 - tpp) * tmp).astype(np.int64)
        ir2 = jp2 + jm2 + 1
        ip2 = np.mod((tt[~eq] * ir2).astype(np.int64), 4 * ir2)
        pix[~eq] = np.where(z[~eq] > 0, 2 * ir2 * (ir2 - 1) + ip2, npix - 2 * ir2 * (ir2 + 1) + ip2)
    return pix


def main(path):
    with fits.open(path, memmap=True) as h:
        hdr = h[1].header
        nside = int(hdr['NSIDE']); nest = hdr.get('ORDERING', 'RING').strip().upper().startswith('NEST')
        col = h[1].columns.names[0]
        t = np.asarray(h[1].data[col], dtype=np.float64).ravel() * 1e6  # µK
        unit = h[1].columns.units[0] if h[1].columns.units else ''
    assert t.size == 12 * nside * nside, 'tamanho inesperado do mapa'
    out = {}
    for w in (2048, 1024):
        hgt = w // 2
        lon = np.deg2rad(180 - (np.arange(w) + 0.5) * 360 / w)
        lat = np.deg2rad(90 - (np.arange(hgt) + 0.5) * 180 / hgt)
        LON, LAT = np.meshgrid(lon, lat)
        p = ang2pix(nside, np.pi / 2 - LAT, LON, nest)
        img = np.clip((t[p] + LIM) / (2 * LIM), 0, 1)
        Image.fromarray((img * 255 + 0.5).astype(np.uint8), 'L').save(ROOT / 'public' / 'observatory' / f'cmb-smica-{w}.png', optimize=True)
        out[w] = (ROOT / 'public' / 'observatory' / f'cmb-smica-{w}.png').stat().st_size
    info = {
        'map': 'SMICA', 'release': 'Planck 2015 (PR2)', 'nside': nside, 'ordering': 'NESTED' if nest else 'RING',
        'unit_source': unit, 'limit_uK': LIM, 'rms_uK': round(float(np.std(t)), 1),
        'coords': 'galácticas', 'projection': 'equirretangular, l = 180° a −180°',
        'credit': 'ESA and the Planck Collaboration', 'source_url': 'https://irsa.ipac.caltech.edu/data/Planck/release_2/all-sky-maps/',
        'reference': {'label': 'Planck Collaboration (2016), A&A 594, A9', 'url': 'https://arxiv.org/abs/1502.05956'},
        'textures': {str(k): v for k, v in out.items()},
    }
    (ROOT / 'data' / 'curated' / 'cmb.json').write_text(json.dumps(info, ensure_ascii=False, indent=1), encoding='utf-8')
    print('ok nside', nside, 'nest' if nest else 'ring', 'rms', info['rms_uK'], 'µK', out)


if __name__ == '__main__':
    main(sys.argv[1])
