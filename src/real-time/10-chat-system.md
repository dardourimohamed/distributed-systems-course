# Chat System Implementation

> **Session 7** - Full session (90 minutes)

## Learning Objectives

- [ ] Build a complete real-time chat system with WebSockets
- [ ] Implement message ordering with sequence numbers
- [ ] Handle presence management (online/offline users)
- [ ] Add message persistence for history
- [ ] Deploy multiple chat rooms using Docker Compose

---

## System Architecture

Our chat system brings together all the concepts from Sessions 6-7:

```mermaid
graph TB
    subgraph "Clients"
        C1[User 1 Browser]
        C2[User 2 Browser]
        C3[User 3 Browser]
    end

    subgraph "Chat Server"
        WS[WebSocket Handler]
        PS[Pub/Sub Engine]
        SM[Sequence Manager]
        PM[Presence Manager]
        MS[Message Store]

        WS --> PS
        WS --> SM
        WS --> PM
        PS --> SM
        SM --> MS
    end

    C1 -->|WebSocket| WS
    C2 -->|WebSocket| WS
    C3 -->|WebSocket| WS

    subgraph "Persistence"
        DB[(Messages DB)]
    end

    MS --> DB

    style WS fill:#e3f2fd
    style PS fill:#fff3e0
    style SM fill:#f3e5f5
```

### Key Components

| Component | Responsibility |
|-----------|---------------|
| **WebSocket Handler** | Manages client connections, sends/receives messages |
| **Pub/Sub Engine** | Routes messages to rooms, handles subscriptions |
| **Sequence Manager** | Assigns sequence numbers, ensures ordering |
| **Presence Manager** | Tracks online/offline status, heartbeat |
| **Message Store** | Persists messages for history and replay |

---

## Message Flow

```mermaid
sequenceDiagram
    participant U1 as User 1
    participant WS as WebSocket Handler
    participant PS as Pub/Sub
    participant SM as Sequencer
    participant DB as Message Store
    participant U2 as User 2

    U1->>WS: CONNECT("general")
    WS->>PS: subscribe("general", U1)
    WS->>PM: mark_online(U1)
    PS->>U2: BROADCAST("User 1 joined")

    Note over U1,U2: Sending a message
    U1->>WS: SEND("general", "Hello!")
    WS->>PS: publish("general", msg)
    PS->>SM: get_sequence(msg)
    SM->>DB: save(msg, seq=1)
    SM->>PS: return seq=1
    PS->>U1: BROADCAST(msg, seq=1)
    PS->>U2: BROADCAST(msg, seq=1)

    Note over U1,U2: User 2 reconnects
    U2->>WS: CONNECT("general", last_seq=0)
    WS->>DB: get_messages(since=0)
    DB->>U2: REPLAY([msg1, msg2, ...])
```

---

## TypeScript Implementation

### Project Structure

```
chat-system/
├── package.json
├── tsconfig.json
├── src/
│   ├── types.ts          # Type definitions
│   ├── pub-sub.ts        # Pub/Sub engine
│   ├── sequencer.ts      # Sequence number manager
│   ├── presence.ts       # Presence management
│   ├── store.ts          # Message persistence
│   ├── server.ts         # WebSocket server
│   └── index.ts          # Entry point
├── public/
│   └── client.html       # Demo client
├── Dockerfile
└── docker-compose.yml
```

### 1. Type Definitions

```typescript
// src/types.ts
export interface Message {
    id: string;
    room: string;
    user: string;
    content: string;
    sequence: number;
    timestamp: number;
}

export interface Client {
    id: string;
    user: string;
    rooms: Set<string>;
    ws: WebSocket;
    lastSeen: number;
}

export interface Presence {
    user: string;
    status: 'online' | 'offline' | 'away';
    lastSeen: number;
}

export type MessageHandler = (client: Client, message: Message) => void;
```

### 2. Pub/Sub Engine

