import React, { useState } from 'react';
import {
  BellRing,
  Store,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  X,
  MapPin,
  Check,
} from 'lucide-react';
import { Order } from '../types/printease';

interface Props {
  order: Order;
  onClose: () => void;
  onViewOrder: (orderId: string) => void;
  onPermanentlyDismiss?: (orderId: string) => void;
}

export const PickupAlertModal: React.FC<Props> = ({
  order,
  onClose,
  onViewOrder,
  onPermanentlyDismiss,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(true);

  const handleClose = () => {
    if (dontShowAgain && onPermanentlyDismiss) {
      onPermanentlyDismiss(order.order_id);
    }
    onClose();
  };

  const handleView = () => {
    if (dontShowAgain && onPermanentlyDismiss) {
      onPermanentlyDismiss(order.order_id);
    }
    onViewOrder(order.order_id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border-2 border-emerald-400 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white text-center relative overflow-hidden">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-white text-emerald-600 flex items-center justify-center mx-auto mb-2 shadow-lg">
            <BellRing className="w-7 h-7 text-emerald-600" />
          </div>

          <span className="inline-block px-3 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-black uppercase tracking-wider mb-1">
            Ready for Pickup!
          </span>

          <h3 className="text-xl sm:text-2xl font-black tracking-tight">
            Your PrintEase order is ready!
          </h3>

          <p className="text-emerald-100 text-xs mt-0.5">
            Printing & binding has been completed by the shopkeeper.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 text-center space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
              Order ID
            </span>
            <span className="font-mono text-2xl sm:text-3xl font-black text-emerald-700 block">
              {order.order_id}
            </span>
            <div className="text-xs text-emerald-900 mt-1.5 font-medium truncate max-w-xs mx-auto">
              File: <span className="font-bold">{order.file_name}</span> ({order.page_count} pages, {order.options.copies} copy)
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-left flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700">
              <span className="font-bold text-slate-900 block mb-0.5">
                Pickup Counter:
              </span>
              Please visit the PrintEase Xerox counter, tell the shopkeeper your Order ID{' '}
              <strong className="text-[#C48B28] font-mono">#{order.order_id}</strong>, and collect your fresh prints.
            </div>
          </div>

          {/* Do not show again checkbox */}
          <label className="flex items-center justify-center gap-2 text-xs text-slate-500 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded border-[#C48B28]/40 text-[#C48B28] focus:ring-[#C48B28] w-4 h-4"
            />
            <span>Don't show this popup again for this order</span>
          </label>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="w-1/2 py-2.5 border border-slate-300 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={handleView}
            className="btn-smooth btn-dual-shimmer w-1/2 py-2.5 text-[#FFF5E1] text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>View Order</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
