#!/usr/bin/env python3
"""
Cut the three interactive objects out of the painting.

    python3 tools/cafe-art/build_objects.py

Hovering the menu, the coffee or the sunglasses has to actually move them -
the menu tilting open, the cup lifting, the glasses shifting. Warping the
image in place cannot do that: a warp smears the brushwork and leaves the
object welded to the table.

So the objects become their own layer. This produces:

  plate.jpg     the painting with all three removed and the hole filled in
  objects.png   the three objects, matted, on transparent

At rest the two composite back to the original painting exactly. On hover the
object layer is transformed and the fill underneath is revealed - only a few
pixels of it, which is why a cheap diffusion fill is enough.

Matting is done by growing a region outward from each object's centre through
everything that is not tabletop. A plain colour threshold was tried first and
pulled the pale chips in the enamel into the sprites, so they travelled with
the cup; growing from a seed keeps only what is actually connected to the
object.
"""
import os

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "public", "cafe")
BACKDROP = os.path.join(OUT, "backdrop.jpg")

# Generous boxes; the colour test and the region growing carve the silhouette.
# Left, top, right, bottom as fractions of the image, plus the seed centre.
# Boxes stop at the table line: above it is pavement, and the first pass let
# the menu's box reach up into it and drag a sliver of kerb into the sprite.
TABLE_LINE = 0.631
# The union of the three objects, with a margin for them to move into.
CROP = (0.118, 0.620, 0.882, 1.000)
# Box, seed centre, and how strictly to reject tabletop. The sunglasses need
# the strictest test: they sit in a patch of bright sunlit enamel, and at the
# shared threshold the region grew out through it and took a bite of table
# along with them.
OBJECTS = {
    "menu":    ((0.128, 0.631, 0.470, 0.975), (0.295, 0.800), 0.58),
    "coffee":  ((0.470, 0.634, 0.675, 0.925), (0.566, 0.782), 0.58),
    "glasses": ((0.672, 0.678, 0.868, 0.880), (0.778, 0.775), 0.74),
}


def tableness(rgb):
    """How much a pixel looks like bare enamel tabletop.

    Red and cream both run r > g > b, so the separator is how far red leads
    green: the table sits near 0.35, the menu's card near 0.13. Bright pixels
    are then pardoned, because the crema in the cup is every bit as
    red-over-green as the table is and must not be mistaken for it.
    """
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    lum = (r + g + b) / 3.0
    lead = np.clip(((r - g) - 0.17) / 0.13, 0, 1)
    dim = 1.0 - np.clip((lum - 0.40) / 0.17, 0, 1)
    return lead * dim


def grow(seed, allowed, steps=95):
    """Morphological reconstruction: dilate the seed, but only into `allowed`."""
    cur = Image.fromarray((seed * 255).astype(np.uint8), 'L')
    mask = allowed > 0.5
    for _ in range(steps):
        cur = cur.filter(ImageFilter.MaxFilter(5))
        arr = np.asarray(cur, np.float32) / 255.0
        arr = np.where(mask, arr, 0.0)
        cur = Image.fromarray((arr * 255).astype(np.uint8), 'L')
    return np.asarray(cur, np.float32) / 255.0


def diffusion_fill(rgb, hole):
    """Fill the holes by letting the surrounding tabletop bleed inward.

    Coarse to fine. A single small radius has to be iterated hundreds of times
    to cross a three-hundred-pixel hole, and at ninety rounds the middle of
    the menu was still black; starting wide and narrowing converges at once.
    """
    known = (hole < 0.5)[..., None]
    filled = np.where(known, rgb, 0.0)
    for radius, rounds in ((56, 6), (28, 6), (14, 6), (7, 6), (3, 6)):
        for _ in range(rounds):
            blurred = np.stack([
                np.asarray(Image.fromarray((np.clip(filled[..., c], 0, 1) * 255)
                                           .astype(np.uint8), 'L')
                           .filter(ImageFilter.GaussianBlur(radius)), np.float32) / 255.0
                for c in range(3)], axis=-1)
            filled = np.where(known, rgb, blurred)
    return np.clip(filled, 0, 1)


