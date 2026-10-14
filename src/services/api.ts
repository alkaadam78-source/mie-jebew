
// Real-time synchronization across browser tabs
export const publicDataChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('mie_jebew_data_sync') : null;

export function notifyDataChanged() {
  if (publicDataChannel) {
    try {
      publicDataChannel.postMessage({ type: 'REFRESH', timestamp: Date.now() });
    } catch {
      // ignore
    }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('public-data:refresh'));
  }
}
import {
  BootstrapData,
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
  MediaItem,
  AdminUser,
  ActivityLogItem,
  PromotionalPopupData,
  PromotionalPopupHistoryItem,
} from '../types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('mie_jebew_admin_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('mie_jebew_admin_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('mie_jebew_admin_token');
}

export const clearAuthToken = removeAuthToken;

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('API server offline (Static Mode)');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && endpoint.startsWith('/admin')) {
      removeAuthToken();
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    throw new Error(data.error || 'Terjadi kesalahan pada permintaan server.');
  }

  return data as T;
}

// ======================== PUBLIC API ========================
export async function fetchPublicBootstrap(): Promise<BootstrapData> {
  return request<BootstrapData>('/public/bootstrap');
}

export async function verifyPromoCode(code: string, subtotal: number) {
  return request<{
    valid: boolean;
    promo: {
      code: string;
      title: string;
      discountType: 'percentage' | 'fixed';
      discountValue: number;
      discountAmount: number;
    };
    finalTotal: number;
  }>('/public/verify-promo', {
    method: 'POST',
    body: JSON.stringify({ code, subtotal }),
  });
}

// ======================== AUTH API ========================
export async function apiLogin(credentials: { username: string; password: string }) {
  const data = await request<{
    message: string;
    token: string;
    user: AdminUser;
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  setAuthToken(data.token);
  return data;
}

export async function apiGetMe(): Promise<{ user: AdminUser }> {
  return request<{ user: AdminUser }>('/auth/me');
}

export async function apiGetAdminUsers(): Promise<{ users: AdminUser[] }> {
  return request<{ users: AdminUser[] }>('/auth/users');
}

export async function apiCreateAdminUser(user: Partial<AdminUser> & { password?: string }) {
  return request('/auth/users', {
    method: 'POST',
    body: JSON.stringify(user),
  });
}

export async function apiUpdateAdminUser(id: number, user: Partial<AdminUser> & { password?: string }) {
  return request(`/auth/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(user),
  });
}

export async function apiDeleteAdminUser(id: number) {
  return request(`/auth/users/${id}`, {
    method: 'DELETE',
  });
}

// ======================== MENU & CATEGORIES ========================
export async function apiGetMenuItems(params?: { search?: string; category?: string; status?: string }): Promise<{ items: MenuItem[] }> {
  const qp = new URLSearchParams();
  if (params?.search && params.search.trim()) qp.set('search', params.search.trim());
  if (params?.category && params.category !== 'all' && params.category !== 'undefined') qp.set('category', params.category);
  if (params?.status && params.status !== 'all' && params.status !== 'undefined') qp.set('status', params.status);
  const qs = qp.toString();
  return request<{ items: MenuItem[] }>(qs ? `/menu/items?${qs}` : '/menu/items');
}

export async function apiCreateMenuItem(item: Partial<MenuItem>) {
  const res = await request('/menu/items', {
    method: 'POST',
    body: JSON.stringify(item),
  });
  notifyDataChanged();
  return res;
}

export async function apiUpdateMenuItem(id: string, item: Partial<MenuItem>) {
  const res = await request(`/menu/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(item),
  });
  notifyDataChanged();
  return res;
}

export async function apiDeleteMenuItem(id: string) {
  const res = await request(`/menu/items/${id}`, {
    method: 'DELETE',
  });
  notifyDataChanged();
  return res;
}

export async function apiGetCategories(): Promise<{ categories: Category[] }> {
  return request<{ categories: Category[] }>('/menu/categories');
}

export async function apiCreateCategory(cat: Partial<Category>) {
  return request('/menu/categories', {
    method: 'POST',
    body: JSON.stringify(cat),
  });
}

export async function apiUpdateCategory(id: string, cat: Partial<Category>) {
  return request(`/menu/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(cat),
  });
}

export async function apiDeleteCategory(id: string) {
  return request(`/menu/categories/${id}`, {
    method: 'DELETE',
  });
}

// ======================== BOTTLES ========================
export async function apiGetBottles(params?: { search?: string; status?: string }): Promise<{ bottles: ProductBottle[] }> {
  const query = new URLSearchParams(params as any).toString();
  return request<{ bottles: ProductBottle[] }>(`/bottles?${query}`);
}

export async function apiCreateBottle(bottle: Partial<ProductBottle>) {
  return request('/bottles', {
    method: 'POST',
    body: JSON.stringify(bottle),
  });
}

export async function apiUpdateBottle(id: string, bottle: Partial<ProductBottle>) {
  const res = await request(`/bottles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(bottle),
  });
  notifyDataChanged();
  return res;
}

