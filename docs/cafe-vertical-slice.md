# Café portfolio: first vertical slice

**Route:** `/cafe` on `claude/hopeful-albattani-puzzes`.

**Scope:** Prototype, deliberately isolated from the existing `/` Playground and `/ux` routes. The full 3D production scene, new sound design, and timed events are out of scope.

## Confirmed design decisions
- Playful surrealism in a recognizable narrow urban café, based on the supplied street photograph.
- Seated first-person camera. No hands, body, or avatar.
- The Menu is the central portfolio index; other props do not own exclusive information.
- Coffee enters the existing Playground, with no new required minigame.
- Menu navigation is fast and legible, with preview and focused-reading states.
- Environmental interactions are optional. No work, research, contact details, or résumé require solving puzzles.
- Direct links to résumé, contact, research and Playground remain visible.
- Mobile touch, keyboard, browser Back/Escape, and reduced motion must be preserved.

## What this slice actually implements
- `src/pages/cafe.astro`: a new Astro route using `portfolioV2NodeMap` and `getCollection('projects')`.
- `src/styles/cafe.css` and `src/styles/cafe-world.css`: accessible two-page Menu, progressive reading interface, and semantic controls projected over 3D objects.
- `src/scripts/cafe-world.js`: Three.js scene — loads the authored glTF assets, owns lighting, atmosphere, the seated camera and the projected touch targets.
- `tools/cafe-assets/`: the Blender/Pillow asset pipeline that produces `public/cafe/models/*.glb` and `public/cafe/tex/*`. See its README.
- `public/cafe/street.svg`: fallback only if WebGL is unavailable. **Not final art.**
- `public/scripts/cafe.js`: object selection, hover/focus behavior, categories, project previews, reading state, browser history, focus containment, and limited seated camera parallax.
- Coffee routes to existing `/`. Secondary props link to existing résumé/contact; glasses provide an optional visual-lens panel.

## Source-of-truth rules
- Project summaries and links come from existing repository content. Never show generated concept art as a real project screenshot.
- The original physical photo is an art-direction reference, not currently bundled as a deployable asset.
- Unfinished projects are labeled as unfinished.
- The generated visualization boards are directional only. Their idealized tourist-street architecture and round table are **rejected**.
- The procedural blockout has been replaced by authored meshes and painted surface maps (see the 2026-10-31 art pass below). Audiovisual ambience remains unresolved.

## Verification
- The production build and browser QA now run on every branch push. Chromium verifies desktop and mobile navigation, menu reading, Back/Escape, Coffee transition, and WebGL scene initialization.
- Current browser screenshots are uploaded as GitHub Actions `cafe-browser-qa` artifacts. Automated passage is not a human visual-design approval.

## Manual acceptance checks before promotion
1. Open `/cafe` at desktop and mobile sizes. All primary objects should be visible and discoverable without hunting.
2. Open Menu, switch categories, preview a real project, expand reading, and return. Escape and browser Back must produce understandable state transitions.
3. Check UX work is findable in seconds and résumé/contact are one interaction away.
4. Test keyboard-only operation and reduced motion.
5. Confirm imagery is sourced from the existing project, not invented.
6. Click Coffee and check the existing Playground still works. Return via browser Back.
7. Review mobile cropping and scene clarity, then decide whether to move to WebGL/R3F before art production.

## Next implementation milestone
Use the captured browser screenshots to replace the procedural blockout with art-directed, high-fidelity stylized meshes and materials. Preserve tested Menu/reading behavior, then add sound and ambient simulation. Do not promote `/cafe` to `/` on the basis of functional tests alone.

## Art-direction iteration: 2026-10-30

**Confirmed visual correction:** The original reference shows a near-frontal white corner building, with the side street receding to the left. The first procedural version incorrectly rendered a centered corridor. The street model now follows the corner-building composition.

