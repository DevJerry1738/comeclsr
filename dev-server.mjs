#!/usr/bin/env node
import { serve } from '@hono/node-server';
import app from './api/boot.ts';

// Start Hono backend on port 3001 for development
serve({
  fetch: app.fetch,
  port: 3001,
}, () => {
  console.log('✅ Backend API running on http://localhost:3001');
  console.log('   Frontend will proxy /api/* requests to this server');
});
