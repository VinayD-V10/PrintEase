import { Router, Request, Response } from 'express';
import { getSupabaseAdmin } from '../supabase';
import { isSupabaseConfigured } from '../config';
import { optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { NotificationItem } from '../../src/types/printease';

const router = Router();

/**
 * GET /api/notifications
 */
router.get('/', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  const role = (req.query.role as string) || (req.user?.role === 'admin' ? 'owner' : 'customer');
  const email = (req.query.email as string)?.trim().toLowerCase() || req.user?.email || '';

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      let query = supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(20);

      if (role === 'owner') {
        query = query.or('recipient_role.eq.owner,recipient_role.eq.all');
      } else {
        if (email) {
          query = query.or(`recipient_role.eq.all,recipient_email.eq.${email}`);
        } else {
          query = query.eq('recipient_role', 'all');
        }
      }

      const { data, error } = await query;
      if (!error && data) {
        res.json({ notifications: data });
        return;
      }
    } catch (e) {
      console.warn('[NOTIFICATIONS_FETCH_WARNING]', e);
    }
  }

  res.json({ notifications: [] });
});

/**
 * PATCH /api/notifications/:id/read
 */
router.patch('/:id/read', optionalAuth, async (req: Request, res: Response) => {
  const id = String(req.params.id);

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      await supabase.from('notifications').update({ read: true }).eq('id', id);
    } catch {}
  }

  res.json({ success: true, id, read: true });
});

export default router;
