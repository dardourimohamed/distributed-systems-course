# Implementation Plan: Fix Consensus Chapter Review Findings

## Checklist

- [ ] Step 1: Rename file and update all references
- [ ] Step 2: Fix gantt chart dateFormat
- [ ] Step 3: Remove redundant parenthetical
- [ ] Step 4: Verify build and references

---

## Step 1: Rename file and update all references

**Objective:** Eliminate the file numbering gap by renaming `15-consensus-system.md` to `14-consensus-system.md`.

**Implementation:**
1. `git mv src/consensus/15-consensus-system.md src/consensus/14-consensus-system.md`
2. In `src/SUMMARY.md`, change the line `- [Raft en Action](./consensus/15-consensus-system.md)` to `- [Raft en Action](./consensus/14-consensus-system.md)`
3. Search the entire codebase for any other references to `15-consensus-system` and update them (quiz files, cross-references in other chapters, etc.)

**Integration:** This is a standalone structural fix. No other code depends on the filename number.

**Demo:** `ls src/consensus/` shows files numbered 11, 12, 13, 14 with no gaps. `grep -r "15-consensus" src/` returns nothing.

---

## Step 2: Fix gantt chart dateFormat

**Objective:** Fix the broken gantt chart axis labels in `src/consensus/12-raft-leader-election.md`.

**Implementation:**
- On line 155, change `dateFormat X` to `dateFormat x` (lowercase x = milliseconds since epoch)

**Integration:** This only affects the gantt diagram rendering. The rest of the diagram syntax (bars, milestone) is unchanged and already works.

**Demo:** The gantt diagram renders with readable axis labels showing elapsed milliseconds (020, 040, ..., 280) instead of all "000".

---

## Step 3: Remove redundant parenthetical

**Objective:** Remove the confusing `(consensus en anglais)` parenthetical from `src/consensus/11-what-is-consensus.md`.

**Implementation:**
- On line 17, change `**consensus** (consensus en anglais)` to `**consensus**`

**Integration:** This is a single-line text change in a paragraph. No structural impact.

**Demo:** The sentence reads naturally: "C'est exactement le problème du **consensus** : comment un groupe..."

---

## Step 4: Verify build and references

**Objective:** Confirm all fixes are correct and nothing is broken.

**Implementation:**
1. Run `grep -r "15-consensus" src/ quizzes/` to confirm no stale references remain
2. Run `mdbook build` to verify the book builds successfully
3. Verify SUMMARY.md link resolution (all 4 consensus chapter links point to existing files)

**Demo:** Clean build output with no errors or warnings about missing files.
