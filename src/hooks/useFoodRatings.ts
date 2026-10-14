import { useState, useEffect, useCallback } from 'react';
import { ItemReview, ItemRatingSummary } from '../types';

const STORAGE_RATINGS_KEY = 'mie_jebew_food_ratings_v3';
const STORAGE_REVIEWS_KEY = 'mie_jebew_food_reviews_v3';

// Baseline initial ratings so every item has community proof
const INITIAL_RATINGS: Record<string, { totalScore: number; count: number }> = {};

const INITIAL_REVIEWS: ItemReview[] = [];

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
      const data = ratingsMap[itemId] || { totalScore: 0, count: 0 };
      const average = data.count > 0 ? Number((data.totalScore / data.count).toFixed(1)) : 0;
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
