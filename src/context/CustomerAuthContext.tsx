import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface CustomerUser {
  id: number;
  phone: string;
  name: string;
  coinsBalance: number;
  lastSpinWibDate: string | null;
  canSpinToday: boolean;
}

export interface CountdownWIB {
  msRemaining: number;
  hours: number;
  minutes: number;
  seconds: number;
  formattedText: string;
}

interface CustomerAuthContextType {
  customer: CustomerUser | null;
  token: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  countdown: CountdownWIB;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (phone: string, name?: string) => Promise<{ success: boolean; error?: string; notRegistered?: boolean }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateCoins: (newBalance: number) => void;
  recordSpinUsed: (newBalance: number) => void;
}

const STORAGE_KEYS = {
  TOKEN: 'jebew_customer_token',
  USER: 'jebew_customer_user',
};

export function isSpinAllowedToday(phone?: string, lastSpinDate?: string | null): boolean {
  if (!phone) return true;
  try {
    const todayWIB = new Date().toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' });
    const localSpin = localStorage.getItem('jebew_last_spin_' + phone);
    if (localSpin === todayWIB) return false;
    if (lastSpinDate) {
      const lastWIB = new Date(lastSpinDate).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' });
      if (lastWIB === todayWIB) return false;
    }
  } catch {}
  return true;
}

function calculateCountdown(): CountdownWIB {
  const now = new Date();
  const nowWIB = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  const midnightWIB = new Date(nowWIB);
  midnightWIB.setHours(24, 0, 0, 0);

  const msRemaining = Math.max(0, midnightWIB.getTime() - nowWIB.getTime());
  const totalSeconds = Math.floor(msRemaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    msRemaining,
    hours,
    minutes,
    seconds,
    formattedText: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
  };
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export const CustomerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.TOKEN);
    } catch {
      return null;
    }
  });

  const [customer, setCustomer] = useState<CustomerUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      if (!saved) return null;
      const u = JSON.parse(saved);
      if (u) {
        u.canSpinToday = isSpinAllowedToday(u.phone, u.lastSpinDate);
      }
      return u;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<CountdownWIB>(calculateCountdown());

  // Live Countdown Timer (1 detik per update menuju 00:00 WIB)
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(calculateCountdown());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const openAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    if (token.startsWith('local_')) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/customer/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json().catch(() => null);
        if (data && data.user) {
          setCustomer(data.user);
          try {
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
          } catch {}
        }
      } else if (res.status === 401) {
        // Pada cloud/serverless Netlify, jika container restart dan user belum tersinkron di server baru,
        // pertahankan data user lokal agar tidak tertendang keluar
        if (token.startsWith('local_')) {
          setToken(null);
          setCustomer(null);
          localStorage.removeItem(STORAGE_KEYS.TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
        }
      }
    } catch (err) {
      console.warn('Gagal memuat profil customer:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = useCallback(
    async (phone: string, name?: string): Promise<{ success: boolean; error?: string; notRegistered?: boolean }> => {
      try {
        const rawPhone = phone.trim().replace(/[^0-9]/g, '');
        let cleanPhone = rawPhone;
        if (cleanPhone.startsWith('0')) {
          cleanPhone = '62' + cleanPhone.slice(1);
        } else if (cleanPhone.startsWith('8')) {
          cleanPhone = '62' + cleanPhone;
        }

        const cleanName = name ? name.trim() : '';

        // Baca histori akun yang pernah terdaftar di browser/HP ini
        let knownCustomers: Record<string, any> = {};
        try {
          const stored = localStorage.getItem('jebew_known_customers');
          if (stored) knownCustomers = JSON.parse(stored);
        } catch {}

        const localSavedUser = knownCustomers[cleanPhone];

        let isSuccess = false;
        let userData: any = null;
        let userToken: string = '';
        let isNotRegistered = false;
        let serverError = '';

        try {
          const res = await fetch('/api/customer/auth/login-or-register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: cleanPhone, name: cleanName || localSavedUser?.name || '' }),
          });

          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json().catch(() => null);
            if (data) {
              if (data.success) {
                isSuccess = true;
                userData = data.user;
                userToken = data.token;
              } else if (data.notRegistered) {
                isNotRegistered = true;
                serverError = data.error || 'Nomor WhatsApp belum terdaftar.';
              } else if (data.error) {
                serverError = data.error;
              }
            }
          }
        } catch (e) {
          console.warn('Backend login fallback to local session:', e);
        }

        // Jika nomor belum terdaftar dan user belum memasukkan nama:
        if (isNotRegistered && !cleanName && !localSavedUser) {
          return {
            success: false,
            notRegistered: true,
            error: serverError || 'Nomor WhatsApp belum terdaftar. Silakan lengkapi nama Anda untuk membuat akun baru.',
          };
        }

        // Fallback offline-resilient local customer session (Netlify / Static Cloud Mode)
        if (!isSuccess || !userData) {
          const resolvedName = cleanName || localSavedUser?.name || ('Pelanggan ' + cleanPhone.slice(-4));
          const canSpin = isSpinAllowedToday(cleanPhone);
          userData = {
            id: localSavedUser?.id || ('cust_' + Date.now().toString(36)),
            name: resolvedName,
            phone: cleanPhone,
            coinsBalance: localSavedUser?.coinsBalance ?? 10,
            canSpinToday: canSpin,
            created_at: localSavedUser?.created_at || new Date().toISOString(),
          };
          userToken = 'local_' + Date.now().toString(36);
        }

        setToken(userToken);
        setCustomer(userData);

        try {
          localStorage.setItem(STORAGE_KEYS.TOKEN, userToken);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
          knownCustomers[cleanPhone] = userData;
          localStorage.setItem('jebew_known_customers', JSON.stringify(knownCustomers));
        } catch {}

        setIsAuthModalOpen(false);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'Gagal masuk.' };
      }
    },
    []
  );

  const logout = useCallback(() => {
    setToken(null);
    setCustomer(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch {}
  }, []);

    const recordSpinUsed = useCallback((newBalance: number) => {
    const todayWIB = new Date().toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' });
    setCustomer((prev) => {
      if (!prev) return null;
      const updated = {
        ...prev,
        coinsBalance: newBalance,
        canSpinToday: false,
        lastSpinDate: new Date().toISOString(),
      };
      try {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
        localStorage.setItem('jebew_last_spin_' + prev.phone, todayWIB);
      } catch {}
      return updated;
    });
  }, []);

  const updateCoins = useCallback((newBalance: number) => {
    setCustomer((prev) => {
      if (!prev) return null;
      const updated = { ...prev, coinsBalance: newBalance };
      try {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        token,
        isLoggedIn: Boolean(token && customer),
        isLoading,
        countdown,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        login,
        logout,
        refreshProfile,
        updateCoins,
        recordSpinUsed,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = (): CustomerAuthContextType => {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
};