**Implemented in the branch:**
- `src/scripts/cafe-scenography.js` builds the white façade, barred window and upper transom, modest service details, red-and-white curb, narrow side street, awning, bollards, utility poles, signage and planters as real lit geometry.
- Painterly/worn plaster maps and a distressed red table replace the flat base materials.
- The blue espresso cup has been simplified to read as ceramic rather than a decorative toy; existing interaction hotspots and reading flow remain functional.
- Automated browser QA now rejects non-renderable façade materials, after an early scene refactor accidentally passed a texture in place of a Three.js Material.

**Still unresolved:** The geometry remains constructed primitives with programmatic textures. It is **not yet the intended art-directed, hand-painted 3D asset set**. Architectural detail, sculptural silhouettes, and visual authenticity need a dedicated authored-model and material pass. The generated seaside/tourist café illustrations are not approved or used as scene assets.

**Promotion rule:** Keep this behind `/cafe` until the visual direction has been reviewed and the primary objects are clear at desktop and mobile sizes. The production build and interaction tests are necessary, but not sufficient, for art approval.


## Art pass: 2026-10-31

The procedural blockout is gone. Every solid object in the scene is now an
artist-authored mesh built in Blender and exported as glTF, and every surface
map is a painted texture authored offline into `public/cafe/tex/`. Nothing in
the scene is a Three.js primitive standing in for an object, and no texture is
drawn into a canvas at page load.

### Asset production

Blender 5.2 LTS is available as the `bpy` pip module, which made a real
modelling pipeline possible rather than more primitives. `tools/cafe-assets/`
holds the sources; its README covers requirements, commands and the
conventions that are easy to get wrong. Outputs are committed, so the site
build has no new dependency.

What the modifier stack bought, specifically: bevels with hardened normals so
edges catch light and silhouettes read as made rather than generated;
solidify so the menu boards and the awning canvas are sheet material; lathed
profiles so the cup, saucer, bollards and terracotta are turned forms; swept
curves so the cup handle, spectacle rims, window bars and conduit are not
stiff cylinders; and leaf cards with a midrib and a curl instead of clumps of
spheres.

### Major artistic changes

- **Real-world scale.** One unit is one metre throughout. The table is 86 cm
  and the espresso cup is 63 mm across the rim. Previously the table was
  4.45 units against an 8.6-unit building, which is most of why the scene read
  as a diorama. Presence now comes from a seated camera 55 cm above the table
  top, not from inflated props.
- **The table** is a folded sheet-steel top with a downturned lip, an
  angle-iron frame, four splayed tube legs, a cross-brace and welded corner
  gussets. Its wear map is projected 1:1 rather than tiled, so chipping
  concentrates at the lip and the corners and along one high-wear arc in the
  middle, with exposed primer under each chip. Uniformly scattered chips were
  the single clearest tell of the old surface.
- **The menu** is a bound object: two warped boards, a block of individually
  offset pages with an uneven fore edge, a cloth tape spine and brass staples.
  Its cover carries printed artwork — a typographic lockup and an engraved cup
  motif with a ring stain — and nowhere says the word "menu".
- **The coffee** is a hollow cup with a 3 mm lip, a white glazed interior, a
  swept handle with a flattened section, and a saucer with a real well, a
  rolled rim and a foot ring. The espresso carries crema across the surface
  with a thin dark ring at the wall, deliberately irregular rather than a
  concentric bullseye.
- **The sunglasses** have flattened cat-eyed rims, domed smoked lenses that
  return a highlight, a keyhole bridge, hinges and folded temples that cross —
  the crossing is most of what makes them readable from above.
- **Lighting and atmosphere.** A low morning sun rakes across the street from
  the left. Two things follow: long shadows that cross the pavement and give
  the mid-ground something to look at, and grazing light that carves every
  sill, pipe and patch in the plaster. The sky is a gradient dome, pre-filtered
  into an environment map — without one the metals rendered black and the
  glaze, the lenses and the window panes had nothing to reflect. Exponential
  fog separates the table from the kerb from the far end of the alley.
