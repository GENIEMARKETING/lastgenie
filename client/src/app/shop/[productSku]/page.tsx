import { Metadata } from 'next';
import ProductDetailClient from './product-detail-client';

// Generate static params for all products at build time
export async function generateStaticParams() {
  try {
    // For static export, we'll define the known product SKUs
    // This avoids the need to fetch from API during build
    const productSkus = [
      'genie-for-him',
      'genie-for-her', 
      'genie-for-him-12pack',
      'genie-for-her-12pack'
    ];

    return productSkus.map((productSku) => ({
      productSku: productSku,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    // Return empty array if there's an error
    return [];
  }
}

// Generate metadata for SEO (static for build compatibility)
export async function generateMetadata({
  params,
}: {
  params: Promise<{ productSku: string }>;
}): Promise<Metadata> {
  const { productSku } = await params;
  
  // Static metadata based on known products
  const productMeta: Record<string, { title: string; description: string; price: string; category: string }> = {
    'genie-for-him': {
      title: 'Genie for Him - Male Sexual Enhancement Drink | Genie',
      description: 'Enhance your vitality with Genie for Him - a natural sexual enhancement drink designed for men.',
      price: '10',
      category: 'male'
    },
    'genie-for-her': {
      title: 'Genie for Her - Female Sexual Enhancement Drink | Genie',
      description: 'Boost your wellness with Genie for Her - a natural sexual enhancement drink designed for women.',
      price: '10',
      category: 'female'
    },
    'genie-for-him-12pack': {
      title: 'Genie for Him 12-Pack - Male Enhancement Bundle | Genie',
      description: 'Get the best value with our 12-pack of Genie for Him sexual enhancement drinks.',
      price: '99',
      category: 'male'
    },
    'genie-for-her-12pack': {
      title: 'Genie for Her 12-Pack - Female Enhancement Bundle | Genie',
      description: 'Get the best value with our 12-pack of Genie for Her sexual enhancement drinks.',
      price: '99',
      category: 'female'
    }
  };

  const meta = productMeta[productSku] || {
    title: 'Product | Genie',
    description: 'Discover Genie\'s sexual enhancement drinks for enhanced vitality and wellness.',
    price: '10',
    category: 'wellness'
  };

  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description
    },
    other: {
      'product:price:amount': meta.price,
      'product:price:currency': 'USD',
      'product:availability': 'InStock',
      'product:brand': 'Genie',
      'product:category': meta.category
    }
  };
}

export default function ProductDetailPage() {
  return <ProductDetailClient />;
}