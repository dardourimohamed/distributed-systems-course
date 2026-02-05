# What is a Distributed System?

> **Session 1, Part 1** - 20 minutes

## Learning Objectives

- [ ] Define what a distributed system is
- [ ] Identify key characteristics of distributed systems
- [ ] Understand why distributed systems matter
- [ ] Recognize distributed systems in everyday life

## Definition

A **distributed system** is a collection of independent computers that appears to its users as a single coherent system.

```mermaid
graph TB
    subgraph "Users See"
        Single["Single System"]
    end

    subgraph "Reality"
        N1["Node 1"]
        N2["Node 2"]
        N3["Node 3"]
        N4["Node N"]

        N1 <--> N2
        N2 <--> N3
        N3 <--> N4
        N4 <--> N1
    end

    Single -->|"appears as"| N1
    Single -->|"appears as"| N2
    Single -->|"appears as"| N3
```

### Key Insight

The defining characteristic is the **illusion of unity**—users interact with what seems like one system, while behind the scenes, multiple machines work together.

## Three Key Characteristics

According to Leslie Lamport, a distributed system is:

> "One in which the failure of a computer you didn't even know existed can render your own computer unusable."

This definition highlights three fundamental characteristics:

### 1. Concurrency (Multiple Things Happen At Once)

Multiple components execute simultaneously, leading to complex interactions.

```mermaid
sequenceDiagram
    participant U as User
    participant A as Server A
    participant B as Server B
    participant C as Server C

    U->>A: Request
    A->>B: Query
    A->>C: Update
    B-->>A: Response
    C-->>A: Ack
    A-->>U: Result
```

### 2. No Global Clock

Each node has its own clock. There's no single "now" across the system.

```mermaid
graph LR
    A[Clock A: 10:00:01.123]
    B[Clock B: 10:00:02.456]
    C[Clock C: 09:59:59.789]

    A -.->|network latency| B
    B -.->|network latency| C
    C -.->|network latency| A
```

**Implication:** You can't rely on timestamps to order events across nodes. You need logical clocks (more on this in later sessions!).

### 3. Independent Failure

Components can fail independently. When one part fails, the rest may continue—or may become unusable.

```mermaid
stateDiagram-v2
    [*] --> AllHealthy: System Start
    AllHealthy --> PartialFailure: One Node Fails
    AllHealthy --> CompleteFailure: Critical Nodes Fail
    PartialFailure --> AllHealthy: Recovery
    PartialFailure --> CompleteFailure: Cascading Failure
    CompleteFailure --> [*]
```

## Why Distributed Systems?

### Scalability

**Vertical Scaling (Scale Up):**
- Add more resources to a single machine
- Eventually hits hardware/cost limits

**Horizontal Scaling (Scale Out):**
- Add more machines to the system
- Virtually unlimited scaling potential

```mermaid
graph TB
    subgraph "Vertical Scaling"
        Big[Big Expensive Server<br/>$100,000]
    end

    subgraph "Horizontal Scaling"
        S1[Commodity Server<br/>$1,000]
        S2[Commodity Server<br/>$1,000]
        S3[Commodity Server<br/>$1,000]
        S4[...]
    end

    Big <--> S1
    Big <--> S2
    Big <--> S3
```

### Reliability & Availability

A single point of failure is unacceptable for critical services:

```mermaid
graph TB
    subgraph "Single System"
        S[Single Server]
        S -.-> X[❌ Failure = No Service]
    end

    subgraph "Distributed System"
        N1[Node 1]
        N2[Node 2]
        N3[Node 3]

        N1 <--> N2
        N2 <--> N3
        N3 <--> N1

        N1 -.-> X2[❌ One Fails]
        X2 --> OK[✓ Others Continue]
    end
```

### Latency (Geographic Distribution)

Placing data closer to users improves experience:

```mermaid
graph TB
    User[User in NYC]

    subgraph "Global Distribution"
        NYC[NYC Datacenter<br/>10ms latency]
        LON[London Datacenter<br/>70ms latency]
        TKY[Tokyo Datacenter<br/>150ms latency]
    end

    User --> NYC
    User -.-> LON
    User -.-> TKY

    NYC <--> LON
    LON <--> TKY
    TKY <--> NYC
```

## Examples of Distributed Systems

### Everyday Examples

| System | Description | Benefit |
|--------|-------------|---------|
| **Web Search** | Query servers, index servers, cache servers | Fast responses, always available |
| **Streaming Video** | Content delivery networks (CDNs) | Low latency, high quality |
| **Online Shopping** | Product catalog, cart, payment, inventory | Handles traffic spikes |
| **Social Media** | Posts, comments, likes, notifications | Real-time updates |

### Technical Examples

**Database Replication:**
```mermaid
graph LR
    W[Write to Primary] --> P[(Primary DB)]
    P --> R1[(Replica 1)]
    P --> R2[(Replica 2)]
    P --> R3[(Replica 3)]
    R1 --> Read1[Read from Replica]
    R2 --> Read2[Read from Replica]
    R3 --> Read3[Read from Replica]
```

**Load Balancing:**
```mermaid
graph TB
    Users[Users]
    LB[Load Balancer]

    Users --> LB
    LB --> S1[Server 1]
    LB --> S2[Server 2]
    LB --> S3[Server 3]
    LB --> S4[Server N]
```

## Trade-offs

Distributed systems introduce complexity:

| Challenge | Description |
|-----------|-------------|
| **Network Issues** | Unreliable, variable latency, partitions |
| **Concurrency** | Race conditions, deadlocks, coordination |
| **Partial Failures** | Some components work, others don't |
| **Consistency** | Keeping data in sync across nodes |

**The Fundamental Dilemma:**
> "Is the benefits of distribution worth the added complexity?"

For most modern applications, the answer is **yes**—which is why we're learning this!

## Summary

### Key Takeaways

1. **Distributed systems** = multiple computers acting as one
2. **Three characteristics:** concurrency, no global clock, independent failure
3. **Benefits:** scalability, reliability, lower latency
4. **Costs:** complexity, network issues, consistency challenges

### Check Your Understanding

- [ ] Can you explain why there's no global clock in a distributed system?
- [ ] Give an example of a distributed system you use daily
- [ ] Why does independent failure make distributed systems harder to build?

## 🧠 Chapter Quiz

Test your mastery of these concepts! These questions will challenge your understanding and reveal any gaps in your knowledge.

{{#quiz ../../quizzes/fundamentals-what-is-ds.toml}}

## What's Next

Now that we understand what distributed systems are, let's explore how they communicate: [Message Passing](./02-message-passing.md)
