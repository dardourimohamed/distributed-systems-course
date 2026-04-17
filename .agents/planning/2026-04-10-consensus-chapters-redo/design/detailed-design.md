# Detailed Design: Consensus Chapters Remake

## Overview

This document describes the complete redesign of the 5 consensus chapters in the distributed systems course (`src/consensus/`). The goal is to transform theory-heavy, code-dense chapters into beginner-friendly, story-driven, diagram-rich content for junior developers.

---

## Detailed Requirements

### Target Audience
Junior developers — new to programming and distributed systems. They need:
- Concepts built from intuition, not from formal definitions
- Relatable real-world analogies before any abstraction
- Short, digestible sections with visual reinforcement
- No assumed knowledge from earlier course sessions (self-contained)

### Content Decisions
| Aspect | Decision |
|--------|----------|
| Language | French (matching rest of course) |
| Code | Minimal — only key pseudocode snippets (10-20 lines max per snippet) |
| Diagrams | Primary teaching tool — mermaid diagrams for every concept |
| Docker/Deployment | Dropped entirely |
| Theory depth | Simplified — FLP, safety/liveness, Paxos mentioned but not central |
| Quizzes | Rewritten for beginners — conceptual, scenario-based questions |
| Tone | Friendly, conversational, story-driven |
| Structure | Self-contained chapters that re-explain prerequisites inline |

---

## Architecture Overview

### New Chapter Structure: 4 chapters (down from 5)

The current 5 chapters are restructured into a narrative arc:

```
Chapter 11: Le Problème du Consensus (The Problem)
    ↓ Sets up WHY we need consensus
Chapter 12: Élire un Chef (Electing a Leader)
    ↓ Solves the first sub-problem
Chapter 13: Le Journal Partagé (The Shared Log)
    ↓ Solves the second sub-problem
Chapter 14: Raft en Action (Raft in Action)
    ↓ Ties everything together with failure scenarios
```

**Why this structure:**
- Current Chapter 11 front-loads formal theory before building intuition → fix by starting with a story
- Current Chapter 12 ("Raft Algorithm Overview") duplicates content that's better woven into the story → merge into Chapters 12-14
- Current Chapters 13-14 (election + replication) are code-heavy → replace code with diagrams
- Current Chapter 15 (full system) is 1600 lines of code → replace with conceptual "tying it together" + failure scenarios

### What Each Chapter Removes vs. Adds

| Chapter | Removed | Added |
|---------|---------|-------|
| 11 | Formal definitions first, FLP deep dive, Paxos comparison | Opening story, concrete scenarios, visual "without vs with consensus" |
| 12 | Full TypeScript/Python implementations (400+ lines each) | State transition story, step-by-step election diagrams, pseudocode snippets |
| 13 | Full AppendEntries implementations, Docker configs | Visual log representation, replication flow diagrams, conflict resolution story |
| 14 | Complete KV store + server + Docker (1600 lines) | Failure scenario narratives, "when do you need consensus" guide, brief Paxos mention |

---

## Components and Interfaces

### Chapter 11: Le Problème du Consensus

**Narrative hook:** A team of 3 servers trying to agree on a single answer — told as a story about a restaurant kitchen where 3 chefs need to coordinate orders.

**Section structure:**
1. **Histoire d'Intro** — The restaurant kitchen story: 3 chefs, orders coming in, what happens when they don't coordinate (wrong dishes, duplicated orders, chaos)
2. **Le Problème Sans Nom** — Show the same problem in tech terms: 3 database nodes with conflicting data. Mermaid diagram of split-brain.
3. **Ce Dont Nous Avons Besoin** — Introduce the 4 properties (accord, validité, terminaison, intégrité) as informal needs: "everyone agrees", "the value came from somewhere real", "we eventually decide", "no flip-flopping"
4. **Pourquoi C'est Difficile** — 3 concrete challenges (no shared clock, lost messages, crashed nodes) each with a simple mermaid diagram
5. **FLP (version simple)** — One paragraph: "in theory, perfect consensus is impossible. In practice, we use timeouts and randomization to get close enough." Link to partial synchrony.
6. **La Bonne Nouvelle** — Introduce Raft as "an algorithm designed specifically to be easy to understand." Brief mention of Paxos as "the older, harder version."
7. **Quiz** — Scenario-based: "3 nodes, node 3 crashes, what happens?"

**Diagrams (mermaid):**
- Split-brain scenario (without consensus)
- All nodes agreeing (with consensus)
- Message loss / delay
- Node crash
- Overview of Raft's 2 phases

