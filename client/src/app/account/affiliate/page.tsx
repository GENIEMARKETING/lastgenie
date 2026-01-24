'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  getAffiliateStatus, 
  getAffiliateLinks, 
  submitAffiliateApplication,
  AffiliateStatus as ApiAffiliateStatus,
  AffiliateLinks as ApiAffiliateLinks
} from '@/lib/api/affiliate';
import { 
  Users, 
  DollarSign, 
  MousePointerClick, 
  TrendingUp, 
  Copy,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  Shield,
  Zap,
  Target,
  Calendar,
  CreditCard,
  BarChart3,
  Gift,
  Award,
  HelpCircle,
  FileText,
  Megaphone,
  Star
} from 'lucide-react';

interface AffiliateStatus {
  isAffiliate: boolean;
  affiliate?: {
    id: string;
    referralCode: string;
    status: string;
    commissionRate: number;
    totalClicks: number;
    totalConversions: number;
    totalEarnings: number;
    pendingEarnings: number;
    paidEarnings: number;
    payoutThreshold: number;
    createdAt: string;
  };
  application?: {
    id: string;
    status: string;
    createdAt: string;
    reviewedAt?: string;
    adminNotes?: string;
  };
}

interface AffiliateLinks {
  referralCode: string;
  links: {
    homepage: string;
    shop: string;
    maleProduct: string;
    femaleProduct: string;
    customizable: string;
  };
}

