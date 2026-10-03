import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import apiRouter from './server/routes';
import { applySecurityHeaders, intrusionDetectionShield } from './server/security';

// Global Process Crash Prevention
process.on('uncaughtException', (err) => {
  console.error('[CRASH_PREVENTION] Intercepted uncaughtException:', err?.message || err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRASH_PREVENTION] Intercepted unhandledRejection at:', promise, 'reason:', reason);
});

async function bootstrapServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isProd = process.env.NODE_ENV === 'production';

  // Security Headers (CSP, nosniff, frame-options, etc.)
  app.use(applySecurityHeaders);

  // Body parser for JSON with error boundary to prevent crash on malformed payloads
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Global Malformed JSON handler (prevents SyntaxError from crashing server)
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({ error: 'Malformed JSON payload intercepted and rejected safely.' });
    }
    next(err);
  });

  // Cyber Defense & Intrusion Detection Filter
  app.use(intrusionDetectionShield);

  // Mount API Router
  app.use('/api', apiRouter);

  if (!isProd) {
    // Development mode with Vite middlewares
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    } else {
      console.warn('Dist folder not found, running in fallback mode');
    }
  }

  // Fallback safe error handler middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[SAFE_ERROR_RECOVERY]:', err?.message || err);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'An internal error occurred, but the server recovered safely.',
        status: 'SERVER_STABLE',
      });
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PrintEase full-stack server running safely on http://0.0.0.0:${PORT}`);
  });
}

bootstrapServer().catch((err) => {
  console.error('Failed to start PrintEase server:', err);
  process.exit(1);
});
