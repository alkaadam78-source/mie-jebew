export interface StoreConfig {
  name: string;
  tagline: string;
  whatsappNumber: string; // international format without plus e.g. "6285122014573"
  whatsappDisplay: string;
  instagramHandle: string;
  instagramUrl: string;
  address: {
    title: string;
    note: string;
    street: string;
    city: string;
    description: string;
    mapsUrl: string;
    embedUrl: string;
    previewImage: string;
  };
  openingHours: {
    days: string;
    openHour: number; // 24h format (e.g. 10)
    openMinute: number;
    closeHour: number; // 24h format (e.g. 22)
    closeMinute: number;
    timezone: string; // 'Asia/Jakarta'
    displayHours: string;
  };
  assets: {
    logo: string;
    videoBanner: string;
    videoPoster: string;
    qris: string;
    qrisMerchantName: string;
    qrisNmid: string;
  };
}

export const STORE_CONFIG: StoreConfig = {
  name: 'Mie Jebew Official',
  tagline: 'SERBA 10 RIBU! Pedasnya Bikin Jebew! 🌶️',
  whatsappNumber: '6285122014573', // nomor WA toko
  whatsappDisplay: '+62 851-2201-4573',
  instagramHandle: '@cravecorner0',
  instagramUrl: 'https://www.instagram.com/cravecorner0?stkn=MTJ2OXpnMnAwZDNxNQ==',
  address: {
    title: 'SMK Infokom Kota Bogor',
    note: 'Outlet & Titik Lokasi Kami',
    street: 'Jl. Letjen Ibrahim Adjie No.178, RT.03/RW.08, Sindangbarang',
    city: 'Kec. Bogor Bar., Kota Bogor, Jawa Barat 16117',
    description: 'Jl. Letjen Ibrahim Adjie No.178, RT.03/RW.08, Sindangbarang, Kec. Bogor Barat, Kota Bogor, Jawa Barat 16117 (SMK Infokom Kota Bogor)',
    mapsUrl: 'https://maps.app.goo.gl/3Ze1SW4Cxpohb1wbA',
    embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3963.385!2d106.77125!3d-6.5898!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69c4f906e40827%3A0x6b93a4462670547c!2sSMK+Infokom+Kota+Bogor!5e0!3m2!1sid!2sid',
    previewImage: '/google-maps-location.jpg',
  },
  openingHours: {
    days: 'Setiap Hari (Senin - Minggu)',
    openHour: 10,
    openMinute: 0,
    closeHour: 22,
    closeMinute: 0,
    timezone: 'Asia/Jakarta',
    displayHours: '10:00 - 22:00 WIB',
  },
  assets: {
    logo: '/logo/Logo.png',
    videoBanner: '/vedio baner/zajiZMil.mp4',
    videoPoster: '/video-poster.jpg',
    qris: '/qris/Qris.jpeg',
    qrisMerchantName: 'CRAVE CORNER',
    qrisNmid: 'ID1026566705020',
  },
};
