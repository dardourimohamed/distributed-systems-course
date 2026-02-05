# PROMPT: Distributed Systems Course Implementation

## Objective

Create a comprehensive mdBook-based course on distributed systems for beginners to advanced concepts. The course will be taught in 10 sessions of 1.5 hours each, with both TypeScript and Python code examples.

## Key Requirements

1. **Format**: mdBook (Markdown-based)
2. **Duration**: 10 sessions × 1.5 hours (15 hours total)
3. **Target Audience**: Developers with average programming skills, new to distributed systems
4. **Languages**: Dual code examples in TypeScript and Python for every concept
5. **Deployment**: Local Docker Compose (no cloud infrastructure)
6. **Session Format**: Mixed - concept explanation, diagram walkthrough, live demo, hands-on exercise, run & test

## Application Types (in difficulty order)

| Order | Application | Sessions | Core Concepts |
|-------|-------------|----------|--------------|
| 1 | Queue/Work System | 1-2 | Producer-consumer, message passing, fault tolerance |
| 2 | Store with Replication | 3-5 | Partitioning, CAP theorem, leader election, consistency models |
| 3 | Chat System | 6-7 | WebSockets, pub/sub, message ordering, presence |
| 4 | Consensus System | 8-10 | Raft algorithm, log replication, state machine |

## Acceptance Criteria

### AC1: Complete mdBook Structure
```gherkin
GIVEN a complete implementation
WHEN mdbook build is executed
THEN it should:
  - Build without errors
  - Generate valid HTML with working navigation
  - Render all Mermaid diagrams correctly
  - Display code syntax highlighting for TS and Python
```

### AC2: Working Queue System (Sessions 1-2)
```gherkin
GIVEN the queue system implementation
WHEN deployed via Docker Compose
THEN:
  - Producer sends tasks to queue
  - Workers process tasks concurrently
  - Failed tasks are retried
  - System continues when one worker fails
```

### AC3: Working Store System (Sessions 3-5)
```gherkin
GIVEN the replicated store implementation
WHEN deployed via Docker Compose
THEN:
  - Data replicates across follower nodes
  - Leader election occurs on leader failure
  - Reads return data based on consistency level
  - System tolerates one node failure
```

### AC4: Working Chat System (Sessions 6-7)
```gherkin
GIVEN the chat system implementation
WHEN deployed via Docker Compose
THEN:
  - Real-time messages work between clients
  - Presence status updates
  - Messages persist and are retrieved on reconnect
  - Multiple chat rooms operate independently
```

### AC5: Working Consensus System (Sessions 8-10)
```gherkin
GIVEN the Raft consensus implementation
WHEN deployed via Docker Compose
THEN:
  - Leader is elected among nodes
  - Log entries replicate to majority
  - Committed entries apply to state machine
  - System maintains consistency during node failures
```

## Output Location

Create the course at: `distributed-systems-course/` (sibling to specs/)

## Reference Documentation

See `specs/distributed-systems-course/` for:
- `design.md` - Complete design specification
- `plan.md` - 14-step implementation plan
- `research/` - Concept classification and patterns

## Implementation Notes

- Each chapter needs: learning objectives, concept explanation, Mermaid diagram, TS code, Python code, Docker Compose, exercises
- Use Mermaid for all diagrams (architecture, sequence, state)
- All code examples must run successfully
- Docker Compose files must work end-to-end
- Include reference materials: Docker setup, troubleshooting, further reading
