import React, { useRef } from 'react';
import {
  Printer,
  Download,
  X,
  CheckCircle2,
  ShieldCheck,
  QrCode,
  FileText,
} from 'lucide-react';
import { Order } from '../types/printease';

interface Props {
  order: Order;
  onClose: () => void;
}

export const ReceiptModal: React.FC<Props> = ({ order, onClose }) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Controls */}
        <div className="p-4 bg-gradient-to-r from-[#422C09] via-[#5A3C0B] to-[#422C09] text-[#FFF5E1] flex items-center justify-between border-b border-[#C48B28]/30 no-print">
          <span className="text-xs font-bold uppercase tracking-wider text-[#EBC176]">
            PrintEase Official Digital Receipt
          </span>
          <button
            onClick={onClose}
            className="p-1 text-[#FFF5E1]/70 hover:text-[#FFF5E1] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Paper */}
        <div
          ref={receiptRef}
          className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-800 bg-white"
        >
          {/* Header */}
          <div className="text-center border-b-2 border-dashed border-slate-300 pb-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#C48B28] to-[#EBC176] text-[#FFF5E1] flex items-center justify-center mx-auto mb-2 shadow-md shadow-[#C48B28]/20">
              <Printer className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              Print<span className="text-[#C48B28]">Ease</span>
            </h2>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
              Online Xerox & Document Printing Service
            </p>
            <p className="text-[11px] text-slate-400">
              Campus Tech Hub, Counter #2 • GSTIN: 27AABCP1234F1Z
            </p>
          </div>

          {/* Order & Payment Header */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Order ID:</span>
              <span className="font-mono font-black text-sm text-[#C48B28]">
                #{order.order_id}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Customer:</span>
              <span className="font-bold text-slate-900">{order.customer_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Contact:</span>
              <span className="text-slate-700">{order.customer_phone || order.customer_email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Date & Time:</span>
              <span className="text-slate-700">{formattedDate}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-200">
              <span className="text-slate-500">Payment Status:</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                PAID (Verified)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Txn Reference:</span>
              <span className="font-mono text-[10px] text-slate-600">
                {order.transaction_reference || 'TXN_AUTH_SAFE'}
              </span>
            </div>
          </div>

          {/* Itemized list */}
          <div className="text-xs space-y-2.5">
            <div className="font-bold text-slate-900 pb-1 border-b border-slate-200">
              Document Specifications
            </div>

            <div className="flex justify-between text-slate-700">
              <span>File: {order.file_name}</span>
              <span className="font-semibold">{order.page_count} Pages</span>
            </div>

            <div className="flex justify-between text-slate-700">
              <span>
                Printing ({order.options.paper_size},{' '}
                {order.options.color_type === 'MIXED'
                  ? `Color P${order.options.custom_color_pages || 'Mixed'}`
                  : order.options.color_type},{' '}
                {order.options.side_type}, {order.options.copies} Copies)
              </span>
              <span className="font-semibold">
                ₹{order.price_breakdown.printing_cost.toFixed(2)}
              </span>
            </div>

            {order.price_breakdown.binding_cost > 0 && (
              <div className="flex justify-between text-slate-700">
                <span>Binding ({order.options.binding_type})</span>
                <span className="font-semibold">
                  ₹{order.price_breakdown.binding_cost.toFixed(2)}
                </span>
              </div>
            )}

            {order.price_breakdown.lamination_cost > 0 && (
              <div className="flex justify-between text-slate-700">
                <span>Lamination Service</span>
                <span className="font-semibold">
                  ₹{order.price_breakdown.lamination_cost.toFixed(2)}
                </span>
              </div>
            )}

            {order.price_breakdown.urgency_cost > 0 && (
              <div className="flex justify-between text-slate-700">
                <span>Urgent Processing Fee</span>
                <span className="font-semibold">
                  ₹{order.price_breakdown.urgency_cost.toFixed(2)}
                </span>
              </div>
            )}

            {order.price_breakdown.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Bulk Discount</span>
                <span className="font-semibold">
                  -₹{order.price_breakdown.discount.toFixed(2)}
                </span>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between items-baseline pt-3 border-t-2 border-slate-900 text-sm">
              <span className="font-black text-slate-900">Total Paid:</span>
              <span className="text-xl font-black text-slate-900">
                ₹{order.price_breakdown.final_total}
              </span>
            </div>
          </div>

          {/* Barcode / Shop Counter Verification token */}
          <div className="border-t-2 border-dashed border-slate-300 pt-5 text-center space-y-2">
            <div className="inline-block p-2 bg-slate-100 rounded-xl border border-slate-200">
              <QrCode className="w-16 h-16 mx-auto text-slate-900" />
            </div>
            <div className="font-mono text-xs font-bold text-slate-700 tracking-widest">
              ORDER #{order.order_id}
            </div>
            <p className="text-[11px] text-slate-500">
              Show this barcode / Order ID at the Xerox shop counter for pickup.
            </p>
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Document is securely stored for 7 days, then automatically purged for privacy.</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 no-print">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="btn-smooth btn-dual-shimmer px-5 py-2.5 text-[#FFF5E1] text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
