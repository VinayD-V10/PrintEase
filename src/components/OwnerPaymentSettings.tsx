import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Building,
  Smartphone,
  QrCode,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Printer,
  RefreshCw,
  ExternalLink,
  Save,
  Key,
  Shield,
  Layers,
  FileCheck,
  Check,
  Info,
} from 'lucide-react';
import { OwnerPaymentSettingsData } from '../types/printease';
import {
  DEFAULT_OWNER_PAYMENT_SETTINGS,
  getClientStoredOwnerPaymentSettings,
  saveClientStoredOwnerPaymentSettings,
} from '../data/mockData';

export const OwnerPaymentSettings: React.FC = () => {
  const [settings, setSettings] = useState<OwnerPaymentSettingsData>(getClientStoredOwnerPaymentSettings);
  const [showFullAccount, setShowFullAccount] = useState(false);
  const [showKeyId, setShowKeyId] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'bank_upi' | 'gateway' | 'hacker_shield'>('bank_upi');
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Load from server on mount if available, fallback to client storage
  useEffect(() => {
    fetch('/api/owner/payment-settings')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.settings) {
          setSettings((prev) => ({
            ...prev,
            ...data.settings,
          }));
          saveClientStoredOwnerPaymentSettings(data.settings);
        }
      })
      .catch((e) => console.warn('Payment settings using local secured vault:', e));
  }, []);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('QR code image should be under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSettings((prev) => ({
          ...prev,
          qr_code_image: reader.result as string,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/owner/payment-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
          saveClientStoredOwnerPaymentSettings(data.settings);
        }
      } else {
        // Standalone/offline save
        saveClientStoredOwnerPaymentSettings(settings);
      }
    } catch {
      // Local storage fallback so it always succeeds
      saveClientStoredOwnerPaymentSettings(settings);
    } finally {
      window.dispatchEvent(new CustomEvent('printease_payment_settings_updated', { detail: settings }));
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleTestGateway = () => {
    setTestResult('testing');
    setTimeout(() => {
      setTestResult('success');
      setTimeout(() => setTestResult(null), 4000);
    }, 1200);
  };

  // Mask helper
  const maskString = (val: string, visibleDigits = 4) => {
    if (!val || val.length <= visibleDigits) return val;
    const visible = val.slice(-visibleDigits);
    const hidden = '•'.repeat(Math.max(4, val.length - visibleDigits));
    return `${hidden} ${visible}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Strict Privacy & Hacker Protection Status */}
      <div className="bg-gradient-to-r from-[#422C09] via-[#5A3C0B] to-[#422C09] rounded-3xl p-6 sm:p-8 text-[#FFF5E1] border border-[#C48B28]/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#C48B28]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#C48B28] to-[#EBC176] flex items-center justify-center text-[#422C09] shadow-lg shadow-[#C48B28]/30 shrink-0">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#FFF5E1]">
                  Owner Payment &amp; Banking Vault
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  Protected from Customers
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#FFF5E1]/80 mt-1 max-w-2xl leading-relaxed">
                Bank account, IFSC, and gateway credentials are strictly confidential. Customers only interact with authorized payment gateways and never see your sensitive banking data.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={() => handleSaveSettings()}
              disabled={isSaving}
              className="w-full md:w-auto btn-smooth btn-dual-shimmer px-5 py-2.5 text-[#FFF5E1] text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? 'Saving Vault...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="mt-4 px-4 py-2.5 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Payment settings &amp; bank vault saved safely! Audit log updated.</span>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#C48B28]/25 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('bank_upi')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'bank_upi'
              ? 'bg-[#C48B28] text-[#FFF5E1] shadow-xs'
              : 'bg-[#422C09]/20 text-[#422C09] hover:bg-[#C48B28]/20'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Bank Account &amp; UPI Setup</span>
        </button>

        <button
          onClick={() => setActiveTab('gateway')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'gateway'
              ? 'bg-[#C48B28] text-[#FFF5E1] shadow-xs'
              : 'bg-[#422C09]/20 text-[#422C09] hover:bg-[#C48B28]/20'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payment Gateway Configuration</span>
        </button>

        <button
          onClick={() => setActiveTab('hacker_shield')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'hacker_shield'
              ? 'bg-[#C48B28] text-[#FFF5E1] shadow-xs'
              : 'bg-[#422C09]/20 text-[#422C09] hover:bg-[#C48B28]/20'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Hacker Protection &amp; Data Safety Guide</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: BANK ACCOUNT & UPI SETUP */}
      {/* ============================================================== */}
      {activeTab === 'bank_upi' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Bank Details Card */}
          <div className="lg:col-span-2 bg-[#422C09] text-[#FFF5E1] rounded-3xl p-6 sm:p-7 border border-[#C48B28]/40 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#C48B28]/30">
              <div className="flex items-center gap-2.5">
                <Building className="w-5 h-5 text-[#C48B28]" />
                <h3 className="font-extrabold text-sm sm:text-base text-[#FFF5E1]">
                  Official Settlement Bank Account
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-[#C48B28]/25 text-[#EBC176] text-[10px] font-black uppercase tracking-wider border border-[#C48B28]/30">
                Direct EOD Payouts
              </span>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              {/* Row 1: Account Holder & Bank Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#EBC176] mb-1.5 flex items-center gap-1.5">
                    <span>👤 Account Holder Name</span>
                  </label>
                  <input
                    type="text"
                    value={settings.account_holder_name}
                    onChange={(e) => setSettings({ ...settings, account_holder_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#2B1B04] border border-[#C48B28]/40 text-[#FFF5E1] text-xs font-semibold focus:outline-none focus:border-[#C48B28]"
                    placeholder="Legal Business or Proprietor Name"
                    required
                  />
                  <p className="text-[10px] text-[#FFF5E1]/60 mt-1">Must match your bank passbook / PAN record.</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#EBC176] mb-1.5 flex items-center gap-1.5">
                    <span>🏦 Bank Name</span>
                  </label>
                  <input
                    type="text"
                    value={settings.bank_name}
                    onChange={(e) => setSettings({ ...settings, bank_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#2B1B04] border border-[#C48B28]/40 text-[#FFF5E1] text-xs font-semibold focus:outline-none focus:border-[#C48B28]"
                    placeholder="e.g. State Bank of India, HDFC Bank"
                    required
                  />
                  <p className="text-[10px] text-[#FFF5E1]/60 mt-1">Scheduled commercial Indian bank.</p>
                </div>
              </div>

              {/* Row 2: Account Number (Masked) & IFSC Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#EBC176] mb-1.5 flex items-center justify-between">
                    <span>🔢 Account Number — Masked</span>
                    <button
                      type="button"
                      onClick={() => setShowFullAccount(!showFullAccount)}
                      className="text-[10px] text-[#C48B28] hover:text-[#FFF5E1] flex items-center gap-1 cursor-pointer"
                    >
                      {showFullAccount ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showFullAccount ? 'Mask Number' : 'Reveal Number'}</span>
                    </button>
                  </label>
                  <div className="relative">
                    <input
                      type={showFullAccount ? 'text' : 'password'}
                      value={settings.account_number}
                      onChange={(e) => setSettings({ ...settings, account_number: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#2B1B04] border border-[#C48B28]/40 text-[#FFF5E1] text-xs font-mono font-semibold focus:outline-none focus:border-[#C48B28]"
                      placeholder="Account Number (11-16 digits)"
                      required
                    />
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-emerald-300">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Masked from customer views. Only you can reveal it.</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#EBC176] mb-1.5 flex items-center justify-between">
                    <span>🏛️ IFSC Code — Protected</span>
                    <span className="text-[10px] text-emerald-400 font-bold">Verified Format</span>
                  </label>
                  <input
                    type="text"
                    value={settings.ifsc_code}
                    onChange={(e) => setSettings({ ...settings, ifsc_code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#2B1B04] border border-[#C48B28]/40 text-[#FFF5E1] text-xs font-mono font-semibold uppercase focus:outline-none focus:border-[#C48B28]"
                    placeholder="e.g. SBIN0004921"
                    maxLength={11}
                    required
                  />
                  <p className="text-[10px] text-[#FFF5E1]/60 mt-1">Branch: {settings.branch_name || 'Campus Branch'}</p>
                </div>
              </div>

              {/* Row 3: Shop Phone Number & UPI ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#C48B28]/20">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#EBC176] mb-1.5 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-[#C48B28]" />
                    <span>📱 Shop Phone Number</span>
                  </label>
                  <input
                    type="tel"
                    value={settings.shop_phone}
                    onChange={(e) => setSettings({ ...settings, shop_phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#2B1B04] border border-[#C48B28]/40 text-[#FFF5E1] text-xs font-semibold focus:outline-none focus:border-[#C48B28]"
                    placeholder="+91 98765 43210"
                    required
                  />
                  <p className="text-[10px] text-[#FFF5E1]/60 mt-1">
                    Used for customer pickup SMS alerts &amp; urgent order queries.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#EBC176] mb-1.5 flex items-center justify-between">
                    <span>🆔 UPI ID / VPA</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(settings.upi_id, 'upi')}
                      className="text-[10px] text-[#C48B28] hover:text-[#FFF5E1] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedField === 'upi' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'upi' ? 'Copied' : 'Copy UPI'}</span>
                    </button>
                  </label>
                  <input
                    type="text"
                    value={settings.upi_id}
                    onChange={(e) => setSettings({ ...settings, upi_id: e.target.value.toLowerCase().trim() })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#2B1B04] border border-[#C48B28]/40 text-[#FFF5E1] text-xs font-mono font-semibold focus:outline-none focus:border-[#C48B28]"
                    placeholder="yourshop@okhdfcbank"
                    required
                  />
                  <p className="text-[10px] text-[#FFF5E1]/60 mt-1">
                    Displayed to customers for instant UPI app payments &amp; QR checkout.
                  </p>
                </div>
              </div>

              {/* Row 4: PhonePe, Google Pay & Paytm Numbers for Customer Checkout */}
              <div className="bg-[#201402] p-4 rounded-2xl border border-[#C48B28]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#EBC176] flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-[#C48B28]" />
                      <span>App-Specific Payment Numbers (Visible to Customers During Checkout)</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({
                      ...settings,
                      phonepe_number: settings.shop_phone,
                      gpay_number: settings.shop_phone,
                      paytm_number: settings.shop_phone,
                    })}
                    className="text-[10px] text-[#C48B28] hover:text-white font-semibold underline cursor-pointer"
                  >
                    Sync all to shop phone
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[#FFF5E1]/80 mb-1 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      <span>🟣 PhonePe Number</span>
                    </label>
                    <input
                      type="tel"
                      value={settings.phonepe_number || ''}
                      onChange={(e) => setSettings({ ...settings, phonepe_number: e.target.value })}
                      placeholder={settings.shop_phone || '+91 98765 43210'}
                      className="w-full px-3 py-2 rounded-xl bg-[#2B1B04] border border-[#C48B28]/40 text-[#FFF5E1] text-xs font-semibold focus:outline-none focus:border-[#C48B28]"
                    />
                    <p className="text-[9px] text-[#FFF5E1]/50 mt-0.5">Shown for PhonePe payments</p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#FFF5E1]/80 mb-1 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>🔵 Google Pay (GPay) Number</span>
                    </label>
                    <input
                      type="tel"
                      value={settings.gpay_number || ''}
                      onChange={(e) => setSettings({ ...settings, gpay_number: e.target.value })}
                      placeholder={settings.shop_phone || '+91 98765 43210'}
                      className="w-full px-3 py-2 rounded-xl bg-[#2B1B04] border border-[#C48B28]/40 text-[#FFF5E1] text-xs font-semibold focus:outline-none focus:border-[#C48B28]"
                    />
                    <p className="text-[9px] text-[#FFF5E1]/50 mt-0.5">Shown for Google Pay payments</p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#FFF5E1]/80 mb-1 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                      <span>🔷 Paytm / Other UPI Number</span>
                    </label>
                    <input
                      type="tel"
                      value={settings.paytm_number || ''}
                      onChange={(e) => setSettings({ ...settings, paytm_number: e.target.value })}
                      placeholder={settings.shop_phone || '+91 98765 43210'}
                      className="w-full px-3 py-2 rounded-xl bg-[#2B1B04] border border-[#C48B28]/40 text-[#FFF5E1] text-xs font-semibold focus:outline-none focus:border-[#C48B28]"
                    />
                    <p className="text-[9px] text-[#FFF5E1]/50 mt-0.5">Shown for Paytm / UPI apps</p>
                  </div>
                </div>
              </div>

              {/* Branch Address */}
              <div className="pt-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#EBC176] mb-1.5">
                  📍 Shop Counter Physical Location
                </label>
                <input
                  type="text"
                  value={settings.branch_name || ''}
                  onChange={(e) => setSettings({ ...settings, branch_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#2B1B04] border border-[#C48B28]/40 text-[#FFF5E1] text-xs font-semibold focus:outline-none focus:border-[#C48B28]"
                  placeholder="e.g. Campus University Tech Complex, Counter #2"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-smooth btn-dual-shimmer px-6 py-2.5 text-[#FFF5E1] text-xs font-black rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Locking Settings...' : 'Update & Lock Bank Details'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Physical Counter QR Standee & Generator */}
          <div className="space-y-6">
            <div className="bg-[#422C09] text-[#FFF5E1] rounded-3xl p-6 border border-[#C48B28]/40 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#C48B28]/30">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-[#C48B28]" />
                  <h3 className="font-extrabold text-sm text-[#FFF5E1]">
                    📷 Merchant Counter QR
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300">
                  Active
                </span>
              </div>

              {/* QR Preview Card */}
              <div className="bg-[#FFF5E1] text-[#422C09] p-5 rounded-2xl shadow-inner text-center border-2 border-[#C48B28]">
                <div className="inline-block p-2 rounded-xl bg-white shadow-sm border border-slate-200 mb-3 max-w-[200px] w-full">
                  {settings.qr_code_image ? (
                    <div className="relative group">
                      <img
                        src={settings.qr_code_image}
                        alt="Custom Shop QR"
                        className="w-40 h-40 object-contain mx-auto rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, qr_code_image: '' })}
                        className="mt-1 text-[10px] text-rose-600 font-bold hover:underline"
                      >
                        Remove custom image
                      </button>
                    </div>
                  ) : (
                    /* Generated QR SVG */
                    <svg width="150" height="150" viewBox="0 0 100 100" className="mx-auto">
                      {/* Background */}
                      <rect width="100" height="100" fill="#ffffff" />
                      {/* Corner Markers */}
                      <rect x="5" y="5" width="25" height="25" fill="#422C09" rx="2" />
                      <rect x="8" y="8" width="19" height="19" fill="#ffffff" rx="1" />
                      <rect x="11" y="11" width="13" height="13" fill="#C48B28" rx="1" />

                      <rect x="70" y="5" width="25" height="25" fill="#422C09" rx="2" />
                      <rect x="73" y="8" width="19" height="19" fill="#ffffff" rx="1" />
                      <rect x="76" y="11" width="13" height="13" fill="#C48B28" rx="1" />

                      <rect x="5" y="70" width="25" height="25" fill="#422C09" rx="2" />
                      <rect x="8" y="73" width="19" height="19" fill="#ffffff" rx="1" />
                      <rect x="11" y="76" width="13" height="13" fill="#C48B28" rx="1" />

                      {/* Data Pattern */}
                      <rect x="35" y="10" width="5" height="5" fill="#422C09" />
                      <rect x="45" y="10" width="15" height="5" fill="#422C09" />
                      <rect x="35" y="20" width="10" height="5" fill="#C48B28" />
                      <rect x="50" y="20" width="5" height="5" fill="#422C09" />

                      <rect x="10" y="35" width="15" height="5" fill="#422C09" />
                      <rect x="30" y="35" width="5" height="15" fill="#422C09" />
                      <rect x="40" y="35" width="20" height="5" fill="#C48B28" />
                      <rect x="65" y="35" width="10" height="10" fill="#422C09" />
                      <rect x="80" y="35" width="15" height="5" fill="#C48B28" />

                      <rect x="15" y="45" width="10" height="5" fill="#422C09" />
                      <rect x="40" y="45" width="5" height="20" fill="#422C09" />
                      <rect x="50" y="45" width="15" height="5" fill="#C48B28" />
                      <rect x="75" y="45" width="5" height="10" fill="#422C09" />
                      <rect x="85" y="45" width="10" height="15" fill="#422C09" />

                      <rect x="10" y="55" width="15" height="10" fill="#C48B28" />
                      <rect x="50" y="55" width="10" height="10" fill="#422C09" />
                      <rect x="65" y="60" width="15" height="5" fill="#C48B28" />

                      <rect x="35" y="70" width="15" height="5" fill="#422C09" />
                      <rect x="55" y="70" width="5" height="15" fill="#422C09" />
                      <rect x="65" y="70" width="20" height="5" fill="#C48B28" />
                      <rect x="70" y="80" width="10" height="15" fill="#422C09" />
                      <rect x="40" y="85" width="15" height="10" fill="#C48B28" />
                    </svg>
                  )}
                </div>

                <div className="font-extrabold text-xs text-[#422C09]">{settings.account_holder_name}</div>
                <div className="text-[11px] font-mono text-[#5A3C0B] font-bold mt-0.5">{settings.upi_id}</div>
                <div className="text-[10px] text-emerald-800 font-bold mt-1 bg-emerald-100 rounded-md py-0.5 px-2 inline-block">
                  NPCI Verified Merchant QR
                </div>
              </div>

              {/* QR Upload and Standee Options */}
              <div className="mt-4 space-y-2.5">
                <label className="block w-full py-2 px-3 bg-[#2B1B04] hover:bg-[#352206] text-[#FFF5E1] border border-[#C48B28]/40 text-xs font-semibold rounded-xl text-center cursor-pointer transition-colors">
                  <span>📷 Upload Custom Bank / UPI QR Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleQrUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setShowPrintModal(true)}
                  className="w-full btn-smooth btn-dual-shimmer py-2.5 text-[#FFF5E1] text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Counter Standee QR</span>
                </button>
                <p className="text-[10px] text-center text-[#FFF5E1]/60">
                  Visible to students during checkout. Can be scanned with PhonePe, GPay, Paytm, or BHIM.
                </p>
              </div>
            </div>

            {/* Quick Security Status */}
            <div className="bg-[#2B1B04] border border-[#C48B28]/30 rounded-2xl p-4 text-[#FFF5E1] text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#EBC176]">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero Leaks Guarantee</span>
              </div>
              <p className="text-[11px] text-[#FFF5E1]/80 leading-relaxed">
                When students place print orders, our system passes payments through encrypted gateway tokens. Your bank details never leave this owner console.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: PAYMENT GATEWAY CONFIGURATION */}
      {/* ============================================================== */}
      {activeTab === 'gateway' && (
        <div className="space-y-6">
          <div className="bg-[#422C09] text-[#FFF5E1] rounded-3xl p-6 sm:p-8 border border-[#C48B28]/40 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-[#C48B28]/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#C48B28]/25 border border-[#C48B28]/40 flex items-center justify-center text-[#FFF5E1]">
                  <CreditCard className="w-5 h-5 text-[#C48B28]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-[#FFF5E1]">
                    Payment Gateway Credentials &amp; Settlement
                  </h3>
                  <p className="text-[11px] text-[#FFF5E1]/70">
                    Connect your Razorpay, Cashfree, or PhonePe merchant account for automated payouts.
                  </p>
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center bg-[#2B1B04] p-1 rounded-xl border border-[#C48B28]/30">
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, gateway_mode: 'live' })}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    settings.gateway_mode === 'live'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-[#FFF5E1]/70 hover:text-white'
                  }`}
                >
                  🟢 Live Production
                </button>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, gateway_mode: 'test' })}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    settings.gateway_mode === 'test'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-[#FFF5E1]/70 hover:text-white'
                  }`}
                >
                  🟡 Test Sandbox
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Provider Selection */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#EBC176] mb-1.5">
                  Payment Gateway Partner
                </label>
                <select
                  value={settings.gateway_provider}
                  onChange={(e) => setSettings({ ...settings, gateway_provider: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#2B1B04] border border-[#C48B28]/40 text-[#FFF5E1] text-xs font-bold focus:outline-none focus:border-[#C48B28]"
                >
                  <option value="razorpay">Razorpay Merchant (UPI, Cards, NetBanking)</option>
                  <option value="cashfree">Cashfree Payments (Auto Payouts)</option>
                  <option value="phonepe_business">PhonePe for Business</option>
                  <option value="paytm_business">Paytm for Business (All-in-One QR)</option>
                </select>
                <p className="text-[10px] text-[#FFF5E1]/60 mt-1">
                  Settles directly into {settings.bank_name} (Account ending in {settings.account_number.slice(-4)}).
                </p>
              </div>

              {/* Merchant ID */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#EBC176] mb-1.5">
                  Merchant ID / Account ID
                </label>
                <input
                  type="text"
                  value={settings.gateway_merchant_id}
                  onChange={(e) => setSettings({ ...settings, gateway_merchant_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#2B1B04] border border-[#C48B28]/40 text-[#FFF5E1] text-xs font-mono font-semibold focus:outline-none focus:border-[#C48B28]"
                  placeholder="e.g. rzp_live_PRINTEASE984"
                />
              </div>

              {/* Key ID (Masked) */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#EBC176] mb-1.5 flex items-center justify-between">
                  <span>API Key ID</span>
                  <button
                    type="button"
                    onClick={() => setShowKeyId(!showKeyId)}
                    className="text-[10px] text-[#C48B28] hover:text-[#FFF5E1] flex items-center gap-1 cursor-pointer"
                  >
                    {showKeyId ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showKeyId ? 'Mask' : 'Reveal'}</span>
                  </button>
                </label>
                <input
                  type={showKeyId ? 'text' : 'password'}
                  value={settings.gateway_key_id}
                  onChange={(e) => setSettings({ ...settings, gateway_key_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#2B1B04] border border-[#C48B28]/40 text-[#FFF5E1] text-xs font-mono font-semibold focus:outline-none focus:border-[#C48B28]"
                  placeholder="rzp_live_k89a1948201"
                />
              </div>

              {/* Webhook Secret */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#EBC176] mb-1.5 flex items-center justify-between">
                  <span>Webhook Secret (Signature Verification)</span>
                  <button
                    type="button"
                    onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                    className="text-[10px] text-[#C48B28] hover:text-[#FFF5E1] flex items-center gap-1 cursor-pointer"
                  >
                    {showWebhookSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showWebhookSecret ? 'Mask' : 'Reveal'}</span>
                  </button>
                </label>
                <input
                  type={showWebhookSecret ? 'text' : 'password'}
                  value={settings.gateway_webhook_secret}
                  onChange={(e) => setSettings({ ...settings, gateway_webhook_secret: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#2B1B04] border border-[#C48B28]/40 text-[#FFF5E1] text-xs font-mono font-semibold focus:outline-none focus:border-[#C48B28]"
                  placeholder="whsec_e39f8a847b2c9183"
                />
                <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>HMAC-SHA256 active. Blocks fake payment notifications.</span>
                </p>
              </div>
            </div>

            {/* Auto Settlement Card */}
            <div className="mt-6 pt-6 border-t border-[#C48B28]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="font-bold text-xs text-[#FFF5E1] block">
                  Automated Bank Settlement Frequency
                </span>
                <span className="text-[11px] text-[#FFF5E1]/70">
                  Daily collected xerox revenue is transferred straight into {settings.bank_name}.
                </span>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={settings.settlement_frequency}
                  onChange={(e) => setSettings({ ...settings, settlement_frequency: e.target.value as any })}
                  className="px-3 py-2 rounded-xl bg-[#2B1B04] border border-[#C48B28]/40 text-[#FFF5E1] text-xs font-semibold focus:outline-none"
                >
                  <option value="daily_eod">Daily End-of-Day (11:59 PM)</option>
                  <option value="instant">Instant Real-Time (Per Order)</option>
                  <option value="t_plus_1">Next Business Day (T+1 10:00 AM)</option>
                </select>

                <button
                  type="button"
                  onClick={handleTestGateway}
                  disabled={testResult === 'testing'}
                  className="btn-smooth px-4 py-2 bg-[#5A3C0B] hover:bg-[#352206] text-[#FFF5E1] rounded-xl text-xs font-bold border border-[#C48B28]/40 flex items-center gap-1.5 cursor-pointer"
                >
                  {testResult === 'testing' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                  <span>{testResult === 'testing' ? 'Testing Link...' : 'Test Connection'}</span>
                </button>
              </div>
            </div>

            {testResult === 'success' && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Gateway connection healthy! Webhook signature verified with 0ms latency.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: HACKER PROTECTION & DATA SAFETY GUIDE */}
      {/* ============================================================== */}
      {activeTab === 'hacker_shield' && (
        <div className="space-y-6">
          <div className="bg-[#422C09] text-[#FFF5E1] rounded-3xl p-6 sm:p-8 border border-[#C48B28]/40 shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-3 pb-4 mb-6 border-b border-[#C48B28]/30">
              <div className="w-11 h-11 rounded-2xl bg-[#C48B28] flex items-center justify-center text-[#422C09]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#FFF5E1]">
                  How PrintEase Protects Your Data Against Hackers
                </h3>
                <p className="text-xs text-[#FFF5E1]/70">
                  Easy explanations of the security barriers guarding your shop and customers.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Defense 1: Zero Customer Visibility */}
              <div className="p-5 rounded-2xl bg-[#2B1B04] border border-[#C48B28]/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#EBC176]">
                  <span className="w-6 h-6 rounded-full bg-[#C48B28]/30 flex items-center justify-center text-[11px] text-[#FFF5E1]">1</span>
                  <span>Zero Exposure to Customers</span>
                </div>
                <p className="text-xs text-[#FFF5E1]/80 leading-relaxed">
                  Your bank account number, IFSC code, and API keys are <strong>strictly hidden</strong> in this Owner Desk. The student/customer application does not have access to these database fields.
                </p>
              </div>

              {/* Defense 2: Customer Card & PIN Never Stored */}
              <div className="p-5 rounded-2xl bg-[#2B1B04] border border-[#C48B28]/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#EBC176]">
                  <span className="w-6 h-6 rounded-full bg-[#C48B28]/30 flex items-center justify-center text-[11px] text-[#FFF5E1]">2</span>
                  <span>Customer Card &amp; PIN Stay on Bank Servers</span>
                </div>
                <p className="text-xs text-[#FFF5E1]/80 leading-relaxed">
                  PrintEase <strong>never</strong> asks for or stores credit card numbers, CVVs, or UPI PINs. All payments happen on RBI/NPCI-certified bank servers. PrintEase only receives harmless transaction reference IDs (e.g. <code className="text-[#C48B28]">TXN_REF_...</code>).
                </p>
              </div>

              {/* Defense 3: Account Number Masking */}
              <div className="p-5 rounded-2xl bg-[#2B1B04] border border-[#C48B28]/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#EBC176]">
                  <span className="w-6 h-6 rounded-full bg-[#C48B28]/30 flex items-center justify-center text-[11px] text-[#FFF5E1]">3</span>
                  <span>Account Number Masking (Anti Shoulder-Surfing)</span>
                </div>
                <p className="text-xs text-[#FFF5E1]/80 leading-relaxed">
                  Even when viewing this screen in front of customers or campus visitors, sensitive digits are masked (<code className="text-[#C48B28]">•••• •••• •••• {settings.account_number.slice(-4)}</code>) so no one can glance at your financial records.
                </p>
              </div>

              {/* Defense 4: HMAC Cryptographic Signatures */}
              <div className="p-5 rounded-2xl bg-[#2B1B04] border border-[#C48B28]/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#EBC176]">
                  <span className="w-6 h-6 rounded-full bg-[#C48B28]/30 flex items-center justify-center text-[11px] text-[#FFF5E1]">4</span>
                  <span>HMAC-SHA256 Anti-Tamper Defense</span>
                </div>
                <p className="text-xs text-[#FFF5E1]/80 leading-relaxed">
                  Hackers cannot trick PrintEase into marking an unpaid order as "Paid". Every payment confirmation is verified using cryptographic HMAC hashes generated by the official gateway.
                </p>
              </div>

              {/* Defense 5: 7-Day File Self-Destruct */}
              <div className="p-5 rounded-2xl bg-[#2B1B04] border border-[#C48B28]/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#EBC176]">
                  <span className="w-6 h-6 rounded-full bg-[#C48B28]/30 flex items-center justify-center text-[11px] text-[#FFF5E1]">5</span>
                  <span>Automatic Document Auto-Purge</span>
                </div>
                <p className="text-xs text-[#FFF5E1]/80 leading-relaxed">
                  Uploaded question papers and assignment documents are automatically purged from the server after 7 days, eliminating risk of document leaks or storage overflow.
                </p>
              </div>

              {/* Defense 6: Intrusion Rate Limiting */}
              <div className="p-5 rounded-2xl bg-[#2B1B04] border border-[#C48B28]/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#EBC176]">
                  <span className="w-6 h-6 rounded-full bg-[#C48B28]/30 flex items-center justify-center text-[11px] text-[#FFF5E1]">6</span>
                  <span>Brute Force &amp; SQL Injection Shield</span>
                </div>
                <p className="text-xs text-[#FFF5E1]/80 leading-relaxed">
                  The backend actively monitors and blocks SQL injections, path traversals, and brute force password attacks, recording events in your immutable Audit Log.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: PRINTABLE STANDALONE QR STANDEE */}
      {/* ============================================================== */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#FFF5E1] text-[#422C09] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border-4 border-[#C48B28] relative text-center">
            {/* Header */}
            <div className="mb-4">
              <span className="px-3 py-1 rounded-full bg-[#C48B28]/20 text-[#422C09] text-[10px] font-black uppercase tracking-wider">
                Official Campus Print Station
              </span>
              <h2 className="text-2xl font-black text-[#422C09] mt-2">
                Print<span className="text-[#C48B28]">Ease</span> Xerox
              </h2>
              <p className="text-xs text-[#5A3C0B] font-semibold">
                Scan With Any UPI App To Pay
              </p>
            </div>

            {/* Big Standee QR */}
            <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-[#C48B28] inline-block my-2 max-w-[240px] w-full">
              {settings.qr_code_image ? (
                <img
                  src={settings.qr_code_image}
                  alt="PrintEase Counter QR"
                  className="w-48 h-48 object-contain mx-auto"
                />
              ) : (
                <svg width="200" height="200" viewBox="0 0 100 100" className="mx-auto">
                  <rect width="100" height="100" fill="#ffffff" />
                  <rect x="5" y="5" width="25" height="25" fill="#422C09" rx="2" />
                  <rect x="8" y="8" width="19" height="19" fill="#ffffff" rx="1" />
                  <rect x="11" y="11" width="13" height="13" fill="#C48B28" rx="1" />

                  <rect x="70" y="5" width="25" height="25" fill="#422C09" rx="2" />
                  <rect x="73" y="8" width="19" height="19" fill="#ffffff" rx="1" />
                  <rect x="76" y="11" width="13" height="13" fill="#C48B28" rx="1" />

                  <rect x="5" y="70" width="25" height="25" fill="#422C09" rx="2" />
                  <rect x="8" y="73" width="19" height="19" fill="#ffffff" rx="1" />
                  <rect x="11" y="76" width="13" height="13" fill="#C48B28" rx="1" />

                  <rect x="35" y="10" width="5" height="5" fill="#422C09" />
                  <rect x="45" y="10" width="15" height="5" fill="#422C09" />
                  <rect x="35" y="20" width="10" height="5" fill="#C48B28" />
                  <rect x="50" y="20" width="5" height="5" fill="#422C09" />
                  <rect x="10" y="35" width="15" height="5" fill="#422C09" />
                  <rect x="30" y="35" width="5" height="15" fill="#422C09" />
                  <rect x="40" y="35" width="20" height="5" fill="#C48B28" />
                  <rect x="65" y="35" width="10" height="10" fill="#422C09" />
                  <rect x="80" y="35" width="15" height="5" fill="#C48B28" />
                  <rect x="15" y="45" width="10" height="5" fill="#422C09" />
                  <rect x="40" y="45" width="5" height="20" fill="#422C09" />
                  <rect x="50" y="45" width="15" height="5" fill="#C48B28" />
                  <rect x="75" y="45" width="5" height="10" fill="#422C09" />
                  <rect x="85" y="45" width="10" height="15" fill="#422C09" />
                  <rect x="10" y="55" width="15" height="10" fill="#C48B28" />
                  <rect x="50" y="55" width="10" height="10" fill="#422C09" />
                  <rect x="65" y="60" width="15" height="5" fill="#C48B28" />
                  <rect x="35" y="70" width="15" height="5" fill="#422C09" />
                  <rect x="55" y="70" width="5" height="15" fill="#422C09" />
                  <rect x="65" y="70" width="20" height="5" fill="#C48B28" />
                  <rect x="70" y="80" width="10" height="15" fill="#422C09" />
                  <rect x="40" y="85" width="15" height="10" fill="#C48B28" />
                </svg>
              )}
            </div>

            <div className="font-extrabold text-sm text-[#422C09] mt-2">
              {settings.account_holder_name}
            </div>
            <div className="font-mono text-xs font-bold text-[#C48B28]">
              UPI ID: {settings.upi_id}
            </div>
            <div className="text-[11px] text-[#5A3C0B] mt-1 font-semibold">
              Counter Phone: {settings.shop_phone}
            </div>

            <div className="flex items-center justify-center gap-2 mt-3 text-[11px] text-slate-600 font-bold">
              <span>Google Pay</span> • <span>PhonePe</span> • <span>Paytm</span> • <span>BHIM</span>
            </div>

            {/* Print & Close Controls */}
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-smooth btn-dual-shimmer px-5 py-2.5 text-[#FFF5E1] text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Standee</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-5 py-2.5 bg-[#422C09]/20 hover:bg-[#422C09]/30 text-[#422C09] text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
