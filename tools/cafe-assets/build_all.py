#!/usr/bin/env python3
"""
Build the Café Apollo asset set.

    pip install bpy==5.2.3
    python3 tools/cafe-assets/build_all.py [--preview]

Writes GLB files to public/cafe/models/. With --preview it also renders each
asset in EEVEE to tools/cafe-assets/preview/ so the modelling can be reviewed
without going through the web build.
"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)

import bpy  # noqa: E402
import kit  # noqa: E402

OUT = os.path.join(ROOT, "public", "cafe", "models")
PREVIEW = os.path.join(HERE, "preview")
PREVIEW_ON = "--preview" in sys.argv


def render_preview(name, _target=None, _distance=None, height=None, up=None):
    """Three-quarter studio render, purely for art review. Framing and key
    light intensity are derived from the asset's own bounding box so every
    asset - a 6 cm cup and a 13 m building - is lit and framed the same way."""
    from mathutils import Vector
    os.makedirs(PREVIEW, exist_ok=True)
    bpy.context.view_layer.update()
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    lo = Vector((1e9, 1e9, 1e9))
    hi = Vector((-1e9, -1e9, -1e9))
    for obj in meshes:
        for corner in obj.bound_box:
            world = obj.matrix_world @ Vector(corner)
            lo = Vector(map(min, lo, world))
            hi = Vector(map(max, hi, world))
    centre = (lo + hi) / 2
    radius = max((hi - lo).length / 2, 1e-3)

    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 48
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 4
    scene.render.resolution_x = 880
    scene.render.resolution_y = 660
    scene.render.film_transparent = False
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'
    world = bpy.data.worlds.new("w")
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = (0.30, 0.35, 0.40, 1)
    bg.inputs[1].default_value = 0.9
    scene.world = world

    # Frame from the lens: half-height at distance d is d*tan(atan(13.5/f)),
    # so d = 1.3r / that keeps any asset at ~77% of frame height.
    lens = 55.0
    cam_data = bpy.data.cameras.new("cam")
    cam_data.lens = lens
    cam = bpy.data.objects.new("cam", cam_data)
    kit.link(cam)
    dist = 1.30 * radius / (13.5 / lens)
    offset = Vector((0.58, -0.70, 0.42)).normalized()
    cam.location = centre + offset * dist
    cam.rotation_euler = (cam.location - centre).to_track_quat('Z', 'Y').to_euler()
    scene.camera = cam

    # Inverse-square: one exposure rule that works at every asset scale.
    key = bpy.data.lights.new("key", 'AREA')
    key.energy = 1000.0 * radius ** 2
    key.size = radius * 2.2
    ko = bpy.data.objects.new("key", key)
    kit.link(ko)
    ko.location = centre + Vector((-0.55, -0.60, 0.80)).normalized() * dist
    ko.rotation_euler = (ko.location - centre).to_track_quat('Z', 'Y').to_euler()

    fillm = bpy.data.lights.new("fill", 'AREA')
    fillm.energy = key.energy * 0.22
    fillm.size = radius * 3.0
    fo = bpy.data.objects.new("fill", fillm)
    kit.link(fo)
    fo.location = centre + Vector((0.90, -0.30, 0.25)).normalized() * dist
    fo.rotation_euler = (fo.location - centre).to_track_quat('Z', 'Y').to_euler()

    floor = kit.plane("floor", radius * 40, radius * 40, (0, 0, lo.z - radius * 0.002))
    kit.assign(floor, kit.material("PreviewFloor", kit.hexcolor('#8e8a82'), 0.95))

    scene.render.filepath = os.path.join(PREVIEW, name + ".png")
    bpy.ops.render.render(write_still=True)
    print(f"  preview    {name}.png")


def run(name, builder, preview=True):
    kit.reset()
    kit._MATERIALS.clear()
    obj = builder()
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, name + ".glb")
    pool = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    kit.export(path, pool, name)
    if PREVIEW_ON and preview:
        render_preview(name)
    return obj


def props():
    """All street props in one GLB, each still its own named object so the
    scene can clone and place them individually. Previews are rendered one
    prop at a time; a single wide shot of nine objects reviews nothing."""
    import a_props
    if PREVIEW_ON:
        for name, builder in a_props.BUILDERS.items():
            kit.reset()
            kit._MATERIALS.clear()
            obj = builder()
            obj.name = name
            render_preview("prop-" + name.lower())

    kit.reset()
    kit._MATERIALS.clear()
    made = []
    offset = 0.0
    for name, builder in a_props.BUILDERS.items():
        built = builder()
        # A builder may return several named objects (the walker ships as a
        # body and a pair of legs so the scene can swing them).
        group = built if isinstance(built, (list, tuple)) else [built]
        for index, obj in enumerate(group):
            if len(group) == 1:
                obj.name = obj.data.name = name
            else:
                obj.data.name = obj.name
            obj.location.x += offset
            made.append(obj)
        offset += 6.0
    os.makedirs(OUT, exist_ok=True)
    kit.export(os.path.join(OUT, "props.glb"), made, "props")


def nature():
    """Canopy, bougainvillea and vine in one GLB, each its own named object."""
    import a_nature
    if PREVIEW_ON:
        for name, builder in a_nature.BUILDERS.items():
            kit.reset()
            kit._MATERIALS.clear()
            obj = builder()
            obj.name = name
            render_preview("nature-" + name.lower())
    kit.reset()
    kit._MATERIALS.clear()
    made = []
    offset = 0.0
    for name, builder in a_nature.BUILDERS.items():
        obj = builder()
        obj.name = obj.data.name = name
        obj.location.x += offset
        offset += 12.0
        made.append(obj)
    os.makedirs(OUT, exist_ok=True)
    kit.export(os.path.join(OUT, "nature.glb"), made, "nature")


ASSETS = ("table", "cup", "menu", "glasses", "building", "props", "nature")


def main():
    import a_table, a_cup, a_menu, a_glasses, a_building
    builders = {"table": a_table.build, "cup": a_cup.build,
                "menu": a_menu.build, "glasses": a_glasses.build,
                "building": a_building.build}
    wanted = [a for a in sys.argv[1:] if not a.startswith("-")] or list(ASSETS)
    print("Café Apollo asset build (Blender %s)" % bpy.app.version_string)
    for name in wanted:
        if name == "props":
            props()
        elif name == "nature":
            nature()
        elif name in builders:
            run(name, builders[name], preview=True)
        else:
            print("  unknown asset:", name)
    print("done ->", OUT)


if __name__ == "__main__":
    main()
