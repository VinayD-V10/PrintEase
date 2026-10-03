import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CreditCard,
  QrCode,
  Smartphone,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Wallet as WalletIcon,
  Sparkles,
  ArrowRight,
  PlusCircle,
  RotateCcw,
} from 'lucide-react';
import { Order, PaymentTransaction, ShopStatusInfo, Wallet } from '../types/printease';
import { playOrderAlertSound } from '../utils/audio';
import { StatusBlinkDot } from './StatusBlinkDot';

interface Props {
  order: Order;
  shopStatus: ShopStatusInfo | null;
  onClose: () => void;
  onSuccess: (order: Order, payment: PaymentTransaction) => void;
  onOpenWalletTopup?: () => void;
}

export const PaymentModal: React.FC<Props> = ({
  order,
  shopStatus,
  onClose,
  onSuccess,
  onOpenWalletTopup,
}) => {
  const [paymentChoice, setPaymentChoice] = useState<'GATEWAY' | 'WALLET'>('GATEWAY');
  const [gatewaySubMethod, setGatewaySubMethod] = useState<'UPI' | 'CARD' | 'NETBANKING'>('UPI');
  const [upiApp, setUpiApp] = useState<'qr' | 'gpay' | 'phonepe' | 'paytm'>('qr');
  const [upiId, setUpiId] = useState(`${order.customer_email.split('@')[0]}@okhdfcbank`);

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(false);

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const amount = order.price_breakdown.final_total;
  const isShopOpen = shopStatus ? shopStatus.status === 'OPEN' : true;

  // Fetch wallet on mount
  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    setLoadingWallet(true);
    try {
      const token = localStorage.getItem('printease_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/wallet?user_id=${encodeURIComponent(order.user_id || 'usr_student_01')}`, {
        headers,
      });
      const data = await res.json();
      if (data.wallet) {
        setWallet(data.wallet);
      }
    } catch (e) {
      console.warn('Failed to load wallet:', e);
    } finally {
      setLoadingWallet(false);
    }
  };

  const walletBalance = wallet ? Number(wallet.balance) : 250.0;
  const hasSufficientWalletBalance = walletBalance >= amount;

  // Process Online Gateway Payment
  const handleProcessGatewayPayment = async () => {
    if (!isShopOpen) {
      setErrorMessage('Online payment is currently unavailable because the shop is closed.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      setStatusMessage('Checking shop status and initiating gateway...');
      const orderRes = await fetch('/api/payments/create-gateway-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: order.order_id }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.message || orderData.error || 'Failed to initialize payment gateway.');
      }

      const { gateway_order } = orderData;

      setStatusMessage('Authorizing via NPCI / Bank Payment Gateway...');
      await new Promise((resolve) => setTimeout(resolve, 750));

      setStatusMessage('Verifying cryptographic HMAC signature on server...');
      const verifyRes = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.order_id,
          gateway_order_id: gateway_order.gateway_order_id,
          signature_token: gateway_order.signature_token,
          payment_method:
            gatewaySubMethod === 'UPI'
              ? `UPI (${upiApp.toUpperCase()})`
              : gatewaySubMethod === 'CARD'
              ? 'Debit Card (Visa/Mastercard)'
              : 'Net Banking',
          amount: gateway_order.amount,
          timestamp: gateway_order.timestamp,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || 'Payment signature verification failed.');
      }

      playOrderAlertSound();
      onSuccess(verifyData.order, verifyData.payment);
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment execution failed.');
    } finally {
      setLoading(false);
      setStatusMessage(null);
    }
  };

  // Process Wallet Payment
  const handleProcessWalletPayment = async () => {
    if (!isShopOpen) {
      setErrorMessage('New printing orders and payments are currently paused because the shop is closed.');
      return;
    }

    if (!hasSufficientWalletBalance) {
      setErrorMessage('Insufficient wallet balance to complete this order.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setStatusMessage('Checking shop status and verifying wallet balance...');

    try {
      const res = await fetch('/api/wallet/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.order_id,
          user_id: wallet?.user_id || order.user_id || 'usr_student_01',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Wallet payment deduction failed.');
      }

      // Simulated payment record for callback
      const paymentRecord: PaymentTransaction = {
        id: data.transaction?.id || `wtx_${Date.now()}`,
        order_id: order.order_id,
        system_order_id: order.id,
        amount: order.price_breakdown.final_total,
        currency: 'INR',
        gateway_order_id: 'WALLET_LEDGER',
        gateway_payment_id: data.transaction?.reference_id || 'WTX_PAID',
        transaction_reference: data.transaction?.reference_id || `WTX_${order.order_id}`,
        payment_method: 'PrintEase Wallet',
        payment_status: 'SUCCESS',
        signature_verified: true,
        created_at: new Date().toISOString(),
      };

      playOrderAlertSound();
      onSuccess(data.order, paymentRecord);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to pay with wallet.');
    } finally {
      setLoading(false);
      setStatusMessage(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#422C09] via-[#5A3C0B] to-[#422C09] text-[#FFF5E1] flex items-center justify-between border-b border-[#C48B28]/30">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#C48B28] uppercase tracking-wider mb-1">
              <Lock className="w-4 h-4 text-[#C48B28]" />
              <span>Secure Payment Desk</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              Order #{order.order_id}
            </h3>
          </div>

          <div className="text-right">
            <span className="text-xs text-[#FFF5E1]/80 block font-medium">Payable Amount</span>
            <span className="font-mono text-2xl sm:text-3xl font-black text-white">
              ₹{amount}
            </span>
          </div>
        </div>

        {/* SHOP CLOSED WARNING BANNER DURING CHECKOUT (Requirement 80) */}
        {!isShopOpen && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-rose-950 text-sm flex items-center gap-2">
                <StatusBlinkDot isOpen={false} size="sm" />
                <span>SHOP CLOSED: Orders & Payments Temporarily Paused</span>
              </span>
              <p className="text-xs text-rose-800 mt-0.5">
                New payment processing is temporarily unavailable because the shop has closed.
                Please return to your order and retry when the shop re-opens.
              </p>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Order Snapshot Card */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
            <div className="truncate max-w-[260px] sm:max-w-xs">
              <span className="font-bold text-slate-900 block truncate">
                {order.file_name}
              </span>
              <span className="text-slate-500">
                {order.page_count} pages • {order.options.copies} copy • {order.options.color_type} ({order.options.side_type})
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-[#C48B28]/20 font-bold text-[#422C09] shrink-0">
              Campus Pickup Only
            </span>
          </div>

          {/* Payment Method Selector (Requirement 88) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              Select Payment Method
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Online Payment Gateway */}
              <button
                type="button"
                onClick={() => setPaymentChoice('GATEWAY')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  paymentChoice === 'GATEWAY'
                    ? 'border-[#C48B28] bg-[#C48B28]/15 ring-2 ring-[#C48B28]/25 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#C48B28] text-[#FFF5E1] flex items-center justify-center">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <span className="font-extrabold text-sm text-slate-900">
                      Online Gateway
                    </span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      paymentChoice === 'GATEWAY'
                        ? 'border-[#C48B28] bg-[#C48B28]'
                        : 'border-slate-300'
                    }`}
                  >
                    {paymentChoice === 'GATEWAY' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FFF5E1]" />
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  UPI Apps, QR Code, Debit / Credit Cards, Net Banking
                </p>
              </button>

              {/* Option 2: PrintEase Wallet */}
              <button
                type="button"
                onClick={() => setPaymentChoice('WALLET')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  paymentChoice === 'WALLET'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/20 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                      <WalletIcon className="w-4 h-4" />
                    </div>
                    <span className="font-extrabold text-sm text-slate-900">
                      PrintEase Wallet
                    </span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      paymentChoice === 'WALLET'
                        ? 'border-emerald-600 bg-emerald-600'
                        : 'border-slate-300'
                    }`}
                  >
                    {paymentChoice === 'WALLET' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] text-slate-500">Balance:</span>
                  <span
                    className={`font-mono text-xs font-black ${
                      hasSufficientWalletBalance ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    ₹{walletBalance.toFixed(2)}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* METHOD DETAILS: 1. ONLINE GATEWAY */}
          {paymentChoice === 'GATEWAY' && (
            <div className="space-y-4 pt-2">
              {/* Gateway subtabs */}
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setGatewaySubMethod('UPI')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    gatewaySubMethod === 'UPI'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  UPI / QR Code
                </button>
                <button
                  type="button"
                  onClick={() => setGatewaySubMethod('CARD')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    gatewaySubMethod === 'CARD'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cards
                </button>
                <button
                  type="button"
                  onClick={() => setGatewaySubMethod('NETBANKING')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    gatewaySubMethod === 'NETBANKING'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Net Banking
                </button>
              </div>

              {gatewaySubMethod === 'UPI' && (
                <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-purple-950">Select UPI Application:</span>
                    <span className="text-[11px] text-purple-700">Auto-verification</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'qr', label: 'Scan QR' },
                      { id: 'gpay', label: 'GPay' },
                      { id: 'phonepe', label: 'PhonePe' },
                      { id: 'paytm', label: 'Paytm' },
                    ].map((app) => (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => setUpiApp(app.id as any)}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all ${
                          upiApp === app.id
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                            : 'bg-white text-slate-700 border-purple-200 hover:bg-purple-100/50'
                        }`}
                      >
                        {app.label}
                      </button>
                    ))}
                  </div>

                  {upiApp === 'qr' ? (
                    <div className="bg-white rounded-xl p-3 border border-purple-200 flex items-center gap-3">
                      <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 border border-slate-200">
                        <QrCode className="w-10 h-10 text-slate-800" />
                      </div>
                      <div className="text-[11px] text-slate-600">
                        <span className="font-bold text-slate-900 block mb-0.5">
                          Dynamic Merchant UPI QR
                        </span>
                        Scan with any UPI app to pay <strong>₹{amount}</strong> directly to PrintEase Xerox.
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Virtual Payment Address (VPA)
                      </label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  )}
                </div>
              )}

              {gatewaySubMethod === 'CARD' && (
                <div className="bg-[#C48B28]/10 border border-[#C48B28]/30 rounded-2xl p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between font-bold text-[#422C09]">
                    <span>Card Information</span>
                    <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> 256-Bit SSL Encrypted
                    </span>
                  </div>
                  <input
                    type="text"
                    disabled
                    value="4532 •••• •••• 8829"
                    className="w-full bg-white border border-[#C48B28]/30 rounded-xl px-3 py-2 font-mono text-slate-700"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      disabled
                      value="Expires: 08/29"
                      className="bg-white border border-[#C48B28]/30 rounded-xl px-3 py-2 text-slate-700 font-mono"
                    />
                    <input
                      type="text"
                      disabled
                      value="CVV: •••"
                      className="bg-white border border-[#C48B28]/30 rounded-xl px-3 py-2 text-slate-700 font-mono"
                    />
                  </div>
                </div>
              )}

              {gatewaySubMethod === 'NETBANKING' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
                  <span className="font-bold text-slate-900 block">Popular Indian Banks:</span>
                  <div className="grid grid-cols-3 gap-2">
                    {['SBI', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak', 'PNB'].map((b) => (
                      <div
                        key={b}
                        className="p-2 bg-white rounded-xl border border-slate-200 text-center font-bold text-slate-700"
                      >
                        {b}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* METHOD DETAILS: 2. PRINTEASE WALLET (Requirement 88) */}
          {paymentChoice === 'WALLET' && (
            <div className="space-y-4 pt-2">
              <div
                className={`p-5 rounded-2xl border ${
                  hasSufficientWalletBalance
                    ? 'bg-emerald-50/80 border-emerald-300'
                    : 'bg-rose-50 border-rose-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3 text-xs">
                  <span className="font-extrabold uppercase tracking-wider text-slate-600">
                    Wallet Ledger Breakdown
                  </span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-md ${
                      hasSufficientWalletBalance
                        ? 'bg-emerald-200/80 text-emerald-900'
                        : 'bg-rose-200/80 text-rose-900'
                    }`}
                  >
                    {hasSufficientWalletBalance ? 'Sufficient Balance' : 'Insufficient Balance'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Available Wallet Balance:</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{walletBalance.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Order Deductible Total:</span>
                    <span className="font-mono font-bold text-[#C48B28]">
                      - ₹{amount.toFixed(2)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-bold">
                    <span className="text-slate-900">Estimated Balance After Payment:</span>
                    <span
                      className={`font-mono text-sm ${
                        hasSufficientWalletBalance ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      ₹{Math.max(0, walletBalance - amount).toFixed(2)}
                    </span>
                  </div>
                </div>

                {!hasSufficientWalletBalance && (
                  <div className="mt-4 pt-3 border-t border-rose-200 text-xs text-rose-800 space-y-2">
                    <p className="font-semibold">
                      You need ₹{(amount - walletBalance).toFixed(2)} more in your wallet to complete this order.
                    </p>
                    <div className="flex items-center gap-2">
                      {onOpenWalletTopup && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenWalletTopup();
                          }}
                          className="px-3 py-1.5 bg-[#C48B28] hover:bg-[#A9741D] text-[#FFF5E1] font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Add Money</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setPaymentChoice('GATEWAY')}
                        className="px-3 py-1.5 bg-[#422C09] hover:bg-[#2D1E05] text-[#FFF5E1] font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Use Online Payment
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {statusMessage && (
            <div className="p-3 bg-[#C48B28]/15 border border-[#C48B28]/35 rounded-xl text-xs text-[#422C09] flex items-center gap-2 animate-fade-in">
              <Loader2 className="w-4 h-4 animate-spin text-[#C48B28] shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer Actions (Requirement 71, 80, 88) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="w-1/3 py-3 border border-slate-300 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            {isShopOpen ? 'Cancel' : 'Return to Order'}
          </button>

          {/* If shop is closed, disable payment button completely */}
          {!isShopOpen ? (
            <button
              type="button"
              disabled
              className="w-2/3 py-3 bg-rose-600/80 text-white text-xs sm:text-sm font-extrabold rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
            >
              <StatusBlinkDot isOpen={false} size="sm" />
              <span>PAYMENT UNAVAILABLE (SHOP CLOSED)</span>
            </button>
          ) : paymentChoice === 'WALLET' ? (
            <button
              type="button"
              disabled={loading || !hasSufficientWalletBalance}
              onClick={handleProcessWalletPayment}
              className="btn-smooth w-2/3 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deducting Wallet Balance...</span>
                </>
              ) : (
                <>
                  <span>Pay ₹{amount} Using Wallet</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleProcessGatewayPayment}
              className="btn-smooth btn-dual-shimmer w-2/3 py-3 disabled:opacity-50 text-[#FFF5E1] text-xs sm:text-sm font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Transaction...</span>
                </>
              ) : (
                <>
                  <span>Proceed to Secure Payment (₹{amount})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
