'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Star, CheckCircle, AlertCircle } from 'lucide-react';

interface OrderDetails {
  id: string;
  customer_name: string;
  customer_email: string;
  tenant_id: string;
  business_name: string;
  logo_url?: string;
  primary_color?: string;
  total: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  created_at: string;
}

export default function FeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [review, setReview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const feedbackToken = params.token as string;

  useEffect(() => {
    fetchOrderDetails();
  }, [feedbackToken]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/feedback/${feedbackToken}`);
      if (!response.ok) {
        throw new Error('Order not found or feedback already submitted');
      }
      const data = await response.json();
      setOrderDetails(data);
    } catch (error) {
      setError('Unable to load order details. The feedback link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/feedback/${feedbackToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          review: review.trim(),
          customer_name: orderDetails?.customer_name,
          customer_email: orderDetails?.customer_email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setIsSubmitted(true);
    } catch (error) {
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ rating, onRatingChange, hoveredRating, onHover, readonly = false }: {
    rating: number;
    onRatingChange?: (rating: number) => void;
    hoveredRating?: number;
    onHover?: (rating: number) => void;
    readonly?: boolean;
  }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-8 w-8 ${
              star <= (hoveredRating || rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            } ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-all`}
            onClick={() => !readonly && onRatingChange?.(star)}
            onMouseEnter={() => !readonly && onHover?.(star)}
            onMouseLeave={() => !readonly && onHover?.(0)}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error && !orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Unable to Load Feedback</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/')} variant="outline">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Thank You!</h2>
            <p className="text-gray-600 mb-4">
              Your feedback has been submitted successfully. We appreciate your review!
            </p>
            <Button onClick={() => router.push('/')} variant="outline">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Restaurant Header */}
        <div className="text-center mb-8">
          {orderDetails?.logo_url && (
            <img
              src={orderDetails.logo_url}
              alt={orderDetails.business_name}
              className="h-16 w-auto mx-auto mb-4"
            />
          )}
          <h1 className="text-2xl font-bold text-gray-900" style={{ color: orderDetails?.primary_color }}>
            {orderDetails?.business_name}
          </h1>
          <p className="text-gray-600">How was your experience?</p>
        </div>

        {/* Order Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-mono text-sm">{orderDetails?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-semibold">${orderDetails?.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span>{new Date(orderDetails?.created_at || '').toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-medium mb-2">Items:</h4>
              <div className="space-y-1">
                {orderDetails?.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.name}</span>
                    <span>${item.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Form */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Your Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rating */}
              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  How would you rate your experience?
                </label>
                <StarRating
                  rating={rating}
                  onRatingChange={setRating}
                  hoveredRating={hoveredRating}
                  onHover={setHoveredRating}
                />
                <p className="text-sm text-gray-500 mt-2">
                  {hoveredRating > 0 && (
                    <>
                      {hoveredRating === 1 && "Poor"}
                      {hoveredRating === 2 && "Fair"}
                      {hoveredRating === 3 && "Good"}
                      {hoveredRating === 4 && "Very Good"}
                      {hoveredRating === 5 && "Excellent"}
                    </>
                  )}
                </p>
              </div>

              {/* Review */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tell us about your experience (optional)
                </label>
                <Textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Share your thoughts about the food, service, or overall experience..."
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="w-full"
                style={{ backgroundColor: orderDetails?.primary_color }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
