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
- `src/styles/cafe.css`: layered 2.5D café stage, physical props, illustrated two-page Menu, contextual preview, and focused-reading panel.
- `public/cafe/street.svg`: deliberately simplified drawing using the photo's narrow street, white plaster walls, awning, street bollards, and morning lighting. **Not final art.**
- `public/scripts/cafe.js`: object selection, hover/focus behavior, categories, project previews, reading state, browser history, focus containment, and limited seated camera parallax.
- Coffee routes to existing `/`. Secondary props link to existing résumé/contact; glasses provide an optional visual-lens panel.

## Source-of-truth rules
- Project summaries and links come from existing repository content. Never show generated concept art as a real project screenshot.
- The original physical photo is an art-direction reference, not currently bundled as a deployable asset.
- Unfinished projects are labeled as unfinished.
- The generated visualization boards are directional only. Their idealized tourist-street architecture and round table are **rejected**.
- This slice is not a WebGL/React Three Fiber scene yet. A production 3D asset workflow remains unresolved.

## Verification
- GitHub Portfolio CI push build passed for commit `0aa7511bf46ba48f05918719cccc32428db083d5`.
- Astro's build log explicitly generated `dist/cafe/index.html`.
- This is a production-build check, **not** a screenshot review or browser interaction test.

## Manual acceptance checks before promotion
1. Open `/cafe` at desktop and mobile sizes. All primary objects should be visible and discoverable without hunting.
2. Open Menu, switch categories, preview a real project, expand reading, and return. Escape and browser Back must produce understandable state transitions.
3. Check UX work is findable in seconds and résumé/contact are one interaction away.
4. Test keyboard-only operation and reduced motion.
5. Confirm imagery is sourced from the existing project, not invented.
6. Click Coffee and check the existing Playground still works. Return via browser Back.
7. Review mobile cropping and scene clarity, then decide whether to move to WebGL/R3F before art production.

## Next implementation milestone
Review the **actual running** slice, fix usability and responsive problems, and approve a faithful 3D scene composition. Only then proceed to illustrated asset production and ambient life.
