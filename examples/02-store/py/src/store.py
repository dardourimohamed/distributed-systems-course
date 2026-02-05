from http.server import HTTPServer, BaseHTTPRequestHandler
import json
from typing import Any, Dict
from urllib.parse import urlparse

class KeyValueStore:
    """Simple in-memory key-value store."""

    def __init__(self):
        self.data: Dict[str, Any] = {}

    def set(self, key: str, value: Any) -> None:
        """Store a key-value pair."""
        self.data[key] = value
        print(f"[Store] SET {key} = {json.dumps(value)}")

    def get(self, key: str) -> Any:
        """Get value by key."""
        value = self.data.get(key)
        print(f"[Store] GET {key} => {json.dumps(value) if value is not None else 'null'}")
        return value

    def delete(self, key: str) -> bool:
        """Delete a key."""
        existed = key in self.data
        if existed:
            del self.data[key]
        print(f"[Store] DELETE {key} => {'success' if existed else 'not found'}")
        return existed

    def keys(self) -> list:
        """Get all keys."""
        return list(self.data.keys())

    def stats(self) -> dict:
        """Get store statistics."""
        return {
            'totalKeys': len(self.data),
            'keys': self.keys()
        }


# Create the store instance
store = KeyValueStore()


class StoreHandler(BaseHTTPRequestHandler):
    """HTTP request handler for key-value store."""

    def send_json_response(self, status: int, data: dict):
        """Send a JSON response."""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_OPTIONS(self):
        """Handle CORS preflight requests."""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        """Handle GET requests."""
        parsed = urlparse(self.path)

        # GET /keys - List all keys
        if parsed.path == '/keys':
            self.send_json_response(200, store.stats())
            return

        # GET /key/{key} - Get value
        if parsed.path.startswith('/key/'):
            key = parsed.path[5:]  # Remove '/key/'
            value = store.get(key)

            if value is not None:
                self.send_json_response(200, {'key': key, 'value': value})
            else:
                self.send_json_response(404, {'error': 'Key not found', 'key': key})
            return

        # 404
        self.send_json_response(404, {'error': 'Not found'})

    def do_PUT(self):
        """Handle PUT requests (set value)."""
        parsed = urlparse(self.path)

        # PUT /key/{key} - Set value
        if parsed.path.startswith('/key/'):
            key = parsed.path[5:]  # Remove '/key/'

            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')

            try:
                value = json.loads(body)
                store.set(key, value)
                self.send_json_response(200, {'success': True, 'key': key, 'value': value})
            except json.JSONDecodeError:
                self.send_json_response(400, {'error': 'Invalid JSON'})
            return

        # 404
        self.send_json_response(404, {'error': 'Not found'})

    def do_DELETE(self):
        """Handle DELETE requests."""
        parsed = urlparse(self.path)

        # DELETE /key/{key} - Delete key
        if parsed.path.startswith('/key/'):
            key = parsed.path[5:]  # Remove '/key/'
            existed = store.delete(key)

            if existed:
                self.send_json_response(200, {'success': True, 'key': key})
            else:
                self.send_json_response(404, {'error': 'Key not found', 'key': key})
            return

        # 404
        self.send_json_response(404, {'error': 'Not found'})

    def log_message(self, format, *args):
        """Suppress default logging."""
        pass


def run_server(port: int = 4000):
    """Start the HTTP server."""
    server_address = ('', port)
    httpd = HTTPServer(server_address, StoreHandler)
    print(f"Key-Value Store listening on port {port}")
    print(f"\nAvailable endpoints:")
    print(f"  GET    /key/{{key}}    - Get value by key")
    print(f"  PUT    /key/{{key}}    - Set value for key")
    print(f"  DELETE /key/{{key}}    - Delete key")
    print(f"  GET    /keys         - List all keys")
    httpd.serve_forever()


if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 4000))
    run_server(port)
