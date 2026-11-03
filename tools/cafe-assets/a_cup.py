"""
Café Apollo - the small blue espresso cup, its saucer and the espresso.

Proportions and colour scheme come from the art-direction reference, and two
of them are the opposite of what a generic "blue espresso cup" wants to be:

  the saucer is blue with a CREAM RIM, not cream with a blue centre;
  the cup carries a pale porcelain LIP above the glaze, so the rim reads as a
  bright line rather than as more blue.

Both are what make the object recognisable at the size it actually occupies
on screen, where the reference's rust-flecked chipping is sub-pixel.

The cup is also chunkier than a real 60 ml espresso cup: rim diameter about
1.35 times its height, where the true article is nearer 1.15.
"""
import math

import kit

RIM = 0.0352
HEIGHT = 0.0530
Z0 = 0.0150          # the cup's foot, sitting in the saucer's well


def build():
    blue = kit.material("CupGlaze", kit.hexcolor('#235f83'), 0.13, 0.0,
                        clearcoat=0.55)
    cream = kit.material("SaucerGlaze", kit.hexcolor('#eee6d4'), 0.17, 0.0,
                         clearcoat=0.5)
    white = kit.material("CupInner", kit.hexcolor('#f4efe2'), 0.14, 0.0,
                         clearcoat=0.5)
    espresso = kit.material("Espresso", kit.hexcolor('#50280f'), 0.16)
    crema = kit.material("Crema", kit.hexcolor('#a8621f'), 0.32)
    bloom = kit.material("CremaBloom", kit.hexcolor('#d99a46'), 0.28)
    parts = []

    # --- saucer: a real well, a rolled rim and a foot ring it stands on.
    saucer = kit.lathe("saucer", [
        (0.0000, 0.0062), (0.0180, 0.0060), (0.0205, 0.0088),
        (0.0215, 0.0125), (0.0220, 0.0150),            # cup well wall
        (0.0300, 0.0128), (0.0450, 0.0118), (0.0545, 0.0132),
        (0.0585, 0.0168), (0.0600, 0.0186),            # rolled outer rim
        (0.0588, 0.0150), (0.0540, 0.0096), (0.0400, 0.0070),
        (0.0268, 0.0056), (0.0250, 0.0022), (0.0232, 0.0000),
        (0.0205, 0.0004), (0.0196, 0.0048), (0.0150, 0.0032),
        (0.0000, 0.0030),
    ], segments=56)
    kit.jitter(saucer, 0.00014, seed=3)
    kit.shade_smooth(saucer, 48)
    kit.assign(saucer, blue)
    parts.append(saucer)

    # --- the cream band around the saucer's rim. Lifted half a millimetre
    # clear of the surface it sits on: at a fifth of that it z-fought with the
    # saucer and stippled its own edge into a scallop.
    band = kit.lathe("saucerband", [
        (0.0534, 0.0129), (0.0572, 0.0152), (0.0590, 0.0175),
        (0.0601, 0.0191), (0.0590, 0.0152), (0.0556, 0.0117),
    ], segments=56)
    kit.shade_smooth(band, 48)
    kit.assign(band, cream)
    parts.append(band)

    # --- cup: outer glaze, stopping three millimetres below the rim.
    cup = kit.lathe("cup", [
        (0.0000, Z0 + 0.0000), (0.0150, Z0 + 0.0000), (0.0196, Z0 + 0.0012),
        (0.0210, Z0 + 0.0048), (0.0246, Z0 + 0.0130), (0.0292, Z0 + 0.0268),
        (0.0330, Z0 + 0.0400), (0.0348, Z0 + 0.0492), (RIM, Z0 + 0.0514),
    ], segments=56)
    kit.jitter(cup, 0.00010, seed=9)
    kit.shade_smooth(cup, 48)
    kit.assign(cup, blue)
    parts.append(cup)

    # --- the pale lip: over the top of the glaze and a little way down the
    # inside. Three shallow nicks knocked out of it, placed individually -
    # a periodic function gave eight even scallops, which read as a crown.
    lip = kit.lathe("cuplip", [
        (RIM - 0.0002, Z0 + 0.0512), (RIM + 0.0004, Z0 + 0.0521),
        (RIM, Z0 + HEIGHT), (RIM - 0.0022, Z0 + 0.0527),
        (RIM - 0.0030, Z0 + 0.0512),
    ], segments=56)
    nicks = ((0.85, 0.055, 0.0010), (2.60, 0.038, 0.0007), (4.45, 0.046, 0.0008))
    for vert in lip.data.vertices:
        a = math.atan2(vert.co.y, vert.co.x)
        for centre, width, depth in nicks:
            d = (a - centre + math.pi) % kit.TAU - math.pi
            vert.co.z -= depth * math.exp(-(d * d) / (2 * width * width))
    kit.shade_smooth(lip, 46)
    kit.assign(lip, white)
    parts.append(lip)

    # --- the white glazed interior.
    inner = kit.lathe("cupinner", [
        (0.0000, Z0 + 0.0064), (0.0148, Z0 + 0.0062), (0.0186, Z0 + 0.0078),
        (0.0218, Z0 + 0.0140), (0.0262, Z0 + 0.0272), (0.0300, Z0 + 0.0404),
        (RIM - 0.0028, Z0 + 0.0512),
    ], segments=56)
    kit.shade_smooth(inner, 48)
    kit.assign(inner, white)
    parts.append(inner)

    # --- handle: a swept C, thick enough to read at a glance.
    pts = []
    for i in range(13):
        t = i / 12
        a = math.radians(-96 + 192 * t)
        r = 0.0196 + 0.0050 * math.sin(math.pi * t)
        pts.append((0.0300 + r * math.cos(a) * 0.86, 0.0,
                    Z0 + 0.0310 + r * math.sin(a)))
    pts[0] = (0.0256, 0.0, Z0 + 0.0170)
    pts[-1] = (0.0318, 0.0, Z0 + 0.0455)
    section = kit.profile_curve("handleprofile", [
        (-0.0062, -0.0036), (0.0062, -0.0036), (0.0062, 0.0036), (-0.0062, 0.0036)])
    handle = kit.tube_along("handle", pts, profile=section)
    kit.bevel(handle, 0.0018, 2, 40)
    kit.apply_all(handle)
    kit.shade_smooth(handle, 46)
    kit.assign(handle, blue)
    parts.append(handle)
    kit.remove(section)

    # --- the espresso. The whole surface is crema, with the dark coffee
    # showing only as a ring at the wall; a dark disc on top read as black.
    surface = kit.lathe("espresso", [
        (0.0000, Z0 + 0.0424), (0.0180, Z0 + 0.0423), (0.0262, Z0 + 0.0421),
        (0.0288, Z0 + 0.0427), (0.0302, Z0 + 0.0442),
    ], segments=52, close=True)
    kit.shade_smooth(surface, 50)
    kit.assign(surface, crema)
    parts.append(surface)

    ring = kit.lathe("espressoring", [
        (0.0248, Z0 + 0.0425), (0.0280, Z0 + 0.0429), (0.0300, Z0 + 0.0438),
        (0.0306, Z0 + 0.0448),
    ], segments=52)
    kit.shade_smooth(ring, 50)
    kit.assign(ring, espresso)
    parts.append(ring)

    # A paler bloom, off-centre and deliberately irregular - a concentric
    # bullseye is the quickest way to make coffee look procedural.
    foam = kit.lathe("crema", [
        (0.0000, Z0 + 0.0433), (0.0120, Z0 + 0.0432), (0.0190, Z0 + 0.0430),
        (0.0214, Z0 + 0.0426),
    ], segments=44, close=True)
    for v in foam.data.vertices:
        a = math.atan2(v.co.y, v.co.x)
        v.co.x *= 1.0 + 0.055 * math.sin(a * 2.0 + 0.7)
        v.co.y *= 1.0 + 0.042 * math.sin(a * 3.0 - 1.2)
    foam.location = (0.0026, -0.0018, 0.0)
    kit.shade_smooth(foam, 50)
    kit.assign(foam, bloom)
    parts.append(foam)

    for part in parts:
        kit.apply_all(part)
    merged = kit.join("EspressoCup", parts)
    kit.smart_uv(merged)
    return merged
