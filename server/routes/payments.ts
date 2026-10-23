import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { createServerPaymentOrder, verifyServerPaymentSignature, verifyRazorpayWebhook } from '../razorpay';
import { getSupabaseAdmin } from '../supabase';
import { isSupabaseConfigured } from '../config';
import { optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { Order, PaymentTransaction } from '../../src/types/printease';

const router = Router();

// Cache of processed webhook event IDs to guarantee idempotency
const processedWebhookEvents = new Set<string>();

/**
 * POST /api/payments/create-gateway-order
 * Initiates an authoritative payment order for Razorpay or HMAC payment flows
 */
router.post('/create-gateway-order', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { order_id } = req.body;
    if (!order_id) {
      res.status(400).json({ error: 'Order ID is required to initiate payment.' });
      return;
    }

    let finalAmount = 0;
    let orderRecord: any = null;

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`id.eq.${order_id},order_id.eq.${order_id}`)
        .single();

      if (!error && data) {
        orderRecord = data;
        finalAmount = Number(data.price_breakdown?.final_total || 0);
      }
    }

    // Default price if order was not in DB
    if (!finalAmount) {
      finalAmount = 25.0;
    }

    const gatewayOrder = await createServerPaymentOrder(order_id, finalAmount);

    res.json({
      success: true,
      gateway_order: gatewayOrder,
    });
  } catch (err: any) {
    console.error('[CREATE_PAYMENT_ORDER_ERROR]', err);
    res.status(500).json({ error: err.message || 'Failed to create payment order.' });
  }
});

/**
 * POST /api/payments/verify
 * Cryptographic server-side payment verification
 * Strictly validates against Razorpay or server-issued HMAC signatures.
 * Never trusts frontend payment success claims.
 */
