#!/usr/bin/env python3
"""
Project the painted backdrop onto the 3D table's texture.

NOT CURRENTLY USED. Kept as the record of an experiment worth not repeating.

Projecting the painting onto the geometry is the right instinct and it works
mechanically - the maths below is sound and the projected pixels land exactly
where they should. It fails on content. The painting's own menu, cup, glasses,
ashtray and the sitter's knee cover most of the tabletop it shows, so strict
projection recovers about 4% of the map, and collaging the few clean patches
across the rest produced visible diagonal repetition that read worse than the
procedural map it was meant to replace.

Worth revisiting if the backdrop is ever regenerated with a bare table.

    python3 tools/cafe-assets/build_textures.py      # procedural base first
    python3 tools/cafe-assets/project_paint.py       # then paint over it

The backdrop was painted from a known viewpoint, and the 3D table is composed
to sit in that same viewpoint. So for any point on the tabletop we can work
out where it lands in the painting and take the pixel that is actually there.
The geometry stays real - it still catches the moving leaf shadow - but it
wears the painting's brushwork instead of a generated approximation.

Two things keep this simple rather than a full bake:

  the tabletop is a plane carrying a planar UV projection, so texel -> world
  is linear and no triangle rasterisation is needed;

  anything the painting does not actually show as tabletop - the painted
  menu, cup, ashtray and knee, and everything above the table line - is
  rejected by a colour mask and falls back to the procedural map.

The painting's own light is divided out before use. Its baked shadows would
otherwise sit in the albedo and fight the scene's moving ones; dividing by a
heavily blurred luminance removes the large-scale shading while leaving the
chipping and the brush texture intact.
"""
import math
import os

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
TEX = os.path.join(ROOT, "public", "cafe", "tex")
BACKDROP = os.path.join(ROOT, "public", "cafe", "backdrop.jpg")

# --- the viewpoint the backdrop was painted from -------------------------
# These mirror VIEWS.desktop in src/scripts/cafe-world.js. If that camera
# moves, this must move with it or the paint will slide off the geometry.
EYE = np.array([0.0, 1.168, 0.268])
LOOK = np.array([0.0, 0.420, -1.870])
FOV_Y = 60.0

# --- the tabletop, as the scene places it --------------------------------
# a_table.py builds W x D at TOP_H; cafe-scenography.js scales it in plan.
TABLE_W, TABLE_D, TOP_H = 1.15, 0.85, 0.745
PLAN_SCALE = 1.30


# Where the painting shows something that is NOT bare tabletop. A colour test
# alone let the warm edges of the painted menu and the brown hint pill through,
# so these are stated explicitly, as fractions of the image. Everything here
# falls back to the procedural map - and since the 3D menu, cup, glasses and
# ashtray stand in these same places, the fallback is covered anyway.
# Rectangles of the painting that ARE bare tabletop, used as source material.
# Strict projection alone only recovers a few per cent of the top, because the
# painted menu, cup, glasses, ashtray and knee cover most of what the painting
# shows. So the clean areas are harvested and collaged across the whole map,
# and the exactly-projected pixels are laid over the top of that.
# Only patches big enough to tile. The narrow slivers between the painted
# props were tried first and stretched into long diagonal streaks - a patch
# sixty pixels wide scaled up reads as a smear, not as a surface.
CLEAN = [
    (0.872, 0.640, 0.998, 0.935),   # right of the glasses, out to the edge
    (0.072, 0.690, 0.148, 0.940),   # left of the menu
    (0.455, 0.660, 0.520, 0.930),   # between the menu and the saucer
]
MIN_PATCH = 70

OCCLUDERS = [
    (0.000, 0.560, 0.080, 1.000),   # painted chair arm and pot plant, left
    (0.130, 0.605, 0.465, 0.960),   # painted menu
    (0.320, 0.585, 0.440, 0.710),   # painted ashtray
    (0.480, 0.645, 0.670, 0.910),   # painted cup and saucer
    (0.680, 0.685, 0.880, 0.865),   # painted sunglasses
    (0.600, 0.860, 0.770, 1.000),   # the painted sitter's knee
    (0.340, 0.910, 0.645, 1.000),   # hint pill
    (0.845, 0.900, 1.000, 1.000),   # "Look around"
]


