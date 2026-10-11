import React from 'react';
import { ShoppingBag, ArrowRight } from '../ui/Icons';

interface BottomCartBarProps {
  totalItems: number;
  totalAmount?: number;
  onOpenCart: () => void;
}

export const BottomCartBar: React.FC<BottomCartBarProps> = ({
  totalItems,
  totalAmount,
  onOpenCart,
}) => {
  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-3 sm:p-4 bg-transparent pointer-events-none safe-area-bottom">
      <div className="max-w-md mx-auto pointer-events-auto">
        <button
          onClick={onOpenCart}
          className="w-full bg-black text-white p-3.5 sm:p-4 rounded-2xl border-3 border-black shadow-brutal flex items-center justify-between hover:bg-neutral-900 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer group"
        >
          {/* Left item counter */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-jebew-yellow text-black flex items-center justify-center border-2 border-white font-black">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-1.5 bg-jebew-red text-white text-[10px] w-4 h-4 rounded-full border border-black flex items-center justify-center">
                {totalItems}
              </span>
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-gray-300">
                {totalItems} Menu Dipilih
              </div>
              <div className="text-base sm:text-lg font-black text-yellow-400 leading-tight">
                {totalAmount !== undefined && totalAmount > 0
                  ? `Rp${totalAmount.toLocaleString('id-ID')}`
                  : `${totalItems} Item Siap Pesan`}
              </div>
            </div>
          </div>

          {/* Right CTA */}
          <div className="flex items-center gap-2 bg-jebew-red text-white px-3.5 py-2 rounded-xl border border-white font-black text-xs sm:text-sm group-hover:bg-red-700 transition-colors">
            <span>KERANJANG</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </div>
        </button>
      </div>
    </div>
  );
};
