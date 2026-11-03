#!/usr/bin/env python3
"""
Café Apollo - painterly surface maps.

    python3 tools/cafe-assets/build_textures.py

These are authored once into public/cafe/tex/ rather than drawn into a canvas
at page load. Every map is built from described structure - patch repairs,
branching cracks, run-off staining, chipping that follows an edge, stone
slabs with real outlines - because uniform high-frequency noise is what made
the first pass read as "a primitive with a texture on it".
"""
import math
import os
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

# The café's name, used on the printed menu cover and on the painted wall
# sign. Defined once: both lockups auto-fit their type to the space, so a
# longer or shorter name needs no other change.
CAFE_NAME = "APOLLO"
CAFE_PREFIX = "CAFÉ"
CAFE_PLACE = "· JAFFA ·"

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "public", "cafe", "tex")
FONTS = os.path.join(ROOT, "public", "fonts")


# ------------------------------------------------------------------- helpers

def fbm(size, octaves=5, base=4, seed=0, persistence=0.55):
    """Value-noise fractal brownian motion via progressively upsampled grids."""
    rng = np.random.default_rng(seed)
    out = np.zeros((size, size), np.float32)
    amp, total = 1.0, 0.0
    for o in range(octaves):
        n = max(2, int(base * (2 ** o)))
        grid = rng.random((n + 1, n + 1)).astype(np.float32)
        img = Image.fromarray((grid * 255).astype(np.uint8), 'L') \
            .resize((size, size), Image.BICUBIC)
        out += amp * (np.asarray(img, np.float32) / 255.0)
        total += amp
        amp *= persistence
    out /= total
    return (out - out.min()) / max(1e-6, float(np.ptp(out)))


def to_normal(height, strength=2.0):
    """Sobel-style normal map from a height field."""
    h = np.asarray(height, np.float32)
    dx = np.gradient(h, axis=1) * strength * h.shape[1] / 512.0
    dy = np.gradient(h, axis=0) * strength * h.shape[0] / 512.0
    nz = np.ones_like(h)
    length = np.sqrt(dx * dx + dy * dy + nz * nz)
    rgb = np.stack([(-dx / length * 0.5 + 0.5),
                    (dy / length * 0.5 + 0.5),
                    (nz / length * 0.5 + 0.5)], -1)
    return Image.fromarray((rgb * 255).astype(np.uint8), 'RGB')


def grey(array):
    a = np.clip(array, 0, 1)
    return Image.fromarray((a * 255).astype(np.uint8), 'L').convert('RGB')


def save(image, name, size=None, quality=86):
    """Opaque maps ship as JPEG and the data maps at half resolution; only
    the ghost sign needs an alpha channel, so only it stays a PNG."""
    os.makedirs(OUT, exist_ok=True)
    if size and image.size[0] != size:
        image = image.resize((size, size), Image.LANCZOS)
    path = os.path.join(OUT, name)
    if name.endswith('.jpg'):
        image.convert('RGB').save(path, quality=quality, optimize=True,
                                  subsampling=1)
    else:
        image.save(path, optimize=True)
    print(f"  {name:<24} {os.path.getsize(path)/1024:7.1f} KB  {image.size[0]}px")


def font(size, italic=False, bold=False):
    for candidate in ("fraunces-latin-normal.woff2",):
        pass  # woff2 is not loadable by PIL; fall back to a bundled TTF search
    for path in ("/usr/share/fonts/truetype/dejavu/DejaVuSerif%s.ttf",
                 "/usr/share/fonts/truetype/liberation/LiberationSerif-%s.ttf"):
        for suffix in (("-Bold" if bold else "-Italic" if italic else ""),
                       ("Bold" if bold else "Italic" if italic else "Regular")):
            try:
                return ImageFont.truetype(path % suffix, size)
            except (OSError, TypeError):
                continue
    try:
        return ImageFont.truetype(
            "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf", size)
    except OSError:
        return ImageFont.load_default(size)


def fit_font(draw, text, start, spacing, max_width, bold=False, italic=False,
             minimum=36):
    """Largest size at which `text` still fits `max_width` with this letter
    spacing. Keeps a display lockup inside its rule no matter the name."""
    size = start
    while size > minimum:
        candidate = font(size, bold=bold, italic=italic)
        width = sum(draw.textlength(ch, font=candidate) for ch in text) \
            + spacing * max(0, len(text) - 1)
        if width <= max_width:
            return candidate
        size -= 4
    return font(minimum, bold=bold, italic=italic)


