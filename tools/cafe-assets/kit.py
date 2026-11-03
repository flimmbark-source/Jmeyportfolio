"""
Shared Blender authoring helpers for the Café Apollo asset set.

Run with the `bpy` pip module (Blender 5.2 LTS as a Python library):
    python3 tools/cafe-assets/build_all.py

Everything is authored at real-world scale: 1 Blender unit = 1 metre.
The point of using Blender rather than Three.js primitives is the modifier
stack - bevel + harden normals + subdivision + solidify + displace - which is
what gives an edge a highlight and a silhouette its handcrafted quality.
"""
import math

import bpy  # bpy must import first; bmesh/mathutils ship inside it
import bmesh
from mathutils import Vector, Euler

TAU = math.pi * 2


# ---------------------------------------------------------------- scene setup

def reset():
    """Empty .blend without relying on the startup file."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.objects,
                  bpy.data.curves, bpy.data.images, bpy.data.node_groups):
        for item in list(block):
            block.remove(item)


def link(obj):
    if obj.name not in bpy.context.scene.collection.objects:
        bpy.context.scene.collection.objects.link(obj)
    return obj


def active(obj):
    bpy.context.view_layer.objects.active = obj
    for other in bpy.context.selected_objects:
        other.select_set(False)
    obj.select_set(True)
    return obj


# ------------------------------------------------------------------ materials

_MATERIALS = {}


def material(name, color, roughness=0.9, metallic=0.0, ior=1.45,
             emission=None, alpha=1.0, clearcoat=0.0, sheen=0.0):
    """A named Principled BSDF. glTF exports base colour / roughness / metallic
    faithfully, so these values are the real shipping material definition."""
    if name in _MATERIALS:
        return _MATERIALS[name]
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    r, g, b = color
    bsdf.inputs["Base Color"].default_value = (r, g, b, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if "IOR" in bsdf.inputs:
        bsdf.inputs["IOR"].default_value = ior
    if alpha < 1.0:
        bsdf.inputs["Alpha"].default_value = alpha
        mat.blend_method = 'BLEND'
    if emission is not None:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = 1.0
    for key, value in (("Coat Weight", clearcoat), ("Sheen Weight", sheen)):
        if key in bsdf.inputs and value:
            bsdf.inputs[key].default_value = value
    _MATERIALS[name] = mat
    return mat


def hexcolor(value):
    """sRGB hex -> linear RGB, because Blender shades in linear space."""
    value = value.lstrip('#')
    out = []
    for i in (0, 2, 4):
        c = int(value[i:i + 2], 16) / 255.0
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return tuple(out)


def assign(obj, mat):
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    return obj


# ------------------------------------------------------------------ primitives

def cube(name, size=(1, 1, 1), location=(0, 0, 0), rotation=(0, 0, 0)):
    """Built at true size in mesh data, never by scaling the object: a bevel
    on a non-uniformly scaled object produces different widths per axis, and
    boolean solvers behave far better on unscaled geometry."""
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= size[0]
        v.co.y *= size[1]
        v.co.z *= size[2]
    uv = bm.loops.layers.uv.new()
    for face in bm.faces:
        for loop, co in zip(face.loops, ((0, 0), (1, 0), (1, 1), (0, 1))):
            loop[uv].uv = co
    bm.to_mesh(mesh)
    bm.free()
    obj = link(bpy.data.objects.new(name, mesh))
    obj.location = location
    obj.rotation_euler = Euler(rotation)
    return obj


def cylinder(name, radius=0.5, depth=1.0, verts=32, location=(0, 0, 0),
             rotation=(0, 0, 0), cap=True):
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=cap, cap_tris=False, segments=verts,
                          radius1=radius, radius2=radius, depth=depth)
    bm.to_mesh(mesh)
    bm.free()
    obj = link(bpy.data.objects.new(name, mesh))
    obj.location = location
    obj.rotation_euler = Euler(rotation)
    return obj


def cone(name, r1=0.5, r2=0.3, depth=1.0, verts=32, location=(0, 0, 0),
         rotation=(0, 0, 0)):
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=verts,
                          radius1=r1, radius2=r2, depth=depth)
    bm.to_mesh(mesh)
    bm.free()
    obj = link(bpy.data.objects.new(name, mesh))
    obj.location = location
    obj.rotation_euler = Euler(rotation)
    return obj


def uvsphere(name, radius=0.5, segments=20, rings=12, location=(0, 0, 0)):
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segments, v_segments=rings,
                              radius=radius)
    bm.to_mesh(mesh)
    bm.free()
    obj = link(bpy.data.objects.new(name, mesh))
    obj.location = location
    return obj


def torus(name, major=0.4, minor=0.1, major_seg=32, minor_seg=12,
          location=(0, 0, 0), rotation=(0, 0, 0)):
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    for i in range(major_seg):
        a = TAU * i / major_seg
        for j in range(minor_seg):
            b = TAU * j / minor_seg
            r = major + minor * math.cos(b)
            bm.verts.new((r * math.cos(a), r * math.sin(a), minor * math.sin(b)))
    bm.verts.ensure_lookup_table()
    for i in range(major_seg):
        for j in range(minor_seg):
            a0 = i * minor_seg + j
            a1 = i * minor_seg + (j + 1) % minor_seg
            b0 = ((i + 1) % major_seg) * minor_seg + j
            b1 = ((i + 1) % major_seg) * minor_seg + (j + 1) % minor_seg
            bm.faces.new((bm.verts[a0], bm.verts[a1], bm.verts[b1], bm.verts[b0]))
    bm.to_mesh(mesh)
    bm.free()
    obj = link(bpy.data.objects.new(name, mesh))
    obj.location = location
    obj.rotation_euler = Euler(rotation)
    return obj


def plane(name, width=1.0, height=1.0, location=(0, 0, 0), rotation=(0, 0, 0)):
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    w, h = width / 2, height / 2
    vs = [bm.verts.new(v) for v in ((-w, -h, 0), (w, -h, 0), (w, h, 0), (-w, h, 0))]
    bm.faces.new(vs)
    uv = bm.loops.layers.uv.new()
    for face in bm.faces:
        for loop, co in zip(face.loops, ((0, 0), (1, 0), (1, 1), (0, 1))):
            loop[uv].uv = co
    bm.to_mesh(mesh)
    bm.free()
    obj = link(bpy.data.objects.new(name, mesh))
    obj.location = location
    obj.rotation_euler = Euler(rotation)
    return obj


def lathe(name, profile, segments=48, location=(0, 0, 0), close=False):
    """Revolve a 2D (radius, height) profile around Z. The single most useful
    operation for ceramics, bollards, pots and turned metal."""
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    rings = []
    for radius, height in profile:
        ring = []
        for i in range(segments):
            a = TAU * i / segments
            ring.append(bm.verts.new((radius * math.cos(a), radius * math.sin(a), height)))
        rings.append(ring)
    bm.verts.ensure_lookup_table()
    for r in range(len(rings) - 1):
        for i in range(segments):
            j = (i + 1) % segments
            quad = (rings[r][i], rings[r][j], rings[r + 1][j], rings[r + 1][i])
            if len(set(v.co.to_tuple(5) for v in quad)) >= 3:
                try:
                    bm.faces.new(quad)
                except ValueError:
                    pass
    if close:
        for ring in (rings[0], rings[-1]):
            if ring[0].co.xy.length > 1e-5:
                try:
                    bm.faces.new(ring)
                except ValueError:
                    pass
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    obj = link(bpy.data.objects.new(name, mesh))
    obj.location = location
    return obj


def tube_along(name, points, radius=0.02, segments=10, smooth=True,
               cyclic=False, taper=None, profile=None):
    """Sweep a circle (or a custom profile curve) along a polyline. Used for
    handles, spectacle rims, temple arms, overhead wires, conduit and window
    bars - anything a cylinder primitive makes look stiff and machined."""
    curve = bpy.data.curves.new(name + "_curve", 'CURVE')
    curve.dimensions = '3D'
    curve.resolution_u = 6
    spline = curve.splines.new('NURBS' if smooth else 'POLY')
    spline.points.add(len(points) - 1)
    for i, p in enumerate(points):
        spline.points[i].co = (p[0], p[1], p[2], 1.0)
    spline.use_cyclic_u = cyclic
    spline.use_endpoint_u = not cyclic
    spline.order_u = min(4, len(points))
    if profile is not None:
        curve.bevel_mode = 'OBJECT'
        curve.bevel_object = profile
    else:
        curve.bevel_depth = radius
        curve.bevel_resolution = max(1, segments // 4)
    curve.use_fill_caps = not cyclic
    if taper is not None:
        curve.taper_object = taper
    obj = link(bpy.data.objects.new(name, curve))
    return to_mesh(obj)


def extrude_section(name, section, length, location=(0, 0, 0),
                    rotation=(0, 0, 0), taper=0.0):
    """Extrude a 2D section given in (y, z) along X. Deterministic, unlike
    sweeping a bevel-object profile along a straight path, whose orientation
    depends on Blender's twist-minimising frame. This is how the cornices,
    plinths, string courses, sills and kerbs are built."""
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    half = length / 2
    rings = []
    for sign in (-1, 1):
        scale = 1.0 - taper * (sign + 1) / 2
        rings.append([bm.verts.new((sign * half, y * scale, z))
                      for y, z in section])
    bm.verts.ensure_lookup_table()
    n = len(section)
    for i in range(n):
        j = (i + 1) % n
        try:
            bm.faces.new((rings[0][i], rings[0][j], rings[1][j], rings[1][i]))
        except ValueError:
            pass
    for ring in rings:
        try:
            bm.faces.new(ring)
        except ValueError:
            pass
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    uv = bm.loops.layers.uv.new()
    for face in bm.faces:
        for loop in face.loops:
            co = loop.vert.co
            loop[uv].uv = (co.x * 0.5, (co.y + co.z) * 0.5)
    bm.to_mesh(mesh)
    bm.free()
    obj = link(bpy.data.objects.new(name, mesh))
    obj.location = location
    obj.rotation_euler = Euler(rotation)
    return obj


def profile_curve(name, points, cyclic=True):
    """A small 2D curve usable as a bevel profile (rectangular mouldings,
    flattened spectacle rims, cornice sections)."""
    curve = bpy.data.curves.new(name, 'CURVE')
    curve.dimensions = '2D'
    spline = curve.splines.new('POLY')
    spline.points.add(len(points) - 1)
    for i, (x, y) in enumerate(points):
        spline.points[i].co = (x, y, 0.0, 1.0)
    spline.use_cyclic_u = cyclic
    return link(bpy.data.objects.new(name, curve))


def ellipse_points(rx, ry, n=28, z=0.0, squash_top=1.0, tilt=0.0):
    """Points around an ellipse, optionally flattened on top - the shape that
    turns a round lens into a believable modern sunglass lens."""
    out = []
    for i in range(n):
        a = TAU * i / n
        x, y = rx * math.cos(a), ry * math.sin(a)
        if y > 0:
            y *= squash_top
        out.append((x, y + tilt * x, z))
    return out


def leaf(name, length=0.09, width=0.035, curl=0.35, segments=7):
    """A real leaf card with a midrib crease and a curl. Four spheres stuck on
    a stick never reads as foliage; a silhouette with a point does."""
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    rows = []
    for i in range(segments + 1):
        t = i / segments
        w = width * math.sin(math.pi * t ** 0.72) * (1.0 - 0.25 * t)
        z = -curl * width * (t ** 2)
        rib = bm.verts.new((0.0, length * t, z + width * 0.12 * math.sin(math.pi * t)))
        left = bm.verts.new((-w, length * t, z))
        right = bm.verts.new((w, length * t, z))
        rows.append((left, rib, right))
    bm.verts.ensure_lookup_table()
    for i in range(segments):
        a, b = rows[i], rows[i + 1]
        for k in range(2):
            try:
                bm.faces.new((a[k], a[k + 1], b[k + 1], b[k]))
            except ValueError:
                pass
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    return link(bpy.data.objects.new(name, mesh))


def remove(obj):
    if obj is not None and obj.name in bpy.data.objects:
        bpy.data.objects.remove(obj, do_unlink=True)


def duplicate(obj, name, location=(0, 0, 0), rotation=(0, 0, 0), scale=None):
    copy = obj.copy()
    copy.data = obj.data.copy()
    copy.name = name
    copy.location = location
    copy.rotation_euler = Euler(rotation)
    if scale is not None:
        copy.scale = scale if hasattr(scale, '__len__') else (scale, scale, scale)
    return link(copy)


def to_mesh(obj):
    """Apply modifiers / convert curves so the result is a plain mesh."""
    active(obj)
    bpy.ops.object.convert(target='MESH')
    return bpy.context.view_layer.objects.active


# ------------------------------------------------------------------ modifiers

def bevel(obj, width=0.004, segments=2, angle=50, harden=True, clamp=True):
    mod = obj.modifiers.new("bevel", 'BEVEL')
    mod.width = width
    mod.segments = segments
    mod.limit_method = 'ANGLE'
    mod.angle_limit = math.radians(angle)
    mod.harden_normals = harden
    mod.use_clamp_overlap = clamp
    mod.miter_outer = 'MITER_ARC'
    return obj


def subsurf(obj, levels=2, simple=False):
    mod = obj.modifiers.new("subsurf", 'SUBSURF')
    mod.levels = mod.render_levels = levels
    mod.subdivision_type = 'SIMPLE' if simple else 'CATMULL_CLARK'
    return obj


def solidify(obj, thickness=0.002, offset=0.0, rim=True):
    mod = obj.modifiers.new("solidify", 'SOLIDIFY')
    mod.thickness = thickness
    mod.offset = offset
    mod.use_rim = rim
    mod.use_rim_only = False
    return obj


def displace(obj, strength=0.01, scale=1.0, seed=0, midlevel=0.5,
             noise_type='FBM'):
    tex = bpy.data.textures.new(obj.name + "_disp", 'CLOUDS')
    tex.noise_scale = scale
    tex.noise_depth = 3
    mod = obj.modifiers.new("displace", 'DISPLACE')
    mod.texture = tex
    mod.strength = strength
    mod.mid_level = midlevel
    mod.texture_coords = 'LOCAL'
    obj.location = obj.location  # keep explicit; seed via offset below
    return obj


def shade_smooth(obj, angle=35):
    """Blender 4.1+ dropped mesh.use_auto_smooth in favour of the
    shade_auto_smooth operator / Smooth by Angle modifier."""
    active(obj)
    try:
        bpy.ops.object.shade_auto_smooth(angle=math.radians(angle))
    except (AttributeError, RuntimeError):
        try:
            bpy.ops.object.shade_smooth()
        except RuntimeError:
            pass
    return obj


def apply_all(obj):
    active(obj)
    if obj.type == 'MESH' and tuple(round(v, 6) for v in obj.scale) != (1.0, 1.0, 1.0):
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    for mod in list(obj.modifiers):
        try:
            bpy.ops.object.modifier_apply(modifier=mod.name)
        except RuntimeError as error:
            print("    ! could not apply %s on %s (%s)" % (mod.name, obj.name, error))
            obj.modifiers.remove(mod)
    return obj


def apply_transform(obj, location=False, rotation=True, scale=True):
    active(obj)
    bpy.ops.object.transform_apply(location=location, rotation=rotation,
                                   scale=scale)
    return obj


def boolean(target, cutter, operation='DIFFERENCE', apply=True):
    # Any pending modifier on the target has to be baked in first, otherwise
    # the boolean is evaluated before it and the apply order silently corrupts
    # the mesh (Blender only warns "applied modifier was not first").
    if target.modifiers:
        apply_all(target)
    apply_all(cutter)
    apply_transform(cutter)
    mod = target.modifiers.new("bool", 'BOOLEAN')
    mod.object = cutter
    mod.operation = operation
    mod.solver = 'EXACT'
    if apply:
        active(target)
        try:
            bpy.ops.object.modifier_apply(modifier=mod.name)
        except RuntimeError:
            target.modifiers.remove(mod)
        bpy.data.objects.remove(cutter, do_unlink=True)
    return target


# ------------------------------------------------------------------- assembly

def join(name, objects):
    objects = [o for o in objects if o and o.name in bpy.data.objects]
    if not objects:
        return None
    for obj in objects:
        apply_all(obj)
    base = objects[0]
    active(base)
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = base
    if len(objects) > 1:
        bpy.ops.object.join()
    base = bpy.context.view_layer.objects.active
    base.name = name
    base.data.name = name
    return base


def uv_project(obj, scale=1.0):
    """Cheap but even box UVs so painterly texture maps tile predictably."""
    active(obj)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.cube_project(cube_size=scale)
    bpy.ops.object.mode_set(mode='OBJECT')
    return obj


def planar_uv(obj, width, depth, offset=(0.0, 0.0), flip=False):
    """Project from directly above into 0..1. This is what lets a wear map
    know where the real edges of the object are: tiling noise cannot, which is
    why uniformly scattered chips always read as confetti."""
    mesh = obj.data
    if not mesh.uv_layers:
        mesh.uv_layers.new(name="UVMap")
    uv = mesh.uv_layers.active.data
    for poly in mesh.polygons:
        for loop_index in poly.loop_indices:
            co = mesh.vertices[mesh.loops[loop_index].vertex_index].co
            u = (co.x - offset[0]) / width + 0.5
            v = (co.y - offset[1]) / depth + 0.5
            # glTF's Y-up conversion turns Blender's +Y into -Z, so a
            # top-down projection lands vertically inverted on screen.
            uv[loop_index].uv = (u, 1.0 - v) if flip else (u, v)
    return obj


def planar_uv_xz(obj, width, height, flip_u=False):
    """Project from the front (-Y) into 0..1 across X and Z, for wall plates
    and signage whose artwork has to land square on one face."""
    mesh = obj.data
    if not mesh.uv_layers:
        mesh.uv_layers.new(name="UVMap")
    uv = mesh.uv_layers.active.data
    for poly in mesh.polygons:
        for loop_index in poly.loop_indices:
            co = mesh.vertices[mesh.loops[loop_index].vertex_index].co
            u = co.x / width + 0.5
            uv[loop_index].uv = (1.0 - u if flip_u else u, co.z / height + 0.5)
    return obj


def smart_uv(obj, angle=66):
    active(obj)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    try:
        bpy.ops.uv.smart_project(angle_limit=math.radians(angle), island_margin=0.01)
    except RuntimeError:
        bpy.ops.uv.cube_project(cube_size=1.0)
    bpy.ops.object.mode_set(mode='OBJECT')
    return obj


def jitter(obj, strength=0.004, seed=1):
    """Hand-built-not-CAD: nudge vertices so nothing is machine perfect."""
    import random
    rng = random.Random(seed)
    for v in obj.data.vertices:
        v.co += Vector((rng.uniform(-1, 1), rng.uniform(-1, 1),
                        rng.uniform(-1, 1))) * strength
    return obj


def export(path, objects=None, name="asset"):
    bpy.ops.object.select_all(action='DESELECT')
    pool = objects if objects is not None else list(bpy.context.scene.objects)
    for obj in pool:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = pool[0] if pool else None
    bpy.ops.export_scene.gltf(
        filepath=str(path),
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_normals=True,
        export_texcoords=True,
        export_materials='EXPORT',
        export_cameras=False,
        export_lights=False,
        export_extras=False,
        export_draco_mesh_compression_enable=False,
    )
    import os
    kb = os.path.getsize(path) / 1024
    tris = sum(len(o.data.loop_triangles) if o.type == 'MESH' else 0 for o in pool)
    print(f"  exported {name:<12} {kb:8.1f} KB   {len(pool)} objects")
