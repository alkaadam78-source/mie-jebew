import React, { useState, useMemo } from 'react';
import { MenuCategory, MenuItem, ItemRatingSummary } from '../../types';
import { MENU_ITEMS } from '../../data/menu';
import { MenuCard } from './MenuCard';
import { UtensilsCrossed, Star } from '../ui/Icons';
import { ScrollReveal } from '../ui/ScrollReveal';
import { usePublicData } from '../../context/PublicDataContext';

interface MenuCatalogProps {
  onSelectItem: (item: MenuItem) => void;
  getRatingSummary: (itemId: string) => ItemRatingSummary;
  onOpenRating: (item: MenuItem) => void;
}

const CATEGORIES: { key: MenuCategory; label: string; icon: string }[] = [
  { key: 'all', label: 'Semua Menu', icon: '✨' },
  { key: 'mie', label: 'Mie Jebew (10K)', icon: '🍜' },
  { key: 'paket', label: 'Paket Hemat (10K)', icon: '🔥' },
  { key: 'topping', label: 'Topping & Side', icon: '🥚' },
  { key: 'minuman', label: 'Minuman Segar', icon: '🥤' },
];

export const MenuCatalog: React.FC<MenuCatalogProps> = ({
  onSelectItem,
  getRatingSummary,
  onOpenRating,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>('all');
  const { menu: liveMenu } = usePublicData();

  const sourceItems = useMemo(() => {
    if (liveMenu && liveMenu.length > 0) {
      return liveMenu.filter((m) => Boolean(m.is_active));
    }
    return MENU_ITEMS;
  }, [liveMenu]);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') {
      return sourceItems;
    }
    return sourceItems.filter((item) => (item.category || item.category_id) === selectedCategory);
  }, [selectedCategory, sourceItems]);

  return (
    <section id="menu" className="py-10 sm:py-16 bg-cream border-t-3 border-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <ScrollReveal animation="fade-up" duration={700}>
          <div className="text-center space-y-3 mb-8">
            <div className="inline-flex items-center gap-1.5 bg-jebew-yellow border-2 border-black px-3.5 py-1 rounded-full text-xs font-black shadow-brutal-sm uppercase">
              <UtensilsCrossed className="w-3.5 h-3.5" />
              KATALOG RESMI SERBA 10K
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-black tracking-tight">
              PILIH MENU SERBA 10 RIBU
            </h2>
            <p className="text-sm sm:text-base font-bold text-gray-700 max-w-lg mx-auto">
              Semua menu mie & paket komplit serba Rp 10.000! Diolah dadakan dengan cabai rawit merah asli dan bumbu gurih nampol.
            </p>

            <div className="pt-1 flex items-center justify-center gap-2 text-xs font-black text-amber-600">
              <Star className="w-4 h-4 fill-amber-400 stroke-black stroke-[1.5]" />
              <span>Rating Komunitas Terbuka: Semua orang bisa melihat & memberikan rating sendiri</span>
            </div>
          </div>
        </ScrollReveal>

        {/* Category Filter Tabs (Scrollable on mobile) */}
        <ScrollReveal animation="fade-up" delay={80} duration={700}>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-8 justify-start sm:justify-center">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm border-2 border-black transition-all cursor-pointer whitespace-nowrap min-h-[44px] ${
                    isActive
                      ? 'bg-jebew-red text-white shadow-brutal translate-x-0.5 translate-y-0.5'
                      : 'bg-white text-black shadow-brutal-sm hover:bg-cream-200'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </ScrollReveal>

        {/* Menu Grid: 1-2 columns on mobile, 3 on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredItems.map((item, idx) => (
            <ScrollReveal
              key={item.id}
              animation="apple-card"
              delay={(idx % 3) * 90}
              duration={650}
              className="h-full"
            >
              <MenuCard
                item={item}
                ratingSummary={getRatingSummary(item.id)}
                onSelect={onSelectItem}
                onOpenRating={onOpenRating}
              />
            </ScrollReveal>
          ))}
        </div>

      </div>
    </section>
  );
};
