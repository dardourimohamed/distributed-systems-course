# Messagerie Pub/Sub et Ordonnancement des Messages

> **Session 7, Partie 1** - 45 minutes

## Objectifs d'apprentissage

- [ ] Comprendre le modèle de messagerie publish-subscribe
- [ ] Apprendre le routage basé sur les sujets et le routage basé sur le contenu
- [ ] Implémenter le suivi de présence et les abonnements
- [ ] Comprendre les défis de l'ordonnancement des messages dans les systèmes distribués
- [ ] Implémenter des numéros de séquence pour l'ordonnancement causal

## Qu'est-ce que Pub/Sub ?

Le **modèle publish-subscribe** est un modèle de messagerie où les expéditeurs (publishers) envoient des messages à un système intermédiaire, et le système achemine les messages aux récepteurs intéressés (subscribers). Les publishers et subscribers sont **découplés** - ils ne se connaissent pas.

### Avantages clés

1. **Découplage** : Les publishers n'ont pas besoin de savoir qui s'abonne
2. **Extensibilité** : Ajouter des subscribers sans modifier les publishers
3. **Flexibilité** : Gestion dynamique des abonnements
4. **Asynchronie** : Les publishers envoient et continuent ; les subscribers traitent quand ils sont prêts

### Pub/Sub vs Messagerie directe

```mermaid
graph TB
    subgraph "Messagerie directe"
        P1[Producer] -->|Direct| C1[Consumer 1]
        P1 -->|Direct| C2[Consumer 2]
        P1 -->|Direct| C3[Consumer 3]
    end

    subgraph "Messagerie Pub/Sub"
        P2[Publisher] -->|Publish| B[Broker]
        S1[Subscriber 1] -->|Subscribe| B
        S2[Subscriber 2] -->|Subscribe| B
        S3[Subscriber 3] -->|Subscribe| B
    end
```

| Aspect | Messagerie directe | Pub/Sub |
|--------|-------------------|---------|
| Couplage | Fort (le producteur connaît les consumers) | Faible (le producteur ne connaît pas les consumers) |
| Flexibilité | Faible (les changements affectent le producteur) | Élevée (abonnements dynamiques) |
| Complexité | Simple | Modérée (nécessite un broker) |
| Cas d'usage | Point-à-point, requête-réponse | Diffusion, événements, notifications |

## Modèles Pub/Sub

### 1. Routage basé sur les sujets

Les subscribers expriment leur intérêt pour des **sujets** (channels). Les messages sont acheminés en fonction du sujet auquel ils sont publiés.

```mermaid
sequenceDiagram
    participant S1 as Subscriber 1
    participant S2 as Subscriber 2
    participant S3 as Subscriber 3
    participant B as Broker
    participant P as Publisher

    Note over S1,S3: Phase d'abonnement
    S1->>B: subscribe("sports")
    S2->>B: subscribe("sports")
    S3->>B: subscribe("news")

    Note over S1,S3: Phase de publication
    P->>B: publish("sports", "Game starts!")
    B->>S1: deliver("Game starts!")
    B->>S2: deliver("Game starts!")

    P->>B: publish("news", "Breaking story!")
    B->>S3: deliver("Breaking story!")
```

**Cas d'usage** : Salles de chat, catégories de notifications, flux d'événements

### 2. Routage basé sur le contenu

Les subscribers spécifient des **critères de filtrage**. Les messages sont acheminés en fonction de leur contenu.

```mermaid
graph LR
    P[Publisher] -->|{"type": "order", "value": >100}| B[Content Router]
    B -->|Matches filter| S1[High-Value Handler]
    B -->|Matches filter| S2[Order Logger]
    B -.->|No match| S3[Low-Value Handler]
```

**Cas d'usage** : Filtrage d'événements, règles de routage complexes, données de capteurs IoT

### 3. Suivi de présence

Dans les systèmes en temps réel, savoir **qui est en ligne** (presence) est essentiel pour :

