import { useRef, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '../../lib/utils';

export function RevealBlock({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.36, delay, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function SpotlightCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState({ x: 50, y: 50, active: false });
  const reduce = useReducedMotion();

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduce || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCoords({ x, y, active: true });
  };

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={() => setCoords((prev) => ({ ...prev, active: false }))}
      className={cn('spotlight-surface', className)}
      style={
        {
          '--spot-x': `${coords.x}%`,
          '--spot-y': `${coords.y}%`,
          '--spot-opacity': coords.active ? '1' : '0',
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
