# Jarvis Web

AI Assistant web interface with chat and ontology dashboard.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Graph:** React Flow
- **Backend:** Node.js (simple HTTP server)

## Getting Started

```bash
# Install dependencies
npm install

# Development
npm run dev      # Frontend only (proxies API to localhost:3001)
npm run server   # Backend only

# Production
npm run build    # Build frontend
npm run start    # Run production server
```

## Deployment

Deploy to Railway:
1. Connect GitHub repo to Railway
2. Set `PORT` environment variable to `3001`
3. Deploy

The server serves the built frontend and API from `/api/*`.
