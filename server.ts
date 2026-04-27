import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';
import newsRouter from './backend/src/api/news.ts';
import eventsRouter from './backend/src/api/events.ts';
import aiRouter from './backend/src/api/ai.ts';
import earthRouter from './backend/src/api/earth.ts';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

    // API Routes
    console.log('Registering API routes...');
    app.use('/api/news', newsRouter);
    app.use('/api/events', eventsRouter);
    app.use('/api/ai', aiRouter);
    app.use('/api/earth', earthRouter);
    
    // Explicit 404 for API routes - DO NOT fall through to SPA fallback
    app.use('/api/*', (req, res) => {
      res.status(404).json({ success: false, error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
    });

    // Health check
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

  const vite = await createViteServer({
    server: { 
      middlewareMode: true,
      hmr: false 
    },
    appType: 'spa'
  });

  app.use(vite.middlewares);

  app.get('*', async (req, res, next) => {
    const url = req.originalUrl;
    if (url.startsWith('/api')) return next();
    
    try {
      let template = fs.readFileSync(path.resolve('index.html'), 'utf-8');
      template = await vite.transformIndexHtml(url, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
