import React, { useState } from 'react';
import { X, Star, Send, MessageSquare, CheckCircle } from '../ui/Icons';
import { MenuItem, ItemReview, ItemRatingSummary } from '../../types';

interface RatingModalProps {
  item: MenuItem | null;
  summary: ItemRatingSummary;
  reviews: ItemReview[];
  isOpen: boolean;
  onClose: () => void;
  onSubmitRating: (itemId: string, rating: number, reviewerName: string, comment: string) => void;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Kurang Nampol 😐',
  2: 'Lumayan Pedas 🙂',
  3: 'Enak Gurih 😋',
  4: 'Pedas Mantap! 🔥',
  5: 'Jebew Juara Banget! 🌶️🌶️',
};

export const RatingModal: React.FC<RatingModalProps> = ({
  item,
  summary,
  reviews,
  isOpen,
  onClose,
  onSubmitRating,
}) => {
  if (!isOpen || !item) return null;

  const [selectedRating, setSelectedRating] = useState<number>(summary.userRating || 5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewerName, setReviewerName] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitRating(item.id, selectedRating, reviewerName, comment);

    // Dynamic confetti effect
    import('canvas-confetti')
      .then((m) => {
        m.default({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
        });
      })
      .catch(() => {});

    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 1200);
  };

  const activeRating = hoverRating || selectedRating;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full sm:max-w-lg bg-cream border-t-4 sm:border-4 border-black sm:rounded-3xl shadow-brutal-xl max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-cream-100 border-b-3 border-black p-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-jebew-yellow border-2 border-black flex items-center justify-center font-black text-xl shadow-brutal-sm flex-shrink-0">
              ?
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-black leading-tight line-clamp-1">
                {item.name}
              </h3>
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                <Star className="w-3.5 h-3.5 fill-amber-400 stroke-black text-amber-500" />
                <span className="font-black text-black">{summary.average}</span>
                <span className="text-gray-500">({summary.count} ulasan pelanggan)</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup Modal"
            className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {isSubmitted ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-100 border-3 border-black rounded-2xl flex items-center justify-center mx-auto shadow-brutal text-emerald-600">
                <CheckCircle className="w-10 h-10 stroke-[2.5]" />
              </div>
              <h4 className="font-black text-xl text-black">Rating Berhasil Dikirim!</h4>
              <p className="text-xs sm:text-sm font-semibold text-gray-600">
                Terima kasih atas ulasanmu untuk menu ini! 🙏🔥
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Star Picker */}
              <div className="bg-white border-2 border-black rounded-2xl p-4 text-center space-y-2 shadow-brutal-sm">
                <label className="font-black text-xs sm:text-sm uppercase tracking-wider block text-gray-700">
                  BERIKAN BINTANGMU (1 - 5)
                </label>

                {/* Stars row */}
                <div className="flex items-center justify-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSelectedRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 cursor-pointer transition-transform hover:scale-125 active:scale-95"
                    >
                      <Star
                        className={`w-9 h-9 sm:w-11 sm:h-11 stroke-black stroke-[2] transition-colors ${
                          star <= activeRating
                            ? 'fill-amber-400 text-amber-500'
                            : 'fill-gray-100 text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {/* Label of current rating */}
                <div className="font-black text-sm text-jebew-red bg-yellow-50 py-1 px-3 rounded-lg border border-black/20 inline-block">
                  {RATING_LABELS[activeRating] || 'Pilih Bintang'}
                </div>
              </div>

              {/* Name Input */}
              <div className="space-y-1">
                <label className="font-black text-xs uppercase tracking-wide text-gray-700">
                  NAMA KAMU (OPSIONAL)
                </label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="Contoh: Rian / Anonim"
                  className="w-full bg-white border-2 border-black rounded-xl p-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-jebew-yellow"
                />
              </div>

              {/* Comment Input */}
              <div className="space-y-1">
                <label className="font-black text-xs uppercase tracking-wide text-gray-700">
                  ULASAN / KOMENTAR (OPSIONAL)
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Ceritakan rasanya, tingkat pedasnya, atau porsinya..."
                  className="w-full bg-white border-2 border-black rounded-xl p-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-jebew-yellow"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full min-h-[50px] bg-jebew-yellow hover:bg-yellow-400 active:bg-yellow-500 text-black font-black text-sm sm:text-base py-3 px-4 border-3 border-black rounded-xl shadow-brutal active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>KIRIM RATING SAYA</span>
              </button>
            </form>
          )}

          {/* List of Previous Customer Reviews for this item */}
          <div className="pt-3 border-t-2 border-gray-300 space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gray-700" />
              <h4 className="font-black text-sm uppercase tracking-wide text-black">
                Ulasan Pelanggan Lain ({reviews.length})
              </h4>
            </div>

            {reviews.length === 0 ? (
              <p className="text-xs font-semibold text-gray-500 italic py-2">
                Belum ada ulasan teks untuk menu ini. Jadilah yang pertama memberikan review!
              </p>
            ) : (
              <div className="space-y-2.5">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-white border-2 border-black rounded-xl p-3 shadow-brutal-sm space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-black">
                          {rev.reviewerName}
                        </span>
                        <div className="flex items-center text-amber-500">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400 stroke-black stroke-[1.5]" />
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400">
                        {rev.createdAt}
                      </span>
                    </div>

                    {rev.comment && (
                      <p className="text-xs font-medium text-gray-700 leading-relaxed">
                        "{rev.comment}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default RatingModal;
