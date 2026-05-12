import { serve } from '@hono/node-server';
import app from './api/boot';

// Start Hono backend on port 3001 for development
serve({
  fetch: app.fetch,
  port: 3001,
}, () => {
  console.log('✅ Backend API running on http://localhost:3001');
  console.log('   Frontend will proxy /api/* requests to this server');
  console.log('');
  console.log('Run "npm run dev" in another terminal to start the frontend');
});
