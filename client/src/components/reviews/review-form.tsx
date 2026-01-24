'use client';

import { useState } from 'react';
import { StarRating } from './star-rating';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface ReviewFormProps {
  productSku: string;
  productName: string;
  onSubmitSuccess?: () => void;
  className?: string;
}

interface FormData {
  rating: number;
  title: string;
  content: string;
  guestName: string;
  guestEmail: string;
}

export function ReviewForm({ 
  productSku, 
  productName, 
  onSubmitSuccess,
  className 
}: ReviewFormProps) {
  const [formData, setFormData] = useState<FormData>({
    rating: 0,
    title: '',
    content: '',
    guestName: '',
    guestEmail: ''
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.rating === 0) {
      setError('Please select a rating');
      return;
    }
    
    if (formData.content.length < 10) {
      setError('Review must be at least 10 characters long');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productSku,
          rating: formData.rating,
          title: formData.title || undefined,
          content: formData.content,
          guestName: formData.guestName || undefined,
          guestEmail: formData.guestEmail || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit review');
      }

      setSuccess(true);
      setFormData({
        rating: 0,
        title: '',
        content: '',
        guestName: '',
        guestEmail: ''
      });
      
      onSubmitSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  if (success) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-6 ${className || ''}`}>
        <div className="flex items-center gap-3 text-green-800">
          <CheckCircle className="h-6 w-6" />
          <div>
            <h3 className="font-semibold">Review Submitted Successfully!</h3>
            <p className="text-sm">Thank you for your feedback. Your review will appear shortly.</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setSuccess(false)}
          className="mt-4"
        >
          Write Another Review
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className || ''}`}>
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Write a Review for {productName}
        </h3>
      </div>

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Rating *
        </label>
        <StarRating
          rating={formData.rating}
          interactive
          onRatingChange={(rating) => handleInputChange('rating', rating)}
          size="lg"
        />
      </div>

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-2">
          Review Title (Optional)
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="Summarize your experience"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          maxLength={100}
        />
      </div>

      {/* Content */}
      <div>
        <label htmlFor="content" className="block text-sm font-medium mb-2">
          Your Review *
        </label>
        <textarea
          id="content"
          value={formData.content}
          onChange={(e) => handleInputChange('content', e.target.value)}
          placeholder="Share your thoughts about this product..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical"
          minLength={10}
          maxLength={1000}
          required
        />
        <div className="text-xs text-gray-500 mt-1">
          {formData.content.length}/1000 characters (minimum 10)
        </div>
      </div>

      {/* Guest Name */}
      <div>
        <label htmlFor="guestName" className="block text-sm font-medium mb-2">
          Your Name (Optional)
        </label>
        <input
          type="text"
          id="guestName"
          value={formData.guestName}
          onChange={(e) => handleInputChange('guestName', e.target.value)}
          placeholder="How should we display your name?"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          maxLength={50}
        />
      </div>

      {/* Guest Email */}
      <div>
        <label htmlFor="guestEmail" className="block text-sm font-medium mb-2">
          Email Address (Optional)
        </label>
        <input
          type="email"
          id="guestEmail"
          value={formData.guestEmail}
          onChange={(e) => handleInputChange('guestEmail', e.target.value)}
          placeholder="We won't share this publicly"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <div className="text-xs text-gray-500 mt-1">
          Your email will only be used to verify your purchase and won't be displayed publicly.
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={submitting || formData.rating === 0 || formData.content.length < 10}
        className="w-full"
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </Button>

      <div className="text-xs text-gray-500">
        By submitting this review, you agree to our terms of service and privacy policy.
      </div>
    </form>
  );
}