export type SpiceLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface SpiceOption {
  level: SpiceLevel;
  name: string;
  badge: string;
  description: string;
  price_adjustment?: number;
}

export interface Topping {
  id: string;
  name: string;
  price: number;
  popular?: boolean;
}

export type MenuCategory = 'all' | 'mie' | 'paket' | 'topping' | 'minuman' | string;

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  sort_order: number;
  is_active: number | boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  category_id?: string;
  price: number;
  sale_price?: number | null;
  originalPrice?: number;
  description: string;
  image: string;
  badge?: string;
  isSpicySelectable?: boolean;
  is_spicy_selectable?: number | boolean;
  availableToppings?: string[];
  isPopular?: boolean;
  is_popular?: number | boolean;
  isBestSeller?: boolean;
  is_best_seller?: number | boolean;
  is_active?: number | boolean;
  sort_order?: number;
  ingredients?: string;
}

export interface ProductBottle {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  sale_price?: number;
  volume_ml: number;
  description: string;
  heat_level: number;
  image: string;
  badge?: string;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
  is_active: number | boolean;
  sort_order: number;
}

export interface CartItemTopping {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  cartItemId: string; // unique per configuration
  menuItem: MenuItem;
  quantity: number;
  spiceLevel: SpiceLevel;
  selectedToppings: CartItemTopping[];
  notes: string;
  itemTotal: number;
}

export type OrderType = 'delivery' | 'takeaway' | 'dine_in';
export type PaymentMethod = 'qris' | 'cash';

export interface CustomerOrderData {
  customerName: string;
  customerPhone: string;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  address: string;
  tableNumber?: string;
  additionalNotes: string;
}

export interface PromoBundle {
  id: string;
  title: string;
  tagline: string;
  originalPrice: number;
  promoPrice: number;
  savings: number;
  items: string[];
  image: string;
  badge: string;
  isActive: boolean;
}

export interface BundleItem {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price: number;
  savings_badge?: string;
  items_included: string[];
  image: string;
  is_active: number | boolean;
  sort_order: number;
}

export interface PromotionItem {
  id: string;
  title: string;
  promo_code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
  start_date: string;
  end_date: string;
  usage_limit?: number;
  used_count?: number;
  image?: string;
  is_active: number | boolean;
  sort_order: number;
}

export interface WhyChooseUsItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  sort_order: number;
  is_active: number | boolean;
}

export interface BehindKitchenItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  tag?: string;
  sort_order: number;
  is_active: number | boolean;
}

export interface VinasSectionData {
  id: string;
  title: string;
  subtitle: string;
  quote: string;
  description: string;
  image_url: string;
  cta_text: string;
  cta_link: string;
  badge: string;
  is_active: number | boolean;
}

export interface SocialLinkItem {
  id: string;
  platform: string;
  handle: string;
  url: string;
  icon: string;
  is_active: number | boolean;
  sort_order: number;
}

export interface ContactInfoData {
  id: string;
  phone: string;
  whatsapp_number: string;
  whatsapp_display: string;
  email?: string;
  address_note: string;
  address_description: string;
  opening_hours: string;
  google_maps_url?: string;
}

export interface HomepageContentData {
  id: string;
  store_name: string;
  hero_headline: string;
  hero_subheadline: string;
  hero_description: string;
  hero_badge: string;
  cta_order_text: string;
  cta_menu_text: string;
  announcement_banner?: string;
  is_announcement_active: number | boolean;
  video_banner_url?: string;
  video_poster_url?: string;
  qris_merchant_name?: string;
  qris_nmid?: string;
  qris_image_url?: string;
}

export interface MediaItem {
  id: string;
  file_name: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  url: string;
  created_at: string;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR';
  name: string;
  phone?: string;
  is_active: number | boolean;
}

export interface ActivityLogItem {
  id: number;
  admin_username: string;
  action: string;
  entity: string;
  entity_id?: string;
  details: string;
  timestamp: string;
}

export interface CustomOptionItem {
  id: string;
  group_type: 'spice_level' | 'topping' | 'size' | 'addon';
  name: string;
  level_number?: number | null;
  badge?: string;
  description?: string;
  price_adjustment: number;
  is_popular: number | boolean;
  is_active: number | boolean;
  sort_order: number;
}

export interface BootstrapData {
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
  timestamp: string;
}

export interface StoreReview {
  id: string;
  author?: string;
  name?: string;
  rating: number;
  role?: string;
  comment?: string;
  review?: string;
  avatarBg?: string;
  avatar?: string;
  favoriteItem?: string;
  date?: string;
}

export interface InstagramPost {
  id: string;
  caption: string;
  likes?: number;
  comments?: number;
  imageUrl: string;
  images?: string[];
  postUrl?: string;
  url?: string;
}

export interface ItemRatingSummary {
  average: number;
  count: number;
  userRating?: number;
}

export interface ItemReview {
  id: string;
  itemId: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export type RewardType = 'discount_5000' | 'discount_5500' | 'free_mie_original';

export interface UserVoucher {
  id: string;
  code: string;
  title: string;
  type: RewardType;
  discountAmount: number;
  costInCoins: number;
  createdAt: string;
  isUsed: boolean;
}

export interface SpinSegment {
  id: number;
  coins: number;
  label: string;
  weight: number;
  color: string;
  textColor: string;
  isJackpot?: boolean;
}
