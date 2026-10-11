import React from 'react';
import { Sparkles } from '../ui/Icons';

interface FloatingRewardButtonProps {
  coins: number;
  canSpinToday: boolean;
  onOpen: () => void;
  hasCartItems?: boolean;
}

export const FloatingRewardButton: React.FC<FloatingRewardButtonProps> = ({
  coins,
  canSpinToday,
  onOpen,
  hasCartItems = false,
}) => {
  return (
    <div
      className={`fixed left-3 sm:left-6 z-40 transition-all ${
        hasCartItems
          ? 'bottom-20 sm:bottom-6'
          : 'bottom-4 sm:bottom-6'
      }`}
    >
      <button
        onClick={onOpen}
        aria-label="Buka Roda Putar & Hadiah Koin"
        className="group relative flex items-center gap-2 bg-jebew-yellow hover:bg-yellow-400 active:bg-yellow-500 text-black border-3 border-black rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-brutal-sm active:shadow-none transition-all cursor-pointer font-black text-xs sm:text-sm"
      >
        {/* Pulsing indicator if user can spin today */}
        {canSpinToday && (
          <span className="absolute -top-2.5 -right-2 bg-jebew-red text-white text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-black shadow-brutal-xs animate-bounce flex items-center gap-1">
            <span>SPIN!</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          </span>
        )}

        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white border-2 border-black flex items-center justify-center text-base sm:text-lg shadow-brutal-xs group-hover:rotate-12 transition-transform">
          🎡
        </div>

        <div className="flex flex-col text-left leading-tight">
          <span className="text-[10px] sm:text-xs text-gray-800 font-extrabold flex items-center gap-1">
            LUCKY SPIN
            <Sparkles className="w-3 h-3 text-brand-red inline" />
          </span>
          <span className="text-xs sm:text-sm font-black text-black">
            🪙 {coins.toLocaleString('id-ID')} KOIN
          </span>
        </div>
      </button>
    </div>
  );
};

export default FloatingRewardButton;
