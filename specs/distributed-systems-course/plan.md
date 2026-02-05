# Implementation Plan: Distributed Systems Course

**Status Checklist**

- [ ] Step 1: Project Initialization & mdBook Setup
- [ ] Step 2: Introduction & Prerequisites Content
- [ ] Step 3: Queue System - Concepts (Session 1)
- [ ] Step 4: Queue System - Implementation (Session 2)
- [ ] Step 5: Store System - Concepts (Session 3)
- [ ] Step 6: Store System - Replication (Session 4)
- [ ] Step 7: Store System - Consistency (Session 5)
- [ ] Step 8: Chat System - Real-Time (Session 6)
- [ ] Step 9: Chat System - Pub/Sub & Ordering (Session 7)
- [ ] Step 10: Consensus - Concepts (Session 8)
- [ ] Step 11: Consensus - Leader Election (Session 9)
- [ ] Step 12: Consensus - Log Replication (Session 10)
- [ ] Step 13: Reference Materials
- [ ] Step 14: Final Review & Testing

---

## Step 1: Project Initialization & mdBook Setup

**Objective:** Create the project structure and configure mdBook for the course.

**Implementation Guidance:**
1. Create root directory `distributed-systems-course/`
2. Initialize mdBook: `mdbook init`
3. Configure `book.toml` with course metadata
4. Create directory structure: `src/fundamentals/`, `src/data-store/`, `src/real-time/`, `src/consensus/`, `src/reference/`, `examples/`
5. Create initial `SUMMARY.md` with placeholder chapters
6. Add Mermaid plugin support to `book.toml`

**Test Requirements:**
- `mdbook build` completes without errors
- `mdbook serve` renders the book in browser
- All placeholder chapters are accessible via navigation

**Integration Notes:**
This is the foundation step. All subsequent steps add content to this structure.

**Demo Description:**
Empty mdBook that loads in browser with basic table of structure.

---

## Step 2: Introduction & Prerequisites Content

**Objective:** Create the course introduction and setup guide.

**Implementation Guidance:**
1. Write `src/introduction.md` with:
   - Course overview and learning outcomes
   - Target audience description
   - What learners will build (4 systems)
2. Write `src/reference/prerequisites.md` with:
   - Docker installation guide
   - Docker Compose basics
   - TypeScript/Python environment setup
   - mdBook usage (how to read the course)
3. Add Mermaid diagram showing course progression

**Test Requirements:**
- mdBook builds successfully
- All links in SUMMARY.md work
- Mermaid diagram renders correctly

**Integration Notes:**
Links from all chapters will point back to prerequisites for setup help.

**Demo Description:**
User can navigate to introduction and see the course roadmap with visual diagram.

---

## Step 3: Queue System - Concepts (Session 1)

**Objective:** Introduce distributed systems fundamentals and the queue/work pattern.

**Implementation Guidance:**
1. Create `src/fundamentals/01-what-is-ds.md`:
   - Definition of distributed systems
   - Benefits (scalability, reliability, performance)
   - Challenges (network, coordination, consistency)
   - Mermaid architecture diagram
2. Create `src/fundamentals/02-message-passing.md`:
   - Synchronous vs asynchronous communication
   - Message types (request/response, one-way)
   - Mermaid sequence diagrams
3. Create `src/fundamentals/03-queue-pattern.md`:
   - Producer-consumer pattern explained
   - Decoupling benefits
   - Fault tolerance concepts
4. Create examples structure `examples/01-queue/`

**Test Requirements:**
- All diagrams render
- Code syntax highlighting works for TS and Python
- Cross-references between chapters work

**Integration Notes:**
Foundation for hands-on implementation in Step 4.

**Demo Description:**
Learners can read and understand the queue concept before coding.

---

## Step 4: Queue System - Implementation (Session 2)

**Objective:** Build a working queue system with producer and workers.

**Implementation Guidance:**
1. Create `src/fundamentals/04-queue-implementation.md`:
   - Complete TypeScript queue implementation
   - Complete Python queue implementation
   - Docker Compose file for 1 producer + 3 workers
2. Implement queue examples:
   - `examples/01-queue/producer.ts` and `producer.py`
   - `examples/01-queue/worker.ts` and `worker.py`
   - `examples/01-queue/queue.ts` and `queue.py` (simple in-memory queue)
   - `examples/01-queue/docker-compose.yml`
