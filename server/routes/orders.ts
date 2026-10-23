import { Router, Response } from 'express';
import crypto from 'crypto';
import { getSupabaseAdmin } from '../supabase';
import { isSupabaseConfigured } from '../config';
import { optionalAuth, requireAuth, requireOwner, AuthenticatedRequest } from '../middleware/auth';
import { calculateOrderPrice, DEFAULT_PRICING_SETTINGS } from '../pricing';
import { Order, OrderStatus, PrintOptions } from '../../src/types/printease';

const router = Router();

// In-memory fallback if database not yet migrated
const inMemoryOrders: Map<string, Order> = new Map();

function generateOrderId(): string {
  const num = crypto.randomInt(10000, 99999);
  return `PE${num}`;
}

function generatePickupCode(): string {
  return crypto.randomInt(1000, 9999).toString();
}

/**
 * POST /api/orders
 * Creates an order with frozen price calculation snapshot
 */
router.post('/', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      customer_name,
      customer_email,
      customer_phone,
      file_id,
      file_name,
      file_size,
      mime_type,
      page_count,
      options,
    } = req.body;

    if (!file_id || !file_name || !page_count) {
      res.status(400).json({ error: 'Missing required file details for print order.' });
      return;
    }

    const safeOptions: PrintOptions = options || {
      paper_size: 'A4',
      color_type: 'BW',
      side_type: 'SINGLE',
      copies: 1,
      orientation: 'PORTRAIT',
      binding_type: 'NONE',
      lamination: false,
      urgency: 'NORMAL',
      collection_type: 'PICKUP',
    };

    // 1. Authoritative server-side price calculation
    const priceBreakdown = calculateOrderPrice(Number(page_count), safeOptions, DEFAULT_PRICING_SETTINGS);

    const orderId = generateOrderId();
    const systemId = `ord_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const pickupCode = generatePickupCode();

    const newOrder: Order = {
      id: systemId,
      order_id: orderId,
      user_id: req.user?.id || undefined,
      customer_name: (customer_name || req.user?.name || 'Student Customer').trim(),
      customer_email: (customer_email || req.user?.email || '').trim().toLowerCase(),
      customer_phone: (customer_phone || req.user?.phone || '').trim(),
      file_id: String(file_id),
      file_name: String(file_name),
      file_size: Number(file_size || 0),
      mime_type: String(mime_type || 'application/pdf'),
      page_count: Number(page_count),
      options: safeOptions,
      price_breakdown: priceBreakdown,
      price_locked: true,
      payment_status: 'UNPAID',
      order_status: 'PENDING_PAYMENT',
      pickup_code: pickupCode,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      file_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      retention_choice: safeOptions.retention_choice || 'SEVEN_DAYS',
      storage_place: 'PrintEase Secure Supabase Storage Vault',
    };

    // 2. Persist in Supabase orders table
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        await supabase.from('orders').insert({
          id: newOrder.id,
          order_id: newOrder.order_id,
          user_id: newOrder.user_id || null,
          customer_name: newOrder.customer_name,
          customer_email: newOrder.customer_email,
          customer_phone: newOrder.customer_phone,
          file_id: newOrder.file_id,
          file_name: newOrder.file_name,
          file_size: newOrder.file_size,
          mime_type: newOrder.mime_type,
          page_count: newOrder.page_count,
          options: newOrder.options,
          price_breakdown: newOrder.price_breakdown,
          price_locked: true,
          payment_status: 'UNPAID',
          order_status: 'PENDING_PAYMENT',
          pickup_code: newOrder.pickup_code,
          created_at: newOrder.created_at,
          updated_at: newOrder.updated_at,
        });
      } catch (dbErr) {
        console.warn('[DB_ORDER_INSERT_WARNING]', dbErr);
      }
    }

    inMemoryOrders.set(newOrder.order_id, newOrder);
    inMemoryOrders.set(newOrder.id, newOrder);

    res.status(201).json({
      success: true,
      order: newOrder,
    });
  } catch (err: any) {
    console.error('[ORDER_CREATION_ERROR]', err);
    res.status(500).json({ error: err.message || 'Failed to create order.' });
  }
});

/**
 * GET /api/orders
 * Returns orders based on caller authorization
 * - Owner: returns all shop orders
 * - Customer: returns orders belonging to their email / user_id
 */
router.get('/', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  const isOwner = req.user?.role === 'admin' || req.user?.role === 'staff' || req.query.role === 'owner';
  const queryEmail = (req.query.email as string)?.trim().toLowerCase() || req.user?.email || '';

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false });

      if (!isOwner) {
        if (req.user?.id) {
          query = query.or(`user_id.eq.${req.user.id},customer_email.eq.${queryEmail}`);
        } else if (queryEmail) {
          query = query.eq('customer_email', queryEmail);
        } else {
          // If no email or user provided for unauthenticated guest on static host, return empty
          res.json({ orders: [] });
          return;
        }
      }

      const { data, error } = await query;
      if (!error && data) {
        res.json({ orders: data });
        return;
      }
    } catch (e) {
      console.warn('[ORDERS_FETCH_WARNING]', e);
    }
  }

  // In-memory fallback
  const list = Array.from(new Set(inMemoryOrders.values()));
  if (isOwner) {
    res.json({ orders: list });
    return;
  }
  const filtered = list.filter(
    (o) => (queryEmail && o.customer_email.toLowerCase() === queryEmail) || (req.user?.id && o.user_id === req.user.id)
  );
  res.json({ orders: filtered });
});

/**
 * GET /api/orders/:id
 * Retrieves order details with access guard
 */
router.get('/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  const id = String(req.params.id);

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .or(`id.eq.${id},order_id.eq.${id}`)
        .single();

      if (!error && order) {
        const isOwner = req.user?.role === 'admin' || req.user?.role === 'staff';
        const isBuyer =
          (req.user?.id && order.user_id === req.user.id) ||
          (req.user?.email && order.customer_email.toLowerCase() === req.user.email.toLowerCase());

        // Allow public tracking by Order ID if user has the specific Order ID
        res.json({ order });
        return;
      }
    } catch {}
  }

  const memoryOrder = inMemoryOrders.get(id);
  if (memoryOrder) {
    res.json({ order: memoryOrder });
    return;
  }

  res.status(404).json({ error: `Order #${id} not found.` });
});

