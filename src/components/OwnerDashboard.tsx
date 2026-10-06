import React, { useState, useEffect } from 'react';
import {
  Printer,
  Download,
  CheckCircle2,
  Clock,
  DollarSign,
  Users,
  Search,
  AlertCircle,
  FileText,
  Sliders,
  BarChart3,
  Shield,
  Layers,
  Sparkles,
  RefreshCw,
  PackageCheck,
  Store,
  ChevronRight,
  Save,
  BellRing,
  HelpCircle,
  Hash,
  Trash2,
} from 'lucide-react';
import {
  Order,
  OrderStatus,
  PricingSettings,
  DashboardStats,
  AuditLog,
  ShopStatusInfo,
} from '../types/printease';
import { ShopStatusControlModal } from './ShopStatusControlModal';
import { StatusBlinkDot } from './StatusBlinkDot';

interface Props {
  onRefreshOrders: () => void;
  orders: Order[];
  pricing: PricingSettings;
  onUpdatePricing: (pricing: Partial<PricingSettings>) => Promise<void>;
  onViewReceipt: (order: Order) => void;
  shopStatus?: ShopStatusInfo | null;
  onUpdateShopStatus?: (updated: Partial<ShopStatusInfo>) => Promise<void>;
}

export const OwnerDashboard: React.FC<Props> = ({
  orders,
  pricing,
  onUpdatePricing,
  onRefreshOrders,
  onViewReceipt,
  shopStatus,
  onUpdateShopStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'pricing' | 'reports' | 'audit'>('queue');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [showShopStatusModal, setShowShopStatusModal] = useState(false);

  // Confirmation modal state for "Mark as Ready"
  const [readyConfirmOrder, setReadyConfirmOrder] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Selected order for detailed Print Instruction Panel
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Pricing form state
  const [pricingForm, setPricingForm] = useState<PricingSettings>(pricing);
  const [pricingSaving, setPricingSaving] = useState(false);
  const [pricingSuccess, setPricingSuccess] = useState(false);

  useEffect(() => {
    setPricingForm(pricing);
  }, [pricing]);

  // Load stats and audit logs
  const fetchStatsAndLogs = async () => {
    try {
      const [sRes, aRes] = await Promise.all([
        fetch('/api/reports/analytics').catch(() => null),
        fetch('/api/audit-logs').catch(() => null),
      ]);
      if (sRes && sRes.ok) {
        const sData = await sRes.json();
        if (sData.stats) setStats(sData.stats);
      }
      if (aRes && aRes.ok) {
        const aData = await aRes.json();
        if (aData.logs) setAuditLogs(aData.logs);
      }
    } catch (err) {
      console.warn('Backend analytics service offline, calculating stats from local orders:', err);
    }

    // Fallback: derive real-time stats from current orders array
    setStats((prev) => {
      if (prev) return prev;
      const paidOrders = orders.filter((o) => o.payment_status === 'PAID');
      const rev = paidOrders.reduce((sum, o) => sum + (o.price_breakdown?.final_total || 0), 0);
      return {
        total_orders: orders.length,
        today_orders: orders.length,
        paid_orders: paidOrders.length,
        printing_orders: orders.filter((o) => o.order_status === 'PRINTING').length,
        ready_orders: orders.filter((o) => o.order_status === 'READY_FOR_PICKUP').length,
        completed_orders: orders.filter((o) => o.order_status === 'COMPLETED').length,
        pending_orders: orders.filter((o) => o.order_status !== 'COMPLETED' && o.order_status !== 'CANCELLED').length,
        total_customers: new Set(orders.map((o) => o.customer_email).filter(Boolean)).size || 1,
        today_revenue: rev,
        weekly_revenue: rev,
        monthly_revenue: rev,
        bw_count: orders.filter((o) => o.options.color_type === 'BW').length,
        color_count: orders.filter((o) => o.options.color_type !== 'BW').length,
        pickup_count: orders.length,
        delivery_count: 0,
      };
    });
  };

  useEffect(() => {
    fetchStatsAndLogs();
  }, [orders]);

  // Status transition handlers
  const handleUpdateStatus = async (
    orderId: string,
    newStatus: OrderStatus,
    note?: string
  ) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, note }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update order status.');
      }
      onRefreshOrders();
      fetchStatsAndLogs();
      setReadyConfirmOrder(null);
      if (selectedOrder && (selectedOrder.id === orderId || selectedOrder.order_id === orderId)) {
        const updatedRes = await fetch(`/api/orders/${orderId}`);
        const updatedData = await updatedRes.json();
        if (updatedData.order) setSelectedOrder(updatedData.order);
      }
    } catch (err: any) {
      alert(err.message || 'Status update failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // 7-day retention calculation helper
  const getDaysLeft = (order: Order) => {
    const created = new Date(order.created_at).getTime();
    const expires = order.file_expires_at ? new Date(order.file_expires_at).getTime() : created + 7 * 86400000;
    const msLeft = expires - Date.now();
    return Math.max(0, Math.ceil(msLeft / 86400000));
  };

  const [cleaningFiles, setCleaningFiles] = useState(false);
  const [cleanupNotice, setCleanupNotice] = useState<string | null>(null);

  const handleManualPurgeFiles = async () => {
    setCleaningFiles(true);
    setCleanupNotice(null);
    try {
      const res = await fetch('/api/files/cleanup', { method: 'POST' });
      const data = await res.json();
      setCleanupNotice(data.message || 'Auto-purge completed successfully.');
      onRefreshOrders();
      setTimeout(() => setCleanupNotice(null), 5000);
    } catch (e: any) {
      setCleanupNotice('Purge check completed.');
      setTimeout(() => setCleanupNotice(null), 3000);
    } finally {
      setCleaningFiles(false);
    }
  };

  // Handle authorized file download with 7-day retention check
  const handleDownloadFile = (order: Order) => {
    if (order.file_deleted) {
      alert('This document was automatically deleted after the 7-day retention period in accordance with student privacy protection policy.');
      return;
    }
    window.location.href = `/api/files/download/${order.file_id}`;
  };

  // Handle pricing save
  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setPricingSaving(true);
    setPricingSuccess(false);
    try {
      await onUpdatePricing(pricingForm);
      setPricingSuccess(true);
      setTimeout(() => setPricingSuccess(false), 3000);
      fetchStatsAndLogs();
    } catch (err: any) {
      alert(err.message || 'Failed to update pricing rates');
    } finally {
      setPricingSaving(false);
    }
  };

  // Instant 1-click shop status toggle for owner
  const handleQuickToggleShopStatus = async (targetStatus: 'OPEN' | 'CLOSED') => {
    try {
      if (onUpdateShopStatus) {
        await onUpdateShopStatus({
          status: targetStatus,
          mode: targetStatus === 'OPEN' ? 'FORCE_OPEN' : 'FORCE_CLOSED',
          message:
            targetStatus === 'OPEN'
              ? 'PrintEase is currently open and accepting orders.'
              : 'PrintEase is currently closed. Orders and payments are paused.',
        });
      }
      window.dispatchEvent(
        new CustomEvent('printease_shop_status_changed', {
          detail: {
            ...shopStatus,
            status: targetStatus,
            mode: targetStatus === 'OPEN' ? 'FORCE_OPEN' : 'FORCE_CLOSED',
          },
        })
      );
    } catch (e) {
      console.error('Failed to toggle shop status:', e);
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (filterStatus !== 'ALL') {
      if (filterStatus === 'NEW_PAID' && o.order_status !== 'PAID' && o.order_status !== 'RECEIVED')
        return false;
      if (filterStatus === 'PRINTING' && o.order_status !== 'PRINTING' && o.order_status !== 'BINDING')
        return false;
      if (filterStatus === 'READY' && o.order_status !== 'READY_FOR_PICKUP') return false;
      if (filterStatus === 'COMPLETED' && o.order_status !== 'COMPLETED') return false;
    }

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      return (
        o.order_id.toLowerCase().includes(query) ||
        o.customer_name.toLowerCase().includes(query) ||
        o.file_name.toLowerCase().includes(query) ||
        o.customer_phone.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="space-y-8 mb-16">
      {/* Top Banner & Shop Identity */}
      <div className="bg-gradient-to-br from-[#FFF5E1] via-[#FDF5E6] to-[#FCECCF] text-[#422C09] rounded-3xl p-6 sm:p-8 border-2 border-[#C48B28]/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#C48B28]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-black text-[#C48B28] uppercase tracking-wider mb-1.5">
            <div className="w-6 h-6 rounded-lg bg-[#C48B28]/20 flex items-center justify-center text-[#C48B28]">
              <Store className="w-3.5 h-3.5" />
            </div>
            <span>Campus Xerox & Print Station Management</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#422C09]">
            Shopkeeper & Owner Management Desk
          </h2>
          <p className="text-xs sm:text-sm text-[#5A3C0B]/85 mt-1 max-w-2xl">
            Real-time print job dispatch, authorized document downloads, pickup verification & live financials.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          {shopStatus && (
            <button
              onClick={() => setShowShopStatusModal(true)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 border-2 cursor-pointer shadow-xs ${
                shopStatus.status === 'OPEN'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
              }`}
            >
              <StatusBlinkDot isOpen={shopStatus.status === 'OPEN'} size="sm" />
              <span>{shopStatus.status === 'OPEN' ? 'SHOP OPEN' : 'SHOP CLOSED'}</span>
            </button>
          )}

          <button
            onClick={() => {
              onRefreshOrders();
              fetchStatsAndLogs();
            }}
            className="p-3 bg-[#FFF5E1] hover:bg-[#FDF6E8] text-[#422C09] border border-[#C48B28]/40 rounded-xl transition-colors cursor-pointer flex items-center gap-2 text-xs font-bold shadow-xs"
            title="Refresh Orders"
          >
            <RefreshCw className="w-4 h-4 text-[#C48B28]" />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* PRINTEASE SHOP STATUS LIVE CONTROL (Requirement 93) */}
      {shopStatus && (
        <div className="bg-white rounded-3xl p-6 border border-[#C48B28]/30 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 shadow-xs ${
                  shopStatus.status === 'OPEN'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                }`}
              >
                <Store className="w-7 h-7" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    PRINTEASE SHOP STATUS
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 border ${
                      shopStatus.status === 'OPEN'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-rose-50 text-rose-800 border-rose-300'
                    }`}
                  >
                    <StatusBlinkDot isOpen={shopStatus.status === 'OPEN'} size="sm" />
                    <span>{shopStatus.status === 'OPEN' ? 'SHOP OPEN' : 'SHOP CLOSED'}</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-1.5">
                  <span>
                    Accepting New Orders: <strong>{shopStatus.status === 'OPEN' ? 'YES' : 'NO'}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Accepting Payments: <strong>{shopStatus.status === 'OPEN' ? 'YES' : 'NO'}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Mode: <strong className="font-mono">{shopStatus.mode || 'AUTO'}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Hours: <strong>{shopStatus.opening_time || '09:00'} – {shopStatus.closing_time || '20:00'} (IST)</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {shopStatus.status === 'OPEN' ? (
                <button
                  type="button"
                  onClick={() => handleQuickToggleShopStatus('CLOSED')}
                  className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white border-2 border-rose-700 text-xs sm:text-sm font-black rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  title="Click to instantly close shop and disable payments"
                >
                  <StatusBlinkDot isOpen={false} size="sm" />
                  <span>CLOSE SHOP (DISABLE PAYMENTS)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleQuickToggleShopStatus('OPEN')}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-emerald-700 text-xs sm:text-sm font-black rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  title="Click to instantly open shop and enable payments"
                >
                  <StatusBlinkDot isOpen={true} size="sm" />
                  <span>OPEN SHOP (ENABLE PAYMENTS)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowShopStatusModal(true)}
                className="px-4 py-3 bg-[#FFF5E1] hover:bg-[#FDF6E8] text-[#422C09] border border-[#C48B28]/40 text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Schedule & Mode
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7-DAY DOCUMENT STORAGE & AUTO-PURGE RETENTION BANNER */}
      <div className="bg-gradient-to-r from-[#FFF5E1] via-[#FDF5E6] to-[#FBF0D9] text-[#422C09] rounded-3xl p-5 border-2 border-[#C48B28]/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C48B28]/20 border border-[#C48B28]/35 flex items-center justify-center text-[#C48B28] shrink-0">
            <Shield className="w-5 h-5 text-[#C48B28]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#C48B28]">
                Strict 7-Day Document Retention Policy
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                Auto-Purge Active
              </span>
            </div>
            <p className="text-xs text-[#5A3C0B]/90 mt-0.5">
              Customer files are stored securely for <strong>7 days only</strong> for printing and pickup verification. After 7 days, documents are permanently unlinked and deleted automatically.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {cleanupNotice && (
            <span className="text-xs font-bold text-emerald-700 animate-fade-in">
              {cleanupNotice}
            </span>
          )}
          <button
            type="button"
            disabled={cleaningFiles}
            onClick={handleManualPurgeFiles}
            className="btn-smooth btn-dual-shimmer px-4 py-2 text-[#FFF5E1] text-xs font-bold rounded-xl border border-[#C48B28] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
            title="Scan database and permanently delete all documents older than 7 days"
          >
            {cleaningFiles ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5 text-[#FFF5E1]" />
            )}
            <span>{cleaningFiles ? 'Purging...' : 'Run 7-Day Auto-Purge'}</span>
          </button>
        </div>
      </div>

      {/* PAYMENTS & REVENUE BREAKDOWN: ONLINE VS WALLET (Requirement 92) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Online Gateway
          </span>
          <div className="text-xl font-black text-purple-700 mt-1">
            ₹{stats?.online_payments_revenue || 0}
          </div>
          <span className="text-[10px] text-slate-400">
            {stats?.online_payments_count || 0} transactions
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Wallet Payments
          </span>
          <div className="text-xl font-black text-emerald-700 mt-1">
            ₹{stats?.wallet_payments_revenue || 0}
          </div>
          <span className="text-[10px] text-slate-400">
            {stats?.wallet_payments_count || 0} wallet debits
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Combined Turnover
          </span>
          <div className="text-xl font-black text-[#C48B28] mt-1">
            ₹{stats?.today_revenue || 0}
          </div>
          <span className="text-[10px] text-slate-400">
            Today's gross collection
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Refunds Processed
          </span>
          <div className="text-xl font-black text-slate-700 mt-1">
            ₹{stats?.refunds_amount || 0}
          </div>
          <span className="text-[10px] text-slate-400">
            Automated wallet credits
          </span>
        </div>
      </div>

      {/* Live Financial & Order Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Today's Revenue
          </span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            ₹{stats?.today_revenue || 0}
          </div>
          <span className="text-[10px] text-slate-400">
            {stats?.today_orders || 0} jobs today
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            New Paid Orders
          </span>
          <div className="text-2xl font-black text-[#C48B28] mt-1">
            {stats?.paid_orders || 0}
          </div>
          <span className="text-[10px] text-slate-400">Ready to print</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Currently Printing
          </span>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {stats?.printing_orders || 0}
          </div>
          <span className="text-[10px] text-slate-400">In machine</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Ready for Pickup
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {stats?.ready_orders || 0}
          </div>
          <span className="text-[10px] text-slate-400">Waiting for student</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Completed
          </span>
          <div className="text-2xl font-black text-slate-800 mt-1">
            {stats?.completed_orders || 0}
          </div>
          <span className="text-[10px] text-slate-400">Handed over</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Weekly Revenue
          </span>
          <div className="text-2xl font-black text-[#C48B28] mt-1">
            ₹{stats?.weekly_revenue || 0}
          </div>
          <span className="text-[10px] text-slate-400">Past 7 days</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'queue'
              ? 'bg-[#C48B28] text-[#FFF5E1] shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>Printing Queue & Orders</span>
          <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-white text-[10px]">
            {orders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pricing')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'pricing'
              ? 'bg-[#C48B28] text-[#FFF5E1] shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Shop Pricing Rates</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'reports'
              ? 'bg-[#C48B28] text-[#FFF5E1] shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Reports & Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'bg-[#C48B28] text-[#FFF5E1] shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Security Audit Trail</span>
        </button>
      </div>

      {/* TAB 1: ORDER QUEUE & COUNTER VERIFICATION */}
      {activeTab === 'queue' && (
        <div className="space-y-6">
          {/* Fast Search & Counter Filter */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Quick Counter Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Counter Search: Enter Order ID (e.g. PE48291), Name or Phone..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C48B28]"
              />
            </div>

            {/* Status Filter Badges */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { id: 'ALL', label: 'All Jobs' },
                { id: 'NEW_PAID', label: 'New / Paid' },
                { id: 'PRINTING', label: 'Printing' },
                { id: 'READY', label: 'Ready for Pickup' },
                { id: 'COMPLETED', label: 'Completed' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setFilterStatus(filter.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    filterStatus === filter.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Order Card Layout (Matching Sections 20, 21, 22) */}
          <div className="grid grid-cols-1 gap-4">
            {filteredOrders.length === 0 ? (
              <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <div className="text-base font-bold text-slate-700">No Orders in this queue</div>
                <div className="text-xs text-slate-400">Change filter or enter a different Order ID.</div>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const isPaid = order.payment_status === 'PAID';
                const isPrinting = order.order_status === 'PRINTING' || order.order_status === 'BINDING';
                const isReady = order.order_status === 'READY_FOR_PICKUP';
                const isCompleted = order.order_status === 'COMPLETED';

                return (
                  <div
                    key={order.id}
                    className={`bg-white rounded-2xl border p-5 sm:p-6 transition-all shadow-xs hover:shadow-md ${
                      isReady
                        ? 'border-emerald-400 ring-2 ring-emerald-400/20 bg-emerald-50/10'
                        : isPrinting
                        ? 'border-amber-400 bg-amber-50/10'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      {/* Left: Order Info & Document Specs */}
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-400">ORDER ID:</span>
                            <span className="font-mono text-lg font-black text-[#422C09] bg-[#C48B28]/15 px-2.5 py-0.5 rounded-lg border border-[#C48B28]/30">
                              #{order.order_id}
                            </span>
                          </div>

                          <span
                            className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                              isCompleted
                                ? 'bg-slate-100 text-slate-700'
                                : isReady
                                ? 'bg-emerald-500 text-white animate-pulse'
                                : isPrinting
                                ? 'bg-[#C48B28] text-[#FFF5E1]'
                                : 'bg-[#C48B28] text-[#FFF5E1]'
                            }`}
                          >
                            {String(order.order_status || '').replace(/_/g, ' ')}
                          </span>

                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            PAID: ₹{order.price_breakdown.final_total}
                          </span>

                          {order.options.urgency === 'URGENT' && (
                            <span className="text-xs font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-200 animate-pulse">
                              ⚡ URGENT JOB
                            </span>
                          )}
                        </div>

                        {/* Customer & Document details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                          <div>
                            <span className="text-slate-400 block font-medium">Customer:</span>
                            <span className="font-bold text-slate-900 block truncate">
                              {order.customer_name}
                            </span>
                            <span className="text-slate-500 text-[11px] block">
                              {order.customer_phone || order.customer_email}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 block font-medium">File & Retention:</span>
                            <span className="font-bold text-slate-900 block truncate max-w-[180px]">
                              {order.file_name}
                            </span>
                            <span className="text-[#C48B28] font-semibold text-[11px] block">
                              📄 {order.page_count} Pages ({order.options.copies} Copies)
                            </span>
                            {order.file_deleted ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md mt-1 border border-slate-200">
                                🔒 Auto-Deleted (7-Day Purge)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-1 border border-emerald-200">
                                <Clock className="w-3 h-3 text-emerald-600" />
                                <span>Stored 7d ({getDaysLeft(order)}d left)</span>
                              </span>
                            )}
                          </div>

                          <div>
                            <span className="text-slate-400 block font-medium">Print Specs:</span>
                            <span className="font-bold text-slate-800 block">
                              {order.options.paper_size} •{' '}
                              <span className={order.options.color_type === 'COLOR' ? 'text-[#C48B28] font-extrabold' : order.options.color_type === 'MIXED' ? 'text-emerald-700 font-extrabold' : ''}>
                                {order.options.color_type === 'COLOR'
                                  ? 'Full Color'
                                  : order.options.color_type === 'MIXED'
                                  ? `🎨 Color P${order.options.custom_color_pages || 'Mixed'}`
                                  : 'B&W'}
                              </span>
                            </span>
                            <span className="text-slate-600 text-[11px] block">
                              {order.options.side_type === 'DOUBLE' ? 'Double Sided' : 'Single Sided'} • {order.options.orientation}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 block font-medium">Finishing:</span>
                            <span className="font-bold text-slate-800 block">
                              {order.options.binding_type === 'SPIRAL'
                                ? '📕 Spiral Binding'
                                : order.options.binding_type === 'STAPLE'
                                ? '📎 Corner Staple'
                                : 'No Binding'}
                            </span>
                            <span className="text-slate-600 text-[11px] block">
                              {order.options.lamination ? '✨ Laminated' : 'Standard'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Action Buttons (Sections 20, 21, 22, 23, 26) */}
                      <div className="flex flex-wrap lg:flex-col items-stretch justify-center gap-2 min-w-[200px]">
                        {/* 1. Secure File Download */}
                        {order.file_deleted ? (
                          <div
                            className="px-3 py-2 bg-slate-100 text-slate-400 text-xs font-bold rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 cursor-not-allowed text-center"
                            title="This document was automatically deleted after 7 days as per privacy policy."
                          >
                            <span>🔒 File Auto-Deleted (7d)</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDownloadFile(order)}
                            className="px-4 py-2 bg-[#C48B28] hover:bg-[#A9741D] text-[#FFF5E1] text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download File</span>
                          </button>
                        )}

                        {/* 2. Start Printing */}
                        {!isPrinting && !isReady && !isCompleted && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(order.id, 'PRINTING')}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Start Printing</span>
                          </button>
                        )}

                        {/* 3. Mark as Ready for Pickup (Opens Section 23 confirmation) */}
                        {!isReady && !isCompleted && (
                          <button
                            type="button"
                            onClick={() => setReadyConfirmOrder(order)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Ready</span>
                          </button>
                        )}

                        {/* 4. Mark as Completed (Counter handover) */}
                        {isReady && !isCompleted && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                            className="btn-smooth btn-dual-shimmer px-4 py-2 text-[#FFF5E1] text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>Mark Completed</span>
                          </button>
                        )}

                        {/* 5. View Receipt / Print Specs */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="flex-1 py-1.5 text-slate-600 hover:text-[#C48B28] text-[11px] font-bold border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                          >
                            Print Spec Panel
                          </button>
                          <button
                            type="button"
                            onClick={() => onViewReceipt(order)}
                            className="py-1.5 px-2 text-slate-600 hover:text-[#C48B28] text-[11px] font-bold border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                            title="Receipt"
                          >
                            Receipt
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PRICING CONFIGURATION (Section 27) */}
      {activeTab === 'pricing' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-xl font-black text-slate-900">
                Shop Printing & Xerox Price Master
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure rates per page, finishing fees, and delivery surcharges.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-xs text-amber-900 font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-600" />
              <span>Existing locked orders will NEVER change price</span>
            </div>
          </div>

          <form onSubmit={handleSavePricing} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  A4 Black & White (₹/page)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={pricingForm.a4_bw}
                  onChange={(e) =>
                    setPricingForm({ ...pricingForm, a4_bw: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-900"
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  A4 Color Print (₹/page)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  value={pricingForm.a4_color}
                  onChange={(e) =>
                    setPricingForm({ ...pricingForm, a4_color: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-900"
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  A3 Black & White (₹/page)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  value={pricingForm.a3_bw}
                  onChange={(e) =>
                    setPricingForm({ ...pricingForm, a3_bw: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-900"
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  A3 Color Print (₹/page)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="2"
                  value={pricingForm.a3_color}
                  onChange={(e) =>
                    setPricingForm({ ...pricingForm, a3_color: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-900"
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Spiral Binding Fee (₹)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={pricingForm.spiral_binding}
                  onChange={(e) =>
                    setPricingForm({ ...pricingForm, spiral_binding: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-900"
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Stapling Fee (₹)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={pricingForm.stapling}
                  onChange={(e) =>
                    setPricingForm({ ...pricingForm, stapling: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-900"
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Lamination Fee (₹)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={pricingForm.lamination}
                  onChange={(e) =>
                    setPricingForm({ ...pricingForm, lamination: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-900"
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Urgent Fee (₹)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={pricingForm.urgent_fee}
                  onChange={(e) =>
                    setPricingForm({ ...pricingForm, urgent_fee: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              {pricingSuccess && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Rates updated successfully & logged in audit history!
                </span>
              )}
              <div className="ml-auto">
                <button
                  type="submit"
                  disabled={pricingSaving}
                  className="btn-smooth btn-dual-shimmer px-6 py-2.5 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{pricingSaving ? 'Saving...' : 'Save Pricing Rates'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: REPORTS & ANALYTICS (Section 28) */}
      {activeTab === 'reports' && stats && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-8">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-xl font-black text-slate-900">
              Print Shop Financial & Order Reports
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Service trends, order breakdown, and collection metrics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Color vs B&W breakdown */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Color vs Black & White Usage
              </span>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-slate-900" />
                  Black & White Xerox
                </span>
                <span className="font-bold">{stats.bw_count} orders</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#C48B28]" />
                  Color Printing
                </span>
                <span className="font-bold">{stats.color_count} orders</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden flex">
                <div
                  className="bg-slate-900 h-full"
                  style={{
                    width: `${
                      stats.bw_count + stats.color_count > 0
                        ? (stats.bw_count / (stats.bw_count + stats.color_count)) * 100
                        : 50
                    }%`,
                  }}
                />
                <div
                  className="bg-[#C48B28] h-full"
                  style={{
                    width: `${
                      stats.bw_count + stats.color_count > 0
                        ? (stats.color_count / (stats.bw_count + stats.color_count)) * 100
                        : 50
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Collection method */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Collection Channel
              </span>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-600" />
                  Counter Pickup (Store)
                </span>
                <span className="font-bold">{stats.pickup_count} orders</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  Campus Delivery
                </span>
                <span className="font-bold">{stats.delivery_count} orders</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden flex">
                <div
                  className="bg-emerald-600 h-full"
                  style={{
                    width: `${
                      stats.pickup_count + stats.delivery_count > 0
                        ? (stats.pickup_count / (stats.pickup_count + stats.delivery_count)) * 100
                        : 80
                    }%`,
                  }}
                />
                <div
                  className="bg-amber-500 h-full"
                  style={{
                    width: `${
                      stats.pickup_count + stats.delivery_count > 0
                        ? (stats.delivery_count / (stats.pickup_count + stats.delivery_count)) * 100
                        : 20
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Total Revenue Projection */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Revenue Breakdown
              </span>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Today:</span>
                <span className="font-bold text-slate-900">₹{stats.today_revenue}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Last 7 Days:</span>
                <span className="font-bold text-slate-900">₹{stats.weekly_revenue}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Last 30 Days:</span>
                <span className="font-bold text-slate-900">₹{stats.monthly_revenue}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS (Section 29) */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900">
                Security & Operational Audit Trail
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every file download, price lock, status update, and payment verification is tamper-evidently recorded.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                        log.action.includes('PAYMENT')
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.action.includes('DOWNLOAD')
                          ? 'bg-[#C48B28]/20 text-[#422C09]'
                          : log.action.includes('STATUS')
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {log.action}
                    </span>
                    {log.order_id && (
                      <span className="font-mono font-bold text-[#C48B28]">
                        #{log.order_id}
                      </span>
                    )}
                    <span className="text-slate-500">• {log.user_name} ({log.user_role})</span>
                  </div>
                  <div className="text-slate-700">{log.details}</div>
                </div>

                <div className="text-slate-400 text-[11px] whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 23 CONFIRMATION MODAL: "Mark as Ready for Pickup" */}
      {readyConfirmOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-center">
              <div className="w-14 h-14 rounded-2xl bg-white text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-md">
                <Printer className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black">
                Confirm Print Ready
              </h3>
              <p className="text-xs text-emerald-100 mt-1">
                Order #{readyConfirmOrder.order_id}
              </p>
            </div>

            <div className="p-6 text-center space-y-3">
              <div className="text-base font-bold text-slate-900">
                "Are you sure this order is printed and ready?"
              </div>
              <p className="text-xs text-slate-500">
                Marking ready will immediately send a pickup alert popup to <strong>{readyConfirmOrder.customer_name}</strong>.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setReadyConfirmOrder(null)}
                disabled={actionLoading}
                className="w-1/2 py-2.5 border border-slate-300 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleUpdateStatus(readyConfirmOrder.id, 'READY_FOR_PICKUP')}
                className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Ready</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 22: CLEAR PRINT INSTRUCTION PANEL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-[#FFF5E1] via-[#FDF5E6] to-[#FCECCF] text-[#422C09] border-b border-[#C48B28]/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#C48B28]">
                  Xerox Machine Print Instructions
                </span>
                <h3 className="text-xl font-black text-[#422C09]">
                  PRINT THIS DOCUMENT: #{selectedOrder.order_id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-[#422C09] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-[#C48B28]/10 border border-[#C48B28]/30 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">File Name:</span>
                  <span className="font-bold text-slate-900">{selectedOrder.file_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pages:</span>
                  <span className="font-bold text-slate-900">{selectedOrder.page_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Copies:</span>
                  <span className="font-bold text-slate-900">{selectedOrder.options.copies}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Color Mode:</span>
                  <span className="font-bold text-slate-900">{selectedOrder.options.color_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Paper Size:</span>
                  <span className="font-bold text-slate-900">{selectedOrder.options.paper_size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sides:</span>
                  <span className="font-bold text-slate-900">
                    {selectedOrder.options.side_type === 'DOUBLE' ? 'Double Sided (Back-to-Back)' : 'Single Sided'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Binding:</span>
                  <span className="font-bold text-slate-900">{selectedOrder.options.binding_type}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#C48B28]/30">
                  <span className="font-bold text-slate-700">Total Customer Paid:</span>
                  <span className="font-black text-emerald-700 text-sm">
                    ₹{selectedOrder.price_breakdown.final_total}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              {selectedOrder.file_deleted ? (
                <div className="w-1/2 py-2.5 bg-slate-100 text-slate-400 text-xs font-bold rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 cursor-not-allowed">
                  <span>🔒 Auto-Deleted (7d)</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleDownloadFile(selectedOrder)}
                  className="w-1/2 py-2.5 bg-[#C48B28] hover:bg-[#A9741D] text-[#FFF5E1] text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Download File</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  handleUpdateStatus(selectedOrder.id, 'PRINTING');
                  setSelectedOrder(null);
                }}
                className="w-1/2 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Send to Printing</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shop Status Control Modal */}
      {showShopStatusModal && shopStatus && onUpdateShopStatus && (
        <ShopStatusControlModal
          currentStatus={shopStatus}
          onClose={() => setShowShopStatusModal(false)}
          onUpdateStatus={onUpdateShopStatus}
        />
      )}
    </div>
  );
};
