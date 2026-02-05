import http from 'http';

/**
 * Node configuration
 */
const config = {
  nodeId: process.env.NODE_ID || 'node-1',
  port: parseInt(process.env.PORT || '4000'),
  peers: (process.env.PEERS || '').split(',').filter(Boolean),
  heartbeatInterval: 2000,  // ms
  electionTimeout: 6000,     // ms
};

type NodeRole = 'leader' | 'follower' | 'candidate';

/**
 * Replicated Store Node
 */
class StoreNode {
  public nodeId: string;
  public role: NodeRole;
  public term: number;
  public data: Map<string, any>;
  public peers: string[];

  private leaderId: string | null;
  private lastHeartbeat: number;
  private heartbeatTimer?: NodeJS.Timeout;
  private electionTimer?: NodeJS.Timeout;

  constructor(nodeId: string, peers: string[]) {
    this.nodeId = nodeId;
    this.role = 'follower';
    this.term = 0;
    this.data = new Map();
    this.peers = peers;
    this.leaderId = null;
    this.lastHeartbeat = Date.now();

    this.startElectionTimer();
    this.startHeartbeat();
  }

  /**
   * Start election timeout timer
   */
  private startElectionTimer() {
    this.electionTimer = setTimeout(() => {
      const timeSinceHeartbeat = Date.now() - this.lastHeartbeat;
      if (timeSinceHeartbeat > config.electionTimeout && this.role !== 'leader') {
        console.log(`[${this.nodeId}] Election timeout! Starting election...`);
        this.startElection();
      }
      this.startElectionTimer();
    }, config.electionTimeout);
  }

  /**
   * Start leader election (simplified: lowest ID wins)
   */
  private startElection() {
    this.term++;
    this.role = 'candidate';

    // Simple strategy: lowest node ID becomes leader
    const allNodes = [this.nodeId, ...this.peers].sort();
    const lowestNode = allNodes[0];

    if (this.nodeId === lowestNode) {
      this.becomeLeader();
    } else {
      this.role = 'follower';
      this.leaderId = lowestNode;
      console.log(`[${this.nodeId}] Waiting for ${lowestNode} to become leader`);
    }
  }

  /**
   * Become the leader
   */
  private becomeLeader() {
    this.role = 'leader';
    this.leaderId = this.nodeId;
    console.log(`[${this.nodeId}] 👑 Became LEADER for term ${this.term}`);

    // Immediately replicate to followers
    this.replicateToFollowers();
  }

  /**
   * Start heartbeat to followers
   */
  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.role === 'leader') {
        this.sendHeartbeat();
      }
    }, config.heartbeatInterval);
  }

  /**
   * Send heartbeat to all followers
   */
  private sendHeartbeat() {
    const heartbeat = {
      type: 'heartbeat',
      leaderId: this.nodeId,
      term: this.term,
      timestamp: Date.now(),
    };

    this.peers.forEach(peerUrl => {
      this.sendToPeer(peerUrl, '/internal/heartbeat', heartbeat)
        .catch(err => console.log(`[${this.nodeId}] Failed to send heartbeat to ${peerUrl}:`, err.message));
    });
  }

  /**
   * Replicate data to all followers
   */
  private replicateToFollowers() {
    // Convert Map to object for replication
    const dataObj = Object.fromEntries(this.data);

    this.peers.forEach(peerUrl => {
      this.sendToPeer(peerUrl, '/internal/replicate', {
        type: 'replicate',
        leaderId: this.nodeId,
        term: this.term,
        data: dataObj,
      }).catch(err => console.log(`[${this.nodeId}] Replication failed to ${peerUrl}:`, err.message));
    });
  }

  /**
   * Handle heartbeat from leader
   */
  handleHeartbeat(heartbeat: any) {
    if (heartbeat.term >= this.term) {
      this.term = heartbeat.term;
      this.lastHeartbeat = Date.now();
      this.leaderId = heartbeat.leaderId;
      this.role = 'follower';

      if (this.role !== 'follower') {
        console.log(`[${this.nodeId}] Stepping down to follower, term ${this.term}`);
      }
    }
  }

  /**
   * Handle replication from leader
   */
  handleReplication(message: any) {
    if (message.term >= this.term) {
      this.term = message.term;
      this.leaderId = message.leaderId;
      this.role = 'follower';
      this.lastHeartbeat = Date.now();

      // Merge replicated data
      Object.entries(message.data).forEach(([key, value]) => {
        this.data.set(key, value);
      });

      console.log(`[${this.nodeId}] Replicated ${Object.keys(message.data).length} keys from leader`);
    }
  }

  /**
   * Send data to peer node
   */
  private async sendToPeer(peerUrl: string, path: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = new URL(path, peerUrl);
      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      };

      const req = http.request(url, options, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          reject(new Error(`Status ${res.statusCode}`));
        }
      });

      req.on('error', reject);
      req.write(JSON.stringify(data));
      req.end();
    });
  }

  /**
   * Set a key-value pair (only on leader)
   */
  set(key: string, value: any): boolean {
    if (this.role !== 'leader') {
      return false;
    }

    this.data.set(key, value);
    console.log(`[${this.nodeId}] SET ${key} = ${JSON.stringify(value)}`);

    // Replicate to followers
    this.replicateToFollowers();

    return true;
  }

  /**
   * Get a value by key
   */
  get(key: string): any {
    const value = this.data.get(key);
    console.log(`[${this.nodeId}] GET ${key} => ${value !== undefined ? JSON.stringify(value) : 'null'}`);
    return value;
  }

  /**
   * Delete a key
   */
  delete(key: string): boolean {
    if (this.role !== 'leader') {
      return false;
    }

    const existed = this.data.delete(key);
    console.log(`[${this.nodeId}] DELETE ${key} => ${existed ? 'success' : 'not found'}`);

    // Replicate to followers
    this.replicateToFollowers();

    return existed;
  }

  /**
   * Get node status
   */
  getStatus() {
    return {
      nodeId: this.nodeId,
      role: this.role,
      term: this.term,
      leaderId: this.leaderId,
      totalKeys: this.data.size,
      keys: Array.from(this.data.keys()),
    };
  }
}

