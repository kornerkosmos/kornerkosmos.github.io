import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ART_PIECES } from '../constants';
import { ArtPiece, ProjectType } from '../types';
import { X } from 'lucide-react';
import { ContourImage } from './ContourImage';

const organicProps = (index: number) => {
  const h = Math.imul(index * 2654435761 + 1, 0x9e3779b9) >>> 0;
  const size = 58 + (h % 38);
  const rotate = ((h >> 8) % 11 - 5) * 0.45;
  const nudge = ((h >> 16) % 24) - 12;
  return { size, rotate, nudge };
};

const RockingTriangle = ({ size = 42, delay = 0, corner }: { size?: number; delay?: number; corner: 'tl' | 'br' }) => {
  const L = size;
  const pts    = corner === 'tl' ? `0,0 ${L},0 0,${L}` : `${L},${L} 0,${L} ${L},0`;
  const origin = corner === 'tl' ? '0px 0px' : `${L}px ${L}px`;

  return (
    <motion.div
      animate={{ rotate: [-3, 3, -3] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay }}
      style={{ transformOrigin: origin, display: 'inline-flex', width: L, height: L }}
    >
      <svg width={L} height={L} viewBox={`0 0 ${L} ${L}`} fill="none">
        <polygon points={pts} fill="none" stroke="black" strokeWidth="1.2" strokeLinejoin="miter" />
      </svg>
    </motion.div>
  );
};

const GRADIENT_MASK = {
  maskImage: 'linear-gradient(to bottom, transparent 24vh, black 26vh)',
  WebkitMaskImage: 'linear-gradient(to bottom, transparent 24vh, black 26vh)',
} as React.CSSProperties;

interface GalleryProps {
  type: ProjectType;
}

export const Gallery: React.FC<GalleryProps> = ({ type }) => {
  const [selectedPiece, setSelectedPiece] = useState<ArtPiece | null>(null);
  const pieces = ART_PIECES.filter(p => p.type === type);

  return (
    <div className="w-full h-full" style={GRADIENT_MASK}>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full"
    >
      <div className="w-full h-full px-4 md:px-12 pb-12 overflow-y-auto custom-scrollbar" style={{ paddingTop: '28vh' }}>
      <div className="columns-1 md:columns-2 lg:columns-3 gap-8 mt-8">
        {pieces.map((piece, index) => {
          const { size, rotate, nudge } = organicProps(index);
          return (
            <motion.div
              key={piece.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="break-inside-avoid mb-4 flex justify-center"
              style={{ paddingTop: nudge > 0 ? nudge : 0, paddingBottom: nudge < 0 ? -nudge : 0 }}
              onClick={() => setSelectedPiece(piece)}
            >
              <div style={{ width: `${size}%`, transform: `rotate(${rotate}deg)` }}>
                <ContourImage
                  src={piece.imageSrc}
                  label={piece.title || undefined}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {createPortal(
        <AnimatePresence>
          {selectedPiece && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center bg-white"
              onClick={() => setSelectedPiece(null)}
            >
              <button
                className="absolute top-8 right-8 font-mono text-[10px] tracking-[0.2em] uppercase opacity-40 hover:opacity-100 transition-opacity flex items-center gap-2"
                onClick={() => setSelectedPiece(null)}
              >
                <X size={12} strokeWidth={1.5} />
                Close
              </button>

              <motion.div
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="relative"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={selectedPiece.imageSrc}
                  alt=""
                  className="block max-h-[80vh] max-w-[85vw] w-auto h-auto object-contain"
                />

                <div className="absolute -top-4 -left-4 z-10 pointer-events-none">
                  <RockingTriangle size={48} delay={0} corner="tl" />
                </div>

                <div className="absolute -bottom-4 -right-4 z-10 pointer-events-none">
                  <RockingTriangle size={48} delay={0.5} corner="br" />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
      </div>
    </motion.div>
    </div>
  );
};
