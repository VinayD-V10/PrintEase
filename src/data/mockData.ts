import {
  Order,
  ShopStatusInfo,
  Wallet,
  WalletTransaction,
  PricingSettings,
  OwnerPaymentSettingsData,
  User,
} from '../types/printease';

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

const STORAGE_OWNER_PAYMENTS_KEY = 'printease_owner_payment_settings';

export const DEFAULT_OWNER_PAYMENT_SETTINGS: OwnerPaymentSettingsData = {
  shop_phone: '+91 98765 43210',
  upi_id: 'printease.campus@okhdfcbank',
  phonepe_number: '+91 98765 43210',
  gpay_number: '+91 98765 43210',
  paytm_number: '+91 98765 43210',
  bank_name: 'State Bank of India',
  account_holder_name: 'PrintEase Xerox & Stationery Services',
  account_number: '394857291842',
  ifsc_code: 'SBIN0004921',
  branch_name: 'Campus University Tech Complex, Counter #2',
  qr_code_data: 'upi://pay?pa=printease.campus@okhdfcbank&pn=PrintEase%20Campus%20Xerox&cu=INR',
  qr_code_image: '',
  qr_label: 'PrintEase Official Campus Xerox QR',
  gateway_provider: 'razorpay',
  gateway_mode: 'live',
  gateway_merchant_id: 'rzp_live_PRINTEASE984',
  gateway_key_id: 'rzp_live_k89a1948201',
  gateway_webhook_secret: 'whsec_e39f8a847b2c9183',
  auto_settlement_enabled: true,
  settlement_frequency: 'daily_eod',
  updated_at: new Date().toISOString(),
  updated_by: 'Shop Owner',
};

export function getClientStoredOwnerPaymentSettings(): OwnerPaymentSettingsData {
  try {
    const raw = localStorage.getItem(STORAGE_OWNER_PAYMENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.upi_id && parsed.bank_name) {
        return {
          ...DEFAULT_OWNER_PAYMENT_SETTINGS,
          ...parsed,
        };
      }
    }
  } catch {}
  return DEFAULT_OWNER_PAYMENT_SETTINGS;
}

export function saveClientStoredOwnerPaymentSettings(settings: OwnerPaymentSettingsData): void {
  try {
    localStorage.setItem(STORAGE_OWNER_PAYMENTS_KEY, JSON.stringify(settings));
  } catch {}
}

const STORAGE_CURRENT_USER_KEY = 'printease_current_user';
const STORAGE_REGISTERED_USERS_KEY = 'printease_registered_users';
const STORAGE_CUSTOMER_USER_KEY = 'printease_active_customer_user';
const STORAGE_OWNER_USER_KEY = 'printease_active_owner_user';

export interface StoredUserAccount extends User {
  password?: string;
}

export const DEFAULT_USERS: StoredUserAccount[] = [
  {
    id: 'usr_student_02',
    name: 'Vinay',
    email: 'vinay8046d@gmail.com',
    phone: '+91 80887 11191',
    role: 'customer',
    status: 'active',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    password: 'vinay123',
  },
  {
    id: 'usr_student_01',
    name: 'Aarav Patel',
    email: 'student@college.edu',
    phone: '+91 91234 56789',
    role: 'customer',
    status: 'active',
    created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
    password: 'student123',
  },
  {
    id: 'usr_admin_01',
    name: 'Rajesh Sharma (Shop Owner)',
    email: 'admin@printease.com',
    phone: '+91 98765 43210',
    role: 'admin',
    status: 'active',
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    password: 'admin123',
  },
];

export function getClientRegisteredUsers(): StoredUserAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_REGISTERED_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_USERS;
}

export function saveClientRegisteredUsers(users: StoredUserAccount[]): void {
  try {
    localStorage.setItem(STORAGE_REGISTERED_USERS_KEY, JSON.stringify(users));
  } catch {}
}