// Create the node
const node = new StoreNode(config.nodeId, config.peers);

/**
 * HTTP Server
 */
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url || '', `http://${req.headers.host}`);

  // Route: POST /internal/heartbeat - Leader heartbeat
  if (req.method === 'POST' && url.pathname === '/internal/heartbeat') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const heartbeat = JSON.parse(body);
        node.handleHeartbeat(heartbeat);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
    return;
  }

  // Route: POST /internal/replicate - Replication from leader
  if (req.method === 'POST' && url.pathname === '/internal/replicate') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const message = JSON.parse(body);
        node.handleReplication(message);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
    return;
  }

  // Route: GET /status - Node status
  if (req.method === 'GET' && url.pathname === '/status') {
    res.writeHead(200);
    res.end(JSON.stringify(node.getStatus()));
    return;
  }

  // Route: GET /key/{key} - Get value
  if (req.method === 'GET' && url.pathname.startsWith('/key/')) {
    const key = url.pathname.slice(5);
    const value = node.get(key);

    if (value !== undefined) {
      res.writeHead(200);
      res.end(JSON.stringify({ key, value, nodeRole: node.role }));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Key not found', key }));
    }
    return;
  }

  // Route: PUT /key/{key} - Set value (leader only)
  if (req.method === 'PUT' && url.pathname.startsWith('/key/')) {
    const key = url.pathname.slice(5);

    if (node.role !== 'leader') {
      res.writeHead(503);
      res.end(JSON.stringify({
        error: 'Not the leader',
        currentRole: node.role,
        leaderId: node.leaderId || 'Unknown',
      }));
      return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const value = JSON.parse(body);
        node.set(key, value);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, key, value, leaderId: node.nodeId }));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Route: DELETE /key/{key} - Delete key (leader only)
  if (req.method === 'DELETE' && url.pathname.startsWith('/key/')) {
    const key = url.pathname.slice(5);

    if (node.role !== 'leader') {
      res.writeHead(503);
      res.end(JSON.stringify({
        error: 'Not the leader',
        currentRole: node.role,
        leaderId: node.leaderId || 'Unknown',
      }));
      return;
    }

    const existed = node.delete(key);
    if (existed) {
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, key, leaderId: node.nodeId }));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Key not found', key }));
    }
    return;
  }

  // 404
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(config.port, () => {
  console.log(`[${config.nodeId}] Store Node listening on port ${config.port}`);
  console.log(`[${config.nodeId}] Peers: ${config.peers.join(', ') || 'none'}`);
  console.log(`[${config.nodeId}] Available endpoints:`);
  console.log(`  GET  /status          - Node status and role`);
  console.log(`  GET  /key/{key}       - Get value`);
  console.log(`  PUT  /key/{key}       - Set value (leader only)`);
  console.log(`  DEL  /key/{key}       - Delete key (leader only)`);
});
