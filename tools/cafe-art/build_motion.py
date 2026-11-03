#!/usr/bin/env python3
"""
Build the motion maps that bring the painted café to life.

    python3 tools/cafe-art/build_motion.py

The café is a single painted image. Everything that moves in it - the foliage
swaying, the leaf shadows travelling, the corner of the menu lifting, the
parallax as you look around - is done by a fragment shader warping and
shading that one image. This script produces what the shader needs:

  motion.png   four masks packed one per channel
                 R  foliage sway amplitude
                 G  surfaces that receive travelling leaf shadow
                 B  menu lift amplitude
                 A  depth, for parallax
  gobo.png     a tiling leaf-shadow texture
  noise.png    tiling value noise, for the sway and the steam

The masks are amplitude FIELDS, not silhouettes. That distinction is the
whole trick: a binary leaf mask slides the canopy about as a solid slab,
where a field that runs from zero at the branch to one at the leaf tips makes
it hinge. Same for the menu, which is zero at its spine and one at the free
corner.
"""
import math
import os
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "public", "cafe")
BACKDROP = os.path.join(OUT, "backdrop.jpg")

TABLE_LINE = 0.635      # where the painted tabletop begins, as a height fraction


def blur(a, radius):
    img = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8), 'L')
    return np.asarray(img.filter(ImageFilter.GaussianBlur(radius)), np.float32) / 255.0


def hang_amplitude(mask, reach=230.0):
    """Zero where a mass is attached, rising as it hangs away from that point.

    Approximated per column: the topmost masked pixel is treated as the
    attachment and the amplitude grows downward from there. Crude, but it is
    what stops the canopy translating as one rigid block.
    """
    h, w = mask.shape
    solid = mask > 0.18
    idx = np.arange(h)[:, None].repeat(w, axis=1).astype(np.float32)
    top = np.where(solid, idx, np.inf).min(axis=0)
    top = np.where(np.isinf(top), 0.0, top)
    depth = np.clip((idx - top[None, :]) / reach, 0.0, 1.0)
    return mask * (0.28 + 0.72 * depth)


# Where the planting is, as soft ellipses in frame fractions: centre x, centre
# y, radius x, radius y. These are placed by hand, and they have to be.
#
# Classifying foliage by colour was tried first and cannot work on this
# painting: it is lit so warm that leaves and pavement land on the same
# ratios - a sunlit street tree samples (233,181,142) against pavement at
# (189,137,98), identical in both green-over-red and green-over-blue. The
# regions below say where to look; colour is then only used to reject the
# sky and the brightest plaster inside each one.
# Things inside those regions that must NOT bend. A warp field does not know
# a leaf from a road sign, and the first pass had the no-entry sign flexing,
# the enamel number plaque rippling and the far-street balconies breathing.
# Strength 1 removes a region entirely; lower values just calm it down.
RIGID_REGIONS = [
    (0.432, 0.118, 0.048, 0.090, 1.00),   # no-entry sign
    (0.432, 0.252, 0.030, 0.058, 1.00),   # enamel number plaque
    (0.437, 0.330, 0.022, 0.300, 1.00),   # its post, full height
    (0.112, 0.245, 0.120, 0.170, 1.00),   # far-street facades and balconies
    (0.285, 0.112, 0.120, 0.078, 0.65),   # the awnings' structural edge
    (0.640, 0.300, 0.030, 0.320, 1.00),   # the weathered pole, right of centre
]

FOLIAGE_REGIONS = [
    (0.130, 0.055, 0.195, 0.125),   # tree canopy, top left
    (0.300, 0.165, 0.070, 0.105),   # greenery over the awnings
    (0.545, 0.075, 0.165, 0.100),   # bougainvillea, top centre
    (0.625, 0.130, 0.085, 0.075),   # bougainvillea, trailing right
    (0.440, 0.270, 0.055, 0.175),   # vine climbing beside the pole
    (0.492, 0.425, 0.048, 0.090),   # potted plant by the door
    (0.088, 0.330, 0.075, 0.105),   # planting down the far street
    (0.022, 0.640, 0.058, 0.145),   # plant at the near left edge
]


