import { Order, ShopStatusInfo, Wallet, WalletTransaction, PricingSettings } from '../types/printease';

export const DEFAULT_PRICING: PricingSettings = {
  a4_bw: 1.0,
  a4_color: 5.0,
  a3_bw: 3.0,
  a3_color: 10.0,
  spiral_binding: 30.0,
  stapling: 5.0,
  lamination: 10.0,
  urgent_fee: 20.0,
  delivery_fee: 40.0,
};

export const DEFAULT_SHOP_STATUS: ShopStatusInfo = {
  status: 'OPEN',
  mode: 'AUTO',
  opening_time: '09:00',
  closing_time: '20:00',
  message: 'Shop is currently OPEN. Ready for print orders!',
  accepting_orders: true,
  updated_at: new Date().toISOString(),
  updated_by: 'system',
};

export const DEFAULT_WALLET: Wallet = {
  id: 'wlt_student_01',
  user_id: 'usr_student_01',
  balance: 250,
  currency: 'INR',
  status: 'active',
  created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  updated_at: new Date().toISOString(),
};

export const DEFAULT_WALLET_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'wtx_sample_01',
    wallet_id: 'wlt_student_01',
    user_id: 'usr_student_01',
    type: 'CREDIT',
    amount: 500,
    balance_before: 0,
    balance_after: 500,
    reference_id: 'WCR_884920',
    status: 'SUCCESS',
    description: 'UPI Wallet Top-up (Welcome Campus Credit)',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'wtx_sample_02',
    wallet_id: 'wlt_student_01',
    user_id: 'usr_student_01',
    order_id: 'PE48292',
    type: 'DEBIT',
    amount: 210,
    balance_before: 500,
    balance_after: 290,
    reference_id: 'WDBT_192838',
    status: 'SUCCESS',
    description: 'Payment for Order #PE48292',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