def crack_network(draw, w, h, rng, count, length, colour, width=1.6, branch=0.5):
    """Cracks branch and taper; they do not scatter as independent strokes."""
    def walk(x, y, angle, remaining, depth, thickness):
        while remaining > 0:
            step = rng.uniform(4, 11)
            angle += rng.uniform(-0.45, 0.45)
            nx, ny = x + math.cos(angle) * step, y + math.sin(angle) * step
            draw.line((x, y, nx, ny), fill=colour, width=max(1, int(thickness)))
            x, y, remaining = nx, ny, remaining - step
            if depth < 2 and rng.random() < branch * 0.08:
                walk(x, y, angle + rng.choice((-1, 1)) * rng.uniform(0.5, 1.1),
                     remaining * 0.55, depth + 1, thickness * 0.6)
    for _ in range(count):
        walk(rng.uniform(0, w), rng.uniform(0, h), rng.uniform(0, math.tau),
             rng.uniform(length * 0.5, length), 0, width)


# -------------------------------------------------------------------- plaster

def plaster(size=1024, seed=7):
    """Whitewashed Mediterranean render: sun-bleached at the top, grubby and
    water-stained at the bottom, with patch repairs in a slightly different
    tone and cracks that radiate from the patches."""
    rng = random.Random(seed)
    base = fbm(size, 6, 3, seed) * 0.5 + fbm(size, 4, 11, seed + 1) * 0.5
    img = Image.new('RGB', (size, size), (238, 230, 214))
    draw = ImageDraw.Draw(img, 'RGBA')

    # broad pigment washes
    for _ in range(34):
        x, y = rng.uniform(0, size), rng.uniform(0, size)
        rx, ry = rng.uniform(size * .10, size * .45), rng.uniform(size * .04, size * .20)
        tone = rng.choice(((255, 253, 243, 46), (206, 192, 166, 56),
                           (233, 222, 198, 34), (200, 194, 178, 28)))
        draw.ellipse((x - rx, y - ry, x + rx, y + ry), fill=tone)

    # patch repairs: hard-edged rectangles of newer, flatter render
    patches = []
    for _ in range(7):
        pw, ph = rng.uniform(size * .10, size * .30), rng.uniform(size * .08, size * .26)
        x, y = rng.uniform(0, size - pw), rng.uniform(0, size - ph)
        patches.append((x, y, pw, ph))
        tone = rng.choice(((250, 246, 234, 132), (221, 210, 188, 124),
                           (236, 227, 206, 128), (214, 205, 186, 118)))
        pts = []
        steps = 26
        for i in range(steps):
            t = i / steps * math.tau
            px = x + pw / 2 + math.cos(t) * pw / 2 * rng.uniform(.88, 1.0)
            py = y + ph / 2 + math.sin(t) * ph / 2 * rng.uniform(.86, 1.0)
            pts.append((px, py))
        draw.polygon(pts, fill=tone)

    img = img.filter(ImageFilter.GaussianBlur(1.1))
    draw = ImageDraw.Draw(img, 'RGBA')

    # cracks, concentrated around patch edges where render shrinks away
    crack_network(draw, size, size, rng, 22, size * 0.30, (146, 130, 110, 86), 1.5)
    for (x, y, pw, ph) in patches:
        for _ in range(3):
            sx = x + rng.uniform(0, pw)
            sy = y + rng.choice((0, ph))
            crack_network(ImageDraw.Draw(img, 'RGBA'), 1, 1, rng, 0, 1, (0, 0, 0, 0))
            ang = -math.pi / 2 if sy == y else math.pi / 2
            cx, cy = sx, sy
            for _ in range(int(size * 0.07)):
                ang += rng.uniform(-0.4, 0.4)
                nx, ny = cx + math.cos(ang) * 5, cy + math.sin(ang) * 5
                draw.line((cx, cy, nx, ny), fill=(139, 124, 105, 110), width=2)
                cx, cy = nx, ny

    # exposed masonry where the render has fallen off at the base. Kept small
    # and few: at the tiling rate this map runs at, large patches read as
    # leopard spots rather than as damage.
    for _ in range(3):
        x = rng.uniform(0, size)
        y = rng.uniform(size * 0.84, size * 0.97)
        rx, ry = rng.uniform(14, 34), rng.uniform(7, 16)
        draw.ellipse((x - rx, y - ry, x + rx, y + ry), fill=(190, 174, 150, 92))
        draw.ellipse((x - rx * .7, y - ry * .7, x + rx * .7, y + ry * .7),
                     fill=(174, 158, 134, 70))

    arr = np.asarray(img, np.float32) / 255.0
    yy = np.linspace(0, 1, size)[:, None]
    # sun bleach towards the top, grime and splash-back at the bottom
    arr *= (1.05 - 0.17 * yy ** 2.1)[..., None]
    arr[..., 0] *= 1.0 + 0.030 * (1 - yy)
    arr[..., 2] *= 1.0 - 0.025 * (1 - yy)
    # vertical run-off streaks below features
    rng2 = np.random.default_rng(seed + 5)
    streaks = np.zeros((size, size), np.float32)
    for _ in range(40):
        x = int(rng2.integers(0, size))
        top = int(rng2.integers(0, int(size * 0.6)))
        wdt = int(rng2.integers(2, 11))
        fall = int(rng2.integers(int(size * 0.1), int(size * 0.45)))
        streaks[top:top + fall, max(0, x):x + wdt] += np.linspace(
            0.0, 0.35, fall)[:, None]
    streaks = np.asarray(Image.fromarray((np.clip(streaks, 0, 1) * 255)
                                         .astype(np.uint8), 'L')
                         .filter(ImageFilter.GaussianBlur(3)), np.float32) / 255.0
    arr *= (1.0 - 0.24 * streaks)[..., None]
    arr *= (0.90 + 0.18 * base)[..., None]
    albedo = Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8), 'RGB')
    save(albedo, "plaster.jpg")

    height = base * 0.65 + (1 - np.asarray(albedo.convert('L'), np.float32) / 255) * 0.35
    save(to_normal(height, 1.4), "plaster-normal.jpg", 512)
    rough = 0.80 + 0.18 * base - 0.10 * streaks
    save(grey(rough), "plaster-rough.jpg", 512, 80)


