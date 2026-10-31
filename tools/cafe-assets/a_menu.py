"""
Café Almar - the physical menu.

A stapled-and-taped card menu of the kind a small street café actually owns:
slightly oversized boards, a cloth tape spine, a block of pages whose fore
edge is visibly uneven, soft corners, and a cover that no longer lies flat.
It is a bound object with weight - never a rectangle with a word on it.
"""
import math
import kit

W, H = 0.206, 0.292        # a generous bistro card, a touch over A5
BOARD = 0.0021
PAGES = 6


def warp(obj, amount, seed, axis='x'):
    """Card that has lived outdoors cups slightly along its long axis."""
    kit.apply_all(kit.active(obj))
    # Level 3 is enough resolution for a card that cups by two millimetres,
    # and keeps the whole menu under a quarter of a megabyte.
    mod = obj.modifiers.new("grid", 'SUBSURF')
    mod.levels = mod.render_levels = 3
    mod.subdivision_type = 'SIMPLE'
    kit.apply_all(obj)
    # Mean-zero so the board cups instead of tenting away from the stack.
    for v in obj.data.vertices:
        u = v.co.x / (W / 2)
        w = v.co.y / (H / 2)
        v.co.z += amount * (u * u * 0.62 + w * w * 0.38 - 0.33)
    kit.jitter(obj, 0.00022, seed=seed)
    return obj


def build():
    # Only the front board carries the printed artwork; the back is plain
    # board, so the cover map is never mirrored onto the underside.
    cover = kit.material("MenuCover", kit.hexcolor('#ffffff'), 0.80)
    board = kit.material("MenuBoard", kit.hexcolor('#b8a177'), 0.86)
    paper = kit.material("MenuPaper", kit.hexcolor('#efe6d2'), 0.92)
    tape = kit.material("MenuSpine", kit.hexcolor('#8d4f3c'), 0.82)
    brass = kit.material("MenuBrass", kit.hexcolor('#9d8148'), 0.34, 0.85)
    parts = []

    # --- page block: individually offset sheets so the fore edge reads as
    # paper rather than as one extruded rectangle.
    import random
    rng = random.Random(21)
    for i in range(PAGES):
        t = i / (PAGES - 1)
        sheet = kit.cube(f"page{i}", (W - 0.011 - rng.uniform(0, 0.005),
                                      H - 0.010 - rng.uniform(0, 0.005), 0.0007),
                         (0.0012 + rng.uniform(-0.0014, 0.0014),
                          rng.uniform(-0.0016, 0.0016),
                          BOARD + 0.0010 + i * 0.00098),
                         (0, 0, rng.uniform(-0.010, 0.010)))
        warp(sheet, 0.0009 + 0.0006 * t, seed=40 + i)
        kit.bevel(sheet, 0.0004, 1, 60)
        kit.assign(sheet, paper)
        parts.append(sheet)

    # --- back board and front board. The front sits a touch proud and lifted
    # at the fore edge, which gives the whole object a shadow line.
    back = kit.cube("back", (W, H, BOARD), (0, 0, BOARD / 2))
    warp(back, 0.0013, seed=5)
    kit.bevel(back, 0.0013, 3, 55)
    kit.assign(back, board)
    parts.append(back)

    front = kit.cube("front", (W, H, BOARD),
                     (0.0012, 0.0006, BOARD + PAGES * 0.00098 + 0.0016),
                     (math.radians(-0.5), math.radians(0.7), math.radians(-0.8)))
    warp(front, 0.0019, seed=6)
    kit.bevel(front, 0.0015, 3, 55)
    kit.assign(front, cover)
    parts.append(front)

    # --- cloth tape wrapped round the spine, creased over both boards.
    spine_x = -W / 2
    tape_w = 0.022
    for side, z in (("b", BOARD * 0.5 - 0.0014),
                    ("f", BOARD + PAGES * 0.00098 + 0.0016 + BOARD * 0.5 + 0.0012)):
        flap = kit.cube(f"tape{side}", (tape_w, H - 0.006, 0.0008),
                        (spine_x + tape_w / 2 + 0.0008, 0.0, z))
        kit.bevel(flap, 0.0004, 1, 50)
        kit.assign(flap, tape)
        parts.append(flap)
    wrap = kit.tube_along("tapewrap", [
        (spine_x + 0.0015, -H / 2 + 0.003, (BOARD + PAGES * 0.00098) / 2),
        (spine_x - 0.0020, 0.0, (BOARD + PAGES * 0.00098) / 2 + 0.0008),
        (spine_x + 0.0015, H / 2 - 0.003, (BOARD + PAGES * 0.00098) / 2)],
        radius=(BOARD + PAGES * 0.00098) / 2 + 0.0022, segments=8)
    wrap.scale = (0.50, 1.0, 1.0)
    kit.apply_all(kit.active(wrap))
    kit.assign(wrap, tape)
    parts.append(wrap)

    # --- two brass staples through the spine: small, cheap, convincing.
    for y in (-0.055, 0.058):
        staple = kit.cube("staple", (0.0125, 0.0022, 0.0010),
                          (spine_x + 0.016, y,
                           BOARD + PAGES * 0.00098 + 0.0034))
        kit.bevel(staple, 0.0004, 1, 45)
        kit.assign(staple, brass)
        parts.append(staple)

    for part in parts:
        kit.apply_all(part)
        kit.shade_smooth(part, 42)

    # The cover board is projected straight down into 0..1 so the printed
    # artwork lands square on it at the right size and orientation.
    kit.planar_uv(front, W, H, flip=True)
    merged = kit.join("CafeMenu", parts)
    return merged
