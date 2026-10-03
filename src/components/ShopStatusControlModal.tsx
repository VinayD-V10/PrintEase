import React, { useState } from 'react';
import {
  Store,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Moon,
  Sun,
  Loader2,
} from 'lucide-react';
import { ShopStatusInfo, ShopMode } from '../types/printease';
import { StatusBlinkDot } from './StatusBlinkDot';

interface Props {
  currentStatus: ShopStatusInfo;
  onClose: () => void;
  onUpdateStatus: (updated: Partial<ShopStatusInfo>) => Promise<void>;
}

export const ShopStatusControlModal: React.FC<Props> = ({
  currentStatus,
  onClose,
  onUpdateStatus,
}) => {
  const [mode, setMode] = useState<ShopMode>(currentStatus.mode || 'AUTO');
  const [openingTime, setOpeningTime] = useState(currentStatus.opening_time || '09:00');
  const [closingTime, setClosingTime] = useState(currentStatus.closing_time || '20:00');
  const [isSaving, setIsSaving] = useState(false);

  // Confirmation dialog state
  const [confirmAction, setConfirmAction] = useState<'OPEN' | 'CLOSE' | null>(null);

  const isOpen = currentStatus.status === 'OPEN';

  const handleConfirmCloseShop = async () => {
    setIsSaving(true);
    try {
      await onUpdateStatus({
        status: 'CLOSED',
        mode: 'FORCE_CLOSED',
        opening_time: openingTime,
        closing_time: closingTime,
      });
      setConfirmAction(null);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmOpenShop = async () => {
    setIsSaving(true);
    try {
      await onUpdateStatus({
        status: 'OPEN',
        mode: 'FORCE_OPEN',
        opening_time: openingTime,
        closing_time: closingTime,
      });
      setConfirmAction(null);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSchedule = async () => {
    setIsSaving(true);
    try {
      await onUpdateStatus({
        mode,
        opening_time: openingTime,
        closing_time: closingTime,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#FFF5E1] via-[#FDF5E6] to-[#FCECCF] text-[#422C09] flex items-center justify-between border-b border-[#C48B28]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C48B28]/20 text-[#C48B28] flex items-center justify-center font-bold">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#C48B28] block">
                Shop Control Console
              </span>
              <h3 className="text-xl font-black tracking-tight text-[#422C09]">
                PrintEase Shop Status
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-[#422C09] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Live Status Display */}
          <div
            className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-4 ${
              isOpen
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold border ${
                  isOpen ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-rose-100 text-rose-700 border-rose-300'
                }`}
              >
                {isOpen ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Current Live Status
                </span>
                <span className="text-lg font-black tracking-tight flex items-center gap-2 mt-0.5">
                  <StatusBlinkDot isOpen={isOpen} size="lg" />
                  <span>{isOpen ? 'SHOP OPEN' : 'SHOP CLOSED'}</span>
                </span>
                <span className="text-xs text-slate-600 mt-1 block">
                  {isOpen
                    ? 'Accepting new print orders & payments.'
                    : 'New orders and payments are paused.'}
                </span>
              </div>
            </div>

            <div className="text-right text-xs">
              <span className="font-bold block text-slate-700">Mode:</span>
              <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 font-mono text-[11px] font-bold">
                {currentStatus.mode}
              </span>
            </div>
          </div>

          {/* Quick Manual Override Action Buttons */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Manual Status Switch
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Button: OPEN SHOP (Light Green) */}
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setConfirmAction('OPEN')}
                className={`py-3 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 border-2 transition-all cursor-pointer ${
                  isOpen
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 opacity-80'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-400 shadow-xs'
                }`}
              >
                <StatusBlinkDot isOpen={true} size="sm" />
                <span>OPEN SHOP</span>
              </button>

              {/* Button: CLOSE SHOP (Light Red) */}
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setConfirmAction('CLOSE')}
                className={`py-3 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 border-2 transition-all cursor-pointer ${
                  !isOpen
                    ? 'bg-rose-50 border-rose-300 text-rose-800 opacity-80'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-400 shadow-xs'
                }`}
              >
                <StatusBlinkDot isOpen={false} size="sm" />
                <span>CLOSE SHOP</span>
              </button>
            </div>
          </div>

          {/* Automatic Shop Hours Schedule */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#C48B28]" />
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Operating Schedule & Rules
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold">
                Timezone: Asia/Kolkata (IST)
              </span>
            </div>

            {/* Mode selection radio */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-600 block">Status Mode:</span>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <label
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
                    mode === 'AUTO'
                      ? 'bg-[#C48B28]/15 border-[#C48B28] text-[#422C09] font-bold'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="shopMode"
                    value="AUTO"
                    checked={mode === 'AUTO'}
                    onChange={() => setMode('AUTO')}
                    className="sr-only"
                  />
                  <span>⚙️ Automatic</span>
                  <span className="text-[10px] text-slate-400">By Schedule</span>
                </label>

                <label
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
                    mode === 'FORCE_OPEN'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="shopMode"
                    value="FORCE_OPEN"
                    checked={mode === 'FORCE_OPEN'}
                    onChange={() => setMode('FORCE_OPEN')}
                    className="sr-only"
                  />
                  <span className="flex items-center gap-1.5">
                    <StatusBlinkDot isOpen={true} size="sm" />
                    <span>Force Open</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Always On</span>
                </label>

                <label
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
                    mode === 'FORCE_CLOSED'
                      ? 'bg-rose-50 border-rose-600 text-rose-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="shopMode"
                    value="FORCE_CLOSED"
                    checked={mode === 'FORCE_CLOSED'}
                    onChange={() => setMode('FORCE_CLOSED')}
                    className="sr-only"
                  />
                  <span className="flex items-center gap-1.5">
                    <StatusBlinkDot isOpen={false} size="sm" />
                    <span>Force Closed</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Emergency Stop</span>
                </label>
              </div>
            </div>

            {/* Time inputs */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Opening Time (Daily)
                </label>
                <input
                  type="time"
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Closing Time (Daily)
                </label>
                <input
                  type="time"
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveSchedule}
              className="w-full py-2.5 btn-smooth btn-dual-shimmer text-[#FFF5E1] text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Operating Schedule'}
            </button>
          </div>
        </div>

        {/* Confirmation Overlay when clicking CLOSE SHOP */}
        {confirmAction === 'CLOSE' && (
          <div className="absolute inset-0 z-20 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-6 animate-fade-in text-center">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-rose-300">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>

              <h4 className="text-lg font-black text-slate-900">
                Are you sure you want to close the shop?
              </h4>

              <p className="text-xs text-slate-600 mt-2">
                New printing orders and online payments will be temporarily disabled on the customer interface.
              </p>

              <div className="flex items-center gap-2 mt-6">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setConfirmAction(null)}
                  className="w-1/2 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  CANCEL
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleConfirmCloseShop}
                  className="w-1/2 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border-2 border-rose-300 text-xs font-black rounded-xl shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'YES, CLOSE SHOP'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Overlay when clicking OPEN SHOP */}
        {confirmAction === 'OPEN' && (
          <div className="absolute inset-0 z-20 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-6 animate-fade-in text-center">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-emerald-300">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>

              <h4 className="text-lg font-black text-slate-900">
                Open PrintEase for new orders and online payments?
              </h4>

              <p className="text-xs text-slate-600 mt-2">
                Customers will be immediately able to upload files, calculate rates, and proceed with online or wallet payments.
              </p>

              <div className="flex items-center gap-2 mt-6">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setConfirmAction(null)}
                  className="w-1/2 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  CANCEL
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleConfirmOpenShop}
                  className="w-1/2 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-2 border-emerald-300 text-xs font-black rounded-xl shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'YES, OPEN SHOP'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
