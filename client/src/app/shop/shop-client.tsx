'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Filter, SlidersHorizontal } from 'lucide-react';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { Button } from '@/components/ui/button';
import { getProducts, Product } from '@/lib/api/products';
import { useCart } from '@/lib/cart-context';

export default function ShopClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await getProducts(true);
      if (response.success && response.data) {
        // Show all products (both single bottles and 12-packs)
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      setAddingToCart(product.id);
      
      await addToCart({
        productId: product.sku,
        quantity: 1,
        isSubscription: false,
        name: product.name,
        price: product.price,
        image: product.imageUrl || '/images/placeholder.jpg',
        subscriptionDiscount: undefined
      });
      
      // Optional: Add success feedback here
      console.log('Successfully added to cart:', product.name);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      // Error is already handled by cart context
    } finally {
      setAddingToCart(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary">Shop All</h1>
          <p className="text-muted-foreground mt-1">Discover our full range of wellness products.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" /> Filter
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <SlidersHorizontal className="h-4 w-4" /> Sort
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {products.map((product) => (
          <Link key={product.id} href={`/shop/${product.sku}`} className="group block">
            <div className="relative aspect-square overflow-hidden rounded-xl bg-muted mb-4">
              <ImageWithFallback
                src={product.imageUrl || '/images/placeholder.jpg'}
                alt={product.name}
                className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                fill
              />
              {product.packageSize === 'twelve_pack' && (
                <div className="absolute top-2 left-2 bg-secondary text-secondary-foreground text-xs font-bold px-2 py-1 rounded-full">
                  Subscribe & Save
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{product.name}</h3>
                <span className="font-semibold text-primary">${product.price.toFixed(2)}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
              <Button 
                onClick={(e) => handleAddToCart(e, product)} 
                className="w-full mt-2" 
                variant="secondary"
                disabled={addingToCart === product.id}
              >
                {addingToCart === product.id ? 'Adding...' : 'Add to Cart'}
              </Button>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}