import React, { useState, useEffect } from 'react';
import {
  GiftIcon,
  TagIcon,
  UsersIcon,
  ClockIcon,
  SearchIcon,
  RefreshCwIcon,
  SaveIcon,
  XIcon,
} from '../ui/Icons';

interface SpinSegment {
  index: number;
  coins: number;
  label: string;
  weight: number;
  color?: string;
}

interface VoucherCatalogItem {
  title: string;
  cost: number;
  discount: number;
  stockQuota?: number;
  validityDays?: number;
}

interface CustomerUser {
  id: number;
  name: string;
  phone: string;
  coins_balance: number;
  last_spin_wib_date?: string;
  created_at: string;
  total_spins?: number;
  total_vouchers_claimed?: number;
}

interface RedemptionRecord {
  id: string;
  code: string;
  title: string;
  reward_type: string;
  discount_amount: number;
  cost_in_coins: number;
  is_used: number;
  created_at: string;
  used_at?: string;
  customer_name?: string;
  customer_phone?: string;
}

export const AdminRewards: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'spin' | 'vouchers' | 'users' | 'redemptions'>('spin');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Spin & Voucher Settings
  const [segments, setSegments] = useState<SpinSegment[]>([]);
  const [catalog, setCatalog] = useState<Record<string, VoucherCatalogItem>>({});
  const [spinLimit, setSpinLimit] = useState<string>('1x per hari (Reset 00:00 WIB)');

  // Users & Coins
  const [users, setUsers] = useState<CustomerUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [adjustModalUser, setAdjustModalUser] = useState<CustomerUser | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');

  // Redemptions
  const [redemptions, setRedemptions] = useState<RedemptionRecord[]>([]);

  const token = localStorage.getItem('token') || '';

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/rewards/admin/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSegments(data.segments || []);
        setCatalog(data.catalog || {});
        if (data.spinLimit) setSpinLimit(data.spinLimit);
      }
    } catch (err) {
      console.error('Failed to load rewards settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (userSearch.trim()) params.append('search', userSearch.trim());

      const res = await fetch(`/api/rewards/admin/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRedemptions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/rewards/admin/redemptions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRedemptions(data.redemptions || []);
      }
    } catch (err) {
      console.error('Failed to load redemptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'spin' || activeSubTab === 'vouchers') {
      fetchSettings();
    } else if (activeSubTab === 'users') {
      fetchUsers();
    } else if (activeSubTab === 'redemptions') {
      fetchRedemptions();
    }
  }, [activeSubTab]);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/rewards/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          segments,
          catalog,
        }),
      });

      if (res.ok) {
        setFeedback({
          text: 'Konfigurasi hadiah spin wheel dan katalog voucher berhasil disimpan & dicatat di audit log!',
          type: 'success',
        });
      } else {
        const err = await res.json();
        setFeedback({ text: err.error || 'Gagal menyimpan pengaturan.', type: 'error' });
      }
    } catch {
      setFeedback({ text: 'Terjadi kesalahan server.', type: 'error' });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleAdjustCoinsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalUser || adjustAmount === 0) return;

    try {
      setSaving(true);
      const res = await fetch('/api/rewards/admin/adjust-coins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: adjustModalUser.id,
          amount: adjustAmount,
          reason: adjustReason.trim() || 'Penyesuaian manual oleh admin',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setFeedback({
          text: `${data.message} (Audit log tercatat)`,
          type: 'success',
        });
        setAdjustModalUser(null);
        setAdjustAmount(0);
        setAdjustReason('');
        fetchUsers();
      } else {
        const err = await res.json();
        setFeedback({ text: err.error || 'Gagal menyesuaikan saldo koin.', type: 'error' });
      }
    } catch {
      setFeedback({ text: 'Terjadi kesalahan sistem.', type: 'error' });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 border-4 border-black font-black uppercase text-sm shadow-[4px_4px_0_0_#000] flex items-center justify-between ${
            feedback.type === 'success' ? 'bg-emerald-400 text-black' : 'bg-brand-red text-white'
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-80">
            <XIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 sm:p-6 border-4 border-black shadow-[6px_6px_0_0_#000]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-brand-red border-2 border-black flex items-center justify-center font-black text-white">
              <GiftIcon className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900">
              PUSAT VOUCHER & KOIN (REWARDS PANEL)
            </h1>
          </div>
          <p className="text-xs sm:text-sm font-bold text-neutral-600">
            Atur hadiah spin wheel harian, probabilitas peluang (%), katalog penukaran voucher, saldo koin user, dan riwayat klaim dengan audit trail otomatis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(activeSubTab === 'spin' || activeSubTab === 'vouchers') && (
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white border-3 border-black font-black uppercase text-xs shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-2"
            >
              <SaveIcon className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          )}

          <button
            onClick={() => {
              if (activeSubTab === 'spin' || activeSubTab === 'vouchers') fetchSettings();
              if (activeSubTab === 'users') fetchUsers();
              if (activeSubTab === 'redemptions') fetchRedemptions();
            }}
            disabled={loading}
            className="px-3 py-2 bg-brand-yellow hover:bg-yellow-400 border-3 border-black font-black uppercase text-xs shadow-[3px_3px_0_0_#000] flex items-center gap-1.5"
            title="Refresh Data"
          >
            <RefreshCwIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-2 border-b-4 border-black pb-2 overflow-x-auto">
        {[
          { id: 'spin', label: '🎡 Hadiah & Peluang Spin Wheel', icon: GiftIcon },
          { id: 'vouchers', label: '🎟️ Katalog Voucher Diskon', icon: TagIcon },
          { id: 'users', label: '👥 Saldo Koin Pelanggan', icon: UsersIcon },
          { id: 'redemptions', label: '📜 Riwayat Penukaran', icon: ClockIcon },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-4 py-2 border-3 border-black font-black uppercase text-xs whitespace-nowrap transition-all ${
              activeSubTab === tab.id
                ? 'bg-black text-white shadow-[3px_3px_0_0_#000] -translate-y-0.5'
                : 'bg-white hover:bg-neutral-100 text-neutral-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: PENGATURAN SPIN WHEEL */}
      {activeSubTab === 'spin' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border-3 border-black p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[3px_3px_0_0_#000]">
            <div>
              <span className="font-black text-xs uppercase text-amber-900 block">ATURAN PUTARAN RODA (SPIN WHEEL):</span>
              <p className="text-xs text-amber-800 font-bold mt-0.5">
                Pengguna hanya dapat memutar 1 kali per hari per akun. Sistem reset otomatis setiap pukul 00:00 WIB (Asia/Jakarta).
              </p>
            </div>
            <span className="px-3 py-1 bg-brand-yellow border-2 border-black font-black text-xs uppercase self-start sm:self-auto">
              Batas: {spinLimit}
            </span>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[5px_5px_0_0_#000]">
            <h2 className="text-base font-black uppercase mb-4 flex items-center gap-2">
              <span>8 SEGMEN RODA KEBERUNTUNGAN (SERVER-DETERMINED)</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {segments.map((seg, idx) => (
                <div
                  key={idx}
                  className="p-3.5 border-3 border-black relative shadow-[3px_3px_0_0_#000]"
                  style={{ backgroundColor: seg.color || '#fff' }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black uppercase px-2 py-0.5 bg-black text-white">
                      Segmen #{idx}
                    </span>
                    <span className="text-xs font-black text-neutral-800">
                      Peluang: {seg.weight}%
                    </span>
                  </div>

                  <div className="space-y-2 mt-3 bg-white/90 p-2.5 border-2 border-black">
                    <div>
                      <label className="text-[10px] font-black uppercase text-neutral-600 block">Label Tampilan</label>
                      <input
                        type="text"
                        value={seg.label}
                        onChange={(e) => {
                          const updated = [...segments];
                          updated[idx].label = e.target.value;
                          setSegments(updated);
                        }}
                        className="w-full px-2 py-1 border border-black font-bold text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-black uppercase text-neutral-600 block">Nilai Koin</label>
                        <input
                          type="number"
                          value={seg.coins}
                          onChange={(e) => {
                            const updated = [...segments];
                            updated[idx].coins = parseInt(e.target.value, 10) || 0;
                            setSegments(updated);
                          }}
                          className="w-full px-2 py-1 border border-black font-bold text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-neutral-600 block">Bobot Peluang (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={seg.weight}
                          onChange={(e) => {
                            const updated = [...segments];
                            updated[idx].weight = parseFloat(e.target.value) || 0;
                            setSegments(updated);
                          }}
                          className="w-full px-2 py-1 border border-black font-bold text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 p-3 bg-neutral-100 border-2 border-black flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-600">
                Total Bobot Probabilitas: {segments.reduce((acc, s) => acc + (Number(s.weight) || 0), 0).toFixed(1)}
              </span>
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="px-4 py-2 bg-black text-white font-black uppercase text-xs hover:bg-neutral-800 active:scale-95"
              >
                Simpan Konfigurasi Segmen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PUSAT VOUCHER DISKON */}
      {activeSubTab === 'vouchers' && (
        <div className="bg-white border-4 border-black p-5 shadow-[5px_5px_0_0_#000] space-y-6">
          <div className="flex items-center justify-between pb-3 border-b-3 border-black">
            <div>
              <h2 className="text-base font-black uppercase">KATALOG PENUKARAN VOUCHER (COIN REDEEM)</h2>
              <p className="text-xs font-bold text-neutral-500">
                Atur biaya koin penukaran, nominal potongan, stok kuota voucher, dan masa berlaku hari.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {Object.entries(catalog).map(([key, item]) => (
              <div key={key} className="p-4 bg-amber-50 border-3 border-black shadow-[4px_4px_0_0_#000] space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-black text-white">
                    {key}
                  </span>
                  <span className="text-xs font-black text-brand-red">
                    Biaya: {item.cost} Koin
                  </span>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-neutral-600 block">Judul Voucher</label>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => {
                      setCatalog({
                        ...catalog,
                        [key]: { ...item, title: e.target.value },
                      });
                    }}
                    className="w-full px-2.5 py-1.5 border-2 border-black font-bold text-xs bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-black uppercase text-neutral-600 block">Biaya Koin (Coin Cost)</label>
                    <input
                      type="number"
                      value={item.cost}
                      onChange={(e) => {
                        setCatalog({
                          ...catalog,
                          [key]: { ...item, cost: parseInt(e.target.value, 10) || 0 },
                        });
                      }}
                      className="w-full px-2 py-1 border-2 border-black font-bold text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-neutral-600 block">Nilai Diskon (Rp)</label>
                    <input
                      type="number"
                      value={item.discount}
                      onChange={(e) => {
                        setCatalog({
                          ...catalog,
                          [key]: { ...item, discount: parseInt(e.target.value, 10) || 0 },
                        });
                      }}
                      className="w-full px-2 py-1 border-2 border-black font-bold text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-black uppercase text-neutral-600 block">Stok Kuota Voucher</label>
                    <input
                      type="number"
                      value={item.stockQuota || 100}
                      onChange={(e) => {
                        setCatalog({
                          ...catalog,
                          [key]: { ...item, stockQuota: parseInt(e.target.value, 10) || 0 },
                        });
                      }}
                      className="w-full px-2 py-1 border-2 border-black font-bold text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-neutral-600 block">Masa Berlaku (Hari)</label>
                    <input
                      type="number"
                      value={item.validityDays || 14}
                      onChange={(e) => {
                        setCatalog({
                          ...catalog,
                          [key]: { ...item, validityDays: parseInt(e.target.value, 10) || 1 },
                        });
                      }}
                      className="w-full px-2 py-1 border-2 border-black font-bold text-xs bg-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-5 py-2.5 bg-brand-red text-white font-black uppercase text-xs border-3 border-black shadow-[3px_3px_0_0_#000] hover:bg-red-700 active:translate-x-0.5 active:translate-y-0.5"
            >
              Simpan Pengaturan Voucher
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: SALDO KOIN PELANGGAN */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-white p-4 border-4 border-black shadow-[4px_4px_0_0_#000] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="font-black text-xs uppercase px-2.5 py-1 bg-black text-white">
                Total Pelanggan: {users.length}
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchUsers();
              }}
              className="flex items-center gap-2 w-full sm:w-80"
            >
              <div className="relative flex-1">
                <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Cari Nama / No WhatsApp..."
                  className="w-full pl-9 pr-3 py-1.5 border-2 border-black font-bold text-xs"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-black text-white font-black uppercase text-xs hover:bg-neutral-800"
              >
                Cari
              </button>
            </form>
          </div>

          <div className="bg-white border-4 border-black shadow-[4px_4px_0_0_#000] overflow-x-auto">
            <table className="w-full text-left text-xs font-bold border-collapse">
              <thead>
                <tr className="bg-neutral-900 text-white uppercase text-[10px] tracking-wider border-b-2 border-black">
                  <th className="p-3">ID</th>
                  <th className="p-3">Nama Pelanggan</th>
                  <th className="p-3">Nomor WhatsApp</th>
                  <th className="p-3 text-right">Saldo Koin</th>
                  <th className="p-3 text-center">Total Spin</th>
                  <th className="p-3 text-center">Voucher Diklaim</th>
                  <th className="p-3">Spin Terakhir</th>
                  <th className="p-3 text-center">Aksi Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-neutral-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-neutral-500 uppercase">
                      Tidak ada data pelanggan ditemukan
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-amber-50/50">
                      <td className="p-3 font-mono">#{u.id}</td>
                      <td className="p-3 font-black text-neutral-900">{u.name}</td>
                      <td className="p-3">{u.phone}</td>
                      <td className="p-3 text-right font-black text-base text-brand-red">
                        🪙 {Number(u.coins_balance).toLocaleString('id-ID')}
                      </td>
                      <td className="p-3 text-center">{u.total_spins || 0}x</td>
                      <td className="p-3 text-center">{u.total_vouchers_claimed || 0}</td>
                      <td className="p-3 text-neutral-600 font-mono text-[11px]">
                        {u.last_spin_wib_date || '-'}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            setAdjustModalUser(u);
                            setAdjustAmount(0);
                            setAdjustReason('');
                          }}
                          className="px-2.5 py-1 bg-brand-yellow hover:bg-yellow-400 border-2 border-black font-black uppercase text-[10px] shadow-[2px_2px_0_0_#000] active:scale-95"
                        >
                          Sesuaikan Koin
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: RIWAYAT PENUKARAN VOUCHER */}
      {activeSubTab === 'redemptions' && (
        <div className="bg-white border-4 border-black shadow-[4px_4px_0_0_#000] overflow-x-auto">
          <div className="p-4 border-b-3 border-black flex justify-between items-center bg-neutral-100">
            <span className="font-black text-xs uppercase">
              Riwayat Klaim & Penggunaan Voucher ({redemptions.length} Record)
            </span>
          </div>

          <table className="w-full text-left text-xs font-bold border-collapse">
            <thead>
              <tr className="bg-neutral-900 text-white uppercase text-[10px] tracking-wider border-b-2 border-black">
                <th className="p-3">Kode Voucher</th>
                <th className="p-3">Judul Hadiah</th>
                <th className="p-3">Pelanggan</th>
                <th className="p-3 text-right">Biaya Koin</th>
                <th className="p-3 text-right">Diskon (Rp)</th>
                <th className="p-3 text-center">Status Pemakaian</th>
                <th className="p-3">Waktu Klaim</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-neutral-200">
              {redemptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-500 uppercase">
                    Belum ada riwayat penukaran voucher
                  </td>
                </tr>
              ) : (
                redemptions.map((r) => (
                  <tr key={r.id} className="hover:bg-neutral-50">
                    <td className="p-3 font-mono font-black text-brand-red">{r.code}</td>
                    <td className="p-3 font-black">{r.title}</td>
                    <td className="p-3">
                      <div>{r.customer_name || 'Pelanggan'}</div>
                      <div className="text-[10px] text-neutral-500 font-mono">{r.customer_phone}</div>
                    </td>
                    <td className="p-3 text-right font-black">🪙 {r.cost_in_coins}</td>
                    <td className="p-3 text-right text-emerald-700 font-black">
                      Rp{Number(r.discount_amount).toLocaleString('id-ID')}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 border text-[10px] font-black uppercase ${
                          r.is_used
                            ? 'bg-neutral-200 text-neutral-700 border-neutral-400'
                            : 'bg-emerald-300 text-emerald-950 border-black'
                        }`}
                      >
                        {r.is_used ? 'Sudah Digunakan' : 'Aktif / Siap Pakai'}
                      </span>
                    </td>
                    <td className="p-3 text-neutral-600 text-[11px]">
                      {new Date(r.created_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL PENYESUAIAN KOIN (AUDIT TRAIL LOGGED) */}
      {adjustModalUser && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <form
            onSubmit={handleAdjustCoinsSubmit}
            className="bg-white border-4 border-black p-6 w-full max-w-md shadow-[8px_8px_0_0_#000] space-y-4 relative"
          >
            <div className="flex justify-between items-center pb-2 border-b-2 border-black">
              <div>
                <span className="text-[10px] font-black uppercase text-brand-red block">PENYESUAIAN SALDO KOIN</span>
                <span className="font-black text-base">{adjustModalUser.name} ({adjustModalUser.phone})</span>
              </div>
              <button
                type="button"
                onClick={() => setAdjustModalUser(null)}
                className="p-1 bg-neutral-200 hover:bg-neutral-300 border-2 border-black"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border-2 border-black text-xs font-bold">
              <span>Saldo Saat Ini: </span>
              <span className="font-black text-base text-brand-red">
                🪙 {Number(adjustModalUser.coins_balance).toLocaleString('id-ID')} Koin
              </span>
            </div>

            <div>
              <label className="text-xs font-black uppercase block mb-1">
                Jumlah Penyesuaian (+ untuk Tambah, - untuk Kurangi)
              </label>
              <input
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(parseInt(e.target.value, 10) || 0)}
                placeholder="Contoh: 100 atau -50"
                required
                className="w-full px-3 py-2 border-2 border-black font-black text-sm"
              />
              <span className="text-[10px] text-neutral-500 font-bold block mt-1">
                Hasil Saldo Baru: 🪙 {Math.max(0, (adjustModalUser.coins_balance || 0) + adjustAmount)} Koin
              </span>
            </div>

            <div>
              <label className="text-xs font-black uppercase block mb-1">
                Alasan / Keterangan Penyesuaian (Wajib untuk Audit Log)
              </label>
              <textarea
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="Contoh: Bonus kompensasi keterlambatan pengiriman, koreksi event, dll."
                required
                rows={2}
                className="w-full px-3 py-2 border-2 border-black font-bold text-xs"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="submit"
                disabled={saving || adjustAmount === 0}
                className="flex-1 py-2.5 bg-brand-red hover:bg-red-700 text-white font-black uppercase text-xs border-2 border-black shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5"
              >
                {saving ? 'Memproses...' : 'Simpan & Catat di Audit Log'}
              </button>
              <button
                type="button"
                onClick={() => setAdjustModalUser(null)}
                className="py-2.5 px-4 bg-neutral-200 font-black uppercase text-xs border-2 border-black"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
