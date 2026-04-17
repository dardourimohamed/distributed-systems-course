# Review Plan: Consensus Chapters Rewrite

## Step 1: Primary Pass ✅ COMPLETE
- Read all 4 chapter files, 4 quiz files, SUMMARY.md
- Verified file existence/deletion
- Checked SUMMARY.md link resolution
- Verified quiz format consistency against existing non-consensus quizzes
- Identified top risks: file numbering gap, mermaid syntax risks, redundant parenthetical

## Step 2: Deep Analysis — Mermaid Diagram Validation
**Focus:** Validate all 24 mermaid diagrams for syntax correctness against mdbook-mermaid and mermaid.js versions.
**Rationale:** Mermaid syntax errors render as broken code blocks in the final book. The Gantt chart, `~~~` invisible edges, and emoji-in-diagram are the highest-risk elements. This is the most impactful quality gate — a broken diagram in a "diagram-rich" course defeats the purpose.
**Key checks:**
- Gantt chart in chapter 12 (dateFormat X, milestone with 0s duration)
- `~~~` invisible edge syntax in chapter 11
- Emoji in sequenceDiagram in chapter 15
- timeline diagram in chapter 12

## Step 3: Deep Analysis — Content Accuracy & Spec Compliance
**Focus:** Verify technical correctness of Raft explanations and compliance with all spec requirements.
**Key checks:**
- Pseudocode max 20 lines
- Paragraphs 2-3 sentences between visual breaks
- No formal math
- All specified sections present in each chapter
- Quiz question counts match spec (4 MC + 2 SA = 6 each)

## Final Step: Synthesis and Completion
- Merge findings from all waves into final report
- Determine APPROVE / REQUEST_CHANGES verdict