export function getClientActiveCustomerUser(): User {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOMER_USER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id && parsed.name && parsed.role === 'customer') {
        return parsed;
      }
    }
  } catch {}
  return {
    id: 'usr_student_02',
    name: 'Vinay',
    email: 'vinay8046d@gmail.com',
    phone: '+91 80887 11191',
    role: 'customer',
    status: 'active',
    created_at: new Date().toISOString(),
  };
}

export function saveClientActiveCustomerUser(user: User): void {
  try {
    localStorage.setItem(STORAGE_CUSTOMER_USER_KEY, JSON.stringify(user));
  } catch {}
}

export function getClientActiveOwnerUser(): User {
  try {
    const raw = localStorage.getItem(STORAGE_OWNER_USER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id && (parsed.role === 'admin' || parsed.role === 'staff')) {
        return parsed;
      }
    }
  } catch {}
  return {
    id: 'usr_admin_01',
    name: 'Rajesh Sharma (Shop Owner)',
    email: 'admin@printease.com',
    phone: '+91 98765 43210',
    role: 'admin',
    status: 'active',
    created_at: new Date().toISOString(),
  };
}

export function saveClientActiveOwnerUser(user: User): void {
  try {
    localStorage.setItem(STORAGE_OWNER_USER_KEY, JSON.stringify(user));
  } catch {}
}

export function getClientCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id && parsed.name) {
        return parsed;
      }
    }
  } catch {}
  return null;
}

export function saveClientCurrentUser(user: User | null): void {
  try {
    if (user) {
      localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(user));
      if (user.role === 'customer') {
        saveClientActiveCustomerUser(user);
      } else if (user.role === 'admin' || user.role === 'staff') {
        saveClientActiveOwnerUser(user);
      }
    } else {
      localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
    }
  } catch {}
}

export function findClientUserByIdentifier(identifier: string): StoredUserAccount | null {
  const clean = identifier.trim().toLowerCase();
  const digits = identifier.replace(/\D/g, '');
  const allUsers = getClientRegisteredUsers();

  const found = allUsers.find((u) => {
    if (u.email && u.email.toLowerCase() === clean) return true;
    if (u.phone) {
      if (u.phone.trim() === identifier.trim()) return true;
      const uDigits = u.phone.replace(/\D/g, '');
      if (digits.length >= 7 && (uDigits.endsWith(digits) || digits.endsWith(uDigits))) return true;
    }
    return false;
  });

  return found || null;
}

export function maskDestination(identifier: string): string {
  const trimmed = identifier.trim();
  if (trimmed.includes('@')) {
    const [name, domain] = trimmed.split('@');
    if (name.length <= 2) return `${name}***@${domain}`;
    return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length >= 10) {
    return `+91 ${digits.slice(0, 2)}••••••${digits.slice(-2)}`;
  }
  return `••••••${trimmed.slice(-3)}`;
}

// Client OTP storage
interface ClientOtpRecord {
  code: string;
  identifier: string;
  purpose: 'login' | 'signup' | 'forgot_password' | 'owner_login';
  expires: number;
  data?: any;
}

const STORAGE_ACTIVE_OTP_KEY = 'printease_active_otp_state';

function getStoredOtpRecord(): ClientOtpRecord | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_ACTIVE_OTP_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveStoredOtpRecord(record: ClientOtpRecord | null): void {
  try {
    if (record) {
      sessionStorage.setItem(STORAGE_ACTIVE_OTP_KEY, JSON.stringify(record));
    } else {
      sessionStorage.removeItem(STORAGE_ACTIVE_OTP_KEY);
    }
  } catch {}
}

