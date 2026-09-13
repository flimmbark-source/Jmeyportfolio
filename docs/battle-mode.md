# Battle Mode (RPG genre-bend)

The work-page incremental game hides an RPG. Landing a **Critical Combo** — 5
powered bumper hits within 1 second — dissolves the floating overview into a
classic turn-based battle. The game blocks become your **party** (each its own
class); the text blocks (UI / Systems / Workshop) become **the boss**. Dealing
damage generates points.

## Status: scaffold / preview

Shipped so far is the **foundation**, gated behind a preview flag so it is not
live for visitors:

- **Enable:** open the work page with `?battle=1` (persists in `localStorage`);
  `?battle=0` disables.
- **Trigger:** land a Critical Combo, or press **`b`** on the work page while
  enabled. `Esc` or **Flee** exits.
- The physics sim freezes under the battle overlay and resumes on exit.
- A working turn loop exists: click a ready party member to attack the boss;
  damage → points; **End turn** hands the turn to the boss, which strikes a
  random member; victory (boss HP 0) awards a bonus, defeat ends the run.
- Classes and one placeholder synergy (a small bonus when ≥2 members act in a
  round) are stubs — the numbers are not balanced.

### Wiring

| Event (`window`) | Direction | Meaning |
| --- | --- | --- |
| `pv2:bumper-hit` | physics → battle | a powered bumper hit landed (combo detection) |
| `pv2:battle-pause` / `pv2:battle-resume` | battle → physics | freeze / resume the sim |
| `pv2:add-points` | battle → physics | credit points earned in battle |

Files: `public/scripts/portfolio-battle.js`, `src/styles/portfolio-battle.css`.
Class kits live in the `CLASSES` map keyed by game-block id — easy to expand.

## The next design pass (open questions)

The combat depth is the part to design together before it goes live:

1. **Class kits.** Each game block is a class. What is each one's identity,
   and what 1–2 abilities (beyond a basic attack) does it bring?
   Current placeholders: Barista (Tempo), Scribe (Caster), Reader (Warden),
   Striker (Brawler), Duelist (Burst).
2. **Synergies.** The core hook: "synergistic combos between classes." What
   pairings/orderings combo, and what do they do (bonus damage, chain, buff,
   shield)? Today only a flat ≥2-actors bonus exists.
3. **The boss.** One HP pool, or three parts (UI / Systems / Workshop) with
   their own behaviours and phases? Any attack patterns?
4. **Economy.** How damage maps to points, victory bonus, and how battle
   income should compare to the tap game so neither trivialises the other.
5. **Unlock.** Today the `flux-battle` ("Critical Combo") upgrade node is a
   reserved `SOON` placeholder. When combat is ready it becomes purchasable and
   gates the trigger, replacing the preview flag.
6. **Progression.** One-off fight, or scaling encounters / New Game+?
