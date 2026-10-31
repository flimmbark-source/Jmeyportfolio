"""
Café Almar - the white plaster corner building.

The reference is a near-frontal whitewashed corner block with a barred ground
floor window, a transom above it, a service door, and a side street that peels
away to the left. What turns a white box into architecture is the profile
work: a moulded cornice, a string course, a deep window reveal with a
projecting sill, and the pipework and conduit that real buildings accumulate.
"""
import math
import kit

WIDTH, HEIGHT, DEPTH = 15.6, 7.6, 1.1
FACE_Z = 0.0               # the façade plane; the block runs back in -Z


def moulding(name, length, section, location, rotation=(0, 0, 0)):
    """A cornice / sill / plinth run. `section` is given in (y, z) with y
    projecting out of the façade and z running up it."""
    return kit.extrude_section(name, section, length, location, rotation)


def build():
    plaster = kit.material("Plaster", kit.hexcolor('#efe7d6'), 0.96)
    plaster_warm = kit.material("PlasterWarm", kit.hexcolor('#e4d8c0'), 0.97)
    trim = kit.material("Trim", kit.hexcolor('#f6f2e7'), 0.88)
    iron = kit.material("Ironwork", kit.hexcolor('#39423f'), 0.46, 0.65)
    glassmat = kit.material("WindowGlass", kit.hexcolor('#24333a'), 0.16, 0.25)
    wood = kit.material("DoorPaint", kit.hexcolor('#5f7570'), 0.62)
    stone = kit.material("StoneSill", kit.hexcolor('#cdc3b1'), 0.94)
    parts = []

    # --- main mass, with the wall surface broken into two slightly different
    # plaster tones so the façade is never one flat value.
    mass = kit.cube("mass", (WIDTH, DEPTH, HEIGHT), (0, -DEPTH / 2, HEIGHT / 2))
    kit.bevel(mass, 0.030, 2, 55)
    kit.assign(mass, plaster)
    parts.append(mass)

    # A repaired patch of newer render, one of the honest urban imperfections.
    patch = kit.cube("patch", (3.2, 0.028, 3.0), (-3.40, 0.004, 2.5))
    kit.apply_all(kit.active(patch))
    kit.jitter(patch, 0.030, seed=12)
    kit.bevel(patch, 0.012, 1, 60)
    kit.assign(patch, plaster_warm)
    parts.append(patch)

    # --- plinth / base course: buildings meet the ground with a thickening.
    plinth = moulding("plinth", WIDTH, [
        (-0.07, 0.00), (0.09, 0.00), (0.09, 0.62), (0.045, 0.70), (-0.07, 0.72)],
        (0, 0.0, 0.0))
    kit.assign(plinth, plaster_warm)
    parts.append(plinth)

    # --- cornice: a real three-step profile, the single biggest silhouette
    # upgrade over a flat slab on top of a box.
    cornice = moulding("cornice", WIDTH + 0.5, [
        (0.00, 0.00), (0.17, 0.05), (0.21, 0.16), (0.15, 0.22),
        (0.30, 0.30), (0.34, 0.46), (0.26, 0.52), (0.00, 0.52)],
        (0, 0.0, HEIGHT - 0.60))
    kit.assign(cornice, trim)
    parts.append(cornice)

    # --- string course between floors.
    string = moulding("stringcourse", WIDTH, [
        (0.00, 0.00), (0.10, 0.03), (0.12, 0.12), (0.06, 0.17), (0.00, 0.17)],
        (0, 0.0, 4.28))
    kit.assign(string, plaster_warm)
    parts.append(string)

    # --- the barred ground-floor window, with a real reveal cut into the wall.
    wx, wz, ww, wh = -1.55, 2.48, 1.78, 2.55
    cutter = kit.cube("cut", (ww, 1.2, wh), (wx, -0.4, wz))
    kit.boolean(mass, cutter)
    reveal = kit.cube("reveal", (ww + 0.26, 0.52, wh + 0.26), (wx, -0.21, wz))
    kit.bevel(reveal, 0.02, 2, 55)
    kit.assign(reveal, trim)
    parts.append(reveal)
    pane = kit.cube("pane", (ww - 0.04, 0.03, wh - 0.04), (wx, -0.30, wz))
    kit.assign(pane, glassmat)
    parts.append(pane)
    sill = moulding("sill", ww + 0.46, [
        (-0.05, 0.00), (0.26, 0.00), (0.26, 0.08), (0.20, 0.15), (-0.05, 0.15)],
        (wx, 0.0, wz - wh / 2 - 0.10))
    kit.assign(sill, stone)
    parts.append(sill)

    # Vertical iron bars + two horizontals, each bar nudged so the set is
    # hand-made rather than extruded.
    import random
    rng = random.Random(7)
    for i in range(9):
        bx = wx - ww / 2 + 0.11 + i * (ww - 0.22) / 8
        bar = kit.tube_along(f"bar{i}", [
            (bx, 0.05, wz - wh / 2 + 0.03),
            (bx + rng.uniform(-0.012, 0.012), 0.05 + rng.uniform(-0.006, 0.006), wz),
            (bx, 0.05, wz + wh / 2 - 0.03)], radius=0.016, segments=8)
        kit.assign(bar, iron)
        parts.append(bar)
    for hz in (wz - 0.72, wz + 0.74):
        rail = kit.tube_along(f"rail{hz:.2f}", [
            (wx - ww / 2 + 0.02, 0.055, hz), (wx, 0.062, hz + 0.01),
            (wx + ww / 2 - 0.02, 0.055, hz)], radius=0.015, segments=8)
        kit.assign(rail, iron)
        parts.append(rail)

    # --- upper transom window with a central mullion and a shutter hinge.
    tx, tz, tw, th = -1.50, 5.58, 2.05, 1.24
    tcut = kit.cube("tcut", (tw, 1.2, th), (tx, -0.4, tz))
    kit.boolean(mass, tcut)
    tframe = kit.cube("tframe", (tw + 0.24, 0.40, th + 0.24), (tx, -0.14, tz))
    kit.bevel(tframe, 0.018, 2, 55)
    kit.assign(tframe, trim)
    parts.append(tframe)
    tpane = kit.cube("tpane", (tw - 0.05, 0.03, th - 0.05), (tx, -0.24, tz))
    kit.assign(tpane, glassmat)
    parts.append(tpane)
    mull = kit.cube("mullion", (0.06, 0.09, th - 0.04), (tx, -0.20, tz))
    kit.assign(mull, trim)
    parts.append(mull)
    tsill = moulding("tsill", tw + 0.34, [
        (-0.04, 0.0), (0.20, 0.0), (0.20, 0.07), (0.15, 0.12), (-0.04, 0.12)],
        (tx, 0.0, tz - th / 2 - 0.08))
    kit.assign(tsill, stone)
    parts.append(tsill)

    # --- service door, recessed, with panel mouldings and a utility lock.
    # X is negated by the facing rotation at the end of build(), so a door
    # authored at -5.4 arrives on the viewer's right, away from the side street.
    dx, dh, dw = -5.40, 2.52, 1.12
    dcut = kit.cube("dcut", (dw, 1.0, dh), (dx, -0.3, dh / 2))
    kit.boolean(mass, dcut)
    dframe = kit.cube("dframe", (dw + 0.26, 0.36, dh + 0.18), (dx, -0.12, dh / 2 + 0.02))
    kit.bevel(dframe, 0.016, 2, 55)
    kit.assign(dframe, trim)
    parts.append(dframe)
    leaf = kit.cube("doorleaf", (dw - 0.03, 0.055, dh - 0.03), (dx, -0.21, dh / 2))
    kit.bevel(leaf, 0.008, 2, 50)
    kit.assign(leaf, wood)
    parts.append(leaf)
    for pz, ph in ((0.68, 0.86), (1.72, 0.86)):
        panel = kit.cube("dpanel", (dw - 0.30, 0.022, ph), (dx, -0.18, pz))
        kit.bevel(panel, 0.012, 2, 50)
        kit.assign(panel, wood)
        parts.append(panel)
    knob = kit.uvsphere("knob", 0.040, 12, 8, (dx + dw / 2 - 0.16, -0.20, 1.06))
    kit.assign(knob, iron)
    parts.append(knob)
    step = kit.cube("step", (dw + 0.36, 0.34, 0.09), (dx, 0.10, 0.045))
    kit.bevel(step, 0.012, 2, 50)
    kit.assign(step, stone)
    parts.append(step)

    # --- the accumulated services: drainpipe with brackets, conduit, a meter
    # box and an air-conditioning unit. Urban imperfection, not decoration.
    pipe_x = 1.42
    pipe = kit.tube_along("drainpipe", [
        (pipe_x, 0.12, 0.0), (pipe_x, 0.12, 1.4),
        (pipe_x - 0.02, 0.13, 4.0), (pipe_x, 0.12, HEIGHT - 0.75)],
        radius=0.058, segments=10)
    kit.assign(pipe, kit.material("Downpipe", kit.hexcolor('#9ea39b'), 0.62, 0.35))
    parts.append(pipe)
    for z in (0.9, 2.8, 4.6, 6.4):
        band = kit.torus("band", 0.064, 0.012, 14, 8, (pipe_x, 0.12, z),
                         (math.radians(90), 0, 0))
        kit.assign(band, iron)
        parts.append(band)
    hopper = kit.cone("hopper", 0.14, 0.062, 0.26, 14, (pipe_x, 0.12, HEIGHT - 0.60))
    kit.assign(hopper, kit.material("Downpipe", kit.hexcolor('#9ea39b'), 0.62, 0.35))
    parts.append(hopper)

    box = kit.cube("meterbox", (0.52, 0.17, 0.40), (3.35, 0.06, 2.10))
    kit.bevel(box, 0.012, 2, 50)
    kit.assign(box, kit.material("MeterBox", kit.hexcolor('#b9bcb2'), 0.70))
    parts.append(box)
    for i in range(6):
        louvre = kit.cube("louvre", (0.40, 0.012, 0.028),
                          (3.35, -0.035, 2.00 + i * 0.048),
                          (math.radians(14), 0, 0))
        kit.assign(louvre, kit.material("Louvre", kit.hexcolor('#8d948f'), 0.75))
        parts.append(louvre)
    conduit = kit.tube_along("conduit", [
        (3.35, 0.05, 2.32), (3.36, 0.05, 3.1), (3.7, 0.05, 3.5),
        (5.4, 0.05, 3.8), (5.8, 0.05, 4.6)], radius=0.022, segments=6)
    kit.assign(conduit, kit.material("Conduit", kit.hexcolor('#6f7570'), 0.72))
    parts.append(conduit)

    ac = kit.cube("acunit", (0.80, 0.34, 0.56), (-6.90, -0.10, 5.30))
    kit.bevel(ac, 0.022, 2, 50)
    kit.assign(ac, kit.material("ACUnit", kit.hexcolor('#d4d2c6'), 0.70))
    parts.append(ac)
    grille = kit.cylinder("acgrille", 0.21, 0.04, 20, (-6.90, -0.28, 5.30),
                          (math.radians(90), 0, 0))
    kit.assign(grille, kit.material("Louvre", kit.hexcolor('#8d948f'), 0.75))
    parts.append(grille)
    bracket = kit.cube("acbracket", (0.72, 0.26, 0.05), (-6.90, -0.08, 4.99))
    kit.assign(bracket, iron)
    parts.append(bracket)

    # --- wall lamp over the door, switched off in the morning.
    arm = kit.tube_along("lamparm", [
        (dx, 0.04, 3.05), (dx, -0.16, 3.14), (dx, -0.30, 3.08)],
        radius=0.018, segments=6)
    kit.assign(arm, iron)
    parts.append(arm)
    shade = kit.lathe("lampshade", [
        (0.0, 0.0), (0.085, -0.02), (0.125, -0.10), (0.132, -0.13),
        (0.118, -0.135), (0.112, -0.10), (0.072, -0.03), (0.0, -0.012)],
        segments=18, close=True)
    shade.location = (dx, -0.30, 3.08)
    kit.shade_smooth(shade, 45)
    kit.assign(shade, iron)
    parts.append(shade)

    # --- the left-hand return wall, which is what makes the corner read as a
    # corner and opens the narrow street.
    ret = kit.cube("return", (0.9, 19.0, HEIGHT - 0.5),
                   (WIDTH / 2 + 0.45, -9.5, (HEIGHT - 0.5) / 2))
    kit.bevel(ret, 0.03, 2, 55)
    kit.assign(ret, plaster_warm)
    parts.append(ret)
    quoin = moulding("cornerquoin", HEIGHT - 0.5, [
        (-0.05, -0.05), (0.09, -0.05), (0.09, 0.09), (-0.05, 0.09)],
        (WIDTH / 2 - 0.02, 0.02, (HEIGHT - 0.5) / 2),
        (0, math.radians(90), 0))
    kit.assign(quoin, trim)
    parts.append(quoin)

    for part in parts:
        kit.apply_all(part)
        kit.shade_smooth(part, 32)
    merged = kit.join("CornerBuilding", parts)
    # Authored with the façade looking down +Y because that reads naturally in
    # Blender. glTF's Y-up conversion maps Blender +Y to -Z, which would point
    # the façade away from a Three.js camera sitting on +Z, so the finished
    # block is turned to face the viewer before export.
    # Bake the join's leftover object origin into the mesh first. Without
    # this the facing rotation happens about whichever part happened to be
    # first in the join, which left the façade plane 1.1 m off its local
    # origin and buried anything the scene placed "just in front of" it.
    kit.apply_transform(merged, location=True, rotation=True, scale=True)
    merged.rotation_euler = (0, 0, math.pi)
    kit.apply_transform(merged, location=True, rotation=True, scale=True)
    kit.uv_project(merged, 2.4)
    return merged
