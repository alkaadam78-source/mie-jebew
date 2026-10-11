import React, { useState, useEffect } from 'react';
import {
  apiGetBottles,
  apiCreateBottle,
  apiUpdateBottle,
  apiDeleteBottle,
} from '../../services/api';
import { ProductBottle } from '../../types';
import { Plus, X, Trash2 } from '../ui/Icons';
import { ImagePickerInput } from './ImagePickerInput';

export const AdminBottles: React.FC = () => {
  const [bottles, setBottles] = useState<ProductBottle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBottle, setEditingBottle] = useState<ProductBottle | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ProductBottle | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [price, setPrice] = useState<number | string>(25000);
  const [volumeMl, setVolumeMl] = useState<number | string>(200);
  const [heatLevel, setHeatLevel] = useState<number | string>(4);
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [badge, setBadge] = useState('');
  const [stockStatus, setStockStatus] = useState<'in_stock' | 'low_stock' | 'out_of_stock'>('in_stock');
  const [sortOrder, setSortOrder] = useState<number | string>(0);
  const [isActive, setIsActive] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await apiGetBottles({
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setBottles(res.bottles || []);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter]);

  const openCreateModal = () => {
    setEditingBottle(null);
    setName('');
    setSubtitle('Bumbu Minyak Cabai Pedas Gurih Siap Saji');
    setPrice(25000);
    setVolumeMl(200);
    setHeatLevel(4);
    setDescription('');
    setImage('');
    setBadge('🔥 BEST SELLER');
    setStockStatus('in_stock');
    setSortOrder(bottles.length + 1);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (b: ProductBottle) => {
    setEditingBottle(b);
    setName(b.name);
    setSubtitle(b.subtitle || '');
    setPrice(b.price);
    setVolumeMl(b.volume_ml);
    setHeatLevel(b.heat_level);
    setDescription(b.description || '');
    setImage(b.image || '');
    setBadge(b.badge || '');
    setStockStatus(b.stock_status);
    setSortOrder(b.sort_order);
    setIsActive(Boolean(b.is_active));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFeedback({ type: 'error', message: 'Nama produk botol wajib diisi.' });
      return;
    }
    if (Number(price) < 0) {
      setFeedback({ type: 'error', message: 'Harga tidak boleh negatif.' });
      return;
    }

    try {
      setSubmitting(true);
      const payload: Partial<ProductBottle> = {
        name: name.trim(),
        subtitle: subtitle.trim(),
        price: Number(price),
        volume_ml: Number(volumeMl),
        heat_level: Number(heatLevel),
        description: description.trim(),
        image: image.trim(),
        badge: badge.trim(),
        stock_status: stockStatus,
        sort_order: Number(sortOrder),
        is_active: isActive ? 1 : 0,
      };

      if (editingBottle) {
        await apiUpdateBottle(editingBottle.id, payload);
        setFeedback({ type: 'success', message: `Produk botol '${name}' berhasil diperbarui.` });
      } else {
        await apiCreateBottle(payload);
        setFeedback({ type: 'success', message: `Produk botol '${name}' berhasil ditambahkan.` });
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (b: ProductBottle) => {
    const nextStatus = b.is_active ? 0 : 1;
    try {
      await apiUpdateBottle(b.id, { is_active: nextStatus });
      setBottles((prev) =>
        prev.map((it) => (it.id === b.id ? { ...it, is_active: nextStatus } : it))
      );
      setFeedback({
        type: 'success',
        message: `Status produk '${b.name}' diubah menjadi ${nextStatus ? 'Aktif' : 'Nonaktif'}.`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      setSubmitting(true);
      await apiDeleteBottle(deleteConfirm.id);
      setFeedback({ type: 'success', message: `Produk '${deleteConfirm.name}' berhasil dihapus.` });
      setDeleteConfirm(null);
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border-2 border-black flex items-center justify-between text-xs sm:text-sm font-black shadow-brutal-sm ${
            feedback.type === 'success' ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="w-6 h-6 rounded-full hover:bg-black/10 flex items-center justify-center font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-black">Manajemen Produk Botol (Bottles)</h2>
          <p className="text-xs sm:text-sm font-bold text-gray-600">
            Kelola sambal botolan, chili oil kemasan, harga, dan ketersediaan stok produk.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="bg-jebew-red hover:bg-red-700 text-white font-black text-xs sm:text-sm px-5 py-3 border-2 border-black rounded-xl shadow-brutal active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Tambah Botol Baru</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border-3 border-black rounded-2xl p-4 shadow-brutal flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk botol..."
            className="w-full px-4 py-2.5 bg-cream-50 border-2 border-black rounded-xl text-xs sm:text-sm font-bold text-black placeholder-gray-400 focus:outline-none focus:bg-white"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-cream-50 border-2 border-black rounded-xl text-xs sm:text-sm font-black text-black cursor-pointer"
        >
          <option value="all">Semua Status</option>
          <option value="active">Hanya Aktif</option>
          <option value="inactive">Hanya Nonaktif</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border-3 border-black rounded-3xl overflow-hidden shadow-brutal">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-cream-100 border-b-2 border-black text-xs font-black uppercase text-black">
                <th className="p-3.5">Produk</th>
                <th className="p-3.5">Ukuran</th>
                <th className="p-3.5">Level Pedas</th>
                <th className="p-3.5">Harga</th>
                <th className="p-3.5">Stok</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-xs sm:text-sm font-bold">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500 font-bold">
                    Memuat data botol...
                  </td>
                </tr>
              ) : bottles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500 font-bold">
                    Belum ada produk botol yang ditambahkan.
                  </td>
                </tr>
              ) : (
                bottles.map((b) => {
                  const active = Boolean(b.is_active);

                  return (
                    <tr key={b.id} className="hover:bg-cream-50 transition-colors">
                      <td className="p-3.5 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 border border-black overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {b.image ? (
                            <img src={b.image} alt={b.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl">🍶</span>
                          )}
                        </div>
                        <div>
                          <div className="font-black text-black">{b.name}</div>
                          <div className="text-[11px] text-gray-500 line-clamp-1 max-w-[200px]">
                            {b.subtitle || b.description}
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 font-bold text-gray-700">
                        {b.volume_ml} ml
                      </td>

                      <td className="p-3.5 font-black text-amber-600">
                        {'🌶️'.repeat(Math.min(5, Math.max(1, b.heat_level)))} Lvl {b.heat_level}
                      </td>

                      <td className="p-3.5 font-black text-jebew-red">
                        Rp{b.price.toLocaleString('id-ID')}
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                            b.stock_status === 'in_stock'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : b.stock_status === 'low_stock'
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                              : 'bg-red-100 text-red-800 border-red-300'
                          }`}
                        >
                          {b.stock_status === 'in_stock'
                            ? 'Ready'
                            : b.stock_status === 'low_stock'
                            ? 'Menipis'
                            : 'Habis'}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(b)}
                          className={`px-3 py-1 rounded-full text-xs font-black border border-black cursor-pointer transition-all ${
                            active
                              ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {active ? '● Aktif' : '○ Nonaktif'}
                        </button>
                      </td>

                      <td className="p-3.5 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(b)}
                          className="px-3 py-1.5 bg-jebew-yellow hover:bg-yellow-400 border border-black rounded-lg text-xs font-black text-black cursor-pointer shadow-sm active:translate-x-0.5 active:translate-y-0.5"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(b)}
                          className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 border border-red-400 rounded-lg text-xs font-black cursor-pointer shadow-sm active:translate-x-0.5 active:translate-y-0.5"
                        >
                          Hapus
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative bg-white border-4 border-black rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-brutal-lg max-h-[90vh] overflow-y-auto my-8">
            <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-5">
              <h3 className="text-xl font-black text-black">
                {editingBottle ? 'Edit Produk Botol' : 'Tambah Produk Botol Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full border border-black flex items-center justify-center font-bold hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-black mb-1">
                  Nama Produk Botol *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Chili Oil Jebew Botol Kaca"
                  className="w-full px-3.5 py-2.5 bg-cream-50 border-2 border-black rounded-xl text-sm font-bold text-black focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-black mb-1">
                  Sub-judul / Tagline Produk
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Contoh: Bumbu Minyak Cabai Pedas Gurih Siap Saji"
                  className="w-full px-3.5 py-2.5 bg-cream-50 border-2 border-black rounded-xl text-sm font-bold text-black focus:outline-none focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-black mb-1">
                    Harga (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-cream-50 border-2 border-black rounded-xl text-sm font-bold text-black focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-black mb-1">
                    Volume (ml)
                  </label>
                  <input
                    type="number"
                    value={volumeMl}
                    onChange={(e) => setVolumeMl(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-cream-50 border-2 border-black rounded-xl text-sm font-bold text-black focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-black mb-1">
                    Level Pedas (1-5)
                  </label>
                  <select
                    value={heatLevel}
                    onChange={(e) => setHeatLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-cream-50 border-2 border-black rounded-xl text-sm font-bold text-black focus:outline-none focus:bg-white cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <option key={lvl} value={lvl}>
                        Level {lvl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-black mb-1">
                  Deskripsi Produk
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail bahan, saran penyajian, daya tahan bumbu..."
                  className="w-full px-3.5 py-2.5 bg-cream-50 border-2 border-black rounded-xl text-sm font-bold text-black focus:outline-none focus:bg-white"
                />
              </div>

              <ImagePickerInput
                label="Foto Produk Botol"
                value={image}
                onChange={setImage}
                placeholder="/rasa-mie/Original.jpeg"
                helperText="Upload foto botol baru langsung dari HP/Laptop atau pilih dari galeri media."
              />

              <div>
                <label className="block text-xs font-black uppercase text-black mb-1">
                  Badge
                </label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="Contoh: 🔥 BEST SELLER atau 🌶️ LEVEL 5"
                  className="w-full px-3.5 py-2.5 bg-cream-50 border-2 border-black rounded-xl text-sm font-bold text-black focus:outline-none focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-black mb-1">
                    Status Ketersediaan Stok
                  </label>
                  <select
                    value={stockStatus}
                    onChange={(e: any) => setStockStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-cream-50 border-2 border-black rounded-xl text-sm font-bold text-black focus:outline-none focus:bg-white cursor-pointer"
                  >
                    <option value="in_stock">Tersedia (In Stock)</option>
                    <option value="low_stock">Stok Menipis (Low Stock)</option>
                    <option value="out_of_stock">Stok Habis (Out of Stock)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-black mb-1">
                    Urutan Tampil (Sort Order)
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-cream-50 border-2 border-black rounded-xl text-sm font-bold text-black focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="p-4 bg-cream-50 border-2 border-black rounded-2xl">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-black text-emerald-800">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 accent-black"
                  />
                  <span>Produk Aktif & Tampil di Website Public</span>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 border-2 border-black rounded-xl text-xs font-black cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-jebew-red hover:bg-red-700 text-white border-2 border-black rounded-xl text-xs font-black shadow-brutal-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Produk'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-brutal-lg text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 border-2 border-black mx-auto flex items-center justify-center text-red-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-black">
              Hapus Produk '{deleteConfirm.name}'?
            </h3>
            <p className="text-xs font-bold text-gray-600">
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 border-2 border-black rounded-xl text-xs font-black cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDelete}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white border-2 border-black rounded-xl text-xs font-black shadow-brutal-sm cursor-pointer"
              >
                {submitting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
