import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

export const Contact: React.FC = () => {
  const links = [
    { label: 'Pixiv', url: 'https://www.pixiv.net/users/37046952', desc: 'Illustration Works' },
    { label: 'X (Twitter)', url: 'https://x.com/Korner_Kosmos', desc: 'Updates, random posts, etc.' },
    { label: 'Unsplash', url: 'https://unsplash.com/@korner_kosmos', desc: 'Photography Portfolio' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full flex flex-col items-center justify-center pt-20"
    >
      <div className="max-w-2xl w-full px-6 bg-white/90 p-12 border border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
        
        <div className="space-y-6">
          {links.map((link, i) => (
            <a 
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between group border-b border-gray-200 pb-4 hover:border-black transition-colors"
            >
              <div>
                <span className="block font-serif text-2xl group-hover:translate-x-2 transition-transform duration-300">
                  {link.label}
                </span>
                <span className="font-mono text-xs text-gray-500 uppercase tracking-widest group-hover:text-black">
                  {link.desc}
                </span>
              </div>
              <ExternalLink className="opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
            </a>
          ))}
        </div>

        <div className="mt-12 font-mono text-xs text-center text-gray-400">
             © 2024 Korner Kosmos. All rights reserved.
        </div>
      </div>
    </motion.div>
  );
};
