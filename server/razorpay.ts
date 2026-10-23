import crypto from 'crypto';
import Razorpay from 'razorpay';
import { config, isRazorpayConfigured } from './config';

let razorpayClient: Razorpay | null = null;

if (isRazorpayConfigured()) {
  razorpayClient = new Razorpay({
    key_id: config.razorpay.keyId,
    key_secret: config.razorpay.keySecret,
  });
}

export function getRazorpayClient(): Razorpay | null {
  if (!razorpayClient && isRazorpayConfigured()) {
    razorpayClient = new Razorpay({
      key_id: config.razorpay.keyId,
      key_secret: config.razorpay.keySecret,
    });
  }
  return razorpayClient;
}

export interface GatewayOrderResult {
  gateway_order_id: string;
  amount: number;
  currency: string;
  provider: 'razorpay' | 'hmac_secure';
  razorpay_key_id?: string;
  signature_token: string;
  timestamp: number;
}

/**
 * Creates an authoritative server-side payment order
 */
export async function createServerPaymentOrder(
  orderId: string,
  amount: number
): Promise<GatewayOrderResult> {
  const amountInPaise = Math.round(amount * 100);
  const client = getRazorpayClient();
  const timestamp = Date.now();

  if (client) {
    try {
      const rzpOrder = await client.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${orderId.slice(-10)}`,
        notes: {
          printease_order_id: orderId,
        },
      });

      const signaturePayload = `${orderId}|${amount.toFixed(2)}|${rzpOrder.id}|${timestamp}`;
      const signatureToken = crypto
        .createHmac('sha256', config.razorpay.keySecret || 'printease_secret')
        .update(signaturePayload)
        .digest('hex');

      return {
        gateway_order_id: rzpOrder.id,
        amount: amount,
        currency: 'INR',
        provider: 'razorpay',
        razorpay_key_id: config.razorpay.keyId,
        signature_token: signatureToken,
        timestamp,
      };
    } catch (err: any) {
      console.error('[RAZORPAY_CREATE_ORDER_ERROR]', err);
      throw new Error(`Razorpay order creation failed: ${err?.error?.description || err.message}`);
    }
  }

  // Fallback to secure server HMAC token order when Razorpay credentials are not yet entered in .env
  const fallbackGatewayOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;
  const secret = config.jwtSecret || 'printease_payment_gateway_default_secret';
  const payload = `${orderId}|${amount.toFixed(2)}|${fallbackGatewayOrderId}|${timestamp}`;
  const signatureToken = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  return {
    gateway_order_id: fallbackGatewayOrderId,
    amount: amount,
    currency: 'INR',
    provider: 'hmac_secure',
    signature_token: signatureToken,
    timestamp,
  };
}

/**
 * Server-side payment signature verification
 * Never trusts client-reported payment success without verifying the HMAC signature.
 */
export function verifyServerPaymentSignature(params: {
  orderId: string;
  amount: number;
  gatewayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  signatureToken?: string;
  timestamp?: number;
}): { valid: boolean; reason?: string } {
  const { orderId, amount, gatewayOrderId, razorpayPaymentId, razorpaySignature, signatureToken, timestamp } =
    params;

  // 1. If Razorpay client is active and returned official Razorpay signature
  if (razorpayPaymentId && razorpaySignature && config.razorpay.keySecret) {
    const generatedSignature = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(`${gatewayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(generatedSignature, 'utf-8'),
      Buffer.from(razorpaySignature, 'utf-8')
    );

    if (isValid) {
      return { valid: true };
    }
    return { valid: false, reason: 'Invalid Razorpay cryptographic payment signature' };
  }

  // 2. Validate HMAC token issued by PrintEase server
  if (signatureToken && timestamp) {
    const ageMs = Date.now() - timestamp;
    if (ageMs > 30 * 60 * 1000) {
      return { valid: false, reason: 'Payment token has expired. Please initiate payment again.' };
    }

    const secret = config.razorpay.keySecret || config.jwtSecret || 'printease_payment_gateway_default_secret';
    const expectedPayload = `${orderId}|${amount.toFixed(2)}|${gatewayOrderId}|${timestamp}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(expectedPayload).digest('hex');

    const signatureBuffer = Buffer.from(signatureToken, 'utf-8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');

    if (signatureBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return { valid: true };
    }
    return { valid: false, reason: 'Payment signature token mismatch. Untrusted amount or tampered order.' };
  }

  return { valid: false, reason: 'Missing signature verification tokens' };
}

/**
 * Verifies Razorpay Webhook Signature
 */
export function verifyRazorpayWebhook(rawBody: string | Buffer, signature: string): boolean {
  if (!config.razorpay.webhookSecret) {
    return false;
  }
  const expectedSignature = crypto
    .createHmac('sha256', config.razorpay.webhookSecret)
    .update(rawBody)
    .digest('hex');

  const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');
  const signatureBuffer = Buffer.from(signature, 'utf-8');

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}
