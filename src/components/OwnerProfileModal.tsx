import React, { useState, useEffect } from 'react';
import {
  X,
  User as UserIcon,
  ShieldCheck,
  Mail,
  Phone,
  Store,
  CreditCard,
  Building,
  QrCode,
  Check,
  Copy,
  LogOut,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { User, ShopStatusInfo, OwnerPaymentSettingsData } from '../types/printease';
import { getClientStoredOwnerPaymentSettings } from '../data/mockData';
import { StatusBlinkDot } from './StatusBlinkDot';
import { apiFetch } from '../config/api';

interface OwnerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  shopStatus?: ShopStatusInfo | null;
  onUpdateShopStatus?: (updated: Partial<ShopStatusInfo>) => Promise<void>;
  onLogout: () => void;
  onNavigateToPayments: () => void;
  onSwitchPortal?: (portal: 'customer' | 'shopkeeper') => void;
}

export const OwnerProfileModal: React.FC<OwnerProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  shopStatus,
  onUpdateShopStatus,
  onLogout,
  onNavigateToPayments,
  onSwitchPortal,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const [showFullAccount, setShowFullAccount] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<OwnerPaymentSettingsData>(getClientStoredOwnerPaymentSettings);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setShowConfirmLogout(false);
      return;
    }
    apiFetch('/api/owner/payment-settings')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.settings) {
          setPaymentSettings((prev) => ({ ...prev, ...data.settings }));
        }
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const isShopOpen = shopStatus ? shopStatus.status === 'OPEN' : true;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleToggleShopStatus = async () => {
    if (!onUpdateShopStatus) return;
    setIsUpdatingStatus(true);
    try {
      const nextStatus = isShopOpen ? 'CLOSED' : 'OPEN';
      await onUpdateShopStatus({
        status: nextStatus,
        accepting_orders: nextStatus === 'OPEN',
        message: nextStatus === 'OPEN' ? 'Accepting new print orders.' : 'Print shop is currently closed.',
      });
    } catch (e) {
      console.error('Failed to toggle status:', e);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const ownerName = currentUser?.name || 'Vinay (Owner)';
  const ownerEmail = currentUser?.email || 'vinay8046d@gmail.com';
  const ownerPhone = currentUser?.phone || '+91 80887 11191';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div
        className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-[#C48B28]/30 overflow-hidden my-auto animate-scaleUp transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Banner */}
        <div className="relative bg-gradient-to-r from-[#422C09] via-[#5A3C0B] to-[#422C09] px-5 sm:px-6 py-5 text-[#FFF5E1]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-[#C48B28]/25 text-[#EBC176] border border-[#C48B28]/35">
                <Store className="w-4 h-4" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-[#EBC176]">
                Owner Profile &amp; Console
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#FFF5E1]/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close Profile"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 flex items-center gap-3.5">
            <div className="relative">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-[#C48B28] to-[#F3D492] text-[#422C09] flex items-center justify-center text-xl sm:text-2xl font-black shadow-lg border-2 border-white/20">
                {ownerName.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#422C09] flex items-center justify-center text-[10px] text-white font-bold">
                ✓
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-[#FFF5E1] truncate">
                  {ownerName}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#C48B28] text-[#422C09] text-[10px] font-black tracking-wide shrink-0">
                  SHOP OWNER
                </span>
              </div>
              <p className="text-xs text-[#FFF5E1]/75 flex items-center gap-1.5 mt-0.5 truncate">
                <Mail className="w-3.5 h-3.5 text-[#C48B28] shrink-0" />
                <span className="truncate">{ownerEmail}</span>
              </p>
              <p className="text-xs text-[#FFF5E1]/75 flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-[#C48B28] shrink-0" />
                <span>{ownerPhone}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Shop Information & Live Status Banner */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FFF5E1]/70 border border-[#C48B28]/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-[#C48B28]" />
                <strong className="text-xs sm:text-sm font-black text-[#5A3C0B]">
                  Campus Xerox &amp; Print Station
                </strong>
              </div>
              <p className="text-[11px] text-[#5A3C0B]/80">
                Terminal ID: <code className="font-mono font-bold text-[#5A3C0B]">PES_MAIN_01</code> • Authorized Business Desk
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleToggleShopStatus}
                disabled={isUpdatingStatus}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 border shadow-xs cursor-pointer ${
                  isShopOpen
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                    : 'bg-rose-100 text-rose-900 border-rose-300 hover:bg-rose-200'
                }`}
              >
                <StatusBlinkDot isOpen={isShopOpen} size="sm" />
                <span>{isShopOpen ? 'Shop OPEN' : 'Shop CLOSED'}</span>
              </button>
            </div>
          </div>

          {/* PAYMENT DETAILS SECTION */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#5A3C0B] text-[#FFF5E1] flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-[#C48B28]" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900">
                    Payment &amp; Banking Details
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Where customer payments &amp; settlements are deposited
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToPayments();
                }}
                className="text-xs font-bold text-[#C48B28] hover:text-[#5A3C0B] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Edit Details</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* UPI ID Row */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Shopkeeper UPI ID
                </span>
                <div className="text-xs sm:text-sm font-black font-mono text-[#5A3C0B] truncate">
                  {paymentSettings.upi_id || 'vinay8046d@upi'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(paymentSettings.upi_id || 'vinay8046d@upi', 'upi')}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-[#FFF5E1] text-[#5A3C0B] rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
              >
                {copiedKey === 'upi' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Bank Account Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Bank Name</span>
                <span className="font-extrabold text-slate-900 truncate block">
                  {paymentSettings.bank_name || 'HDFC Bank Campus Tech Park'}
                </span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Account Holder</span>
                <span className="font-extrabold text-slate-900 truncate block">
                  {paymentSettings.account_holder_name || ownerName}
                </span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Account Number</span>
                  <button
                    type="button"
                    onClick={() => setShowFullAccount(!showFullAccount)}
                    className="text-[10px] font-bold text-[#C48B28] hover:underline cursor-pointer"
                  >
                    {showFullAccount ? 'Hide' : 'Show'}
                  </button>
                </div>
                <span className="font-mono font-black text-slate-900 tracking-wider block">
                  {showFullAccount
                    ? paymentSettings.account_number || '50100482910482'
                    : `•••• •••• ${paymentSettings.account_number?.slice(-4) || '0482'}`}
                </span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">IFSC Code</span>
                <span className="font-mono font-black text-[#5A3C0B] block">
                  {paymentSettings.ifsc_code || 'HDFC0001245'}
                </span>
              </div>
            </div>

            {/* Settlement Status Banner */}
            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-[11px] sm:text-xs">
                  Automated Settlement Active (T+0 Daily Payouts)
                </span>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 shrink-0">
                Verified
              </span>
            </div>
          </div>

          {/* Quick Navigations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToPayments();
              }}
              className="p-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-[#C48B28]/40 text-[#5A3C0B] font-bold flex items-center justify-between transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#C48B28]" />
                <span>Configure Payments &amp; Gateway</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {onSwitchPortal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSwitchPortal('customer');
                }}
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-between transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-slate-500" />
                  <span>View Customer / Student App</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* OWNER LOGOUT SECTION */}
          <div className="pt-2 border-t border-slate-200">
            {!showConfirmLogout ? (
              <button
                type="button"
                onClick={() => setShowConfirmLogout(true)}
                className="w-full py-3.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 rounded-2xl text-xs sm:text-sm font-black border border-rose-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99]"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>Logout from Owner Console</span>
              </button>
            ) : (
              <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl space-y-3 animate-fadeIn">
                <div className="flex items-center gap-2 text-xs text-rose-900 font-bold">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Are you sure you want to log out of the Owner Console?</span>
                </div>
                <p className="text-[11px] text-rose-700">
                  You will need to enter your owner credentials (admin@printease.com or vinay8046d@gmail.com) to access the console again.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLogout();
                    }}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Yes, Log Out Now</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmLogout(false)}
                    className="flex-1 py-2.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