3. Add hands-on exercises:
   - Modify task payload
   - Add retry logic
   - Handle worker failure

**Test Requirements:**
- TypeScript code compiles and runs
- Python code runs without errors
- Docker Compose starts all services
- Producer sends tasks, workers process them
- Stopping a worker doesn't crash the system

**Integration Notes:**
First working distributed system. Sets pattern for subsequent systems.

**Demo Description:**
Running `docker-compose up` shows producer sending tasks and workers processing them in real-time.

---

## Step 5: Store System - Concepts (Session 3)

**Objective:** Introduce data storage, partitioning, and CAP theorem.

**Implementation Guidance:**
1. Create `src/data-store/01-data-partitioning.md`:
   - What is sharding/partitioning
   - Hash-based vs range-based partitioning
   - Mermaid diagram showing data distribution
2. Create `src/data-store/02-cap-theorem.md`:
   - CAP theorem explained (Consistency, Availability, Partition tolerance)
   - Trade-offs with examples
   - Visual CAP triangle diagram
   - Real-world examples (Cassandra, MongoDB, Redis)
3. Create `src/data-store/03-store-basics.md`:
   - Key-value store concept
   - Read and write operations
   - Single node store implementation (TS + Python)
4. Create examples structure `examples/02-store/`

**Test Requirements:**
- CAP theorem diagram renders clearly
- Code examples for single-node store run successfully

**Integration Notes:**
Builds on queue concepts (now we have state to manage).

**Demo Description:**
Single-node KV store that can get/set keys via HTTP.

---

## Step 6: Store System - Replication (Session 4)

**Objective:** Implement data replication and leader election.

**Implementation Guidance:**
1. Create `src/data-store/04-replication.md`:
   - Why replicate (fault tolerance, read scaling)
   - Master-slave vs multi-master
   - Replication strategies (sync vs async)
   - Mermaid sequence diagram of replication flow
2. Create `src/data-store/05-leader-election.md`:
   - What is leader election
   - Bully algorithm explanation
   - Voting mechanism
   - Mermaid state diagram for election
3. Implement replicated store:
   - `examples/02-store/node.ts` and `node.py` (supports leader/follower roles)
   - `examples/02-store/docker-compose.yml` (3 nodes)
   - Heartbeat mechanism
   - Simple leader election on startup
4. Add exercises:
   - Simulate leader failure
   - Observe election process
   - Write to leader, read from follower

**Test Requirements:**
- 3-node cluster starts
- One node becomes leader
- Data written to leader replicates to followers
- Stopping leader triggers new election

**Integration Notes:**
First system with coordination between nodes.

**Demo Description:**
3-node store where writes replicate and leader election happens on failure.

---

## Step 7: Store System - Consistency (Session 5)

**Objective:** Explore consistency models and quorum reads/writes.

**Implementation Guidance:**
1. Create `src/data-store/06-consistency-models.md`:
   - Strong vs eventual consistency
   - Read-your-writes consistency
   - Causal consistency
   - Trade-offs explained
2. Create `src/data-store/07-quorum.md`:
   - What is a quorum
   - Read quorum and write quorum
   - Calculating quorum: Q > N/2
   - Mermaid diagram showing quorum reads/writes
3. Enhance store implementation:
   - Add configurable consistency levels
   - Implement quorum reads
   - Implement quorum writes
   - Add consistency level parameter to API
4. Add exercises:
   - Test with different consistency levels
   - Observe behavior during network delay
   - Measure read/write latency differences

**Test Requirements:**
- Quorum reads return consistent data
- Quorum writes wait for acknowledgment
- Eventual consistency allows stale reads
- Strong consistency always returns latest data

**Integration Notes:**
Completes the store system. Learners now understand CAP trade-offs concretely.

**Demo Description:**
Store with configurable consistency showing strong vs eventual behavior.

---

## Step 8: Chat System - Real-Time (Session 6)

**Objective:** Introduce real-time communication with WebSockets.

**Implementation Guidance:**
1. Create `src/real-time/01-websockets.md`:
   - What are WebSockets
   - HTTP vs WebSocket comparison
   - WebSocket lifecycle (connect, message, disconnect)
   - Mermaid sequence diagram of WebSocket handshake
2. Create `src/real-time/02-chat-basics.md`:
   - Chat system architecture
   - Client-server communication
   - Message format
