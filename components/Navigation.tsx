import React, { useRef } from 'react';
import { useStore } from '../store';
import { ViewState } from '../types';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import * as THREE from 'three';

export const Navigation: React.FC = () => {
  const { currentView, setView, setAnchorPoint, setTransitionStage } = useStore();
  const navRef = useRef<HTMLElement>(null);

  const handleNavClick = (e: React.MouseEvent, view: ViewState) => {
    if (currentView === view) return;

    // 1. Calculate Click Anchor in World Space (Approximate)
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    
    // Manual approximation for Camera Z=8, FOV=60 at Z=0 plane
    const visibleHeightAt0 = 2 * Math.tan((60 * Math.PI / 180) / 2) * 8;
    const aspect = window.innerWidth / window.innerHeight;
    const visibleWidthAt0 = visibleHeightAt0 * aspect;
    
    const worldX = x * (visibleWidthAt0 / 2);
    const worldY = y * (visibleHeightAt0 / 2);
    
    setAnchorPoint(new THREE.Vector3(worldX, worldY, 0));

    // 2. Trigger Gather
    setTransitionStage('GATHERING');

    // 3. Delay View Switch until gathered (approx 500ms based on lerp speed)
    setTimeout(() => {
      setView(view);
    }, 600);
  };

  const navItems: { label: string; value: ViewState }[] = [
    { label: 'Krow Konference', value: 'NEST' },
    { label: 'Korner Kosmos', value: 'GALLERY' },
  ];

  return (
    <nav ref={navRef} className="fixed top-0 left-0 w-full z-50 p-6 flex flex-col md:flex-row justify-between items-center text-black pointer-events-none">
      <div 
        className="font-serif text-2xl font-bold tracking-tighter cursor-pointer select-none pointer-events-auto"
        onClick={(e) => handleNavClick(e, 'CONTACT')}
      >
        K.K.
      </div>

      <div className="flex gap-4 md:gap-8 font-mono text-xs md:text-sm tracking-widest uppercase mt-4 md:mt-0 pointer-events-auto">
        {navItems.map((item) => (
          <button
            key={item.value}
            onClick={(e) => handleNavClick(e, item.value)}
            className={clsx(
              "hover:opacity-100 transition-all duration-300 relative group py-2",
              currentView === item.value ? "opacity-100 font-bold" : "opacity-60"
            )}
          >
            {item.label}
            <span className={clsx(
              "absolute bottom-0 left-0 w-full h-[1px] bg-black transform transition-transform duration-300 origin-left",
              currentView === item.value ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
            )} />
          </button>
        ))}
      </div>
    </nav>
  );
};