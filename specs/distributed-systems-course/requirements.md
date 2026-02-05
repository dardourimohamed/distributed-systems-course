# Requirements Clarification

*This document will be populated with Q&A during the requirements gathering phase.*

## Questions & Answers

### Q1: What is the prior programming experience of your target audience?

**Context:** This helps determine the depth of explanations, prerequisite knowledge assumed, and complexity of code examples.

**Waiting for answer...**

**Answer:** Average programming skills and totally new to distributed systems.

### Q2: What should learners be able to do or build by the end of this course?

**Context:** This helps define learning objectives and practical outcomes.

**Answer:** Understand and explain distributed systems concepts AND build and deploy a simple distributed application.

### Q3: How should each 1.5-hour session be structured?

**Context:** This helps organize the content flow within each session.

**Answer:** Mixed based on the course. Each session should cover 1-2 clear and simple concepts, depending on complexity and context.

### Q4: What type of distributed application should learners build?

**Context:** This defines the hands-on project that ties everything together.

**Answer:** Focus on:
1. Store with replication
2. Consensus-based system
3. Queue/work system
4. Chat systems

### Q5: Where should learners deploy and run their distributed applications?

**Context:** This affects the complexity of setup and the infrastructure concepts covered.

**Answer:** Local Docker Compose.

### Q6: With 10 sessions and 4 application types, how should we sequence the content?

**Context:** We need to balance depth and breadth with only 10 sessions.

**Answer:** Session blocks, starting with the easiest application type and progressing to the hardest.

### Q7: To confirm the session block ordering, which application types should we cover first to last?

**Context:** From easiest to hardest.

**Answer:**
1. Queue/work system (easiest)
2. Store with replication
3. Chat system
4. Consensus-based system (hardest)

### Q8: Which distributed systems concepts are must-haves for this course?

**Context:** Essential vs. optional concepts.

**Answer:** Perform research and classify concepts based on course goals and target audience.

### Research Completed ✓

Research conducted on:
- Core concepts classification and difficulty ranking
- Application patterns mapping to 4 system types
- mdBook structure and pedagogical best practices

**Findings documented in:** `research/01-core-concepts-classification.md`, `research/02-application-patterns-mapping.md`, `research/03-mdbook-structure.md`

**Classification Summary:**
- Essential concepts organized by difficulty (Level 1-3)
- Application difficulty ranking confirmed: Queue → Store → Chat → Consensus
- 10-session breakdown established
- mdBook structure defined with dual-language (TS/Python) approach
