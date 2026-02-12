# Implémentation du Système de Consensus

> **Session 10, Partie 2** - 60 minutes

## Objectifs d'Apprentissage

- [ ] Construire un système de consensus complet basé sur Raft
- [ ] Implémenter une abstraction de machine à états (magasin clé-valeur)
- [ ] Créer des APIs clientes pour les opérations get/set
- [ ] Déployer et tester le système complet avec Docker Compose
- [ ] Vérifier les propriétés de sécurité et de vivacité

---

## Aperçu : Tout Combiner

Dans les chapitres précédents, nous avons implémenté les deux composants principaux de Raft :

1. **Élection de Leader** (Session 9) - Vote démocratique pour sélectionner un leader
2. **Réplication de Journal** (Session 10, Partie 1) - Répliquer les commandes à travers les nœuds

Maintenant nous les combinons en un **système de consensus complet** - un magasin clé-valeur distribué qui fournit des garanties de forte cohérence.

```
┌────────────────────────────────────────────────────────────┐
│              Système de Consensus Raft                    │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Client  ──→  Leader  ──→  Réplication de Journal  ──→  Suiveurs │
│     │            │              │                    │      │
│     │            ▼              ▼                    ▼      │
│     │         Élection de Leader (si nécessaire)                │
│     │            │                                          │
│     ▼            ▼                                          ▼
│  Machine à États (tous les nœuds appliquent les mêmes commandes) │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## Architecture du Système

```mermaid
graph TB
    subgraph "Couche Client"
        C1[Client 1]
        C2[Client 2]
    end

    subgraph "Cluster Raft"
        N1[Nœud 1 : Leader]
        N2[Nœud 2 : Suiveur]
        N3[Nœud 3 : Suiveur]
    end

    subgraph "Couche Machine à États"
        SM1[Magasin CV 1]
        SM2[Magasin CV 2]
        SM3[Magasin CV 3]
    end

    C1 -->|SET/GET| N1
    C2 -->|SET/GET| N1

    N1 <-->|AppendEntries RPC| N2
    N1 <-->|AppendEntries RPC| N3
    N2 <-->|RequestVote RPC| N3

    N1 --> SM1
    N2 --> SM2
    N3 --> SM3

    style N1 fill:#9f9
    style N2 fill:#fc9
    style N3 fill:#fc9
```

---

## Implémentation Complète TypeScript

### Structure du Projet

```
typescript-raft/
├── package.json
├── tsconfig.json
├── src/
│   ├── types.ts              # Types partagés
│   ├── state-machine.ts      # Machine à états de magasin CV
│   ├── raft-node.ts          # Implémentation Raft complète
│   ├── server.ts             # Serveur API HTTP
│   └── index.ts              # Point d'entrée
└── docker-compose.yml
```

### package.json

```json
{
  "name": "typescript-raft-kv-store",
  "version": "1.0.0",
  "description": "Magasin clé-valeur distribué utilisant le consensus Raft",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.3"
  }
}
```

### types.ts

```typescript
// États des nœuds
export enum NodeState {
  FOLLOWER = 'follower',
  CANDIDATE = 'candidate',
  LEADER = 'leader'
}

// Entrée de journal
export interface LogEntry {
  index: number;
  term: number;
  command: string;
}

// RPC RequestVote
export interface RequestVoteRequest {
  term: number;
  candidateId: string;
  lastLogIndex: number;
  lastLogTerm: number;
}

export interface RequestVoteResponse {
  term: number;
  voteGranted: boolean;
}

// RPC AppendEntries
export interface AppendEntriesRequest {
  term: number;
  leaderId: string;
  prevLogIndex: number;
  prevLogTerm: number;
  entries: LogEntry[];
  leaderCommit: number;
}

export interface AppendEntriesResponse {
  term: number;
  success: boolean;
}

// Commandes clientes
export interface SetCommand {
  type: 'SET';
  key: string;
  value: string;
}

export interface GetCommand {
  type: 'GET';
  key: string;
}

export interface DeleteCommand {
  type: 'DELETE';
  key: string;
}

export type Command = SetCommand | GetCommand | DeleteCommand;
```

### state-machine.ts

```typescript
import { LogEntry } from './types';

/**
 * Machine à États de Magasin Clé-Valeur
 * Applique les entrées de journal validées pour construire un état cohérent
 */
export class KVStoreStateMachine {
  private data: Map<string, string> = new Map();

  /**
   * Appliquer une entrée de journal validée à la machine à états
   */
  apply(entry: LogEntry): void {
    try {
      const command = JSON.parse(entry.command);

      switch (command.type) {
        case 'SET':
          this.data.set(command.key, command.value);
          console.log(`[Machine à États] SET ${command.key} = ${command.value}`);
          break;

        case 'DELETE':
          if (this.data.has(command.key)) {
            this.data.delete(command.key);
            console.log(`[Machine à États] DELETE ${command.key}`);
          }
          break;

        case 'GET':
          // Les commandes en lecture seule ne modifient pas l'état
          break;

        default:
          console.warn(`[Machine à États] Type de commande inconnu : ${command.type}`);
      }
    } catch (error) {
      console.error(`[Machine à États] Échec de l'application de l'entrée :`, error);
    }
  }

