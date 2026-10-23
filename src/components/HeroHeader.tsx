import React from 'react';
import { Upload, Hash, Sparkles, Shield, Clock, CheckCircle2, Store, Moon, HardDrive } from 'lucide-react';
import { ShopStatusInfo } from '../types/printease';
import { StatusBlinkDot } from './StatusBlinkDot';

interface HeroHeaderProps {
  onStartUpload: () => void;
  onTrackOrder: () => void;
  onOpenStoredFiles?: () => void;
  shopStatus?: ShopStatusInfo | null;
}

export const HeroHeader: React.FC<HeroHeaderProps> = ({
  onStartUpload,
  onTrackOrder,
  onOpenStoredFiles,
  shopStatus,
}) => {
  const isShopOpen = shopStatus ? shopStatus.status === 'OPEN' : true;

  return (
    <div className="bg-gradient-to-br from-[#422C09] via-[#5A3C0B] to-[#422C09] text-[#FFF5E1] rounded-3xl p-6 sm:p-10 shadow-2xl border-2 border-[#C48B28]/40 relative overflow-hidden mb-6">
      {/* Decorative ambient background glows with Color 3 Mecca Gold and Color 1 Cream */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-[#C48B28]/20 rounded-full blur-3xl pointer-events-none animate-float-smooth" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-[#C48B28]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          {/* Badge Row with Live Shop Status Observer */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/30 border border-[#C48B28]/40 text-[#FFF5E1] text-xs font-bold tracking-wide shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#C48B28] animate-pulse-subtle" />
              <span>Fastest Campus Xerox &amp; Printing Station</span>
            </div>

            {shopStatus && (
              <div
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border-2 shadow-xs ${
                  isShopOpen
                    ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50'
                    : 'bg-rose-950/70 text-rose-300 border-rose-500/50 animate-pulse'
                }`}
              >
                <StatusBlinkDot isOpen={isShopOpen} size="sm" />
                <span>{isShopOpen ? 'SHOP OPEN • ACCEPTING ORDERS' : 'SHOP CLOSED • ORDERS PAUSED'}</span>
              </div>
            )}
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#FFF5E1] mb-2">
            Print<span className="text-[#C48B28] underline decoration-[#C48B28]/40">Ease</span>
          </h1>

          {/* Tagline */}
          <p className="text-xl sm:text-2xl font-bold text-[#FFF5E1] mb-1">
            &ldquo;Your Documents. Our Priority.&rdquo;
          </p>

          {/* Sub-tagline */}
          <p className="text-sm sm:text-base text-[#FFF5E1]/80 font-semibold tracking-wide">
            Upload • Pay • Print • Done!
          </p>

          {/* Privacy & Speed pill badges */}
          <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-[#FFF5E1]">
            <span className="inline-flex items-center gap-1.5 bg-black/25 px-3 py-1.5 rounded-xl border border-[#C48B28]/35 font-semibold shadow-2xs">
              <Shield className="w-3.5 h-3.5 text-[#C48B28]" />
              <span>User Storage Control</span>
            </span>
            <span className="inline-flex items-center gap-1.5 bg-black/25 px-3 py-1.5 rounded-xl border border-[#C48B28]/35 font-semibold shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-[#C48B28]" />
              <span>Zero Counter Waiting</span>
            </span>
            <span className="inline-flex items-center gap-1.5 bg-black/25 px-3 py-1.5 rounded-xl border border-[#C48B28]/35 font-semibold shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#C48B28]" />
              <span>Verified Page Count</span>
            </span>
          </div>
        </div>

        {/* Action Buttons with Smooth Hover Animation */}
        <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onStartUpload}
            className="btn-smooth btn-dual-shimmer px-6 py-4 text-[#FFF5E1] font-black text-sm sm:text-base rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer animate-dual-glow border border-[#C48B28]"
          >
            <Upload className="w-5 h-5 text-[#FFF5E1]" />
            <span>Upload Document &amp; Print</span>
          </button>

          <button
            type="button"
            onClick={onTrackOrder}
            className="btn-smooth px-5 py-4 bg-[#FFF5E1] hover:bg-white text-[#422C09] font-black text-sm sm:text-base rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all border border-[#C48B28]/40"
          >
            <Hash className="w-4 h-4 text-[#C48B28]" />
            <span>Track Order ID</span>
          </button>

          {onOpenStoredFiles && (
            <button
              type="button"
              onClick={onOpenStoredFiles}
              className="btn-smooth px-5 py-4 bg-[#FFF5E1] hover:bg-white text-[#422C09] font-black text-sm sm:text-base rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all border border-[#C48B28]/40"
            >
              <HardDrive className="w-4 h-4 text-[#C48B28]" />
              <span>Stored Files</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
