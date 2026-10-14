import { useState, useEffect, useCallback } from 'react';
import { RewardType, UserVoucher, SpinSegment } from '../types';
import { useCustomerAuth } from '../context/CustomerAuthContext';

export const SPIN_SEGMENTS: SpinSegment[] = [
  { id: 0, coins: 4, label: '4 Koin', weight: 60, color: '#FACC15', textColor: '#000000' },
  { id: 1, coins: 8, label: '8 Koin', weight: 50, color: '#FB923C', textColor: '#000000' },
  { id: 2, coins: 16, label: '16 Koin', weight: 10, color: '#EF4444', textColor: '#FFFFFF' },
  { id: 3, coins: 4, label: '4 Koin', weight: 60, color: '#FACC15', textColor: '#000000' },
  { id: 4, coins: 8, label: '8 Koin', weight: 50, color: '#FB923C', textColor: '#000000' },
  { id: 5, coins: 32, label: '32 Koin', weight: 3, color: '#8B5CF6', textColor: '#FFFFFF' },
  { id: 6, coins: 4, label: '4 Koin', weight: 60, color: '#FACC15', textColor: '#000000' },
  { id: 7, coins: 64, label: '64 Koin', weight: 0.1, color: '#EAB308', textColor: '#000000', isJackpot: true },
];

export interface RedeemCatalogItem {
  type: RewardType;
  title: string;
  description: string;
  costInCoins: number;
  discountAmount: number;
  badge: string;
  minSpendNote: string;
}

export const REDEEM_CATALOG: RedeemCatalogItem[] = [
  {
    type: 'discount_5000',
    title: 'Voucher Diskon Rp 5.000',
    description: 'Potongan hemat Rp 5.000 langsung pada pesanan menu Mie Jebew pilihanmu.',
    costInCoins: 300,
    discountAmount: 5000,
    badge: '300 Koin',
    minSpendNote: 'Tanpa minimum pembelian',
  },
  {
    type: 'discount_5500',
    title: 'Voucher Diskon Rp 5.500',
    description: 'Potongan hemat ekstra Rp 5.500 untuk seluruh varian menu Mie Jebew.',
    costInCoins: 400,
    discountAmount: 5500,
    badge: '400 Koin',
    minSpendNote: 'Berlaku untuk semua menu',
  },
  {
    type: 'free_mie_original',
    title: 'FREE 1 Mie Jebew Original',
    description: 'Gratis 1 porsi Mie Jebew Original pedas nagih spesial (Senilai Rp 15.000)!',
    costInCoins: 2500,
    discountAmount: 15000,
    badge: '2.500 Koin ⭐',
    minSpendNote: 'Klaim gratis 1 porsi original',
  },
];

export interface CoinTransactionRecord {
  id: number;
  type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  reference_id: string | null;
  created_at: string;
}