```typescript
// src/pub-sub.ts
import { Message, Client, MessageHandler } from './types';

export class PubSub {
    private subscriptions: Map<string, Set<Client>> = new Map();
    private handlers: Map<string, MessageHandler[]> = new Map();

    subscribe(room: string, client: Client): void {
        if (!this.subscriptions.has(room)) {
            this.subscriptions.set(room, new Set());
        }
        this.subscriptions.get(room)!.add(client);
        client.rooms.add(room);
    }

    unsubscribe(room: string, client: Client): void {
        const subs = this.subscriptions.get(room);
        if (subs) {
            subs.delete(client);
            if (subs.size === 0) {
                this.subscriptions.delete(room);
            }
        }
        client.rooms.delete(room);
    }

    publish(room: string, message: Message): void {
        const subs = this.subscriptions.get(room);
        if (subs) {
            for (const client of subs) {
                this.sendToClient(client, message);
            }
        }
        this.emit('message', message);
    }

    on(event: string, handler: MessageHandler): void {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, []);
        }
        this.handlers.get(event)!.push(handler);
    }

    private emit(event: string, message: Message): void {
        const handlers = this.handlers.get(event) || [];
        handlers.forEach(h => h(null!, message));
    }

    private sendToClient(client: Client, message: Message): void {
        if (client.ws.readyState === client.ws.OPEN) {
            client.ws.send(JSON.stringify({
                type: 'message',
                data: message
            }));
        }
    }

    getSubscribers(room: string): Client[] {
        return Array.from(this.subscriptions.get(room) || []);
    }

    getRooms(): string[] {
        return Array.from(this.subscriptions.keys());
    }
}
```

### 3. Sequence Manager

```typescript
// src/sequencer.ts
import { Message } from './types';

export class Sequencer {
    private sequences: Map<string, number> = new Map();

    getNext(room: string): number {
        const current = this.sequences.get(room) || 0;
        const next = current + 1;
        this.sequences.set(room, next);
        return next;
    }

    setCurrent(room: string, sequence: number): void {
        this.sequences.set(room, sequence);
    }

    getCurrent(room: string): number {
        return this.sequences.get(room) || 0;
    }

    sequenceMessage(message: Message): Message {
        const seq = this.getNext(message.room);
        return { ...message, sequence: seq };
    }
}
```

### 4. Presence Manager

```typescript
// src/presence.ts
import { Client, Presence } from './types';

const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const OFFLINE_TIMEOUT = 60000; // 60 seconds

export class PresenceManager {
    private users: Map<string, Presence> = new Map();
    private clients: Map<string, Client> = new Map();
    private intervals: Map<string, NodeJS.Timeout> = new Map();

    register(client: Client): void {
        this.clients.set(client.id, client);
        this.updatePresence(client.user, 'online');
        this.startHeartbeat(client);
    }

    unregister(client: Client): void {
        this.stopHeartbeat(client);
        this.clients.delete(client.id);
        this.updatePresence(client.user, 'offline');
    }

    updatePresence(user: string, status: 'online' | 'offline' | 'away'): void {
        this.users.set(user, {
            user,
            status,
            lastSeen: Date.now()
        });
    }

    getPresence(user: string): Presence | undefined {
        return this.users.get(user);
    }

    getOnlineUsers(): string[] {
        const now = Date.now();
        return Array.from(this.users.values())
            .filter(p => p.status === 'online' && (now - p.lastSeen) < OFFLINE_TIMEOUT)
            .map(p => p.user);
    }

    getPresenceInRoom(room: string): Presence[] {
        const now = Date.now();
        const usersInRoom = new Set<string>();

        for (const client of this.clients.values()) {
            if (client.rooms.has(room)) {
                usersInRoom.add(client.user);
            }
        }

        return Array.from(usersInRoom)
            .map(user => this.users.get(user)!)
            .filter(p => p && (now - p.lastSeen) < OFFLINE_TIMEOUT);
    }

    private startHeartbeat(client: Client): void {
        const interval = setInterval(() => {
            if (client.ws.readyState === client.ws.OPEN) {
                client.ws.send(JSON.stringify({ type: 'heartbeat' }));
                this.updatePresence(client.user, 'online');
            }
        }, HEARTBEAT_INTERVAL);

        this.intervals.set(client.id, interval);
    }

    private stopHeartbeat(client: Client): void {
        const interval = this.intervals.get(client.id);
        if (interval) {
            clearInterval(interval);
            this.intervals.delete(client.id);
        }
    }

    cleanup(): void {
        for (const interval of this.intervals.values()) {
            clearInterval(interval);
        }
        this.intervals.clear();
    }
}
```

