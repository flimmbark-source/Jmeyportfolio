"""
Café Almar - the street prop kit.

Each object is exported under its own name inside one GLB so the scene can
clone and place them. Everything here exists to build depth behind the table:
bollards, poles, awnings, planting, chairs and signage with silhouettes you
could recognise as a black shape.
"""
import math
import random
import kit


def bollard():
    iron = kit.material("BollardIron", kit.hexcolor('#4c5551'), 0.52, 0.55)
    body = kit.lathe("Bollard", [
        (0.000, 0.000), (0.105, 0.000), (0.108, 0.030), (0.086, 0.055),
        (0.074, 0.090), (0.072, 0.230), (0.079, 0.260), (0.076, 0.300),
        (0.062, 0.760), (0.070, 0.800), (0.082, 0.830), (0.080, 0.862),
        (0.058, 0.890), (0.030, 0.906), (0.000, 0.910),
    ], segments=22, close=True)
    kit.jitter(body, 0.0016, seed=31)
    kit.shade_smooth(body, 42)
    kit.assign(body, iron)
    kit.apply_all(body)
    return body


def utility_pole():
    concrete = kit.material("PoleConcrete", kit.hexcolor('#9a9b93'), 0.93)
    iron = kit.material("PoleIron", kit.hexcolor('#454c49'), 0.5, 0.6)
    porcelain = kit.material("Insulator", kit.hexcolor('#c9c3ad'), 0.3)
    parts = []
    shaft = kit.lathe("shaft", [
        (0.000, 0.00), (0.118, 0.00), (0.112, 0.60), (0.096, 3.40),
        (0.082, 6.20), (0.074, 8.10), (0.000, 8.16)], segments=14, close=True)
    kit.jitter(shaft, 0.004, seed=52)
    kit.shade_smooth(shaft, 40)
    kit.assign(shaft, concrete)
    parts.append(shaft)
    for z in (5.95, 7.10):
        arm = kit.cube("arm", (1.42, 0.075, 0.075), (0, 0, z), (0, math.radians(1.6), 0))
        kit.bevel(arm, 0.010, 2, 45)
        kit.assign(arm, iron)
        parts.append(arm)
        for x in (-0.60, -0.18, 0.26, 0.64):
            ins = kit.lathe("ins", [
                (0.0, 0.0), (0.030, 0.0), (0.034, 0.030), (0.022, 0.044),
                (0.044, 0.056), (0.046, 0.078), (0.024, 0.092), (0.0, 0.096)],
                segments=12, close=True)
            ins.location = (x, 0, z + 0.04)
            kit.shade_smooth(ins, 45)
            kit.assign(ins, porcelain)
            parts.append(ins)
    jbox = kit.cube("jbox", (0.30, 0.22, 0.46), (0, -0.16, 3.05))
    kit.bevel(jbox, 0.016, 2, 50)
    kit.assign(jbox, kit.material("PoleBox", kit.hexcolor('#8d8f86'), 0.8))
    parts.append(jbox)
    for i in range(5):
        step = kit.cube("step", (0.013, 0.22, 0.013), (0.09, 0, 1.5 + i * 0.55))
        kit.assign(step, iron)
        parts.append(step)
    for p in parts:
        kit.apply_all(p)
    return kit.join("UtilityPole", parts)


def awning():
    """A sagging canvas on a steel frame, with a scalloped valance. The sag is
    the whole point: a flat plank reads as plastic."""
    canvas = kit.material("AwningCanvas", kit.hexcolor('#22384e'), 0.95, sheen=0.4)
    stripe = kit.material("AwningStripe", kit.hexcolor('#2d4a63'), 0.95, sheen=0.4)
    iron = kit.material("AwningFrame", kit.hexcolor('#37403d'), 0.55, 0.6)
    parts = []
    span, reach, drop = 4.6, 1.75, 0.46
    for i in range(9):                                     # alternating panels
        x0 = -span / 2 + i * span / 9
        sheet = kit.plane(f"panel{i}", span / 9 - 0.004, 1.0)
        kit.apply_all(kit.active(sheet))
        mod = sheet.modifiers.new("g", 'SUBSURF')
        mod.levels = mod.render_levels = 4
        mod.subdivision_type = 'SIMPLE'
        kit.apply_all(sheet)
        for v in sheet.data.vertices:
            t = v.co.y + 0.5                               # 0 at wall, 1 at edge
            u = v.co.x
            v.co.y = t * reach
            v.co.z = -drop * t - 0.085 * math.sin(math.pi * t) \
                - 0.030 * math.sin(math.pi * (u / (span / 9) + 0.5))
        sheet.location = (x0 + span / 18, 0, 0)
        kit.solidify(sheet, 0.014, 0.0)
        kit.apply_all(sheet)
        kit.shade_smooth(sheet, 50)
        kit.assign(sheet, stripe if i % 2 else canvas)
        parts.append(sheet)
    # scalloped valance hanging from the front edge
    for i in range(9):
        x0 = -span / 2 + i * span / 9 + span / 18
        sc = kit.lathe(f"scallop{i}", [
            (0.0, 0.0), (span / 18 - 0.004, 0.0), (span / 20, -0.12),
            (0.0, -0.165)], segments=10, close=True)
        sc.rotation_euler = (math.radians(90), 0, 0)
        sc.location = (x0, reach, -drop)
        kit.apply_all(kit.active(sc))
        kit.assign(sc, stripe if i % 2 else canvas)
        parts.append(sc)
    front = kit.tube_along("awningbar", [
        (-span / 2, reach, -drop - 0.01), (0, reach, -drop - 0.035),
        (span / 2, reach, -drop - 0.01)], radius=0.022, segments=8)
    kit.assign(front, iron)
    parts.append(front)
    for x in (-span / 2 + 0.12, 0.0, span / 2 - 0.12):
        stay = kit.tube_along("stay", [(x, 0.03, 0.10), (x, reach * 0.55, -drop * 0.42),
                                       (x, reach - 0.02, -drop - 0.02)],
                              radius=0.014, segments=6)
        kit.assign(stay, iron)
        parts.append(stay)
    for p in parts:
        kit.apply_all(p)
    return kit.join("Awning", parts)


