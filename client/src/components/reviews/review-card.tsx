import { StarRating } from './star-rating';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle } from 'lucide-react';

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    content: string;
    title?: string;
    guestName?: string;
    verified: boolean;
    helpful: number;
    createdAt: string;
    product?: {
      name: string;
      sku: string;
    };
  };
  showProduct?: boolean;
  className?: string;
}

export function ReviewCard({ review, showProduct = false, className }: ReviewCardProps) {
  return (
    <div className={`bg-white p-6 rounded-2xl shadow-md border border-gray-100 relative ${className || ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <StarRating rating={review.rating} size="sm" />
          {review.title && (
            <h4 className="font-semibold mt-2 text-gray-900">{review.title}</h4>
          )}
        </div>
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
        <div className="flex-1">
          <h5 className="font-bold text-sm text-gray-900">
            {review.guestName || 'Anonymous'}
          </h5>
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
          </span>
        </div>
        {review.helpful > 0 && (
          <span className="text-xs text-gray-500">
            {review.helpful} found helpful
          </span>
        )}
      </div>
      
      {showProduct && review.product && (
        <div className="text-xs text-gray-500 border-t pt-3">
          Product: {review.product.name}
        </div>
      )}
    </div>
  );
}