export const DEFAULT_DEMO_ORDERS: Order[] = [
  {
    id: 'ord_sample_01',
    order_id: 'PE48291',
    user_id: 'usr_student_01',
    customer_name: 'Aarav Patel',
    customer_email: 'student@college.edu',
    customer_phone: '+91 91234 56789',
    file_id: 'file_sample_01',
    file_name: 'Artificial_Intelligence_Unit3_Notes.pdf',
    file_size: 3450000,
    mime_type: 'application/pdf',
    page_count: 42,
    options: {
      paper_size: 'A4',
      color_type: 'BW',
      side_type: 'DOUBLE',
      copies: 1,
      orientation: 'PORTRAIT',
      binding_type: 'SPIRAL',
      lamination: false,
      urgency: 'NORMAL',
      collection_type: 'PICKUP',
      retention_choice: 'SEVEN_DAYS',
    },
    price_breakdown: {
      page_count: 42,
      copies: 1,
      sheets_per_copy: 21,
      total_sheets: 21,
      rate_per_page: 1.0,
      printing_cost: 42.0,
      binding_cost: 30.0,
      lamination_cost: 0,
      stapling_cost: 0,
      urgency_cost: 0,
      delivery_cost: 0,
      discount: 0,
      final_total: 72.0,
      locked_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    price_locked: true,
    payment_status: 'PAID',
    payment_method: 'UPI (Google Pay)',
    order_status: 'READY_FOR_PICKUP',
    pickup_code: '8291',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 1800000).toISOString(),
    file_expires_at: new Date(Date.now() + 86400000 * 6.8).toISOString(),
    retention_choice: 'SEVEN_DAYS',
    storage_place: 'PrintEase Secure Server Vault (/storage/private/uploads/)',
  },
  {
    id: 'ord_sample_02',
    order_id: 'PE48292',
    user_id: 'usr_student_02',
    customer_name: 'Priya Sharma',
    customer_email: 'priya.s@college.edu',
    customer_phone: '+91 98765 43210',
    file_id: 'file_sample_02',
    file_name: 'Final_Year_Project_Report.pdf',
    file_size: 8120000,
    mime_type: 'application/pdf',
    page_count: 85,
    options: {
      paper_size: 'A4',
      color_type: 'MIXED',
      side_type: 'DOUBLE',
      copies: 2,
      orientation: 'PORTRAIT',
      binding_type: 'SPIRAL',
      lamination: false,
      urgency: 'URGENT',
      collection_type: 'PICKUP',
      custom_color_pages: '1,2,5,18,34',
      color_pages_count: 5,
      bw_pages_count: 80,
      retention_choice: 'SEVEN_DAYS',
    },
    price_breakdown: {
      page_count: 85,
      copies: 2,
      sheets_per_copy: 43,
      total_sheets: 86,
      rate_per_page: 1.0,
      color_rate: 5.0,
      bw_rate: 1.0,
      color_pages_count: 5,
      bw_pages_count: 80,
      printing_cost: 210.0,
      binding_cost: 60.0,
      lamination_cost: 0,
      stapling_cost: 0,
      urgency_cost: 20.0,
      delivery_cost: 0,
      discount: 0,
      final_total: 290.0,
      locked_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    price_locked: true,
    payment_status: 'PAID',
    payment_method: 'PrintEase Wallet',
    order_status: 'PRINTING',
    pickup_code: '4829',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    file_expires_at: new Date(Date.now() + 86400000 * 6.5).toISOString(),
    retention_choice: 'SEVEN_DAYS',
    storage_place: 'PrintEase Secure Server Vault (/storage/private/uploads/)',
  },
  {
    id: 'ord_sample_03',
    order_id: 'PE48293',
    user_id: 'usr_student_03',
    customer_name: 'Rohan Verma',
    customer_email: 'rohan.v@college.edu',
    customer_phone: '+91 99887 76655',
    file_id: 'file_sample_03',
    file_name: 'Digital_Signal_Processing_Lab.pdf',
    file_size: 1420000,
    mime_type: 'application/pdf',
    page_count: 14,
    options: {
      paper_size: 'A4',
      color_type: 'BW',
      side_type: 'SINGLE',
      copies: 1,
      orientation: 'PORTRAIT',
      binding_type: 'NONE',
      lamination: false,
      urgency: 'NORMAL',
      collection_type: 'PICKUP',
      retention_choice: 'SEVEN_DAYS',
    },
    price_breakdown: {
      page_count: 14,
      copies: 1,
      sheets_per_copy: 14,
      total_sheets: 14,
      rate_per_page: 1.0,
      printing_cost: 14.0,
      binding_cost: 0,
      lamination_cost: 0,
      stapling_cost: 0,
      urgency_cost: 0,
      delivery_cost: 0,
      discount: 0,
      final_total: 14.0,
      locked_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    },
    price_locked: true,
    payment_status: 'PAID',
    payment_method: 'UPI (Paytm)',
    order_status: 'PAID',
    pickup_code: '9293',
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    file_expires_at: new Date(Date.now() + 86400000 * 6.9).toISOString(),
    retention_choice: 'SEVEN_DAYS',
    storage_place: 'PrintEase Secure Server Vault (/storage/private/uploads/)',
  },
];

const STORAGE_ORDERS_KEY = 'printease_client_orders_v2';
const STORAGE_SHOP_STATUS_KEY = 'printease_client_shop_status_v2';
const STORAGE_WALLET_KEY = 'printease_client_wallet_v2';
const STORAGE_WALLET_TXS_KEY = 'printease_client_wallet_txs_v2';

export function getClientStoredOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_ORDERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_DEMO_ORDERS;
}

export function saveClientStoredOrders(orders: Order[]): void {
  try {
    localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(orders));
  } catch {}
}

export function getClientStoredShopStatus(): ShopStatusInfo {
  try {
    const raw = localStorage.getItem(STORAGE_SHOP_STATUS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.status) return parsed;
    }
  } catch {}
  return DEFAULT_SHOP_STATUS;
}

export function saveClientStoredShopStatus(status: ShopStatusInfo): void {
  try {
    localStorage.setItem(STORAGE_SHOP_STATUS_KEY, JSON.stringify(status));
  } catch {}
}

export function getClientStoredWallet(): Wallet {
  try {
    const raw = localStorage.getItem(STORAGE_WALLET_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.balance === 'number') return parsed;
    }
  } catch {}
  return DEFAULT_WALLET;
}

export function saveClientStoredWallet(wallet: Wallet): void {
  try {
    localStorage.setItem(STORAGE_WALLET_KEY, JSON.stringify(wallet));
  } catch {}
}

export function getClientStoredWalletTxs(): WalletTransaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_WALLET_TXS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return DEFAULT_WALLET_TRANSACTIONS;
}

export function saveClientStoredWalletTxs(txs: WalletTransaction[]): void {
  try {
    localStorage.setItem(STORAGE_WALLET_TXS_KEY, JSON.stringify(txs));
  } catch {}
}