- Afficher le statut en ligne/hors ligne
- Livrer les messages uniquement aux utilisateurs actifs
- Gérer les connexions et reconnexions
- Gérer gracieusement les déconnexions utilisateurs

```mermaid
stateDiagram-v2
    [*] --> Offline: Utilisateur créé
    Offline --> Connecting: Demande de connexion
    Connecting --> Online: Auth réussie
    Connecting --> Offline: Auth échouée
    Online --> Away: Pas d'activité
    Online --> Offline: Déconnexion
    Away --> Online: Activité détectée
    Online --> [*]: Utilisateur supprimé
```

## Ordonnancement des messages

### Le problème de l'ordonnancement

Dans les systèmes distribués, les messages peuvent arriver **dans le désordre** en raison de :

- Variations de latence réseau
- Serveurs multiples traitant des messages
- Nouvelles tentatives et retransmissions de messages
- Publishers simultanés

### Types d'ordonnancement

| Type d'ordonnancement | Description | Difficulté |
|----------------------|-------------|------------|
| **FIFO** | Les messages du même expéditeur arrivent dans l'ordre d'envoi | Facile |
| **Causal** | Les messages causalement liés sont ordonnés | Modérée |
| **Total** | Tous les messages sont ordonnés globalement | Difficile |

### Pourquoi l'ordonnancement est important

Considérons une application de chat :

```mermaid
sequenceDiagram
    participant A as Alice
    participant S as Server
    participant B as Bob

    Note over A,B: Sans ordonnancement - confusion !
    A->>S: "Let's meet at 5pm"
    A->>S: "Never mind, 6pm instead"
    S--xB: "Never mind, 6pm instead"
    S--xB: "Let's meet at 5pm"

    Note over B: Bob voit les messages dans le désordre !
```

Avec un ordonnancement approprié utilisant des **numéros de séquence** :

```mermaid
sequenceDiagram
    participant A as Alice
    participant S as Server
    participant B as Bob

    Note over A,B: Avec numéros de séquence - correct !
    A->>S: [msg#1] "Let's meet at 5pm"
    A->>S: [msg#2] "Never mind, 6pm instead"

    S--xB: [msg#1] "Let's meet at 5pm"
    S--xB: [msg#2] "Never mind, 6pm instead"

    Note over B: Bob livre dans l'ordre par numéro de séquence
```

## Implémentation : Chat Pub/Sub avec ordonnancement

Construisons un système de chat pub/sub avec :
- Routage basé sur les sujets (salles de chat)
- Suivi de présence
- Ordonnancement des messages avec numéros de séquence

### Implémentation TypeScript

**pubsub-server.ts** - Serveur Pub/Sub avec ordonnancement :

