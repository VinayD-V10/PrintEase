import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import fs from 'fs';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import app from './server/app';

// Global Process Crash Prevention
process.on('uncaughtException', (err) => {
  console.error('[CRASH_PREVENTION] Intercepted uncaughtException:', err?.message || err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRASH_PREVENTION] Intercepted unhandledRejection at:', promise, 'reason:', reason);
});

async function bootstrapServer() {
  let PORT = parseInt(process.env.PORT || '3000', 10);
  for (let i = 0; i < process.argv.length; i++) {
    if ((process.argv[i] === '--port' || process.argv[i] === '-p') && process.argv[i + 1]) {
      const parsed = parseInt(process.argv[i + 1], 10);
      if (!isNaN(parsed) && parsed > 0) PORT = parsed;
    } else if (process.argv[i].startsWith('--port=')) {
      const parsed = parseInt(process.argv[i].split('=')[1], 10);
      if (!isNaN(parsed) && parsed > 0) PORT = parsed;
    }
  }

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Development mode with Vite middlewares mounted directly inside Express
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Standalone production container serving dist/
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.use((_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`PrintEase full-stack server running safely on http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[SERVER_ERROR] Port ${PORT} is already in use. Exiting cleanly.`);
      process.exit(1);
    } else {
      console.error('[SERVER_ERROR] Server encountered an error:', err);
    }
  });
}

bootstrapServer().catch((err) => {
  console.error('Failed to start PrintEase server:', err);
  process.exit(1);
});
