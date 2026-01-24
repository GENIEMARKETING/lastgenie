'use client';

import Link from 'next/link';
import { ShieldCheck, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';

export function PhilosophySection() {
  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1 relative">
            <div className="relative z-10 rounded-2xl overflow-hidden aspect-[4/3] shadow-2xl rotate-2 hover:rotate-0 transition-all duration-500">
              <ImageWithFallback
                src="/images/philosophy/friends-laughing.jpg"
                alt="Friends laughing"
                className="w-full h-full object-cover"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
              />
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-secondary/20 rounded-full blur-3xl" />
          </div>

          <div className="order-1 lg:order-2 space-y-6">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
              Our Philosophy
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-bold leading-tight text-primary">
              Wellness for <br />
              <span className="text-secondary">
                Every Body
              </span>
            </h2>
            <p className="text-lg text-text-secondary leading-relaxed max-w-xl">
              We believe pleasure is a fundamental part of
              wellness. That's why we're dedicated to creating
              a safe, inclusive space where you can explore
              what makes you feel good.
            </p>
            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/5 rounded-lg mt-1">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-text-primary">
                    Uncompromising Safety
                  </h4>
                  <p className="text-text-secondary">
                    Medical-grade silicone and body-safe
                    materials only.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/5 rounded-lg mt-1">
                  <Smile className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-text-primary">
                    Joyfully Inclusive
                  </h4>
                  <p className="text-text-secondary">
                    Products designed for all genders,
                    orientations, and bodies.
                  </p>
                </div>
              </div>
            </div>
            <div className="pt-6">
              <Link href="/about">
                <Button
                  variant="primary"
                  size="lg"
                  className="font-bold"
                >
                  Read Our Story
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}