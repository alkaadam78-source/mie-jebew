import React, { useState, useEffect } from 'react';
import {
  apiGetMenuItems,
  apiCreateMenuItem,
  apiUpdateMenuItem,
  apiDeleteMenuItem,
  apiGetCategories,
} from '../../services/api';
import { MenuItem, Category } from '../../types';
import { Plus, X, Trash2 } from '../ui/Icons';
import { ImagePickerInput } from './ImagePickerInput';

export const AdminMenu: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<MenuItem | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('mie');
  const [price, setPrice] = useState<number | string>(15000);
  const [salePrice, setSalePrice] = useState<number | string>('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [badge, setBadge] = useState('');
  const [isSpicySelectable, setIsSpicySelectable] = useState(true);
  const [isPopular, setIsPopular] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [ingredients, setIngredients] = useState('');
  const [sortOrder, setSortOrder] = useState<number | string>(0);
  const [isActive, setIsActive] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [menuRes, catRes] = await Promise.all([
        apiGetMenuItems({
          search: search || undefined,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
        }),
        apiGetCategories(),
      ]);
      setItems(menuRes.items || []);
      setCategories(catRes.categories || []);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedCategory, selectedStatus]);

  const openCreateModal = () => {
    setEditingItem(null);
    setName('');
    setCategoryId(categories[0]?.id || 'mie');
    setPrice(15000);
    setSalePrice('');
    setDescription('');
    setImage('');
    setBadge('');
    setIsSpicySelectable(true);
    setIsPopular(false);
    setIsBestSeller(false);
    setIngredients('');
    setSortOrder(items.length + 1);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategoryId(item.category_id || (item.category as string) || 'mie');
    setPrice(item.price);
    setSalePrice(item.sale_price !== null && item.sale_price !== undefined ? item.sale_price : '');
    setDescription(item.description || '');
    setImage(item.image || '');
    setBadge(item.badge || '');
    setIsSpicySelectable(Boolean(item.is_spicy_selectable ?? item.isSpicySelectable));
    setIsPopular(Boolean(item.is_popular ?? item.isPopular));
    setIsBestSeller(Boolean(item.is_best_seller ?? item.isBestSeller));
    setIngredients(item.ingredients || '');
    setSortOrder(item.sort_order ?? 0);
    setIsActive(Boolean(item.is_active ?? true));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFeedback({ type: 'error', message: 'Nama menu wajib diisi.' });
      return;
    }
    if (Number(price) < 0) {
      setFeedback({ type: 'error', message: 'Harga tidak boleh negatif.' });
      return;
    }

    try {
      setSubmitting(true);
      const payload: Partial<MenuItem> = {
        name: name.trim(),
        category_id: categoryId,
        price: Number(price),
        sale_price: salePrice !== '' ? Number(salePrice) : null,
        description: description.trim(),
        image: image.trim(),
        badge: badge.trim(),
        is_spicy_selectable: isSpicySelectable ? 1 : 0,
        is_popular: isPopular ? 1 : 0,
        is_best_seller: isBestSeller ? 1 : 0,
        ingredients: ingredients.trim(),
        sort_order: Number(sortOrder),
        is_active: isActive ? 1 : 0,
      };

      if (editingItem) {
        await apiUpdateMenuItem(editingItem.id, payload);
        setFeedback({ type: 'success', message: `Menu '${name}' berhasil diperbarui.` });
      } else {
        await apiCreateMenuItem(payload);
        setFeedback({ type: 'success', message: `Menu '${name}' berhasil ditambahkan ke database.` });
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (item: MenuItem) => {
    const nextStatus = item.is_active ? 0 : 1;
    try {
      await apiUpdateMenuItem(item.id, { is_active: nextStatus });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_active: nextStatus } : i))
      );
      setFeedback({
        type: 'success',
        message: `Status menu '${item.name}' diubah menjadi ${nextStatus ? 'Aktif' : 'Nonaktif'}.`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmItem) return;
    try {
      setSubmitting(true);
      await apiDeleteMenuItem(deleteConfirmItem.id);
      setFeedback({ type: 'success', message: `Menu '${deleteConfirmItem.name}' berhasil dihapus.` });
      setDeleteConfirmItem(null);
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
          <h2 className="text-2xl font-black text-black">Manajemen Menu (Our Menu)</h2>
          <p className="text-xs sm:text-sm font-bold text-gray-600">
            Kendalikan harga, status aktif, gambar, dan detail menu secara langsung.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="bg-jebew-red hover:bg-red-700 text-white font-black text-xs sm:text-sm px-5 py-3 border-2 border-black rounded-xl shadow-brutal active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Tambah Menu Baru</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border-3 border-black rounded-2xl p-4 shadow-brutal flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama menu atau bumbu..."
            className="w-full px-4 py-2.5 bg-cream-50 border-2 border-black rounded-xl text-xs sm:text-sm font-bold text-black placeholder-gray-400 focus:outline-none focus:bg-white"
          />
        </div>

        {/* Category Dropdown */}
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

        {/* Status Dropdown */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2.5 bg-cream-50 border-2 border-black rounded-xl text-xs sm:text-sm font-black text-black cursor-pointer"
        >
          <option value="all">Semua Status</option>
          <option value="active">Hanya Aktif</option>
          <option value="inactive">Hanya Nonaktif</option>
        </select>
      </div>

      {/* Menu Table / Cards */}
      <div className="bg-white border-3 border-black rounded-3xl overflow-hidden shadow-brutal">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-cream-100 border-b-2 border-black text-xs font-black uppercase text-black">
                <th className="p-3.5">Menu</th>
                <th className="p-3.5">Kategori</th>
                <th className="p-3.5">Harga Normal</th>
                <th className="p-3.5">Harga Promo</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Badges</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-xs sm:text-sm font-bold">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500 font-bold">
                    Memuat data menu...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500 font-bold">
                    Tidak ada menu yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const active = Boolean(item.is_active);
                  return (
                    <tr key={item.id} className="hover:bg-cream-50 transition-colors">
                      
                      {/* Name & Photo */}
                      <td className="p-3.5 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 border border-black overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl">🍜</span>
                          )}
                        </div>
                        <div>
                          <div className="font-black text-black">{item.name}</div>
                          <div className="text-[11px] text-gray-500 line-clamp-1 max-w-[200px]">
                            {item.description || '-'}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3.5 font-bold text-gray-700">
                        {item.category_id || item.category}
                      </td>

                      {/* Price */}
                      <td className="p-3.5 font-black text-black">
                        Rp{item.price.toLocaleString('id-ID')}
                      </td>

                      {/* Sale Price */}
                      <td className="p-3.5">
                        {item.sale_price ? (
                          <span className="text-emerald-700 font-black">
                            Rp{item.sale_price.toLocaleString('id-ID')}
                          </span>
                        ) : (
                          <span className="text-gray-400 font-medium">-</span>
                        )}
                      </td>

                      {/* Active Status Toggle */}
                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(item)}
                          className={`px-3 py-1 rounded-full text-xs font-black border border-black cursor-pointer transition-all ${
                            active
                              ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {active ? '● Aktif' : '○ Nonaktif'}
                        </button>
                      </td>

                      {/* Badges */}
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1">
                          {item.is_best_seller ? (
                            <span className="text-[10px] bg-red-100 text-red-800 font-black px-1.5 py-0.5 rounded border border-red-300">
                              Best Seller
                            </span>
                          ) : null}
                          {item.is_popular ? (
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-black px-1.5 py-0.5 rounded border border-amber-300">
                              Popular
                            </span>
                          ) : null}
                          {item.badge ? (
                            <span className="text-[10px] bg-yellow-100 text-yellow-900 font-black px-1.5 py-0.5 rounded border border-yellow-300">
                              {item.badge}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="px-3 py-1.5 bg-jebew-yellow hover:bg-yellow-400 border border-black rounded-lg text-xs font-black text-black cursor-pointer shadow-sm active:translate-x-0.5 active:translate-y-0.5"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmItem(item)}
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

      {/* Edit / Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative bg-white border-4 border-black rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-brutal-lg max-h-[90vh] overflow-y-auto my-8">
            
            <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-5">
              <h3 className="text-xl font-black text-black">
                {editingItem ? 'Edit Data Menu' : 'Tambah Menu Baru'}
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
                  Nama Menu *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Mie Jebew Kuah Pedas"
                  className="w-full px-3.5 py-2.5 bg-cream-50 border-2 border-black rounded-xl text-sm font-bold text-black focus:outline-none focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-black mb-1">
                    Kategori *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-cream-50 border-2 border-black rounded-xl text-sm font-bold text-black focus:outline-none focus:bg-white cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-black mb-1">
                    Harga Normal (Rp) *
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
                    Harga Promo / Coret (Opsional)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder="Kosongkan jika tidak ada promo"
                    className="w-full px-3.5 py-2.5 bg-cream-50 border-2 border-black rounded-xl text-sm font-bold text-black focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-black mb-1">
                  Deskripsi Menu
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Penjelasan kelezatan rasa mie, bumbu chili oil, dan isian..."
                  className="w-full px-3.5 py-2.5 bg-cream-50 border-2 border-black rounded-xl text-sm font-bold text-black focus:outline-none focus:bg-white"
                />
              </div>

              <ImagePickerInput
                label="Foto Menu Makanan"
                value={image}
                onChange={setImage}
                placeholder="/rasa-mie/Original.jpeg"
                helperText="Upload langsung dari HP/Laptop atau pilih dari galeri. Kosongkan untuk menampilkan kartu misteri '?'."
              />

              <div>
                <label className="block text-xs font-black uppercase text-black mb-1">
                  Badge Khusus
                </label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="Contoh: 🔥 ORIGINAL JEBEW atau 🧀 CHEESE MELT"
                  className="w-full px-3.5 py-2.5 bg-cream-50 border-2 border-black rounded-xl text-sm font-bold text-black focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-black mb-1">
                  Bahan / Komposisi (Ingredients)
                </label>
                <input
                  type="text"
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  placeholder="Contoh: Mie kenyal, chili oil, ayam cincang, pangsit goreng"
                  className="w-full px-3.5 py-2.5 bg-cream-50 border-2 border-black rounded-xl text-sm font-bold text-black focus:outline-none focus:bg-white"
                />
              </div>

              {/* Checkboxes */}
              <div className="p-4 bg-cream-50 border-2 border-black rounded-2xl grid grid-cols-2 gap-3 text-xs font-black">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSpicySelectable}
                    onChange={(e) => setIsSpicySelectable(e.target.checked)}
                    className="w-4 h-4 accent-black"
                  />
                  <span>Bisa Pilih Level Pedas</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPopular}
                    onChange={(e) => setIsPopular(e.target.checked)}
                    className="w-4 h-4 accent-black"
                  />
                  <span>Tandai Menu Populer</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBestSeller}
                    onChange={(e) => setIsBestSeller(e.target.checked)}
                    className="w-4 h-4 accent-black"
                  />
                  <span>Tandai Best Seller</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-emerald-800">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 accent-black"
                  />
                  <span>Status Aktif (Tampil di Web)</span>
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
                  {submitting ? 'Menyimpan...' : 'Simpan Menu'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-brutal-lg text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 border-2 border-black mx-auto flex items-center justify-center text-red-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-black">
              Hapus Menu '{deleteConfirmItem.name}'?
            </h3>
            <p className="text-xs font-bold text-gray-600">
              Tindakan ini tidak dapat dibatalkan. Menu akan dihapus dari database.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
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
