/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Navbar,
  PortalMode,
  CustomerPage,
  ShopkeeperTab,
} from './components/Navbar';
import { ShopStatusBanner } from './components/ShopStatusBanner';
import { HeroHeader } from './components/HeroHeader';
import { WorkflowBanner } from './components/WorkflowBanner';
import { UploadAndConfigure } from './components/UploadAndConfigure';
import { OrderReviewModal } from './components/OrderReviewModal';
import { PaymentModal } from './components/PaymentModal';
import { PaymentSuccessModal } from './components/PaymentSuccessModal';
import { ReceiptModal } from './components/ReceiptModal';
import { PickupAlertModal } from './components/PickupAlertModal';
import { OrderTrackingView } from './components/OrderTrackingView';
import { CustomerOrdersView } from './components/CustomerOrdersView';
import { StoredFilesView } from './components/StoredFilesView';
import { MyWalletView } from './components/MyWalletView';
import { OwnerDashboard } from './components/OwnerDashboard';
import { PickupKioskView } from './components/PickupKioskView';
import { SecurityCommandCenter } from './components/SecurityCommandCenter';
import { AnalyticsDashboardView } from './components/AnalyticsDashboardView';
import { AuthModal } from './components/AuthModal';
import { ShopkeeperAccessModal } from './components/ShopkeeperAccessModal';
import { ShopStatusControlModal } from './components/ShopStatusControlModal';
import { PhpReferenceModal } from './components/PhpReferenceModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import {
  Order,
  PricingSettings,
  User,
  NotificationItem,
  ShopStatusInfo,
  Wallet,
  WalletTransaction,
} from './types/printease';
import {
  getClientStoredOrders,
  saveClientStoredOrders,
  getClientStoredShopStatus,
  saveClientStoredShopStatus,
  getClientStoredWallet,
  saveClientStoredWallet,
  getClientStoredWalletTxs,
  saveClientStoredWalletTxs,
  DEFAULT_PRICING,
} from './data/mockData';
import { playOrderAlertSound } from './utils/audio';
import {
  Home,
  Upload,
  BookOpen,
  Bell,
  User as UserIcon,
  ShieldCheck,
  Printer,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  PackageCheck,
  ShieldAlert,
  Store,
  ArrowLeft,
  FileCode,
  Wallet as WalletIcon,
} from 'lucide-react';

// Helper: Local storage for acknowledged pickup alerts so they NEVER repeat
const getStoredAcknowledgedPickups = (): Set<string> => {
  try {
    const raw = localStorage.getItem('printease_acknowledged_pickups');
    const list = raw ? JSON.parse(raw) : ['PE48291', 'PE48292', 'PE48293']; // Seed default sample orders as pre-acknowledged
    return new Set<string>(list);
  } catch {
    return new Set<string>(['PE48291', 'PE48292', 'PE48293']);
  }
};

const saveStoredAcknowledgedPickup = (orderId: string) => {
  try {
    const set = getStoredAcknowledgedPickups();
    set.add(orderId);
    localStorage.setItem('printease_acknowledged_pickups', JSON.stringify(Array.from(set)));
  } catch {}
};

// Helper: Local storage for orders created by THIS customer browser
const getMyPlacedOrderIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem('printease_my_order_ids');
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set<string>();
  }
};

const registerMyPlacedOrder = (orderId: string) => {
  try {
    const set = getMyPlacedOrderIds();
    set.add(orderId);
    localStorage.setItem('printease_my_order_ids', JSON.stringify(Array.from(set)));
  } catch {}
};

