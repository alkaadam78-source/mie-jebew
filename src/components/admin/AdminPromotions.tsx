import React, { useState, useEffect } from 'react';
import {
  apiGetPromotions,
  apiCreatePromotion,
  apiUpdatePromotion,
  apiDeletePromotion,
} from '../../services/api';
import { PromotionItem } from '../../types';
import { Plus, X, Trash2 } from '../ui/Icons';
import { ImagePickerInput } from './ImagePickerInput';

export const AdminPromotions: React.FC = () => {
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromotionItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<PromotionItem | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number | string>(15);
  const [minPurchase, setMinPurchase] = useState<number | string>(25000);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [usageLimit, setUsageLimit] = useState<number | string>('');
  const [image, setImage] = useState('');
  const [sortOrder, setSortOrder] = useState<number | string>(0);
  const [isActive, setIsActive] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await apiGetPromotions();
      setPromotions(res.promotions || []);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingPromo(null);
    setTitle('');
    setPromoCode('');
    setDescription('');
    setDiscountType('percentage');
    setDiscountValue(15);
    setMinPurchase(25000);
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
    setUsageLimit('');
    setImage('');
    setSortOrder(promotions.length + 1);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (p: PromotionItem) => {
    setEditingPromo(p);
    setTitle(p.title);
    setPromoCode(p.promo_code);
    setDescription(p.description || '');
    setDiscountType(p.discount_type);
    setDiscountValue(p.discount_value);
    setMinPurchase(p.min_purchase);
    setStartDate(p.start_date);
    setEndDate(p.end_date);
    setUsageLimit(p.usage_limit ?? '');
    setImage(p.image || '');
    setSortOrder(p.sort_order ?? 0);
    setIsActive(Boolean(p.is_active));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !promoCode.trim()) {
      setFeedback({ type: 'error', message: 'Judul dan kode promo wajib diisi.' });
      return;
    }
    if (endDate < startDate) {
      setFeedback({ type: 'error', message: 'Tanggal berakhir tidak boleh mendahului tanggal mulai.' });
      return;
    }

    try {
      setSubmitting(true);
      const payload: Partial<PromotionItem> = {
        title: title.trim(),
        promo_code: promoCode.trim().toUpperCase(),
        description: description.trim(),
        discount_type: discountType,
        discount_value: Number(discountValue),
        min_purchase: Number(minPurchase),
        start_date: startDate,
        end_date: endDate,
        usage_limit: usageLimit !== '' ? Number(usageLimit) : undefined,
        image: image.trim(),
        sort_order: Number(sortOrder),
        is_active: isActive ? 1 : 0,
      };

      if (editingPromo) {
        await apiUpdatePromotion(editingPromo.id, payload);
        setFeedback({ type: 'success', message: `Promo '${promoCode}' berhasil diperbarui.` });
      } else {
        await apiCreatePromotion(payload);
        setFeedback({ type: 'success', message: `Promo '${promoCode}' berhasil dibuat.` });
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (p: PromotionItem) => {
    const nextStatus = p.is_active ? 0 : 1;
    try {
      await apiUpdatePromotion(p.id, { is_active: nextStatus });
      setPromotions((prev) =>
        prev.map((it) => (it.id === p.id ? { ...it, is_active: nextStatus } : it))
      );
      setFeedback({
        type: 'success',
        message: `Status promo '${p.promo_code}' diubah menjadi ${nextStatus ? 'Aktif' : 'Nonaktif'}.`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      setSubmitting(true);
      await apiDeletePromotion(deleteConfirm.id);
      setFeedback({ type: 'success', message: `Promo '${deleteConfirm.promo_code}' berhasil dihapus.` });
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-black">Manajemen Promo & Diskon (Promotions)</h2>
          <p className="text-xs sm:text-sm font-bold text-gray-600">
            Atur kode voucher, persentase atau potongan langsung, serta masa berlaku promosi.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="bg-jebew-red hover:bg-red-700 text-white font-black text-xs sm:text-sm px-5 py-3 border-2 border-black rounded-xl shadow-brutal active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Buat Kode Promo Baru</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border-3 border-black rounded-3xl overflow-hidden shadow-brutal">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-cream-100 border-b-2 border-black text-xs font-black uppercase text-black">
                <th className="p-3.5">Kode Promo</th>
                <th className="p-3.5">Judul Promo</th>
                <th className="p-3.5">Nilai Diskon</th>
                <th className="p-3.5">Min. Belanja</th>
                <th className="p-3.5">Masa Berlaku</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-xs sm:text-sm font-bold">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500 font-bold">
                    Memuat data promosi...
                  </td>
                </tr>
              ) : promotions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500 font-bold">
                    Belum ada promo yang dibuat.
                  </td>
                </tr>
              ) : (
                promotions.map((p) => {
                  const active = Boolean(p.is_active);
                  const isPercentage = p.discount_type === 'percentage';
                  const today = new Date().toISOString().split('T')[0];
                  const isExpired = p.end_date < today;

                  return (
                    <tr key={p.id} className="hover:bg-cream-50 transition-colors">
                      <td className="p-3.5">
                        <span className="font-mono bg-yellow-100 border border-black px-2.5 py-1 rounded-md font-black text-black tracking-wider text-xs">
                          {p.promo_code}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="font-black text-black">{p.title}</div>
                        <div className="text-[11px] text-gray-500 line-clamp-1 max-w-[200px]">
                          {p.description || '-'}
                        </div>
                      </td>

                      <td className="p-3.5 font-black text-jebew-red">
                        {isPercentage
                          ? `${p.discount_value}% Diskon`
                          : `Potongan Rp${p.discount_value.toLocaleString('id-ID')}`}
                      </td>

                      <td className="p-3.5 font-bold text-gray-700">
                        Rp{p.min_purchase.toLocaleString('id-ID')}
                      </td>

                      <td className="p-3.5 text-xs">
                        <div className="font-bold text-black">{p.start_date} s/d {p.end_date}</div>
                        {isExpired && (
                          <span className="text-[10px] font-black text-red-600 block">
                            (Sudah Kedaluwarsa)
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(p)}
                          className={`px-3 py-1 rounded-full text-xs font-black border border-black cursor-pointer transition-all ${
                            active && !isExpired
                              ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {active && !isExpired ? '● Aktif' : '○ Nonaktif'}
                        </button>
                      </td>

                      <td className="p-3.5 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="px-3 py-1.5 bg-jebew-yellow hover:bg-yellow-400 border border-black rounded-lg text-xs font-black text-black cursor-pointer shadow-sm active:translate-x-0.5 active:translate-y-0.5"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(p)}
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

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative bg-white border-4 border-black rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-brutal-lg max-h-[90vh] overflow-y-auto my-8">
            <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-5">
              <h3 className="text-xl font-black text-black">
                {editingPromo ? 'Edit Kode Promo' : 'Buat Kode Promo Baru'}
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
                  Judul Promo *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Promo Weekend Spesial"
                  className="w-full px-3.5 py-2.5 bg-cream-50 border-2 border-black rounded-xl text-sm font-bold text-black focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-black mb-1">
                  Kode Promo Voucher (Huruf Kapital) *
                </label>
                <input
                  type="text"
                  required
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: JEBEW15"
                  className="w-full px-3.5 py-2.5 bg-cream-50 border-2 border-black rounded-xl text-sm font-mono font-black text-black focus:outline-none focus:bg-white uppercase tracking-wider"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-black mb-1">
                    Tipe Diskon *
                  </label>
                  <select
                    value={discountType}
                    onChange={(e: any) => setDiscountType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-cream-50 border-2 border-black rounded-xl text-sm font-bold text-black focus:outline-none focus:bg-white cursor-pointer"
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Nominal Tetap (Rp)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-black mb-1">
                    Nilai Diskon ({discountType === 'percentage' ? '%' : 'Rp'}) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-cream-50 border-2 border-black rounded-xl text-sm font-bold text-black focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-black mb-1">
                  Minimal Pembelian (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  value={minPurchase}
                  onChange={(e) => setMinPurchase(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-cream-50 border-2 border-black rounded-xl text-sm font-bold text-black focus:outline-none focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-black mb-1">
                    Tanggal Mulai Berlaku *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-cream-50 border-2 border-black rounded-xl text-sm font-bold text-black focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-black mb-1">
                    Tanggal Berakhir *
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-cream-50 border-2 border-black rounded-xl text-sm font-bold text-black focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <ImagePickerInput
                label="Banner / Gambar Promo"
                value={image}
                onChange={setImage}
                placeholder="/rasa-mie/Original.jpeg"
                helperText="Upload foto poster promo atau pilih dari galeri."
              />

              <div>
                <label className="block text-xs font-black uppercase text-black mb-1">
                  Deskripsi Promo
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Berlaku khusus untuk pemesanan via WhatsApp..."
                  className="w-full px-3.5 py-2.5 bg-cream-50 border-2 border-black rounded-xl text-sm font-bold text-black focus:outline-none focus:bg-white"
                />
              </div>

              <div className="p-4 bg-cream-50 border-2 border-black rounded-2xl">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-black text-emerald-800">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 accent-black"
                  />
                  <span>Promo Aktif & Bisa Digunakan oleh Pelanggan</span>
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
                  {submitting ? 'Menyimpan...' : 'Simpan Promo'}
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
              Hapus Promo '{deleteConfirm.promo_code}'?
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
