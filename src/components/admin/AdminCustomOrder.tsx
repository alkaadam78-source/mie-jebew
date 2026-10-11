import React, { useState, useEffect } from 'react';
import { CustomOptionItem } from '../../types';
import {
  apiGetCustomOptions,
  apiCreateCustomOption,
  apiUpdateCustomOption,
  apiDeleteCustomOption,
} from '../../services/api';
import {
  FlameIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  XIcon,
  RefreshCwIcon,
  SlidersIcon,
  StarIcon,
} from '../ui/Icons';

type GroupType = 'spice_level' | 'topping' | 'size' | 'addon';

export const AdminCustomOrder: React.FC = () => {
  const [activeTab, setActiveTab] = useState<GroupType>('spice_level');
  const [options, setOptions] = useState<CustomOptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CustomOptionItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    level_number: 1,
    badge: '',
    description: '',
    price_adjustment: 0,
    is_popular: 0,
    is_active: 1,
    sort_order: 1,
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchOptions = async () => {
    setLoading(true);
    try {
      const res = await apiGetCustomOptions(activeTab);
      setOptions(res.options || []);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat opsi kustom', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, [activeTab]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      level_number: activeTab === 'spice_level' ? options.length + 1 : null as any,
      badge: '',
      description: '',
      price_adjustment: 0,
      is_popular: 0,
      is_active: 1,
      sort_order: options.length + 1,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: CustomOptionItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      level_number: item.level_number || 1,
      badge: item.badge || '',
      description: item.description || '',
      price_adjustment: item.price_adjustment || 0,
      is_popular: item.is_popular ? 1 : 0,
      is_active: item.is_active ? 1 : 0,
      sort_order: item.sort_order || 1,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Nama opsi wajib diisi', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<CustomOptionItem> = {
        group_type: activeTab,
        name: formData.name.trim(),
        level_number: activeTab === 'spice_level' ? Number(formData.level_number) : null,
        badge: formData.badge.trim(),
        description: formData.description.trim(),
        price_adjustment: Number(formData.price_adjustment),
        is_popular: formData.is_popular ? 1 : 0,
        is_active: formData.is_active ? 1 : 0,
        sort_order: Number(formData.sort_order),
      };

      if (editingItem) {
        await apiUpdateCustomOption(editingItem.id, payload);
        showToast('Opsi berhasil diperbarui', 'success');
      } else {
        await apiCreateCustomOption(payload);
        showToast('Opsi baru berhasil ditambahkan', 'success');
      }
      setIsModalOpen(false);
      fetchOptions();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan opsi', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (item: CustomOptionItem) => {
    const nextStatus = item.is_active ? 0 : 1;
    try {
      await apiUpdateCustomOption(item.id, { is_active: nextStatus });
      setOptions((prev) =>
        prev.map((o) => (o.id === item.id ? { ...o, is_active: nextStatus } : o))
      );
      showToast(`Status ${item.name} berhasil diubah`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal mengubah status', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiDeleteCustomOption(id);
      showToast('Opsi berhasil dihapus', 'success');
      setDeleteConfirmId(null);
      fetchOptions();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus opsi', 'error');
    }
  };

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
            <SlidersIcon className="w-6 h-6 text-brand-red" />
            <h1 className="text-2xl font-black uppercase tracking-tight text-neutral-900">
              Custom Your Order Options
            </h1>
          </div>
          <p className="text-sm text-neutral-600 font-medium mt-1">
            Atur pilihan level pedas cabe asli, topping tambahan, dan addon kustomisasi pesanan
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchOptions}
            className="p-2.5 bg-neutral-100 hover:bg-neutral-200 border-2 border-black font-bold transition-transform active:scale-95"
            title="Refresh"
          >
            <RefreshCwIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-yellow hover:bg-yellow-400 border-2 border-black font-black uppercase text-sm shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Tambah Opsi</span>
          </button>
        </div>
      </div>

      {/* Group Navigation Tabs */}
      <div className="flex border-b-2 border-black bg-neutral-100 p-1 gap-1">
        <button
          onClick={() => setActiveTab('spice_level')}
          className={`flex items-center gap-2 px-4 py-2 font-black uppercase text-xs sm:text-sm border-2 transition-all ${
            activeTab === 'spice_level'
              ? 'bg-brand-red text-white border-black shadow-[3px_3px_0_0_#000]'
              : 'border-transparent text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          <FlameIcon className="w-4 h-4" />
          <span>Level Pedas ({activeTab === 'spice_level' ? options.length : '...'})</span>
        </button>

        <button
          onClick={() => setActiveTab('topping')}
          className={`flex items-center gap-2 px-4 py-2 font-black uppercase text-xs sm:text-sm border-2 transition-all ${
            activeTab === 'topping'
              ? 'bg-brand-red text-white border-black shadow-[3px_3px_0_0_#000]'
              : 'border-transparent text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          <PlusIcon className="w-4 h-4" />
          <span>Topping Tambahan ({activeTab === 'topping' ? options.length : '...'})</span>
        </button>

        <button
          onClick={() => setActiveTab('addon')}
          className={`flex items-center gap-2 px-4 py-2 font-black uppercase text-xs sm:text-sm border-2 transition-all ${
            activeTab === 'addon'
              ? 'bg-brand-red text-white border-black shadow-[3px_3px_0_0_#000]'
              : 'border-transparent text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          <SlidersIcon className="w-4 h-4" />
          <span>Add-on / Ekstra ({activeTab === 'addon' ? options.length : '...'})</span>
        </button>
      </div>

      {/* Options List */}
      {loading ? (
        <div className="p-12 text-center bg-white border-2 border-black">
          <RefreshCwIcon className="w-8 h-8 animate-spin mx-auto text-brand-red mb-2" />
          <p className="font-bold text-neutral-600">Memuat opsi kustomisasi...</p>
        </div>
      ) : options.length === 0 ? (
        <div className="p-12 text-center bg-white border-2 border-black">
          <SlidersIcon className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
          <h3 className="font-black text-lg uppercase text-neutral-800">Belum Ada Opsi</h3>
          <p className="text-sm text-neutral-500 max-w-sm mx-auto mt-1 mb-4">
            Tambahkan opsi untuk grup ini agar pelanggan dapat menyesuaikan pesanannya.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-brand-yellow border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0_0_#000]"
          >
            Tambah Opsi Pertama
          </button>
        </div>
      ) : (
        <div className="bg-white border-2 border-black shadow-[4px_4px_0_0_#000] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-100 border-b-2 border-black text-xs font-black uppercase text-neutral-700 tracking-wider">
                  <th className="py-3 px-4">Urutan</th>
                  <th className="py-3 px-4">Nama Opsi</th>
                  {activeTab === 'spice_level' && <th className="py-3 px-4">Level</th>}
                  <th className="py-3 px-4">Deskripsi / Cabe</th>
                  <th className="py-3 px-4">Tambahan Harga</th>
                  <th className="py-3 px-4">Badge</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-neutral-200 text-sm font-bold">
                {options.map((opt) => (
                  <tr
                    key={opt.id}
                    className={`hover:bg-neutral-50 transition-colors ${
                      !opt.is_active ? 'opacity-60 bg-neutral-50' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-neutral-500">#{opt.sort_order}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-900 font-black">{opt.name}</span>
                        {Boolean(opt.is_popular) && (
                          <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-brand-yellow border border-black text-[10px] font-black uppercase">
                            <StarIcon className="w-3 h-3 text-brand-red" />
                            Favorit
                          </span>
                        )}
                      </div>
                    </td>
                    {activeTab === 'spice_level' && (
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-neutral-200 border border-neutral-400 text-xs font-black">
                          Lv. {opt.level_number || 0}
                        </span>
                      </td>
                    )}
                    <td className="py-3 px-4 text-neutral-600 font-medium text-xs max-w-xs truncate">
                      {opt.description || '-'}
                    </td>
                    <td className="py-3 px-4">
                      {opt.price_adjustment > 0 ? (
                        <span className="text-brand-red font-black">
                          +Rp{opt.price_adjustment.toLocaleString('id-ID')}
                        </span>
                      ) : (
                        <span className="text-green-600 font-bold">Gratis (Rp0)</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {opt.badge ? (
                        <span className="px-2 py-0.5 bg-brand-red text-white text-[10px] font-black uppercase border border-black">
                          {opt.badge}
                        </span>
                      ) : (
                        <span className="text-neutral-400 font-normal text-xs">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(opt)}
                        className={`px-2 py-0.5 text-xs font-black uppercase border-2 border-black transition-colors ${
                          opt.is_active
                            ? 'bg-green-400 hover:bg-green-500 text-black'
                            : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-600'
                        }`}
                      >
                        {opt.is_active ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(opt)}
                          className="p-1.5 bg-brand-yellow hover:bg-yellow-400 border-2 border-black transition-transform active:scale-95"
                          title="Edit Opsi"
                        >
                          <EditIcon className="w-4 h-4 text-black" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(opt.id)}
                          className="p-1.5 bg-brand-red hover:bg-red-700 border-2 border-black text-white transition-transform active:scale-95"
                          title="Hapus Opsi"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-6 max-w-sm w-full shadow-[8px_8px_0_0_#000] space-y-4">
            <h3 className="font-black text-lg uppercase text-brand-red">Konfirmasi Hapus Opsi</h3>
            <p className="text-sm text-neutral-700 font-medium">
              Apakah Anda yakin ingin menghapus opsi kustomisasi ini?
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
          <div className="bg-white border-4 border-black p-6 max-w-md w-full shadow-[8px_8px_0_0_#000] my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black">
              <h2 className="text-xl font-black uppercase text-neutral-900">
                {editingItem ? 'Edit Opsi Kustom' : 'Tambah Opsi Kustom'}
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
                  Nama Opsi *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={
                    activeTab === 'spice_level'
                      ? 'Contoh: Level 3 (Goyang Lidah)'
                      : 'Contoh: Pangsit Krispi Jumbo'
                  }
                  className="w-full px-3 py-2 bg-white border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>

              {activeTab === 'spice_level' && (
                <div>
                  <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                    Nomor Level Pedas (0, 1, 2, ...)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.level_number || 0}
                    onChange={(e) =>
                      setFormData({ ...formData, level_number: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-white border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Deskripsi / Keterangan Tambahan
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={
                    activeTab === 'spice_level'
                      ? 'Contoh: 15 Cabe Rawit Merah Asli'
                      : 'Contoh: 3 pcs kulit pangsit renyah gurih'
                  }
                  className="w-full px-3 py-2 bg-white border-2 border-black text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                    Tambahan Harga (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.price_adjustment}
                    onChange={(e) =>
                      setFormData({ ...formData, price_adjustment: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-white border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  />
                  <p className="text-[10px] text-neutral-500 font-medium mt-0.5">
                    0 = Gratis / termasuk
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                    Badge Label
                  </label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="Contoh: BEST SELLER"
                    className="w-full px-3 py-2 bg-white border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Urutan Tampil (Sort Order)
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

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.is_popular)}
                    onChange={(e) =>
                      setFormData({ ...formData, is_popular: e.target.checked ? 1 : 0 })
                    }
                    className="w-4 h-4 text-brand-red rounded border-2 border-black focus:ring-brand-yellow"
                  />
                  <span className="text-xs font-black uppercase text-neutral-800">
                    Opsi Populer / Favorit
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.is_active)}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })
                    }
                    className="w-4 h-4 text-brand-red rounded border-2 border-black focus:ring-brand-yellow"
                  />
                  <span className="text-xs font-black uppercase text-neutral-800">
                    Aktif
                  </span>
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
                  <span>{editingItem ? 'Simpan Perubahan' : 'Buat Opsi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