export async function apiDeleteBottle(id: string) {
  return request(`/bottles/${id}`, {
    method: 'DELETE',
  });
}

// ======================== PROMOTIONS ========================
export async function apiGetPromotions(): Promise<{ promotions: PromotionItem[] }> {
  return request<{ promotions: PromotionItem[] }>('/promotions');
}

export async function apiCreatePromotion(promo: Partial<PromotionItem>) {
  return request('/promotions', {
    method: 'POST',
    body: JSON.stringify(promo),
  });
}

export async function apiUpdatePromotion(id: string, promo: Partial<PromotionItem>) {
  return request(`/promotions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(promo),
  });
}

export async function apiDeletePromotion(id: string) {
  return request(`/promotions/${id}`, {
    method: 'DELETE',
  });
}

// ======================== WEBSITE CONTENT ========================
export async function apiGetHomepageContent(): Promise<{ content: HomepageContentData }> {
  return request<{ content: HomepageContentData }>('/content/homepage');
}

export async function apiUpdateHomepageContent(content: Partial<HomepageContentData>) {
  return request('/content/homepage', {
    method: 'PUT',
    body: JSON.stringify(content),
  });
}

export async function apiGetWhyChooseUs(): Promise<{ items: WhyChooseUsItem[] }> {
  return request<{ items: WhyChooseUsItem[] }>('/content/why-choose-us');
}

export async function apiCreateWhyChooseUs(item: Partial<WhyChooseUsItem>) {
  return request('/content/why-choose-us', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export async function apiUpdateWhyChooseUs(id: string, item: Partial<WhyChooseUsItem>) {
  return request(`/content/why-choose-us/${id}`, {
    method: 'PUT',
    body: JSON.stringify(item),
  });
}

export async function apiDeleteWhyChooseUs(id: string) {
  return request(`/content/why-choose-us/${id}`, {
    method: 'DELETE',
  });
}

export async function apiGetBehindKitchen(): Promise<{ items: BehindKitchenItem[] }> {
  return request<{ items: BehindKitchenItem[] }>('/content/behind-the-kitchen');
}

export async function apiCreateBehindKitchen(item: Partial<BehindKitchenItem>) {
  return request('/content/behind-the-kitchen', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export async function apiUpdateBehindKitchen(id: string, item: Partial<BehindKitchenItem>) {
  return request(`/content/behind-the-kitchen/${id}`, {
    method: 'PUT',
    body: JSON.stringify(item),
  });
}

export async function apiDeleteBehindKitchen(id: string) {
  return request(`/content/behind-the-kitchen/${id}`, {
    method: 'DELETE',
  });
}

export async function apiGetVinas(): Promise<{ vinas: VinasSectionData }> {
  return request<{ vinas: VinasSectionData }>('/content/vinas');
}

export async function apiUpdateVinas(vinas: Partial<VinasSectionData>) {
  return request('/content/vinas', {
    method: 'PUT',
    body: JSON.stringify(vinas),
  });
}

export async function apiGetContact(): Promise<{ contact: ContactInfoData }> {
  return request<{ contact: ContactInfoData }>('/content/contact');
}

export async function apiUpdateContact(contact: Partial<ContactInfoData>) {
  return request('/content/contact', {
    method: 'PUT',
    body: JSON.stringify(contact),
  });
}

export async function apiGetSocialLinks(): Promise<{ links: SocialLinkItem[] }> {
  return request<{ links: SocialLinkItem[] }>('/content/social-links');
}

export async function apiCreateSocialLink(link: Partial<SocialLinkItem>) {
  return request('/content/social-links', {
    method: 'POST',
    body: JSON.stringify(link),
  });
}

export async function apiUpdateSocialLink(id: string, link: Partial<SocialLinkItem>) {
  return request(`/content/social-links/${id}`, {
    method: 'PUT',
    body: JSON.stringify(link),
  });
}

export async function apiDeleteSocialLink(id: string) {
  return request(`/content/social-links/${id}`, {
    method: 'DELETE',
  });
}

// ======================== CUSTOM ORDER & BUNDLES ========================
export async function apiGetCustomOptions(group?: string): Promise<{ options: CustomOptionItem[] }> {
  return request<{ options: CustomOptionItem[] }>(`/custom-order/options${group ? `?group=${group}` : ''}`);
}

export async function apiCreateCustomOption(opt: Partial<CustomOptionItem>) {
  return request('/custom-order/options', {
    method: 'POST',
    body: JSON.stringify(opt),
  });
}

export async function apiUpdateCustomOption(id: string, opt: Partial<CustomOptionItem>) {
  return request(`/custom-order/options/${id}`, {
    method: 'PUT',
    body: JSON.stringify(opt),
  });
}

export async function apiDeleteCustomOption(id: string) {
  return request(`/custom-order/options/${id}`, {
    method: 'DELETE',
  });
}

export async function apiGetBundles(): Promise<{ bundles: BundleItem[] }> {
  return request<{ bundles: BundleItem[] }>('/custom-order/bundles');
}

export async function apiCreateBundle(b: Partial<BundleItem>) {
  return request('/custom-order/bundles', {
    method: 'POST',
    body: JSON.stringify(b),
  });
}

export async function apiUpdateBundle(id: string, b: Partial<BundleItem>) {
  return request(`/custom-order/bundles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(b),
  });
}

