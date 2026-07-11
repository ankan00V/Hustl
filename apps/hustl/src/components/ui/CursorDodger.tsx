import React, { useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export const CursorDodger: React.FC<{ children: React.ReactNode; radius?: number; strength?: number; className?: string }> = ({
  children, radius = 120, strength = 0.4, className = ''
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { damping: 12, stiffness: 220, mass: 0.8 });
  const springY = useSpring(y, { damping: 12, stiffness: 220, mass: 0.8 });

  useEffect(() => {
    let cachedRect: DOMRect | null = null;

    const updateRect = () => {
      if (ref.current) {
        cachedRect = ref.current.getBoundingClientRect();
      }
    };

    updateRect();

    const onMove = (e: MouseEvent) => {
      if (!cachedRect) {
        updateRect();
      }
      if (!cachedRect) return;
      const r = cachedRect;
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < radius) {
        const angle = Math.atan2(dy, dx);
        const force = (radius - dist) / radius;
        x.set(-Math.cos(angle) * radius * force * strength);
        y.set(-Math.sin(angle) * radius * force * strength);
      } else {
        x.set(0);
        y.set(0);
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('scroll', updateRect, { passive: true });
    window.addEventListener('resize', updateRect);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('scroll', updateRect);
      window.removeEventListener('resize', updateRect);
    };
  }, [radius, strength, x, y]);

  return <motion.div ref={ref} style={{ x: springX, y: springY }} className={className}>{children}</motion.div>;
};
