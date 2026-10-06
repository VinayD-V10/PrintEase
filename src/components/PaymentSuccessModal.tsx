import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  FileText,
  Printer,
  Download,
  Share2,
  ArrowRight,
  Sparkles,
  QrCode,
  ShieldCheck,
  X,
  Store,
  Copy,
  Check,
} from 'lucide-react';
import { Order, PaymentTransaction } from '../types/printease';

interface Props {
  order: Order;
  payment?: PaymentTransaction;
  onClose: () => void;
  onViewReceipt: () => void;
  onTrackOrder: (orderId: string) => void;
}

export const PaymentSuccessModal: React.FC<Props> = ({
  order,
  payment,
  onClose,
  onViewReceipt,
  onTrackOrder,
}) => {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    // Launch celebratory confetti
    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#C48B28', '#DDA33B', '#10b981', '#EBC176'],
      });
    } catch {
      // Ignore if confetti not supported
    }
  }, []);

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order.order_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="p-8 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-white/10 rounded-full blur-2xl" />

          <div className="w-16 h-16 rounded-3xl bg-white text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-900/30">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-xs font-extrabold uppercase tracking-wider mb-2">
            Payment Verified & Order Confirmed
          </span>

          <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
            Order Sent to Print Queue!
          </h3>

          <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-sm mx-auto">
            The shopkeeper has received your authorized document and will begin printing immediately.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          {/* Order ID Banner */}
          <div className="p-5 bg-[#C48B28]/15 border-2 border-[#C48B28]/40 rounded-2xl text-center shadow-xs relative">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">
              Your Official PrintEase Order ID
            </span>
            <div className="flex items-center justify-center gap-3">
              <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-[#C48B28]">
                {order.order_id}
              </div>
              <button
                type="button"
                onClick={handleCopyOrderId}
                className="p-2 rounded-xl bg-white/80 hover:bg-white text-[#C48B28] hover:text-[#5A3C0B] border border-[#C48B28]/30 shadow-xs transition-all cursor-pointer"
                title="Copy Order ID"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            {copied && (
              <span className="text-[10px] text-emerald-700 font-bold block mt-1 animate-fadeIn">
                Order ID copied to clipboard!
              </span>
            )}
            <div className="text-xs text-slate-600 mt-1 font-medium">
              Show this Order ID at the shop counter to collect your prints.
            </div>
          </div>

          {/* Details list */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2.5">
            <div className="flex justify-between items-center text-slate-600">
              <span>Customer Name:</span>
              <span className="font-bold text-slate-900">{order.customer_name}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Document File:</span>
              <span className="font-bold text-slate-900 truncate max-w-[200px]">
                {order.file_name}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Specifications:</span>
              <span className="font-bold text-slate-900">
                {order.page_count} pgs • {order.options.copies} copy • {order.options.color_type} • {order.options.binding_type}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Amount Paid:</span>
              <span className="font-black text-emerald-700 text-sm">
                ₹{order.price_breakdown.final_total} (PAID ✓)
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Transaction Ref:</span>
              <span className="font-mono text-slate-700">
                {order.transaction_reference || 'TXN_VERIFIED'}
              </span>
            </div>
          </div>

          {/* Shop Instructions */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <Store className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900">
              <span className="font-bold block text-sm text-amber-950 mb-0.5">
                Next Step: Wait for Ready Notification
              </span>
              You will receive an instant screen alert once the shopkeeper finishes printing and marks it <strong>"Ready for Pickup"</strong>.
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={onViewReceipt}
            className="w-full sm:w-1/2 py-3 bg-white border border-[#C48B28]/40 hover:bg-[#C48B28]/10 text-[#422C09] text-xs sm:text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4 text-[#C48B28]" />
            <span>Download Receipt</span>
          </button>

          <button
            type="button"
            onClick={() => onTrackOrder(order.order_id)}
            className="btn-smooth btn-dual-shimmer w-full sm:w-1/2 py-3 text-[#FFF5E1] text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Live Order Tracking</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
