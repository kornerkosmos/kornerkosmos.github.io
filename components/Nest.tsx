import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SpinningPyramid } from './SpinningPyramid';

const EASE = [0.22, 1, 0.36, 1] as const;

const ILLUSTRATIONS = [
  'https://images.unsplash.com/vector-1755446588967-2d534620b350?fm=jpg&q=85&w=1200',
  'https://images.unsplash.com/vector-1755446978788-806347cb42b0?fm=jpg&q=85&w=1200',
  'https://images.unsplash.com/vector-1755446351220-c62c8b2b96e5?fm=jpg&q=85&w=1200',
];

const CLOSED = [
  { x: 0,  y: 0,  rotate: -11, scale: 1.0,  fillOpacity: 0.18 },
  { x: 6,  y: -7, rotate: 2,   scale: 0.86, fillOpacity: 0.50 },
  { x: -5, y: 8,  rotate: 15,  scale: 0.73, fillOpacity: 0.88 },
];
const OPEN = [
  { x: -88, y: -72, rotate: -30, scale: 0.50 },
  { x: 88,  y: -72, rotate: 30,  scale: 0.50 },
  { x: 0,   y: 90,  rotate: 4,   scale: 0.50 },
];

const TriSVG = ({ fillOpacity }: { fillOpacity: number }) => (
  <svg width="100" height="87" viewBox="0 0 100 86.6" fill="none">
    <polygon
      points="50,2 98,85.6 2,85.6"
      fill="white"
      fillOpacity={fillOpacity}
      stroke="black"
      strokeWidth="1.1"
      strokeLinejoin="round"
    />
  </svg>
);

const TriangleNest = ({ imageSrc }: { imageSrc: string }) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative flex items-center justify-center cursor-pointer select-none"
      style={{ height: 220 }}
      onClick={() => setOpen(o => !o)}
    >
      {CLOSED.map((s, i) => {
        const t = open ? OPEN[i] : s;
        return (
          <motion.div
            key={i}
            animate={{ x: t.x, y: t.y, rotate: t.rotate, scale: t.scale, opacity: open ? 0 : 1 }}
            whileHover={!open ? { y: s.y - (i === 2 ? 10 : 4) } : undefined}
            transition={{ duration: 0.5, ease: EASE, delay: i * 0.05 }}
            style={{ position: 'absolute' }}
          >
            <TriSVG fillOpacity={s.fillOpacity} />
          </motion.div>
        );
      })}

      <motion.div
        animate={{ opacity: open ? 1 : 0, scale: open ? 1 : 0.88 }}
        transition={{ duration: 0.45, ease: EASE, delay: open ? 0.18 : 0 }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <img
          src={imageSrc}
          alt=""
          className="max-w-full max-h-full object-contain"
          draggable={false}
        />
      </motion.div>

    </div>
  );
};

const GRADIENT_MASK = {
  maskImage: 'linear-gradient(to bottom, transparent 24vh, black 26vh)',
  WebkitMaskImage: 'linear-gradient(to bottom, transparent 24vh, black 26vh)',
} as React.CSSProperties;

export const Nest: React.FC = () => {
  return (
  <div className="w-full h-full" style={GRADIENT_MASK}>
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="w-full h-full"
  >
    <div className="w-full h-full overflow-y-auto custom-scrollbar">
    <div className="h-[80vh] pointer-events-none" />

    {/* Wire separator — parabolic sag matching the background Wires component */}
    <svg
      className="w-full block"
      viewBox="0 0 1000 32"
      preserveAspectRatio="none"
      style={{ height: 32, display: 'block' }}
      aria-hidden
    >
      <path
        d="M 0,5 Q 500,27 1000,5"
        stroke="black"
        strokeWidth="1.5"
        strokeOpacity="0.18"
        fill="none"
      />
    </svg>

    <div className="relative bg-white/92 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-6 md:px-16 py-20">

        {/* Section glyph — 3D tetrahedra spinning on Y-axis */}
        <div className="flex items-end gap-3 mb-20">
          {([36, 52, 36] as const).map((s, i) => (
            <SpinningPyramid key={i} size={s} speed={1 - i * 0.15} />
          ))}
        </div>

        {/* Triangle nest grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-16">
          {ILLUSTRATIONS.map((src, i) => (
            <TriangleNest key={i} imageSrc={src} />
          ))}
        </div>
      </div>
    </div>
    </div>
  </motion.div>
  </div>
  );
};
