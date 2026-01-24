'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Star, Shield, Truck, RefreshCw } from 'lucide-react';
import StockIndicator from '@/components/stock-indicator';
import { getProductBySku, getProductReviews, ProductDetail } from '@/lib/api/products';

export default function ProductDetailClient() {
  const params = useParams();
  const productSku = params.productSku as string;
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewStats, setReviewStats] = useState({ averageRating: 0, totalReviews: 0 });

  useEffect(() => {
    if (productSku) {
      fetchProduct();
    }
  }, [productSku]);

  const fetchProduct = async () => {
    try {
      const [productResponse, reviewsResponse] = await Promise.all([
        getProductBySku(productSku),
        getProductReviews(productSku)
      ]);
      
      if (productResponse.success && productResponse.data) {
        setProduct(productResponse.data);
      } else {
        setError('Product not found');
      }
      
      if (reviewsResponse.success && reviewsResponse.data) {
        setReviewStats({
          averageRating: reviewsResponse.data.stats.averageRating,
          totalReviews: reviewsResponse.data.stats.totalReviews
        });
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-12 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-text-secondary">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen py-12 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-4">Product Not Found</h1>
          <p className="text-text-secondary mb-6">{error}</p>
          <Link 
            href="/shop"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <Link 
          href="/shop"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Shop
        </Link>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Product Image */}
          <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center overflow-hidden">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={600}
                height={600}
                className="w-full h-full object-contain p-12"
              />
            ) : (
              <div className="text-8xl font-bold text-gray-400">
                {product.name.charAt(0)}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Badge */}
            {product.isFeatured && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20">
                Featured Product
              </span>
            )}

            {/* Title */}
            <div>
              <h1 className="font-display text-4xl font-bold text-text-primary mb-2">
                {product.name}
              </h1>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-5 w-5 ${i < Math.floor(reviewStats.averageRating) ? 'fill-accent text-accent' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <span className="text-text-secondary">
                {reviewStats.averageRating > 0 
                  ? `${reviewStats.averageRating.toFixed(1)} (${reviewStats.totalReviews}+ reviews)`
                  : 'No reviews yet'
                }
              </span>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <p className="text-lg text-text-secondary leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Price */}
            <div className="flex items-center gap-4">
              <span className="text-4xl font-bold text-text-primary">
                ${product.price}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xl text-text-secondary line-through">
                  ${product.originalPrice}
                </span>
              )}
              <span className="text-text-secondary">
                per {product.packageSize === 'twelve_pack' ? '12-pack' : 'bottle'}
              </span>
            </div>

            {/* Stock Status */}
            <StockIndicator 
              productId={product.id} 
              productSku={product.sku}
              className="text-lg"
            />

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-surface border border-border-default rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-semibold text-text-primary">Safe & Natural</p>
                  <p className="text-sm text-text-secondary">Premium ingredients</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-surface border border-border-default rounded-lg">
                <Truck className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-semibold text-text-primary">Fast Shipping</p>
                  <p className="text-sm text-text-secondary">2-3 business days</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-surface border border-border-default rounded-lg">
                <RefreshCw className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-semibold text-text-primary">Money Back</p>
                  <p className="text-sm text-text-secondary">30-day guarantee</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <button className="w-full bg-primary text-white py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors text-lg">
                Add to Cart - ${product.price}
              </button>
              
              <button className="w-full bg-surface border border-border-default text-text-primary py-4 rounded-lg font-semibold hover:bg-background transition-colors">
                Subscribe & Save 15%
              </button>
            </div>

            {/* Product Details */}
            <div className="border-t border-border-default pt-6">
              <h3 className="font-semibold text-text-primary mb-3">Product Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">SKU:</span>
                  <span className="text-text-primary font-mono">{product.sku}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Category:</span>
                  <span className="text-text-primary capitalize">{product.category} Enhancement</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Size:</span>
                  <span className="text-text-primary">
                    {product.packageSize === 'twelve_pack' ? '12 x 50ML bottles' : '50ML bottle'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}