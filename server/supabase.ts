import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config, isSupabaseConfigured } from './config';

/**
 * Privileged Supabase Admin Client
 * Uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS for server-side trusted operations:
 * - Managing user profiles & roles
 * - Creating and updating order records
 * - Generating temporary signed URLs for private storage files
 * - Atomic payment ledger updates
 */
let supabaseAdmin: SupabaseClient | null = null;

/**
 * Public/Anon Supabase Client
 * Used for client-level verification and auth flows
 */
let supabaseAnon: SupabaseClient | null = null;

if (isSupabaseConfigured()) {
  const url = config.supabase.url;
  const adminKey = config.supabase.serviceRoleKey || config.supabase.anonKey;
  const anonKey = config.supabase.anonKey || config.supabase.serviceRoleKey;

  supabaseAdmin = createClient(url, adminKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  supabaseAnon = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
    },
  });
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    if (!config.supabase.url) {
      throw new Error(
        'Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment variables.'
      );
    }
    const adminKey = config.supabase.serviceRoleKey || config.supabase.anonKey;
    supabaseAdmin = createClient(config.supabase.url, adminKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return supabaseAdmin;
}

export function getSupabaseAnon(): SupabaseClient {
  if (!supabaseAnon) {
    if (!config.supabase.url) {
      throw new Error(
        'Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in environment variables.'
      );
    }
    const anonKey = config.supabase.anonKey || config.supabase.serviceRoleKey;
    supabaseAnon = createClient(config.supabase.url, anonKey);
  }
  return supabaseAnon;
}
