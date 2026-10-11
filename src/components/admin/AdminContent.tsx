import React, { useState, useEffect } from 'react';
import {
  HomepageContentData,
  WhyChooseUsItem,
  BehindKitchenItem,
  VinasSectionData,
} from '../../types';
import {
  apiGetHomepageContent,
  apiUpdateHomepageContent,
  apiGetWhyChooseUs,
  apiCreateWhyChooseUs,
  apiUpdateWhyChooseUs,
  apiDeleteWhyChooseUs,
  apiGetBehindKitchen,
  apiCreateBehindKitchen,
  apiUpdateBehindKitchen,
  apiDeleteBehindKitchen,
  apiGetVinas,
  apiUpdateVinas,
} from '../../services/api';
import {
  GlobeIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  XIcon,
  RefreshCwIcon,
  SparklesIcon,
  HeartIcon,
  CameraIcon,
} from '../ui/Icons';
import { ImagePickerInput } from './ImagePickerInput';

type ContentSubTab = 'homepage' | 'why_us' | 'behind_kitchen' | 'vinas';

export const AdminContent: React.FC = () => {
  const [subTab, setSubTab] = useState<ContentSubTab>('homepage');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Homepage State
  const [homepage, setHomepage] = useState<HomepageContentData | null>(null);
  const [savingHomepage, setSavingHomepage] = useState(false);

  // Why Us State
  const [whyUsItems, setWhyUsItems] = useState<WhyChooseUsItem[]>([]);
  const [isWhyModalOpen, setIsWhyModalOpen] = useState(false);
  const [editingWhy, setEditingWhy] = useState<WhyChooseUsItem | null>(null);
  const [whyForm, setWhyForm] = useState({
    title: '',
    description: '',
    icon: 'flame',
    sort_order: 1,
    is_active: 1,
  });

  // Behind Kitchen State
  const [kitchenItems, setKitchenItems] = useState<BehindKitchenItem[]>([]);
  const [isKitchenModalOpen, setIsKitchenModalOpen] = useState(false);
  const [editingKitchen, setEditingKitchen] = useState<BehindKitchenItem | null>(null);
  const [kitchenForm, setKitchenForm] = useState({
    title: '',
    description: '',
    image_url: '',
    tag: 'DAPUR HIGIENIS',
    sort_order: 1,
    is_active: 1,
  });

  // Vina's State
  const [vinas, setVinas] = useState<VinasSectionData | null>(null);
  const [savingVinas, setSavingVinas] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'why' | 'kitchen'; id: string } | null>(
    null
  );

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (subTab === 'homepage') {
        const res = await apiGetHomepageContent();
        setHomepage(res.content);
      } else if (subTab === 'why_us') {
        const res = await apiGetWhyChooseUs();
        setWhyUsItems(res.items || []);
      } else if (subTab === 'behind_kitchen') {
        const res = await apiGetBehindKitchen();
        setKitchenItems(res.items || []);
      } else if (subTab === 'vinas') {
        const res = await apiGetVinas();
        setVinas(res.vinas);
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat konten', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [subTab]);

  // Handle Homepage Save
  const handleSaveHomepage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homepage) return;
    setSavingHomepage(true);
    try {
      await apiUpdateHomepageContent(homepage);
      showToast('Konten Homepage berhasil disimpan!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan homepage', 'error');
    } finally {
      setSavingHomepage(false);
    }
  };

  // Handle Vina's Save
  const handleSaveVinas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vinas) return;
    setSavingVinas(true);
    try {
      await apiUpdateVinas(vinas);
      showToast("Konten Vina's Section berhasil disimpan!", 'success');
    } catch (err: any) {
      showToast(err.message || "Gagal menyimpan konten Vina's", 'error');
    } finally {
      setSavingVinas(false);
    }
  };

  // Handle Why Us Modal
  const openWhyCreate = () => {
    setEditingWhy(null);
    setWhyForm({
      title: '',
      description: '',
      icon: 'flame',
      sort_order: whyUsItems.length + 1,
      is_active: 1,
    });
    setIsWhyModalOpen(true);
  };

  const openWhyEdit = (item: WhyChooseUsItem) => {
    setEditingWhy(item);
    setWhyForm({
      title: item.title,
      description: item.description,
      icon: item.icon || 'flame',
      sort_order: item.sort_order || 1,
      is_active: item.is_active ? 1 : 0,
    });
    setIsWhyModalOpen(true);
  };

  const handleWhySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingWhy) {
        await apiUpdateWhyChooseUs(editingWhy.id, whyForm);
        showToast('Keunggulan berhasil diperbarui', 'success');
      } else {
        await apiCreateWhyChooseUs(whyForm);
        showToast('Keunggulan baru berhasil ditambahkan', 'success');
      }
      setIsWhyModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan keunggulan', 'error');
    }
  };

  // Handle Kitchen Modal
  const openKitchenCreate = () => {
    setEditingKitchen(null);
    setKitchenForm({
      title: '',
      description: '',
      image_url: '',
      tag: 'DAPUR HIGIENIS',
      sort_order: kitchenItems.length + 1,
      is_active: 1,
    });
    setIsKitchenModalOpen(true);
  };

  const openKitchenEdit = (item: BehindKitchenItem) => {
    setEditingKitchen(item);
    setKitchenForm({
      title: item.title,
      description: item.description,
      image_url: item.image_url,
      tag: item.tag || 'DAPUR HIGIENIS',
      sort_order: item.sort_order || 1,
      is_active: item.is_active ? 1 : 0,
    });
    setIsKitchenModalOpen(true);
  };

  const handleKitchenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingKitchen) {
        await apiUpdateBehindKitchen(editingKitchen.id, kitchenForm);
        showToast('Galeri dapur berhasil diperbarui', 'success');
      } else {
        await apiCreateBehindKitchen(kitchenForm);
        showToast('Galeri dapur baru berhasil ditambahkan', 'success');
      }
      setIsKitchenModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan item dapur', 'error');
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'why') {
        await apiDeleteWhyChooseUs(deleteConfirm.id);
        showToast('Keunggulan berhasil dihapus', 'success');
      } else {
        await apiDeleteBehindKitchen(deleteConfirm.id);
        showToast('Galeri dapur berhasil dihapus', 'success');
      }
      setDeleteConfirm(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus item', 'error');
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
            <GlobeIcon className="w-6 h-6 text-brand-red" />
            <h1 className="text-2xl font-black uppercase tracking-tight text-neutral-900">
              Kelola Konten Website
            </h1>
          </div>
          <p className="text-sm text-neutral-600 font-medium mt-1">
            Edit teks Hero, banner pengumuman, Why Choose Us, Behind Kitchen, dan profil Vina's
          </p>
        </div>
        <button
          onClick={loadData}
          className="p-2.5 bg-neutral-100 hover:bg-neutral-200 border-2 border-black font-bold transition-transform active:scale-95 self-start sm:self-auto"
          title="Refresh"
        >
          <RefreshCwIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b-2 border-black bg-neutral-100 p-1 gap-1 overflow-x-auto">
        <button
          onClick={() => setSubTab('homepage')}
          className={`flex items-center gap-2 px-4 py-2 font-black uppercase text-xs sm:text-sm border-2 whitespace-nowrap transition-all ${
            subTab === 'homepage'
              ? 'bg-brand-red text-white border-black shadow-[3px_3px_0_0_#000]'
              : 'border-transparent text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          <GlobeIcon className="w-4 h-4" />
          <span>Hero & Banner Home</span>
        </button>

        <button
          onClick={() => setSubTab('why_us')}
          className={`flex items-center gap-2 px-4 py-2 font-black uppercase text-xs sm:text-sm border-2 whitespace-nowrap transition-all ${
            subTab === 'why_us'
              ? 'bg-brand-red text-white border-black shadow-[3px_3px_0_0_#000]'
              : 'border-transparent text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          <SparklesIcon className="w-4 h-4" />
          <span>Why Choose Us</span>
        </button>

        <button
          onClick={() => setSubTab('behind_kitchen')}
          className={`flex items-center gap-2 px-4 py-2 font-black uppercase text-xs sm:text-sm border-2 whitespace-nowrap transition-all ${
            subTab === 'behind_kitchen'
              ? 'bg-brand-red text-white border-black shadow-[3px_3px_0_0_#000]'
              : 'border-transparent text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          <CameraIcon className="w-4 h-4" />
          <span>Behind The Kitchen</span>
        </button>

        <button
          onClick={() => setSubTab('vinas')}
          className={`flex items-center gap-2 px-4 py-2 font-black uppercase text-xs sm:text-sm border-2 whitespace-nowrap transition-all ${
            subTab === 'vinas'
              ? 'bg-brand-red text-white border-black shadow-[3px_3px_0_0_#000]'
              : 'border-transparent text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          <HeartIcon className="w-4 h-4" />
          <span>Vina's Section</span>
        </button>
      </div>

      {/* SUBTAB 1: HOMEPAGE */}
      {subTab === 'homepage' && (
        <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0_0_#000]">
          {loading || !homepage ? (
            <div className="py-12 text-center">
              <RefreshCwIcon className="w-8 h-8 animate-spin mx-auto text-brand-red mb-2" />
              <p className="font-bold text-neutral-600">Memuat data homepage...</p>
            </div>
          ) : (
            <form onSubmit={handleSaveHomepage} className="space-y-6 max-w-4xl">
              <div className="border-b-2 border-neutral-200 pb-4">
                <h3 className="font-black text-lg uppercase text-neutral-900">
                  Pengumuman Berjalan (Announcement Banner)
                </h3>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="announcementActive"
                      checked={Boolean(homepage.is_announcement_active)}
                      onChange={(e) =>
                        setHomepage({
                          ...homepage,
                          is_announcement_active: e.target.checked ? 1 : 0,
                        })
                      }
                      className="w-4 h-4 text-brand-red rounded border-2 border-black focus:ring-brand-yellow"
                    />
                    <label
                      htmlFor="announcementActive"
                      className="text-xs font-black uppercase text-neutral-800 cursor-pointer"
                    >
                      Tampilkan Bar Pengumuman di Atas Website
                    </label>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={homepage.announcement_banner || ''}
                      onChange={(e) =>
                        setHomepage({ ...homepage, announcement_banner: e.target.value })
                      }
                      placeholder="Contoh: 🔥 PROMO SPESIAL GAJIAN: DISKON 20% DENGAN KODE JEBEWGAJIAN!"
                      className="w-full px-3 py-2 bg-neutral-50 border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                    />
                  </div>
                </div>
              </div>

              <div className="border-b-2 border-neutral-200 pb-4 space-y-4">
                <h3 className="font-black text-lg uppercase text-neutral-900">
                  Teks Hero Banner Utama
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                      Nama Brand / Toko
                    </label>
                    <input
                      type="text"
                      required
                      value={homepage.store_name}
                      onChange={(e) => setHomepage({ ...homepage, store_name: e.target.value })}
                      className="w-full px-3 py-2 bg-neutral-50 border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                      Badge Hero (Paling Atas)
                    </label>
                    <input
                      type="text"
                      value={homepage.hero_badge}
                      onChange={(e) => setHomepage({ ...homepage, hero_badge: e.target.value })}
                      className="w-full px-3 py-2 bg-neutral-50 border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                      Headline Utama (Baris 1)
                    </label>
                    <input
                      type="text"
                      required
                      value={homepage.hero_headline}
                      onChange={(e) =>
                        setHomepage({ ...homepage, hero_headline: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-neutral-50 border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                      Sub-Headline (Baris 2 Aksen)
                    </label>
                    <input
                      type="text"
                      required
                      value={homepage.hero_subheadline}
                      onChange={(e) =>
                        setHomepage({ ...homepage, hero_subheadline: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-neutral-50 border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                    Deskripsi Hero
                  </label>
                  <textarea
                    rows={3}
                    value={homepage.hero_description}
                    onChange={(e) =>
                      setHomepage({ ...homepage, hero_description: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-neutral-50 border-2 border-black text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                      Teks Tombol Order CTA
                    </label>
                    <input
                      type="text"
                      value={homepage.cta_order_text}
                      onChange={(e) =>
                        setHomepage({ ...homepage, cta_order_text: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-neutral-50 border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                      Teks Tombol Lihat Menu
                    </label>
                    <input
                      type="text"
                      value={homepage.cta_menu_text}
                      onChange={(e) =>
                        setHomepage({ ...homepage, cta_menu_text: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-neutral-50 border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                    />
                  </div>
                </div>
              </div>

              {/* QRIS Settings */}
              <div className="space-y-4">
                <h3 className="font-black text-lg uppercase text-neutral-900">
                  Pengaturan QRIS & Pembayaran
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                      Nama Merchant QRIS
                    </label>
                    <input
                      type="text"
                      value={homepage.qris_merchant_name || ''}
                      onChange={(e) =>
                        setHomepage({ ...homepage, qris_merchant_name: e.target.value })
                      }
                      placeholder="MIE JEBEW OFFICIAL"
                      className="w-full px-3 py-2 bg-neutral-50 border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                      NMID QRIS
                    </label>
                    <input
                      type="text"
                      value={homepage.qris_nmid || ''}
                      onChange={(e) => setHomepage({ ...homepage, qris_nmid: e.target.value })}
                      placeholder="ID102030405060"
                      className="w-full px-3 py-2 bg-neutral-50 border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                    />
                  </div>
                </div>
                <ImagePickerInput
                  label="Gambar QR Code QRIS"
                  value={homepage.qris_image_url || ''}
                  onChange={(url) => setHomepage({ ...homepage, qris_image_url: url })}
                  placeholder="/qris/Qris.jpeg"
                  helperText="Upload foto barcode QRIS atau pilih dari galeri."
                />
              </div>

              <div className="pt-4 border-t-2 border-black flex justify-end">
                <button
                  type="submit"
                  disabled={savingHomepage}
                  className="flex items-center gap-2 px-6 py-2.5 bg-brand-yellow hover:bg-yellow-400 border-2 border-black font-black uppercase text-sm shadow-[3px_3px_0_0_#000] disabled:opacity-50"
                >
                  {savingHomepage && <RefreshCwIcon className="w-4 h-4 animate-spin" />}
                  <span>Simpan Perubahan Homepage</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* SUBTAB 2: WHY CHOOSE US */}
      {subTab === 'why_us' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 border-2 border-black">
            <span className="font-bold text-sm text-neutral-700">
              Total {whyUsItems.length} Keunggulan Aktif
            </span>
            <button
              onClick={openWhyCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-yellow hover:bg-yellow-400 border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0_0_#000]"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Tambah Keunggulan</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {whyUsItems.map((item) => (
              <div
                key={item.id}
                className="bg-white border-2 border-black p-4 shadow-[4px_4px_0_0_#000] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase text-neutral-400">
                      #{item.sort_order}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-black uppercase border border-black ${
                        item.is_active ? 'bg-green-400 text-black' : 'bg-neutral-200 text-neutral-600'
                      }`}
                    >
                      {item.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <h4 className="font-black text-base uppercase text-neutral-900">{item.title}</h4>
                  <p className="text-xs text-neutral-600 font-medium mt-1">{item.description}</p>
                </div>
                <div className="flex items-center justify-end gap-1.5 pt-3 mt-3 border-t border-neutral-200">
                  <button
                    onClick={() => openWhyEdit(item)}
                    className="p-1.5 bg-brand-yellow border border-black hover:bg-yellow-400"
                    title="Edit"
                  >
                    <EditIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm({ type: 'why', id: item.id })}
                    className="p-1.5 bg-brand-red text-white border border-black hover:bg-red-700"
                    title="Hapus"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 3: BEHIND THE KITCHEN */}
      {subTab === 'behind_kitchen' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 border-2 border-black">
            <span className="font-bold text-sm text-neutral-700">
              Total {kitchenItems.length} Galeri / Proses Dapur
            </span>
            <button
              onClick={openKitchenCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-yellow hover:bg-yellow-400 border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0_0_#000]"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Tambah Galeri</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {kitchenItems.map((item) => (
              <div
                key={item.id}
                className="bg-white border-2 border-black shadow-[4px_4px_0_0_#000] overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="h-44 bg-neutral-200 border-b-2 border-black relative">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400">
                        <CameraIcon className="w-12 h-12" />
                      </div>
                    )}
                    {item.tag && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-brand-red text-white text-[10px] font-black uppercase border border-black">
                        {item.tag}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-black text-base uppercase text-neutral-900">
                      {item.title}
                    </h4>
                    <p className="text-xs text-neutral-600 font-medium mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-neutral-500">
                    Urutan #{item.sort_order}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openKitchenEdit(item)}
                      className="p-1.5 bg-brand-yellow border border-black hover:bg-yellow-400"
                    >
                      <EditIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ type: 'kitchen', id: item.id })}
                      className="p-1.5 bg-brand-red text-white border border-black hover:bg-red-700"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 4: VINAS SECTION */}
      {subTab === 'vinas' && (
        <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0_0_#000]">
          {loading || !vinas ? (
            <div className="py-12 text-center">
              <RefreshCwIcon className="w-8 h-8 animate-spin mx-auto text-brand-red mb-2" />
              <p className="font-bold text-neutral-600">Memuat profil Vina's...</p>
            </div>
          ) : (
            <form onSubmit={handleSaveVinas} className="space-y-4 max-w-3xl">
              <div className="flex items-center gap-2 pb-2 border-b-2 border-neutral-200">
                <input
                  type="checkbox"
                  id="vinasActive"
                  checked={Boolean(vinas.is_active)}
                  onChange={(e) =>
                    setVinas({ ...vinas, is_active: e.target.checked ? 1 : 0 })
                  }
                  className="w-4 h-4 text-brand-red rounded border-2 border-black focus:ring-brand-yellow"
                />
                <label
                  htmlFor="vinasActive"
                  className="text-xs font-black uppercase text-neutral-800 cursor-pointer"
                >
                  Tampilkan Section Vina's di Website Publik
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                    Judul Utama
                  </label>
                  <input
                    type="text"
                    required
                    value={vinas.title}
                    onChange={(e) => setVinas({ ...vinas, title: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                    Badge Label
                  </label>
                  <input
                    type="text"
                    value={vinas.badge}
                    onChange={(e) => setVinas({ ...vinas, badge: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Sub-Judul / Tagline
                </label>
                <input
                  type="text"
                  value={vinas.subtitle}
                  onChange={(e) => setVinas({ ...vinas, subtitle: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-50 border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Kutipan (Quote Founder)
                </label>
                <input
                  type="text"
                  value={vinas.quote}
                  onChange={(e) => setVinas({ ...vinas, quote: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-50 border-2 border-black text-sm font-medium italic focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Deskripsi Cerita / Filosofi
                </label>
                <textarea
                  rows={4}
                  value={vinas.description}
                  onChange={(e) => setVinas({ ...vinas, description: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-50 border-2 border-black text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>

              <ImagePickerInput
                label="Foto Profil / Cerita Vina's"
                value={vinas.image_url || ''}
                onChange={(url) => setVinas({ ...vinas, image_url: url })}
                placeholder="/rasa-mie/Original.jpeg"
                helperText="Upload foto profil Vina's atau pilih dari galeri."
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                    Teks Tombol CTA
                  </label>
                  <input
                    type="text"
                    value={vinas.cta_text}
                    onChange={(e) => setVinas({ ...vinas, cta_text: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                    Tujuan Link CTA (anchor atau URL)
                  </label>
                  <input
                    type="text"
                    value={vinas.cta_link}
                    onChange={(e) => setVinas({ ...vinas, cta_link: e.target.value })}
                    placeholder="#menu"
                    className="w-full px-3 py-2 bg-neutral-50 border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  />
                </div>
              </div>

              <div className="pt-4 border-t-2 border-black flex justify-end">
                <button
                  type="submit"
                  disabled={savingVinas}
                  className="flex items-center gap-2 px-6 py-2.5 bg-brand-yellow hover:bg-yellow-400 border-2 border-black font-black uppercase text-sm shadow-[3px_3px_0_0_#000] disabled:opacity-50"
                >
                  {savingVinas && <RefreshCwIcon className="w-4 h-4 animate-spin" />}
                  <span>Simpan Perubahan Vina's</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Why Us Modal */}
      {isWhyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-6 max-w-md w-full shadow-[8px_8px_0_0_#000] space-y-4">
            <h3 className="font-black text-lg uppercase text-neutral-900">
              {editingWhy ? 'Edit Keunggulan' : 'Tambah Keunggulan'}
            </h3>
            <form onSubmit={handleWhySubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Judul *
                </label>
                <input
                  type="text"
                  required
                  value={whyForm.title}
                  onChange={(e) => setWhyForm({ ...whyForm, title: e.target.value })}
                  placeholder="Contoh: Cabe Rawit Segar 100%"
                  className="w-full px-3 py-2 border-2 border-black text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Deskripsi *
                </label>
                <textarea
                  required
                  rows={2}
                  value={whyForm.description}
                  onChange={(e) => setWhyForm({ ...whyForm, description: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-black text-sm font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                    Urutan
                  </label>
                  <input
                    type="number"
                    value={whyForm.sort_order}
                    onChange={(e) =>
                      setWhyForm({ ...whyForm, sort_order: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border-2 border-black text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                    Status
                  </label>
                  <select
                    value={whyForm.is_active}
                    onChange={(e) =>
                      setWhyForm({ ...whyForm, is_active: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border-2 border-black text-sm font-bold"
                  >
                    <option value={1}>Aktif</option>
                    <option value={0}>Nonaktif</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsWhyModalOpen(false)}
                  className="px-4 py-1.5 bg-neutral-200 border-2 border-black text-xs font-black uppercase"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-yellow border-2 border-black text-xs font-black uppercase shadow-[2px_2px_0_0_#000]"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kitchen Modal */}
      {isKitchenModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-6 max-w-md w-full shadow-[8px_8px_0_0_#000] space-y-4">
            <h3 className="font-black text-lg uppercase text-neutral-900">
              {editingKitchen ? 'Edit Galeri Dapur' : 'Tambah Galeri Dapur'}
            </h3>
            <form onSubmit={handleKitchenSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Judul Foto / Proses *
                </label>
                <input
                  type="text"
                  required
                  value={kitchenForm.title}
                  onChange={(e) => setKitchenForm({ ...kitchenForm, title: e.target.value })}
                  placeholder="Contoh: Racikan Sambal Rahasia"
                  className="w-full px-3 py-2 border-2 border-black text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Deskripsi
                </label>
                <textarea
                  rows={2}
                  value={kitchenForm.description}
                  onChange={(e) =>
                    setKitchenForm({ ...kitchenForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border-2 border-black text-sm font-medium"
                />
              </div>
              <ImagePickerInput
                label="Foto Dapur / Proses Masak *"
                value={kitchenForm.image_url}
                onChange={(url) => setKitchenForm({ ...kitchenForm, image_url: url })}
                placeholder="/team-cravecorner.jpg"
                helperText="Upload foto proses masak langsung dari HP/Laptop atau pilih dari galeri."
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                    Tag Label
                  </label>
                  <input
                    type="text"
                    value={kitchenForm.tag}
                    onChange={(e) => setKitchenForm({ ...kitchenForm, tag: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-black text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                    Urutan
                  </label>
                  <input
                    type="number"
                    value={kitchenForm.sort_order}
                    onChange={(e) =>
                      setKitchenForm({ ...kitchenForm, sort_order: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border-2 border-black text-sm font-bold"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsKitchenModalOpen(false)}
                  className="px-4 py-1.5 bg-neutral-200 border-2 border-black text-xs font-black uppercase"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-yellow border-2 border-black text-xs font-black uppercase shadow-[2px_2px_0_0_#000]"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-6 max-w-sm w-full shadow-[8px_8px_0_0_#000] space-y-4">
            <h3 className="font-black text-lg uppercase text-brand-red">Hapus Item Konten</h3>
            <p className="text-sm text-neutral-700 font-medium">
              Apakah Anda yakin ingin menghapus item ini dari website?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-neutral-200 border-2 border-black font-black uppercase text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteItem}
                className="px-4 py-2 bg-brand-red text-white border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0_0_#000]"
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
