import React, { useState } from 'react';
import {
  Wallet as WalletIcon,
  PlusCircle,
  History,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  Sparkles,
  CreditCard,
  QrCode,
  Smartphone,
  Lock,
  Loader2,
  X,
} from 'lucide-react';
import { Wallet, WalletTransaction, ShopStatusInfo } from '../types/printease';

interface Props {
  wallet: Wallet | null;
  transactions: WalletTransaction[];
  shopStatus: ShopStatusInfo | null;
  onRefreshWallet: () => void;
  onStartPrintJob: () => void;
}

export const MyWalletView: React.FC<Props> = ({
  wallet,
  transactions,
  shopStatus,
  onRefreshWallet,
  onStartPrintJob,
}) => {
  const [selectedTopupAmount, setSelectedTopupAmount] = useState<number>(200);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupPaymentMethod, setTopupPaymentMethod] = useState<'UPI' | 'CARD' | 'NETBANKING'>('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [topupSuccessMessage, setTopupSuccessMessage] = useState<string | null>(null);
  const [topupError, setTopupError] = useState<string | null>(null);

  const balance = wallet ? Number(wallet.balance) : 250.0;
  const isShopOpen = shopStatus ? shopStatus.status === 'OPEN' : true;

  const quickAmounts = [100, 200, 500, 1000];

  const handleSelectQuickAmount = (amt: number) => {
    setSelectedTopupAmount(amt);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setCustomAmount(val);
    if (val) {
      setSelectedTopupAmount(parseInt(val, 10));
    }
  };

  const effectiveAmount = customAmount ? parseInt(customAmount, 10) || 0 : selectedTopupAmount;

  // Process top-up payment
  const handleExecuteTopup = async () => {
    if (!effectiveAmount || effectiveAmount <= 0) {
      setTopupError('Please specify a valid top-up amount.');
      return;
    }

    setIsProcessing(true);
    setTopupError(null);

    try {
      // 1. Initiate gateway order
      const initRes = await fetch('/api/wallet/topup/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: effectiveAmount,
          user_id: wallet?.user_id || 'usr_student_01',
        }),
      });

      const initData = await initRes.json();
      if (!initRes.ok) {
        throw new Error(initData.error || 'Failed to initialize top-up.');
      }

      // Simulate payment delay
      await new Promise((r) => setTimeout(r, 900));

      // 2. Verify and credit wallet on backend
      const verifyRes = await fetch('/api/wallet/topup/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: effectiveAmount,
          gateway_order_id: initData.gateway_order_id,
          user_id: wallet?.user_id || 'usr_student_01',
          payment_method:
            topupPaymentMethod === 'UPI'
              ? 'UPI (Google Pay / PhonePe)'
              : topupPaymentMethod === 'CARD'
              ? 'Debit Card (Visa/Mastercard)'
              : 'Net Banking',
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || 'Top-up verification failed.');
      }

      setShowTopupModal(false);
      setTopupSuccessMessage(`🎉 WALLET UPDATED: ₹${effectiveAmount} has been added successfully.`);
      onRefreshWallet();
    } catch (err: any) {
      setTopupError(err.message || 'Payment failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C48B28] mb-1">
            <WalletIcon className="w-4 h-4 text-[#C48B28]" />
            <span>Digital Campus Wallet</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#422C09] tracking-tight">
            My PrintEase Wallet
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            One-tap checkout for your printing jobs • Instant automated refunds • Zero fees
          </p>
        </div>

        {isShopOpen ? (
          <button
            onClick={onStartPrintJob}
            className="btn-smooth btn-dual-shimmer px-4 py-2.5 text-[#FFF5E1] rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-[#C48B28]/20 transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Sparkles className="w-4 h-4 text-[#FFF5E1]" />
            <span>Start Print Order</span>
          </button>
        ) : (
          <div className="px-3.5 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
            <span>Shop Closed: Orders Paused</span>
          </div>
        )}
      </div>

      {/* Success Notification Alert */}
      {topupSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between gap-3 text-emerald-900 text-sm font-bold animate-fade-in shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{topupSuccessMessage}</span>
          </div>
          <button
            onClick={() => setTopupSuccessMessage(null)}
            className="text-xs text-emerald-700 hover:text-emerald-950 underline font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Shop Closed Notice */}
      {!isShopOpen && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-sm mb-0.5">
              PrintEase is currently closed
            </span>
            Your existing wallet balance of <strong>₹{balance.toFixed(2)}</strong> is completely safe and intact.
            However, wallet payments for new print orders are temporarily paused until the shop re-opens.
          </div>
        </div>
      )}

      {/* Main Balance & Top-Up Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Balance Card */}
        <div className="md:col-span-1 bg-gradient-to-br from-[#422C09] via-[#5A3C0B] to-[#422C09] text-[#FFF5E1] rounded-3xl p-6 sm:p-7 shadow-xl border border-[#C48B28]/35 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-[#C48B28]/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-[#FFF5E1]/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between text-xs text-[#FFF5E1]/70 font-semibold mb-3">
              <span>AVAILABLE BALANCE</span>
              <span className="px-2 py-0.5 rounded-full bg-[#C48B28]/30 text-[#FFF5E1] text-[10px] font-bold border border-[#C48B28]/40">
                Active & Protected
              </span>
            </div>

            <div className="font-mono text-4xl sm:text-5xl font-black text-white tracking-tight flex items-baseline gap-1">
              <span className="text-2xl text-[#C48B28] font-sans">₹</span>
              <span>{balance.toFixed(2)}</span>
            </div>

            <p className="text-[11px] text-[#FFF5E1]/70 mt-2">
              Indian Rupees (INR) • Ledger Verified
            </p>
          </div>

          <div className="pt-6 border-t border-[#C48B28]/30 mt-6">
            <button
              onClick={() => setShowTopupModal(true)}
              className="btn-smooth btn-dual-shimmer w-full py-3 text-[#FFF5E1] text-xs sm:text-sm font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-[#FFF5E1]" />
              <span>Add Money to Wallet</span>
            </button>
          </div>
        </div>

        {/* Card 2: Quick Top-Up Selector */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-[#C48B28]/25 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-[#422C09] flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-[#C48B28]" />
                <span>Quick Wallet Recharge</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">Instant balance update</span>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Select or type the amount you want to add. Top-ups can be done via UPI, QR code, debit cards, or net banking.
            </p>

            {/* Quick amount chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
              {quickAmounts.map((amt) => {
                const isSelected = selectedTopupAmount === amt && !customAmount;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleSelectQuickAmount(amt)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-[#C48B28]/15 border-[#C48B28] text-[#422C09] shadow-xs ring-2 ring-[#C48B28]/25'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span>₹{amt}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Amount */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Or Enter Custom Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-sm">
                  ₹
                </span>
                <input
                  type="text"
                  placeholder="e.g. 350"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pl-8 text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#C48B28] focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Zero card/PIN details saved on PrintEase server</span>
            </div>

            <button
              onClick={() => setShowTopupModal(true)}
              className="w-full sm:w-auto px-6 py-2.5 btn-smooth btn-dual-shimmer text-[#FFF5E1] font-extrabold rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Add ₹{effectiveAmount} Now</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-700" />
            <h3 className="text-base font-extrabold text-slate-900">
              Wallet Transaction History
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {transactions.length} records
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No wallet transactions yet. Top up your wallet to get started!
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map((tx) => {
              const isCredit = tx.type === 'CREDIT' || tx.type === 'REFUND';
              return (
                <div
                  key={tx.id}
                  className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                        tx.type === 'CREDIT'
                          ? 'bg-emerald-100 text-emerald-700'
                          : tx.type === 'REFUND'
                          ? 'bg-teal-100 text-teal-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {tx.type === 'CREDIT' ? (
                        <ArrowDownLeft className="w-5 h-5" />
                      ) : tx.type === 'REFUND' ? (
                        <RotateCcw className="w-5 h-5" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {tx.description}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            tx.status === 'SUCCESS'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-1">
                        <span>Ref: {tx.reference_id}</span>
                        <span>•</span>
                        <span>
                          {new Date(tx.created_at).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {tx.order_id && (
                          <>
                            <span>•</span>
                            <span className="font-mono font-bold text-[#C48B28]">
                              Order #{tx.order_id}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-base sm:text-lg font-black font-mono ${
                        isCredit ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {isCredit ? '+' : '-'} ₹{Number(tx.amount).toFixed(2)}
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      Balance: ₹{Number(tx.balance_after).toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top-up Payment Gateway Simulation Modal */}
      {showTopupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 bg-gradient-to-r from-[#422C09] via-[#5A3C0B] to-[#422C09] text-[#FFF5E1] flex items-center justify-between border-b border-[#C48B28]/30">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#C48B28] block">
                  PrintEase Payment Gateway
                </span>
                <h3 className="text-xl font-extrabold tracking-tight">
                  Add Money: ₹{effectiveAmount}
                </h3>
              </div>
              <button
                onClick={() => setShowTopupModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Select Top-Up Method
              </span>

              {/* Method 1: UPI */}
              <button
                type="button"
                onClick={() => setTopupPaymentMethod('UPI')}
                className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  topupPaymentMethod === 'UPI'
                    ? 'border-[#C48B28] bg-[#C48B28]/15 ring-2 ring-[#C48B28]/25'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#C48B28] text-[#FFF5E1] flex items-center justify-center">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      UPI / QR Code
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Google Pay, PhonePe, Paytm, BHIM
                    </span>
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    topupPaymentMethod === 'UPI'
                      ? 'border-[#C48B28] bg-[#C48B28]'
                      : 'border-slate-300'
                  }`}
                >
                  {topupPaymentMethod === 'UPI' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FFF5E1]" />
                  )}
                </div>
              </button>

              {/* Method 2: Cards */}
              <button
                type="button"
                onClick={() => setTopupPaymentMethod('CARD')}
                className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  topupPaymentMethod === 'CARD'
                    ? 'border-[#C48B28] bg-[#C48B28]/15 ring-2 ring-[#C48B28]/25'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#422C09] text-[#FFF5E1] flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Debit / Credit Card
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Visa, Mastercard, RuPay
                    </span>
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    topupPaymentMethod === 'CARD'
                      ? 'border-[#C48B28] bg-[#C48B28]'
                      : 'border-slate-300'
                  }`}
                >
                  {topupPaymentMethod === 'CARD' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FFF5E1]" />
                  )}
                </div>
              </button>

              {/* Method 3: NetBanking */}
              <button
                type="button"
                onClick={() => setTopupPaymentMethod('NETBANKING')}
                className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  topupPaymentMethod === 'NETBANKING'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Net Banking
                    </span>
                    <span className="text-[11px] text-slate-500">
                      SBI, HDFC, ICICI, Axis & all major banks
                    </span>
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    topupPaymentMethod === 'NETBANKING'
                      ? 'border-emerald-600 bg-emerald-600'
                      : 'border-slate-300'
                  }`}
                >
                  {topupPaymentMethod === 'NETBANKING' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              </button>

              {topupError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{topupError}</span>
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>HMAC-SHA256 signature verification & double-spend protection</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setShowTopupModal(false)}
                className="w-1/2 py-2.5 border border-slate-300 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleExecuteTopup}
                className="btn-smooth btn-dual-shimmer w-1/2 py-2.5 text-[#FFF5E1] text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Add ₹{effectiveAmount} Securely</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