def foliage_mask(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h, w = r.shape
    yy = np.linspace(0, 1, h)[:, None]
    xx = np.linspace(0, 1, w)[None, :]
    region = np.zeros((h, w), np.float32)
    for cx, cy, rx, ry in FOLIAGE_REGIONS:
        d = ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2
        region = np.maximum(region, np.clip(1.4 - d, 0, 1))
    for cx, cy, rx, ry, strength in RIGID_REGIONS:
        d = ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2
        region *= 1.0 - strength * np.clip(1.25 - d, 0, 1)
    lum = (r + g + b) / 3.0
    not_sky = (r >= b * 0.98).astype(np.float32)        # sky is blue-dominant
    not_glare = np.clip((0.95 - lum) * 6.0, 0, 1)       # and not blown plaster
    m = np.clip(region, 0, 1) * not_sky * not_glare
    return hang_amplitude(blur(m, 6))


def receive_mask(rgb):
    """Where travelling leaf shadow is allowed to fall: the tabletop and the
    pavement. Deliberately not the building, which already carries its own
    painted dapple and would end up wearing two sets of leaves."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h, w = r.shape
    yy = np.linspace(0, 1, h)[:, None]
    table = ((yy > TABLE_LINE) & (r > 0.26) & ((r - g) > 0.10)).astype(np.float32)
    ground = ((yy > 0.47) & (yy < TABLE_LINE + 0.004)).astype(np.float32)
    return np.clip(blur(np.clip(table + ground, 0, 1), 9), 0, 1)


def menu_mask(rgb):
    """The painted menu cover, with the lift running from spine to free edge."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h, w = r.shape
    yy = np.linspace(0, 1, h)[:, None]
    xx = np.linspace(0, 1, w)[None, :]
    lum = (r + g + b) / 3.0
    # calibrated off the painted cover: warm cream, R-G about .13-.24
    cover = ((lum > 0.47) & ((r - g) > 0.055) & ((r - g) < 0.235)
             & ((r - b) > 0.165) & ((r - b) < 0.44)
             & (yy > 0.648) & (yy < 0.945) & (xx > 0.145) & (xx < 0.455))
    m = blur(cover.astype(np.float32), 10)
    m = np.clip((m - 0.42) * 3.4, 0, 1)
    m = blur(m, 6)
    # the binding is at the left; the far corner is what the wind gets under
    # Steep on purpose: a gentle ramp lifted the entire cover and smeared
    # the printed title with it. Only the corner gets under the wind.
    ramp = np.clip((xx - 0.305) / 0.135, 0, 1) ** 2.0
    return m * np.broadcast_to(ramp, m.shape)


def depth_map(foliage):
    """Near surfaces move most under parallax. The table is nearest, the
    overhanging foliage at the top is also near, and the street between them
    is far - so depth is not a single gradient but a valley at the horizon."""
    h, w = foliage.shape
    yy = np.linspace(0, 1, h)[:, None]
    near = np.clip((yy - 0.46) / 0.46, 0, 1) ** 1.3
    overhead = np.clip(foliage * 1.3, 0, 1) * np.clip((0.42 - yy) / 0.42, 0, 1)
    return np.clip(blur(np.maximum(near, overhead * 0.85), 7), 0, 1)


def tiling_noise(size=256, octaves=5, seed=5):
    """Value noise that wraps, so the shader can scroll it forever."""
    rng = np.random.default_rng(seed)
    out = np.zeros((size, size), np.float32)
    amp, total = 1.0, 0.0
    for o in range(octaves):
        n = max(2, 2 ** (o + 2))
        grid = rng.random((n, n)).astype(np.float32)
        grid = np.pad(grid, ((0, 1), (0, 1)), mode='wrap')
        img = Image.fromarray((grid * 255).astype(np.uint8), 'L') \
            .resize((size + size // n, size + size // n), Image.BICUBIC)
        out += amp * (np.asarray(img, np.float32)[:size, :size] / 255.0)
        total += amp
        amp *= 0.55
    out /= total
    return (out - out.min()) / max(1e-6, float(np.ptp(out)))


def leaf_gobo(size=512, seed=11):
    """A tiling sheet of leaf shadow. White is open sky, dark is shaded."""
    rng = random.Random(seed)
    img = Image.new('L', (size, size), 236)
    draw = ImageDraw.Draw(img)
    for _ in range(520):
        x, y = rng.uniform(0, size), rng.uniform(0, size)
        rx, ry = rng.uniform(7, 26), rng.uniform(4, 15)
        a = rng.uniform(0, math.pi)
        tone = rng.randint(40, 135)
        # drawn nine times so every blob wraps across both seams
        for dx in (-size, 0, size):
            for dy in (-size, 0, size):
                box = (x + dx - rx, y + dy - ry, x + dx + rx, y + dy + ry)
                draw.ellipse(box, fill=tone)
    img = img.filter(ImageFilter.GaussianBlur(5))
    a = np.asarray(img, np.float32) / 255.0
    a = (a - a.min()) / max(1e-6, float(np.ptp(a)))
    return a


def save(array, name, mode='L'):
    path = os.path.join(OUT, name)
    if mode == 'L':
        Image.fromarray((np.clip(array, 0, 1) * 255).astype(np.uint8), 'L').save(
            path, optimize=True)
    else:
        Image.fromarray((np.clip(array, 0, 1) * 255).astype(np.uint8), 'RGBA').save(
            path, optimize=True)
    print(f"  {name:<14} {os.path.getsize(path)/1024:7.1f} KB  {array.shape[1]}x{array.shape[0]}")


def main():
    rgb = np.asarray(Image.open(BACKDROP).convert('RGB'), np.float32) / 255.0
    print("Café Apollo motion maps ->", OUT)
    foliage = foliage_mask(rgb)
    receive = receive_mask(rgb)
    menu = menu_mask(rgb)
    depth = depth_map(foliage)
    packed = np.stack([foliage, receive, menu, depth], axis=-1)
    # half resolution: these are smooth fields and the shader reads them
    # bilinearly, so full resolution would be a quarter-megabyte of nothing
    h, w, _ = packed.shape
    small = np.asarray(
        Image.fromarray((np.clip(packed, 0, 1) * 255).astype(np.uint8), 'RGBA')
        .resize((w // 2, h // 2), Image.LANCZOS), np.float32) / 255.0
    save(small, "motion.png", mode='RGBA')
    save(leaf_gobo(), "gobo.png")
    save(tiling_noise(), "noise.png")
    for name, m in (("foliage", foliage), ("receive", receive), ("menu", menu)):
        print(f"    {name:<8} covers {100*float((m>0.1).mean()):5.1f}% of frame")


if __name__ == "__main__":
    main()
