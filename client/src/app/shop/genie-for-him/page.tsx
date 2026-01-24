'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Star, Shield, Zap, Users, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { ProductGallery } from '@/components/ui/product-gallery';
import { PricingToggle } from '@/components/ui/pricing-toggle';
import { StarRating } from '@/components/reviews/star-rating';
import { useCart } from '@/lib/cart-context';
import { getProductReviews, Review } from '@/lib/api/products';

export default function GenieForHimPage() {
  const router = useRouter();
  const { addToCart } = useCart();
  const [selectedOption, setSelectedOption] = useState<'single' | 'pack' | 'subscription'>('single');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    fetchProductReviews();
  }, []);

  const fetchProductReviews = async () => {
    try {
      const response = await getProductReviews('genie-for-him');
      if (response.success && response.data) {
        setReviews(response.data.reviews);
        setReviewStats({
          averageRating: response.data.stats.averageRating,
          totalReviews: response.data.stats.totalReviews
        });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const product = {
    name: 'Genie for Him',
    tagline: 'Boost Your Confidence & Vitality',
    rating: reviewStats.averageRating || 4.8,
    reviewCount: reviewStats.totalReviews || 0,
    images: [
      '/images/products/genie-for-him/genie-for-him-1.webp',
      '/images/products/genie-for-him/genie-for-him-2.webp',
      '/images/products/genie-for-him/genie-for-him-3.webp',
      '/images/products/genie-for-him/genie-for-him-4.webp',
      '/images/products/genie-for-him/genie-for-him-5.webp',
      '/images/products/genie-for-him/genie-for-him-6.webp'
    ],
    singlePrice: 10,
    packPrice: 99,
    packSize: 12
  };

  const ingredients = [
    { name: 'L-Arginine', benefit: 'Supports blood flow and circulation' },
    { name: 'Tribulus Terrestris', benefit: 'Traditional libido support' },
    { name: 'Ginseng Extract', benefit: 'Energy and stamina enhancement' },
    { name: 'Maca Root', benefit: 'Natural vitality booster' },
    { name: 'Zinc', benefit: 'Essential mineral for male health' }
  ];


  const faqs = [
    {
      question: 'How long does it take to feel the effects?',
      answer: 'Most users report feeling effects within 30-60 minutes of consumption. Individual results may vary.'
    },
    {
      question: 'Is it safe to use daily?',
      answer: 'Yes, Genie for Him is formulated with natural ingredients and is safe for daily use. However, we recommend consulting with your healthcare provider if you have any concerns.'
    },
    {
      question: 'What does it taste like?',
      answer: 'Genie for Him has a pleasant berry flavor with natural fruit extracts. Most customers find the taste enjoyable.'
    },
    {
      question: 'Can I cancel my subscription anytime?',
      answer: 'Absolutely! You can cancel, pause, or modify your subscription at any time through your account dashboard or by contacting our support team.'
    }
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-text-secondary mb-8">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-primary">Shop</Link>
          <span>/</span>
          <span className="text-text-primary">Genie for Him</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Product Images */}
          <div>
            <ProductGallery images={product.images} productName={product.name} />
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-2">
                {product.name}
              </h1>
              <p className="text-xl text-text-secondary mb-4">{product.tagline}</p>
              
              {/* Rating */}
              <div className="flex items-center gap-2 mb-6">
                <StarRating rating={product.rating} size="md" />
                <span className="text-text-primary font-medium">{product.rating.toFixed(1)}</span>
                <span className="text-text-secondary">({product.reviewCount} reviews)</span>
              </div>
            </div>

            {/* Pricing Options */}
            <div>
              <h3 className="font-semibold text-text-primary mb-4">Choose Your Option:</h3>
              <PricingToggle
                singlePrice={product.singlePrice}
                packPrice={product.packPrice}
                packSize={product.packSize}
                onSelectionChange={setSelectedOption}
              />
            </div>

            {/* Quantity & Add to Cart */}
            <div className="space-y-4">
              {selectedOption === 'single' && (
                <div className="flex items-center gap-4">
                  <label className="font-semibold text-text-primary">Quantity:</label>
                  <div className="flex items-center border border-border-default rounded-lg">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 hover:bg-background transition-colors"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 border-x border-border-default">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-2 hover:bg-background transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={async () => {
                  setIsAddingToCart(true);
                  try {
                    const isSubscription = selectedOption === 'subscription';
                    const productId =
                      selectedOption === 'single'
                        ? 'genie-for-him'
                        : 'genie-for-him-12pack';
                    const price = selectedOption === 'single' ? product.singlePrice : product.packPrice;
                    const name =
                      selectedOption === 'single'
                        ? 'Genie for Him'
                        : 'Genie for Him - 12 Pack';

                    await addToCart({
                      productId,
                      quantity,
                      isSubscription,
                      name,
                      price,
                      image: product.images[0],
                      subscriptionDiscount: isSubscription ? 0.15 : undefined,
                    });

                    setShowSuccess(true);
                    setTimeout(() => {
                      setShowSuccess(false);
                      router.push('/cart');
                    }, 1500);
                  } catch (error) {
                    console.error('Error adding to cart:', error);
                    const errorMessage = error instanceof Error ? error.message : 'Failed to add item to cart. Please try again.';
                    alert(errorMessage);
                  } finally {
                    setIsAddingToCart(false);
                  }
                }}
                disabled={isAddingToCart}
                className="w-full bg-primary text-white py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {showSuccess ? (
                  <>
                    <Check className="h-5 w-5" /> Added to Cart!
                  </>
                ) : (
                  <>
                    Add to Cart <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border-default">
              <div className="text-center">
                <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium text-text-primary">Safe & Natural</p>
              </div>
              <div className="text-center">
                <Zap className="h-8 w-8 text-secondary mx-auto mb-2" />
                <p className="text-sm font-medium text-text-primary">Fast Acting</p>
              </div>
              <div className="text-center">
                <Users className="h-8 w-8 text-accent mx-auto mb-2" />
                <p className="text-sm font-medium text-text-primary">1000+ Happy Customers</p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="max-w-4xl mx-auto">
          <div className="border-b border-border-default mb-8">
            <nav className="flex gap-8">
              {['description', 'ingredients', 'reviews', 'faq'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-2 border-b-2 font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-primary text-primary'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === 'description' && (
              <div className="prose prose-lg max-w-none">
                <h3 className="font-display text-2xl font-bold text-text-primary mb-4">
                  Unleash Your Confidence
                </h3>
                <p className="text-text-secondary mb-6">
                  Genie for Him is specially formulated to support male vitality and confidence. 
                  Our unique blend of natural ingredients has been carefully selected to enhance 
                  energy, stamina, and overall well-being.
                </p>
                <h4 className="font-semibold text-text-primary mb-3">Key Benefits:</h4>
                <ul className="space-y-2 text-text-secondary">
                  <li>• Enhanced energy and stamina</li>
                  <li>• Improved confidence and mood</li>
                  <li>• Natural circulation support</li>
                  <li>• Fast-acting formula (30-60 minutes)</li>
                  <li>• Made with premium natural ingredients</li>
                </ul>
                <h4 className="font-semibold text-text-primary mb-3 mt-6">How to Use:</h4>
                <p className="text-text-secondary">
                  Take one 50ML bottle 30-60 minutes before desired effects. 
                  Do not exceed one bottle per day. Best taken on an empty stomach.
                </p>
              </div>
            )}

            {activeTab === 'ingredients' && (
              <div>
                <h3 className="font-display text-2xl font-bold text-text-primary mb-6">
                  Premium Natural Ingredients
                </h3>
                <div className="space-y-4">
                  {ingredients.map((ingredient, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-surface rounded-lg border border-border-default">
                      <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-semibold text-text-primary mb-1">{ingredient.name}</h4>
                        <p className="text-text-secondary">{ingredient.benefit}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 p-6 bg-primary/5 rounded-lg border border-primary/20">
                  <h4 className="font-semibold text-text-primary mb-2">Quality Assurance</h4>
                  <p className="text-text-secondary">
                    All ingredients are sourced from trusted suppliers and undergo rigorous 
                    testing for purity and potency. Our facility is GMP certified and follows 
                    strict quality control standards.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-display text-2xl font-bold text-text-primary">
                    Customer Reviews
                  </h3>
                  <div className="flex items-center gap-2">
                    <StarRating rating={product.rating} size="md" />
                    <span className="font-medium text-text-primary">{product.rating.toFixed(1)} out of 5</span>
                  </div>
                </div>

                <div className="space-y-6">
                  {reviewsLoading ? (
                    <div className="text-center py-8">
                      <p className="text-text-secondary">Loading reviews...</p>
                    </div>
                  ) : reviews.length > 0 ? (
                    reviews.map((review, index) => (
                      <div key={review.id || index} className="p-6 bg-surface rounded-lg border border-border-default">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-genie-blue to-genie-pink rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {review.user.firstName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-text-primary">
                                {review.user.firstName} {review.user.lastName?.charAt(0) || ''}.
                              </p>
                              <p className="text-sm text-text-secondary">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </p>
                              {review.isVerifiedPurchase && (
                                <span className="text-xs text-green-600 flex items-center gap-1 mt-1">
                                  <Check className="h-3 w-3" />
                                  Verified Purchase
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-4 w-4 ${i < review.rating ? 'fill-accent text-accent' : 'text-gray-300'}`} 
                              />
                            ))}
                          </div>
                        </div>
                        <h4 className="font-semibold text-text-primary mb-2">{review.title}</h4>
                        <p className="text-text-secondary">{review.body}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-text-secondary">No reviews yet. Be the first to review this product!</p>
                    </div>
                  )}
                </div>

                <div className="text-center mt-8">
                  <Link 
                    href="/testimonials" 
                    className="text-primary hover:text-primary/80 font-semibold flex items-center justify-center gap-2"
                  >
                    Read All Reviews <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}

            {activeTab === 'faq' && (
              <div>
                <h3 className="font-display text-2xl font-bold text-text-primary mb-6">
                  Frequently Asked Questions
                </h3>
                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <div key={index} className="border border-border-default rounded-lg">
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-background transition-colors"
                      >
                        <span className="font-semibold text-text-primary">{faq.question}</span>
                        {expandedFaq === index ? (
                          <ChevronUp className="h-5 w-5 text-text-secondary" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-text-secondary" />
                        )}
                      </button>
                      {expandedFaq === index && (
                        <div className="px-4 pb-4">
                          <p className="text-text-secondary">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}