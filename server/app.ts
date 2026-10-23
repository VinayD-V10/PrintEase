import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config';

import healthRouter from './routes/health';
import authRouter from './routes/auth';
import shopStatusRouter from './routes/shopStatus';
import pricingRouter from './routes/pricing';
import uploadRouter from './routes/upload';
import ordersRouter from './routes/orders';
import paymentsRouter from './routes/payments';
import walletRouter from './routes/wallet';
import notificationsRouter from './routes/notifications';
import shopPaymentInfoRouter from './routes/shopPaymentInfo';

export function createApp() {
  const app = express();

  // -------------------------------------------------------------
  // CORS Configuration
  // Specifically authorizes the production GitHub Pages origin
  // and local development environments without using wildcard '*'
  // -------------------------------------------------------------
  const allowedOrigins = [
    'https://vinayd-v10.github.io',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    config.frontendUrl,
  ].filter(Boolean);

  app.use(
    cors({
      origin: (requestOrigin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, server-to-server webhooks)
        if (!requestOrigin) return callback(null, true);

        // Allow any GitHub Pages domain (*.github.io)
        if (requestOrigin.endsWith('.github.io')) {
          return callback(null, true);
        }

        // Allow explicitly listed origins, Vercel deployments, or local AI Studio containers
        if (
          allowedOrigins.includes(requestOrigin) ||
          requestOrigin.includes('vercel.app') ||
          requestOrigin.includes('run.app') ||
          requestOrigin.includes('localhost') ||
          requestOrigin.includes('127.0.0.1')
        ) {
          return callback(null, true);
        }

        callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Razorpay-Signature'],
    })
  );

  // -------------------------------------------------------------
  // Body Parsers & Webhook Raw Body Capture
  // -------------------------------------------------------------
  app.use(cookieParser());
  app.use(
    express.json({
      limit: '15mb',
      verify: (req: any, _res, buf) => {
        // Store raw buffer for cryptographic webhook HMAC verification
        req.rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // -------------------------------------------------------------
  // Mount API Endpoints (both /api/* and root /* for Vercel rewrites)
  // -------------------------------------------------------------
  const mountAll = (prefix: string) => {
    app.use(`${prefix}/health`, healthRouter);
    app.use(`${prefix}/auth`, authRouter);
    app.use(`${prefix}/shop-status`, shopStatusRouter);
    app.use(`${prefix}/pricing`, pricingRouter);
    app.use(`${prefix}/upload`, uploadRouter);
    app.use(`${prefix}/documents`, uploadRouter);
    app.use(`${prefix}/orders`, ordersRouter);
    app.use(`${prefix}/payments`, paymentsRouter);
    app.use(`${prefix}/wallet`, walletRouter);
    app.use(`${prefix}/notifications`, notificationsRouter);
    app.use(`${prefix}/shop-payment-info`, shopPaymentInfoRouter);
  };

  mountAll('/api');
  mountAll('');

  // Root health check endpoint
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      ok: true,
      service: 'PrintEase Backend API',
      version: '2.0.0',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  });

  // -------------------------------------------------------------
  // 404 JSON Handler for Unrecognized API Routes
  // -------------------------------------------------------------
  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({
      error: 'API route not found.',
      ok: false,
    });
  });

  // -------------------------------------------------------------
  // Global Error Handler
  // -------------------------------------------------------------
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[UNHANDLED_ERROR]', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error.',
      ok: false,
    });
  });

  return app;
}

const app = createApp();
export default app;