def planter():
    terracotta = kit.material("Terracotta", kit.hexcolor('#a9623f'), 0.88)
    soil = kit.material("Soil", kit.hexcolor('#43342a'), 0.98)
    parts = []
    pot = kit.lathe("pot", [
        (0.000, 0.000), (0.112, 0.000), (0.118, 0.022), (0.140, 0.120),
        (0.168, 0.255), (0.172, 0.282), (0.192, 0.292), (0.196, 0.318),
        (0.178, 0.330), (0.172, 0.300), (0.164, 0.262), (0.138, 0.120),
        (0.116, 0.030), (0.000, 0.028)], segments=24)
    kit.jitter(pot, 0.0022, seed=61)
    kit.shade_smooth(pot, 42)
    kit.assign(pot, terracotta)
    parts.append(pot)
    dirt = kit.lathe("soil", [(0.0, 0.302), (0.10, 0.298), (0.158, 0.288)],
                     segments=20, close=True)
    kit.jitter(dirt, 0.004, seed=62)
    kit.assign(dirt, soil)
    parts.append(dirt)
    for p in parts:
        kit.apply_all(p)
    return kit.join("Planter", parts)


def shrub():
    """Leaf cards on real stems. A silhouette with points, not green spheres."""
    rng = random.Random(90)
    greens = [kit.material("Leaf%d" % i, kit.hexcolor(c), 0.74, sheen=0.3)
              for i, c in enumerate(('#4f7a4a', '#5f8b50', '#3d6442', '#769264'))]
    stemmat = kit.material("Stem", kit.hexcolor('#5c6b47'), 0.88)
    parts = []
    template = kit.leaf("leaftemplate", 0.105, 0.040, 0.30)
    kit.solidify(template, 0.0016)
    kit.apply_all(template)
    kit.shade_smooth(template, 50)
    for s in range(6):
        a = kit.TAU * s / 6 + rng.uniform(-0.3, 0.3)
        lean = rng.uniform(0.22, 0.52)
        tipx = math.cos(a) * lean
        tipy = math.sin(a) * lean
        height = rng.uniform(0.42, 0.78)
        stem = kit.tube_along(f"stem{s}", [
            (0, 0, 0.0), (tipx * 0.35, tipy * 0.35, height * 0.5),
            (tipx, tipy, height)], radius=0.009, segments=6)
        kit.assign(stem, stemmat)
        parts.append(stem)
        for k in range(5):
            t = 0.30 + k * 0.165
            pos = (tipx * t + rng.uniform(-0.03, 0.03),
                   tipy * t + rng.uniform(-0.03, 0.03),
                   height * t)
            lf = kit.duplicate(template, f"leaf{s}{k}", pos,
                               (rng.uniform(-0.9, 0.3),
                                rng.uniform(-0.5, 0.5),
                                a + rng.uniform(-1.4, 1.4)),
                               rng.uniform(0.74, 1.18))
            kit.assign(lf, greens[(s + k) % len(greens)])
            parts.append(lf)
    import bpy
    bpy.data.objects.remove(template, do_unlink=True)
    for p in parts:
        kit.apply_all(p)
    return kit.join("Shrub", parts)


