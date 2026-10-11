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
  login: (phone: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateCoins: (newBalance: number) => void;
}

const STORAGE_KEYS = {
  TOKEN: 'jebew_customer_token',
  USER: 'jebew_customer_user',
};

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
      return saved ? JSON.parse(saved) : null;
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
    // Hanya bisa ditutup jika pengunjung sudah terdaftar / masuk
    if (customer) {
      setIsAuthModalOpen(false);
    }
  }, [customer]);

  // Gerbang Masuk Wajib: Selalu buka modal jika belum masuk
  useEffect(() => {
    if (!isLoading && !customer) {
      setIsAuthModalOpen(true);
    }
  }, [isLoading, customer]);

  const refreshProfile = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/customer/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCustomer(data.user);
          try {
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
          } catch {}
        }
      } else if (res.status === 401) {
        // Token expired
        setToken(null);
        setCustomer(null);
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
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

  const login = useCallback(async (phone: string, name: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/customer/auth/login-or-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Login gagal.' };
      }

      setToken(data.token);
      setCustomer(data.user);

      try {
        localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
      } catch {}

      setIsAuthModalOpen(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Koneksi ke server gagal.' };
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setCustomer(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch {}
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
