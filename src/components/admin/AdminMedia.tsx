import React, { useState, useEffect, useRef } from 'react';
import { MediaItem } from '../../types';
import { apiGetMedia, apiUploadMedia, apiDeleteMedia } from '../../services/api';
import {
  UploadIcon,
  TrashIcon,
  CheckIcon,
  XIcon,
  RefreshCwIcon,
  CopyIcon,
  SearchIcon,
  CameraIcon,
} from '../ui/Icons';

export const AdminMedia: React.FC = () => {
  const [files, setFiles] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await apiGetMedia();
      setFiles(res.files || []);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat media', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const file = selectedFiles[0];

    // Check size limit: 5MB
    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran file maksimal 5MB', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Check MIME
    if (!file.type.startsWith('image/')) {
      showToast('Hanya file gambar (JPG, PNG, WEBP, GIF, SVG) yang diizinkan', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    try {
      const res = await apiUploadMedia(file);
      showToast(res.message || 'Gambar berhasil diunggah', 'success');
      fetchMedia();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengunggah file', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    showToast('URL gambar disalin ke clipboard!', 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiDeleteMedia(id);
      showToast('Media berhasil dihapus', 'success');
      setDeleteConfirmId(null);
      fetchMedia();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus media', 'error');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredFiles = files.filter(
    (f) =>
      f.original_name.toLowerCase().includes(search.toLowerCase()) ||
      f.file_name.toLowerCase().includes(search.toLowerCase())
  );

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
            <CameraIcon className="w-6 h-6 text-brand-red" />
            <h1 className="text-2xl font-black uppercase tracking-tight text-neutral-900">
              Media Library
            </h1>
          </div>
          <p className="text-sm text-neutral-600 font-medium mt-1">
            Unggah dan kelola gambar menu, botol, promo, dan poster tanpa perlu redeploy website
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMedia}
            className="p-2.5 bg-neutral-100 hover:bg-neutral-200 border-2 border-black font-bold transition-transform active:scale-95"
            title="Refresh"
          >
            <RefreshCwIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />

          <button
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-yellow hover:bg-yellow-400 border-2 border-black font-black uppercase text-sm shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50"
          >
            {uploading ? (
              <RefreshCwIcon className="w-5 h-5 animate-spin" />
            ) : (
              <UploadIcon className="w-5 h-5" />
            )}
            <span>{uploading ? 'Mengunggah...' : 'Unggah Gambar'}</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-neutral-100 p-4 border-2 border-black">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Cari file berdasarkan nama gambar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
          />
        </div>
        <span className="text-xs font-bold text-neutral-600 whitespace-nowrap">
          Total: {filteredFiles.length} File
        </span>
      </div>

      {/* Grid of Media */}
      {loading ? (
        <div className="p-12 text-center bg-white border-2 border-black">
          <RefreshCwIcon className="w-8 h-8 animate-spin mx-auto text-brand-red mb-2" />
          <p className="font-bold text-neutral-600">Memuat galeri media...</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="p-12 text-center bg-white border-2 border-black">
          <CameraIcon className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
          <h3 className="font-black text-lg uppercase text-neutral-800">Media Masih Kosong</h3>
          <p className="text-sm text-neutral-500 max-w-sm mx-auto mt-1 mb-4">
            Klik tombol Unggah Gambar untuk menyimpan foto menu atau aset website.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-brand-yellow border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0_0_#000]"
          >
            Unggah File Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="bg-white border-2 border-black shadow-[3px_3px_0_0_#000] overflow-hidden flex flex-col justify-between group"
            >
              <div className="relative h-36 bg-neutral-100 overflow-hidden border-b-2 border-black flex items-center justify-center">
                <img
                  src={file.url}
                  alt={file.original_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/75 text-white text-[9px] font-black uppercase rounded">
                  {formatFileSize(file.file_size)}
                </span>
              </div>

              <div className="p-2.5 space-y-1.5">
                <p
                  className="text-xs font-bold text-neutral-800 truncate"
                  title={file.original_name}
                >
                  {file.original_name}
                </p>

                <div className="flex items-center justify-between gap-1 pt-1 border-t border-neutral-200">
                  <button
                    onClick={() => handleCopyUrl(file.url, file.id)}
                    className="flex-1 flex items-center justify-center gap-1 py-1 px-2 bg-neutral-100 hover:bg-brand-yellow border border-black text-[10px] font-black uppercase transition-colors"
                    title="Salin URL gambar"
                  >
                    {copiedId === file.id ? (
                      <>
                        <CheckIcon className="w-3 h-3 text-green-700" />
                        <span>Tersalin</span>
                      </>
                    ) : (
                      <>
                        <CopyIcon className="w-3 h-3 text-neutral-700" />
                        <span>Salin URL</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setDeleteConfirmId(file.id)}
                    className="p-1 bg-brand-red text-white hover:bg-red-700 border border-black transition-colors"
                    title="Hapus gambar"
                  >
                    <TrashIcon className="w-3 h-3" />
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
            <h3 className="font-black text-lg uppercase text-brand-red">Hapus Media</h3>
            <p className="text-sm text-neutral-700 font-medium">
              Apakah Anda yakin ingin menghapus file ini dari server? Pastikan file ini tidak sedang digunakan pada menu atau halaman publik.
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
    </div>
  );
};
