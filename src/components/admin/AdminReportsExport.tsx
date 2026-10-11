import React, { useState } from 'react';
import { Download } from '../ui/Icons';

export const AdminReportsExport: React.FC = () => {
  const [downloading, setDownloading] = useState<string | null>(null);

  const token = localStorage.getItem('token') || '';

  const handleDownload = async (endpoint: string, reportName: string) => {
    try {
      setDownloading(reportName);
      const res = await fetch(`/api/admin/export/${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `laporan-${endpoint}-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Gagal mengunduh laporan. Periksa izin otentikasi admin.');
      }
    } catch (err: any) {
      alert(`Gagal mengunduh: ${err.message}`);
    } finally {
      setDownloading(null);
    }
  };

  const reports = [
    {
      id: 'orders',
      title: 'Laporan Seluruh Pesanan & Penjualan',
      description: 'Daftar transaksi pesanan masuk, nama pemesan, nomor WhatsApp, alamat, metode bayar, dan total omzet.',
      icon: '🛍️',
      format: 'CSV (.csv)',
    },
    {
      id: 'coins',
      title: 'Buku Besar Transaksi Koin & Reward',
      description: 'Seluruh riwayat mutasi koin masuk (spin harian) dan koin keluar (penukaran voucher/hadiah fisik).',
      icon: '🪙',
      format: 'CSV (.csv)',
    },
    {
      id: 'inventory',
      title: 'Laporan Stok & Inventaris Produk',
      description: 'Data stok riil porsi mie, sambal botol kemasan, hadiah fisik, batas minimum, dan perkiraan habis.',
      icon: '📦',
      format: 'CSV (.csv)',
    },
    {
      id: 'audit-logs',
      title: 'Audit Logs Aktivitas Administrator',
      description: 'Catatan seluruh aksi login, perubahan harga, penyesuaian koin, restore backup, dan emergency mode.',
      icon: '📋',
      format: 'CSV (.csv)',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📊</span>
          <h1 className="text-2xl font-black uppercase tracking-tight">Pusat Ekspor Laporan & Bisnis</h1>
          <span className="px-2 py-0.5 bg-jebew-yellow text-black border-2 border-black text-[10px] font-black uppercase rounded shadow-brutal-xs">
            Export Center
          </span>
        </div>
        <p className="text-xs font-bold text-neutral-600 mt-1">
          Unduh laporan operasional dan keuangan resmi format CSV yang kompatibel dengan Microsoft Excel dan Google Sheets.
        </p>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((rep) => {
          const isCurrent = downloading === rep.id;

          return (
            <div
              key={rep.id}
              className="p-5 bg-white border-3 border-black shadow-[4px_4px_0_0_#000] flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{rep.icon}</span>
                  <span className="px-2 py-0.5 bg-neutral-100 border border-black text-[10px] font-mono font-bold rounded">
                    {rep.format}
                  </span>
                </div>
                <h3 className="font-black text-sm text-black">{rep.title}</h3>
                <p className="text-xs font-medium text-neutral-600 leading-snug">{rep.description}</p>
              </div>

              <button
                onClick={() => handleDownload(rep.id, rep.id)}
                disabled={Boolean(downloading)}
                className="w-full py-2.5 bg-jebew-red hover:bg-red-700 text-white font-black text-xs uppercase border-2 border-black shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Download className={`w-4 h-4 ${isCurrent ? 'animate-bounce' : ''}`} />
                {isCurrent ? 'Mengunduh File...' : 'Unduh File CSV'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
