# Code Review: Consensus Chapters Rewrite (4 chapters + 4 quizzes + SUMMARY.md)

## Files Reviewed
- [x] src/consensus/11-what-is-consensus.md (197 lines, 6 mermaid diagrams)
- [x] src/consensus/12-raft-leader-election.md (206 lines, 7 mermaid diagrams)
- [x] src/consensus/13-log-replication.md (200 lines, 6 mermaid diagrams)
- [x] src/consensus/15-consensus-system.md (211 lines, 5 mermaid diagrams)
- [x] quizzes/consensus-what-is-consensus.toml (6 questions)
- [x] quizzes/consensus-leader-election.toml (6 questions)
- [x] quizzes/consensus-log-replication.toml (6 questions)
- [x] quizzes/consensus-consensus-system.toml (6 questions)
- [x] src/SUMMARY.md (consensus section)
- [x] Deleted files confirmed: 12-raft-algorithm.md, 13-raft-leader-election.md, 14-log-replication.md, consensus-raft-algorithm.toml

## Summary
**COMMENT** — Overall high quality rewrite. Content is well-structured, follows the spec closely, and uses the correct tone/format. Quiz format matches existing non-consensus quizzes. Several issues identified below.

## Critical Issues (Must Fix)

### 1. File numbering gap: no file 14 — `src/consensus/15-consensus-system.md`
The spec says this is "Chapter 14: Raft en Action" but the file is named `15-consensus-system.md`. There is no file 14 at all (old 14-log-replication.md was deleted). This creates a confusing gap in the file sequence. The chapter heading says "Chapitre 14" but the filename says 15. Either rename to `14-consensus-system.md` or document why the gap exists.

### 2. Mermaid Gantt chart syntax risk — `src/consensus/12-raft-leader-election.md:155-163`
The Gantt diagram uses `dateFormat X` (Unix epoch) with raw integer values and `axisFormat %L` (milliseconds). The milestone syntax `:milestone, m1, 200, 0s` uses `0s` as a duration string. This is valid in newer Mermaid versions but is fragile — if the mdbook-mermaid preprocessor ships an older Mermaid version, this will break silently. Also: the `gantt` type is not listed in the spec's preferred diagram types (`graph`, `sequenceDiagram`, `stateDiagram-v2`, `timeline`).

### 3. Redundant parenthetical — `src/consensus/11-what-is-consensus.md:17`
`**consensus** (consensus en anglais)` — the word "consensus" is identical in French and English. The parenthetical adds no value and may confuse readers into thinking there's a different English term.

## Suggestions (Should Consider)

- `src/consensus/11-what-is-consensus.md:34,47` — Uses `~~~` (invisible edge) syntax. Valid in Mermaid >=9.4 but worth confirming the deployed version supports it. If diagrams render as broken code blocks, this is the culprit.

- `src/consensus/15-consensus-system.md:61` — Emoji `💥` inside a mermaid sequenceDiagram `Note over` block. Mermaid doesn't always render emojis correctly in all renderers. Should test or replace with text like `[PANNE]`.

- All quiz files use `type = "MultipleChoice"` / `"ShortAnswer"` with `prompt.prompt`/`prompt.distractors`/`answer.answer` format. This differs from the simplified format in the spec (`type = "multiple_choice"` with `question`/`options`/`answer = 0`). However, it correctly matches the existing non-consensus quiz files, so this is fine — the spec's format example was misleading.

## Deep Analysis: Mermaid Diagram Validation (2026-04-17)

