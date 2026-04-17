# Implementation Plan: Consensus Chapters Remake

## Checklist

- [ ] Step 1: Create Chapter 11 — Le Problème du Consensus
- [ ] Step 2: Create Quiz for Chapter 11
- [ ] Step 3: Create Chapter 12 — Élire un Chef
- [ ] Step 4: Create Quiz for Chapter 12
- [ ] Step 5: Create Chapter 13 — Le Journal Partagé
- [ ] Step 6: Create Quiz for Chapter 13
- [ ] Step 7: Create Chapter 14 — Raft en Action
- [ ] Step 8: Create Quiz for Chapter 14
- [ ] Step 9: Update SUMMARY.md
- [ ] Step 10: Review and verify all chapters

---

## Step 1: Create Chapter 11 — Le Problème du Consensus

**Objective:** Replace `src/consensus/11-what-is-consensus.md` with a story-driven introduction to the consensus problem.

**Implementation guidance:**
- Start with the restaurant kitchen story (3 chefs, orders, chaos without coordination)
- Transition to the tech version (3 servers, split-brain diagram)
- Introduce the 4 properties as informal needs, not formal definitions
- Show 3 concrete challenges (no clock, lost messages, crashes) each with a mermaid diagram
- Brief FLP paragraph + "how we work around it"
- End with Raft as "the understandable solution" + brief Paxos mention
- No code. Diagrams only.
- Each section: 1 story paragraph + 1 diagram + 2-3 explanation sentences

**Demo:** A reader with zero distributed systems knowledge can explain why consensus is hard and what Raft aims to solve.

---

## Step 2: Create Quiz for Chapter 11

**Objective:** Create `quizzes/consensus-what-is-consensus.toml` with beginner-friendly questions.

**Implementation guidance:**
- 5-7 questions mixing multiple choice and short answer
- All answerable from chapter content alone
- Include scenario-based questions: "3 nodes, one crashes, what happens?"
- Include one question about when consensus is needed vs. not

**Demo:** Quiz validates understanding of the consensus problem without requiring formal terminology.

---

## Step 3: Create Chapter 12 — Élire un Chef

**Objective:** Replace `src/consensus/12-raft-algorithm.md` and `src/consensus/13-raft-leader-election.md` (merged) with a story-driven chapter on leader election.

**Implementation guidance:**
- Start with team captain / presidential election analogy
- Introduce 3 roles (Suiveur, Candidat, Chef) with state diagram
- Terms as "presidential terms" with timeline diagram
- Walk through election in 5 visual steps (one mermaid sequence each)
- Split vote problem with fixed vs random timeouts (gantt chart)
- Voting rules as 10-line pseudocode max
- No Docker, no full implementations
- Each section: story + diagram + brief explanation

**Demo:** A reader can trace through a leader election step by step and explain why randomization matters.

---

## Step 4: Create Quiz for Chapter 12

**Objective:** Create `quizzes/consensus-leader-election.toml` with beginner-friendly questions.

**Implementation guidance:**
- 5-7 questions
- Include: "which node times out first?", "what happens if two nodes become candidates simultaneously?", "why does Raft use random timeouts?"
- Scenario-based: given timeout values, predict the election outcome

**Demo:** Quiz validates understanding of the election mechanism and timing.

---

## Step 5: Create Chapter 13 — Le Journal Partagé

**Objective:** Replace `src/consensus/14-log-replication.md` with a story-driven chapter on log replication.

**Implementation guidance:**
- Start with shared notebook analogy (team lead writes, everyone copies)
- Visual log representation (boxes with index/term/command)
- Log matching property as "if notebooks agree on page 5, they agree on 1-4"
- Replication in 5 visual steps (mermaid sequences)
- Conflict resolution as story: leader walks confused follower back, then replays
- Commit index: "safe to apply" with simple rule
- State machine: "journal = recipe, state machine = cooked meal"
- No Docker, no full implementations

**Demo:** A reader can explain how a command flows from client to committed state across the cluster.

---

## Step 6: Create Quiz for Chapter 13

**Objective:** Create `quizzes/consensus-log-replication.toml` with beginner-friendly questions.

**Implementation guidance:**
- 5-7 questions
- Include: "what does the leader send to followers?", "when is an entry committed?", "what happens if a follower's log diverges?"
- Scenario: given two logs, identify the conflict point

**Demo:** Quiz validates understanding of the replication flow and log matching.

---

## Step 7: Create Chapter 14 — Raft en Action

**Objective:** Replace `src/consensus/15-consensus-system.md` with a failure-scenario-driven chapter that ties everything together.

**Implementation guidance:**
- Start with full system architecture diagram (recap)
- 3 failure scenarios as stories with mermaid sequences:
  1. Leader crash → re-election → catch-up
  2. Network partition → majority continues, minority blocks → healing
  3. Stale leader returns → discovers higher term → steps down
- Decision table: when do you need consensus?
- Brief Paxos vs Raft comparison (2 paragraphs + table)
- "In the real world" — etcd, Consul, CockroachDB mentions
- Visual journey recap of all 4 chapters
- No Docker, no full implementations

**Demo:** A reader can predict what happens in common failure scenarios and knows when consensus is needed in practice.

---

## Step 8: Create Quiz for Chapter 14

**Objective:** Create `quizzes/consensus-consensus-system.toml` with beginner-friendly questions.

**Implementation guidance:**
- 5-7 questions
- Scenario-heavy: partition scenarios, failure predictions, "do you need consensus for X?"
- Include one question about real-world systems that use Raft

**Demo:** Quiz validates overall understanding of the complete Raft system and its practical applications.

---

## Step 9: Update SUMMARY.md

**Objective:** Update `src/SUMMARY.md` to reflect the new 4-chapter structure.

**Implementation guidance:**
- Remove old chapter 12 (raft-algorithm) and merge its content into the prompt
- Update chapter titles and paths
- Ensure numbering is consistent (11, 12, 13, 14)
- Update session references

**Demo:** The book builds and the table of contents shows 4 clean consensus chapters.

---

## Step 10: Review and Verify

**Objective:** Final quality check across all chapters.

**Implementation guidance:**
- Each chapter readable in 15-20 minutes
- Every section has at least one visual element
- No code snippet exceeds 20 lines
- Quizzes answerable from chapter content alone
- Each chapter works standalone
- French language consistent throughout
- Mermaid diagrams use valid syntax
- All quiz TOML files follow existing format

**Demo:** The complete consensus section is coherent, beginner-friendly, and ready for publication.
