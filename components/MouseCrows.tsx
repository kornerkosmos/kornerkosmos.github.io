import { useEffect, useRef } from 'react';
import { useStore } from '../store';

const COUNT = 3;
const SPINE_COUNT = 12;

// Convert Three.js world coords → screen pixels
// Camera z=8, FOV=60, tan(30°)=0.5774, half-height=4.619 world units
const toScreen = (wx: number, wy: number) => {
  const aspect = window.innerWidth / window.innerHeight;
  const halfH = 4.619;
  const halfW = halfH * aspect;
  return {
    x: ((wx / halfW) + 1) / 2 * window.innerWidth,
    y: (1 - wy / halfH) / 2 * window.innerHeight,
  };
};

export function MouseCrows() {
  const svgRef = useRef<SVGSVGElement>(null);
  const { mousePosition } = useStore();
  const mouseRef = useRef(mousePosition);

  // Keep mouseRef in sync without re-triggering the RAF loop
  useEffect(() => { mouseRef.current = mousePosition; }, [mousePosition]);

  useEffect(() => {
    // Spine
    const spine = Array.from({ length: SPINE_COUNT }, () => ({ x: 0, y: 0 }));

    // Per-bird state
    const offsets = Array.from({ length: COUNT }, (_, i) => ({
      x: (Math.random() - 0.5) * 2.0,
      y: (Math.random() - 0.5) * 1.0,
    }));
    const stiffness = [4.5, 3.2, 3.8, 2.8, 4.0, 3.4];
    const ranks = Array.from({ length: COUNT }, (_, i) => i / COUNT);
    const pos = Array.from({ length: COUNT }, () => ({ x: 0, y: 0 }));
    const vel = Array.from({ length: COUNT }, () => ({ x: 0, y: 0 }));
    const prev = Array.from({ length: COUNT }, () => ({ x: 0, y: 0 }));

    // SVG polygon elements — one per crow
    const polys: SVGPolygonElement[] = [];
    const svg = svgRef.current;
    if (!svg) return;

    for (let i = 0; i < COUNT; i++) {
      const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      poly.setAttribute('points', '0,-7 5.5,5 -5.5,5');
      poly.setAttribute('fill', 'black');
      svg.appendChild(poly);
      polys.push(poly);
    }

    let raf = 0;
    let lastTime = performance.now();
    let initialised = false;

    const tick = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const mx = mouseRef.current.x * 6.5;
      const my = mouseRef.current.y * 4.0;

      // Snap on first frame
      if (!initialised) {
        spine.forEach(n => { n.x = mx; n.y = my; });
        pos.forEach((p, i) => { p.x = mx + offsets[i].x; p.y = my + offsets[i].y; });
        prev.forEach((p, i) => { p.x = pos[i].x; p.y = pos[i].y; });
        initialised = true;
      }

      // Spine physics
      spine[0].x += (mx - spine[0].x) * (1 - Math.pow(1 - 5 * delta, 1));
      spine[0].y += (my - spine[0].y) * (1 - Math.pow(1 - 5 * delta, 1));
      for (let i = 1; i < SPINE_COUNT; i++) {
        const drag = 8.0 + i * 0.1;
        spine[i].x += (spine[i - 1].x - spine[i].x) * (1 - Math.pow(1 - drag * delta, 1));
        spine[i].y += (spine[i - 1].y - spine[i].y) * (1 - Math.pow(1 - drag * delta, 1));
      }

      const t = performance.now() * 0.001;

      for (let i = 0; i < COUNT; i++) {
        // Spine interpolation
        const fi = ranks[i] * (SPINE_COUNT - 1);
        const ia = Math.floor(fi);
        const ib = Math.min(ia + 1, SPINE_COUNT - 1);
        const alpha = fi - ia;
        const sx = spine[ia].x + (spine[ib].x - spine[ia].x) * alpha;
        const sy = spine[ia].y + (spine[ib].y - spine[ia].y) * alpha;

        // Target with undulation
        const tx = sx + offsets[i].x + Math.sin(t * 1.5 + offsets[i].y) * 0.2;
        const ty = sy + offsets[i].y + Math.cos(t * 1.2 + offsets[i].x) * 0.2;

        // Spring
        vel[i].x = (vel[i].x + (tx - pos[i].x) * 2.5 * delta) * 0.96;
        vel[i].y = (vel[i].y + (ty - pos[i].y) * 2.5 * delta) * 0.96;
        pos[i].x += vel[i].x * delta;
        pos[i].y += vel[i].y * delta;

        // Heading from delta
        const dvx = pos[i].x - prev[i].x;
        const dvy = pos[i].y - prev[i].y;
        prev[i].x = pos[i].x;
        prev[i].y = pos[i].y;

        const heading = Math.atan2(dvx, dvy); // matches shader: atan(velX, velY)

        // Wing flap — scale x of the polygon
        const flapSpeed = 10 + (i / COUNT) * 6;
        const flap = 1 + 0.55 * Math.sin(t * flapSpeed + i * 1.1);

        const { x: sx2, y: sy2 } = toScreen(pos[i].x, pos[i].y);

        polys[i].setAttribute(
          'transform',
          `translate(${sx2.toFixed(1)},${sy2.toFixed(1)}) rotate(${(heading * 180 / Math.PI).toFixed(1)}) scale(${flap.toFixed(3)},1)`
        );
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      polys.forEach(p => p.remove());
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      className="fixed inset-0 w-full h-full z-20 pointer-events-none"
      style={{ overflow: 'visible' }}
    />
  );
}
