import crypto from 'crypto';

const GATEWAY_SECRET = process.env.PAYMENT_GATEWAY_SECRET || 'printease_secure_gateway_secret_key_2026';

// Replay attack prevention store: keeps track of completed gateway orders
const processedGatewayOrders = new Set<string>();

export interface GatewayOrder {
  gateway_order_id: string;
  amount: number;
  currency: string;
  order_id: string;
  timestamp: number;
  nonce: string;
  signature_token: string;
}

export function createGatewayPaymentOrder(orderId: string, amount: number): GatewayOrder {
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(6).toString('hex');
  const gateway_order_id = `order_pe_${timestamp}_${nonce}`;
  
  // Create cryptographic verification token bound to orderId, amount, gateway_order_id and timestamp
  const payload = `${orderId}|${amount}|${gateway_order_id}|${timestamp}`;
  const signature_token = crypto
    .createHmac('sha256', GATEWAY_SECRET)
    .update(payload)
    .digest('hex');

  return {
    gateway_order_id,
    amount,
    currency: 'INR',
    order_id: orderId,
    timestamp,
    nonce,
    signature_token,
  };
}

export interface VerificationResult {
  valid: boolean;
  reason?: string;
}

export function verifyGatewayPaymentSignature(
  orderId: string,
  amount: number,
  gatewayOrderId: string,
  providedSignature: string,
  timestamp?: number
): VerificationResult {
  // 1. Replay attack check: verify gateway_order_id has not already been finalized
  if (processedGatewayOrders.has(gatewayOrderId)) {
    return {
      valid: false,
      reason: 'Transaction Replay Detected: Gateway Order ID has already been finalized.',
    };
  }

  // 2. Expiration check: gateway order must be finalized within 15 minutes
  if (timestamp) {
    const age = Date.now() - timestamp;
    if (age > 15 * 60 * 1000 || age < -30000) { // allow 30s clock skew
      return {
        valid: false,
        reason: 'Payment Intent Expired: Transaction window exceeded 15 minutes.',
      };
    }
  }

  // 3. Cryptographic Signature Validation
  // Try with timestamp payload first, then fallback to base payload for backward compatibility
  let expectedSignature = '';
  if (timestamp) {
    const payload = `${orderId}|${amount}|${gatewayOrderId}|${timestamp}`;
    expectedSignature = crypto
      .createHmac('sha256', GATEWAY_SECRET)
      .update(payload)
      .digest('hex');
  }

  const legacyPayload = `${orderId}|${amount}|${gatewayOrderId}`;
  const expectedLegacySignature = crypto
    .createHmac('sha256', GATEWAY_SECRET)
    .update(legacyPayload)
    .digest('hex');

  // Constant time comparison to prevent timing attacks
  let isValid = false;
  try {
    if (expectedSignature && providedSignature.length === expectedSignature.length) {
      isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(providedSignature, 'hex')
      );
    }
    if (!isValid && providedSignature.length === expectedLegacySignature.length) {
      isValid = crypto.timingSafeEqual(
        Buffer.from(expectedLegacySignature, 'hex'),
        Buffer.from(providedSignature, 'hex')
      );
    }
  } catch {
    isValid = false;
  }

  if (isValid) {
    // Record to replay prevention set
    processedGatewayOrders.add(gatewayOrderId);
    // Limit memory size
    if (processedGatewayOrders.size > 10000) {
      const first = processedGatewayOrders.values().next().value;
      if (first) processedGatewayOrders.delete(first);
    }
    return { valid: true };
  }

  return {
    valid: false,
    reason: 'Cryptographic HMAC-SHA256 signature verification failed. Untrusted transaction parameters.',
  };
}

export function generateTransactionReference(): string {
  const prefix = 'TXN';
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomBytes = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}_${timestamp}_${randomBytes}`;
}
