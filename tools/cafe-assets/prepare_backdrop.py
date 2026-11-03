#!/usr/bin/env python3
"""
Prepare the painted backdrop from the supplied art-direction reference.

    python3 tools/cafe-assets/prepare_backdrop.py <source-image>

The reference was generated with a mock-up of the site's own interface
painted into it - an identity block top-left, navigation pills top-right, a
hint pill and a "Look around" button along the bottom. The real interface is
live HTML drawn over the top, so those painted ones have to come out or every
control appears twice.

They are removed by resynthesising each patch from the pixels immediately
below it, mirrored and feathered in. The regions sit over sky, foliage and
plain plaster, which is forgiving; nothing structural is being invented.
"""
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "public", "cafe", "backdrop.jpg")

# Fractions of width/height, so the regions survive a change of source size.
PAINTED_UI = [
    (0.015, 0.005, 0.245, 0.125),   # identity block, top left
    (0.655, 0.008, 0.996, 0.078),   # navigation pills, top right
    (0.350, 0.920, 0.635, 0.990),   # hint pill, bottom centre
    (0.855, 0.910, 1.000, 0.985),   # "Look around", bottom right
]


def heal(img, box, feather=18):
    """Replace a rectangle with a mirrored copy of the band beneath it."""
    w, h = img.size
    x0, y0, x1, y1 = (int(box[0] * w), int(box[1] * h),
                      int(box[2] * w), int(box[3] * h))
    bh = y1 - y0
    # Take the donor band from below normally, but from ABOVE for anything
    # close to the bottom edge: clamping a below-band against the bottom of
    # the image makes it overlap the very thing being removed, and the patch
    # then copies the control back into itself, mirrored.
    if y1 > h - bh - 4:
        donor = img.crop((x0, max(0, y0 - bh), x1, y0)).transpose(
            Image.FLIP_TOP_BOTTOM)
    else:
        donor = img.crop((x0, y1, x1, min(h, y1 + bh))).transpose(
            Image.FLIP_TOP_BOTTOM)
    if donor.size != (x1 - x0, bh):
        donor = donor.resize((x1 - x0, bh))

    patch = np.asarray(donor, np.float32)
    target = np.asarray(img.crop((x0, y0, x1, y1)), np.float32)
    # Feathered alpha so the seam does not show as a hard rectangle.
    ah, aw = patch.shape[:2]
    ay = np.clip(np.minimum(np.arange(ah), ah - 1 - np.arange(ah)) / feather, 0, 1)
    ax = np.clip(np.minimum(np.arange(aw), aw - 1 - np.arange(aw)) / feather, 0, 1)
    alpha = np.minimum(ay[:, None], ax[None, :])[..., None]
    blended = patch * alpha + target * (1 - alpha)
    img.paste(Image.fromarray(blended.astype(np.uint8), 'RGB'), (x0, y0))
    return img


def main():
    source = sys.argv[1] if len(sys.argv) > 1 else None
    if not source or not os.path.exists(source):
        print("usage: prepare_backdrop.py <source-image>")
        return 1
    img = Image.open(source).convert('RGB')
    for box in PAINTED_UI:
        heal(img, box)
    # A whisper of blur over the healed bands only would be fiddly; a global
    # 0.3px costs nothing visible and softens the joins.
    img = img.filter(ImageFilter.GaussianBlur(0.3))
    img.save(OUT, quality=90, optimize=True, subsampling=1)
    print(f"  backdrop.jpg  {os.path.getsize(OUT)/1024:.1f} KB  {img.size[0]}x{img.size[1]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
