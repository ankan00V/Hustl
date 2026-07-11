import React, { useEffect, useRef, useState } from 'react';
import { useInView, animate, motion } from 'framer-motion';

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8, rotate: -5 },
  show: { 
    opacity: 1, 
    scale: 1,
    rotate: 0,
    transition: { 
      type: "spring" as const, 
      stiffness: 150, 
      damping: 12 
    } 
  }
};

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.15
    }
  }
};

const StatCounter = ({ 
  value, 
  label, 
  suffix = "", 
  bgColor,
  textColor = "text-black",
  shadowClass,
  rotateClass
}: { 
  value: number; 
  label: string; 
  suffix?: string; 
  bgColor: string; 
  textColor?: string;
  shadowClass: string; 
  rotateClass: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isInView) {
      const controls = animate(0, value, {
        duration: 2,
        ease: "easeOut",
        onUpdate(v) {
          setDisplayValue(Math.floor(v));
        }
      });
      return controls.stop;
    }
  }, [isInView, value]);

  return (
    <motion.div 
      ref={ref} 
      variants={itemVariants}
      whileHover={{ scale: 1.05, rotate: 2 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
      className={`relative p-8 md:p-12 border-[12px] border-white flex flex-col items-center justify-center text-center cursor-crosshair ${bgColor} ${rotateClass} transition-transform hover:z-20 shadow-[16px_16px_0px_#fff]`}
    >
      <div className={`font-sans font-black text-[80px] md:text-[100px] leading-none mb-4 tracking-tighter ${textColor} drop-shadow-[6px_6px_0px_rgba(0,0,0,0.5)]`}>
        {displayValue}{suffix}
      </div>
      <div className="font-mono text-xl md:text-2xl uppercase tracking-widest text-white font-black bg-black border-4 border-white px-6 py-3 shadow-[8px_8px_0px_rgba(255,255,255,1)] rotate-[-3deg]">
        {label}
      </div>
    </motion.div>
  );
};

export const Stats = () => {
  return (
    <section className="w-full py-24 bg-black text-white border-b-[12px] border-white relative overflow-hidden">
      {/* Background brutalist elements */}
      <div className="absolute top-10 left-10 text-[30vw] font-black text-white/5 leading-none select-none pointer-events-none">
        STATS
      </div>
      
      <div className="max-w-[1400px] mx-auto px-6 relative z-10">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8"
        >
          <StatCounter 
            value={50} 
            suffix="k+" 
            label="Active Students" 
            bgColor="bg-neo-pink" 
            shadowClass="shadow-[16px_16px_0px_#fff]" 
            rotateClass="-rotate-2 hover:rotate-1"
          />
          <StatCounter 
            value={120} 
            suffix="k" 
            label="Gigs Completed" 
            bgColor="bg-neo-yellow" 
            shadowClass="shadow-[16px_16px_0px_#fff]" 
            rotateClass="rotate-3 hover:-rotate-1"
            textColor="text-black"
          />
          <StatCounter 
            value={15} 
            suffix="M+" 
            label="Earned ($)" 
            bgColor="bg-neo-green" 
            shadowClass="shadow-[16px_16px_0px_#fff]" 
            rotateClass="-rotate-1 hover:rotate-2"
            textColor="text-black"
          />
        </motion.div>
      </div>
    </section>
  );
};
