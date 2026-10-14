import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useCart } from './hooks/useCart';
import { useFoodRatings } from './hooks/useFoodRatings';
import { useRouter } from './hooks/useRouter';
import { useSpinReward } from './hooks/useSpinReward';
import { MenuItem, SpiceLevel, Topping, BundleItem } from './types';
import { MENU_ITEMS } from './data/menu';
import { PublicDataProvider, usePublicData } from './context/PublicDataContext';
import { CustomerAuthProvider, useCustomerAuth } from './context/CustomerAuthContext';
import { CustomerAuthModal } from './components/auth/CustomerAuthModal';

// Public Page Components
import { Navbar } from './components/layout/Navbar';
import { HeroBanner } from './components/home/HeroBanner';
import { MenuCatalog } from './components/home/MenuCatalog';
import { WhyChooseUsSection } from './components/home/WhyChooseUsSection';
import { InstagramSection } from './components/home/InstagramSection';
import { PromoSection } from './components/home/PromoSection';
import { VinasSection } from './components/home/VinasSection';
import { LocationSection } from './components/home/LocationSection';
import { BundlesSection } from './components/home/BundlesSection';
import { Testimonials } from './components/home/Testimonials';
import { Footer } from './components/layout/Footer';
import { FloatingWhatsApp } from './components/layout/FloatingWhatsApp';
import { FloatingRewardButton } from './components/reward/FloatingRewardButton';
import { BottomCartBar } from './components/order/BottomCartBar';
import { RefreshCwIcon } from './components/ui/Icons';
import { MaintenanceScreen } from './components/maintenance/MaintenanceScreen';
import { MaintenanceBanner } from './components/maintenance/MaintenanceBanner';
import { PromotionalPopup } from './components/promo/PromotionalPopup';
import { apiGetPublicPromoPopup } from './services/api';
import { PromotionalPopupData } from './types';

// Lazy-loaded on-demand modals to keep initial bundle tiny and fast
const CustomOrderModal = lazy(() => import('./components/order/CustomOrderModal'));
const CartDrawer = lazy(() => import('./components/order/CartDrawer'));
const CheckoutModal = lazy(() => import('./components/order/CheckoutModal'));
const RatingModal = lazy(() => import('./components/order/RatingModal'));
const SpinWheelModal = lazy(() => import('./components/reward/SpinWheelModal'));

