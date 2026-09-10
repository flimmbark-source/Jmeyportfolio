# Portfolio V2 — Conceptual Graph and Interaction Grammar

This document records the current interaction and meaning model for the experiential portfolio. It supersedes the earlier card-navigation interpretation where the two conflict.

## Goal

The site is not primarily a case-study portfolio and not a visualized sitemap. It should let a visitor experience Jacob's design practice by moving through the relationships between ideas, intentions, and finished work.

The intended comprehension curve is:

1. intrigue — this behaves differently from a normal portfolio
2. agency — I can touch/focus things and the environment responds
3. relationship — I can see that the same project connects to different ideas
4. interpretation — changing the lens changes how the same body of work is understood
5. artifact — selecting a finished project gives the actual work priority over explanation

The motion is not the meaning. Motion is the feedback mechanism for revealing meaning already encoded in the graph.

## Conceptual graph

The graph includes three semantic layers:

### Why / intent

Current intent nodes:

- Embody a framework
- Explore a question
- Find hidden patterns
- Learn through play

These are verbs/reasons for making rather than portfolio categories.

### Concepts / practices

Current concept nodes:

- Disability
- Perspective
- Systems
- Embodiment
- Learning
- Language
- Play
- Game Design
- Interactive Art
- UX Work (gateway to the classic portfolio)

The graph should remain curated. New concepts should only be added when they explain a meaningful relationship between multiple pieces of work.

### Projects

Confirmed finished/public work currently represented:

- Get to the Café
- Letter River
- The Last Reading
- Rotogo
- Gig Duel

Unfinished work remains deliberately separate under an Unfinished workshop lens:

- PhaseG
- SplitPulse
- Just Wash the Dishes

Unfinished projects may share conceptual metadata with finished work, but they should not automatically appear beside a finished project during normal traversal. This avoids falsely equating prototype state with public finished work.

## Current project meaning

### Get to the Café

Purpose: embody the framework of a specific aspect of disabled experience contrasted against a simulation of the ordinary world.

Mechanism: layered systems contribute to that experience in different ways. This gives players multiple depths at which they can engage with the same underlying idea.

Primary relationships: Embody a framework, Disability, Perspective, Systems, Embodiment, Game Design, Interactive Art.

### Letter River

Purpose: explore games as a medium for learning and use experimentation to investigate how and why language is learned.

Primary relationships: Learn through play, Learning, Language, Systems, Play, Game Design, Explore a question.

### The Last Reading

Purpose: explore reading between the lines and trying to make sense of hidden patterns.

Primary relationships: Find hidden patterns, Game Design, Play, Systems, Perspective, Explore a question.

### Rotogo / Gig Duel

Public finished projects. Deeper conceptual purpose is intentionally unresolved rather than inferred from old portfolio copy or repository metadata.

## Interaction grammar

The interface should use a small consistent set of operations.

### 1. Hover / keyboard focus = preview

Hover must never be required to operate the experience. Keyboard focus produces the same conceptual preview.

Preview behavior:

- does not change URL or navigation history
- does not permanently move the visitor to another context
- emphasizes relationships from the previewed node
- deemphasizes unrelated nodes without making them inaccessible
- may reveal a concise explanation of the node

This follows the general UX principle that hover should preview or reveal affordance, while committed state changes require an explicit activation.

### 2. Select an idea = change lens

Selecting an intent or concept is a committed navigation action.

Behavior:

- the selected node becomes the current lens
- strongly related nodes move closer / become more prominent
- weakly related nodes may remain at the edge
- unrelated nodes can leave the active field
- URL/history records the state
- the active lens has a strong persistent visual treatment

A lens changes the interpretation of the field rather than opening a conventional page.

### 3. Select a finished project = artifact takeover

Project selection is different from concept selection.

Behavior:

- the relational field yields most of the viewport
- the project itself becomes dominant
- the primary action is to experience/open/play the work
- a short purpose statement may explain why it exists
- conceptual connections remain available as alternate readings, not as a tag cloud

Case studies are optional secondary material, not required structure.

### 4. Back = undo the last committed context

Back should be predictable and reversible.

Behavior:

- returns to the previous committed lens/context
- preserves browser history semantics
- Escape may act as a keyboard shortcut for leaving a committed focus state
- closing a project should return to the context from which it was entered rather than resetting the whole experience

### 5. Proximity = relationship strength

Spatial position has semantic meaning.

- closer = stronger current relationship
- farther = weaker current relationship
- proximity must not be the only means of expressing the relationship; line emphasis, labels, and focus treatment provide redundant cues
- physical location should never imply a permanent hierarchy, because the field changes when the lens changes

## Accessibility / professional interaction requirements

- Every interactive object is keyboard reachable.
- Keyboard focus receives the same relationship preview as hover.
- Focus indicators remain visibly distinct and unobscured.
- Primary pointer targets should target at least 44×44 CSS pixels where practical; 24×24 is the WCAG 2.2 AA minimum under its target-size criterion.
- No essential operation requires dragging.
- Reduced-motion preferences remove spatial animation without removing state changes or meaning.
- A user can always understand the current committed lens via text as well as position.
- Project takeover must not trap keyboard focus unless it becomes a true modal implementation with appropriate modal semantics.

## Dense-region prototype boundary

The first dense conceptual region should demonstrate Disability without placing unfinished projects beside Get to the Café as peers.

Normal traversal can expose:

Disability ↔ Perspective ↔ Embodiment ↔ Systems ↔ Interactive Art ↔ Get to the Café

The Unfinished lens is separately discoverable. Inside that lens, PhaseG and Just Wash the Dishes may connect back to Disability/Embodiment conceptually while remaining explicitly marked unfinished.

This separation is a presentation rule, not a denial that the projects share ideas.

## What to evaluate in the next prototype

Do not evaluate primarily on visual polish. Evaluate whether a new visitor can infer:

- that the environment is showing relationships rather than folders
- why Get to the Café is related to Disability and Systems
- that selecting another concept changes the reading of the same work
- that unfinished work is a separate workshop state
- that finished projects are there to be experienced, not merely described

If those meanings are not legible without explanation, further visual polish should wait until the interaction model is corrected.
