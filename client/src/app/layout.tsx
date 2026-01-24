import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AuthProvider } from "@/lib/auth-context";
import { AgeVerificationProvider } from "@/lib/age-verification-context";
import { CartProvider } from "@/lib/cart-context";
import { GuestCheckoutProvider } from "@/lib/guest-checkout-context";
import { AffiliateProvider } from "@/lib/affiliate-context";
import { AgeVerificationModal } from "@/components/age-verification-modal";
import { ReferralTracker } from "@/components/referral-tracker";
import { AsyncErrorBoundary } from "@/components/error-boundary";
import { ApiDebugPanel } from "@/components/connection-status";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Genie: Unleash Your Potential | Modern Sexual Wellness",
  description: "Discover Genie's sexual enhancer drinks for men and women. Modern, playful, and empowering wellness products designed to enhance your vitality and connection.",
  keywords: ["sexual wellness", "libido enhancer", "natural supplements", "vitality drinks"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AsyncErrorBoundary>
          <AuthProvider>
            <CartProvider>
              <GuestCheckoutProvider>
                <AffiliateProvider>
                  <AgeVerificationProvider>
                    <AgeVerificationModal />
                    <Suspense fallback={null}>
                      <ReferralTracker />
                    </Suspense>
                    <Header />
                    <main className="flex-1">
                      {children}
                    </main>
                    <Footer />
                    <ApiDebugPanel />
                  </AgeVerificationProvider>
                </AffiliateProvider>
              </GuestCheckoutProvider>
            </CartProvider>
          </AuthProvider>
        </AsyncErrorBoundary>
      </body>
    </html>
  );
}
