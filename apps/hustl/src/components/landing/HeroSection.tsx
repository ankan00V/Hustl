'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { MagneticButton } from '../ui/MagneticButton';
import { CursorDodger } from '../ui/CursorDodger';
import { CrowdCanvas } from './CrowdCanvas';


export const HeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const rotateRaw = useTransform(scrollYProgress, [0, 1], [-10, 20]);
  const rotateSpring = useSpring(rotateRaw, { stiffness: 100, damping: 20 });
  
  const yParallax = useTransform(scrollYProgress, [0, 1], [0, -250]);
  const ySpring = useSpring(yParallax, { stiffness: 100, damping: 20 });

  return (
    <section ref={containerRef} className="relative w-full min-h-[90vh] bg-black text-white overflow-hidden py-20 px-6 border-b-[12px] border-white flex items-center z-10">
      
      {/* Background Crowd Animation / Canvas */}
      <div className="absolute inset-x-0 bottom-0 top-1/4 z-0 opacity-40 pointer-events-none filter contrast-200 grayscale">
        <CrowdCanvas src="/images/peeps/all-peeps.png" rows={15} cols={7} />
      </div>

      {/* Chaotic background text elements */}
      <div className="absolute -top-10 -left-10 text-[20vw] font-black leading-none text-white/5 select-none font-sans pointer-events-none z-0">
        HUSTL<br/>HUSTL
      </div>
      <div className="absolute -bottom-20 -right-10 text-[25vw] font-black leading-none text-neo-pink/10 select-none font-sans pointer-events-none z-0">
        GRIND
      </div>

      <div className="max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10 relative">
        
        {/* Asymmetrical Text Panel */}
        <div className="lg:col-span-7 flex flex-col items-start text-left z-20">
          <CursorDodger strength={0.8}>
            <span className="font-mono text-sm lg:text-base uppercase tracking-[0.3em] bg-neo-yellow text-black px-4 py-2 border-4 border-white font-black mb-8 shadow-[8px_8px_0px_rgba(255,255,255,1)] -rotate-2 inline-block">
              WARNING: EXTREME HUSTLE
            </span>
          </CursorDodger>
          
          <h1 className="font-sans font-black text-[15vw] sm:text-[14vw] lg:text-[11vw] leading-[0.75] tracking-tighter uppercase mb-6 text-white drop-shadow-[8px_8px_0_#ff00ff]">
            SWIPE. <br />
            MATCH. <br />
            <span className="text-neo-green underline decoration-[12px] underline-offset-[8px]">PAID.</span>
          </h1>
          
          <p className="font-mono text-lg md:text-2xl font-black bg-white text-black p-4 border-4 border-black shadow-[12px_12px_0px_#00ff00] max-w-xl mb-8 rotate-1 uppercase leading-tight">
            NO RESUMES. NO BS. JUST PURE GIGS DEPOSITED TO YOUR BANK IN 24 HOURS.
          </p>
          
          <div className="flex flex-wrap items-center gap-6 mt-4">
            <MagneticButton className="px-10 py-5 lg:px-12 lg:py-6 bg-neo-pink text-white border-4 border-white shadow-[8px_8px_0px_#fff] hover:shadow-[12px_12px_0px_#fff] font-black text-xl lg:text-2xl uppercase tracking-widest hover:-translate-y-1 transition-all">
              DOWNLOAD
            </MagneticButton>
            <MagneticButton className="px-10 py-5 lg:px-12 lg:py-6 bg-black text-white border-4 border-white shadow-[8px_8px_0px_#fff] font-black text-xl lg:text-2xl uppercase tracking-widest hover:bg-white hover:text-black transition-all">
              POST A GIG
            </MagneticButton>
          </div>
        </div>

        {/* Dynamic Rotating Media Panel */}
        <div className="lg:col-span-5 relative flex items-center justify-center mt-12 lg:mt-0 z-20">
          <motion.div
            style={{ y: ySpring }}
            className="w-full max-w-[400px] relative group"
          >
            <div className="w-full border-[8px] md:border-[12px] border-white shadow-[12px_12px_0px_#ff00ff] bg-black">
              <video
                src="/videos/animo-stack-slide-1800p.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
};
