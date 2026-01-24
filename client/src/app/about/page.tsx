import Link from 'next/link';
import { Heart, Sparkles, Users, Shield, Target, Lightbulb, ArrowRight, Handshake } from 'lucide-react';

export default function AboutPage() {
  const values = [
    {
      icon: Sparkles,
      title: 'Empowerment',
      description: 'We believe everyone deserves to feel confident and empowered in their wellness journey. Genie is your tool for owning your vitality.'
    },
    {
      icon: Shield,
      title: 'Transparency',
      description: 'No hidden ingredients, no marketing fluff. We\'re open about what\'s in every bottle and the science behind it.'
    },
    {
      icon: Lightbulb,
      title: 'Science-Backed',
      description: 'Every ingredient is carefully selected based on research and traditional wisdom. We combine modern science with nature\'s best.'
    },
    {
      icon: Users,
      title: 'Community',
      description: 'We\'re building a community of people who value wellness, connection, and authentic experiences. Your story matters.'
    }
  ];

  return (
    <div className="min-h-screen py-12 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-text-primary mb-6">
            About Genie
          </h1>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            We're on a mission to make sexual wellness approachable, empowering, and playful. 
            Because everyone deserves to feel their best.
          </p>
        </div>

        {/* Our Mission */}
        <section className="mb-20">
          <div className="max-w-4xl mx-auto">
            <div className="bg-surface border border-border-default rounded-xl p-8 md:p-12">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                  <Target className="h-10 w-10 text-primary" />
                </div>
              </div>
              <h2 className="font-display text-3xl font-bold text-text-primary text-center mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-text-primary text-center mb-8 max-w-2xl mx-auto">
                Genie exists to normalize sexual wellness and empower individuals to take charge 
                of their vitality. We believe that feeling confident and connected shouldn't be 
                a secret—it should be celebrated.
              </p>
              <div className="grid md:grid-cols-4 gap-4 mt-8">
                {['Modern', 'Playful', 'Empowering', 'Trustworthy'].map((value) => (
                  <div key={value} className="text-center p-4 bg-background rounded-lg">
                    <p className="font-semibold text-text-primary">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="mb-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display text-3xl font-bold text-text-primary text-center mb-12">
              Our Story
            </h2>
            <div className="bg-surface border border-border-default rounded-xl p-8 md:p-12 hover:shadow-lg transition-all duration-300">
              <div className="space-y-6 text-text-primary">
                <p className="text-lg leading-relaxed">
                  Genie was born from a simple realization: sexual wellness shouldn't be complicated 
                  or stigmatized. We noticed that the market was filled with products that felt clinical, 
                  intimidating, or just plain awkward to talk about.
                </p>
                <p className="text-lg leading-relaxed">
                  We set out to change that. Our vision was to create a product that's as modern and 
                  approachable as the people using it—something that fits seamlessly into a vibrant, 
                  wellness-focused lifestyle.
                </p>
                <p className="text-lg leading-relaxed">
                  Every bottle of Genie represents our commitment to quality, transparency, and 
                  empowerment. We're not just selling a product; we're building a movement toward 
                  a more open, confident, and connected approach to personal wellness.
                </p>
                <p className="text-lg leading-relaxed font-medium">
                  Join us in making sexual wellness something we can all talk about—and celebrate—together.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="mb-20">
          <h2 className="font-display text-3xl font-bold text-text-primary text-center mb-12">
            Our Values
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {values.map((value, index) => {
              const IconComponent = value.icon;
              return (
                <div key={index} className="text-center p-6 bg-surface border border-border-default rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <IconComponent className="h-16 w-16 mx-auto mb-4 text-primary" />
                  <h3 className="font-display text-xl font-bold text-text-primary mb-3">
                    {value.title}
                  </h3>
                  <p className="text-text-secondary">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Join Our Community */}
        <section className="bg-surface rounded-2xl p-8 md:p-12 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center">
                <Heart className="h-10 w-10 text-secondary" />
              </div>
            </div>
            <h2 className="font-display text-3xl font-bold text-text-primary mb-6">
              Join Our Community
            </h2>
            <p className="text-lg text-text-secondary mb-8 max-w-2xl mx-auto">
              We're more than just a product—we're a community of people committed to wellness, 
              connection, and living life to the fullest. Whether you're curious, a long-time user, 
              or looking to partner with us, there's a place for you here.
            </p>
            
            {/* Partnership Mention */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Handshake className="h-6 w-6 text-primary" />
                <h3 className="font-display text-lg font-semibold text-text-primary">
                  Partner with Genie
                </h3>
              </div>
              <p className="text-text-secondary text-sm mb-4">
                Share our mission and earn while empowering others. Our affiliate program 
                offers competitive commissions for those who align with our values of 
                wellness, transparency, and community.
              </p>
              <Link 
                href="/affiliate" 
                className="text-primary hover:text-primary/80 font-semibold text-sm flex items-center justify-center gap-2"
              >
                Learn About Partnership <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
              <Link 
                href="/shop"
                className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                Shop <ArrowRight className="h-4 w-4" />
              </Link>
              <Link 
                href="/blog"
                className="border border-border-default bg-surface text-text-primary px-6 py-3 rounded-lg font-semibold hover:bg-background transition-colors flex items-center justify-center gap-2"
              >
                Read Blog <ArrowRight className="h-4 w-4" />
              </Link>
              <Link 
                href="/testimonials"
                className="border border-border-default bg-surface text-text-primary px-6 py-3 rounded-lg font-semibold hover:bg-background transition-colors flex items-center justify-center gap-2"
              >
                Stories <ArrowRight className="h-4 w-4" />
              </Link>
              <Link 
                href="/contact"
                className="border border-border-default bg-surface text-text-primary px-6 py-3 rounded-lg font-semibold hover:bg-background transition-colors flex items-center justify-center gap-2"
              >
                Contact Us <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
