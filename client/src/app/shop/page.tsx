import { Metadata } from 'next';
import ShopClient from './shop-client';

export const metadata: Metadata = {
  title: 'Shop Genie | Sexual Enhancement Drinks for Men & Women',
  description: 'Shop Genie\'s premium sexual enhancement drinks. Choose from Genie for Him and Genie for Her - scientifically formulated natural supplements for vitality and confidence.',
  keywords: 'sexual enhancement, libido booster, natural supplements, vitality drinks, male enhancement, female enhancement',
  openGraph: {
    title: 'Shop Genie | Sexual Enhancement Drinks',
    description: 'Premium natural sexual enhancement drinks for men and women. Fast-acting, safe, and scientifically formulated.',
    type: 'website'
  }
};

export default function ShopPage() {
  return <ShopClient />;
}