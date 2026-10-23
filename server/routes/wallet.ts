import { Router, Response } from 'express';
import crypto from 'crypto';
import { getSupabaseAdmin } from '../supabase';
import { isSupabaseConfigured } from '../config';
import { optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { Wallet, WalletTransaction } from '../../src/types/printease';

const router = Router();

const DEFAULT_WALLET: Wallet = {
  id: 'wlt_student_01',
  user_id: 'usr_student_01',
  balance: 250,
  currency: 'INR',
  status: 'active',
  created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * GET /api/wallet
 * Returns student wallet balance and transaction ledger
 */
router.get('/', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = (req.query.user_id as string) || req.user?.id || 'usr_student_01';

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const { data: walletData } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const { data: txData } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (walletData) {
        res.json({
          wallet: walletData,
          transactions: txData || [],
        });
        return;
      }
    } catch (e) {
      console.warn('[WALLET_FETCH_WARNING]', e);
    }
  }

  res.json({
    wallet: { ...DEFAULT_WALLET, user_id: userId },
    transactions: [],
  });
});

/**
 * POST /api/wallet/pay
 * Deducts from wallet balance for order payment
 */
router.post('/pay', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { order_id, user_id } = req.body;
    const targetUserId = user_id || req.user?.id || 'usr_student_01';

    if (!order_id) {
      res.status(400).json({ error: 'Order ID is required.' });
      return;
    }

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();

      // 1. Get order amount
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .or(`id.eq.${order_id},order_id.eq.${order_id}`)
        .single();

      if (!order) {
        res.status(404).json({ error: 'Order not found.' });
        return;
      }

      const amount = Number(order.price_breakdown?.final_total || 0);

      // 2. Get wallet
      const { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (!wallet || Number(wallet.balance) < amount) {
        res.status(400).json({ error: 'Insufficient wallet balance.' });
        return;
      }

      const newBalance = Number(wallet.balance) - amount;
      const now = new Date().toISOString();
      const txRef = `WDBT_${Date.now()}`;

      // 3. Update wallet balance
      await supabase
        .from('wallets')
        .update({ balance: newBalance, updated_at: now })
        .eq('id', wallet.id);

      // 4. Record transaction
      await supabase.from('wallet_transactions').insert({
        id: `wtx_${Date.now()}`,
        wallet_id: wallet.id,
        user_id: targetUserId,
        order_id: order.order_id,
        type: 'DEBIT',
        amount,
        balance_before: wallet.balance,
        balance_after: newBalance,
        reference_id: txRef,
        status: 'SUCCESS',
        description: `Payment for Print Order #${order.order_id}`,
        created_at: now,
      });

      // 5. Update order to PAID
      const { data: updatedOrder } = await supabase
        .from('orders')
        .update({
          payment_status: 'PAID',
          order_status: 'PAID',
          payment_method: 'PrintEase Wallet',
          transaction_reference: txRef,
          updated_at: now,
        })
        .eq('id', order.id)
        .select()
        .single();

      res.json({
        success: true,
        order: updatedOrder || order,
        balance: newBalance,
      });
      return;
    }

    res.json({
      success: true,
      message: 'Wallet payment processed.',
      balance: 200,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Wallet payment failed.' });
  }
});

export default router;
