'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Menu, X, ShoppingCart, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { Button } from '@/components/ui/button';
import { createLoginUrl, getCurrentPath } from '@/lib/redirect-utils';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { getItemCount } = useCart();
  const cartItemCount = getItemCount();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-default bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
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

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/shop" className="text-text-primary hover:text-primary transition-colors">
              Shop
            </Link>

            <div className="relative group">
              <button className="text-text-primary hover:text-primary transition-colors">
                Community
              </button>
              <div className="absolute top-full left-0 mt-2 w-48 bg-surface border border-border-default rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <Link href="/blog" className="block px-4 py-2 text-sm text-text-primary hover:bg-background rounded-t-lg">
                  Blog
                </Link>
                <Link href="/testimonials" className="block px-4 py-2 text-sm text-text-primary hover:bg-background">
                  Testimonials
                </Link>
                <Link href="/affiliate" className="block px-4 py-2 text-sm text-text-primary hover:bg-background rounded-b-lg">
                  Affiliate Program
                </Link>
              </div>
            </div>

            <Link href="/science" className="text-text-primary hover:text-primary transition-colors">
              The Science
            </Link>
            <Link href="/about" className="text-text-primary hover:text-primary transition-colors">
              About
            </Link>
          </nav>

          {/* Right side icons */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 text-text-primary hover:text-primary transition-colors"
                >
                  <User className="h-5 w-5" />
                  <span className="hidden md:inline text-sm">
                    {user?.firstName || 'Account'}
                  </span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-surface border border-border-default rounded-lg shadow-lg">
                    <div className="p-4 border-b border-border-default">
                      <p className="text-sm font-semibold text-text-primary">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-text-secondary">{user?.email}</p>
                    </div>
                    <div className="p-2">
                      <Link
                        href="/account"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-background rounded-lg transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        Account Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-background rounded-lg transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                href={mounted ? createLoginUrl(getCurrentPath()) : '/login'} 
                className="text-text-primary hover:text-primary transition-colors"
              >
                <User className="h-5 w-5" />
              </Link>
            )}
            <Link href="/cart" className="text-text-primary hover:text-primary transition-colors relative">
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 h-4 w-4 bg-accent text-xs font-medium text-white rounded-full flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-text-primary hover:text-primary transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border-default">
            <nav className="flex flex-col space-y-4">
              <Link href="/shop" className="text-text-primary hover:text-primary transition-colors">
                Shop
              </Link>
              <Link href="/blog" className="text-text-primary hover:text-primary transition-colors">
                Blog
              </Link>
              <Link href="/testimonials" className="text-text-primary hover:text-primary transition-colors">
                Testimonials
              </Link>
              <Link href="/affiliate" className="text-text-primary hover:text-primary transition-colors">
                Affiliate Program
              </Link>
              <Link href="/science" className="text-text-primary hover:text-primary transition-colors">
                The Science
              </Link>
              <Link href="/about" className="text-text-primary hover:text-primary transition-colors">
                About
              </Link>
              {isAuthenticated ? (
                <>
                  <Link href="/account" className="text-text-primary hover:text-primary transition-colors">
                    Account
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-left text-text-primary hover:text-primary transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link 
                  href={mounted ? createLoginUrl(getCurrentPath()) : '/login'} 
                  className="text-text-primary hover:text-primary transition-colors"
                >
                  Login
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}