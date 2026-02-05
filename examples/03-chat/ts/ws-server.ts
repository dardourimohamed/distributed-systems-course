import { WebSocketServer, WebSocket } from 'ws';

interface ChatMessage {
  type: 'message' | 'join' | 'leave';
  username: string;
  content: string;
  timestamp: number;
}

const wss = new WebSocketServer({ port: 8080 });

const clients = new Map<WebSocket, string>();

console.log('WebSocket server running on ws://localhost:8080');

wss.on('connection', (ws: WebSocket) => {
  console.log('New client connected');

  // Welcome message
  ws.send(JSON.stringify({
    type: 'message',
    username: 'System',
    content: 'Welcome! Please identify yourself.',
    timestamp: Date.now()
  } as ChatMessage));

  // Handle incoming messages
  ws.on('message', (data: Buffer) => {
    try {
      const message: ChatMessage = JSON.parse(data.toString());

      if (message.type === 'join') {
        // Register username
        clients.set(ws, message.username);
        console.log(`${message.username} joined`);

        // Broadcast to all clients
        broadcast({
          type: 'message',
          username: 'System',
          content: `${message.username} has joined the chat`,
          timestamp: Date.now()
        });
      } else if (message.type === 'message') {
        const username = clients.get(ws) || 'Anonymous';
        console.log(`${username}: ${message.content}`);

        // Broadcast the message
        broadcast({
          type: 'message',
          username,
          content: message.content,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Invalid message:', error);
    }
  });

  // Handle disconnection
  ws.on('close', () => {
    const username = clients.get(ws);
    if (username) {
      console.log(`${username} disconnected`);
      clients.delete(ws);

      broadcast({
        type: 'message',
        username: 'System',
        content: `${username} has left the chat`,
        timestamp: Date.now()
      });
    }
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

function broadcast(message: ChatMessage): void {
  const data = JSON.stringify(message);

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// Heartbeat to detect stale connections
const interval = setInterval(() => {
  wss.clients.forEach((ws: any) => {
    if ((ws as any).isAlive === false) return ws.terminate();

    (ws as any).isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(interval);
});
