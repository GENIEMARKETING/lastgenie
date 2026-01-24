'use client';

import Link from 'next/link';
import Image from 'next/image';

export function HeroSection() {
  const customerImages = [
    "https://images.unsplash.com/photo-1692862061691-5555f2bbf57d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMGZhY2UlMjB3b21hbiUyMG1hbiUyMHNtaWxlfGVufDF8fHx8MTc2OTE5NDcwNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    "https://images.unsplash.com/photo-1623594675959-02360202d4d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHdvbWFuJTIwc21pbGUlMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzY5MTc3NzM4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    "https://images.unsplash.com/photo-1764816657425-b3c79b616d14?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMG1hbiUyMHNtaWxlJTIwY2FzdWFsfGVufDF8fHx8MTc2OTE3NzczN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    "https://images.unsplash.com/photo-1556136412-7ea719d2af4d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHdvbWFuJTIwbGF1Z2hpbmclMjBuYXR1cmFsfGVufDF8fHx8MTc2OTE5NDcxMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-blue-700 to-secondary pt-20 lg:pt-32 pb-32">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            {/* Left Side - Content */}
            <div className="flex flex-col justify-center space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-white/20 bg-white/10 text-white backdrop-blur-sm">
                  New Collection Available
                </div>
                <h1 className="text-4xl font-display font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-white">
                  Pleasure,{" "}
                  <span className="text-blue-100">
                    Reimagined.
                  </span>
                </h1>
                <p className="max-w-[600px] text-blue-50 md:text-xl">
                  Discover a curated collection of wellness
                  products designed for your modern lifestyle.
                  Safe, inclusive, and discreet.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/shop">
                  <button className="bg-white text-primary hover:bg-blue-50 px-8 h-12 text-base shadow-lg hover:shadow-xl transition-all font-bold rounded-md">
                    Shop Now
                  </button>
                </Link>
                <Link href="/science">
                  <button className="h-12 text-base border-white text-white hover:bg-white/10 hover:text-white bg-transparent border rounded-md px-8">
                    Learn More
                  </button>
                </Link>
              </div>
              <div className="flex items-center gap-4 text-sm text-blue-100">
                <div className="flex -space-x-2">
                  {customerImages.map((src, i) => (
                    <div
                      key={i}
                      className="h-8 w-8 rounded-full border-2 border-primary bg-muted overflow-hidden"
                    >
                      <Image
                        src={src}
                        alt="User"
                        width={32}
                        height={32}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          // Fallback to a colored circle if image fails to load
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.style.backgroundColor = ['#1E40AF', '#14B8A6', '#FACC15', '#FFB6C1'][i % 4];
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>
                <p>Trusted by 10,000+ happy customers</p>
              </div>
            </div>
            
            {/* Right Side - Image */}
            <div className="mx-auto lg:ml-auto w-full max-w-[500px] lg:max-w-none relative aspect-square lg:aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl rotate-1 hover:rotate-0 transition-all duration-500">
              <Image
                src="/images/hero/Hero-section-landingpage.webp"
                alt="Genie Sexual Wellness Products"
                fill
                className="object-cover w-full h-full"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
              />
            </div>
          </div>
        </div>
        
        {/* Wave Divider */}
        <div 
          className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]"
          style={{ 
            transform: 'rotate(180deg)',
            zIndex: 10
          }}
        >
          <svg
            data-name="Layer 1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="relative block sm:h-[120px] md:h-[150px] lg:h-[175px]"
            style={{ 
              display: 'block',
              width: 'calc(130% + 1.3px)',
              height: '100px',
              shapeRendering: 'geometricPrecision'
            }}
            role="presentation"
            aria-hidden="true"
          >
            <path
              d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
              opacity=".25"
              className="fill-white"
            ></path>
            <path
              d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z"
              opacity=".5"
              className="fill-white"
            ></path>
            <path
              d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"
              className="fill-white"
            ></path>
          </svg>
        </div>
      </section>
    </div>
  );
}