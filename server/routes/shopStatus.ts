import { Router, Request, Response } from 'express';
import { getSupabaseAdmin } from '../supabase';
import { isSupabaseConfigured } from '../config';
import { requireOwner, AuthenticatedRequest } from '../middleware/auth';
import { ShopStatusInfo } from '../../src/types/printease';

const router = Router();

export const DEFAULT_SHOP_STATUS: ShopStatusInfo = {
  status: 'OPEN',
  mode: 'AUTO',
  opening_time: '09:00',
  closing_time: '20:00',
  message: 'Shop is currently OPEN. Ready for print orders!',
  accepting_orders: true,
  updated_at: new Date().toISOString(),
  updated_by: 'system',
};

// In-memory fallback if database table not yet seeded
let inMemoryShopStatus: ShopStatusInfo = { ...DEFAULT_SHOP_STATUS };

/**
 * GET /api/shop-status
 * Public endpoint: reads current status of the print shop
 */
router.get('/', async (_req: Request, res: Response) => {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('shop_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        res.json({
          status: data.status,
          mode: data.mode,
          opening_time: data.opening_time,
          closing_time: data.closing_time,
          message: data.message,
          accepting_orders: data.accepting_orders,
          updated_at: data.updated_at,
          updated_by: data.updated_by,
        });
        return;
      }
    } catch (e) {
      console.warn('[SHOP_STATUS_FETCH_WARNING]', e);
    }
  }

  res.json(inMemoryShopStatus);
});

/**
 * PUT /api/shop-status
 * Owner-only endpoint: updates shop hours, open/closed mode, and banners
 */
router.put('/', requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const update = req.body;
    const nextStatus: ShopStatusInfo = {
      ...inMemoryShopStatus,
      ...update,
      updated_at: new Date().toISOString(),
      updated_by: req.user?.email || 'owner',
    };

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('shop_settings')
        .upsert(
          {
            id: 'default_shop',
            status: nextStatus.status,
            mode: nextStatus.mode,
            opening_time: nextStatus.opening_time,
            closing_time: nextStatus.closing_time,
            message: nextStatus.message,
            accepting_orders: nextStatus.accepting_orders,
            updated_at: nextStatus.updated_at,
            updated_by: nextStatus.updated_by,
          },
          { onConflict: 'id' }
        )
        .select()
        .single();

      if (!error && data) {
        inMemoryShopStatus = nextStatus;
        res.json({ success: true, shop_status: nextStatus });
        return;
      }
    }

    inMemoryShopStatus = nextStatus;
    res.json({ success: true, shop_status: inMemoryShopStatus });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update shop status.' });
  }
});

export default router;