# ------------------------------------------------------------- enamel tabletop

def enamel(size=1024, seed=19):
    """Worn red enamel on steel. Chips cluster along the edges and at the
    corners where the table is knocked, plus one high-wear arc in the middle
    where years of elbows and wiping have polished the paint thin."""
    rng = random.Random(seed)
    # Sampled off the painted backdrop: its table sits at roughly RGB
    # (146, 57, 56) in the final image, lightness 0.40 and saturation 0.45.
    # The map therefore starts lighter and much less saturated than a "red
    # table" instinctively wants to be - the lighting and the tone mapping
    # both pull it down and in from here.
    img = Image.new('RGB', (size, size), (154, 78, 68))
    draw = ImageDraw.Draw(img, 'RGBA')

    # uneven hand-painted coverage
    for _ in range(90):
        x, y = rng.uniform(0, size), rng.uniform(0, size)
        rx, ry = rng.uniform(40, 260), rng.uniform(14, 90)
        tone = rng.choice(((186, 110, 92, 40), (104, 46, 46, 62),
                           (204, 128, 104, 34), (86, 36, 38, 58)))
        draw.ellipse((x - rx, y - ry, x + rx, y + ry), fill=tone)
    img = img.filter(ImageFilter.GaussianBlur(5))
    draw = ImageDraw.Draw(img, 'RGBA')

    # brush drag marks left by the last repaint
    for _ in range(160):
        y = rng.uniform(0, size)
        x = rng.uniform(0, size)
        length = rng.uniform(60, 330)
        draw.line((x, y, x + length, y + rng.uniform(-5, 5)),
                  fill=(rng.randint(186, 232), rng.randint(104, 140),
                        rng.randint(92, 122), rng.randint(14, 34)),
                  width=rng.randint(1, 3))

    def edge_weight(x, y):
        """1 at the border, falling off quickly inwards."""
        d = min(x, y, size - x, size - y) / (size * 0.5)
        return max(0.0, 1.0 - d) ** 2.2

    # chips: a pale grey primer island with a dark lifted-paint outline, which
    # is what a real chip looks like. Density follows the edge weight.
    for _ in range(820):
        x, y = rng.uniform(0, size), rng.uniform(0, size)
        wear = edge_weight(x, y)
        arc = math.exp(-((math.hypot(x - size * 0.42, y - size * 0.52)
                          - size * 0.26) ** 2) / (2 * (size * 0.085) ** 2))
        if rng.random() > wear * 1.05 + arc * 0.30 + 0.022:
            continue
        r = rng.uniform(3.0, 10.5) * (0.5 + wear)
        pts = []
        for i in range(7):
            a = i / 7 * math.tau
            rr = r * rng.uniform(0.55, 1.35)
            pts.append((x + math.cos(a) * rr, y + math.sin(a) * rr * 0.75))
        draw.polygon(pts, fill=(112, 56, 50, 120))
        inner = [(x + (px - x) * 0.62, y + (py - y) * 0.62) for px, py in pts]
        # exposed primer is a dull warm grey, and it varies: a uniform light
        # grey is what makes chips read as gravel scattered on the surface.
        # Exposed primer, not bare metal: a cool pale grey that the red still
        # shows through. Opaque near-white chips read as confetti dropped on
        # the table rather than as enamel lifted off it.
        tone = rng.randint(128, 168)
        draw.polygon(inner, fill=(tone + rng.randint(0, 10), tone + rng.randint(0, 8),
                                  tone + rng.randint(2, 16), rng.randint(108, 164)))

    # scratches follow the wiping direction
    for _ in range(560):
        x, y = rng.uniform(0, size), rng.uniform(0, size)
        a = rng.gauss(0.32, 0.30)
        length = rng.uniform(20, 155)
        draw.line((x, y, x + math.cos(a) * length, y + math.sin(a) * length),
                  fill=(226, 198, 176, rng.randint(12, 38)), width=1)

    # cup rings and a splash of old coffee
    # Cup rings are sized in texture space, and the map covers the whole top,
    # so these radii are tuned to land at roughly a saucer's width on a
    # 1.15 m table rather than reading as big pale discs.
    for _ in range(4):
        x, y = rng.uniform(size * .16, size * .84), rng.uniform(size * .16, size * .84)
        r = rng.uniform(30, 46)
        draw.ellipse((x - r, y - r, x + r, y + r), outline=(96, 56, 36, 34),
                     width=rng.randint(2, 4))

    # rust creeping in from the edges where the enamel has gone
    rust = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    rd = ImageDraw.Draw(rust)
    for _ in range(360):
        x, y = rng.uniform(0, size), rng.uniform(0, size)
        if rng.random() > edge_weight(x, y) * 1.25:
            continue
        r = rng.uniform(4, 19)
        rd.ellipse((x - r, y - r, x + r, y + r),
                   fill=(rng.randint(158, 196), rng.randint(100, 128),
                         rng.randint(66, 88), rng.randint(36, 96)))
    img = Image.alpha_composite(img.convert('RGBA'),
                                rust.filter(ImageFilter.GaussianBlur(2.5))) \
        .convert('RGB')

    save(img, "enamel.jpg")
    lum = np.asarray(img.convert('L'), np.float32) / 255.0
    height = 1.0 - lum
    save(to_normal(fbm(size, 4, 6, seed) * 0.25 + height * 0.75, 1.1),
         "enamel-normal.jpg", 512)
    # bare primer and rust are rough; intact enamel still has a sheen
    rough = np.clip(0.34 + 0.52 * lum, 0, 1)
    save(grey(rough), "enamel-rough.jpg", 512, 80)


