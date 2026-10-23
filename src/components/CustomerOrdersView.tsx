import React from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  Printer,
  Download,
  Search,
  Plus,
  ArrowRight,
  ShieldCheck,
  FolderLock,
  RotateCcw,
  Award,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Order } from '../types/printease';

interface Props {
  orders: Order[];
  onSelectOrder: (orderId: string) => void;
  onViewReceipt: (order: Order) => void;
  onNewPrint: () => void;
  onRefreshOrders?: () => void;
}

export const CustomerOrdersView: React.FC<Props> = ({
  orders,
  onSelectOrder,
  onViewReceipt,
  onNewPrint,
}) => {
  const completedOrders = orders.filter((o) => o.order_status === 'COMPLETED' && o.payment_status === 'PAID');
  const loyaltyPoints = completedOrders.length * 10;
  const rewardThreshold = 100;
  const discountAmount = 20;

  const handleRepeatPrint = (order: Order) => {
    try {
      const draft = {
        options: order.options,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        customerPhone: order.customer_phone,
        uploadedFileData: order.file_deleted
          ? null
          : {
              file_id: order.file_id,
              original_name: order.file_name,
              mime_type: order.mime_type,
              file_size: order.file_size,
              page_count: order.page_count,
            },
      };
      localStorage.setItem('printease_order_draft', JSON.stringify(draft));
      if (order.file_deleted) {
        alert(
          `Printing specifications from order #${order.order_id} restored! The original file was auto-purged under our 7-day privacy policy, so please select or upload your document to proceed.`
        );
      }
    } catch (e) {
      console.warn('Could not store repeat draft:', e);
    }
    onNewPrint();
  };
  return (
    <div className="max-w-5xl mx-auto space-y-6 mb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            My Print Orders & History
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            View live status, pickup codes, and receipts for all your document print jobs.
          </p>
        </div>

        <button
          onClick={onNewPrint}
          className="btn-smooth btn-dual-shimmer px-5 py-2.5 text-[#FFF5E1] text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#FFF5E1]" />
          <span>New Print Job</span>
        </button>
      </div>

      {/* Student Loyalty Rewards Card */}
      <div className="bg-gradient-to-r from-[#422C09] via-[#5A3C0B] to-[#422C09] p-5 sm:p-6 rounded-3xl text-[#FFF5E1] border border-[#C48B28]/40 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#C48B28]/25 text-[#EBC176] flex items-center justify-center border border-[#C48B28]/50 shadow-inner shrink-0">
            <Award className="w-6 h-6 text-[#C48B28]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black uppercase tracking-wider text-[#EBC176]">
                🎓 Student Loyalty Rewards
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Active Tier
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Earn 10 points on every completed print order. Reach {rewardThreshold} points for ₹{discountAmount} off!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
              Your Rewards Balance
            </span>
            <span className="font-mono text-2xl font-black text-[#EBC176]">
              {loyaltyPoints} <span className="text-xs font-normal text-slate-300">pts</span>
            </span>
          </div>
          <div className="h-9 w-px bg-white/20" />
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
              Orders Completed
            </span>
            <span className="font-mono text-lg font-bold text-white">
              {completedOrders.length}
            </span>
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-[#FFF5E1]/90 rounded-3xl border border-[#C48B28]/30 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#C48B28]/15 text-[#C48B28] flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[#422C09] mb-1">No Orders Found</h3>
          <p className="text-xs sm:text-sm text-[#5A3C0B]/80 max-w-sm mx-auto mb-6">
            You haven't placed any print orders yet. Upload your first document to experience instant printing!
          </p>
          <button
            onClick={onNewPrint}
            className="btn-smooth btn-dual-shimmer px-6 py-3 text-[#FFF5E1] font-bold text-sm rounded-xl transition-colors cursor-pointer"
          >
            Upload Document Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {orders.map((order) => {
            const isReady = order.order_status === 'READY_FOR_PICKUP';
            const isCompleted = order.order_status === 'COMPLETED';

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border p-5 sm:p-6 transition-all hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isReady
                    ? 'border-emerald-400 bg-emerald-50/20 ring-2 ring-emerald-400/20'
                    : 'border-[#C48B28]/30'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-base font-black text-[#C48B28]">
                      #{order.order_id}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                        isCompleted
                          ? 'bg-slate-100 text-slate-700'
                          : isReady
                          ? 'bg-emerald-500 text-white animate-pulse'
                          : order.order_status === 'PRINTING'
                          ? 'bg-[#C48B28] text-[#FFF5E1]'
                          : 'bg-[#C48B28]/20 text-[#422C09]'
                      }`}
                    >
                      {String(order.order_status || '').replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-slate-400">
                      • {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>

                    {/* Storage preference badge */}
                    {order.retention_choice === 'PERMANENT' ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                        <FolderLock className="w-3 h-3 text-emerald-600" />
                        <span>Permanently Stored</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 text-[10px] font-bold border border-rose-200 flex items-center gap-1">
                        <Trash2 className="w-3 h-3 text-rose-600" />
                        <span>Delete After Printing</span>
                      </span>
                    )}
                  </div>

                  <div className="text-sm font-bold text-slate-900 truncate max-w-md">
                    {order.file_name}
                  </div>

                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                    <span>{order.page_count} Pages</span>
                    <span>• {order.options.copies} Copies</span>
                    <span>• {order.options.paper_size} {order.options.color_type === 'MIXED' ? `Color P${order.options.custom_color_pages || 'Mixed'}` : order.options.color_type}</span>
                    <span>• {order.options.binding_type}</span>
                    <span className="font-bold text-slate-800">
                      Total: ₹{order.price_breakdown.final_total} ({order.payment_status} ✓)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <button
                    onClick={() => handleRepeatPrint(order)}
                    className="p-2.5 sm:px-3 text-xs font-bold text-[#422C09] hover:text-[#C48B28] bg-white hover:bg-[#FFF5E1] border border-[#C48B28]/40 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Repeat print with same settings"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#C48B28]" />
                    <span className="hidden sm:inline">Repeat</span>
                  </button>

                  <button
                    onClick={() => onViewReceipt(order)}
                    className="p-2.5 sm:px-3 text-xs font-bold text-[#422C09] hover:text-[#C48B28] bg-[#FFF5E1] hover:bg-[#FDF6E8] border border-[#C48B28]/40 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="View Receipt"
                  >
                    <Download className="w-4 h-4 text-[#C48B28]" />
                    <span className="hidden sm:inline">Receipt</span>
                  </button>

                  <button
                    onClick={() => onSelectOrder(order.order_id)}
                    className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                      isReady
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-[#C48B28] hover:bg-[#A9741D] text-[#FFF5E1]'
                    }`}
                  >
                    <span>Track Live</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
