import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';

const COUNT = 6;
const SPINE_COUNT = 12;

const vertexShader = `
  uniform float uTime;
  attribute vec3 aPos;
  attribute vec3 aVel;
  attribute float aRand;

  void main() {
    vec3 p = position;

    float speed = 12.0 + aRand * 8.0;
    float flap  = sin(uTime * speed + aRand * 6.2832);
    p.x *= 1.0 + 0.5 * flap;
    p   *= 0.7 + 0.6 * aRand;

    float heading = atan(aVel.x, aVel.y);
    float s = sin(heading);
    float c = cos(heading);
    p.xy = mat2(c, -s, s, c) * p.xy;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(aPos + p, 1.0);
  }
`;

const fragmentShader = `
  void main() { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); }
`;

export const MouseCrows: React.FC = () => {
  const meshRef  = useRef<THREE.InstancedMesh>(null);
  const matRef   = useRef<THREE.ShaderMaterial>(null);
  const { mousePosition } = useStore();

  // Spine — chain of nodes, head follows mouse
  const spineRef = useRef<THREE.Vector3[]>(
    Array.from({ length: SPINE_COUNT }, () => new THREE.Vector3())
  );

  const posRef         = useRef(new Float32Array(COUNT * 3));
  const velRef         = useRef(new Float32Array(COUNT * 3));
  const prevPosRef     = useRef(new Float32Array(COUNT * 3));
  const velDisplayRef  = useRef(new Float32Array(COUNT * 3));
  const initialised    = useRef(false);

  const { material, randArray, offsetArray, rankArray } = useMemo(() => {
    const rand   = new Float32Array(COUNT);
    const offset = new Float32Array(COUNT * 3);
    const rank   = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      rand[i] = Math.random();
      // Same offset style as main CrowSwarm
      offset[i * 3]     = (Math.random() - 0.5) * 2.0;
      offset[i * 3 + 1] = (Math.random() - 0.5) * 1.0;
      offset[i * 3 + 2] = (Math.random() - 0.5) * 1.5 - 2.0; // slight depth
      rank[i] = i / COUNT;
    }

    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: { uTime: { value: 0 } },
      side: THREE.DoubleSide,
    });

    return { material: mat, randArray: rand, offsetArray: offset, rankArray: rank };
  }, []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const geo = mesh.geometry;
    geo.setAttribute('aPos',  new THREE.InstancedBufferAttribute(posRef.current, 3));
    geo.setAttribute('aVel',  new THREE.InstancedBufferAttribute(velDisplayRef.current, 3));
    geo.setAttribute('aRand', new THREE.InstancedBufferAttribute(randArray, 1));
  }, [randArray]);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    const mat  = matRef.current;
    if (!mesh || !mat) return;
    const geo = mesh.geometry;
    if (!geo.attributes.aPos) return;

    const time         = state.clock.getElapsedTime();
    mat.uniforms.uTime.value = time;

    const mx = mousePosition.x * 6.5;
    const my = mousePosition.y * 4.0;

    // Snap everything to mouse on first frame
    if (!initialised.current) {
      spineRef.current.forEach(n => n.set(mx, my, 0));
      for (let i = 0; i < COUNT; i++) {
        posRef.current[i * 3]     = mx + offsetArray[i * 3];
        posRef.current[i * 3 + 1] = my + offsetArray[i * 3 + 1];
        posRef.current[i * 3 + 2] = offsetArray[i * 3 + 2];
        prevPosRef.current.set(posRef.current);
      }
      initialised.current = true;
    }

    const d = Math.min(delta, 0.05);

    // --- Spine physics (identical to CrowSwarm) ---
    const head = spineRef.current[0];
    head.x = THREE.MathUtils.lerp(head.x, mx, d * 5.0);
    head.y = THREE.MathUtils.lerp(head.y, my, d * 5.0);
    head.z = THREE.MathUtils.lerp(head.z, 0,  d * 5.0);

    for (let i = 1; i < SPINE_COUNT; i++) {
      const prev = spineRef.current[i - 1];
      const curr = spineRef.current[i];
      const drag = 8.0 + i * 0.1;
      curr.x = THREE.MathUtils.lerp(curr.x, prev.x, d * drag);
      curr.y = THREE.MathUtils.lerp(curr.y, prev.y, d * drag);
      curr.z = THREE.MathUtils.lerp(curr.z, prev.z, d * drag);
    }

    // --- Bird physics (identical to CrowSwarm) ---
    for (let i = 0; i < COUNT; i++) {
      const ix = i * 3, iy = ix + 1, iz = ix + 2;

      const fi      = rankArray[i] * (SPINE_COUNT - 1);
      const idxA    = Math.floor(fi);
      const idxB    = Math.min(idxA + 1, SPINE_COUNT - 1);
      const alpha   = fi - idxA;
      const nodeA   = spineRef.current[idxA];
      const nodeB   = spineRef.current[idxB];

      const sx = THREE.MathUtils.lerp(nodeA.x, nodeB.x, alpha);
      const sy = THREE.MathUtils.lerp(nodeA.y, nodeB.y, alpha);
      const sz = THREE.MathUtils.lerp(nodeA.z, nodeB.z, alpha);

      let tx = sx + offsetArray[ix] + Math.sin(time * 1.5 + offsetArray[iy]) * 0.2;
      let ty = sy + offsetArray[iy] + Math.cos(time * 1.2 + offsetArray[ix]) * 0.2;
      let tz = sz + offsetArray[iz];

      const ax = (tx - posRef.current[ix]) * 2.5;
      const ay = (ty - posRef.current[iy]) * 2.5;
      const az = (tz - posRef.current[iz]) * 2.5;

      velRef.current[ix] = (velRef.current[ix] + ax * d) * 0.96;
      velRef.current[iy] = (velRef.current[iy] + ay * d) * 0.96;
      velRef.current[iz] = (velRef.current[iz] + az * d) * 0.96;

      posRef.current[ix] += velRef.current[ix] * d;
      posRef.current[iy] += velRef.current[iy] * d;
      posRef.current[iz] += velRef.current[iz] * d;

      velDisplayRef.current[ix] = posRef.current[ix] - prevPosRef.current[ix];
      velDisplayRef.current[iy] = posRef.current[iy] - prevPosRef.current[iy];
      prevPosRef.current[ix] = posRef.current[ix];
      prevPosRef.current[iy] = posRef.current[iy];
    }

    geo.attributes.aPos.needsUpdate = true;
    geo.attributes.aVel.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <coneGeometry args={[0.08, 0.14, 3]} />
      <primitive object={material} ref={matRef} attach="material" />
    </instancedMesh>
  );
};
