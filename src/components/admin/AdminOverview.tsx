import React, { useEffect, useState } from 'react';
import { apiGetDashboardStats, apiGetLogs } from '../../services/api';
import { ActivityLogItem, AdminUser } from '../../types';
import { Flame, Sparkles, Clock } from '../ui/Icons';
import { AdminAnalyticsCharts } from './AdminAnalyticsCharts';

interface AdminOverviewProps {

  user: AdminUser;
  onNavigateTab: (tab: string) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ user, onNavigateTab }) => {
  const [stats, setStats] = useState({
    activeMenuItems: 0,
    activeBottles: 0,
    activePromos: 0,
    activeBundles: 0,
    totalMedia: 0,
    activeAdmins: 0,
  });
  const [recentLogs, setRecentLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const [statsRes, logsRes] = await Promise.all([
          apiGetDashboardStats(),
          apiGetLogs({ limit: 8 }),
        ]);
        if (statsRes.stats) setStats(statsRes.stats);
        if (logsRes.logs) setRecentLogs(logsRes.logs);
      } catch (e) {
        console.error('Failed to load overview data:', e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const statCards = [
    { label: 'Pesanan Masuk', count: 'Live', tab: 'orders', icon: '🛍️', color: 'bg-amber-300' },
    { label: 'Voucher & Koin', count: '🎡', tab: 'rewards', icon: '🪙', color: 'bg-emerald-200' },
    { label: 'Menu Aktif', count: stats.activeMenuItems, tab: 'menu', icon: '🍜', color: 'bg-amber-100' },
    { label: 'Botol & Produk', count: stats.activeBottles, tab: 'bottles', icon: '🍶', color: 'bg-red-100' },
    { label: 'Promo Berjalan', count: stats.activePromos, tab: 'promotions', icon: '🎟️', color: 'bg-yellow-100' },
    { label: 'Paket Bundle', count: stats.activeBundles, tab: 'bundles', icon: '📦', color: 'bg-emerald-100' },
    { label: 'File Media', count: stats.totalMedia, tab: 'media', icon: '🖼️', color: 'bg-purple-100' },
    { label: 'Admin Aktif', count: stats.activeAdmins, tab: 'users', icon: '👥', color: 'bg-blue-100' },
  ];

  return (
    <div className="space-y-8">
      
      {/* Welcome Banner */}
      <div className="relative bg-white border-3 border-black rounded-3xl p-6 sm:p-8 shadow-brutal flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👋</span>
            <h2 className="text-2xl sm:text-3xl font-black text-black">
              Halo, {user.name}!
            </h2>
            <span className="bg-jebew-yellow border border-black text-black font-black text-[10px] px-2 py-0.5 rounded-full uppercase">
              {user.role}
            </span>
          </div>
          <p className="text-xs sm:text-sm font-bold text-gray-600">
            Kelola pesanan otomatis, pantau stok & voucher koin, update harga, dan kelola konten website langsung dari panel ini.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigateTab('orders')}
            className="bg-brand-yellow hover:bg-yellow-400 text-black font-black text-xs sm:text-sm px-5 py-3 border-2 border-black rounded-xl shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <span>🛍️ Kelola Pesanan</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('prices')}
            className="bg-jebew-red hover:bg-red-700 text-white font-black text-xs sm:text-sm px-5 py-3 border-2 border-black rounded-xl shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <Flame className="w-4 h-4 fill-white" />
            <span>Update Harga</span>
          </button>
        </div>
      </div>


      {/* Stats Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onNavigateTab(card.tab)}
            className="bg-white hover:bg-cream-50 border-3 border-black rounded-2xl p-4 shadow-brutal hover:shadow-brutal-md transition-all text-left flex flex-col justify-between cursor-pointer space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className={`w-10 h-10 rounded-xl ${card.color} border-2 border-black flex items-center justify-center text-xl`}>
                {card.icon}
              </span>
              <span className="text-2xl font-black text-black">
                {loading ? '...' : card.count}
              </span>
            </div>
            <div>
              <div className="text-xs font-black text-black">{card.label}</div>
              <div className="text-[10px] font-bold text-gray-500">Klik untuk kelola →</div>
            </div>
          </button>
        ))}
      </div>

      {/* Real-time System Monitoring Charts */}
      <AdminAnalyticsCharts />

      {/* Two Columns: Quick Actions & Recent Audit Activity Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        
        {/* Quick Management Shortcuts */}
        <div className="lg:col-span-5 bg-white border-3 border-black rounded-3xl p-6 shadow-brutal space-y-4">
          <div className="flex items-center gap-2 border-b-2 border-dashed border-gray-200 pb-3">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-black text-lg text-black">Aksi Cepat Manajemen</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => onNavigateTab('menu')}
              className="p-3 bg-cream-50 hover:bg-jebew-yellow border-2 border-black rounded-xl font-black text-xs text-left transition-all shadow-brutal-sm cursor-pointer flex items-center gap-2"
            >
              <span>🍜</span>
              <span>Tambah Menu Baru</span>
            </button>
            <button
              onClick={() => onNavigateTab('bottles')}
              className="p-3 bg-cream-50 hover:bg-jebew-yellow border-2 border-black rounded-xl font-black text-xs text-left transition-all shadow-brutal-sm cursor-pointer flex items-center gap-2"
            >
              <span>🍶</span>
              <span>Kelola Botol Sambal</span>
            </button>
            <button
              onClick={() => onNavigateTab('promotions')}
              className="p-3 bg-cream-50 hover:bg-jebew-yellow border-2 border-black rounded-xl font-black text-xs text-left transition-all shadow-brutal-sm cursor-pointer flex items-center gap-2"
            >
              <span>🎟️</span>
              <span>Buat Kode Promo</span>
            </button>
            <button
              onClick={() => onNavigateTab('content')}
              className="p-3 bg-cream-50 hover:bg-jebew-yellow border-2 border-black rounded-xl font-black text-xs text-left transition-all shadow-brutal-sm cursor-pointer flex items-center gap-2"
            >
              <span>🌐</span>
              <span>Ubah Konten Banner</span>
            </button>
            <button
              onClick={() => onNavigateTab('contact')}
              className="p-3 bg-cream-50 hover:bg-jebew-yellow border-2 border-black rounded-xl font-black text-xs text-left transition-all shadow-brutal-sm cursor-pointer flex items-center gap-2"
            >
              <span>📍</span>
              <span>Ubah Kontak & Jam</span>
            </button>
            <button
              onClick={() => onNavigateTab('media')}
              className="p-3 bg-cream-50 hover:bg-jebew-yellow border-2 border-black rounded-xl font-black text-xs text-left transition-all shadow-brutal-sm cursor-pointer flex items-center gap-2"
            >
              <span>🖼️</span>
              <span>Upload Gambar Baru</span>
            </button>
          </div>
        </div>

        {/* Recent Activity Audit Log */}
        <div className="lg:col-span-7 bg-white border-3 border-black rounded-3xl p-6 shadow-brutal space-y-4">
          <div className="flex items-center justify-between border-b-2 border-dashed border-gray-200 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-700" />
              <h3 className="font-black text-lg text-black">Aktivitas Terkini (Audit Log)</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('logs')}
              className="text-xs font-black text-jebew-red hover:underline cursor-pointer"
            >
              Lihat Semua →
            </button>
          </div>

          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {recentLogs.length === 0 ? (
              <div className="text-center py-8 text-xs font-bold text-gray-500">
                Belum ada aktivitas tercatat.
              </div>
            ) : (
              recentLogs.map((log) => {
                const actionBadge =
                  log.action === 'CREATE'
                    ? 'bg-emerald-100 text-emerald-800'
                    : log.action === 'UPDATE'
                    ? 'bg-blue-100 text-blue-800'
                    : log.action === 'DELETE'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800';

                return (
                  <div
                    key={log.id}
                    className="p-2.5 bg-cream-50 border border-black rounded-xl flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${actionBadge}`}>
                          {log.action}
                        </span>
                        <span className="font-black text-black">{log.admin_username}</span>
                        <span className="text-[10px] text-gray-500 font-bold">({log.entity})</span>
                      </div>
                      <p className="text-gray-700 font-medium text-xs">
                        {log.details}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