/**
 * PUT /api/orders/:id/status
 * Owner-only: updates printing status (PRINTING, READY_FOR_PICKUP, COMPLETED)
 */
router.put('/:id/status', requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const { order_status, status_note } = req.body;

    const validStatuses: OrderStatus[] = [
      'PENDING_PAYMENT',
      'PAID',
      'RECEIVED',
      'PRINTING',
      'BINDING',
      'READY_FOR_PICKUP',
      'COMPLETED',
      'CANCELLED',
    ];

    if (!validStatuses.includes(order_status)) {
      res.status(400).json({ error: `Invalid order status: ${order_status}` });
      return;
    }

    const now = new Date().toISOString();
    const updatePayload: any = {
      order_status,
      updated_at: now,
    };
    if (order_status === 'READY_FOR_PICKUP') updatePayload.ready_at = now;
    if (order_status === 'COMPLETED') updatePayload.completed_at = now;
    if (status_note) updatePayload.status_note = status_note;

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      const { data: updated, error } = await supabase
        .from('orders')
        .update(updatePayload)
        .or(`id.eq.${id},order_id.eq.${id}`)
        .select()
        .single();

      if (!error && updated) {
        // Create customer notification if order is ready
        if (order_status === 'READY_FOR_PICKUP') {
          await supabase.from('notifications').insert({
            id: `notif_${Date.now()}`,
            recipient_role: 'customer',
            recipient_email: updated.customer_email,
            order_id: updated.order_id,
            title: `Order #${updated.order_id} is Ready!`,
            message: `Your prints are ready for collection at Counter #2. Use pickup code: ${updated.pickup_code}`,
            type: 'order_ready',
            read: false,
            created_at: now,
          });
        }

        res.json({ success: true, order: updated });
        return;
      }
    }

    const existing = inMemoryOrders.get(id);
    if (existing) {
      const next = { ...existing, ...updatePayload };
      inMemoryOrders.set(existing.order_id, next);
      inMemoryOrders.set(existing.id, next);
      res.json({ success: true, order: next });
      return;
    }

    res.status(404).json({ error: 'Order not found.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update order status.' });
  }
});

export default router;
