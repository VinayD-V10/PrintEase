export type UserRole = 'customer' | 'admin' | 'staff';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: 'active' | 'suspended';
  created_at: string;
}

export type PaperSize = 'A4' | 'A3';
export type ColorType = 'BW' | 'COLOR' | 'MIXED';
export type SideType = 'SINGLE' | 'DOUBLE';
export type Orientation = 'PORTRAIT' | 'LANDSCAPE';
export type BindingType = 'NONE' | 'SPIRAL' | 'STAPLE';
export type UrgencyType = 'NORMAL' | 'URGENT';
export type CollectionType = 'PICKUP' | 'DELIVERY';
export type RetentionChoice = 'SEVEN_DAYS' | 'PERMANENT' | 'IMMEDIATE_AFTER_PICKUP';

export interface PrintOptions {
  paper_size: PaperSize;
  color_type: ColorType;
  side_type: SideType;
  copies: number;
  orientation: Orientation;
  binding_type: BindingType;
  lamination: boolean;
  urgency: UrgencyType;
  collection_type: CollectionType;
  delivery_address?: string;
  special_instructions?: string;
  retention_choice?: RetentionChoice;
  custom_color_pages?: string;
  color_pages_count?: number;
  bw_pages_count?: number;
}

export interface PricingSettings {
  a4_bw: number;
  a4_color: number;
  a3_bw: number;
  a3_color: number;
  spiral_binding: number;
  stapling: number;
  lamination: number;
  urgent_fee: number;
  delivery_fee: number;
}

export interface PriceBreakdown {
  page_count: number;
  copies: number;
  sheets_per_copy: number;
  total_sheets: number;
  rate_per_page: number;
  printing_cost: number;
  color_pages_count?: number;
  bw_pages_count?: number;
  color_rate?: number;
  bw_rate?: number;
  binding_cost: number;
  lamination_cost: number;
  stapling_cost: number;
  urgency_cost: number;
  delivery_cost: number;
  discount: number;
  final_total: number;
  locked_at: string;
}

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'RECEIVED'
  | 'PRINTING'
  | 'BINDING'
  | 'READY_FOR_PICKUP'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED';

export interface Order {
  id: string;
  order_id: string; // e.g. "PE48291"
  user_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  file_id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  page_count: number;
  options: PrintOptions;
  price_breakdown: PriceBreakdown;
  price_locked: boolean;
  payment_status: 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED';
  payment_id?: string;
  payment_method?: string;
  transaction_reference?: string;
  order_status: OrderStatus;
  pickup_code: string;
  created_at: string;
  updated_at: string;
  ready_at?: string;
  completed_at?: string;
  file_expires_at?: string; // 7 days from upload or undefined if permanent
  file_deleted?: boolean;
  file_deleted_at?: string;
  retention_choice?: RetentionChoice;
  storage_place?: string;
}

export interface PaymentTransaction {
  id: string;
  order_id: string;
  system_order_id: string;
  amount: number;
  currency: string;
  gateway_order_id: string;
  gateway_payment_id: string;
  transaction_reference: string;
  payment_method: string;
  payment_status: 'SUCCESS' | 'FAILED' | 'PENDING';
  signature_verified: boolean;
  created_at: string;
}

export interface UploadedFileRecord {
  id: string;
  original_name: string;
  stored_name: string;
  storage_path: string;
  mime_type: string;
  file_size: number;
  page_count: number;
  created_at: string;
  expires_at?: string; // undefined if permanent
  is_deleted?: boolean;
  deleted_at?: string;
  retention_choice?: RetentionChoice;
  storage_place?: string;
}

export interface AuditLog {
  id: string;
  user_name: string;
  user_role: string;
  action: string;
  order_id?: string;
  details: string;
  ip_address: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  recipient_role: 'customer' | 'owner' | 'all';
  recipient_email?: string;
  order_id?: string;
  title: string;
  message: string;
  type: 'order_new' | 'order_ready' | 'order_completed' | 'order_printing' | 'system';
  read: boolean;
  created_at: string;
}

export interface DashboardStats {
  today_orders: number;
  today_revenue: number;
  weekly_revenue: number;
  monthly_revenue: number;
  pending_orders: number;
  paid_orders: number;
  printing_orders: number;
  ready_orders: number;
  completed_orders: number;
  total_customers: number;
  bw_count: number;
  color_count: number;
  pickup_count: number;
  delivery_count: number;
  online_payments_revenue?: number;
  wallet_payments_revenue?: number;
  refunds_amount?: number;
  wallet_payments_count?: number;
  online_payments_count?: number;
}

export type ShopStatusState = 'OPEN' | 'CLOSED';
export type ShopMode = 'AUTO' | 'FORCE_OPEN' | 'FORCE_CLOSED';

export interface ShopStatusInfo {
  status: ShopStatusState;
  mode: ShopMode;
  opening_time: string; // e.g. "09:00"
  closing_time: string; // e.g. "20:00"
  message: string;
  accepting_orders: boolean;
  updated_at?: string;
  updated_by?: string;
  timezone?: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  status: 'active' | 'frozen';
  created_at: string;
  updated_at: string;
}

export type WalletTxType = 'CREDIT' | 'DEBIT' | 'REFUND' | 'ADJUSTMENT';
export type WalletTxStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  user_id: string;
  order_id?: string;
  type: WalletTxType;
  amount: number;
  balance_before: number;
  balance_after: number;
  reference_id: string;
  payment_gateway_reference?: string;
  status: WalletTxStatus;
  description: string;
  created_at: string;
}