  /**
   * Obtenir une valeur de la machine à états
   */
  get(key: string): string | undefined {
    return this.data.get(key);
  }

  /**
   * Obtenir toutes les paires clé-valeur
   */
  getAll(): Record<string, string> {
    return Object.fromEntries(this.data);
  }

  /**
   * Effacer la machine à états (pour les tests)
   */
  clear(): void {
    this.data.clear();
  }
}
```

### raft-node.ts

```typescript
import {
  NodeState,
  LogEntry,
  RequestVoteRequest,
  RequestVoteResponse,
  AppendEntriesRequest,
  AppendEntriesResponse,
  Command
} from './types';
import { KVStoreStateMachine } from './state-machine';
import axios from 'axios';

interface ClusterConfig {
  nodeId: string;
  peerIds: string[];
  electionTimeoutMin: number;
  electionTimeoutMax: number;
  heartbeatInterval: number;
}

export class RaftNode {
  // Configuration
  private config: ClusterConfig;

  // État persistant (survit aux redémarrages)
  private currentTerm: number = 0;
  private votedFor: string | null = null;
  private log: LogEntry[] = [];

  // État volatil (réinitialisé au redémarrage)
  private commitIndex: number = 0;
  private lastApplied: number = 0;
  private state: NodeState = NodeState.FOLLOWER;

  // État du leader (réinitialisé à l'élection)
  private nextIndex: Map<string, number> = new Map();
  private matchIndex: Map<string, number> = new Map();

  // Composants
  private stateMachine: KVStoreStateMachine;
  private leaderId: string | null = null;

  // Timers
  private electionTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor(config: ClusterConfig) {
    this.config = config;
    this.stateMachine = new KVStoreStateMachine();
    this.resetElectionTimeout();
  }

  // ========== API Publique ==========

  /**
   * Client : Soumettre une commande au cluster
   */
  async submitCommand(command: Command): Promise<any> {
    // Rediriger vers le leader si pas leader
    if (this.state !== NodeState.LEADER) {
      if (this.leaderId) {
        throw new Error(`Pas un leader. Veuillez rediriger vers ${this.leaderId}`);
      }
      throw new Error('Aucun leader connu. Veuillez réessayer.');
    }

    // Gérer les commandes GET (lecture seule, pas de consensus nécessaire)
    if (command.type === 'GET') {
      return this.stateMachine.get(command.key);
    }

    // Ajouter au journal local
    const entry: LogEntry = {
      index: this.log.length + 1,
      term: this.currentTerm,
      command: JSON.stringify(command)
    };
    this.log.push(entry);

    // Répliquer aux suiveurs
    this.replicateLog();

    // Attendre la validation
    await this.waitForCommit(entry.index);

    // Retourner le résultat
    if (command.type === 'SET') {
      return { key: command.key, value: command.value };
    } else if (command.type === 'DELETE') {
      return { key: command.key, deleted: true };
    }
  }

  /**
   * Démarrer le nœud (commencer le délai d'élection)
   */
  start(): void {
    this.resetElectionTimeout();
  }

  /**
   * Arrêter le nœud (effacer les timers)
   */
  stop(): void {
    if (this.electionTimer) clearTimeout(this.electionTimer);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
  }

  // ========== Gestionnaires RPC ==========

  /**
   * Gérer le RPC RequestVote
   */
  handleRequestVote(req: RequestVoteRequest): RequestVoteResponse {
    // Si term < currentTerm, rejeter
    if (req.term < this.currentTerm) {
      return { term: this.currentTerm, voteGranted: false };
    }

    // Si term > currentTerm, mettre à jour et devenir suiveur
    if (req.term > this.currentTerm) {
      this.currentTerm = req.term;
      this.state = NodeState.FOLLOWER;
      this.votedFor = null;
    }

    // Accorder le vote si :
    // 1. Nous n'avons pas voté ce terme, OU
    // 2. Nous avons voté pour ce candidat
    // ET le journal du candidat est au moins aussi à jour que le nôtre
    const logOk = req.lastLogTerm > this.getLastLogTerm() ||
      (req.lastLogTerm === this.getLastLogTerm() && req.lastLogIndex >= this.log.length);

    const canVote = this.votedFor === null || this.votedFor === req.candidateId;

    if (canVote && logOk) {
      this.votedFor = req.candidateId;
      this.resetElectionTimeout();
      return { term: this.currentTerm, voteGranted: true };
    }

    return { term: this.currentTerm, voteGranted: false };
  }

