"""
Café Almar - the weathered red metal table.

Reference: the rectangular pressed-steel pavement tables outside Jaffa
cafés. A single folded sheet-steel top with a downturned lip, welded to a
folded angle-iron frame on four splayed square-tube legs. The paint is an
enamel that chips at the lip and the corners, not uniformly across the field.
"""
import math
from mathutils import Vector
import kit

W, D = 0.86, 0.66          # top, metres
TOP_H = 0.745              # standing height of the tabletop
SHEET = 0.009              # pressed-steel sheet thickness
LIP = 0.030                # downturned edge


def build():
    enamel = kit.material("TableEnamel", kit.hexcolor('#9d3b33'), 0.58, 0.10)
    steel = kit.material("TableSteel", kit.hexcolor('#4a4a4b'), 0.52, 0.78)
    rust = kit.material("TableRust", kit.hexcolor('#8a5236'), 0.88, 0.22)
    parts = []

    # --- top: a dished sheet, not a slab. The slight crown and the warped
    # corners are what read as "thin metal that has sat outside for years".
    top = kit.cube("top", (W, D, SHEET), (0, 0, TOP_H - SHEET / 2))
    kit.apply_all(kit.active(top))
    mod = top.modifiers.new("grid", 'SUBSURF')
    mod.levels = mod.render_levels = 4
    mod.subdivision_type = 'SIMPLE'
    kit.apply_all(top)
    for v in top.data.vertices:
        if v.co.z > TOP_H - SHEET * 0.9:
            # gentle crown plus a long shallow dent across one corner
            u, w = v.co.x / (W / 2), v.co.y / (D / 2)
            v.co.z += 0.0022 * (1 - u * u) * (1 - w * w)
            v.co.z -= 0.0019 * math.exp(-((u - 0.55) ** 2 + (w - 0.5) ** 2) / 0.22)
    kit.jitter(top, 0.0004, seed=4)
    kit.bevel(top, 0.0022, 2, 40)
    kit.assign(top, enamel)
    parts.append(top)

    # --- downturned lip around all four sides, with the corners folded and
    # slightly open the way real pressed tables are.
    for sx, length, horizontal in ((0, W, True), (1, D, False)):
        for sign in (-1, 1):
            # Flush with the outer edge of the sheet, so the top and the
            # lip read as one folded piece of steel.
            if horizontal:
                loc = (0, sign * (D / 2 - SHEET * 0.6), TOP_H - LIP / 2 - SHEET * 0.4)
                size = (W, SHEET * 1.2, LIP)
            else:
                loc = (sign * (W / 2 - SHEET * 0.6), 0, TOP_H - LIP / 2 - SHEET * 0.4)
                size = (SHEET * 1.2, D, LIP)
            rail = kit.cube(f"lip{sx}{sign}", size, loc)
            kit.apply_all(kit.active(rail))
            kit.jitter(rail, 0.0006, seed=11 + sx * 3 + sign)
            kit.bevel(rail, 0.0028, 2, 45)
            kit.assign(rail, enamel)
            parts.append(rail)

    # --- angle-iron frame under the sheet; visible from a seated eye line.
    for sign in (-1, 1):
        rail = kit.cube("frameX%d" % sign, (W - 0.09, 0.028, 0.030),
                        (0, sign * (D / 2 - 0.075), TOP_H - 0.044))
        kit.bevel(rail, 0.002, 1, 50)
        kit.assign(rail, steel)
        parts.append(rail)
        rail = kit.cube("frameY%d" % sign, (0.028, D - 0.09, 0.030),
                        (sign * (W / 2 - 0.075), 0, TOP_H - 0.044))
        kit.bevel(rail, 0.002, 1, 50)
        kit.assign(rail, steel)
        parts.append(rail)

    # --- four splayed square-tube legs, each leaning out a little differently.
    leans = ((0.016, 0.012), (-0.014, 0.015), (0.013, -0.017), (-0.017, -0.011))
    for i, (sx, sy) in enumerate(((1, 1), (-1, 1), (1, -1), (-1, -1))):
        x0 = sx * (W / 2 - 0.085)
        y0 = sy * (D / 2 - 0.080)
        lean_x, lean_y = leans[i]
        leg = kit.tube_along(
            f"leg{i}",
            [(x0, y0, TOP_H - 0.045),
             (x0 + lean_x * 0.4, y0 + lean_y * 0.4, TOP_H * 0.60),
             (x0 + lean_x, y0 + lean_y, 0.013)],
            radius=0.0135, segments=8, smooth=True)
        kit.assign(leg, steel)
        parts.append(leg)
        foot = kit.cylinder(f"foot{i}", 0.0165, 0.016, 14,
                            (x0 + lean_x, y0 + lean_y, 0.008))
        kit.bevel(foot, 0.003, 2, 40)
        kit.assign(foot, kit.material("TableFoot", kit.hexcolor('#2b2a28'), 0.95))
        parts.append(foot)

    # --- cross-brace: the detail that makes a table read as welded rather
    # than as four cylinders placed near a box.
    for axis in (0, 1):
        for sign in (-1, 1):
            if axis == 0:
                a = (-(W / 2 - 0.082), sign * (D / 2 - 0.074), 0.215)
                b = ((W / 2 - 0.082), sign * (D / 2 - 0.074), 0.215)
            else:
                a = (sign * (W / 2 - 0.082), -(D / 2 - 0.074), 0.215)
                b = (sign * (W / 2 - 0.082), (D / 2 - 0.074), 0.215)
            mid = tuple((a[k] + b[k]) / 2 + (0, 0, -0.006)[k] for k in range(3))
            brace = kit.tube_along(f"brace{axis}{sign}", [a, mid, b], 0.0075, 6)
            kit.assign(brace, steel)
            parts.append(brace)

    # --- welded corner gussets and a rust bloom where water collects.
    for sx, sy in ((1, 1), (-1, 1), (1, -1), (-1, -1)):
        g = kit.cube("gusset", (0.055, 0.055, 0.008),
                     (sx * (W / 2 - 0.085), sy * (D / 2 - 0.080), TOP_H - 0.030),
                     (0, 0, math.radians(45)))
        kit.bevel(g, 0.004, 2, 40)
        kit.assign(g, steel)
        parts.append(g)
    # Rust blooms where water sits: the underside of the lip on the shaded
    # side, and one corner where the enamel has lifted.
    for bx, bw, seed in ((-W / 2 + 0.19, 0.13, 77), (0.12, 0.08, 78),
                         (W / 2 - 0.12, 0.10, 79)):
        bloom = kit.cube("rustbloom", (bw, SHEET * 0.9, LIP * 0.62),
                         (bx, -(D / 2 - SHEET * 0.6) - 0.0010,
                          TOP_H - LIP * 0.62 - SHEET * 0.4))
        kit.apply_all(kit.active(bloom))
        kit.jitter(bloom, 0.0020, seed=seed)
        kit.bevel(bloom, 0.0016, 1, 50)
        kit.assign(bloom, rust)
        parts.append(bloom)

    for part in parts:
        kit.apply_all(part)
        kit.shade_smooth(part, 38)
    merged = kit.join("CafeTable", parts)
    # One planar projection over the whole table: the top lands exactly on
    # 0..1 of the wear map, and the downturned lip samples the dense chipping
    # at the border of that map - which is where a real table is knocked.
    kit.planar_uv(merged, W, D)
    return merged
