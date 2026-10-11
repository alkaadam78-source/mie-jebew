import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Package,
  Plus,
  Minus,
  X,
} from '../ui/Icons';

export interface InventoryItemData {
  id: string;
  item_type: 'product' | 'bottle' | 'physical_reward' | 'bundle';
  reference_id?: string;
  name: string;
  sku: string;
  current_stock: number;
  min_stock_alert: number;
  unit: string;
  daily_avg_sales: number;
  estimated_days_left: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
  last_restocked_at?: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryLogData {
  id: number;
  inventory_id: string;
  item_name?: string;
  change_type: 'order_deduction' | 'restock' | 'correction' | 'reward_claim' | 'waste';
  quantity_change: number;
  stock_before: number;
  stock_after: number;
  notes?: string;
  admin_username: string;
  reference_id?: string;
  created_at: string;
}

export interface InventoryOverviewData {
  totalItems: number;
  lowStockCount: number;
  outOfStockCount: number;
  items: InventoryItemData[];
  recentLogs: InventoryLogData[];
}

export const AdminInventory: React.FC = () => {
  const [overview, setOverview] = useState<InventoryOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'product' | 'bottle' | 'physical_reward'>('all');
  const [adjustingItem, setAdjustingItem] = useState<InventoryItemData | null>(null);
  const [changeType, setChangeType] = useState<'restock' | 'correction' | 'waste'>('restock');
  const [quantity, setQuantity] = useState<number>(10);
  const [notes, setNotes] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const token = localStorage.getItem('token') || '';

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/inventory/list', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem) return;

    try {
      setActionLoading(true);
      const qtyChange = changeType === 'waste' ? -Math.abs(quantity) : Math.abs(quantity);

      const res = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: adjustingItem.id,
          changeType,
          quantityChange: qtyChange,
          notes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: 'success', message: data.message });
        setAdjustingItem(null);
        setNotes('');
        fetchOverview();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Gagal menyesuaikan stok' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Koneksi server gagal' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredItems = (overview?.items || []).filter((item) => {
    if (activeTab === 'all') return true;
    return item.item_type === activeTab;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📦</span>
            <h1 className="text-2xl font-black uppercase tracking-tight">Smart Inventory & Stok</h1>
            <span className="px-2 py-0.5 bg-jebew-yellow text-black border-2 border-black text-[10px] font-black uppercase rounded shadow-brutal-xs">
              Forecasting Aktif
            </span>
          </div>
          <p className="text-xs font-bold text-neutral-600 mt-1">
            Pantau stok bahan mie, sambal botol kemasan, dan hadiah fisik (seperti Mie Jebew Original reward). Terintegrasi pemotongan otomatis per pesanan.
          </p>
        </div>

        <button
          onClick={fetchOverview}
          disabled={loading}
          className="px-4 py-2.5 bg-white hover:bg-neutral-100 text-black font-black text-xs uppercase border-2 border-black shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Segarkan Data
        </button>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border-3 border-black p-4 shadow-[4px_4px_0_0_#000]">
          <div className="text-[10px] font-black uppercase text-neutral-500">Total Item Terdaftar</div>
          <div className="text-2xl font-black mt-1">{overview?.totalItems ?? 0}</div>
          <div className="text-[10px] font-bold text-neutral-500 mt-0.5">Produk, botol & hadiah</div>
        </div>

        <div className="bg-amber-50 border-3 border-black p-4 shadow-[4px_4px_0_0_#000]">
          <div className="text-[10px] font-black uppercase text-amber-800">Stok Menipis (Alert)</div>
          <div className="text-2xl font-black text-amber-900 mt-1">{overview?.lowStockCount ?? 0}</div>
          <div className="text-[10px] font-bold text-amber-700 mt-0.5">Di bawah batas aman</div>
        </div>

        <div className="bg-red-50 border-3 border-black p-4 shadow-[4px_4px_0_0_#000]">
          <div className="text-[10px] font-black uppercase text-red-800">Stok Habis (0)</div>
          <div className="text-2xl font-black text-red-900 mt-1">{overview?.outOfStockCount ?? 0}</div>
          <div className="text-[10px] font-bold text-red-700 mt-0.5">Perlu segera restock</div>
        </div>

        <div className="bg-blue-50 border-3 border-black p-4 shadow-[4px_4px_0_0_#000]">
          <div className="text-[10px] font-black uppercase text-blue-800">Hadiah Fisik Khusus</div>
          <div className="text-2xl font-black text-blue-900 mt-1">
            {overview?.items.filter((i) => i.item_type === 'physical_reward').length ?? 0}
          </div>
          <div className="text-[10px] font-bold text-blue-700 mt-0.5">Alokasi reward voucher</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b-2 border-black pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 font-black text-xs uppercase border-2 border-black transition-all cursor-pointer ${
            activeTab === 'all' ? 'bg-black text-white shadow-[2px_2px_0_0_#000]' : 'bg-white hover:bg-neutral-100'
          }`}
        >
          Semua Item
        </button>
        <button
          onClick={() => setActiveTab('product')}
          className={`px-3 py-1.5 font-black text-xs uppercase border-2 border-black transition-all cursor-pointer ${
            activeTab === 'product' ? 'bg-jebew-yellow text-black shadow-[2px_2px_0_0_#000]' : 'bg-white hover:bg-neutral-100'
          }`}
        >
          Porsi Mie & Topping
        </button>
        <button
          onClick={() => setActiveTab('bottle')}
          className={`px-3 py-1.5 font-black text-xs uppercase border-2 border-black transition-all cursor-pointer ${
            activeTab === 'bottle' ? 'bg-jebew-yellow text-black shadow-[2px_2px_0_0_#000]' : 'bg-white hover:bg-neutral-100'
          }`}
        >
          Sambal Botol Kemasan
        </button>
        <button
          onClick={() => setActiveTab('physical_reward')}
          className={`px-3 py-1.5 font-black text-xs uppercase border-2 border-black transition-all cursor-pointer ${
            activeTab === 'physical_reward' ? 'bg-jebew-yellow text-black shadow-[2px_2px_0_0_#000]' : 'bg-white hover:bg-neutral-100'
          }`}
        >
          Hadiah Fisik Reward
        </button>
      </div>

      {/* Stock Table */}
      <div className="bg-white border-3 border-black shadow-[4px_4px_0_0_#000] overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-100 border-b-2 border-black">
            <tr>
              <th className="p-3 font-black uppercase text-neutral-700">Nama Barang & SKU</th>
              <th className="p-3 font-black uppercase text-neutral-700">Tipe</th>
              <th className="p-3 font-black uppercase text-neutral-700">Stok Saat Ini</th>
              <th className="p-3 font-black uppercase text-neutral-700">Batas Aman</th>
              <th className="p-3 font-black uppercase text-neutral-700">Run-rate Habis</th>
              <th className="p-3 font-black uppercase text-neutral-700">Status</th>
              <th className="p-3 font-black uppercase text-neutral-700 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {filteredItems.map((item) => {
              const daysLeft = item.estimated_days_left;
              const daysColor =
                daysLeft <= 2
                  ? 'bg-red-500 text-white'
                  : daysLeft <= 5
                  ? 'bg-amber-400 text-black'
                  : 'bg-green-100 text-green-900 border border-green-700';

              return (
                <tr key={item.id} className="hover:bg-neutral-50 font-semibold">
                  <td className="p-3">
                    <div className="font-black text-black">{item.name}</div>
                    <div className="text-[10px] font-mono text-neutral-500">{item.sku}</div>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-neutral-200 text-neutral-800 text-[10px] font-black uppercase rounded">
                      {item.item_type === 'product'
                        ? 'Porsi / Menu'
                        : item.item_type === 'bottle'
                        ? 'Botol Kemasan'
                        : item.item_type === 'physical_reward'
                        ? 'Hadiah Fisik'
                        : 'Paket'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="font-black text-sm text-black">
                      {item.current_stock} <span className="text-xs font-normal text-neutral-500">{item.unit}</span>
                    </div>
                  </td>
                  <td className="p-3 text-neutral-600 font-mono">
                    {item.min_stock_alert} {item.unit}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 text-[10px] font-black rounded ${daysColor}`}>
                      {daysLeft} Hari ({item.daily_avg_sales}/hari)
                    </span>
                  </td>
                  <td className="p-3">
                    {item.stock_status === 'out_of_stock' ? (
                      <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-black uppercase rounded">
                        Habis
                      </span>
                    ) : item.stock_status === 'low_stock' ? (
                      <span className="px-2 py-0.5 bg-amber-400 text-black text-[10px] font-black uppercase rounded">
                        Menipis
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-green-500 text-white text-[10px] font-black uppercase rounded">
                        Aman
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => {
                        setAdjustingItem(item);
                        setQuantity(10);
                        setChangeType('restock');
                      }}
                      className="px-3 py-1.5 bg-jebew-yellow hover:bg-yellow-400 text-black font-black text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                    >
                      Sesuaikan
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Recent Logs Table */}
      <div className="bg-white border-3 border-black p-5 shadow-[4px_4px_0_0_#000] space-y-3">
        <h3 className="font-black text-sm uppercase tracking-tight flex items-center gap-2">
          <Package className="w-4 h-4 text-jebew-red" />
          Riwayat Perubahan & Audit Stok Terbaru
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-100 border-b border-black">
              <tr>
                <th className="p-2 font-black uppercase text-neutral-700">Waktu</th>
                <th className="p-2 font-black uppercase text-neutral-700">Barang</th>
                <th className="p-2 font-black uppercase text-neutral-700">Aksi</th>
                <th className="p-2 font-black uppercase text-neutral-700">Perubahan</th>
                <th className="p-2 font-black uppercase text-neutral-700">Sebelum → Sesudah</th>
                <th className="p-2 font-black uppercase text-neutral-700">Catatan</th>
                <th className="p-2 font-black uppercase text-neutral-700">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {(overview?.recentLogs || []).slice(0, 10).map((log) => (
                <tr key={log.id} className="hover:bg-neutral-50 font-semibold">
                  <td className="p-2 text-[10px] text-neutral-500 font-mono">
                    {new Date(log.created_at).toLocaleString('id-ID')}
                  </td>
                  <td className="p-2 font-black text-black">{log.item_name || log.inventory_id}</td>
                  <td className="p-2">
                    <span className="px-1.5 py-0.5 bg-neutral-200 text-black text-[9px] font-black uppercase rounded">
                      {log.change_type}
                    </span>
                  </td>
                  <td className="p-2 font-black font-mono">
                    <span className={log.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}>
                      {log.quantity_change > 0 ? `+${log.quantity_change}` : log.quantity_change}
                    </span>
                  </td>
                  <td className="p-2 font-mono text-neutral-600">
                    {log.stock_before} → {log.stock_after}
                  </td>
                  <td className="p-2 text-neutral-600 text-[11px]">{log.notes || '-'}</td>
                  <td className="p-2 font-bold text-neutral-700">{log.admin_username}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Modal */}
      {adjustingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white border-4 border-black p-6 shadow-[8px_8px_0_0_#000]">
            <button
              onClick={() => setAdjustingItem(null)}
              className="absolute top-4 right-4 p-1.5 hover:bg-neutral-100 border border-black rounded"
            >
              <X className="w-4 h-4 text-black" />
            </button>

            <h3 className="text-lg font-black uppercase tracking-tight mb-1">Sesuaikan Stok Barang</h3>
            <p className="text-xs font-bold text-neutral-600 mb-4">
              {adjustingItem.name} (Stok Saat Ini: {adjustingItem.current_stock} {adjustingItem.unit})
            </p>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Tipe Penyesuaian</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setChangeType('restock')}
                    className={`py-2 text-xs font-black uppercase border-2 border-black ${
                      changeType === 'restock' ? 'bg-green-400 shadow-[2px_2px_0_0_#000]' : 'bg-neutral-100'
                    }`}
                  >
                    + Restock
                  </button>
                  <button
                    type="button"
                    onClick={() => setChangeType('correction')}
                    className={`py-2 text-xs font-black uppercase border-2 border-black ${
                      changeType === 'correction' ? 'bg-jebew-yellow shadow-[2px_2px_0_0_#000]' : 'bg-neutral-100'
                    }`}
                  >
                    Koreksi
                  </button>
                  <button
                    type="button"
                    onClick={() => setChangeType('waste')}
                    className={`py-2 text-xs font-black uppercase border-2 border-black ${
                      changeType === 'waste' ? 'bg-red-400 text-white shadow-[2px_2px_0_0_#000]' : 'bg-neutral-100'
                    }`}
                  >
                    - Rusak/Habis
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">
                  Jumlah ({adjustingItem.unit})
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 5))}
                    className="p-2.5 bg-neutral-100 border-2 border-black font-black"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    min={1}
                    className="flex-1 p-2 bg-neutral-50 border-2 border-black font-black text-center text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 5)}
                    className="p-2.5 bg-neutral-100 border-2 border-black font-black"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Catatan / Alasan</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Belanja bahan baku dari suplier pasar..."
                  required
                  className="w-full p-2.5 bg-neutral-50 border-2 border-black font-bold text-xs"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustingItem(null)}
                  className="flex-1 py-2.5 bg-neutral-200 font-black text-xs uppercase border-2 border-black"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-jebew-red text-white font-black text-xs uppercase border-2 border-black shadow-[3px_3px_0_0_#000] disabled:opacity-50"
                >
                  {actionLoading ? 'Menyimpan...' : 'Simpan Stok'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