```typescript
// src: examples/03-chat/ts/pubsub-server.ts

interface Message {
  id: string;
  room: string;
  sender: string;
  content: string;
  sequence: number;
  timestamp: number;
}

interface Subscriber {
  id: string;
  userId: string;
  rooms: Set<string>;
  ws: WebSocket;
}

class PubSubServer {
  private subscribers: Map<string, Subscriber> = new Map();
  private roomSequences: Map<string, number> = new Map();
  private messageHistory: Map<string, Message[]> = new Map();
  private server: WebSocketServer;

  constructor(port: number = 8080) {
    this.server = new WebSocketServer({ port });
    this.setupHandlers();
    console.log(`Pub/Sub server running on port ${port}`);
  }

  private setupHandlers() {
    this.server.on('connection', (ws: WebSocket) => {
      const subscriberId = this.generateId();

      ws.on('message', (data: string) => {
        try {
          const msg = JSON.parse(data.toString());
          this.handleMessage(subscriberId, msg, ws);
        } catch (err) {
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(subscriberId);
      });
    });
  }

  private handleMessage(subscriberId: string, msg: any, ws: WebSocket) {
    switch (msg.type) {
      case 'subscribe':
        this.handleSubscribe(subscriberId, msg.room, msg.userId, ws);
        break;
      case 'unsubscribe':
        this.handleUnsubscribe(subscriberId, msg.room);
        break;
      case 'publish':
        this.handlePublish(msg);
        break;
      case 'get_history':
        this.handleGetHistory(msg.room, ws);
        break;
    }
  }

  private handleSubscribe(
    subscriberId: string,
    room: string,
    userId: string,
    ws: WebSocket
  ) {
    if (!this.subscribers.has(subscriberId)) {
      this.subscribers.set(subscriberId, {
        id: subscriberId,
        userId,
        rooms: new Set(),
        ws,
      });
    }

    const subscriber = this.subscribers.get(subscriberId)!;
    subscriber.rooms.add(room);

    // Initialiser l'état de la salle si nécessaire
    if (!this.roomSequences.has(room)) {
      this.roomSequences.set(room, 0);
      this.messageHistory.set(room, []);
    }

    // Envoyer une notification de présence
    this.broadcast(room, {
      type: 'presence',
      userId,
      action: 'join',
      timestamp: Date.now(),
    });

    // Envoyer le numéro de séquence actuel
    ws.send(JSON.stringify({
      type: 'subscribed',
      room,
      sequence: this.roomSequences.get(room),
    }));

    console.log(`${userId} subscribed to ${room}`);
  }

  private handleUnsubscribe(subscriberId: string, room: string) {
    const subscriber = this.subscribers.get(subscriberId);
    if (subscriber) {
      subscriber.rooms.delete(room);

      // Envoyer une notification de présence
      this.broadcast(room, {
        type: 'presence',
        userId: subscriber.userId,
        action: 'leave',
        timestamp: Date.now(),
      });
    }
  }

  private handlePublish(msg: any) {
    const { room, sender, content } = msg;
    const sequence = (this.roomSequences.get(room) || 0) + 1;
    this.roomSequences.set(room, sequence);

    const message: Message = {
      id: this.generateId(),
      room,
      sender,
      content,
      sequence,
      timestamp: Date.now(),
    };

    // Stocker dans l'historique
    const history = this.messageHistory.get(room) || [];
    history.push(message);
    this.messageHistory.set(room, history.slice(-100)); // Garder les 100 derniers

    // Diffuser à tous les subscribers
    this.broadcast(room, {
      type: 'message',
      ...message,
    });
  }

  private handleGetHistory(room: string, ws: WebSocket) {
    const history = this.messageHistory.get(room) || [];
    ws.send(JSON.stringify({
      type: 'history',
      room,
      messages: history,
    }));
  }

  private broadcast(room: string, payload: any) {
    const payloadStr = JSON.stringify(payload);

    for (const [_, subscriber] of this.subscribers) {
      if (subscriber.rooms.has(room) && subscriber.ws.readyState === WebSocket.OPEN) {
        subscriber.ws.send(payloadStr);
      }
    }
  }

  private handleDisconnect(subscriberId: string) {
    const subscriber = this.subscribers.get(subscriberId);
    if (subscriber) {
      // Notifier toutes les salles où l'utilisateur était
      for (const room of subscriber.rooms) {
        this.broadcast(room, {
          type: 'presence',
          userId: subscriber.userId,
          action: 'leave',
          timestamp: Date.now(),
        });
      }
      this.subscribers.delete(subscriberId);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}

const PORT = parseInt(process.env.PORT || '8080');
new PubSubServer(PORT);
```

**pubsub-client.ts** - Client avec tampon d'ordonnancement :