# ------------------------------------------------------------------- pavement

def pavement(size=1024, seed=31):
    """Irregular stone paving laid by hand: slabs of varying size with real
    outlines, chipped corners and dark mortar, not a brick grid."""
    rng = random.Random(seed)
    img = Image.new('RGB', (size, size), (118, 114, 108))
    draw = ImageDraw.Draw(img, 'RGBA')

    # Scatter seeds and draw each slab as a jittered polygon around its cell.
    cells = []
    rows = 9
    y = -20
    r = 0
    while y < size + 20:
        height = size / rows * rng.uniform(0.80, 1.25)
        x = -rng.uniform(0, size / 6)
        while x < size + 20:
            wdt = size / rows * rng.uniform(1.1, 2.4)
            cells.append((x, y, wdt, height))
            x += wdt
        y += height
        r += 1

    for (x, y, w, h) in cells:
        inset = rng.uniform(2.0, 4.5)
        pts = []
        for px, py in ((x, y), (x + w, y), (x + w, y + h), (x, y + h)):
            pts.append((px + rng.uniform(-3, 3) + (inset if px == x else -inset),
                        py + rng.uniform(-3, 3) + (inset if py == y else -inset)))
        v = rng.randint(-18, 20)
        warm = rng.randint(-6, 9)
        draw.polygon(pts, fill=(154 + v + warm, 146 + v, 130 + v - warm // 2, 255))
        # chipped corner on roughly a third of the slabs
        if rng.random() < 0.34:
            cx, cy = rng.choice(pts)
            cr = rng.uniform(4, 13)
            draw.ellipse((cx - cr, cy - cr, cx + cr, cy + cr),
                         fill=(104, 100, 94, 190))
        # top-edge catch-light
        draw.line((pts[0], pts[1]), fill=(206, 199, 180, 46), width=2)

    img = img.filter(ImageFilter.GaussianBlur(0.6))
    draw = ImageDraw.Draw(img, 'RGBA')
    for _ in range(2600):     # grit and small dark pits
        x, y = rng.uniform(0, size), rng.uniform(0, size)
        s = rng.uniform(0.8, 3.0)
        draw.ellipse((x, y, x + s, y + s * 0.8),
                     fill=(rng.randint(70, 110),) * 3 + (rng.randint(20, 70),))
    # a long repaired trench, tar-black, the way streets actually get patched
    ty = rng.uniform(size * .25, size * .7)
    pts = [(i, ty + math.sin(i / 90) * 16 + rng.uniform(-4, 4))
           for i in range(0, size + 20, 20)]
    for i in range(len(pts) - 1):
        draw.line((pts[i], pts[i + 1]), fill=(72, 69, 70, 200),
                  width=int(rng.uniform(16, 26)))

    base = fbm(size, 5, 4, seed)
    arr = np.asarray(img, np.float32) / 255.0 * (0.90 + 0.18 * base)[..., None]
    img = Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8), 'RGB')
    save(img, "pavement.jpg")
    lum = np.asarray(img.convert('L'), np.float32) / 255.0
    save(to_normal(lum * 0.6 + base * 0.4, 1.9), "pavement-normal.jpg", 512)


