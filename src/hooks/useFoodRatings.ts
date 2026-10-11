import { useState, useEffect, useCallback } from 'react';
import { ItemReview, ItemRatingSummary } from '../types';

const STORAGE_RATINGS_KEY = 'mie_jebew_food_ratings_v2';
const STORAGE_REVIEWS_KEY = 'mie_jebew_food_reviews_v2';

// Baseline initial ratings so every item has community proof
const INITIAL_RATINGS: Record<string, { totalScore: number; count: number }> = {
  'mie-1': { totalScore: 235, count: 48 }, // 4.90
  'mie-2': { totalScore: 188, count: 39 }, // 4.82
  'mie-3': { totalScore: 165, count: 34 }, // 4.85
  'mie-4': { totalScore: 140, count: 29 }, // 4.83
  'mie-5': { totalScore: 255, count: 52 }, // 4.90
  'paket-1': { totalScore: 310, count: 63 }, // 4.92
  'paket-2': { totalScore: 195, count: 40 }, // 4.88
  'paket-3': { totalScore: 220, count: 45 }, // 4.89
  'side-1': { totalScore: 152, count: 31 }, // 4.90
  'side-2': { totalScore: 135, count: 28 }, // 4.82
  'side-3': { totalScore: 120, count: 25 }, // 4.80
  'minuman-1': { totalScore: 380, count: 77 }, // 4.94
  'minuman-2': { totalScore: 190, count: 39 }, // 4.87
  'minuman-3': { totalScore: 160, count: 33 }, // 4.85
};

const INITIAL_REVIEWS: ItemReview[] = [
  {
    id: 'rev-init-1',
    itemId: 'mie-1',
    reviewerName: 'Rian F.',
    rating: 5,
    comment: 'Bumbu chili oil rahasianya beneran mantap nendang!',
    createdAt: 'Kemarin',
  },
  {
    id: 'rev-init-2',
    itemId: 'mie-1',
    reviewerName: 'Nisa K.',
    rating: 5,
    comment: 'Sensasi pedasnya bikin nagih banget!',
    createdAt: '2 hari lalu',
  },
  {
    id: 'rev-init-3',
    itemId: 'paket-1',
    reviewerName: 'Agus P.',
    rating: 5,
    comment: 'Porsi puas banget, komplit buat makan siang!',
    createdAt: '3 hari lalu',
  },
  {
    id: 'rev-init-4',
    itemId: 'minuman-1',
    reviewerName: 'Dewi S.',
    rating: 5,
    comment: 'Gelas jumbo beneran penyelamat lidah terbakar!',
    createdAt: '4 hari lalu',
  },
];

export function useFoodRatings() {
  const [ratingsMap, setRatingsMap] = useState<Record<string, { totalScore: number; count: number }>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_RATINGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_RATINGS;
  });

  const [reviewsList, setReviewsList] = useState<ItemReview[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_REVIEWS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_REVIEWS;
  });

  const [userRatings, setUserRatings] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('mie_jebew_my_user_ratings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {};
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_RATINGS_KEY, JSON.stringify(ratingsMap));
    } catch (e) {
      console.error(e);
    }
  }, [ratingsMap]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_REVIEWS_KEY, JSON.stringify(reviewsList));
    } catch (e) {
      console.error(e);
    }
  }, [reviewsList]);

  useEffect(() => {
    try {
      localStorage.setItem('mie_jebew_my_user_ratings', JSON.stringify(userRatings));
    } catch (e) {
      console.error(e);
    }
  }, [userRatings]);

  const getRatingSummary = useCallback(
    (itemId: string): ItemRatingSummary => {
      const data = ratingsMap[itemId] || { totalScore: 24, count: 5 };
      const average = data.count > 0 ? Number((data.totalScore / data.count).toFixed(1)) : 5.0;
      return {
        average,
        count: data.count,
        userRating: userRatings[itemId],
      };
    },
    [ratingsMap, userRatings]
  );

  const getReviewsForItem = useCallback(
    (itemId: string): ItemReview[] => {
      return reviewsList.filter((r) => r.itemId === itemId);
    },
    [reviewsList]
  );

  const submitRating = useCallback(
    (itemId: string, rating: number, reviewerName: string, comment: string) => {
      if (rating < 1 || rating > 5) return;

      const cleanName = reviewerName.trim() || 'Pelanggan Rahasia';
      const cleanComment = comment.trim();

      const newReview: ItemReview = {
        id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        itemId,
        reviewerName: cleanName,
        rating,
        comment: cleanComment,
        createdAt: 'Baru saja',
      };

      // Add to reviews list
      setReviewsList((prev) => [newReview, ...prev]);

      // Update ratings map
      setRatingsMap((prev) => {
        const current = prev[itemId] || { totalScore: 0, count: 0 };
        return {
          ...prev,
          [itemId]: {
            totalScore: current.totalScore + rating,
            count: current.count + 1,
          },
        };
      });

      // Track user's own rating
      setUserRatings((prev) => ({
        ...prev,
        [itemId]: rating,
      }));
    },
    []
  );

  return {
    getRatingSummary,
    getReviewsForItem,
    submitRating,
    allReviews: reviewsList,
  };
}
