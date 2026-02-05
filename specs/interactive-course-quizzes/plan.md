# Implementation Plan: Interactive Quizzes for Distributed Systems Course

## Progress Checklist

- [ ] Step 1: Project setup and mdbook-quiz installation
- [ ] Step 2: Configure book.toml
- [ ] Step 3: Create quizzes directory
- [ ] Step 4: Generate quiz content for Part I (Fundamentals)
- [ ] Step 5: Generate quiz content for Part II (Data Store)
- [ ] Step 6: Generate quiz content for Part III (Real-Time)
- [ ] Step 7: Generate quiz content for Part IV (Consensus)
- [ ] Step 8: Add quiz references to chapter files
- [ ] Step 9: Build and verify all quizzes
- [ ] Step 10: Final review and cleanup

---

## Step 1: Project Setup and mdbook-quiz Installation

**Objective:** Install mdbook-quiz and verify it works with the project.

**Implementation:**
1. Install mdbook-quiz:
   ```bash
   cargo install mdbook-quiz --locked
   ```
2. Verify installation:
   ```bash
   mdbook-quiz -V
   ```
3. Add `mdbook-quiz/` to `.gitignore` (plugin creates this during build)

**Test Requirements:**
- `mdbook-quiz --version` runs without error
- `.gitignore` contains `mdbook-quiz/`

**Integration Notes:**
This is a prerequisite — nothing demos yet, but the tool must be available.

**Demo:** Run `mdbook-quiz -V` and show version output.

---

## Step 2: Configure book.toml

**Objective:** Add mdbook-quiz preprocessor configuration.

**Implementation:**
Add to `book.toml`:
```toml
[preprocessor.quiz]
fullscreen = true
cache-answers = true
```

**Test Requirements:**
- `book.toml` contains `[preprocessor.quiz]` section
- `mdbook build` runs without errors

**Integration Notes:**
This enables the preprocessor. No visible changes yet.

**Demo:** Run `mdbook build` and confirm successful build.

---

## Step 3: Create quizzes Directory

**Objective:** Set up the directory structure for quiz files.

**Implementation:**
1. Create directory:
   ```bash
   mkdir -p quizzes
   ```
2. Create a placeholder test file:
   ```toml
   # quizzes/test.toml
   [[questions]]
   type = "MultipleChoice"
   prompt.prompt = "Test question?"
   prompt.distractors = ["Wrong"]
   answer.answer = "Correct"
   context = "Test explanation"
   ```

**Test Requirements:**
- `quizzes/` directory exists
- `quizzes/test.toml` is valid TOML

**Integration Notes:**
Directory is ready for quiz files.

**Demo:** Run `ls quizzes/` and show directory exists.

---

## Step 4: Generate Quiz Content - Part I (Fundamentals)

**Objective:** Create quiz files for the 3 Fundamentals chapters.

**Implementation:**
For each chapter, analyze content and generate 3-5 questions per chapter:

1. `quizzes/fundamentals-what-is-ds.toml`
   - Questions: Definition, 3 characteristics, scaling types, examples
2. `quizzes/fundamentals-message-passing.toml`
   - Questions: Message types, patterns, failure handling
3. `quizzes/fundamentals-queue-system.toml`
   - Questions: Queue concepts, implementation details

**Guidelines for AI Generation:**
- Playful tone: use "Ahoy, brave explorer!", "Let's see if you've got this..."
- Challenging: avoid obvious answers, test deeper understanding
- Mix: 2-3 MultipleChoice, 1-2 ShortAnswer per quiz
- Cumulative: can reference concepts from earlier sections

**Test Requirements:**
- 3 TOML files created
- Each file has valid syntax
- Each quiz has 3-5 questions
- All questions have `context` field

**Integration Notes:**
Quiz files exist but not yet referenced in chapters.

**Demo:** Show `ls quizzes/` with 3 new files, `cat` one file to show format.

---

## Step 5: Generate Quiz Content - Part II (Data Store)

**Objective:** Create quiz files for the 5 Data Store chapters.

**Implementation:**
1. `quizzes/data-store-partitioning.toml` (3-4 questions)
2. `quizzes/data-store-cap-theorem.toml` (4-5 questions)
3. `quizzes/data-store-basics.toml` (3-4 questions)
4. `quizzes/data-store-replication.toml` (4-5 questions)
5. `quizzes/data-store-consistency.toml` (5-6 questions)

**Focus Areas:**
- Partitioning strategies, hash vs range
- CAP theorem trade-offs
- Replication methods
- Consistency models (strong, eventual, causal)

**Test Requirements:**
- 5 TOML files created
- 19-24 total questions across Part II
- CAP theorem questions particularly challenging

