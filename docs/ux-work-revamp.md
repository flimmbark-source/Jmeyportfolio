# Current revision: work that supports people

The approved narrative is now “Making work work for people.” IDL leads with
an explorable, simplified workflow: information preparation, drawing, handoff,
and QC, connected by shared learning. The account comes from the owner's
clarification about SolidWorks efficiencies, coworkers' shortcuts, cross-team
information encoding, quicker handoffs, streamlined QC, and cooperation.

Visitors select a stage to reveal its explanation in place or show everything.
Native buttons expose selection and associated panel IDs. All explanations
render without JavaScript, with controls revealed only after initialization.
No autoplay, forced tour, or fabricated before/after artifact is introduced.

The 480/120/37 minute comparison preserves team versus individual attribution.
Earth Hero and Letter River support the story through motivation and learning,
with optional decision explanations. The IDL case study now carries the same
collaborative account. Stress, autonomy, and monetary gains remain aims, not
measured outcomes. The playground cue fix remains included in this PR.

Validation: Astro production build passed. Built Work and IDL pages passed
internal destination, image, ID, and ARIA-target checks. All five explanations
are available in static HTML. Browser checks confirmed stage selection,
keyboard activation of Show all, and no desktop overflow with larger text.
Mobile-specific browser verification remains outstanding.

---

## Superseded implementation notes

# `/ux` — editorial Work layout, November 2026

The current page follows the approved editorial concept: a short hero, Earth
Hero as the flagship, two supporting projects, expandable experience and
explorations, and a compact contact footer. The earlier notes below describe
the superseded layout and its original asset fixes.

## Current implementation

- Retains shared typography, navigation, painting backdrop, larger-text control,
  case-study routes, resume, external prototypes, and contact links.
- Earth Hero pairs the original paper wireframes with the repository’s actual
  prototype screenshot. A question/design/evidence strip explains the work
  without inventing confidential session findings or performance metrics.
- Letter River uses its gameplay screenshot rather than its home screen.
- IDL makes 8h → 37m visible while retaining the 2h team intermediate result.
- Native details/summary disclosures retain every experience and exploration
  entry while shortening the default page. No new client-side JS is needed.
- Layout stacks below 760px, with an additional narrow-phone adjustment.
  Focus styles, image descriptions, external-link announcements, and a skip
  link are included.

## Validation for this revision

- `npm run build` passes, generating all 15 routes.
- Built `/ux` internal links, images, fragment targets, and unique IDs pass.
- Browser inspection at 1363px: images render, no horizontal overflow,
  experience and project disclosures open, and larger-text control works.
- Mobile browser rendering was not verified in this environment.
- Only `/ux` presentation changes. Case-study content and playground behavior
  are unchanged. Preview-only host configuration was removed before commit.

---

## Previous revision (historical)

# `/ux` — the Work screen, revamped

The brief was "revamp the UX Work section." The page was not badly made: the
type, the painting backdrop and the panels were already consistent with the rest
of the site, and the willingness to say what is a concept and what is built is
the most unusual thing on it. So this pass did not restyle it. The problem was
informational, and it is the kind that a visual rebuild would have carried
straight across.

## What was wrong

**Two images were simply broken.** `/ux` asked for
`Desktop_Hero_Screen-1400.webp` and `idl-case-study-1100.webp`;
`scripts/optimize-images.mjs` only ever emitted one width, `ARTWORK_WIDTH = 768`.
Both files had never existed, so the lead image of two of the three case-study
cards rendered as a grey alt-text bar. An audit of every `/images/derived/`
reference in the repository found exactly those two missing and every other one
resolving.

**Every card said the same thing twice.** A sharp framing sentence
(`claims` in the page) was followed immediately by the project's CV-style
`summary`, which restated it in flatter words. The second paragraph did not add
a fact; it halved the force of the first.

**No card stated an outcome.** Earth Hero's adoption by the client sat at the
end of its case study. Letter River had no outcome anywhere. IDL's — the
strongest evidence on the page, 480 → 120 → 37 minutes — was drawn in small grey
bars at the bottom of the third card, below the fold of that card.

**The hero promised and proved nothing.** The panel beside the headline was a
paragraph restating the experience timeline printed further down the same page.

**The section intro described the wrong three projects.** It read "A learning
interface, a professional CAD workflow, and an AI review concept." The AI review
concept is in Further explorations; the actual three are Earth Hero, Letter River
and IDL.

**IDL's achievement was on the page three times** — in the card claim, in the
card summary, and verbatim again in the experience timeline.

## What changed

- **The optimizer emits a second width.** `LEAD_WIDTH = 1400` for
  `Desktop_Hero_Screen.png` and `idl-case-study.png`, at quality 80
  (4403 KiB → 200 KiB). `idl.json` and `/ux` were repointed from the
  never-generated `-1100` to `-1400`, so there is one width to reason about.
- **One card anatomy**: label → title → claim → outcome → role/scope/dates →
  the piece's own visual → actions. The `summary` paragraph no longer renders on
  a card; it still carries the Further-explorations index below.
- **The outcome is its own element**, set at heading weight against the accent
  rule, with the honest qualifier underneath it rather than a second helping of
  praise — what Earth Hero's findings belong to, what Letter River has not
  measured, which share of IDL's gain was the team's.
- **Role, scope and dates** are a small row on every card. It is the first thing
  a reviewer asks, and the only place a volunteer engagement is told apart from
  a staff job instead of being flattened into one word.
- **Actions moved to the end of the card.** On the IDL card the button used to
  land between the writing and the two artefacts.
- **Three checkable facts replace the hero paragraph** — 8h → 37min, 500+
  locations, elements taken into Earth Hero's released app.
- **IDL's claim was rewritten.** It had repeated the numbers that now sit in the
  outcome. The claim's job is the problem and the approach; the outcome's job is
  the result.
- **The Earth Hero loop runs horizontally on wide screens.** Five steps stacked
  in a column filled a third of a 1024px panel, and a loop drawn as a vertical
  list does not read as a loop. The connector is the same pseudo-element turned
  on its side: each step after the first draws the segment back to the one
  before it, which is one item plus one gap, so the line stops at the last number
  with no step count written into the CSS.
- **The drawings photograph and the chart share a fixed height**, so they read as
  a pair rather than as a tall image with a small chart parked beside it.
- **The timeline no longer repeats** the Tech Fleet adoption or the IDL numbers.

## Validated

Against the production build (`dist`), at 1440×900 and 390×844, on `/ux`,
`/idl`, `/`, `/letter-river` and `/earth-hero`: no 4xx, no console errors, no
broken images, no horizontal overflow. On `/ux`: three cards, each with an
outcome, three facts and the actions row last; no card opens on anything but its
label; heading order is `h1, h2, h3×3, h2, h3×4, h2, h3×4, h2`.

## Known limits and things not done

- `scripts/test-portfolio-performance.mjs` has two failing tests
  ("live simulation reflects at walls…", "wall contact uses the visible
  sphere…"). They fail identically on the commit before this one — they are
  playground physics, untouched here, and are not fixed by this change.
- The outcome for Letter River is "built, and public." That is honest but it is
  the weakest of the three, because the prototype has no measured learning
  outcome. The fix is a study, not copy.
- Earth Hero's card cannot quote a finding, because the session findings belong
  to the client engagement. The card says so rather than implying otherwise.
- Further explorations is still an index of four pieces, three of which have no
  image of the work. That was a deliberate earlier choice and this pass did not
  revisit it.
