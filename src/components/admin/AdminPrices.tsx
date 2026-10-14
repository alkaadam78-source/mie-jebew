import React, { useState, useEffect } from 'react';
import {
  apiGetMenuItems,
  apiUpdateMenuItem,
  apiCreateMenuItem,
  apiDeleteMenuItem,
  apiGetCategories,
} from '../../services/api';
import { MenuItem, Category } from '../../types';
import { Plus, Trash2, X, RefreshCwIcon, CameraIcon, CheckIcon } from '../ui/Icons';
import { ImagePickerInput } from './ImagePickerInput';

export const AdminPrices: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Local editing states for quick table editing (price & sale_price allow string "" for clean deletion)
  const [editedPrices, setEditedPrices] = useState<
    Record<string, { price: number | string; sale_price: number | string | null; name: string; image: string }>
  >({});

  // Quick Photo Edit Modal
  const [photoEditItem, setPhotoEditItem] = useState<MenuItem | null>(null);
  const [tempPhotoUrl, setTempPhotoUrl] = useState('');

  // Add New Menu Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('mie');
  const [newPrice, setNewPrice] = useState<number | string>(10000);
  const [newSalePrice, setNewSalePrice] = useState<number | string>('');
  const [newImage, setNewImage] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newIngredients, setNewIngredients] = useState('');
  const [newBadge, setNewBadge] = useState('🔥 SERBA 10K');
  const [newIsSpicy, setNewIsSpicy] = useState(true);

  // Delete confirm
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mRes, cRes] = await Promise.all([
        apiGetMenuItems({
          search: search || undefined,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
        }),
        apiGetCategories(),
      ]);

      setMenuItems(mRes.items || []);
      setCategories(cRes.categories || []);

      const initialEdits: Record<string, { price: number | string; sale_price: number | string | null; name: string; image: string }> = {};
      (mRes.items || []).forEach((m) => {
        initialEdits[m.id] = {
          price: m.price,
          sale_price: m.sale_price ?? '',
          name: m.name,
          image: m.image || '',
        };
      });
      setEditedPrices(initialEdits);
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Gagal memuat data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedCategory]);

  // Handle direct text typing & backspacing without coercing "" to 0
  const handlePriceChange = (id: string, rawValue: string) => {
    setEditedPrices((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        price: rawValue,
      },
    }));
  };

  const handleSalePriceChange = (id: string, rawValue: string) => {
    setEditedPrices((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        sale_price: rawValue,
      },
    }));
  };

  const handleNameChange = (id: string, newName: string) => {
    setEditedPrices((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        name: newName,
      },
    }));
  };

  const handleSaveItemPrice = async (id: string) => {
    const edit = editedPrices[id];
    if (!edit) return;

    const parsedPrice = edit.price === '' ? 0 : Number(edit.price);
    const parsedSalePrice = edit.sale_price === null || edit.sale_price === '' ? null : Number(edit.sale_price);

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setFeedback({ type: 'error', message: 'Harga tidak boleh negatif atau bukan angka.' });
      return;
    }

    try {
      setSavingId(id);
      await apiUpdateMenuItem(id, {
        name: edit.name.trim() || undefined,
        price: parsedPrice,
        sale_price: parsedSalePrice,
        image: edit.image || undefined,
      });

      setFeedback({
        type: 'success',
        message: `Menu '${edit.name}' berhasil diperbarui! Harga Rp${parsedPrice.toLocaleString('id-ID')} langsung aktif di website.`,
      });
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal memperbarui harga.' });
    } finally {
      setSavingId(null);
    }
  };

  const openPhotoModal = (item: MenuItem) => {
    const currentEdit = editedPrices[item.id];
    setPhotoEditItem(item);
    setTempPhotoUrl(currentEdit?.image || item.image || '');
  };

  const savePhotoModal = async () => {
    if (!photoEditItem) return;
    try {
      setSavingId(photoEditItem.id);
      await apiUpdateMenuItem(photoEditItem.id, {
        image: tempPhotoUrl.trim(),
      });

      setEditedPrices((prev) => ({
        ...prev,
        [photoEditItem.id]: {
          ...prev[photoEditItem.id],
          image: tempPhotoUrl.trim(),
        },
      }));

      setFeedback({
        type: 'success',
        message: `Foto menu '${photoEditItem.name}' berhasil diubah dan langsung terintegrasi ke website publik!`,
      });
      setPhotoEditItem(null);
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal mengubah foto.' });
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateNewMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setFeedback({ type: 'error', message: 'Nama menu wajib diisi.' });
      return;
    }
    const parsedNewPrice = Number(newPrice);
    if (isNaN(parsedNewPrice) || parsedNewPrice <= 0) {
      setFeedback({ type: 'error', message: 'Harga normal harus lebih dari Rp 0.' });
      return;
    }

    try {
      setSubmittingAdd(true);
      await apiCreateMenuItem({
        name: newName.trim(),
        category_id: newCategoryId,
        price: parsedNewPrice,
        sale_price: newSalePrice !== '' ? Number(newSalePrice) : null,
        image: newImage.trim(),
        description: newDescription.trim() || 'Menu spesial racikan khas Mie Jebew.',
        ingredients: newIngredients.trim(),
        badge: newBadge.trim(),
        is_spicy_selectable: newIsSpicy ? 1 : 0,
        is_popular: 1,
        is_best_seller: 0,
        sort_order: menuItems.length + 1,
        is_active: 1,
      });

      setFeedback({
        type: 'success',
        message: `Menu baru '${newName}' berhasil ditambahkan! Langsung terintegrasi ke website publik.`,
      });

      // Reset Form & Close
      setIsAddModalOpen(false);
      setNewName('');
      setNewPrice(10000);
      setNewSalePrice('');
      setNewImage('');
      setNewDescription('');
      setNewIngredients('');
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal menambahkan menu baru.' });
    } finally {
      setSubmittingAdd(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await apiDeleteMenuItem(id);
      setFeedback({ type: 'success', message: 'Menu berhasil dihapus dari sistem.' });
      setDeleteConfirmId(null);
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal menghapus menu.' });
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
            className="text-xs underline cursor-pointer ml-4"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Header Banner & Action Button */}
      <div className="bg-white border-3 border-black rounded-3xl p-6 shadow-brutal flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-jebew-yellow border-2 border-black px-3 py-1 rounded-full text-xs font-black shadow-brutal-xs uppercase mb-2">
            <span>💰</span>
            <span>PRICE & MENU MANAGEMENT</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-black">
            Manajemen Harga & Foto Menu
          </h2>
          <p className="text-xs sm:text-sm font-bold text-gray-600 mt-1 max-w-xl">
            Atur harga normal, diskon promo, upload/ganti foto produk (via local file, galeri, atau link URL), dan tambah menu baru yang otomatis terintegrasi realtime ke website publik.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-3 bg-jebew-red hover:bg-red-700 text-white font-black text-xs sm:text-sm border-2 border-black rounded-xl shadow-brutal active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap self-stretch md:self-auto justify-center"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Tambah Menu Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border-3 border-black rounded-2xl p-4 shadow-brutal flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama menu..."
            className="w-full px-4 py-2.5 bg-cream-50 border-2 border-black rounded-xl text-xs sm:text-sm font-bold text-black placeholder-gray-400 focus:outline-none focus:bg-white"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2.5 bg-cream-50 border-2 border-black rounded-xl text-xs sm:text-sm font-black text-black cursor-pointer"
        >
          <option value="all">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white border-3 border-black rounded-3xl shadow-brutal">
          <RefreshCwIcon className="w-8 h-8 animate-spin mx-auto text-brand-red mb-2" />
          <p className="font-bold text-neutral-600">Memuat data harga & menu...</p>
        </div>
      ) : (
        /* Menu Items Table */
        <div className="bg-white border-3 border-black rounded-3xl overflow-hidden shadow-brutal space-y-4 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-black flex items-center gap-2">
              <span>🍜</span>
              <span>Daftar Menu Makanan & Minuman</span>
            </h3>
            <span className="text-xs font-black bg-cream-100 border border-black px-2.5 py-1 rounded-lg">
              Total: {menuItems.length} Menu
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-cream-100 border-b-2 border-black text-xs font-black uppercase text-black">
                  <th className="p-3">Foto & Menu</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3">Harga Normal (Rp)</th>
                  <th className="p-3">Harga Promo (Rp)</th>
                  <th className="p-3">Diskon (%)</th>
                  <th className="p-3">Status Publik</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-xs sm:text-sm font-bold">
                {menuItems.map((m) => {
                  const edit = editedPrices[m.id] || {
                    price: m.price,
                    sale_price: m.sale_price ?? '',
                    name: m.name,
                    image: m.image || '',
                  };

                  const numPrice = edit.price === '' ? 0 : Number(edit.price);
                  const numSalePrice = edit.sale_price === null || edit.sale_price === '' ? null : Number(edit.sale_price);

                  const discountPct =
                    numSalePrice && numPrice > numSalePrice
                      ? Math.round(((numPrice - numSalePrice) / numPrice) * 100)
                      : 0;

                  const isReady = Boolean(edit.image && edit.name !== '???' && numPrice > 0);

                  return (
                    <tr key={m.id} className="hover:bg-cream-50 transition-colors">
                      {/* Photo & Name */}
                      <td className="p-3 flex items-center gap-3">
                        <div className="relative group/photo flex-shrink-0">
                          <div className="w-12 h-12 rounded-xl bg-amber-100 border-2 border-black overflow-hidden flex items-center justify-center shadow-brutal-xs">
                            {edit.image ? (
                              <img src={edit.image} alt={edit.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-black text-xl text-gray-500">?</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => openPhotoModal(m)}
                            title="Klik untuk ganti / upload foto"
                            className="absolute -bottom-1 -right-1 bg-white border border-black p-1 rounded-full shadow-xs hover:bg-yellow-300 transition-colors cursor-pointer"
                          >
                            <CameraIcon className="w-3 h-3 text-black" />
                          </button>
                        </div>

                        <div className="space-y-1">
                          <input
                            type="text"
                            value={edit.name}
                            onChange={(e) => handleNameChange(m.id, e.target.value)}
                            className="font-black text-sm text-black bg-transparent border-b border-dashed border-gray-300 hover:border-black focus:border-black focus:bg-white px-1 py-0.5 rounded focus:outline-none max-w-[200px]"
                          />
                          <div>
                            <button
                              type="button"
                              onClick={() => openPhotoModal(m)}
                              className="text-[10px] font-black text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>{edit.image ? '🖼️ Ganti Foto' : '➕ Pasang Foto'}</span>
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3 font-bold text-gray-700">
                        <span className="bg-gray-100 border border-gray-300 px-2 py-0.5 rounded text-[11px] font-black uppercase">
                          {m.category_id || (m as any).category || 'mie'}
                        </span>
                      </td>

                      {/* Normal Price - Allows clean Backspace/Delete */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-500 font-bold text-xs">Rp</span>
                          <input
                            type="number"
                            min={0}
                            step={500}
                            placeholder="0"
                            value={edit.price}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => handlePriceChange(m.id, e.target.value)}
                            className="w-28 px-2.5 py-1.5 bg-cream-50 border-2 border-black rounded-lg font-black text-sm text-black focus:outline-none focus:bg-white"
                          />
                        </div>
                      </td>

                      {/* Promo Price - Allows clean Backspace/Delete */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-500 font-bold text-xs">Rp</span>
                          <input
                            type="number"
                            min={0}
                            step={500}
                            placeholder="Normal"
                            value={edit.sale_price ?? ""}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => handleSalePriceChange(m.id, e.target.value)}
                            className="w-28 px-2.5 py-1.5 bg-cream-50 border-2 border-black rounded-lg font-black text-sm text-black focus:outline-none focus:bg-white"
                          />
                        </div>
                      </td>

                      {/* Discount % */}
                      <td className="p-3">
                        {discountPct > 0 ? (
                          <span className="bg-red-100 text-red-800 font-black px-2 py-0.5 rounded border border-red-300 text-xs whitespace-nowrap">
                            Hemat {discountPct}%
                          </span>
                        ) : (
                          <span className="text-gray-400 font-normal text-xs">-</span>
                        )}
                      </td>

                      {/* Public Status */}
                      <td className="p-3">
                        {isReady ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded text-[10px] font-black uppercase whitespace-nowrap">
                            <CheckIcon className="w-3 h-3" />
                            READY ORDER
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-black uppercase whitespace-nowrap">
                            <span>❓</span>
                            SEGERA HADIR
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          disabled={savingId === m.id}
                          onClick={() => handleSaveItemPrice(m.id)}
                          className="px-3.5 py-1.5 bg-jebew-yellow hover:bg-yellow-400 active:translate-x-0.5 active:translate-y-0.5 border-2 border-black rounded-xl text-xs font-black text-black cursor-pointer shadow-brutal-xs disabled:opacity-50 transition-all"
                        >
                          {savingId === m.id ? 'Menyimpan...' : 'Simpan'}
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(m.id)}
                          className="p-1.5 bg-white hover:bg-red-50 text-red-600 border border-black rounded-lg text-xs cursor-pointer inline-flex items-center justify-center"
                          title="Hapus Menu"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QUICK PHOTO MODAL */}
      {photoEditItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-brutal max-w-md w-full space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div>
                <h3 className="font-black text-lg text-black">Kelola Foto Menu</h3>
                <p className="text-xs text-gray-500 font-bold">{photoEditItem.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setPhotoEditItem(null)}
                className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center hover:bg-gray-100 font-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <ImagePickerInput
                label="Foto Produk (Local Upload / Galeri / Link URL)"
                value={tempPhotoUrl}
                onChange={(url) => setTempPhotoUrl(url)}
                helperText="Unggah dari perangkat lokal (HP/PC), pilih dari galeri, atau paste link pemanggil gambar. Foto akan tersimpan permanen di server!"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-black">
              <button
                type="button"
                onClick={() => setPhotoEditItem(null)}
                className="px-4 py-2 border-2 border-black rounded-xl text-xs font-black hover:bg-gray-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={savingId === photoEditItem.id}
                onClick={savePhotoModal}
                className="px-5 py-2 bg-jebew-yellow hover:bg-yellow-400 active:translate-x-0.5 active:translate-y-0.5 border-2 border-black rounded-xl text-xs font-black shadow-brutal-xs cursor-pointer"
              >
                {savingId === photoEditItem.id ? 'Menyimpan...' : 'Simpan Foto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW MENU MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-brutal max-w-xl w-full my-8 space-y-4 animate-scale-in">
            
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div>
                <div className="inline-flex items-center gap-1 bg-jebew-yellow border border-black px-2 py-0.5 rounded text-[10px] font-black uppercase mb-1">
                  <span>✨</span>
                  <span>MENU BARU</span>
                </div>
                <h3 className="font-black text-xl text-black">Tambah Menu Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center hover:bg-gray-100 font-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewMenu} className="space-y-4">
              
              {/* Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-black mb-1">
                    Nama Menu <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Contoh: Mie Jebew Kuah Pedas"
                    className="w-full px-3 py-2 bg-cream-50 border-2 border-black rounded-xl text-xs font-bold text-black focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-black mb-1">
                    Kategori <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-cream-50 border-2 border-black rounded-xl text-xs font-black text-black cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price & Promo Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-black mb-1">
                    Harga Normal (Rp) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={500}
                    placeholder="Contoh: 10000"
                    value={newPrice}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-cream-50 border-2 border-black rounded-xl text-xs font-black text-black focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-black mb-1">
                    Harga Promo / Diskon (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    placeholder="Kosongkan jika tidak promo"
                    value={newSalePrice}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setNewSalePrice(e.target.value)}
                    className="w-full px-3 py-2 bg-cream-50 border-2 border-black rounded-xl text-xs font-black text-black focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              {/* Photo Input with ImagePickerInput */}
              <div className="bg-cream-50 border-2 border-black rounded-2xl p-3">
                <ImagePickerInput
                  label="Foto Menu (Unggah File Local / Galeri / Link URL)"
                  value={newImage}
                  onChange={(url) => setNewImage(url)}
                  helperText="Pilih file gambar dari HP/laptop kamu, ambil dari galeri, atau masukkan URL link foto."
                />
              </div>

              {/* Description & Ingredients */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-black text-black mb-1">
                    Deskripsi Singkat Menu
                  </label>
                  <textarea
                    rows={2}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Jelaskan cita rasa bumbu, kelezatan mie, atau porsinya..."
                    className="w-full px-3 py-2 bg-cream-50 border-2 border-black rounded-xl text-xs font-bold text-black focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-black mb-1">
                    Topping & Bahan Termasuk (Ingredients)
                  </label>
                  <input
                    type="text"
                    value={newIngredients}
                    onChange={(e) => setNewIngredients(e.target.value)}
                    placeholder="Contoh: Mie kenyal, chili oil, ayam tabur, pangsit goreng, bakso sapi"
                    className="w-full px-3 py-2 bg-cream-50 border-2 border-black rounded-xl text-xs font-bold text-black focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              {/* Badges & Spicy Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-black text-black mb-1">
                    Badge Tampilan
                  </label>
                  <input
                    type="text"
                    value={newBadge}
                    onChange={(e) => setNewBadge(e.target.value)}
                    placeholder="Contoh: 🔥 SERBA 10K / BEST SELLER"
                    className="w-full px-3 py-2 bg-cream-50 border-2 border-black rounded-xl text-xs font-bold text-black focus:outline-none focus:bg-white"
                  />
                </div>

                <div className="pt-4 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_spicy"
                    checked={newIsSpicy}
                    onChange={(e) => setNewIsSpicy(e.target.checked)}
                    className="w-4 h-4 border-2 border-black rounded accent-jebew-red cursor-pointer"
                  />
                  <label htmlFor="is_spicy" className="text-xs font-black text-black cursor-pointer select-none">
                    Bisa Pilih Level Pedas (0 - 5)
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-black">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 border-2 border-black rounded-xl text-xs font-black hover:bg-gray-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="px-6 py-2.5 bg-jebew-red hover:bg-red-700 text-white font-black text-xs border-2 border-black rounded-xl shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 cursor-pointer disabled:opacity-50 transition-all"
                >
                  {submittingAdd ? 'Menyimpan Menu...' : 'Simpan & Rilis Menu'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-brutal max-w-sm w-full space-y-4 animate-scale-in text-center">
            <div className="w-12 h-12 bg-red-100 border-2 border-black rounded-full flex items-center justify-center mx-auto text-red-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-black text-lg text-black">Hapus Menu Ini?</h3>
            <p className="text-xs font-bold text-gray-600">
              Menu ini akan dihapus dari database dan tidak akan tampil lagi di website publik.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border-2 border-black rounded-xl text-xs font-black hover:bg-gray-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteItem(deleteConfirmId)}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white border-2 border-black rounded-xl text-xs font-black shadow-brutal-xs cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
