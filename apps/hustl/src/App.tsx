import React, { useEffect } from 'react';
import Lenis from '@studio-freight/lenis';
import { HeroSection } from './components/landing/HeroSection';
import { BentoGrid } from './components/ui/BentoGrid';
import { InteractiveSwipeDemo } from './components/ui/InteractiveSwipeDemo';
import { InfiniteMarquee } from './components/landing/InfiniteMarquee';
import { Footer } from './components/landing/Footer';
import NoiseOverlay from './components/landing/NoiseOverlay';
import { HowItWorks } from './components/landing/HowItWorks';
import { Stats } from './components/landing/Stats';
import { Testimonials } from './components/landing/Testimonials';
import { Skiper39 } from './components/landing/CrowdCanvas';
import { Skiper31 } from './components/landing/Skiper31';
import { Skiper48 } from './components/landing/Skiper48';
import { ScrollTextAnimation } from './components/ui/ScrollTextAnimation';

function App() {
  // Initialize Lenis for smooth scrolling physics
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    let rafId: number;

    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="bg-white min-h-screen font-sans text-black selection:bg-neo-green selection:text-black overflow-x-hidden">
      <NoiseOverlay />
      
      {/* Neo-Brutalist Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white border-b-4 border-black px-6 py-3 flex justify-between items-center">
        <div className="font-pixel text-[2rem] leading-none text-black bg-neo-yellow px-4 py-2 border-4 border-black shadow-brutal hover:bg-black hover:text-white transition-colors duration-200 cursor-pointer">
          HUSTL
        </div>
        <div className="hidden md:flex items-center gap-2">
          <a href="#gigs" className="font-mono font-black uppercase text-xs tracking-wider text-black bg-white hover:bg-neo-green px-3 py-1.5 border-2 border-black shadow-brutal hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all duration-100">Gigs</a>
          <a href="#how-it-works" className="font-mono font-black uppercase text-xs tracking-wider text-black bg-white hover:bg-neo-pink hover:text-white px-3 py-1.5 border-2 border-black shadow-brutal hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all duration-100">How it works</a>
          <a href="#testimonials" className="font-mono font-black uppercase text-xs tracking-wider text-black bg-white hover:bg-neo-blue px-3 py-1.5 border-2 border-black shadow-brutal hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all duration-100">Testimonials</a>
        </div>
        <button className="bg-neo-pink text-white border-4 border-black px-6 py-2.5 font-sans font-black text-sm uppercase tracking-wider shadow-brutal hover:shadow-brutal-lg active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all">
          Start Swiping
        </button>
      </nav>

      <main className="bg-white text-black relative">
        {/* Hero — fills viewport minus nav */}
        <HeroSection />
        
        {/* Stats counter — NO wrapper div, component owns its borders */}
        <Stats />

        {/* 3D Perspective Scroll Text */}
        <ScrollTextAnimation />

        {/* Reimagined Gigs Section */}
        <section id="gigs" className="w-full bg-neo-bg border-b-4 border-black pt-16 pb-24 px-6 relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '32px 32px' }}></div>
          
          <div className="max-w-[1400px] mx-auto w-full relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div className="max-w-2xl">
                <span className="font-mono text-xs uppercase tracking-widest bg-neo-pink text-white px-3 py-1 border-2 border-black font-bold shadow-[4px_4px_0_#000] inline-block mb-4 rotate-[-2deg]">
                  More Than A Job Board
                </span>
                <h2 className="font-sans text-[10vw] md:text-[6vw] leading-[0.85] font-black uppercase tracking-tighter text-black">
                  Built for <br/>
                  <span className="text-neo-green underline decoration-[8px] underline-offset-[8px]">Speed.</span>
                </h2>
              </div>
              <p className="font-mono text-base md:text-lg text-black bg-white border-4 border-black p-4 shadow-brutal max-w-sm">
                A gamified matching experience. Businesses post, you swipe, you get paid. Simple as that.
              </p>
            </div>
            
            <BentoGrid />
          </div>
        </section>
        
        {/* How It Works — horizontal scroll-jacked */}
        <HowItWorks />

        {/* Scroll Marquee with Icons */}
        <div className="relative z-20 -mt-20 md:-mt-32 pb-24 md:pb-32 bg-black">
          <Skiper31 />
        </div>
        
        {/* Testimonials */}
        <Testimonials />

        {/* Gig Cards Carousel */}
        <Skiper48 />
        
        {/* Infinite Text Marquee */}
        <InfiniteMarquee />
        
        {/* Crowd Canvas */}
        <section className="w-full h-[60vh] bg-neo-green overflow-hidden border-b-4 border-black relative">
          <Skiper39 />
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default App;
