# Portfolio V2 — Confirmed Public Roster and Presentation Rules

This file records the latest explicit direction for the public-facing V2 experience. It takes priority over earlier candidate-list language in `portfolio-v2-audit.md` where the two differ.

## Confirmed current facts

- The new site is not intended to behave like the current case-study portfolio.
- Its purpose is to let visitors experience Jacob's design work and design intent through the work itself.
- Products and playable experiences are primary; case studies are optional supporting destinations, not the governing structure.
- UX Work remains available through the classic portfolio rather than being forced into the experiential presentation model.
- The interface remains relational: categories are useful entry points, but projects can connect across themes/practices rather than belonging to only one rigid folder.
- Unfinished work is intentionally visible as an explicit subset rather than being hidden or relabeled as finished work.

## Confirmed public roster

### UX Work

- UX Work → classic portfolio

### Games

#### Disability

- Get to the Café

#### Education

- Letter River

#### For Fun

- Rotogo
- Gig Duel
- The Last Reading
- Additional projects may be added later; "etc." is not treated as an approved exhaustive list.

### Unfinished

- PhaseG
- SplitPulse
- Just Wash the Dishes
- Additional unfinished projects may be added later only after explicit curation.

## Verified implementation notes

- `Get to the Café` maps to `flimmbark-source/CrazyBod`; a current public HTML5 build exists at `https://whooble.itch.io/gettothecafe`.
- `Letter River` maps to `flimmbark-source/HebrewLetterRiver`; the existing portfolio points to `https://letterriver.netlify.app/`.
- Letter River's current Netlify headers explicitly block iframe embedding with both `frame-ancestors 'none'` and `X-Frame-Options: DENY`. It must remain a launch link unless that policy is deliberately changed.
- `The Last Reading` maps to `flimmbark-source/TheLastReading`.
- `PhaseG` maps to `flimmbark-source/PhaseG` and is explicitly a prototype slice.
- `SplitPulse` maps to `flimmbark-source/SplitPulse` and is explicitly a vertical slice.
- `Just Wash the Dishes` maps to `flimmbark-source/WashDishes`; the repository currently contains the GDD rather than a playable web build.
- `Gig Duel` is confirmed as a public roster item, but its repository/build mapping remains unresolved. Do not substitute another duel repository by name similarity.
- `Rotogo` is confirmed as a public roster item and has an existing classic-portfolio route, but its current standalone repository/build mapping remains unresolved.

## Rejected / stale framing

- Do not redesign the classic portfolio and call that the experiential site.
- Do not require case studies for every project.
- Do not treat unfinished work as finished.
- Do not make GitHub metadata the public information architecture.
- Do not infer the identity of Gig Duel from repositories with similar names.

## Current implementation boundary

The first implementation lives at `/v2` on the `portfolio-v2` branch so the existing root portfolio remains intact during validation.

The first interaction shell contains:

- UX Work
- Games
- Unfinished

Selecting a node reorganizes the visible field around that node's explicit connections. The current prototype supports navigation into Games → Disability → Get to the Café and equivalent paths through the other confirmed nodes.

This `/v2` placement is temporary. After the interaction grammar is validated, the intended promotion path is:

- `/` → experiential portfolio
- `/ux` → preserved classic UX portfolio

That promotion has not happened yet.