### 5. Message Store

```typescript
// src/store.ts
import { Message } from './types';
import fs from 'fs/promises';
import path from 'path';

export class MessageStore {
    private basePath: string;

    constructor(basePath: string = './data/messages') {
        this.basePath = basePath;
    }

    async save(message: Message): Promise<void> {
        const roomPath = path.join(this.basePath, message.room);
        await fs.mkdir(roomPath, { recursive: true });

        const filename = path.join(roomPath, `${message.sequence}.json`);
        await fs.writeFile(filename, JSON.stringify(message, null, 2));
    }

    async getMessages(room: string, since: number = 0, limit: number = 100): Promise<Message[]> {
        const roomPath = path.join(this.basePath, room);
        const messages: Message[] = [];

        try {
            const files = await fs.readdir(roomPath);
            const jsonFiles = files
                .filter(f => f.endsWith('.json'))
                .map(f => parseInt(f.replace('.json', '')))
                .filter(seq => seq > since)
                .sort((a, b) => a - b)
                .slice(0, limit);

            for (const seq of jsonFiles) {
                const content = await fs.readFile(path.join(roomPath, `${seq}.json`), 'utf-8');
                messages.push(JSON.parse(content));
            }
        } catch (err) {
            // Room doesn't exist yet
        }

        return messages;
    }

    async getLastSequence(room: string): Promise<number> {
        const roomPath = path.join(this.basePath, room);
        try {
            const files = await fs.readdir(roomPath);
            const sequences = files
                .filter(f => f.endsWith('.json'))
                .map(f => parseInt(f.replace('.json', '')));

            return sequences.length > 0 ? Math.max(...sequences) : 0;
        } catch {
            return 0;
        }
    }
}
```

### 6. WebSocket Server

