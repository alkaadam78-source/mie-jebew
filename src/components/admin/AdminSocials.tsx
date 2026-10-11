import React, { useState, useEffect } from 'react';
import { SocialLinkItem } from '../../types';
import {
  apiGetSocialLinks,
  apiCreateSocialLink,
  apiUpdateSocialLink,
  apiDeleteSocialLink,
} from '../../services/api';
import {
  InstagramIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  XIcon,
  RefreshCwIcon,
  ExternalLinkIcon,
} from '../ui/Icons';

export const AdminSocials: React.FC = () => {
  const [links, setLinks] = useState<SocialLinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SocialLinkItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    platform: 'instagram',
    handle: '',
    url: '',
    icon: 'instagram',
    is_active: 1,
    sort_order: 1,
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const res = await apiGetSocialLinks();
      setLinks(res.links || []);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat link social media', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      platform: 'instagram',
      handle: '@miejebew.official',
      url: 'https://instagram.com/miejebew.official',
      icon: 'instagram',
      is_active: 1,
      sort_order: links.length + 1,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: SocialLinkItem) => {
    setEditingItem(item);
    setFormData({
      platform: item.platform,
      handle: item.handle,
      url: item.url,
      icon: item.icon || item.platform,
      is_active: item.is_active ? 1 : 0,
      sort_order: item.sort_order || 1,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.url.trim() || !formData.handle.trim()) {
      showToast('Handle dan URL wajib diisi', 'error');
      return;
    }

    try {
      new URL(formData.url);
    } catch {
      showToast('Format URL tidak valid (harus dimulai dengan https:// atau http://)', 'error');
      return;
    }

    try {
      if (editingItem) {
        await apiUpdateSocialLink(editingItem.id, formData);
        showToast('Link sosial media berhasil diperbarui', 'success');
      } else {
        await apiCreateSocialLink(formData);
        showToast('Link sosial media baru berhasil ditambahkan', 'success');
      }
      setIsModalOpen(false);
      fetchLinks();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan link sosial media', 'error');
    }
  };

  const handleToggleActive = async (item: SocialLinkItem) => {
    const nextStatus = item.is_active ? 0 : 1;
    try {
      await apiUpdateSocialLink(item.id, { is_active: nextStatus });
      setLinks((prev) =>
        prev.map((l) => (l.id === item.id ? { ...l, is_active: nextStatus } : l))
      );
      showToast(`Status ${item.platform} berhasil diubah`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal mengubah status', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiDeleteSocialLink(id);
      showToast('Link sosial media berhasil dihapus', 'success');
      setDeleteConfirmId(null);
      fetchLinks();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus link', 'error');
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
            <InstagramIcon className="w-6 h-6 text-brand-red" />
            <h1 className="text-2xl font-black uppercase tracking-tight text-neutral-900">
              Our Social Media
            </h1>
          </div>
          <p className="text-sm text-neutral-600 font-medium mt-1">
            Kelola tautan akun Instagram, TikTok, WhatsApp, dan saluran media sosial resmi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLinks}
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
            <span>Tambah Akun</span>
          </button>
        </div>
      </div>

      {/* Social Links List */}
      {loading ? (
        <div className="p-12 text-center bg-white border-2 border-black">
          <RefreshCwIcon className="w-8 h-8 animate-spin mx-auto text-brand-red mb-2" />
          <p className="font-bold text-neutral-600">Memuat link sosial media...</p>
        </div>
      ) : links.length === 0 ? (
        <div className="p-12 text-center bg-white border-2 border-black">
          <InstagramIcon className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
          <h3 className="font-black text-lg uppercase text-neutral-800">Belum Ada Akun Terhubung</h3>
          <p className="text-sm text-neutral-500 max-w-sm mx-auto mt-1 mb-4">
            Tambahkan akun media sosial agar pembeli dapat mengikuti update produk terbaru.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-brand-yellow border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0_0_#000]"
          >
            Tambah Akun Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {links.map((link) => (
            <div
              key={link.id}
              className={`bg-white border-2 border-black shadow-[4px_4px_0_0_#000] p-5 flex flex-col justify-between transition-opacity ${
                !link.is_active ? 'opacity-60 bg-neutral-50' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 bg-brand-yellow border-2 border-black text-xs font-black uppercase">
                    {link.platform}
                  </span>
                  <button
                    onClick={() => handleToggleActive(link)}
                    className={`px-2 py-0.5 text-xs font-black uppercase border border-black transition-colors ${
                      link.is_active
                        ? 'bg-green-400 hover:bg-green-500 text-black'
                        : 'bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    {link.is_active ? 'Aktif' : 'Nonaktif'}
                  </button>
                </div>

                <h3 className="font-black text-lg text-neutral-900">{link.handle}</h3>

                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-brand-red hover:underline font-bold mt-2 truncate"
                >
                  <span className="truncate">{link.url}</span>
                  <ExternalLinkIcon className="w-3.5 h-3.5 flex-shrink-0" />
                </a>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t-2 border-neutral-100">
                <span className="text-[10px] font-black uppercase text-neutral-400">
                  Urutan #{link.sort_order}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(link)}
                    className="p-1.5 bg-brand-yellow hover:bg-yellow-400 border-2 border-black transition-transform active:scale-95"
                    title="Edit Link"
                  >
                    <EditIcon className="w-4 h-4 text-black" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(link.id)}
                    className="p-1.5 bg-brand-red hover:bg-red-700 border-2 border-black text-white transition-transform active:scale-95"
                    title="Hapus Link"
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
            <h3 className="font-black text-lg uppercase text-brand-red">Hapus Akun Sosial Media</h3>
            <p className="text-sm text-neutral-700 font-medium">
              Apakah Anda yakin ingin menghapus akun ini dari daftar website publik?
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
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-6 max-w-md w-full shadow-[8px_8px_0_0_#000] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black">
              <h2 className="text-xl font-black uppercase text-neutral-900">
                {editingItem ? 'Edit Akun Sosial Media' : 'Tambah Akun Sosial Media'}
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
                  Platform *
                </label>
                <select
                  value={formData.platform}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      platform: e.target.value,
                      icon: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-white border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                >
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="facebook">Facebook</option>
                  <option value="youtube">YouTube</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Nama Akun / Handle *
                </label>
                <input
                  type="text"
                  required
                  value={formData.handle}
                  onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                  placeholder="@miejebew.official"
                  className="w-full px-3 py-2 bg-white border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Link / URL Tujuan Lengkap *
                </label>
                <input
                  type="url"
                  required
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://instagram.com/..."
                  className="w-full px-3 py-2 bg-white border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-white border-2 border-black text-sm font-bold focus:outline-none"
                  >
                    <option value={1}>Aktif</option>
                    <option value={0}>Nonaktif</option>
                  </select>
                </div>
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
                  className="px-5 py-2 bg-brand-yellow hover:bg-yellow-400 border-2 border-black font-black uppercase text-xs shadow-[3px_3px_0_0_#000]"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambah Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