```typescript
// src: examples/03-chat/ts/pubsub-client.ts

interface ClientMessage {
  type: string;
  sequence?: number;
  [key: string]: any;
}

class PubSubClient {
  private ws: WebSocket | null = null;
  private userId: string;
  private messageBuffer: Map<string, Map<number, ClientMessage>> = new Map();
  private expectedSequence: Map<string, number> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(
    private url: string,
    userId?: string
  ) {
    this.userId = userId || `user-${Math.random().toString(36).substring(7)}`;
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.on('open', () => {
      console.log(`Connected as ${this.userId}`);
      this.reconnectAttempts = 0;
    });

    this.ws.on('message', (data: string) => {
      const msg: ClientMessage = JSON.parse(data.toString());
      this.handleMessage(msg);
    });

    this.ws.on('close', () => {
      console.log('Disconnected. Attempting to reconnect...');
      this.reconnect();
    });

    this.ws.on('error', (err) => {
      console.error('WebSocket error:', err);
    });
  }

  private handleMessage(msg: ClientMessage) {
    switch (msg.type) {
      case 'subscribed':
        this.expectedSequence.set(msg.room, (msg.sequence || 0) + 1);
        console.log(`Subscribed to ${msg.room} at sequence ${msg.sequence}`);
        break;

      case 'message':
        this.handleOrderedMessage(msg.room, msg);
        break;

      case 'presence':
        console.log(`${msg.userId} ${msg.action}ed`);
        break;

      case 'history':
        console.log(`Received ${msg.messages.length} historical messages`);
        msg.messages.forEach((m: ClientMessage) => this.displayMessage(m));
        break;
    }
  }

  private handleOrderedMessage(room: string, msg: ClientMessage) {
    const seq = msg.sequence!;

    // Initialiser le tampon si nécessaire
    if (!this.messageBuffer.has(room)) {
      this.messageBuffer.set(room, new Map());
    }
    const buffer = this.messageBuffer.get(room)!;
    const expected = this.expectedSequence.get(room) || 1;

    if (seq === expected) {
      // Message attendu - livrer immédiatement
      this.displayMessage(msg);
      this.expectedSequence.set(room, seq + 1);

      // Vérifier le tampon pour les messages suivants
      this.deliverBufferedMessages(room);
    } else if (seq > expected) {
      // Message futur - le mettre en tampon
      buffer.set(seq, msg);
      console.log(`Buffered message ${seq} (expecting ${expected})`);
    }
    // seq < expected: ancien message, ignorer
  }

  private deliverBufferedMessages(room: string) {
    const buffer = this.messageBuffer.get(room);
    if (!buffer) return;

    const expected = this.expectedSequence.get(room) || 1;

    while (buffer.has(expected)) {
      const msg = buffer.get(expected)!;
      this.displayMessage(msg);
      buffer.delete(expected);
      this.expectedSequence.set(room, expected + 1);
    }
  }

  private displayMessage(msg: ClientMessage) {
    console.log(`[${msg.sequence}] ${msg.sender}: ${msg.content}`);
  }

  subscribe(room: string) {
    this.send({ type: 'subscribe', room, userId: this.userId });
  }

  unsubscribe(room: string) {
    this.send({ type: 'unsubscribe', room });
  }

  publish(room: string, content: string) {
    this.send({
      type: 'publish',
      room,
      sender: this.userId,
      content,
    });
  }

  getHistory(room: string) {
    this.send({ type: 'get_history', room });
  }

  private send(payload: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    } else {
      console.error('WebSocket not connected');
    }
  }

  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      setTimeout(() => this.connect(), delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }
}

// Usage en CLI
const args = process.argv.slice(2);
const url = args[0] || 'ws://localhost:8080';
const client = new PubSubClient(url);

client.connect();

// Interface readline simple
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('Commands: /join <room>, /leave <room>, /history <room>, /quit');
console.log('Any other input will be sent to the current room');

let currentRoom = '';

const showPrompt = () => {
  if (currentRoom) {
    rl.question(`[${currentRoom}]> `, (input) => {
      if (input === '/quit') {
        client.ws?.close();
        rl.close();
        process.exit(0);
      } else if (input.startsWith('/join ')) {
        currentRoom = input.substring(6);
        client.subscribe(currentRoom);
      } else if (input.startsWith('/leave ')) {
        const room = input.substring(7);
        client.unsubscribe(room);
        if (room === currentRoom) currentRoom = '';
      } else if (input.startsWith('/history ')) {
        const room = input.substring(9);
        client.getHistory(room);
      } else if (input && currentRoom) {
        client.publish(currentRoom, input);
      }
      showPrompt();
    });
  } else {
    rl.question('(no room)> ', (input) => {
      if (input.startsWith('/join ')) {
        currentRoom = input.substring(6);
        client.subscribe(currentRoom);
      }
      showPrompt();
    });
  }
};

showPrompt();
```

