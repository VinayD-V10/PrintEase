import { Request, Response, NextFunction } from 'express';
import { getSupabaseAdmin, getSupabaseAnon } from '../supabase';
import { config, isSupabaseConfigured } from '../config';
import { User, UserRole } from '../../src/types/printease';

export interface AuthenticatedRequest extends Request {
  user?: User;
  rawToken?: string;
}

/**
 * Extracts Bearer token from Authorization header or cookie
 */
export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  if (req.cookies && req.cookies['printease_token']) {
    return req.cookies['printease_token'];
  }
  return null;
}

/**
 * Resolves user from Supabase token
 */
export async function authenticateToken(token: string): Promise<User | null> {
  if (!isSupabaseConfigured()) {
    // If Supabase is not configured yet, return null
    return null;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: authData, error: authErr } = await supabase.auth.getUser(token);

    if (authErr || !authData?.user) {
      return null;
    }

    const authUser = authData.user;
    const email = authUser.email?.toLowerCase().trim() || '';

    // Check user profile in public.users table
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    const isDesignatedOwner = email === config.ownerEmail || email.includes('admin@printease');
    const role: UserRole = profile?.role || (isDesignatedOwner ? 'admin' : 'customer');

    const user: User = {
      id: authUser.id,
      name: profile?.name || authUser.user_metadata?.name || email.split('@')[0] || 'PrintEase User',
      email: email,
      phone: profile?.phone || authUser.phone || authUser.user_metadata?.phone || '',
      role: role,
      status: (profile?.status as any) || 'active',
      created_at: profile?.created_at || authUser.created_at || new Date().toISOString(),
      verified: Boolean(authUser.email_confirmed_at || authUser.confirmed_at),
    };

    return user;
  } catch (err) {
    console.warn('[AUTH_MIDDLEWARE_ERROR] Token validation failed:', err);
    return null;
  }
}

/**
 * Optional Authentication Middleware
 * Attaches user to req.user if a valid token is present
 */
export async function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    return next();
  }

  const user = await authenticateToken(token);
  if (user) {
    req.user = user;
    req.rawToken = token;
  }
  next();
}

/**
 * Strict Authentication Guard (401 Unauthorized if token missing or invalid)
 */
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }

  const user = await authenticateToken(token);
  if (!user) {
    res.status(401).json({ error: 'Invalid or expired session token. Please log in again.' });
    return;
  }

  req.user = user;
  req.rawToken = token;
  next();
}

/**
 * Strict Owner / Administrator Authorization Guard
 * Ensures only users with 'admin' or 'staff' role can access the route.
 * Rejects regular customers with 403 Forbidden.
 */
export async function requireOwner(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required. Owner access denied.' });
    return;
  }

  const user = await authenticateToken(token);
  if (!user) {
    res.status(401).json({ error: 'Invalid or expired session. Owner access denied.' });
    return;
  }

  if (user.role !== 'admin' && user.role !== 'staff') {
    res.status(403).json({
      error: 'Forbidden. This action requires authorized Owner or Administrator privileges.',
    });
    return;
  }

  req.user = user;
  req.rawToken = token;
  next();
}
