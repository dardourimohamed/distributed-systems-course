# Rough Idea

Write a plan and prompt.md to properly remake and improve the consensus systems chapters and adapt it to beginners and make it very easy to understand.

## Current State

The course has 5 consensus chapters in `src/consensus/`:
1. `11-what-is-consensus.md` — Introduction to consensus (Session 8)
2. `12-raft-algorithm.md` — Raft algorithm overview (Session 9, Part 1)
3. `13-raft-leader-election.md` — Leader election (Session 9, Part 1)
4. `14-log-replication.md` — Log replication (Session 10, Part 1)
5. `15-consensus-system.md` — Full system implementation (Session 10, Part 2)

## Identified Issues for Beginners

- Heavy use of formal/theoretical language (FLP impossibility, safety vs liveness) before building intuition
- Code examples are long and complex (200+ lines) without gradual build-up
- Diagrams are dense and sometimes confusing
- Jumps from abstract theory to full implementation without intermediate steps
- French terminology mixed with English terms inconsistently
- No "mental model" building before formal definitions
- Missing real-world analogies that would help beginners connect concepts
- Chapters are long and overwhelming (some 500+ lines of code)
