import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ART_PIECES } from '../constants';
import { ArtPiece } from '../types';
import { X } from 'lucide-react';
import { ContourImage } from './ContourImage';

// Deterministic per-item organic properties based on index
const organicProps = (index: number) => {
  const h = Math.imul(index * 2654435761 + 1, 0x9e3779b9) >>> 0;
  const size = 58 + (h % 38);              // 58–95% of column width
  const rotate = ((h >> 8) % 11 - 5) * 0.45; // –2.25 to +2.25 deg
  const nudge = ((h >> 16) % 24) - 12;    // –12 to +12 px vertical nudge
  return { size, rotate, nudge };
};

export const Gallery: React.FC = () => {
  const [selectedPiece, setSelectedPiece] = useState<ArtPiece | null>(null);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full pt-64 px-4 md:px-12 pb-12 overflow-y-auto custom-scrollbar"
      style={{
        maskImage: 'linear-gradient(to bottom, transparent 0px, transparent 220px, black 256px)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, transparent 220px, black 256px)',
      }}
    >
      {/* Content positioned lower to account for wires */}
      <header className="mb-12 border-b border-black pb-4 mt-8">
        <h2 className="font-serif text-4xl mb-2">Visual Archive</h2>
        <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">Illustration & Photography</p>
      </header>

      <div className="columns-1 md:columns-2 lg:columns-3 gap-8">
        {ART_PIECES.map((piece, index) => {
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

      <AnimatePresence>
        {selectedPiece && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-white/95 backdrop-blur-sm"
            onClick={() => setSelectedPiece(null)}
          >
            <button className="absolute top-8 right-8 p-2 border border-black hover:bg-black hover:text-white transition-colors rounded-full">
              <X size={24} />
            </button>
            <div 
              className="max-w-5xl w-full flex justify-center items-center" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border border-black p-4 bg-white shadow-2xl">
                <img 
                  src={selectedPiece.imageSrc} 
                  alt="Gallery piece" 
                  className="w-full h-auto max-h-[85vh] object-contain"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};