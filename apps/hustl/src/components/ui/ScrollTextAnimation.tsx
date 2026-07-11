"use client";

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

type CharacterProps = {
  char: string;
  index: number;
  centerIndex: number;
  scrollYProgress: any;
};

const CharacterV1 = ({
  char,
  index,
  centerIndex,
  scrollYProgress,
}: CharacterProps) => {
  const isSpace = char === " ";
  const distanceFromCenter = index - centerIndex;
  
  // Characters fly from outer edges (X) and from near the camera (Z), while spinning on multiple axes
  const x = useTransform(scrollYProgress, [0, 0.6], [distanceFromCenter * 60, 0]);
  const y = useTransform(scrollYProgress, [0, 0.6], [(index % 2 === 0 ? -150 : 150), 0]);
  const z = useTransform(scrollYProgress, [0, 0.6], [400, 0]);
  const rotateX = useTransform(scrollYProgress, [0, 0.6], [distanceFromCenter * 15, 0]);
  const rotateY = useTransform(scrollYProgress, [0, 0.6], [distanceFromCenter * 20, 0]);
  const rotateZ = useTransform(scrollYProgress, [0, 0.6], [distanceFromCenter * 5, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.4], [0, 1]);
  
  // Brutalist shadow that compresses as the character lands
  const shadowOffset = useTransform(scrollYProgress, [0, 0.6], [20, 6]);
  
  return (
    <motion.span
      className={`inline-block text-white ${isSpace ? "w-3 md:w-6" : ""}`}
      style={{
        x,
        y,
        z,
        rotateX,
        rotateY,
        rotateZ,
        opacity,
        transformStyle: "preserve-3d",
        WebkitTextStroke: '2px black',
        textShadow: shadowOffset.get() > 0 ? `${shadowOffset.get()}px ${shadowOffset.get()}px 0px #000` : '6px 6px 0px #000',
      }}
    >
      {isSpace ? "\u00A0" : char}
    </motion.span>
  );
};

export const ScrollTextAnimation = ({ text = "THE NEXT WAVE OF STUDENT HUSTL" }: { text?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end center"]
  });

  // Floating graphics transformations
  const floatY1 = useTransform(scrollYProgress, [0, 1], [300, -300]);
  const floatY2 = useTransform(scrollYProgress, [0, 1], [-300, 300]);
  const rotate1 = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const rotate2 = useTransform(scrollYProgress, [0, 1], [-180, 0]);

  const words = text.split(" ");
  let globalCharIndex = 0;
  const totalChars = text.length;
  const centerIndex = Math.floor(totalChars / 2);

  return (
    <section 
      ref={containerRef}
      className="w-full h-[60vh] md:h-[80vh] bg-neo-pink flex flex-col justify-center items-center border-b-4 border-black relative overflow-hidden perspective-[1200px]"
    >
      {/* Brutalist Background Grid */}
      <div 
        className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
        style={{ 
          backgroundImage: 'linear-gradient(90deg, #000 4px, transparent 4px), linear-gradient(#000 4px, transparent 4px)', 
          backgroundSize: '64px 64px' 
        }} 
      />

      {/* Floating Badges */}
      <motion.div 
        className="absolute left-[10%] top-[20%] z-10 hidden md:block"
        style={{ y: floatY1, rotate: rotate1 }}
      >
        <div className="bg-neo-yellow text-black font-mono font-black border-4 border-black px-6 py-3 text-xl uppercase shadow-[8px_8px_0_#000]">
          * MATCH
        </div>
      </motion.div>

      <motion.div 
        className="absolute right-[10%] bottom-[20%] z-10 hidden md:block"
        style={{ y: floatY2, rotate: rotate2 }}
      >
        <div className="bg-neo-green text-black font-sans font-black border-4 border-black px-8 py-4 text-3xl uppercase shadow-[8px_8px_0_#000] rounded-full">
          SWIPE FAST
        </div>
      </motion.div>

      {/* Main 3D Text Content */}
      <div className="flex flex-wrap justify-center font-sans font-black text-[9vw] md:text-[8vw] leading-[0.85] uppercase tracking-tighter text-black px-4 text-center max-w-[1400px] z-20 relative">
        {words.map((word, wIdx) => {
          const isLastWord = wIdx === words.length - 1;
          const charsInWord = word.split("");
          
          return (
            <span key={wIdx} className="whitespace-nowrap inline-flex">
              {charsInWord.map((char, cIdx) => {
                const currentIndex = globalCharIndex++;
                return (
                  <CharacterV1 
                    key={currentIndex} 
                    char={char} 
                    index={currentIndex} 
                    centerIndex={centerIndex} 
                    scrollYProgress={scrollYProgress} 
                  />
                );
              })}
              {!isLastWord && (
                <CharacterV1 
                  key={globalCharIndex++} 
                  char=" " 
                  index={globalCharIndex - 1} 
                  centerIndex={centerIndex} 
                  scrollYProgress={scrollYProgress} 
                />
              )}
            </span>
          );
        })}
      </div>
    </section>
  );
};