# ----------------------------------------------------------------- menu cover

def menu_cover(w=820, h=1160):
    """The café's own printed cover. Restrained: a typographic lockup, a small
    engraved cup motif and a hand-drawn rule. No UI affordances, no arrows,
    and nothing that says the word 'menu'."""
    rng = random.Random(3)
    img = Image.new('RGB', (w, h), (222, 203, 162))
    draw = ImageDraw.Draw(img, 'RGBA')

    # uneven board stock with fibre flecks
    for _ in range(60):
        x, y = rng.uniform(0, w), rng.uniform(0, h)
        rx, ry = rng.uniform(60, 300), rng.uniform(30, 160)
        draw.ellipse((x - rx, y - ry, x + rx, y + ry),
                     fill=rng.choice(((206, 186, 144, 48), (166, 142, 102, 46),
                                      (196, 174, 132, 42))))
    img = img.filter(ImageFilter.GaussianBlur(7))
    draw = ImageDraw.Draw(img, 'RGBA')
    for _ in range(5200):
        x, y = rng.uniform(0, w), rng.uniform(0, h)
        draw.point((x, y), fill=(rng.randint(120, 190), rng.randint(104, 170),
                                 rng.randint(80, 134), rng.randint(14, 48)))

    ink = (62, 42, 28)
    accent = (124, 52, 38)

    # letterpress frame, double-ruled, slightly off-register
    draw.rectangle((54, 62, w - 54, h - 62), outline=accent + (215,), width=6)
    draw.rectangle((72, 80, w - 72, h - 80), outline=ink + (150,), width=2)

    f_small = font(34, italic=True)
    f_sub = font(30)
    f_foot = font(29, italic=True)

    def centred(text, y, fnt, fill, spacing=0):
        if spacing:
            widths = [draw.textlength(ch, font=fnt) for ch in text]
            total = sum(widths) + spacing * (len(text) - 1)
            x = (w - total) / 2
            for ch, cw in zip(text, widths):
                draw.text((x, y), ch, font=fnt, fill=fill)
                x += cw + spacing
        else:
            tw = draw.textlength(text, font=fnt)
            draw.text(((w - tw) / 2, y), text, font=fnt, fill=fill)

    f_name = fit_font(draw, CAFE_NAME, 128, 9, w - 200, bold=True)
    f_prefix = font(44, italic=True)
    centred(CAFE_PREFIX, 132, f_prefix, ink + (245,), spacing=11)
    centred(CAFE_NAME, 196, f_name, ink + (255,), spacing=9)
    centred(CAFE_PLACE, 368, f_sub, accent + (245,), spacing=6)

    # hand-drawn rule
    for i in range(3):
        pts = [(170 + j * 10, 452 + i * 7 + math.sin(j / 3.0 + i) * 2.0)
               for j in range(49)]
        draw.line(pts, fill=ink + (90 - i * 24,), width=2)

    # The cover illustration: the café's own frontage, drawn as an engraving.
    # The reference shows a building on the menu, not just a cup, and a façade
    # is what makes the object read as this café's menu rather than any menu.
    bx, by, bw, bh = w / 2 - 120, 596, 240, 210
    draw.rectangle((bx, by, bx + bw, by + bh), fill=(238, 228, 206, 220),
                   outline=ink + (235,), width=4)
    draw.polygon([(bx - 18, by), (bx + bw + 18, by), (bx + bw, by - 26),
                  (bx + 18, by - 26)], outline=ink + (200,), width=4)
    # the awning is the cover's one note of colour, as it is on the building
    draw.rectangle((bx + 6, by + 6, bx + bw - 6, by + 38),
                   fill=(176, 72, 52, 225))
    for i in range(5):
        ax = bx + 6 + i * (bw - 12) / 5
        draw.pieslice((ax, by + 20, ax + (bw - 12) / 5, by + 54), 0, 180,
                      fill=(196, 92, 66, 225))
    for col in range(3):                      # shuttered windows
        wx = bx + 24 + col * 72
        draw.rectangle((wx, by + 64, wx + 44, by + 112), fill=(132, 150, 142, 210),
                       outline=ink + (215,), width=3)
        draw.line((wx + 22, by + 64, wx + 22, by + 112), fill=ink + (170,), width=2)
    draw.rectangle((bx + bw / 2 - 26, by + 140, bx + bw / 2 + 26, by + bh),
                   fill=(126, 88, 58, 215), outline=ink + (225,), width=3)
    for i in range(7):                        # hatching on the shaded flank
        draw.line((bx + bw - 6, by + 70 + i * 18, bx + bw - 44, by + 86 + i * 18),
                  fill=ink + (52,), width=2)
    # a planter either side of the door
    for sx in (bx + 28, bx + bw - 28):
        draw.pieslice((sx - 15, by + bh - 36, sx + 15, by + bh - 4), 0, 180,
                      fill=(158, 92, 58, 215))
        for k in range(5):                    # a little planting either side
            lx = sx - 12 + k * 6
            draw.ellipse((lx - 7, by + bh - 62 - (k % 2) * 8,
                          lx + 7, by + bh - 40 - (k % 2) * 8),
                         fill=(92, 124, 76, 205))

    # a small engraved espresso cup beside it
    cx, cy, s = w / 2, 872, 86
    draw.ellipse((cx - s * .95, cy + s * .34, cx + s * .95, cy + s * .62),
                 outline=ink + (190,), width=4)
    draw.ellipse((cx - s * .62, cy + s * .40, cx + s * .62, cy + s * .56),
                 outline=ink + (110,), width=2)
    draw.arc((cx - s * .54, cy - s * .44, cx + s * .54, cy + s * .46),
             start=0, end=180, fill=ink + (205,), width=5)
    draw.line((cx - s * .54, cy - s * .32, cx - s * .54, cy + s * .02),
              fill=ink + (205,), width=5)
    draw.line((cx + s * .54, cy - s * .32, cx + s * .54, cy + s * .02),
              fill=ink + (205,), width=5)
    draw.ellipse((cx - s * .56, cy - s * .40, cx + s * .56, cy - s * .24),
                 outline=ink + (205,), width=5)
    draw.arc((cx + s * .40, cy - s * .26, cx + s * .92, cy + s * .14),
             start=270, end=110, fill=ink + (195,), width=5)
    # engraving hatch inside the cup
    for i in range(9):
        yy = cy - s * .26 + i * 5
        half = s * .52 * math.sqrt(max(0.0, 1 - ((i - 1) / 11.0) ** 2))
        draw.line((cx - half, yy, cx + half, yy), fill=ink + (44,), width=2)
    # steam
    for k, off in enumerate((-s * .26, 0, s * .26)):
        pts = [(cx + off + math.sin(t / 2.4 + k) * 11, cy - s * .50 - t * 5)
               for t in range(14)]
        draw.line(pts, fill=ink + (120,), width=3)

    centred("coffee · conversation · curiosities", h - 112, f_foot, ink + (180,))
    centred("EST. ALWAYS", h - 66, font(24), accent + (165,), spacing=5)

    # honest wear: a ring stain, a thumbed corner, a crease
    draw.ellipse((w - 330, 560, w - 90, 800), outline=(118, 78, 48, 52), width=7)
    draw.polygon([(w - 54, h - 62), (w - 190, h - 62), (w - 54, h - 196)],
                 fill=(176, 154, 118, 120))
    draw.line((96, 150, 128, h - 150), fill=(150, 128, 96, 60), width=5)

    img = img.filter(ImageFilter.GaussianBlur(0.4))
    arr = np.asarray(img, np.float32) / 255.0
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    vign = 1.0 - 0.17 * (((xx / w - .5) ** 2 + (yy / h - .5) ** 2) * 3.4)
    arr *= np.clip(vign, 0, 1)[..., None]
    save(Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8), 'RGB'),
         "menu-cover.jpg", None, 90)


