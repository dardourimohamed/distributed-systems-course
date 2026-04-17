# Research: MIT 6.824/6.5840 Pedagogical Approach

## Key Findings

### Concept Ordering
MIT builds concrete -> abstract -> concrete implementation:
1. LEC 1-3: Real systems (MapReduce, GFS) to expose challenges
2. LEC 4: Paxos (hard version, motivates why Raft exists)
3. LEC 6: Raft Elections + RSM concept
4. LEC 7: Raft Log replication, persistence, snapshots
5. LEC 8: Linearizability (formal model)
6. LEC 10: Raft Lab Q&A / debugging session

### Analogies & Mental Models
- "Split brain" as framing device throughout
- State Machine Replication diagram: Raft as a "library included in each replica"
- Log as "alternate representation of the same information" as service state
- "What could go wrong?" as repeated teaching pattern after every design decision

### Theory vs Practice Balance
- Paper-first, code-second (students read paper before lecture)
- Figure 2 of Raft paper IS the implementation specification
- Practical constraints interleaved (disk write timing, batching)
- Advanced topics discussed but explicitly excluded from labs (leases, membership changes)

### What They Simplify/Omit
- Cluster membership changes (not in labs)
- Leases for read-only (discussed but not implemented)
- Byzantine fault tolerance (deferred to end of course)
- Persistence is simulated (serialize/deserialize, no real disk I/O)
- Client protocol provided (Clerk abstraction handles retries)

### Lab Structure (Spring 2026)
- Lab 3A: Leader election (can pass without election restriction)
- Lab 3B: Log replication (TestRejoin3B is the core test)
- Lab 3C: Persistence (crash recovery)
- Lab 3D: Snapshots (discarding history)
- Lab 4: KV service on Raft (generic RSM abstraction, then KV on top)
- Lab 5: Sharded KV (uses Lab 2's KV as config service)

### Pedagogical Philosophy
1. Start with the problem, not the solution
2. Decompose relentlessly (each lab focuses on narrow invariants)
3. Paper as specification, code as verification
4. Learn by debugging (timeline visualizations, structured logging)
5. Progressive re-integration (each lab reuses previous)
