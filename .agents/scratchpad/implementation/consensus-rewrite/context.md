# Context: Consensus Chapters Rewrite

## Source Type
Rough description — detailed spec provided in the build.start event.

## Original Request Summary
Replace the current 5 consensus chapters (theory-heavy, code-dense) with 4 beginner-friendly, story-driven, diagram-rich chapters in French. Also rewrite all 4 associated quiz files. Update SUMMARY.md to reflect new structure.

## Current State
- 5 chapter files in `src/consensus/`: 11, 12, 13, 14, 15
- 5 quiz files in `quizzes/`: consensus-what-is-consensus, consensus-raft-algorithm, consensus-leader-election, consensus-log-replication, consensus-consensus-system
- SUMMARY.md lists 5 chapters under "Partie IV : Système de Consensus"

## Target State
- 4 chapter files: 11, 12, 13, 15 (14 is deleted/merged into 13)
- 4 quiz files: consensus-what-is-consensus, consensus-leader-election, consensus-log-replication, consensus-consensus-system
- SUMMARY.md lists 4 chapters under "Partie IV : Système de Consensus"

## Repo Patterns
- mdBook-based course, uses mermaid preprocessor for diagrams
- Quiz files use mdBook-quiz format: `prompt.prompt`, `prompt.distractors`, `answer.answer`, `answer.alternatives`, `context`, `id` (UUID)
- Chapters are in French, target audience is junior developers
- Each chapter includes a `{{#quiz ../../quizzes/...}}` reference

## Integration Points
- `src/SUMMARY.md` must be updated to remove old chapter 12-raft-algorithm, 13-raft-leader-election, 14-log-replication entries and replace with new structure
- `mermaid-init.js` (book.js) handles mermaid rendering — diagrams use standard ```mermaid blocks

## Acceptance Criteria
1. 4 new chapter files written in conversational French, story-driven, diagram-rich
2. 4 quiz files rewritten with 6 questions each (4 MC + 2 short answer)
3. SUMMARY.md updated to reflect 4 chapters
4. Old files deleted: `src/consensus/14-log-replication.md`, `quizzes/consensus-raft-algorithm.toml`
5. Each chapter: 200-350 lines, max 20-line pseudocode snippets, mermaid diagrams with French labels
6. No runnable code, no Docker, no formal math

## Constraints
- Do NOT modify non-consensus chapters or book build config
- Do NOT create files outside listed paths
- Follow existing quiz TOML format (prompt.prompt, answer.answer style)
- All prose in French (English only for technical terms in parentheses)
