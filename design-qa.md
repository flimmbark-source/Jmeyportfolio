# Level-up reward QA

Confirmed current direction: the latest user request replaces the chest button in the fact window with a small Press to Continue footer, sparkles converging at bottom center into the chest, then free-standing upgrade choices with Click an Upgrade and ongoing sparkles behind them. The prior enclosing upgrade window and fact-screen chest button are superseded. App ivory/charcoal/yellow colors and existing mechanic icons remain.

Interpretation disclosed to user: the bottom window border breaks around the footer text. No additional interaction or progression mechanic was added.

Implementation: native keyboard-accessible footer button, converging particles from the former window bounds, bottom-center chest formation and opening, existing fanfare, three choices emerging from the chest without an outer window. Desktop has three columns; mobile has three rows. Bounded 24-particle loops sit behind the options and disappear with the reward overlay. Reduced motion skips convergence and travel while preserving the sequence and selection.

Browser verification: authorized local headless Chromium at 1440 × 1024 and 390 × 844. Inspected fact, opening, and choice screenshots. Mobile choice bounds x12, y175, width366, height359, with chest below. All three choices visible, selection resumes play, reduced-motion mode presents three choices, no page script errors. Keyboard Enter opens the reward. Checked fact has no chest and choices have no panel. Delayed image-loading test confirms reward waits for all 13 preloaded/decoded images before presentation. Timed stages recheck active event, overlay identity, and view visibility before mutation.

Visual iteration: changed footer focus from an enclosing box to an underline, increased ongoing sparkle size, and increased backing opacity for readable upgrade text. Current code preserves existing project facts and upgrade effects.

Validation: production Astro build, JavaScript syntax, whitespace checks, desktop/mobile reward flow, reduced-motion flow, and image-readiness browser checks passed.

Final result: passed.

Window-edge correction: added a rotating masked conic color texture confined to a 3px border and 28 pink, cyan, violet, and yellow perimeter sparkles. Spark positions use measured window dimensions on resize. Continue captures the actual spark positions/colors before converging them into the bottom-center chest. Chest particles carry the multicolor palette. Reduced-motion mode retains a static colored border and sparkles. These are CSS/DOM visuals available with the initial stylesheet, with no new network assets. Screenshot inspection caught incorrect motion-path placement and it was replaced with measured perimeter positions and twinkling sparkles.
