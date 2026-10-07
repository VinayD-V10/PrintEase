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
  onOpenPhpSpecs: () => void;
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
  onOpenPhpSpecs,
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Shopkeeper Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-[#C48B28] to-[#EBC176] flex items-center justify-center text-[#FFF5E1] shadow-md shadow-[#C48B28]/30">
                <Store className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg sm:text-xl font-black tracking-tight text-[#FFF5E1]">
                    Print<span className="text-[#C48B28]">Ease</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#C48B28]/30 text-[#FFF5E1] border border-[#C48B28]/40 text-[10px] font-black uppercase tracking-wider">
                    Shop Owner Console
                  </span>
                </div>
                <span className="hidden sm:block text-[11px] font-semibold text-[#FFF5E1]/70 -mt-0.5">
                  Order Fulfillment, Pricing &amp; Cyber Defense
                </span>
              </div>
            </div>

            {/* Shopkeeper Tabs (Student Studio is strictly REMOVED) */}
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
                <span>Payment Settings</span>
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

              <button
                onClick={onOpenPhpSpecs}
                className="px-3 py-2 rounded-xl text-xs font-bold text-[#FFF5E1]/80 hover:text-[#C48B28] hover:bg-[#C48B28]/15 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="PHP 8+ Backend & MySQL Schema"
              >
                <FileCode className="w-4 h-4 text-[#C48B28]" />
                <span>PHP / MySQL</span>
              </button>
            </nav>

            {/* Right Side Actions for Shopkeeper */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Live Shop Status Button for Owner (Requirement 68) */}
              {onOpenShopStatusControl && (
                <button
                  onClick={onOpenShopStatusControl}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 border-2 cursor-pointer shadow-xs ${
                    isShopOpen
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                  }`}
                  title="Configure Shop Hours & Status"
                >
                  <StatusBlinkDot isOpen={isShopOpen} size="sm" />
                  <span>{isShopOpen ? 'OPEN' : 'CLOSED'}</span>
                </button>
              )}

              {/* Notifications */}
              <button
                onClick={onOpenNotifications}
                className="relative p-2 text-[#FFF5E1]/80 hover:text-[#FFF5E1] hover:bg-[#C48B28]/20 rounded-xl transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#C48B28] text-[#FFF5E1] text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Owner Portal Active Indicator */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#352206] text-[#EBC176] rounded-xl border border-[#C48B28]/40 text-xs font-bold shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-[#C48B28]" />
                <span>Owner Console</span>
              </div>

              {/* View Student Portal for Authorized Owner */}
              {onSwitchPortal && (
                <button
                  type="button"
                  onClick={() => onSwitchPortal('customer')}
                  className="px-3 py-1.5 bg-[#2E1C05] hover:bg-[#3D2507] text-[#FFF5E1]/85 hover:text-white rounded-xl text-xs font-bold border border-[#C48B28]/30 transition-all cursor-pointer flex items-center gap-1.5"
                  title="View Student Portal"
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#C48B28]" />
                  <span className="hidden md:inline">View Student App</span>
                </button>
              )}

              {/* Single Owner Logout Button (Up side only one) */}
              {onLogout && (
                <div className="flex items-center gap-1.5 sm:gap-2.5 pl-1.5 sm:pl-2 border-l border-[#C48B28]/30">
                  {currentUser && (
                    <div className="hidden lg:flex flex-col text-right leading-tight">
                      <span className="text-[11px] font-black text-[#EBC176] truncate max-w-[130px]">
                        {currentUser.name}
                      </span>
                      <span className="text-[9px] text-[#FFF5E1]/70 font-mono font-semibold">
                        Authorized Owner
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={onLogout}
                    className="px-2.5 sm:px-3.5 py-1.5 bg-rose-600/30 hover:bg-rose-600 text-rose-100 hover:text-white rounded-xl text-xs font-black border border-rose-400/60 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs hover:shadow-sm"
                    title="Owner Logout"
                    aria-label="Owner Logout"
                  >
                    <LogOut className="w-4 h-4 text-rose-300 group-hover:text-white shrink-0" />
                    <span>Owner Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Shopkeeper Fixed Mobile App Bottom Navigation Bar */}
        <nav
          aria-label="Shopkeeper Navigation"
          className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-[#422C09]/95 backdrop-blur-md border-t border-[#C48B28]/35 shadow-2xl px-2 py-1.5 flex items-center justify-around pb-safe"
        >
          <button
            onClick={() => onSelectShopkeeperTab('queue')}
            className={`flex flex-col items-center justify-center min-w-[52px] sm:min-w-[56px] py-1 gap-0.5 rounded-xl text-[10px] font-bold cursor-pointer transition-all ${
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
            className={`flex flex-col items-center justify-center min-w-[52px] sm:min-w-[56px] py-1 gap-0.5 rounded-xl text-[10px] font-bold cursor-pointer transition-all ${
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
            className={`flex flex-col items-center justify-center min-w-[52px] sm:min-w-[56px] py-1 gap-0.5 rounded-xl text-[10px] font-bold cursor-pointer transition-all ${
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
            className={`flex flex-col items-center justify-center min-w-[52px] sm:min-w-[56px] py-1 gap-0.5 rounded-xl text-[10px] font-bold cursor-pointer transition-all ${
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

          <button
            onClick={() => onSelectShopkeeperTab('security')}
            className={`flex flex-col items-center justify-center min-w-[52px] sm:min-w-[56px] py-1 gap-0.5 rounded-xl text-[10px] font-bold cursor-pointer transition-all ${
              shopkeeperTab === 'security'
                ? 'text-[#C48B28] font-black'
                : 'text-[#FFF5E1]/70 hover:text-white'
            }`}
          >
            <div className={`p-1 rounded-lg ${shopkeeperTab === 'security' ? 'bg-[#C48B28]/25 text-[#C48B28]' : ''}`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
            <span>Shield</span>
          </button>

          <button
            onClick={onOpenPhpSpecs}
            className="flex flex-col items-center justify-center min-w-[48px] sm:min-w-[52px] py-1 gap-0.5 rounded-xl text-[10px] font-bold text-[#EBC176]/80 hover:text-[#C48B28] cursor-pointer"
            title="PHP Backend"
          >
            <div className="p-1 rounded-lg">
              <FileCode className="w-4 h-4" />
            </div>
            <span>PHP</span>
          </button>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectCustomerPage('upload')}
              className="flex items-center gap-2.5 text-left focus:outline-hidden group cursor-pointer"
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-[#C48B28] to-[#EBC176] flex items-center justify-center text-[#422C09] shadow-md group-hover:scale-105 transition-transform duration-300">
                <Printer className="w-5 h-5 sm:w-6 sm:h-6 text-[#422C09]" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black tracking-tight text-[#FFF5E1] flex items-center gap-1">
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
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Shop Status Mini-Badge for Customer (Requirement 66) */}
            <div
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider border shadow-2xs ${
                isShopOpen
                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50'
                  : 'bg-rose-950/70 text-rose-300 border-rose-500/50 animate-pulse'
              }`}
            >
              <StatusBlinkDot isOpen={isShopOpen} size="sm" />
              <span>{isShopOpen ? 'SHOP OPEN' : 'SHOP CLOSED'}</span>
            </div>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-[#FFF5E1]/80 hover:text-[#FFF5E1] hover:bg-[#C48B28]/20 rounded-xl transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#C48B28] text-[#FFF5E1] text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Customer User Account */}
            <div ref={dropdownRef} className="relative">
              {currentUser ? (
                <div className="flex items-center gap-1.5">
                  {/* Quick Switch to Owner Console if logged in as Admin/Staff */}
                  {(currentUser.role === 'admin' || currentUser.role === 'staff') && onSwitchPortal && (
                    <button
                      type="button"
                      onClick={() => onSwitchPortal('shopkeeper')}
                      className="px-2.5 sm:px-3 py-1.5 bg-[#C48B28] hover:bg-[#A9741D] text-[#FFF5E1] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                      title="Return to Owner Console"
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Owner Console</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#352206] hover:bg-[#4E320A] border border-[#C48B28]/40 rounded-xl text-xs cursor-pointer transition-all shadow-xs"
                    title="Account Profile"
                    aria-expanded={showUserDropdown}
                  >
                    <div className="w-6 h-6 rounded-lg bg-[#C48B28] text-[#FFF5E1] flex items-center justify-center font-black text-[11px]">
                      {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="hidden sm:block text-left leading-tight">
                      <div className="font-extrabold text-[#FFF5E1] text-xs truncate max-w-[120px]">
                        {currentUser.name}
                      </div>
                      <div className="text-[10px] text-[#C48B28] font-mono truncate max-w-[120px]">
                        {currentUser.role === 'admin' || currentUser.role === 'staff' ? 'Shop Owner' : currentUser.email}
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-[#C48B28]" />
                  </button>

                  <button
                    type="button"
                    onClick={onLogout}
                    className="px-2.5 sm:px-3 py-1.5 bg-rose-600/30 hover:bg-rose-600 text-rose-100 hover:text-white rounded-xl text-xs font-bold border border-rose-400/50 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                    title={currentUser.role === 'admin' || currentUser.role === 'staff' ? 'Owner Logout' : 'Logout'}
                    aria-label="Logout"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-300 group-hover:text-white shrink-0" />
                    <span className="hidden sm:inline font-bold">
                      {currentUser.role === 'admin' || currentUser.role === 'staff' ? 'Owner Logout' : 'Logout'}
                    </span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="btn-smooth btn-dual-shimmer px-3.5 py-2 rounded-xl text-[#FFF5E1] text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#FFF5E1]" />
                  <span>Sign In / Register</span>
                </button>
              )}

              {/* Authenticated User Profile Dropdown (Shows ONLY currently logged-in user) */}
              {showUserDropdown && currentUser && (
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
                        {currentUser.role === 'customer' ? 'Customer' : currentUser.role}
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

                    <button
                      type="button"
                      onClick={() => {
                        setShowUserDropdown(false);
                        onLogout();
                      }}
                      className="w-full text-left text-rose-600 font-bold hover:text-rose-700 hover:underline cursor-pointer py-1 flex items-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{currentUser.role === 'admin' || currentUser.role === 'staff' ? 'Owner Logout' : 'Sign Out'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customer Fixed Mobile App Bottom Navigation Bar */}
        <nav
          aria-label="Customer Navigation"
          className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[#422C09]/95 backdrop-blur-md border-t border-[#C48B28]/35 shadow-2xl px-2 py-1.5 flex items-center justify-around pb-safe"
        >
          <button
            onClick={() => onSelectCustomerPage('upload')}
            className={`flex flex-col items-center justify-center min-w-[56px] py-1 gap-0.5 rounded-xl text-[10px] font-bold cursor-pointer transition-all ${
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
            className={`flex flex-col items-center justify-center min-w-[56px] py-1 gap-0.5 rounded-xl text-[10px] font-bold cursor-pointer transition-all ${
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
            className={`flex flex-col items-center justify-center min-w-[56px] py-1 gap-0.5 rounded-xl text-[10px] font-bold cursor-pointer transition-all ${
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
            className={`flex flex-col items-center justify-center min-w-[56px] py-1 gap-0.5 rounded-xl text-[10px] font-bold cursor-pointer transition-all relative ${
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
            className={`flex flex-col items-center justify-center min-w-[56px] py-1 gap-0.5 rounded-xl text-[10px] font-bold cursor-pointer transition-all ${
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
        </nav>
      </div>
    </header>
  );
};