**Integration Notes:**
Cumulative knowledge can reference Fundamentals concepts.

**Demo:** `cat quizzes/data-store-cap-theorem.toml` to show a complex quiz.

---

## Step 6: Generate Quiz Content - Part III (Real-Time)

**Objective:** Create quiz files for the 3 Real-Time Chat System chapters.

**Implementation:**
1. `quizzes/real-time-websockets.toml` (3-4 questions)
2. `quizzes/real-time-pub-sub.toml` (3-4 questions)
3. `quizzes/real-time-chat-system.toml` (4-5 questions)

**Focus Areas:**
- WebSocket vs HTTP
- Pub/Sub patterns
- Real-time system challenges

**Test Requirements:**
- 3 TOML files created
- 10-13 total questions across Part III

**Integration Notes:**
Can reference earlier concepts (consistency, replication).

**Demo:** Show a pub/sub question with good distractors.

---

## Step 7: Generate Quiz Content - Part IV (Consensus)

**Objective:** Create quiz files for the 5 Consensus chapters.

**Implementation:**
1. `quizzes/consensus-what-is-consensus.toml` (3-4 questions)
2. `quizzes/consensus-raft-algorithm.toml` (5-6 questions)
3. `quizzes/consensus-leader-election.toml` (4-5 questions)
4. `quizzes/consensus-log-replication.toml` (4-5 questions)
5. `quizzes/consensus-consensus-system.toml` (4-5 questions)

**Focus Areas:**
- Consensus problem definition
- Raft algorithm details
- Leader election process
- Log replication
- Safety and liveness properties

**Test Requirements:**
- 5 TOML files created
- 20-25 total questions across Part IV
- Raft questions test deep understanding

**Integration Notes:**
Most challenging section — cumulative knowledge from entire course.

**Demo:** Show a Raft leader election question.

---

## Step 8: Add Quiz References to Chapter Files

**Objective:** Link each quiz to its chapter.

**Implementation:**
For each chapter file (excluding introduction and reference), add at the END:

```markdown
## 🧠 Chapter Quiz

Test your mastery of these concepts! These questions will challenge your understanding and reveal any gaps in your knowledge.

{{#quiz ../quizzes/[filename].toml}}
```

**Files to modify:**
- `src/fundamentals/01-what-is-ds.md`
- `src/fundamentals/02-message-passing.md`
- `src/fundamentals/03-queue-system.md`
- `src/data-store/01-partitioning.md`
- `src/data-store/02-cap-theorem.md`
- `src/data-store/03-store-basics.md`
- `src/data-store/06-replication.md`
- `src/data-store/07-consistency.md`
- `src/real-time/08-websockets.md`
- `src/real-time/09-pub-sub.md`
- `src/real-time/10-chat-system.md`
- `src/consensus/11-what-is-consensus.md`
- `src/consensus/12-raft-algorithm.md`
- `src/consensus/13-raft-leader-election.md`
- `src/consensus/14-log-replication.md`
- `src/consensus/15-consensus-system.md`

**Test Requirements:**
- All 16 chapter files have quiz reference
- References use correct relative path `../quizzes/`
- Quiz appears after all content (before any "What's Next" section)

**Integration Notes:**
This is where quizzes become visible in the book.

**Demo:** Build and open one chapter to show the quiz UI.

---

## Step 9: Build and Verify All Quizzes

**Objective:** Ensure all quizzes work correctly.

**Implementation:**
1. Clean build:
   ```bash
   mdbook build
   ```
2. Check for errors in build output
3. Open `book/index.html` in browser
4. Navigate through all chapters with quizzes
5. Test answering questions (correct and incorrect)
6. Verify explanations display properly

**Test Requirements:**
- `mdbook build` completes without errors
- All 16 quizzes render in HTML
- Questions accept answers
- Explanations display after answering
- No broken quiz references

**Integration Notes:**
Full end-to-end verification of the feature.

**Demo:**
- Show successful build output
- Browser demo of answering a question
- Show explanation feedback

---

## Step 10: Final Review and Cleanup

**Objective:** Polish and finalize the implementation.

**Implementation:**
1. Remove test file: `rm quizzes/test.toml`
2. Verify `.gitignore` has `mdbook-quiz/`
3. Optional: Add script to validate TOML syntax
4. Spot-check question quality and tone
5. Verify technical accuracy of answers

**Test Requirements:**
- No test files remain
- `.gitignore` configured correctly
- All quizzes pass build
- At least one person reviews quiz content for accuracy

**Integration Notes:**
Ready for production use.

**Demo:**
- Show final quiz count: 16 files, ~60-75 questions
- Quick browser tour of 3-4 different quizzes