export function clientRequestLoginOtp(
  identifier: string,
  password: string,
  expectedRole?: 'customer' | 'admin'
): { destination: string; otp: string; user: User } {
  const user = findClientUserByIdentifier(identifier);
  if (!user) {
    // If not found and identifier is email, for demo convenience auto-create if not owner role
    if (identifier.includes('@') && expectedRole !== 'admin') {
      const namePart = identifier.split('@')[0];
      const newUser = clientRegisterUser({
        name: namePart.charAt(0).toUpperCase() + namePart.slice(1),
        email: identifier.trim().toLowerCase(),
        password: password || 'password123',
      }).user;
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const record: ClientOtpRecord = {
        code: otp,
        identifier: identifier.trim().toLowerCase(),
        purpose: 'login',
        expires: Date.now() + 10 * 60 * 1000,
        data: { user: newUser },
      };
      saveStoredOtpRecord(record);
      return { destination: maskDestination(identifier), otp, user: newUser };
    }
    throw new Error('No registered account found with this email or phone number.');
  }

  if (expectedRole === 'admin' && user.role !== 'admin' && user.role !== 'staff') {
    throw new Error('Access denied. This account does not have owner/staff privileges.');
  }

  if (user.password && user.password !== password) {
    // Allow standard fallback passwords for demo ease
    const isMaster =
      (user.role === 'admin' && (password === 'admin123' || password === '1234')) ||
      (user.email.includes('vinay') && password === 'vinay123') ||
      (user.email.includes('student') && password === 'student123');
    if (!isMaster) {
      throw new Error('Invalid password. Please check and try again.');
    }
  }

  const { password: _, ...safeUser } = user;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const record: ClientOtpRecord = {
    code: otp,
    identifier: identifier.trim().toLowerCase(),
    purpose: expectedRole === 'admin' ? 'owner_login' : 'login',
    expires: Date.now() + 10 * 60 * 1000,
    data: { user: safeUser },
  };
  saveStoredOtpRecord(record);

  const destination = user.phone && !identifier.includes('@') ? user.phone : user.email;
  return { destination: maskDestination(destination), otp, user: safeUser };
}

