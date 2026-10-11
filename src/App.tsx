import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useCart } from './hooks/useCart';
import { useFoodRatings } from './hooks/useFoodRatings';
import { useRouter } from './hooks/useRouter';
import { useSpinReward } from './hooks/useSpinReward';
import { MenuItem, SpiceLevel, Topping, ProductBottle, BundleItem } from './types';
import { PublicDataProvider, usePublicData } from './context/PublicDataContext';
import { CustomerAuthProvider } from './context/CustomerAuthContext';
import { CustomerAuthModal } from './components/auth/CustomerAuthModal';

// Public Page Components
import { Navbar } from './components/layout/Navbar';
import { HeroBanner } from './components/home/HeroBanner';
import { BottlesSection } from './components/home/BottlesSection';
import { MenuCatalog } from './components/home/MenuCatalog';
import { WhyChooseUsSection } from './components/home/WhyChooseUsSection';
import { BehindKitchenSection } from './components/home/BehindKitchenSection';
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

function PublicSite({ maintenanceStatus }: PublicSiteProps) {
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
    bottles,
    bundles,
    whyChooseUs,
    behindKitchen,
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

  const handleOrderBottle = useCallback((bottle: ProductBottle) => {
    const bottleItem: MenuItem = {
      id: `bottle-${bottle.id}`,
      name: bottle.name,
      description: bottle.description,
      price: bottle.sale_price || bottle.price,
      originalPrice: bottle.sale_price ? bottle.price : undefined,
      image: bottle.image || '/rasa-mie/Original.jpeg',
      category: 'topping',
      badge: bottle.badge,
      isSpicySelectable: false,
    };
    addToCart(bottleItem, 1, 0, [], 'Pesanan Sambal Botol');
    setIsCartOpen(true);
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

  const handleCloseCheckout = useCallback(() => {
    setIsCheckoutOpen(false);
  }, []);

  const handleCloseRating = useCallback(() => {
    setRatingItem(null);
  }, []);

  // Filter active public items
  const activeBottles = (bottles || []).filter((b) => Boolean(b.is_active));
  const activeBundles = (bundles || []).filter((b) => Boolean(b.is_active));
  const activeWhyUs = (whyChooseUs || []).filter((w) => Boolean(w.is_active));
  const activeKitchen = (behindKitchen || []).filter((k) => Boolean(k.is_active));

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

        {/* 2. Bottles / Chili Oil & Sambal Kemasan */}
        {activeBottles.length > 0 && (
          <BottlesSection
            bottles={activeBottles}
            onOrderBottle={handleOrderBottle}
          />
        )}

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

        {/* 5. Behind the Kitchen / Proses Dapur */}
        {activeKitchen.length > 0 && (
          <BehindKitchenSection items={activeKitchen} />
        )}

        {/* 6. Our Social Media Showcase */}
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
