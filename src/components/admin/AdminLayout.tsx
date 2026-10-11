import React, { useState, useEffect, useRef } from 'react';
import { AdminUser } from '../../types';
import {
  LayoutDashboardIcon,
  ShoppingBagIcon,
  GiftIcon,
  UtensilsIcon,
  WineIcon,
  TagIcon,
  DollarSignIcon,
  PackageIcon,
  SlidersIcon,
  GlobeIcon,
  InstagramIcon,
  PhoneIcon,
  CameraIcon,
  UsersIcon,
  ActivityIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
  ExternalLinkIcon,
  FlameIcon,
  BellIcon,
  RefreshCwIcon,
  ShieldCheck,
} from '../ui/Icons';

export type AdminTab =
  | 'overview'
  | 'reconciliation'
  | 'inventory'
  | 'customers'
  | 'deployment'
  | 'tasks'
  | 'reports'
  | 'health'
  | 'backups'
  | 'fraud'
  | 'maintenance'
  | 'orders'
  | 'rewards'
  | 'menu'
  | 'bottles'
  | 'prices'
  | 'promotions'
  | 'bundles'
  | 'custom_order'
  | 'content'
  | 'socials'
  | 'contact'
  | 'media'
  | 'users'
  | 'logs';

interface AdminNotificationItem {
  id: string;
  type: 'order' | 'stock' | 'redeem' | 'voucher_used';
  title: string;
  message: string;
  timestamp: string;
  targetTab: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
}

interface AdminLayoutProps {
  user: AdminUser;
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  user,
  activeTab,
  onTabChange,
  onLogout,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [maintenanceState, setMaintenanceState] = useState<{
    isEnabled: boolean;
    mode: 'full' | 'read_only';
  }>({ isEnabled: false, mode: 'full' });
  const notifRef = useRef<HTMLDivElement>(null);

  const token = localStorage.getItem('token') || '';