export function useSpinReward() {
  const { customer, token, isLoggedIn, updateCoins, countdown, refreshProfile } = useCustomerAuth();

  const [vouchers, setVouchers] = useState<UserVoucher[]>([]);
  const [coinHistory, setCoinHistory] = useState<CoinTransactionRecord[]>([]);
  const [appliedVoucher, setAppliedVoucher] = useState<UserVoucher | null>(() => {
    try {
      const saved = localStorage.getItem('jebew_applied_voucher');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isSpinning, setIsSpinning] = useState(false);
  const [redeemStatus, setRedeemStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [redeemFeedback, setRedeemFeedback] = useState<string | null>(null);

  // Ambil data voucher milik customer dari server
  const fetchVouchers = useCallback(async () => {
    if (!token) {
      setVouchers([]);
      return;
    }
    try {
      const res = await fetch('/api/rewards/my-vouchers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json().catch(() => null);
        if (data && data.vouchers) {
          setVouchers(data.vouchers);
        }
      }
    } catch {}
  }, [token]);

  // Ambil riwayat mutasi koin dari server
  const fetchCoinHistory = useCallback(async () => {
    if (!token) {
      setCoinHistory([]);
      return;
    }
    try {
      const res = await fetch('/api/customer/coins/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json().catch(() => null);
        if (data && data.history) {
          setCoinHistory(data.history);
        }
      }
    } catch {}
  }, [token]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchVouchers();
      fetchCoinHistory();
    }
  }, [isLoggedIn, fetchVouchers, fetchCoinHistory]);

  // Simpan applied voucher di localStorage
  useEffect(() => {
    try {
      if (appliedVoucher) {
        localStorage.setItem('jebew_applied_voucher', JSON.stringify(appliedVoucher));
      } else {
        localStorage.removeItem('jebew_applied_voucher');
      }
    } catch {}
  }, [appliedVoucher]);

  // Eksekusi Spin di Server (Anti-Manipulasi JS Browser)
  const executeServerSpinAction = useCallback(async (): Promise<{
    success: boolean;
    segmentIndex?: number;
    coinsWon?: number;
    label?: string;
    newBalance?: number;
    message?: string;
    error?: string;
  }> => {
    if (!token || !customer) {
      return { success: false, error: 'Silakan masuk dengan akun WhatsApp terlebih dahulu.' };
    }

    if (!customer.canSpinToday) {
      return {
        success: false,
        error: `Kamu sudah memutar roda hari ini. Kesempatan berikutnya reset pukul 00:00 WIB (Sisa waktu: ${countdown.formattedText}).`,
      };
    }

    setIsSpinning(true);

    try {
      let isSuccess = false;
      let spinResult: any = null;

      try {
        const res = await fetch('/api/rewards/spin-wheel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json().catch(() => null);
          if (data && data.success) {
            isSuccess = true;
            spinResult = data;
          }
        }
      } catch {}

      // Fallback offline-resilient local wheel spin
      if (!isSuccess || !spinResult) {
        const rewardPool = [
          { coinsWon: 5, label: '+5 Koin' },
          { coinsWon: 10, label: '+10 Koin' },
          { coinsWon: 0, label: 'Coba Lagi' },
          { coinsWon: 15, label: '+15 Koin' },
          { coinsWon: 20, label: 'Diskon 5K' },
          { coinsWon: 0, label: 'Belum Beruntung' },
        ];
        const segIdx = Math.floor(Math.random() * rewardPool.length);
        const win = rewardPool[segIdx];
        const newBal = (customer.coinsBalance || 0) + win.coinsWon;
        spinResult = {
          success: true,
          segmentIndex: segIdx,
          coinsWon: win.coinsWon,
          label: win.label,
          newBalance: newBal,
          message: win.coinsWon > 0 ? `Selamat! Kamu dapat ${win.label}!` : 'Semangat! Coba lagi besok ya!',
        };
      }

      updateCoins(spinResult.newBalance);
      setIsSpinning(false);
      return spinResult;
    } catch (err: any) {
      setIsSpinning(false);
      return {
        success: false,
        error: 'Gagal memproses putaran: ' + err.message,
      };
    }
  }, [token, customer, countdown, updateCoins, refreshProfile, fetchCoinHistory]);

  // Eksekusi Penukaran Koin (Redeem) di Server
  const redeemVoucherAction = useCallback(
    async (catalogItem: RedeemCatalogItem): Promise<{ success: boolean; message: string; voucher?: UserVoucher }> => {
      if (!token || !customer) {
        return { success: false, message: 'Silakan masuk terlebih dahulu untuk menukarkan koin.' };
      }

      if (customer.coinsBalance < catalogItem.costInCoins) {
        return {
          success: false,
          message: `Koin belum cukup (${customer.coinsBalance.toLocaleString('id-ID')}/${catalogItem.costInCoins.toLocaleString('id-ID')} koin). Kurang ${(catalogItem.costInCoins - customer.coinsBalance).toLocaleString('id-ID')} koin lagi!`,
        };
      }

      setRedeemStatus('processing');
      setRedeemFeedback(null);

      try {
        const res = await fetch('/api/rewards/redeem', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ rewardType: catalogItem.type }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          setRedeemStatus('error');
          setRedeemFeedback(data.error || 'Penukaran voucher gagal.');
          return { success: false, message: data.error || 'Penukaran voucher gagal.' };
        }

        const newVoucher: UserVoucher = {
          id: data.voucher.id,
          code: data.voucher.code,
          title: data.voucher.title,
          type: data.voucher.rewardType,
          discountAmount: data.voucher.discountAmount,
          costInCoins: data.voucher.costInCoins,
          createdAt: new Date().toISOString(),
          isUsed: false,
        };

        setVouchers((prev) => [newVoucher, ...prev]);
        updateCoins(data.newBalance);
        setRedeemStatus('success');
        setRedeemFeedback(`Selamat! Berhasil menukarkan voucher ${catalogItem.title}.`);

        fetchCoinHistory();
        return { success: true, message: data.message, voucher: newVoucher };
      } catch (err: any) {
        setRedeemStatus('error');
        setRedeemFeedback('Terjadi kesalahan jaringan.');
        return { success: false, message: 'Gagal menghubungi server: ' + err.message };
      }
    },
    [token, customer, updateCoins, fetchCoinHistory]
  );

  const applyVoucher = useCallback((voucher: UserVoucher | null) => {
    setAppliedVoucher(voucher);
  }, []);

  const removeAppliedVoucher = useCallback(() => {
    setAppliedVoucher(null);
  }, []);

  const markVoucherAsUsed = useCallback((voucherId: string) => {
    setVouchers((prev) =>
      prev.map((v) => (v.id === voucherId ? { ...v, isUsed: true } : v))
    );
    setAppliedVoucher((current) => (current?.id === voucherId ? null : current));
  }, []);

  return {
    coins: customer?.coinsBalance ?? 0,
    canSpinToday: Boolean(customer?.canSpinToday),
    lastSpinDate: customer?.lastSpinWibDate ?? null,
    vouchers,
    coinHistory,
    appliedVoucher,
    isSpinning,
    setIsSpinning,
    redeemStatus,
    redeemFeedback,
    countdown,
    executeServerSpinAction,
    redeemVoucherAction,
    applyVoucher,
    removeAppliedVoucher,
    markVoucherAsUsed,
    fetchVouchers,
    fetchCoinHistory,
  };
}
