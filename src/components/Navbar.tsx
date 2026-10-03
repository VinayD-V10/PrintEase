import React from 'react';
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
  Wallet as WalletIcon,
  Sun,
  Moon,
  HardDrive,
} from 'lucide-react';
import { User, NotificationItem, ShopStatusInfo } from '../types/printease';
import { StatusBlinkDot } from './StatusBlinkDot';

export type PortalMode = 'customer' | 'shopkeeper';
export type CustomerPage = 'upload' | 'files' | 'track' | 'wallet' | 'orders';
export type ShopkeeperTab = 'queue' | 'kiosk' | 'analytics' | 'security';

interface NavbarProps {
  portal: PortalMode;
  customerPage: CustomerPage;
  shopkeeperTab: ShopkeeperTab;
  onSelectCustomerPage: (page: CustomerPage) => void;
  onSelectShopkeeperTab: (tab: ShopkeeperTab) => void;
  onOpenShopkeeperLogin: () => void;
  onExitToCustomer: () => void;
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
  const isShopOpen = shopStatus ? shopStatus.status === 'OPEN' : true;

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

              {/* Exit to Customer App button */}
              <button
                onClick={onExitToCustomer}
                className="px-3 sm:px-4 py-2 bg-[#352206] hover:bg-[#C48B28]/25 text-[#FFF5E1] rounded-xl text-xs font-bold transition-all border border-[#C48B28]/35 flex items-center gap-1.5 cursor-pointer"
                title="Switch back to Customer View"
              >
                <ArrowLeft className="w-4 h-4 text-[#C48B28]" />
                <span className="hidden sm:inline">Exit to Customer App</span>
                <span className="sm:hidden">Exit</span>
              </button>

              {/* Owner Profile / Logout */}
              {currentUser && (
                <button
                  onClick={onLogout}
                  className="p-2 text-[#FFF5E1]/70 hover:text-rose-400 hover:bg-[#C48B28]/15 rounded-xl transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Shopkeeper Mobile Navigation Bar */}
          <div className="lg:hidden flex items-center overflow-x-auto py-2 gap-1.5 border-t border-[#C48B28]/20 no-scrollbar">
            <button
              onClick={() => onSelectShopkeeperTab('queue')}
              className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 ${
                shopkeeperTab === 'queue'
                  ? 'bg-[#C48B28] text-[#FFF5E1]'
                  : 'bg-[#352206] text-[#FFF5E1]/80'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Queue</span>
            </button>

            <button
              onClick={() => onSelectShopkeeperTab('kiosk')}
              className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 ${
                shopkeeperTab === 'kiosk'
                  ? 'bg-[#C48B28] text-[#FFF5E1]'
                  : 'bg-[#352206] text-[#FFF5E1]/80'
              }`}
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>Kiosk</span>
            </button>

            <button
              onClick={() => onSelectShopkeeperTab('analytics')}
              className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 ${
                shopkeeperTab === 'analytics'
                  ? 'bg-[#C48B28] text-[#FFF5E1]'
                  : 'bg-[#352206] text-[#FFF5E1]/80'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>

            <button
              onClick={() => onSelectShopkeeperTab('security')}
              className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 ${
                shopkeeperTab === 'security'
                  ? 'bg-[#C48B28] text-[#FFF5E1]'
                  : 'bg-[#352206] text-[#FFF5E1]/80'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Shield</span>
            </button>

            <button
              onClick={onOpenPhpSpecs}
              className="px-3 py-1 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 bg-[#352206] text-[#C48B28]"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>PHP</span>
            </button>
          </div>
        </div>
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

            {/* Customer Auth / Account */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-[#C48B28]/30">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-bold text-[#FFF5E1] leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] font-semibold text-[#FFF5E1]/70 uppercase tracking-wider">
                    {currentUser.role}
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 text-[#FFF5E1]/70 hover:text-rose-400 hover:bg-[#C48B28]/15 rounded-xl transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="btn-smooth btn-dual-shimmer px-3.5 py-2 rounded-xl text-[#FFF5E1] text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5 text-[#FFF5E1]" />
                <span>Sign In</span>
              </button>
            )}

            {/* Discreet Shopkeeper Access for Staff / Owner */}
            <button
              onClick={onOpenShopkeeperLogin}
              className="btn-smooth px-2.5 sm:px-3 py-1.5 bg-[#C48B28]/20 hover:bg-[#C48B28]/35 text-[#FFF5E1] rounded-xl text-[11px] font-bold border border-[#C48B28]/40 flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Shopkeeper / Owner Portal Login"
            >
              <Store className="w-3.5 h-3.5 text-[#C48B28]" />
              <span className="hidden sm:inline">Shopkeeper Desk</span>
              <span className="sm:hidden">Shop</span>
            </button>
          </div>
        </div>

        {/* Customer Mobile Navigation Bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-[#C48B28]/20 bg-[#352206]/80 overflow-x-auto no-scrollbar gap-1 rounded-b-xl">
          <button
            onClick={() => onSelectCustomerPage('upload')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer shrink-0 transition-all ${
              customerPage === 'upload' ? 'bg-[#C48B28] text-[#FFF5E1]' : 'text-[#FFF5E1]/80'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>

          <button
            onClick={() => onSelectCustomerPage('files')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer shrink-0 transition-all ${
              customerPage === 'files' ? 'bg-[#C48B28] text-[#FFF5E1]' : 'text-[#FFF5E1]/80'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Files</span>
          </button>

          <button
            onClick={() => onSelectCustomerPage('track')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer shrink-0 transition-all ${
              customerPage === 'track' ? 'bg-[#C48B28] text-[#FFF5E1]' : 'text-[#FFF5E1]/80'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Track</span>
          </button>

          <button
            onClick={() => onSelectCustomerPage('wallet')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer shrink-0 transition-all ${
              customerPage === 'wallet' ? 'bg-[#C48B28] text-[#FFF5E1]' : 'text-[#FFF5E1]/80'
            }`}
          >
            <WalletIcon className="w-3.5 h-3.5" />
            <span>Wallet</span>
          </button>

          <button
            onClick={() => onSelectCustomerPage('orders')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer shrink-0 transition-all ${
              customerPage === 'orders' ? 'bg-[#C48B28] text-[#FFF5E1]' : 'text-[#FFF5E1]/80'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Orders</span>
          </button>
        </div>
      </div>
    </header>
  );
};
