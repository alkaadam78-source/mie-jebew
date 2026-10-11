import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  MenuItem,
  Category,
  ProductBottle,
  PromotionItem,
  WhyChooseUsItem,
  BehindKitchenItem,
  VinasSectionData,
  SocialLinkItem,
  ContactInfoData,
  HomepageContentData,
  BundleItem,
  CustomOptionItem,
} from '../types';
import { fetchPublicBootstrap } from '../services/api';
import { STORE_CONFIG } from '../config/store';
import { MENU_ITEMS } from '../data/menu';

interface PublicDataContextType {
  loading: boolean;
  error: string | null;
  homepage: HomepageContentData;
  categories: Category[];
  menu: MenuItem[];
  bottles: ProductBottle[];
  customOptions: CustomOptionItem[];
  bundles: BundleItem[];
  promotions: PromotionItem[];
  whyChooseUs: WhyChooseUsItem[];
  behindKitchen: BehindKitchenItem[];
  vinas: VinasSectionData;
  socialLinks: SocialLinkItem[];
  contact: ContactInfoData;
  refreshData: () => Promise<void>;
}

// Resilient default fallback data so the site never crashes even if backend is offline
const DEFAULT_HOMEPAGE: HomepageContentData = {
  id: 'hero_content',
  store_name: STORE_CONFIG.name,
  hero_headline: 'MIE JEBEW',
  hero_subheadline: 'SERBA 10 RIBU! 🌶️',
  hero_description: 'Sensasi mie kenyal bertabur ayam cincang gurih dengan siraman chili oil pedas nampol level 0 sampai 5! Semua serba Rp 10.000, tanpa ribet login, pesan langsung lewat WhatsApp!',
  hero_badge: '🔥 SERBA 10 RIBU — 100% CABAI ASLI',
  cta_order_text: '🔥 PESAN SEKARANG',
  cta_menu_text: 'LIHAT MENU SERBA 10K',
  announcement_banner: '🎉 PROMO SERBA 10 RIBU! Nikmati Mie Jebew pedas gurih porsi kenyang cuma Rp 10.000!',
  is_announcement_active: 1,
  video_banner_url: STORE_CONFIG.assets.videoBanner,
  video_poster_url: STORE_CONFIG.assets.videoPoster,
  qris_merchant_name: STORE_CONFIG.assets.qrisMerchantName,
  qris_nmid: STORE_CONFIG.assets.qrisNmid,
  qris_image_url: STORE_CONFIG.assets.qris,
};

const DEFAULT_CONTACT: ContactInfoData = {
  id: 'main_contact',
  phone: STORE_CONFIG.whatsappDisplay,
  whatsapp_number: STORE_CONFIG.whatsappNumber,
  whatsapp_display: STORE_CONFIG.whatsappDisplay,
  email: 'kontak@miejebew.com',
  address_note: STORE_CONFIG.address.note,
  address_description: STORE_CONFIG.address.description,
  opening_hours: STORE_CONFIG.openingHours.displayHours,
  google_maps_url: 'https://maps.google.com',
};

const DEFAULT_VINAS: VinasSectionData = {
  id: 'vinas_main',
  title: "Gily's Signature Recipe",
  subtitle: 'Kisah Rasa di Balik Kelezatan Pedas Mie Jebew',
  quote: 'Pedas itu bukan sekadar membakar lidah, tetapi sebuah harmoni antara gurihnya rempah nusantara dan kehangatan rasa yang membekas di hati.',
  description: 'Resep Mie Jebew lahir dari eksperimen dapur oleh Gily bersama Tim Crave Corner, memadukan tradisi mie nusantara dengan sambal chili oil aromatik yang kaya rasa. Setiap bumbu diracik secara personal untuk memastikan kenikmatan rasa yang otentik dan tak terlupakan.',
  image_url: '/team-cravecorner.jpg',
  cta_text: 'Cicipi Resep Gily',
  cta_link: 'https://www.instagram.com/reel/Dd5dITdSxT-/?utm_source=ig_web_copy_link&cplk=MzRlODBiNWFlZA==&srtk=MzRlODBiNWFlZA==',
  badge: "Founder's Signature",
  is_active: 1,
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'all', name: 'Semua Menu', slug: 'all', icon: '✨', sort_order: 1, is_active: 1 },
  { id: 'mie', name: 'Mie Jebew (10K)', slug: 'mie', icon: '🍜', sort_order: 2, is_active: 1 },
  { id: 'paket', name: 'Paket Hemat (10K)', slug: 'paket', icon: '🔥', sort_order: 3, is_active: 1 },
  { id: 'topping', name: 'Topping & Side', slug: 'topping', icon: '🥚', sort_order: 4, is_active: 1 },
  { id: 'minuman', name: 'Minuman Segar', slug: 'minuman', icon: '🥤', sort_order: 5, is_active: 1 },
];

