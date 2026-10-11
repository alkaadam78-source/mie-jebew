import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Search,
  User,
  X,
} from '../ui/Icons';

export interface CustomerItem {
  id: number;
  phone: string;
  name: string;
  coins_balance: number;
  last_spin_wib_date?: string;
  total_orders: number;
  total_spent: number;
  created_at: string;
}

export const AdminCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustId, setSelectedCustId] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState<number>(50);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const token = localStorage.getItem('token') || '';

  const fetchCustomers = async (searchQuery = '') => {
    try {
      setLoading(true);
      const url = searchQuery
        ? `/api/admin/customers?search=${encodeURIComponent(searchQuery)}`
        : '/api/admin/customers';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers(search);
  };

  const handleOpenDetail = async (id: number) => {
    try {
      setSelectedCustId(id);
      setDetailLoading(true);
      const res = await fetch(`/api/admin/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDetailData(data);
      }
    } catch {
      // silent
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAdjustCoins = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustId || !adjustReason.trim()) return;

    try {
      setAdjustLoading(true);
      const res = await fetch(`/api/admin/customers/${selectedCustId}/adjust-coins`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: adjustAmount,
          reason: adjustReason.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: 'success', message: data.message });
        setAdjustReason('');
        // Refresh detail and list
        handleOpenDetail(selectedCustId);
        fetchCustomers(search);
      } else {
        setFeedback({ type: 'error', message: data.error || 'Gagal menyesuaikan koin' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Koneksi server gagal' });
    } finally {
      setAdjustLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">👥</span>
            <h1 className="text-2xl font-black uppercase tracking-tight">Pelanggan & Saldo Koin</h1>
            <span className="px-2 py-0.5 bg-jebew-yellow text-black border-2 border-black text-[10px] font-black uppercase rounded shadow-brutal-xs">
              Verifikasi WA
            </span>
          </div>
          <p className="text-xs font-bold text-neutral-600 mt-1">
            Data pengunjung yang terdaftar melalui gerbang masuk wajib (Nama Asli & WhatsApp), saldo koin, dan riwayat pesanan.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau nomor WA..."
            className="px-3 py-2 bg-neutral-50 border-2 border-black font-bold text-xs w-full sm:w-56"
          />
          <button
            type="submit"
            className="px-3.5 py-2 bg-jebew-red text-white font-black text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 border-3 border-black font-black text-xs flex items-center justify-between ${
            feedback.type === 'success' ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="font-bold underline cursor-pointer">
            Tutup
          </button>
        </div>
      )}

      {/* Customers Table */}
      <div className="bg-white border-3 border-black shadow-[4px_4px_0_0_#000] overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-100 border-b-2 border-black">
            <tr>
              <th className="p-3 font-black uppercase text-neutral-700">Pelanggan</th>
              <th className="p-3 font-black uppercase text-neutral-700">Nomor WhatsApp</th>
              <th className="p-3 font-black uppercase text-neutral-700">Saldo Koin</th>
              <th className="p-3 font-black uppercase text-neutral-700">Total Pesanan</th>
              <th className="p-3 font-black uppercase text-neutral-700">Total Belanja</th>
              <th className="p-3 font-black uppercase text-neutral-700">Spin Terakhir</th>
              <th className="p-3 font-black uppercase text-neutral-700 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center font-black uppercase text-neutral-500">
                  Memuat Data Pelanggan...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center font-bold text-neutral-500">
                  Tidak ada pelanggan yang cocok dengan pencarian.
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-50 font-semibold">
                  <td className="p-3">
                    <div className="font-black text-black">{c.name}</div>
                    <div className="text-[10px] font-mono text-neutral-400">ID #{c.id}</div>
                  </td>
                  <td className="p-3 font-mono font-bold text-neutral-800">
                    +{c.phone}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-400 rounded font-black text-xs">
                      🪙 {c.coins_balance.toLocaleString('id-ID')}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-black">{c.total_orders} pesanan</td>
                  <td className="p-3 font-mono font-black text-jebew-red">
                    Rp{Number(c.total_spent).toLocaleString('id-ID')}
                  </td>
                  <td className="p-3 text-[11px] font-mono text-neutral-500">
                    {c.last_spin_wib_date || 'Belum Spin'}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleOpenDetail(c.id)}
                      className="px-3 py-1.5 bg-jebew-yellow hover:bg-yellow-400 text-black font-black text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                    >
                      Detail & Koin
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Customer Detail & Coin Adjustment Modal */}
      {selectedCustId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white border-4 border-black p-6 shadow-[10px_10px_0_0_#000] max-h-[90vh] overflow-y-auto space-y-5">
            <button
              onClick={() => {
                setSelectedCustId(null);
                setDetailData(null);
              }}
              className="absolute top-4 right-4 p-1.5 hover:bg-neutral-100 border border-black rounded cursor-pointer"
            >
              <X className="w-4 h-4 text-black" />
            </button>

            {detailLoading ? (
              <div className="p-12 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-jebew-red mb-2" />
                <p className="font-black text-xs uppercase">Memuat Rincian Akun...</p>
              </div>
            ) : detailData ? (
              <>
                {/* Header Info */}
                <div className="border-b-2 border-black pb-4">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-jebew-red" />
                    <h3 className="text-xl font-black uppercase tracking-tight">{detailData.customer.name}</h3>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs font-semibold text-neutral-600 font-mono">
                    <span>📱 WA: +{detailData.customer.phone}</span>
                    <span>🪙 Saldo: {detailData.customer.coins_balance} koin</span>
                    <span>📅 Terdaftar: {new Date(detailData.customer.created_at).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>

                {/* Adjust Coins Form */}
                <div className="bg-amber-50 border-2 border-black p-4 space-y-3">
                  <h4 className="font-black text-xs uppercase tracking-tight text-amber-900">
                    Penyesuaian Saldo Koin Manual (Buku Besar Audit)
                  </h4>
                  <form onSubmit={handleAdjustCoins} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-black uppercase mb-1">Jumlah Koin (+/-)</label>
                      <input
                        type="number"
                        value={adjustAmount}
                        onChange={(e) => setAdjustAmount(parseInt(e.target.value, 10) || 0)}
                        placeholder="Contoh: 100 atau -50"
                        required
                        className="w-full p-2 bg-white border-2 border-black font-black text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase mb-1">Alasan Wajib Audit</label>
                      <input
                        type="text"
                        value={adjustReason}
                        onChange={(e) => setAdjustReason(e.target.value)}
                        placeholder="Contoh: Kompensasi pesanan..."
                        required
                        className="w-full p-2 bg-white border-2 border-black font-bold text-xs"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        disabled={adjustLoading}
                        className="w-full py-2 bg-jebew-red hover:bg-red-700 text-white font-black text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] disabled:opacity-50 cursor-pointer"
                      >
                        {adjustLoading ? 'Menyimpan...' : 'Eksekusi Koin'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Coin Transactions Ledger */}
                <div className="space-y-2">
                  <h4 className="font-black text-xs uppercase text-neutral-700">Riwayat Mutasi Koin (Buku Besar)</h4>
                  <div className="max-h-48 overflow-y-auto border-2 border-black">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-neutral-100 border-b border-black">
                        <tr>
                          <th className="p-2 font-black">Waktu</th>
                          <th className="p-2 font-black">Tipe</th>
                          <th className="p-2 font-black">Perubahan</th>
                          <th className="p-2 font-black">Saldo</th>
                          <th className="p-2 font-black">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200 font-semibold">
                        {detailData.coinHistory.map((tx: any) => (
                          <tr key={tx.id}>
                            <td className="p-2 font-mono text-[10px] text-neutral-500">
                              {new Date(tx.created_at).toLocaleString('id-ID')}
                            </td>
                            <td className="p-2 font-bold uppercase text-[9px]">{tx.type}</td>
                            <td className="p-2 font-mono font-black">
                              <span className={tx.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                                {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                              </span>
                            </td>
                            <td className="p-2 font-mono text-neutral-600">{tx.balance_after}</td>
                            <td className="p-2 text-neutral-700">{tx.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
