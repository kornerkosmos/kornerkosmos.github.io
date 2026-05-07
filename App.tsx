import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useStore } from './store';
import { CrowSwarm } from './components/CrowSwarm';
import { MouseCrows } from './components/MouseCrows';
import { Wires } from './components/Wires';
import { Navigation } from './components/Navigation';
import { Nest } from './components/Nest';
import { Gallery } from './components/Gallery';
import { Contact } from './components/Contact';
import { AnimatePresence } from 'framer-motion';

const Scene = () => {
  const { currentView } = useStore();
  return (
    <>
      <ambientLight intensity={1.5} />
      <Wires />
      <CrowSwarm />
      {currentView !== 'NEST' && <MouseCrows />}
    </>
  );
};

const App: React.FC = () => {
  const { currentView, setMousePosition } = useStore();

  const handleMouseMove = (e: React.MouseEvent) => {
    // Normalize mouse pos -1 to 1
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    setMousePosition(x, y);
  };

  return (
    <div 
      className="relative w-full h-full overflow-hidden bg-white text-black"
      onMouseMove={handleMouseMove}
    >
      {/* Layer 1: 3D Background */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 8], fov: 60 }} dpr={[1, 2]}>
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>
      </div>

      {/* Navigation: root-level fixed, z-50 in root stacking context */}
      <Navigation />

      {/* Layer 2: scrollable content */}
      <div className="relative z-10 w-full h-full pointer-events-none">
        <main className="w-full h-full relative pointer-events-auto overflow-hidden">
          <AnimatePresence mode="wait">
            {currentView === 'NEST' && <Nest key="nest" />}
            {currentView === 'GALLERY' && <Gallery key="gallery" />}
            {currentView === 'CONTACT' && <Contact key="contact" />}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default App;