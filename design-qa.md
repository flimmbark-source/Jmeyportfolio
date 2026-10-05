# Level-up presentation review

## What this pass changed

The reward sequence was rebuilt around how card-choice level-ups work in the
genre: celebrate briefly, let the player skip, and put the decision-relevant
information on the card.

1. **Pacing.** Reading the previous code, a card became clickable 2180 ms after
   "Press to Continue" (the chest cinematic) plus a further 900 ms during which
   every card was `disabled` while it flew in — about 3.1 s before the player
   could act, with no way out. The cinematic is now 980 ms, the deal is 320 ms
   with a 40 ms stagger, and the cards are never disabled. Measured in Chromium,
   click to interactive card is ~1.56–1.63 s.
2. **Skippable.** A Skip control, a click anywhere, and Enter / Space / Escape
   each jump straight to the cards. A reward animation the player has already
   seen is a delay, not a reward.
3. **Rarity is the card.** The tier now sets the frame colour, the banner, the
   label and the icon-tile accent through one pair of custom properties
   (`--pv2-rarity` / `--pv2-rarity-wash`). Previously rarity survived only as a
   0.6 rem word, because the choices layer repainted every border the same
   charcoal.
4. **Rank and stacks.** Each card states `Rank 2 → 3 of 4` with matching pips.
   "+15% drift speed" is not a decision until the player knows whether this is
   their first copy or their last; the data (`maxStacks`, the per-project
   upgrade map) was already there and simply was not shown.
5. **Queue count.** When several projects cross a threshold together, both the
   reveal and the choices screen carry a `+N more` chip, refreshed live as
   further level-ups queue behind an open window.
6. **Keyboard.** 1–3 choose, ← → ↑ ↓ move, Home / End jump, Enter / Space /
   Escape skip the cinematic. Tab wrapping is unchanged. The key badges and the
   hint row appear only under `(hover:hover) and (pointer:fine)`.
7. **One scrim.** Both phases dim the playfield equally. The choices screen
   previously used no scrim, so moving from the reveal to the cards looked like
   the interface had dropped a layer.

## Confirmed decisions carried forward

Ivory / charcoal / yellow app windows; the arcade LEVEL UP emblem; fact first;
the rotating multicolour window border; the chest; three independently styled
opaque upgrade windows outside a shared panel; choose exactly one upgrade and
resume. Project facts and upgrade effects are unchanged. The chest button stays
out of the fact screen, and there is still no pale backing behind the card
group.

## Stylesheet consolidation

The level-up presentation had accumulated eight override layers. Removed as part
of this pass, because they made any visual change unpredictable:

- `.pv2-project-levelup__project-info` and its keyframe — styled, never emitted.
- The eight `[data-side]` placement rules — the panel is always centred.
- Two competing `@media (max-width:720px)` panel blocks, both using `!important`.
- The perimeter sparkle machinery: 28 nodes built in JS and repositioned on every
  resize, under a `visibility:hidden` rule.
- Duplicate `@keyframes pv2RewardGlow`, and `__reveal` / `__rule` /
  `__chest-rest` / `__game-heading`, none of which the script emits.
- Two `!important` rules setting the card icon tile from opposite directions.

Every selector the reward flow uses is now defined once, in one block.

## Browser evidence

Headless Chromium, production Astro build served by `astro preview`, at
1440 × 1024, 390 × 844 and 844 × 390. 18 scripted checks pass on three
consecutive runs with no page errors: cinematic timing, Skip control, Escape
skip, number-key selection, double-press guard, dismissal of the unchosen
cards, the live-region announcement with rank, arrow and End focus movement,
rank text, pip counts, three distinct tier colours, rarity labels, the
assistive label, the queue chip on both screens, reduced-motion timing and
particle suppression, and overlay teardown with requeue when the player leaves
mid-cinematic.

## Limits and open items

- Full assistive-technology testing and device performance profiling are outside
  these browser checks.
- Mechanics with no illustrated icon (Mentor, Gravity Well, Autopilot and the
  other `neutral` theme entries) still fall back to the line-art SVG. The tile
  now matches the illustrated ones in size and treatment so the fallback reads
  as quieter rather than broken, but the artwork itself is not invented here.
- Separate from this work: `/v2/` does not import `portfolio-chrome.css`, so
  `--pv2-nav-height` is unset there, `.pv2-overview__stage` computes to `0px`,
  and `playgroundIsVisible()` returns false — level-ups never present on that
  route. `/` is unaffected. Not fixed in this pass.
- No claim of universal professional or game-design standards compliance.
