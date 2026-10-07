import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  Order,
  PricingSettings,
  UploadedFileRecord,
  PaymentTransaction,
  AuditLog,
  NotificationItem,
  OrderStatus,
  DashboardStats,
  ShopStatusInfo,
  Wallet,
  WalletTransaction,
  RetentionChoice,
  OwnerPaymentSettingsData,
} from '../src/types/printease';

const STORAGE_DIR = path.resolve(process.cwd(), 'storage/private');
const UPLOADS_DIR = path.join(STORAGE_DIR, 'uploads');
const DB_FILE = path.join(STORAGE_DIR, 'db.json');

// Ensure private storage directories exist
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export interface DatabaseSchema {
  users: Array<User & { password_hash: string; salt: string }>;
  pricing: PricingSettings;
  uploaded_files: UploadedFileRecord[];
  orders: Order[];
  payments: PaymentTransaction[];
  audit_logs: AuditLog[];
  notifications: NotificationItem[];
  order_sequence_counter?: number;
  order_status_history: Array<{
    id: string;
    order_id: string;
    status: OrderStatus;
    changed_by: string;
    timestamp: string;
    note?: string;
  }>;
  shop_status?: ShopStatusInfo;
  wallets?: Wallet[];
  wallet_transactions?: WalletTransaction[];
  owner_payment_settings?: OwnerPaymentSettingsData;
}

// Password hashing using Node crypto scrypt
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const checkHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(checkHash, 'hex'));
  } catch {
    return false;
  }
}

// In-memory Promise Mutex for strict thread-safe atomic order ID generation
let atomicIdMutex = Promise.resolve();

export function generateAtomicOrderId(dbInstance: { getNextAtomicOrderId: () => string }): Promise<string> {
  return new Promise((resolve, reject) => {
    atomicIdMutex = atomicIdMutex.then(async () => {
      try {
        const id = dbInstance.getNextAtomicOrderId();
        resolve(id);
      } catch (err) {
        reject(err);
      }
    });
  });
}

// Fallback legacy generator
export function generateOrderId(existingOrders: Order[]): string {
  const existingSet = new Set(existingOrders.map((o) => o.order_id));
  let orderId = '';
  do {
    const num = Math.floor(10000 + Math.random() * 90000);
    orderId = `PE${num}`;
  } while (existingSet.has(orderId));
  return orderId;
}

