# Portfolio V2 — Repository Audit and Relational Content Map

This document is a validation boundary before rebuilding the portfolio UI. It separates verified current facts, stale/rejected material, proposals, and unresolved decisions so the implementation does not silently turn old code into current intent.

## 1. Confirmed current direction

These are current design requirements established in the portfolio discussion, not inferred from old code.

- The portfolio should represent Jacob through the experience of using it, not merely through copy and decorative animation.
- The central idea is perspective/framework: interactive art, games, and experiences can let someone briefly step into another way of seeing the world, with disability as a central area of focus.
- The desired first impression is intrigue: "why is this person doing this?" / "this is interesting; I want to understand it."
- The interface should behave relationally. Selecting something causes the environment to reorganize around that selection rather than simply navigating a conventional fixed hierarchy.
- Projects can connect through multiple dimensions (medium, theme, skill, subject, method) instead of belonging to only one section.
- Playable web projects should be able to open inside the portfolio when technically feasible.
- Current working bio: "I create interactive art, games, and experiences that let people step into another way of seeing the world."

## 2. Confirmed current portfolio codebase

Repository: `flimmbark-source/Jmeyportfolio`

The existing project is already a suitable technical base for the new experience:

- Astro 5
- React 19
- Tailwind CSS 3
- Framer Motion 12
- Netlify static deployment (`npm run build` → `dist`)
- Astro content collections already hold project data.

The current content schema is conventional and presentation-oriented (`order`, `slug`, `title`, `tagline`, `summary`, `highlights`, optional image/links/caseStudy). It does **not** yet model relationships between projects.

The current homepage is a conventional product-design portfolio with a fixed sequence of about-me, flagship projects, supporting projects, principles/process, etc. That is confirmed current code, but it is not being treated as proof of current design intent for V2.

## 3. Existing portfolio content

The current portfolio already contains these project records:

- IDL Workflow Reimagined
- AI Archiving Assistant
- Agora 21 Participation Hub
- The Intelligent Scouting Archive
- Earth Hero Habit Builder
- Rotogo Game App
- Letter River Learning App

Status for V2: **existing material, not automatically approved for the new portfolio.** Each should be reviewed for whether it still represents the intended public identity and whether its claims/copy are current.

## 4. Candidate repository inventory

### Get to the Café / `CrazyBod`

**Repo:** `flimmbark-source/CrazyBod`

**Verified implementation:** Vite + React + React Three Fiber + Three.js. The repository currently implements an ordinary-day traversal with persistent accumulating microgames, overload, a Go Home choice, scoring, and a café conversation.

**Portfolio fit:** very high. It directly connects interactive art, disability, embodied experience, game design, systems design, and experiential advocacy.

**Integration:** static Vite build should be straightforward to deploy independently and embed as a web experience. Exact live deployment URL and iframe policy still need verification.

### The Last Reading

**Repo:** `flimmbark-source/TheLastReading`

**Verified implementation:** JavaScript build pipeline with React 19, React Three Fiber, and Three.js. Package metadata describes a tarot-inspired card game with single-player readings and multiplayer duel mode. The repository includes a production bundle/build workflow and static HTML entry points.

**Portfolio fit:** candidate. Strong evidence of substantial interactive/game-system work, but its thematic relationship to the disability/framework identity needs to be decided rather than assumed.

### Hebrew Letter River

**Repo:** `flimmbark-source/HebrewLetterRiver`

**Verified implementation:** Vite + React + Tailwind + PWA tooling, IndexedDB, tests, and a large language-learning content/system layer.

**Portfolio fit:** high for systems design, learning design, accessibility, rapid prototyping, and interactive tools. It is already represented in the current portfolio, but the existing case-study copy should not automatically carry forward unchanged.

### Daily Hebrew Adventure

**Repo:** `flimmbark-source/Daily-Hebrew-Adventure`

**Verified implementation:** TypeScript + React 19 + Vite + Zustand + Tailwind.

**Portfolio fit:** candidate as a newer language-learning interaction experiment. Public-readiness and relationship to Letter River remain unresolved.

### PhaseG

**Repo:** `flimmbark-source/PhaseG`

**Verified implementation:** React Three Fiber disability-roguelike prototype. The current prototype carries persistent statuses/abilities between a first-person scene and a third-person rail section.

**Portfolio fit:** high thematic fit: disability, game systems, state, embodiment, and translating internal condition into mechanics.

**Caution:** the repository explicitly labels tuning values as provisional. Portfolio copy should describe the prototype, not present provisional mechanics as final canon.

### SplitPulse

**Repo:** `flimmbark-source/SplitPulse`

**Verified implementation:** Vite + TypeScript + React + Zustand + React Three Fiber/Three + SVG + WebAudio. It is an on-rails first-person alchemical action-rhythm prototype with a diagrammatic configuration/execution system.

**Portfolio fit:** candidate for interaction/system design and experimental game mechanics. The thematic link to the central disability/framework identity should be curated rather than presumed.

### Lingua Forge

**Repo:** `flimmbark-source/LinguaForge`

**Verified implementation:** plain HTML/CSS/JavaScript ES modules. A Hebrew word/verse construction game structured around letter generation, molds, forging words, and reconstructing verses.

