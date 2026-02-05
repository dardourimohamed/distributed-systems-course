# mdbook-quiz Research

*Researching the mdbook-quiz plugin for adding quizzes to mdBook.*

## Overview

**Source:** https://github.com/cognitive-engineering-lab/mdbook-quiz

mdbook-quiz is an mdBook preprocessor that adds interactive quizzes to Markdown books.

## Installation

```bash
cargo install mdbook-quiz --locked
```

## Configuration

Add to `book.toml`:

```toml
[preprocessor.quiz]
```

Configuration options:
- `fullscreen` (boolean): Quiz takes full screen during use
- `cache-answers` (boolean): Save answers in localStorage
- `spellcheck` (boolean): Run spellchecker on Markdown strings
- `more-words` (path): Path to additional dictionary file

## Quiz Format

Quizzes are stored as **TOML files** (typically in a `quizzes/` directory).

### Question Types Supported

1. **ShortAnswer** - One-line string answer
2. **MultipleChoice** - Multiple choice with distractors
3. **Tracing** - Predict program execution (for code)

### Example Quiz File

```toml
# quizzes/rust-variables.toml
[[questions]]
type = "ShortAnswer"
prompt.prompt = "What is the keyword for declaring a variable in Rust?"
answer.answer = "let"
context = "For example, you can write: `let x = 1`"

[[questions]]
type = "MultipleChoice"
prompt.prompt = "What does it mean if a variable `x` is immutable?"
prompt.distractors = [
  "`x` is stored in the immutable region of memory.",
  "After being defined, `x` can be changed at most once.",
  "You cannot create a reference to `x`."
]
answer.answer = "`x` cannot be changed after being assigned to a value."
context = "Immutable means \"not mutable\", or not changeable."
```

### Referencing in Markdown

```markdown
<!-- src/your-chapter.md -->

And now, a _quiz_:

{{#quiz ../quizzes/rust-variables.toml}}
```

## Question Type Schemas

### ShortAnswer
```toml
[[questions]]
type = "ShortAnswer"
prompt.prompt = "Question text here"
answer.answer = "exact answer"
answer.alternatives = ["alternative 1", "alternative 2"]  # optional
context = "Explanation shown after answering"
```

### MultipleChoice
```toml
[[questions]]
type = "MultipleChoice"
prompt.prompt = "Question text here"
prompt.distractors = ["Wrong answer 1", "Wrong answer 2", "Wrong answer 3"]
answer.answer = "Correct answer"
prompt.answerIndex = 0  # optional: fix answer position
context = "Explanation shown after answering"
```

### Tracing (for code)
```toml
[[questions]]
type = "Tracing"
prompt.program = """
fn main() {
    let x = 1;
    println!("{x}");
}
"""
answer.doesCompile = true
answer.stdout = "1"
context = "Explanation"
```

## Key Findings

1. **TOML-based**: Quizzes are separate `.toml` files referenced from Markdown
2. **No native True/False**: Need to implement using MultipleChoice
3. **Context field**: Provides explanations/feedback (matches our requirements)
4. **Cumulative possible**: Can reference any previous content in questions
5. **Semantic versioning**: Quiz format stable across versions
6. **Copied files**: Creates `mdbook-quiz/` directory in source (add to .gitignore)
