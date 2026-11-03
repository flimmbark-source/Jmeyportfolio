"""
Café Apollo - the small blue espresso cup, its saucer and the espresso itself.

Real espresso proportions: a 60-70 ml cup is ~62 mm across the rim, 55 mm
tall, with a thick wall that tapers to a narrow foot. It is glazed cobalt
outside and left white inside, which is what makes the dark coffee read.
"""
import math
import kit

RIM = 0.0315
HEIGHT = 0.057


def build():
    blue = kit.material("CupGlaze", kit.hexcolor('#1d4f6e'), 0.14, 0.0,
                        clearcoat=0.5)
    white = kit.material("CupInner", kit.hexcolor('#f6f1e4'), 0.13, 0.0,
                         clearcoat=0.5)
    espresso = kit.material("Espresso", kit.hexcolor('#2c1710'), 0.09)
    crema = kit.material("Crema", kit.hexcolor('#c07e36'), 0.34)
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
    kit.jitter(saucer, 0.00012, seed=3)
    kit.shade_smooth(saucer, 48)
    kit.assign(saucer, blue)
    parts.append(saucer)

    # --- cup: outer wall up, over the rim, and back down the inside, so the
    # vessel is genuinely hollow with a believable 3 mm lip.
    z0 = 0.0150
    cup = kit.lathe("cup", [
        (0.0000, z0 + 0.0000), (0.0150, z0 + 0.0000), (0.0196, z0 + 0.0012),
        (0.0208, z0 + 0.0046), (0.0236, z0 + 0.0135), (0.0272, z0 + 0.0290),
        (0.0300, z0 + 0.0440), (0.0313, z0 + 0.0530), (RIM, z0 + HEIGHT - 0.0008),
        (0.0310, z0 + HEIGHT), (0.0292, z0 + HEIGHT - 0.0012),
        (0.0286, z0 + 0.0500), (0.0258, z0 + 0.0330), (0.0216, z0 + 0.0140),
        (0.0186, z0 + 0.0072), (0.0150, z0 + 0.0060), (0.0000, z0 + 0.0062),
    ], segments=56)
    kit.jitter(cup, 0.00010, seed=9)
    kit.shade_smooth(cup, 48)
    kit.assign(cup, blue)
    parts.append(cup)

    # --- the white glazed interior, a separate shell just inside the wall.
    inner = kit.lathe("cupinner", [
        (0.0000, z0 + 0.0064), (0.0148, z0 + 0.0062), (0.0184, z0 + 0.0074),
        (0.0214, z0 + 0.0142), (0.0256, z0 + 0.0332), (0.0284, z0 + 0.0502),
        (0.0288, z0 + HEIGHT - 0.0052), (0.0294, z0 + HEIGHT - 0.0034),
    ], segments=56)
    kit.shade_smooth(inner, 48)
    kit.assign(inner, white)
    parts.append(inner)

    # --- handle: a swept C with a thicker root where it joins the wall.
    pts = []
    for i in range(13):
        t = i / 12
        a = math.radians(-96 + 192 * t)
        r = 0.0176 + 0.0046 * math.sin(math.pi * t)
        pts.append((0.0282 + r * math.cos(a) * 0.86,
                    0.0,
                    z0 + 0.0332 + r * math.sin(a)))
    pts[0] = (0.0238, 0.0, z0 + 0.0188)
    pts[-1] = (0.0292, 0.0, z0 + 0.0488)
    rimprofile = kit.profile_curve("handleprofile", [
        (-0.0052, -0.0030), (0.0052, -0.0030), (0.0052, 0.0030), (-0.0052, 0.0030)])
    handle = kit.tube_along("handle", pts, profile=rimprofile)
    kit.bevel(handle, 0.0016, 2, 40)
    kit.apply_all(handle)
    kit.shade_smooth(handle, 46)
    kit.assign(handle, blue)
    parts.append(handle)
    if rimprofile.name in __import__('bpy').data.objects:
        __import__('bpy').data.objects.remove(rimprofile, do_unlink=True)

    # --- the espresso: a meniscus that climbs the wall, plus a crema island
    # that is off-centre and irregular, never a concentric bullseye.
    surface = kit.lathe("espresso", [
        (0.0000, z0 + 0.0452), (0.0180, z0 + 0.0451), (0.0250, z0 + 0.0449),
        (0.0276, z0 + 0.0455), (0.0286, z0 + 0.0468),
    ], segments=52, close=True)
    kit.shade_smooth(surface, 50)
    kit.assign(surface, espresso)
    parts.append(surface)

    # Crema covers nearly the whole surface, leaving a thin dark ring at the
    # wall. Its edge is deliberately irregular - a concentric bullseye is the
    # single most common tell of a procedurally faked coffee.
    foam = kit.lathe("crema", [
        (0.0000, z0 + 0.0459), (0.0150, z0 + 0.0458), (0.0230, z0 + 0.0456),
        (0.0258, z0 + 0.0450),
    ], segments=44, close=True)
    for v in foam.data.vertices:                     # break the perfect circle
        a = math.atan2(v.co.y, v.co.x)
        v.co.x *= 1.0 + 0.055 * math.sin(a * 2.0 + 0.7)
        v.co.y *= 1.0 + 0.042 * math.sin(a * 3.0 - 1.2)
    foam.location = (0.0026, -0.0018, 0.0)
    kit.shade_smooth(foam, 50)
    kit.assign(foam, crema)
    parts.append(foam)

    for part in parts:
        kit.apply_all(part)
    merged = kit.join("EspressoCup", parts)
    kit.smart_uv(merged)
    return merged