**Portfolio fit:** candidate as an earlier language/game experiment. Likely easy to host/embed technically, but it may overlap with stronger later Hebrew-learning work.

### Just Wash the Dishes / `WashDishes`

**Repo:** `flimmbark-source/WashDishes`

**Verified repository state:** currently contains the GDD document only. There is no web implementation in the repository at present.

**Portfolio fit:** very high conceptually, but it cannot currently be treated as a playable embedded project. It can be shown as a concept/work-in-progress unless/until a prototype is added.

### THRALL / `KeySlash`

**Repo:** `flimmbark-source/KeySlash`

**Verified repository state:** contains a React/Three/R3F experiential vertical slice.

**Important conflict:** the repository README describes systems that conflict with later explicit design corrections for Divine Struggle/Thrall, including Traces, both input devices remaining live, and framing the slice as not a boss fight. Those repository statements are therefore **stale implementation/reference material, not current design authority**.

**Portfolio status:** unresolved. We should not describe the current project using the stale README mechanics unless they are explicitly re-approved. The build may still be useful as an artifact showing an earlier iteration, but it must be labeled accurately if surfaced.

## 5. Rejected / stale foundations for V2

Do not reintroduce these as if they were still the design:

- A conventional fixed portfolio hierarchy with fancy motion pasted onto it.
- Starting from one isolated "cool interaction" and treating that as the site's governing idea.
- Assuming repository code/README text is current design intent when later explicit corrections conflict with it.
- Treating every GitHub repository as automatically portfolio-worthy.
- Combining all game repositories into one monorepo merely to display them.
- Automatically deriving public-facing copy from repository README files.

## 6. Proposed relational model

This is a proposal to validate before implementation.

Each public item becomes a node with curated relationships rather than a member of one exclusive section.

```ts
type PortfolioNode = {
  id: string
  title: string
  kind: 'interactive-art' | 'game' | 'tool' | 'case-study' | 'experiment' | 'writing'
  status: 'featured' | 'public' | 'candidate' | 'wip' | 'archive'
  summary: string

  themes: string[]       // disability, perspective, language, identity, attention...
  practices: string[]    // UX, systems design, research, game design, prototyping...
  mediums: string[]      // browser game, 3D, text, physical installation...

  related: string[]      // explicit hand-curated node IDs

  repo?: string
  playUrl?: string
  caseStudyUrl?: string
  embed?: {
    mode: 'iframe' | 'internal'
    url: string
  }
}
```

The relationship fields should be curated by hand at first. GitHub metadata can inform the registry, but it should not determine meaning.

## 7. Proposed interaction architecture

This is a design proposal, not yet implemented.

- Astro remains the page/build shell.
- A React "relational canvas" owns the interactive state.
- Framer Motion handles layout transitions and shared-element movement.
- Selecting a node changes the active context rather than navigating immediately to a separate page.
- The selected node expands/repositions; weaker relationships recede; related nodes move into stronger positions.
- Drilling deeper changes which relationship dimension is being emphasized.
- Back/close restores the prior relational state instead of resetting the entire page.
- Games can open in a focused playable layer inside the environment when embedding permits it.
- Conventional URLs should still exist for shareability/accessibility even if the primary interaction feels spatial and continuous.

## 8. Embedding constraints to verify per game

A web build being static does not automatically mean it will behave correctly inside an iframe. For each game selected for embedding, verify:

- deployed URL exists and is stable
- response headers allow framing (no blocking `X-Frame-Options` / CSP `frame-ancestors`)
- keyboard focus behaves correctly
- fullscreen/pointer-lock requirements
- audio autoplay/user-gesture requirements
- responsive behavior at portfolio embed sizes
- mobile/touch support or a deliberate desktop-only state
- persistence/localStorage behavior across embedded and standalone use

If a project is awkward to embed, the portfolio can still use the same relational expansion but present a launch/standalone action instead of forcing a broken iframe.

## 9. Current unknowns requiring user validation

These should remain unresolved until explicitly decided:

- Which existing corporate/product-design case studies remain public in V2.
- Which newer game prototypes are portfolio-worthy versus private/archive experiments.
- Whether the public identity should lead with "interactive artist," "designer," "game designer," a hybrid phrase, or avoid a job-title-first framing entirely.
- Whether language-learning projects form their own visible cluster or emerge only relationally.
- Which project should be the initial focal node on first load.
- Exact visual language: typography, color, texture, geometry, density, and imagery.
- Exact relationship vocabulary used in the interface.
- Whether unfinished projects should be visible as living work or hidden until playable.
- Deployment URLs and iframe compatibility for most repositories.

## 10. Recommended next implementation boundary

After validating the candidate list, build only the **relational shell + curated registry**, without polishing project pages yet:

1. replace/extend the existing content schema with relational fields
2. add 3–5 confirmed nodes only
3. implement focus / expand / reflow / back state transitions
4. make URLs/deep links correspond to active nodes
5. embed one verified web project as the first technical proof
6. test keyboard navigation, reduced motion, mobile layout, and browser history

Once that grammar works, the rest of the projects can enter the same system without inventing a new navigation model for each one.
