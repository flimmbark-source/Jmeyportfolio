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
- `src/scripts/cafe-world.js`: Three.js 3D street, rectangular weathered café table, branded physical menu, blue cup, glasses, architectural details, sunlight/shadows, responsive camera and projected touch targets.
- `public/cafe/street.svg`: fallback only if WebGL is unavailable. **Not final art.**
- `public/scripts/cafe.js`: object selection, hover/focus behavior, categories, project previews, reading state, browser history, focus containment, and limited seated camera parallax.
- Coffee routes to existing `/`. Secondary props link to existing résumé/contact; glasses provide an optional visual-lens panel.

## Source-of-truth rules
- Project summaries and links come from existing repository content. Never show generated concept art as a real project screenshot.
- The original physical photo is an art-direction reference, not currently bundled as a deployable asset.
- Unfinished projects are labeled as unfinished.
- The generated visualization boards are directional only. Their idealized tourist-street architecture and round table are **rejected**.
- The scene now uses local, pinned Three.js and real WebGL, but its procedural geometry and textures remain **visual blockout-quality**. Artist-authored stylized models, original surface textures and audiovisual ambience remain unresolved.

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
