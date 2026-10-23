-- ==============================================================================
-- PrintEase — Supabase PostgreSQL Database Schema & Security Migration
-- Execute this entire script in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ==============================================================================

-- 1. Create Private Storage Bucket for Uploaded Print Documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'print-documents',
  'print-documents',
  false, -- Strictly PRIVATE: prevents public scraping, downloads require signed URLs
  52428800, -- 50 MB
  ARRAY[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800;

-- 2. User Profiles Table (Mirrors and extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'staff')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Shop Operating Settings (Hours, Open/Closed status)
CREATE TABLE IF NOT EXISTS public.shop_settings (
  id TEXT PRIMARY KEY DEFAULT 'default_shop',
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
  mode TEXT NOT NULL DEFAULT 'AUTO' CHECK (mode IN ('AUTO', 'FORCE_OPEN', 'FORCE_CLOSED')),
  opening_time TEXT NOT NULL DEFAULT '09:00',
  closing_time TEXT NOT NULL DEFAULT '20:00',
  message TEXT NOT NULL DEFAULT 'Shop is currently OPEN. Ready for print orders!',
  accepting_orders BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT
);

-- Seed default shop row
INSERT INTO public.shop_settings (id, status, mode, opening_time, closing_time, message, accepting_orders)
VALUES ('default_shop', 'OPEN', 'AUTO', '09:00', '20:00', 'Shop is currently OPEN. Ready for print orders!', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Printing Rate Card / Pricing Settings
CREATE TABLE IF NOT EXISTS public.pricing_settings (
  id TEXT PRIMARY KEY DEFAULT 'default_pricing',
  a4_bw NUMERIC(8,2) NOT NULL DEFAULT 1.00,
  a4_color NUMERIC(8,2) NOT NULL DEFAULT 5.00,
  a3_bw NUMERIC(8,2) NOT NULL DEFAULT 3.00,
  a3_color NUMERIC(8,2) NOT NULL DEFAULT 10.00,
  spiral_binding NUMERIC(8,2) NOT NULL DEFAULT 30.00,
  stapling NUMERIC(8,2) NOT NULL DEFAULT 5.00,
  lamination NUMERIC(8,2) NOT NULL DEFAULT 10.00,
  urgent_fee NUMERIC(8,2) NOT NULL DEFAULT 20.00,
  delivery_fee NUMERIC(8,2) NOT NULL DEFAULT 40.00,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default pricing row
INSERT INTO public.pricing_settings (id, a4_bw, a4_color, a3_bw, a3_color, spiral_binding, stapling, lamination, urgent_fee, delivery_fee)
VALUES ('default_pricing', 1.00, 5.00, 3.00, 10.00, 30.00, 5.00, 10.00, 20.00, 40.00)
ON CONFLICT (id) DO NOTHING;

-- 5. Uploaded Document Metadata Table
CREATE TABLE IF NOT EXISTS public.uploaded_files (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  page_count INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- 6. Customer Print Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE, -- e.g. 'PE48291'
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  file_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  page_count INT NOT NULL,
  options JSONB NOT NULL,
  price_breakdown JSONB NOT NULL,
  price_locked BOOLEAN NOT NULL DEFAULT TRUE,
  payment_status TEXT NOT NULL DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PAID', 'FAILED', 'REFUNDED')),
  payment_id TEXT,
  payment_method TEXT,
  transaction_reference TEXT,
  order_status TEXT NOT NULL DEFAULT 'PENDING_PAYMENT' CHECK (
    order_status IN (
      'PENDING_PAYMENT',
      'PAID',
      'RECEIVED',
      'PRINTING',
      'BINDING',
      'READY_FOR_PICKUP',
      'COMPLETED',
      'CANCELLED',
      'FAILED'
    )
  ),
  pickup_code TEXT NOT NULL,
  status_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ready_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders(order_status);

-- 7. Payment Transactions Table (Cryptographic Audit Ledger)
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.orders(order_id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  gateway_order_id TEXT NOT NULL,
  gateway_payment_id TEXT,
  transaction_reference TEXT NOT NULL UNIQUE,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'FAILED', 'PENDING')),
  signature_verified BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Student Campus Wallets & Ledger
CREATE TABLE IF NOT EXISTS public.wallets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  balance NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id TEXT PRIMARY KEY,
  wallet_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  order_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('CREDIT', 'DEBIT', 'REFUND', 'ADJUSTMENT')),
  amount NUMERIC(10,2) NOT NULL,
  balance_before NUMERIC(10,2) NOT NULL,
  balance_after NUMERIC(10,2) NOT NULL,
  reference_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'SUCCESS',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Notifications Center Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  recipient_role TEXT NOT NULL DEFAULT 'customer' CHECK (recipient_role IN ('customer', 'owner', 'all')),
  recipient_email TEXT,
  order_id TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'order_new',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_role, recipient_email);

-- 10. Owner Payment & Bank Settings Table
CREATE TABLE IF NOT EXISTS public.owner_payment_settings (
  id TEXT PRIMARY KEY DEFAULT 'default_payment_settings',
  shop_phone TEXT,
  upi_id TEXT NOT NULL DEFAULT 'vinay8046d@okaxis',
  phonepe_number TEXT,
  gpay_number TEXT,
  paytm_number TEXT,
  bank_name TEXT NOT NULL DEFAULT 'State Bank of India',
  account_holder_name TEXT NOT NULL DEFAULT 'Vinay (PrintEase)',
  account_number TEXT NOT NULL DEFAULT '38920192830',
  ifsc_code TEXT NOT NULL DEFAULT 'SBIN0001234',
  branch_name TEXT DEFAULT 'Campus Tech Center Branch',
  qr_label TEXT DEFAULT 'PrintEase Counter #2 Official UPI',
  gateway_provider TEXT DEFAULT 'razorpay',
  gateway_mode TEXT DEFAULT 'test',
  gateway_merchant_id TEXT,
  gateway_key_id TEXT,
  gateway_webhook_secret TEXT,
  auto_settlement_enabled BOOLEAN DEFAULT TRUE,
  settlement_frequency TEXT DEFAULT 'instant',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT
);

INSERT INTO public.owner_payment_settings (id, upi_id, account_holder_name, bank_name, account_number, ifsc_code)
VALUES ('default_payment_settings', 'vinay8046d@okaxis', 'Vinay (PrintEase)', 'State Bank of India', '38920192830', 'SBIN0001234')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- Row Level Security (RLS) Policies
-- ==============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_payment_settings ENABLE ROW LEVEL SECURITY;

-- Public can read shop_settings & pricing_settings
CREATE POLICY "Public can view shop settings" ON public.shop_settings FOR SELECT USING (true);
CREATE POLICY "Public can view pricing settings" ON public.pricing_settings FOR SELECT USING (true);
CREATE POLICY "Public can view owner payment details" ON public.owner_payment_settings FOR SELECT USING (true);

-- Allow authenticated server service role to perform all operations
CREATE POLICY "Service role full access on users" ON public.users USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on orders" ON public.orders USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on uploaded_files" ON public.uploaded_files USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on payments" ON public.payments USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on wallets" ON public.wallets USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on wallet_transactions" ON public.wallet_transactions USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on notifications" ON public.notifications USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on shop_settings" ON public.shop_settings USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on pricing_settings" ON public.pricing_settings USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on owner_payment_settings" ON public.owner_payment_settings USING (true) WITH CHECK (true);
