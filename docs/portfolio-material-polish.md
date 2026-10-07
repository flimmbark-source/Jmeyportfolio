# Portfolio material polish

## Confirmed current facts

- The requested target is `feature/levelup-choose-pulse`.
- Playground is the playable project showcase. Work contains the project
  gallery and individual project views. UX is the earlier professional portfolio.
- The existing design uses ivory, charcoal, art backgrounds, circular project
  crops and Motion page transitions. Those remain the visual foundation.
- The new layer adds local clear-coat light to spheres, a maximum 2.5-degree
  tilt to Work artwork, and up to 3px of movement to inner navigation labels.
  Form fields and pointer targets remain stationary.
- Fine-pointer tracking stops for reduced motion, the existing Stop motion
  control, dragging, hidden pages, and keyboard input. Touch retains the static
  frames and existing tap behavior. No additional package or licensed asset is used.

## Rejected or stale facts

- Pointer-driven background parallax, warped sphere artwork and a replacement
  sphere positioning system were rejected. Do not add them through this layer.
- Older conceptual-graph documentation is not authority to replace the current
  Playground/Work navigation.
- This pass does not revise level-up timing, mechanics, progression or presentation.

## Unresolved facts

- The user described Contact as a route for research connections. Current copy
  covers broader enquiries, while Research has a collaboration form. Copy and
  routing need a separate content decision.
- Work's existing heading remains “All Games.” This is not evidence that all
  future work must be a game.
- Automated controller checks do not establish visual quality or real-device
  frame rate. Record rendered verification separately.

## Verification

- `npm run build` builds the Astro site and bundled game.
- `node --test scripts/test-portfolio-polish.mjs` checks motion preferences,
  touch/drag handling, frame-loop settling, geometry isolation and cleanup.