export async function apiDeleteBundle(id: string) {
  return request(`/custom-order/bundles/${id}`, {
    method: 'DELETE',
  });
}

// ======================== MEDIA LIBRARY ========================
export async function apiGetMedia(): Promise<{ files: MediaItem[] }> {
  return request<{ files: MediaItem[] }>('/media');
}

export async function apiUploadMedia(file: File): Promise<{ message: string; file: MediaItem }> {
  const formData = new FormData();
  formData.append('file', file);
  return request<{ message: string; file: MediaItem }>('/media/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function apiDeleteMedia(id: string) {
  return request(`/media/${id}`, {
    method: 'DELETE',
  });
}

// ======================== LOGS & STATS ========================
export async function apiGetLogs(params?: { limit?: number; action?: string }): Promise<{ logs: ActivityLogItem[] }> {
  const query = new URLSearchParams(params as any).toString();
  return request<{ logs: ActivityLogItem[] }>(`/logs?${query}`);
}

export async function apiGetDashboardStats(): Promise<{
  stats: {
    activeMenuItems: number;
    activeBottles: number;
    activePromos: number;
    activeBundles: number;
    totalMedia: number;
    activeAdmins: number;
  };
}> {
  return request('/logs/stats');
}

// ======================== PROMOTIONAL POPUP API ========================
export async function apiGetPublicPromoPopup(): Promise<{ active: boolean; popup: PromotionalPopupData | null; reason?: string }> {
  return request('/public/promo-popup');
}

export async function apiGetAdminPromoPopup(id?: string): Promise<{
  popup: PromotionalPopupData;
  popups?: PromotionalPopupData[];
  history: PromotionalPopupHistoryItem[];
}> {
  const url = id ? `/admin/promo-popup?id=${encodeURIComponent(id)}` : '/admin/promo-popup';
  return request(url);
}

export async function apiCreatePromoPopup(data: Partial<PromotionalPopupData>): Promise<{
  success: boolean;
  message: string;
  popup: PromotionalPopupData;
}> {
  const res = await request<{
    success: boolean;
    message: string;
    popup: PromotionalPopupData;
  }>('/admin/promo-popup/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  notifyDataChanged();
  return res;
}

export async function apiUpdatePromoPopup(data: Partial<PromotionalPopupData> & { change_summary?: string }): Promise<{
  success: boolean;
  message: string;
  popup: PromotionalPopupData;
}> {
  const res = await request<{
    success: boolean;
    message: string;
    popup: PromotionalPopupData;
  }>('/admin/promo-popup', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  notifyDataChanged();
  return res;
}

export async function apiSetActivePromoPopup(id: string): Promise<{
  success: boolean;
  message: string;
  popup: PromotionalPopupData;
}> {
  const res = await request<{
    success: boolean;
    message: string;
    popup: PromotionalPopupData;
  }>(`/admin/promo-popup/activate/${encodeURIComponent(id)}`, {
    method: 'POST',
  });
  notifyDataChanged();
  return res;
}

export async function apiDeletePromoPopup(id: string): Promise<{
  success: boolean;
  message: string;
}> {
  const res = await request<{
    success: boolean;
    message: string;
  }>(`/admin/promo-popup/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  notifyDataChanged();
  return res;
}

export async function apiRollbackPromoPopup(historyId: string): Promise<{
  success: boolean;
  message: string;
  popup: PromotionalPopupData;
}> {
  return request(`/admin/promo-popup/rollback/${historyId}`, {
    method: 'POST',
  });
}

export async function apiUploadPromoPopupImage(file: File): Promise<{ success: boolean; imageUrl: string }> {
  const formData = new FormData();
  formData.append('image', file);
  return request('/admin/promo-popup/upload-image', {
    method: 'POST',
    body: formData,
  });
}

