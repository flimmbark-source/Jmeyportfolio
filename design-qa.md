# Level-up presentation review

## What this pass changed

The reward sequence was rebuilt around how card-choice level-ups work in the
genre: celebrate briefly, let the player skip, and put the decision-relevant
information on the card.

6. **No scrim.** The playfield stays at full strength behind the reward and the
   windows carry their own contrast, so the backdrop painting is not muted and
   neither phase changes what is behind it. An earlier pass dimmed both phases
   equally; that wash is gone.

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
assistive label, reduced-motion timing and particle suppression, and overlay
teardown with requeue when the player leaves mid-cinematic.

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
