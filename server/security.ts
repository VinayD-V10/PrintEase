import { Request, Response, NextFunction } from 'express';

// Threat statistics tracked in memory
export interface CyberDefenseStats {
  attacks_blocked: number;
  rate_limit_triggers: number;
  tamper_attempts_blocked: number;
  path_traversals_blocked: number;
  xss_sqli_blocked: number;
  last_defense_event: string | null;
  active_threat_ips: string[];
  server_start_time: string;
}

export const cyberDefenseStats: CyberDefenseStats = {
  attacks_blocked: 0,
  rate_limit_triggers: 0,
  tamper_attempts_blocked: 0,
  path_traversals_blocked: 0,
  xss_sqli_blocked: 0,
  last_defense_event: null,
  active_threat_ips: [],
  server_start_time: new Date().toISOString(),
};

// Rate limiter storage
interface RateLimitBucket {
  count: number;
  resetTime: number;
}
const ipRateLimits = new Map<string, RateLimitBucket>();
const authRateLimits = new Map<string, RateLimitBucket>();

/**
 * Standard Security Headers Middleware
 * Protects against MIME sniffing, clickjacking, XSS, and information leakage
 */
export function applySecurityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // Avoid leaking server tech stack
  res.removeHeader('X-Powered-By');
  next();
}

/**
 * Intrusion Detection & Attack Signature Inspection Middleware
 * Detects and blocks SQL Injection, Cross-Site Scripting (XSS), Directory Traversal, and Null Byte Injections
 */
export function intrusionDetectionShield(req: Request, res: Response, next: NextFunction) {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  // 1. Inspect URL and Params for Directory Traversal
  const fullUrl = req.originalUrl || req.url;
  const traversalPattern = /(\.\.[\/\\]|%2e%2e|%2f|%5c|\0|%00)/i;
  if (traversalPattern.test(fullUrl)) {
    recordThreat(clientIp, 'PATH_TRAVERSAL', `Directory traversal attempted in URL: ${fullUrl}`);
    cyberDefenseStats.path_traversals_blocked++;
    return res.status(403).json({
      error: 'Security Alert: Malicious path traversal pattern blocked by PrintEase Cyber Shield.',
      shield_action: 'BLOCKED',
    });
  }

  // 2. Inspect Query and Body for Common Attack Signatures
  const payloadString = JSON.stringify({ query: req.query, body: req.body });

  // SQL Injection patterns: UNION SELECT, OR 1=1, DROP TABLE, '--', etc.
  const sqliPattern = /(\bunion\b.*\bselect\b|\bselect\b.*\bfrom\b|\bdrop\b\s+\btable\b|--|;\s*--|\bor\b\s+['"\d]+\s*=\s*['"\d]+|\bexec\b\s*\()/i;
  // XSS patterns: <script, javascript:, onload=, onerror=, etc.
  const xssPattern = /(<\s*script\b|javascript\s*:|onload\s*=|onerror\s*=|document\.cookie|<iframe)/i;

  if (sqliPattern.test(payloadString)) {
    recordThreat(clientIp, 'SQLI_ATTEMPT', 'SQL Injection attempt detected in payload');
    cyberDefenseStats.xss_sqli_blocked++;
    return res.status(403).json({
      error: 'Security Alert: Malicious SQL injection sequence intercepted and blocked.',
      shield_action: 'BLOCKED',
    });
  }

  if (xssPattern.test(payloadString)) {
    recordThreat(clientIp, 'XSS_ATTEMPT', 'Cross-site scripting payload detected');
    cyberDefenseStats.xss_sqli_blocked++;
    return res.status(403).json({
      error: 'Security Alert: Malicious script injection pattern blocked.',
      shield_action: 'BLOCKED',
    });
  }

  next();
}

/**
 * IP Rate Limiter to prevent DoS attacks and resource exhaustion
 */
export function rateLimiter(limit: number = 180, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();

    let bucket = ipRateLimits.get(clientIp);
    if (!bucket || bucket.resetTime < now) {
      bucket = { count: 1, resetTime: now + windowMs };
      ipRateLimits.set(clientIp, bucket);
    } else {
      bucket.count++;
      if (bucket.count > limit) {
        cyberDefenseStats.rate_limit_triggers++;
        recordThreat(clientIp, 'RATE_LIMIT_EXCEEDED', `Client exceeded ${limit} reqs/min limit.`);
        return res.status(429).json({
          error: 'Too many requests. Please wait a moment before trying again.',
          retry_after_seconds: Math.ceil((bucket.resetTime - now) / 1000),
        });
      }
    }
    next();
  };
}

/**
 * Strict Rate Limiter for Authentication endpoints (prevent credential stuffing)
 */
export function authRateLimiter(req: Request, res: Response, next: NextFunction) {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const limit = 20; // 20 login attempts per 5 minutes
  const windowMs = 5 * 60 * 1000;

  let bucket = authRateLimits.get(clientIp);
  if (!bucket || bucket.resetTime < now) {
    bucket = { count: 1, resetTime: now + windowMs };
    authRateLimits.set(clientIp, bucket);
  } else {
    bucket.count++;
    if (bucket.count > limit) {
      cyberDefenseStats.rate_limit_triggers++;
      recordThreat(clientIp, 'BRUTE_FORCE_BLOCKED', `Exceeded auth limit (${limit} attempts).`);
      return res.status(429).json({
        error: 'Too many authentication attempts. Please wait 5 minutes before retrying.',
      });
    }
  }
  next();
}

function recordThreat(ip: string, type: string, details: string) {
  cyberDefenseStats.attacks_blocked++;
  cyberDefenseStats.last_defense_event = `${type} from ${ip}: ${details} at ${new Date().toLocaleTimeString()}`;
  if (!cyberDefenseStats.active_threat_ips.includes(ip)) {
    cyberDefenseStats.active_threat_ips.push(ip);
    if (cyberDefenseStats.active_threat_ips.length > 10) {
      cyberDefenseStats.active_threat_ips.shift();
    }
  }
}

/**
 * Sanitize string inputs to neutralize harmful HTML / scripts
 */
export function sanitizeInput(input: any): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim();
}
