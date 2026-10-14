import React, { useState, useEffect } from 'react';
import { PromotionalPopupData, PromotionalPopupHistoryItem, MenuItem } from '../../types';
import {
  apiGetAdminPromoPopup,
  apiCreatePromoPopup,
  apiUpdatePromoPopup,
  apiSetActivePromoPopup,
  apiDeletePromoPopup,
  apiRollbackPromoPopup,
  apiGetMenuItems,
} from '../../services/api';
import {
  Flame,
  Save,
  RotateCcw,
  Eye,
  CheckCircle2,
  AlertTriangle,
  RefreshCwIcon,
  X,
  ArrowRight,
  Utensils,
  Calendar,
  Clock,
  Sparkles,
  Plus,
  Trash2,
} from '../ui/Icons';
import { ImagePickerInput } from './ImagePickerInput';

export const AdminPromotionalPopup: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // All popups list & active popup
  const [popupsList, setPopupsList] = useState<PromotionalPopupData[]>([]);
  const [selectedPopupId, setSelectedPopupId] = useState<string>('main_popup');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // Form State for currently edited popup
  const [formData, setFormData] = useState<Partial<PromotionalPopupData>>({
    id: 'main_popup',
    title: 'MIE JEBEW',
    headline: 'PEDASNYA BIKIN NAGIH!',
    subtitle: 'Laper? Gas, bro! 🍜',
    description: 'Mie pedas + topping favorit lo.',
    cta_text: 'PESAN SEKARANG',
    cta_link: '#order-original',
    secondary_text: 'Nanti aja',
    image_url: '/promo-popup-banner.jpg',
    badge_text: 'PROMO SPESIAL 🔥',
    is_active: true,
    target_page: 'all',
    delay_seconds: 2,
    frequency: 'once_per_session',
    start_date: '',
    end_date: '',
    status: 'published',
  });

  // Target Redirect Type Helper ('original' | 'specific_menu' | 'menu' | 'spin' | 'custom_order' | 'cart' | 'whatsapp' | 'custom')
  const [redirectType, setRedirectType] = useState<string>('original');
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string>('');
  const [customLinkInput, setCustomLinkInput] = useState<string>('');

  // Revisions History
  const [history, setHistory] = useState<PromotionalPopupHistoryItem[]>([]);
  const [showLivePreviewModal, setShowLivePreviewModal] = useState(false);
  const [changeSummary, setChangeSummary] = useState('');
  const [rollbackConfirm, setRollbackConfirm] = useState<PromotionalPopupHistoryItem | null>(null);

  // Create New Banner Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('MIE JEBEW');
  const [newHeadline, setNewHeadline] = useState('PROMO SPESIAL AKHIR PEKAN!');
  const [newSubtitle, setNewSubtitle] = useState('Dapatkan Diskon & Ekstra Topping 🔥');
  const [newDescription, setNewDescription] = useState('Pesan sekarang sebelum kehabisan porsi spesial hari ini.');
  const [newBadgeText, setNewBadgeText] = useState('DISKON 20% ⚡');
  const [newImageUrl, setNewImageUrl] = useState('/promo-popup-banner.jpg');
  const [newCtaText, setNewCtaText] = useState('KLAIM PROMO SEKARANG');
  const [newCtaLink, setNewCtaLink] = useState('#order-original');
  const [newIsActive, setNewIsActive] = useState(true);

  // Delete Confirm Modal
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchConfig = async (idToSelect?: string) => {
    setLoading(true);
    try {
      const [popupRes, menuRes] = await Promise.all([
        apiGetAdminPromoPopup(idToSelect),
        apiGetMenuItems(),
      ]);

      setPopupsList(popupRes.popups || (popupRes.popup ? [popupRes.popup] : []));
      setMenuItems(menuRes.items || []);

      const activePopup = popupRes.popup;
      if (activePopup) {
        setSelectedPopupId(activePopup.id);
        setFormData({
          ...activePopup,
          is_active: Boolean(activePopup.is_active),
          start_date: activePopup.start_date ? activePopup.start_date.slice(0, 16) : '',
          end_date: activePopup.end_date ? activePopup.end_date.slice(0, 16) : '',
        });

        // Parse cta_link into redirectType
        const link = activePopup.cta_link || '#order-original';
        if (link === '#order-original' || link === 'original' || link === '#original') {
          setRedirectType('original');
        } else if (link.startsWith('item:') || link.startsWith('menu-item:')) {
          setRedirectType('specific_menu');
          setSelectedMenuItemId(link.replace(/^(item:|menu-item:)/, ''));
        } else if (link === '#menu' || link === 'menu') {
          setRedirectType('menu');
        } else if (link === '#spin' || link === '#rewards' || link === 'spin') {
          setRedirectType('spin');
        } else if (link === '#custom-order' || link === 'custom_order') {
          setRedirectType('custom_order');
        } else if (link === '#cart' || link === 'cart') {
          setRedirectType('cart');
        } else if (link.startsWith('whatsapp') || link.startsWith('https://wa.me')) {
          setRedirectType('whatsapp');
        } else {
          setRedirectType('custom');
          setCustomLinkInput(link);
        }
      }

      setHistory(popupRes.history || []);
    } catch (err: any) {
      showToast('error', err.message || 'Gagal memuat konfigurasi popup');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync redirect type changes to formData.cta_link
  const updateRedirectAction = (type: string, specificId?: string, customUrl?: string) => {
    setRedirectType(type);
    let resolvedLink = '#order-original';

    if (type === 'original') {
      resolvedLink = '#order-original';
    } else if (type === 'specific_menu') {
      const itemId = specificId || selectedMenuItemId || menuItems[0]?.id || 'mie-1';
      setSelectedMenuItemId(itemId);
      resolvedLink = `menu-item:${itemId}`;
    } else if (type === 'menu') {
      resolvedLink = '#menu';
    } else if (type === 'spin') {
      resolvedLink = '#spin';
    } else if (type === 'custom_order') {
      resolvedLink = '#custom-order';
    } else if (type === 'cart') {
      resolvedLink = '#cart';
    } else if (type === 'whatsapp') {
      resolvedLink = 'whatsapp';
    } else if (type === 'custom') {
      resolvedLink = customUrl !== undefined ? customUrl : customLinkInput || 'https://';
    }

    setFormData(prev => ({ ...prev, cta_link: resolvedLink }));
  };

  // Handle Select Different Popup from List
  const handleSelectPopup = (p: PromotionalPopupData) => {
    setSelectedPopupId(p.id);
    setFormData({
      ...p,
      is_active: Boolean(p.is_active),
      start_date: p.start_date ? p.start_date.slice(0, 16) : '',
      end_date: p.end_date ? p.end_date.slice(0, 16) : '',
    });

    const link = p.cta_link || '#order-original';
    if (link === '#order-original' || link === 'original' || link === '#original') {
      setRedirectType('original');
    } else if (link.startsWith('item:') || link.startsWith('menu-item:')) {
      setRedirectType('specific_menu');
      setSelectedMenuItemId(link.replace(/^(item:|menu-item:)/, ''));
    } else if (link === '#menu' || link === 'menu') {
      setRedirectType('menu');
    } else if (link === '#spin' || link === '#rewards' || link === 'spin') {
      setRedirectType('spin');
    } else if (link === '#custom-order' || link === 'custom_order') {
      setRedirectType('custom_order');
    } else if (link === '#cart' || link === 'cart') {
      setRedirectType('cart');
    } else if (link.startsWith('whatsapp') || link.startsWith('https://wa.me')) {
      setRedirectType('whatsapp');
    } else {
      setRedirectType('custom');
      setCustomLinkInput(link);
    }
  };

  // 1-Click Activate Popup
  const handleSetActivePopup = async (id: string, headline: string) => {
    try {
      await apiSetActivePromoPopup(id);
      showToast('success', `Banner '${headline}' sekarang LIVE sebagai banner aktif utama!`);
      fetchConfig(id);
    } catch (err: any) {
      showToast('error', err.message || 'Gagal mengaktifkan banner.');
    }
  };

  // Save changes to current popup
  const handleSave = async (targetStatus: 'published' | 'draft') => {
    if (!formData.title?.trim() || !formData.headline?.trim() || !formData.cta_text?.trim()) {
      showToast('error', 'Tag Judul, Headline, dan Teks Tombol (CTA) wajib diisi.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        status: targetStatus,
        change_summary: changeSummary.trim() || (targetStatus === 'draft' ? 'Simpan draft konfigurasi' : 'Pembaruan promosi aktif'),
      };

      const res = await apiUpdatePromoPopup(payload);
      showToast('success', res.message);
      setChangeSummary('');
      fetchConfig(formData.id);
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menyimpan konfigurasi popup');
    } finally {
      setSaving(false);
    }
  };

  // Create New Banner
  const handleCreateNewBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newHeadline.trim() || !newCtaText.trim()) {
      showToast('error', 'Tag Judul, Headline, dan Teks Tombol wajib diisi.');
      return;
    }

    setCreating(true);
    try {
      const res = await apiCreatePromoPopup({
        title: newTitle.trim(),
        headline: newHeadline.trim(),
        subtitle: newSubtitle.trim(),
        description: newDescription.trim(),
        badge_text: newBadgeText.trim(),
        image_url: newImageUrl.trim() || '/promo-popup-banner.jpg',
        cta_text: newCtaText.trim(),
        cta_link: newCtaLink.trim() || '#order-original',
        secondary_text: 'Nanti aja',
        is_active: newIsActive,
        status: 'published',
      });

      showToast('success', 'Banner promosi baru berhasil dibuat dan langsung tersimpan!');
      setIsCreateModalOpen(false);
      fetchConfig(res.popup.id);
    } catch (err: any) {
      showToast('error', err.message || 'Gagal membuat banner baru.');
    } finally {
      setCreating(false);
    }
  };

  // Delete Banner
  const handleDeleteBanner = async (id: string) => {
    try {
      await apiDeletePromoPopup(id);
      showToast('success', 'Banner promosi berhasil dihapus.');
      setDeleteConfirmId(null);
      fetchConfig();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menghapus banner.');
    }
  };

  const handleRollback = async (item: PromotionalPopupHistoryItem) => {
    try {
      const res = await apiRollbackPromoPopup(item.id);
      showToast('success', res.message);
      setRollbackConfirm(null);
      fetchConfig(item.popup_id);
    } catch (err: any) {
      showToast('error', err.message || 'Gagal memulihkan versi revisi');
    }
  };

  if (loading && popupsList.length === 0) {
    return (
      <div className="bg-white border-4 border-black p-8 text-center shadow-[6px_6px_0_0_#000] rounded-xl max-w-md mx-auto my-12 space-y-3">
        <RefreshCwIcon className="w-8 h-8 animate-spin mx-auto text-red-600" />
        <p className="font-black text-black">Memuat Konfigurasi Popup Promosi...</p>
      </div>
    );
  }

  // Get readable target description
  const getTargetDescription = (link?: string) => {
    if (!link || link === '#order-original' || link === 'original' || link === '#original') {
      return '🍜 Buka Modal Mie Jebew Original (Langsung Pilih Level & Pesan)';
    }
    if (link.startsWith('item:') || link.startsWith('menu-item:')) {
      const id = link.replace(/^(item:|menu-item:)/, '');
      const found = menuItems.find(m => m.id === id);
      return `🍽️ Buka Modal Pemesanan Menu: "${found ? found.name : id}"`;
    }
    if (link === '#menu' || link === 'menu') {
      return '📜 Scroll Layar ke Bagian Menu Lengkap Makanan & Minuman';
    }
    if (link === '#spin' || link === '#rewards' || link === 'spin') {
      return '🎁 Buka Roda Keberuntungan (Spin Wheel Berhadiah Voucher/Koin)';
    }
    if (link === '#custom-order' || link === 'custom_order') {
      return '🥣 Buka Modal Racik Sendiri (Custom Order Mie)';
    }
    if (link === '#cart' || link === 'cart') {
      return '🛒 Buka Keranjang Pesanan (Cart Drawer)';
    }
    if (link.startsWith('whatsapp') || link.startsWith('https://wa.me')) {
      return '💬 Buka WhatsApp Chat CS untuk Pemesanan Manual';
    }
    return `🔗 Buka Tautan Kustom: ${link}`;
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl border-3 border-black shadow-[4px_4px_0_0_#000] flex items-center justify-between text-xs sm:text-sm font-black ${
            toastMessage.type === 'success' ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="underline font-bold text-xs cursor-pointer ml-4">
            Tutup
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white border-4 border-black p-6 rounded-3xl shadow-[8px_8px_0_0_#000] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-jebew-yellow border-2 border-black px-3 py-1 rounded-full text-xs font-black shadow-[2px_2px_0_0_#000] uppercase mb-2">
            <Flame className="w-3.5 h-3.5 text-red-600 fill-red-600" />
            <span>POPUP & BANNER CAMPAIGN MANAGER</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-black">
            Manajemen Popup Banner Promosi
          </h2>
          <p className="text-xs sm:text-sm font-bold text-neutral-600 mt-1 max-w-2xl leading-relaxed">
            Buat banner promosi baru, atur teks, unggah/ganti foto banner (via upload HP/PC, galeri, atau URL link), dan tentukan sistem pengalihan saat banner diklik pelanggan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-stretch md:self-auto">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-jebew-red hover:bg-red-700 text-white font-black text-xs sm:text-sm px-4 py-3 border-2 border-black rounded-xl shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Tambah Banner Baru</span>
          </button>

          <button
            type="button"
            onClick={() => setShowLivePreviewModal(true)}
            className="flex items-center justify-center gap-1.5 bg-yellow-300 hover:bg-yellow-400 text-black font-black text-xs sm:text-sm px-4 py-3 border-2 border-black rounded-xl shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Lihat Live Preview</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave('published')}
            disabled={saving}
            className="flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs sm:text-sm px-5 py-3 border-2 border-black rounded-xl shadow-[4px_4px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Menyimpan...' : 'Terbitkan Banner'}</span>
          </button>
        </div>
      </div>

      {/* MULTI-BANNER LIST / SELECTOR */}
      <div className="bg-white border-3 border-black p-5 rounded-3xl shadow-[6px_6px_0_0_#000] space-y-4">
        <div className="flex items-center justify-between border-b-2 border-neutral-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🗂️</span>
            <div>
              <h3 className="font-black text-base text-black">Daftar Banner Promosi di Sistem</h3>
              <p className="text-xs text-neutral-500 font-bold">Pilih banner untuk diedit atau jadikan aktif sebagai banner live di website.</p>
            </div>
          </div>
          <span className="text-xs font-black bg-cream-100 border border-black px-2.5 py-1 rounded-lg">
            Total: {popupsList.length} Banner
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {popupsList.map((p) => {
            const isSelected = p.id === selectedPopupId;
            const isLive = p.is_active && p.status === 'published';

            return (
              <div
                key={p.id}
                className={`relative p-4 rounded-2xl border-3 border-black transition-all flex flex-col justify-between ${
                  isSelected ? 'bg-amber-50 shadow-[5px_5px_0_0_#000] ring-3 ring-jebew-red' : 'bg-neutral-50 shadow-[3px_3px_0_0_#000] hover:bg-cream-50'
                }`}
              >
                <div className="space-y-3">
                  {/* Status Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase bg-black text-yellow-300 px-2 py-0.5 rounded border border-black">
                      {p.badge_text || 'PROMO'}
                    </span>
                    {isLive ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 border border-emerald-400 px-2 py-0.5 rounded text-[10px] font-black uppercase animate-pulse">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        🟢 SEDANG LIVE
                      </span>
                    ) : (
                      <span className="bg-neutral-200 text-neutral-700 border border-neutral-400 px-2 py-0.5 rounded text-[10px] font-black uppercase">
                        ⚪ NONAKTIF
                      </span>
                    )}
                  </div>

                  {/* Thumbnail & Title */}
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-xl border-2 border-black overflow-hidden bg-neutral-900 shrink-0 shadow-sm">
                      <img
                        src={p.image_url || '/promo-popup-banner.jpg'}
                        alt={p.headline}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/promo-popup-banner.jpg';
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-black text-sm text-black truncate leading-tight">{p.headline}</h4>
                      <p className="text-[11px] font-bold text-red-600 truncate mt-0.5">{p.title}</p>
                      <p className="text-[10px] text-neutral-500 font-bold truncate mt-1">
                        🎯 {p.cta_link || '#order-original'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 mt-3 border-t border-neutral-200 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectPopup(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black border border-black cursor-pointer ${
                      isSelected ? 'bg-black text-white' : 'bg-white hover:bg-neutral-100 text-black'
                    }`}
                  >
                    {isSelected ? '✓ Sedang Diedit' : '✏️ Edit Banner'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    {!isLive && (
                      <button
                        type="button"
                        onClick={() => handleSetActivePopup(p.id, p.headline)}
                        className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-black border border-black shadow-xs cursor-pointer flex items-center gap-1"
                        title="Jadikan banner ini aktif di website"
                      >
                        <span>🚀 Aktifkan Live</span>
                      </button>
                    )}

                    {popupsList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(p.id)}
                        className="p-1.5 bg-white hover:bg-red-50 text-red-600 border border-black rounded-lg cursor-pointer"
                        title="Hapus Banner"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* MAIN EDITOR GRID: Form Left, Preview/Settings Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Status & Master Switch */}
          <div className="bg-white border-3 border-black p-5 rounded-3xl shadow-[5px_5px_0_0_#000] space-y-4">
            <div className="flex items-center justify-between border-b-2 border-neutral-200 pb-2">
              <h3 className="font-black text-base uppercase text-black flex items-center gap-2">
                <span>⚡ Status & Kontrol Utama</span>
              </h3>
              <span className="text-[11px] font-black text-neutral-500">ID: {formData.id}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Activation Switch */}
              <div className="flex items-center justify-between p-3.5 bg-neutral-50 border-2 border-black rounded-2xl">
                <div>
                  <span className="font-black text-sm block">Aktivasi Banner</span>
                  <span className="text-xs text-neutral-500 font-bold">
                    {formData.is_active ? '🟢 Banner Aktif Berjalan' : '⚪ Banner Dimatikan'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, is_active: !p.is_active }))}
                  className={`w-14 h-8 flex items-center p-1 border-2 border-black rounded-full transition-colors cursor-pointer ${
                    formData.is_active ? 'bg-emerald-500 justify-end' : 'bg-neutral-300 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 bg-white border border-black rounded-full shadow-sm" />
                </button>
              </div>

              {/* Status Mode */}
              <div className="flex items-center justify-between p-3.5 bg-neutral-50 border-2 border-black rounded-2xl">
                <div>
                  <span className="font-black text-sm block">Mode Publikasi</span>
                  <span className="text-xs text-neutral-500 font-bold">
                    {formData.status === 'published' ? '🟢 Published (Live)' : '🟡 Draft (Tertahan)'}
                  </span>
                </div>
                <select
                  value={formData.status}
                  onChange={e => setFormData(p => ({ ...p, status: e.target.value as any }))}
                  className="font-black text-xs p-2 border-2 border-black rounded-xl bg-white cursor-pointer"
                >
                  <option value="published">Published (Live)</option>
                  <option value="draft">Draft (Tertahan)</option>
                </select>
              </div>
            </div>

            {/* Change Summary Note */}
            <div>
              <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                Catatan Revisi / Log Perubahan (Opsional):
              </label>
              <input
                type="text"
                placeholder="Contoh: Ganti foto banner mie original & arahkan ke menu promo"
                value={changeSummary}
                onChange={e => setChangeSummary(e.target.value)}
                className="w-full text-xs font-bold p-2.5 bg-neutral-50 border-2 border-black rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* 1. KONTEN TEKS & TIPOGRAFI ("bisa ganti-ganti teks") */}
          <div className="bg-white border-3 border-black p-5 rounded-3xl shadow-[5px_5px_0_0_#000] space-y-4">
            <h3 className="font-black text-base uppercase text-black flex items-center gap-2 border-b-2 border-neutral-200 pb-2">
              <span>✍️ 1. Konten Teks & Tipografi</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Tag Brand / Header Merah:
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                  placeholder="MIE JEBEW"
                  className="w-full text-xs font-black p-2.5 bg-neutral-50 border-2 border-black rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Badge Bar Kuning Atas:
                </label>
                <input
                  type="text"
                  value={formData.badge_text || ''}
                  onChange={e => setFormData(p => ({ ...p, badge_text: e.target.value }))}
                  placeholder="PROMO SPESIAL 🔥"
                  className="w-full text-xs font-bold p-2.5 bg-neutral-50 border-2 border-black rounded-xl focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                Headline Utama (Teks Merah Besar):
              </label>
              <input
                type="text"
                value={formData.headline}
                onChange={e => setFormData(p => ({ ...p, headline: e.target.value }))}
                placeholder="PEDASNYA BIKIN NAGIH!"
                className="w-full text-sm font-black p-2.5 bg-neutral-50 border-2 border-black rounded-xl text-red-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                Subtitle Badge Hitam:
              </label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={e => setFormData(p => ({ ...p, subtitle: e.target.value }))}
                placeholder="Laper? Gas, bro! 🍜"
                className="w-full text-xs font-bold p-2.5 bg-neutral-50 border-2 border-black rounded-xl focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                Deskripsi Ajakan:
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                placeholder="Mie pedas + topping favorit lo."
                className="w-full text-xs font-bold p-2.5 bg-neutral-50 border-2 border-black rounded-xl focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Teks Tombol Utama (CTA):
                </label>
                <input
                  type="text"
                  value={formData.cta_text}
                  onChange={e => setFormData(p => ({ ...p, cta_text: e.target.value }))}
                  placeholder="PESAN SEKARANG"
                  className="w-full text-xs font-black p-2.5 bg-neutral-50 border-2 border-black rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Teks Tombol Tutup / Nanti:
                </label>
                <input
                  type="text"
                  value={formData.secondary_text}
                  onChange={e => setFormData(p => ({ ...p, secondary_text: e.target.value }))}
                  placeholder="Nanti aja"
                  className="w-full text-xs font-bold p-2.5 bg-neutral-50 border-2 border-black rounded-xl focus:bg-white"
                />
              </div>
            </div>

          </div>

          {/* 2. SISTEM TUJUAN PENGALIHAN ("mengatur systemnya mau kemana banner pop up itu di arahkan") */}
          <div className="bg-white border-3 border-black p-5 rounded-3xl shadow-[5px_5px_0_0_#000] space-y-4">
            <div className="flex items-center justify-between border-b-2 border-neutral-200 pb-2">
              <h3 className="font-black text-base uppercase text-black flex items-center gap-2">
                <span>🎯 2. Sistem Pengalihan Saat Banner / Tombol Diklik</span>
              </h3>
              <span className="bg-jebew-yellow border border-black px-2 py-0.5 rounded text-[10px] font-black uppercase">
                TARGET REDIRECT
              </span>
            </div>

            <p className="text-xs font-bold text-neutral-600">
              Pilih ke mana pelanggan akan diarahkan ketika mereka mengklik tombol utama ataupun gambar poster banner:
            </p>

            <div className="space-y-3">
              {/* Radio options grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    type: 'original',
                    title: '🍜 Mie Jebew Original',
                    desc: 'Langsung buka modal atur level pedas Mie Original',
                  },
                  {
                    type: 'specific_menu',
                    title: '🍽️ Menu Spesifik Tertentu',
                    desc: 'Pilih item menu makanan/minuman dari database',
                  },
                  {
                    type: 'menu',
                    title: '📜 Bagian Daftar Menu',
                    desc: 'Scroll otomatis ke bagian daftar menu makanan',
                  },
                  {
                    type: 'spin',
                    title: '🎁 Roda Keberuntungan',
                    desc: 'Buka modal Spin Wheel berhadiah kupon/koin',
                  },
                  {
                    type: 'cart',
                    title: '🛒 Keranjang Belanja',
                    desc: 'Buka drawer keranjang pesanan pelanggan',
                  },
                  {
                    type: 'whatsapp',
                    title: '💬 Chat WhatsApp CS',
                    desc: 'Buka WhatsApp untuk pemesanan langsung',
                  },
                  {
                    type: 'custom',
                    title: '🔗 Link URL Luar / Kustom',
                    desc: 'Arahkan ke alamat website atau link lainnya',
                  },
                ].map((opt) => (
                  <label
                    key={opt.type}
                    onClick={() => updateRedirectAction(opt.type)}
                    className={`p-3 rounded-2xl border-2 border-black flex items-start gap-2.5 cursor-pointer transition-all select-none ${
                      redirectType === opt.type ? 'bg-amber-100 shadow-[2px_2px_0_0_#000]' : 'bg-neutral-50 hover:bg-cream-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="redirectType"
                      checked={redirectType === opt.type}
                      onChange={() => updateRedirectAction(opt.type)}
                      className="mt-0.5 w-4 h-4 accent-jebew-red cursor-pointer"
                    />
                    <div>
                      <span className="font-black text-xs text-black block leading-tight">{opt.title}</span>
                      <span className="text-[10px] font-bold text-neutral-500 leading-tight block mt-0.5">{opt.desc}</span>
                    </div>
                  </label>
                ))}
              </div>

              {/* Specific Menu Item Dropdown Sub-form */}
              {redirectType === 'specific_menu' && (
                <div className="p-3.5 bg-yellow-50 border-2 border-black rounded-2xl space-y-2 animate-fadeIn">
                  <label className="block text-xs font-black text-black">
                    Pilih Menu Spesifik yang Langsung Terbuka:
                  </label>
                  <select
                    value={selectedMenuItemId}
                    onChange={(e) => updateRedirectAction('specific_menu', e.target.value)}
                    className="w-full text-xs font-black p-2.5 bg-white border-2 border-black rounded-xl cursor-pointer"
                  >
                    {menuItems.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} — Rp{m.price.toLocaleString('id-ID')} ({m.category_id || 'mie'})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-neutral-600 font-bold">
                    * Ketika banner diklik, sistem akan langsung membuka popup pemesanan untuk menu <strong>{menuItems.find(m => m.id === selectedMenuItemId)?.name || 'menu ini'}</strong>.
                  </p>
                </div>
              )}

              {/* Custom URL Input Sub-form */}
              {redirectType === 'custom' && (
                <div className="p-3.5 bg-yellow-50 border-2 border-black rounded-2xl space-y-2 animate-fadeIn">
                  <label className="block text-xs font-black text-black">
                    Masukkan Link URL Kustom:
                  </label>
                  <input
                    type="text"
                    value={customLinkInput}
                    onChange={(e) => {
                      setCustomLinkInput(e.target.value);
                      updateRedirectAction('custom', undefined, e.target.value);
                    }}
                    placeholder="Contoh: https://instagram.com/miejebew atau /#reviews"
                    className="w-full text-xs font-bold p-2.5 bg-white border-2 border-black rounded-xl focus:outline-none"
                  />
                  <p className="text-[10px] text-neutral-600 font-bold">
                    * Bisa berupa link eksternal (diawali https://) atau anchor link internal (#).
                  </p>
                </div>
              )}

              {/* Current Active Target Display Badge */}
              <div className="p-3 bg-neutral-100 border-2 border-black rounded-2xl flex items-center justify-between text-xs font-black">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase text-neutral-500 font-bold block">Status Aksi Pengalihan:</span>
                  <span className="text-black text-xs font-black">{getTargetDescription(formData.cta_link)}</span>
                </div>
                <span className="bg-black text-yellow-300 text-[10px] font-mono px-2 py-1 rounded">
                  {formData.cta_link}
                </span>
              </div>
            </div>

          </div>

          {/* 3. FOTO BANNER PROMOSI ("bisa ganti-ganti foto nya") */}
          <div className="bg-white border-3 border-black p-5 rounded-3xl shadow-[5px_5px_0_0_#000] space-y-4">
            <h3 className="font-black text-base uppercase text-black flex items-center gap-2 border-b-2 border-neutral-200 pb-2">
              <span>🖼️ 3. Foto & Gambar Banner Promosi</span>
            </h3>

            {/* ImagePickerInput Component */}
            <div className="bg-cream-50 border-2 border-black rounded-2xl p-4">
              <ImagePickerInput
                label="Foto Banner Promosi (Local Upload / Galeri / Link URL)"
                value={formData.image_url || '/promo-popup-banner.jpg'}
                onChange={(url) => setFormData(p => ({ ...p, image_url: url }))}
                helperText="Unggah file foto banner dari HP/komputer kamu, pilih dari galeri media yang sudah ada, atau paste link pemanggil gambar."
              />
            </div>

            {/* Preset Project Images */}
            <div className="pt-2">
              <span className="block text-xs font-black uppercase text-neutral-700 mb-2">
                Atau Pilih Preset Gambar Cepat:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: 'Mie Spesial Promo', url: '/promo-popup-banner.jpg' },
                  { name: 'Mie Original', url: '/rasa-mie/Original.jpeg' },
                  { name: 'Poster Tim', url: '/team-slide-dome.jpg' },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, image_url: preset.url }))}
                    className="p-2 border-2 border-black rounded-xl bg-neutral-50 hover:bg-yellow-200 text-left transition-colors cursor-pointer"
                  >
                    <div className="aspect-[4/3] rounded-lg overflow-hidden border border-black mb-1 bg-black">
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="block text-[10px] font-black truncate">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. JADWAL, JEDA & FREKUENSI */}
          <div className="bg-white border-3 border-black p-5 rounded-3xl shadow-[5px_5px_0_0_#000] space-y-4">
            <h3 className="font-black text-base uppercase text-black flex items-center gap-2 border-b-2 border-neutral-200 pb-2">
              <span>⏱️ 4. Jadwal & Frekuensi Kemunculan</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Target Halaman:
                </label>
                <select
                  value={formData.target_page}
                  onChange={e => setFormData(p => ({ ...p, target_page: e.target.value as any }))}
                  className="w-full text-xs font-bold p-2.5 bg-neutral-50 border-2 border-black rounded-xl focus:bg-white"
                >
                  <option value="all">Semua Halaman (All)</option>
                  <option value="home">Beranda Saja (Home)</option>
                  <option value="menu">Halaman Menu Saja</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Jeda Muncul (Detik):
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={formData.delay_seconds}
                  onChange={e => setFormData(p => ({ ...p, delay_seconds: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full text-xs font-black p-2.5 bg-neutral-50 border-2 border-black rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Frekuensi Tampil:
                </label>
                <select
                  value={formData.frequency}
                  onChange={e => setFormData(p => ({ ...p, frequency: e.target.value as any }))}
                  className="w-full text-xs font-bold p-2.5 bg-neutral-50 border-2 border-black rounded-xl focus:bg-white"
                >
                  <option value="once_per_session">1x Per Sesi Kunjungan</option>
                  <option value="once_per_day">1x Per Hari (Daily)</option>
                  <option value="always">Selalu Tampil (Always)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Jadwal Mulai Promosi (Opsional):</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_date || ''}
                  onChange={e => setFormData(p => ({ ...p, start_date: e.target.value }))}
                  className="w-full text-xs font-bold p-2.5 bg-neutral-50 border-2 border-black rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Jadwal Berakhir Promosi (Opsional):</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.end_date || ''}
                  onChange={e => setFormData(p => ({ ...p, end_date: e.target.value }))}
                  className="w-full text-xs font-bold p-2.5 bg-neutral-50 border-2 border-black rounded-xl focus:bg-white"
                />
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Visual Live Preview & Revision History (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Live Preview Card */}
          <div className="bg-white border-3 border-black p-5 rounded-3xl shadow-[5px_5px_0_0_#000] space-y-4 sticky top-6">
            <div className="flex items-center justify-between border-b-2 border-neutral-200 pb-2">
              <h3 className="font-black text-base uppercase text-black flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-jebew-red" />
                <span>Live Preview Tampilan</span>
              </h3>
              <span className="text-[10px] font-black bg-jebew-yellow border border-black px-2 py-0.5 rounded">
                REAL-TIME
              </span>
            </div>

            {/* Mini Replica of the Popup */}
            <div className="bg-[#FFFDF5] border-3 border-black rounded-2xl shadow-[4px_4px_0_0_#000] overflow-hidden space-y-3">
              {/* Top Accent Strip */}
              <div className="bg-jebew-yellow border-b-2 border-black px-3 py-1 flex items-center justify-between text-[10px] font-black uppercase text-black">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                  <span>{formData.badge_text || 'PROMO SPESIAL 🔥'}</span>
                </span>
                <span>MIE JEBEW OFFICIAL</span>
              </div>

              {/* Body */}
              <div className="p-3.5 space-y-2.5 text-left">
                <div className="inline-flex items-center gap-1.5 bg-red-600 border border-black px-2 py-0.5 shadow-xs -rotate-1">
                  <span className="font-black text-white text-xs tracking-wider">{formData.title || 'MIE JEBEW'}</span>
                  <Flame className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                </div>

                <h4 className="font-black text-lg text-red-600 uppercase leading-tight drop-shadow-xs">
                  {formData.headline || 'PEDASNYA BIKIN NAGIH!'}
                </h4>

                {formData.subtitle && (
                  <div className="inline-block bg-black text-yellow-300 px-2 py-0.5 border border-black rounded font-black text-[10px]">
                    {formData.subtitle}
                  </div>
                )}

                <p className="text-[11px] font-bold text-neutral-700 leading-relaxed border-l-2 border-red-600 pl-2">
                  {formData.description || 'Mie pedas + topping favorit lo.'}
                </p>

                {/* Poster Photo Preview */}
                <div className="relative aspect-video rounded-xl border-2 border-black overflow-hidden bg-neutral-900 mt-2 shadow-xs group">
                  <img
                    src={formData.image_url || '/promo-popup-banner.jpg'}
                    alt="Preview"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/promo-popup-banner.jpg';
                    }}
                  />
                  <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/80 px-2 py-0.5 rounded text-center text-[9px] font-black text-yellow-300">
                    Aksi Klik: {formData.cta_link}
                  </div>
                </div>

                {/* Buttons */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLivePreviewModal(true)}
                    className="flex-1 bg-black text-white font-black text-[11px] uppercase py-2 px-3 border-2 border-black rounded-xl shadow-[2px_2px_0_0_#FACC15] flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>{formData.cta_text || 'PESAN SEKARANG'}</span>
                    <ArrowRight className="w-3 h-3 text-yellow-400" />
                  </button>
                  <button
                    type="button"
                    className="bg-white text-neutral-600 font-bold text-[10px] py-2 px-2.5 border border-black rounded-xl"
                  >
                    {formData.secondary_text || 'Nanti aja'}
                  </button>
                </div>
              </div>
            </div>

            {/* Save Buttons Panel */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSave('draft')}
                disabled={saving}
                className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-black font-black text-xs py-2.5 border-2 border-black rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
              >
                Simpan Draft
              </button>
              <button
                type="button"
                onClick={() => handleSave('published')}
                disabled={saving}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black text-xs py-2.5 border-2 border-black rounded-xl shadow-brutal-xs cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan & Rilis'}
              </button>
            </div>

            {/* Revision History */}
            <div className="pt-4 border-t-2 border-neutral-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-black flex items-center gap-1">
                  <RotateCcw className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Riwayat Revisi ({history.length})</span>
                </span>
              </div>

              {history.length === 0 ? (
                <p className="text-[11px] text-neutral-500 font-bold italic">Belum ada riwayat revisi untuk banner ini.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {history.map((h) => (
                    <div
                      key={h.id}
                      className="p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl flex items-center justify-between gap-2 text-left"
                    >
                      <div className="min-w-0">
                        <span className="font-black text-xs text-black block truncate">{h.headline}</span>
                        <span className="text-[10px] text-neutral-500 font-bold block">
                          {h.saved_at.slice(0, 16).replace('T', ' ')} • {h.saved_by}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRollbackConfirm(h)}
                        className="px-2 py-1 bg-black text-yellow-300 text-[10px] font-black rounded border border-black cursor-pointer hover:bg-neutral-800"
                      >
                        Pulihkan
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* MODAL: TAMBAH BANNER BARU (+ Tambah Banner Baru) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white border-4 border-black shadow-[10px_10px_0_0_#000] rounded-3xl p-6 space-y-4 my-8 animate-scaleUp">
            
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div>
                <div className="inline-flex items-center gap-1 bg-jebew-yellow border border-black px-2 py-0.5 rounded text-[10px] font-black uppercase mb-1">
                  <span>✨</span>
                  <span>NEW CAMPAIGN</span>
                </div>
                <h3 className="font-black text-xl text-black">Tambah Banner Promosi Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center hover:bg-gray-100 font-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewBanner} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-black mb-1">
                    Tag Brand Merah <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="MIE JEBEW"
                    className="w-full px-3 py-2 bg-cream-50 border-2 border-black rounded-xl text-xs font-black text-black focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-black mb-1">
                    Badge Kuning Atas
                  </label>
                  <input
                    type="text"
                    value={newBadgeText}
                    onChange={(e) => setNewBadgeText(e.target.value)}
                    placeholder="PROMO SPESIAL 🔥"
                    className="w-full px-3 py-2 bg-cream-50 border-2 border-black rounded-xl text-xs font-bold text-black focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1">
                  Headline Utama Promosi <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newHeadline}
                  onChange={(e) => setNewHeadline(e.target.value)}
                  placeholder="PEDASNYA BIKIN NAGIH!"
                  className="w-full px-3 py-2 bg-cream-50 border-2 border-black rounded-xl text-xs font-black text-red-600 focus:outline-none focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-black mb-1">
                    Subtitle Badge Hitam
                  </label>
                  <input
                    type="text"
                    value={newSubtitle}
                    onChange={(e) => setNewSubtitle(e.target.value)}
                    placeholder="Laper? Gas pesan sekarang! 🍜"
                    className="w-full px-3 py-2 bg-cream-50 border-2 border-black rounded-xl text-xs font-bold text-black focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-black mb-1">
                    Teks Tombol Utama (CTA) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newCtaText}
                    onChange={(e) => setNewCtaText(e.target.value)}
                    placeholder="PESAN SEKARANG"
                    className="w-full px-3 py-2 bg-cream-50 border-2 border-black rounded-xl text-xs font-black text-black focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1">
                  Deskripsi Ajakan
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Jelaskan promo atau menu spesial yang sedang berlangsung..."
                  className="w-full px-3 py-2 bg-cream-50 border-2 border-black rounded-xl text-xs font-bold text-black focus:outline-none focus:bg-white"
                />
              </div>

              {/* Image Picker for New Banner */}
              <div className="bg-cream-50 border-2 border-black rounded-2xl p-3">
                <ImagePickerInput
                  label="Foto Banner Promosi (Local Upload / Galeri / Link URL)"
                  value={newImageUrl}
                  onChange={(url) => setNewImageUrl(url)}
                  helperText="Upload gambar dari komputer/HP, ambil dari galeri, atau masukkan URL foto."
                />
              </div>

              {/* Redirect Selection */}
              <div>
                <label className="block text-xs font-black text-black mb-1">
                  Sistem Arah Pengalihan (Target Redirect):
                </label>
                <select
                  value={newCtaLink}
                  onChange={(e) => setNewCtaLink(e.target.value)}
                  className="w-full px-3 py-2 bg-cream-50 border-2 border-black rounded-xl text-xs font-black text-black cursor-pointer"
                >
                  <option value="#order-original">🍜 Buka Modal Menu Mie Jebew Original</option>
                  <option value="#menu">📜 Scroll ke Bagian Menu Lengkap</option>
                  <option value="#spin">🎁 Buka Roda Keberuntungan (Spin Wheel)</option>
                  <option value="#custom-order">🥣 Buka Racik Sendiri (Custom Order)</option>
                  <option value="#cart">🛒 Buka Keranjang Pesanan</option>
                  <option value="whatsapp">💬 Hubungi WhatsApp CS</option>
                  {menuItems.map(m => (
                    <option key={m.id} value={`menu-item:${m.id}`}>
                      🍽️ Menu Spesifik: {m.name} (Rp{m.price.toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="new_active"
                  checked={newIsActive}
                  onChange={(e) => setNewIsActive(e.target.checked)}
                  className="w-4 h-4 border-2 border-black rounded accent-jebew-red cursor-pointer"
                />
                <label htmlFor="new_active" className="text-xs font-black text-black cursor-pointer select-none">
                  Langsung jadikan banner ini aktif di website publik
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-black">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 border-2 border-black rounded-xl text-xs font-black hover:bg-gray-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 bg-jebew-red hover:bg-red-700 text-white font-black text-xs border-2 border-black rounded-xl shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer disabled:opacity-50 transition-all"
                >
                  {creating ? 'Menyimpan...' : 'Simpan Banner Baru'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL: LIVE PREVIEW MODAL */}
      {showLivePreviewModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md"
        >
          <div className="relative w-full max-w-xl bg-[#FFFDF5] border-4 border-black shadow-[12px_12px_0_0_#000] rounded-2xl overflow-hidden animate-scaleUp">
            
            {/* Modal Preview Header */}
            <div className="bg-jebew-yellow border-b-3 border-black px-4 py-2 flex items-center justify-between text-xs font-black uppercase text-black">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-red-600" />
                <span>{formData.badge_text || 'PROMO SPESIAL 🔥'}</span>
              </span>
              <span className="bg-black text-white text-[10px] px-2 py-0.5 rounded">PREVIEW AKTIF</span>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowLivePreviewModal(false)}
              className="absolute top-2.5 right-2.5 z-20 w-8 h-8 bg-yellow-400 hover:bg-red-600 hover:text-white text-black font-black border-2 border-black rounded-lg shadow-[2px_2px_0_0_#000] flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5 stroke-[3]" />
            </button>

            {/* Preview Card Body */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 sm:p-6 items-center">
              
              <div className="md:col-span-7 space-y-3 text-left order-2 md:order-1">
                <div className="inline-flex items-center gap-2 bg-red-600 border-2 border-black px-3 py-1 shadow-[3px_3px_0_0_#000] -rotate-1">
                  <span className="font-black text-white text-base sm:text-lg tracking-wider">
                    {formData.title || 'MIE JEBEW'}
                  </span>
                  <Flame className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                </div>

                <h2 className="font-black text-2xl sm:text-3xl text-red-600 leading-tight uppercase tracking-tight drop-shadow-[1px_1px_0_#000]">
                  {formData.headline || 'PEDASNYA BIKIN NAGIH!'}
                </h2>

                {formData.subtitle && (
                  <div className="inline-block bg-black text-yellow-300 px-3 py-1 border-2 border-black rounded-md font-black text-xs sm:text-sm shadow-[2px_2px_0_0_#E11D48]">
                    {formData.subtitle}
                  </div>
                )}

                <p className="text-xs sm:text-sm font-bold text-neutral-800 leading-relaxed border-l-3 border-red-600 pl-2.5">
                  {formData.description || 'Mie pedas + topping favorit lo.'}
                </p>

                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <button
                    onClick={() => {
                      alert(`[Uji Coba Aksi]:\n${getTargetDescription(formData.cta_link)}`);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-black hover:bg-neutral-800 text-white font-black text-xs uppercase tracking-wider py-3 px-4 border-3 border-black rounded-xl shadow-[4px_4px_0_0_#FACC15] cursor-pointer"
                  >
                    <span>{formData.cta_text || 'PESAN SEKARANG'}</span>
                    <ArrowRight className="w-4 h-4 text-yellow-400" />
                  </button>

                  <button
                    onClick={() => setShowLivePreviewModal(false)}
                    className="bg-white hover:bg-neutral-100 text-neutral-700 font-bold text-xs py-2.5 px-3 border-2 border-black rounded-xl shadow-[2px_2px_0_0_#000] cursor-pointer"
                  >
                    {formData.secondary_text || 'Nanti aja'}
                  </button>
                </div>
              </div>

              <div
                className="md:col-span-5 flex justify-center order-1 md:order-2 cursor-pointer"
                onClick={() => {
                  alert(`[Uji Coba Klik Poster]:\n${getTargetDescription(formData.cta_link)}`);
                }}
                title="Klik poster untuk menguji arah pengalihan"
              >
                <div className="relative w-full max-w-[220px]">
                  <div className="absolute inset-0 bg-yellow-400 border-3 border-black rounded-xl translate-x-2 translate-y-2 -rotate-2" />
                  <div className="relative aspect-square sm:aspect-[4/5] bg-neutral-900 border-3 border-black rounded-xl overflow-hidden shadow-[4px_4px_0_0_#000]">
                    <img
                      src={formData.image_url || '/promo-popup-banner.jpg'}
                      alt="Preview"
                      className="w-full h-full object-cover object-center"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/promo-popup-banner.jpg';
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-yellow-400 border-2 border-black p-1.5 rounded-lg shadow-sm">
                      <Utensils className="w-4 h-4 text-black" />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <div className="bg-neutral-100 border-t-2 border-black p-3 text-center flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-600">
                Arah Klik: <strong>{formData.cta_link}</strong>
              </span>
              <button
                onClick={() => setShowLivePreviewModal(false)}
                className="bg-black text-white font-black text-xs py-1.5 px-4 rounded-lg border border-black cursor-pointer"
              >
                Tutup Tampilan Preview
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRM */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-white border-4 border-black p-6 rounded-2xl shadow-[8px_8px_0_0_#000] max-w-sm w-full space-y-4 text-center">
            <div className="w-12 h-12 bg-red-100 border-2 border-black rounded-full flex items-center justify-center mx-auto text-red-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-black text-lg text-black">Hapus Banner Ini?</h3>
            <p className="text-xs font-bold text-neutral-600 leading-relaxed">
              Banner ini akan dihapus dari sistem. Jika ini banner yang sedang aktif, sistem akan mengaktifkan banner lainnya.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border-2 border-black font-bold text-xs rounded-xl hover:bg-neutral-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteBanner(deleteConfirmId)}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs border-2 border-black rounded-xl shadow-xs cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ROLLBACK CONFIRM */}
      {rollbackConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-white border-4 border-black p-6 rounded-2xl shadow-[8px_8px_0_0_#000] max-w-md w-full space-y-4">
            <h3 className="font-black text-lg uppercase text-black flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-red-600" />
              <span>Konfirmasi Pemulihan Versi?</span>
            </h3>
            <p className="text-xs font-bold text-neutral-600 leading-relaxed">
              Anda akan memulihkan konfigurasi popup ke versi revisi: <strong className="text-black">{rollbackConfirm.headline}</strong> (disimpan pada {rollbackConfirm.saved_at.slice(0, 16).replace('T', ' ')}).
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRollbackConfirm(null)}
                className="px-4 py-2 border-2 border-black font-bold text-xs rounded-xl hover:bg-neutral-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleRollback(rollbackConfirm)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs border-2 border-black rounded-xl shadow-[2px_2px_0_0_#000] cursor-pointer"
              >
                Ya, Pulihkan Versi Ini
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
