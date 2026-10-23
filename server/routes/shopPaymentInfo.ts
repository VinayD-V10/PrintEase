import { Router, Request, Response } from 'express';
import { getSupabaseAdmin } from '../supabase';
import { isSupabaseConfigured } from '../config';
import { requireOwner, AuthenticatedRequest } from '../middleware/auth';
import { OwnerPaymentSettingsData } from '../../src/types/printease';

const router = Router();

export const DEFAULT_OWNER_PAYMENT_SETTINGS: OwnerPaymentSettingsData = {
  shop_phone: '+91 80887 11191',
  upi_id: 'vinay8046d@okaxis',
  phonepe_number: '8088711191',
  gpay_number: '8088711191',
  paytm_number: '8088711191',
  bank_name: 'State Bank of India',
  account_holder_name: 'Vinay (PrintEase)',
  account_number: '38920192830',
  ifsc_code: 'SBIN0001234',
  branch_name: 'Campus Tech Center Branch',
  qr_label: 'PrintEase Counter #2 Official UPI',
  gateway_provider: 'razorpay',
  gateway_mode: 'test',
  gateway_merchant_id: 'MERCHANT_PRINTEASE_CAMPUS',
  gateway_key_id: 'rzp_test_campus2026',
  gateway_webhook_secret: '',
  auto_settlement_enabled: true,
  settlement_frequency: 'instant',
};

let inMemorySettings: OwnerPaymentSettingsData = { ...DEFAULT_OWNER_PAYMENT_SETTINGS };

/**
 * GET /api/shop-payment-info
 * Returns public shop UPI and payment details for student checkouts
 */
router.get('/', async (_req: Request, res: Response) => {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const { data } = await supabase
        .from('owner_payment_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (data) {
        res.json({ shop_payment: data });
        return;
      }
    } catch {}
  }

  res.json({ shop_payment: inMemorySettings });
});

/**
 * PUT /api/shop-payment-info
 * Owner-only: updates bank and payment details
 */
router.put('/', requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const update = req.body;
    const next: OwnerPaymentSettingsData = {
      ...inMemorySettings,
      ...update,
      updated_at: new Date().toISOString(),
      updated_by: req.user?.email || 'owner',
    };

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      await supabase.from('owner_payment_settings').upsert(
        {
          id: 'default_payment_settings',
          ...next,
        },
        { onConflict: 'id' }
      );
    }

    inMemorySettings = next;
    res.json({ success: true, shop_payment: inMemorySettings });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update payment settings.' });
  }
});

export default router;
