import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  FileText,
  PieChart,
  Calendar,
  Download,
  CheckCircle2,
  Clock,
  Printer,
  Package,
  Layers,
  Sparkles,
  Sliders,
  Filter,
} from 'lucide-react';
import { Order, PricingSettings } from '../types/printease';

interface Props {
  orders: Order[];
  pricing: PricingSettings;
  onUpdatePricing: (pricing: Partial<PricingSettings>) => Promise<void>;
  onViewReceipt: (order: Order) => void;
}

export const AnalyticsDashboardView: React.FC<Props> = ({
  orders,
  pricing,
  onUpdatePricing,
  onViewReceipt,
}) => {
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week'>('all');
  const [editingPricing, setEditingPricing] = useState<PricingSettings>(pricing);
  const [savingPricing, setSavingPricing] = useState(false);
  const [pricingSuccess, setPricingSuccess] = useState(false);

  // Financial aggregates
  const paidOrders = orders.filter((o) => o.payment_status === 'PAID');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.price_breakdown?.final_total || 0), 0);
  const totalPagesPrinted = orders.reduce((sum, o) => sum + (o.page_count * (o.options.copies || 1)), 0);

  // Service distribution counts
  const bwCount = orders.filter((o) => o.options.color_type === 'BW').length;
  const colorCount = orders.filter((o) => o.options.color_type === 'COLOR').length;
  const spiralCount = orders.filter((o) => o.options.binding_type === 'SPIRAL').length;
  const laminationCount = orders.filter((o) => o.options.lamination).length;
  const staplingCount = orders.filter((o) => o.options.binding_type === 'STAPLE').length;
  const deliveryCount = orders.filter((o) => o.options.collection_type === 'DELIVERY').length;
  const pickupCount = orders.filter((o) => o.options.collection_type === 'PICKUP').length;

  const avgOrderValue = paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0;

  // Handle pricing save
  const handleSaveRates = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPricing(true);
    setPricingSuccess(false);
    try {
      await onUpdatePricing(editingPricing);
      setPricingSuccess(true);
      setTimeout(() => setPricingSuccess(false), 3000);
    } catch (e) {
      alert('Failed to update base pricing');
    } finally {
      setSavingPricing(false);
    }
  };

  // Export orders to CSV
  const handleExportCSV = () => {
    const headers = ['Order ID,Customer,Phone,File Name,Pages,Copies,Type,Binding,Total (INR),Payment Status,Order Status,Date'];
    const rows = orders.map((o) => [
      o.order_id,
      `"${String(o.customer_name || '').replace(/"/g, '""')}"`,
      o.customer_phone,
      `"${String(o.file_name || '').replace(/"/g, '""')}"`,
      o.page_count,
      o.options.copies,
      `${o.options.color_type} (${o.options.side_type})`,
      o.options.binding_type,
      o.price_breakdown.final_total,
      o.payment_status,
      o.order_status,
      new Date(o.created_at).toLocaleString(),
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PrintEase_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-[#422C09] via-[#5A3C0B] to-[#422C09] rounded-3xl p-6 sm:p-8 text-[#FFF5E1] shadow-xl relative overflow-hidden border border-[#C48B28]/35">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#C48B28]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FFF5E1]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#C48B28] text-xs font-bold uppercase tracking-wider backdrop-blur-sm mb-3">
              <TrendingUp className="w-3.5 h-3.5 text-[#C48B28]" />
              <span>Owner Financial Command & Turnover Analytics</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Business & Revenue Intelligence
            </h1>
            <p className="text-[#FFF5E1]/80 text-sm sm:text-base mt-2 max-w-xl">
              Real-time audit ledger, print volume margins, finishing metrics, and dynamic base pricing adjustments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-[#FFF5E1] text-xs font-bold transition-all border border-white/20 flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4 text-[#C48B28]" />
              <span>Export CSV Ledger</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
            ₹{totalRevenue}
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold block mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Across {paidOrders.length} verified transactions
          </span>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pages Processed</span>
            <div className="w-8 h-8 rounded-xl bg-[#C48B28]/15 text-[#C48B28] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
            {totalPagesPrinted}
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">
            A4 & A3 printed copies
          </span>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Average Ticket</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
            ₹{avgOrderValue}
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">
            Per customer checkout
          </span>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
            <div className="w-8 h-8 rounded-xl bg-[#C48B28]/15 text-[#C48B28] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
            {orders.length}
          </span>
          <span className="text-[11px] text-[#C48B28] font-semibold block mt-1">
            Atomic IDs generated
          </span>
        </div>
      </div>

      {/* Analytics Breakdown & Base Rate Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Services & Distribution (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-[#C48B28]" />
            <span>Service Usage & Volume Distribution</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-500 block mb-1">Black & White</span>
              <span className="text-2xl font-black text-slate-900 font-mono">{bwCount}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">jobs</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#C48B28]/10 border border-[#C48B28]/30">
              <span className="text-xs font-bold text-[#422C09] block mb-1">Color Prints</span>
              <span className="text-2xl font-black text-[#422C09] font-mono">{colorCount}</span>
              <span className="text-[10px] text-[#C48B28] block mt-0.5">high-margin jobs</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200">
              <span className="text-xs font-bold text-emerald-700 block mb-1">Spiral Binding</span>
              <span className="text-2xl font-black text-emerald-900 font-mono">{spiralCount}</span>
              <span className="text-[10px] text-emerald-600 block mt-0.5">₹30 add-on each</span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <span className="text-xs font-bold text-amber-700 block mb-1">Lamination</span>
              <span className="text-2xl font-black text-amber-900 font-mono">{laminationCount}</span>
              <span className="text-[10px] text-amber-500 block mt-0.5">protective coat</span>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
              <span className="text-xs font-bold text-purple-700 block mb-1">Corner Stapling</span>
              <span className="text-2xl font-black text-purple-900 font-mono">{staplingCount}</span>
              <span className="text-[10px] text-purple-500 block mt-0.5">booklets</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-xs font-bold text-emerald-700 block mb-1">Pickup vs Delivery</span>
              <span className="text-xl font-black text-emerald-900 font-mono">
                {pickupCount} / {deliveryCount}
              </span>
              <span className="text-[10px] text-emerald-600 block mt-0.5">counter vs door</span>
            </div>
          </div>

          {/* Recent Orders Ledger Snapshot */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Live Order Ledger (Last 6 Transactions)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold">
                    <th className="pb-2">Order ID</th>
                    <th className="pb-2">Customer</th>
                    <th className="pb-2">Document</th>
                    <th className="pb-2">Amount</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.slice(0, 6).map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50">
                      <td className="py-2.5 font-mono font-bold text-[#C48B28]">
                        #{ord.order_id}
                      </td>
                      <td className="py-2.5 font-semibold text-slate-800">
                        {ord.customer_name}
                      </td>
                      <td className="py-2.5 text-slate-600 truncate max-w-[140px]">
                        {ord.file_name}
                      </td>
                      <td className="py-2.5 font-mono font-bold text-slate-900">
                        ₹{ord.price_breakdown.final_total}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ord.payment_status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ord.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Base Rate Configuration (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-[#C48B28]/20 text-[#C48B28] flex items-center justify-center font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Base Rate Customization
              </h3>
              <p className="text-xs text-slate-500">
                Adjust prices without modifying past locked orders
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveRates} className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  A4 B&W (per page)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={editingPricing.a4_bw}
                    onChange={(e) =>
                      setEditingPricing({ ...editingPricing, a4_bw: parseFloat(e.target.value) || 1.0 })
                    }
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  A4 Color (per page)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={editingPricing.a4_color}
                    onChange={(e) =>
                      setEditingPricing({ ...editingPricing, a4_color: parseFloat(e.target.value) || 5.0 })
                    }
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  A3 B&W (per page)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={editingPricing.a3_bw}
                    onChange={(e) =>
                      setEditingPricing({ ...editingPricing, a3_bw: parseFloat(e.target.value) || 3.0 })
                    }
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  A3 Color (per page)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={editingPricing.a3_color}
                    onChange={(e) =>
                      setEditingPricing({ ...editingPricing, a3_color: parseFloat(e.target.value) || 10.0 })
                    }
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Spiral Binding (flat)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    step="1"
                    min="5"
                    value={editingPricing.spiral_binding}
                    onChange={(e) =>
                      setEditingPricing({ ...editingPricing, spiral_binding: parseFloat(e.target.value) || 30.0 })
                    }
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Lamination (per page)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    step="1"
                    min="5"
                    value={editingPricing.lamination}
                    onChange={(e) =>
                      setEditingPricing({ ...editingPricing, lamination: parseFloat(e.target.value) || 10.0 })
                    }
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingPricing}
              className="btn-smooth btn-dual-shimmer w-full py-3 text-[#FFF5E1] rounded-xl font-bold text-xs shadow-md shadow-[#C48B28]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sliders className="w-4 h-4 text-[#FFF5E1]" />
              <span>{savingPricing ? 'Updating Rates...' : 'Save & Publish Rates'}</span>
            </button>

            {pricingSuccess && (
              <div className="p-3 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Base rates updated in database successfully!</span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