### Implémentation Python

**pubsub_server.py** - Serveur Pub/Sub avec ordonnancement :

```python
# src: examples/03-chat/py/pubsub_server.py

import asyncio
import json
import time
from typing import Dict, Set, List
from dataclasses import dataclass, asdict
import websockets
from websockets.server import WebSocketServerProtocol

@dataclass
class Message:
    id: str
    room: str
    sender: str
    content: str
    sequence: int
    timestamp: int

class PubSubServer:
    def __init__(self, port: int = 8080):
        self.port = port
        self.subscribers: Dict[str, dict] = {}
        self.room_sequences: Dict[str, int] = {}
        self.message_history: Dict[str, List[Message]] = {}

    async def handle_connection(self, ws: WebSocketServerProtocol):
        subscriber_id = self._generate_id()

        try:
            async for message in ws:
                try:
                    data = json.loads(message)
                    await self.handle_message(subscriber_id, data, ws)
                except json.JSONDecodeError:
                    await ws.send(json.dumps({"error": "Invalid message format"}))
        finally:
            await self.handle_disconnect(subscriber_id)

    async def handle_message(self, subscriber_id: str, msg: dict, ws: WebSocketServerProtocol):
        msg_type = msg.get("type")

        if msg_type == "subscribe":
            await self.handle_subscribe(subscriber_id, msg["room"], msg["userId"], ws)
        elif msg_type == "unsubscribe":
            await self.handle_unsubscribe(subscriber_id, msg["room"])
        elif msg_type == "publish":
            await self.handle_publish(msg)
        elif msg_type == "get_history":
            await self.handle_get_history(msg["room"], ws)

    async def handle_subscribe(
        self, subscriber_id: str, room: str, user_id: str, ws: WebSocketServerProtocol
    ):
        if subscriber_id not in self.subscribers:
            self.subscribers[subscriber_id] = {
                "id": subscriber_id,
                "userId": user_id,
                "rooms": set(),
                "ws": ws,
            }

        subscriber = self.subscribers[subscriber_id]
        subscriber["rooms"].add(room)

        # Initialiser l'état de la salle
        if room not in self.room_sequences:
            self.room_sequences[room] = 0
            self.message_history[room] = []

        # Envoyer une notification de présence
        await self.broadcast(room, {
            "type": "presence",
            "userId": user_id,
            "action": "join",
            "timestamp": int(time.time() * 1000),
        })

        # Envoyer le numéro de séquence actuel
        await ws.send(json.dumps({
            "type": "subscribed",
            "room": room,
            "sequence": self.room_sequences[room],
        }))

        print(f"{user_id} subscribed to {room}")

    async def handle_unsubscribe(self, subscriber_id: str, room: str):
        subscriber = self.subscribers.get(subscriber_id)
        if subscriber:
            subscriber["rooms"].discard(room)

            await self.broadcast(room, {
                "type": "presence",
                "userId": subscriber["userId"],
                "action": "leave",
                "timestamp": int(time.time() * 1000),
            })

    async def handle_publish(self, msg: dict):
        room = msg["room"]
        sender = msg["sender"]
        content = msg["content"]

        sequence = self.room_sequences.get(room, 0) + 1
        self.room_sequences[room] = sequence

        message = Message(
            id=self._generate_id(),
            room=room,
            sender=sender,
            content=content,
            sequence=sequence,
            timestamp=int(time.time() * 1000),
        )

        # Stocker dans l'historique
        history = self.message_history[room]
        history.append(message)
        self.message_history[room] = history[-100:]  # Garder les 100 derniers

        # Diffuser
        await self.broadcast(room, {
            "type": "message",
            **asdict(message),
        })

    async def handle_get_history(self, room: str, ws: WebSocketServerProtocol):
        history = self.message_history.get(room, [])
        await ws.send(json.dumps({
            "type": "history",
            "room": room,
            "messages": [asdict(m) for m in history],
        }))

    async def broadcast(self, room: str, payload: dict):
        payload_str = json.dumps(payload)
        tasks = []

        for subscriber in self.subscribers.values():
            if room in subscriber["rooms"]:
                ws = subscriber["ws"]
                if not ws.closed:
                    tasks.append(ws.send(payload_str))

        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    async def handle_disconnect(self, subscriber_id: str):
        subscriber = self.subscribers.get(subscriber_id)
        if subscriber:
            # Notifier toutes les salles
            for room in list(subscriber["rooms"]):
                await self.broadcast(room, {
                    "type": "presence",
                    "userId": subscriber["userId"],
                    "action": "leave",
                    "timestamp": int(time.time() * 1000),
                })

            del self.subscribers[subscriber_id]

    def _generate_id(self) -> str:
        import random
        import string
        return ''.join(random.choices(string.ascii_lowercase + string.digits, k=12))

    async def start(self):
        print(f"Pub/Sub server running on port {self.port}")
        async with websockets.serve(self.handle_connection, "", self.port):
            await asyncio.Future()  # Run forever

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", "8080"))
    server = PubSubServer(port)
    asyncio.run(server.start())
```

