import Link from 'next/link';
import { 
  ArrowRight, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Shield, 
  Zap, 
  Target, 
  Calendar, 
  CreditCard, 
  BarChart3, 
  Gift, 
  Award, 
  HelpCircle, 
  CheckCircle, 
  Star,
  Megaphone,
  FileText,
  Globe,
  Handshake
} from 'lucide-react';

export default function AffiliatePage() {
  const benefits = [
    {
      icon: DollarSign,
      title: 'Competitive Commissions',
      description: 'Earn 10% on single bottles and 12% on 12-packs, with tier bonuses up to 17%'
    },
    {
      icon: TrendingUp,
      title: 'Growing Market',
      description: 'Sexual wellness is a $15B+ industry with 30% annual growth'
    },
    {
      icon: Shield,
      title: 'Trusted Brand',
      description: 'Partner with a premium brand focused on quality and customer satisfaction'
    },
    {
      icon: Zap,
      title: 'Fast Payouts',
      description: 'Monthly automated payouts via Stripe Connect with $50 minimum threshold'
    }
  ];

  const commissionTiers = [
    {
      tier: 'Bronze',
      sales: '$0 - $999',
      commission: '10% / 12%',
      bonus: '+0%',
      color: 'text-amber-600'
    },
    {
      tier: 'Silver',
      sales: '$1,000 - $4,999',
      commission: '12% / 14%',
      bonus: '+2%',
      color: 'text-gray-500'
    },
    {
      tier: 'Gold',
      sales: '$5,000+',
      commission: '15% / 17%',
      bonus: '+5%',
      color: 'text-yellow-500'
    }
  ];

  const steps = [
    {
      step: 1,
      title: 'Apply',
      description: 'Complete our simple application form with your marketing experience and audience details'
    },
    {
      step: 2,
      title: 'Get Approved',
      description: 'Our team reviews applications within 2-3 business days and provides feedback'
    },
    {
      step: 3,
      title: 'Start Earning',
      description: 'Receive your unique referral code and access to marketing resources'
    }
  ];

  const faqs = [
    {
      question: 'How much can I earn?',
      answer: 'Earnings vary by effort and audience. Top affiliates earn $500-2000+ monthly. With 10-17% commissions and growing demand, the potential is significant.'
    },
    {
      question: 'What marketing support do you provide?',
      answer: 'We provide high-quality product images, educational content, email templates, social media assets, and dedicated affiliate support.'
    },
    {
      question: 'How do I get paid?',
      answer: 'Monthly automated payouts via Stripe Connect. Minimum $50 threshold. Payments are processed on the 1st of each month.'
    },
    {
      question: 'Can I promote on social media?',
      answer: 'Yes! We encourage authentic promotion across platforms. We provide compliant content and guidelines for each platform.'
    },
    {
      question: 'Is there a minimum sales requirement?',
      answer: 'No minimum sales requirement. However, inactive affiliates (no sales for 6+ months) may be reviewed.'
    },
    {
      question: 'How long do cookies last?',
      answer: '30 days. Customers have a full month to complete their purchase and you\'ll still receive credit.'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah K.',
      role: 'Wellness Blogger',
      text: 'Genie\'s affiliate program has been amazing. The products align perfectly with my audience, and the commission structure is very fair.',
      earnings: '$1,200/month'
    },
    {
      name: 'Mike R.',
      role: 'Fitness Influencer',
      text: 'Great conversion rates and excellent support team. The marketing materials make promotion easy and authentic.',
      earnings: '$800/month'
    },
    {
      name: 'Jessica M.',
      role: 'Relationship Coach',
      text: 'I love that I can genuinely recommend products I believe in. The payouts are reliable and the brand is trustworthy.',
      earnings: '$1,500/month'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.3),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,119,198,0.3),transparent_50%)]" />
        </div>
        
        {/* Content */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="bg-primary/10 p-4 rounded-full">
                <Handshake className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-text-primary mb-6">
              Partner with{' '}
              <span className="bg-gradient-to-r from-genie-blue to-genie-pink bg-clip-text text-transparent">
                Genie
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary mb-8 max-w-3xl mx-auto">
              Join our affiliate program and earn while empowering others. 
              Turn your passion for wellness into profitable partnerships.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/account/affiliate" 
                className="bg-primary text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                Apply Now <ArrowRight className="h-5 w-5" />
              </Link>
              <Link 
                href="#program-details" 
                className="border border-border-default bg-surface/95 backdrop-blur-sm text-text-primary px-8 py-4 rounded-lg font-semibold hover:bg-surface transition-colors shadow-md"
              >
                Learn More
              </Link>
            </div>
            
            {/* Key Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">10-17%</div>
                <div className="text-text-secondary">Commission Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary mb-2">30 Days</div>
                <div className="text-text-secondary">Cookie Duration</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent mb-2">$50</div>
                <div className="text-text-secondary">Minimum Payout</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Partner with Genie */}
      <section id="program-details" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Why Partner with Genie?
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Join a growing community of affiliates earning with a trusted wellness brand
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <div key={index} className="group bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="bg-primary/10 p-4 rounded-full w-fit mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <IconComponent className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-text-primary mb-3 group-hover:text-primary transition-colors">
                    {benefit.title}
                  </h3>
                  <p className="text-text-secondary">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Commission Structure */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Earning Potential
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Competitive commissions with performance-based tier bonuses
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Commission Rates */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 mb-8 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-display text-2xl font-bold text-text-primary mb-6 text-center">
                Base Commission Rates
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                  <div className="text-3xl font-bold text-primary mb-2">10%</div>
                  <div className="text-text-primary font-semibold mb-2">Single Bottles</div>
                  <div className="text-text-secondary">$1 per $10 bottle</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-secondary/5 to-secondary/10 rounded-lg border border-secondary/20">
                  <div className="text-3xl font-bold text-secondary mb-2">12%</div>
                  <div className="text-text-primary font-semibold mb-2">12-Packs</div>
                  <div className="text-text-secondary">$11.88 per $99 pack</div>
                </div>
              </div>
            </div>

            {/* Tier System */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-display text-2xl font-bold text-text-primary mb-6 text-center">
                Performance Tiers
              </h3>
              <div className="space-y-4">
                {commissionTiers.map((tier, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${tier.color === 'text-amber-600' ? 'bg-amber-600' : tier.color === 'text-gray-500' ? 'bg-gray-500' : 'bg-yellow-500'}`} />
                      <div>
                        <div className={`font-semibold ${tier.color}`}>{tier.tier}</div>
                        <div className="text-text-secondary text-sm">{tier.sales} monthly sales</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-text-primary">{tier.commission}</div>
                      <div className="text-text-secondary text-sm">{tier.bonus} tier bonus</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Success Stories
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Real affiliates sharing their experience with our program
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="group bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-text-primary mb-4 italic leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center justify-between border-t pt-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                      {testimonial.name[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-text-primary">{testimonial.name}</div>
                      <div className="text-sm text-text-secondary">{testimonial.role}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-primary">{testimonial.earnings}</div>
                    <div className="text-xs text-text-secondary">avg. monthly</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Getting Started is Simple
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Join our affiliate program in three easy steps
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <div key={index} className="text-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                  <div className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
                    {step.step}
                  </div>
                  <h3 className="font-display text-xl font-bold text-text-primary mb-3">
                    {step.title}
                  </h3>
                  <p className="text-text-secondary">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link 
                href="/account/affiliate" 
                className="bg-primary text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors inline-flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                Start Your Application <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Marketing Resources */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Marketing Support
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Everything you need to promote Genie successfully
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="group text-center p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="bg-primary/10 p-4 rounded-full w-fit mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-text-primary mb-2 group-hover:text-primary transition-colors">Content Library</h3>
              <p className="text-text-secondary text-sm">Product images, videos, and educational content</p>
            </div>
            <div className="group text-center p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="bg-secondary/10 p-4 rounded-full w-fit mx-auto mb-4 group-hover:bg-secondary/20 transition-colors">
                <Megaphone className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="font-semibold text-text-primary mb-2 group-hover:text-secondary transition-colors">Social Templates</h3>
              <p className="text-text-secondary text-sm">Ready-to-use posts for Instagram, Facebook, and more</p>
            </div>
            <div className="group text-center p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="bg-accent/10 p-4 rounded-full w-fit mx-auto mb-4 group-hover:bg-accent/20 transition-colors">
                <Globe className="h-8 w-8 text-accent" />
              </div>
              <h3 className="font-semibold text-text-primary mb-2 group-hover:text-accent transition-colors">Email Templates</h3>
              <p className="text-text-secondary text-sm">Professional email campaigns and sequences</p>
            </div>
            <div className="group text-center p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="bg-primary/10 p-4 rounded-full w-fit mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-text-primary mb-2 group-hover:text-primary transition-colors">Dedicated Support</h3>
              <p className="text-text-secondary text-sm">Personal affiliate manager and community access</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Everything you need to know about our affiliate program
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="group bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-2 rounded-full flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <HelpCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary mb-3 group-hover:text-primary transition-colors">{faq.question}</h3>
                    <p className="text-text-secondary leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 rounded-2xl p-12 border border-gray-200 shadow-lg">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-6">
              Ready to Start Earning?
            </h2>
            <p className="text-lg text-text-secondary mb-8">
              Join hundreds of affiliates already earning with Genie. 
              Apply today and start your journey to passive income.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/account/affiliate" 
                className="bg-primary text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                Apply for Partnership <ArrowRight className="h-5 w-5" />
              </Link>
              <Link 
                href="/contact" 
                className="border border-gray-300 bg-white text-text-primary px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors shadow-sm hover:shadow-md"
              >
                Contact Us
              </Link>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-text-secondary text-sm">
                Questions? Email us at <a href="mailto:affiliates@genie.com" className="text-primary hover:underline">affiliates@genie.com</a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}