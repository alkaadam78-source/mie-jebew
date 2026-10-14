import React from 'react';
import { Plus, Flame, HelpCircle, Star } from '../ui/Icons';
import { MenuItem, ItemRatingSummary } from '../../types';

interface MenuCardProps {
  item: MenuItem;
  ratingSummary: ItemRatingSummary;
  onSelect: (item: MenuItem) => void;
  onOpenRating: (item: MenuItem) => void;
}

export const MenuCard: React.FC<MenuCardProps> = React.memo(({
  item,
  ratingSummary,
  onSelect,
  onOpenRating,
}) => {
  // Yang tersedia HANYA Mie Jebew Original
  const isOriginalMie = item.id === 'mie-1' || (item.name && item.name.toLowerCase().includes('mie jebew original'));

  const hasImage = isOriginalMie && Boolean(item.image && item.image.trim().length > 0);
  const hasValidName = isOriginalMie && Boolean(item.name && item.name.trim() !== '???');
  const hasValidPrice = isOriginalMie && typeof item.price === 'number' && item.price > 0;

  // Menu dianggap siap dipesan HANYA jika Mie Jebew Original
  const isOrderable = isOriginalMie && hasImage && hasValidName && hasValidPrice;

  // Nama, Foto, Deskripsi, dan Harga disembunyikan menjadi tanda tanya (?) untuk menu lain
  const displayImage = isOrderable ? item.image : '';
  const displayName = isOrderable ? item.name : '???';
  const displayDescription = isOrderable ? item.description : '???';
  const categoryLabel = (item.category || item.category_id || 'mie').toUpperCase();

  const hasSalePrice = Boolean(item.sale_price && item.sale_price > 0 && item.price > item.sale_price);
  const currentPrice = hasSalePrice ? item.sale_price! : item.price;
  const displayPriceText = isOrderable ? `Rp${currentPrice.toLocaleString('id-ID')}` : 'Rp ???';

  return (
    <div id={`menu-item-${item.id}`} className="group flex flex-col bg-white border-3 border-black rounded-2xl overflow-hidden shadow-brutal hover:shadow-brutal-lg transition-all duration-150 h-full justify-between scroll-mt-28">
      
      {/* Visual Header: Food Photo or Neo-Brutalist Question Mark Placeholder */}
      <div className="relative aspect-[16/10] w-full bg-jebew-yellow border-b-3 border-black flex flex-col items-center justify-center overflow-hidden select-none">
        {displayImage ? (
          <img
            src={displayImage}
            alt={displayName}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <>
            {/* Decorative background pattern */}
            <div 
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 10px, transparent 10px, transparent 20px)',
              }}
            />

            {/* Big Stylized Brutalist Question Mark Container */}
            <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 bg-white border-3 border-black rounded-2xl shadow-brutal flex items-center justify-center transform -rotate-2 hover:rotate-2 transition-transform">
              <span className="font-black text-4xl sm:text-5xl text-black">
                ?
              </span>
            </div>
          </>
        )}

        {/* Floating Top-Left Badge */}
        {item.badge ? (
          <div className="absolute top-2.5 left-2.5 bg-white border-2 border-black px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wide shadow-brutal-sm flex items-center gap-1 z-20">
            {item.isBestSeller && <Flame className="w-3 h-3 text-jebew-red fill-jebew-red" />}
            {item.badge}
          </div>
        ) : (
          <div className="absolute top-2.5 left-2.5 bg-white border-2 border-black px-2 py-0.5 rounded-md text-[10px] font-black uppercase text-gray-800 z-20">
            {categoryLabel}
          </div>
        )}

        {/* Top-Right Tag */}
        <div className={`absolute top-2.5 right-2.5 ${isOrderable ? 'bg-jebew-red text-white' : 'bg-black text-yellow-300'} border-2 border-black px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 z-20 shadow-brutal-sm`}>
          {isOrderable ? (
            <>
              <Flame className="w-3 h-3 fill-white" />
              <span>READY ORDER</span>
            </>
          ) : (
            <>
              <HelpCircle className="w-3 h-3" />
              <span>SECRET MENU</span>
            </>
          )}
        </div>

        {/* Bottom Level Indicator if spicy */}
        {item.isSpicySelectable && (
          <div className="absolute bottom-2 right-2.5 bg-jebew-red text-white px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase border border-black z-20 shadow-brutal-sm">
            LEVEL 0-5
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          {/* Item Name */}
          <div className="flex items-center gap-2">
            <span className="text-xl">{displayImage ? '🍜' : '❓'}</span>
            <h3 className="font-black text-lg sm:text-xl text-black leading-snug">
              {displayName}
            </h3>
          </div>

          <p className="text-xs sm:text-sm font-medium text-gray-700 line-clamp-2 leading-relaxed">
            {displayDescription}
          </p>

          {/* Interactive Rating Strip */}
          <div className="flex items-center justify-between bg-cream-50 border-2 border-black rounded-xl p-2.5 shadow-brutal-sm">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-amber-400 stroke-black stroke-[1.5]" />
              <span className="font-black text-xs sm:text-sm text-black">
                {ratingSummary.count > 0 ? Number(ratingSummary.average).toFixed(1) : "0"}
              </span>
              <span className="text-[11px] font-bold text-gray-500">
                ({ratingSummary.count} ulasan)
              </span>
            </div>

            {isOrderable ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenRating(item);
                }}
                className="text-xs font-black text-jebew-red hover:underline flex items-center gap-1 cursor-pointer bg-white px-2 py-1 rounded-md border border-black"
              >
                {ratingSummary.userRating ? `Ratingmu: ${ratingSummary.userRating}★` : "⭐ Beri Rating"}
              </button>
            ) : (
              <span className="text-[10px] font-black text-gray-500 bg-white px-2 py-1 rounded-md border border-gray-300">
                Belum Rilis
              </span>
            )}
          </div>
        </div>

        {/* Price and Order Button */}
        <div className="pt-2 border-t-2 border-dashed border-gray-300 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-gray-600 uppercase tracking-wide">
              {categoryLabel === 'MIE' ? 'Porsi Kenyang' : 'Harga'}
            </span>
            <div className="flex items-center gap-1.5">
              {hasValidPrice && hasSalePrice && (
                <span className="text-xs line-through font-bold text-gray-400">
                  Rp{item.price.toLocaleString('id-ID')}
                </span>
              )}
              <span className="font-black text-lg text-jebew-red bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg shadow-2xs">
                {displayPriceText}
              </span>
            </div>
          </div>
          {isOrderable ? (
            <button
              onClick={() => onSelect(item)}
              className="w-full min-h-[46px] px-4 py-2.5 bg-jebew-yellow hover:bg-yellow-400 active:bg-yellow-500 text-black font-black text-xs sm:text-sm border-2 border-black rounded-xl shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>PILIH & ATUR LEVEL</span>
            </button>
          ) : (
            <button
              disabled
              className="w-full min-h-[46px] px-4 py-2.5 bg-neutral-200 text-neutral-500 font-black text-xs sm:text-sm border-2 border-black rounded-xl shadow-brutal-xs flex items-center justify-center gap-2 cursor-not-allowed select-none"
            >
              <HelpCircle className="w-4 h-4" />
              <span>MENU RAHASIA (SEGERA HADIR ❓)</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
});

MenuCard.displayName = 'MenuCard';