def camera_basis():
    forward = LOOK - EYE
    forward /= np.linalg.norm(forward)
    right = np.cross(forward, np.array([0.0, 1.0, 0.0]))
    right /= np.linalg.norm(right)
    upv = np.cross(right, forward)
    return forward, right, upv


def project(points):
    """World points -> backdrop image UV in 0..1, plus depth along the view."""
    forward, right, upv = camera_basis()
    d = points - EYE
    depth = d @ forward
    xc = d @ right
    yc = d @ upv
    aspect = 1672.0 / 941.0
    t = math.tan(math.radians(FOV_Y) / 2.0)
    safe = np.where(np.abs(depth) < 1e-6, 1e-6, depth)
    ndc_x = xc / (safe * t * aspect)
    ndc_y = yc / (safe * t)
    return (ndc_x * 0.5 + 0.5), (1.0 - (ndc_y * 0.5 + 0.5)), depth


def table_world(size):
    """Texel grid -> world position on the tabletop.

    a_table.py's planar projection is u = x/W + 0.5 and v = y/D + 0.5 in
    Blender coordinates; glTF's Y-up conversion turns Blender +Y into -Z, so
    v runs the opposite way to world z.
    """
    u = (np.arange(size) + 0.5) / size
    v = (np.arange(size) + 0.5) / size
    uu, vv = np.meshgrid(u, v)
    x = (uu - 0.5) * TABLE_W * PLAN_SCALE
    z = (0.5 - vv) * TABLE_D * PLAN_SCALE
    y = np.full_like(x, TOP_H)
    return np.stack([x, y, z], axis=-1), uu, vv


