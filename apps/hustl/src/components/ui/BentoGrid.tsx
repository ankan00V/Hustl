import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { CursorDodger } from './CursorDodger';
import { IPhoneChat } from './IPhoneChat';
import { InteractiveSwipeDemo } from './InteractiveSwipeDemo';

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  justifyEnd?: boolean;
  variants?: any;
}

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring" as const, 
      stiffness: 120, 
      damping: 15 
    } 
  }
};

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12
    }
  }
};

export const BentoCard: React.FC<BentoCardProps> = ({ 
  children, 
  className = '',
  justifyEnd = false,
  variants
}) => {
  return (
    <motion.div
      variants={variants || itemVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-50px" }}
      className={`relative card-brutal p-8 flex flex-col justify-between overflow-hidden cursor-pointer ${className}`}
    >
      <div className={`relative z-10 h-full w-full flex flex-col ${justifyEnd ? 'justify-end' : 'justify-between'}`}>
        {children}
      </div>
    </motion.div>
  );
};

export const BentoGrid = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Large Feature Card */}
      <BentoCard className="sm:col-span-2 bg-neo-green text-black overflow-visible md:overflow-hidden" justifyEnd={true}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '24px 24px' }}></div>
        
        <div className="flex flex-col md:flex-row h-full gap-8 relative z-10 w-full">
          <div className="flex-1 flex flex-col justify-end pt-16 md:pt-20 pb-4 relative z-20">
            <h3 className="font-sans font-black text-5xl md:text-7xl mb-4 text-black uppercase tracking-tighter">Instant Matching</h3>
            <p className="font-mono text-lg md:text-2xl text-black font-bold max-w-md bg-white border-4 border-black shadow-brutal-sm p-4">
              Our algorithm pairs you with local businesses needing your exact skills. No cover letters. No waiting.
            </p>
          </div>
          
          <div className="hidden md:flex flex-1 items-center justify-end relative h-[300px] md:h-auto min-h-[350px]">
             {/* iPhone Chat Simulation */}
             <div className="absolute -bottom-[60px] -right-[20px] rotate-12 scale-[0.8] md:scale-100 hover:rotate-6 transition-transform duration-500 ease-out z-10 origin-bottom-right">
               <IPhoneChat />
             </div>
          </div>
        </div>

        <CursorDodger strength={0.5} className="absolute top-8 left-8 md:left-auto md:right-8 z-30">
          <div 
            className="w-16 h-16 bg-neo-yellow border-[6px] border-black rounded-none flex items-center justify-center shadow-brutal-lg"
          >
            <ArrowUpRight className="w-8 h-8 text-black stroke-[4px]" />
          </div>
        </CursorDodger>
      </BentoCard>

      {/* Horizontal Feature Card: Swipe to Apply */}
      <BentoCard className="sm:col-span-2 bg-white text-black overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: 'linear-gradient(90deg, #000 1px, transparent 1px), linear-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10 w-full py-4">
          <div className="flex-1 relative z-20">
            <h3 className="font-sans font-black text-5xl md:text-6xl mb-4 text-black uppercase tracking-tighter">Swipe to Apply</h3>
            <p className="font-mono text-base md:text-xl text-black font-bold bg-neo-yellow p-3 border-4 border-black inline-block shadow-brutal-sm mt-2">
              The familiar interface you already know. Swipe right to apply, left to pass.
            </p>
          </div>
          
          <div className="flex-1 flex justify-center md:justify-end items-center relative w-full h-[400px] md:h-auto pb-8 md:pb-0">
            <div className="w-full max-w-[280px] origin-center rotate-[-2deg] mr-0 md:mr-12 mt-4 md:mt-0 z-50">
               <InteractiveSwipeDemo />
            </div>
          </div>
        </div>
      </BentoCard>

      {/* Small Feature Card 1 */}
      <BentoCard 
        className="bg-neo-blue text-black" 
        justifyEnd={true}
        variants={{
          hidden: { opacity: 0, x: -100 },
          show: { 
            opacity: 1, 
            x: 0,
            transition: { type: "spring", stiffness: 100, damping: 15 } 
          }
        }}
      >
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px' }}></div>
        
        <div className="h-full flex flex-col justify-end relative z-10 bg-white p-5 border-4 border-black shadow-brutal-sm group-hover:translate-y-[-4px] transition-transform">
           <h3 className="font-sans font-black text-3xl md:text-4xl mb-2 text-black uppercase tracking-tighter">Get Paid Fast</h3>
           <p className="font-mono text-sm md:text-base text-black font-bold">
             Direct deposits within 24 hours of gig completion.
           </p>
        </div>
      </BentoCard>

      {/* Small Feature Card 2 */}
      <BentoCard 
        className="bg-neo-pink text-black" 
        justifyEnd={true}
        variants={{
          hidden: { opacity: 0, x: 100 },
          show: { 
            opacity: 1, 
            x: 0,
            transition: { type: "spring", stiffness: 100, damping: 15 } 
          }
        }}
      >
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '16px 16px' }}></div>
        
        <div className="h-full flex flex-col justify-end relative z-10 bg-white p-5 border-4 border-black shadow-brutal-sm group-hover:translate-y-[-4px] transition-transform">
           <h3 className="font-sans font-black text-3xl md:text-4xl mb-2 text-black uppercase tracking-tighter">Verified Gigs</h3>
           <p className="font-mono text-sm md:text-base text-black font-bold">
             Every business is vetted for your safety and security.
           </p>
        </div>
      </BentoCard>
    </div>
  );
};