# ---------------------------------------------------------------------- road

def asphalt(size=512, seed=44):
    rng = random.Random(seed)
    base = fbm(size, 5, 7, seed)
    img = Image.new('RGB', (size, size), (96, 93, 92))
    draw = ImageDraw.Draw(img, 'RGBA')
    for _ in range(9000):
        x, y = rng.uniform(0, size), rng.uniform(0, size)
        s = rng.uniform(0.7, 2.6)
        v = rng.randint(64, 142)
        draw.ellipse((x, y, x + s, y + s), fill=(v, v - 2, v - 5, rng.randint(40, 150)))
    for _ in range(26):            # tar-sealed cracks
        x, y = rng.uniform(0, size), rng.uniform(0, size)
        a = rng.uniform(0, math.tau)
        for _ in range(26):
            a += rng.uniform(-.5, .5)
            nx, ny = x + math.cos(a) * 7, y + math.sin(a) * 7
            draw.line((x, y, nx, ny), fill=(58, 56, 57, 190), width=rng.randint(3, 7))
            x, y = nx, ny
    arr = np.asarray(img, np.float32) / 255.0 * (0.86 + 0.26 * base)[..., None]
    save(Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8), 'RGB'),
         "asphalt.jpg")


def wall_sign(w=1024, h=512):
    """A ghost sign - old painted lettering half weathered off the plaster.
    Drawn with transparency so it sits on the façade without a panel edge."""
    rng = random.Random(61)
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    ink = (118, 74, 54)
    blue = (58, 86, 112)

    f_mid = font(58, italic=True)
    f_small = font(42)

    def centred(text, y, fnt, fill, spacing=0):
        widths = [draw.textlength(ch, font=fnt) for ch in text]
        total = sum(widths) + spacing * (len(text) - 1)
        x = (w - total) / 2
        for ch, cw in zip(text, widths):
            draw.text((x, y), ch, font=fnt, fill=fill)
            x += cw + spacing

    f_big = fit_font(draw, CAFE_NAME, 184, 16, w - 150, bold=True)
    centred(CAFE_PREFIX, 34, f_mid, ink + (195,), spacing=14)
    centred(CAFE_NAME, 112, f_big, ink + (225,), spacing=16)
    centred("COFFEE  ·  SINCE  ALWAYS", 346, f_small, blue + (180,), spacing=7)
    draw.line((w * 0.22, 326, w * 0.78, 326), fill=ink + (140,), width=4)

    # Weather it off: erase with soft blobs, heavier towards the lower left
    # where rain runs down the wall.
    alpha = np.asarray(img.split()[3], np.float32) / 255.0
    wear = fbm(max(w, h), 5, 5, 61)[:h, :w]
    yy = np.linspace(0, 1, h)[:, None]
    xx = np.linspace(0, 1, w)[None, :]
    bias = 0.62 + 0.34 * wear + 0.16 * xx - 0.14 * yy
    alpha *= np.clip(bias, 0.0, 1.0)
    for _ in range(46):
        cx, cy = rng.uniform(0, w), rng.uniform(0, h)
        r = rng.uniform(16, 86)
        y0, y1 = int(max(0, cy - r)), int(min(h, cy + r))
        x0, x1 = int(max(0, cx - r)), int(min(w, cx + r))
        alpha[y0:y1, x0:x1] *= rng.uniform(0.52, 0.92)
    out = np.dstack([np.asarray(img, np.float32)[..., :3] / 255.0,
                     np.clip(alpha, 0, 1)])
    sign = Image.fromarray((out * 255).astype(np.uint8), 'RGBA') \
        .filter(ImageFilter.GaussianBlur(1.1))
    save(sign, "wall-sign.png")