**pubsub_client.py** - Client avec tampon d'ordonnancement :

```python
# src: examples/03-chat/py/pubsub_client.py

import asyncio
import json
import time
from typing import Dict, Optional
import websockets
from websockets.client import WebSocketClientProtocol

class PubSubClient:
    def __init__(self, url: str, user_id: Optional[str] = None):
        self.url = url
        self.user_id = user_id or f"user-{int(time.time())}"
        self.ws: Optional[WebSocketClientProtocol] = None
        self.message_buffer: Dict[str, Dict[int, dict]] = {}
        self.expected_sequence: Dict[str, int] = {}
        self.reconnect_attempts = 0
        self.max_reconnect_attempts = 5

    async def connect(self):
        try:
            self.ws = await websockets.connect(self.url)
            print(f"Connected as {self.user_id}")
            self.reconnect_attempts = 0
            asyncio.create_task(self.listen())
        except Exception as e:
            print(f"Connection failed: {e}")
            await self.reconnect()

    async def listen(self):
        if not self.ws:
            return

        try:
            async for message in self.ws:
                data = json.loads(message)
                await self.handle_message(data)
        except websockets.exceptions.ConnectionClosed:
            print("Disconnected. Attempting to reconnect...")
            await self.reconnect()

    async def handle_message(self, msg: dict):
        msg_type = msg.get("type")

        if msg_type == "subscribed":
            room = msg["room"]
            self.expected_sequence[room] = msg.get("sequence", 0) + 1
            print(f"Subscribed to {room} at sequence {msg.get('sequence', 0)}")

        elif msg_type == "message":
            await self.handle_ordered_message(msg["room"], msg)

        elif msg_type == "presence":
            print(f"{msg['userId']} {msg['action']}ed")

        elif msg_type == "history":
            print(f"Received {len(msg['messages'])} historical messages")
            for m in msg["messages"]:
                self.display_message(m)

    async def handle_ordered_message(self, room: str, msg: dict):
        seq = msg["sequence"]

        if room not in self.message_buffer:
            self.message_buffer[room] = {}

        buffer = self.message_buffer[room]
        expected = self.expected_sequence.get(room, 1)

        if seq == expected:
            # Message attendu - livrer immédiatement
            self.display_message(msg)
            self.expected_sequence[room] = seq + 1

            # Vérifier le tampon pour les messages suivants
            await self.deliver_buffered_messages(room)

        elif seq > expected:
            # Message futur - le mettre en tampon
            buffer[seq] = msg
            print(f"Buffered message {seq} (expecting {expected})")

    async def deliver_buffered_messages(self, room: str):
        buffer = self.message_buffer.get(room, {})
        expected = self.expected_sequence.get(room, 1)

        while expected in buffer:
            msg = buffer[expected]
            self.display_message(msg)
            del buffer[expected]
            self.expected_sequence[room] = expected + 1
            expected += 1

    def display_message(self, msg: dict):
        print(f"[{msg['sequence']}] {msg['sender']}: {msg['content']}")

    async def subscribe(self, room: str):
        await self.send({"type": "subscribe", "room": room, "userId": self.user_id})

    async def unsubscribe(self, room: str):
        await self.send({"type": "unsubscribe", "room": room})

    async def publish(self, room: str, content: str):
        await self.send({
            "type": "publish",
            "room": room,
            "sender": self.user_id,
            "content": content,
        })

    async def get_history(self, room: str):
        await self.send({"type": "get_history", "room": room})

    async def send(self, payload: dict):
        if self.ws and not self.ws.closed:
            await self.ws.send(json.dumps(payload))
        else:
            print("WebSocket not connected")

    async def reconnect(self):
        if self.reconnect_attempts < self.max_reconnect_attempts:
            self.reconnect_attempts += 1
            delay = min(1000 * (2 ** self.reconnect_attempts), 30000) / 1000
            await asyncio.sleep(delay)
            await self.connect()
        else:
            print("Max reconnection attempts reached")

async def main():
    import sys
    url = sys.argv[1] if len(sys.argv) > 1 else "ws://localhost:8080"
    client = PubSubClient(url)
    await client.connect()

    # CLI simple
    current_room = ""

    print('Commands: /join <room>, /leave <room>, /history <room>, /quit')

    while True:
        try:
            prompt = f"[{current_room}]> " if current_room else "(no room)> "
            line = await asyncio.get_event_loop().run_in_executor(None, input, prompt)

            if line == "/quit":
                break
            elif line.startswith("/join "):
                current_room = line[6:]
                await client.subscribe(current_room)
            elif line.startswith("/leave "):
                room = line[7:]
                await client.unsubscribe(room)
                if room == current_room:
                    current_room = ""
            elif line.startswith("/history "):
                room = line[9:]
                await client.get_history(room)
            elif line and current_room:
                await client.publish(current_room, line)

        except EOFError:
            break

    if client.ws:
        await client.ws.close()

if __name__ == "__main__":
    asyncio.run(main())
```

