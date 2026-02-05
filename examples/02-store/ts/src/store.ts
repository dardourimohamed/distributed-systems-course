import http from 'http';

/**
 * Simple in-memory key-value store
 */
class KeyValueStore {
  private data: Map<string, any> = new Map();

  /**
   * Set a key-value pair
   */
  set(key: string, value: any): void {
    this.data.set(key, value);
    console.log(`[Store] SET ${key} = ${JSON.stringify(value)}`);
  }

  /**
   * Get a value by key
   */
  get(key: string): any {
    const value = this.data.get(key);
    console.log(`[Store] GET ${key} => ${value !== undefined ? JSON.stringify(value) : 'null'}`);
    return value;
  }

  /**
   * Delete a key
   */
  delete(key: string): boolean {
    const existed = this.data.delete(key);
    console.log(`[Store] DELETE ${key} => ${existed ? 'success' : 'not found'}`);
    return existed;
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.data.keys());
  }

  /**
   * Get store statistics
   */
  stats() {
    return {
      totalKeys: this.data.size,
      keys: this.keys()
    };
  }
}

// Create the store instance
const store = new KeyValueStore();

/**
 * HTTP Server with key-value API
 */
const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Parse URL
  const url = new URL(req.url || '', `http://${req.headers.host}`);

  // Route: GET /keys - List all keys
  if (req.method === 'GET' && url.pathname === '/keys') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(store.stats()));
    return;
  }

  // Route: GET /key/{key} - Get value
  if (req.method === 'GET' && url.pathname.startsWith('/key/')) {
    const key = url.pathname.slice(5); // Remove '/key/'
    const value = store.get(key);

    if (value !== undefined) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ key, value }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Key not found', key }));
    }
    return;
  }

  // Route: PUT /key/{key} - Set value
  if (req.method === 'PUT' && url.pathname.startsWith('/key/')) {
    const key = url.pathname.slice(5); // Remove '/key/'

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const value = JSON.parse(body);
        store.set(key, value);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, key, value }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Route: DELETE /key/{key} - Delete key
  if (req.method === 'DELETE' && url.pathname.startsWith('/key/')) {
    const key = url.pathname.slice(5); // Remove '/key/'
    const existed = store.delete(key);

    if (existed) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, key }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Key not found', key }));
    }
    return;
  }

  // 404 - Not found
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Key-Value Store listening on port ${PORT}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET    /key/{key}    - Get value by key`);
  console.log(`  PUT    /key/{key}    - Set value for key`);
  console.log(`  DELETE /key/{key}    - Delete key`);
  console.log(`  GET    /keys         - List all keys`);
});
