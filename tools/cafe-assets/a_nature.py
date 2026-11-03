"""
Café Apollo - the planting.

Three pieces carry most of the reference image's warmth and none of them are
scenery you look at directly:

  canopy        hangs above and behind the seated viewer. Its job is the
                dappled leaf shadow thrown across the white plaster, which is
                what makes the light read as a real morning rather than a
                lamp. Only its outer edge is ever in frame.
  bougainvillea overhangs the top of the frame. A magenta spray against white
                plaster and blue sky is the single strongest colour note in
                the reference.
  vine          climbs the corner building and softens its vertical edges.

All three are leaf cards on swept branches. Cards beat spheres here for the
same reason everywhere else: a silhouette with points reads as foliage, and a
cluster of spheres reads as a cluster of spheres.
"""
import math
import random

import kit


def _branch(parent_pts, radius, material, name):
    limb = kit.tube_along(name, parent_pts, radius=radius, segments=7)
    kit.assign(limb, material)
    return limb


def _scatter_leaves(parts, template, greens, rng, start, end, clusters,
                    per_cluster=7, spread=0.16, scale=(0.8, 1.25), droop=0.0):
    """Leaves in rosettes along a branch rather than evenly spaced along it.
    Real foliage reads as overlapping masses with gaps between them; evenly
    scattered cards read as a bare twig with confetti on it, which is exactly
    how the first version looked."""
    for i in range(clusters):
        t = (i + 0.5) / clusters + rng.uniform(-0.05, 0.05)
        base = [start[k] + (end[k] - start[k]) * t for k in range(3)]
        # the cluster itself sits off the branch line, not on it
        centre = (base[0] + rng.uniform(-spread, spread) * 1.6,
                  base[1] + rng.uniform(-spread, spread) * 1.6,
                  base[2] + rng.uniform(-spread * 0.7, spread * 0.4)
                  - droop * t)
        for _ in range(per_cluster + rng.randint(-2, 3)):
            pos = (centre[0] + rng.gauss(0, spread * 0.42),
                   centre[1] + rng.gauss(0, spread * 0.42),
                   centre[2] + rng.gauss(0, spread * 0.30))
            leaf = kit.duplicate(template, f"lf{len(parts)}", pos,
                                 (rng.uniform(-1.5, 0.4),
                                  rng.uniform(-math.pi, math.pi),
                                  rng.uniform(-math.pi, math.pi)),
                                 rng.uniform(*scale))
            kit.assign(leaf, greens[rng.randrange(len(greens))])
            parts.append(leaf)


def canopy():
    """A limb of a street tree, leaning out over the pavement. Dense enough
    that its shadow breaks into separate leaf shapes rather than one blob."""
    rng = random.Random(404)
    bark = kit.material("TreeBark", kit.hexcolor('#6b5a46'), 0.92)
    greens = [kit.material("Canopy%d" % i, kit.hexcolor(c), 0.70, sheen=0.35)
              for i, c in enumerate(('#4e7c42', '#5f8f4c', '#3f6a3c',
                                     '#79a258', '#456f3f'))]
    parts = []

    trunk = _branch([(0, 0, 0), (0.08, 0, 1.3), (0.02, 0.05, 2.5),
                     (-0.10, 0.02, 3.4)], 0.105, bark, "trunk")
    parts.append(trunk)

    template = kit.leaf("leaftpl", 0.205, 0.092, 0.26, segments=5)
    kit.apply_all(template)
    kit.shade_smooth(template, 50)

    # Limbs fan outward and slightly down, the way a street tree spreads once
    # it clears the awnings.
    for i in range(10):
        a = kit.TAU * i / 10 + rng.uniform(-0.28, 0.28)
        reach = rng.uniform(1.5, 2.6)
        lift = rng.uniform(0.35, 0.95)
        tip = (math.cos(a) * reach, math.sin(a) * reach, 3.1 + lift)
        mid = (math.cos(a) * reach * 0.45, math.sin(a) * reach * 0.45,
               3.2 + lift * 0.75)
        parts.append(_branch([(-0.08, 0.02, 3.0), mid, tip],
                             0.038, bark, f"limb{i}"))
        _scatter_leaves(parts, template, greens, rng, mid, tip, 7,
                        per_cluster=9, spread=0.46, scale=(0.80, 1.45),
                        droop=0.14)
        # a secondary fork, so the mass is not a single even shell
        fork = (tip[0] * 0.72 + rng.uniform(-0.4, 0.4),
                tip[1] * 0.72 + rng.uniform(-0.4, 0.4),
                tip[2] - rng.uniform(0.2, 0.6))
        parts.append(_branch([mid, fork], 0.024, bark, f"fork{i}"))
        _scatter_leaves(parts, template, greens, rng, mid, fork, 5,
                        per_cluster=8, spread=0.40, scale=(0.72, 1.25),
                        droop=0.18)

    kit.remove(template)
    for part in parts:
        kit.apply_all(part)
    return kit.join("Canopy", parts)


