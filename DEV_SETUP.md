# Development Setup

This project uses a split architecture with the frontend (React + Vite) and backend (Hono + tRPC) running on separate ports.

## Running in Development

You need to run two servers in separate terminals:

### Terminal 1: Frontend Development Server
```bash
npm run dev
```
- Runs on `http://localhost:3000`
- Vite dev server with HMR
- Proxies `/api/*` requests to the backend on port 3001

### Terminal 2: Backend API Server
```bash
npm run dev:backend
```
- Runs on `http://localhost:3001`
- Hono.js backend with tRPC
- Must be running for frontend API calls to work

### Or Run Both Together
```bash
npm run dev:all
```
- Requires `concurrently` to be installed (`npm install --save-dev concurrently`)
- Runs both servers in parallel

## How It Works

1. **Frontend** (port 3000): React app served by Vite
2. **Proxy**: Vite configuration routes `/api/*` requests to `http://localhost:3001`
3. **Backend** (port 3001): Hono server handling tRPC API calls
4. **Authentication**: tRPC provider fetches Supabase JWT token and includes it in API requests

## Environment Variables

Make sure you have a `.env` file with:
```
VITE_API_URL=/api/trpc          # Frontend API endpoint (uses Vite proxy)
DATABASE_URL=...                # MySQL connection string
SUPABASE_URL=...                # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=...   # Supabase service role key
KIMI_AUTH_URL=...               # Kimi OAuth auth endpoint
KIMI_OPEN_URL=...               # Kimi OAuth open endpoint
APP_ID=...                      # App ID for OAuth
APP_SECRET=...                  # App secret for OAuth
```

## Troubleshooting

### Backend not responding
- Make sure `npm run dev:backend` is running
- Check that port 3001 is not blocked
- Look for errors in the backend terminal

### tRPC queries failing with JSON error
- The backend server must be running before making requests
- Check the browser console for the exact error
- Verify `/api/trpc` endpoint is accessible: `curl http://localhost:3001/api/trpc`

### Realtime subscription errors
- These are warnings in development mode (React StrictMode double-invokes effects)
- Should not appear in production build
- The subscription still works despite the warning