def main():
    rgb = np.asarray(Image.open(BACKDROP).convert('RGB'), np.float32) / 255.0
    h, w, _ = rgb.shape
    print("Café Apollo object layer ->", OUT)

    table = tableness(rgb)
    alpha_total = np.zeros((h, w), np.float32)
    report = []

    for name, ((x0, y0, x1, y1), (sx, sy), strict) in OBJECTS.items():
        box = np.zeros((h, w), np.float32)
        box[int(max(y0, TABLE_LINE) * h):int(y1 * h), int(x0 * w):int(x1 * w)] = 1.0
        allowed = box * (1.0 - np.clip(table * 2.1, 0, 1))
        allowed = (allowed > strict).astype(np.float32)

        seed = np.zeros((h, w), np.float32)
        yy, xx = np.mgrid[0:h, 0:w]
        seed[((xx - sx * w) ** 2 + ((yy - sy * h) * (w / h)) ** 2) < (0.012 * w) ** 2] = 1.0
        seed *= allowed
        if seed.sum() < 10:
            raise SystemExit(f"{name}: seed landed outside the object")

        grown = grow(seed, allowed)
        grown = np.asarray(
            Image.fromarray((grown * 255).astype(np.uint8), 'L')
            .filter(ImageFilter.MaxFilter(5))
            .filter(ImageFilter.GaussianBlur(1.6)), np.float32) / 255.0
        grown = np.clip((grown - 0.35) * 2.6, 0, 1)
        alpha_total = np.maximum(alpha_total, grown)
        report.append((name, 100 * float((grown > 0.5).mean())))

    fill = diffusion_fill(rgb, alpha_total)
    # Diffusion converges to the average of what surrounds a hole, which runs
    # darker than the lit tabletop around it. Lift the filled region back to
    # the level of the table just outside it, so no halo shows at the edge of
    # a sprite when it moves.
    ring = np.asarray(
        Image.fromarray(((alpha_total > 0.5) * 255).astype(np.uint8), 'L')
        .filter(ImageFilter.MaxFilter(9)), np.float32) / 255.0
    ring = (ring > 0.5) & (alpha_total < 0.5)
    inside = alpha_total > 0.5
    if ring.sum() > 200 and inside.sum() > 200:
        for c in range(3):
            gain = rgb[..., c][ring].mean() / max(fill[..., c][inside].mean(), 1e-4)
            fill[..., c] = np.where(inside, fill[..., c] * gain, fill[..., c])
    fill = np.clip(fill, 0, 1)

    # Everything ships cropped to the objects' own bounding box, and the
    # colour ships separately from the alpha. A full-frame RGBA png of this
    # came to 1.2 MB; as a cropped JPEG plus an 8-bit alpha it is a tenth of
    # that, because JPEG handles the painted colour and PNG handles the matte.
    x0 = int(CROP[0] * w)
    y0 = int(CROP[1] * h)
    x1 = int(CROP[2] * w)
    y1 = int(CROP[3] * h)
    alpha = alpha_total[y0:y1, x0:x1]
    colour = rgb[y0:y1, x0:x1].copy()

    # Bleed the object colour outward under the transparent margin first, or
    # JPEG ringing round the silhouette shows as a fringe once it is masked.
    solid = alpha > 0.05
    for _ in range(14):
        grown_img = [np.asarray(
            Image.fromarray((np.clip(colour[..., c], 0, 1) * 255).astype(np.uint8), 'L')
            .filter(ImageFilter.MaxFilter(3)), np.float32) / 255.0 for c in range(3)]
        spread = np.asarray(
            Image.fromarray((solid * 255).astype(np.uint8), 'L')
            .filter(ImageFilter.MaxFilter(3)), np.float32) / 255.0 > 0.5
        newly = spread & ~solid
        for c in range(3):
            colour[..., c] = np.where(newly, grown_img[c], colour[..., c])
        solid = spread

    Image.fromarray((np.clip(colour, 0, 1) * 255).astype(np.uint8), 'RGB').save(
        os.path.join(OUT, 'objects.jpg'), quality=92, optimize=True, subsampling=0)
    Image.fromarray((alpha * 255).astype(np.uint8), 'L').save(
        os.path.join(OUT, 'objects-alpha.png'), optimize=True)
    Image.fromarray((fill[y0:y1, x0:x1] * 255).astype(np.uint8), 'RGB').save(
        os.path.join(OUT, 'objects-fill.jpg'), quality=86, optimize=True, subsampling=1)

    for name, pct in report:
        print(f"    {name:<8} {pct:5.2f}% of frame")
    total = 0
    for f in ('objects.jpg', 'objects-alpha.png', 'objects-fill.jpg'):
        size = os.path.getsize(os.path.join(OUT, f))
        total += size
        print(f"  {f:<20} {size/1024:7.1f} KB")
    print(f"  {'object layer total':<20} {total/1024:7.1f} KB")
    print(f"  crop rect (image fractions) = {CROP}")


if __name__ == "__main__":
    main()
