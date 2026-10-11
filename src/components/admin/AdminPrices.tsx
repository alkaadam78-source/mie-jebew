import React, { useState, useEffect } from 'react';
import {
  apiGetMenuItems,
  apiUpdateMenuItem,
  apiGetBottles,
  apiUpdateBottle,
} from '../../services/api';
import { MenuItem, ProductBottle } from '../../types';
import { Flame, RefreshCwIcon } from '../ui/Icons';

export const AdminPrices: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [bottles, setBottles] = useState<ProductBottle[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Local editing states
  const [editedPrices, setEditedPrices] = useState<
    Record<string, { price: number; sale_price: number | null }>
  >({});

  const loadData = async () => {
    try {
      setLoading(true);
      const [mRes, bRes] = await Promise.all([apiGetMenuItems(), apiGetBottles()]);
      setMenuItems(mRes.items || []);
      setBottles(bRes.bottles || []);

      const initialEdits: Record<string, { price: number; sale_price: number | null }> = {};
      (mRes.items || []).forEach((m) => {
        initialEdits[m.id] = { price: m.price, sale_price: m.sale_price ?? null };
      });
      (bRes.bottles || []).forEach((b) => {
        initialEdits[b.id] = { price: b.price, sale_price: null };
      });
      setEditedPrices(initialEdits);
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePriceChange = (id: string, newPrice: number) => {
    setEditedPrices((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        price: Math.max(0, newPrice),
      },
    }));
  };

  const handleSalePriceChange = (id: string, newSalePrice: number | null) => {
    setEditedPrices((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        sale_price: newSalePrice !== null ? Math.max(0, newSalePrice) : null,
      },
    }));
  };

  const handleSaveItemPrice = async (id: string, isBottle: boolean) => {
    const edit = editedPrices[id];
    if (!edit || edit.price < 0) {
      setFeedback({ type: 'error', message: 'Harga tidak boleh negatif.' });
      return;
    }

    try {
      setSavingId(id);
      if (isBottle) {
        await apiUpdateBottle(id, { price: edit.price });
      } else {
        await apiUpdateMenuItem(id, {
          price: edit.price,
          sale_price: edit.sale_price,
        });
      }

      setFeedback({
        type: 'success',
        message: `Harga berhasil diperbarui menjadi Rp${edit.price.toLocaleString('id-ID')}. Perubahan langsung aktif di website public.`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSavingId(null);
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
      <div className="bg-white border-3 border-black rounded-3xl p-6 sm:p-8 shadow-brutal flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 bg-jebew-yellow border-2 border-black px-3 py-0.5 rounded-full text-xs font-black shadow-brutal-sm uppercase">
            <Flame className="w-3.5 h-3.5 text-jebew-red fill-jebew-red" />
            LIVE PRICE MANAGER
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-black">
            Manajemen Harga & Diskon (Price Management)
          </h2>
          <p className="text-xs sm:text-sm font-bold text-gray-600">
            Database adalah sumber kebenaran (source of truth). Setiap perubahan harga di sini akan langsung tampil pada website public.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white border-3 border-black rounded-3xl shadow-brutal">
          <RefreshCwIcon className="w-8 h-8 animate-spin mx-auto text-brand-red mb-2" />
          <p className="font-bold text-neutral-600">Memuat data harga...</p>
        </div>
      ) : (
        <>
          {/* Menu Items Pricing Table */}
          <div className="bg-white border-3 border-black rounded-3xl overflow-hidden shadow-brutal space-y-4 p-6">
            <h3 className="text-lg font-black text-black flex items-center gap-2">
              <span>🍜</span>
              <span>Harga Menu Makanan & Minuman</span>
            </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-cream-100 border-b-2 border-black text-xs font-black uppercase text-black">
                <th className="p-3">Item</th>
                <th className="p-3">Harga Normal (Rp)</th>
                <th className="p-3">Harga Promo (Rp)</th>
                <th className="p-3">Diskon (%)</th>
                <th className="p-3 text-right">Aksi Simpan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-xs sm:text-sm font-bold">
              {menuItems.map((m) => {
                const edit = editedPrices[m.id] || { price: m.price, sale_price: m.sale_price ?? null };
                const discountPct =
                  edit.sale_price && edit.price > edit.sale_price
                    ? Math.round(((edit.price - edit.sale_price) / edit.price) * 100)
                    : 0;

                return (
                  <tr key={m.id} className="hover:bg-cream-50">
                    <td className="p-3">
                      <div className="font-black text-black">{m.name}</div>
                      <div className="text-[11px] text-gray-500">{m.category_id || m.category}</div>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-bold">Rp</span>
                        <input
                          type="number"
                          min={0}
                          step={500}
                          value={edit.price}
                          onChange={(e) => handlePriceChange(m.id, Number(e.target.value))}
                          className="w-32 px-3 py-1.5 bg-cream-50 border-2 border-black rounded-lg font-black text-sm text-black focus:outline-none focus:bg-white"
                        />
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-bold">Rp</span>
                        <input
                          type="number"
                          min={0}
                          step={500}
                          placeholder="Tidak ada promo"
                          value={edit.sale_price !== null ? edit.sale_price : ''}
                          onChange={(e) =>
                            handleSalePriceChange(
                              m.id,
                              e.target.value !== '' ? Number(e.target.value) : null
                            )
                          }
                          className="w-32 px-3 py-1.5 bg-cream-50 border-2 border-black rounded-lg font-black text-sm text-black focus:outline-none focus:bg-white"
                        />
                      </div>
                    </td>

                    <td className="p-3">
                      {discountPct > 0 ? (
                        <span className="bg-red-100 text-red-800 font-black px-2 py-0.5 rounded border border-red-300 text-xs">
                          Hemat {discountPct}%
                        </span>
                      ) : (
                        <span className="text-gray-400 font-normal">-</span>
                      )}
                    </td>

                    <td className="p-3 text-right">
                      <button
                        type="button"
                        disabled={savingId === m.id}
                        onClick={() => handleSaveItemPrice(m.id, false)}
                        className="px-4 py-2 bg-jebew-yellow hover:bg-yellow-400 active:translate-x-0.5 active:translate-y-0.5 border-2 border-black rounded-xl text-xs font-black text-black cursor-pointer shadow-brutal-sm disabled:opacity-50"
                      >
                        {savingId === m.id ? 'Menyimpan...' : 'Simpan'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottles Pricing Table */}
      <div className="bg-white border-3 border-black rounded-3xl overflow-hidden shadow-brutal space-y-4 p-6">
        <h3 className="text-lg font-black text-black flex items-center gap-2">
          <span>🍶</span>
          <span>Harga Produk Botol & Chili Oil</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-cream-100 border-b-2 border-black text-xs font-black uppercase text-black">
                <th className="p-3">Produk</th>
                <th className="p-3">Ukuran</th>
                <th className="p-3">Harga Sekarang (Rp)</th>
                <th className="p-3 text-right">Aksi Simpan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-xs sm:text-sm font-bold">
              {bottles.map((b) => {
                const edit = editedPrices[b.id] || { price: b.price, sale_price: null };

                return (
                  <tr key={b.id} className="hover:bg-cream-50">
                    <td className="p-3">
                      <div className="font-black text-black">{b.name}</div>
                      <div className="text-[11px] text-gray-500">{b.subtitle}</div>
                    </td>

                    <td className="p-3 font-bold text-gray-700">
                      {b.volume_ml} ml
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-bold">Rp</span>
                        <input
                          type="number"
                          min={0}
                          step={500}
                          value={edit.price}
                          onChange={(e) => handlePriceChange(b.id, Number(e.target.value))}
                          className="w-32 px-3 py-1.5 bg-cream-50 border-2 border-black rounded-lg font-black text-sm text-black focus:outline-none focus:bg-white"
                        />
                      </div>
                    </td>

                    <td className="p-3 text-right">
                      <button
                        type="button"
                        disabled={savingId === b.id}
                        onClick={() => handleSaveItemPrice(b.id, true)}
                        className="px-4 py-2 bg-jebew-yellow hover:bg-yellow-400 active:translate-x-0.5 active:translate-y-0.5 border-2 border-black rounded-xl text-xs font-black text-black cursor-pointer shadow-brutal-sm disabled:opacity-50"
                      >
                        {savingId === b.id ? 'Menyimpan...' : 'Simpan'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

    </div>
  );
};