**Method:** Empirical rendering with `@mermaid-js/mermaid-cli@10` (matching the project's CDN mermaid@10). Each high-risk diagram tested independently.

### CONFIRMED CRITICAL — Gantt Chart Axis Labels Broken

**File:** `src/consensus/12-raft-leader-election.md:155` (`dateFormat X`)

**Evidence:** Rendered the gantt chart with `mmdc`. All x-axis labels show "000" — completely meaningless. The bars and milestone render correctly (correct relative positions), but the time axis provides zero information to the reader.

**Root cause:** `dateFormat X` (uppercase) parses input as **seconds** since epoch. Values 0, 180, 200, 280 become timestamps at Jan 1 1970 00:00:00 through 00:04:40. `axisFormat %L` (d3 milliseconds-of-current-second) shows "000" for all ticks at whole-second boundaries.

**Verified fix:** Changed `dateFormat X` → `dateFormat x` (lowercase = milliseconds since epoch). Re-rendered: axis now shows 020, 040, 060, 080, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280 — correct elapsed milliseconds. Milestone at 200ms also positioned correctly.

**Fix:** Change line 155 from `dateFormat X` to `dateFormat x`.

### CONFIRMED OK — Emoji in sequenceDiagram

**File:** `src/consensus/15-consensus-system.md:62` (`💥`)

**Evidence:** Rendered the full sequenceDiagram with `mmdc`. Emoji `💥` renders correctly in the "Note over" box as a visible emoji character. No broken glyphs, no rendering failure.

**Verdict:** Downgrade from Suggestion to no-action-needed. Works in mermaid@10 with default security level and in browser with `securityLevel: 'loose'`.

### CONFIRMED OK — Timeline diagram type

**File:** `src/consensus/12-raft-leader-election.md:73-84`

**Evidence:** Rendered the timeline diagram with `mmdc`. Shows 3 distinct sections (Mandat 1/2/3) with color coding (purple/yellow/green) and readable text. All entries visible.

**Verdict:** No issue. Timeline is fully supported in mermaid@10.

### CONFIRMED OK — Invisible edges (`~~~`)

**File:** `src/consensus/11-what-is-consensus.md:34,48`

**Verdict:** `~~~` syntax supported since mermaid v9.4. Project uses mermaid@10. No risk.

### Additional Finding — Disconnected annotation nodes (9 diagrams)

Multiple diagrams define annotation nodes with no edges connecting them to the main diagram content:

| Chapter | File:Line | Disconnected node |
|---------|-----------|-------------------|
| 11 | `:34` | `Problem["Laquelle est correcte ?"]` |
| 11 | `:48` | `Solved["Tous d'accord !"]` |
| 12 | `:27` | `Chaos["Résultat : personne ne s'entend"]` |
| 12 | `:41` | `OK["Résultat : tout le monde est d'accord"]` |
| 12 | `:148` | `Result1["1 vote chacun — personne ne gagne !"]` |
| 13 | `:36` | All nodes in subgraph have no edges |
| 13 | `:59` | `Match["Même entrée..."]` |
| 13 | `:116` | All nodes in "Avant correction" subgraph |
| 13 | `:138` | `OK["Journaux synchronisés !"]` |

**Impact:** These nodes render but are positioned by the layout engine without visual connection to the diagram content. They appear as floating labels. Low severity — the text is readable but the visual association with the diagram is weak. Adding `~~~` invisible edges to these nodes (like the Ch11 split-brain diagram already does for its main nodes) would improve visual coherence.

### Updated Critical Issues Count

Original: 3 critical issues
After deep analysis: **2 confirmed critical** (file numbering gap + gantt axis labels), **1 unchanged** (redundant parenthetical)
Cleared from suspicion: emoji, timeline, invisible edges — all verified working.

## Positive Notes
- Excellent narrative flow — each chapter opens with a relatable story that maps cleanly to the technical concept
- Mermaid diagrams are plentiful (24 total across 4 chapters) and well-captioned
- Quiz questions are well-crafted and all answerable from chapter content
- Correct use of conversational French with "tu" throughout
- Bold key terms with English parentheticals on first use
- Pseudocode is clean and minimal (7 lines in chapter 12)
- Self-contained chapters that re-explain prerequisites inline
- File deletion is clean — old files gone, no orphan references
- SUMMARY.md correctly updated with 4 entries
