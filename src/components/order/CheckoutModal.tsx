import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  MapPin,
  User,
  Phone,
  FileText,
  AlertCircle,
  QrCode,
  Download,
  ArrowLeft,
  CheckCircle2,
  Banknote,
  ShieldCheck,
  ExternalLink,
} from '../ui/Icons';
import { CartItem, CustomerOrderData, OrderType, PaymentMethod, UserVoucher } from '../../types';
import { STORE_CONFIG } from '../../config/store';
import { generateWhatsAppOrderMessage, createWhatsAppUrl } from '../../utils/whatsapp';
import { useCustomerAuth } from '../../context/CustomerAuthContext';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  totalAmount: number;
  onOrderCompleted: () => void;
  appliedVoucher?: UserVoucher | null;
  onApplyVoucher?: (voucher: UserVoucher | null) => void;
  availableVouchers?: UserVoucher[];
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  totalAmount,
  onOrderCompleted,
  appliedVoucher,
  onApplyVoucher,
  availableVouchers = [],
}) => {
  if (!isOpen) return null;

  const { customer } = useCustomerAuth();
  const [step, setStep] = useState<'form' | 'qris_payment'>('form');
  const [customerName, setCustomerName] = useState(() => customer?.name || '');
  const [customerPhone, setCustomerPhone] = useState(() => customer?.phone || '');
  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('qris');
  const [address, setAddress] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const discountAmount = appliedVoucher?.discountAmount ?? 0;
  const finalPayableAmount = Math.max(0, totalAmount - discountAmount);

  // Reset step when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setErrorMessage('');
      if (customer) {
        if (!customerName) setCustomerName(customer.name);
        if (!customerPhone) setCustomerPhone(customer.phone);
      }
    }
  }, [isOpen, customer]);

  const validateForm = (): boolean => {
    setErrorMessage('');

    if (!customerName.trim()) {
      setErrorMessage('Silakan isi Nama Pemesan terlebih dahulu.');
      return false;
    }

    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 9) {
      setErrorMessage('Silakan masukkan Nomor WhatsApp yang valid (minimal 9 digit).');
      return false;
    }

    if (orderType === 'delivery' && !address.trim()) {
      setErrorMessage('Alamat pengiriman wajib diisi untuk pesanan Delivery.');
      return false;
    }

    if (orderType === 'dine_in' && !tableNumber.trim()) {
      setErrorMessage('Nomor meja wajib diisi jika makan di tempat (Dine-in).');
      return false;
    }

    return true;
  };

  const handleProceedFromForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (paymentMethod === 'qris') {
      // User must view and complete QRIS payment first
      setStep('qris_payment');
    } else {
      // Direct finish for cash payment
      finishOrder('cash');
    }
  };

  const handleFinishQRISPayment = () => {
    finishOrder('qris');
  };

  const finishOrder = (method: PaymentMethod) => {
    // Trigger celebration confetti dynamically
    import('canvas-confetti')
      .then((m) => {
        m.default({
          particleCount: 85,
          spread: 70,
          origin: { y: 0.6 },
        });
      })
      .catch(() => {});

    const customerData: CustomerOrderData = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      orderType,
      paymentMethod: method,
      address: address.trim(),
      tableNumber: tableNumber.trim(),
      additionalNotes: additionalNotes.trim(),
    };

    // Auto-record pesanan ke database (MySQL / phpMyAdmin & SQLite)
    const orderPayload = {
      id: `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      orderType,
      tableNumber: tableNumber.trim() || undefined,
      address: address.trim() || undefined,
      paymentMethod: method,
      paymentStatus: method === 'cash' ? 'pending' : 'paid',
      subtotal: totalAmount,
      discountAmount: discountAmount,
      voucherCode: appliedVoucher?.code || undefined,
      totalAmount: finalPayableAmount,
      additionalNotes: additionalNotes.trim() || undefined,
      items: cart.map((item) => ({
        menuItemId: item.menuItem.id,
        itemName: item.menuItem.name,
        quantity: item.quantity,
        spiceLevel: item.spiceLevel,
        selectedToppings: item.selectedToppings,
        unitPrice: item.menuItem.price,
        itemTotal: item.itemTotal,
        notes: item.notes,
      })),
    };

    try {
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      }).catch((e) => console.warn('[Order DB Auto-Record Note]:', e));
    } catch {}

    // Generate message and link with voucher discount
    const voucherInfo = appliedVoucher
      ? {
          title: appliedVoucher.title,
          code: appliedVoucher.code,
          discountAmount: appliedVoucher.discountAmount,
        }
      : null;

    const message = generateWhatsAppOrderMessage(cart, customerData, finalPayableAmount, voucherInfo);
    const waUrl = createWhatsAppUrl(message);

    // Open WhatsApp in new tab / app
    window.open(waUrl, '_blank');

    setTimeout(() => {
      onOrderCompleted();
    }, 1500);
  };

  const handleDownloadQRIS = () => {
    const link = document.createElement('a');
    link.href = STORE_CONFIG.assets.qris;
    link.download = `QRIS-${STORE_CONFIG.assets.qrisMerchantName}.jpeg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenQRISNewTab = () => {
    window.open(STORE_CONFIG.assets.qris, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full sm:max-w-lg bg-cream border-t-4 sm:border-4 border-black sm:rounded-3xl shadow-brutal-xl max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-cream-100 border-b-3 border-black p-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            {step === 'qris_payment' ? (
              <button
                type="button"
                onClick={() => setStep('form')}
                className="w-9 h-9 rounded-xl bg-white border-2 border-black flex items-center justify-center shadow-brutal-sm hover:bg-gray-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer mr-1"
                aria-label="Kembali ke Form"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-whatsapp text-white border-2 border-black flex items-center justify-center shadow-brutal-sm font-black">
                <Send className="w-4 h-4" />
              </div>
            )}
            <div>
              <h3 className="font-black text-base sm:text-lg text-black leading-tight">
                {step === 'form' ? 'DATA PEMESAN' : 'PEMBAYARAN QRIS'}
              </h3>
              <span className="text-xs font-bold text-gray-600">
                {step === 'form'
                  ? `${cart.length} menu siap dipesan`
                  : `Langkah 2 dari 2: Selesaikan Transfer`}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup Form"
            className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Step 1: Form */}
        {step === 'form' && (
          <form onSubmit={handleProceedFromForm} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
            {errorMessage && (
              <div className="bg-red-100 border-2 border-jebew-red p-3 rounded-xl flex items-center gap-2 text-xs font-bold text-red-900 shadow-brutal-sm animate-shake">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-700" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Metode Pemesanan */}
            <div className="space-y-1.5">
              <label className="font-black text-xs sm:text-sm uppercase tracking-wide">
                PILIH METODE ORDER
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setOrderType('delivery')}
                  className={`py-2 px-1.5 rounded-xl border-2 border-black text-center font-bold text-xs transition-all cursor-pointer min-h-[44px] flex flex-col items-center justify-center ${
                    orderType === 'delivery'
                      ? 'bg-jebew-red text-white shadow-brutal translate-x-0.5 translate-y-0.5'
                      : 'bg-white text-black shadow-brutal-sm hover:bg-gray-50'
                  }`}
                >
                  <span>🛵 Antar</span>
                  <span className="text-[10px] font-normal">Delivery</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderType('takeaway')}
                  className={`py-2 px-1.5 rounded-xl border-2 border-black text-center font-bold text-xs transition-all cursor-pointer min-h-[44px] flex flex-col items-center justify-center ${
                    orderType === 'takeaway'
                      ? 'bg-jebew-red text-white shadow-brutal translate-x-0.5 translate-y-0.5'
                      : 'bg-white text-black shadow-brutal-sm hover:bg-gray-50'
                  }`}
                >
                  <span>🥡 Bungkus</span>
                  <span className="text-[10px] font-normal">Take Away</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderType('dine_in')}
                  className={`py-2 px-1.5 rounded-xl border-2 border-black text-center font-bold text-xs transition-all cursor-pointer min-h-[44px] flex flex-col items-center justify-center ${
                    orderType === 'dine_in'
                      ? 'bg-jebew-red text-white shadow-brutal translate-x-0.5 translate-y-0.5'
                      : 'bg-white text-black shadow-brutal-sm hover:bg-gray-50'
                  }`}
                >
                  <span>🍽️ Di Tempat</span>
                  <span className="text-[10px] font-normal">Dine In</span>
                </button>
              </div>
            </div>

            {/* Nama Pemesan */}
            <div className="space-y-1.5">
              <label className="font-black text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1.5">
                <User className="w-4 h-4 text-gray-700" />
                NAMA LENGKAP / PANGGILAN *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Contoh: Budi Prasetyo"
                className="w-full bg-white border-2 border-black rounded-xl p-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-jebew-yellow min-h-[44px]"
              />
            </div>

            {/* Nomor WhatsApp */}
            <div className="space-y-1.5">
              <label className="font-black text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-whatsapp-dark" />
                NOMOR WHATSAPP AKTIF *
              </label>
              <input
                type="tel"
                inputMode="numeric"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full bg-white border-2 border-black rounded-xl p-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-jebew-yellow min-h-[44px]"
              />
              <span className="text-[11px] font-semibold text-gray-500">
                Admin akan memverifikasi pesanan dan bukti bayar ke nomor ini.
              </span>
            </div>

            {/* Dinamis: Alamat (jika Delivery) */}
            {orderType === 'delivery' && (
              <div className="space-y-1.5 animate-in fade-in duration-150">
                <label className="font-black text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-jebew-red" />
                  ALAMAT LENGKAP PENGANTARAN *
                </label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, atau patokan lokasi..."
                  className="w-full bg-white border-2 border-black rounded-xl p-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-jebew-yellow"
                />
              </div>
            )}

            {/* Dinamis: Nomor Meja (jika Dine-in) */}
            {orderType === 'dine_in' && (
              <div className="space-y-1.5 animate-in fade-in duration-150">
                <label className="font-black text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-jebew-red" />
                  NOMOR MEJA RESTO *
                </label>
                <input
                  type="text"
                  required
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Contoh: Meja 05"
                  className="w-full bg-white border-2 border-black rounded-xl p-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-jebew-yellow min-h-[44px]"
                />
              </div>
            )}

            {/* Catatan Tambahan */}
            <div className="space-y-1.5">
              <label className="font-black text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-gray-700" />
                CATATAN TAMBAHAN (OPSIONAL)
              </label>
              <input
                type="text"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Contoh: Minta sendok plastik 2, sambal dipisah..."
                className="w-full bg-white border-2 border-black rounded-xl p-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-jebew-yellow min-h-[44px]"
              />
            </div>

            {/* PILIHAN METODE PEMBAYARAN */}
            <div className="space-y-2 pt-1">
              <label className="font-black text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-black" />
                PILIH METODE PEMBAYARAN *
              </label>

              <div className="space-y-2">
                {/* Opsi QRIS (Default & Utama) */}
                <div
                  onClick={() => setPaymentMethod('qris')}
                  className={`p-3 rounded-2xl border-2 border-black cursor-pointer transition-all flex items-start gap-3 ${
                    paymentMethod === 'qris'
                      ? 'bg-amber-50 shadow-brutal border-black ring-2 ring-jebew-yellow'
                      : 'bg-white shadow-brutal-sm hover:bg-gray-50'
                  }`}
                >
                  <div className="mt-0.5">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="qris"
                      checked={paymentMethod === 'qris'}
                      onChange={() => setPaymentMethod('qris')}
                      className="w-4 h-4 accent-jebew-red cursor-pointer"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <div className="font-black text-xs sm:text-sm text-black flex items-center gap-1.5">
                        <QrCode className="w-4 h-4 text-jebew-red" />
                        <span>QRIS ({STORE_CONFIG.assets.qrisMerchantName})</span>
                      </div>
                      <span className="text-[10px] font-black bg-jebew-red text-white px-2 py-0.5 rounded-full border border-black shadow-brutal-xs">
                        ⚡ REKOMENDASI
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-gray-600 mt-0.5 leading-snug">
                      Bisa scan via BCA, BRI, Mandiri, BNI, GoPay, OVO, DANA, ShopeePay, dll.
                    </p>
                  </div>
                </div>

                {/* Opsi Tunai */}
                <div
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3 rounded-2xl border-2 border-black cursor-pointer transition-all flex items-start gap-3 ${
                    paymentMethod === 'cash'
                      ? 'bg-amber-50 shadow-brutal border-black ring-2 ring-jebew-yellow'
                      : 'bg-white shadow-brutal-sm hover:bg-gray-50'
                  }`}
                >
                  <div className="mt-0.5">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={paymentMethod === 'cash'}
                      onChange={() => setPaymentMethod('cash')}
                      className="w-4 h-4 accent-jebew-red cursor-pointer"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-black text-xs sm:text-sm text-black flex items-center gap-1.5">
                      <Banknote className="w-4 h-4 text-emerald-700" />
                      <span>Tunai / Bayar di Tempat</span>
                    </div>
                    <p className="text-[11px] font-semibold text-gray-600 mt-0.5 leading-snug">
                      Bayar cash langsung saat pesanan diantar (COD) atau di kasir outlet.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* VOUCHER DISKON / HADIAH KOIN */}
            <div className="bg-amber-50 border-2 border-black rounded-2xl p-3.5 space-y-2 shadow-brutal-xs">
              <div className="flex items-center justify-between">
                <label className="font-black text-xs uppercase tracking-wide text-black flex items-center gap-1.5">
                  <span>🎟️ VOUCHER DISKON KOIN</span>
                </label>
                {appliedVoucher && (
                  <button
                    type="button"
                    onClick={() => onApplyVoucher?.(null)}
                    className="text-[10px] font-black text-red-600 hover:underline cursor-pointer"
                  >
                    Lepas Voucher
                  </button>
                )}
              </div>

              {appliedVoucher ? (
                <div className="bg-emerald-100 border-2 border-emerald-600 rounded-xl p-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-black text-xs text-emerald-900 block">
                      ✓ {appliedVoucher.title}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700">
                      Kode: {appliedVoucher.code}
                    </span>
                  </div>
                  <span className="text-xs font-black text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-600">
                    -Rp{appliedVoucher.discountAmount.toLocaleString('id-ID')}
                  </span>
                </div>
              ) : availableVouchers.filter((v) => !v.isUsed).length > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-gray-700">
                    Kamu punya voucher hasil tukar koin. Pilih untuk pakai:
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {availableVouchers
                      .filter((v) => !v.isUsed)
                      .map((vch) => (
                        <div
                          key={vch.id}
                          className="bg-white border-2 border-black rounded-xl p-2 flex items-center justify-between shadow-brutal-xs"
                        >
                          <div>
                            <span className="font-black text-xs text-black block">
                              {vch.title}
                            </span>
                            <span className="text-[10px] text-gray-600 font-bold">
                              Kode: {vch.code}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onApplyVoucher?.(vch)}
                            className="bg-jebew-red hover:bg-red-700 text-white font-black text-[11px] px-2.5 py-1 rounded-lg border border-black shadow-brutal-xs cursor-pointer active:translate-x-0.5"
                          >
                            Pakai
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] font-semibold text-gray-600">
                  Belum ada voucher aktif. Putar Lucky Wheel dan kumpulkan koin untuk dapat potongan diskon!
                </p>
              )}
            </div>

            {/* RINGKASAN TOTAL PEMBAYARAN */}
            <div className="bg-cream-100 border-2 border-black rounded-2xl p-3.5 space-y-1.5 shadow-brutal-xs">
              <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                <span>Subtotal Pesanan:</span>
                <span>Rp{totalAmount.toLocaleString('id-ID')}</span>
              </div>
              {appliedVoucher && (
                <div className="flex items-center justify-between text-xs font-black text-emerald-700">
                  <span>Diskon Voucher ({appliedVoucher.code}):</span>
                  <span>-Rp{appliedVoucher.discountAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="border-t border-black pt-1.5 flex items-center justify-between">
                <span className="font-black text-sm text-black uppercase">Total Bayar:</span>
                <span className="font-black text-base sm:text-lg text-brand-red">
                  Rp{finalPayableAmount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              {paymentMethod === 'qris' ? (
                <button
                  type="submit"
                  className="w-full min-h-[52px] bg-jebew-red hover:bg-red-700 active:bg-red-800 text-white font-black text-base py-3 px-4 border-3 border-black rounded-xl shadow-brutal active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <QrCode className="w-5 h-5" />
                  <span>LANJUT KE PEMBAYARAN QRIS</span>
                </button>
              ) : (
                <button
                  type="submit"
                  className="w-full min-h-[52px] bg-whatsapp hover:bg-emerald-600 active:bg-emerald-700 text-white font-black text-base py-3 px-4 border-3 border-black rounded-xl shadow-brutal active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-5 h-5" />
                  <span>KIRIM PESANAN KE WHATSAPP</span>
                </button>
              )}

              <p className="text-[11px] font-bold text-center text-gray-500 mt-2">
                {paymentMethod === 'qris'
                  ? 'Barcode QRIS resmi akan tampil di langkah berikutnya sebelum diarahkan ke WhatsApp.'
                  : `Pesan akan otomatis disusun dan dibuka di WhatsApp toko (${STORE_CONFIG.whatsappDisplay}).`}
              </p>
            </div>
          </form>
        )}

        {/* Modal Body Step 2: Layar Pembayaran QRIS */}
        {step === 'qris_payment' && (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 animate-in slide-in-from-right-4 duration-200">
            {/* Banner Informasi QRIS */}
            <div className="bg-amber-100 border-2 border-black rounded-2xl p-3.5 shadow-brutal-sm flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-jebew-yellow border-2 border-black flex items-center justify-center flex-shrink-0 shadow-brutal-xs">
                <QrCode className="w-5 h-5 text-black" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm text-black uppercase">
                    SCAN & SELESAIKAN PEMBAYARAN
                  </span>
                </div>
                <p className="text-xs font-semibold text-gray-700 mt-0.5">
                  Scan kode QRIS di bawah dengan aplikasi m-Banking atau E-Wallet pilihanmu. Setelah bayar, klik tombol konfirmasi untuk langsung terhubung ke WhatsApp.
                </p>
              </div>
            </div>

            {/* Kotak Barcode QRIS Resmi */}
            <div className="bg-white border-3 border-black rounded-2xl p-4 shadow-brutal flex flex-col items-center justify-center text-center space-y-3">
              {/* Merchant Title */}
              <div className="border-b-2 border-dashed border-gray-300 pb-2 w-full">
                <div className="inline-flex items-center gap-1 text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-500 px-2.5 py-0.5 rounded-full mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  QRIS RESMI TERVERIFIKASI
                </div>
                <h4 className="font-black text-lg sm:text-xl text-black tracking-wide">
                  {STORE_CONFIG.assets.qrisMerchantName}
                </h4>
                <p className="text-xs font-bold text-gray-500">
                  NMID: {STORE_CONFIG.assets.qrisNmid}
                </p>
              </div>

              {/* Total Yang Harus Ditransfer */}
              <div className="bg-amber-100 border-2 border-black rounded-xl p-2.5 my-1 w-full text-center shadow-brutal-xs">
                <span className="text-[11px] font-bold text-gray-700 block">TOTAL TRANSFER:</span>
                <span className="text-xl sm:text-2xl font-black text-brand-red block">
                  Rp{finalPayableAmount.toLocaleString('id-ID')}
                </span>
                {appliedVoucher && (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-500 inline-block mt-1">
                    Hemat voucher -Rp{appliedVoucher.discountAmount.toLocaleString('id-ID')}
                  </span>
                )}
              </div>

              {/* Gambar QRIS */}
              <div className="relative group max-w-[260px] w-full border-2 border-black rounded-xl overflow-hidden shadow-brutal-sm bg-white p-1">
                <img
                  src={STORE_CONFIG.assets.qris}
                  alt={`QRIS ${STORE_CONFIG.assets.qrisMerchantName}`}
                  className="w-full h-auto object-contain rounded-lg"
                />
              </div>

              {/* Tombol Aksi QRIS (Unduh / Perbesar) */}
              <div className="flex items-center gap-2 w-full pt-1">
                <button
                  type="button"
                  onClick={handleDownloadQRIS}
                  className="flex-1 min-h-[40px] bg-white hover:bg-gray-100 text-black font-black text-xs py-2 px-3 border-2 border-black rounded-xl shadow-brutal-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Simpan Gambar</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenQRISNewTab}
                  className="flex-1 min-h-[40px] bg-white hover:bg-gray-100 text-black font-black text-xs py-2 px-3 border-2 border-black rounded-xl shadow-brutal-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Layar Penuh</span>
                </button>
              </div>
            </div>

            {/* Panduan Pembayaran 4 Langkah */}
            <div className="bg-cream-100 border-2 border-black rounded-2xl p-4 shadow-brutal-sm space-y-2.5">
              <h5 className="font-black text-xs sm:text-sm uppercase tracking-wide text-black flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                PANDUAN LANGKAH BAYAR:
              </h5>
              <ol className="text-xs font-semibold text-gray-700 space-y-1.5 list-decimal list-inside">
                <li>Buka aplikasi m-Banking (BCA, Mandiri, BRI, dll.) atau E-Wallet (GoPay, OVO, DANA, ShopeePay).</li>
                <li>Pilih fitur <strong>Scan QRIS</strong> (bisa langsung scan atau upload gambar jika disimpan di galeri).</li>
                <li>Pastikan nama merchant tertera <strong>{STORE_CONFIG.assets.qrisMerchantName}</strong>.</li>
                <li>Selesaikan pembayaran dan <strong>simpan/screenshot bukti transfer</strong>.</li>
              </ol>
            </div>

            {/* Kotak Peringatan */}
            <div className="bg-red-50 border-2 border-jebew-red rounded-xl p-3 text-xs font-bold text-red-900 flex items-center gap-2 shadow-brutal-xs">
              <AlertCircle className="w-4 h-4 text-red-700 flex-shrink-0" />
              <span>Pastikan Anda telah berhasil menyelesaikan transfer sebelum menekan tombol di bawah.</span>
            </div>

            {/* Tombol Konfirmasi Selesai Bayar */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleFinishQRISPayment}
                className="w-full min-h-[54px] bg-whatsapp hover:bg-emerald-600 active:bg-emerald-700 text-white font-black text-sm sm:text-base py-3 px-4 border-3 border-black rounded-xl shadow-brutal active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5 text-white" />
                <span>SAYA SUDAH SELESAI BAYAR (KE WHATSAPP)</span>
              </button>

              <button
                type="button"
                onClick={() => setStep('form')}
                className="w-full min-h-[42px] bg-white hover:bg-gray-100 text-black font-black text-xs py-2 px-3 border-2 border-black rounded-xl shadow-brutal-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali / Ubah Data Pemesan</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutModal;
