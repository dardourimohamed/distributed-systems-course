# Research: Core Concepts Classification for Distributed Systems Course

**Sources:**
- Baeldung: Fundamentals of Distributed Systems
- ByteByteGo: A Crash Course on Distributed Systems
- GeeksforGeeks: Distributed Systems Tutorial
- Various CAP Theorem and Consensus resources

---

## Essential Concepts (Must Cover)

### Level 1: Fundamentals (Sessions 1-3)
| Concept | Beginner Difficulty | Why Essential |
|---------|-------------------|--------------|
| **What is a Distributed System** | ⭐ | Foundation - defines the entire course |
| **Message Passing** | ⭐ | Core communication mechanism |
| **Scalability (Horizontal vs Vertical)** | ⭐ | Primary benefit of distributed systems |
| **Basic Fault Tolerance** | ⭐⭐ | Understanding failures |
| **CAP Theorem (Basic)** | ⭐⭐ | Fundamental trade-offs |

### Level 2: Data & Coordination (Sessions 4-7)
| Concept | Difficulty | Why Essential |
|---------|-----------|--------------|
| **Data Partitioning/Sharding** | ⭐⭐⭐ | Required for store/queue systems |
| **Replication (Master-Slave)** | ⭐⭐ | Required for store system |
| **Consistency Models** | ⭐⭐⭐ | Understanding data behavior |
| **Leader Election** | ⭐⭐⭐ | Required for consensus |
| **Gossip Protocol** | ⭐⭐ | Node coordination |

### Level 3: Advanced (Sessions 8-10)
| Concept | Difficulty | Why Essential |
|---------|-----------|--------------|
| **Consensus Algorithms (Raft)** | ⭐⭐⭐⭐ | Required for consensus system |
| **Distributed Transactions** | ⭐⭐⭐⭐ | Advanced coordination |
| **Event Ordering** | ⭐⭐⭐ | Real-time messaging |
| **Vector Clocks** | ⭐⭐⭐ | Causal consistency |

---

## Nice-to-Have Concepts

| Concept | Difficulty | When to Introduce |
|---------|-----------|------------------|
| Time & Lamport Clocks | ⭐⭐⭐ | Optional - can simplify with vector clocks |
| Exactly-Once Semantics | ⭐⭐⭐⭐ | Advanced queue topic |
| Service Discovery | ⭐⭐ | Docker Compose handles this |
| Load Balancing | ⭐⭐ | Docker Compose handles this |
| Rate Limiting | ⭐⭐ | Nice practical add-on |
| Backpressure | ⭐⭐⭐ | Advanced queue topic |

---

## Concepts to Skip/Minimize

| Concept | Reason |
|---------|--------|
| Byzantine Fault Tolerance | Too theoretical for beginner course |
| Formal Proofs | Not practical-focused |
| Complex Topologies | Docker Compose setup is simple |
| CRDTs | Too advanced for beginners |

---

## Difficulty Ranking for Applications

Based on concept complexity and implementation difficulty:

1. **Queue/Work System** (Easiest) - ⭐⭐
   - Concepts: Message passing, async processing, basic fault tolerance
   - Simple producer-consumer pattern

2. **Store with Replication** - ⭐⭐⭐
   - Concepts: Data partitioning, leader election, replication, consistency models
   - CAP theorem trade-offs become concrete

3. **Chat System** - ⭐⭐⭐
   - Concepts: Real-time messaging, event ordering, presence, pub/sub
   - Adds statefulness and connection management

4. **Consensus-Based System** (Hardest) - ⭐⭐⭐⭐
   - Concepts: Raft algorithm, log replication, consensus, voting
   - Most complex algorithms
