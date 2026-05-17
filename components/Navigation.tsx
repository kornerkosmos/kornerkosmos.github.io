import React, { useRef } from 'react';
import { useStore } from '../store';
import { ViewState } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import * as THREE from 'three';

const EASE = [0.22, 1, 0.36, 1] as const;

export const Navigation: React.FC = () => {
  const { currentView, setView, setAnchorPoint, setTransitionStage } = useStore();
  const navRef = useRef<HTMLElement>(null);

  const handleNavClick = (e: React.MouseEvent, view: ViewState) => {
    if (currentView === view) return;

    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    const visibleHeightAt0 = 2 * Math.tan((60 * Math.PI / 180) / 2) * 8;
    const aspect = window.innerWidth / window.innerHeight;
    const visibleWidthAt0 = visibleHeightAt0 * aspect;
    setAnchorPoint(new THREE.Vector3(x * (visibleWidthAt0 / 2), y * (visibleHeightAt0 / 2), 0));
    setTransitionStage('GATHERING');
    setTimeout(() => setView(view), 600);
  };

  const inKornerKosmos = currentView === 'PHOTOGRAPHY' || currentView === 'ILLUSTRATION';

  const subItems = [
    { label: 'Photography', num: '01', view: 'PHOTOGRAPHY' as ViewState },
    { label: 'Illustration', num: '02', view: 'ILLUSTRATION' as ViewState },
  ];

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 w-full z-50 px-6 py-5 flex justify-between items-start text-black pointer-events-none"
    >
      {/* Logo */}
      <div
        className="font-serif text-2xl tracking-tighter cursor-pointer select-none pointer-events-auto mt-1"
        onClick={(e) => handleNavClick(e, 'NEST')}
      >
        K.K.
      </div>

      {/* Right nav */}
      <div className="flex items-start gap-8 font-serif text-sm tracking-widest uppercase pointer-events-auto">

        {/* Krow Konference */}
        <button
          onClick={(e) => handleNavClick(e, 'NEST')}
          className={clsx(
            'relative group py-1 transition-opacity duration-300',
            currentView === 'NEST' ? 'opacity-100' : 'opacity-40 hover:opacity-100'
          )}
        >
          Krow Konference
          <span className={clsx(
            'absolute bottom-0 left-0 w-full h-[1px] bg-black transform transition-transform duration-300 origin-left',
            currentView === 'NEST' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
          )} />
        </button>

        {/* Korner Kosmos — collapses/expands */}
        <div className="relative flex flex-col items-end">
          <AnimatePresence mode="wait">
            {!inKornerKosmos ? (
              /* Collapsed: single entry point */
              <motion.button
                key="collapsed"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 0.4, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25, ease: EASE }}
                whileHover={{ opacity: 1 }}
                onClick={(e) => handleNavClick(e, 'PHOTOGRAPHY')}
                className="relative group py-1"
              >
                Korner Kosmos
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-black transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </motion.button>
            ) : (
              /* Expanded: label + two sub-items */
              <motion.div
                key="expanded"
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="flex flex-col items-end gap-2"
              >
                {/* Parent label */}
                <motion.span
                  variants={{
                    hidden: { opacity: 0, y: -4 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } },
                  }}
                  className="text-[9px] tracking-[0.22em] text-black/40 select-none"
                >
                  Korner Kosmos
                </motion.span>

                {/* Divider line — draws in */}
                <motion.div
                  variants={{
                    hidden: { scaleX: 0 },
                    visible: { scaleX: 1, transition: { duration: 0.4, ease: EASE, delay: 0.05 } },
                  }}
                  style={{ originX: 1 }}
                  className="w-full h-px bg-black/20"
                />

                {/* Sub-items */}
                {subItems.map((item, i) => {
                  const active = currentView === item.view;
                  return (
                    <div key={item.view} className="overflow-hidden">
                      <motion.button
                        variants={{
                          hidden: { y: '110%', opacity: 0 },
                          visible: {
                            y: '0%',
                            opacity: 1,
                            transition: { duration: 0.45, ease: EASE, delay: 0.1 + i * 0.09 },
                          },
                        }}
                        onClick={(e) => handleNavClick(e, item.view)}
                        className={clsx(
                          'flex items-baseline gap-2 group relative py-0.5 transition-opacity duration-200',
                          active ? 'opacity-100' : 'opacity-35 hover:opacity-100'
                        )}
                      >
                        {/* Number */}
                        <span className="text-[8px] tracking-widest text-black/40 group-hover:text-black transition-colors duration-200">
                          {item.num}
                        </span>

                        {/* Label */}
                        <span className={clsx(
                          'tracking-widest transition-all duration-200',
                          'font-normal'
                        )}>
                          {item.label}
                        </span>

                        {/* Active triangle marker */}
                        <AnimatePresence>
                          {active && (
                            <motion.span
                              key="marker"
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0 }}
                              transition={{ duration: 0.2 }}
                              style={{
                                display: 'inline-block',
                                width: 0,
                                height: 0,
                                borderTop: '4px solid transparent',
                                borderBottom: '4px solid transparent',
                                borderLeft: '6px solid black',
                                marginLeft: 2,
                              }}
                            />
                          )}
                        </AnimatePresence>

                        {/* Hover underline */}
                        <span className={clsx(
                          'absolute bottom-0 left-0 w-full h-px bg-black transform transition-transform duration-300 origin-left',
                          active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                        )} />
                      </motion.button>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
};
