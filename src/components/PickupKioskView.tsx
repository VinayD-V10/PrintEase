import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  Printer,
  PackageCheck,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Receipt,
  ShieldCheck,
  UserCheck,
  Hash,
} from 'lucide-react';
import { Order } from '../types/printease';
import { playOrderAlertSound } from '../utils/audio';

interface Props {
  orders: Order[];
  onRefreshOrders: () => void;
  onViewReceipt: (order: Order) => void;
}

export const PickupKioskView: React.FC<Props> = ({
  orders,
  onRefreshOrders,
  onViewReceipt,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter orders matching search input (by Order ID, pickup code, customer name, phone)
  const handleSearch = (query: string) => {
    setSearchInput(query);
    setErrorMessage(null);
    setSuccessMessage(null);
    const trimmed = query.trim().toUpperCase();
    if (!trimmed) {
      setSelectedOrder(null);
      return;
    }
    const found = orders.find(
      (o) =>
        (o.order_id || '').toUpperCase() === trimmed ||
        (o.order_id || '').toUpperCase().replace(/^PE/, '') === trimmed ||
        (o.pickup_code || '').toUpperCase() === trimmed ||
        (o.customer_phone || '').includes(trimmed) ||
        (o.customer_name || '').toUpperCase().includes(trimmed)
    );
    if (found) {
      setSelectedOrder(found);
    }
  };

  const handleKeypadPress = (val: string) => {
    if (val === 'CLEAR') {
      setSearchInput('');
      setSelectedOrder(null);
      setErrorMessage(null);
      setSuccessMessage(null);
    } else if (val === 'BACK') {
      const next = searchInput.slice(0, -1);
      handleSearch(next);
    } else {
      const next = searchInput + val;
      handleSearch(next);
    }
  };

  // Mark order as collected
  const handleMarkCollected = async (order: Order) => {
    setVerifying(true);
    setErrorMessage(null);
    try {
      const token = localStorage.getItem('printease_token');
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          order_status: 'COMPLETED',
          pickup_code: order.pickup_code,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete order handover.');
      }

      playOrderAlertSound();
      setSuccessMessage(`Order #${order.order_id} verified and collected successfully! Thank you.`);
      setSelectedOrder(data.order);
      onRefreshOrders();
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed. Please consult the counter staff.');
    } finally {
      setVerifying(false);
    }
  };

  // Get tray or locker assignment based on order ID checksum
  const getLockerTrayNumber = (orderId: string) => {
    const num = parseInt((orderId || '').replace(/\D/g, '') || '101', 10);
    const tray = (num % 8) + 1;
    const shelf = String.fromCharCode(65 + (num % 4)); // A, B, C, D
    return `Shelf ${shelf} — Tray #${tray}`;
  };

  const readyOrders = orders.filter((o) => o.order_status === 'READY_FOR_PICKUP');

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Kiosk Header */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 text-amber-100 text-xs font-bold uppercase tracking-wider backdrop-blur-sm mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Express Self-Service Terminal • Counter Kiosk</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Self-Service Document Pickup
            </h1>
            <p className="text-amber-100 text-sm sm:text-base mt-2 max-w-xl">
              Enter your <span className="font-bold underline text-white">Order ID</span> or <span className="font-bold underline text-white">4-Digit Pickup PIN</span> below to locate your documents instantly.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center shrink-0 w-full sm:w-auto">
            <span className="text-xs text-amber-200 font-bold block uppercase tracking-wider">
              Currently Ready for Pickup
            </span>
            <span className="text-3xl sm:text-4xl font-black text-white">
              {readyOrders.length}
            </span>
            <span className="text-[11px] text-amber-200 block mt-0.5">
              orders waiting on shelf
            </span>
          </div>
        </div>
      </div>

      {/* Main Kiosk Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Input & Touch Keypad (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Scan or Enter Order ID / 4-Digit Pickup Code
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="e.g. PE50100 or 4-digit PIN..."
                className="w-full text-xl sm:text-2xl font-mono font-black text-slate-900 bg-slate-50 border-2 border-slate-300 focus:border-amber-500 focus:bg-white rounded-2xl px-5 py-4 pl-14 outline-none transition-all shadow-inner tracking-wider"
              />
              <Search className="w-7 h-7 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => handleKeypadPress('CLEAR')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-amber-600" />
              Atomic monotonic format: <span className="font-mono font-bold text-slate-700">PE50100</span> or PIN found in your SMS/Digital receipt.
            </p>
          </div>

          {/* Touch-Friendly On-Screen Keypad for physical kiosk touchscreens */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
              Touchscreen Quick Keypad
            </span>
            <div className="grid grid-cols-3 gap-3">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'PE', '0', 'BACK'].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleKeypadPress(key)}
                  className={`h-14 sm:h-16 rounded-2xl text-lg sm:text-xl font-bold font-mono transition-all flex items-center justify-center cursor-pointer select-none active:scale-95 shadow-sm ${
                    key === 'PE'
                      ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300'
                      : key === 'BACK'
                      ? 'bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300'
                      : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {key === 'BACK' ? '⌫ Back' : key}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Click from Ready Queue */}
          {readyOrders.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-600 block mb-2.5">
                Quick Select from Shelf Ready Orders:
              </span>
              <div className="flex flex-wrap gap-2">
                {readyOrders.slice(0, 4).map((ord) => (
                  <button
                    key={ord.id}
                    onClick={() => {
                      setSearchInput(ord.order_id);
                      setSelectedOrder(ord);
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>#{ord.order_id}</span>
                    <span className="text-emerald-700/80 font-normal">({ord.customer_name})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Order Result & Handover Box (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {selectedOrder ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
              {/* Order Status Banner */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    Located Order
                  </span>
                  <h3 className="text-2xl font-mono font-black text-slate-900">
                    #{selectedOrder.order_id}
                  </h3>
                </div>
                <div
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                    selectedOrder.order_status === 'READY_FOR_PICKUP'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedOrder.order_status === 'COMPLETED'
                      ? 'bg-slate-100 text-slate-800'
                      : selectedOrder.order_status === 'PRINTING'
                      ? 'bg-[#C48B28]/20 text-[#422C09]'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selectedOrder.order_status === 'READY_FOR_PICKUP' && (
                    <PackageCheck className="w-4 h-4 text-emerald-600" />
                  )}
                  {selectedOrder.order_status === 'COMPLETED' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                  {selectedOrder.order_status === 'PRINTING' && (
                    <Printer className="w-4 h-4 text-[#C48B28] animate-spin" />
                  )}
                  <span>{String(selectedOrder.order_status || '').replace(/_/g, ' ')}</span>
                </div>
              </div>

              {/* Shelf / Tray Assignment Callout */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-5 text-center">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                  Designated Pickup Location
                </span>
                <span className="text-2xl sm:text-3xl font-black text-amber-900 block my-1">
                  {getLockerTrayNumber(selectedOrder.order_id)}
                </span>
                <span className="text-xs text-amber-700">
                  Please verify document name on folder before taking.
                </span>
              </div>

              {/* Document & Specs Summary */}
              <div className="space-y-3 text-xs bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-semibold">Document:</span>
                  <span className="font-bold text-slate-800 truncate max-w-[180px]">
                    {selectedOrder.file_name}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-semibold">Customer:</span>
                  <span className="font-bold text-slate-800">
                    {selectedOrder.customer_name}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-semibold">Pages / Copies:</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {selectedOrder.page_count} pages • {selectedOrder.options.copies} copy
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-semibold">Print Type:</span>
                  <span className="font-bold text-slate-800">
                    {selectedOrder.options.color_type === 'COLOR' ? '🎨 Full Color' : '📄 Black & White'} ({selectedOrder.options.side_type})
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500 font-semibold">Payment Status:</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    PAID (₹{selectedOrder.price_breakdown.final_total})
                  </span>
                </div>
              </div>

              {/* Handover Action */}
              {selectedOrder.order_status === 'READY_FOR_PICKUP' ? (
                <button
                  type="button"
                  disabled={verifying}
                  onClick={() => handleMarkCollected(selectedOrder)}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-base shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <PackageCheck className="w-5 h-5" />
                  <span>{verifying ? 'Verifying Handover...' : 'I Have Collected My Prints'}</span>
                </button>
              ) : selectedOrder.order_status === 'COMPLETED' ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
                  <span className="text-sm font-bold text-emerald-900 block">
                    Order Completed & Handed Over
                  </span>
                  <span className="text-xs text-emerald-700">
                    Digital receipt saved in archive.
                  </span>
                </div>
              ) : (
                <div className="p-4 bg-[#C48B28]/10 border border-[#C48B28]/30 rounded-2xl text-center">
                  <Clock className="w-7 h-7 text-[#C48B28] mx-auto mb-1 animate-spin" />
                  <span className="text-sm font-bold text-[#422C09] block">
                    Document is in {String(selectedOrder.order_status || '').replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-[#5A3C0B]/80">
                    The shopkeeper is preparing your document. You will be alerted as soon as it reaches the tray!
                  </span>
                </div>
              )}

              {/* Receipt View Button */}
              <button
                type="button"
                onClick={() => onViewReceipt(selectedOrder)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Receipt className="w-4 h-4 text-slate-500" />
                <span>View & Print Digital Receipt</span>
              </button>

              {successMessage && (
                <div className="p-3 bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 bg-red-100 text-red-900 border border-red-200 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center text-slate-400 flex flex-col items-center justify-center min-h-[360px]">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-4 text-slate-400 shadow-xs">
                <PackageCheck className="w-8 h-8 text-amber-500" />
              </div>
              <h4 className="text-base font-bold text-slate-700">
                Waiting for Order ID
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Enter your order ID (e.g. PE50100) or pickup PIN using the keypad on the left to reveal your tray slot.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