export default function App() {
  // Main Portal: 'customer' (Student) vs 'shopkeeper' (Owner)
  const [portal, setPortal] = useState<PortalMode>(() => {
    const saved = localStorage.getItem('printease_portal_mode');
    return saved === 'shopkeeper' ? 'shopkeeper' : 'customer';
  });

  // Customer sub-screens
  const [customerPage, setCustomerPage] = useState<CustomerPage>('upload');
  const [trackingOrderId, setTrackingOrderId] = useState<string>('');

  // Shopkeeper sub-tabs
  const [shopkeeperTab, setShopkeeperTab] = useState<ShopkeeperTab>('queue');

  // Shop Open / Closed Status with client storage fallback
  const [shopStatus, setShopStatus] = useState<ShopStatusInfo>(getClientStoredShopStatus);

  // User Wallet & Transactions with client storage fallback
  const [wallet, setWallet] = useState<Wallet>(getClientStoredWallet);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>(getClientStoredWalletTxs);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pricing, setPricing] = useState<PricingSettings>(DEFAULT_PRICING);
  const [orders, setOrders] = useState<Order[]>(getClientStoredOrders);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Modals
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [pickupAlertOrder, setPickupAlertOrder] = useState<Order | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showShopkeeperModal, setShowShopkeeperModal] = useState(false);
  const [showShopStatusModal, setShowShopStatusModal] = useState(false);
  const [showPhpModal, setShowPhpModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // 1. Fetch Shop Status
  const fetchShopStatus = async () => {
    try {
      const res = await fetch('/api/shop-status');
      if (res.ok) {
        const data = await res.json();
        if (data && data.status) {
          setShopStatus(data);
          saveClientStoredShopStatus(data);
        }
      }
    } catch (e) {
      console.warn('Shop status offline mode active:', e);
    }
  };

  // 2. Fetch Wallet
  const fetchWallet = async () => {
    try {
      const token = localStorage.getItem('printease_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const userIdParam = currentUser?.id || 'usr_student_01';
      const res = await fetch(`/api/wallet?user_id=${encodeURIComponent(userIdParam)}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.wallet) {
          setWallet(data.wallet);
          saveClientStoredWallet(data.wallet);
          if (data.transactions) {
            setWalletTransactions(data.transactions);
            saveClientStoredWalletTxs(data.transactions);
          }
        }
      }
    } catch (e) {
      console.warn('Wallet offline mode active:', e);
    }
  };

  // 3. Initial Load: Pricing, Current User, Shop Status & Wallet
  useEffect(() => {
    // Load pricing
    fetch('/api/pricing')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.pricing) setPricing(d.pricing);
      })
      .catch((e) => console.warn('Pricing fetch error:', e));

    fetchShopStatus();
    fetchWallet();

    // Check saved session
    const token = localStorage.getItem('printease_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.user) {
            setCurrentUser(d.user);
            if (d.user.role === 'admin' || d.user.role === 'staff') {
              setPortal('shopkeeper');
            }
          }
        })
        .catch(() => localStorage.removeItem('printease_token'));
    }
  }, []);

  // Save portal preference
  const handleSwitchPortal = (newPortal: PortalMode) => {
    setPortal(newPortal);
    localStorage.setItem('printease_portal_mode', newPortal);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 4. Fetch Orders & Notifications with smart alert filtering
  const fetchOrdersAndNotifications = async () => {
    try {
      const token = localStorage.getItem('printease_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // In shopkeeper portal, load all orders; in customer portal load by email/session
      const emailParam = currentUser?.email || '';
      const isPrivileged = portal === 'shopkeeper' || currentUser?.role === 'admin';
      const orderUrl = isPrivileged
        ? '/api/orders?role=owner'
        : `/api/orders?email=${encodeURIComponent(emailParam)}`;

      const roleParam = portal === 'shopkeeper' ? 'owner' : 'customer';

      const [ordersRes, notifsRes] = await Promise.all([
        fetch(orderUrl, { headers }).catch(() => null),
        fetch(`/api/notifications?role=${roleParam}&email=${encodeURIComponent(emailParam)}`).catch(() => null),
      ]);

      if (ordersRes && ordersRes.ok) {
        const ordersData = await ordersRes.json();
        if (ordersData.orders && ordersData.orders.length > 0) {
          setOrders(ordersData.orders);
          saveClientStoredOrders(ordersData.orders);

          // SMART NON-INTRUSIVE PICKUP ALERT:
          if (portal === 'customer') {
            const acknowledged = getStoredAcknowledgedPickups();
            const myPlaced = getMyPlacedOrderIds();

            for (const ord of ordersData.orders) {
              if (
                ord.order_status === 'READY_FOR_PICKUP' &&
                myPlaced.has(ord.order_id) &&
                !acknowledged.has(ord.order_id)
              ) {
                setPickupAlertOrder(ord);
                saveStoredAcknowledgedPickup(ord.order_id);
                playOrderAlertSound();
                break;
              }
            }
          }
        }
      }

      if (notifsRes && notifsRes.ok) {
        const notifsData = await notifsRes.json();
        if (notifsData.notifications) {
          setNotifications(notifsData.notifications);
        }
      }
    } catch (err) {
      console.warn('Poll error (offline mode active):', err);
    }
  };

  // Regular Polling: orders, notifications, shop status, wallet
  useEffect(() => {
    fetchOrdersAndNotifications();
    fetchShopStatus();

    const timer = setInterval(() => {
      fetchOrdersAndNotifications();
      fetchShopStatus();
    }, 10000);
    return () => clearInterval(timer);
  }, [portal, currentUser?.email]);

  // Auth handlers
  const handleAuthSuccess = (user: User, token: string) => {
    localStorage.setItem('printease_token', token);
    setCurrentUser(user);
    if (user.role === 'admin' || user.role === 'staff') {
      handleSwitchPortal('shopkeeper');
    }
    fetchOrdersAndNotifications();
    fetchWallet();
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('printease_token');
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {}
    }
    localStorage.removeItem('printease_token');
    setCurrentUser(null);
    handleSwitchPortal('customer');
    fetchOrdersAndNotifications();
    fetchWallet();
  };

  // Update Shop Status Handler
  const handleUpdateShopStatus = async (updated: Partial<ShopStatusInfo>) => {
    try {
      const token = localStorage.getItem('printease_token');
      const res = await fetch('/api/shop-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.shop_status) {
          setShopStatus(data.shop_status);
          saveClientStoredShopStatus(data.shop_status);
          return;
        }
      }
    } catch {}

    // Offline / GitHub Pages local update
    setShopStatus((prev) => {
      const next = { ...prev, ...updated, last_updated: new Date().toISOString() };
      saveClientStoredShopStatus(next);
      return next;
    });
  };

  // Pricing update handler for owner
  const handleUpdatePricing = async (newPricing: Partial<PricingSettings>) => {
    try {
      const token = localStorage.getItem('printease_token');
      const res = await fetch('/api/pricing', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(newPricing),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.pricing) {
          setPricing(data.pricing);
          return;
        }
      }
    } catch {}

    setPricing((prev) => ({ ...prev, ...newPricing }));
  };

  // Mark notification read
  const handleMarkNotificationRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#FFF5E1] text-[#5A3C0B] flex flex-col antialiased selection:bg-[#5A3C0B] selection:text-[#FFF5E1]">
      {/* Dynamic Navbar: Strict separation between Customer & Shopkeeper */}
      <Navbar
        portal={portal}
        customerPage={customerPage}
        shopkeeperTab={shopkeeperTab}
        onSelectCustomerPage={(p) => {
          setCustomerPage(p);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSelectShopkeeperTab={(t) => {
          setShopkeeperTab(t);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenShopkeeperLogin={() => setShowShopkeeperModal(true)}
        onExitToCustomer={() => handleSwitchPortal('customer')}
        currentUser={currentUser}
        onOpenAuth={() => setShowAuth(true)}
        onLogout={handleLogout}
        onOpenPhpSpecs={() => setShowPhpModal(true)}
        unreadCount={unreadCount}
        onOpenNotifications={() => setShowNotifications(true)}
        notifications={notifications}
        shopStatus={shopStatus}
        walletBalance={wallet ? Number(wallet.balance) : 250}
        onOpenShopStatusControl={() => setShowShopStatusModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 sm:pb-12">
        {/* ============================================================== */}
        {/* 1. CUSTOMER PORTAL (Student Flow - Zero Admin Clutter)          */}
        {/* ============================================================== */}
        {portal === 'customer' && (
          <>
            {/* 1. UPSIDE: LIVE SHOP STATUS OBSERVER (OPEN / CLOSED) */}
            <ShopStatusBanner
              shopStatus={shopStatus}
              onOpenOwnerControl={() => setShowShopStatusModal(true)}
              isOwner={currentUser?.role === 'admin' || currentUser?.role === 'staff'}
            />

            {/* 2. Brand Hero Header with "Upload Document & Print", "Track Order ID" and "Stored Files" */}
            <HeroHeader
              shopStatus={shopStatus}
              onStartUpload={() => {
                setCustomerPage('upload');
                const uploaderEl = document.getElementById('upload-section');
                if (uploaderEl) {
                  uploaderEl.scrollIntoView({ behavior: 'smooth' });
                } else {
                  window.scrollTo({ top: 380, behavior: 'smooth' });
                }
              }}
              onTrackOrder={() => {
                setCustomerPage('track');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenStoredFiles={() => {
                setCustomerPage('files');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* Page 1: Upload & Configure with Auto-Price Freeze */}
            {customerPage === 'upload' && (
              <UploadAndConfigure
                pricing={pricing}
                currentUser={currentUser}
                shopStatus={shopStatus}
                onOrderCreated={(lockedOrder) => {
                  registerMyPlacedOrder(lockedOrder.order_id);
                  setReviewOrder(lockedOrder);
                }}
                onOpenAuth={() => setShowAuth(true)}
              />
            )}

            {/* Page 2: Stored Files & Documents (Stored Separately) */}
            {customerPage === 'files' && (
              <StoredFilesView
                orders={orders}
                onStartPrintNew={() => {
                  setCustomerPage('upload');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onPrintExistingFile={(_fileName, _pageCount, _fileId) => {
                  setCustomerPage('upload');
                  window.scrollTo({ top: 380, behavior: 'smooth' });
                }}
                onRefreshOrders={fetchOrdersAndNotifications}
              />
            )}

            {/* Page 3: Track Order with Atomic Order ID */}
            {customerPage === 'track' && (
              <OrderTrackingView
                initialOrderId={trackingOrderId}
                orders={orders}
                onViewReceipt={(ord) => setReceiptOrder(ord)}
                onBackToHome={() => {
                  setCustomerPage('upload');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {/* Page 3: Digital Campus Wallet (Requirement 81) */}
            {customerPage === 'wallet' && (
              <MyWalletView
                wallet={wallet}
                transactions={walletTransactions}
                shopStatus={shopStatus}
                onRefreshWallet={fetchWallet}
                onStartPrintJob={() => {
                  setCustomerPage('upload');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {/* Page 4: My Orders History & Stored Documents Vault */}
            {customerPage === 'orders' && (
              <CustomerOrdersView
                orders={orders}
                onSelectOrder={(ordId) => {
                  setTrackingOrderId(ordId);
                  setCustomerPage('track');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onViewReceipt={(ord) => setReceiptOrder(ord)}
                onNewPrint={() => {
                  setCustomerPage('upload');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onRefreshOrders={fetchOrdersAndNotifications}
              />
            )}

            {/* How PrintEase Works (Live Integrated Flow) - Placed downside in user interface */}
            <div className="mt-12 pt-2">
              <WorkflowBanner
                onStartUpload={() => {
                  setCustomerPage('upload');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onTrackOrder={() => {
                  setCustomerPage('track');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          </>
        )}

        {/* ============================================================== */}
        {/* 2. SHOPKEEPER & OWNER PORTAL (Student Studio is strictly REMOVED) */}
        {/* ============================================================== */}
        {portal === 'shopkeeper' && (
          <div className="space-y-6">
            {/* Tab 1: Live Print Queue, Shop Status Control & Order Handover */}
            {shopkeeperTab === 'queue' && (
              <OwnerDashboard
                orders={orders}
                pricing={pricing}
                onUpdatePricing={handleUpdatePricing}
                onRefreshOrders={fetchOrdersAndNotifications}
                onViewReceipt={(ord) => setReceiptOrder(ord)}
                shopStatus={shopStatus}
                onUpdateShopStatus={handleUpdateShopStatus}
              />
            )}

            {/* Tab 2: Express Counter Pickup Kiosk */}
            {shopkeeperTab === 'kiosk' && (
              <PickupKioskView
                orders={orders}
                onRefreshOrders={fetchOrdersAndNotifications}
                onViewReceipt={(ord) => setReceiptOrder(ord)}
              />
            )}

            {/* Tab 3: Financial Analytics & Rate Manager */}
            {shopkeeperTab === 'analytics' && (
              <AnalyticsDashboardView
                orders={orders}
                pricing={pricing}
                onUpdatePricing={handleUpdatePricing}
                onViewReceipt={(ord) => setReceiptOrder(ord)}
              />
            )}

            {/* Tab 4: Cyber Defense Shield & Penetration Test */}
            {shopkeeperTab === 'security' && <SecurityCommandCenter />}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-[#5A3C0B] text-[#FFF5E1]/80 py-10 border-t border-[#452D07] no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-[#734E11]/40 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FFF5E1] text-[#5A3C0B] flex items-center justify-center font-bold shadow-md">
                <Printer className="w-5 h-5 text-[#5A3C0B]" />
              </div>
              <div>
                <span className="text-base font-black text-[#FFF5E1]">
                  Print<span className="text-[#FFF5E1]/90 underline decoration-[#FFF5E1]/40">Ease</span>
                </span>
                <p className="text-[11px] text-[#FFF5E1]/70">
                  "Your Documents. Our Priority." — Upload • Pay • Print • Done!
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-[#FFF5E1]/80">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#FFF5E1]" />
                Campus Tech Center Counter #2
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#FFF5E1]" />
                +91 98765 43210
              </span>

              {/* In Customer view: discreet link to open Shopkeeper Desk */}
              {portal === 'customer' ? (
                <button
                  onClick={() => setShowShopkeeperModal(true)}
                  className="text-[#FFF5E1] hover:underline font-semibold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Store className="w-3.5 h-3.5 text-[#FFF5E1]" />
                  <span>Shopkeeper Portal</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowPhpModal(true)}
                  className="text-[#FFF5E1] hover:underline font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>PHP 8+ / MySQL Architecture</span>
                </button>
              )}
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#FFF5E1]/70 gap-2">
            <span>
              © {new Date().getFullYear()} PrintEase Document Management System. Secure & Encrypted Document Operations.
            </span>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#FFF5E1]" />
              <span>Atomic Monotonic Order Sequences & HMAC-SHA256 Signature Verification.</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ============================================================== */}
      {/* MODALS & OVERLAYS                                              */}
      {/* ============================================================== */}

      {/* 1. Price Freeze & Order Review Modal */}
      {reviewOrder && (
        <OrderReviewModal
          order={reviewOrder}
          onClose={() => setReviewOrder(null)}
          onProceedToPayment={(lockedOrder) => {
            setReviewOrder(null);
            setPaymentOrder(lockedOrder);
          }}
        />
      )}

      {/* 2. Payment Modal (Online Gateway + PrintEase Wallet + Shop Closed Protection) */}
      {paymentOrder && (
        <PaymentModal
          order={paymentOrder}
          shopStatus={shopStatus}
          onClose={() => setPaymentOrder(null)}
          onOpenWalletTopup={() => {
            setPaymentOrder(null);
            setCustomerPage('wallet');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onSuccess={(paidOrder, payment) => {
            setPaymentOrder(null);
            registerMyPlacedOrder(paidOrder.order_id);
            setSuccessOrder(paidOrder);
            setOrders((prev) => {
              const updated = [paidOrder, ...prev.filter((o) => o.order_id !== paidOrder.order_id)];
              saveClientStoredOrders(updated);
              return updated;
            });
            fetchOrdersAndNotifications();
            fetchWallet();
          }}
        />
      )}

      {/* 3. Payment Success Modal */}
      {successOrder && (
        <PaymentSuccessModal
          order={successOrder}
          onClose={() => setSuccessOrder(null)}
          onTrackOrder={(ordId: string) => {
            setSuccessOrder(null);
            setTrackingOrderId(ordId);
            setCustomerPage('track');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onViewReceipt={() => {
            const ord = successOrder;
            setSuccessOrder(null);
            setReceiptOrder(ord);
          }}
        />
      )}

      {/* 4. Digital Receipt & Tax Invoice Modal */}
      {receiptOrder && (
        <ReceiptModal
          order={receiptOrder}
          onClose={() => setReceiptOrder(null)}
        />
      )}

      {/* 5. Pickup Alert Popup (Only for orders the customer actually placed!) */}
      {pickupAlertOrder && (
        <PickupAlertModal
          order={pickupAlertOrder}
          onClose={() => setPickupAlertOrder(null)}
          onPermanentlyDismiss={(ordId) => {
            saveStoredAcknowledgedPickup(ordId);
            setPickupAlertOrder(null);
          }}
          onViewOrder={(ordId: string) => {
            saveStoredAcknowledgedPickup(ordId);
            setPickupAlertOrder(null);
            setTrackingOrderId(ordId);
            setCustomerPage('track');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* 6. Customer Sign In / Register Modal */}
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      {/* 7. Shopkeeper Dedicated Access Modal */}
      {showShopkeeperModal && (
        <ShopkeeperAccessModal
          onClose={() => setShowShopkeeperModal(false)}
          onQuickEnter={() => {
            setShowShopkeeperModal(false);
            handleSwitchPortal('shopkeeper');
          }}
          onSuccess={(user, token) => {
            setShowShopkeeperModal(false);
            handleAuthSuccess(user, token);
          }}
        />
      )}

      {/* 8. Shop Status Control Modal for Owner */}
      {showShopStatusModal && shopStatus && (
        <ShopStatusControlModal
          currentStatus={shopStatus}
          onClose={() => setShowShopStatusModal(false)}
          onUpdateStatus={handleUpdateShopStatus}
        />
      )}

      {/* 9. PHP 8+ / MySQL Architecture & Controller Viewer (Shopkeeper view) */}
      {showPhpModal && (
        <PhpReferenceModal onClose={() => setShowPhpModal(false)} />
      )}

      {/* 10. Notification Center Drawer */}
      {showNotifications && (
        <NotificationDrawer
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
          onMarkRead={handleMarkNotificationRead}
          onSelectOrder={(ordId) => {
            setShowNotifications(false);
            setTrackingOrderId(ordId);
            if (portal === 'customer') {
              setCustomerPage('track');
            } else {
              setShopkeeperTab('queue');
            }
          }}
        />
      )}
    </div>
  );
}