// Lazy-loaded Admin CMS Dashboard
const AdminDashboard = lazy(() =>
  import('./components/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);

export interface MaintenanceStatus {
  isEnabled: boolean;
  mode: 'full' | 'read_only';
  title: string;
  message: string;
  updatedAt: string;
}

interface PublicSiteProps {
  maintenanceStatus?: MaintenanceStatus | null;
}


const DEFAULT_PROMO_POPUP: PromotionalPopupData = {
  id: "main_popup",
  title: "MIE JEBEW",
  headline: "PEDASNYA BIKIN NAGIH!",
  subtitle: "Laper? Gas Mie Jebew Original! 🍜",
  description: "Mie kenyal pedas khas Jebew dengan bumbu rahasia gurih pedas nampol. Klik banner untuk pesan langsung!",
  cta_text: "PESAN MIE JEBEW ORIGINAL 🚀",
  cta_link: "#menu-item-mie-1",
  secondary_text: "Tutup",
  image_url: "/rasa-mie/Original.jpeg",
  badge_text: "PROMO SPESIAL 🔥",
  is_active: true,
  target_page: "all",
  delay_seconds: 0.3,
  frequency: "always",
  status: "published",
  updated_at: new Date().toISOString(),
};

function PublicSite({ maintenanceStatus }: PublicSiteProps) {
  const { customer, isAuthModalOpen } = useCustomerAuth();
  const isMaintenanceReadOnly = Boolean(
    maintenanceStatus?.isEnabled && maintenanceStatus?.mode === 'read_only'
  );

  const {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalItems,
    totalAmount,
  } = useCart();

  const {
    getRatingSummary,
    getReviewsForItem,
    submitRating,
  } = useFoodRatings();

  const {
    bundles,
    whyChooseUs,
    vinas,
  } = usePublicData();

  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [ratingItem, setRatingItem] = useState<MenuItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Spin Wheel & Coin Reward State
  const {
    coins,
    canSpinToday,
    lastSpinDate,
    vouchers,
    coinHistory,
    appliedVoucher,
    executeServerSpinAction,
    redeemVoucherAction,
    applyVoucher,
    markVoucherAsUsed,
  } = useSpinReward();

  const [isSpinModalOpen, setIsSpinModalOpen] = useState(false);
  const [spinInitialTab, setSpinInitialTab] = useState<'spin' | 'redeem'>('spin');

  // Promotional Popup State (Neo-Brutalism Campaign)
  const [promoPopup, setPromoPopup] = useState<PromotionalPopupData | null>(DEFAULT_PROMO_POPUP);

  // Realtime Data Sync via BroadcastChannel (Auto update popup banner & menu)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.BroadcastChannel) return;
    const channel = new BroadcastChannel('mie_jebew_data_sync');
    channel.onmessage = () => {
      if (isMaintenanceReadOnly) return;
      apiGetPublicPromoPopup()
        .then((res) => {
          if (res?.active && res.popup) {
            setPromoPopup(res.popup);
          } else {
            setPromoPopup(null);
          }
        })
        .catch(() => {});
    };
    return () => {
      channel.close();
    };
  }, [isMaintenanceReadOnly]);

  useEffect(() => {
    if (isMaintenanceReadOnly) return;
    apiGetPublicPromoPopup()
      .then((res) => {
        if (res?.active && res.popup) {
          setPromoPopup(res.popup);
        } else {
          setPromoPopup(null);
        }
      })
      .catch(() => {});
  }, [isMaintenanceReadOnly]);

  // Trigger otomatis 1 kali saat user masuk ke web jika belum spin hari ini
  useEffect(() => {
    try {
      if (isMaintenanceReadOnly) return;
      const hasShown = sessionStorage.getItem('jebew_spin_popup_shown');
      if (!hasShown && canSpinToday) {
        sessionStorage.setItem('jebew_spin_popup_shown', 'true');
        const timer = setTimeout(() => {
          setIsSpinModalOpen(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, [canSpinToday, isMaintenanceReadOnly]);

  const handleOpenSpinWheel = useCallback((tab: 'spin' | 'redeem' = 'spin') => {
    setSpinInitialTab(tab);
    setIsSpinModalOpen(true);
  }, []);

  const handleCloseSpinModal = useCallback(() => {
    setIsSpinModalOpen(false);
  }, []);

  const handleScrollToMenu = useCallback(() => {
    const menuEl = document.getElementById('menu');
    if (menuEl) {
      menuEl.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handleSelectOriginal = useCallback(() => {
    const target = document.getElementById("menu-item-mie-1") || document.getElementById("menu");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.add("ring-4", "ring-jebew-red", "transition-all");
      setTimeout(() => {
        target.classList.remove("ring-4", "ring-jebew-red");
      }, 2500);
    }
    const originalItem = MENU_ITEMS.find((m: MenuItem) => m.id === "mie-1");
    if (originalItem) {
      setSelectedMenuItem(originalItem);
    }
  }, []);

  const handleOpenCustomizer = useCallback((item: MenuItem) => {
    setSelectedMenuItem(item);
  }, []);

  const handleOpenRatingModal = useCallback((item: MenuItem) => {
    setRatingItem(item);
  }, []);

  const handleAddToCart = useCallback((
    item: MenuItem,
    quantity: number,
    spiceLevel: SpiceLevel,
    toppings: Topping[],
    notes: string
  ) => {
    addToCart(item, quantity, spiceLevel, toppings, notes);
  }, [addToCart]);

  

  const handleOrderBundle = useCallback((bundle: BundleItem) => {
    const bundleItem: MenuItem = {
      id: `bundle-${bundle.id}`,
      name: bundle.name,
      description: bundle.description,
      price: bundle.price,
      originalPrice: bundle.original_price,
      image: bundle.image || '/rasa-mie/Manis.jpeg',
      category: 'paket',
      badge: bundle.savings_badge,
      isSpicySelectable: true,
    };
    setSelectedMenuItem(bundleItem);
  }, []);

  const handleProceedToCheckout = useCallback(() => {
    if (isMaintenanceReadOnly) {
      alert(
        'Mode Read-Only Sedang Aktif: Maaf, transaksi checkout dan pemesanan sedang dinonaktifkan sementara untuk pemeliharaan sistem.'
      );
      return;
    }
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  }, [isMaintenanceReadOnly]);

  const handleOrderCompleted = useCallback(() => {
    clearCart();
    setIsCheckoutOpen(false);
  }, [clearCart]);

  const handleCloseCustomizer = useCallback(() => {
    setSelectedMenuItem(null);
  }, []);

  const handleCloseCart = useCallback(() => {
    setIsCartOpen(false);
  }, []);

  const handleOpenCart = useCallback(() => {
    setIsCartOpen(true);
  }, []);

  // Handler untuk aksi & pengalihan Promotional Popup Banner
  const handlePromoAction = useCallback((ctaLink: string) => {
    if (!ctaLink) {
      handleSelectOriginal();
      return;
    }

    const cleanLink = ctaLink.trim();

    // 1. Order Original
    if (cleanLink === '#order-original' || cleanLink === 'original' || cleanLink === '#original') {
      handleSelectOriginal();
      return;
    }

    // 2. Specific Menu Item (item:mie-2 or menu-item:mie-2)
    if (cleanLink.startsWith('item:') || cleanLink.startsWith('menu-item:')) {
      const targetId = cleanLink.replace(/^(item:|menu-item:)/, '');
      const foundItem = MENU_ITEMS.find((m: MenuItem) => m.id === targetId);
      if (foundItem) {
        handleOpenCustomizer(foundItem);
      } else {
        handleSelectOriginal();
      }
      return;
    }

    // 3. Spin Wheel
    if (cleanLink === '#spin' || cleanLink === '#rewards' || cleanLink === 'spin' || cleanLink === 'rewards') {
      handleOpenSpinWheel('spin');
      return;
    }

    // 4. Cart Drawer
    if (cleanLink === '#cart' || cleanLink === 'cart') {
      handleOpenCart();
      return;
    }

    // 5. WhatsApp
    if (cleanLink.startsWith('whatsapp') || cleanLink.startsWith('https://wa.me')) {
      const url = cleanLink.startsWith('http')
        ? cleanLink
        : 'https://wa.me/6285122014584?text=' + encodeURIComponent('Halo Mie Jebew, saya ingin pesan promo: ' + (promoPopup?.headline || 'Promo Spesial') + '!');
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    // 6. External URL
    if (cleanLink.startsWith('http://') || cleanLink.startsWith('https://')) {
      window.open(cleanLink, '_blank', 'noopener,noreferrer');
      return;
    }

    // 7. Section Hash Anchor (#menu, #custom-order, #reviews, #hero, etc.)
    if (cleanLink.startsWith('#')) {
      const el = document.querySelector(cleanLink);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    // Fallback
    handleSelectOriginal();
  }, [handleSelectOriginal, handleOpenCustomizer, handleOpenSpinWheel, handleOpenCart, promoPopup]);

  const handleCloseCheckout = useCallback(() => {
    setIsCheckoutOpen(false);
  }, []);

  const handleCloseRating = useCallback(() => {
    setRatingItem(null);
  }, []);

  // Filter active public items
  const activeBundles = (bundles || []).filter((b) => Boolean(b.is_active));
  const activeWhyUs = (whyChooseUs || []).filter((w) => Boolean(w.is_active));

  return (
    <div className="min-h-screen flex flex-col bg-cream text-black font-sans selection:bg-jebew-yellow selection:text-black">
      {/* Read-Only Maintenance Warning Banner */}
      {isMaintenanceReadOnly && (
        <MaintenanceBanner message={maintenanceStatus?.message} />
      )}

      {/* Navbar with Sticky Positioning & Coin Reward Counter */}
      <Navbar
        totalCartItems={totalItems}
        onOpenCart={handleOpenCart}
        onScrollToMenu={handleScrollToMenu}
        coins={coins}
        canSpinToday={canSpinToday}
        onOpenSpinWheel={() => handleOpenSpinWheel('spin')}
      />

      {/* Main Content: 11 Structured Sections */}
      <main className="flex-1">
        {/* 1. Home / Hero Banner */}
        <HeroBanner
          onOrderNow={handleScrollToMenu}
          onExploreMenu={handleScrollToMenu}
        />

        

        {/* 3. Our Menu Catalog & Interactive Ratings */}
        <MenuCatalog
          onSelectItem={handleOpenCustomizer}
          getRatingSummary={getRatingSummary}
          onOpenRating={handleOpenRatingModal}
        />

        {/* 4. Why Choose Us / Keunggulan Kami */}
        {activeWhyUs.length > 0 && (
          <WhyChooseUsSection items={activeWhyUs} />
        )}

        {/* 5. Tim Crave Corner & Teaser (Diposisikan di atas agar terlihat utuh) */}
        <InstagramSection />

        

        {/* 7. Promo Bundles & Penawaran Spesial */}
        <PromoSection onSelectPromo={handleOpenCustomizer} />

        {/* 8. Vina's Story & Signature */}
        {vinas && Boolean(vinas.is_active) && (
          <VinasSection
            vinas={vinas}
            onExploreRecipe={handleScrollToMenu}
          />
        )}

        {/* 9. Contact Us / Lokasi & Jam Buka */}
        <LocationSection />

        {/* 10. Bundles & Paket Komplit */}
        {activeBundles.length > 0 && (
          <BundlesSection
            bundles={activeBundles}
            onOrderBundle={handleOrderBundle}
          />
        )}

        {/* Customer Testimonials */}
        <Testimonials />
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile Sticky Bottom Cart Bar */}
      <BottomCartBar
        totalItems={totalItems}
        totalAmount={totalAmount}
        onOpenCart={handleOpenCart}
      />

      {/* Floating WhatsApp Quick Chat Button */}
      <FloatingWhatsApp hasCartItems={totalItems > 0} />

      {/* Floating Lucky Spin & Reward Widget Button */}
      <FloatingRewardButton
        coins={coins}
        canSpinToday={canSpinToday}
        onOpen={() => handleOpenSpinWheel('spin')}
        hasCartItems={totalItems > 0}
      />

      {/* Lazy Loaded On-Demand Modals (Custom Your Order included) */}
      <Suspense fallback={null}>
        {selectedMenuItem && (
          <CustomOrderModal
            item={selectedMenuItem}
            onClose={handleCloseCustomizer}
            onAddToCart={handleAddToCart}
          />
        )}

        {isCartOpen && (
          <CartDrawer
            isOpen={isCartOpen}
            onClose={handleCloseCart}
            cart={cart}
            totalAmount={totalAmount}
            totalItems={totalItems}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromCart}
            onProceedToCheckout={handleProceedToCheckout}
            isReadOnly={isMaintenanceReadOnly}
          />
        )}

        {isCheckoutOpen && (
          <CheckoutModal
            isOpen={isCheckoutOpen}
            onClose={handleCloseCheckout}
            cart={cart}
            totalAmount={totalAmount}
            onOrderCompleted={() => {
              if (appliedVoucher) {
                markVoucherAsUsed(appliedVoucher.id);
              }
              handleOrderCompleted();
            }}
            appliedVoucher={appliedVoucher}
            onApplyVoucher={applyVoucher}
            availableVouchers={vouchers}
          />
        )}

        {ratingItem && (
          <RatingModal
            isOpen={ratingItem !== null}
            item={ratingItem}
            summary={getRatingSummary(ratingItem.id)}
            reviews={getReviewsForItem(ratingItem.id)}
            onClose={handleCloseRating}
            onSubmitRating={submitRating}
          />
        )}

        {isSpinModalOpen && (
          <SpinWheelModal
            isOpen={isSpinModalOpen}
            onClose={handleCloseSpinModal}
            coins={coins}
            canSpinToday={canSpinToday}
            lastSpinDate={lastSpinDate}
            vouchers={vouchers}
            appliedVoucher={appliedVoucher}
            coinHistory={coinHistory}
            onExecuteSpin={executeServerSpinAction}
            onRedeemVoucher={redeemVoucherAction}
            onApplyVoucher={applyVoucher}
            initialTab={spinInitialTab}
          />
        )}

        {/* Customer Auth Modal (Login / Register via WhatsApp) */}
        <CustomerAuthModal />

        {/* Neo-Brutalism Promotional Popup: Hanya muncul SETELAH user berhasil login */}
        {customer && !isAuthModalOpen && (
          <PromotionalPopup
            popup={promoPopup}
            onOrderNow={handleSelectOriginal}
            onSelectOriginal={handleSelectOriginal}
            onActionClick={handlePromoAction}
            currentPage="home"
          />
        )}
      </Suspense>
    </div>
  );
}

export function App() {
  const { isAdminRoute } = useRouter();
  const [maintenanceStatus, setMaintenanceStatus] = useState<MaintenanceStatus | null>(null);

  const checkMaintenance = useCallback(async () => {
    try {
      const res = await fetch('/api/public/maintenance-status');
      if (res.ok) {
        const data = await res.json();
        setMaintenanceStatus(data);
      }
    } catch {
      // silent fallback
    }
  }, []);

  useEffect(() => {
    checkMaintenance();
    const interval = setInterval(checkMaintenance, 15000);
    return () => clearInterval(interval);
  }, [checkMaintenance]);

  // Admin Dashboard Route SELALU diizinkan (admin tidak terkunci di luar sistem)
  if (isAdminRoute) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
            <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0_0_#000] text-center max-w-sm w-full space-y-3">
              <RefreshCwIcon className="w-8 h-8 animate-spin mx-auto text-brand-red" />
              <h3 className="font-black text-base uppercase">Memuat Panel Admin...</h3>
            </div>
          </div>
        }
      >
        <AdminDashboard />
      </Suspense>
    );
  }

  // Jika Full Maintenance Mode Aktif untuk pengguna publik:
  if (maintenanceStatus?.isEnabled && maintenanceStatus.mode === 'full') {
    return (
      <MaintenanceScreen
        title={maintenanceStatus.title}
        message={maintenanceStatus.message}
        updatedAt={maintenanceStatus.updatedAt}
      />
    );
  }

  return (
    <PublicDataProvider>
      <CustomerAuthProvider>
        <PublicSite maintenanceStatus={maintenanceStatus} />
      </CustomerAuthProvider>
    </PublicDataProvider>
  );
}

export default App;
