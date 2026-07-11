import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface MagneticButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  children: React.ReactNode;
  className?: string;
  magneticStrength?: number;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  className = '',
  magneticStrength = 0.2,
  ...props
}) => {
  const ref = useRef<HTMLButtonElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 10, stiffness: 280, mass: 0.6 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const rotate = useTransform(springX, (val) => val * 0.15);

  // Parallax displacement for children
  const textX = useTransform(springX, (val) => val * 0.5);
  const textY = useTransform(springY, (val) => val * 0.5);

  const handleMouse = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    x.set(middleX * magneticStrength);
    y.set(middleY * magneticStrength);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      style={{ x: springX, y: springY, rotate }}
      data-magnetic="true"
      className={`relative inline-flex items-center justify-center font-mono text-sm uppercase tracking-wider transition-colors duration-300 ${className}`}
      {...props}
    >
      <motion.span 
        style={{ x: textX, y: textY }}
        className="relative z-10 flex items-center"
      >
        {children}
      </motion.span>
    </motion.button>
  );
};

