import React, { useState, useMemo } from 'react';
import { X, Flame, Plus, Minus, Check, Sparkles, HelpCircle } from '../ui/Icons';
import { MenuItem, SpiceLevel, Topping } from '../../types';
import { SPICE_LEVELS, TOPPINGS } from '../../data/menu';
import { usePublicData } from '../../context/PublicDataContext';

interface CustomOrderModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (
    item: MenuItem,
    quantity: number,
    spiceLevel: SpiceLevel,
    toppings: Topping[],
    notes: string
  ) => void;
}

export const CustomOrderModal: React.FC<CustomOrderModalProps> = ({
  item,
  onClose,
  onAddToCart,
}) => {
  if (!item) return null;

  const { customOptions } = usePublicData();

  const availableSpiceLevels = useMemo(() => {
    const live = customOptions.filter((o) => o.group_type === 'spice_level' && Boolean(o.is_active));
    if (live.length > 0) {
      return live.map((o) => ({
        level: (o.level_number ?? 0) as SpiceLevel,
        name: o.name,
        badge: o.badge || o.name,
        chiliCount: o.description || `${o.level_number} Cabai`,
        description: o.description || '',
      }));
    }
    return SPICE_LEVELS;
  }, [customOptions]);

  const availableToppings = useMemo(() => {
    const live = customOptions.filter((o) => o.group_type === 'topping' && Boolean(o.is_active));
    if (live.length > 0) {
      return live.map((o) => ({
        id: o.id,
        name: o.name,
        price: o.price_adjustment,
        isDefault: false,
      }));
    }
    return TOPPINGS;
  }, [customOptions]);

  const [quantity, setQuantity] = useState(1);
  const [selectedSpiceLevel, setSelectedSpiceLevel] = useState<SpiceLevel>(3); // default to level 3
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);
  const [notes, setNotes] = useState('');

  // Toggle topping selection
  const handleToggleTopping = (topping: Topping) => {
    setSelectedToppings((prev) => {
      const exists = prev.some((t) => t.id === topping.id);
      if (exists) {
        return prev.filter((t) => t.id !== topping.id);
      } else {
        return [...prev, topping];
      }
    });
  };

  const handleConfirm = () => {
    onAddToCart(item, quantity, selectedSpiceLevel, selectedToppings, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Modal / Bottom Sheet Box */}
      <div 
        className="relative w-full sm:max-w-lg bg-cream border-t-4 sm:border-4 border-black sm:rounded-3xl shadow-brutal-xl max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-cream-100 border-b-3 border-black p-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {item.image ? (
              <div className="w-12 h-12 rounded-xl border-2 border-black overflow-hidden shadow-brutal-sm flex-shrink-0 bg-white">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-jebew-yellow border-2 border-black flex items-center justify-center font-black text-xl shadow-brutal-sm flex-shrink-0">
                ?
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-black leading-tight line-clamp-1">
                  {item.name}
                </h3>
                <span className="text-xs font-black bg-jebew-yellow border border-black px-1.5 py-0.5 rounded shadow-2xs">
                  Rp{item.price.toLocaleString('id-ID')}
                </span>
              </div>
              <span className="text-xs font-bold text-gray-600 flex items-center gap-1">
                {item.image ? (
                  <>
                    <Flame className="w-3.5 h-3.5 text-jebew-red fill-jebew-red" />
                    Serba 10 Ribu • Bebas Atur Level Pedas
                  </>
                ) : (
                  <>
                    <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                    Menu Spesial • Bebas Atur Level
                  </>
                )}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup Dialog"
            className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Spice Level Selector (Only for items that are spicy selectable) */}
          {item.isSpicySelectable && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-black text-sm uppercase tracking-wide flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-jebew-red fill-jebew-red" />
                  PILIH LEVEL PEDAS (WAJIB)
                </label>
                <span className="text-xs font-bold text-jebew-red bg-red-100 px-2 py-0.5 rounded border border-red-300">
                  Level {selectedSpiceLevel} Terpilih
                </span>
              </div>

              {/* Spice Chips Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableSpiceLevels.map((spice) => {
                  const isSelected = selectedSpiceLevel === spice.level;
                  return (
                    <button
                      key={spice.level}
                      type="button"
                      onClick={() => setSelectedSpiceLevel(spice.level)}
                      className={`min-h-[56px] p-2.5 rounded-xl border-2 border-black text-left flex flex-col justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-jebew-red text-white shadow-brutal translate-x-0.5 translate-y-0.5'
                          : 'bg-white text-black shadow-brutal-sm hover:bg-yellow-50'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-black text-sm">
                          Lvl {spice.level}
                        </span>
                        {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                      </div>
                      <span className={`text-[10px] font-bold truncate ${isSelected ? 'text-yellow-200' : 'text-gray-600'}`}>
                        {spice.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Toppings Multi-Select (Available for mie and paket) */}
          {(item.category === 'mie' || item.category === 'paket') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-black text-sm uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  TAMBAH TOPPING (OPSIONAL)
                </label>
                <span className="text-xs font-bold text-gray-500">
                  Bisa pilih lebih dari 1
                </span>
              </div>

              {/* Toppings Grid */}
              <div className="space-y-2">
                {availableToppings.map((topping) => {
                  const isChecked = selectedToppings.some((t) => t.id === topping.id);
                  return (
                    <button
                      key={topping.id}
                      type="button"
                      onClick={() => handleToggleTopping(topping)}
                      className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border-2 border-black flex items-center justify-between transition-all cursor-pointer text-left ${
                        isChecked
                          ? 'bg-yellow-100 border-black shadow-brutal-sm'
                          : 'bg-white hover:bg-gray-50 border-black'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-md border-2 border-black flex items-center justify-center ${
                            isChecked ? 'bg-jebew-red text-white' : 'bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className="font-bold text-xs sm:text-sm text-black">
                          {topping.name}
                        </span>
                      </div>
                      <span className="font-black text-xs text-jebew-red bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                        {topping.price > 0 ? `+Rp${topping.price.toLocaleString('id-ID')}` : 'GRATIS'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Stepper */}
          <div className="space-y-2">
            <label className="font-black text-sm uppercase tracking-wide">
              JUMLAH PORSI
            </label>
            <div className="flex items-center justify-between bg-white border-2 border-black p-2 rounded-xl">
              <span className="font-bold text-sm text-gray-700 ml-2">Jumlah</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="w-10 h-10 rounded-lg bg-cream border-2 border-black flex items-center justify-center font-black text-lg disabled:opacity-40 disabled:cursor-not-allowed shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-black text-lg w-8 text-center">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-10 h-10 rounded-lg bg-jebew-yellow border-2 border-black flex items-center justify-center font-black text-lg shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Notes Textarea */}
          <div className="space-y-2">
            <label className="font-black text-sm uppercase tracking-wide">
              CATATAN UNTUK PENJUAL (OPSIONAL)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Bawang goreng dibanyakin, sambal dipisah, dll..."
              rows={2}
              className="w-full bg-white border-2 border-black rounded-xl p-3 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-jebew-yellow"
            />
          </div>

        </div>

        {/* Modal Sticky Bottom Action Bar */}
        <div className="bg-cream-100 border-t-3 border-black p-4 safe-area-bottom">
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full min-h-[50px] bg-jebew-red hover:bg-red-700 active:bg-red-800 text-white font-black text-base py-3 px-4 border-3 border-black rounded-xl shadow-brutal active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span>
              TAMBAH KE KERANJANG • Rp
              {(
                (item.price + selectedToppings.reduce((s, t) => s + t.price, 0)) *
                quantity
              ).toLocaleString('id-ID')}{' '}
              ({quantity} Porsi)
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default CustomOrderModal;
