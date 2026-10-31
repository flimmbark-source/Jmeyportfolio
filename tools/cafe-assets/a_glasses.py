"""
Café Almar - the sunglasses lying on the table.

The recognisable silhouette comes from three things: a flattened, slightly
cat-eyed rim rather than a circle; temple arms folded so one crosses the
other; and lenses that sit inside the rim with a shallow dome, so they catch
a highlight instead of reading as two dark holes.
"""
import math
import kit

LENS_RX, LENS_RY = 0.0268, 0.0208
SEP = 0.0310               # half the distance between lens centres


def rim_shape(rx, ry, n=30, tilt=0.0):
    pts = []
    for i in range(n):
        a = kit.TAU * i / n
        x = rx * math.cos(a)
        y = ry * math.sin(a)
        if y > 0:
            y *= 0.90                      # flatter brow line
            x *= 1.0 + 0.10 * max(0.0, math.sin(a))   # slight cat-eye lift
        pts.append((x, y * 1.0, tilt * x))
    return pts


def build():
    frame = kit.material("GlassFrame", kit.hexcolor('#33241b'), 0.22, 0.0,
                         clearcoat=0.9)
    lens = kit.material("GlassLens", kit.hexcolor('#241f1c'), 0.06, 0.30,
                        alpha=0.80, clearcoat=1.0)
    metal = kit.material("GlassHinge", kit.hexcolor('#9a8a62'), 0.28, 0.9)
    parts = []

    # A flattened rectangular bevel profile: acetate frames are wide and thin
    # in section, which is why a plain torus never looks like eyewear.
    section = kit.profile_curve("rimsection", [
        (-0.0042, -0.0022), (0.0042, -0.0026),
        (0.0042, 0.0026), (-0.0042, 0.0022)])

    for sign in (-1, 1):
        cx = sign * SEP
        pts = [(x + cx, y, z) for x, y, z in rim_shape(LENS_RX, LENS_RY, 30,
                                                       tilt=0.06 * sign)]
        rim = kit.tube_along(f"rim{sign}", pts, cyclic=True, profile=section)
        kit.bevel(rim, 0.0008, 2, 40)
        kit.apply_all(rim)
        kit.shade_smooth(rim, 44)
        kit.assign(rim, frame)
        parts.append(rim)

        # Lens: a shallow dome, inset behind the rim face.
        dome = kit.uvsphere(f"lens{sign}", 0.030, 26, 14)
        kit.apply_all(kit.active(dome))
        for v in dome.data.vertices:
            v.co.z = max(v.co.z, 0.0)
        dome.scale = (LENS_RX / 0.030 * 1.03, LENS_RY / 0.030 * 1.00, 0.075)
        dome.location = (cx, 0.0, -0.0004)
        kit.apply_all(kit.active(dome))
        kit.shade_smooth(dome, 60)
        kit.assign(dome, lens)
        parts.append(dome)

    # Bridge: a keyhole arc, not a straight bar.
    bridge = kit.tube_along("bridge", [
        (-SEP + LENS_RX * 0.70, 0.0085, 0.0012),
        (-0.0085, 0.0138, 0.0026), (0.0, 0.0146, 0.0028),
        (0.0085, 0.0138, 0.0026),
        (SEP - LENS_RX * 0.70, 0.0085, 0.0012)], radius=0.0030, segments=10)
    kit.shade_smooth(bridge, 44)
    kit.assign(bridge, frame)
    parts.append(bridge)

    # Hinges and folded temple arms. The arms cross; that crossing is most of
    # what makes a pair of sunglasses readable from above.
    for i, sign in enumerate((-1, 1)):
        hinge = kit.cube(f"hinge{sign}", (0.0062, 0.0042, 0.0030),
                         (sign * (SEP + LENS_RX * 0.86), LENS_RY * 0.44, 0.0016),
                         (0, 0, math.radians(-14 * sign)))
        kit.bevel(hinge, 0.0007, 2, 40)
        kit.assign(hinge, metal)
        parts.append(hinge)

        lift = 0.0040 if i == 0 else 0.0            # one arm rests on the other
        arm = kit.tube_along(f"arm{sign}", [
            (sign * (SEP + LENS_RX * 0.88), LENS_RY * 0.36, 0.0016 + lift),
            (sign * (SEP + LENS_RX * 0.62), -LENS_RY * 0.70, 0.0018 + lift),
            (sign * (SEP * 0.50), -LENS_RY * 2.30, 0.0020 + lift),
            (-sign * (SEP * 0.22), -LENS_RY * 3.60, 0.0021 + lift),
            (-sign * (SEP * 0.62), -LENS_RY * 4.20, 0.0019 + lift)],
            radius=0.0023, segments=8)
        kit.shade_smooth(arm, 44)
        kit.assign(arm, frame)
        parts.append(arm)

        tip = kit.uvsphere(f"tip{sign}", 0.0031, 12, 8,
                           (-sign * (SEP * 0.64), -LENS_RY * 4.26, 0.0019 + lift))
        tip.scale = (1.0, 1.5, 0.8)
        kit.shade_smooth(tip, 50)
        kit.assign(tip, frame)
        parts.append(tip)

    for part in parts:
        kit.apply_all(part)
    merged = kit.join("Sunglasses", parts)
    kit.smart_uv(merged)
    return merged
