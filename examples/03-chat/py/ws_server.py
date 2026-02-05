import asyncio
import json
import logging
from datetime import datetime
from typing import Set
import websockets
from websockets.server import WebSocketServerProtocol

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Track connected clients
clients: Set[WebSocketServerProtocol] = set()
usernames: dict[WebSocketServerProtocol, str] = {}


async def broadcast(message: dict) -> None:
    """Send a message to all connected clients."""
    if clients:
        await asyncio.gather(
            *[client.send(json.dumps(message)) for client in clients if client.open],
            return_exceptions=True
        )


async def handle_client(websocket: WebSocketServerProtocol) -> None:
    """Handle a client connection."""
    clients.add(websocket)
    logger.info(f"New client connected. Total clients: {len(clients)}")

    try:
        # Send welcome message
        welcome_msg = {
            "type": "message",
            "username": "System",
            "content": "Welcome! Please identify yourself.",
            "timestamp": datetime.now().timestamp()
        }
        await websocket.send(json.dumps(welcome_msg))

        # Handle messages
        async for message in websocket:
            try:
                data = json.loads(message)

                if data.get("type") == "join":
                    # Register username
                    username = data.get("username", "Anonymous")
                    usernames[websocket] = username
                    logger.info(f"{username} joined")

                    # Broadcast join notification
                    await broadcast({
                        "type": "message",
                        "username": "System",
                        "content": f"{username} has joined the chat",
                        "timestamp": datetime.now().timestamp()
                    })

                elif data.get("type") == "message":
                    # Broadcast the message
                    username = usernames.get(websocket, "Anonymous")
                    content = data.get("content", "")
                    logger.info(f"{username}: {content}")

                    await broadcast({
                        "type": "message",
                        "username": username,
                        "content": content,
                        "timestamp": datetime.now().timestamp()
                    })

            except json.JSONDecodeError:
                logger.error("Invalid JSON received")
            except Exception as e:
                logger.error(f"Error handling message: {e}")

    except websockets.exceptions.ConnectionClosed:
        logger.info("Client disconnected unexpectedly")
    finally:
        # Cleanup
        username = usernames.get(websocket)
        if username:
            del usernames[websocket]
            await broadcast({
                "type": "message",
                "username": "System",
                "content": f"{username} has left the chat",
                "timestamp": datetime.now().timestamp()
            })

        clients.discard(websocket)
        logger.info(f"Client removed. Total clients: {len(clients)}")


async def main():
    """Start the WebSocket server."""
    async with websockets.serve(handle_client, "localhost", 8080):
        logger.info("WebSocket server running on ws://localhost:8080")
        await asyncio.Future()  # Run forever


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Server stopped")