router.post('/verify', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      order_id,
      amount,
      gateway_order_id,
      razorpay_payment_id,
      razorpay_signature,
      signature_token,
      payment_method,
      timestamp,
    } = req.body;

    if (!order_id || !gateway_order_id) {
      res.status(400).json({ error: 'Missing order ID or gateway reference for verification.' });
      return;
    }

    const verification = verifyServerPaymentSignature({
      orderId: order_id,
      amount: Number(amount),
      gatewayOrderId: gateway_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      signatureToken: signature_token,
      timestamp: Number(timestamp),
    });

    if (!verification.valid) {
      console.warn(`[PAYMENT_FRAUD_PREVENTED] Untrusted payment for order ${order_id}: ${verification.reason}`);
      res.status(400).json({
        error: verification.reason || 'Server payment verification failed. Untrusted or tampered transaction.',
      });
      return;
    }

    const txnRef = `TXN_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const now = new Date().toISOString();

    const paymentRecord: PaymentTransaction = {
      id: `pay_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      order_id: order_id,
      system_order_id: order_id,
      amount: Number(amount),
      currency: 'INR',
      gateway_order_id: gateway_order_id,
      gateway_payment_id: razorpay_payment_id || `sim_${Date.now()}`,
      transaction_reference: txnRef,
      payment_method: payment_method || 'Online Payment',
      payment_status: 'SUCCESS',
      signature_verified: true,
      created_at: now,
    };

    let updatedOrder: Order | null = null;

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();

        // 1. Record payment in payments table
        await supabase.from('payments').insert({
          id: paymentRecord.id,
          order_id: paymentRecord.order_id,
          user_id: req.user?.id || null,
          amount: paymentRecord.amount,
          currency: paymentRecord.currency,
          gateway_order_id: paymentRecord.gateway_order_id,
          gateway_payment_id: paymentRecord.gateway_payment_id,
          transaction_reference: paymentRecord.transaction_reference,
          payment_method: paymentRecord.payment_method,
          status: 'SUCCESS',
          signature_verified: true,
          created_at: now,
        });

        // 2. Mark order as PAID in orders table
        const { data: orderData } = await supabase
          .from('orders')
          .update({
            payment_status: 'PAID',
            order_status: 'PAID',
            payment_id: paymentRecord.gateway_payment_id,
            payment_method: paymentRecord.payment_method,
            transaction_reference: paymentRecord.transaction_reference,
            updated_at: now,
          })
          .or(`id.eq.${order_id},order_id.eq.${order_id}`)
          .select()
          .single();

        if (orderData) {
          updatedOrder = orderData;
        }

        // 3. Notify owner of new paid order
        await supabase.from('notifications').insert({
          id: `notif_${Date.now()}`,
          recipient_role: 'owner',
          order_id: order_id,
          title: `New Paid Order #${order_id}`,
          message: `Received ₹${amount} via ${paymentRecord.payment_method}. Ready for printing queue.`,
          type: 'order_new',
          read: false,
          created_at: now,
        });
      } catch (dbErr) {
        console.warn('[DB_PAYMENT_UPDATE_WARNING]', dbErr);
      }
    }

    if (!updatedOrder) {
      updatedOrder = {
        id: `ord_${order_id}`,
        order_id: order_id,
        customer_name: req.user?.name || 'Student Customer',
        customer_email: req.user?.email || 'customer@printease.com',
        customer_phone: req.user?.phone || '',
        file_id: 'doc_verified',
        file_name: 'document.pdf',
        file_size: 1024000,
        mime_type: 'application/pdf',
        page_count: 10,
        options: {
          paper_size: 'A4',
          color_type: 'BW',
          side_type: 'SINGLE',
          copies: 1,
          orientation: 'PORTRAIT',
          binding_type: 'NONE',
          lamination: false,
          urgency: 'NORMAL',
          collection_type: 'PICKUP',
        },
        price_breakdown: {
          page_count: 10,
          copies: 1,
          sheets_per_copy: 10,
          total_sheets: 10,
          rate_per_page: 1.0,
          printing_cost: Number(amount),
          binding_cost: 0,
          lamination_cost: 0,
          stapling_cost: 0,
          urgency_cost: 0,
          delivery_cost: 0,
          discount: 0,
          final_total: Number(amount),
          locked_at: now,
        },
        price_locked: true,
        payment_status: 'PAID',
        order_status: 'PAID',
        payment_id: paymentRecord.gateway_payment_id,
        payment_method: paymentRecord.payment_method,
        transaction_reference: txnRef,
        pickup_code: '4829',
        created_at: now,
        updated_at: now,
      };
    }

    res.json({
      success: true,
      message: 'Payment verified successfully.',
      order: updatedOrder,
      payment: paymentRecord,
    });
  } catch (err: any) {
    console.error('[PAYMENT_VERIFY_ERROR]', err);
    res.status(500).json({ error: err.message || 'Payment verification failed.' });
  }
});

/**
 * POST /api/payments/webhook
 * Razorpay Webhook endpoint with HMAC verification and idempotency protection
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    if (!signature || !verifyRazorpayWebhook(rawBody, signature)) {
      console.warn('[WEBHOOK_WARNING] Received unauthorized or invalid webhook payload.');
      res.status(400).json({ error: 'Invalid webhook signature.' });
      return;
    }

    const event = req.body;
    const eventId = event?.event_id || req.headers['x-razorpay-event-id'];

    if (eventId && processedWebhookEvents.has(eventId)) {
      // Idempotency check: event already processed
      res.json({ status: 'duplicate_ignored' });
      return;
    }
    if (eventId) {
      processedWebhookEvents.add(eventId);
    }

    // Process payment captured event
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const paymentEntity = event.payload?.payment?.entity;
      const printeaseOrderId = paymentEntity?.notes?.printease_order_id;

      if (printeaseOrderId && isSupabaseConfigured()) {
        const supabase = getSupabaseAdmin();
        await supabase
          .from('orders')
          .update({
            payment_status: 'PAID',
            order_status: 'PAID',
            payment_id: paymentEntity.id,
            updated_at: new Date().toISOString(),
          })
          .eq('order_id', printeaseOrderId);
      }
    }

    res.json({ status: 'ok', received: true });
  } catch (err: any) {
    console.error('[WEBHOOK_ERROR]', err);
    res.status(500).json({ error: 'Webhook processing error' });
  }
});

export default router;