```typescript
// src/server.ts
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
import { PubSub } from './pub-sub';
import { Sequencer } from './sequencer';
import { PresenceManager } from './presence';
import { MessageStore } from './store';
import { Client, Message } from './types';

const PORT = process.env.PORT || 8080;

export class ChatServer {
    private wss: WebSocketServer;
    private pubSub: PubSub;
    private sequencer: Sequencer;
    private presence: PresenceManager;
    private store: MessageStore;

    constructor() {
        const server = createServer();
        this.wss = new WebSocketServer({ server });
        this.pubSub = new PubSub();
        this.sequencer = new Sequencer();
        this.presence = new PresenceManager();
        this.store = new MessageStore();

        this.setupHandlers();
    }

    private setupHandlers(): void {
        this.wss.on('connection', (ws: WebSocket) => {
            const clientId = uuidv4();
            const client: Client = {
                id: clientId,
                user: `user_${clientId.slice(0, 8)}`,
                rooms: new Set(),
                ws,
                lastSeen: Date.now()
            };

            console.log(`Client connected: ${client.id}`);

            ws.on('message', async (data: string) => {
                try {
                    const msg = JSON.parse(data);
                    await this.handleMessage(client, msg);
                } catch (err) {
                    console.error('Error handling message:', err);
                }
            });

            ws.on('close', () => {
                console.log(`Client disconnected: ${client.id}`);
                for (const room of client.rooms) {
                    this.pubSub.publish(room, {
                        id: uuidv4(),
                        room,
                        user: 'system',
                        content: `${client.user} left the room`,
                        sequence: this.sequencer.getCurrent(room),
                        timestamp: Date.now()
                    });
                    this.pubSub.unsubscribe(room, client);
                }
                this.presence.unregister(client);
            });

            // Send welcome message
            this.sendToClient(client, {
                type: 'connected',
                data: { clientId: client.id, user: client.user }
            });

            this.presence.register(client);
        });
    }

    private async handleMessage(client: Client, msg: any): Promise<void> {
        switch (msg.type) {
            case 'join':
                await this.handleJoin(client, msg.room);
                break;
            case 'leave':
                this.handleLeave(client, msg.room);
                break;
            case 'message':
                await this.handleChatMessage(client, msg.data);
                break;
            case 'presence':
                this.handlePresenceRequest(client, msg.room);
                break;
            case 'history':
                await this.handleHistoryRequest(client, msg.room, msg.since);
                break;
            default:
                console.log('Unknown message type:', msg.type);
        }
    }

    private async handleJoin(client: Client, room: string): Promise<void> {
        console.log(`${client.user} joining room: ${room}`);

        // Subscribe to room
        this.pubSub.subscribe(room, client);

        // Send current presence
        const presence = this.presence.getPresenceInRoom(room);
        this.sendToClient(client, {
            type: 'presence',
            data: { room, users: presence }
        });

        // Announce join
        this.pubSub.publish(room, {
            id: uuidv4(),
            room,
            user: 'system',
            content: `${client.user} joined the room`,
            sequence: this.sequencer.getCurrent(room),
            timestamp: Date.now()
        });

        // Send recent messages
        const history = await this.store.getMessages(room, 0, 50);
        if (history.length > 0) {
            this.sendToClient(client, {
                type: 'history',
                data: { room, messages: history }
            });
        }
    }

    private handleLeave(client: Client, room: string): void {
        console.log(`${client.user} leaving room: ${room}`);
        this.pubSub.unsubscribe(room, client);

        this.pubSub.publish(room, {
            id: uuidv4(),
            room,
            user: 'system',
            content: `${client.user} left the room`,
            sequence: this.sequencer.getCurrent(room),
            timestamp: Date.now()
        });
    }

    private async handleChatMessage(client: Client, data: any): Promise<void> {
        const { room, content } = data;

        if (!client.rooms.has(room)) {
            this.sendError(client, 'Not subscribed to room');
            return;
        }

        const message: Message = {
            id: uuidv4(),
            room,
            user: client.user,
            content,
            sequence: 0, // Will be assigned
            timestamp: Date.now()
        };

        // Assign sequence number
        const sequenced = this.sequencer.sequenceMessage(message);

        // Save to store
        await this.store.save(sequenced);

        // Publish to all subscribers
        this.pubSub.publish(room, sequenced);

        console.log(`[${room}] ${client.user}: ${content} (seq: ${sequenced.sequence})`);
    }

    private handlePresenceRequest(client: Client, room: string): void {
        const presence = this.presence.getPresenceInRoom(room);
        this.sendToClient(client, {
            type: 'presence',
            data: { room, users: presence }
        });
    }

    private async handleHistoryRequest(client: Client, room: string, since: number = 0): Promise<void> {
        const messages = await this.store.getMessages(room, since);
        this.sendToClient(client, {
            type: 'history',
            data: { room, messages }
        });
    }

    private sendToClient(client: Client, data: any): void {
        if (client.ws.readyState === client.ws.OPEN) {
            client.ws.send(JSON.stringify(data));
        }
    }

    private sendError(client: Client, message: string): void {
        this.sendToClient(client, {
            type: 'error',
            data: { message }
        });
    }

    listen(): void {
        const server = this.wss.server!;
        server.listen(PORT, () => {
            console.log(`Chat server listening on port ${PORT}`);
        });
    }
}
```

