import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence, animate } from 'framer-motion';

const DUMMY_GIGS = [
  {
    id: 1,
    title: 'Barista @ Local Cafe',
    pay: '$18/hr',
    time: 'Weekends',
    color: 'bg-white',
    textColor: 'text-black'
  },
  {
    id: 2,
    title: 'Graphic Design for Startup',
    pay: '$25/hr',
    time: 'Flexible',
    color: 'bg-neo-green',
    textColor: 'text-black'
  },
  {
    id: 3,
    title: 'Event Staffing',
    pay: '$20/hr',
    time: 'Friday Night',
    color: 'bg-neo-pink',
    textColor: 'text-black'
  }
];

interface SwipeCardProps {
  card: typeof DUMMY_GIGS[number];
  index: number;
  isFront: boolean;
  parentDragX: any;
  handleDragEnd: (event: any, info: any) => void;
}

const interpolate = (value: number, inputRange: number[], outputRange: number[]): number => {
  const [x1, x2, x3] = inputRange;
  const [y1, y2, y3] = outputRange;
  if (value <= x1) return y1;
  if (value >= x3) return y3;
  if (value < x2) {
    const fraction = (value - x1) / (x2 - x1);
    return y1 + fraction * (y2 - y1);
  } else {
    const fraction = (value - x2) / (x3 - x2);
    return y2 + fraction * (y3 - y2);
  }
};

const SwipeCard: React.FC<SwipeCardProps> = ({
  card,
  index,
  isFront,
  parentDragX,
  handleDragEnd,
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(index * 12);

  // Sync front card's drag x to parentDragX
  useEffect(() => {
    if (isFront) {
      const unsubscribe = x.on('change', (latest) => {
        parentDragX.set(latest);
      });
      return () => {
        unsubscribe();
        parentDragX.set(0);
      };
    }
  }, [isFront, x, parentDragX]);

  // Handle y animation and tracking based on isFront
  useEffect(() => {
    if (!isFront) {
      const updateY = (latestDragX: number) => {
        const currentY = interpolate(latestDragX, [-150, 0, 150], [
          (index - 1) * 12,
          index * 12,
          (index - 1) * 12
        ]);
        y.set(currentY);
      };
      updateY(parentDragX.get());
      const unsubscribe = parentDragX.on('change', updateY);
      return () => unsubscribe();
    } else {
      const controls = animate(y, 0, { type: 'spring', stiffness: 300, damping: 20 });
      return () => {
        if (controls) {
          controls.stop();
        }
      };
    }
  }, [isFront, parentDragX, index, y]);

  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  // Interpolate scale for secondary cards based on parentDragX
  const interpolatedScale = useTransform(parentDragX, [-150, 0, 150], [
    1 - (index - 1) * 0.05,
    1 - index * 0.05,
    1 - (index - 1) * 0.05
  ]);

  const scale = isFront ? 1 : interpolatedScale;

  return (
    <motion.div
      style={{
        x: isFront ? x : 0,
        rotate: isFront ? rotate : 0,
        opacity: isFront ? opacity : 1,
        scale,
        y,
        zIndex: 10 - index,
      }}
      drag={isFront ? "x" : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={isFront ? handleDragEnd : undefined}
      className={`absolute w-full h-full card-brutal p-8 flex flex-col justify-between cursor-grab active:cursor-grabbing ${card.color} ${card.textColor}`}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: isFront ? 1 : 1 - index * 0.05, opacity: 1 }}
      exit={{ x: x.get() >= 0 ? 400 : -400, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div>
        <div className="inline-block border-[4px] border-black bg-neo-yellow text-black font-bold uppercase px-4 py-2 text-sm tracking-widest mb-4 rounded-none shadow-brutal">
          New Gig
        </div>
        <h3 className="font-serif text-3xl md:text-4xl font-black leading-none uppercase break-words">{card.title}</h3>
      </div>
      <div className="flex justify-between items-end font-mono text-xl md:text-2xl font-black uppercase">
        <span>{card.pay}</span>
        <span>{card.time}</span>
      </div>
    </motion.div>
  );
};

export const InteractiveSwipeDemo = () => {
  const [cards, setCards] = useState(DUMMY_GIGS);
  const parentDragX = useMotionValue(0);
  
  const handleDragEnd = (event: any, info: any) => {
    if (Math.abs(info.offset.x) > 100) {
      // Swiped far enough - remove only the front card (index 0)
      setCards((prev) => prev.slice(1));
    }
  };

  const handleReset = () => {
    setCards(DUMMY_GIGS);
  };

  return (
    <div className="relative w-full max-w-[320px] aspect-[4/5] mx-auto flex items-center justify-center">
      {cards.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="flex flex-col items-center"
        >
          <p className="font-mono text-xl md:text-2xl mb-8 text-black font-black uppercase">No more gigs!</p>
          <button 
            onClick={handleReset}
            className="btn-brutal bg-neo-green text-black px-8 py-4 uppercase tracking-widest text-xl"
          >
            Reset Demo
          </button>
        </motion.div>
      ) : (
        <AnimatePresence>
          {cards.map((card, index) => {
            const isFront = index === 0;
            return (
              <SwipeCard
                key={card.id}
                card={card}
                index={index}
                isFront={isFront}
                parentDragX={parentDragX}
                handleDragEnd={handleDragEnd}
              />
            );
          })}
        </AnimatePresence>
      )}
    </div>
  );
};