def bougainvillea():
    """A spray of bracts on a woody stem. The bracts are papery triangles in
    threes, which is what gives bougainvillea its particular ragged mass."""
    rng = random.Random(77)
    wood = kit.material("VineWood", kit.hexcolor('#7a6450'), 0.94)
    leafmat = [kit.material("BougLeaf%d" % i, kit.hexcolor(c), 0.74, sheen=0.3)
               for i, c in enumerate(('#3f6b3c', '#4f7d45'))]
    bracts = [kit.material("Bract%d" % i, kit.hexcolor(c), 0.62, sheen=0.5)
              for i, c in enumerate(('#c9306f', '#d9507f', '#b82a63',
                                     '#e06a94'))]
    parts = []

    spine = _branch([(0, 0, 0), (0.9, 0.15, -0.25), (1.8, 0.05, -0.55),
                     (2.6, -0.15, -1.05)], 0.045, wood, "spine")
    parts.append(spine)

    bract = kit.leaf("bracttpl", 0.082, 0.064, 0.12, segments=3)
    kit.apply_all(bract)
    leaftpl = kit.leaf("bleaf", 0.105, 0.062, 0.22, segments=4)
    kit.apply_all(leaftpl)

    for i in range(14):
        t = (i + 0.5) / 14
        base = (2.6 * t, 0.15 * math.sin(t * 3.1), -1.05 * t * t)
        stem_tip = (base[0] + rng.uniform(-0.25, 0.25),
                    base[1] + rng.uniform(-0.35, 0.35),
                    base[2] - rng.uniform(0.25, 0.7))
        parts.append(_branch([base, stem_tip], 0.016, wood, f"bstem{i}"))
        # bracts in threes, the way the plant actually sets them
        for k in range(rng.randint(11, 17)):
            pos = (stem_tip[0] + rng.gauss(0, 0.17),
                   stem_tip[1] + rng.gauss(0, 0.17),
                   stem_tip[2] + rng.gauss(0, 0.15))
            spin = rng.uniform(0, kit.TAU)
            for j in range(3):
                petal = kit.duplicate(
                    bract, f"br{i}{k}{j}", pos,
                    (rng.uniform(-1.2, -0.2), spin + j * kit.TAU / 3,
                     rng.uniform(-0.4, 0.4)), rng.uniform(0.8, 1.35))
                kit.assign(petal, bracts[rng.randrange(len(bracts))])
                parts.append(petal)
        _scatter_leaves(parts, leaftpl, leafmat, rng, base, stem_tip, 3,
                        per_cluster=6, spread=0.20, scale=(0.8, 1.25))

    kit.remove(bract)
    kit.remove(leaftpl)
    for part in parts:
        kit.apply_all(part)
    return kit.join("Bougainvillea", parts)


def vine():
    """A climber for the corner building, to break its vertical edges."""
    rng = random.Random(132)
    wood = kit.material("VineWood", kit.hexcolor('#7a6450'), 0.94)
    greens = [kit.material("VineLeaf%d" % i, kit.hexcolor(c), 0.72, sheen=0.3)
              for i, c in enumerate(('#44703f', '#56854a', '#35603a'))]
    parts = []
    template = kit.leaf("vleaf", 0.125, 0.088, 0.24, segments=4)
    kit.apply_all(template)

    for s in range(3):
        x0 = (s - 1) * 0.35
        pts = [(x0, 0, 0)]
        for k in range(1, 7):
            pts.append((x0 + math.sin(k * 1.1 + s) * 0.30,
                        rng.uniform(-0.04, 0.06), k * 0.62))
        parts.append(_branch(pts, 0.022, wood, f"vstem{s}"))
        for k in range(len(pts) - 1):
            _scatter_leaves(parts, template, greens, rng, pts[k], pts[k + 1],
                            3, per_cluster=7, spread=0.22, scale=(0.78, 1.3))

    kit.remove(template)
    for part in parts:
        kit.apply_all(part)
    return kit.join("Vine", parts)


BUILDERS = {
    "Canopy": canopy,
    "Bougainvillea": bougainvillea,
    "Vine": vine,
}
