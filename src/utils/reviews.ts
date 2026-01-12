export interface Review {
  id: string;
  rating: number;
  name: string;
  email?: string;
  review: string;
  date: string;
}

const REVIEWS_STORAGE_KEY = 'image-tools-reviews';

/**
 * Load all reviews from localStorage
 */
export const loadReviews = (): Review[] => {
  try {
    const stored = localStorage.getItem(REVIEWS_STORAGE_KEY);
    if (!stored) return [];
    const reviews = JSON.parse(stored);
    return Array.isArray(reviews) ? reviews : [];
  } catch (error) {
    console.error('Failed to load reviews:', error);
    return [];
  }
};

/**
 * Save a new review to localStorage
 */
export const saveReview = (review: Omit<Review, 'id' | 'date'>): Review => {
  const newReview: Review = {
    ...review,
    id: `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    date: new Date().toISOString(),
  };

  try {
    const reviews = loadReviews();
    reviews.unshift(newReview); // Add to beginning
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
    return newReview;
  } catch (error) {
    console.error('Failed to save review:', error);
    throw error;
  }
};

/**
 * Delete a review by ID
 */
export const deleteReview = (id: string): void => {
  try {
    const reviews = loadReviews();
    const filtered = reviews.filter((r) => r.id !== id);
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete review:', error);
    throw error;
  }
};

/**
 * Get average rating from all reviews
 */
export const getAverageRating = (): number => {
  const reviews = loadReviews();
  if (reviews.length === 0) return 0;
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return total / reviews.length;
};

/**
 * Get review statistics
 */
export const getReviewStats = () => {
  const reviews = loadReviews();
  const total = reviews.length;
  const avgRating = getAverageRating();
  
  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((review) => {
    if (review.rating >= 1 && review.rating <= 5) {
      ratingCounts[review.rating as keyof typeof ratingCounts]++;
    }
  });

  return {
    total,
    avgRating,
    ratingCounts,
  };
};