3. Implement basic chat:
   - `examples/03-chat/server.ts` and `server.py` (WebSocket server)
   - `examples/03-chat/client.html` (simple browser client)
   - `examples/03-chat/docker-compose.yml`
   - Broadcast messages to all connected clients
4. Add exercises:
   - Connect multiple clients
   - Send messages between clients
   - Handle disconnect/reconnect

**Test Requirements:**
- WebSocket server accepts connections
- Multiple clients can connect simultaneously
- Messages broadcast to all clients
- Disconnecting a client doesn't crash server

**Integration Notes:**
New pattern: real-time bidirectional communication.

**Demo Description:**
Multi-client chat where messages appear in real-time.

---

## Step 9: Chat System - Pub/Sub & Ordering (Session 7)

**Objective:** Implement pub/sub, presence, and message ordering.

**Implementation Guidance:**
1. Create `src/real-time/03-pub-sub.md`:
   - Publish-subscribe pattern
   - Topics/channels concept
   - Decoupling benefits
   - Mermaid diagram of pub/sub flow
2. Create `src/real-time/04-message-ordering.md`:
   - Why ordering matters
   - Sequence numbers
   - Causal ordering basics
   - Mermaid diagram showing ordered message flow
3. Create `src/real-time/05-presence.md`:
   - Online/offline status
   - Heartbeat mechanism
   - User list management
4. Enhance chat implementation:
   - Add chat rooms (channels)
   - Implement presence system
   - Add sequence numbers to messages
   - Persist messages to file
   - `examples/03-chat/docker-compose.yml` (server + broker)
5. Add exercises:
   - Create separate chat rooms
   - Implement message history on join
   - Show user presence

**Test Requirements:**
- Messages are room-isolated
- Presence shows online/offline users
- Messages are ordered by sequence number
- Reconnecting clients receive message history

**Integration Notes:**
Combines real-time communication with state management (from store).

**Demo Description:**
Multi-room chat with presence, persistent history, and ordered messages.

---

## Step 10: Consensus - Concepts (Session 8)

**Objective:** Introduce consensus and the Raft algorithm.

**Implementation Guidance:**
1. Create `src/consensus/01-what-is-consensus.md`:
   - Definition of consensus
   - Why consensus is hard
   - Safety and liveness properties
   - Real-world use cases
2. Create `src/consensus/02-raft-overview.md`:
   - What is Raft
   - Raft vs Paxos (why Raft is easier to understand)
   - Raft components: leader election, log replication, safety
   - Mermaid diagram of Raft architecture
3. Create `src/consensus/03-state-machines.md`:
   - Replicated state machine concept
   - All nodes apply same commands in same order
   - Mermaid state diagram
4. Create examples structure `examples/04-consensus/`

**Test Requirements:**
- Raft architecture diagram is clear
- State machine concept is explained with examples

**Integration Notes:**
Most complex topic - starts with theory before implementation.

**Demo Description:**
No code yet - conceptual understanding with visual diagrams.

---

## Step 11: Consensus - Leader Election (Session 9)

**Objective:** Implement Raft leader election.

**Implementation Guidance:**
1. Create `src/consensus/04-leader-election.md`:
   - Raft leader election rules
   - Terms and voting
   - Election timeout
   - State transitions: follower → candidate → leader
   - Mermaid state diagram for election
2. Implement Raft leader election:
   - `examples/04-consensus/node.ts` and `node.py`
   - Follower, candidate, leader states
   - RequestVote RPC
   - Election timeout with randomization
   - Term management
   - `examples/04-consensus/docker-compose.yml` (5 nodes)
3. Add exercises:
   - Start 5 nodes, observe leader election
   - Kill leader, observe new election
   - Kill multiple nodes, observe no leader possible

**Test Requirements:**
- 5-node cluster elects exactly one leader
- Followers reject vote requests from lower terms
- Leader failure triggers new election
- Split vote situation resolves (randomized timeouts)

**Integration Notes:**
Foundation for log replication in Step 12.

**Demo Description:**
5-node cluster where users can observe leader election in logs.

---

## Step 12: Consensus - Log Replication (Session 10)

**Objective:** Complete Raft with log replication and state machine.

**Implementation Guidance:**
1. Create `src/consensus/05-log-replication.md`:
   - Log entry structure
   - AppendEntries RPC
   - Log matching property
   - Commit index and committed entries
   - Mermaid sequence diagram of replication
