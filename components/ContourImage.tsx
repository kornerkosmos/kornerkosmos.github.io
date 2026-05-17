import { useEffect, useRef } from 'react';

const width = 240;
const height = 240;
const fullTurn = Math.PI * 2;
const pointCount = 128;
const hoverInset = 12;
const textOutset = 10; // px outside blob edge
const ORBIT_PERIOD_MS = (fullTurn / 0.12) * 1000;

const POETIC_LABELS = [
  ' light & shadow ',
  ' memory & form ',
  ' still & moving ',
  ' near & far ',
  ' grain & silence ',
  ' dusk & detail ',
  ' texture & time ',
  ' quiet & vast ',
  ' moment & mark ',
  ' soft & certain ',
];

type Color = { red: number; green: number; blue: number };

const colorString = ({ red, green, blue }: Color) =>
  `rgb(${Math.round(red)}, ${Math.round(green)}, ${Math.round(blue)})`;

const hashString = (value: string) => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const noise = (seed: number, index: number) => {
  const value = Math.sin(seed * 12.9898 + index * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

const radiusAt = (angle: number, time: number, radius: number, seed: number, phase: number) =>
  radius *
  (1 +
    Math.sin(angle * 2 + phase + time * 0.42) * 0.09 +
    Math.sin(angle * 3 - phase * 1.7 + time * 0.27) * 0.055 +
    Math.sin(angle * 5 + seed * 0.001 + time * 0.18) * 0.035);

interface ContourImageProps {
  src: string;
  label?: string;
  className?: string;
}

export function ContourImage({ src, label, className }: ContourImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const svgPathRef = useRef<SVGPathElement>(null);
  const textPathRef = useRef<SVGTextPathElement>(null);

  const seed = hashString(src);
  const grayValue = 40 + noise(seed, 7) * 160;
  const textGray = Math.round(Math.max(0, grayValue - 60));
  const contourText = label ?? POETIC_LABELS[seed % POETIC_LABELS.length];

  const hasDevanagari = /[ऀ-ॿ]/.test(contourText);
  const hasHieroglyphs = /[\u{13000}-\u{1342F}]/u.test(contourText);

  const svgFontFamily = hasHieroglyphs
    ? '"Noto Sans Egyptian Hieroglyphs", serif'
    : hasDevanagari
    ? '"Noto Serif Devanagari", "Kohinoor Devanagari", "Devanagari MT", serif'
    : '"Cormorant Garamond", serif';
  const svgFontSize = hasHieroglyphs ? 13 : 10;
  const svgFontWeight = hasDevanagari || hasHieroglyphs ? 400 : 300;

  const pathId = `orbit-${seed}`;

  // Animate SVG startOffset — pure DOM, no React re-renders
  useEffect(() => {
    const el = textPathRef.current;
    if (!el) return;
    let frame: number;
    const startTime = performance.now();
    const animate = (now: number) => {
      const progress = ((now - startTime) / ORBIT_PERIOD_MS) % 1;
      el.setAttribute('startOffset', `${(progress * 100).toFixed(3)}%`);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Canvas blob + image reveal; also drives the SVG path each frame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    let animationFrame = 0;
    let cancelled = false;
    let previousTime = 0;
    let revealProgress = 0;
    let startTime = 0;
    let targetRevealProgress = 0;

    const color: Color = { red: grayValue, green: grayValue, blue: grayValue };
    const baseRadius = 30 + noise(seed, 1) * 10;
    const xRadius = 0.88 + noise(seed, 2) * 0.24;
    const yRadius = 0.9 + noise(seed, 3) * 0.22;
    const centerX = width * (0.47 + noise(seed, 4) * 0.06);
    const centerY = height * (0.47 + noise(seed, 5) * 0.06);
    const phase = noise(seed, 6) * fullTurn;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const draw = (now = 0) => {
      if (!startTime) startTime = now;
      const frame = previousTime ? Math.min((now - previousTime) / 16.67, 3) : 1;
      const time = reduceMotion.matches ? 0 : now * 0.001;
      previousTime = now;

      revealProgress = reduceMotion.matches
        ? targetRevealProgress
        : revealProgress + (targetRevealProgress - revealProgress) * (1 - 0.9 ** frame);
      revealProgress =
        Math.abs(targetRevealProgress - revealProgress) < 0.001
          ? targetRevealProgress
          : revealProgress;

      const easedReveal = revealProgress * revealProgress * (3 - revealProgress * 2);
      const xMotion = 1 + Math.sin(time * 0.11 + phase) * 0.025;
      const yMotion = 1 + Math.cos(time * 0.09 + phase) * 0.025;
      const hoverCenterX = centerX + (width / 2 - centerX) * easedReveal;
      const hoverCenterY = centerY + (height / 2 - centerY) * easedReveal;

      const path: { x: number; y: number }[] = [];
      for (let i = 0; i <= pointCount; i += 1) {
        const angle = (i / pointCount) * fullTurn;
        const cosine = Math.cos(angle);
        const sine = Math.sin(angle);
        const baseX = centerX + cosine * radiusAt(angle, time, baseRadius, seed, phase) * xRadius * xMotion;
        const baseY = centerY + sine * radiusAt(angle, time, baseRadius, seed, phase) * yRadius * yMotion;
        const targetWobble =
          1 +
          Math.sin(angle * 5 + time * 0.32 + phase) * 0.012 +
          Math.sin(angle * 3 - time * 0.21 + phase) * 0.01;
        const targetX =
          width / 2 + Math.sign(cosine) * (width / 2 - hoverInset) * Math.abs(cosine) ** 0.5 * targetWobble;
        const targetY =
          height / 2 + Math.sign(sine) * (height / 2 - hoverInset) * Math.abs(sine) ** 0.5 * targetWobble;
        path.push({ x: baseX + (targetX - baseX) * easedReveal, y: baseY + (targetY - baseY) * easedReveal });
      }

      // Update SVG path to match blob outline + outset (for textPath to follow)
      const svgPath = svgPathRef.current;
      if (svgPath) {
        const pts = path.slice(0, pointCount);
        const d = pts.map((p, i) => {
          const dx = p.x - hoverCenterX;
          const dy = p.y - hoverCenterY;
          const dist = Math.hypot(dx, dy) || 1;
          const ox = (p.x + (dx / dist) * textOutset).toFixed(2);
          const oy = (p.y + (dy / dist) * textOutset).toFixed(2);
          return `${i === 0 ? 'M' : 'L'}${ox},${oy}`;
        }).join('') + 'Z';
        svgPath.setAttribute('d', d);
      }

      // Image clip
      if (imgRef.current) {
        const polygon = path
          .slice(0, pointCount)
          .map(p => `${((p.x / width) * 100).toFixed(2)}% ${((p.y / height) * 100).toFixed(2)}%`)
          .join(', ');
        imgRef.current.style.clipPath = `polygon(${polygon})`;
        imgRef.current.style.opacity = String(easedReveal);
      }

      // Blob fill
      context.clearRect(0, 0, width, height);
      context.globalAlpha = 1 - easedReveal * 0.92;
      context.fillStyle = colorString(color);
      context.beginPath();
      for (let i = 0; i < path.length; i += 1) {
        if (i === 0) context.moveTo(path[i].x, path[i].y);
        else context.lineTo(path[i].x, path[i].y);
      }
      context.closePath();
      context.fill();
      context.globalAlpha = 1;

      if (!reduceMotion.matches) {
        animationFrame = window.requestAnimationFrame(draw);
      }
    };

    const showImage = () => { targetRevealProgress = 1; if (reduceMotion.matches) draw(); };
    const hideImage = () => { targetRevealProgress = 0; if (reduceMotion.matches) draw(); };

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    canvas.addEventListener('pointerenter', showImage);
    canvas.addEventListener('pointerleave', hideImage);
    canvas.addEventListener('focus', showImage);
    canvas.addEventListener('blur', hideImage);

    draw();

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(animationFrame);
      canvas.removeEventListener('pointerenter', showImage);
      canvas.removeEventListener('pointerleave', hideImage);
      canvas.removeEventListener('focus', showImage);
      canvas.removeEventListener('blur', hideImage);
    };
  }, [src, label]);

  return (
    <div className={`relative aspect-square w-full min-w-0 cursor-pointer ${className ?? ''}`}>
      <img
        ref={imgRef}
        src={src}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ opacity: 0 }}
      />
      <canvas
        ref={canvasRef}
        aria-label="Photo with animated contour"
        className="absolute inset-0 w-full h-full"
        role="img"
        tabIndex={0}
      />
      {/* SVG text follows the live blob outline — native renderer handles all scripts */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden
      >
        <defs>
          <path ref={svgPathRef} id={pathId} />
        </defs>
        <text
          fontSize={svgFontSize}
          fontWeight={svgFontWeight}
          fontFamily={svgFontFamily}
          fill={`rgb(${textGray},${textGray},${textGray})`}
        >
          <textPath ref={textPathRef} href={`#${pathId}`} startOffset="0%">
            {contourText}
          </textPath>
        </text>
      </svg>
    </div>
  );
}
