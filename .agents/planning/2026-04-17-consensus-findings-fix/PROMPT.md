# PROMPT: Fix Consensus Chapter Review Findings

## Context

A code review of the consensus chapters rewrite identified 3 critical issues that must be fixed. The full review is in `.eval-sandbox/review/findings.md`. The project is a French-language distributed systems course built with mdBook, using mermaid@10 for diagrams.

## Task

Fix all 3 critical findings. Do NOT touch working diagrams or make any changes beyond what is specified below.

## Critical Fix 1: File Renumbering — `15-consensus-system.md` → `14-consensus-system.md`

The file `src/consensus/15-consensus-system.md` should be `src/consensus/14-consensus-system.md`. There is no file 14 — the old `14-log-replication.md` was deleted during the rewrite.

**Actions:**
1. `git mv src/consensus/15-consensus-system.md src/consensus/14-consensus-system.md`
2. Update `src/SUMMARY.md` line 30: change `./consensus/15-consensus-system.md` → `./consensus/14-consensus-system.md`
3. The chapter heading inside the file already says "Chapitre 14" — no change needed there.
4. Check for any other references to `15-consensus-system` across the codebase and update them.

## Critical Fix 2: Gantt Chart Axis Labels — `src/consensus/12-raft-leader-election.md:155`

The gantt chart uses `dateFormat X` (uppercase = seconds since epoch) which causes all axis labels to show "000". Verified fix: change to lowercase `dateFormat x` (milliseconds since epoch).

**Action:**
- Line 155: change `dateFormat X` → `dateFormat x`

This was empirically verified with `@mermaid-js/mermaid-cli@10` — the axis correctly shows elapsed milliseconds after the fix.

## Critical Fix 3: Redundant Parenthetical — `src/consensus/11-what-is-consensus.md:17`

`**consensus** (consensus en anglais)` — "consensus" is identical in French and English. The parenthetical is confusing.

**Action:**
- Line 17: change `**consensus** (consensus en anglais)` → `**consensus**`

## Verification

After all fixes:
1. Run `mdbook build` (or equivalent) to confirm no build errors
2. Verify SUMMARY.md links resolve correctly
3. Confirm no other files reference `15-consensus-system`
