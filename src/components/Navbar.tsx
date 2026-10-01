import React, { useState } from 'react';
import { useAuthAndTenant, ProfileMode } from '../context/AuthAndTenantContext';
import {
  Bell,
  LogOut,
  ChevronDown,
  BookOpen,
  CheckCircle2,
  ShieldCheck,
  Store,
  AlertTriangle
} from 'lucide-react';
import { NotificationItem } from '../types';

interface NavbarProps {
  notifications: NotificationItem[];
  onOpenAppGuide: () => void;
  onOpenCrossTenantTest: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  notifications,
  onOpenAppGuide,
  onOpenCrossTenantTest,
  activeTab,
  setActiveTab
}) => {
  const {
    currentUser,
    currentTenant,
    profileMode,
    switchProfileMode,
    logout
  } = useAuthAndTenant();

  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const isDemo = profileMode !== 'google';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs font-sans">
      {/* Demo Mode Notice Bar if in Demo Mode */}
      {isDemo && (
        <div className="bg-amber-500 text-slate-900 text-[11px] font-bold py-1.5 px-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Mode Uji Coba (Demo): Data ini hanya simulasi, bukan pembukuan toko asli Anda.</span>
          </div>
          <button
            onClick={() => switchProfileMode('google')}
            className="underline font-black cursor-pointer hover:text-white"
          >
            Kembali ke Akun Asli
          </button>
        </div>
      )}

      <div className="max-w-md sm:max-w-xl md:max-w-4xl lg:max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand & Active Store Name */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-xs border border-slate-200 bg-white p-0.5 flex items-center justify-center">
            <img
              src="https://lh3.googleusercontent.com/d/1hegjwSy60MA1CEMmyFtftAXXMtXfkxt2"
              alt="KreditKu"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-base font-black tracking-tight text-slate-900">KreditKu</span>
              {isDemo && (
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 uppercase">
                  DEMO
                </span>
              )}
            </div>
            <p className="text-[11px] font-bold text-teal-700 truncate max-w-[150px] sm:max-w-xs mt-0.5">
              {currentTenant?.businessName || 'Buku Kredit Digital'}
            </p>
          </div>
        </div>

        {/* Right Actions: Guide, Notifications & Menu */}
        <div className="flex items-center gap-1.5">
          {/* Quick Guide Button */}
          <button
            onClick={onOpenAppGuide}
            className="p-2 rounded-xl text-teal-700 hover:bg-teal-50 active:bg-teal-100 transition cursor-pointer"
            title="Buku Panduan Penggunaan"
          >
            <BookOpen className="w-5 h-5" />
          </button>

          {/* Notification Button */}
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 active:bg-slate-100 transition cursor-pointer"
            title="Notifikasi"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Menu & Profile Button */}
          <div className="relative">
            <button
              onClick={() => setShowMenuDropdown(!showMenuDropdown)}
              className="flex items-center gap-1 p-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 active:scale-95 transition cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-teal-600 text-white font-bold flex items-center justify-center text-xs">
                {(currentTenant?.ownerName || currentUser?.displayName || 'U').slice(0, 1).toUpperCase()}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showMenuDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <div className="font-bold text-xs text-slate-900 truncate">
                    {currentTenant?.businessName}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Pemilik: {currentTenant?.ownerName}
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => { onOpenAppGuide(); setShowMenuDropdown(false); }}
                    className="w-full text-left px-3.5 py-2 text-xs text-teal-700 font-bold hover:bg-teal-50 flex items-center gap-2"
                  >
                    <BookOpen className="w-4 h-4 text-teal-600" />
                    <span>Panduan Penggunaan Aplikasi</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab('settings'); setShowMenuDropdown(false); }}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Store className="w-4 h-4 text-slate-400" />
                    <span>Pengaturan Profil Toko</span>
                  </button>

                  <button
                    onClick={() => { onOpenCrossTenantTest(); setShowMenuDropdown(false); }}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                    <span>Uji Isolasi Data (A vs B vs C)</span>
                  </button>
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={() => { logout(); setShowMenuDropdown(false); }}
                    className="w-full text-left px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-semibold"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>Keluar (Logout)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notification Popup Dropdown */}
      {showNotifDropdown && (
        <div className="fixed inset-x-4 top-16 sm:absolute sm:right-4 sm:left-auto sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in duration-100">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
            <span className="text-xs font-bold text-slate-800">Notifikasi Tagihan</span>
            <button
              onClick={() => setShowNotifDropdown(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Tutup
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              Tidak ada tagihan tertunda hari ini.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {notifications.map(n => (
                <div key={n.id} className="p-2.5 rounded-xl bg-slate-50 text-xs">
                  <div className="font-semibold text-slate-800">{n.title}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">{n.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  );
};
