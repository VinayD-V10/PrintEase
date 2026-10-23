import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  Bell,
  User as UserIcon,
  Search,
  BookOpen,
  LogOut,
  Upload,
  TrendingUp,
  PackageCheck,
  ShieldAlert,
  FileCode,
  Store,
  Layers,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Wallet as WalletIcon,
  Sun,
  Moon,
  HardDrive,
  CreditCard,
  Check,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { User, NotificationItem, ShopStatusInfo } from '../types/printease';
import { StatusBlinkDot } from './StatusBlinkDot';

export type PortalMode = 'customer' | 'shopkeeper';
export type CustomerPage = 'upload' | 'files' | 'track' | 'wallet' | 'orders';
export type ShopkeeperTab = 'queue' | 'kiosk' | 'analytics' | 'payments' | 'security';

interface NavbarProps {
  portal: PortalMode;
  customerPage: CustomerPage;
  shopkeeperTab: ShopkeeperTab;
  onSelectCustomerPage: (page: CustomerPage) => void;
  onSelectShopkeeperTab: (tab: ShopkeeperTab) => void;
  onOpenShopkeeperLogin: () => void;
  onExitToCustomer: () => void;
  onSwitchPortal?: (portal: PortalMode) => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenOwnerProfile?: () => void;
  notifications: NotificationItem[];
  onOpenNotifications: () => void;
  unreadCount: number;
  shopStatus?: ShopStatusInfo | null;
  walletBalance?: number;
  onOpenShopStatusControl?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  portal,
  customerPage,
  shopkeeperTab,
  onSelectCustomerPage,
  onSelectShopkeeperTab,
  onOpenShopkeeperLogin,
  onExitToCustomer,
  onSwitchPortal,
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenOwnerProfile,
  unreadCount,
  onOpenNotifications,
  shopStatus,
  walletBalance = 250,
  onOpenShopStatusControl,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isShopOpen = shopStatus ? shopStatus.status === 'OPEN' : true;