export default function AffiliatePage() {
  const { user } = useAuth();
  const [affiliateStatus, setAffiliateStatus] = useState<AffiliateStatus | null>(null);
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLinks | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Application form state
  const [formData, setFormData] = useState({
    reason: '',
    experience: '',
    marketingChannels: ''
  });

  useEffect(() => {
    fetchAffiliateStatus();
  }, []);

  const fetchAffiliateStatus = async () => {
    try {
      const response = await getAffiliateStatus();
      
      if (response.success && response.data) {
        // Map the API response to the local interface format
        const mappedStatus: AffiliateStatus = {
          isAffiliate: response.data.isAffiliate,
          affiliate: response.data.affiliate ? {
            id: response.data.affiliate.id,
            referralCode: response.data.affiliate.referralCode,
            status: response.data.affiliate.isActive ? 'active' : 'inactive',
            commissionRate: response.data.affiliate.commissionRate,
            totalClicks: 0, // Will be populated from dashboard
            totalConversions: 0, // Will be populated from dashboard
            totalEarnings: 0, // Will be populated from dashboard
            pendingEarnings: 0, // Will be populated from dashboard
            paidEarnings: 0, // Will be populated from dashboard
            payoutThreshold: 50, // Default threshold
            createdAt: response.data.affiliate.createdAt
          } : undefined,
          application: response.data.application ? {
            id: response.data.application.id,
            status: response.data.application.status,
            createdAt: response.data.application.createdAt,
            reviewedAt: response.data.application.updatedAt,
            adminNotes: undefined
          } : undefined
        };
        
        setAffiliateStatus(mappedStatus);
        
        // If user is an affiliate, fetch their links
        if (mappedStatus.isAffiliate) {
          fetchAffiliateLinks();
        }
      } else {
        setError('Failed to fetch affiliate status');
      }
    } catch (err) {
      setError('Failed to fetch affiliate status');
    } finally {
      setLoading(false);
    }
  };

  const fetchAffiliateLinks = async () => {
    try {
      const response = await getAffiliateLinks();
      
      if (response.success && response.data) {
        // Map the API response to the local interface format
        const mappedLinks: AffiliateLinks = {
          referralCode: response.data.referralCode,
          links: {
            homepage: response.data.links.find(l => l.name === 'Homepage')?.url || '',
            shop: response.data.links.find(l => l.name === 'Shop')?.url || '',
            maleProduct: response.data.links.find(l => l.name === 'Genie for Him')?.url || '',
            femaleProduct: response.data.links.find(l => l.name === 'Genie for Her')?.url || '',
            customizable: response.data.baseUrl + '?ref=' + response.data.referralCode
          }
        };
        setAffiliateLinks(mappedLinks);
      }
    } catch (err) {
      console.error('Failed to fetch affiliate links:', err);
    }
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await submitAffiliateApplication({
        reason: formData.reason,
        experience: formData.experience,
        marketingChannels: formData.marketingChannels
      });

      if (response.success) {
        // Refresh status to show pending application
        await fetchAffiliateStatus();
      } else {
        setError(response.error || 'Failed to submit application');
      }
    } catch (err) {
      setError('Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = async (text: string, linkType: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(linkType);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show application form if user is not an affiliate and has no pending application
  if (!affiliateStatus?.isAffiliate && !affiliateStatus?.application) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">
            Become an Affiliate
          </h1>
          <p className="text-text-secondary mt-2">
            Join our affiliate program and earn commissions by promoting Genie products
          </p>
        </div>

        {/* Program Overview */}
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border border-border-default rounded-lg p-6">
          <div className="text-center mb-6">
            <Star className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-display font-bold text-text-primary mb-2">
              Welcome to the Genie Affiliate Program
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Partner with us to promote premium sexual wellness products and earn generous commissions. 
              Our affiliate program is designed for content creators, influencers, and wellness advocates 
              who want to help others enhance their intimate relationships while building a sustainable income stream.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-surface/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-primary">10-15%</div>
              <div className="text-sm text-text-secondary">Commission Rate</div>
            </div>
            <div className="bg-surface/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-secondary">30 Days</div>
              <div className="text-sm text-text-secondary">Cookie Duration</div>
            </div>
            <div className="bg-surface/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-accent">$50</div>
              <div className="text-sm text-text-secondary">Min. Payout</div>
            </div>
          </div>
        </div>

        {/* Enhanced Benefits Section */}
        <div className="bg-surface border border-border-default rounded-lg p-6">
          <h2 className="text-xl font-display font-semibold text-text-primary mb-6">
            Why Join Our Affiliate Program?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <DollarSign className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-text-primary mb-1">High Commission Rates</h3>
                <p className="text-sm text-text-secondary">
                  Earn 10% on single bottles ($1.00) and 12% on 12-packs ($11.88) with performance bonuses up to 15%
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <BarChart3 className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-text-primary mb-1">Real-time Analytics</h3>
                <p className="text-sm text-text-secondary">
                  Track clicks, conversions, earnings, and performance metrics with detailed dashboard analytics
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CreditCard className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-text-primary mb-1">Automated Payouts</h3>
                <p className="text-sm text-text-secondary">
                  Monthly payments via Stripe Connect with $50 minimum threshold and 2-3 day processing
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Megaphone className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-text-primary mb-1">Marketing Resources</h3>
                <p className="text-sm text-text-secondary">
                  Access to promotional materials, product images, brand guidelines, and content creation support
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Award className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-text-primary mb-1">Performance Bonuses</h3>
                <p className="text-sm text-text-secondary">
                  Unlock higher commission rates with our tier system: Silver (+2%) and Gold (+5%) levels
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Shield className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-text-primary mb-1">Trusted Brand</h3>
                <p className="text-sm text-text-secondary">
                  Promote premium, safe, and effective products with excellent customer satisfaction ratings
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Commission Structure */}
        <div className="bg-surface border border-border-default rounded-lg p-6">
          <h2 className="text-xl font-display font-semibold text-text-primary mb-6">
            Commission Structure & Rates
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Base Rates */}
            <div>
              <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Base Commission Rates
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                  <div>
                    <div className="font-medium text-text-primary">Single Bottles (50ML)</div>
                    <div className="text-sm text-text-secondary">$10.00 product price</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">10%</div>
                    <div className="text-sm text-text-secondary">$1.00 per sale</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                  <div>
                    <div className="font-medium text-text-primary">12-Pack Bundle</div>
                    <div className="text-sm text-text-secondary">$99.00 product price</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-secondary">12%</div>
                    <div className="text-sm text-text-secondary">$11.88 per sale</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Performance Tiers */}
            <div>
              <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Performance Tiers
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-background rounded-lg border-l-4 border-gray-400">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-text-primary">Bronze Level</div>
                      <div className="text-sm text-text-secondary">0-10 sales per month</div>
                    </div>
                    <div className="text-sm font-medium text-text-primary">Base rates</div>
                  </div>
                </div>
                
                <div className="p-3 bg-background rounded-lg border-l-4 border-gray-300">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-text-primary">Silver Level</div>
                      <div className="text-sm text-text-secondary">11-25 sales per month</div>
                    </div>
                    <div className="text-sm font-medium text-secondary">+2% bonus</div>
                  </div>
                </div>
                
                <div className="p-3 bg-background rounded-lg border-l-4 border-amber-400">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-text-primary">Gold Level</div>
                      <div className="text-sm text-text-secondary">26+ sales per month</div>
                    </div>
                    <div className="text-sm font-medium text-accent">+5% bonus</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Commission Examples */}
          <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-4">
            <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Monthly Earnings Examples
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-bold text-lg text-text-primary">$50</div>
                <div className="text-text-secondary">5 single bottles</div>
                <div className="text-xs text-text-secondary mt-1">Bronze tier</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-secondary">$250</div>
                <div className="text-text-secondary">15 single + 5 bundles</div>
                <div className="text-xs text-text-secondary mt-1">Silver tier (+2%)</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-accent">$500+</div>
                <div className="text-text-secondary">30+ mixed sales</div>
                <div className="text-xs text-text-secondary mt-1">Gold tier (+5%)</div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-blue-800 mb-1">Attribution Model</div>
                <div className="text-blue-700">
                  We use a 30-day cookie duration with last-click attribution. Customers who click your link 
                  have 30 days to make a purchase, and you'll earn commission on their first order within that window.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payout Methods */}
        <div className="bg-surface border border-border-default rounded-lg p-6">
          <h2 className="text-xl font-display font-semibold text-text-primary mb-6">
            Payout Methods & Schedule
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Method */}
            <div>
              <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Payment Method
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-text-primary">Stripe Connect</div>
                      <div className="text-sm text-text-secondary">Automated & Secure</div>
                    </div>
                  </div>
                  <ul className="text-sm text-text-secondary space-y-1 ml-11">
                    <li>• Direct bank transfers worldwide</li>
                    <li>• Automatic monthly payouts</li>
                    <li>• Real-time payout tracking</li>
                    <li>• Tax document generation</li>
                  </ul>
                </div>
                
                <div className="text-sm text-text-secondary">
                  <strong>Setup Required:</strong> You'll need to complete Stripe Connect onboarding 
                  after your affiliate application is approved. This includes identity verification 
                  and bank account details.
                </div>
              </div>
            </div>
            
            {/* Payout Schedule */}
            <div>
              <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Payout Schedule
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-background rounded-lg text-center">
                    <div className="font-bold text-2xl text-primary">$50</div>
                    <div className="text-sm text-text-secondary">Minimum Threshold</div>
                  </div>
                  <div className="p-3 bg-background rounded-lg text-center">
                    <div className="font-bold text-2xl text-secondary">Monthly</div>
                    <div className="text-sm text-text-secondary">Payout Frequency</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">1</span>
                    </div>
                    <div>
                      <div className="font-medium text-text-primary">1st of Each Month</div>
                      <div className="text-sm text-text-secondary">Automatic payout initiation</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                    <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-secondary">2-3</span>
                    </div>
                    <div>
                      <div className="font-medium text-text-primary">Business Days</div>
                      <div className="text-sm text-text-secondary">Processing time to your account</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Additional Payout Info */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-green-800 mb-1">International Support</div>
                  <div className="text-green-700">
                    Stripe Connect supports payouts to bank accounts in 40+ countries with 
                    automatic currency conversion.
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <FileText className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-amber-800 mb-1">Tax Considerations</div>
                  <div className="text-amber-700">
                    You'll receive 1099 forms for US affiliates earning $600+ annually. 
                    International affiliates receive payment summaries.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Registration Process */}
        <div className="bg-surface border border-border-default rounded-lg p-6">
          <h2 className="text-xl font-display font-semibold text-text-primary mb-6">
            How to Join - Step by Step
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Requirements */}
            <div>
              <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Requirements Checklist
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-text-primary">Age Requirement</div>
                    <div className="text-sm text-text-secondary">Must be 18+ years old</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-text-primary">Genie Account</div>
                    <div className="text-sm text-text-secondary">Valid customer account required</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-text-primary">Marketing Platform</div>
                    <div className="text-sm text-text-secondary">Active social media, blog, or website</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-text-primary">Content Alignment</div>
                    <div className="text-sm text-text-secondary">Wellness, lifestyle, or relationship content</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Process Steps */}
            <div>
              <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Application Process
              </h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                    1
                  </div>
                  <div>
                    <div className="font-medium text-text-primary">Submit Application</div>
                    <div className="text-sm text-text-secondary">Complete the form below with your details</div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-white text-sm font-bold">
                    2
                  </div>
                  <div>
                    <div className="font-medium text-text-primary">Admin Review</div>
                    <div className="text-sm text-text-secondary">We review within 3-5 business days</div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white text-sm font-bold">
                    3
                  </div>
                  <div>
                    <div className="font-medium text-text-primary">Approval Notification</div>
                    <div className="text-sm text-text-secondary">Email confirmation with next steps</div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                    4
                  </div>
                  <div>
                    <div className="font-medium text-text-primary">Stripe Connect Setup</div>
                    <div className="text-sm text-text-secondary">Complete payout account verification</div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    5
                  </div>
                  <div>
                    <div className="font-medium text-text-primary">Start Earning</div>
                    <div className="text-sm text-text-secondary">Access dashboard and referral links</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Approval Criteria */}
          <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-4">
            <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              What We Look For
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-text-primary mb-2">Content Quality</div>
                <ul className="text-text-secondary space-y-1">
                  <li>• Professional presentation</li>
                  <li>• Engaged audience</li>
                  <li>• Regular content creation</li>
                </ul>
              </div>
              <div>
                <div className="font-medium text-text-primary mb-2">Brand Alignment</div>
                <ul className="text-text-secondary space-y-1">
                  <li>• Wellness & lifestyle focus</li>
                  <li>• Positive community values</li>
                  <li>• Professional communication</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Marketing Guidelines */}
        <div className="bg-surface border border-border-default rounded-lg p-6">
          <h2 className="text-xl font-display font-semibold text-text-primary mb-6">
            Marketing Resources & Guidelines
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Available Resources */}
            <div>
              <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                Available Resources
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium text-text-primary">Product Images</div>
                    <div className="text-sm text-text-secondary">High-resolution product photos & lifestyle shots</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                  <Megaphone className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium text-text-primary">Social Media Templates</div>
                    <div className="text-sm text-text-secondary">Ready-to-use posts for Instagram, Facebook, Twitter</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium text-text-primary">Product Information</div>
                    <div className="text-sm text-text-secondary">Detailed specs, benefits, and usage guidelines</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                  <Star className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium text-text-primary">Brand Guidelines</div>
                    <div className="text-sm text-text-secondary">Logo usage, colors, fonts, and messaging</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Best Practices */}
            <div>
              <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Marketing Best Practices
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="font-medium text-text-primary mb-2">Content Creation Tips</div>
                  <ul className="text-sm text-text-secondary space-y-1">
                    <li>• Focus on wellness and relationship benefits</li>
                    <li>• Share authentic personal experiences</li>
                    <li>• Use lifestyle imagery and storytelling</li>
                    <li>• Include clear calls-to-action</li>
                  </ul>
                </div>
                
                <div>
                  <div className="font-medium text-text-primary mb-2">Social Media Strategy</div>
                  <ul className="text-sm text-text-secondary space-y-1">
                    <li>• Post during peak engagement hours</li>
                    <li>• Use relevant wellness hashtags</li>
                    <li>• Engage with your community</li>
                    <li>• Share educational content</li>
                  </ul>
                </div>
                
                <div>
                  <div className="font-medium text-text-primary mb-2">Compliance Requirements</div>
                  <ul className="text-sm text-text-secondary space-y-1">
                    <li>• Always disclose affiliate relationships</li>
                    <li>• Follow FTC guidelines (#ad, #affiliate)</li>
                    <li>• Respect age-restricted content rules</li>
                    <li>• Maintain professional standards</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          {/* Success Tips */}
          <div className="bg-gradient-to-r from-secondary/5 to-accent/5 rounded-lg p-4">
            <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Zap className="h-5 w-5 text-secondary" />
              Success Tips from Top Performers
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium text-text-primary mb-1">Build Trust</div>
                <div className="text-text-secondary">Share honest reviews and personal experiences with the products</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-text-primary mb-1">Educate First</div>
                <div className="text-text-secondary">Provide valuable wellness content before promoting products</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-text-primary mb-1">Be Consistent</div>
                <div className="text-text-secondary">Regular posting and engagement leads to better conversion rates</div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-surface border border-border-default rounded-lg p-6">
          <h2 className="text-xl font-display font-semibold text-text-primary mb-6">
            Frequently Asked Questions
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-start gap-2 mb-2">
                  <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="font-semibold text-text-primary">How long does approval take?</div>
                </div>
                <p className="text-sm text-text-secondary ml-7">
                  We typically review applications within 3-5 business days. You'll receive an email 
                  notification once your application has been reviewed.
                </p>
              </div>
              
              <div>
                <div className="flex items-start gap-2 mb-2">
                  <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="font-semibold text-text-primary">When do I get paid?</div>
                </div>
                <p className="text-sm text-text-secondary ml-7">
                  Payouts are processed monthly on the 1st of each month for earnings above $50. 
                  Payments typically arrive within 2-3 business days via Stripe Connect.
                </p>
              </div>
              
              <div>
                <div className="flex items-start gap-2 mb-2">
                  <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="font-semibold text-text-primary">Can I promote on social media?</div>
                </div>
                <p className="text-sm text-text-secondary ml-7">
                  Yes! Social media is encouraged. Just remember to include proper affiliate disclosures 
                  (#ad, #affiliate) and follow each platform's advertising policies.
                </p>
              </div>
              
              <div>
                <div className="flex items-start gap-2 mb-2">
                  <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="font-semibold text-text-primary">What if my application is rejected?</div>
                </div>
                <p className="text-sm text-text-secondary ml-7">
                  We'll provide feedback on why your application wasn't approved. You can reapply 
                  after addressing the concerns, typically after 30 days.
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-start gap-2 mb-2">
                  <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="font-semibold text-text-primary">How do referral links work?</div>
                </div>
                <p className="text-sm text-text-secondary ml-7">
                  Each affiliate gets a unique referral code (e.g., GENIE1234ABCD). When someone clicks 
                  your link, we set a 30-day cookie to track their purchase.
                </p>
              </div>
              
              <div>
                <div className="flex items-start gap-2 mb-2">
                  <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="font-semibold text-text-primary">Can I buy products for myself?</div>
                </div>
                <p className="text-sm text-text-secondary ml-7">
                  Yes, you can purchase products for personal use, but you cannot earn commissions 
                  on your own purchases (self-referrals are blocked).
                </p>
              </div>
              
              <div>
                <div className="flex items-start gap-2 mb-2">
                  <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="font-semibold text-text-primary">How do I track my performance?</div>
                </div>
                <p className="text-sm text-text-secondary ml-7">
                  Your affiliate dashboard shows real-time clicks, conversions, earnings, and detailed 
                  analytics. You can access it from your account menu.
                </p>
              </div>
              
              <div>
                <div className="flex items-start gap-2 mb-2">
                  <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="font-semibold text-text-primary">What support is available?</div>
                </div>
                <p className="text-sm text-text-secondary ml-7">
                  We provide marketing materials, product training, performance tips, and dedicated 
                  affiliate support via email. Top performers get priority support.
                </p>
              </div>
            </div>
          </div>
          
          {/* Contact Support */}
          <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <div>
                <div className="font-semibold text-text-primary">Need More Information?</div>
                <div className="text-sm text-text-secondary">
                  Contact our affiliate support team at{' '}
                  <a href="mailto:affiliates@genie.com" className="text-primary hover:underline">
                    affiliates@genie.com
                  </a>
                  {' '}for personalized assistance.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Application Form */}
        <div className="bg-surface border border-border-default rounded-lg p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-display font-bold text-text-primary mb-2">
              Ready to Start Earning?
            </h2>
            <p className="text-text-secondary">
              Complete the application below to join our affiliate program. All fields marked with * are required.
            </p>
          </div>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmitApplication} className="space-y-4">
            <div>
              <Label htmlFor="reason">Why do you want to become a Genie affiliate? *</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Share your passion for wellness, why you believe in our products, and how you plan to help others discover Genie..."
                rows={4}
                required
              />
              <p className="text-xs text-text-secondary mt-1">
                Tell us about your connection to wellness and why you want to promote Genie products.
              </p>
            </div>

            <div>
              <Label htmlFor="experience">Marketing & Affiliate Experience</Label>
              <Textarea
                id="experience"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                placeholder="Describe your experience with affiliate marketing, content creation, social media, blogging, or any relevant marketing background..."
                rows={3}
              />
              <p className="text-xs text-text-secondary mt-1">
                Optional: Help us understand your marketing background and experience level.
              </p>
            </div>

            <div>
              <Label htmlFor="marketingChannels">How will you promote Genie products? *</Label>
              <Textarea
                id="marketingChannels"
                value={formData.marketingChannels}
                onChange={(e) => setFormData({ ...formData, marketingChannels: e.target.value })}
                placeholder="Describe your marketing channels: Instagram (@username), TikTok, blog (URL), YouTube channel, email list size, etc..."
                rows={4}
                required
              />
              <p className="text-xs text-text-secondary mt-1">
                Be specific about your platforms, audience size, and how you plan to promote our products.
              </p>
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Show pending application status
  if (affiliateStatus?.application && !affiliateStatus.isAffiliate) {
    const application = affiliateStatus.application;
    
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">
            Affiliate Application
          </h1>
          <p className="text-text-secondary mt-2">
            Your affiliate application status
          </p>
        </div>

        <div className="bg-surface border border-border-default rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            {application.status === 'pending' && <Clock className="h-6 w-6 text-yellow-500" />}
            {application.status === 'approved' && <CheckCircle className="h-6 w-6 text-green-500" />}
            {application.status === 'rejected' && <AlertCircle className="h-6 w-6 text-red-500" />}
            
            <div>
              <h2 className="text-xl font-display font-semibold text-text-primary">
                Application {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
              </h2>
              <p className="text-sm text-text-secondary">
                Submitted on {new Date(application.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {application.status === 'pending' && (
            <p className="text-text-secondary">
              Your application is currently under review. We typically review applications within 3-5 business days.
            </p>
          )}

          {application.status === 'rejected' && application.adminNotes && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">Admin Notes:</h3>
              <p className="text-red-700">{application.adminNotes}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show affiliate dashboard
  if (affiliateStatus?.isAffiliate && affiliateStatus.affiliate) {
    const affiliate = affiliateStatus.affiliate;
    const conversionRate = affiliate.totalClicks > 0 
      ? ((affiliate.totalConversions / affiliate.totalClicks) * 100).toFixed(2)
      : '0.00';

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">
            Affiliate Dashboard
          </h1>
          <p className="text-text-secondary mt-2">
            Track your performance and manage your affiliate links
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-surface border border-border-default rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Total Clicks</p>
                <p className="text-3xl font-bold text-text-primary">{affiliate.totalClicks}</p>
              </div>
              <MousePointerClick className="h-12 w-12 text-primary opacity-20" />
            </div>
          </div>

          <div className="bg-surface border border-border-default rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Conversions</p>
                <p className="text-3xl font-bold text-text-primary">{affiliate.totalConversions}</p>
              </div>
              <TrendingUp className="h-12 w-12 text-primary opacity-20" />
            </div>
          </div>

          <div className="bg-surface border border-border-default rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Conversion Rate</p>
                <p className="text-3xl font-bold text-text-primary">{conversionRate}%</p>
              </div>
              <Users className="h-12 w-12 text-primary opacity-20" />
            </div>
          </div>

          <div className="bg-surface border border-border-default rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Total Earnings</p>
                <p className="text-3xl font-bold text-text-primary">${affiliate.totalEarnings.toFixed(2)}</p>
              </div>
              <DollarSign className="h-12 w-12 text-primary opacity-20" />
            </div>
          </div>
        </div>

        {/* Earnings Breakdown */}
        <div className="bg-surface border border-border-default rounded-lg p-6">
          <h2 className="text-xl font-display font-semibold text-text-primary mb-4">
            Earnings Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">${affiliate.pendingEarnings.toFixed(2)}</p>
              <p className="text-sm text-text-secondary">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">${affiliate.paidEarnings.toFixed(2)}</p>
              <p className="text-sm text-text-secondary">Paid Out</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">${affiliate.payoutThreshold.toFixed(2)}</p>
              <p className="text-sm text-text-secondary">Payout Threshold</p>
            </div>
          </div>
        </div>

        {/* Affiliate Links */}
        {affiliateLinks && (
          <div className="bg-surface border border-border-default rounded-lg p-6">
            <h2 className="text-xl font-display font-semibold text-text-primary mb-4">
              Your Affiliate Links
            </h2>
            <div className="space-y-4">
              <div>
                <Label>Referral Code</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input value={affiliateLinks.referralCode} readOnly />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(affiliateLinks.referralCode, 'code')}
                  >
                    {copiedLink === 'code' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Homepage Link</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={affiliateLinks.links.homepage} readOnly className="text-xs" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(affiliateLinks.links.homepage, 'homepage')}
                    >
                      {copiedLink === 'homepage' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(affiliateLinks.links.homepage, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Shop Link</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={affiliateLinks.links.shop} readOnly className="text-xs" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(affiliateLinks.links.shop, 'shop')}
                    >
                      {copiedLink === 'shop' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(affiliateLinks.links.shop, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Male Product Link</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={affiliateLinks.links.maleProduct} readOnly className="text-xs" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(affiliateLinks.links.maleProduct, 'male')}
                    >
                      {copiedLink === 'male' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(affiliateLinks.links.maleProduct, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Female Product Link</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={affiliateLinks.links.femaleProduct} readOnly className="text-xs" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(affiliateLinks.links.femaleProduct, 'female')}
                    >
                      {copiedLink === 'female' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(affiliateLinks.links.femaleProduct, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}