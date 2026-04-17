# Requirements Clarification

## Q: Should all 3 critical issues be fixed, and should the disconnected-nodes suggestion also be addressed?

**Answer:** Yes — fix all 3 critical issues. The disconnected-nodes suggestion is low severity and can be skipped to minimize risk of breaking working diagrams.

## Q: For the file numbering gap (file 15 → should be 14), should we rename the file or document the gap?

**Answer:** Rename `15-consensus-system.md` → `14-consensus-system.md` and update all references (SUMMARY.md, internal chapter cross-references). This is the clean solution.

## Q: For the gantt chart, what is the verified fix?

**Answer:** Change `dateFormat X` → `dateFormat x` (lowercase) on line 155 of `12-raft-leader-election.md`. This was empirically verified with mermaid-cli@10 — fixes the axis labels from showing "000" to showing correct elapsed milliseconds.

## Q: For the redundant parenthetical, what exactly needs to change?

**Answer:** On line 17 of `11-what-is-consensus.md`, remove `(consensus en anglais)` from `**consensus** (consensus en anglais)` — the word is identical in French and English, so the parenthetical adds no value.
