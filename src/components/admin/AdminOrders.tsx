import React, { useState, useEffect } from 'react';
import {
  ShoppingBagIcon,
  SearchIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  ClockIcon,
  AlertCircleIcon,
  Trash2Icon,
  PrinterIcon,
  PhoneIcon,
  MapPinIcon,
  FlameIcon,
  TagIcon,
  XIcon,
} from '../ui/Icons';

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'completed' | 'cancelled';

interface OrderItem {
  id: number;
  menu_item_id: string;
  item_name: string;
  quantity: number;
  spice_level: number;
  toppings_summary: string;
  unit_price: number;
  subtotal_item: number;
  notes?: string;
}

interface OrderRecord {
  id: string;
  customer_name: string;
  customer_phone: string;
  order_type: 'delivery' | 'takeaway' | 'dine_in';
  table_number?: string;
  address?: string;
  payment_method: 'qris' | 'cash';
  payment_status: 'pending' | 'paid' | 'verified' | 'cancelled';
  subtotal: number;
  discount_amount: number;
  voucher_code?: string;
  total_amount: number;
  additional_notes?: string;
  order_status: OrderStatus;
  created_at: string;
  updated_at: string;
  total_items_count?: number;
}

interface OrderStats {
  total_orders: number;
  pending_count: number;
  paid_count: number;
  processing_count: number;
  shipped_count: number;
  completed_count: number;
  cancelled_count: number;
  total_revenue: number;
}

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [printModalOrder, setPrintModalOrder] = useState<{ order: OrderRecord; items: OrderItem[] } | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const token = localStorage.getItem('token') || '';

  const statusConfigs: Record<
    OrderStatus,
    { label: string; badgeBg: string; textColor: string; icon: any; step: number }
  > = {
    pending: {
      label: 'Menunggu Pembayaran',
      badgeBg: 'bg-amber-300',
      textColor: 'text-amber-950',
      icon: ClockIcon,
      step: 1,
    },
    paid: {
      label: 'Dibayar',
      badgeBg: 'bg-blue-400',
      textColor: 'text-blue-950',
      icon: CheckCircleIcon,
      step: 2,
    },
    processing: {
      label: 'Diproses / Dimasak',
      badgeBg: 'bg-orange-400',
      textColor: 'text-orange-950',
      icon: FlameIcon,
      step: 3,
    },
    shipped: {
      label: 'Dikirim / Siap Ambil',
      badgeBg: 'bg-purple-300',
      textColor: 'text-purple-950',
      icon: ShoppingBagIcon,
      step: 4,
    },
    completed: {
      label: 'Selesai',
      badgeBg: 'bg-emerald-400',
      textColor: 'text-emerald-950',
      icon: CheckCircleIcon,
      step: 5,
    },
    cancelled: {
      label: 'Dibatalkan',
      badgeBg: 'bg-red-400',
      textColor: 'text-red-950',
      icon: AlertCircleIcon,
      step: 0,
    },
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/orders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/orders/stats/summary', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error('Failed to fetch order stats:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchStats();
    const interval = setInterval(() => {
      fetchOrders();
      fetchStats();
    }, 20000); // Polling setiap 20 detik
    return () => clearInterval(interval);
  }, [selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const viewOrderDetails = async (order: OrderRecord) => {
    setSelectedOrder(order);
    try {
      setLoadingDetails(true);
      const res = await fetch(`/api/orders/${order.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrderItems(data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch order items:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus, newPayment?: string) => {
    try {
      setStatusUpdating(orderId);
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderStatus: newStatus,
          paymentStatus: newPayment || (newStatus === 'paid' ? 'paid' : undefined),
        }),
      });

      if (res.ok) {
        setFeedbackMsg({
          text: `Status pesanan #${orderId} berhasil diubah ke: ${statusConfigs[newStatus].label}`,
          type: 'success',
        });
        fetchOrders();
        fetchStats();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, order_status: newStatus });
        }
      } else {
        const data = await res.json();
        setFeedbackMsg({ text: data.error || 'Gagal mengubah status', type: 'error' });
      }
    } catch (err) {
      setFeedbackMsg({ text: 'Terjadi kesalahan server.', type: 'error' });
    } finally {
      setStatusUpdating(null);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!window.confirm(`Yakin ingin menghapus pesanan #${orderId}? Tindakan ini akan dicatat di Audit Log.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setFeedbackMsg({ text: `Pesanan #${orderId} berhasil dihapus.`, type: 'success' });
        if (selectedOrder?.id === orderId) setSelectedOrder(null);
        fetchOrders();
        fetchStats();
      } else {
        const data = await res.json();
        setFeedbackMsg({ text: data.error || 'Gagal menghapus pesanan.', type: 'error' });
      }
    } catch (err) {
      setFeedbackMsg({ text: 'Terjadi kesalahan sistem.', type: 'error' });
    } finally {
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const getWhatsAppMessage = (order: OrderRecord): string => {
    const cleanPhone = order.customer_phone.replace(/^0/, '62').replace(/\D/g, '');
    let statusMsg = '';

    switch (order.order_status) {
      case 'pending':
        statusMsg = `Halo Kak ${order.customer_name}! Terima kasih sudah memesan di Mie Jebew! Pesanan Kakak (#${order.id}) sebesar Rp${Number(order.total_amount).toLocaleString('id-ID')} sedang MENUNGGU PEMBAYARAN. Silakan selesaikan pembayaran agar pesanan segera kami masak ya! 🔥🍜`;
        break;
      case 'paid':
        statusMsg = `Halo Kak ${order.customer_name}! Pembayaran untuk pesanan #${order.id} sebesar Rp${Number(order.total_amount).toLocaleString('id-ID')} telah KAMI TERIMA dengan sukses! Pesanan Kakak segera masuk antrean dapur. Terima kasih! ✨`;
        break;
      case 'processing':
        statusMsg = `Halo Kak ${order.customer_name}! Pesanan Mie Jebew #${order.id} SEDANG DIPROSES & DIMASAK dengan bumbu cabai rawit spesial kami! Estimasi siap sebentar lagi. Harap bersiap merasakan pedas gurihnya! 🌶️🍜`;
        break;
      case 'shipped':
        statusMsg = `Halo Kak ${order.customer_name}! Kabar gembira, pesanan Mie Jebew #${order.id} SUDAH SELESAI DIMASAK dan sedang ${order.order_type === 'delivery' ? 'dalam perjalanan diantar kurir ke alamat Kakak' : 'siap diambil di kasir'}! 🛵✨`;
        break;
      case 'completed':
        statusMsg = `Terima kasih banyak Kak ${order.customer_name}! Pesanan #${order.id} telah SELESAI. Selamat menikmati Mie Jebew! Jangan lupa follow IG kami & putar spin wheel setiap hari untuk koin gratis ya! 🍜❤️`;
        break;
      case 'cancelled':
        statusMsg = `Halo Kak ${order.customer_name}, pesanan Mie Jebew #${order.id} telah DIBATALKAN. Jika ada pertanyaan atau kendala, silakan hubungi tim kami kembali. Terima kasih! 🙏`;
        break;
      default:
        statusMsg = `Halo Kak ${order.customer_name}, update untuk pesanan Mie Jebew #${order.id}.`;
    }

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(statusMsg)}`;
  };

  const openPrintModal = async (order: OrderRecord) => {
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPrintModalOrder({ order, items: data.items || [] });
      } else {
        setPrintModalOrder({ order, items: [] });
      }
    } catch {
      setPrintModalOrder({ order, items: [] });
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Notifikasi Feedback */}
      {feedbackMsg && (
        <div
          className={`p-4 border-4 border-black font-black uppercase text-sm shadow-[4px_4px_0_0_#000] flex items-center justify-between animate-fade-in ${
            feedbackMsg.type === 'success' ? 'bg-emerald-400 text-black' : 'bg-brand-red text-white'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="p-1 hover:opacity-80">
            <XIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 sm:p-6 border-4 border-black shadow-[6px_6px_0_0_#000]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-brand-yellow border-2 border-black flex items-center justify-center font-black">
              <ShoppingBagIcon className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900">
              MANAJEMEN PEMESANAN (ORDERS)
            </h1>
          </div>
          <p className="text-xs sm:text-sm font-bold text-neutral-600">
            Sistem otomatis pesanan masuk dari website, live sync ke phpMyAdmin & MySQL, update status 1-klik, dan chat WhatsApp otomatis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchOrders();
              fetchStats();
            }}
            disabled={loading}
            className="px-4 py-2 bg-brand-yellow hover:bg-yellow-400 border-3 border-black font-black uppercase text-xs shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-2"
          >
            <RefreshCwIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Pesanan</span>
          </button>
        </div>
      </div>

      {/* KPI Cards / Ringkasan Status */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => setSelectedStatus('all')}
          className={`p-3 bg-white border-3 border-black shadow-[3px_3px_0_0_#000] cursor-pointer transition-transform hover:-translate-y-0.5 ${
            selectedStatus === 'all' ? 'ring-3 ring-black bg-neutral-100' : ''
          }`}
        >
          <span className="text-[10px] font-black uppercase text-neutral-500 block">TOTAL ORDER</span>
          <span className="text-2xl font-black block">{stats?.total_orders || 0}</span>
          <span className="text-[10px] font-bold text-emerald-700">
            Rp{Number(stats?.total_revenue || 0).toLocaleString('id-ID')}
          </span>
        </div>

        <div
          onClick={() => setSelectedStatus('pending')}
          className={`p-3 bg-amber-50 border-3 border-black shadow-[3px_3px_0_0_#000] cursor-pointer transition-transform hover:-translate-y-0.5 ${
            selectedStatus === 'pending' ? 'ring-3 ring-black bg-amber-200' : ''
          }`}
        >
          <span className="text-[10px] font-black uppercase text-amber-800 block">⏳ MENUNGGU BAYAR</span>
          <span className="text-2xl font-black text-amber-950 block">{stats?.pending_count || 0}</span>
          <span className="text-[9px] font-bold text-neutral-500">Belum dibayar</span>
        </div>

        <div
          onClick={() => setSelectedStatus('paid')}
          className={`p-3 bg-blue-50 border-3 border-black shadow-[3px_3px_0_0_#000] cursor-pointer transition-transform hover:-translate-y-0.5 ${
            selectedStatus === 'paid' ? 'ring-3 ring-black bg-blue-200' : ''
          }`}
        >
          <span className="text-[10px] font-black uppercase text-blue-800 block">💰 DIBAYAR</span>
          <span className="text-2xl font-black text-blue-950 block">{stats?.paid_count || 0}</span>
          <span className="text-[9px] font-bold text-neutral-500">QRIS Terverifikasi</span>
        </div>

        <div
          onClick={() => setSelectedStatus('processing')}
          className={`p-3 bg-orange-50 border-3 border-black shadow-[3px_3px_0_0_#000] cursor-pointer transition-transform hover:-translate-y-0.5 ${
            selectedStatus === 'processing' ? 'ring-3 ring-black bg-orange-200' : ''
          }`}
        >
          <span className="text-[10px] font-black uppercase text-orange-800 block">🔥 DIPROSES</span>
          <span className="text-2xl font-black text-orange-950 block">{stats?.processing_count || 0}</span>
          <span className="text-[9px] font-bold text-neutral-500">Sedang Dimasak</span>
        </div>

        <div
          onClick={() => setSelectedStatus('shipped')}
          className={`p-3 bg-purple-50 border-3 border-black shadow-[3px_3px_0_0_#000] cursor-pointer transition-transform hover:-translate-y-0.5 ${
            selectedStatus === 'shipped' ? 'ring-3 ring-black bg-purple-200' : ''
          }`}
        >
          <span className="text-[10px] font-black uppercase text-purple-800 block">🛵 DIKIRIM</span>
          <span className="text-2xl font-black text-purple-950 block">{stats?.shipped_count || 0}</span>
          <span className="text-[9px] font-bold text-neutral-500">Jalan / Siap Ambil</span>
        </div>

        <div
          onClick={() => setSelectedStatus('completed')}
          className={`p-3 bg-emerald-50 border-3 border-black shadow-[3px_3px_0_0_#000] cursor-pointer transition-transform hover:-translate-y-0.5 ${
            selectedStatus === 'completed' ? 'ring-3 ring-black bg-emerald-200' : ''
          }`}
        >
          <span className="text-[10px] font-black uppercase text-emerald-800 block">✅ SELESAI</span>
          <span className="text-2xl font-black text-emerald-950 block">{stats?.completed_count || 0}</span>
          <span className="text-[9px] font-bold text-neutral-500">Transaksi Tuntas</span>
        </div>
      </div>

      {/* Filter Tab & Search Bar */}
      <div className="bg-white p-4 border-4 border-black shadow-[4px_4px_0_0_#000] flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'pending', label: 'Menunggu Bayar' },
            { id: 'paid', label: 'Dibayar' },
            { id: 'processing', label: 'Diproses' },
            { id: 'shipped', label: 'Dikirim' },
            { id: 'completed', label: 'Selesai' },
            { id: 'cancelled', label: 'Dibatalkan' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3 py-1.5 text-xs font-black uppercase border-2 border-black whitespace-nowrap transition-colors ${
                selectedStatus === tab.id
                  ? 'bg-brand-red text-white shadow-[2px_2px_0_0_#000]'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-72">
          <div className="relative flex-1">
            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari ID, Nama, No WA..."
              className="w-full pl-9 pr-3 py-1.5 border-2 border-black font-bold text-xs focus:outline-none focus:bg-amber-50"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-black text-white font-black uppercase text-xs hover:bg-neutral-800 active:scale-95"
          >
            Cari
          </button>
        </form>
      </div>

      {/* Orders List & Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daftar Pesanan (Left side) */}
        <div className={`${selectedOrder ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4`}>
          {loading ? (
            <div className="bg-white p-12 border-4 border-black text-center shadow-[4px_4px_0_0_#000]">
              <div className="animate-spin w-8 h-8 border-4 border-brand-red border-t-transparent mx-auto mb-3 rounded-full" />
              <span className="font-black text-sm uppercase">Memuat data pesanan...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white p-12 border-4 border-black text-center shadow-[4px_4px_0_0_#000]">
              <ShoppingBagIcon className="w-12 h-12 mx-auto mb-2 text-neutral-400" />
              <p className="font-black uppercase text-lg">Belum ada pesanan pada filter ini</p>
              <p className="text-xs font-bold text-neutral-500 mt-1">
                Pesanan yang masuk dari website checkout akan otomatis muncul di sini tanpa perlu input manual.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((ord) => {
                const conf = statusConfigs[ord.order_status] || statusConfigs.pending;
                const isSelected = selectedOrder?.id === ord.id;
                const formattedDate = new Date(ord.created_at).toLocaleString('id-ID', {
                  timeZone: 'Asia/Jakarta',
                  dateStyle: 'medium',
                  timeStyle: 'short',
                });

                return (
                  <div
                    key={ord.id}
                    className={`bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_#000] transition-all ${
                      isSelected ? 'ring-4 ring-brand-red bg-amber-50/50' : 'hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b-2 border-neutral-200">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs uppercase px-2 py-0.5 bg-neutral-900 text-white border border-black">
                          #{ord.id}
                        </span>
                        <span
                          className={`font-black text-[11px] uppercase px-2.5 py-0.5 border-2 border-black ${conf.badgeBg} ${conf.textColor}`}
                        >
                          {conf.label}
                        </span>
                        <span className="text-[10px] font-bold text-neutral-500 uppercase px-1.5 py-0.5 bg-neutral-100 border border-neutral-300">
                          {ord.order_type === 'dine_in'
                            ? `🍽️ Dine-in (Meja ${ord.table_number || '-'})`
                            : ord.order_type === 'takeaway'
                            ? '🥡 Bawa Pulang'
                            : '🛵 Delivery'}
                        </span>
                      </div>

                      <span className="text-[11px] font-bold text-neutral-500">{formattedDate} WIB</span>
                    </div>

                    {/* Customer & Total */}
                    <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-base text-neutral-900">{ord.customer_name}</span>
                          <span className="text-xs font-bold text-neutral-600">({ord.customer_phone})</span>
                        </div>
                        {ord.address && (
                          <div className="flex items-center gap-1.5 text-xs text-neutral-600 mt-0.5">
                            <MapPinIcon className="w-3.5 h-3.5 text-brand-red flex-shrink-0" />
                            <span className="line-clamp-1">{ord.address}</span>
                          </div>
                        )}
                        {ord.voucher_code && (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-1">
                            <TagIcon className="w-3.5 h-3.5" />
                            <span>Voucher: {ord.voucher_code} (-Rp{Number(ord.discount_amount).toLocaleString('id-ID')})</span>
                          </div>
                        )}
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-xs font-bold text-neutral-500 block uppercase">Total Pesanan</span>
                        <span className="text-lg font-black text-brand-red block">
                          Rp{Number(ord.total_amount).toLocaleString('id-ID')}
                        </span>
                        <span className="text-[10px] font-black uppercase text-neutral-600">
                          Metode: {ord.payment_method.toUpperCase()} ({ord.payment_status.toUpperCase()})
                        </span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-3 border-t-2 border-neutral-200 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          onClick={() => viewOrderDetails(ord)}
                          className="px-3 py-1 bg-brand-yellow hover:bg-yellow-400 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5"
                        >
                          Rincian Menu
                        </button>

                        <button
                          onClick={() => openPrintModal(ord)}
                          className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0_0_#000] flex items-center gap-1"
                          title="Cetak Struk Kasir"
                        >
                          <PrinterIcon className="w-3.5 h-3.5" />
                          <span>Struk</span>
                        </button>

                        <a
                          href={getWhatsAppMessage(ord)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0_0_#000] flex items-center gap-1"
                          title="Kirim Update WhatsApp ke Pelanggan"
                        >
                          <PhoneIcon className="w-3.5 h-3.5" />
                          <span>Chat WA</span>
                        </a>
                      </div>

                      {/* Dropdown Ganti Status Cepat */}
                      <div className="flex items-center gap-2">
                        <select
                          value={ord.order_status}
                          disabled={statusUpdating === ord.id}
                          onChange={(e) => updateOrderStatus(ord.id, e.target.value as OrderStatus)}
                          className="px-2.5 py-1 border-2 border-black font-black text-xs uppercase bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-black"
                        >
                          <option value="pending">⏳ Menunggu Bayar</option>
                          <option value="paid">💰 Dibayar</option>
                          <option value="processing">🔥 Diproses / Dimasak</option>
                          <option value="shipped">🛵 Dikirim / Siap Ambil</option>
                          <option value="completed">✅ Selesai</option>
                          <option value="cancelled">❌ Dibatalkan</option>
                        </select>

                        <button
                          onClick={() => deleteOrder(ord.id)}
                          className="p-1.5 bg-neutral-100 hover:bg-brand-red hover:text-white border-2 border-black text-neutral-700 transition-colors"
                          title="Hapus Pesanan (Audit Logged)"
                        >
                          <Trash2Icon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel Rincian Pesanan (Right side) */}
        {selectedOrder && (
          <div className="lg:col-span-5 bg-white border-4 border-black p-5 shadow-[6px_6px_0_0_#000] sticky top-24 self-start">
            <div className="flex items-center justify-between pb-3 border-b-3 border-black mb-4">
              <div>
                <span className="font-black text-xs uppercase text-brand-red block">RINCIAN PESANAN</span>
                <span className="font-black text-lg block">#{selectedOrder.id}</span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 bg-neutral-100 hover:bg-neutral-200 border-2 border-black"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Status Steps Stepper */}
            <div className="mb-4 p-3 bg-neutral-100 border-2 border-black">
              <span className="text-[10px] font-black uppercase text-neutral-500 block mb-2">STATUS PROGRESS:</span>
              <div className="grid grid-cols-5 gap-1 text-center">
                {(['pending', 'paid', 'processing', 'shipped', 'completed'] as OrderStatus[]).map((st, idx) => {
                  const currentStep = statusConfigs[selectedOrder.order_status].step;
                  const stepNum = idx + 1;
                  const isDone = currentStep >= stepNum;
                  const isCurrent = selectedOrder.order_status === st;

                  return (
                    <div
                      key={st}
                      onClick={() => updateOrderStatus(selectedOrder.id, st)}
                      className={`cursor-pointer p-1 border-2 border-black text-[9px] font-black uppercase transition-all ${
                        isCurrent
                          ? 'bg-brand-red text-white scale-105 shadow-[2px_2px_0_0_#000]'
                          : isDone
                          ? 'bg-emerald-300 text-black'
                          : 'bg-white text-neutral-400'
                      }`}
                      title={`Klik untuk ubah status ke ${statusConfigs[st].label}`}
                    >
                      {stepNum}. {st}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Info Pelanggan */}
            <div className="space-y-2 text-xs font-bold border-b-2 border-neutral-200 pb-3 mb-3">
              <div className="flex justify-between">
                <span className="text-neutral-500">Pemesan:</span>
                <span className="font-black">{selectedOrder.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Nomor Telepon / WA:</span>
                <span>{selectedOrder.customer_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Tipe Pesanan:</span>
                <span className="uppercase font-black text-brand-red">{selectedOrder.order_type}</span>
              </div>
              {selectedOrder.table_number && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Nomor Meja:</span>
                  <span className="font-black">Meja #{selectedOrder.table_number}</span>
                </div>
              )}
              {selectedOrder.address && (
                <div>
                  <span className="text-neutral-500 block">Alamat Pengiriman:</span>
                  <span className="text-neutral-900 block font-normal">{selectedOrder.address}</span>
                </div>
              )}
              {selectedOrder.additional_notes && (
                <div className="p-2 bg-amber-50 border border-amber-300 rounded text-amber-900">
                  <span className="font-black block text-[10px] uppercase">Catatan Pelanggan:</span>
                  <span>{selectedOrder.additional_notes}</span>
                </div>
              )}
            </div>

            {/* Daftar Menu Items */}
            <div className="mb-4">
              <span className="text-xs font-black uppercase text-neutral-700 block mb-2">Item Menu Yang Dipesan:</span>
              {loadingDetails ? (
                <div className="py-6 text-center text-xs font-bold text-neutral-500">Memuat rincian item...</div>
              ) : orderItems.length === 0 ? (
                <div className="py-4 text-center text-xs font-bold text-neutral-400 italic">
                  Data item rincian tersimpan di sistem
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {orderItems.map((it) => (
                    <div key={it.id} className="p-2.5 bg-neutral-50 border-2 border-black text-xs">
                      <div className="flex justify-between font-black">
                        <span>
                          {it.quantity}x {it.item_name}
                        </span>
                        <span>Rp{Number(it.subtotal_item).toLocaleString('id-ID')}</span>
                      </div>
                      {it.spice_level > 0 && (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-brand-red mt-0.5">
                          <FlameIcon className="w-3 h-3" />
                          <span>Level Pedas: {it.spice_level}</span>
                        </div>
                      )}
                      {it.toppings_summary && (
                        <div className="text-[11px] text-neutral-600 mt-0.5 font-medium">
                          Topping: {it.toppings_summary}
                        </div>
                      )}
                      {it.notes && (
                        <div className="text-[10px] text-amber-800 italic mt-0.5">
                          Catatan: "{it.notes}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ringkasan Biaya */}
            <div className="space-y-1.5 text-xs font-bold border-t-2 border-black pt-3">
              <div className="flex justify-between">
                <span>Subtotal Menu:</span>
                <span>Rp{Number(selectedOrder.subtotal).toLocaleString('id-ID')}</span>
              </div>
              {selectedOrder.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-700 font-black">
                  <span>Diskon Voucher ({selectedOrder.voucher_code || 'Voucher'}):</span>
                  <span>-Rp{Number(selectedOrder.discount_amount).toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-brand-red pt-1 border-t border-neutral-300">
                <span>TOTAL AKHIR:</span>
                <span>Rp{Number(selectedOrder.total_amount).toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <a
                href={getWhatsAppMessage(selectedOrder)}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-xs border-2 border-black text-center shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-1.5"
              >
                <PhoneIcon className="w-4 h-4" />
                <span>Kirim WA</span>
              </a>

              <button
                onClick={() => openPrintModal(selectedOrder)}
                className="py-2 px-3 bg-brand-yellow hover:bg-yellow-400 font-black uppercase text-xs border-2 border-black text-center shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-1.5"
              >
                <PrinterIcon className="w-4 h-4" />
                <span>Cetak Nota</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL CETAK STRUK / NOTA THERMAL */}
      {printModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-6 w-full max-w-sm shadow-[8px_8px_0_0_#000] relative">
            <button
              onClick={() => setPrintModalOrder(null)}
              className="absolute top-3 right-3 p-1.5 bg-neutral-200 hover:bg-brand-red hover:text-white border-2 border-black"
            >
              <XIcon className="w-4 h-4" />
            </button>

            {/* Struk Content (Printable) */}
            <div id="receipt-print-area" className="text-center font-mono text-xs text-neutral-900 border-b-2 border-dashed border-neutral-400 pb-3 mb-3">
              <div className="font-black text-base uppercase tracking-wider">MIE JEBEW OFFICIAL</div>
              <div className="text-[10px]">Shadow of Spice • Level Pedas Sadis</div>
              <div className="text-[10px] text-neutral-600">Jl. Babakan Ciamis, Bandung</div>
              <div className="text-[10px] text-neutral-600 mb-2">WA: 0812-3456-7890</div>
              <div className="border-b border-dashed border-neutral-400 my-1" />

              <div className="text-left text-[11px] space-y-0.5 my-2">
                <div>No. Order: #{printModalOrder.order.id}</div>
                <div>Tgl: {new Date(printModalOrder.order.created_at).toLocaleString('id-ID')}</div>
                <div>Nama: {printModalOrder.order.customer_name}</div>
                <div>Tipe: {printModalOrder.order.order_type.toUpperCase()}</div>
                {printModalOrder.order.table_number && <div>Meja: #{printModalOrder.order.table_number}</div>}
              </div>

              <div className="border-b border-dashed border-neutral-400 my-1" />

              {/* Items List */}
              <div className="text-left space-y-1.5 my-2">
                {printModalOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <div>
                      <div>
                        {it.quantity}x {it.item_name}
                      </div>
                      {it.spice_level > 0 && <div className="text-[10px] text-neutral-500">Lvl {it.spice_level}</div>}
                    </div>
                    <div>Rp{Number(it.subtotal_item).toLocaleString('id-ID')}</div>
                  </div>
                ))}
              </div>

              <div className="border-b border-dashed border-neutral-400 my-1" />

              <div className="text-right space-y-0.5 my-2 font-bold">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>Rp{Number(printModalOrder.order.subtotal).toLocaleString('id-ID')}</span>
                </div>
                {printModalOrder.order.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-800">
                    <span>Diskon:</span>
                    <span>-Rp{Number(printModalOrder.order.discount_amount).toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black pt-1 border-t border-dashed border-neutral-400">
                  <span>TOTAL:</span>
                  <span>Rp{Number(printModalOrder.order.total_amount).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-[10px] font-normal text-neutral-600">
                  <span>Bayar:</span>
                  <span>{printModalOrder.order.payment_method.toUpperCase()} ({printModalOrder.order.payment_status.toUpperCase()})</span>
                </div>
              </div>

              <div className="border-b border-dashed border-neutral-400 my-2" />
              <div className="text-[10px] uppercase font-bold">TERIMA KASIH TELAH BERBELANJA!</div>
              <div className="text-[9px] text-neutral-500">Simpan struk ini sebagai bukti pembayaran sah.</div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-black text-white font-black uppercase text-xs border-2 border-black flex items-center justify-center gap-1.5 shadow-[2px_2px_0_0_#000] active:scale-95"
              >
                <PrinterIcon className="w-4 h-4" />
                <span>Cetak Nota</span>
              </button>
              <button
                onClick={() => setPrintModalOrder(null)}
                className="py-2 px-3 bg-neutral-200 font-black uppercase text-xs border-2 border-black"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