  const fetchMaintenanceState = async () => {
    try {
      const res = await fetch('/api/public/maintenance-status');
      if (res.ok) {
        const data = await res.json();
        setMaintenanceState({ isEnabled: Boolean(data.isEnabled), mode: data.mode || 'full' });
      }
    } catch {}
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboardIcon },
    { id: 'orders', label: 'Manajemen Pesanan', icon: ShoppingBagIcon, badge: 'AUTO' },
    { id: 'reconciliation', label: 'Rekonsiliasi Transaksi', icon: ShieldCheck, badge: 'AUDIT' },
    { id: 'inventory', label: 'Inventaris & Stok', icon: PackageIcon, badge: 'SMART' },
    { id: 'customers', label: 'Pelanggan & Koin', icon: UsersIcon, badge: 'WA' },
    { id: 'rewards', label: 'Pusat Voucher & Koin', icon: GiftIcon },
    { id: 'health', label: 'Health Monitor', icon: ActivityIcon, badge: 'UPTIME' },
    { id: 'backups', label: 'Backup & Restore', icon: PackageIcon, badge: 'AUTO' },
    { id: 'fraud', label: 'Anti-Fraud & Anomali', icon: ShieldCheck, badge: 'SHIELD' },
    { id: 'deployment', label: 'Deployment & Rollback', icon: RefreshCwIcon, badge: 'SAFE' },
    { id: 'tasks', label: 'Scheduled Tasks', icon: ActivityIcon, badge: 'CRON' },
    { id: 'reports', label: 'Ekspor Laporan (CSV)', icon: DollarSignIcon, badge: 'CSV' },
    {
      id: 'maintenance',
      label: 'Emergency Mode',
      icon: FlameIcon,
      badge: maintenanceState.isEnabled ? 'MAINT' : undefined,
    },
    { id: 'menu', label: 'Our Menu', icon: UtensilsIcon },
    { id: 'bottles', label: 'Bottles & Sambal', icon: WineIcon },
    { id: 'prices', label: 'Price Management', icon: DollarSignIcon },
    { id: 'promotions', label: 'Promotions & Promo', icon: TagIcon },
    { id: 'bundles', label: 'Bundles & Paket', icon: PackageIcon },
    { id: 'custom_order', label: 'Custom Orders', icon: SlidersIcon },
    { id: 'content', label: 'Website Content', icon: GlobeIcon },
    { id: 'socials', label: 'Social Media', icon: InstagramIcon },
    { id: 'contact', label: 'Contact & Location', icon: PhoneIcon },
    { id: 'media', label: 'Media Library', icon: CameraIcon },
    { id: 'users', label: 'Admin Users', icon: UsersIcon },
    { id: 'logs', label: 'Activity Logs', icon: ActivityIcon },
  ];

  const fetchNotifications = async () => {
    try {
      if (!token) return;
      setLoadingNotifs(true);
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      // silent polling error
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchMaintenanceState();
    const interval = setInterval(() => {
      fetchNotifications();
      fetchMaintenanceState();
    }, 15000); // Polling otomatis setiap 15 detik
    return () => clearInterval(interval);
  }, [token]);

  // Close notification dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTab = (tabId: string) => {
    onTabChange(tabId as AdminTab);
    setMobileMenuOpen(false);
  };

  const handleNotificationClick = (notif: AdminNotificationItem) => {
    if (notif.targetTab) {
      onTabChange(notif.targetTab as AdminTab);
    }
    setNotifDropdownOpen(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col font-sans text-neutral-900">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white border-b-4 border-black px-4 sm:px-6 py-3 flex items-center justify-between shadow-[0_4px_0_0_#000]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 bg-brand-yellow border-2 border-black active:scale-95"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>

          <a href="/admin" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-brand-red border-2 border-black flex items-center justify-center text-white shadow-[2px_2px_0_0_#000]">
              <FlameIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-lg uppercase tracking-tight block leading-tight">
                MIE JEBEW
              </span>
              <span className="text-[10px] font-black uppercase text-brand-red tracking-wider block">
                ADMIN CMS PANEL
              </span>
            </div>
          </a>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Live Website Status Badge (Online / Maintenance) */}
          <button
            onClick={() => onTabChange('maintenance')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 border-2 border-black font-black uppercase text-[11px] sm:text-xs shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-colors ${
              maintenanceState.isEnabled
                ? 'bg-brand-red text-white animate-pulse'
                : 'bg-emerald-400 text-black hover:bg-emerald-300'
            }`}
            title="Status Sistem: Klik untuk kelola Emergency Maintenance Mode"
          >
            <span className={`w-2 h-2 rounded-full ${maintenanceState.isEnabled ? 'bg-white' : 'bg-black'}`} />
            <span>
              {maintenanceState.isEnabled
                ? `🚨 MAINT (${maintenanceState.mode === 'read_only' ? 'READ-ONLY' : 'FULL'})`
                : '🟢 ONLINE'}
            </span>
          </button>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 border-2 border-black font-black uppercase text-xs transition-colors"
          >
            <span>Buka Web</span>
            <ExternalLinkIcon className="w-3.5 h-3.5" />
          </a>

          {/* NOTIFIKASI OTOMATIS (BELL DROPDOWN) */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              className="relative p-2 bg-white hover:bg-amber-100 border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5"
              title="Notifikasi Otomatis"
              aria-label="Notifikasi Otomatis"
            >
              <BellIcon className="w-5 h-5 text-neutral-900" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-brand-red text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-black animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown Notifikasi */}
            {notifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border-4 border-black shadow-[6px_6px_0_0_#000] z-50 animate-fade-in">
                <div className="p-3 bg-neutral-900 text-white flex items-center justify-between border-b-2 border-black">
                  <div className="flex items-center gap-2">
                    <BellIcon className="w-4 h-4 text-brand-yellow" />
                    <span className="text-xs font-black uppercase tracking-wider">
                      NOTIFIKASI LIVE ({unreadCount})
                    </span>
                  </div>
                  <button
                    onClick={fetchNotifications}
                    className="p-1 hover:text-brand-yellow text-neutral-300"
                    title="Refresh Notifikasi"
                  >
                    <RefreshCwIcon className={`w-3.5 h-3.5 ${loadingNotifs ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y-2 divide-neutral-200">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs font-bold text-neutral-500">
                      Tidak ada notifikasi baru saat ini.
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      let badgeColor = 'bg-blue-100 text-blue-900 border-blue-400';
                      if (notif.severity === 'critical') badgeColor = 'bg-red-100 text-red-900 border-brand-red';
                      if (notif.severity === 'warning') badgeColor = 'bg-amber-100 text-amber-900 border-amber-400';
                      if (notif.severity === 'success') badgeColor = 'bg-emerald-100 text-emerald-900 border-emerald-400';

                      return (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className="p-3 hover:bg-amber-50 cursor-pointer transition-colors text-xs"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="font-black text-neutral-900 leading-tight">
                              {notif.title}
                            </span>
                            <span className="text-[10px] text-neutral-500 whitespace-nowrap font-mono">
                              {new Date(notif.timestamp).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-neutral-700 font-medium text-[11px] leading-relaxed">
                            {notif.message}
                          </p>
                          <div className="mt-1.5 flex items-center justify-between">
                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 border ${badgeColor}`}>
                              {notif.type.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] font-black text-brand-red hover:underline">
                              Buka {notif.targetTab.toUpperCase()} &rarr;
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-2 bg-neutral-100 border-t-2 border-black text-center">
                  <button
                    onClick={() => {
                      onTabChange('orders');
                      setNotifDropdownOpen(false);
                    }}
                    className="text-xs font-black uppercase text-brand-red hover:underline"
                  >
                    Buka Manajemen Pesanan &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l-2 border-neutral-300">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-black text-neutral-900 block leading-tight">
                {user.name}
              </span>
              <span
                className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${
                  user.role === 'SUPER_ADMIN'
                    ? 'bg-brand-red text-white border-brand-red'
                    : 'bg-brand-yellow text-black border-black'
                }`}
              >
                {user.role}
              </span>
            </div>

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-red hover:bg-red-700 text-white border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5"
              title="Keluar dari Panel Admin"
            >
              <LogOutIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>


      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-white border-r-4 border-black p-4 space-y-1 overflow-y-auto">
          <div className="pb-3 mb-2 border-b-2 border-neutral-200">
            <span className="text-[11px] font-black uppercase tracking-wider text-neutral-400">
              Menu Manajemen
            </span>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 font-black uppercase text-xs border-2 transition-all ${
                    isActive
                      ? 'bg-brand-yellow border-black shadow-[3px_3px_0_0_#000] text-black translate-x-1'
                      : 'border-transparent text-neutral-700 hover:bg-neutral-100 hover:border-black'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${isActive ? 'text-black' : 'text-neutral-500'}`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Drawer Navigation */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden bg-black/60 flex">
            <div className="w-72 bg-white h-full border-r-4 border-black p-5 flex flex-col justify-between overflow-y-auto shadow-[4px_0_0_0_#000]">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b-2 border-black">
                  <div className="flex items-center gap-2">
                    <FlameIcon className="w-5 h-5 text-brand-red" />
                    <span className="font-black text-sm uppercase">Menu Navigasi CMS</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 border-2 border-black bg-neutral-100 hover:bg-neutral-200"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 bg-neutral-100 border-2 border-black">
                  <span className="text-xs font-black block">{user.name}</span>
                  <span className="text-[10px] font-bold text-neutral-500 uppercase">
                    Role: {user.role}
                  </span>
                </div>

                <nav className="space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectTab(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 font-black uppercase text-xs border-2 transition-all ${
                          isActive
                            ? 'bg-brand-yellow border-black shadow-[3px_3px_0_0_#000] text-black'
                            : 'border-transparent text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t-2 border-black space-y-2">
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2 bg-neutral-100 border-2 border-black text-xs font-black uppercase"
                >
                  <span>Buka Web Publik</span>
                  <ExternalLinkIcon className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-brand-red text-white border-2 border-black text-xs font-black uppercase shadow-[2px_2px_0_0_#000]"
                >
                  <LogOutIcon className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
            <div
              className="flex-1"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close Backdrop"
            />
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
