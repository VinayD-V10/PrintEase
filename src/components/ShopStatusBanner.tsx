import React from 'react';
import { Store, Clock, Moon, Sparkles } from 'lucide-react';
import { ShopStatusInfo } from '../types/printease';
import { StatusBlinkDot } from './StatusBlinkDot';

interface Props {
  shopStatus: ShopStatusInfo | null;
  onOpenOwnerControl?: () => void;
  isOwner?: boolean;
}

export const ShopStatusBanner: React.FC<Props> = ({
  shopStatus,
  onOpenOwnerControl,
  isOwner = false,
}) => {
  if (!shopStatus) return null;

  const isOpen = shopStatus.status === 'OPEN';

  return (
    <div
      id="shop-status-top"
      className={`w-full rounded-2xl p-4 sm:p-5 mb-5 transition-all duration-300 shadow-md border-2 ${
        isOpen
          ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-teal-500/10 border-emerald-500/40 text-emerald-950'
          : 'bg-gradient-to-r from-rose-500/15 via-rose-500/10 to-red-500/15 border-rose-500/40 text-rose-950'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
              isOpen
                ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white'
                : 'bg-gradient-to-tr from-rose-600 to-red-600 text-white animate-pulse'
            }`}
          >
            {isOpen ? <Store className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-xs ${
                  isOpen
                    ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                    : 'bg-rose-600 text-white shadow-rose-500/20 animate-pulse'
                }`}
              >
                <StatusBlinkDot isOpen={isOpen} size="md" />
                <span>{isOpen ? 'SHOP OPEN NOW' : 'SHOP CLOSED'}</span>
              </span>

              <span
                className={`text-xs font-extrabold px-2.5 py-0.5 rounded-lg border ${
                  isOpen
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border-rose-300'
                }`}
              >
                {isOpen ? '🟢 Accepting Print Orders' : '🔴 Orders Paused'}
              </span>

              {shopStatus.mode !== 'AUTO' && (
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  {shopStatus.mode === 'FORCE_OPEN' ? 'Manual (Open)' : 'Manual (Closed)'}
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm font-bold text-slate-800">
              {isOpen
                ? 'Online printing, xerox orders & counter pickups are currently ACTIVE.'
                : 'PrintEase is currently closed. Orders will resume during shop hours.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto text-xs">
          <div
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 border shadow-2xs ${
              isOpen
                ? 'bg-white text-emerald-900 border-emerald-300'
                : 'bg-white text-rose-900 border-rose-300'
            }`}
          >
            <Clock className="w-4 h-4 text-slate-600" />
            <span>
              Hours: <strong>{shopStatus.opening_time || '09:00 AM'}</strong> – <strong>{shopStatus.closing_time || '08:00 PM'}</strong>
            </span>
          </div>

          {isOwner && onOpenOwnerControl && (
            <button
              onClick={onOpenOwnerControl}
              className="btn-smooth btn-dual-shimmer px-4 py-2 text-[#FFF5E1] rounded-xl font-black transition-all cursor-pointer text-xs shadow-md"
            >
              Change Status
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
