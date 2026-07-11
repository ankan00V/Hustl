import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

const TEXT_LINES = [
  "GET PAID TODAY.",
  "NO MORE COVER LETTERS.",
  "NO MORE ENDLESS INTERVIEWS.",
  "NO MORE SHITTY MINIMUM WAGE.",
  "JUST HUSTL.",
];

interface PerspectiveLineProps {
  line: string;
  idx: number;
  scrollYProgress: any;
}

const PerspectiveLine = ({ line, idx, scrollYProgress }: PerspectiveLineProps) => {
  // Distribute animation slightly based on line index
  const offset = idx * 0.05;
  const start = Math.max(0, 0.1 + offset);
  const end = Math.min(1, 0.8 + offset);
  
  // Map scroll progress to 3D rotation, translation and opacity
  const rotateXRaw = useTransform(scrollYProgress, [start, (start + end)/2, end], [60, 0, -60]);
  const rotateX = useSpring(rotateXRaw, { stiffness: 90, damping: 20 });
  
  const zRaw = useTransform(scrollYProgress, [start, (start + end)/2, end], [-150, 0, -150]);
  const z = useSpring(zRaw, { stiffness: 90, damping: 20 });
  
  const opacityRaw = useTransform(scrollYProgress, [start, (start + end)/2 - 0.05, (start + end)/2 + 0.05, end], [0, 1, 1, 0]);
  const opacity = useSpring(opacityRaw, { stiffness: 90, damping: 20 });
  
  const yRaw = useTransform(scrollYProgress, [start, end], [80, -80]);
  const y = useSpring(yRaw, { stiffness: 90, damping: 20 });

  // Accent highlights
  const isHighlight = line.includes("HUSTL") || line.includes("PAID") || line.includes("FUTURE");

  return (
    <motion.h2
      style={{
        rotateX,
        z,
        opacity,
        y,
        transformStyle: "preserve-3d",
      }}
      className={`font-sans font-black text-3xl sm:text-5xl md:text-6xl lg:text-7xl uppercase text-center leading-[0.9] tracking-tighter ${
        isHighlight ? "text-neo-pink" : "text-black"
      }`}
    >
      {line}
    </motion.h2>
  );
};

export const Skiper28 = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track scroll progress of the component relative to the viewport
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  return (
    <div 
      ref={containerRef} 
      className="relative h-[120vh] bg-neo-pink w-[100vw] ml-[calc(-50vw+50%)] select-none border-b-8 border-black"
    >
      {/* Sticky Inner Container */}
      <div className="sticky top-0 h-screen w-full flex flex-col justify-center items-center overflow-hidden bg-neo-pink">
        {/* 3D Perspective Wrapper */}
        <div 
          className="w-full max-w-[1200px] px-6 flex flex-col items-center justify-center gap-2 md:gap-4"
          style={{ perspective: "1000px" }}
        >
          {TEXT_LINES.map((line, idx) => (
            <PerspectiveLine 
              key={idx} 
              line={line} 
              idx={idx} 
              scrollYProgress={scrollYProgress} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};
