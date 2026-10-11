import { CartItem, CustomerOrderData } from '../types';
import { STORE_CONFIG } from '../config/store';

export function generateWhatsAppOrderMessage(
  cart: CartItem[],
  customer: CustomerOrderData,
  totalAmount?: number,
  voucherInfo?: { title: string; code: string; discountAmount: number } | null
): string {
  const dateStr = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date());

  const orderTypeLabels: Record<string, string> = {
    delivery: '🛵 PENGANTARAN (DELIVERY)',
    takeaway: '🥡 BUNGKUS (TAKE AWAY)',
    dine_in: '🍽️ MAKAN DI TEMPAT (DINE-IN)',
  };

  let message = `*HALO MIE JEBEW!* 🍜🔥\n`;
  message += `Saya ingin melakukan pemesanan via website:\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `*RINCIAN PESANAN:*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n`;

  cart.forEach((item, index) => {
    message += `\n*${index + 1}. ${item.menuItem.name}* × ${item.quantity}\n`;
    if (item.menuItem.isSpicySelectable) {
      message += `   🌶️ *Level:* ${item.spiceLevel} ${item.spiceLevel >= 3 ? '🔥' : ''}\n`;
    }
    if (item.selectedToppings.length > 0) {
      const toppingsList = item.selectedToppings.map((t) => t.name).join(', ');
      message += `   🥚 *Topping:* ${toppingsList}\n`;
    } else if (item.menuItem.category === 'mie') {
      message += `   🥚 *Topping:* Tanpa Topping Tambahan\n`;
    }

    message += `   💰 *Subtotal:* Rp${item.itemTotal.toLocaleString('id-ID')}\n`;

    if (item.notes.trim()) {
      message += `   📝 *Catatan Item:* _"${item.notes.trim()}"_\n`;
    }
  });

  const subtotal = cart.reduce((s, i) => s + i.itemTotal, 0);
  const totalCalculated = totalAmount ?? Math.max(0, subtotal - (voucherInfo?.discountAmount ?? 0));

  message += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `*TOTAL PORSI:* ${cart.reduce((s, i) => s + i.quantity, 0)} Porsi\n`;
  if (voucherInfo) {
    message += `*SUBTOTAL:* Rp${subtotal.toLocaleString('id-ID')}\n`;
    message += `🎟️ *VOUCHER:* -Rp${voucherInfo.discountAmount.toLocaleString('id-ID')} (${voucherInfo.title} [${voucherInfo.code}])\n`;
  }
  message += `*TOTAL PEMBAYARAN:* Rp${totalCalculated.toLocaleString('id-ID')}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  message += `*DATA PEMESAN:*\n`;
  message += `👤 *Nama:* ${customer.customerName}\n`;
  message += `📱 *WhatsApp:* ${customer.customerPhone}\n`;
  message += `📍 *Metode:* ${orderTypeLabels[customer.orderType] || customer.orderType}\n`;

  if (customer.orderType === 'dine_in' && customer.tableNumber) {
    message += `🪑 *Nomor Meja:* ${customer.tableNumber}\n`;
  } else if (customer.orderType === 'delivery') {
    message += `🏠 *Alamat Kirim:* ${customer.address}\n`;
  }

  if (customer.additionalNotes.trim()) {
    message += `📝 *Catatan Tambahan:* _"${customer.additionalNotes.trim()}"_\n`;
  }

  message += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `*INFORMASI PEMBAYARAN:*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n`;

  if (customer.paymentMethod === 'qris') {
    message += `💳 *Metode Pembayaran:* QRIS (${STORE_CONFIG.assets.qrisMerchantName})\n`;
    message += `✅ *Status Pembayaran:* *SUDAH SELESAI DIBAYAR VIA QRIS*\n`;
    message += `📸 *Bukti Transfer:* Bukti pembayaran QRIS saya kirimkan setelah pesan ini ya kak!\n`;
  } else {
    message += `💵 *Metode Pembayaran:* Tunai / Bayar di Tempat (COD / Kasir)\n`;
  }

  message += `\n⏱️ _Waktu Pemesanan: ${dateStr} WIB_\n`;
  message += `\nMohon segera diproses dan dicek pembayarannya ya min. Terima kasih banyak! 🙏🔥`;

  return message;
}

export function createWhatsAppUrl(message: string): string {
  const phone = STORE_CONFIG.whatsappNumber;
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
}