### 7. Entry Point

```typescript
// src/index.ts
import { ChatServer } from './server';

const server = new ChatServer();
server.listen();
```

### 8. Package.json

```json
{
  "name": "chat-system",
  "version": "1.0.0",
  "description": "Real-time chat system with WebSockets",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts"
  },
  "dependencies": {
    "ws": "^8.18.0",
    "uuid": "^11.0.3"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "@types/ws": "^8.5.13",
    "@types/uuid": "^10.0.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.7.2"
  }
}
```

### 9. Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 8080

CMD ["npm", "start"]
```

### 10. Docker Compose

```yaml
version: '3.8'

services:
  chat:
    build: .
    ports:
      - "8080:8080"
    volumes:
      - ./data:/app/data
    environment:
      - PORT=8080
    restart: unless-stopped
```

---

## Python Implementation

### Project Structure

```
chat-system/
├── requirements.txt
├── src/
│   ├── __init__.py
│   ├── types.py
│   ├── pub_sub.py
│   ├── sequencer.py
│   ├── presence.py
│   ├── store.py
│   ├── server.py
│   └── main.py
├── public/
│   └── client.html
├── Dockerfile
└── docker-compose.yml
```

### 1. Type Definitions

```python
# src/types.py
from dataclasses import dataclass, field
from typing import Set
import websockets.server
import datetime

@dataclass
class Message:
    id: str
    room: str
    user: str
    content: str
    sequence: int
    timestamp: float

@dataclass
class Client:
    id: str
    user: str
    rooms: Set[str] = field(default_factory=set)
    websocket: websockets.server.WebSocketServerProtocol = None
    last_seen: float = field(default_factory=lambda: datetime.datetime.now().timestamp())

@dataclass
class Presence:
    user: str
    status: str  # 'online', 'offline', 'away'
    last_seen: float
```

### 2. Pub/Sub Engine

```python
# src/pub_sub.py
from typing import Dict, Set, List, Callable, Any
from .types import Message, Client

class PubSub:
    def __init__(self):
        self.subscriptions: Dict[str, Set[Client]] = {}
        self.handlers: Dict[str, List[Callable]] = {}

    def subscribe(self, room: str, client: Client) -> None:
        if room not in self.subscriptions:
            self.subscriptions[room] = set()
        self.subscriptions[room].add(client)
        client.rooms.add(room)

    def unsubscribe(self, room: str, client: Client) -> None:
        if room in self.subscriptions:
            self.subscriptions[room].discard(client)
            if not self.subscriptions[room]:
                del self.subscriptions[room]
        client.rooms.discard(room)

    async def publish(self, room: str, message: Message) -> None:
        if room in self.subscriptions:
            for client in self.subscriptions[room]:
                await self._send_to_client(client, message)
        await self._emit('message', message)

    async def _send_to_client(self, client: Client, message: Message) -> None:
        if client.websocket and not client.websocket.closed:
            import json
            await client.websocket.send(json.dumps({
                'type': 'message',
                'data': message.__dict__
            }))

    async def _emit(self, event: str, message: Message) -> None:
        handlers = self.handlers.get(event, [])
        for handler in handlers:
            await handler(None, message)

    def get_subscribers(self, room: str) -> List[Client]:
        return list(self.subscriptions.get(room, set()))

    def get_rooms(self) -> List[str]:
        return list(self.subscriptions.keys())
```

### 3. Sequence Manager

```python
# src/sequencer.py
from typing import Dict
from .types import Message

class Sequencer:
    def __init__(self):
        self.sequences: Dict[str, int] = {}

    def get_next(self, room: str) -> int:
        current = self.sequences.get(room, 0)
        next_seq = current + 1
        self.sequences[room] = next_seq
        return next_seq

    def set_current(self, room: str, sequence: int) -> None:
        self.sequences[room] = sequence

    def get_current(self, room: str) -> int:
        return self.sequences.get(room, 0)

    def sequence_message(self, message: Message) -> Message:
        seq = self.get_next(message.room)
        message.sequence = seq
        return message
