import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface SpinningPyramidProps {
  size?: number;
  speed?: number;
}

export function SpinningPyramid({ size = 48, speed = 1 }: SpinningPyramidProps) {
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

    // Solid faces — black, slightly transparent
    const faceMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, faceMaterial);
    scene.add(mesh);

    // Crisp edges on top
    const edges = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const lines = new THREE.LineSegments(edges, edgeMaterial);
    scene.add(lines);

    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      mesh.rotation.y += 0.006 * speed;
      lines.rotation.y = mesh.rotation.y;
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      geometry.dispose();
      edges.dispose();
      faceMaterial.dispose();
      edgeMaterial.dispose();
    };
  }, [size, speed]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ width: size, height: size, display: 'block' }}
    />
  );
}
