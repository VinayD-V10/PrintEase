import React from 'react';
import {
  Lock,
  ShieldCheck,
  FileText,
  Printer,
  Layers,
  ArrowRight,
  ArrowLeft,
  X,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { Order, ShopStatusInfo } from '../types/printease';
import { StatusBlinkDot } from './StatusBlinkDot';

interface Props {
  order: Order;
  shopStatus?: ShopStatusInfo | null;
  onClose: () => void;
  onProceedToPayment: (order: Order) => void;
}

export const OrderReviewModal: React.FC<Props> = ({
  order,
  shopStatus,
  onClose,
  onProceedToPayment,
}) => {
  const { price_breakdown: b, options } = order;
  const isShopOpen = shopStatus ? shopStatus.status === 'OPEN' : true;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[92vh] pb-safe sm:pb-0">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-[#422C09] via-[#5A3C0B] to-[#422C09] text-[#FFF5E1] flex items-center justify-between border-b border-[#C48B28]/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C48B28]/25 text-[#EBC176] flex items-center justify-center border border-[#C48B28]/40">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#EBC176]">
                Authoritative Server Snapshot
              </span>
              <h3 className="text-xl font-extrabold tracking-tight">
                Order Summary & Price Lock
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shop Status Banner */}
        {!isShopOpen ? (
          <div className="px-5 py-3 bg-rose-50 border-b-2 border-rose-300 text-rose-800 flex items-center justify-between gap-3 animate-fadeIn shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 rounded-full bg-rose-600 flex items-center justify-center animate-ping">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
              <span className="font-black text-xs sm:text-sm text-rose-900 tracking-wide uppercase">
                Shop is Closed – Payment Unavailable
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-200/80 text-rose-900 shrink-0">
              Payments Disabled
            </span>
          </div>
        ) : (
          <div className="px-5 py-2.5 bg-emerald-50 border-b-2 border-emerald-300 text-emerald-800 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <StatusBlinkDot isOpen={true} size="sm" />
              <span className="font-black text-xs sm:text-sm text-emerald-900 tracking-wide uppercase">
                Shop is Open – Payment Available
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-200/80 text-emerald-900 shrink-0">
              Live Counter Active
            </span>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Price Lock Banner */}
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-xs text-emerald-950 leading-snug">
              <span className="font-bold block text-sm text-emerald-950">
                🔒 Price Locked for this Order
              </span>
              This authoritative amount is frozen on the server. Even if shopkeeper rates change later, your order price remains guaranteed.
            </div>
          </div>

          {/* Document & Specs Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#C48B28]" />
                <div>
                  <div className="text-sm font-bold text-slate-900">{order.file_name}</div>
                  <div className="text-xs text-slate-500">
                    Draft Reference: <span className="font-mono font-bold text-[#C48B28]">#{order.order_id}</span>
                    <span className="text-[10px] text-slate-500 block">Official Order ID will be generated upon verified payment</span>
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#C48B28]/15 text-[#422C09] text-xs font-bold">
                {order.page_count} Pages
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Paper Size:</span>
                <span className="font-bold text-slate-800">{options.paper_size}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Color Mode:</span>
                <span className="font-bold text-slate-800">
                  {options.color_type === 'COLOR'
                    ? 'Color Print'
                    : options.color_type === 'MIXED'
                    ? `Selective Color (${options.custom_color_pages ? `P${options.custom_color_pages}` : 'Mixed'})`
                    : 'Black & White'}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Sides:</span>
                <span className="font-bold text-slate-800">
                  {options.side_type === 'DOUBLE' ? 'Double Sided' : 'Single Sided'}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Copies:</span>
                <span className="font-bold text-slate-800">{options.copies} Copy</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Binding:</span>
                <span className="font-bold text-slate-800">
                  {options.binding_type === 'SPIRAL'
                    ? 'Spiral Binding'
                    : options.binding_type === 'STAPLE'
                    ? 'Stapled'
                    : 'Loose Sheets'}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Speed:</span>
                <span className="font-bold text-slate-800">
                  {options.urgency === 'URGENT' ? '⚡ Urgent' : 'Standard'}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Storage Place:</span>
                <span className="font-bold text-slate-800 text-[11px] truncate block" title="PrintEase Isolated Server Vault (storage/private/uploads/)">
                  Server Vault
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Storage Option:</span>
                <span className="font-bold text-[#C48B28] text-[11px] block">
                  {order.retention_choice === 'PERMANENT'
                    ? '💾 Permanently Stored'
                    : '🗑️ Delete After Printing'}
                </span>
              </div>
            </div>
          </div>

          {/* Itemized Price Breakdown */}
          <div className="space-y-2 text-sm text-slate-700">
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-600">
                {options.color_type === 'MIXED' ? (
                  <>Printing ({b.color_pages_count || 0} Color + {b.bw_pages_count || 0} B&W × {b.copies} {b.copies === 1 ? 'copy' : 'copies'}):</>
                ) : (
                  <>Base Printing ({b.page_count} pgs × {b.copies} copy @ ₹{b.rate_per_page}/p):</>
                )}
              </span>
              <span className="font-semibold text-slate-900">₹{b.printing_cost.toFixed(2)}</span>
            </div>

            {b.binding_cost > 0 && (
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-600">Binding Service:</span>
                <span className="font-semibold text-slate-900">₹{b.binding_cost.toFixed(2)}</span>
              </div>
            )}

            {b.lamination_cost > 0 && (
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-600">Lamination:</span>
                <span className="font-semibold text-slate-900">₹{b.lamination_cost.toFixed(2)}</span>
              </div>
            )}

            {b.urgency_cost > 0 && (
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-600">Urgent Processing Fee:</span>
                <span className="font-semibold text-slate-900">₹{b.urgency_cost.toFixed(2)}</span>
              </div>
            )}

            {b.discount > 0 && (
              <div className="flex justify-between items-center py-1 border-b border-slate-100 text-emerald-600">
                <span>Bulk Order Discount:</span>
                <span className="font-semibold">-₹{b.discount.toFixed(2)}</span>
              </div>
            )}

            {/* Total Frozen Amount */}
            <div className="flex justify-between items-baseline pt-3 border-t-2 border-slate-800">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-slate-500 block">
                  Final Amount to Pay
                </span>
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Guaranteed Locked Price
                </span>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-slate-900">
                  ₹{b.final_total}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back / Edit Options</span>
          </button>

          {!isShopOpen ? (
            <button
              type="button"
              disabled
              className="px-6 py-3 bg-rose-600 text-white font-black text-xs sm:text-sm rounded-xl cursor-not-allowed flex items-center gap-2 opacity-90 shadow-sm"
            >
              <StatusBlinkDot isOpen={false} size="sm" />
              <span>Shop is Closed – Payment Unavailable</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onProceedToPayment(order)}
              className="btn-smooth btn-dual-shimmer px-6 py-3 text-[#FFF5E1] font-extrabold text-sm sm:text-base rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Proceed to Payment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