const DEFAULT_BOTTLES: ProductBottle[] = [
  {
    id: 'bot-1',
    name: 'Chili Oil Jebew Mini Jar (100ml)',
    subtitle: 'Bumbu Minyak Cabai Pedas Gurih Siap Saji',
    price: 10000,
    volume_ml: 100,
    description: 'Chili oil racikan rahasia khas Mie Jebew dengan cabai rawit merah segar, bawang putih goreng, dan rempah aromatik pilihan.',
    heat_level: 4,
    image: '/rasa-mie/Original.jpeg',
    badge: '🔥 SERBA 10K',
    stock_status: 'in_stock',
    is_active: 1,
    sort_order: 1,
  },
  {
    id: 'bot-2',
    name: 'Sambal Jebew Extra Hot Cup (100ml)',
    subtitle: 'Pedas Nampol Menggelegar untuk Segala Makanan',
    price: 10000,
    volume_ml: 100,
    description: 'Sambal ulek khas jebew dengan tingkat kepedasan maksimal. Cocok untuk cocolan gorengan, nasi hangat, dan mie instan!',
    heat_level: 5,
    image: '/rasa-mie/Original.jpeg',
    badge: '☠️ SERBA 10K',
    stock_status: 'in_stock',
    is_active: 1,
    sort_order: 2,
  },
  {
    id: 'bot-3',
    name: 'Bumbu Mie Jebew Sachet Praktis',
    subtitle: 'Bikin Mie Jebew Sendiri di Rumah',
    price: 8000,
    volume_ml: 80,
    description: 'Paket bumbu sachet komplit khas jebew, cukup aduk dengan mie rebus favoritmu dan rasakan sensasi jebew asli!',
    heat_level: 3,
    image: '/rasa-mie/Original.jpeg',
    badge: '✨ HEMAT 8K',
    stock_status: 'in_stock',
    is_active: 1,
    sort_order: 3,
  },
];

const DEFAULT_BUNDLES: BundleItem[] = [
  {
    id: 'bun-1',
    name: 'Paket Combo Serba 10K',
    description: '1x Mie Jebew Original (Level 0-5) + 1x Es Teh Manis Jumbo + 1x Pangsit Kriuk.',
    price: 10000,
    original_price: 14000,
    savings_badge: 'HEMAT 4K',
    items_included: [
      '1x Mie Jebew Original (Level Bebas)',
      '1x Es Teh Manis Jumbo',
      '1x Pangsit Goreng Kriuk',
    ],
    image: '/rasa-mie/Original.jpeg',
    is_active: 1,
    sort_order: 1,
  },
  {
    id: 'bun-2',
    name: 'Paket Puas Dobel Topping 10K',
    description: '1x Mie Jebew Pedas Gurih + Pangsit Renyah + Bakso Sapi.',
    price: 10000,
    original_price: 13000,
    savings_badge: 'SERBA 10K',
    items_included: [
      '1x Mie Jebew Pedas Gurih',
      '1x Pangsit Renyah',
      '1x Bakso Sapi Kenyal',
    ],
    image: '/rasa-mie/Original.jpeg',
    is_active: 1,
    sort_order: 2,
  },
];

const DEFAULT_WHY_US: WhyChooseUsItem[] = [
  { id: 'w-1', title: '100% Cabai Asli Pilihan', description: 'Cabai rawit merah segar tanpa bubuk buatan atau bahan pengawet.', icon: '🌶️', sort_order: 1, is_active: 1 },
  { id: 'w-2', title: 'Bumbu Chili Oil Racikan Rahasia', description: 'Dimasak perlahan selama 4 jam dengan rempah aromatik istimewa.', icon: '🔥', sort_order: 2, is_active: 1 },
  { id: 'w-3', title: 'Higienis & Selalu Fresh', description: 'Direbus dan diracik dadakan saat dipesan sehingga selalu hangat.', icon: '✨', sort_order: 3, is_active: 1 },
  { id: 'w-4', title: 'Pesan Kilat Tanpa Antre', description: 'Pesan langsung ke WhatsApp tanpa harus ribet install aplikasi.', icon: '⚡', sort_order: 4, is_active: 1 },
];

