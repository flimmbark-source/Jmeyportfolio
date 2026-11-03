# Café Apollo asset pipeline

The `/cafe` scene is built from artist-authored meshes and painted surface
maps, not from Three.js primitives. This directory holds the sources that
produce them. **The outputs are committed**, so neither `npm run dev` nor
`npm run build` needs anything in here — you only run it when the art
changes.

| Output | Built by |
| --- | --- |
| `public/cafe/models/*.glb` | `build_all.py` (Blender) |
| `public/cafe/tex/*` | `build_textures.py` (Pillow + NumPy) |
| `public/cafe/backdrop.jpg` | `prepare_backdrop.py` (Pillow) |

The scene is a hybrid: the street is the painted backdrop and only the table
and the objects on it are geometry. The street models - `building.glb`, and
most of `props.glb` and `nature.glb` - are still built and still committed,
but only the table, cup, menu, glasses, ashtray and one canopy (used off-frame
as a lighting gobo) are loaded at runtime.

## Requirements

```bash
pip install bpy==5.2.3 pillow numpy
```

`bpy` is Blender 5.2 LTS shipped as a Python module — the same modifier
stack, exporters and solvers as the desktop application, driven headlessly.
It needs CPython 3.11–3.13 and about 1.5 GB on disk. It is **not** a project
dependency and must never become one: CI builds the site from the committed
`.glb` and texture files.

## Building

```bash
python3 tools/cafe-assets/build_all.py
```

```bash
python3 tools/cafe-assets/build_all.py --preview
```

```bash
python3 tools/cafe-assets/build_textures.py
```

`build_all.py` takes asset names (`table`, `cup`, `menu`, `glasses`,
`building`, `props`) to rebuild a subset. `--preview` additionally renders
each asset through Cycles into `tools/cafe-assets/preview/`, framed and
exposed from its own bounding box, so modelling can be reviewed without
going through the web build. EEVEE needs a GL context and is unavailable in
headless containers, which is why previews are Cycles/CPU.

## Why Blender rather than more Three.js primitives

The modifier stack is the whole point. Bevel with hardened normals is what
gives an edge a highlight and a silhouette its handcrafted quality; solidify
is what makes a menu board and an awning read as sheet material; lathing a
profile is what makes ceramics, bollards and terracotta look turned rather
than extruded. None of that is expressible as `BoxGeometry` with a noisier
texture on it.

## Files

| File | Contents |
| --- | --- |
| `kit.py` | Shared helpers: primitives built at true size, lathe, swept tubes, leaf cards, modifiers, UV projection, glTF export |
| `a_table.py` | The folded sheet-steel café table |
| `a_cup.py` | Espresso cup, saucer, handle, espresso and crema |
| `a_menu.py` | Bound card menu: boards, page block, cloth tape spine |
| `a_glasses.py` | Sunglasses: rims, smoked lenses, bridge, folded temples |
| `a_building.py` | The white plaster corner building |
| `a_props.py` | Street kit: bollard, pole, awning, planter, shrub, chair, sign, ashtray, sugar glass |
| `build_textures.py` | Plaster, worn enamel, paving, asphalt, menu cover art, ghost sign |

The café's name lives in one place: `CAFE_NAME` at the top of
`build_textures.py`. It is set in both lockups — the printed menu cover and
the painted wall sign — and each one auto-fits its display type to the space
available, so a longer or shorter name needs no other change. Rebuild the
textures after editing it.

## Conventions that are easy to get wrong

- **One Blender unit is one metre.** The table is 1.15 m, the cup rim is
  63 mm. The scene relies on this; do not rescale assets to "look right".
- **The table's size is a composition decision, not a modelling one.** It is
  a four-top because the seated camera has to hold a majority of the frame
  with it, and widening the table is the only lever that does that without
  pitching the camera past half its field of view — past which the horizon,
  and the whole street with it, leaves the frame. `a_table.py` says this at
  the top; changing `W`/`D` means re-checking the camera in `cafe-world.js`.
- **Build primitives at true size**, never by scaling the object. A bevel on
  a non-uniformly scaled object produces a different width per axis and the
  boolean solver misbehaves.
- **Apply the object's location before a facing rotation.** `kit.join` leaves
  the origin wherever the first joined part was, so rotating about it moves
  the mesh off its own origin. This silently put the building's façade plane
  1.1 m away from local zero and buried anything the scene placed in front
  of it.
- **glTF is Y-up.** The exporter maps Blender `(x, y, z)` to `(x, z, -y)`, so
  Blender `+Y` becomes `-Z` and faces away from a Three.js camera on `+Z`.
  `a_building` is authored facing `+Y` and turned 180° about Z before export,
  which also negates X — the comments in that file say where each element
  ends up on screen.
- **A top-down planar UV lands vertically inverted** after that conversion;
  `kit.planar_uv(..., flip=True)` is what makes the menu cover read the right
  way up.
- **Material names are the contract.** `cafe-world.js` looks materials up by
  the names set here (`TableEnamel`, `MenuCover`, `Plaster`, `CupGlaze`,
  `GlassLens`, …) to attach the painted maps. Renaming a material in Blender
  silently drops its texture in the browser.
