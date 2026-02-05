import os
import json
import time
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse, parse_qs
from urllib.request import Request, urlopen
from urllib.error import URLError

class StoreNode:
    """Replicated store node with leader election."""

    def __init__(self, node_id: str, peers: List[str]):
        self.node_id = node_id
        self.role: str = 'follower'  # leader, follower, candidate
        self.term = 0
        self.data: Dict[str, Any] = {}
        self.peers = peers
        self.leader_id: Optional[str] = None
        self.last_heartbeat = time.time()

        # Configuration
        self.heartbeat_interval = 2.0  # seconds
        self.election_timeout = 6.0     # seconds

        # Start election timer
        self.start_election_timer()

        # Start heartbeat thread
        self.start_heartbeat_thread()

    def start_election_timer(self):
        """Start election timeout timer."""
        def election_timer():
            while True:
                time.sleep(1)
                time_since = time.time() - self.last_heartbeat
                if time_since > self.election_timeout and self.role != 'leader':
                    print(f"[{self.node_id}] Election timeout! Starting election...")
                    self.start_election()

        thread = threading.Thread(target=election_timer, daemon=True)
        thread.start()

    def start_election(self):
        """Start leader election (simplest: lowest ID wins)."""
        self.term += 1
        self.role = 'candidate'

        # Simple strategy: lowest node ID becomes leader
        all_nodes = sorted([self.node_id] + self.peers)
        lowest_node = all_nodes[0]

        if self.node_id == lowest_node:
            self.become_leader()
        else:
            self.role = 'follower'
            self.leader_id = lowest_node
            print(f"[{self.node_id}] Waiting for {lowest_node} to become leader")

    def become_leader(self):
        """Become the leader."""
        self.role = 'leader'
        self.leader_id = self.node_id
        print(f"[{self.node_id}] 👑 Became LEADER for term {self.term}")

        # Immediately replicate to followers
        self.replicate_to_followers()

    def start_heartbeat_thread(self):
        """Start heartbeat to followers."""
        def heartbeat_loop():
            while True:
                time.sleep(self.heartbeat_interval)
                if self.role == 'leader':
                    self.send_heartbeat()

        thread = threading.Thread(target=heartbeat_loop, daemon=True)
        thread.start()

    def send_heartbeat(self):
        """Send heartbeat to all followers."""
        heartbeat = {
            'type': 'heartbeat',
            'leader_id': self.node_id,
            'term': self.term,
            'timestamp': int(time.time() * 1000),
        }

        for peer in self.peers:
            try:
                self.send_to_peer(peer, '/internal/heartbeat', heartbeat)
            except Exception as e:
                print(f"[{self.node_id}] Failed to send heartbeat to {peer}: {e}")

    def replicate_to_followers(self):
        """Replicate data to all followers."""
        message = {
            'type': 'replicate',
            'leader_id': self.node_id,
            'term': self.term,
            'data': self.data,
        }

        for peer in self.peers:
            try:
                self.send_to_peer(peer, '/internal/replicate', message)
            except Exception as e:
                print(f"[{self.node_id}] Replication failed to {peer}: {e}")

    def handle_heartbeat(self, heartbeat: dict):
        """Handle heartbeat from leader."""
        if heartbeat['term'] >= self.term:
            self.term = heartbeat['term']
            self.last_heartbeat = time.time()
            self.leader_id = heartbeat['leader_id']

            if self.role != 'follower':
                print(f"[{self.node_id}] Stepping down to follower, term {self.term}")
            self.role = 'follower'

    def handle_replication(self, message: dict):
        """Handle replication from leader."""
        if message['term'] >= self.term:
            self.term = message['term']
            self.leader_id = message['leader_id']
            self.role = 'follower'
            self.last_heartbeat = time.time()

            # Merge replicated data
            self.data.update(message['data'])
            print(f"[{self.node_id}] Replicated {len(message['data'])} keys from leader")

    def send_to_peer(self, peer_url: str, path: str, data: dict) -> None:
        """Send data to peer node."""
        url = f"{peer_url}{path}"
        body = json.dumps(data).encode('utf-8')

        req = Request(url, data=body, headers={'Content-Type': 'application/json'}, method='POST')
        with urlopen(req, timeout=1) as response:
            if response.status != 200:
                raise Exception(f"Status {response.status}")

    def set(self, key: str, value: Any) -> bool:
        """Set a key-value pair (only on leader)."""
        if self.role != 'leader':
            return False

        self.data[key] = value
        print(f"[{self.node_id}] SET {key} = {json.dumps(value)}")

        # Replicate to followers
        self.replicate_to_followers()

        return True

    def get(self, key: str) -> Any:
        """Get a value by key."""
        value = self.data.get(key)
        print(f"[{self.node_id}] GET {key} => {json.dumps(value) if value is not None else 'null'}")
        return value

    def delete(self, key: str) -> bool:
        """Delete a key (only on leader)."""
        if self.role != 'leader':
            return False

        existed = key in self.data
        if existed:
            del self.data[key]

        print(f"[{self.node_id}] DELETE {key} => {'success' if existed else 'not found'}")

        # Replicate to followers
        self.replicate_to_followers()

        return existed

    def get_status(self) -> dict:
        """Get node status."""
        return {
            'node_id': self.node_id,
            'role': self.role,
            'term': self.term,
            'leader_id': self.leader_id,
            'total_keys': len(self.data),
            'keys': list(self.data.keys()),
        }