export function clientRequestSignupOtp(data: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): { destination: string; otp: string } {
  const existingEmail = findClientUserByIdentifier(data.email);
  if (existingEmail) {
    throw new Error('An account with this email address already exists. Please login.');
  }

  if (data.phone) {
    const existingPhone = findClientUserByIdentifier(data.phone);
    if (existingPhone) {
      throw new Error('An account with this phone number already exists. Please login.');
    }
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const record: ClientOtpRecord = {
    code: otp,
    identifier: data.email.trim().toLowerCase(),
    purpose: 'signup',
    expires: Date.now() + 10 * 60 * 1000,
    data,
  };
  saveStoredOtpRecord(record);

  return { destination: maskDestination(data.email), otp };
}

export function clientRequestForgotPasswordOtp(identifier: string): { destination: string; otp: string } {
  const user = findClientUserByIdentifier(identifier);
  if (!user) {
    throw new Error('No account found associated with this email or phone number.');
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const record: ClientOtpRecord = {
    code: otp,
    identifier: identifier.trim().toLowerCase(),
    purpose: 'forgot_password',
    expires: Date.now() + 10 * 60 * 1000,
    data: { user_id: user.id },
  };
  saveStoredOtpRecord(record);

  const destination = user.phone && !identifier.includes('@') ? user.phone : user.email;
  return { destination: maskDestination(destination), otp };
}

export function clientResendOtp(identifier: string): { destination: string; otp: string } {
  const prev = getStoredOtpRecord();
  const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const updated: ClientOtpRecord = {
    code: newOtp,
    identifier: identifier.trim().toLowerCase(),
    purpose: prev?.purpose || 'login',
    expires: Date.now() + 10 * 60 * 1000,
    data: prev?.data,
  };
  saveStoredOtpRecord(updated);

  return { destination: maskDestination(identifier), otp: newOtp };
}

export function clientVerifyOtp(
  identifier: string,
  enteredOtp: string,
  purpose: 'login' | 'signup' | 'forgot_password' | 'owner_login',
  newPassword?: string
): { success: boolean; user?: User; token?: string; message?: string } {
  const record = getStoredOtpRecord();
  const trimmedOtp = enteredOtp.trim();

  // Allow test OTP '123456' as well as the generated record code
  const isValid =
    trimmedOtp === '123456' ||
    (record && record.code === trimmedOtp && record.expires > Date.now());

  if (!isValid) {
    throw new Error('Invalid or expired OTP code. Please enter the 6-digit code shown or click Resend.');
  }

  if (purpose === 'login' || purpose === 'owner_login') {
    let user: User | null = record?.data?.user || null;
    if (!user) {
      const stored = findClientUserByIdentifier(identifier);
      if (stored) {
        const { password: _, ...safe } = stored;
        user = safe;
      }
    }
    if (!user) {
      throw new Error('Could not resolve user session. Please try logging in again.');
    }
    const token = `pe_tok_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    saveClientCurrentUser(user);
    saveStoredOtpRecord(null);
    return { success: true, user, token };
  }

  if (purpose === 'signup') {
    const signupData = record?.data;
    if (!signupData) {
      throw new Error('Registration session expired. Please start registration again.');
    }
    const result = clientRegisterUser({
      name: signupData.name,
      email: signupData.email,
      phone: signupData.phone,
      password: signupData.password,
    });
    saveStoredOtpRecord(null);
    return { success: true, user: result.user, token: result.token };
  }

  if (purpose === 'forgot_password') {
    if (!newPassword || newPassword.length < 4) {
      throw new Error('Please provide a valid new password (at least 4 characters).');
    }
    const user = findClientUserByIdentifier(identifier);
    if (!user) {
      throw new Error('User not found.');
    }
    const allUsers = getClientRegisteredUsers();
    const updated = allUsers.map((u) => (u.id === user.id ? { ...u, password: newPassword } : u));
    saveClientRegisteredUsers(updated);
    saveStoredOtpRecord(null);
    return { success: true, message: 'Password has been updated successfully.' };
  }

  saveStoredOtpRecord(null);
  return { success: true };
}

export function clientAuthenticateUser(email: string, password: string): { user: User; token: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const allUsers = getClientRegisteredUsers();

  const found = allUsers.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (found) {
    if (found.password && found.password !== password) {
      throw new Error('Incorrect password. Please try again.');
    }
    const { password: _, ...safeUser } = found;
    const token = `pe_tok_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    saveClientCurrentUser(safeUser);
    return { user: safeUser, token };
  }

  const nameFromEmail = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ') || 'Student Customer';
  const newAccount: StoredUserAccount = {
    id: `usr_${Date.now()}`,
    name: nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1),
    email: normalizedEmail,
    phone: '+91 98765 43210',
    role: 'customer',
    status: 'active',
    created_at: new Date().toISOString(),
    password: password || 'password123',
  };

  const updatedUsers = [newAccount, ...allUsers];
  saveClientRegisteredUsers(updatedUsers);

  const { password: _, ...safeUser } = newAccount;
  const token = `pe_tok_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  saveClientCurrentUser(safeUser);
  return { user: safeUser, token };
}

export function clientRegisterUser(params: {
  name: string;
  email: string;
  phone?: string;
  password?: string;
}): { user: User; token: string } {
  const normalizedEmail = params.email.trim().toLowerCase();
  const allUsers = getClientRegisteredUsers();

  const newAccount: StoredUserAccount = {
    id: `usr_${Date.now()}`,
    name: params.name.trim() || 'Student Customer',
    email: normalizedEmail,
    phone: (params.phone || '').trim(),
    role: 'customer',
    status: 'active',
    created_at: new Date().toISOString(),
    password: params.password || 'password123',
  };

  const updatedUsers = [newAccount, ...allUsers.filter((u) => u.email.toLowerCase() !== normalizedEmail)];
  saveClientRegisteredUsers(updatedUsers);

  const { password: _, ...safeUser } = newAccount;
  const token = `pe_tok_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  saveClientCurrentUser(safeUser);
  return { user: safeUser, token };
}

