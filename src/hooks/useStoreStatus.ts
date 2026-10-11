import { useState, useEffect } from 'react';
import { STORE_CONFIG } from '../config/store';

export interface StoreStatus {
  isOpen: boolean;
  statusText: string;
  statusBadge: string;
  subText: string;
}

export function useStoreStatus(): StoreStatus {
  const [status, setStatus] = useState<StoreStatus>(() => calculateStatus());

  function calculateStatus(): StoreStatus {
    try {
      // Get current date/time in Asia/Jakarta timezone
      const now = new Date();
      const jakartaFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: STORE_CONFIG.openingHours.timezone,
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      });

      const parts = jakartaFormatter.formatToParts(now);
      const hourPart = parts.find((p) => p.type === 'hour')?.value;
      const minutePart = parts.find((p) => p.type === 'minute')?.value;

      const currentHour = hourPart ? parseInt(hourPart, 10) : now.getHours();
      const currentMinute = minutePart ? parseInt(minutePart, 10) : now.getMinutes();
      const currentTotalMinutes = currentHour * 60 + currentMinute;

      const openTotalMinutes =
        STORE_CONFIG.openingHours.openHour * 60 + STORE_CONFIG.openingHours.openMinute;
      const closeTotalMinutes =
        STORE_CONFIG.openingHours.closeHour * 60 + STORE_CONFIG.openingHours.closeMinute;

      const isOpen =
        currentTotalMinutes >= openTotalMinutes && currentTotalMinutes < closeTotalMinutes;

      if (isOpen) {
        return {
          isOpen: true,
          statusText: 'BUKA SEKARANG',
          statusBadge: '🟢 BUKA SEKARANG',
          subText: `Buka sampai ${STORE_CONFIG.openingHours.closeHour}:00 WIB`,
        };
      } else {
        return {
          isOpen: false,
          statusText: 'SEDANG TUTUP',
          statusBadge: '🔴 SEDANG TUTUP',
          subText: `Buka kembali pukul ${STORE_CONFIG.openingHours.openHour}:00 WIB`,
        };
      }
    } catch {
      return {
        isOpen: true,
        statusText: 'BUKA SEKARANG',
        statusBadge: '🟢 BUKA SEKARANG',
        subText: STORE_CONFIG.openingHours.displayHours,
      };
    }
  }

  useEffect(() => {
    // Update every minute
    const interval = setInterval(() => {
      setStatus(calculateStatus());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return status;
}