def sky(w=2048, h=1024):
    """An equirectangular morning sky. Cumulus are built as overlapping lobes
    with a lit upper edge and a cool shaded underside, because a cloud drawn
    as one soft blob reads as fog."""
    rng = random.Random(808)
    arr = np.zeros((h, w, 3), np.float32)
    t = np.linspace(0, 1, h)[:, None]                 # 0 = zenith, 1 = nadir
    zenith = np.array([0.231, 0.482, 0.741])
    mid = np.array([0.549, 0.749, 0.886])
    horizon = np.array([0.937, 0.882, 0.776])
    band = np.clip((t - 0.26) / 0.24, 0, 1)
    arr += zenith * (1 - band)[..., None] + mid * band[..., None]
    low = np.clip((t - 0.42) / 0.10, 0, 1)
    arr = arr * (1 - low)[..., None] + horizon * low[..., None]
    arr[int(h * 0.52):] = np.array([0.859, 0.820, 0.737])   # below the horizon

    sky_img = Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8), 'RGB')
    clouds = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(clouds)

    def cumulus(cx, cy, scale, alpha):
        lobes = []
        for _ in range(rng.randint(5, 9)):
            lx = cx + rng.gauss(0, 58 * scale)
            ly = cy + rng.gauss(0, 15 * scale)
            lr = rng.uniform(26, 58) * scale
            lobes.append((lx, ly, lr))
        # shaded underside first, then the body, then the sunlit cap
        for lx, ly, lr in lobes:
            draw.ellipse((lx - lr, ly - lr * 0.62 + lr * 0.34,
                          lx + lr, ly + lr * 0.62 + lr * 0.34),
                         fill=(188, 196, 214, int(alpha * 0.82)))
        for lx, ly, lr in lobes:
            draw.ellipse((lx - lr, ly - lr * 0.66, lx + lr, ly + lr * 0.66),
                         fill=(250, 250, 252, int(alpha)))
        for lx, ly, lr in lobes:
            draw.ellipse((lx - lr * 0.78, ly - lr * 0.72,
                          lx + lr * 0.78, ly - lr * 0.14),
                         fill=(255, 253, 246, int(alpha * 0.95)))

    for _ in range(26):
        cy = rng.uniform(h * 0.10, h * 0.44)
        depth = (cy - h * 0.10) / (h * 0.34)          # nearer the horizon = smaller
        cumulus(rng.uniform(0, w), cy, 1.25 - 0.75 * depth,
                rng.uniform(150, 240) * (1.0 - 0.35 * depth))
    for _ in range(14):                                # thin high wisps
        cy = rng.uniform(h * 0.04, h * 0.22)
        cx = rng.uniform(0, w)
        for k in range(rng.randint(3, 6)):
            rx, ry = rng.uniform(90, 230), rng.uniform(5, 13)
            draw.ellipse((cx + k * 40 - rx, cy - ry, cx + k * 40 + rx, cy + ry),
                         fill=(255, 255, 255, rng.randint(26, 58)))

    clouds = clouds.filter(ImageFilter.GaussianBlur(5))
    sky_img = Image.alpha_composite(sky_img.convert('RGBA'), clouds).convert('RGB')
    # warm the air near the horizon where the sun is
    a2 = np.asarray(sky_img, np.float32) / 255.0
    glow = np.exp(-((np.linspace(0, 1, h)[:, None] - 0.49) ** 2) / 0.012)
    xx = np.linspace(0, 1, w)[None, :]
    glow = glow * (0.45 + 0.55 * np.exp(-((xx - 0.30) ** 2) / 0.06))
    a2 += np.stack([glow * 0.20, glow * 0.14, glow * 0.05], -1)
    save(Image.fromarray((np.clip(a2, 0, 1) * 255).astype(np.uint8), 'RGB'),
         "sky.jpg", quality=88)


