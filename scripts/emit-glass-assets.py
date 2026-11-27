"""Pré-processa as imagens do tema de vidro, para o navegador não aplicar filtros nem misturas a cada quadro.

Entradas: public/images/jades-goods-south.jpg (campo GOODS-Sul, JWST/JADES) e o pôster móvel do
observatório embutido em src/app/observatory-poster.css.
Saídas:
  public/images/sky-light-{1600,900}.webp  galáxias em azul sobre transparente (tema claro)
  public/images/sky-dark-{1600,900}.webp   o campo escurecido e composto sobre a noite (tema escuro)
  src/app/observatory-poster-light.css     o pôster móvel em azul sobre claro (tema claro), embutido

Uso: python -I scripts/emit-glass-assets.py
"""
import base64
import io
import re
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'public' / 'images' / 'jades-goods-south.jpg'
POSTER_CSS = ROOT / 'src' / 'app' / 'observatory-poster.css'
NIGHT_TOP = np.array([12, 20, 44], dtype=np.float32)     # azul-noite, não preto
NIGHT_BOTTOM = np.array([6, 10, 24], dtype=np.float32)
CELESTE = np.array([74, 160, 240], dtype=np.float32)      # azul celeste, sem puxar para o verde
BLUE = CELESTE


def sky(width):
    im = Image.open(SRC).convert('RGB')
    h = round(im.height * width / im.width)
    im = im.resize((width, h), Image.LANCZOS)
    rgb = np.asarray(im, dtype=np.float32)
    lum = rgb @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    # claro: só as galáxias, em azul, com transparência proporcional ao brilho
    a = np.clip((lum - 28.0) / 150.0, 0, 1) ** 0.8 * 0.30
    light = np.dstack([np.broadcast_to(BLUE, rgb.shape), a[..., None] * 255]).astype(np.uint8)
    Image.fromarray(light, 'RGBA').save(ROOT / 'public' / 'images' / f'sky-light-{width}.webp', quality=72, method=6)
    # escuro: o campo profundo bem visível (60%) sobre um gradiente azul-noite; nada de preto puro
    sat = ImageEnhance.Color(im).enhance(0.9)
    s = np.asarray(sat, dtype=np.float32)
    ramp = np.linspace(0, 1, rgb.shape[0], dtype=np.float32)[:, None, None]
    night = NIGHT_TOP * (1 - ramp) + NIGHT_BOTTOM * ramp
    dark = night * (1 - 0.6) + s * 0.6
    Image.fromarray(np.clip(dark, 0, 255).astype(np.uint8), 'RGB').save(ROOT / 'public' / 'images' / f'sky-dark-{width}.webp', quality=70, method=6)


def poster_light():
    css = POSTER_CSS.read_text(encoding='utf-8')
    b64 = re.search(r"data:image/webp;base64,([^')]+)", css).group(1)
    im = Image.open(io.BytesIO(base64.b64decode(b64))).convert('RGB')
    rgb = np.asarray(im, dtype=np.float32)
    lum = rgb.max(axis=2)
    # pontos claros sobre fundo escuro -> pontos azuis sobre branco; os âmbar continuam âmbar
    warm = (rgb[..., 0] > rgb[..., 2] + 25)
    a = np.clip((lum - 20.0) / 160.0, 0, 1) * 0.8
    out = np.full(rgb.shape, 252.0, dtype=np.float32)
    amber = np.array([214, 150, 60], dtype=np.float32)
    col = np.where(warm[..., None], amber, BLUE)
    out = out * (1 - a[..., None]) + col * a[..., None]
    buf = io.BytesIO()
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), 'RGB').save(buf, 'WEBP', quality=42, method=6)
    data = base64.b64encode(buf.getvalue()).decode()
    (ROOT / 'src' / 'app' / 'observatory-poster-light.css').write_text(
        '/* Pôster móvel do observatório no tema claro: o mesmo render, já em azul sobre claro (scripts/emit-glass-assets.py). */\n'
        ":root[data-theme=\"light\"] .desi-mobile-poster { background-image: url('data:image/webp;base64," + data + "') !important; filter: none !important; mix-blend-mode: normal !important; }\n",
        encoding='utf-8')
    return len(buf.getvalue())


if __name__ == '__main__':
    for w in (1600, 900):
        sky(w)
    n = poster_light()
    for p in sorted((ROOT / 'public' / 'images').glob('sky-*.webp')):
        print(p.name, p.stat().st_size)
    print('poster claro', n, 'bytes')
