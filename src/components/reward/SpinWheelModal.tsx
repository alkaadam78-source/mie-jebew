import React, { useState, useRef, useMemo } from 'react';
import { X, Sparkles, CheckCircle2, AlertCircle } from '../ui/Icons';
import { UserVoucher } from '../../types';
import { SPIN_SEGMENTS, REDEEM_CATALOG, RedeemCatalogItem, CoinTransactionRecord } from '../../hooks/useSpinReward';
import { useCustomerAuth } from '../../context/CustomerAuthContext';

interface SpinWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  canSpinToday: boolean;
  lastSpinDate: string | null;
  vouchers: UserVoucher[];
  appliedVoucher: UserVoucher | null;
  coinHistory?: CoinTransactionRecord[];
  onExecuteSpin: () => Promise<{
    success: boolean;
    segmentIndex?: number;
    coinsWon?: number;
    label?: string;
    newBalance?: number;
    message?: string;
    error?: string;
  }>;
  onRedeemVoucher: (item: RedeemCatalogItem) => Promise<{ success: boolean; message: string; voucher?: UserVoucher }>;
  onApplyVoucher: (voucher: UserVoucher | null) => void;
  initialTab?: 'spin' | 'redeem' | 'history';
}

export const SpinWheelModal: React.FC<SpinWheelModalProps> = ({
  isOpen,
  onClose,
  coins,
  canSpinToday,
  vouchers,
  appliedVoucher,
  coinHistory = [],
  onExecuteSpin,
  onRedeemVoucher,
  onApplyVoucher,
  initialTab = 'spin',
}) => {
  if (!isOpen) return null;

  const { customer, isLoggedIn, openAuthModal, countdown } = useCustomerAuth();

  const [activeTab, setActiveTab] = useState<'spin' | 'redeem' | 'history'>(initialTab);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<{ label: string; coinsWon: number } | null>(null);
  const [spinError, setSpinError] = useState<string | null>(null);

  // Status Penukaran: idle | processing | success | error
  const [redeemState, setRedeemState] = useState<{
    status: 'idle' | 'processing' | 'success' | 'error';
    itemId?: string;
    message?: string;
  }>({ status: 'idle' });

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  // SVG Calculations for 8 Wheel Segments
  const radius = 140;
  const center = 150;
  const numSegments = SPIN_SEGMENTS.length;
  const anglePerSegment = 360 / numSegments; // 45 deg

  const segmentPaths = useMemo(() => {
    return SPIN_SEGMENTS.map((seg, i) => {
      const startAngle = (i * anglePerSegment - 22.5 - 90) * (Math.PI / 180);
      const endAngle = ((i + 1) * anglePerSegment - 22.5 - 90) * (Math.PI / 180);

      const x1 = center + radius * Math.cos(startAngle);
      const y1 = center + radius * Math.sin(startAngle);
      const x2 = center + radius * Math.cos(endAngle);
      const y2 = center + radius * Math.sin(endAngle);

      const midAngle = (i * anglePerSegment - 90) * (Math.PI / 180);
      const textRadius = radius * 0.65;
      const textX = center + textRadius * Math.cos(midAngle);
      const textY = center + textRadius * Math.sin(midAngle);
      const textRotation = i * anglePerSegment;

      const pathData = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;

      return {
        ...seg,
        pathData,
        textX,
        textY,
        textRotation,
      };
    });
  }, [anglePerSegment, center, radius]);

  // Handler Putar Roda (Hasil Mutlak dari Server)
  const handleSpinClick = async () => {
    if (!isLoggedIn) {
      openAuthModal();
      return;
    }

    if (isSpinning || !canSpinToday) return;

    setWonPrize(null);
    setSpinError(null);
    setIsSpinning(true);

    try {
      const result = await onExecuteSpin();

      if (!result.success || result.segmentIndex === undefined) {
        setIsSpinning(false);
        setSpinError(result.error || 'Gagal memproses putaran roda.');
        return;
      }

      // Hitung rotasi roda agar mendarat presisi di segmen yang diputuskan SERVER
      const fullSpins = 360 * 6; // 6 putaran penuh (2160 deg)
      const targetSliceRotation = 360 - result.segmentIndex * anglePerSegment;
      const jitter = (Math.random() - 0.5) * 12; // Sedikit getaran alami di tengah wedge
      const newTargetRotation = currentRotation + fullSpins + targetSliceRotation + jitter;

      setCurrentRotation(newTargetRotation);

      // Tunggu animasi CSS putaran selesai (4.5 detik)
      setTimeout(() => {
        setIsSpinning(false);
        setWonPrize({
          label: result.label || `${result.coinsWon} Koin`,
          coinsWon: result.coinsWon || 0,
        });

        // Efek Confetti Perayaan
        import('canvas-confetti')
          .then((m) => {
            m.default({
              particleCount: 90,
              spread: 80,
              origin: { y: 0.55 },
            });
          })
          .catch(() => {});
      }, 4500);
    } catch (err: any) {
      setIsSpinning(false);
      setSpinError(err.message || 'Terjadi kesalahan sistem.');
    }
  };

  // Handler Penukaran Koin dengan Feedback Status Jelas
  const handleRedeem = async (item: RedeemCatalogItem) => {
    if (!isLoggedIn) {
      openAuthModal();
      return;
    }

    if (coins < item.costInCoins) {
      setRedeemState({
        status: 'error',
        itemId: item.type,
        message: `Koin belum cukup. Kamu butuh ${item.costInCoins.toLocaleString('id-ID')} koin (Kurang ${(item.costInCoins - coins).toLocaleString('id-ID')} koin lagi).`,
      });
      return;
    }

    setRedeemState({
      status: 'processing',
      itemId: item.type,
      message: 'Sedang memproses penukaran voucher...',
    });

    try {
      const res = await onRedeemVoucher(item);
      if (res.success) {
        setRedeemState({
          status: 'success',
          itemId: item.type,
          message: `Berhasil! Voucher ${item.title} telah aktif dan siap digunakan.`,
        });

        import('canvas-confetti')
          .then((m) => {
            m.default({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.6 },
            });
          })
          .catch(() => {});
      } else {
        setRedeemState({
          status: 'error',
          itemId: item.type,
          message: res.message || 'Penukaran gagal.',
        });
      }
    } catch (err: any) {
      setRedeemState({
        status: 'error',
        itemId: item.type,
        message: err.message || 'Terjadi kesalahan koneksi.',
      });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-cream border-4 border-black rounded-3xl shadow-brutal-xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="bg-jebew-yellow border-b-3 border-black p-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center shadow-brutal-xs font-black text-xl">
              🎡
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-black leading-tight flex items-center gap-1.5">
                LUCKY SPIN & KOIN
                <span className="text-[10px] bg-jebew-red text-white px-2 py-0.5 rounded-full border border-black shadow-brutal-xs">
                  RESET 00:00 WIB
                </span>
              </h3>
              <p className="text-xs font-bold text-gray-800">
                Putar 1x setiap hari & tukar koin dengan voucher diskon!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup Spin Wheel"
            className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center shadow-brutal-sm hover:bg-gray-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
          >
            <X className="w-5 h-5 text-black" />
          </button>
        </div>

        {/* User Identity & Coin Balance Bar */}
        <div className="bg-cream-100 border-b-2 border-black px-4 py-2 flex items-center justify-between gap-2 flex-wrap text-xs">
          {/* Akun Status */}
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <div className="flex items-center gap-1.5 font-black text-black">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="truncate max-w-[130px] sm:max-w-[180px]">{customer?.name}</span>
              </div>
            ) : (
              <button
                onClick={openAuthModal}
                className="bg-jebew-red text-white font-black text-[11px] px-2.5 py-1 rounded-lg border border-black shadow-brutal-xs flex items-center gap-1 hover:bg-red-700 cursor-pointer"
              >
                <span>👤 Masuk Akun</span>
              </button>
            )}
          </div>

          {/* Saldo Koin Akurat */}
          <div className="flex items-center gap-1.5 bg-amber-300 border-2 border-black px-2.5 py-1 rounded-xl shadow-brutal-xs font-black text-black ml-auto">
            <span>🪙 Saldo Koin:</span>
            <span className="bg-white px-2 py-0.5 rounded-md border border-black text-jebew-red text-xs font-black">
              {coins.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-b-2 border-black px-4 py-2 flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('spin')}
            className={`flex-1 py-1.5 rounded-lg font-black text-xs transition-all cursor-pointer text-center ${
              activeTab === 'spin'
                ? 'bg-jebew-red text-white shadow-brutal-xs border border-black'
                : 'text-gray-700 hover:text-black hover:bg-gray-100'
            }`}
          >
            🎡 Putar Roda
          </button>
          <button
            onClick={() => setActiveTab('redeem')}
            className={`flex-1 py-1.5 rounded-lg font-black text-xs transition-all cursor-pointer text-center ${
              activeTab === 'redeem'
                ? 'bg-jebew-red text-white shadow-brutal-xs border border-black'
                : 'text-gray-700 hover:text-black hover:bg-gray-100'
            }`}
          >
            🎁 Tukar Voucher
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1.5 rounded-lg font-black text-xs transition-all cursor-pointer text-center ${
              activeTab === 'history'
                ? 'bg-jebew-red text-white shadow-brutal-xs border border-black'
                : 'text-gray-700 hover:text-black hover:bg-gray-100'
            }`}
          >
            📜 Riwayat Koin
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* ===================== TAB 1: PUTAR RODA ===================== */}
          {activeTab === 'spin' && (
            <div className="flex flex-col items-center space-y-4">
              {/* Login Warning Banner jika belum masuk */}
              {!isLoggedIn && (
                <div className="w-full bg-amber-50 border-2 border-amber-400 rounded-2xl p-3 flex items-center justify-between gap-2 shadow-brutal-xs text-xs font-bold text-amber-900">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⚠️</span>
                    <span>Masuk dengan nomor WhatsApp untuk memutar roda & menyimpan koin!</span>
                  </div>
                  <button
                    onClick={openAuthModal}
                    className="shrink-0 bg-jebew-red text-white font-black text-xs px-3 py-1.5 rounded-xl border border-black shadow-brutal-xs hover:bg-red-700 cursor-pointer"
                  >
                    Masuk Sekarang
                  </button>
                </div>
              )}

              {/* Countdown Banner Reset 00:00 WIB */}
              <div className="w-full bg-white border-2 border-black rounded-xl px-3 py-2 flex items-center justify-between text-xs font-bold shadow-brutal-xs">
                <span className="flex items-center gap-1.5 text-gray-700">
                  <span>⏳ Reset Spin Berikutnya:</span>
                </span>
                <span className="font-mono font-black text-jebew-red bg-cream-100 px-2 py-0.5 rounded border border-gray-300">
                  {countdown.formattedText} (00:00 WIB)
                </span>
              </div>

              {/* Lucky Wheel Container */}
              <div className="relative w-[280px] h-[280px] sm:w-[310px] sm:h-[310px] flex items-center justify-center my-1">
                {/* Pointer Arrow at Top (12 o'clock) */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
                  <div className="w-7 h-9 bg-jebew-red border-2 border-black rounded-b-md shadow-brutal-xs flex items-center justify-center text-white text-[10px] font-black">
                    ▼
                  </div>
                  <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full border border-black -mt-1 shadow-xs" />
                </div>

                {/* Rotating SVG Wheel */}
                <div
                  ref={wheelRef}
                  style={{
                    transform: `rotate(${currentRotation}deg)`,
                    transition: isSpinning
                      ? 'transform 4.5s cubic-bezier(0.15, 0.9, 0.2, 1.0)'
                      : 'none',
                  }}
                  className="w-[270px] h-[270px] sm:w-[290px] sm:h-[290px] rounded-full border-4 border-black shadow-brutal-lg overflow-hidden bg-white relative"
                >
                  <svg viewBox="0 0 300 300" className="w-full h-full">
                    {segmentPaths.map((seg) => (
                      <g key={seg.id + seg.label}>
                        <path
                          d={seg.pathData}
                          fill={seg.color}
                          stroke="#000000"
                          strokeWidth="2.5"
                        />
                        <g
                          transform={`translate(${seg.textX}, ${seg.textY}) rotate(${seg.textRotation})`}
                        >
                          <text
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill={seg.textColor}
                            fontWeight="900"
                            fontSize={seg.isJackpot ? '13' : '12'}
                            fontFamily="sans-serif"
                            stroke="#000"
                            strokeWidth={seg.textColor === '#FFFFFF' ? '0.75' : '0.5'}
                          >
                            {seg.label}
                          </text>
                        </g>
                      </g>
                    ))}
                  </svg>
                </div>

                {/* Center Badge Hub */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 sm:w-16 sm:h-16 bg-cream border-3 border-black rounded-full shadow-brutal flex flex-col items-center justify-center z-10 pointer-events-none">
                  <span className="text-base sm:text-lg">🔥</span>
                  <span className="text-[9px] font-black leading-none text-black">JEBEW</span>
                </div>
              </div>

              {/* Error Alert */}
              {spinError && (
                <div className="w-full p-3 bg-red-100 border-2 border-red-600 rounded-xl flex items-start gap-2 text-xs font-bold text-red-800">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{spinError}</span>
                </div>
              )}

              {/* Prize Notification Card */}
              {wonPrize && (
                <div className="w-full bg-amber-100 border-3 border-black rounded-2xl p-3.5 shadow-brutal flex items-center gap-3 animate-in bounce-in duration-300">
                  <div className="w-12 h-12 rounded-xl bg-jebew-yellow border-2 border-black flex items-center justify-center text-2xl flex-shrink-0 shadow-brutal-xs">
                    🎉
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-sm sm:text-base text-black uppercase">
                      SELAMAT! KAMU DAPAT +{wonPrize.coinsWon} KOIN!
                    </h4>
                    <p className="text-xs font-bold text-gray-700">
                      Saldo koinmu sekarang:{' '}
                      <strong className="text-jebew-red font-black">
                        {coins.toLocaleString('id-ID')} Koin
                      </strong>
                      . Putar lagi besok setelah pukul 00:00 WIB!
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="w-full space-y-2">
                {!isLoggedIn ? (
                  <button
                    onClick={openAuthModal}
                    className="w-full min-h-[52px] bg-jebew-yellow hover:bg-yellow-400 text-black font-black text-base py-3 px-4 border-3 border-black rounded-2xl shadow-brutal active:translate-x-0.5 active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>🔒 Masuk untuk Memutar Roda</span>
                  </button>
                ) : canSpinToday ? (
                  <button
                    onClick={handleSpinClick}
                    disabled={isSpinning}
                    className={`w-full min-h-[52px] bg-jebew-red hover:bg-red-700 text-white font-black text-base py-3 px-4 border-3 border-black rounded-2xl shadow-brutal active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isSpinning ? 'opacity-70 cursor-not-allowed animate-pulse' : ''
                    }`}
                  >
                    <Sparkles className="w-5 h-5 text-yellow-300 animate-spin" />
                    <span>{isSpinning ? 'SEDANG DIUNDI SERVER...' : 'PUTAR RODA SEKARANG! 🎯'}</span>
                  </button>
                ) : (
                  <div className="w-full bg-gray-100 border-2 border-black rounded-2xl p-3.5 text-center shadow-brutal-xs space-y-1.5">
                    <div className="font-black text-xs sm:text-sm text-gray-800 flex items-center justify-center gap-1.5">
                      <span>⏱️ Kesempatan Hari Ini Sudah Digunakan</span>
                    </div>
                    <p className="text-xs font-bold text-gray-600">
                      Tunggu reset pukul <span className="text-jebew-red font-black">00:00 WIB</span> (Sisa: {countdown.formattedText})
                    </p>
                  </div>
                )}
              </div>

              {/* Peluang Probabilitas Hadiah */}
              <div className="w-full bg-cream-50 border-2 border-black rounded-2xl p-3 text-xs space-y-2 shadow-brutal-xs">
                <div className="font-black text-xs text-black flex items-center justify-between">
                  <span>📊 PELUANG HADIAH (TRANSPARAN):</span>
                  <span className="text-[10px] text-gray-600 font-bold">Resmi Server</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] font-bold text-gray-700">
                  <div className="flex items-center justify-between bg-white border border-black px-2 py-1 rounded-md">
                    <span>🪙 4 Koin</span>
                    <span className="text-emerald-700 font-black">60%</span>
                  </div>
                  <div className="flex items-center justify-between bg-white border border-black px-2 py-1 rounded-md">
                    <span>🪙 8 Koin</span>
                    <span className="text-emerald-700 font-black">50%</span>
                  </div>
                  <div className="flex items-center justify-between bg-white border border-black px-2 py-1 rounded-md">
                    <span>🪙 16 Koin</span>
                    <span className="text-amber-700 font-black">10%</span>
                  </div>
                  <div className="flex items-center justify-between bg-white border border-black px-2 py-1 rounded-md">
                    <span>🪙 32 Koin</span>
                    <span className="text-indigo-700 font-black">3%</span>
                  </div>
                  <div className="col-span-2 flex items-center justify-between bg-amber-50 border border-black px-2 py-1 rounded-md">
                    <span className="flex items-center gap-1 text-black font-black">
                      ⭐ 64 Koin (JACKPOT!)
                    </span>
                    <span className="text-jebew-red font-black">0,1%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== TAB 2: MENU PENUKARAN ===================== */}
          {activeTab === 'redeem' && (
            <div className="space-y-4">
              {/* Feedback Alert Status Penukaran */}
              {redeemState.status !== 'idle' && (
                <div
                  className={`border-2 p-3.5 rounded-xl flex items-start gap-2 text-xs font-bold shadow-brutal-xs animate-in fade-in duration-150 ${
                    redeemState.status === 'success'
                      ? 'bg-emerald-100 border-emerald-700 text-emerald-900'
                      : redeemState.status === 'processing'
                      ? 'bg-blue-100 border-blue-700 text-blue-900'
                      : 'bg-red-100 border-jebew-red text-red-900'
                  }`}
                >
                  {redeemState.status === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-700 mt-0.5" />}
                  {redeemState.status === 'processing' && (
                    <span className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin shrink-0 mt-0.5" />
                  )}
                  {redeemState.status === 'error' && <AlertCircle className="w-5 h-5 shrink-0 text-jebew-red mt-0.5" />}
                  <div className="flex-1">
                    <p className="font-black uppercase tracking-tight">
                      {redeemState.status === 'success' && 'Penukaran Berhasil!'}
                      {redeemState.status === 'processing' && 'Sedang Diproses Server...'}
                      {redeemState.status === 'error' && 'Penukaran Gagal!'}
                    </p>
                    <p className="text-[11px] mt-0.5">{redeemState.message}</p>
                  </div>
                </div>
              )}

              {/* Syarat Penukaran & Daftar Voucher */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-xs uppercase tracking-wide text-gray-700">
                    KATALOG REWARD MIE JEBEW:
                  </h4>
                  <span className="text-[10px] font-bold text-gray-500">
                    Saldo: {coins.toLocaleString('id-ID')} Koin
                  </span>
                </div>

                {REDEEM_CATALOG.map((item) => {
                  const isAffordable = coins >= item.costInCoins;
                  const progressPct = Math.min(100, Math.round((coins / item.costInCoins) * 100));
                  const isProcessingThis = redeemState.status === 'processing' && redeemState.itemId === item.type;

                  return (
                    <div
                      key={item.type}
                      className={`border-3 border-black rounded-2xl p-4 shadow-brutal transition-all ${
                        isAffordable ? 'bg-white' : 'bg-cream-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-black text-sm sm:text-base text-black">
                              {item.title}
                            </h5>
                            <span className="text-[10px] font-black bg-jebew-yellow text-black border border-black px-2 py-0.5 rounded-full shadow-brutal-xs">
                              {item.badge}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-gray-600 mt-1">
                            {item.description}
                          </p>
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-gray-500">
                            <span>📌 Syarat:</span>
                            <span className="text-gray-700">{item.minSpendNote}</span>
                          </div>
                        </div>
                      </div>

                      {/* Progress bar visual */}
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-gray-700">
                          <span>
                            Syarat Koin: {coins.toLocaleString('id-ID')} / {item.costInCoins.toLocaleString('id-ID')}
                          </span>
                          <span className={isAffordable ? 'text-emerald-700 font-black' : ''}>
                            {progressPct}%
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-200 border border-black rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              isAffordable ? 'bg-emerald-500' : 'bg-jebew-yellow'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Tombol Tukar (Tetap Terlihat, tetapi Terkunci jika Koin Belum Cukup) */}
                      <div className="mt-3.5 pt-2.5 border-t border-dashed border-gray-300 flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-gray-600">
                          Biaya: <strong className="text-black font-black">{item.costInCoins} Koin</strong>
                        </span>

                        <button
                          onClick={() => handleRedeem(item)}
                          disabled={!isAffordable || isProcessingThis}
                          className={`font-black text-xs py-2 px-4 border-2 border-black rounded-xl shadow-brutal-xs transition-all flex items-center gap-1.5 ${
                            isAffordable
                              ? 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer active:translate-x-0.5 active:translate-y-0.5'
                              : 'bg-gray-200 text-gray-500 cursor-not-allowed border-gray-400 shadow-none'
                          }`}
                        >
                          {isProcessingThis ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Memproses...</span>
                            </>
                          ) : isAffordable ? (
                            <>
                              <span>🎁 Tukar Sekarang</span>
                            </>
                          ) : (
                            <>
                              <span>🔒 Terkunci (Kurang {(item.costInCoins - coins).toLocaleString('id-ID')} Koin)</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Daftar Voucher Aktif Milik Saya */}
              <div className="pt-2 space-y-2">
                <h4 className="font-black text-xs uppercase tracking-wide text-gray-700 flex items-center gap-1.5">
                  <span>🎟️ VOUCHER AKTIF SAYA</span>
                  <span className="bg-jebew-red text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                    {vouchers.filter((v) => !v.isUsed).length}
                  </span>
                </h4>

                {vouchers.filter((v) => !v.isUsed).length === 0 ? (
                  <div className="bg-white border-2 border-dashed border-gray-400 rounded-xl p-4 text-center text-xs text-gray-500 font-semibold">
                    Kamu belum memiliki voucher aktif. Kumpulkan koin dan tukarkan di atas!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {vouchers
                      .filter((v) => !v.isUsed)
                      .map((vch) => {
                        const isCurrentlyApplied = appliedVoucher?.id === vch.id;

                        return (
                          <div
                            key={vch.id}
                            className={`p-3 rounded-xl border-2 border-black flex items-center justify-between gap-2 shadow-brutal-xs ${
                              isCurrentlyApplied
                                ? 'bg-emerald-50 border-emerald-700 ring-2 ring-emerald-500'
                                : 'bg-white'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-xs text-black">
                                  {vch.title}
                                </span>
                                {isCurrentlyApplied && (
                                  <span className="text-[10px] font-black bg-emerald-600 text-white px-1.5 py-0.2 rounded-md">
                                    Diterapkan
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] font-bold bg-gray-100 border border-gray-300 px-1.5 py-0.5 rounded text-gray-800">
                                  {vch.code}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyCode(vch.code)}
                                  className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                                >
                                  {copiedCode === vch.code ? 'Tersalin ✓' : 'Salin'}
                                </button>
                              </div>
                            </div>

                            <div>
                              {isCurrentlyApplied ? (
                                <button
                                  type="button"
                                  onClick={() => onApplyVoucher(null)}
                                  className="text-[11px] font-bold bg-gray-200 hover:bg-gray-300 text-gray-800 px-2.5 py-1.5 rounded-lg border border-black cursor-pointer"
                                >
                                  Lepas
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onApplyVoucher(vch)}
                                  className="text-[11px] font-black bg-jebew-red hover:bg-red-700 text-white px-3 py-1.5 rounded-lg border border-black shadow-brutal-xs cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
                                >
                                  Gunakan
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===================== TAB 3: RIWAYAT MUTASI KOIN ===================== */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-xs uppercase tracking-wide text-gray-700">
                  MUTASI KOIN (BUKU BESAR):
                </h4>
                <span className="text-[11px] font-black text-jebew-red">
                  Saldo Saat Ini: {coins.toLocaleString('id-ID')} Koin
                </span>
              </div>

              {!isLoggedIn ? (
                <div className="bg-white border-2 border-dashed border-gray-400 rounded-xl p-5 text-center text-xs text-gray-600 font-bold space-y-2">
                  <p>Silakan masuk terlebih dahulu untuk melihat riwayat mutasi koin Anda.</p>
                  <button
                    onClick={openAuthModal}
                    className="bg-jebew-red text-white font-black text-xs px-3.5 py-1.5 rounded-xl border border-black shadow-brutal-xs cursor-pointer"
                  >
                    Masuk Akun
                  </button>
                </div>
              ) : coinHistory.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-gray-400 rounded-xl p-6 text-center text-xs text-gray-500 font-semibold">
                  Belum ada riwayat mutasi koin. Putar roda harian untuk mulai mengumpulkan koin!
                </div>
              ) : (
                <div className="space-y-2">
                  {coinHistory.map((item) => {
                    const isCredit = item.amount > 0;
                    return (
                      <div
                        key={item.id}
                        className="p-3 bg-white border-2 border-black rounded-xl shadow-brutal-xs flex items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <p className="font-black text-xs text-black">{item.description}</p>
                          <p className="text-[10px] font-semibold text-gray-500">
                            {new Date(item.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            WIB
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`font-black text-xs px-2 py-0.5 rounded-md border ${
                              isCredit
                                ? 'bg-emerald-100 border-emerald-600 text-emerald-800'
                                : 'bg-red-100 border-red-600 text-red-800'
                            }`}
                          >
                            {isCredit ? `+${item.amount}` : item.amount} Koin
                          </span>
                          <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                            Sisa: {item.balance_after}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-cream-100 border-t-2 border-black p-3 text-center text-[11px] font-bold text-gray-600 flex items-center justify-between px-4">
          <span>🍜 Mie Jebew Official Reward • Anti-Spam Server Protected</span>
          <button
            onClick={onClose}
            className="text-black font-black hover:underline cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpinWheelModal;