const DEFAULT_BEHIND_KITCHEN: BehindKitchenItem[] = [
  { id: 'k-1', title: 'Perebusan & Racikan Cabai Segar', description: 'Perebusan dengan suhu presisi agar menghasilkan tekstur kenyal sempurna.', image_url: '/team-cravecorner.jpg', tag: 'Dapur Jebew', sort_order: 1, is_active: 1 },
  { id: 'k-2', title: 'Topping Ayam Melimpah', description: 'Daging ayam gurih lezat dan pangsit renyah disajikan royal.', image_url: '/team-slide-faces.jpg', tag: 'Bahan Premium', sort_order: 2, is_active: 1 },
  { id: 'k-3', title: 'Semangat Tim Crave Corner', description: 'Dedikasi penuh menghadirkan kuliner pedas terbaik untuk para penikmat.', image_url: '/team-slide-dome.jpg', tag: 'Tim Kuliner', sort_order: 3, is_active: 1 },
];

const DEFAULT_SOCIALS: SocialLinkItem[] = [
  { id: 'soc-1', platform: 'Instagram', handle: '@cravecorner0', url: STORE_CONFIG.instagramUrl, icon: 'InstagramIcon', is_active: 1, sort_order: 1 },
  { id: 'soc-2', platform: 'WhatsApp', handle: STORE_CONFIG.whatsappDisplay, url: `https://wa.me/${STORE_CONFIG.whatsappNumber}`, icon: 'Phone', is_active: 1, sort_order: 2 },
  { id: 'soc-3', platform: 'TikTok', handle: '@miejebew_official', url: 'https://tiktok.com/@miejebew_official', icon: 'Sparkles', is_active: 1, sort_order: 3 },
];

const PublicDataContext = createContext<PublicDataContextType | null>(null);

export const PublicDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [homepage, setHomepage] = useState<HomepageContentData>(DEFAULT_HOMEPAGE);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [menu, setMenu] = useState<MenuItem[]>(MENU_ITEMS);
  const [bottles, setBottles] = useState<ProductBottle[]>(DEFAULT_BOTTLES);
  const [customOptions, setCustomOptions] = useState<CustomOptionItem[]>([]);
  const [bundles, setBundles] = useState<BundleItem[]>(DEFAULT_BUNDLES);
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [whyChooseUs, setWhyChooseUs] = useState<WhyChooseUsItem[]>(DEFAULT_WHY_US);
  const [behindKitchen, setBehindKitchen] = useState<BehindKitchenItem[]>(DEFAULT_BEHIND_KITCHEN);
  const [vinas, setVinas] = useState<VinasSectionData>(DEFAULT_VINAS);
  const [socialLinks, setSocialLinks] = useState<SocialLinkItem[]>(DEFAULT_SOCIALS);
  const [contact, setContact] = useState<ContactInfoData>(DEFAULT_CONTACT);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPublicBootstrap();

      if (data.homepage) setHomepage(data.homepage);
      if (data.categories?.length) setCategories(data.categories);
      if (data.menu?.length) setMenu(data.menu);
      if (data.bottles?.length) setBottles(data.bottles);
      if (data.customOptions?.length) setCustomOptions(data.customOptions);
      if (data.bundles?.length) setBundles(data.bundles);
      if (data.promotions) setPromotions(data.promotions);
      if (data.whyChooseUs?.length) setWhyChooseUs(data.whyChooseUs);
      if (data.behindKitchen?.length) setBehindKitchen(data.behindKitchen);
      if (data.vinas) setVinas(data.vinas);
      if (data.socialLinks?.length) setSocialLinks(data.socialLinks);
      if (data.contact) setContact(data.contact);
    } catch (err: any) {
      console.warn('Could not fetch latest data from API server, falling back to local cached data:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Revalidate data periodically (every 30 seconds) or when window regains focus
    const interval = setInterval(loadData, 30000);
    const handleFocus = () => {
      loadData();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadData]);

  return (
    <PublicDataContext.Provider
      value={{
        loading,
        error,
        homepage,
        categories,
        menu,
        bottles,
        customOptions,
        bundles,
        promotions,
        whyChooseUs,
        behindKitchen,
        vinas,
        socialLinks,
        contact,
        refreshData: loadData,
      }}
    >
      {children}
    </PublicDataContext.Provider>
  );
};

export function usePublicData() {
  const ctx = useContext(PublicDataContext);
  if (!ctx) {
    throw new Error('usePublicData must be used within PublicDataProvider');
  }
  return ctx;
}
