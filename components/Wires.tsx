import React, { useMemo } from 'react';
import * as THREE from 'three';

// Wire definitions matching the shader logic
// Only top wire kept for visual simplicity
const WIRES = [
  { y: 2.5, sag: 0.1 }, 
];

export const Wires: React.FC = () => {
  const lines = useMemo(() => {
    return WIRES.map((wire, index) => {
      const points = [];
      const segments = 50;
      const width = 20; // World units width
      
      for (let i = 0; i <= segments; i++) {
        const t = (i / segments) * 2 - 1; // -1 to 1
        const x = t * (width / 2);
        
        // Parabolic approximation
        const y = wire.y + (x * x * 0.02 * wire.sag); 
        
        points.push(new THREE.Vector3(x, y, 0)); 
      }
      return new THREE.BufferGeometry().setFromPoints(points);
    });
  }, []);

  // Workaround for TypeScript identifying <line> as an SVG element instead of R3F primitive
  const Line = 'line' as any;

  return (
    <group>
      {lines.map((geometry, i) => (
        <Line key={i} geometry={geometry}>
          <lineBasicMaterial color="#000000" opacity={0.15} transparent linewidth={1} />
        </Line>
      ))}
    </group>
  );
};