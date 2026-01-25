'use client';

import { useState, useEffect } from 'react';
import { StarRating } from '@/components/reviews/star-rating';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

// API URL for backend requests
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Review {
  id: string;
  rating: number;
  content: string;
  guestName?: string;
  verified: boolean;
  helpful: number;
  createdAt: string;
  product: {
    name: string;
    sku: string;
  };
}

interface ReviewsResponse {
  reviews: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  averageRating: number;
  totalReviews: number;
  ratingCounts: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export default function TestimonialsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [ratingCounts, setRatingCounts] = useState({
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0
  });

  useEffect(() => {
    fetchReviews();
  }, [filter, page]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(filter !== 'all' && { rating: filter })
      });
      
      const response = await fetch(`${API_URL}/api/reviews/all?${params}`);
      const data: ReviewsResponse = await response.json();
      
      setReviews(data.reviews);
      setTotalPages(data.pagination.pages);
      setAverageRating(data.averageRating);
      setTotalReviews(data.totalReviews);
      
      // Use API-provided rating counts (total counts, not just current page)
      setRatingCounts(data.ratingCounts);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold mb-4">
            Customer Reviews
          </h1>
          <p className="text-gray-600 mb-6">
            See what our customers are saying about Genie products
          </p>
          <div className="flex items-center justify-center gap-2">
            <StarRating rating={averageRating} size="lg" />
            <span className="text-2xl font-bold ml-2">{averageRating.toFixed(1)}</span>
            <span className="text-gray-600 ml-2">({totalReviews} reviews)</span>
          </div>
        </div>

        {/* Filter controls */}
        <div className="mb-8 flex justify-center flex-wrap gap-4 max-w-4xl mx-auto">
          <button
            onClick={() => {
              setFilter('all');
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              filter === 'all' 
                ? 'bg-primary text-white border-primary' 
                : 'hover:bg-gray-100 border-gray-300'
            }`}
          >
            All Reviews
          </button>
          {[5, 4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => {
                setFilter(rating.toString());
                setPage(1);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                filter === rating.toString() 
                  ? 'bg-primary text-white border-primary' 
                  : 'hover:bg-gray-100 border-gray-300'
              }`}
            >
              <StarRating rating={rating} size="sm" />
              <span>({ratingCounts[rating as keyof typeof ratingCounts]})</span>
            </button>
          ))}
        </div>

        {/* Reviews grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading reviews...</p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 max-w-6xl mx-auto md:grid-cols-2 lg:grid-cols-3 justify-items-center">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 relative"
                >
                  <div className="flex items-start justify-between mb-4">
                    <StarRating rating={review.rating} size="sm" />
                    {review.verified && (
                      <div className="flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        <CheckCircle className="h-3 w-3" />
                        <span>Verified</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-700 mb-4 italic leading-relaxed">
                    "{review.content}"
                  </p>
                  
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                      {review.guestName?.[0] || 'A'}
                    </div>
                    <div>
                      <h5 className="font-bold text-sm">
                        {review.guestName || 'Anonymous'}
                      </h5>
                      <span className="text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 border-t pt-3">
                    Product: {review.product.name}
                  </div>
                  
                  {review.helpful > 0 && (
                    <div className="text-xs text-gray-500 mt-2">
                      {review.helpful} people found this helpful
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}