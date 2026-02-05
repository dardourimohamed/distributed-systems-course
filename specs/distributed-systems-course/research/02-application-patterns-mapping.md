# Research: Application Patterns & Concept Mapping

**Sources:**
- System Design Handbook: Message Queue, Chat System
- GeeksforGeeks: Distributed Task Queue
- Medium: Designing Distributed Message Queue
- Baeldung: Consensus Algorithms
- Various Raft/Paxos tutorials

---

## Application 1: Queue/Work System (Sessions 1-2)

### Core Concepts Taught
- **Producer-Consumer Pattern**: Fundamental async communication
- **Message Passing**: Basic distributed communication
- **Fault Tolerance**: What happens when a worker fails?
- **At-Least-Once Delivery**: Basic reliability guarantee
- **Task Scheduling**: Work distribution

### Implementation Pattern
```
Producer → Queue → Worker(s)
          ↓
       Task Storage
```

### Key Learning Points
| Concept | TS Example | Python Example |
|---------|-----------|---------------|
| Producer | TypeScript class publishing messages | Python script sending tasks |
| Queue | In-memory or simple file-based | Redis or simple list |
| Worker | Process consuming messages | Process consuming messages |
| Acknowledgment | Confirm task completion | Confirm task completion |

### Docker Compose Structure
```yaml
services:
  producer:
  queue:
  worker-1:
  worker-2:
  worker-3:
```

---

## Application 2: Store with Replication (Sessions 3-5)

### Core Concepts Taught
- **Data Partitioning**: Sharding keys across nodes
- **Leader Election**: Choosing a primary node
- **Replication**: Keeping data in sync
- **Consistency Models**: Strong vs Eventual
- **CAP Theorem**: Practical trade-offs

### Implementation Pattern
```
Client → Leader Node (Read/Write)
   ↓            ↓
Followers    Replication Log
(Read-only)  (async/sync)
```

### Key Learning Points
| Concept | TS Example | Python Example |
|---------|-----------|---------------|
| Key-Value Store | In-memory Map | Dictionary |
| Replication | WebSocket/HTTP sync | HTTP sync |
| Leader Election | Simple voting/bully algorithm | Simple voting/bully algorithm |
| Consistency Level | Configurable read/write quorum | Configurable read/write quorum |

### Docker Compose Structure
```yaml
services:
  node-1:  # Potential leader
  node-2:
  node-3:
  client:
```

---

## Application 3: Chat System (Sessions 6-7)

### Core Concepts Taught
- **Real-Time Communication**: WebSocket/long-polling
- **Pub/Sub Pattern**: Broadcasting messages
- **Message Ordering**: Sequence numbers
- **Presence**: Who's online
- **Message Persistence**: Storing chat history

### Implementation Pattern
```
Client A ←→ Chat Server ←→ Client B
              ↓
         Message Store
              ↓
         Pub/Sub Broker
```

### Key Learning Points
| Concept | TS Example | Python Example |
|---------|-----------|---------------|
| WebSocket | ws library | websockets library |
| Presence | In-memory set | Redis set |
| Message Queue | For broadcasting | For broadcasting |
| History | File/Database | File/Database |

### Docker Compose Structure
```yaml
services:
  chat-server-1:
  chat-server-2:
  message-broker:
  storage:
  client-a:
  client-b:
```

---

## Application 4: Consensus-Based System (Sessions 8-10)

### Core Concepts Taught
- **Raft Algorithm**: Leader election, log replication
- **Consensus**: Reaching agreement
- **Log Replication**: Keeping state in sync
- **State Machine**: All nodes execute same commands

### Implementation Pattern
```
Client → Leader (accepts commands)
   ↓
Replicated Log (sends to followers)
   ↓
Commit (once majority agrees)
   ↓
State Machine Application
```

### Key Learning Points
| Concept | TS Example | Python Example |
|---------|-----------|---------------|
| Raft Leader Election | Term voting | Term voting |
| Log Replication | Append entries RPC | Append entries RPC |
| Commit Index | Track committed entries | Track committed entries |
| State Machine | Key-value store | Key-value store |

### Docker Compose Structure
```yaml
services:
  raft-node-1:  # Potential leader
  raft-node-2:
  raft-node-3:
  raft-node-4:
  raft-node-5:
  client:
```

---

## Recommended Session Breakdown (10 Sessions)

| Session | Application | Concepts |
|---------|-------------|----------|
| 1 | Intro + Queue Basics | What is DS, message passing, producer-consumer |
| 2 | Queue Implementation | Build working queue system |
| 3 | Store Basics + CAP | Data partitioning, CAP theorem |
| 4 | Store Replication | Leader election, replication |
| 5 | Store Consistency | Consistency models, quorums |
| 6 | Chat Real-Time | WebSockets, pub/sub |
| 7 | Chat Ordering | Message ordering, persistence |
| 8 | Consensus Intro | What is consensus, Raft overview |
| 9 | Consensus Implementation | Raft leader election + log replication |
| 10 | Consensus + Review | State machine, course wrap-up |

---

## Teaching Principles

1. **Progressive Complexity**: Each app builds on previous concepts
2. **Concrete Before Abstract**: Build it first, then formalize
3. **Dual Language Examples**: Always show TS and Python side-by-side
4. **Visual Learning**: Use diagrams for architecture and data flow
5. **Failure Scenarios**: Demonstrate what happens when nodes fail
6. **Local Docker**: Keep setup simple, no cloud complexity
