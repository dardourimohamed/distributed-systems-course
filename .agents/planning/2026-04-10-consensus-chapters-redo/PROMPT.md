# PROMPT — Remake the Consensus Chapters

## Task

Rewrite the consensus systems section of the distributed systems course. Replace the current 5 chapters with 4 beginner-friendly, story-driven, diagram-rich chapters in French. Also rewrite all 4 associated quiz files.

## Context

This is an mdBook-based distributed systems course at `/home/med/distributed-systems-course/`. The consensus section currently has 5 chapters that are too theory-heavy and code-dense for the target audience: **junior developers** who are new to both programming and distributed systems.

## Target Audience

Junior developers. They know basic TypeScript/Python but have no distributed systems background. Every concept must be built from intuition using real-world analogies before any technical explanation. Chapters must be **self-contained** — briefly re-explain any prerequisite concepts (like replication, message passing) inline rather than assuming knowledge from earlier sessions.

## Tone and Style

- **Friendly and story-driven** — like a colleague explaining over coffee
- **Conversational French** — use "tu", informal but respectful
- **Narrative flow** — each chapter opens with a relatable story/scenario, then connects it to the technical concept
- **Minimal code** — pseudocode snippets only (max 20 lines), never full implementations
- **Diagrams first** — every concept gets a mermaid diagram before any text explanation
- **Short paragraphs** — 2-3 sentences max between visual breaks

## Chapter Structure

The old 5 chapters (`11-what-is-consensus.md`, `12-raft-algorithm.md`, `13-raft-leader-election.md`, `14-log-replication.md`, `15-consensus-system.md`) are replaced by 4 new chapters:

### Chapter 11: Le Problème du Consensus
**File:** `src/consensus/11-what-is-consensus.md`

**Opening story:** A restaurant kitchen with 3 chefs receiving orders independently. Without coordination: wrong dishes, duplicates, chaos. With coordination: one head chef directs, everyone agrees on the order of dishes.

**Sections:**
1. **Histoire : La Cuisine Chaotique** — The restaurant story. 2-3 paragraphs. No diagrams yet.
2. **Le Même Problème, en Informatique** — Map the story to 3 servers. Mermaid diagram: split-brain (3 nodes with different values). Mermaid diagram: all nodes agreeing.
3. **Ce Dont Nous Avons Besoin** — The 4 properties as informal statements (not formal math):
   - "Tous les nœuds sont d'accord" (Accord)
   - "La valeur choisie a vraiment été proposée" (Validité)
   - "On finit par décider, on ne tourne pas en boucle" (Terminaison)
   - "Personne ne change d'avis" (Intégrité)
4. **Pourquoi C'est Si Difficile** — 3 concrete challenges, each with a mermaid diagram:
   - Pas d'horloge globale (nodes have different clocks, can't agree on "what happened first")
   - Messages perdus ou retardés (messages can disappear or arrive late)
   - Les nœuds peuvent tomber en panne (a node crashes with uncommitted data)
5. **FLP (Version Simple)** — One short paragraph: "En théorie, le consensus parfait est impossible dans un réseau asynchrone (résultat FLP, 1985). En pratique, on utilise des délais d'attente et de l'aléatoire pour s'en rapprocher." No proof, no deep explanation.
6. **La Bonne Nouvelle : Raft** — Introduce Raft as "un algorithme conçu exprès pour être compréhensible." Brief mention of Paxos: "L'ancêtre (Paxos, 1998) fonctionne mais est très difficile à comprendre." Mermaid diagram: Raft's 2 phases (election + replication).
7. **Résumé** — 5-6 bullet points, each one sentence.
8. **Exercices** — 2-3 thinking exercises (not coding):
   - "Donne un exemple d'un système qui a besoin de consensus et un qui n'en a pas besoin."
   - "Que se passe-t-il si 3 nœuds perdent la connexion entre eux ?"
9. **Quiz** — `{{#quiz ../../quizzes/consensus-what-is-consensus.toml}}`

**Quiz file:** `quizzes/consensus-what-is-consensus.toml`
- 6 questions: 4 multiple choice + 2 short answer
- All answerable from chapter alone
- Scenarios: "3 nœuds, le nœud 3 tombe en panne. Que se passe-t-il ?"

---

### Chapter 12: Élire un Chef
**File:** `src/consensus/12-raft-leader-election.md`
**Note:** This replaces both the old `12-raft-algorithm.md` and `13-raft-leader-election.md`

**Opening story:** A class electing a president. Candidates raise their hand, people vote, first to get majority wins. If nobody gets majority, new election.

