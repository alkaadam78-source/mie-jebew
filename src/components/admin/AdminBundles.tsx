import React, { useState, useEffect } from 'react';
import { BundleItem } from '../../types';
import {
  apiGetBundles,
  apiCreateBundle,
  apiUpdateBundle,
  apiDeleteBundle,
} from '../../services/api';
import {
  PackageIcon,
  PlusIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  XIcon,
  RefreshCwIcon,
} from '../ui/Icons';
import { ImagePickerInput } from './ImagePickerInput';

export const AdminBundles: React.FC = () => {
  const [bundles, setBundles] = useState<BundleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BundleItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    original_price: 0,
    savings_badge: 'HEMAT 15%',
    items_included_str: '',
    image: '',
    sort_order: 1,
    is_active: 1,
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchBundles = async () => {
    setLoading(true);
    try {
      const res = await apiGetBundles();
      setBundles(res.bundles || []);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat bundles', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBundles();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      original_price: 0,
      savings_badge: 'HEMAT 15%',
      items_included_str: '',
      image: '',
      sort_order: bundles.length + 1,
      is_active: 1,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: BundleItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price,
      original_price: item.original_price || item.price,
      savings_badge: item.savings_badge || '',
      items_included_str: Array.isArray(item.items_included)
        ? item.items_included.join(', ')
        : (item.items_included || ''),
      image: item.image || '',
      sort_order: item.sort_order || 1,
      is_active: item.is_active ? 1 : 0,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Nama paket wajib diisi', 'error');
      return;
    }
    if (formData.price < 0) {
      showToast('Harga tidak boleh negatif', 'error');
      return;
    }

    const items = formData.items_included_str
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    setIsSubmitting(true);
    try {
      const payload: Partial<BundleItem> = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        original_price: Number(formData.original_price),
        savings_badge: formData.savings_badge.trim(),
        items_included: items,
        image: formData.image.trim(),
        sort_order: Number(formData.sort_order),
        is_active: formData.is_active ? 1 : 0,
      };

      if (editingItem) {
        await apiUpdateBundle(editingItem.id, payload);
        showToast('Paket bundle berhasil diperbarui', 'success');
      } else {
        await apiCreateBundle(payload);
        showToast('Paket bundle baru berhasil ditambahkan', 'success');
      }
      setIsModalOpen(false);
      fetchBundles();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan bundle', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (item: BundleItem) => {
    const nextStatus = item.is_active ? 0 : 1;
    try {
      await apiUpdateBundle(item.id, { is_active: nextStatus });
      setBundles((prev) =>
        prev.map((b) => (b.id === item.id ? { ...b, is_active: nextStatus } : b))
      );
      showToast(`Status ${item.name} berhasil diubah`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal mengubah status', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiDeleteBundle(id);
      showToast('Paket bundle berhasil dihapus', 'success');
      setDeleteConfirmId(null);
      fetchBundles();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus bundle', 'error');
    }
  };

  const filteredBundles = bundles.filter((b) => {
    const matchSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.description?.toLowerCase().includes(search.toLowerCase());
    const matchActive =
      filterActive === 'all'
        ? true
        : filterActive === 'active'
        ? Boolean(b.is_active)
        : !Boolean(b.is_active);
    return matchSearch && matchActive;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 border-2 border-black font-black uppercase text-sm shadow-[4px_4px_0_0_#000] flex items-center gap-2 ${
            toast.type === 'success' ? 'bg-brand-yellow text-black' : 'bg-brand-red text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckIcon className="w-5 h-5" /> : <XIcon className="w-5 h-5" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 border-2 border-black shadow-[4px_4px_0_0_#000]">
        <div>
          <div className="flex items-center gap-2">
            <PackageIcon className="w-6 h-6 text-brand-red" />
            <h1 className="text-2xl font-black uppercase tracking-tight text-neutral-900">
              Bundles & Paket Hemat
            </h1>
          </div>
          <p className="text-sm text-neutral-600 font-medium mt-1">
            Kelola paket bundling komplit untuk meningkatkan nilai pesanan (AOV)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchBundles}
            className="p-2.5 bg-neutral-100 hover:bg-neutral-200 border-2 border-black font-bold transition-transform active:scale-95"
            title="Refresh Data"
          >
            <RefreshCwIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-yellow hover:bg-yellow-400 border-2 border-black font-black uppercase text-sm shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Tambah Paket</span>
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-neutral-100 p-4 border-2 border-black">
        <div className="relative w-full sm:flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Cari nama paket atau item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="px-3 py-2 bg-white border-2 border-black text-sm font-bold focus:outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="active">Hanya Aktif</option>
            <option value="inactive">Hanya Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Content Table / Cards */}
      {loading ? (
        <div className="p-12 text-center bg-white border-2 border-black">
          <RefreshCwIcon className="w-8 h-8 animate-spin mx-auto text-brand-red mb-2" />
          <p className="font-bold text-neutral-600">Memuat data bundle...</p>
        </div>
      ) : filteredBundles.length === 0 ? (
        <div className="p-12 text-center bg-white border-2 border-black">
          <PackageIcon className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
          <h3 className="font-black text-lg uppercase text-neutral-800">Belum Ada Paket Bundle</h3>
          <p className="text-sm text-neutral-500 max-w-sm mx-auto mt-1 mb-4">
            Klik tombol Tambah Paket untuk membuat penawaran bundle hemat pertama.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-brand-yellow border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0_0_#000]"
          >
            Tambah Paket Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBundles.map((b) => (
            <div
              key={b.id}
              className={`bg-white border-2 border-black shadow-[4px_4px_0_0_#000] flex flex-col justify-between transition-opacity ${
                !b.is_active ? 'opacity-60 bg-neutral-50' : ''
              }`}
            >
              <div>
                {/* Image and Header */}
                <div className="relative h-44 bg-neutral-200 border-b-2 border-black overflow-hidden">
                  {b.image ? (
                    <img
                      src={b.image}
                      alt={b.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-brand-red/10 text-brand-red">
                      <PackageIcon className="w-16 h-16 opacity-40" />
                    </div>
                  )}
                  {b.savings_badge && (
                    <span className="absolute top-2 left-2 px-2.5 py-1 bg-brand-red text-white text-xs font-black uppercase tracking-wider border-2 border-black shadow-[2px_2px_0_0_#000]">
                      {b.savings_badge}
                    </span>
                  )}
                  <span
                    className={`absolute top-2 right-2 px-2 py-0.5 text-xs font-black uppercase border-2 border-black ${
                      b.is_active ? 'bg-green-400 text-black' : 'bg-neutral-300 text-neutral-700'
                    }`}
                  >
                    {b.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>

                {/* Details */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-black text-lg uppercase text-neutral-900 leading-tight">
                      {b.name}
                    </h3>
                    {b.description && (
                      <p className="text-xs text-neutral-600 mt-1 line-clamp-2">{b.description}</p>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-2 pt-1 border-t border-dashed border-neutral-300">
                    <span className="font-black text-xl text-brand-red">
                      Rp{b.price.toLocaleString('id-ID')}
                    </span>
                    {b.original_price > b.price && (
                      <span className="text-xs font-bold text-neutral-400 line-through">
                        Rp{b.original_price.toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>

                  {/* Included Items */}
                  {b.items_included && b.items_included.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">
                        Isi Paket:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(b.items_included)
                          ? b.items_included
                          : String(b.items_included).split(',')
                        ).map((item, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-1.5 py-0.5 bg-neutral-100 border border-neutral-300 text-[10px] font-bold text-neutral-700"
                          >
                            ✓ {String(item).trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="p-3 bg-neutral-50 border-t-2 border-black flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleActive(b)}
                  className={`px-2.5 py-1 text-xs font-black uppercase border-2 border-black transition-colors ${
                    b.is_active
                      ? 'bg-neutral-200 hover:bg-neutral-300 text-neutral-700'
                      : 'bg-green-400 hover:bg-green-500 text-black'
                  }`}
                >
                  {b.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(b)}
                    className="p-1.5 bg-brand-yellow hover:bg-yellow-400 border-2 border-black transition-transform active:scale-95"
                    title="Edit Paket"
                  >
                    <EditIcon className="w-4 h-4 text-black" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(b.id)}
                    className="p-1.5 bg-brand-red hover:bg-red-700 border-2 border-black text-white transition-transform active:scale-95"
                    title="Hapus Paket"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-6 max-w-sm w-full shadow-[8px_8px_0_0_#000] space-y-4">
            <h3 className="font-black text-lg uppercase text-brand-red">Konfirmasi Hapus Paket</h3>
            <p className="text-sm text-neutral-700 font-medium">
              Apakah Anda yakin ingin menghapus paket bundle ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-neutral-200 border-2 border-black font-black uppercase text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 bg-brand-red text-white border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0_0_#000]"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-4 border-black p-6 max-w-lg w-full shadow-[8px_8px_0_0_#000] my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black">
              <h2 className="text-xl font-black uppercase text-neutral-900">
                {editingItem ? 'Edit Paket Bundle' : 'Tambah Paket Bundle'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-neutral-100 border-2 border-transparent hover:border-black"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Nama Paket Bundle *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Paket Duo Nagih"
                  className="w-full px-3 py-2 bg-white border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Deskripsi Singkat
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Kombinasi 2 mie pedas + es teh manis segar"
                  className="w-full px-3 py-2 bg-white border-2 border-black text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                    Harga Promo (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                    Harga Asli Coret (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.original_price}
                    onChange={(e) =>
                      setFormData({ ...formData, original_price: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-white border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                    Badge Hemat
                  </label>
                  <input
                    type="text"
                    value={formData.savings_badge}
                    onChange={(e) => setFormData({ ...formData, savings_badge: e.target.value })}
                    placeholder="HEMAT 20%"
                    className="w-full px-3 py-2 bg-white border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                    Urutan Tampil
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) =>
                      setFormData({ ...formData, sort_order: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-white border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Item Termasuk (Pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  value={formData.items_included_str}
                  onChange={(e) =>
                    setFormData({ ...formData, items_included_str: e.target.value })
                  }
                  placeholder="2x Mie Jebew Komplit, 2x Pangsit Goreng, 2x Es Teh"
                  className="w-full px-3 py-2 bg-white border-2 border-black text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>

              <ImagePickerInput
                label="Foto Paket Bundling"
                value={formData.image}
                onChange={(url) => setFormData({ ...formData, image: url })}
                placeholder="/rasa-mie/Original.jpeg"
                helperText="Upload poster / foto bundling atau pilih dari galeri."
              />

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="bundleActive"
                  checked={Boolean(formData.is_active)}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })
                  }
                  className="w-4 h-4 text-brand-red rounded border-2 border-black focus:ring-brand-yellow"
                />
                <label htmlFor="bundleActive" className="text-xs font-black uppercase text-neutral-800 cursor-pointer">
                  Aktifkan di Website Publik
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-black">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-neutral-200 border-2 border-black font-black uppercase text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 bg-brand-yellow hover:bg-yellow-400 border-2 border-black font-black uppercase text-xs shadow-[3px_3px_0_0_#000] disabled:opacity-50"
                >
                  {isSubmitting && <RefreshCwIcon className="w-4 h-4 animate-spin" />}
                  <span>{editingItem ? 'Simpan Perubahan' : 'Buat Paket'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