def chair():
    """A bentwood-ish bistro chair for the side street - read at distance."""
    frame = kit.material("ChairFrame", kit.hexcolor('#6a4a33'), 0.6, 0.15)
    weave = kit.material("ChairWeave", kit.hexcolor('#b59557'), 0.85)
    parts = []
    seat = kit.lathe("seat", [(0.0, 0.44), (0.17, 0.438), (0.205, 0.432),
                              (0.212, 0.414), (0.188, 0.408), (0.0, 0.410)],
                     segments=18, close=True)
    seat.scale = (1.0, 0.92, 1.0)
    kit.apply_all(kit.active(seat))
    kit.shade_smooth(seat, 45)
    kit.assign(seat, weave)
    parts.append(seat)
    for sx, sy in ((1, 1), (-1, 1), (1, -1), (-1, -1)):
        leg = kit.tube_along("leg", [
            (sx * 0.145, sy * 0.135, 0.43),
            (sx * 0.175, sy * 0.165, 0.22),
            (sx * 0.205, sy * 0.190, 0.0)], radius=0.014, segments=6)
        kit.assign(leg, frame)
        parts.append(leg)
    back = kit.tube_along("back", [
        (-0.16, -0.12, 0.43), (-0.175, -0.20, 0.70), (-0.06, -0.235, 0.86),
        (0.06, -0.235, 0.86), (0.175, -0.20, 0.70), (0.16, -0.12, 0.43)],
        radius=0.015, segments=8)
    kit.assign(back, frame)
    parts.append(back)
    slat = kit.tube_along("slat", [
        (-0.15, -0.195, 0.655), (0.0, -0.212, 0.665), (0.15, -0.195, 0.655)],
        radius=0.012, segments=6)
    kit.assign(slat, frame)
    parts.append(slat)
    for p in parts:
        kit.apply_all(p)
    return kit.join("Chair", parts)


def round_sign():
    post = kit.material("SignPost", kit.hexcolor('#787f7c'), 0.6, 0.45)
    white = kit.material("SignFace", kit.hexcolor('#ece6da'), 0.68)
    red = kit.material("SignRed", kit.hexcolor('#a8323c'), 0.6)
    parts = []
    pole = kit.lathe("signpost", [(0.0, 0.0), (0.040, 0.0), (0.036, 3.05), (0.0, 3.07)],
                     segments=12, close=True)
    kit.shade_smooth(pole, 40)
    kit.assign(pole, post)
    parts.append(pole)
    disc = kit.cylinder("disc", 0.30, 0.028, 32, (0, 0.02, 2.72),
                        (math.radians(90), 0, 0))
    kit.bevel(disc, 0.006, 2, 40)
    kit.shade_smooth(disc, 40)
    kit.assign(disc, white)
    parts.append(disc)
    face = kit.cylinder("face", 0.258, 0.030, 32, (0, -0.004, 2.72),
                        (math.radians(90), 0, 0))
    kit.assign(face, red)
    parts.append(face)
    bar = kit.cube("bar", (0.40, 0.034, 0.072), (0, -0.022, 2.72))
    kit.bevel(bar, 0.008, 2, 40)
    kit.assign(bar, white)
    parts.append(bar)
    for p in parts:
        kit.apply_all(p)
    return kit.join("RoundSign", parts)


def ashtray():
    tin = kit.material("AshTin", kit.hexcolor('#8e897c'), 0.42, 0.72)
    body = kit.lathe("Ashtray", [
        (0.000, 0.000), (0.052, 0.000), (0.055, 0.006), (0.058, 0.024),
        (0.060, 0.030), (0.054, 0.032), (0.050, 0.020), (0.044, 0.010),
        (0.000, 0.009)], segments=20, close=True)
    kit.jitter(body, 0.0006, seed=71)
    kit.shade_smooth(body, 44)
    kit.assign(body, tin)
    kit.apply_all(body)
    return body


def sugar():
    """A small glass of sugar sachets - the detail that says somebody works here."""
    glass = kit.material("SugarGlass", kit.hexcolor('#cfd9d4'), 0.08, 0.0, alpha=0.55)
    papermat = kit.material("Sachet", kit.hexcolor('#e8dfc8'), 0.92)
    parts = []
    tumbler = kit.lathe("tumbler", [
        (0.000, 0.000), (0.030, 0.000), (0.032, 0.008), (0.034, 0.070),
        (0.036, 0.086), (0.033, 0.086), (0.031, 0.070), (0.029, 0.010),
        (0.000, 0.006)], segments=24)
    kit.shade_smooth(tumbler, 46)
    kit.assign(tumbler, glass)
    parts.append(tumbler)
    rng = random.Random(5)
    for i in range(5):
        s = kit.cube(f"sachet{i}", (0.022, 0.042, 0.004),
                     (rng.uniform(-0.012, 0.012), rng.uniform(-0.010, 0.010),
                      0.055 + i * 0.012),
                     (rng.uniform(-0.5, 0.5), rng.uniform(-0.4, 0.4),
                      rng.uniform(-1.4, 1.4)))
        kit.bevel(s, 0.0008, 1, 45)
        kit.assign(s, papermat)
        parts.append(s)
    for p in parts:
        kit.apply_all(p)
    return kit.join("SugarGlass", parts)


BUILDERS = {
    "Bollard": bollard,
    "UtilityPole": utility_pole,
    "Awning": awning,
    "Planter": planter,
    "Shrub": shrub,
    "Chair": chair,
    "RoundSign": round_sign,
    "Ashtray": ashtray,
    "SugarGlass": sugar,
}
