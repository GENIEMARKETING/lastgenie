import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-surface border-t border-border-default">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/images/brand/logo.png"
                alt="Genie Logo"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
              <span className="font-display text-xl font-bold text-primary">Genie</span>
            </Link>
            <p className="text-text-secondary text-sm">
              Modern sexual wellness drinks designed to enhance your vitality and connection.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-text-secondary hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-text-secondary hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-text-secondary hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div className="space-y-4">
            <h3 className="font-display font-semibold text-text-primary">Shop</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/shop/genie-for-him" className="text-text-secondary hover:text-primary transition-colors">
                  Genie for Him
                </Link>
              </li>
              <li>
                <Link href="/shop/genie-for-her" className="text-text-secondary hover:text-primary transition-colors">
                  Genie for Her
                </Link>
              </li>
              <li>
                <Link href="/shop" className="text-text-secondary hover:text-primary transition-colors">
                  Shop All
                </Link>
              </li>
            </ul>
          </div>

          {/* Learn */}
          <div className="space-y-4">
            <h3 className="font-display font-semibold text-text-primary">Learn</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/science" className="text-text-secondary hover:text-primary transition-colors">
                  The Science
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-text-secondary hover:text-primary transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-text-secondary hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div className="space-y-4">
            <h3 className="font-display font-semibold text-text-primary">Connect</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-text-secondary hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-text-secondary hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/testimonials" className="text-text-secondary hover:text-primary transition-colors">
                  Testimonials
                </Link>
              </li>
              <li>
                <Link href="/affiliate" className="text-text-secondary hover:text-primary transition-colors">
                  Affiliate Program
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-8 border-t border-border-default flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex space-x-6 text-sm">
            <Link href="/privacy-policy" className="text-text-secondary hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="text-text-secondary hover:text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
          <p className="text-text-secondary text-sm">
            © 2024 Genie. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}