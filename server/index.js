import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

const MESSAGES_FILE = path.join(__dirname, '../data/messages.json');
const ONTOLOGY_FILE = path.join(__dirname, '../data/ontology.jsonl');

// Ensure data directory exists
const dataDir = path.dirname(MESSAGES_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize files
if (!fs.existsSync(MESSAGES_FILE)) {
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify([]));
}
if (!fs.existsSync(ONTOLOGY_FILE)) {
  fs.writeFileSync(ONTOLOGY_FILE, '');
}

// Helper: Get ontology data
function getOntologyData() {
  try {
    const content = fs.readFileSync(ONTOLOGY_FILE, 'utf8');
    const lines = content.trim().split('\n').filter(l => l);
    const entities: unknown[] = [];
    const relations: unknown[] = [];
    
    lines.forEach(line => {
      try {
        const entry = JSON.parse(line);
        if (entry.entity) entities.push(entry.entity);
        if (entry.from && entry.rel && entry.to) relations.push(entry);
      } catch (e) {}
    });
    
    return { entities, relations };
  } catch (e) {
    return { entities: [], relations: [] };
  }
}

const mimeTypes: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  const urlPath = req.url?.split('?')[0] || '/';
  
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Routes
  if (urlPath === '/api/ontology' && req.method === 'GET') {
    const data = getOntologyData();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
    return;
  }

  if (urlPath === '/api/messages' && req.method === 'GET') {
    const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ messages, serverTime: Date.now() }));
    return;
  }

  if (urlPath === '/api/responses' && req.method === 'GET') {
    const lastTimestamp = parseInt(req.headers['last-timestamp'] as string || '0');
    const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
    const newMessages = messages.filter((m: unknown) => {
      const msg = m as { timestamp: number; sender: string };
      return msg.timestamp > lastTimestamp && msg.sender !== 'assistant';
    });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ messages: newMessages, serverTime: Date.now() }));
    return;
  }

  if (urlPath === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { message, sender } = JSON.parse(body);
        const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
        messages.push({ sender: sender || 'guest', message, timestamp: Date.now() });
        fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
    return;
  }

  // Serve static files from dist
  let filePath = path.join(__dirname, '../dist', urlPath === '/' ? 'index.html' : urlPath);
  
  // Fallback to index.html for SPA
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, '../dist/index.html');
  }

  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
