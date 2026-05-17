import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface CrowPyramidProps {
  size?: number;
}

export function CrowPyramid({ size = 120 }: CrowPyramidProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 3.2;

    const geometry = new THREE.TetrahedronGeometry(1, 0);

    // Only edges — no solid faces
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    scene.add(wireframe);

    let mouseX = 0;
    let mouseY = 0;
    let autoT = 0;
    let animId: number;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / size - 0.5) * 2;
      mouseY = -((e.clientY - rect.top) / size - 0.5) * 2;
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      animId = requestAnimationFrame(animate);
      autoT += 0.008;

      const targetY = autoT + mouseX * 0.6;
      const targetX = Math.sin(autoT * 0.4) * 0.25 + mouseY * 0.35;

      wireframe.rotation.y += (targetY - wireframe.rotation.y) * 0.04;
      wireframe.rotation.x += (targetX - wireframe.rotation.x) * 0.04;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousemove', handleMouseMove);
      renderer.dispose();
      geometry.dispose();
      edges.dispose();
    };
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ width: size, height: size }}
    />
  );
}
