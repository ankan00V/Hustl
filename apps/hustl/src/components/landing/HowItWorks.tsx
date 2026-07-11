import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const steps = [
  {
    num: "01",
    title: "Create your profile",
    desc: "Sign up in 2 minutes. Verify your student status and tell us your skills.",
    target: "Students"
  },
  {
    num: "02",
    title: "Post a gig",
    desc: "Describe what you need done. Set your price and timeline.",
    target: "Businesses"
  },
  {
    num: "03",
    title: "Swipe and match",
    desc: "Students swipe on gigs they want. Businesses get instant applicants.",
    target: "Both"
  },
  {
    num: "04",
    title: "Get it done & get paid",
    desc: "Complete the job, leave a review, and receive payment instantly.",
    target: "Both"
  }
];

export const HowItWorks = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track vertical page scrolling of the outer wrapper
  const { scrollYProgress } = useScroll({ 
    target: containerRef 
  });
  
  // Map vertical scroll progress to horizontal translation
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-75%"]);

  return (
    <section ref={containerRef} id="how-it-works" className="relative h-[150vh] bg-black text-white w-full border-b-[12px] border-white">
      {/* Sticky Inner Container */}
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col justify-center bg-black">
        {/* Background Graphic */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full flex items-center justify-center opacity-10 pointer-events-none">
            <h1 className="text-[30vw] font-black text-white whitespace-nowrap -rotate-12 select-none">HOW IT WORKS</h1>
        </div>

        {/* Header */}
        <div className="px-6 md:px-12 lg:px-24 mb-12 flex flex-col md:flex-row md:items-end justify-between w-full max-w-[1400px] mx-auto z-10 relative mt-16 md:mt-0">
          <div>
            <h2 className="font-sans text-[15vw] md:text-[8vw] font-black uppercase text-white leading-[0.8] tracking-tighter drop-shadow-[8px_8px_0_#ff00ff]">
              HOW IT <br />
              <span className="text-neo-green underline decoration-[12px] underline-offset-[8px]">WORKS.</span>
            </h2>
            <p className="font-mono text-black uppercase tracking-widest text-base md:text-lg font-black bg-neo-yellow border-4 border-white px-6 py-2 shadow-[8px_8px_0px_rgba(255,255,255,1)] inline-block mt-8 -rotate-2">
              TWO SIDES. ONE SEAMLESS HUSTLE.
            </p>
          </div>
          <div className="font-mono text-sm uppercase tracking-widest font-black bg-white text-black px-4 py-2 border-4 border-black shadow-[6px_6px_0px_#00ff00] mt-8 md:mt-0 rotate-3">
            SCROLL DOWN TO PROGRESS ↓
          </div>
        </div>

        {/* Horizontal Card Slider Track */}
        <div className="relative w-full overflow-hidden z-10">
          <motion.div 
            style={{ x }} 
            className="flex gap-12 px-6 md:px-12 lg:px-24 w-fit pb-12 pt-8"
          >
            {steps.map((step, index) => {
              const bgColors = ["bg-neo-green", "bg-neo-pink", "bg-neo-yellow", "bg-white"];
              const bgColor = bgColors[index % bgColors.length];
              const rotateClass = index % 2 === 0 ? "rotate-2" : "-rotate-3";
              
              return (
                <div key={index} className="w-[85vw] sm:w-[500px] flex-shrink-0">
                  <div className={`relative p-8 md:p-10 border-[12px] border-white ${bgColor} ${rotateClass} text-black min-h-[400px] flex flex-col justify-between shadow-[20px_20px_0px_#fff] transition-transform hover:scale-105 hover:z-30 cursor-crosshair`}>
                    <div>
                      <div className="flex justify-between items-start mb-8">
                        <span className="bg-black text-white border-4 border-white px-6 py-2 font-sans font-black text-4xl shadow-[8px_8px_0_#fff] -rotate-6">
                          {step.num}
                        </span>
                        <span className="bg-white text-black border-4 border-black font-mono font-black px-4 py-2 uppercase text-xs md:text-sm tracking-widest shadow-[6px_6px_0_#000] rotate-3">
                          {step.target}
                        </span>
                      </div>
                      <h3 className="text-4xl md:text-5xl font-sans font-black uppercase mb-6 text-black tracking-tighter leading-none">{step.title}</h3>
                      <p className="text-black font-mono text-lg md:text-2xl font-bold leading-tight uppercase bg-white/60 p-4 border-4 border-black shadow-[4px_4px_0_#000]">{step.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
