import dotenv from 'dotenv';
dotenv.config();

export interface ServerConfig {
  port: number;
  nodeEnv: string;
  frontendUrl: string;
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
    storageBucket: string;
  };
  razorpay: {
    keyId: string;
    keySecret: string;
    webhookSecret: string;
  };
  ownerEmail: string;
  jwtSecret: string;
}

export const config: ServerConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'https://vinayd-v10.github.io',
  supabase: {
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    storageBucket: process.env.SUPABASE_STORAGE_BUCKET || 'print-documents',
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },
  ownerEmail: (process.env.OWNER_EMAIL || 'vinay8046d@gmail.com').trim().toLowerCase(),
  jwtSecret: process.env.JWT_SECRET || 'printease_secure_jwt_secret_token_default_2026',
};

export function isSupabaseConfigured(): boolean {
  return Boolean(config.supabase.url && (config.supabase.serviceRoleKey || config.supabase.anonKey));
}

export function isRazorpayConfigured(): boolean {
  return Boolean(config.razorpay.keyId && config.razorpay.keySecret);
}
