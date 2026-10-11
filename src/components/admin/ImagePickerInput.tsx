import React, { useState, useRef } from 'react';
import { UploadIcon, TrashIcon, XIcon, CheckIcon, CameraIcon, ImageIcon, RefreshCwIcon } from '../ui/Icons';
import { apiUploadMedia, apiGetMedia } from '../../services/api';
import { MediaItem } from '../../types';

interface ImagePickerInputProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  helperText?: string;
}

export const ImagePickerInput: React.FC<ImagePickerInputProps> = ({
  label = 'Foto Produk / Makanan',
  value,
  onChange,
  placeholder = '/rasa-mie/Original.jpeg',
  helperText = 'Jika dikosongkan, kartu menu akan otomatis menampilkan kartu misteri "?"',
}) => {
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryItems, setGalleryItems] = useState<MediaItem[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Ukuran file maksimal 10MB!');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Harap pilih file gambar (JPG, PNG, WEBP, GIF)');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    setUploading(true);
    setErrorMsg(null);
    try {
      const res = await apiUploadMedia(file);
      onChange(res.file.url);
      setSuccessMsg('Foto berhasil diunggah!');
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengunggah foto');
      setTimeout(() => setErrorMsg(null), 3500);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openGalleryModal = async () => {
    setShowGallery(true);
    setLoadingGallery(true);
    try {
      const res = await apiGetMedia();
      setGalleryItems(res.files || []);
    } catch (err) {
      console.error('Failed to load gallery:', err);
    } finally {
      setLoadingGallery(false);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-black uppercase text-black">
          {label}
        </label>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Main Preview & Action Container */}
      <div className="bg-cream-50 border-2 border-black rounded-2xl p-3 sm:p-4 shadow-brutal-sm">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          
          {/* Image Preview Box */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 bg-white border-2 border-black rounded-xl overflow-hidden shadow-brutal-sm flex items-center justify-center">
            {value ? (
              <>
                <img
                  src={value}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback on broken image
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => onChange('')}
                  title="Hapus foto"
                  className="absolute top-1.5 right-1.5 p-1 bg-jebew-red text-white border border-black rounded-md hover:scale-110 transition-transform shadow-brutal-sm cursor-pointer"
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-2 text-center text-gray-500">
                <span className="text-2xl font-black text-black">?</span>
                <span className="text-[10px] font-bold text-gray-600 mt-1">Tanpa Foto</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex-1 w-full space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-jebew-yellow hover:bg-yellow-300 text-black border-2 border-black rounded-xl text-xs font-black shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <RefreshCwIcon className="w-4 h-4 animate-spin" />
                    <span>Mengunggah...</span>
                  </>
                ) : (
                  <>
                    <CameraIcon className="w-4 h-4" />
                    <span>Upload Foto Baru</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={openGalleryModal}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white hover:bg-cream text-black border-2 border-black rounded-xl text-xs font-black shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Pilih dari Galeri</span>
              </button>

              {value && (
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 border-2 border-black rounded-xl text-xs font-black shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer"
                >
                  <TrashIcon className="w-4 h-4" />
                  <span>Kosongkan</span>
                </button>
              )}
            </div>

            {/* Notification messages */}
            {successMsg && (
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-300 px-2.5 py-1.5 rounded-lg">
                <CheckIcon className="w-3.5 h-3.5" />
                <span>{successMsg}</span>
              </div>
            )}
            {errorMsg && (
              <div className="flex items-center gap-1.5 text-xs font-black text-red-700 bg-red-50 border border-red-300 px-2.5 py-1.5 rounded-lg">
                <XIcon className="w-3.5 h-3.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Toggle manual URL input */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowManualUrl(!showManualUrl)}
                className="text-[11px] font-bold text-gray-600 hover:text-black underline cursor-pointer"
              >
                {showManualUrl ? '▲ Sembunyikan URL teks' : '▼ Atau masukkan URL teks manual'}
              </button>

              {showManualUrl && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 bg-white border-2 border-black rounded-xl text-xs font-mono font-bold text-black focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {helperText && (
          <p className="text-[11px] font-semibold text-gray-600 mt-2.5 pt-2 border-t border-gray-200">
            💡 {helperText}
          </p>
        )}
      </div>

      {/* Gallery Selector Modal */}
      {showGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border-3 border-black rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-brutal-lg">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b-3 border-black bg-cream flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-black" />
                <h3 className="font-black text-lg text-black">Galeri Media Mie Jebew</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGallery(false)}
                className="p-1.5 bg-white hover:bg-cream border-2 border-black rounded-xl shadow-brutal-sm cursor-pointer"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {loadingGallery ? (
                <div className="py-12 text-center text-sm font-bold text-gray-600">
                  <RefreshCwIcon className="w-6 h-6 animate-spin mx-auto mb-2 text-black" />
                  Memuat gambar galeri...
                </div>
              ) : galleryItems.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm font-bold text-gray-700">Belum ada file di Media Library.</p>
                  <p className="text-xs text-gray-500 mt-1">Kamu bisa upload langsung menggunakan tombol "Upload Foto Baru".</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {/* Default / Original image quick choice */}
                  <div
                    onClick={() => {
                      onChange('/rasa-mie/Original.jpeg');
                      setShowGallery(false);
                    }}
                    className={`group relative aspect-square bg-cream-100 border-2 border-black rounded-xl overflow-hidden cursor-pointer hover:shadow-brutal-sm transition-all ${
                      value === '/rasa-mie/Original.jpeg' ? 'ring-4 ring-jebew-red' : ''
                    }`}
                  >
                    <img
                      src="/rasa-mie/Original.jpeg"
                      alt="Original"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-black/75 text-white p-1 text-[10px] font-black truncate text-center">
                      Foto Original
                    </div>
                  </div>

                  {/* Uploaded media files */}
                  {galleryItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        onChange(item.url);
                        setShowGallery(false);
                      }}
                      className={`group relative aspect-square bg-cream-100 border-2 border-black rounded-xl overflow-hidden cursor-pointer hover:shadow-brutal-sm transition-all ${
                        value === item.url ? 'ring-4 ring-jebew-red' : ''
                      }`}
                    >
                      <img
                        src={item.url}
                        alt={item.original_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-black/75 text-white p-1 text-[10px] font-bold truncate text-center">
                        {item.original_name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t-2 border-black bg-cream-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowGallery(false);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-jebew-yellow border-2 border-black rounded-xl text-xs font-black shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer"
              >
                <UploadIcon className="w-4 h-4" />
                <span>Upload Foto dari Perangkat</span>
              </button>

              <button
                type="button"
                onClick={() => setShowGallery(false)}
                className="px-4 py-2 bg-white border-2 border-black rounded-xl text-xs font-black shadow-brutal-sm hover:bg-cream cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