  /**
   * Gérer le RPC AppendEntries
   */
  handleAppendEntries(req: AppendEntriesRequest): AppendEntriesResponse {
    // Si term < currentTerm, rejeter
    if (req.term < this.currentTerm) {
      return { term: this.currentTerm, success: false };
    }

    // Reconnaître le leader
    this.leaderId = req.leaderId;

    // Si term > currentTerm, mettre à jour et devenir suiveur
    if (req.term > this.currentTerm) {
      this.currentTerm = req.term;
      this.state = NodeState.FOLLOWER;
      this.votedFor = null;
    }

    // Réinitialiser le délai d'élection
    this.resetElectionTimeout();

    // Vérifier la cohérence du journal
    if (req.prevLogIndex > 0) {
      if (this.log.length < req.prevLogIndex) {
        return { term: this.currentTerm, success: false };
      }

      const prevEntry = this.log[req.prevLogIndex - 1];
      if (prevEntry.term !== req.prevLogTerm) {
        return { term: this.currentTerm, success: false };
      }
    }

    // Ajouter de nouvelles entrées
    if (req.entries.length > 0) {
      let insertIndex = req.prevLogIndex;
      for (const entry of req.entries) {
        if (insertIndex < this.log.length) {
          const existing = this.log[insertIndex];
          if (existing.index === entry.index && existing.term === entry.term) {
            insertIndex++;
            continue;
          }
          // Conflit ! Supprimer à partir d'ici
          this.log = this.log.slice(0, insertIndex);
        }
        this.log.push(entry);
        insertIndex++;
      }
    }

    // Mettre à jour l'index de validation
    if (req.leaderCommit > this.commitIndex) {
      this.commitIndex = Math.min(req.leaderCommit, this.log.length);
      this.applyCommittedEntries();
    }

    return { term: this.currentTerm, success: true };
  }

  // ========== Méthodes Privées ==========

  /**
   * Démarrer l'élection (convertir en candidat)
   */
  private startElection(): void {
    this.state = NodeState.CANDIDATE;
    this.currentTerm++;
    this.votedFor = this.config.nodeId;
    this.leaderId = null;

    console.log(`[Nœud ${this.config.nodeId}] Démarrage de l'élection pour le terme ${this.currentTerm}`);

    // Demander les votes des pairs
    const req: RequestVoteRequest = {
      term: this.currentTerm,
      candidateId: this.config.nodeId,
      lastLogIndex: this.log.length,
      lastLogTerm: this.getLastLogTerm()
    };

    let votesReceived = 1; // Vote pour soi-même
    const majority = Math.floor(this.config.peerIds.length / 2) + 1;

    for (const peerId of this.config.peerIds) {
      this.sendRequestVote(peerId, req).then(resp => {
        if (resp.voteGranted) {
          votesReceived++;
          if (votesReceived >= majority && this.state === NodeState.CANDIDATE) {
            this.becomeLeader();
          }
        } else if (resp.term > this.currentTerm) {
          this.currentTerm = resp.term;
          this.state = NodeState.FOLLOWER;
          this.votedFor = null;
        }
      }).catch(() => {
        // Pair indisponible, ignorer
      });
    }

    // Réinitialiser le délai d'élection pour le prochain tour
    this.resetElectionTimeout();
  }

  /**
   * Devenir leader après avoir gagné l'élection
   */
  private becomeLeader(): void {
    this.state = NodeState.LEADER;
    this.leaderId = this.config.nodeId;
    console.log(`[Nœud ${this.config.nodeId}] Devient leader pour le terme ${this.currentTerm}`);

    // Initialiser l'état du leader
    for (const peerId of this.config.peerIds) {
      this.nextIndex.set(peerId, this.log.length + 1);
      this.matchIndex.set(peerId, 0);
    }

    // Commencer à envoyer des battements de cœur
    this.startHeartbeats();
  }

  /**
   * Envoyer des battements de cœur à tous les suiveurs
   */
  private startHeartbeats(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);