- **Composition.** The street is turned a few degrees off the image plane so
  the kerbs converge. The utility pole was moved off the centre line, where it
  previously cut the frame in half. The side street opens on the left, its
  terrace kept to a single storey at the mouth so a wedge of sky shows above
  it and so the sun clears it and lights the far wall. A weathered painted
  sign fills the façade behind the table.
- **Portrait is composed, not cropped.** Phone sizes get their own camera and
  their own arrangement of the three props, because the desktop layout spread
  past both edges when it was scaled down.

### What has not changed

The information architecture, the Menu as the navigation hub, the progressive
preview and focused-reading states, keyboard operation, touch, browser
history, reduced motion, direct links and the Coffee route into the existing
Playground are all untouched. No puzzles, sections or features were added.

### Verification

`scripts/cafe-browser-qa.mjs` passes all 45 assertions at 1440, 390 and 320
widths, with no page errors. Projected hit targets track the meshes; at 1440
the Menu target is 173×245 px over the menu, Coffee 137×107, glasses 121×69.
The scene costs 129 draw calls and 113k triangles, and the assets total about
3.2 MB (2.7 MB glTF, 0.5 MB textures). Before/after screenshots at desktop,
tablet and mobile are in `docs/cafe-art-pass/`.

Automated passage is still not a visual-design approval.

### Remaining visual-quality limitations

- **No baked lighting or ambient occlusion.** Contact shadows come from a
  single shadow map, so small objects meet surfaces less convincingly than
  they would with baked AO. Baking in Blender and shipping a second UV set is
  the obvious next step.
- **Textures are procedurally painted, not hand-painted.** The plaster, paving
  and enamel are built from described structure rather than scattered noise,
  which is a large step up, but a human texture artist would still beat them —
  particularly on the crack networks, which remain a little even in density.
- **The building's roofline is out of frame.** At the distance a narrow street
  requires, a seated camera that keeps the table prominent cannot also hold a
  7.6 m roofline. The only sky in the composition is the wedge over the side
  street. This is a genuine constraint of the viewpoint, not an oversight.
- **Foliage is one shrub kit, repeated.** Three instances with varied rotation
  and scale. It holds at this distance, and more planting would fight the
  brief's restraint, but it would not survive being brought forward.
- **No ambience.** No sound, no passers-by, no animation beyond the steam and
  the seated parallax.


## Framing and naming pass: 2026-11-01

**The table now holds the frame.** It is a 1.15 m four-top rather than a
0.86 m two-top, the seated eye dropped to 1.15 m — a real seated eye height —
and the camera moved in to 0.66 m behind the table's near edge at a 24-degree
downward pitch. The far edge lands around 42% down and the near edge and both
near corners run off the bottom and the sides, so the table occupies roughly
58% of the frame.

The size change was the only way to get there. Two angles govern this
composition and they pull against each other: the table's far edge sits
`atan(eyeAboveTop / distanceToFarEdge)` below horizontal, and the top of
frame sits `fov/2 - pitch` above it. Pitching down to enlarge the table
therefore deletes the street — once the pitch passes half the field of view
the horizon itself leaves the frame, taking the façade, the painted sign and
the mouth of the side street with it. Widening the table enlarges it without
touching either angle.

Each breakpoint now stages the table for its own horizontal angle rather than
its own camera alone. A landscape frame at 62 degrees sees about 44 degrees
either side of the axis; a phone at 70 degrees sees 18. The desktop spread
pushed the menu and cup straight off both edges of a narrow frame, so the
props close up and stack front-to-back as the viewport narrows.

**The café is now Apollo**, replacing the placeholder Almar. The name is set
once, as `CAFE_NAME` in `tools/cafe-assets/build_textures.py`, and appears on
the printed menu cover and the painted wall sign. Both lockups auto-fit their
display type to the space, so the name can change length without breaking
either composition.

