import React, { useState, useEffect } from 'react';
import { FlameIcon, RefreshCwIcon } from '../ui/Icons';


interface DailyRevenueItem {
  date: string;
  label: string;
  revenue: number;
  orders: number;
}

interface TopMenuItem {
  name: string;
  totalQty: number;
  revenue: number;
}

interface SpiceLevelItem {
  level: number;
  label: string;
  count: number;
}

interface AnalyticsData {
  dailyRevenue: DailyRevenueItem[];
  statusDistribution: {
    pending: number;
    paid: number;
    processing: number;
    shipped: number;
    completed: number;
    cancelled: number;
  };
  orderTypeDistribution: {
    delivery: number;
    takeaway: number;
    dine_in: number;
  };
  paymentMethodDistribution: {
    qris: number;
    cash: number;
  };
  topMenuItems: TopMenuItem[];
  spiceLevelDistribution: SpiceLevelItem[];
  gamificationStats: {
    totalSpins: number;
    totalCoinsWon: number;
    totalVouchersClaimed: number;
    activeCustomerCount: number;
  };
}

export const AdminAnalyticsCharts: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredBar, setHoveredBar] = useState<DailyRevenueItem | null>(null);

  const token = localStorage.getItem('token') || '';

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/orders/stats/analytics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading && !data) {
    return (
      <div className="bg-white border-4 border-black p-8 shadow-[6px_6px_0_0_#000] text-center">
        <RefreshCwIcon className="w-8 h-8 animate-spin mx-auto text-brand-red mb-2" />
        <span className="font-black text-xs uppercase tracking-wider">Memuat Analitik & Grafik Sistem...</span>
      </div>
    );
  }

  if (!data) return null;

  // Kalkulasi grafik harian
  const maxRevenue = Math.max(...data.dailyRevenue.map((d) => d.revenue), 100000);
  const totalWeeklyRevenue = data.dailyRevenue.reduce((acc, d) => acc + d.revenue, 0);
  const totalWeeklyOrders = data.dailyRevenue.reduce((acc, d) => acc + d.orders, 0);

  // Status pesanan total
  const totalStatusOrders = Object.values(data.statusDistribution).reduce((a, b) => a + b, 0) || 1;

  // Tipe pesanan total
  const totalTypes = Object.values(data.orderTypeDistribution).reduce((a, b) => a + b, 0) || 1;

  // Max Top Menu qty
  const maxMenuQty = Math.max(...data.topMenuItems.map((m) => m.totalQty), 1);

  // Max Spice count
  const maxSpiceCount = Math.max(...data.spiceLevelDistribution.map((s) => s.count), 1);

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border-4 border-black shadow-[4px_4px_0_0_#000]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <h2 className="text-lg font-black uppercase tracking-tight text-neutral-900">
              📊 MONITORING ANALITIK & PERFORMA SISTEM
            </h2>
          </div>
          <p className="text-xs font-bold text-neutral-600 mt-0.5">
            Visualisasi data real-time: arus pendapatan omset, status pesanan, menu terlaris, dan ekosistem koin.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="px-3 py-1.5 bg-brand-yellow hover:bg-yellow-400 border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0_0_#000] flex items-center gap-1.5 self-start sm:self-auto active:scale-95"
        >
          <RefreshCwIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Update Data</span>
        </button>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-amber-50 border-3 border-black shadow-[3px_3px_0_0_#000]">
          <span className="text-[10px] font-black uppercase text-amber-900 block">TOTAL OMSET 7 HARI</span>
          <span className="text-xl sm:text-2xl font-black text-neutral-900 block">
            Rp{totalWeeklyRevenue.toLocaleString('id-ID')}
          </span>
          <span className="text-[10px] font-bold text-neutral-500">Rata-rata: Rp{Math.round(totalWeeklyRevenue / 7).toLocaleString('id-ID')}/hari</span>
        </div>

        <div className="p-4 bg-blue-50 border-3 border-black shadow-[3px_3px_0_0_#000]">
          <span className="text-[10px] font-black uppercase text-blue-900 block">TOTAL ORDER 7 HARI</span>
          <span className="text-xl sm:text-2xl font-black text-blue-950 block">
            {totalWeeklyOrders} Pesanan
          </span>
          <span className="text-[10px] font-bold text-neutral-500">Volume transaksi berhasil</span>
        </div>

        <div className="p-4 bg-emerald-50 border-3 border-black shadow-[3px_3px_0_0_#000]">
          <span className="text-[10px] font-black uppercase text-emerald-900 block">TOTAL PUTARAN SPIN</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-950 block">
            {data.gamificationStats.totalSpins}x Putar
          </span>
          <span className="text-[10px] font-bold text-emerald-700">
            🪙 +{data.gamificationStats.totalCoinsWon.toLocaleString('id-ID')} Koin dibagikan
          </span>
        </div>

        <div className="p-4 bg-purple-50 border-3 border-black shadow-[3px_3px_0_0_#000]">
          <span className="text-[10px] font-black uppercase text-purple-900 block">VOUCHER DITUKAR</span>
          <span className="text-xl sm:text-2xl font-black text-purple-950 block">
            {data.gamificationStats.totalVouchersClaimed} Voucher
          </span>
          <span className="text-[10px] font-bold text-neutral-500">
            {data.gamificationStats.activeCustomerCount} Pelanggan Terdaftar
          </span>
        </div>
      </div>

      {/* ROW 1: GRAFIK PENDAPATAN & KOMPOSISI STATUS PESANAN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CHART 1: GRAFIK TREN OMSET 7 HARI (Left 7 Cols) */}
        <div className="lg:col-span-7 bg-white border-4 border-black p-5 shadow-[6px_6px_0_0_#000] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b-2 border-neutral-200">
              <div>
                <span className="font-black text-xs uppercase text-brand-red block">GRAFIK HISTORIS</span>
                <h3 className="font-black text-base uppercase text-neutral-900">
                  Tren Omset & Pesanan (7 Hari Terakhir)
                </h3>
              </div>
              {hoveredBar && (
                <div className="text-right text-xs bg-amber-100 border border-black px-2 py-1 shadow-[1px_1px_0_0_#000]">
                  <span className="font-black block">{hoveredBar.label}</span>
                  <span className="text-brand-red font-black">
                    Rp{hoveredBar.revenue.toLocaleString('id-ID')} ({hoveredBar.orders} ord)
                  </span>
                </div>
              )}
            </div>

            {/* Visualisasi Bar Chart SVG */}
            <div className="mt-6 pt-4 pb-2">
              <div className="h-52 flex items-end justify-between gap-2 sm:gap-3 border-b-3 border-black pb-1 relative">
                {/* Horizontal Guide lines */}
                <div className="absolute inset-x-0 top-0 border-b border-dashed border-neutral-300 pointer-events-none" />
                <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-neutral-300 pointer-events-none" />

                {data.dailyRevenue.map((d, i) => {
                  const heightPercent = Math.max(8, Math.round((d.revenue / maxRevenue) * 100));

                  return (
                    <div
                      key={i}
                      onMouseEnter={() => setHoveredBar(d)}
                      onMouseLeave={() => setHoveredBar(null)}
                      className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                    >
                      {/* Bar Value Tooltip on hover */}
                      <span className="text-[10px] font-black text-neutral-800 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap mb-1">
                        Rp{(d.revenue / 1000).toFixed(0)}k
                      </span>

                      {/* Bar Pillar */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[48px] border-2 border-black transition-all group-hover:scale-105 shadow-[2px_2px_0_0_#000] ${
                          d.revenue > 0 ? 'bg-brand-yellow group-hover:bg-brand-red' : 'bg-neutral-200'
                        }`}
                      >
                        <div className="h-full w-full flex items-center justify-center">
                          {d.orders > 0 && (
                            <span className="text-[9px] font-black text-black group-hover:text-white transform -rotate-90 sm:rotate-0">
                              {d.orders}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* X-Axis Date Labels */}
              <div className="flex justify-between gap-2 sm:gap-3 mt-2">
                {data.dailyRevenue.map((d, i) => (
                  <div key={i} className="flex-1 text-center">
                    <span className="text-[10px] font-black text-neutral-600 block uppercase">
                      {d.label.split(',')[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t-2 border-neutral-200 flex items-center justify-between text-[11px] font-bold text-neutral-600">
            <span>💡 Arahkan kursor ke tiap pilar untuk rincian tanggal</span>
            <span className="font-black text-neutral-900">Maksimum: Rp{maxRevenue.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* CHART 2: KOMPOSISI STATUS PESANAN (Right 5 Cols) */}
        <div className="lg:col-span-5 bg-white border-4 border-black p-5 shadow-[6px_6px_0_0_#000] flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b-2 border-neutral-200">
              <span className="font-black text-xs uppercase text-brand-red block">DISTRIBUSI STATUS</span>
              <h3 className="font-black text-base uppercase text-neutral-900">
                Komposisi Status Pesanan
              </h3>
            </div>

            {/* Segmented Status Progress Bar */}
            <div className="mt-4">
              <div className="h-6 w-full border-2 border-black flex overflow-hidden shadow-[2px_2px_0_0_#000]">
                {data.statusDistribution.pending > 0 && (
                  <div
                    style={{ width: `${(data.statusDistribution.pending / totalStatusOrders) * 100}%` }}
                    className="bg-amber-300 h-full border-r border-black"
                    title={`Menunggu Bayar: ${data.statusDistribution.pending}`}
                  />
                )}
                {data.statusDistribution.paid > 0 && (
                  <div
                    style={{ width: `${(data.statusDistribution.paid / totalStatusOrders) * 100}%` }}
                    className="bg-blue-400 h-full border-r border-black"
                    title={`Dibayar: ${data.statusDistribution.paid}`}
                  />
                )}
                {data.statusDistribution.processing > 0 && (
                  <div
                    style={{ width: `${(data.statusDistribution.processing / totalStatusOrders) * 100}%` }}
                    className="bg-orange-400 h-full border-r border-black"
                    title={`Diproses: ${data.statusDistribution.processing}`}
                  />
                )}
                {data.statusDistribution.shipped > 0 && (
                  <div
                    style={{ width: `${(data.statusDistribution.shipped / totalStatusOrders) * 100}%` }}
                    className="bg-purple-300 h-full border-r border-black"
                    title={`Dikirim: ${data.statusDistribution.shipped}`}
                  />
                )}
                {data.statusDistribution.completed > 0 && (
                  <div
                    style={{ width: `${(data.statusDistribution.completed / totalStatusOrders) * 100}%` }}
                    className="bg-emerald-400 h-full border-r border-black"
                    title={`Selesai: ${data.statusDistribution.completed}`}
                  />
                )}
                {data.statusDistribution.cancelled > 0 && (
                  <div
                    style={{ width: `${(data.statusDistribution.cancelled / totalStatusOrders) * 100}%` }}
                    className="bg-red-400 h-full"
                    title={`Dibatalkan: ${data.statusDistribution.cancelled}`}
                  />
                )}
              </div>
            </div>

            {/* Legend / Breakdown List */}
            <div className="mt-4 space-y-2">
              {[
                { label: 'Menunggu Pembayaran', count: data.statusDistribution.pending, color: 'bg-amber-300' },
                { label: 'Dibayar (QRIS Lunas)', count: data.statusDistribution.paid, color: 'bg-blue-400' },
                { label: 'Diproses / Dimasak', count: data.statusDistribution.processing, color: 'bg-orange-400' },
                { label: 'Dikirim / Siap Ambil', count: data.statusDistribution.shipped, color: 'bg-purple-300' },
                { label: 'Selesai (Tuntas)', count: data.statusDistribution.completed, color: 'bg-emerald-400' },
                { label: 'Dibatalkan', count: data.statusDistribution.cancelled, color: 'bg-red-400' },
              ].map((st, idx) => {
                const percent = Math.round((st.count / totalStatusOrders) * 100);
                return (
                  <div key={idx} className="flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <span className={`w-3.5 h-3.5 border border-black ${st.color}`} />
                      <span>{st.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black">{st.count}</span>
                      <span className="text-[10px] text-neutral-500 w-8 text-right font-mono">
                        ({percent}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t-2 border-neutral-200 text-right">
            <span className="text-[11px] font-black uppercase text-neutral-500">
              Total Akumulasi: {totalStatusOrders} Pesanan
            </span>
          </div>
        </div>
      </div>

      {/* ROW 2: MENU TERLARIS & HEAT METER KEPEDASAN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CHART 3: TOP 5 MENU TERLARIS (Left 7 Cols) */}
        <div className="lg:col-span-7 bg-white border-4 border-black p-5 shadow-[6px_6px_0_0_#000]">
          <div className="pb-3 border-b-2 border-neutral-200 mb-4">
            <span className="font-black text-xs uppercase text-brand-red block">BEST SELLERS</span>
            <h3 className="font-black text-base uppercase text-neutral-900">
              Top 5 Menu Paling Banyak Dipesan
            </h3>
          </div>

          <div className="space-y-3">
            {data.topMenuItems.map((item, idx) => {
              const percent = Math.round((item.totalQty / maxMenuQty) * 100);

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="flex items-center gap-1.5 font-black text-neutral-900">
                      <span className="w-5 h-5 bg-black text-white text-[10px] rounded-full flex items-center justify-center font-black">
                        {idx + 1}
                      </span>
                      <span>{item.name}</span>
                    </span>
                    <span className="text-neutral-700 font-mono">
                      {item.totalQty} Porsi (Rp{item.revenue.toLocaleString('id-ID')})
                    </span>
                  </div>

                  <div className="h-3.5 w-full bg-neutral-100 border border-black overflow-hidden">
                    <div
                      style={{ width: `${percent}%` }}
                      className="h-full bg-brand-red transition-all shadow-inner"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART 4: TINGKAT KEPEDASAN FAVORIT (Right 5 Cols) */}
        <div className="lg:col-span-5 bg-white border-4 border-black p-5 shadow-[6px_6px_0_0_#000]">
          <div className="pb-3 border-b-2 border-neutral-200 mb-4">
            <span className="font-black text-xs uppercase text-brand-red block">CHILI HEAT METER</span>
            <h3 className="font-black text-base uppercase text-neutral-900 flex items-center gap-1.5">
              <span>Level Pedas Favorit</span>
              <FlameIcon className="w-4 h-4 text-brand-red" />
            </h3>
          </div>

          <div className="space-y-2.5">
            {data.spiceLevelDistribution.map((sp) => {
              const percent = Math.round((sp.count / maxSpiceCount) * 100);
              let barColor = 'bg-yellow-400';
              if (sp.level >= 4) barColor = 'bg-brand-red';
              else if (sp.level >= 2) barColor = 'bg-orange-500';

              return (
                <div key={sp.level} className="space-y-0.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-neutral-800">{sp.label}</span>
                    <span className="font-mono font-black text-neutral-900">{sp.count} porsi</span>
                  </div>
                  <div className="h-3 w-full bg-neutral-100 border border-black">
                    <div
                      style={{ width: `${Math.max(5, percent)}%` }}
                      className={`h-full ${barColor}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-2.5 bg-amber-50 border border-black text-[11px] font-bold text-amber-950 flex items-center gap-2">
            <span>🔥</span>
            <span>Mayoritas pelanggan memilih <strong>Level 3 (Jebew)</strong> sebagai tingkat pedas paling pas!</span>
          </div>
        </div>
      </div>

      {/* ROW 3: CHANNEL PENGIRIMAN & METODE PEMBAYARAN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tipe Pesanan */}
        <div className="bg-white border-4 border-black p-5 shadow-[5px_5px_0_0_#000]">
          <h3 className="font-black text-sm uppercase mb-3 flex items-center gap-2">
            <span>🛵 CHANNEL PEMESANAN</span>
          </h3>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 bg-neutral-50 border-2 border-black">
              <span className="text-xs font-black uppercase text-neutral-500 block">DELIVERY</span>
              <span className="text-xl font-black text-neutral-900 block mt-1">
                {data.orderTypeDistribution.delivery}
              </span>
              <span className="text-[10px] font-bold text-neutral-400">
                {Math.round((data.orderTypeDistribution.delivery / totalTypes) * 100)}%
              </span>
            </div>

            <div className="p-3 bg-neutral-50 border-2 border-black">
              <span className="text-xs font-black uppercase text-neutral-500 block">TAKEAWAY</span>
              <span className="text-xl font-black text-neutral-900 block mt-1">
                {data.orderTypeDistribution.takeaway}
              </span>
              <span className="text-[10px] font-bold text-neutral-400">
                {Math.round((data.orderTypeDistribution.takeaway / totalTypes) * 100)}%
              </span>
            </div>

            <div className="p-3 bg-neutral-50 border-2 border-black">
              <span className="text-xs font-black uppercase text-neutral-500 block">DINE-IN</span>
              <span className="text-xl font-black text-neutral-900 block mt-1">
                {data.orderTypeDistribution.dine_in}
              </span>
              <span className="text-[10px] font-bold text-neutral-400">
                {Math.round((data.orderTypeDistribution.dine_in / totalTypes) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Metode Pembayaran */}
        <div className="bg-white border-4 border-black p-5 shadow-[5px_5px_0_0_#000]">
          <h3 className="font-black text-sm uppercase mb-3 flex items-center gap-2">
            <span>💳 METODE PEMBAYARAN</span>
          </h3>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-blue-50 border-2 border-black">
              <span className="text-xs font-black uppercase text-blue-900 block">QRIS (OTOMATIS)</span>
              <span className="text-xl font-black text-blue-950 block mt-1">
                {data.paymentMethodDistribution.qris} Transaksi
              </span>
              <span className="text-[10px] font-bold text-blue-700">Digital / Non-Tunai</span>
            </div>

            <div className="p-3 bg-emerald-50 border-2 border-black">
              <span className="text-xs font-black uppercase text-emerald-900 block">TUNAI (CASH)</span>
              <span className="text-xl font-black text-emerald-950 block mt-1">
                {data.paymentMethodDistribution.cash} Transaksi
              </span>
              <span className="text-[10px] font-bold text-emerald-700">Bayar di Tempat</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