const defaultPricing: PricingSettings = {
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

function getInitialData(): DatabaseSchema {
  const adminPwd = hashPassword('admin123');
  const studentPwd = hashPassword('student123');

  const adminUser: User & { password_hash: string; salt: string } = {
    id: 'usr_admin_01',
    name: 'Rajesh Sharma (Shop Owner)',
    email: 'admin@printease.com',
    phone: '+91 98765 43210',
    role: 'admin',
    status: 'active',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    password_hash: adminPwd.hash,
    salt: adminPwd.salt,
  };

  const studentUser: User & { password_hash: string; salt: string } = {
    id: 'usr_student_01',
    name: 'Aarav Patel',
    email: 'student@college.edu',
    phone: '+91 91234 56789',
    role: 'customer',
    status: 'active',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    password_hash: studentPwd.hash,
    salt: studentPwd.salt,
  };

  const vinayPwd = hashPassword('vinay123');
  const vinayUser: User & { password_hash: string; salt: string } = {
    id: 'usr_student_02',
    name: 'Vinay (Owner)',
    email: 'vinay8046d@gmail.com',
    phone: '+91 80887 11191',
    role: 'admin',
    status: 'active',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    password_hash: vinayPwd.hash,
    salt: vinayPwd.salt,
  };

  const sampleFile1: UploadedFileRecord = {
    id: 'file_sample_01',
    original_name: 'Final_Year_Project_Report.pdf',
    stored_name: 'doc_sec_8921a_report.pdf',
    storage_path: path.join(UPLOADS_DIR, 'doc_sec_8921a_report.pdf'),
    mime_type: 'application/pdf',
    file_size: 2450000,
    page_count: 32,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  };

  const sampleFile2: UploadedFileRecord = {
    id: 'file_sample_02',
    original_name: 'Data_Structures_Assignment_3.pdf',
    stored_name: 'doc_sec_4109b_ds.pdf',
    storage_path: path.join(UPLOADS_DIR, 'doc_sec_4109b_ds.pdf'),
    mime_type: 'application/pdf',
    file_size: 1120000,
    page_count: 12,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  };

  const sampleFile3: UploadedFileRecord = {
    id: 'file_sample_03',
    original_name: 'Campus_ID_and_Certificate.png',
    stored_name: 'doc_sec_5512c_id.png',
    storage_path: path.join(UPLOADS_DIR, 'doc_sec_5512c_id.png'),
    mime_type: 'image/png',
    file_size: 850000,
    page_count: 1,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  };

  // Pre-create placeholder mock files in uploads dir if not existing
  try {
    if (!fs.existsSync(sampleFile1.storage_path)) {
      fs.writeFileSync(sampleFile1.storage_path, '%PDF-1.4 Mock PrintEase Secure Document Content');
    }
    if (!fs.existsSync(sampleFile2.storage_path)) {
      fs.writeFileSync(sampleFile2.storage_path, '%PDF-1.4 Mock PrintEase Secure Assignment Content');
    }
    if (!fs.existsSync(sampleFile3.storage_path)) {
      fs.writeFileSync(sampleFile3.storage_path, 'MOCK_IMAGE_DATA');
    }
  } catch (e) {
    console.error('Error creating sample storage files:', e);
  }

  const sampleOrders: Order[] = [
    {
      id: 'ord_sample_01',
      order_id: 'PE48291',
      user_id: 'usr_student_01',
      customer_name: 'Aarav Patel',
      customer_email: 'student@college.edu',
      customer_phone: '+91 91234 56789',
      file_id: 'file_sample_01',
      file_name: 'Final_Year_Project_Report.pdf',
      file_size: 2450000,
      mime_type: 'application/pdf',
      page_count: 32,
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
      },
      price_breakdown: {
        page_count: 32,
        copies: 1,
        sheets_per_copy: 16,
        total_sheets: 16,
        rate_per_page: 1.0,
        printing_cost: 32.0,
        binding_cost: 30.0,
        lamination_cost: 0,
        stapling_cost: 0,
        urgency_cost: 0,
        delivery_cost: 0,
        discount: 0,
        final_total: 62.0,
        locked_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      price_locked: true,
      payment_status: 'PAID',
      payment_id: 'pay_sample_01',
      payment_method: 'UPI (GPay / PhonePe)',
      transaction_reference: 'TXN_PE_88492019',
      order_status: 'READY_FOR_PICKUP',
      pickup_code: '4829',
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      updated_at: new Date(Date.now() - 1800000).toISOString(),
      ready_at: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 'ord_sample_02',
      order_id: 'PE48292',
      user_id: 'usr_guest_99',
      customer_name: 'Priya Sen',
      customer_email: 'priya.sen@outlook.com',
      customer_phone: '+91 98301 23456',
      file_id: 'file_sample_02',
      file_name: 'Data_Structures_Assignment_3.pdf',
      file_size: 1120000,
      mime_type: 'application/pdf',
      page_count: 12,
      options: {
        paper_size: 'A4',
        color_type: 'COLOR',
        side_type: 'SINGLE',
        copies: 2,
        orientation: 'PORTRAIT',
        binding_type: 'STAPLE',
        lamination: false,
        urgency: 'URGENT',
        collection_type: 'PICKUP',
      },
      price_breakdown: {
        page_count: 12,
        copies: 2,
        sheets_per_copy: 12,
        total_sheets: 24,
        rate_per_page: 5.0,
        printing_cost: 120.0,
        binding_cost: 10.0,
        lamination_cost: 0,
        stapling_cost: 0,
        urgency_cost: 20.0,
        delivery_cost: 0,
        discount: 0,
        final_total: 150.0,
        locked_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      price_locked: true,
      payment_status: 'PAID',
      payment_id: 'pay_sample_02',
      payment_method: 'Debit Card (Visa)',
      transaction_reference: 'TXN_PE_77192038',
      order_status: 'PRINTING',
      pickup_code: '4892',
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      id: 'ord_sample_03',
      order_id: 'PE48293',
      user_id: 'usr_student_01',
      customer_name: 'Aarav Patel',
      customer_email: 'student@college.edu',
      customer_phone: '+91 91234 56789',
      file_id: 'file_sample_03',
      file_name: 'Campus_ID_and_Certificate.png',
      file_size: 850000,
      mime_type: 'image/png',
      page_count: 1,
      options: {
        paper_size: 'A4',
        color_type: 'COLOR',
        side_type: 'SINGLE',
        copies: 3,
        orientation: 'LANDSCAPE',
        binding_type: 'NONE',
        lamination: true,
        urgency: 'NORMAL',
        collection_type: 'PICKUP',
      },
      price_breakdown: {
        page_count: 1,
        copies: 3,
        sheets_per_copy: 1,
        total_sheets: 3,
        rate_per_page: 5.0,
        printing_cost: 15.0,
        binding_cost: 0,
        lamination_cost: 30.0,
        stapling_cost: 0,
        urgency_cost: 0,
        delivery_cost: 0,
        discount: 0,
        final_total: 45.0,
        locked_at: new Date(Date.now() - 86400000).toISOString(),
      },
      price_locked: true,
      payment_status: 'PAID',
      payment_id: 'pay_sample_03',
      payment_method: 'UPI (Paytm)',
      transaction_reference: 'TXN_PE_11029482',
      order_status: 'COMPLETED',
      pickup_code: '4823',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 82000000).toISOString(),
      ready_at: new Date(Date.now() - 84000000).toISOString(),
      completed_at: new Date(Date.now() - 82000000).toISOString(),
    },
  ];

  const sampleAuditLogs: AuditLog[] = [
    {
      id: 'log_01',
      user_name: 'Rajesh Sharma (Shop Owner)',
      user_role: 'admin',
      action: 'STATUS_UPDATE',
      order_id: 'PE48291',
      details: 'Marked order PE48291 as READY_FOR_PICKUP. Pickup notification dispatched to Aarav Patel.',
      ip_address: '127.0.0.1',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 'log_02',
      user_name: 'System Payment Gateway',
      user_role: 'system',
      action: 'PAYMENT_VERIFIED',
      order_id: 'PE48291',
      details: 'Cryptographic signature verified for amount ₹62.00 via UPI (TXN_PE_88492019). Price snapshot frozen.',
      ip_address: '127.0.0.1',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'log_03',
      user_name: 'Rajesh Sharma (Shop Owner)',
      user_role: 'admin',
      action: 'FILE_DOWNLOAD',
      order_id: 'PE48292',
      details: 'Authorized document download: Data_Structures_Assignment_3.pdf (12 pages, Color) sent to Xerox queue.',
      ip_address: '127.0.0.1',
      timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
  ];

  const sampleNotifications: NotificationItem[] = [
    {
      id: 'notif_01',
      recipient_role: 'customer',
      recipient_email: 'student@college.edu',
      order_id: 'PE48291',
      title: '🎉 Your PrintEase order is ready for pickup!',
      message: 'Order #PE48291 has been printed, bound, and verified. Visit the shop with Order ID: PE48291.',
      type: 'order_ready',
      read: false,
      created_at: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 'notif_02',
      recipient_role: 'owner',
      order_id: 'PE48292',
      title: '🖨️ New Paid Order Received: PE48292',
      message: 'Priya Sen paid ₹150 for 12 pages (Color, 2 copies, Stapled, Urgent). Ready to print.',
      type: 'order_new',
      read: true,
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
  ];

  const sampleShopStatus: ShopStatusInfo = {
    status: 'OPEN',
    mode: 'AUTO',
    opening_time: '09:00',
    closing_time: '20:00',
    message: 'Online printing orders are currently available.',
    accepting_orders: true,
    updated_at: new Date().toISOString(),
    updated_by: 'System',
    timezone: 'Asia/Kolkata',
  };

  const sampleWallets: Wallet[] = [
    {
      id: 'wlt_student_01',
      user_id: 'usr_student_01',
      balance: 250.0,
      currency: 'INR',
      status: 'active',
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'wlt_student_02',
      user_id: 'usr_student_02',
      balance: 350.0,
      currency: 'INR',
      status: 'active',
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const sampleWalletTransactions: WalletTransaction[] = [
    {
      id: 'wtx_01',
      wallet_id: 'wlt_student_01',
      user_id: 'usr_student_01',
      type: 'CREDIT',
      amount: 500,
      balance_before: 0,
      balance_after: 500,
      reference_id: 'WTOP_778102',
      payment_gateway_reference: 'pay_gw_topup_882',
      status: 'SUCCESS',
      description: 'Wallet Top-up via UPI',
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'wtx_02',
      wallet_id: 'wlt_student_01',
      user_id: 'usr_student_01',
      order_id: 'PE48291',
      type: 'DEBIT',
      amount: 80,
      balance_before: 500,
      balance_after: 420,
      reference_id: 'WDBT_192837',
      status: 'SUCCESS',
      description: 'PrintEase Order PE48291 Payment',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'wtx_03',
      wallet_id: 'wlt_student_01',
      user_id: 'usr_student_01',
      type: 'REFUND',
      amount: 50,
      balance_before: 420,
      balance_after: 470,
      reference_id: 'WRFD_881920',
      status: 'SUCCESS',
      description: 'Excess Paper Adjustment Refund',
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
  ];

  return {
    users: [adminUser, studentUser, vinayUser],
    pricing: defaultPricing,
    uploaded_files: [sampleFile1, sampleFile2, sampleFile3],
    orders: sampleOrders,
    payments: [],
    audit_logs: sampleAuditLogs,
    notifications: sampleNotifications,
    order_status_history: [
      {
        id: 'hist_01',
        order_id: 'PE48291',
        status: 'PAID',
        changed_by: 'Customer (Payment Gateway)',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'hist_02',
        order_id: 'PE48291',
        status: 'PRINTING',
        changed_by: 'Rajesh Sharma',
        timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
      },
      {
        id: 'hist_03',
        order_id: 'PE48291',
        status: 'READY_FOR_PICKUP',
        changed_by: 'Rajesh Sharma',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        note: 'Printed and spiral bound successfully.',
      },
    ],
    shop_status: sampleShopStatus,
    wallets: sampleWallets,
    wallet_transactions: sampleWalletTransactions,
  };
}

// Helper: Calculate effective shop status based on mode and time
export function getEffectiveShopStatus(config: ShopStatusInfo): ShopStatusInfo {
  if (config.mode === 'FORCE_OPEN') {
    return {
      ...config,
      status: 'OPEN',
      accepting_orders: true,
      message: 'Online printing orders are currently available.',
    };
  }
  if (config.mode === 'FORCE_CLOSED') {
    return {
      ...config,
      status: 'CLOSED',
      accepting_orders: false,
      message: 'PrintEase is currently closed. New orders and payments are temporarily unavailable.',
    };
  }

  // AUTO mode: check current time in Asia/Kolkata
  try {
    const istFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: config.timezone || 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = istFormatter.formatToParts(new Date());
    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '10', 10);
    const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '00', 10);
    const currentMinutes = hour * 60 + minute;

    const [openH, openM] = (config.opening_time || '09:00').split(':').map((s) => parseInt(s, 10));
    const [closeH, closeM] = (config.closing_time || '20:00').split(':').map((s) => parseInt(s, 10));
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    const isOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
    if (isOpen) {
      return {
        ...config,
        status: 'OPEN',
        accepting_orders: true,
        message: 'Online printing orders are currently available.',
      };
    } else {
      const openTimeFormatted =
        openH > 12 ? `${openH - 12}:${String(openM).padStart(2, '0')} PM` : `${openH}:${String(openM).padStart(2, '0')} AM`;
      return {
        ...config,
        status: 'CLOSED',
        accepting_orders: false,
        message: `PrintEase is currently closed. Opens at ${openTimeFormatted}.`,
      };
    }
  } catch {
    return {
      ...config,
      status: 'OPEN',
      accepting_orders: true,
      message: 'Online printing orders are currently available.',
    };
  }
}

class Database {
  private data: DatabaseSchema;
  private filePath: string;

  constructor() {
    this.filePath = DB_FILE;
    this.data = this.load();
    // Run initial 7-day retention purge on boot
    this.cleanupExpiredFiles();
    // Periodic purge every 30 minutes
    setInterval(() => {
      try {
        this.cleanupExpiredFiles();
      } catch (e) {
        console.error('[7-DAY PURGE ERROR]', e);
      }
    }, 30 * 60 * 1000);
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure new properties exist
        if (!parsed.shop_status) {
          parsed.shop_status = {
            status: 'OPEN',
            mode: 'AUTO',
            opening_time: '09:00',
            closing_time: '20:00',
            message: 'Online printing orders are currently available.',
            accepting_orders: true,
            updated_at: new Date().toISOString(),
            updated_by: 'System',
            timezone: 'Asia/Kolkata',
          };
        }
        if (!parsed.wallets) {
          parsed.wallets = [
            {
              id: 'wlt_student_01',
              user_id: 'usr_student_01',
              balance: 250.0,
              currency: 'INR',
              status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ];
        }
        if (!parsed.wallet_transactions) {
          parsed.wallet_transactions = [];
        }

        // Ensure all seed users (Vinay, Aarav, Rajesh) exist
        const initial = getInitialData();
        let updated = false;
        if (!Array.isArray(parsed.users)) {
          parsed.users = initial.users;
          updated = true;
        } else {
          for (const seedUser of initial.users) {
            const hasUser = parsed.users.some(
              (u: any) => u.email.toLowerCase() === seedUser.email.toLowerCase()
            );
            if (!hasUser) {
              parsed.users.push(seedUser);
              updated = true;
            }
          }
        }

        for (const seedWallet of (initial.wallets || [])) {
          if (!parsed.wallets.some((w: any) => w.user_id === seedWallet.user_id)) {
            parsed.wallets.push(seedWallet);
            updated = true;
          }
        }

        if (updated) {
          this.save(parsed);
        }

        return parsed;
      }
    } catch (err) {
      console.error('Error reading db.json, reinitializing default data:', err);
    }
    const initial = getInitialData();
    this.save(initial);
    return initial;
  }

  private save(dataToSave?: DatabaseSchema) {
    const payload = dataToSave || this.data;
    try {
      const tempPath = `${this.filePath}.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 6)}`;
      fs.writeFileSync(tempPath, JSON.stringify(payload, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.filePath);
    } catch (err) {
      console.error('Failed to atomically write DB:', err);
    }
  }

  // --- Atomic Sequential Order ID Generator ---
  public getNextAtomicOrderId(): string {
    const existingSet = new Set(this.data.orders.map((o) => o.order_id));
    let counter = this.data.order_sequence_counter || 48293;
    let candidate = '';
    do {
      counter++;
      candidate = `PE${counter}`;
    } while (existingSet.has(candidate));

    this.data.order_sequence_counter = counter;
    this.save();
    return candidate;
  }

  // --- Users ---
  public getUsers() {
    return this.data.users;
  }

  public findUserByEmail(email: string) {
    const lower = email.trim().toLowerCase();
    return this.data.users.find((u) => u.email.toLowerCase() === lower);
  }

  public findUserByEmailOrPhone(identifier: string) {
    const clean = identifier.trim().toLowerCase();
    const digits = identifier.replace(/\D/g, '');
    return this.data.users.find((u) => {
      if (u.email && u.email.toLowerCase() === clean) return true;
      if (u.phone) {
        if (u.phone === identifier.trim()) return true;
        const uDigits = u.phone.replace(/\D/g, '');
        if (digits.length >= 7 && (uDigits.endsWith(digits) || digits.endsWith(uDigits))) return true;
      }
      return false;
    });
  }

  public findUserById(id: string) {
    return this.data.users.find((u) => u.id === id);
  }

  public createUser(user: User & { password_hash: string; salt: string }) {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public updateUserPassword(userId: string, password_hash: string, salt: string) {
    const user = this.findUserById(userId);
    if (user) {
      user.password_hash = password_hash;
      user.salt = salt;
      this.save();
      return true;
    }
    return false;
  }

  public updateUserRole(userId: string, role: 'customer' | 'admin' | 'staff') {
    const user = this.findUserById(userId);
    if (user) {
      user.role = role;
      this.save();
      return true;
    }
    return false;
  }

  // --- Pricing ---
  public getPricing(): PricingSettings {
    return this.data.pricing || defaultPricing;
  }

  public updatePricing(newPricing: Partial<PricingSettings>, updatedBy: string, ip: string) {
    this.data.pricing = { ...this.data.pricing, ...newPricing };
    this.addAuditLog({
      user_name: updatedBy,
      user_role: 'admin',
      action: 'PRICING_UPDATED',
      details: `Owner modified pricing settings. Note: All existing locked orders maintain their frozen price.`,
      ip_address: ip,
    });
    this.save();
    return this.data.pricing;
  }

  // --- Files (7-Day Retention Policy) ---
  public getFileById(fileId: string) {
    this.cleanupExpiredFiles();
    return this.data.uploaded_files.find((f) => f.id === fileId);
  }

  public addUploadedFile(fileRecord: UploadedFileRecord) {
    const now = Date.now();
    const retentionChoice: RetentionChoice = fileRecord.retention_choice || 'PERMANENT';
    
    let expiresAt: string | undefined;
    if (retentionChoice === 'PERMANENT') {
      expiresAt = undefined; // Stored permanently at user choice
    } else {
      expiresAt = undefined; // Purged on order completion / handover
    }

    const recordWithRetention: UploadedFileRecord = {
      ...fileRecord,
      retention_choice: retentionChoice,
      storage_place: fileRecord.storage_place || 'PrintEase Secure Server Vault (storage/private/uploads/)',
      created_at: fileRecord.created_at || new Date(now).toISOString(),
      expires_at: expiresAt,
      is_deleted: false,
    };

    this.data.uploaded_files.push(recordWithRetention);
    this.save();
    return recordWithRetention;
  }

  /**
   * User-Choice Manual Document Deletion
   * Allows customer to permanently destroy and delete their document from the server vault
   */
  public deleteFileByUser(fileId: string, actor: string, ip: string): { success: boolean; message: string } {
    const file = this.data.uploaded_files.find((f) => f.id === fileId);
    if (!file) {
      return { success: false, message: 'Document not found or already deleted.' };
    }

    if (file.storage_path && fs.existsSync(file.storage_path)) {
      try {
        fs.unlinkSync(file.storage_path);
      } catch (err) {
        console.warn(`[USER DELETE] Could not unlink ${file.storage_path}:`, err);
      }
    }

    file.is_deleted = true;
    file.deleted_at = new Date().toISOString();

    for (const order of this.data.orders) {
      if (order.file_id === file.id) {
        order.file_deleted = true;
        order.file_deleted_at = new Date().toISOString();
      }
    }

    this.save();
    this.addAuditLog({
      user_name: actor,
      user_role: 'customer',
      action: 'USER_DOCUMENT_DELETED',
      details: `Customer explicitly deleted document "${file.original_name}" from ${file.storage_place || 'server vault'}. Storage reclaimed.`,
      ip_address: ip,
    });

    return {
      success: true,
      message: `Document "${file.original_name}" was permanently deleted from server storage.`,
    };
  }

  /**
   * Update Storage Retention Preference for File & Order (Permanent vs 7-Days)
   */
  public updateFileRetention(fileId: string, choice: RetentionChoice, actor: string, ip: string) {
    const file = this.data.uploaded_files.find((f) => f.id === fileId);
    if (!file) return null;

    file.retention_choice = choice;
    if (choice === 'PERMANENT') {
      file.expires_at = undefined;
    } else if (choice === 'SEVEN_DAYS') {
      file.expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    for (const order of this.data.orders) {
      if (order.file_id === file.id) {
        order.retention_choice = choice;
        order.file_expires_at = file.expires_at;
      }
    }

    this.save();
    this.addAuditLog({
      user_name: actor,
      user_role: 'customer',
      action: 'STORAGE_RETENTION_UPDATED',
      details: `Document "${file.original_name}" storage policy changed to ${choice}.`,
      ip_address: ip,
    });

    return file;
  }

  /**
   * Automatic 7-Day File Deletion & Privacy Purge
   * Scans and permanently unlinks files older than 7 days from storage disk.
   */
  public cleanupExpiredFiles(): { purgedCount: number; purgedFiles: string[] } {
    const now = Date.now();
    let purgedCount = 0;
    const purgedFiles: string[] = [];

    for (const file of this.data.uploaded_files) {
      if (!file.is_deleted && file.expires_at) {
        const expireTime = new Date(file.expires_at).getTime();
        if (now >= expireTime) {
          // Permanently unlink from disk
          if (file.storage_path && fs.existsSync(file.storage_path)) {
            try {
              fs.unlinkSync(file.storage_path);
            } catch (err) {
              console.warn(`[7-DAY RETENTION] Could not unlink ${file.storage_path}:`, err);
            }
          }
          file.is_deleted = true;
          file.deleted_at = new Date(now).toISOString();
          purgedCount++;
          purgedFiles.push(file.original_name);

          // Update corresponding order records
          for (const order of this.data.orders) {
            if (order.file_id === file.id) {
              order.file_deleted = true;
              order.file_deleted_at = new Date(now).toISOString();
            }
          }
        }
      }
    }

    if (purgedCount > 0) {
      this.save();
      this.addAuditLog({
        user_name: 'Automated 7-Day Privacy Daemon',
        user_role: 'system',
        action: 'FILE_AUTO_PURGE',
        details: `Automatically deleted ${purgedCount} expired documents after 7 days retention (${purgedFiles.join(', ')}). Private storage reclaimed.`,
        ip_address: '127.0.0.1',
      });
    }

    return { purgedCount, purgedFiles };
  }

  // --- Orders ---
  public getOrders() {
    this.cleanupExpiredFiles();
    return this.data.orders;
  }

  public getOrderById(idOrOrderId: string) {
    this.cleanupExpiredFiles();
    return this.data.orders.find(
      (o) => o.id === idOrOrderId || o.order_id.toLowerCase() === idOrOrderId.toLowerCase()
    );
  }

  public getOrdersForUser(userId?: string, userEmail?: string) {
    this.cleanupExpiredFiles();
    return this.data.orders.filter((o) => {
      if (userId && o.user_id === userId) return true;
      if (userEmail && o.customer_email.toLowerCase() === userEmail.toLowerCase()) return true;
      return false;
    });
  }

  public createOrder(order: Order) {
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const retentionChoice: RetentionChoice = order.retention_choice || order.options?.retention_choice || 'SEVEN_DAYS';

    let expiresAt: string | undefined;
    if (retentionChoice === 'PERMANENT') {
      expiresAt = undefined;
    } else if (retentionChoice === 'IMMEDIATE_AFTER_PICKUP') {
      expiresAt = undefined;
    } else {
      expiresAt = order.file_expires_at || new Date(now + SEVEN_DAYS_MS).toISOString();
    }

    const orderWithRetention: Order = {
      ...order,
      retention_choice: retentionChoice,
      storage_place: order.storage_place || 'PrintEase Secure Server Vault (storage/private/uploads/)',
      file_expires_at: expiresAt,
      file_deleted: false,
    };
    this.data.orders.unshift(orderWithRetention);
    this.save();
    return orderWithRetention;
  }

  public updateOrder(id: string, updates: Partial<Order>) {
    const idx = this.data.orders.findIndex((o) => o.id === id || o.order_id === id);
    if (idx === -1) return null;
    this.data.orders[idx] = {
      ...this.data.orders[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.save();
    return this.data.orders[idx];
  }

  // --- Status change transaction ---
  public updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    changedBy: string,
    ip: string,
    note?: string
  ): Order | null {
    const order = this.getOrderById(orderId);
    if (!order) return null;

    const previousStatus = order.order_status;
    order.order_status = newStatus;
    order.updated_at = new Date().toISOString();

    if (newStatus === 'READY_FOR_PICKUP') {
      order.ready_at = new Date().toISOString();
    } else if (newStatus === 'COMPLETED') {
      order.completed_at = new Date().toISOString();
      // If customer chose IMMEDIATE_AFTER_PICKUP, permanently delete file upon pickup!
      if (order.retention_choice === 'IMMEDIATE_AFTER_PICKUP') {
        const file = this.getFileById(order.file_id);
        if (file && !file.is_deleted) {
          if (file.storage_path && fs.existsSync(file.storage_path)) {
            try {
              fs.unlinkSync(file.storage_path);
            } catch (err) {}
          }
          file.is_deleted = true;
          file.deleted_at = new Date().toISOString();
          order.file_deleted = true;
          order.file_deleted_at = new Date().toISOString();
          this.addAuditLog({
            user_name: 'Pickup Privacy Daemon',
            user_role: 'system',
            action: 'PICKUP_FILE_PURGED',
            details: `Document "${file.original_name}" automatically deleted immediately after pickup handover as requested by user.`,
            ip_address: ip,
          });
        }
      }
    }

    // Record history
    this.data.order_status_history.unshift({
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      order_id: order.order_id,
      status: newStatus,
      changed_by: changedBy,
      timestamp: new Date().toISOString(),
      note,
    });

    // Record Audit Log
    this.addAuditLog({
      user_name: changedBy,
      user_role: 'admin',
      action: 'STATUS_UPDATE',
      order_id: order.order_id,
      details: `Status changed from ${previousStatus} to ${newStatus}.${note ? ` Note: ${note}` : ''}`,
      ip_address: ip,
    });

    // Create Notification
    if (newStatus === 'READY_FOR_PICKUP') {
      this.createNotification({
        recipient_role: 'customer',
        recipient_email: order.customer_email,
        order_id: order.order_id,
        title: '🎉 Your PrintEase order is ready for pickup!',
        message: `Order #${order.order_id} has been printed and is ready. Visit PrintEase shop with your Order ID.`,
        type: 'order_ready',
      });
    } else if (newStatus === 'COMPLETED') {
      this.createNotification({
        recipient_role: 'customer',
        recipient_email: order.customer_email,
        order_id: order.order_id,
        title: '✓ Order Completed',
        message: `Order #${order.order_id} has been handed over. Thank you for choosing PrintEase!`,
        type: 'order_completed',
      });
    } else if (newStatus === 'PRINTING') {
      this.createNotification({
        recipient_role: 'customer',
        recipient_email: order.customer_email,
        order_id: order.order_id,
        title: '🖨️ Printing in Progress',
        message: `Your document is currently being printed on the Xerox machine.`,
        type: 'order_printing',
      });
    }

    this.save();
    return order;
  }

  // --- Payments ---
  public addPayment(payment: PaymentTransaction) {
    this.data.payments.unshift(payment);
    this.save();
    return payment;
  }

  // --- Audit Logs ---
  public getAuditLogs(limit = 100) {
    return this.data.audit_logs.slice(0, limit);
  }

  public addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>) {
    const log: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.data.audit_logs.unshift(log);
    // Keep max 500 logs
    if (this.data.audit_logs.length > 500) {
      this.data.audit_logs = this.data.audit_logs.slice(0, 500);
    }
    this.save();
    return log;
  }

  // --- Notifications ---
  public getNotifications(role?: string, email?: string) {
    const cleanEmail = email?.trim().toLowerCase();
    return this.data.notifications.filter((n) => {
      if (role === 'admin' || role === 'owner') {
        return n.recipient_role === 'owner' || n.recipient_role === 'all';
      }
      if (cleanEmail) {
        if (n.recipient_email) {
          return n.recipient_email.toLowerCase() === cleanEmail;
        }
        return n.recipient_role === 'all';
      }
      return false;
    });
  }

  public createNotification(item: Omit<NotificationItem, 'id' | 'read' | 'created_at'>) {
    const notif: NotificationItem = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      read: false,
      created_at: new Date().toISOString(),
      ...item,
    };
    this.data.notifications.unshift(notif);
    this.save();
    return notif;
  }

  public markNotificationRead(id: string) {
    const notif = this.data.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      this.save();
    }
    return notif;
  }

  // --- Shop Open / Closed Status ---
  public getShopStatus(): ShopStatusInfo {
    if (!this.data.shop_status) {
      this.data.shop_status = {
        status: 'OPEN',
        mode: 'AUTO',
        opening_time: '09:00',
        closing_time: '20:00',
        message: 'Online printing orders are currently available.',
        accepting_orders: true,
        updated_at: new Date().toISOString(),
        updated_by: 'System',
        timezone: 'Asia/Kolkata',
      };
    }
    return getEffectiveShopStatus(this.data.shop_status);
  }

  public updateShopStatus(update: Partial<ShopStatusInfo>, updatedBy = 'Shop Owner'): ShopStatusInfo {
    if (!this.data.shop_status) {
      this.data.shop_status = {
        status: 'OPEN',
        mode: 'AUTO',
        opening_time: '09:00',
        closing_time: '20:00',
        message: 'Online printing orders are currently available.',
        accepting_orders: true,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy,
        timezone: 'Asia/Kolkata',
      };
    }
    this.data.shop_status = {
      ...this.data.shop_status,
      ...update,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy,
    };
    this.save();
    return this.getShopStatus();
  }

  // --- User Wallet System ---
  public getWalletByUserId(userId: string): Wallet {
    if (!this.data.wallets) this.data.wallets = [];
    let wallet = this.data.wallets.find((w) => w.user_id === userId);
    if (!wallet) {
      wallet = {
        id: `wlt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        user_id: userId,
        balance: 250.0,
        currency: 'INR',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.data.wallets.push(wallet);
      this.save();
    }
    return wallet;
  }

  public getWalletTransactions(userId: string): WalletTransaction[] {
    if (!this.data.wallet_transactions) this.data.wallet_transactions = [];
    return this.data.wallet_transactions
      .filter((t) => t.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public creditWallet(
    userId: string,
    amount: number,
    referenceId: string,
    description: string,
    gatewayRef?: string
  ): { wallet: Wallet; transaction: WalletTransaction } {
    const wallet = this.getWalletByUserId(userId);
    const balanceBefore = Number(wallet.balance);
    const balanceAfter = Math.round((balanceBefore + amount) * 100) / 100;
    wallet.balance = balanceAfter;
    wallet.updated_at = new Date().toISOString();

    const tx: WalletTransaction = {
      id: `wtx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      wallet_id: wallet.id,
      user_id: userId,
      type: 'CREDIT',
      amount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      reference_id: referenceId,
      payment_gateway_reference: gatewayRef,
      status: 'SUCCESS',
      description,
      created_at: new Date().toISOString(),
    };

    if (!this.data.wallet_transactions) this.data.wallet_transactions = [];
    this.data.wallet_transactions.unshift(tx);
    this.save();
    return { wallet, transaction: tx };
  }

  public debitWalletForOrder(
    userId: string,
    orderId: string,
    amount: number,
    description: string
  ): { success: boolean; error?: string; wallet?: Wallet; transaction?: WalletTransaction } {
    // Check shop status (backend authority)
    const currentStatus = this.getShopStatus();
    if (currentStatus.status !== 'OPEN') {
      return {
        success: false,
        error: 'SHOP_CLOSED: New printing orders and payments are currently paused because the shop is closed.',
      };
    }

    const wallet = this.getWalletByUserId(userId);
    const currentBalance = Number(wallet.balance);
    if (currentBalance < amount) {
      return {
        success: false,
        error: `INSUFFICIENT_FUNDS: Available wallet balance is ₹${currentBalance.toFixed(2)}, but order total is ₹${amount.toFixed(2)}.`,
      };
    }

    const balanceBefore = currentBalance;
    const balanceAfter = Math.round((balanceBefore - amount) * 100) / 100;
    wallet.balance = balanceAfter;
    wallet.updated_at = new Date().toISOString();

    const tx: WalletTransaction = {
      id: `wtx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      wallet_id: wallet.id,
      user_id: userId,
      order_id: orderId,
      type: 'DEBIT',
      amount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      reference_id: `WTX_${orderId}_${Date.now()}`,
      status: 'SUCCESS',
      description,
      created_at: new Date().toISOString(),
    };

    if (!this.data.wallet_transactions) this.data.wallet_transactions = [];
    this.data.wallet_transactions.unshift(tx);
    this.save();
    return { success: true, wallet, transaction: tx };
  }

  public refundWallet(
    userId: string,
    orderId: string,
    amount: number,
    description: string
  ): { wallet: Wallet; transaction: WalletTransaction } {
    const wallet = this.getWalletByUserId(userId);
    const balanceBefore = Number(wallet.balance);
    const balanceAfter = Math.round((balanceBefore + amount) * 100) / 100;
    wallet.balance = balanceAfter;
    wallet.updated_at = new Date().toISOString();

    const tx: WalletTransaction = {
      id: `wtx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      wallet_id: wallet.id,
      user_id: userId,
      order_id: orderId,
      type: 'REFUND',
      amount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      reference_id: `WRFD_${orderId || Date.now()}`,
      status: 'SUCCESS',
      description,
      created_at: new Date().toISOString(),
    };

    if (!this.data.wallet_transactions) this.data.wallet_transactions = [];
    this.data.wallet_transactions.unshift(tx);
    this.save();
    return { wallet, transaction: tx };
  }

  // --- Stats / Reports ---
  public getDashboardStats(): DashboardStats {
    const orders = this.data.orders;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    let today_orders = 0;
    let today_revenue = 0;
    let weekly_revenue = 0;
    let monthly_revenue = 0;
    let pending_orders = 0;
    let paid_orders = 0;
    let printing_orders = 0;
    let ready_orders = 0;
    let completed_orders = 0;
    let bw_count = 0;
    let color_count = 0;
    let pickup_count = 0;
    let delivery_count = 0;

    let online_payments_revenue = 0;
    let wallet_payments_revenue = 0;
    let online_payments_count = 0;
    let wallet_payments_count = 0;
    let refunds_amount = 0;

    const sevenDaysAgo = Date.now() - 7 * 86400000;
    const thirtyDaysAgo = Date.now() - 30 * 86400000;

    for (const o of orders) {
      const orderTime = new Date(o.created_at).getTime();

      if (o.payment_status === 'PAID') {
        const orderTotal = o.price_breakdown.final_total;
        if (orderTime >= startOfToday) {
          today_orders++;
          today_revenue += orderTotal;
        }
        if (orderTime >= sevenDaysAgo) {
          weekly_revenue += orderTotal;
        }
        if (orderTime >= thirtyDaysAgo) {
          monthly_revenue += orderTotal;
        }

        if (o.payment_method?.toLowerCase().includes('wallet')) {
          wallet_payments_revenue += orderTotal;
          wallet_payments_count++;
        } else {
          online_payments_revenue += orderTotal;
          online_payments_count++;
        }
      }

      if (o.payment_status === 'REFUNDED') {
        refunds_amount += o.price_breakdown.final_total;
      }

      if (o.order_status === 'PENDING_PAYMENT') pending_orders++;
      if (o.order_status === 'PAID' || o.order_status === 'RECEIVED') paid_orders++;
      if (o.order_status === 'PRINTING' || o.order_status === 'BINDING') printing_orders++;
      if (o.order_status === 'READY_FOR_PICKUP') ready_orders++;
      if (o.order_status === 'COMPLETED') completed_orders++;

      if (o.options.color_type === 'COLOR') color_count++;
      else bw_count++;

      if (o.options.collection_type === 'DELIVERY') delivery_count++;
      else pickup_count++;
    }

    return {
      today_orders,
      today_revenue: Math.round(today_revenue * 100) / 100,
      weekly_revenue: Math.round(weekly_revenue * 100) / 100,
      monthly_revenue: Math.round(monthly_revenue * 100) / 100,
      pending_orders,
      paid_orders,
      printing_orders,
      ready_orders,
      completed_orders,
      total_customers: this.data.users.length,
      bw_count,
      color_count,
      pickup_count,
      delivery_count,
      online_payments_revenue: Math.round(online_payments_revenue * 100) / 100,
      wallet_payments_revenue: Math.round(wallet_payments_revenue * 100) / 100,
      online_payments_count,
      wallet_payments_count,
      refunds_amount: Math.round(refunds_amount * 100) / 100,
    };
  }

  // --- Owner Payment & Bank Vault ---
  public getOwnerPaymentSettings(): OwnerPaymentSettingsData {
    if (!this.data.owner_payment_settings) {
      this.data.owner_payment_settings = {
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
    }
    return this.data.owner_payment_settings;
  }

  public updateOwnerPaymentSettings(
    update: Partial<OwnerPaymentSettingsData>,
    updatedBy = 'Shop Owner'
  ): OwnerPaymentSettingsData {
    const current = this.getOwnerPaymentSettings();
    this.data.owner_payment_settings = {
      ...current,
      ...update,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy,
    };
    this.save();
    return this.data.owner_payment_settings;
  }

  public resetDemoData() {
    this.data = getInitialData();
    this.save();
    return true;
  }
}

export const db = new Database();
