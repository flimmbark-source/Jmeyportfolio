# Jacob Meyerkopf Portfolio

Interactive portfolio built with Astro, React, and Framer Motion.

## Quick start

```bash
npm install
npm run dev -- --host 0.0.0.0
```

`predev` runs `prepare:gttc` (unpacks the local Get to the Café browser build)
and `optimize:images`, so the dev server starts with everything it needs.

## Useful commands

```bash
npm run dev -- --host 0.0.0.0     # development server
npm run build                      # production build
npm run preview -- --host 0.0.0.0  # preview the production build
npm run prepare:gttc               # only the Get to the Café build
npm run make:social                # regenerate favicon, touch icon, social card
```

## How the site is put together

One visual system across every screen: the painting backdrop, the `pv2-*`
styles, and a single navigation.

- `src/data/siteNav.ts` — the routes and the nav list. **Every link that can
  move lives here.** Stored hrefs in content JSON go through `resolveHref`, so
  moving a route is a change in this one file.
- `src/components/SiteNav.astro` — the navigation bar, plus the larger-text
  control. The homepage and playground render the same list in React, because
  they fade their chrome in with the arrival.
- `src/components/SiteHead.astro` — title, description, canonical, social
  cards, icons, and the accessibility preference applied before first paint.
- `src/layouts/PortfolioShell.astro` — the shell for long-form pages: nav, a
  bar with the way back to Work and this page's sections, reading progress.

### Routes

- `/` — the homepage. Opens on the statement with two doors: Work to the left,
  Play to the right. Play releases the arrival in place, so the threshold and
  the playground are one route. Deep links are `/?project=<id>`.
- `/ux` — Work: selected case studies, experience, explorations, contact.
- `/research` — the research questions behind the interactive work.
- `/contact`
- Case studies — `/letter-river`, `/idl`, `/ai-archiving`, `/agora-21`,
  `/bball`, `/rotogo`.
- `/playground` — a redirect to `/`, keeping links shared while the playground
  lived there working. `/home-v2`, `/ux-v2`, `/start` and `/v2` redirect from
  `netlify.toml`.

### Content

- `src/content/projects/*.json` — case-study copy, rendered by
  `src/layouts/CaseStudyLayout.astro`. Letter River and Rotogo have bespoke
  React case studies instead.
- `src/data/portfolioV2.ts` — the playground's nodes, connections and links.
- `public/scripts/portfolio-physics-v3.js` — floating-block physics and the
  incremental-game interactions.

## Notes

- Desktop is the primary environment for the floating-block physics. Mobile
  uses a more stable responsive layout.
- The social card and icons in `public/` are generated and committed; a build
  never runs the generator. Re-run `npm run make:social` after changing the
  palette or the card copy.
- If `prepare:gttc` fails, make sure `unzip` is available, then run it again.
