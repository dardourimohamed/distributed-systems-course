import { WebSocket } from 'ws';

interface ChatMessage {
  type: 'message' | 'join' | 'leave';
  username: string;
  content: string;
  timestamp: number;
}

class ChatClient {
  private ws: WebSocket;
  private username: string;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;

  constructor(url: string, username: string) {
    this.username = username;
    this.ws = this.connect(url);
  }

  private connect(url: string): WebSocket {
    const ws = new WebSocket(url);

    ws.on('open', () => {
      console.log('Connected to chat server');
      this.reconnectAttempts = 0;

      // Identify ourselves
      this.send({
        type: 'join',
        username: this.username,
        content: '',
        timestamp: Date.now()
      });
    });

    ws.on('message', (data: Buffer) => {
      const message: ChatMessage = JSON.parse(data.toString());
      this.displayMessage(message);
    });

    ws.on('close', () => {
      console.log('Disconnected from server');

      // Attempt reconnection
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

        console.log(`Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts})`);

        setTimeout(() => {
          this.ws = this.connect(url);
        }, delay);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error.message);
    });

    // Respond to pings
    ws.on('ping', () => {
      ws.pong();
    });

    return ws;
  }

  public send(message: ChatMessage): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('Cannot send message: connection not open');
    }
  }

  public sendMessage(content: string): void {
    this.send({
      type: 'message',
      username: this.username,
      content,
      timestamp: Date.now()
    });
  }

  private displayMessage(message: ChatMessage): void {
    const time = new Date(message.timestamp).toLocaleTimeString();
    console.log(`[${time}] ${message.username}: ${message.content}`);
  }

  public close(): void {
    this.ws.close();
  }
}

// CLI interface
const username = process.argv[2] || `User${Math.floor(Math.random() * 1000)}`;
const client = new ChatClient('ws://localhost:8080', username);

console.log(`You are logged in as: ${username}`);
console.log('Type a message and press Enter to send. Press Ctrl+C to exit.');

// Read from stdin
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk: Buffer) => {
  const text = chunk.toString().trim();
  if (text) {
    client.sendMessage(text);
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  client.close();
  process.exit(0);
});