def collage(painting, size, rng):
    """Fill a square with mirrored, feathered copies of the painting's clean
    tabletop patches. Random placement and flipping is what stops it reading
    as a tiled texture."""
    ih, iw, _ = painting.shape
    out = np.zeros((size, size, 3), np.float32)
    weight = np.zeros((size, size), np.float32)
    patches = []
    for x0, y0, x1, y1 in CLEAN:
        crop = painting[int(y0 * ih):int(y1 * ih), int(x0 * iw):int(x1 * iw)]
        if min(crop.shape[0], crop.shape[1]) >= MIN_PATCH:
            patches.append(delight(crop, sigma=22))
    if not patches:
        raise SystemExit("no usable clean patches in the backdrop")
    for _ in range(560):
        src = patches[rng.integers(len(patches))]
        ph, pw, _ = src.shape
        if rng.random() < 0.5:
            src = src[:, ::-1]
        if rng.random() < 0.5:
            src = src[::-1]
        scale = float(rng.uniform(0.75, 1.25))
        th, tw = max(8, int(ph * scale)), max(8, int(pw * scale))
        tile = np.asarray(Image.fromarray((np.clip(src, 0, 1) * 255)
                                          .astype(np.uint8), 'RGB')
                          .resize((tw, th)), np.float32) / 255.0
        ox = int(rng.integers(-tw // 2, size))
        oy = int(rng.integers(-th // 2, size))
        x0, x1 = max(0, ox), min(size, ox + tw)
        y0, y1 = max(0, oy), min(size, oy + th)
        if x1 <= x0 or y1 <= y0:
            continue
        sub = tile[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
        fh, fw = sub.shape[:2]
        fy = np.minimum(np.arange(fh), fh - 1 - np.arange(fh)) / max(1, fh * 0.35)
        fx = np.minimum(np.arange(fw), fw - 1 - np.arange(fw)) / max(1, fw * 0.35)
        alpha = np.clip(np.minimum(fy[:, None], fx[None, :]), 0, 1)
        out[y0:y1, x0:x1] += sub * alpha[..., None]
        weight[y0:y1, x0:x1] += alpha
    return out / np.maximum(weight, 1e-4)[..., None]


def delight(rgb, sigma=55):
    """Remove the painting's large-scale shading, keep its fine detail."""
    lum = (rgb * np.array([0.2126, 0.7152, 0.0722])).sum(-1)
    blurred = np.asarray(
        Image.fromarray((np.clip(lum, 0, 1) * 255).astype(np.uint8), 'L')
        .filter(ImageFilter.GaussianBlur(sigma)), np.float32) / 255.0
    blurred = np.maximum(blurred, 0.04)
    return np.clip(rgb * (blurred.mean() / blurred)[..., None], 0, 1)


def main(size=1024):
    painting = np.asarray(Image.open(BACKDROP).convert('RGB'), np.float32) / 255.0
    ih, iw, _ = painting.shape
    base = np.asarray(Image.open(os.path.join(TEX, 'enamel.jpg'))
                      .convert('RGB').resize((size, size)), np.float32) / 255.0

    world, uu, vv = table_world(size)
    px, py, depth = project(world.reshape(-1, 3))
    px = px.reshape(size, size)
    py = py.reshape(size, size)

    inside = (px > 0) & (px < 1) & (py > 0) & (py < 1) & (depth.reshape(size, size) > 0)
    sx = np.clip((px * iw).astype(int), 0, iw - 1)
    sy = np.clip((py * ih).astype(int), 0, ih - 1)
    sampled = painting[sy, sx]

    # Accept only pixels the painting actually shows as tabletop: red-dominant,
    # and below the painted table line. Everything else - the painted menu,
    # the cup, the ashtray, the knee, the cobbles above the edge - is rejected.
    r, g, b = sampled[..., 0], sampled[..., 1], sampled[..., 2]
    is_table = (r > 0.26) & (r - g > 0.11) & (r - b > 0.09) & (py > 0.645)
    clear = np.ones_like(is_table)
    for ox0, oy0, ox1, oy1 in OCCLUDERS:
        clear &= ~((px > ox0) & (px < ox1) & (py > oy0) & (py < oy1))
    mask = (inside & is_table & clear).astype(np.float32)

    # Feather the mask so the painted region blends into the procedural one.
    mask = np.asarray(
        Image.fromarray((mask * 255).astype(np.uint8), 'L')
        .filter(ImageFilter.GaussianBlur(13)), np.float32) / 255.0
    mask = np.clip((mask - 0.42) * 1.5, 0, 1)

    rng = np.random.default_rng(7)
    fill = collage(painting, size, rng)
    painted = delight(sampled)
    # The collage is the base coat; the strictly projected pixels go on top
    # wherever the painting really does show that part of the table.
    base = fill
    # Match the procedural map's overall level so the two blend invisibly.
    for c in range(3):
        covered = mask > 0.6
        if covered.sum() > 500:
            painted[..., c] *= (base[..., c][covered].mean()
                                / max(painted[..., c][covered].mean(), 1e-4))
    out = np.clip(painted * mask[..., None] + base * (1 - mask[..., None]), 0, 1)
    # Keep the procedural map's large-scale level so the lighting still sits
    # where it was tuned, but take all of the detail from the painting.
    proc = np.asarray(Image.open(os.path.join(TEX, 'enamel.jpg'))
                      .convert('RGB').resize((size, size)), np.float32) / 255.0
    for c in range(3):
        out[..., c] *= proc[..., c].mean() / max(out[..., c].mean(), 1e-4)
    out = np.clip(out, 0, 1)

    path = os.path.join(TEX, 'enamel-painted.jpg')
    Image.fromarray((out * 255).astype(np.uint8), 'RGB').save(
        path, quality=92, optimize=True, subsampling=1)
    print(f"  enamel-painted.jpg   {os.path.getsize(path)/1024:7.1f} KB  {size}px"
          f"   {100*mask.mean():.0f}% of the top taken from the painting")


if __name__ == "__main__":
    main()