    this.heartbeatTimer = setInterval(() => {
      if (this.state === NodeState.LEADER) {
        this.replicateLog();
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Répliquer le journal aux suiveurs (envoie aussi les battements de cœur)
   */
  private replicateLog(): void {
    if (this.state !== NodeState.LEADER) return;

    for (const followerId of this.config.peerIds) {
      const nextIdx = this.nextIndex.get(followerId) || 1;
      const prevLogIndex = nextIdx - 1;
      const prevLogTerm = prevLogIndex > 0 ? this.log[prevLogIndex - 1].term : 0;
      const entries = this.log.slice(nextIdx - 1);

      const req: AppendEntriesRequest = {
        term: this.currentTerm,
        leaderId: this.config.nodeId,
        prevLogIndex,
        prevLogTerm,
        entries,
        leaderCommit: this.commitIndex
      };

      this.sendAppendEntries(followerId, req).then(resp => {
        if (this.state !== NodeState.LEADER) return;

        if (resp.term > this.currentTerm) {
          this.currentTerm = resp.term;
          this.state = NodeState.FOLLOWER;
          this.votedFor = null;
          if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
          return;
        }

        if (resp.success) {
          const lastIndex = prevLogIndex + entries.length;
          this.matchIndex.set(followerId, lastIndex);
          this.nextIndex.set(followerId, lastIndex + 1);
          this.updateCommitIndex();
        } else {
          const currentNext = this.nextIndex.get(followerId) || 1;
          this.nextIndex.set(followerId, Math.max(1, currentNext - 1));
        }
      }).catch(() => {
        // Suiveur indisponible, réessayera
      });
    }
  }

  /**
   * Mettre à jour l'index de validation si la majorité a l'entrée
   */
  private updateCommitIndex(): void {
    if (this.state !== NodeState.LEADER) return;

    const N = this.log.length;
    const majority = Math.floor(this.config.peerIds.length / 2) + 1;

    for (let i = N; i > this.commitIndex; i--) {
      if (this.log[i - 1].term !== this.currentTerm) continue;

      let count = 1; // Le leader l'a
      for (const matchIdx of this.matchIndex.values()) {
        if (matchIdx >= i) count++;
      }

      if (count >= majority) {
        this.commitIndex = i;
        this.applyCommittedEntries();
        break;
      }
    }
  }

  /**
   * Appliquer les entrées validées à la machine à états
   */
  private applyCommittedEntries(): void {
    while (this.lastApplied < this.commitIndex) {
      this.lastApplied++;
      const entry = this.log[this.lastApplied - 1];
      this.stateMachine.apply(entry);
    }
  }

  /**
   * Attendre qu'une entrée soit validée
   */
  private async waitForCommit(index: number): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        if (this.commitIndex >= index) {
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  }

  /**
   * Réinitialiser le délai d'élection avec une valeur aléatoire
   */
  private resetElectionTimeout(): void {
    if (this.electionTimer) clearTimeout(this.electionTimer);

    const timeout = this.randomTimeout();
    this.electionTimer = setTimeout(() => {
      if (this.state !== NodeState.LEADER) {
        this.startElection();
      }
    }, timeout);
  }

  private randomTimeout(): number {
    const min = this.config.electionTimeoutMin;
    const max = this.config.electionTimeoutMax;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private getLastLogTerm(): number {
    if (this.log.length === 0) return 0;
    return this.log[this.log.length - 1].term;
  }

  // ========== Couche Réseau (simplifiée) ==========

  private async sendRequestVote(peerId: string, req: RequestVoteRequest): Promise<RequestVoteResponse> {
    const url = `http://${peerId}/raft/request-vote`;
    const response = await axios.post(url, req);
    return response.data;
  }

  private async sendAppendEntries(peerId: string, req: AppendEntriesRequest): Promise<AppendEntriesResponse> {
    const url = `http://${peerId}/raft/append-entries`;
    const response = await axios.post(url, req);
    return response.data;
  }

  // ========== Méthodes de Débogage ==========

  getState() {
    return {
      nodeId: this.config.nodeId,
      state: this.state,
      term: this.currentTerm,
      leaderId: this.leaderId,
      logLength: this.log.length,
      commitIndex: this.commitIndex,
      stateMachine: this.stateMachine.getAll()
    };
  }
}
```

### server.ts

```typescript
import express from 'express';
import { RaftNode } from './raft-node';
import { Command } from './types';

export function createServer(node: RaftNode, port: number): express.Application {
  const app = express();
  app.use(express.json());

  // Points de terminaison RPC Raft
  app.post('/raft/request-vote', (req, res) => {
    const response = node.handleRequestVote(req.body);
    res.json(response);
  });

  app.post('/raft/append-entries', (req, res) => {
    const response = node.handleAppendEntries(req.body);
    res.json(response);
  });

  // Points de terminaison API Client
  app.get('/kv/:key', (req, res) => {
    const command: Command = { type: 'GET', key: req.params.key };
    node.submitCommand(command)
      .then(value => res.json({ key: req.params.key, value }))
      .catch(err => res.status(500).json({ error: err.message }));
  });

  app.post('/kv', (req, res) => {
    const command: Command = { type: 'SET', key: req.body.key, value: req.body.value };
    node.submitCommand(command)
      .then(result => res.json(result))
      .catch(err => res.status(500).json({ error: err.message }));
  });

  app.delete('/kv/:key', (req, res) => {
    const command: Command = { type: 'DELETE', key: req.params.key };
    node.submitCommand(command)
      .then(result => res.json(result))
      .catch(err => res.status(500).json({ error: err.message }));
  });

  // Point de terminaison de débogage
  app.get('/debug', (req, res) => {
    res.json(node.getState());
  });

  return app;
}
```

### index.ts

```typescript
import { RaftNode } from './raft-node';
import { createServer } from './server';

const NODE_ID = process.env.NODE_ID || 'node1';
const PEER_IDS = process.env.PEER_IDS?.split(',') || [];
const PORT = parseInt(process.env.PORT || '3000');

const node = new RaftNode({
  nodeId: NODE_ID,
  peerIds: PEER_IDS,
  electionTimeoutMin: 150,
  electionTimeoutMax: 300,
  heartbeatInterval: 50
});

node.start();

const app = createServer(node, PORT);
app.listen(PORT, () => {
  console.log(`Nœud ${NODE_ID} écoute sur le port ${PORT}`);
  console.log(`Pairs : ${PEER_IDS.join(', ')}`);
});
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  node1:
    build: .
    container_name: raft-node1
    environment:
      - NODE_ID=node1
      - PEER_IDS=node2:3000,node3:3000
      - PORT=3000
    ports:
      - "3001:3000"

  node2:
    build: .
    container_name: raft-node2
    environment:
      - NODE_ID=node2
      - PEER_IDS=node1:3000,node3:3000
      - PORT=3000
    ports:
      - "3002:3000"

  node3:
    build: .
    container_name: raft-node3
    environment:
      - NODE_ID=node3
      - PEER_IDS=node1:3000,node2:3000
      - PORT=3000
    ports:
      - "3003:3000"
```

### Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

---

## Implémentation Complète Python

### Structure du Projet

```
python-raft/
├── requirements.txt
├── src/
│   ├── types.py              # Types partagés
│   ├── state_machine.py      # Machine à états de magasin CV
│   ├── raft_node.py          # Implémentation Raft complète
│   ├── server.py             # Serveur API Flask
│   └── __init__.py
├── app.py                    # Point d'entrée
└── docker-compose.yml
```

### requirements.txt

```
flask==3.0.0
requests==2.31.0
gunicorn==21.2.0
```

### types.py

```python
from enum import Enum
from dataclasses import dataclass
from typing import List, Optional, Union

class NodeState(Enum):
    FOLLOWER = "follower"
    CANDIDATE = "candidate"
    LEADER = "leader"

@dataclass
class LogEntry:
    index: int
    term: int
    command: str

@dataclass
class RequestVoteRequest:
    term: int
    candidate_id: str
    last_log_index: int
    last_log_term: int

@dataclass
class RequestVoteResponse:
    term: int
    vote_granted: bool

@dataclass
class AppendEntriesRequest:
    term: int
    leader_id: str
    prev_log_index: int
    prev_log_term: int
    entries: List[LogEntry]
    leader_commit: int

@dataclass
class AppendEntriesResponse:
    term: int
    success: bool

@dataclass
class SetCommand:
    type: str = 'SET'
    key: str = ''
    value: str = ''

@dataclass
class GetCommand:
    type: str = 'GET'
    key: str = ''

@dataclass
class DeleteCommand:
    type: str = 'DELETE'
    key: str = ''

Command = Union[SetCommand, GetCommand, DeleteCommand]
```

### state_machine.py

```python
from typing import Dict, Optional
import json
from .types import LogEntry

class KVStoreStateMachine:
    """Machine à États de Magasin Clé-Valeur"""

    def __init__(self):
        self.data: Dict[str, str] = {}

    def apply(self, entry: LogEntry) -> None:
        """Appliquer une entrée de journal validée à la machine à états"""
        try:
            command = json.loads(entry.command)

            if command['type'] == 'SET':
                self.data[command['key']] = command['value']
                print(f"[Machine à États] SET {command['key']} = {command['value']}")

            elif command['type'] == 'DELETE':
                if command['key'] in self.data:
                    del self.data[command['key']]
                    print(f"[Machine à États] DELETE {command['key']}")

            elif command['type'] == 'GET':
                # Lecture seule, pas de changement d'état
                pass

        except Exception as e:
            print(f"[Machine à États] Échec de l'application de l'entrée : {e}")

    def get(self, key: str) -> Optional[str]:
        """Obtenir une valeur de la machine à états"""
        return self.data.get(key)

    def get_all(self) -> Dict[str, str]:
        """Obtenir toutes les paires clé-valeur"""
        return dict(self.data)

    def clear(self) -> None:
        """Effacer la machine à états (pour les tests)"""
        self.data.clear()
```

### raft_node.py

```python
import asyncio
import random
import json
from typing import Dict, List, Optional
from .types import (
    NodeState, LogEntry, RequestVoteRequest, RequestVoteResponse,
    AppendEntriesRequest, AppendEntriesResponse, Command
)
from .state_machine import KVStoreStateMachine
import requests

class ClusterConfig:
    nodeId: str
    peer_ids: List[str]
    election_timeout_min: int
    election_timeout_max: int
    heartbeat_interval: int

    def __init__(self, node_id: str, peer_ids: List[str],
                 election_timeout_min: int = 150,
                 election_timeout_max: int = 300,
                 heartbeat_interval: int = 50):
        self.nodeId = node_id
        self.peer_ids = peer_ids
        self.election_timeout_min = election_timeout_min
        self.election_timeout_max = election_timeout_max
        self.heartbeat_interval = heartbeat_interval

class RaftNode:
    def __init__(self, config: ClusterConfig):
        self.config = config
        self.state_machine = KVStoreStateMachine()

        # État persistant
        self.current_term = 0
        self.voted_for: Optional[str] = None
        self.log: List[LogEntry] = []

        # État volatil
        self.commit_index = 0
        self.last_applied = 0
        self.state = NodeState.FOLLOWER
        self.leader_id: Optional[str] = None

        # État du leader
        self.next_index: Dict[str, int] = {}
        self.match_index: Dict[str, int] = {}

        # Timers
        self.election_task: Optional[asyncio.Task] = None
        self.heartbeat_task: Optional[asyncio.Task] = None

    # ========== API Publique ==========

    async def submit_command(self, command: Command) -> any:
        """Client : Soumettre une commande au cluster"""

        # Rediriger vers le leader si pas leader
        if self.state != NodeState.LEADER:
            if self.leader_id:
                raise Exception(f"Pas un leader. Veuillez rediriger vers {self.leader_id}")
            raise Exception("Aucun leader connu. Veuillez réessayer.")

        # Gérer les commandes GET (lecture seule)
        if command.type == 'GET':
            return self.state_machine.get(command.key)

        # Ajouter au journal local
        entry = LogEntry(
            index=len(self.log) + 1,
            term=self.current_term,
            command=json.dumps(command.__dict__)
        )
        self.log.append(entry)

        # Répliquer aux suiveurs
        await self.replicate_log()

        # Attendre la validation
        await self._wait_for_commit(entry.index)

        # Retourner le résultat
        if command.type == 'SET':
            return {"key": command.key, "value": command.value}
        elif command.type == 'DELETE':
            return {"key": command.key, "deleted": True}

    def start(self):
        """Démarrer le nœud"""
        asyncio.create_task(self._election_loop())

    def stop(self):
        """Arrêter le nœud"""
        if self.election_task:
            self.election_task.cancel()
        if self.heartbeat_task:
            self.heartbeat_task.cancel()

    # ========== Gestionnaires RPC ==========

    def handle_request_vote(self, req: RequestVoteRequest) -> RequestVoteResponse:
        """Gérer le RPC RequestVote"""

        if req.term < self.current_term:
            return RequestVoteResponse(term=self.current_term, vote_granted=False)

        if req.term > self.current_term:
            self.current_term = req.term
            self.state = NodeState.FOLLOWER
            self.voted_for = None

        log_ok = (req.last_log_term > self._get_last_log_term() or
                  (req.last_log_term == self._get_last_log_term() and
                   req.last_log_index >= len(self.log)))

        can_vote = self.voted_for is None or self.voted_for == req.candidate_id

        if can_vote and log_ok:
            self.voted_for = req.candidate_id
            return RequestVoteResponse(term=self.current_term, vote_granted=True)

        return RequestVoteResponse(term=self.current_term, vote_granted=False)

    def handle_append_entries(self, req: AppendEntriesRequest) -> AppendEntriesResponse:
        """Gérer le RPC AppendEntries"""

        if req.term < self.current_term:
            return AppendEntriesResponse(term=self.current_term, success=False)

        # Reconnaître le leader
        self.leader_id = req.leader_id

        if req.term > self.current_term:
            self.current_term = req.term
            self.state = NodeState.FOLLOWER
            self.voted_for = None

        # Vérifier la cohérence du journal
        if req.prev_log_index > 0:
            if len(self.log) < req.prev_log_index:
                return AppendEntriesResponse(term=self.current_term, success=False)

            prev_entry = self.log[req.prev_log_index - 1]
            if prev_entry.term != req.prev_log_term:
                return AppendEntriesResponse(term=self.current_term, success=False)

        # Ajouter de nouvelles entrées
        if req.entries:
            insert_index = req.prev_log_index
            for entry in req.entries:
                if insert_index < len(self.log):
                    existing = self.log[insert_index]
                    if existing.index == entry.index and existing.term == entry.term:
                        insert_index += 1
                        continue
                    self.log = self.log[:insert_index]
                self.log.append(entry)
                insert_index += 1

        # Mettre à jour l'index de validation
        if req.leader_commit > self.commit_index:
            self.commit_index = min(req.leader_commit, len(self.log))
            self._apply_committed_entries()

        return AppendEntriesResponse(term=self.current_term, success=True)

    # ========== Méthodes Privées ==========

    async def _election_loop(self):
        """Boucle de délai d'élection"""
        while True:
            timeout = self._random_timeout()
            await asyncio.sleep(timeout / 1000)

            if self.state != NodeState.LEADER:
                await self._start_election()

    async def _start_election(self):
        """Démarrer l'élection (convertir en candidat)"""
        self.state = NodeState.CANDIDATE
        self.current_term += 1
        self.voted_for = self.config.nodeId
        self.leader_id = None

        print(f"[Nœud {self.config.nodeId}] Démarrage de l'élection pour le terme {self.current_term}")

        req = RequestVoteRequest(
            term=self.current_term,
            candidate_id=self.config.nodeId,
            last_log_index=len(self.log),
            last_log_term=self._get_last_log_term()
        )

        votes_received = 1  # Vote pour soi-même
        majority = len(self.config.peer_ids) // 2 + 1

        tasks = []
        for peer_id in self.config.peer_ids:
            tasks.append(self._send_request_vote(peer_id, req))

        results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in results:
            if isinstance(result, RequestVoteResponse):
                if result.vote_granted:
                    votes_received += 1
                    if votes_received >= majority and self.state == NodeState.CANDIDATE:
                        self._become_leader()
                elif result.term > self.current_term:
                    self.current_term = result.term
                    self.state = NodeState.FOLLOWER
                    self.voted_for = None

    def _become_leader(self):
        """Devenir leader après avoir gagné l'élection"""
        self.state = NodeState.LEADER
        self.leader_id = self.config.nodeId
        print(f"[Nœud {self.config.nodeId}] Devient leader pour le terme {self.current_term}")

        # Initialiser l'état du leader
        for peer_id in self.config.peer_ids:
            self.next_index[peer_id] = len(self.log) + 1
            self.match_index[peer_id] = 0

        # Démarrer les battements de cœur
        asyncio.create_task(self._heartbeat_loop())

    async def _heartbeat_loop(self):
        """Envoyer des battements de cœur aux suiveurs"""
        while self.state == NodeState.LEADER:
            await self.replicate_log()
            await asyncio.sleep(self.config.heartbeat_interval / 1000)

    async def replicate_log(self):
        """Répliquer le journal aux suiveurs"""
        if self.state != NodeState.LEADER:
            return

        tasks = []
        for follower_id in self.config.peer_ids:
            next_idx = self.next_index.get(follower_id, 1)
            prev_log_index = next_idx - 1
            prev_log_term = self.log[prev_log_index - 1].term if prev_log_index > 0 else 0
            entries = self.log[next_idx - 1:]

            req = AppendEntriesRequest(
                term=self.current_term,
                leader_id=self.config.nodeId,
                prev_log_index=prev_log_index,
                prev_log_term=prev_log_term,
                entries=entries,
                leader_commit=self.commit_index
            )

            tasks.append(self._send_append_entries(follower_id, req))

        results = await asyncio.gather(*tasks, return_exceptions=True)

        for i, result in enumerate(results):
            follower_id = self.config.peer_ids[i]
            if isinstance(result, AppendEntriesResponse):
                if result.term > self.current_term:
                    self.current_term = result.term
                    self.state = NodeState.FOLLOWER
                    self.voted_for = None
                    return

                if result.success:
                    last_index = len(self.log) if self.log else 0
                    self.match_index[follower_id] = last_index
                    self.next_index[follower_id] = last_index + 1
                    await self._update_commit_index()
                else:
                    current_next = self.next_index.get(follower_id, 1)
                    self.next_index[follower_id] = max(1, current_next - 1)

    async def _update_commit_index(self):
        """Mettre à jour l'index de validation si la majorité a l'entrée"""
        if self.state != NodeState.LEADER:
            return

        N = len(self.log)
        majority = len(self.config.peer_ids) // 2 + 1

        for i in range(N, self.commit_index, -1):
            if self.log[i - 1].term != self.current_term:
                continue

            count = 1  # Le leader l'a
            for match_idx in self.match_index.values():
                if match_idx >= i:
                    count += 1

            if count >= majority:
                self.commit_index = i
                self._apply_committed_entries()
                break

    def _apply_committed_entries(self):
        """Appliquer les entrées validées à la machine à états"""
        while self.last_applied < self.commit_index:
            self.last_applied += 1
            entry = self.log[self.last_applied - 1]
            self.state_machine.apply(entry)

    async def _wait_for_commit(self, index: int):
        """Attendre qu'une entrée soit validée"""
        while self.commit_index < index:
            await asyncio.sleep(0.05)

    def _random_timeout(self) -> int:
        """Générer un délai d'élection aléatoire"""
        return random.randint(
            self.config.election_timeout_min,
            self.config.election_timeout_max
        )

    def _get_last_log_term(self) -> int:
        """Obtenir le terme de la dernière entrée de journal"""
        if not self.log:
            return 0
        return self.log[-1].term

    # ========== Couche Réseau ==========

    async def _send_request_vote(self, peer_id: str, req: RequestVoteRequest) -> RequestVoteResponse:
        """Envoyer le RPC RequestVote au pair"""
        url = f"http://{peer_id}/raft/request-vote"
        try:
            response = requests.post(url, json=req.__dict__, timeout=1)
            return RequestVoteResponse(**response.json())
        except:
            return RequestVoteResponse(term=self.current_term, vote_granted=False)

    async def _send_append_entries(self, peer_id: str, req: AppendEntriesRequest) -> AppendEntriesResponse:
        """Envoyer le RPC AppendEntries au pair"""
        url = f"http://{peer_id}/raft/append-entries"
        try:
            data = {
                'term': req.term,
                'leaderId': req.leader_id,
                'prevLogIndex': req.prev_log_index,
                'prevLogTerm': req.prev_log_term,
                'entries': [e.__dict__ for e in req.entries],
                'leaderCommit': req.leader_commit
            }
            response = requests.post(url, json=data, timeout=1)
            return AppendEntriesResponse(**response.json())
        except:
            return AppendEntriesResponse(term=self.current_term, success=False)

    # ========== Méthodes de Débogage ==========

    def get_state(self) -> dict:
        """Obtenir l'état du nœud pour le débogage"""
        return {
            'nodeId': self.config.nodeId,
            'state': self.state.value,
            'term': self.current_term,
            'leaderId': self.leader_id,
            'logLength': len(self.log),
            'commitIndex': self.commit_index,
            'stateMachine': self.state_machine.get_all()
        }
```

### server.py

```python
from flask import Flask, request, jsonify
from .raft_node import RaftNode, ClusterConfig

def create_server(node: RaftNode):
    app = Flask(__name__)

    # Points de terminaison RPC Raft
    @app.route('/raft/request-vote', methods=['POST'])
    def request_vote():
        response = node.handle_request_vote(
            RequestVoteResponse(**request.json)
        )
        return jsonify(response.__dict__)

    @app.route('/raft/append-entries', methods=['POST'])
    def append_entries():
        # Convertir la requête au format approprié
        data = request.json
        entries = [LogEntry(**e) for e in data.get('entries', [])]
        req = AppendEntriesRequest(
            term=data['term'],
            leader_id=data['leaderId'],
            prev_log_index=data['prevLogIndex'],
            prev_log_term=data['prevLogTerm'],
            entries=entries,
            leader_commit=data['leaderCommit']
        )
        response = node.handle_append_entries(req)
        return jsonify(response.__dict__)

    # Points de terminaison API Client
    @app.route('/kv/<key>', methods=['GET'])
    def get_key(key):
        command = GetCommand(key=key)
        try:
            value = asyncio.run(node.submit_command(command))
            return jsonify({'key': key, 'value': value})
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/kv', methods=['POST'])
    def set_key():
        command = SetCommand(key=request.json['key'], value=request.json['value'])
        try:
            result = asyncio.run(node.submit_command(command))
            return jsonify(result)
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/kv/<key>', methods=['DELETE'])
    def delete_key(key):
        command = DeleteCommand(key=key)
        try:
            result = asyncio.run(node.submit_command(command))
            return jsonify(result)
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    # Point de terminaison de débogage
    @app.route('/debug', methods=['GET'])
    def debug():
        return jsonify(node.get_state())

    return app
```

### app.py

```python
import os
from src.types import ClusterConfig
from src.raft_node import RaftNode
from src.server import create_server

NODE_ID = os.getenv('NODE_ID', 'node1')
PEER_IDS = os.getenv('PEER_IDS', '').split(',') if os.getenv('PEER_IDS') else []
PORT = int(os.getenv('PORT', '5000'))

config = ClusterConfig(
    node_id=NODE_ID,
    peer_ids=PEER_IDS
)

node = RaftNode(config)
node.start()

app = create_server(node)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=PORT)
```

### docker-compose.yml (Python)

```yaml
version: '3.8'

services:
  node1:
    build: .
    container_name: python-raft-node1
    environment:
      - NODE_ID=node1
      - PEER_IDS=node2:5000,node3:5000
      - PORT=5000
    ports:
      - "5001:5000"

  node2:
    build: .
    container_name: python-raft-node2
    environment:
      - NODE_ID=node2
      - PEER_IDS=node1:5000,node3:5000
      - PORT=5000
    ports:
      - "5002:5000"

  node3:
    build: .
    container_name: python-raft-node3
    environment:
      - NODE_ID=node3
      - PEER_IDS=node1:5000,node2:5000
      - PORT=5000
    ports:
      - "5003:5000"
```

### Dockerfile (Python)

```dockerfile
FROM python:3.11-alpine

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]
```

---

## Exécution du Système

### TypeScript

```bash
# Construire
npm run build

# Exécuter avec Docker Compose
docker-compose up

# Tester le cluster
curl -X POST http://localhost:3001/kv -H "Content-Type: application/json" -d '{"key":"foo","value":"bar"}'
curl http://localhost:3001/kv/foo
curl http://localhost:3002/debug  # Vérifier l'état du nœud
```

### Python

```bash
# Exécuter avec Docker Compose
docker-compose up

# Tester le cluster
curl -X POST http://localhost:5001/kv -H "Content-Type: application/json" -d '{"key":"foo","value":"bar"}'
curl http://localhost:5001/kv/foo
curl http://localhost:5002/debug  # Vérifier l'état du nœud
```

---

## Exercices

### Exercice 1 : Opérations de Base

1. Démarrer le cluster à 3 nœuds
2. Attendre l'élection du leader
3. SET key=value sur le leader
4. GET la clé de tous les nœuds
5. Vérifier que tous les nœuds retournent la même valeur

**Résultat Attendu :** Tous les nœuds retournent la valeur validée.

### Exercice 2 : Bascullement de Leader

1. Démarrer le cluster et écrire des données
2. Tuer le conteneur leader
3. Observer un nouveau leader être élu
4. Continuer à écrire des données
5. Redémarrer l'ancien leader
6. Vérifier qu'il rattrape

**Résultat Attendu :** Le système continue à fonctionner avec le nouveau leader, l'ancien leader rejoint en tant que suiveur.

### Exercice 3 : Partition Réseau

1. Démarrer un cluster à 5 nœuds
2. Isoler 2 nœuds (simuler une partition)
3. Vérifier que la majorité (3 nœuds) peut encore valider
4. Guérir la partition
5. Vérifier que les nœuds isolés rattrapent

**Résultat Attendu :** Le côté majorité continue, la minorité ne peut pas valider, la rejointe fonctionne.

### Exercice 4 : Test de Persistance

1. Écrire des données dans le cluster
2. Arrêter tous les nœuds
3. Redémarrer tous les nœuds
4. Vérifier que les données sont récupérées

**Résultat Attendu :** Toutes les données survivent au redémarrage.

---

## Pièges Courants

| Piège | Symptôme | Solution |
|---------|---------|----------|
| Lire à partir des suiveurs | Lectures stalées | Toujours lire à partir du leader ou implémenter des lectures avec bail |
| Pas de battements de cœur | Élections inutiles | S'assurer que le timer de battement de cœur fonctionne continuellement |
| Délai d'attente du client | Écritures échouées | Attendre la validation, ne pas retourner immédiatement |
| Split brain | Leaders multiples | Les délais randomisés + les règles de vote empêchent cela |

---

## Points Clés à Retenir

1. **Raft Complet** combine l'élection de leader + la réplication de journal pour le consensus
2. **La machine à états** applique les commandes validées de manière déterministe
3. **L'API client** fournit un accès transparent au système distribué
4. **Le basculement** est automatique - un nouveau leader est élu quand l'ancien échoue
5. **La sécurité** garantit assure qu'il n'y a pas d'écritures conflictuelles

---

**Félicitations !** Vous avez complété le Système de Consensus. Vous comprenez maintenant l'un des concepts les plus difficiles des systèmes distribués !

**Suite :** Matériels de Référence →

## 🧠 Quiz du Chapitre

Testez votre maîtrise de ces concepts ! Ces questions défieront votre compréhension et révéleront les lacunes dans vos connaissances.

{{#quiz ../../quizzes/consensus-consensus-system.toml}}