```

### 4. Presence Manager

```python
# src/presence.py
import asyncio
import datetime
from typing import Dict, List, Set
from .types import Client, Presence

HEARTBEAT_INTERVAL = 30  # seconds
OFFLINE_TIMEOUT = 60  # seconds

class PresenceManager:
    def __init__(self):
        self.users: Dict[str, Presence] = {}
        self.clients: Dict[str, Client] = {}
        self.tasks: Dict[str, asyncio.Task] = {}

    def register(self, client: Client) -> None:
        self.clients[client.id] = client
        self.update_presence(client.user, 'online')
        self.tasks[client.id] = asyncio.create_task(self._heartbeat(client))

    def unregister(self, client: Client) -> None:
        if client.id in self.tasks:
            self.tasks[client.id].cancel()
            del self.tasks[client.id]
        if client.id in self.clients:
            del self.clients[client.id]
        self.update_presence(client.user, 'offline')

    def update_presence(self, user: str, status: str) -> None:
        self.users[user] = Presence(
            user=user,
            status=status,
            last_seen=datetime.datetime.now().timestamp()
        )

    def get_presence(self, user: str) -> Presence | None:
        return self.users.get(user)

    def get_online_users(self) -> List[str]:
        now = datetime.datetime.now().timestamp()
        return [
            p.user for p in self.users.values()
            if p.status == 'online' and (now - p.last_seen) < OFFLINE_TIMEOUT
        ]

    def get_presence_in_room(self, room: str) -> List[Presence]:
        now = datetime.datetime.now().timestamp()
        users_in_room = set()

        for client in self.clients.values():
            if room in client.rooms:
                users_in_room.add(client.user)

        return [
            self.users.get(user)
            for user in users_in_room
            if user in self.users and (now - self.users[user].last_seen) < OFFLINE_TIMEOUT
        ]

    async def _heartbeat(self, client: Client) -> None:
        import json
        while True:
            try:
                if client.websocket and not client.websocket.closed:
                    await client.websocket.send(json.dumps({'type': 'heartbeat'}))
                    self.update_presence(client.user, 'online')
            except asyncio.CancelledError:
                break
            except Exception:
                pass
            await asyncio.sleep(HEARTBEAT_INTERVAL)

    def cleanup(self) -> None:
        for task in self.tasks.values():
            task.cancel()
        self.tasks.clear()
```

### 5. Message Store

```python
# src/store.py
import os
import json
import asyncio
from pathlib import Path
from typing import List
from .types import Message

class MessageStore:
    def __init__(self, base_path: str = './data/messages'):
        self.base_path = Path(base_path)

    async def save(self, message: Message) -> None:
        room_path = self.base_path / message.room
        room_path.mkdir(parents=True, exist_ok=True)

        filename = room_path / f'{message.sequence}.json'
        with open(filename, 'w') as f:
            json.dump(message.__dict__, f, indent=2)

    async def get_messages(self, room: str, since: int = 0, limit: int = 100) -> List[Message]:
        room_path = self.base_path / room
        messages = []

        if not room_path.exists():
            return messages

        try:
            files = [f for f in os.listdir(room_path) if f.endswith('.json')]
            sequences = sorted([
                int(f.replace('.json', ''))
                for f in files
                if int(f.replace('.json', '')) > since
            ])[:limit]

            for seq in sequences:
                with open(room_path / f'{seq}.json', 'r') as f:
                    data = json.load(f)
                    messages.append(Message(**data))
        except FileNotFoundError:
            pass

        return messages

    async def get_last_sequence(self, room: str) -> int:
        room_path = self.base_path / room
        if not room_path.exists():
            return 0

        try:
            files = [f for f in os.listdir(room_path) if f.endswith('.json')]
            sequences = [int(f.replace('.json', '')) for f in files]
            return max(sequences) if sequences else 0
        except FileNotFoundError:
            return 0
