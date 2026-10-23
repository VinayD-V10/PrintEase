import { Router, Request, Response } from 'express';
import { isSupabaseConfigured, isRazorpayConfigured, config } from '../config';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: 'PrintEase API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    supabaseConfigured: isSupabaseConfigured(),
    razorpayConfigured: isRazorpayConfigured(),
  });
});

export default router;
