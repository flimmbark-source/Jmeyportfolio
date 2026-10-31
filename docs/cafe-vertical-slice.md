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