### Chapter 12: Élire un Chef (Leader Election)

**Narrative hook:** Electing a team captain — a class voting for a president. Candidates campaign, people vote, majority wins.

**Section structure:**
1. **Pourquoi un Chef ?** — The chaos of everyone speaking at once vs. one coordinator. Visual: "without leader" vs "with leader"
2. **Les Trois Rôles** — Suiveur, Candidat, Chef. Introduce with presidential election analogy. State diagram (mermaid).
3. **Les Mandats (Terms)** — "Like presidential terms." Each election starts a new term. Terms only go up. Diagram of timeline with terms.
4. **L'Élection Étape par Étape** — 5-step visual walkthrough:
   - Step 1: Un suiveur s'impatiente (timeout)
   - Step 2: Il devient candidat (term increment, self-vote)
   - Step 3: Il demande des votes (RequestVote RPC)
   - Step 4: Les votes arrivent (majority check)
   - Step 5: Le candidat devient chef (heartbeats begin)
   Each step has a mermaid sequence diagram.
5. **Et Si Deux Candidats Se Présentent ?** — Split votes problem. Fixed timeouts → deadlock. Randomized timeouts → one wins first. Simple probability explanation.
6. **Les Règles de Vote** — When do you grant a vote? 3 simple rules in pseudocode (10 lines).
7. **Résumé** — Key takeaways as a visual checklist
8. **Quiz** — "Node A's timeout is 150ms, Node B's is 280ms, Node C's is 200ms. Who becomes candidate first?"

**Diagrams (mermaid):**
- State transition diagram (follower ↔ candidate → leader)
- Term timeline
- 5-step election sequence (one diagram per step)
- Split vote scenario (fixed vs random timeouts)
- Gantt chart for timeout visualization

### Chapter 13: Le Journal Partagé (Log Replication)

**Narrative hook:** A shared notebook — the team lead writes decisions, everyone copies them in the same order. If someone was absent, the lead helps them catch up.

**Section structure:**
1. **Le Chef a Besoin de Parler** — Now that we have a leader, how do they tell everyone what to do? The shared notebook analogy.
2. **Qu'est-ce qu'un Journal ?** — Visual representation of a log as a sequence of boxes. Each box has: index, term, command. Show 3 nodes with their logs.
3. **La Règle d'Or** — Log matching property explained as "if two notebooks agree on page 5, they agree on pages 1-4 too." Visual diagram.
4. **La Réplication en 5 Étapes** — Step-by-step walkthrough:
   - Step 1: Client sends command to leader
   - Step 2: Leader adds to its journal
   - Step 3: Leader sends AppendEntries to followers
   - Step 4: Followers add to their journals, reply OK
   - Step 5: Leader sees majority → commit! Apply to state machine
   Each step with a mermaid sequence diagram.
5. **Et Si les Journaux Ne Sont Pas Identiques ?** — Conflict resolution story. The leader walks a confused follower back until they agree, then replays from there. Visual before/after.
6. **La Validation (Commit)** — What does "committed" mean? "Safe to apply — won't be lost." Simple rule: committed when majority has it. Why only current-term entries (one paragraph, no deep proof).
7. **La Machine à États** — Visual: journal entries flow into a box that builds the key-value store. Simple analogy: "the journal is the recipe, the state machine is the cooked meal."
8. **Résumé** — Key takeaways
9. **Quiz** — "Leader has log [SET x=1, SET y=2]. Follower has [SET x=1]. What does the leader send?"

**Diagrams (mermaid):**
- Log as visual boxes across 3 nodes
- Log matching property visualization
- 5-step replication sequence (one per step)
- Conflict resolution before/after
- Commit index advancing across nodes
- State machine applying entries

### Chapter 14: Raft en Action (Putting It All Together)

**Narrative hook:** "You've built the engine. Now let's drive it — and see what happens when things break."

