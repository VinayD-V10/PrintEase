import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  Printer,
  Clock,
  Store,
  FileText,
  Download,
  AlertCircle,
  Layers,
  ArrowRight,
  ShieldCheck,
  PackageCheck,
} from 'lucide-react';
import { Order, OrderStatus } from '../types/printease';
import { StatusBlinkDot } from './StatusBlinkDot';

interface Props {
  initialOrderId?: string;
  onViewReceipt: (order: Order) => void;
  onBackToHome: () => void;
}

export const OrderTrackingView: React.FC<Props> = ({
  initialOrderId = '',
  onViewReceipt,
  onBackToHome,
}) => {
  const [searchId, setSearchId] = useState(initialOrderId);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(id.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Order not found. Please verify the Order ID.');
      }
      setOrder(data.order);
    } catch (err: any) {
      setError(err.message || 'Unable to find order.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderId) {
      setSearchId(initialOrderId);
      fetchOrder(initialOrderId);
    }
  }, [initialOrderId]);

  // Polling for live status updates if order is open
  useEffect(() => {
    if (!order || order.order_status === 'COMPLETED') return;
    const interval = setInterval(() => {
      fetch(`/api/orders/${encodeURIComponent(order.order_id)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.order) setOrder(d.order);
        })
        .catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, [order?.order_id, order?.order_status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(searchId);
  };

  const getStepState = (targetStatus: OrderStatus) => {
    if (!order) return 'inactive';
    const statusOrder: OrderStatus[] = [
      'PENDING_PAYMENT',
      'PAID',
      'PRINTING',
      'READY_FOR_PICKUP',
      'COMPLETED',
    ];

    const currentNormalized =
      order.order_status === 'RECEIVED'
        ? 'PAID'
        : order.order_status === 'BINDING'
        ? 'PRINTING'
        : order.order_status;

    const currentIndex = statusOrder.indexOf(currentNormalized);
    const targetIndex = statusOrder.indexOf(targetStatus);

    if (currentIndex > targetIndex) return 'completed';
    if (currentIndex === targetIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 mb-12">
      {/* Search Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#C48B28]/25 shadow-xl">
        <div className="max-w-xl mx-auto text-center mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-[#C48B28] block mb-1">
            Real-Time Order Tracking
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#422C09] tracking-tight">
            Track Your Print &amp; Xerox Job
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Enter your 7-character Order ID (e.g. <span className="font-mono font-bold text-[#C48B28]">PE48291</span>) to see live printing progress.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="max-w-md mx-auto flex gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="e.g. PE48291"
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-11 pr-4 py-3 text-sm font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C48B28]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-smooth btn-dual-shimmer px-6 py-3 disabled:opacity-50 text-[#FFF5E1] text-sm font-bold rounded-2xl transition-all shadow-md cursor-pointer"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 max-w-md mx-auto flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Order Status Display */}
      {order && (
        <div className="bg-white rounded-3xl border border-[#C48B28]/25 shadow-xl overflow-hidden space-y-6">
          {/* Header Bar */}
          <div className="p-6 sm:p-8 bg-gradient-to-r from-[#422C09] via-[#5A3C0B] to-[#422C09] text-[#FFF5E1] flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C48B28]/30">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#FFF5E1]/70">
                  Print Job Order
                </span>
                <span className="font-mono text-xl sm:text-2xl font-black text-[#C48B28]">
                  #{order.order_id}
                </span>
              </div>
              <p className="text-xs text-[#FFF5E1]/80 mt-1">
                Placed by {order.customer_name} on{' '}
                {new Date(order.created_at).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                  order.order_status === 'COMPLETED'
                    ? 'bg-emerald-500 text-white'
                    : order.order_status === 'READY_FOR_PICKUP'
                    ? 'bg-[#C48B28] text-[#FFF5E1] animate-pulse'
                    : order.order_status === 'PRINTING'
                    ? 'bg-[#EBC176] text-[#422C09]'
                    : 'bg-[#C48B28] text-[#FFF5E1]'
                }`}
              >
                {String(order.order_status || '').replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* Visual Stepper Timeline */}
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-4">
                Print Job Progress Timeline
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {/* Step 1: Paid */}
                <div
                  className={`p-4 rounded-2xl border text-xs transition-all ${
                    getStepState('PAID') === 'completed' || getStepState('PAID') === 'current'
                      ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-bold'
                      : 'border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>1. Payment Verified</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-normal">
                    ₹{order.price_breakdown.final_total} locked & confirmed
                  </div>
                </div>

                {/* Step 2: Printing */}
                <div
                  className={`p-4 rounded-2xl border text-xs transition-all ${
                    getStepState('PRINTING') === 'completed'
                      ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-bold'
                      : getStepState('PRINTING') === 'current'
                      ? 'border-amber-500 bg-amber-50/80 text-amber-950 font-bold animate-pulse-subtle'
                      : 'border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Printer
                      className={`w-4 h-4 ${
                        getStepState('PRINTING') === 'current'
                          ? 'text-amber-600 animate-bounce'
                          : 'text-emerald-600'
                      }`}
                    />
                    <span>2. Printing & Binding</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-normal">
                    {order.order_status === 'PRINTING'
                      ? 'Currently on Xerox machine'
                      : 'Processed by shopkeeper'}
                  </div>
                </div>

                {/* Step 3: Ready for Pickup */}
                <div
                  className={`p-4 rounded-2xl border text-xs transition-all ${
                    getStepState('READY_FOR_PICKUP') === 'completed'
                      ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-bold'
                      : getStepState('READY_FOR_PICKUP') === 'current'
                      ? 'border-emerald-600 bg-emerald-100 text-emerald-950 font-black shadow-md'
                      : 'border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Store className="w-4 h-4 text-emerald-600" />
                    <span>3. Ready for Pickup</span>
                  </div>
                  <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1.5">
                    {order.order_status === 'READY_FOR_PICKUP' ? (
                      <>
                        <StatusBlinkDot isOpen={true} size="sm" />
                        <span>At shop counter ready!</span>
                      </>
                    ) : (
                      <span>Waiting for print completion</span>
                    )}
                  </div>
                </div>

                {/* Step 4: Completed */}
                <div
                  className={`p-4 rounded-2xl border text-xs transition-all ${
                    getStepState('COMPLETED') === 'completed' || getStepState('COMPLETED') === 'current'
                      ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-bold'
                      : 'border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <PackageCheck className="w-4 h-4 text-emerald-600" />
                    <span>4. Handed Over</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-normal">
                    {order.completed_at ? 'Delivered to student' : 'Pending shop visit'}
                  </div>
                </div>
              </div>
            </div>

            {/* Special Ready for Pickup Action Box */}
            {order.order_status === 'READY_FOR_PICKUP' && (
              <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-400 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
                    <Store className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-emerald-950">
                      Your Printed Documents are Ready!
                    </h4>
                    <p className="text-xs text-emerald-800">
                      Visit the shop counter and show your Order ID:{' '}
                      <span className="font-mono font-bold text-slate-900">
                        {order.order_id}
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onViewReceipt(order)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Show Digital Receipt</span>
                </button>
              </div>
            )}

            {/* Specifications Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-200 pb-2">
                <span>Print Job Details</span>
                <span className="font-mono text-slate-500">
                  {order.file_name} ({order.page_count} Pages)
                </span>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {order.file_deleted
                    ? 'Document has been auto-deleted from server (7-day privacy retention completed).'
                    : 'Document is securely stored for 7 days, then permanently auto-purged from server.'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Color Mode:</span>
                  <span className="font-bold text-slate-800">
                    {order.options.color_type === 'COLOR' ? 'Color Print' : 'Black & White'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Paper & Sides:</span>
                  <span className="font-bold text-slate-800">
                    {order.options.paper_size} •{' '}
                    {order.options.side_type === 'DOUBLE' ? 'Double Sided' : 'Single Sided'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Copies:</span>
                  <span className="font-bold text-slate-800">
                    {order.options.copies} {order.options.copies === 1 ? 'Copy' : 'Copies'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Binding:</span>
                  <span className="font-bold text-slate-800">
                    {order.options.binding_type}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={onBackToHome}
                className="text-xs font-bold text-slate-600 hover:text-[#C48B28] transition-colors cursor-pointer"
              >
                ← Back to Upload & Print
              </button>

              <button
                type="button"
                onClick={() => onViewReceipt(order)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>View Official Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