# Create the node
config = {
    'node_id': os.environ.get('NODE_ID', 'node-1'),
    'port': int(os.environ.get('PORT', '4000')),
    'peers': [p for p in os.environ.get('PEERS', '').split(',') if p],
}

node = StoreNode(config['node_id'], config['peers'])


class NodeHandler(BaseHTTPRequestHandler):
    """HTTP request handler for store node."""

    def send_json_response(self, status: int, data: dict):
        """Send a JSON response."""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode()

    def do_OPTIONS(self):
        """Handle CORS preflight."""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        """Handle POST requests."""
        parsed = urlparse(self.path)

        # POST /internal/heartbeat
        if parsed.path == '/internal/heartbeat':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')

            try:
                heartbeat = json.loads(body)
                node.handle_heartbeat(heartbeat)
                self.send_json_response(200, {'success': True})
            except (json.JSONDecodeError, KeyError):
                self.send_json_response(400, {'error': 'Invalid request'})
            return

        # POST /internal/replicate
        if parsed.path == '/internal/replicate':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')

            try:
                message = json.loads(body)
                node.handle_replication(message)
                self.send_json_response(200, {'success': True})
            except (json.JSONDecodeError, KeyError):
                self.send_json_response(400, {'error': 'Invalid request'})
            return

        self.send_json_response(404, {'error': 'Not found'})

    def do_GET(self):
        """Handle GET requests."""
        parsed = urlparse(self.path)

        # GET /status
        if parsed.path == '/status':
            self.send_json_response(200, node.get_status())
            return

        # GET /key/{key}
        if parsed.path.startswith('/key/'):
            key = parsed.path[5:]  # Remove '/key/'
            value = node.get(key)

            if value is not None:
                self.send_json_response(200, {'key': key, 'value': value, 'node_role': node.role})
            else:
                self.send_json_response(404, {'error': 'Key not found', 'key': key})
            return

        self.send_json_response(404, {'error': 'Not found'})

    def do_PUT(self):
        """Handle PUT requests (set value)."""
        parsed = urlparse(self.path)

        # PUT /key/{key}
        if parsed.path.startswith('/key/'):
            key = parsed.path[5:]

            if node.role != 'leader':
                self.send_json_response(503, {
                    'error': 'Not the leader',
                    'current_role': node.role,
                    'leader_id': node.leader_id or 'Unknown',
                })
                return

            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')

            try:
                value = json.loads(body)
                node.set(key, value)
                self.send_json_response(200, {'success': True, 'key': key, 'value': value, 'leader_id': node.node_id})
            except json.JSONDecodeError:
                self.send_json_response(400, {'error': 'Invalid JSON'})
            return

        self.send_json_response(404, {'error': 'Not found'})

    def do_DELETE(self):
        """Handle DELETE requests."""
        parsed = urlparse(self.path)

        # DELETE /key/{key}
        if parsed.path.startswith('/key/'):
            key = parsed.path[5:]

            if node.role != 'leader':
                self.send_json_response(503, {
                    'error': 'Not the leader',
                    'current_role': node.role,
                    'leader_id': node.leader_id or 'Unknown',
                })
                return

            existed = node.delete(key)
            if existed:
                self.send_json_response(200, {'success': True, 'key': key, 'leader_id': node.node_id})
            else:
                self.send_json_response(404, {'error': 'Key not found', 'key': key})
            return

        self.send_json_response(404, {'error': 'Not found'})

    def log_message(self, format, *args):
        """Suppress default logging."""
        pass


def run_server(port: int):
    """Start the HTTP server."""
    server_address = ('', port)
    httpd = HTTPServer(server_address, NodeHandler)
    print(f"[{config['node_id']}] Store Node listening on port {port}")
    print(f"[{config['node_id']}] Peers: {', '.join(config['peers']) or 'none'}")
    print(f"[{config['node_id']}] Available endpoints:")
    print(f"  GET  /status          - Node status and role")
    print(f"  GET  /key/{{key}}       - Get value")
    print(f"  PUT  /key/{{key}}       - Set value (leader only)")
    print(f"  DEL  /key/{{key}}       - Delete key (leader only)")
    httpd.serve_forever()


if __name__ == '__main__':
    run_server(config['port'])