Browser QA passes all 45 assertions at 1440, 390 and 320 widths with no page
errors. The larger props make the projected hit targets correspondingly
bigger: at 1440 the Menu target is 241x343 px, Coffee 214x168, glasses
159x91.


## Direction change: hybrid staging, 2026-11-03

The full real-time street has been replaced by a **hybrid**: the street is a
painted backdrop, and the table with everything on it is real geometry
rendered over it on a transparent canvas.

### Why

The approved art-direction reference is a painted frame. A WebGL scene was
never going to reach its brushwork, and when the two were compared directly
the remaining gap was not modelling - it was hand-painted texture, global
illumination and depth of field, none of which real-time gives you. Asked to
choose between pushing the 3D further, going hybrid, or going flat 2D, the
decision was hybrid. This supersedes the earlier instruction not to use the
reference as a backdrop.

Each half now does what it is actually good at:

| | |
| --- | --- |
| painted | the street, the architecture, the light, the people |
| geometry | the table, menu, cup, glasses and ashtray - lit to match, and shifting against the backdrop when the viewer looks around |

### How the two halves stay registered

The backdrop is anchored by its **painted table line**, not by its centre.
That line was measured off the image at 63.5% of its height, and the CSS
`object-position: 50% 63.5%` makes the browser put it at 63.5% of the
viewport at any aspect ratio. The camera is then composed so the real table's
far edge lands on the same line. No per-breakpoint fudging is needed, and the
3D table is kept slightly wider than the painted one so it always covers it.

The camera position follows from that: the painted table nearly spans the
frame at its far edge, which only happens if you are leaning over it. The eye
sits 42 cm above the top and 27 cm behind its centre, so the table's near edge
is behind the lens rather than in the picture.

### Matching the light

The key light is placed to match the painted sun - low, left, in front - so
the geometry's shadows run the same way as the painted ones. A canopy hangs
outside the frame purely as a gobo, breaking the key into leaf dapple across
the table; its position is solved from the sun vector rather than guessed.
The backdrop doubles as the environment map, so the glaze on the cup and the
smoked lenses reflect the painting's own stone and sky.

The table's colour was matched by measurement, not by eye - the painted table
sits at roughly RGB (146, 57, 56), lightness 0.40, saturation 0.45, and the
first few attempts were out by a long way in both directions. Sampling the
left and right halves separately also caught that the dapple had been placed
on the sunlit side.

### What was removed

- The procedural street: corner building, terrace, kerbs, bollards, awnings,
  poles, pedestrians and the parked car. The asset pipeline still builds all
  of it and the GLBs are still committed; `building.glb` simply is not loaded.
- The painted reference ships with a mock-up of this site's own interface
  drawn into it. `tools/cafe-assets/prepare_backdrop.py` removes those four
  patches by resynthesising them from the pixels below, or every control would
  appear twice.

### Verification

Browser QA passes all 48 assertions at 1440, 390 and 320 widths with no page
errors, including a new check that the backdrop image actually loads. The
Menu, Coffee and Glasses hit targets still track their meshes.

### What still differs from the reference

- **The table's far edge is a straight line.** The painted table has rounded
  far corners inset from the frame; the 3D one is deliberately wider so it
  covers the painted one, which squares that silhouette off. Narrowing it
  would show the painted table's surface beside the real one.
- **No knee, chair arm or pot plant in the foreground.** The painting has all
  three at the bottom edge and the 3D table covers them. A visible avatar was
  ruled out earlier and that still holds; the chair and plant were tried in
  geometry and sit outside the frame at this camera distance.
- **The tabletop's surface detail is generated, not painted.** Its structure
  is described - chipping that follows the edges, a wear arc, cup rings - but
  it does not have the reference's per-pixel brushwork.
- **The cup is cleaner than the painted one**, which is chunkier and chipped
  around the rim.
- **Looking around is a parallax shift, not a camera move through a street.**
  The backdrop's perspective is fixed, so the shift is kept deliberately small.