**Sections:**
1. **Histoire : L'Élection du Délégué** — Classroom election story. 2-3 paragraphs.
2. **Pourquoi un Chef ?** — Chaos of everyone speaking at once vs. one coordinator. Mermaid: "Sans chef" (3 nodes shouting) vs. "Avec chef" (leader directs).
3. **Les Trois Rôles** — Suiveur (Follower), Candidat (Candidate), Chef (Leader). Introduce with the election analogy. Mermaid state diagram: Follower ↔ Candidate → Leader, with transition triggers.
4. **Les Mandats (Terms)** — "Comme des mandats présidentiels." Each election starts a new term. Terms only go up. Old-term leaders are automatically replaced. Mermaid timeline: Term 1 (Leader A), Term 2 (split vote), Term 3 (Leader B).
5. **L'Élection, Étape par Étape** — 5 steps, each with a mermaid sequence diagram:
   - Étape 1 : Un suiveur s'impatiente (son délai d'attente expire)
   - Étape 2 : Il devient candidat (incrémente le terme, vote pour lui-même)
   - Étape 3 : Il demande des votes (envoie RequestVote à tous)
   - Étape 4 : Les votes arrivent (vérifie s'il a la majorité)
   - Étape 5 : Il devient chef (envoie des battements de cœur)
6. **Et Si Deux Candidats Se Présentent ?** — Split votes. Mermaid: fixed timeouts → all become candidates simultaneously → nobody wins. Mermaid: random timeouts → one becomes candidate first → wins easily. Gantt chart showing different timeout values.
7. **Les Règles de Vote (en pseudocode)** — Max 15 lines of pseudocode. 3 rules:
   ```
   si terme_du_candidat < mon_terme → NON
   si j'ai déjà voté ce terme → NON
   si le journal du candidat est à jour → OUI
   ```
8. **Résumé** — 5 bullet points.
9. **Exercices** — 2-3 thinking exercises.
10. **Quiz** — `{{#quiz ../../quizzes/consensus-leader-election.toml}}`

**Quiz file:** `quizzes/consensus-leader-election.toml`
- 6 questions: 4 multiple choice + 2 short answer
- Include: "Noeud A (délai 150ms), B (280ms), C (200ms). Qui devient candidat en premier ?"
- Include: "Pourquoi les délais d'attente sont-ils aléatoires ?"

---

### Chapter 13: Le Journal Partagé
**File:** `src/consensus/13-log-replication.md`
**Note:** This replaces the old `14-log-replication.md`

**Opening story:** A team lead keeps a notebook of all decisions. Every team member copies the notebook. If someone was absent, the lead helps them catch up by showing what they missed.

**Sections:**
1. **Histoire : Le Cahier de Décisions** — Shared notebook story. 2-3 paragraphs.
2. **Qu'est-ce qu'un Journal ?** — Visual representation: a sequence of boxes, each with index/term/command. Mermaid diagram showing 3 nodes with their logs (some ahead, some behind).
3. **La Règle d'Or** — Log matching property: "Si deux cahiers sont d'accord sur la page 5, ils sont d'accord sur les pages 1 à 4." Mermaid diagram showing matching entries.
4. **La Réplication en 5 Étapes** — Each step with a mermaid sequence diagram:
   - Étape 1 : Le client envoie une commande au chef
   - Étape 2 : Le chef ajoute à son journal
   - Étape 3 : Le chef envoie AppendEntries aux suiveurs
   - Étape 4 : Les suiveurs ajoutent à leur journal et répondent OK
   - Étape 5 : Le chef voit la majorité → validé ! Application à la machine à états
5. **Et Si les Journaux Divergent ?** — Conflict resolution story. Before/after mermaid diagrams:
   - Leader: [1,1] [2,2] [3,2], Follower: [1,1] [2,1] [3,1] [4,3]
   - Leader sends AppendEntries → mismatch at index 2 → backs up → retries → follower overwrites
6. **La Validation (Commit)** — "Quand une entrée est validée, elle ne sera jamais perdue." Simple rule: validée quand la majorité l'a. One sentence about why we only commit current-term entries.
7. **La Machine à États** — Mermaid: journal entries flow into a box (state machine) that builds the key-value store. Analogy: "Le journal est la recette, la machine à états est le plat cuisiné."
8. **Résumé** — 5 bullet points.
9. **Exercices** — 2-3 thinking exercises.
10. **Quiz** — `{{#quiz ../../quizzes/consensus-log-replication.toml}}`

**Quiz file:** `quizzes/consensus-log-replication.toml`
- 6 questions: 4 multiple choice + 2 short answer
- Include: "Le chef a le journal [SET x=1, SET y=2]. Le suiveur a [SET x=1]. Que doit envoyer le chef ?"
- Include: "Quand une entrée est-elle considérée comme validée ?"

---

### Chapter 14: Raft en Action
**File:** `src/consensus/15-consensus-system.md`
**Note:** This replaces the old `15-consensus-system.md`

**Opening story:** "Tu as construit le moteur. Maintenant, conduisons — et voyons ce qui se passe quand les choses cassent."

**Sections:**
1. **Le Système Complet** — One architecture mermaid diagram: clients → leader ↔ followers, with logs and state machines. Brief 2-sentence recap of each component.
2. **Scénario 1 : Le Chef Tombe en Panne** — Story + mermaid sequence diagram:
   - Leader crashes mid-operation
   - Followers' timeouts expire
   - New election
   - New leader elected
   - Followers catch up
3. **Scénario 2 : Le Réseau Se Coupe** — Story + mermaid diagram:
   - 5-node cluster, network splits into groups of 3 and 2
   - The 3-node side (majority) can still elect a leader and commit
   - The 2-node side (minority) cannot reach majority, blocks
   - Network heals → minority side syncs up
4. **Scénario 3 : L'Ancien Chef Revient** — Story + mermaid sequence:
   - Old leader rejoins with outdated term
   - Receives message with higher term
   - Immediately steps down to follower
5. **Quand Avez-Vous Besoin du Consensus ?** — Decision table:
   - Base de données distribuée → Oui
   - Cache CDN → Non (cohérence éventuelle suffit)
   - Verrou distribué → Oui
   - Élection de leader → Oui
   - Système en lecture seule → Non
   Brief rule: "Si plusieurs nœuds doivent être d'accord sur l'état → consensus. Si la cohérence éventuelle suffit → pas besoin."
6. **Paxos vs Raft (En Bref)** — 2 paragraphs + 2-column comparison table:
   - Paxos: "L'original (1998), correct mais très difficile à comprendre et implémenter"
   - Raft: "Conçu pour la compréhension (2014), mêmes garanties, beaucoup plus facile"
7. **Dans le Vrai Monde** — 3 bullet points: etcd (Kubernetes), Consul (HashiCorp), CockroachDB. One sentence each.
8. **Résumé du Parcours** — Visual recap mermaid diagram showing the journey across all 4 chapters.
9. **Exercices** — 2-3 thinking exercises.
10. **Quiz** — `{{#quiz ../../quizzes/consensus-consensus-system.toml}}`

**Quiz file:** `quizzes/consensus-consensus-system.toml`
- 6 questions: 4 multiple choice + 2 short answer
- Include: "Cluster de 5 nœuds, partition réseau sépare 2 nœuds. Le côté 3 peut-il valider ? Le côté 2 peut-il ?"
- Include: "Nomme un système réel qui utilise Raft."

---

## Formatting Rules

### Mermaid Diagrams
- Use `mermaid` fenced code blocks (mdBook processes these)
- Prefer simple diagrams: `graph`, `sequenceDiagram`, `stateDiagram-v2`, `timeline`
- Keep diagrams small (max 15 nodes/elements per diagram)
- Always add a 1-sentence caption before each diagram
- Use French labels in diagrams

### Code Snippets
- Pseudocode only, no runnable implementations
- Max 20 lines per snippet
- Use French comments
- No Docker, no HTTP servers, no real networking code

### General
- Every section heading uses `##` or `###`
- Bold (**gras**) for key terms on first use, with English term in parentheses: **journal** (log en anglais)
- Use `>` blockquotes for key insights
- Keep paragraphs to 2-3 sentences
- Each chapter should be readable in 15-20 minutes (target: 200-350 lines of markdown including diagrams)

### Quiz TOML Format
Follow the existing format:
```toml
[[questions]]
type = "multiple_choice"
question = "Question text in French"
options = ["Option A", "Option B", "Option C", "Option D"]
answer = 0  # zero-indexed

[[questions]]
type = "short_answer"
question = "Question text in French"
answer = "expected answer"
hint = "optional hint"
```

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/consensus/11-what-is-consensus.md` | Rewrite completely |
| `src/consensus/12-raft-leader-election.md` | Rewrite completely (replaces old 12 + 13) |
| `src/consensus/13-log-replication.md` | Rewrite completely |
| `src/consensus/15-consensus-system.md` | Rewrite completely |
| `src/consensus/14-log-replication.md` | Delete (merged into new 13) |
| `quizzes/consensus-what-is-consensus.toml` | Rewrite |
| `quizzes/consensus-leader-election.toml` | Rewrite |
| `quizzes/consensus-raft-algorithm.toml` | Delete (no longer needed) |
| `quizzes/consensus-log-replication.toml` | Rewrite |
| `quizzes/consensus-consensus-system.toml` | Rewrite |
| `src/SUMMARY.md` | Update to reflect new structure |

## What NOT to Do

- Do NOT include full TypeScript or Python implementations
- Do NOT include Docker Compose files or deployment instructions
- Do NOT write formal mathematical definitions (use plain French)
- Do NOT assume knowledge from earlier course chapters
- Do NOT use English for prose (only for technical terms in parentheses)
- Do NOT create new files outside the listed paths
- Do NOT modify non-consensus chapters or the book build configuration
