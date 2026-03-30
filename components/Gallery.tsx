import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ART_PIECES } from '../constants';
import { ArtPiece } from '../types';
import { X } from 'lucide-react';

export const Gallery: React.FC = () => {
  const [selectedPiece, setSelectedPiece] = useState<ArtPiece | null>(null);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full pt-64 px-4 md:px-12 pb-12 overflow-y-auto custom-scrollbar"
    >
      {/* Content positioned lower to account for wires */}
      <header className="mb-12 border-b border-black pb-4 mt-8">
        <h2 className="font-serif text-4xl mb-2">Visual Archive</h2>
        <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">Illustration & Photography</p>
      </header>

      <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
        {ART_PIECES.map((piece, index) => (
          <motion.div
            key={piece.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className="break-inside-avoid mb-8 cursor-pointer group relative bg-white"
            onClick={() => setSelectedPiece(piece)}
          >
            <div className="overflow-hidden border border-gray-200 group-hover:border-black transition-colors p-2">
              <img 
                src={piece.imageSrc} 
                alt="Gallery piece" 
                className="w-full h-auto object-cover filter grayscale hover:grayscale-0 transition-all duration-700"
              />
            </div>
          </motion.div>
        ))}
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