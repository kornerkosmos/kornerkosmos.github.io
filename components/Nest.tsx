import React from 'react';
import { motion } from 'framer-motion';

export const Nest: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full w-full flex flex-col items-center justify-center pointer-events-none"
    >
      {/* Empty container - The CrowSwarm handles the K.K. visual */}
    </motion.div>
  );
};