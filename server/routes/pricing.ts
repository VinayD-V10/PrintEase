import { Router, Request, Response } from 'express';
import { getSupabaseAdmin } from '../supabase';
import { isSupabaseConfigured } from '../config';
import { requireOwner, AuthenticatedRequest } from '../middleware/auth';
import { PricingSettings } from '../../src/types/printease';
import { DEFAULT_PRICING_SETTINGS } from '../pricing';

const router = Router();
let inMemoryPricing: PricingSettings = { ...DEFAULT_PRICING_SETTINGS };

/**
 * GET /api/pricing
 * Public: retrieves active document printing price rates
 */
router.get('/', async (_req: Request, res: Response) => {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('pricing_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        res.json({
          pricing: {
            a4_bw: Number(data.a4_bw),
            a4_color: Number(data.a4_color),
            a3_bw: Number(data.a3_bw),
            a3_color: Number(data.a3_color),
            spiral_binding: Number(data.spiral_binding),
            stapling: Number(data.stapling),
            lamination: Number(data.lamination),
            urgent_fee: Number(data.urgent_fee),
            delivery_fee: Number(data.delivery_fee),
          },
        });
        return;
      }
    } catch (e) {
      console.warn('[PRICING_FETCH_WARNING]', e);
    }
  }

  res.json({ pricing: inMemoryPricing });
});

/**
 * PUT /api/pricing
 * Owner-only: updates rate card
 */
router.put('/', requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const update = req.body;
    const nextPricing: PricingSettings = {
      ...inMemoryPricing,
      ...update,
    };

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      await supabase.from('pricing_settings').upsert(
        {
          id: 'default_pricing',
          ...nextPricing,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    }

    inMemoryPricing = nextPricing;
    res.json({ success: true, pricing: inMemoryPricing });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update pricing.' });
  }
});

export default router;
