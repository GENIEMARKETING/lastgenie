'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Star, Shield, Zap, ShieldCheck, CheckCircle2, Heart } from 'lucide-react';
import { getProducts, Product } from '@/lib/api/products';
import { HeroSection } from '@/components/home/hero-section';
import { ExploreSection } from '@/components/home/explore-section';
import { PhilosophySection } from '@/components/home/philosophy-section';
import { BlogSection } from '@/components/home/blog-section';
import { NewsletterSection } from '@/components/home/newsletter-section';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await getProducts(true);
      if (response.success && response.data) {
        // Filter for single bottle products only
        const singleProducts = response.data.filter((product: Product) => 
          product.packageSize === 'single'
        );
        setProducts(singleProducts);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Find specific products
  const maleProduct = products.find(p => p.category === 'male');
  const femaleProduct = products.find(p => p.category === 'female');
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* Trust Badges Section */}
      <section className="relative z-20 pb-12 pt-12 bg-white -mt-32">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              {
                icon: Star,
                text: "Premium Quality",
                sub: "Medical-grade materials",
              },
              {
                icon: ShieldCheck,
                text: "Body Safe",
                sub: "100% Phthalate-free",
              },
              {
                icon: CheckCircle2,
                text: "Discreet Shipping",
                sub: "Plain packaging",
              },
              {
                icon: Heart,
                text: "Satisfaction Guarantee",
                sub: "30-day returns",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center p-2"
              >
                <div className="p-3 bg-primary/5 rounded-full text-primary mb-3">
                  <item.icon className="h-6 w-6" />
                </div>
                <h4 className="font-semibold text-text-primary">
                  {item.text}
                </h4>
                <p className="text-sm text-text-secondary">
                  {item.sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Explore Genie Section */}
      <ExploreSection />

      {/* Philosophy Section */}
      <PhilosophySection />

      {/* Social Proof */}
      <section className="relative py-20 bg-white overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-display font-bold mb-4 text-primary">
              Loved by Our Community
            </h2>
            <p className="text-muted-foreground">
              Don't just take our word for it. Here's what Genie users are saying.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                text: "Game changer! I feel more confident and energetic. The taste is actually pleasant too.",
                author: "Sarah M.",
                role: "Verified Buyer",
              },
              {
                text: "Been using for 3 months now. Definitely notice a difference in my energy levels.",
                author: "Mike R.",
                role: "Long-time Customer",
              },
              {
                text: "Love the subscription option. Never have to worry about running out!",
                author: "Jessica L.",
                role: "Verified Buyer",
              },
            ].map((review, i) => (
              <div
                key={i}
                className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 relative"
              >
                <div className="text-yellow-400 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="inline-block h-4 w-4 fill-current"
                    />
                  ))}
                </div>
                <p className="text-foreground/80 mb-6 italic">
                  "{review.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {review.author[0]}
                  </div>
                  <div>
                    <h5 className="font-bold text-sm">
                      {review.author}
                    </h5>
                    <span className="text-xs text-muted-foreground">
                      {review.role}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/testimonials">
              <Button variant="outline">
                View All Reviews
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <BlogSection />

      {/* Newsletter */}
      <NewsletterSection />

      {/* Affiliate Program CTA */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Earn with Genie
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Join our affiliate program and earn competitive commissions while empowering others to feel their best.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/affiliate" 
                className="bg-primary text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                Learn More <ArrowRight className="h-5 w-5" />
              </Link>
              <Link 
                href="/account/affiliate" 
                className="border border-gray-300 bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors shadow-md"
              >
                Apply Now
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}