# Jacob Meyerkopf Portfolio

Interactive portfolio built with Astro, React, and Framer Motion.

## Run it in GitHub Codespaces

1. Open this repository in a Codespace on the `portfolio-v2` branch.
2. Wait for the Codespace terminal to finish starting.
3. Install dependencies:

```bash
npm install
```

4. Start the development server and expose it to Codespaces:

```bash
npm run dev -- --host 0.0.0.0
```

The `predev` script automatically runs `npm run prepare:gttc`, which prepares the local Get to the Café browser build before Astro starts.

5. When Codespaces reports that port `4321` is available, click **Open in Browser**. If it does not appear automatically, open the **Ports** tab, find port `4321`, and open its forwarded address.

Astro will hot-reload as files change.

## Quick start

```bash
npm install
npm run dev -- --host 0.0.0.0
```

## Useful commands

```bash
# Development server
npm run dev -- --host 0.0.0.0

# Production build
npm run build

# Preview the production build in Codespaces
npm run preview -- --host 0.0.0.0

# Prepare only the local Get to the Café build
npm run prepare:gttc
```

## Project structure

- `src/pages/index.astro` — main interactive portfolio entry
- `src/components/RelationalPortfolio.jsx` — Work, project, and Playground UI
- `src/data/portfolioV2.ts` — portfolio/game metadata and links
- `public/scripts/portfolio-physics-v3.js` — floating-block physics and incremental-game interactions
- `src/styles/portfolio-v2*.css` — portfolio presentation and responsive behavior
- `games/get-to-the-cafe/Sprimbo.zip` — packaged Get to the Café browser build prepared during dev/build

## Notes

- Use the `portfolio-v2` branch for the current interactive portfolio.
- Desktop is the primary environment for the floating-block physics interactions. Mobile uses a more stable responsive layout.
- If the Get to the Café preparation step fails, make sure the Codespace has the standard `unzip` command available, then run `npm run prepare:gttc` again.