**Section structure:**
1. **Le Système Complet** — One architecture diagram showing everything: clients, leader, followers, logs, state machines. Brief recap of what each part does.
2. **Scénario 1 : Le Chef Tombe (Leader Crash)** — Story: the leader crashes mid-operation. Walk through: timeout → election → new leader → catch-up. Full mermaid sequence.
3. **Scénario 2 : Le Réseau Se Coupe (Network Partition)** — Story: 2 nodes can't reach the other 3. The majority side continues. The minority side can't commit. When the network heals, they sync up. Mermaid diagram.
4. **Scénario 3 : Un Ancien Chef Revient (Stale Leader)** — Story: an old leader rejoins with an outdated term. It discovers a higher term and immediately steps down. Mermaid sequence.
5. **Quand Avez-Vous Besoin du Consensus ?** — Practical decision table: "you need it for X, you don't for Y." Simple rule: if multiple nodes must agree on state → consensus. If eventual consistency is OK → no consensus needed.
6. **Paxos vs Raft (en bref)** — One paragraph each. Paxos: "the original, hard to understand." Raft: "designed for understandability, same guarantees." A 2-column comparison table.
7. **Dans le Vrai Monde** — Quick mentions of etcd, Consul, CockroachDB as systems that use Raft.
8. **Résumé du Parcours** — Visual recap of everything learned across all 4 chapters.
9. **Quiz** — Scenario-based: "Cluster of 5, partition separates 2 nodes. Can the 3-node side commit? Can the 2-node side?"

**Diagrams (mermaid):**
- Full system architecture
- Leader crash + re-election sequence
- Network partition diagram
- Stale leader stepping down
- Decision table as visual
- Course recap as a visual journey

---

## Data Models

### Quiz Format (TOML)
Quizzes follow the existing format but with beginner-friendly questions:

```toml
[[questions]]
type = "short_answer"
question = "Dans un cluster de 5 nœuds, combien de nœuds doivent être d'accord pour qu'une décision soit validée ?"
answer = "3"
hint = "Pensez à la majorité..."

[[questions]]
type = "multiple_choice"
question = "Que se passe-t-il si deux nœuds deviennent candidats en même temps avec des délais fixes ?"
options = [
  "L'un gagne rapidement",
  "Les deux obtiennent une majorité",
  "Personne n'obtient la majorité (vote partagé)",
  "Le système plante"
]
answer = 2
```

### Chapter Template
Each chapter follows this template:

```markdown
# [Title]

> **[Session info]**

## [Opening story / hook]

[Narrative paragraph setting the scene]

## [Concept section with diagram]

[Mermaid diagram]
[Brief explanation in plain French]

## [Another concept section]

...

## Résumé

- [Visual recap of key points]

## Exercices

[1-2 hands-on thinking exercises, not coding]

## Quiz du Chapitre

{{#quiz ../../quizzes/[quiz-file].toml}}
```

---

## Error Handling

### Content Risks

| Risk | Mitigation |
|------|-----------|
| Analogies fall flat for some readers | Keep analogies short; always pair with a technical diagram |
| Too much simplification loses accuracy | Use "Pour Aller Plus Loin" callout boxes for nuance |
| French + English terms confusing | Define English terms on first use: "un **journal** (log en anglais)" |
| Mermaid diagrams don't render | Use well-tested mermaid syntax; provide alt-text descriptions |
| Quizzes too easy or too hard | Mix easy recall questions with scenario-based prediction questions |

---

## Testing Strategy

### Validation Approach
- Each chapter should be readable end-to-end in 15-20 minutes
- Every section should have at least one visual element (diagram, table, or formatted callout)
- Code snippets should not exceed 20 lines
- Quiz questions should be answerable from the chapter content alone (no external knowledge)
- Each chapter must work as standalone reading (no "as we saw in Chapter X" without re-explaining)

---

## Appendices

### Technology Choices
- **Mermaid diagrams**: Already used in the project, renders in mdBook with existing mermaid-init.js
- **TOML quizzes**: Existing quiz system, just needs new content
- **mdBook**: No changes to build system needed

### Research Findings Summary
- MIT 6.824: Decompose into labs, Figure 2 as spec, learn by debugging
- Secret Lives of Data: Progressive disclosure, color-coded states, animated messages
- CPA pedagogy: Concrete → Pictorial → Abstract ordering
- Common beginner mistakes: majority ≠ unanimity, consensus ≠ same value, terms ≠ time

### Alternative Approaches Considered
1. **Keep 5 chapters, just simplify** — rejected because Chapter 12 (Raft overview) duplicates content better woven into story
2. **3 chapters** (merge 12+13) — rejected because election and replication are distinct enough concepts for separate chapters
3. **Add interactive JS visualizations** — rejected as out of scope (PROMPT.md focuses on text/diagram content)

### Key Constraints
- Must fit into existing `src/consensus/` directory with sequential numbering
- Must use existing quiz TOML format
- Must not break `SUMMARY.md` structure
- French language throughout
