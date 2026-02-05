# Requirements Clarification

*Q&A record for refining the idea into a detailed specification.*

---

## Question 1

**What course are we working with?**

- Do you have an existing course with content already?
- What format is it in (markdown, HTML, etc.)?
- Where is the course content located?

**Answer:** Yes, there is a well-done existing mdBook course.

---

## Question 2

**Where is your mdBook course located? Please provide the path to the course directory.**

**Answer:** In the current directory in the `src` folder.

**Course Structure Discovered:**
- Part I: Fundamentals (3 chapters)
- Part II: Data Store with Replication (5 chapters)
- Part III: Real-Time Chat System (3 chapters)
- Part IV: Consensus System (5 chapters)
- Reference Materials (3 chapters)

Each chapter has sections (##) and subsections (###).

---

## Question 3

**How should the quiz questions be displayed? Specifically:**

- Should questions appear between **every** section (##) or between subsections (###) as well?
- Where exactly should the quiz be placed — immediately after the section content, before the next heading?
- Should the existing "Check Your Understanding" sections be replaced, or should new quizzes be added in addition to them?

**Answer:** Every section (##).

---

## Question 4

**For the quiz format with collapsed answers:**

- What markdown syntax should be used for the collapsed answers?
- How many questions per section would you like?
- What types of questions?
- Should questions be specific to the section just read, or can they be cumulative?

**Answer:**
- Use `<details>` tags for collapsed answers
- 1-3 questions depending on content
- Mix of question types
- Cumulative (can test understanding from previous sections)

---

## Question 5

**Who creates the quiz questions?**

- Do you want AI-generated questions based on each section's content?
- Or will you provide the questions manually?
- Or a mix — AI generates drafts and you review/edit them?

**Answer:** AI-generated questions based on each section's content.

---

## Question 6

**What tone and difficulty level should the quiz questions have?**

- Should they be challenging (test deep understanding) or more accessible (reinforce key concepts)?
- Should they include hints to guide learners, or be direct questions?
- Any specific style preferences?

**Answer:** Playful, challenging tone.

---

## Question 7

**Should any sections be excluded from quizzes? For example:**

- Reference materials (Docker Setup, Troubleshooting, Further Reading)?
- Short sections with minimal content?
- Any other sections you'd like to skip?

**Answer:** Skip reference materials.

---

## Question 8

**A few final formatting details:**

- Should each quiz have a heading/title (e.g., "🧠 Quick Quiz", "Test Your Knowledge")?
- Should the answers include explanations/feedback, or just the correct answer?
- Any preference for the summary chapter (introduction.md) — should it have quizzes too?

**Answer:**
- Each quiz should have a heading/title
- Answers include explanations/feedback

---

## Question 9

**One final detail — should the introduction.md file (which is an overview) have quizzes, or should we skip it and only add quizzes to the technical chapters?**

**Answer:** Skip introduction.md.

---

## Question 10

**What quiz implementation should be used?**

**Answer:** Use `mdbook-quiz` plugin.

---

## Requirement Change

**User changed their mind:**

**Original:** Quiz questions after every section (##)

**New:** Quiz at the END of each chapter containing ALL questions from that chapter's sections (challenging and playful style).