def number_plate(w=256, h=330):
    """The enamelled street-number plaque on the corner façade."""
    img = Image.new('RGB', (w, h), (246, 245, 240))
    draw = ImageDraw.Draw(img, 'RGBA')
    draw.rounded_rectangle((8, 8, w - 8, h - 8), 14, fill=(249, 248, 243),
                           outline=(206, 204, 196, 220), width=3)
    draw.rounded_rectangle((20, 20, w - 20, int(h * 0.62)), 8,
                           fill=(44, 78, 138, 255))
    f_num = font(118, bold=True)
    f_sub = font(30)
    num = "3"
    tw = draw.textlength(num, font=f_num)
    draw.text(((w - tw) / 2, 36), num, font=f_num, fill=(255, 255, 255, 240))
    sub = "6650"
    tw = draw.textlength(sub, font=f_sub)
    draw.text(((w - tw) / 2, int(h * 0.70)), sub, font=f_sub,
              fill=(96, 98, 102, 230))
    rng = random.Random(9)
    for _ in range(260):                              # enamel chips and grime
        x, y = rng.uniform(0, w), rng.uniform(0, h)
        r = rng.uniform(0.6, 2.4)
        draw.ellipse((x, y, x + r, y + r),
                     fill=(rng.randint(120, 190),) * 3 + (rng.randint(18, 70),))
    save(img.filter(ImageFilter.GaussianBlur(0.4)), "number-plate.jpg",
         quality=88)


def main():
    print("Café Apollo surface maps ->", OUT)
    plaster()
    enamel()
    pavement()
    menu_cover()
    asphalt()
    wall_sign()
    sky()
    number_plate()


if __name__ == "__main__":
    main()