2. Create `src/consensus/06-state-machine.md`:
   - Applying committed entries
   - Key-value store as state machine
   - Linearizable semantics
3. Complete Raft implementation:
   - Add log to each node
   - Implement AppendEntries RPC
   - Implement commit logic
   - Apply committed entries to state machine
   - Client API for get/set operations
4. Add exercises:
   - Write key through leader
   - Read from any node (should return committed value)
   - Kill and restart node, observe log recovery
   - Demonstrate split-brain prevention

**Test Requirements:**
- Writes go through leader only
- Log replicates to majority of nodes
- Committed entries are applied to state machine
- Reads return committed values
- System tolerates minority node failures
- No split-brain (only one leader per term)

**Integration Notes:**
Completes the consensus system. Learners now understand the hardest distributed systems concept.

**Demo Description:**
5-node Raft cluster implementing a distributed key-value store with consensus.

---

## Step 13: Reference Materials

**Objective:** Complete the course with supplementary materials.

**Implementation Guidance:**
1. Create `src/reference/docker-setup.md`:
   - Docker installation for each OS
   - Docker Compose commands reference
   - Common Docker issues and solutions
2. Create `src/reference/troubleshooting.md`:
   - Common issues for each system type
   - Debugging tips
   - Log interpretation
3. Create `src/reference/further-reading.md`:
   - Papers (Raft, Paxos, CAP)
   - Books (Designing Data-Intensive Applications)
   - Online courses
   - Open source projects to study
4. Update `SUMMARY.md` with all chapters

**Test Requirements:**
- All reference links work
- Troubleshooting section covers common issues
- Further reading resources are relevant

**Integration Notes:**
Support materials for learners who encounter issues or want to go deeper.

**Demo Description:**
Comprehensive reference section accessible from any chapter.

---

## Step 14: Final Review & Testing

**Objective:** Ensure the course is complete, correct, and polished.

**Implementation Guidance:**
1. **Content Review:**
   - Proofread all chapters
   - Verify all code examples run
   - Check all Mermaid diagrams render
   - Validate all internal links
   - Ensure TS and Python examples are equivalent
2. **Docker Testing:**
   - Build and run all 4 example systems
   - Verify docker-compose.yml files work
   - Test failure scenarios described in exercises
3. **mdBook Build:**
   - Run `mdbook build`
   - Verify HTML output in multiple browsers
   - Test dark/light themes
   - Check search functionality
4. **Documentation:**
   - Add README.md to project root
   - Include build and serve instructions
   - Add contribution guidelines (if applicable)

**Test Requirements:**
- All 15 chapters have complete content
- All code examples execute without errors
- All Docker Compose files work end-to-end
- mdBook builds successfully
- No broken links
- All diagrams render correctly

**Integration Notes:**
Final polish step. Produces the complete, deliverable course.

**Demo Description:**
Complete mdBook course that learners can use from start to finish.

---

## Progress Tracking

| Step | Status | Notes |
|------|--------|-------|
| 1. Project Initialization | ⬜ | |
| 2. Introduction Content | ⬜ | |
| 3. Queue Concepts | ⬜ | |
| 4. Queue Implementation | ⬜ | First working system |
| 5. Store Concepts | ⬜ | |
| 6. Store Replication | ⬜ | |
| 7. Store Consistency | ⬜ | |
| 8. Chat Real-Time | ⬜ | |
| 9. Chat Pub/Sub | ⬜ | |
| 10. Consensus Concepts | ⬜ | |
| 11. Consensus Election | ⬜ | |
| 12. Consensus Log Replication | ⬜ | Complete Raft |
| 13. Reference Materials | ⬜ | |
| 14. Final Review | ⬜ | Course complete |

---

## Summary

This implementation plan creates a complete 15-chapter mdBook course covering:

- **4 Working Distributed Systems**: Queue, Store, Chat, Consensus
- **Dual Language Examples**: Every concept in TypeScript and Python
- **Docker Compose Deployments**: All systems run locally
- **Progressive Complexity**: Easiest (Queue) to Hardest (Consensus)
- **Hands-On Learning**: Each session produces working code

**Total Deliverables:**
- 1 mdBook with 15+ chapters
- 4 working distributed system implementations
- 4 Docker Compose configurations
- Reference materials and troubleshooting guide
