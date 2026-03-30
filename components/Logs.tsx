import React from 'react';
import { motion } from 'framer-motion';
import { OBSERVATION_LOGS } from '../constants';

export const Logs: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full pt-32 px-4 md:px-12 pb-12 overflow-y-auto custom-scrollbar flex justify-center"
    >
      <div className="max-w-3xl w-full">
        <header className="mb-12 border-b-2 border-black pb-4 mt-8 flex justify-between items-end">
          <div>
            <h2 className="font-mono text-3xl font-bold tracking-tighter">KROW KONFERENCE</h2>
            <p className="font-mono text-xs text-gray-500 mt-2">FIELD_JOURNAL_V1.0</p>
          </div>
          <div className="font-mono text-xs text-right hidden md:block">
            STATUS: ACTIVE<br/>
            SUBJECT: CORVUS CORAX
          </div>
        </header>

        <div className="space-y-8">
          {OBSERVATION_LOGS.map((log, index) => (
            <motion.article 
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="border-l border-black pl-6 py-2 group hover:bg-gray-50 transition-colors relative"
            >
               {/* Marker on hover */}
               <div className="absolute left-[-3px] top-6 w-[5px] h-[5px] bg-black opacity-0 group-hover:opacity-100 transition-opacity" />

               <div className="flex flex-col md:flex-row gap-4 mb-2 font-mono text-xs text-gray-500 uppercase tracking-wider">
                 <span className="font-bold text-black">[{log.date}]</span>
                 <span>{log.time}</span>
                 <span>WX: {log.weather}</span>
               </div>

               <p className="font-serif text-xl leading-relaxed text-black mb-3">
                 {log.notes}
               </p>

               <div className="flex gap-2">
                 {log.tags.map(tag => (
                   <span key={tag} className="font-mono text-[10px] bg-black text-white px-2 py-0.5">
                     {tag}
                   </span>
                 ))}
               </div>
            </motion.article>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
