import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Flame } from '../ui/Icons';
import { CartItem } from '../../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  totalAmount?: number;
  totalItems: number;
  onUpdateQuantity: (cartItemId: string, newQty: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onProceedToCheckout: () => void;
  isReadOnly?: boolean;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  totalAmount,
  totalItems,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  isReadOnly = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full sm:max-w-lg bg-cream border-t-4 sm:border-4 border-black sm:rounded-3xl shadow-brutal-xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-cream-100 border-b-3 border-black p-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-jebew-yellow border-2 border-black flex items-center justify-center shadow-brutal-sm">
              <ShoppingBag className="w-5 h-5 text-black" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-black leading-tight">
                KERANJANG PESANAN
              </h3>
              <span className="text-xs font-bold text-gray-600">
                {totalItems} item dipilih
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup Keranjang"
            className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {cart.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-16 h-16 bg-yellow-100 border-2 border-black rounded-full flex items-center justify-center mx-auto shadow-brutal-sm">
                <ShoppingBag className="w-8 h-8 text-black" />
              </div>
              <h4 className="font-black text-lg text-black">Keranjangmu Masih Kosong!</h4>
              <p className="text-xs sm:text-sm font-semibold text-gray-600 max-w-xs mx-auto">
                Pilih menu dan atur level pedas favoritmu sekarang!
              </p>
              <button
                onClick={onClose}
                className="mt-2 inline-flex items-center gap-1.5 bg-jebew-red text-white font-black text-xs px-5 py-2.5 rounded-xl border-2 border-black shadow-brutal-sm cursor-pointer"
              >
                PILIH MENU SEKARANG
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.cartItemId}
                className="bg-white border-2 border-black rounded-2xl p-3.5 shadow-brutal-sm space-y-3"
              >
                {/* Title & Remove */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {item.menuItem.image ? (
                      <div className="w-12 h-12 rounded-xl border-2 border-black overflow-hidden shadow-brutal-sm flex-shrink-0 bg-white">
                        <img src={item.menuItem.image} alt={item.menuItem.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-jebew-yellow border-2 border-black flex items-center justify-center font-black text-lg flex-shrink-0">
                        ?
                      </div>
                    )}
                    <div>
                      <h4 className="font-black text-sm text-black leading-snug">
                        {item.menuItem.name}
                      </h4>
                      <div className="text-xs font-bold text-gray-500">
                        {item.quantity} Porsi
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onRemoveItem(item.cartItemId)}
                    aria-label="Hapus Item"
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Customizations tags */}
                <div className="bg-cream-100 border border-black/30 rounded-xl p-2.5 text-xs space-y-1">
                  {item.menuItem.isSpicySelectable && (
                    <div className="flex items-center gap-1 font-bold text-gray-800">
                      <Flame className="w-3.5 h-3.5 text-jebew-red fill-jebew-red flex-shrink-0" />
                      <span>Level Pedas: </span>
                      <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-black">
                        Level {item.spiceLevel}
                      </span>
                    </div>
                  )}

                  {item.selectedToppings.length > 0 && (
                    <div className="text-gray-700">
                      <span className="font-bold">Topping: </span>
                      <span>
                        {item.selectedToppings.map((t) => t.name).join(', ')}
                      </span>
                    </div>
                  )}

                  {item.notes && (
                    <div className="text-gray-600 italic">
                      <span className="font-bold not-italic">Catatan: </span>
                      "{item.notes}"
                    </div>
                  )}
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateQuantity(item.cartItemId, item.quantity - 1)}
                      className="w-8 h-8 rounded-lg bg-cream border border-black flex items-center justify-center font-bold active:translate-x-0.5 active:translate-y-0.5 cursor-pointer shadow-xs"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-black text-sm w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
                      className="w-8 h-8 rounded-lg bg-jebew-yellow border border-black flex items-center justify-center font-bold active:translate-x-0.5 active:translate-y-0.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="font-black text-sm text-jebew-red bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
                    Rp{item.itemTotal.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Checkout CTA */}
        {cart.length > 0 && (
          <div className="bg-cream-100 border-t-3 border-black p-4 space-y-3 safe-area-bottom">
            <div className="flex items-center justify-between font-black text-sm sm:text-base text-black bg-white border-2 border-black p-3 rounded-xl shadow-brutal-xs">
              <span className="uppercase tracking-wide">Total Pembayaran:</span>
              <span className="text-xl text-jebew-red font-black">
                Rp{(totalAmount ?? 0).toLocaleString('id-ID')}
              </span>
            </div>
            {isReadOnly ? (
              <div className="space-y-2">
                <div className="p-2.5 bg-amber-100 border-2 border-black rounded-xl text-xs font-bold text-amber-900 text-center">
                  ⚠️ Mode Read-Only Aktif: Transaksi checkout dinonaktifkan sementara untuk pemeliharaan sistem.
                </div>
                <button
                  disabled
                  className="w-full min-h-[50px] bg-neutral-400 text-white font-black text-sm py-3 px-4 border-3 border-black rounded-xl opacity-60 cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span>CHECKOUT DINONAKTIFKAN (MAINTENANCE)</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onProceedToCheckout}
                className="w-full min-h-[50px] bg-jebew-red hover:bg-red-700 active:bg-red-800 text-white font-black text-base py-3 px-4 border-3 border-black rounded-xl shadow-brutal active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>LANJUT KE CHECKOUT • Rp{(totalAmount ?? 0).toLocaleString('id-ID')}</span>
                <ArrowRight className="w-5 h-5 stroke-[3]" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