## Exécution des exemples

### Version TypeScript

```bash
cd distributed-systems-course/examples/03-chat/ts

# Installer les dépendances
npm install

# Démarrer le serveur
PORT=8080 npx ts-node pubsub-server.ts

# Dans un autre terminal, démarrer un client
npx ts-node pubsub-client.ts
```

### Version Python

```bash
cd distributed-systems-course/examples/03-chat/py

# Installer les dépendances
pip install -r requirements.txt

# Démarrer le serveur
PORT=8080 python pubsub_server.py

# Dans un autre terminal, démarrer un client
python pubsub_client.py
```

### Docker Compose

**docker-compose.yml** (TypeScript) :

```yaml
services:
  pubsub-server:
    build: .
    ports:
      - "8080:8080"
    environment:
      - PORT=8080
```

```bash
docker-compose up
```

## Test du système Pub/Sub

### Test 1 : Pub/Sub de base

1. Démarrer trois clients dans des terminaux séparés
2. Client 1 : `/join general`
3. Client 2 : `/join general`
4. Client 1 : `Hello everyone!`
5. Le client 2 devrait recevoir le message
6. Client 3 : `/join general`
7. Client 3 : `/history general` - devrait voir les messages précédents

### Test 2 : Salles multiples

1. Client 1 : `/join sports`
2. Client 2 : `/join news`
3. Client 1 : `Game starting!` (uniquement dans sports)
4. Client 2 : `Breaking news!` (uniquement dans news)
5. Client 3 : `/join sports` et `/join news` (reçoit les deux)

