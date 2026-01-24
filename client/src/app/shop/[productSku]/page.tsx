import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Star, Shield, Truck, RefreshCw } from 'lucide-react';
import StockIndicator from '@/components/stock-indicator';
import ProductDetailClient from './product-detail-client';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  sku: string;
  imageUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  category: string;
  packageSize: string;
  isActive: boolean;
  isFeatured: boolean;
}


// Fetch product data for metadata generation
async function getProduct(productSku: string): Promise<Product | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/products/${productSku}`, {
      cache: 'no-store' // Ensure fresh data for SEO
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        return data.data;
      }
    }
  } catch (error) {
    console.error('Error fetching product for metadata:', error);
  }
  return null;
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ productSku: string }>;
}): Promise<Metadata> {
  const { productSku } = await params;
  const product = await getProduct(productSku);
  
  if (!product) {
    return {
      title: 'Product Not Found | Genie',
      description: 'The requested product could not be found.'
    };
  }

  const title = product.metaTitle || `${product.name} | Genie`;
  const description = product.metaDescription || product.description;
  const price = product.price;
  const availability = 'InStock'; // You can make this dynamic based on inventory

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: product.imageUrl ? [
        {
          url: product.imageUrl,
          width: 600,
          height: 600,
          alt: product.name
        }
      ] : [],
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: product.imageUrl ? [product.imageUrl] : []
    },
    other: {
      'product:price:amount': price.toString(),
      'product:price:currency': 'USD',
      'product:availability': availability,
      'product:brand': 'Genie',
      'product:category': product.category
    }
  };
}

export default function ProductDetailPage() {
  return <ProductDetailClient />;
}