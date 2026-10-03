import React from 'react';
import {
  Upload,
  SlidersHorizontal,
  Lock,
  Hash,
  BellRing,
  Download,
  Printer,
  CheckCircle2,
  Store,
  ArrowUp,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';

interface Props {
  onStartUpload: () => void;
  onTrackOrder: () => void;
}

export const WorkflowBanner: React.FC<Props> = ({ onStartUpload, onTrackOrder }) => {
  return (
    <div
      id="how-it-works"
      className="bg-gradient-to-br from-[#422C09] via-[#5A3C0B] to-[#422C09] text-[#FFF5E1] rounded-3xl p-6 sm:p-10 shadow-2xl border border-[#C48B28]/40 relative overflow-hidden mb-6 scroll-mt-20"
    >
      {/* Decorative ambient background */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-[#C48B28]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#C48B28]/30">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C48B28]/25 border border-[#C48B28]/40 text-[#EBC176] text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#EBC176]" />
            <span>End-to-End Smart Campus Printing</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#FFF5E1] tracking-tight">
            How PrintEase Works (Live Integrated Flow)
          </h2>
          <p className="text-xs sm:text-sm text-[#FFF5E1]/80 mt-1">
            Zero queue waiting at the shop counter • Real-time status notifications • 7-day privacy auto-deletion
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onStartUpload}
            className="btn-smooth btn-dual-shimmer px-4 py-2.5 text-[#FFF5E1] text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Visual Workflow Steps (Reference Diagram Replica) */}
      <div className="relative z-10 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Phase 1: Student Flow */}
          <div className="bg-[#422C09]/80 border border-[#C48B28]/30 rounded-2xl p-5 backdrop-blur-md hover:border-[#C48B28]/60 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-xs font-extrabold text-[#EBC176] uppercase tracking-wider">
                <span className="w-6 h-6 rounded-full bg-[#C48B28] text-[#FFF5E1] flex items-center justify-center text-xs shadow-md">
                  1
                </span>
                <span>Student Flow</span>
              </div>
              <span className="text-[10px] text-[#EBC176] font-bold bg-[#C48B28]/25 px-2 py-0.5 rounded-md border border-[#C48B28]/40">
                Online
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-200">
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5">
                <Upload className="w-4 h-4 text-[#EBC176] shrink-0" />
                <span>Upload File (PDF / Images / Docs)</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5">
                <SlidersHorizontal className="w-4 h-4 text-[#EBC176] shrink-0" />
                <span>Select Options (B&W/Color, Binding)</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Lock Price & Secure Pay (UPI / Wallet)</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5 font-bold text-emerald-300">
                <Hash className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Get Atomic Order ID (e.g. PE48291)</span>
              </div>
            </div>
          </div>

          {/* Phase 2: Shopkeeper Flow */}
          <div className="bg-[#422C09]/80 border border-[#C48B28]/30 rounded-2xl p-5 backdrop-blur-md hover:border-[#C48B28]/60 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-xs font-extrabold text-[#EBC176] uppercase tracking-wider">
                <span className="w-6 h-6 rounded-full bg-[#C48B28] text-[#FFF5E1] flex items-center justify-center text-xs shadow-md">
                  2
                </span>
                <span>Shopkeeper Flow</span>
              </div>
              <span className="text-[10px] text-[#EBC176] font-bold bg-[#C48B28]/25 px-2 py-0.5 rounded-md border border-[#C48B28]/40">
                Print Desk
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-200">
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5">
                <BellRing className="w-4 h-4 text-[#EBC176] shrink-0" />
                <span>Instant Audio Alert on Paid Order</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5">
                <Download className="w-4 h-4 text-[#EBC176] shrink-0" />
                <span>Download Secure File (7-Day Limit)</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5">
                <Printer className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Print & Bind as Specified</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5 font-bold text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Update Status: &ldquo;Ready for Pickup&rdquo;</span>
              </div>
            </div>
          </div>

          {/* Phase 3: Pickup & Completion */}
          <div className="bg-[#422C09]/80 border border-emerald-500/30 rounded-2xl p-5 backdrop-blur-md hover:border-emerald-400/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-300 uppercase tracking-wider">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs shadow-md">
                  3
                </span>
                <span>Express Pickup</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800">
                Completed
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-200">
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5">
                <BellRing className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-emerald-200 font-bold">Student receives Ready Notification</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5">
                <Store className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Visit PrintEase Shop Counter</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5">
                <Hash className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Show Order ID & 4-Digit Pickup PIN</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5 font-bold text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Instant Handover & Auto 7-Day Purge</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info note */}
        <div className="mt-6 pt-4 border-t border-[#C48B28]/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>7-Day Retention Notice:</strong> Uploaded documents are stored for 7 days only and automatically deleted from our server.
            </span>
          </div>
          <button
            type="button"
            onClick={onTrackOrder}
            className="text-[#EBC176] hover:text-white font-bold underline cursor-pointer shrink-0"
          >
            Have an existing order? Track it here
          </button>
        </div>
      </div>
    </div>
  );
};