```

### 6. WebSocket Server

```python
# src/server.py
import websockets
import json
import uuid
import asyncio
from typing import Any
from .pub_sub import PubSub
from .sequencer import Sequencer
from .presence import PresenceManager
from .store import MessageStore
from .types import Client, Message

PORT = int(os.getenv('PORT', 8080))

class ChatServer:
    def __init__(self):
        self.pub_sub = PubSub()
        self.sequencer = Sequencer()
        self.presence = PresenceManager()
        self.store = MessageStore()

    async def handle_client(self, websocket, path):
        client_id = str(uuid.uuid4())
        client = Client(
            id=client_id,
            user=f"user_{client_id[:8]}",
            websocket=websocket,
            rooms=set()
        )

        print(f"Client connected: {client.id}")

        await self._send_to_client(client, {
            'type': 'connected',
            'data': {'clientId': client.id, 'user': client.user}
        })

        self.presence.register(client)

        try:
            async for message in websocket:
                msg = json.loads(message)
                await self.handle_message(client, msg)
        except websockets.exceptions.ConnectionClosed:
            print(f"Client disconnected: {client.id}")
        finally:
            for room in list(client.rooms):
                await self.pub_sub.publish(room, Message(
                    id=str(uuid.uuid4()),
                    room=room,
                    user='system',
                    content=f"{client.user} left the room",
                    sequence=self.sequencer.get_current(room),
                    timestamp=asyncio.get_event_loop().time()
                ))
                self.pub_sub.unsubscribe(room, client)
            self.presence.unregister(client)

    async def handle_message(self, client: Client, msg: Any) -> None:
        handlers = {
            'join': self.handle_join,
            'leave': self.handle_leave,
            'message': self.handle_chat_message,
            'presence': self.handle_presence_request,
            'history': self.handle_history_request
        }

        handler = handlers.get(msg.get('type'))
        if handler:
            await handler(client, msg)
        else:
            print(f"Unknown message type: {msg.get('type')}")

    async def handle_join(self, client: Client, msg: Any) -> None:
        room = msg.get('room')
        print(f"{client.user} joining room: {room}")

        self.pub_sub.subscribe(room, client)

        presence = self.presence.get_presence_in_room(room)
        await self._send_to_client(client, {
            'type': 'presence',
            'data': {'room': room, 'users': [p.__dict__ for p in presence]}
        })

        await self.pub_sub.publish(room, Message(
            id=str(uuid.uuid4()),
            room=room,
            user='system',
            content=f"{client.user} joined the room",
            sequence=self.sequencer.get_current(room),
            timestamp=asyncio.get_event_loop().time()
        ))

        history = await self.store.get_messages(room, 0, 50)
        if history:
            await self._send_to_client(client, {
                'type': 'history',
                'data': {'room': room, 'messages': [m.__dict__ for m in history]}
            })

    def handle_leave(self, client: Client, msg: Any) -> None:
        room = msg.get('room')
        print(f"{client.user} leaving room: {room}")
        self.pub_sub.unsubscribe(room, client)

    async def handle_chat_message(self, client: Client, msg: Any) -> None:
        data = msg.get('data', {})
        room = data.get('room')

        if room not in client.rooms:
            await self._send_error(client, 'Not subscribed to room')
            return

        message = Message(
            id=str(uuid.uuid4()),
            room=room,
            user=client.user,
            content=data.get('content', ''),
            sequence=0,
            timestamp=asyncio.get_event_loop().time()
        )

        sequenced = self.sequencer.sequence_message(message)
        await self.store.save(sequenced)
        await self.pub_sub.publish(room, sequenced)

        print(f"[{room}] {client.user}: {sequenced.content} (seq: {sequenced.sequence})")

    async def handle_presence_request(self, client: Client, msg: Any) -> None:
        room = msg.get('room')
        presence = self.presence.get_presence_in_room(room)
        await self._send_to_client(client, {
            'type': 'presence',
            'data': {'room': room, 'users': [p.__dict__ for p in presence]}
        })

    async def handle_history_request(self, client: Client, msg: Any) -> None:
        room = msg.get('room')
        since = msg.get('since', 0)
        messages = await self.store.get_messages(room, since)
        await self._send_to_client(client, {
            'type': 'history',
            'data': {'room': room, 'messages': [m.__dict__ for m in messages]}
        })

    async def _send_to_client(self, client: Client, data: Any) -> None:
        if client.websocket and not client.websocket.closed:
            await client.websocket.send(json.dumps(data))

    async def _send_error(self, client: Client, message: str) -> None:
        await self._send_to_client(client, {
            'type': 'error',
            'data': {'message': message}
        })

    async def start(self):
        print(f"Chat server listening on port {PORT}")
        async with websockets.serve(self.handle_client, "", PORT):
            await asyncio.Future()  # Run forever
