# Task: Add Interactive Quizzes to Distributed Systems Course

## Objective

Add end-of-chapter interactive quizzes to the Distributed Systems mdBook course using the `mdbook-quiz` plugin. Generate playful yet challenging questions that test cumulative knowledge.

## Requirements

- **Placement:** End of each chapter (after all content, before "What's Next")
- **Format:** mdbook-quiz TOML files in `quizzes/` directory
- **Quantity:** 1-3 questions per section, aggregated per chapter (~3-12 questions/chapter)
- **Types:** Mix of MultipleChoice and ShortAnswer
- **Tone:** Playful and challenging
- **Feedback:** All questions must include `context` field with explanations
- **Scope:** All technical chapters (16 total)
- **Skip:** introduction.md and reference materials

## Acceptance Criteria

- [ ] mdbook-quiz installed and `[preprocessor.quiz]` configured in book.toml
- [ ] 16 quiz TOML files created in `quizzes/` directory
- [ ] All 16 chapter files reference their quiz with `{{#quiz ../quizzes/file.toml}}`
- [ ] Each question has a `context` field with explanation
- [ ] Questions use playful, challenging language
- [ ] `mdbook build` completes successfully
- [ ] Quizzes render and work in browser

## Full Specification

See `specs/interactive-course-quizzes/` for:
- `requirements.md` - Complete Q&A
- `research/mdbook-quiz.md` - Plugin documentation
- `design.md` - Detailed design and architecture
- `plan.md` - 10-step implementation plan

## Quiz Template

```toml
[[questions]]
type = "MultipleChoice"
prompt.prompt = "Playful, challenging question?"
prompt.distractors = ["Wrong 1", "Wrong 2", "Wrong 3"]
answer.answer = "Correct answer"
context = "Explanation with feedback."

[[questions]]
type = "ShortAnswer"
prompt.prompt = "Question requiring specific answer?"
answer.answer = "exact-answer"
answer.alternatives = ["alt1", "alt2"]
context = "Explanation with feedback."
```

## Chapters to Add Quizzes

Fundamentals (3): 01-what-is-ds.md, 02-message-passing.md, 03-queue-system.md
Data Store (5): 01-partitioning.md, 02-cap-theorem.md, 03-store-basics.md, 06-replication.md, 07-consistency.md
Real-Time (3): 08-websockets.md, 09-pub-sub.md, 10-chat-system.md
Consensus (5): 11-what-is-consensus.md, 12-raft-algorithm.md, 13-raft-leader-election.md, 14-log-replication.md, 15-consensus-system.md

## Suggested Ralph Commands

Full pipeline: `ralph run --config presets/pdd-to-code-assist.yml`
Simpler flow: `ralph run --config presets/spec-driven.yml`
