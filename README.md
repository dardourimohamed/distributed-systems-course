# Distributed Systems Course

A comprehensive course on distributed systems from fundamentals to consensus, implemented with mdBook.

## Quick Start

### Prerequisites

1. Install [mdBook](https://rust-lang.github.io/mdBook/guide/installation.html):
   ```bash
   cargo install mdbook
   cargo install mdbook-mermaid
   ```

2. Install [Docker](https://docs.docker.com/get-docker/) and Docker Compose

### Build the Book

```bash
cd distributed-systems-course
mdbook build
mdbook serve  # Preview at http://localhost:3000
```

## Course Structure

This course consists of 10 sessions (15 hours total) covering:

| Part | Sessions | Topics |
|------|----------|--------|
| I | 1-2 | Queue/Work System - Producer-consumer, message passing |
| II | 3-5 | Store with Replication - CAP, leader election, consistency |
| III | 6-7 | Chat System - WebSockets, pub/sub, message ordering |
| IV | 8-10 | Consensus System - Raft algorithm, log replication |

## Code Examples

All examples include **both TypeScript and Python** implementations. Each session includes:
- Concept explanation with diagrams
- Working code examples
- Docker Compose deployment
- Hands-on exercises

## Directory Layout

```
distributed-systems-course/
├── book.toml              # mdBook configuration
├── src/                   # Course content
│   ├── SUMMARY.md         # Table of contents
│   ├── fundamentals/      # Sessions 1-2
│   ├── data-store/        # Sessions 3-5
│   ├── real-time/         # Sessions 6-7
│   ├── consensus/         # Sessions 8-10
│   └── reference/         # Reference materials
└── examples/              # Docker Compose examples
    ├── 01-queue/
    ├── 02-store/
    ├── 03-chat/
    └── 04-consensus/
```

## License

MIT License - see LICENSE file for details
