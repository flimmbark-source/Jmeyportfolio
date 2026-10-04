# Chest reward screen QA

Approved visual references: chest storyboard and ivory fact-window preview from this conversation.

Final result: passed.

Browser verification used an explicitly authorized local headless Chromium session at 1440 × 1024 and 390 × 844. Captured fact, opening, and choice states and compared them with the approved storyboard, including a combined reference/implementation image. No page script errors occurred. Mobile dialog bounds were x12, y169, width366, height506, within the viewport.

Verified flow: fact appears first; player opens chest; latch and lid animate; light, 24 transient particles, and arcade fanfare appear; three existing upgrade choices emerge; selecting one applies exactly one upgrade and resumes play. Reduced-motion mode presents three choices without particle/travel animation. DOM checks also covered duplicate-selection guards and interrupted-fanfare requeue without delayed resurrection.

Fidelity review:
- Typography uses existing app system text and colorful arcade LEVEL UP emblem.
- Ivory windows, charcoal borders, and pale yellow headers follow the approved app palette.
- Fact text and actual upgrade effects from the current branch are preserved.
- Existing illustrated mechanic icons are retained, as approved; the fact recedes before choices.
- Chest sprite has four transparent, aligned frames. In-page crops remove excess transparent padding while retaining the shared baseline.
- Desktop and mobile spacing, image clarity, and full dialog visibility were checked.

Comparison iteration: initial browser renders revealed excessive transparent padding making the chest too small (P2). Tightened the sprite display crop and resting-chest dimensions, then repeated desktop/mobile browser checks. Resolved. No remaining P0–P2 findings.

Validation: production Astro build, JavaScript syntax, whitespace checks, DOM interaction checks, and browser desktop/mobile/reduced-motion checks passed. Browser test instrumentation was injected only by the test harness and is absent from production source.