  // Auto-close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    }
    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserDropdown]);

  // ==========================================
  // 1. SHOPKEEPER / OWNER NAVBAR
  // (Zero Student Studio visible - Dedicated Business App)
  // ==========================================
  if (portal === 'shopkeeper') {
    return (
      <header className="sticky top-0 z-40 bg-[#422C09] text-[#FFF5E1] border-b border-[#C48B28]/30 shadow-md">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-1.5 sm:gap-2">
            {/* Shopkeeper Brand */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-[#C48B28] to-[#EBC176] flex items-center justify-center text-[#FFF5E1] shadow-md shadow-[#C48B28]/30 shrink-0">
                <Store className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-base sm:text-xl font-black tracking-tight text-[#FFF5E1]">
                    Print<span className="text-[#C48B28]">Ease</span>
                  </span>
                  <span className="hidden sm:inline px-1.5 sm:px-2 py-0.5 rounded-md bg-[#C48B28]/30 text-[#FFF5E1] border border-[#C48B28]/40 text-[9px] sm:text-[10px] font-black uppercase tracking-wider">
                    Owner Console
                  </span>
                </div>
                <span className="hidden md:block text-[11px] font-semibold text-[#FFF5E1]/70 -mt-0.5">
                  Order Fulfillment, Pricing &amp; Cyber Defense
                </span>
              </div>
            </div>

            {/* Shopkeeper Desktop Navigation Tabs */}
            <nav className="hidden lg:flex items-center bg-[#352206] p-1 rounded-2xl border border-[#C48B28]/25 gap-1">
              <button
                onClick={() => onSelectShopkeeperTab('queue')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  shopkeeperTab === 'queue'
                    ? 'bg-[#C48B28] text-[#FFF5E1] shadow-sm'
                    : 'text-[#FFF5E1]/80 hover:text-white hover:bg-[#C48B28]/20'
                }`}
              >
                <Printer className="w-4 h-4" />
                <span>Print Queue</span>
              </button>

              <button
                onClick={() => onSelectShopkeeperTab('kiosk')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  shopkeeperTab === 'kiosk'
                    ? 'bg-[#C48B28] text-[#FFF5E1] shadow-sm'
                    : 'text-[#FFF5E1]/80 hover:text-white hover:bg-[#C48B28]/20'
                }`}
              >
                <PackageCheck className="w-4 h-4" />
                <span>Pickup Kiosk</span>
              </button>

              <button
                onClick={() => onSelectShopkeeperTab('analytics')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  shopkeeperTab === 'analytics'
                    ? 'bg-[#C48B28] text-[#FFF5E1] shadow-sm'
                    : 'text-[#FFF5E1]/80 hover:text-white hover:bg-[#C48B28]/20'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Analytics &amp; Rates</span>
              </button>

              <button
                onClick={() => onSelectShopkeeperTab('payments')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  shopkeeperTab === 'payments'
                    ? 'bg-[#C48B28] text-[#FFF5E1] shadow-sm'
                    : 'text-[#FFF5E1]/80 hover:text-white hover:bg-[#C48B28]/20'
                }`}
                title="Owner Payment & Banking Settings"
              >
                <CreditCard className="w-4 h-4" />
                <span>Payment Details</span>
              </button>

              <button
                onClick={() => onSelectShopkeeperTab('security')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  shopkeeperTab === 'security'
                    ? 'bg-[#C48B28] text-[#FFF5E1] shadow-sm'
                    : 'text-[#FFF5E1]/80 hover:text-white hover:bg-[#C48B28]/20'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Cyber Shield</span>
              </button>

            </nav>

            {/* Right Side Actions for Shopkeeper */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* Payment Details Button on md+ */}
              <button
                type="button"
                onClick={() => onSelectShopkeeperTab('payments')}
                className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  shopkeeperTab === 'payments'
                    ? 'bg-[#C48B28] text-white border-[#C48B28]'
                    : 'bg-[#352206] text-[#EBC176] border-[#C48B28]/40 hover:bg-[#4A3008]'
                }`}
                title="Owner Payment & Bank Details"
              >
                <CreditCard className="w-3.5 h-3.5 text-[#C48B28]" />
                <span>Payments</span>
              </button>

              {/* Live Shop Status Button for Owner (Compact on mobile) */}
              {onOpenShopStatusControl && (
                <button
                  onClick={onOpenShopStatusControl}
                  className={`p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center gap-1 sm:gap-1.5 border-2 cursor-pointer shadow-xs shrink-0 ${
                    isShopOpen
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                  }`}
                  title="Configure Shop Hours & Status"
                >
                  <StatusBlinkDot isOpen={isShopOpen} size="sm" />
                  <span className="hidden sm:inline">{isShopOpen ? 'OPEN' : 'CLOSED'}</span>
                </button>
              )}

              {/* Notifications */}
              <button
                onClick={onOpenNotifications}
                className="relative p-1.5 sm:p-2 text-[#FFF5E1]/80 hover:text-[#FFF5E1] hover:bg-[#C48B28]/20 rounded-xl transition-colors cursor-pointer shrink-0"
                title="Notifications"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#C48B28] text-[#FFF5E1] text-[9px] sm:text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Owner Profile Button & Avatar (Clickable to open Owner Profile Modal) */}
              {onOpenOwnerProfile && (
                <button
                  type="button"
                  onClick={onOpenOwnerProfile}
                  className="flex items-center gap-1 sm:gap-1.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#352206] hover:bg-[#4A3008] border border-[#C48B28]/40 text-xs font-bold text-[#FFF5E1] transition-all cursor-pointer shadow-xs shrink-0"
                  title="Owner Profile & Payment Info"
                  aria-label="Owner Profile"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-[#C48B28] to-[#EBC176] text-[#422C09] flex items-center justify-center font-black text-xs shrink-0 shadow-xs border border-white/20">
                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'V'}
                  </div>
                  <div className="hidden sm:flex flex-col text-left leading-tight">
                    <span className="text-[11px] font-black text-[#EBC176] truncate max-w-[100px]">
                      {currentUser?.name || 'Vinay (Owner)'}
                    </span>
                    <span className="text-[9px] text-[#FFF5E1]/70 font-mono">
                      Owner Profile
                    </span>
                  </div>
                </button>
              )}

              {/* View Student Portal on md+ */}
              {onSwitchPortal && (
                <button
                  type="button"
                  onClick={() => onSwitchPortal('customer')}
                  className="hidden md:flex px-2.5 py-1.5 bg-[#2E1C05] hover:bg-[#3D2507] text-[#FFF5E1]/85 hover:text-white rounded-xl text-xs font-bold border border-[#C48B28]/30 transition-all cursor-pointer items-center gap-1.5"
                  title="View Student Portal"
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#C48B28]" />
                  <span>Student App</span>
                </button>
              )}

              {/* Owner Logout Button - High-visibility on Mobile Preview and Desktop */}
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-2.5 sm:px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-black border border-rose-400/80 transition-all cursor-pointer flex items-center gap-1 shadow-sm hover:shadow-md shrink-0 active:scale-95"
                  title="Owner Logout"
                  aria-label="Owner Logout"
                >
                  <LogOut className="w-3.5 h-3.5 text-white shrink-0" />
                  <span className="text-[11px] font-black tracking-tight">Logout</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Shopkeeper Fixed Mobile App Bottom Navigation Bar */}
        <nav
          aria-label="Shopkeeper Navigation"
          className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-[#422C09]/95 backdrop-blur-md border-t border-[#C48B28]/35 shadow-2xl px-1 py-1.5 flex items-center justify-between pb-safe"
        >
          <button
            onClick={() => onSelectShopkeeperTab('queue')}
            className={`flex flex-col items-center justify-center min-w-[38px] flex-1 max-w-[62px] py-1 gap-0.5 rounded-xl text-[10px] font-bold cursor-pointer transition-all ${
              shopkeeperTab === 'queue'
                ? 'text-[#C48B28] font-black'
                : 'text-[#FFF5E1]/70 hover:text-white'
            }`}
          >
            <div className={`p-1 rounded-lg ${shopkeeperTab === 'queue' ? 'bg-[#C48B28]/25 text-[#C48B28]' : ''}`}>
              <Printer className="w-4 h-4" />
            </div>
            <span>Queue</span>
          </button>

          <button
            onClick={() => onSelectShopkeeperTab('kiosk')}
            className={`flex flex-col items-center justify-center min-w-[38px] flex-1 max-w-[62px] py-1 gap-0.5 rounded-xl text-[10px] font-bold cursor-pointer transition-all ${
              shopkeeperTab === 'kiosk'
                ? 'text-[#C48B28] font-black'
                : 'text-[#FFF5E1]/70 hover:text-white'
            }`}
          >
            <div className={`p-1 rounded-lg ${shopkeeperTab === 'kiosk' ? 'bg-[#C48B28]/25 text-[#C48B28]' : ''}`}>
              <PackageCheck className="w-4 h-4" />
            </div>
            <span>Kiosk</span>
          </button>

          <button
            onClick={() => onSelectShopkeeperTab('analytics')}
            className={`flex flex-col items-center justify-center min-w-[38px] flex-1 max-w-[62px] py-1 gap-0.5 rounded-xl text-[10px] font-bold cursor-pointer transition-all ${
              shopkeeperTab === 'analytics'
                ? 'text-[#C48B28] font-black'
                : 'text-[#FFF5E1]/70 hover:text-white'
            }`}
          >
            <div className={`p-1 rounded-lg ${shopkeeperTab === 'analytics' ? 'bg-[#C48B28]/25 text-[#C48B28]' : ''}`}>
              <TrendingUp className="w-4 h-4" />
            </div>
            <span>Analytics</span>
          </button>

          <button
            onClick={() => onSelectShopkeeperTab('payments')}
            className={`flex flex-col items-center justify-center min-w-[38px] flex-1 max-w-[62px] py-1 gap-0.5 rounded-xl text-[10px] font-bold cursor-pointer transition-all ${
              shopkeeperTab === 'payments'
                ? 'text-[#C48B28] font-black'
                : 'text-[#FFF5E1]/70 hover:text-white'
            }`}
          >
            <div className={`p-1 rounded-lg ${shopkeeperTab === 'payments' ? 'bg-[#C48B28]/25 text-[#C48B28]' : ''}`}>
              <CreditCard className="w-4 h-4" />
            </div>
            <span>Payments</span>
          </button>

          {onOpenOwnerProfile && (
            <button
              onClick={onOpenOwnerProfile}
              className="flex flex-col items-center justify-center min-w-[38px] flex-1 max-w-[62px] py-1 gap-0.5 rounded-xl text-[10px] font-bold text-[#FFF5E1]/70 hover:text-white cursor-pointer transition-all"
            >
              <div className="p-1 rounded-lg">
                <UserIcon className="w-4 h-4" />
              </div>
              <span>Profile</span>
            </button>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              className="flex flex-col items-center justify-center min-w-[38px] flex-1 max-w-[62px] py-1 gap-0.5 rounded-xl text-[10px] font-black text-rose-300 hover:text-white cursor-pointer transition-all active:scale-95"
              title="Owner Logout"
              aria-label="Owner Logout"
            >
              <div className="p-1 rounded-lg text-rose-300 bg-rose-950/60 border border-rose-500/40">
                <LogOut className="w-4 h-4 text-rose-300" />
              </div>
              <span className="font-black text-rose-300">Logout</span>
            </button>
          )}
        </nav>
      </header>
    );
  }

  // ==========================================
  // 2. CUSTOMER / STUDENT NAVBAR
  // (Shopkeeper Desk, Cyber Shield, Analytics & PHP strictly HIDDEN)
  // ==========================================
  return (
    <header className="sticky top-0 z-40 bg-[#422C09] text-[#FFF5E1] border-b border-[#C48B28]/30 shadow-md">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-1.5 sm:gap-2">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => onSelectCustomerPage('upload')}
              className="flex items-center gap-2 sm:gap-2.5 text-left focus:outline-hidden group cursor-pointer"
            >
              <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-[#C48B28] to-[#EBC176] flex items-center justify-center text-[#422C09] shadow-md group-hover:scale-105 transition-transform duration-300 shrink-0">
                <Printer className="w-4 h-4 sm:w-6 sm:h-6 text-[#422C09]" />
              </div>
              <div>
                <span className="text-base sm:text-2xl font-black tracking-tight text-[#FFF5E1] flex items-center gap-0.5">
                  Print<span className="text-[#C48B28] underline decoration-[#C48B28]/40">Ease</span>
                </span>
                <span className="hidden sm:block text-[11px] font-semibold text-[#FFF5E1]/70 -mt-1 tracking-wide">
                  Your Documents. Our Priority.
                </span>
              </div>
            </button>
          </div>

          {/* Customer Navigation Links: Upload, Stored Files, Track, Wallet, My Orders */}
          <nav className="hidden md:flex items-center bg-[#352206] p-1 rounded-2xl border border-[#C48B28]/25 gap-1 shadow-2xs">
            <button
              onClick={() => onSelectCustomerPage('upload')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                customerPage === 'upload'
                  ? 'bg-[#C48B28] text-[#FFF5E1] shadow-sm'
                  : 'text-[#FFF5E1]/80 hover:text-white hover:bg-[#C48B28]/20'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload &amp; Print</span>
            </button>

            {/* SEPARATE STORED FILES SECTION */}
            <button
              onClick={() => onSelectCustomerPage('files')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                customerPage === 'files'
                  ? 'bg-[#C48B28] text-[#FFF5E1] shadow-sm'
                  : 'text-[#FFF5E1]/80 hover:text-white hover:bg-[#C48B28]/20'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              <span>Stored Files</span>
            </button>

            <button
              onClick={() => onSelectCustomerPage('track')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                customerPage === 'track'
                  ? 'bg-[#C48B28] text-[#FFF5E1] shadow-sm'
                  : 'text-[#FFF5E1]/80 hover:text-white hover:bg-[#C48B28]/20'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Track Order</span>
            </button>

            {/* Wallet tab with live balance pill (Requirement 81) */}
            <button
              onClick={() => onSelectCustomerPage('wallet')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                customerPage === 'wallet'
                  ? 'bg-[#C48B28] text-[#FFF5E1] shadow-sm'
                  : 'text-[#FFF5E1]/80 hover:text-white hover:bg-[#C48B28]/20'
              }`}
            >
              <WalletIcon className="w-4 h-4" />
              <span>Wallet</span>
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-md font-mono text-[10px] font-black ${
                  customerPage === 'wallet'
                    ? 'bg-[#FFF5E1] text-[#422C09]'
                    : 'bg-[#C48B28] text-[#FFF5E1]'
                }`}
              >
                ₹{walletBalance.toFixed(0)}
              </span>
            </button>

            <button
              onClick={() => onSelectCustomerPage('orders')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                customerPage === 'orders'
                  ? 'bg-[#C48B28] text-[#FFF5E1] shadow-sm'
                  : 'text-[#FFF5E1]/80 hover:text-white hover:bg-[#C48B28]/20'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>My Orders</span>
            </button>
          </nav>

          {/* Action Links & Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Live Shop Status Mini-Badge for Customer */}
            <div
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider border shadow-2xs shrink-0 ${
                isShopOpen
                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50'
                  : 'bg-rose-950/70 text-rose-300 border-rose-500/50 animate-pulse'
              }`}
              title={isShopOpen ? 'Print Shop is Open' : 'Print Shop is Closed'}
            >
              <StatusBlinkDot isOpen={isShopOpen} size="sm" />
              <span className="hidden xs:inline">{isShopOpen ? 'OPEN' : 'CLOSED'}</span>
            </div>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-1.5 sm:p-2 text-[#FFF5E1]/80 hover:text-[#FFF5E1] hover:bg-[#C48B28]/20 rounded-xl transition-colors cursor-pointer shrink-0"
              title="Notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#C48B28] text-[#FFF5E1] text-[9px] sm:text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Customer User Account */}
            {currentUser ? (
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {/* Customer Logout Button in Header (Single authoritative logout for desktop) */}
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="hidden md:flex px-2 sm:px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-black transition-all cursor-pointer items-center gap-1 shadow-xs hover:shadow-sm shrink-0 active:scale-95 border border-rose-400/70"
                    title="User Logout"
                    aria-label="User Logout"
                  >
                    <LogOut className="w-3.5 h-3.5 text-white shrink-0" />
                    <span className="text-[11px] font-black tracking-tight">Logout</span>
                  </button>
                )}

                {/* Quick Switch to Owner Console if logged in as Admin/Staff */}
                {(currentUser.role === 'admin' || currentUser.role === 'staff') && onSwitchPortal && (
                  <button
                    type="button"
                    onClick={() => onSwitchPortal('shopkeeper')}
                    className="hidden md:flex px-2.5 sm:px-3 py-1.5 bg-[#C48B28] hover:bg-[#A9741D] text-[#FFF5E1] rounded-xl text-xs font-bold transition-all cursor-pointer items-center gap-1.5 shadow-xs"
                    title="Return to Owner Console"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Owner Console</span>
                  </button>
                )}

                {/* Profile Dropdown Trigger */}
                <div ref={dropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center gap-1 p-1 sm:px-2.5 sm:py-1.5 bg-[#352206] hover:bg-[#4E320A] border border-[#C48B28]/40 rounded-xl text-xs cursor-pointer transition-all shadow-xs shrink-0"
                    title="Account Profile"
                    aria-expanded={showUserDropdown}
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#C48B28] text-[#FFF5E1] flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                      {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="hidden sm:block text-left leading-tight">
                      <div className="font-extrabold text-[#FFF5E1] text-xs truncate max-w-[100px]">
                        {currentUser.name}
                      </div>
                      <div className="text-[10px] text-[#C48B28] font-mono truncate max-w-[100px]">
                        {currentUser.role === 'admin' || currentUser.role === 'staff' ? 'Shop Owner' : currentUser.email}
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-[#C48B28] shrink-0" />
                  </button>

                  {/* Authenticated User Profile Dropdown */}
                  {showUserDropdown && (
                    <div className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 text-slate-800 animate-fadeIn">
                      {/* Current User Card */}
                      <div className="pb-3 border-b border-slate-100">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5A3C0B] to-[#7A5212] text-[#FFF5E1] flex items-center justify-center font-black text-base shadow-xs shrink-0">
                              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="min-w-0">
                              <strong className="text-sm text-slate-900 block truncate font-extrabold leading-tight">
                                {currentUser.name}
                              </strong>
                              <span className="text-xs text-slate-500 font-mono block truncate mt-0.5">
                                {currentUser.email}
                              </span>
                            </div>
                          </div>
                          <Check className="w-4 h-4 text-[#C48B28] shrink-0 mt-1" />
                        </div>

                        <div className="mt-3">
                          <span className="px-2.5 py-1 rounded-md bg-[#FFF5E1] text-[#5A3C0B] border border-[#C48B28]/30 text-xs font-bold">
                            {currentUser.role === 'customer' ? 'Customer Account' : `${currentUser.role} Account`}
                          </span>
                        </div>
                      </div>

                      {/* Dropdown Footer Actions */}
                      <div className="pt-3 space-y-2 text-xs">
                        {(currentUser.role === 'admin' || currentUser.role === 'staff') && onSwitchPortal && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowUserDropdown(false);
                              onSwitchPortal('shopkeeper');
                            }}
                            className="w-full text-left text-[#C48B28] hover:text-[#5A3C0B] font-bold cursor-pointer flex items-center gap-1.5 py-1"
                          >
                            <Store className="w-3.5 h-3.5 text-[#C48B28]" />
                            <span>Switch to Owner Console</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setShowUserDropdown(false);
                            onOpenAuth();
                          }}
                          className="w-full text-left text-slate-600 font-bold hover:underline cursor-pointer flex items-center gap-1.5 py-1"
                        >
                          <span>+ Sign In Another Account</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="btn-smooth btn-dual-shimmer px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[#FFF5E1] text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <UserIcon className="w-3.5 h-3.5 text-[#FFF5E1]" />
                <span className="hidden xs:inline">Sign In</span>
                <span className="xs:hidden">Login</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Customer Fixed Mobile App Bottom Navigation Bar */}
      <nav
        aria-label="Customer Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[#422C09]/95 backdrop-blur-md border-t border-[#C48B28]/35 shadow-2xl px-1 py-1.5 flex items-center justify-between pb-safe"
      >
        <button
          onClick={() => onSelectCustomerPage('upload')}
          className={`flex flex-col items-center justify-center min-w-[38px] flex-1 max-w-[62px] py-1 gap-0.5 rounded-xl text-[10px] font-bold cursor-pointer transition-all ${
            customerPage === 'upload'
              ? 'text-[#C48B28] font-black'
              : 'text-[#FFF5E1]/70 hover:text-white'
          }`}
        >
          <div className={`p-1 rounded-lg ${customerPage === 'upload' ? 'bg-[#C48B28]/25 text-[#C48B28]' : ''}`}>
            <Upload className="w-4 h-4" />
          </div>
          <span>Upload</span>
        </button>

        <button
          onClick={() => onSelectCustomerPage('files')}
          className={`flex flex-col items-center justify-center min-w-[38px] flex-1 max-w-[62px] py-1 gap-0.5 rounded-xl text-[10px] font-bold cursor-pointer transition-all ${
            customerPage === 'files'
              ? 'text-[#C48B28] font-black'
              : 'text-[#FFF5E1]/70 hover:text-white'
          }`}
        >
          <div className={`p-1 rounded-lg ${customerPage === 'files' ? 'bg-[#C48B28]/25 text-[#C48B28]' : ''}`}>
            <HardDrive className="w-4 h-4" />
          </div>
          <span>Files</span>
        </button>

        <button
          onClick={() => onSelectCustomerPage('track')}
          className={`flex flex-col items-center justify-center min-w-[38px] flex-1 max-w-[62px] py-1 gap-0.5 rounded-xl text-[10px] font-bold cursor-pointer transition-all ${
            customerPage === 'track'
              ? 'text-[#C48B28] font-black'
              : 'text-[#FFF5E1]/70 hover:text-white'
          }`}
        >
          <div className={`p-1 rounded-lg ${customerPage === 'track' ? 'bg-[#C48B28]/25 text-[#C48B28]' : ''}`}>
            <Search className="w-4 h-4" />
          </div>
          <span>Track</span>
        </button>

        <button
          onClick={() => onSelectCustomerPage('wallet')}
          className={`flex flex-col items-center justify-center min-w-[38px] flex-1 max-w-[62px] py-1 gap-0.5 rounded-xl text-[10px] font-bold cursor-pointer transition-all relative ${
            customerPage === 'wallet'
              ? 'text-[#C48B28] font-black'
              : 'text-[#FFF5E1]/70 hover:text-white'
          }`}
        >
          <div className={`p-1 rounded-lg relative ${customerPage === 'wallet' ? 'bg-[#C48B28]/25 text-[#C48B28]' : ''}`}>
            <WalletIcon className="w-4 h-4" />
            {walletBalance > 0 && (
              <span className="absolute -top-1 -right-2 px-1 py-0.2 bg-[#C48B28] text-[#FFF5E1] font-mono text-[9px] font-black rounded-full">
                ₹{walletBalance.toFixed(0)}
              </span>
            )}
          </div>
          <span>Wallet</span>
        </button>

        <button
          onClick={() => onSelectCustomerPage('orders')}
          className={`flex flex-col items-center justify-center min-w-[38px] flex-1 max-w-[62px] py-1 gap-0.5 rounded-xl text-[10px] font-bold cursor-pointer transition-all ${
            customerPage === 'orders'
              ? 'text-[#C48B28] font-black'
              : 'text-[#FFF5E1]/70 hover:text-white'
          }`}
        >
          <div className={`p-1 rounded-lg ${customerPage === 'orders' ? 'bg-[#C48B28]/25 text-[#C48B28]' : ''}`}>
            <BookOpen className="w-4 h-4" />
          </div>
          <span>Orders</span>
        </button>

        {currentUser && onLogout ? (
          <button
            onClick={onLogout}
            className="flex flex-col items-center justify-center min-w-[38px] flex-1 max-w-[62px] py-1 gap-0.5 rounded-xl text-[10px] font-black text-rose-300 hover:text-white cursor-pointer transition-all active:scale-95"
            title="User Logout"
            aria-label="User Logout"
          >
            <div className="p-1 rounded-lg text-rose-300 bg-rose-950/60 border border-rose-500/40">
              <LogOut className="w-4 h-4 text-rose-300" />
            </div>
            <span className="font-black text-rose-300">Logout</span>
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex flex-col items-center justify-center min-w-[38px] flex-1 max-w-[62px] py-1 gap-0.5 rounded-xl text-[10px] font-bold text-[#EBC176] hover:text-white cursor-pointer transition-all active:scale-95"
            title="Customer Sign In"
            aria-label="Customer Sign In"
          >
            <div className="p-1 rounded-lg text-[#EBC176] bg-[#C48B28]/25 border border-[#C48B28]/35">
              <UserIcon className="w-4 h-4 text-[#EBC176]" />
            </div>
            <span className="font-bold text-[#EBC176]">Login</span>
          </button>
        )}
      </nav>
    </header>
  );
};