### Test 3 : Ordonnancement des messages

1. Démarrer un client et rejoindre une salle
2. Envoyer des messages rapidement : `msg1`, `msg2`, `msg3`
3. Observer les numéros de séquence : `[1]`, `[2]`, `[3]`
4. Noter que l'ordre est préservé

### Test 4 : Suivi de présence

1. Démarrer deux clients
2. Les deux rejoignent la même salle
3. Observer les notifications de présence (utilisateur rejoint/parti)
4. Déconnecter un client (Ctrl+C)
5. L'autre client reçoit la notification de départ

## Exercices

### Exercice 1 : Implémenter le cache des derniers messages

Ajouter une fonctionnalité pour stocker uniquement les **derniers N messages** par salle (déjà implémenté comme 100 dans le code).

**Tâches** :
- Rendre la taille de l'historique configurable via une variable d'environnement
- Ajouter une commande `/clear_history` pour les administrateurs
- Ajouter un TTL (time-to-live) pour les anciens messages

### Exercice 2 : Implémenter les messages privés

Étendre le système pour prendre en charge les **messages directs** entre utilisateurs.

**Exigences** :
- Les messages privés ne doivent être livrés qu'au destinataire
- Utiliser un format de sujet spécial : `@username`
- Inclure l'authentification de l'expéditeur

**Indice** : Vous devrez modifier la méthode `handlePublish` pour vérifier le préfixe `@`.

### Exercice 3 : Ajouter les accusés de réception de messages

Implémenter des **accusés de réception** pour garantir la livraison des messages.

**Exigences** :
- Les clients doivent ACK les messages reçus
- Le serveur suit les messages non accusés
- À la reconnexion, le serveur renvoie les messages non accusés

**Indice** : Ajoutez un type de message `ack` et suivez les messages en attente par subscriber.

## Pièges courants

| Piège | Symptôme | Solution |
|--------|---------|----------|
| Désynchronisation des numéros de séquence | Messages non affichés | Se réabonner pour réinitialiser la séquence |
| Fuite de mémoire de l'historique | Utilisation mémoire croissante | Implémenter des limites de taille d'historique |
| Mises à jour de présence manquantes | Statut en ligne obsolète | Ajouter des messages heartbeat/ping |
| Conditions de course | Messages perdus lors de la reconnexion | Mettre en tampon les messages pendant la déconnexion |

## Exemples réels

| Système | Implémentation Pub/Sub | Stratégie d'ordonnancement |
|--------|------------------------|---------------------------|
| **Redis Pub/Sub** | Canaux basés sur des sujets | Aucune garantie d'ordonnancement |
| **Apache Kafka** | Sujets partitionnés | Ordonnancement par partition |
| **Google Cloud Pub/Sub** | Sujets avec abonnements | Livraison exactement une fois |
| **AWS SNS** | Diffusion basée sur des sujets | Ordonnancement au mieux (best-effort) |
| **RabbitMQ** | Liaison exchange/queue | FIFO dans la file |

## Résumé

- **Pub/Sub** découple les publishers des subscribers via un broker intermédiaire
- **Le routage basé sur les sujets** est le modèle le plus simple et le plus courant
- **Le suivi de présence** permet le statut en ligne/hors ligne dans les systèmes temps réel
- **L'ordonnancement des messages** nécessite des numéros de séquence et la mise en tampon
- **L'ordonnancement causal** est réalisable avec une complexité modeste
- **L'ordonnancement total** est coûteux et souvent inutile

Suivant : [Implémentation du système de chat →](./10-chat-system.md)

## 🧠 Quiz du chapitre

Testez votre maîtrise de ces concepts ! Ces questions mettront au défi votre compréhension et révéleront les lacunes dans vos connaissances.

{{#quiz ../../quizzes/real-time-pub-sub.toml}}
