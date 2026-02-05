import asyncio
import json
import sys
from datetime import datetime
import websockets
from websockets.client import WebSocketClientProtocol


class ChatClient:
    def __init__(self, url: str, username: str):
        self.url = url
        self.username = username
        self.websocket: WebSocketClientProtocol | None = None
        self.reconnect_attempts = 0
        self.max_reconnect_attempts = 5

    async def connect(self) -> None:
        """Connect to the WebSocket server."""
        backoff = 1

        while self.reconnect_attempts < self.max_reconnect_attempts:
            try:
                async with websockets.connect(self.url) as ws:
                    self.websocket = ws
                    self.reconnect_attempts = 0
                    print(f"Connected to {self.url}")

                    # Identify ourselves
                    await self.send({
                        "type": "join",
                        "username": self.username,
                        "content": "",
                        "timestamp": datetime.now().timestamp()
                    })

                    # Start receiving messages
                    receive_task = asyncio.create_task(self.receive_messages())

                    # Wait for connection to close
                    await ws.wait_closed()

                    # Cancel receive task
                    receive_task.cancel()
                    try:
                        await receive_task
                    except asyncio.CancelledError:
                        pass

                    print("Disconnected from server")

            except (ConnectionRefusedError, OSError) as e:
                self.reconnect_attempts += 1
                print(f"Connection failed: {e}")
                print(f"Reconnecting in {backoff}s... (attempt {self.reconnect_attempts})")

                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, 30)

        print("Max reconnection attempts reached. Giving up.")

    async def receive_messages(self) -> None:
        """Receive and display messages from the server."""
        if not self.websocket:
            return

        try:
            async for message in self.websocket:
                data = json.loads(message)
                self.display_message(data)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            print(f"Error receiving message: {e}")

    async def send(self, message: dict) -> None:
        """Send a message to the server."""
        if self.websocket and not self.websocket.closed:
            await self.websocket.send(json.dumps(message))
        else:
            print("Cannot send message: connection not open")

    def display_message(self, message: dict) -> None:
        """Display a received message."""
        timestamp = datetime.fromtimestamp(message["timestamp"]).strftime("%H:%M:%S")
        print(f"[{timestamp}] {message['username']}: {message['content']}")


async def stdin_reader(client: 'ChatClient'):
    """Read from stdin and send messages."""
    loop = asyncio.get_event_loop()

    while True:
        line = await loop.run_in_executor(None, sys.stdin.readline)
        text = line.strip()

        if text:
            await client.send({
                "type": "message",
                "username": client.username,
                "content": text,
                "timestamp": datetime.now().timestamp()
            })


async def main():
    """Run the chat client."""
    username = sys.argv[1] if len(sys.argv) > 1 else f"User{int(asyncio.get_event_loop().time() % 1000)}"
    client = ChatClient("ws://localhost:8080", username)

    print(f"You are logged in as: {username}")
    print("Type a message and press Enter to send. Press Ctrl+C to exit.")

    # Run connection and stdin reader concurrently
    connect_task = asyncio.create_task(client.connect())

    # Give connection time to establish
    await asyncio.sleep(0.5)

    stdin_task = asyncio.create_task(stdin_reader(client))

    try:
        await asyncio.gather(connect_task, stdin_task)
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        connect_task.cancel()
        stdin_task.cancel()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