```

### 7. Entry Point

```python
# src/main.py
import asyncio
import os
from server import ChatServer

async def main():
    server = ChatServer()
    await server.start()

if __name__ == '__main__':
    asyncio.run(main())
```

### 8. Requirements

```txt
websockets==13.1
aiofiles==24.1.0
```

### 9. Dockerfile

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8080

CMD ["python", "src/main.py"]
```

### 10. Docker Compose

```yaml
version: '3.8'

services:
  chat:
    build: .
    ports:
      - "8080:8080"
    volumes:
      - ./data:/app/data
    environment:
      - PORT=8080
    restart: unless-stopped
```

---

## Running the Chat System

### TypeScript

```bash
# Install dependencies
npm install

# Build
npm run build

# Start server
npm start

# With Docker Compose
docker-compose up
```

### Python

```bash
# Install dependencies
pip install -r requirements.txt

# Start server
python src/main.py

# With Docker Compose
docker-compose up
```

---

## Exercises

### Exercise 1: Basic Chat Operations
1. Start the chat server
2. Connect two WebSocket clients
3. Join the same room
4. Send messages and verify both clients receive them
5. Leave the room and verify the broadcast

### Exercise 2: Message Ordering
1. Send multiple messages rapidly from different clients
2. Verify all messages have unique, sequential sequence numbers
3. Disconnect and reconnect a client
4. Request message history and verify ordering is preserved

### Exercise 3: Presence Management
1. Connect multiple clients to different rooms
2. Join a room and verify presence broadcasts
3. Simulate a network failure (kill a client without proper leave)
4. Verify offline detection kicks in after timeout

### Exercise 4: Message Persistence
1. Send messages to a room
2. Stop the server
3. Verify messages are saved to disk
4. Restart the server
5. Connect a new client and verify it receives message history

---

## Common Pitfalls

| Issue | Cause | Fix |
|-------|-------|-----|
| Messages not ordered | Missing sequence numbers | Always sequence before publishing |
| Old messages not received | Not requesting history on join | Implement replay on connect |
| Presence shows offline | Heartbeat not sent | Ensure heartbeat loop is running |
| Duplicate messages | Re-publishing saved messages | Only publish new messages, not history |

---

## Key Takeaways

- **Pub/Sub** enables scalable multi-room communication
- **Sequence numbers** guarantee message ordering across all clients
- **Presence management** requires both active heartbeats and passive timeout detection
- **Message persistence** allows clients to reconnect and receive history
- **Docker Compose** simplifies deployment and testing of the complete system

## 🧠 Chapter Quiz

Test your mastery of these concepts! These questions will challenge your understanding and reveal any gaps in your knowledge.

{{#quiz ../../quizzes/real-time-chat-system.toml}}
