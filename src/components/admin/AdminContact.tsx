import React, { useState, useEffect } from 'react';
import { ContactInfoData } from '../../types';
import { apiGetContact, apiUpdateContact } from '../../services/api';
import {
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
  CheckIcon,
  XIcon,
  RefreshCwIcon,
  ExternalLinkIcon,
} from '../ui/Icons';

export const AdminContact: React.FC = () => {
  const [contact, setContact] = useState<ContactInfoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchContact = async () => {
    setLoading(true);
    try {
      const res = await apiGetContact();
      setContact(res.contact);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat kontak', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContact();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact) return;

    if (!contact.whatsapp_number.trim() || !contact.address_description.trim()) {
      showToast('Nomor WhatsApp dan Alamat wajib diisi', 'error');
      return;
    }

    setSaving(true);
    try {
      await apiUpdateContact(contact);
      showToast('Informasi kontak berhasil disimpan!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan kontak', 'error');
    } finally {
      setSaving(false);
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
            <PhoneIcon className="w-6 h-6 text-brand-red" />
            <h1 className="text-2xl font-black uppercase tracking-tight text-neutral-900">
              Contact & Location Info
            </h1>
          </div>
          <p className="text-sm text-neutral-600 font-medium mt-1">
            Atur nomor WhatsApp pemesanan, jam buka outlet, alamat fisik, dan link Google Maps
          </p>
        </div>
        <button
          onClick={fetchContact}
          className="p-2.5 bg-neutral-100 hover:bg-neutral-200 border-2 border-black font-bold transition-transform active:scale-95"
          title="Refresh"
        >
          <RefreshCwIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Form Content */}
      <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0_0_#000]">
        {loading || !contact ? (
          <div className="py-12 text-center">
            <RefreshCwIcon className="w-8 h-8 animate-spin mx-auto text-brand-red mb-2" />
            <p className="font-bold text-neutral-600">Memuat data kontak...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
            {/* WhatsApp & Telepon */}
            <div className="border-b-2 border-neutral-200 pb-5 space-y-4">
              <h3 className="font-black text-lg uppercase text-neutral-900 flex items-center gap-2">
                <PhoneIcon className="w-5 h-5 text-brand-red" />
                <span>Saluran Pemesanan Cepat</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                    Nomor WhatsApp Order (Format 62xxx) *
                  </label>
                  <input
                    type="text"
                    required
                    value={contact.whatsapp_number}
                    onChange={(e) =>
                      setContact({ ...contact, whatsapp_number: e.target.value.replace(/[^0-9]/g, '') })
                    }
                    placeholder="6281234567890"
                    className="w-full px-3 py-2 bg-neutral-50 border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  />
                  <p className="text-[10px] text-neutral-500 font-medium mt-1">
                    Nomor ini yang dibuka langsung saat pelanggan klik Kirim Pesanan via WhatsApp.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                    Tampilan Nomor WhatsApp (Display)
                  </label>
                  <input
                    type="text"
                    value={contact.whatsapp_display}
                    onChange={(e) =>
                      setContact({ ...contact, whatsapp_display: e.target.value })
                    }
                    placeholder="0812-3456-7890"
                    className="w-full px-3 py-2 bg-neutral-50 border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                    Nomor Telepon Reguler
                  </label>
                  <input
                    type="text"
                    value={contact.phone}
                    onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                    placeholder="021-12345678"
                    className="w-full px-3 py-2 bg-neutral-50 border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                    Email Resmi
                  </label>
                  <input
                    type="email"
                    value={contact.email || ''}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    placeholder="halo@miejebew.id"
                    className="w-full px-3 py-2 bg-neutral-50 border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  />
                </div>
              </div>
            </div>

            {/* Jam Operasional */}
            <div className="border-b-2 border-neutral-200 pb-5 space-y-4">
              <h3 className="font-black text-lg uppercase text-neutral-900 flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-brand-red" />
                <span>Jam Buka & Operasional</span>
              </h3>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Jam Buka Outlet
                </label>
                <input
                  type="text"
                  required
                  value={contact.opening_hours}
                  onChange={(e) => setContact({ ...contact, opening_hours: e.target.value })}
                  placeholder="Setiap Hari: 10:00 - 22:00 WIB"
                  className="w-full px-3 py-2 bg-neutral-50 border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>
            </div>

            {/* Alamat Fisik & Peta */}
            <div className="space-y-4">
              <h3 className="font-black text-lg uppercase text-neutral-900 flex items-center gap-2">
                <MapPinIcon className="w-5 h-5 text-brand-red" />
                <span>Lokasi Outlet & Titik Peta</span>
              </h3>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Catatan Patokan Lokasi Singkat
                </label>
                <input
                  type="text"
                  value={contact.address_note}
                  onChange={(e) => setContact({ ...contact, address_note: e.target.value })}
                  placeholder="Contoh: Depan Kampus B, Sebelah Toko Buku Utama"
                  className="w-full px-3 py-2 bg-neutral-50 border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Alamat Lengkap Outlet *
                </label>
                <textarea
                  rows={3}
                  required
                  value={contact.address_description}
                  onChange={(e) =>
                    setContact({ ...contact, address_description: e.target.value })
                  }
                  placeholder="Jl. Merdeka No. 45, Kecamatan Jebew, Kota Bandung, Jawa Barat"
                  className="w-full px-3 py-2 bg-neutral-50 border-2 border-black text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Link Google Maps / Peta
                </label>
                <input
                  type="url"
                  value={contact.google_maps_url || ''}
                  onChange={(e) =>
                    setContact({ ...contact, google_maps_url: e.target.value })
                  }
                  placeholder="https://maps.google.com/..."
                  className="w-full px-3 py-2 bg-neutral-50 border-2 border-black text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
                {contact.google_maps_url && (
                  <a
                    href={contact.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-brand-red font-bold hover:underline mt-1"
                  >
                    <span>Uji Buka Link Maps</span>
                    <ExternalLinkIcon className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            <div className="pt-4 border-t-2 border-black flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-yellow hover:bg-yellow-400 border-2 border-black font-black uppercase text-sm shadow-[3px_3px_0_0_#000] disabled:opacity-50"
              >
                {saving && <RefreshCwIcon className="w-4 h-4 animate-spin" />}
                <span>Simpan Informasi Kontak</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
