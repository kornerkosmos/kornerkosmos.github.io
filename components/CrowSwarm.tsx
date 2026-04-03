import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';

const COUNT = 300; 
const SPINE_COUNT = 50; // Increased from 12 to 50 for a longer "river" tail
const LANDER_COUNT = 50; // Only this many birds will sit on the wire

// Helper to generate positions from text
function generateTextPositions(count: number, text: string): Float32Array {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const width = 1024;
  const height = 512;
  canvas.width = width;
  canvas.height = height;

  if (ctx) {
    ctx.fillStyle = '#000000'; 
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 300px "Cormorant Garamond", "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);
  }

  const imageData = ctx?.getImageData(0, 0, width, height);
  const data = imageData?.data;
  const validPositions: number[] = [];

  if (data) {
    for (let y = 0; y < height; y += 8) { 
      for (let x = 0; x < width; x += 8) {
        const i = (y * width + x) * 4;
        if (data[i] > 128) { 
           const wx = (x - width / 2) * 0.007;
           const wy = -(y - height / 2) * 0.007;
           validPositions.push(wx, wy, 0);
        }
      }
    }
  }

  // Shuffle positions
  for (let i = validPositions.length / 3 - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tempX = validPositions[i * 3];
    const tempY = validPositions[i * 3 + 1];
    const tempZ = validPositions[i * 3 + 2];
    validPositions[i * 3] = validPositions[j * 3];
    validPositions[i * 3 + 1] = validPositions[j * 3 + 1];
    validPositions[i * 3 + 2] = validPositions[j * 3 + 2];
    validPositions[j * 3] = tempX;
    validPositions[j * 3 + 1] = tempY;
    validPositions[j * 3 + 2] = tempZ;
  }

  const result = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    if (validPositions.length > 0) {
      const index = i % (validPositions.length / 3);
      result[i * 3 + 0] = validPositions[index * 3 + 0];
      result[i * 3 + 1] = validPositions[index * 3 + 1];
      result[i * 3 + 2] = (Math.random() - 0.5) * 0.5; 
    } else {
      result[i * 3 + 0] = 0;
      result[i * 3 + 1] = 0;
      result[i * 3 + 2] = 0;
    }
  }
  return result;
}

// Vertex Shader
const vertexShader = `
  uniform float uTime;
  uniform float uState; // 0 = Flow, 1 = Roost
  uniform float uExplode; // 0 = At Anchor, 1 = Free
  uniform float uFormText; // 1 = Form Text, 0 = Natural
  uniform vec3 uAnchor;
  
  attribute vec3 aBasePosition; // Updated via JS
  attribute vec3 aTextPosition; 
  attribute vec3 aRandom; 
  attribute float aWireT; 
  attribute vec3 aVelocity; 
  attribute float aZOffset; // Depth offset for roosting
  attribute float aLander; // 1.0 = Lands on wire, 0.0 = Flies to sky

  varying vec2 vUv;

  void main() {
    vUv = uv;
    
    // --- 1. Compute Targets ---
    vec3 flowPos = aBasePosition;
    vec3 roostPos;

    if (aLander > 0.5) {
      // --- WIRE LANDING ---
      float wireY = 2.5; // Match with Wires.tsx
      float wireSag = 0.1;
      
      float t = aWireT * 2.0 - 1.0; 
      float wireX = t * 10.0;
      float catenaryY = wireY + (wireX * wireX * 0.02 * wireSag);
      roostPos = vec3(wireX, catenaryY, 0.0);
      
      // SIT ON TOP: Cone height 0.14 (pivot center). Bottom is at -0.07.
      // To place bottom on wire, center needs to be at wireY + 0.07.
      roostPos.y += 0.07; 
      
      // ONE LINE: Minimize Z offset heavily when on wire to form a line
      roostPos.z += aZOffset * 0.1; 
      
      // Idle hop on wire
      roostPos.y += sin(uTime * 3.0 + aRandom.x * 20.0) * 0.002; 
    } else {
      // --- SKY ROOSTING ---
      // Non-landing birds circle high above
      float angle = uTime * 0.2 + aRandom.x * 6.28;
      float radius = 8.0 + aRandom.y * 6.0;
      float height = 7.0 + aRandom.z * 3.0;
      roostPos = vec3(cos(angle) * radius, height, sin(angle) * radius);
    }

    // --- State Mixing ---
    vec3 naturalTarget = mix(flowPos, roostPos, uState);
    
    vec3 noisyTextPos = aTextPosition;
    noisyTextPos.x += sin(uTime * 2.0 + aRandom.y * 10.0) * 0.02;
    noisyTextPos.y += cos(uTime * 2.3 + aRandom.x * 10.0) * 0.02;
    
    vec3 currentPos = mix(naturalTarget, noisyTextPos, uFormText);

    float easeExplode = smoothstep(0.0, 1.0, uExplode);
    vec3 spread = (aRandom - 0.5) * 5.0; 
    vec3 anchorArea = uAnchor + spread * (1.0 - easeExplode);
    
    vec3 finalInstancePos = mix(anchorArea, currentPos, easeExplode);

    // --- 2. Vertex Transformation ---
    vec3 localPos = position;

    // IsFlying check: Also check if they are sky-roosting (uState=1 but aLander=0)
    // Actually, sky birds should flap too.
    float isRoostingOnWire = uState * aLander;
    float isFlying = (1.0 - isRoostingOnWire) * (1.0 - uFormText);

    // FLAP
    float flapSpeed = 12.0 + aRandom.x * 8.0; 
    float flap = sin(uTime * flapSpeed);
    float wingScale = 1.0 + (0.5 * flap * isFlying);
    localPos.x *= wingScale;
    
    // FLYING DIRECTION: Orient cone tip toward velocity direction
    float velX = aVelocity.x;
    float velY = aVelocity.y;
    // If Sky Roosting (uState=1, aLander=0), fake velocity based on circling
    if (uState > 0.5 && aLander < 0.5) {
       float angle = uTime * 0.2 + aRandom.x * 6.28;
       velX = -sin(angle);
       velY = 0.0;
    }

    // heading = atan(velX, velY): GLSL mat2 col-major, tip lands at (sinθ, cosθ)
    // moving right (velX>0,velY=0) → atan(1,0)=PI/2 → tip=(1,0) ✓
    float heading = atan(velX, velY);

    float idleWobble = sin(uTime * 1.5 + aRandom.y * 5.0) * 0.05 * (1.0 - isFlying);
    float finalRot = heading * isFlying + idleWobble;
    
    float s = sin(finalRot);
    float c = cos(finalRot);
    mat2 rot = mat2(c, -s, s, c);
    localPos.xy = rot * localPos.xy;

    // VARIATION: Scale based on random attribute (0.7 to 1.3)
    localPos *= (0.7 + 0.6 * aRandom.y);
    
    vec3 finalPos = finalInstancePos + localPos;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPos, 1.0);
  }
`;

const fragmentShader = `
  void main() {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
  }
`;

export const CrowSwarm: React.FC = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const { mousePosition, currentView, transitionStage, setTransitionStage, anchorPoint } = useStore();
  
  const introStartTime = useRef(Date.now());
  
  // -- Physics Refs --
  const positionRef = useRef(new Float32Array(COUNT * 3));
  const velocityRef = useRef(new Float32Array(COUNT * 3));
  const prevPositionRef = useRef(new Float32Array(COUNT * 3)); // last frame positions for heading
  const headingVelRef = useRef(new Float32Array(COUNT * 3));  // delta-based velocity sent to GPU
  const offsetRef = useRef(new Float32Array(COUNT * 3)); // Offset from spine node
  const rankRef = useRef(new Float32Array(COUNT)); // 0 = head, 1 = tail
  
  // Spine (The invisible snake that birds follow)
  const spineRef = useRef<THREE.Vector3[]>([]);

  // Init Spine if empty
  useMemo(() => {
    if (spineRef.current.length === 0) {
      for (let i = 0; i < SPINE_COUNT; i++) {
        spineRef.current.push(new THREE.Vector3(0, 0, 0));
      }
    }
  }, []);

  const { attributes } = useMemo(() => {
    const randomArray = new Float32Array(COUNT * 3);
    const wireTArray = new Float32Array(COUNT);
    const zOffsetArray = new Float32Array(COUNT);
    const landerArray = new Float32Array(COUNT);
    const textPositions = generateTextPositions(COUNT, "K.K.");

    const birdsOnWire: { idx: number, t: number }[] = [];

    // 1. Pick Random Landers
    const indices = Array.from({ length: COUNT }, (_, i) => i);
    // Shuffle
    for (let i = COUNT - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const landerSet = new Set(indices.slice(0, LANDER_COUNT));

    // 2. Initial Setup
    for (let i = 0; i < COUNT; i++) {
      randomArray[i * 3 + 0] = Math.random() * Math.PI * 2; 
      
      // Scale Randomness: Full 0.0 to 1.0 range used in shader for 0.7x to 1.3x scale
      randomArray[i * 3 + 1] = Math.random(); 
      
      randomArray[i * 3 + 2] = 0; 
      
      // Roosting Z-Scatter (Prevents overlapping/z-fighting)
      // Large spread for Flying/Text, shader will reduce it for Wire
      zOffsetArray[i] = (Math.random() - 0.5) * 1.5; 

      // Lander Flag
      const isLander = landerSet.has(i);
      landerArray[i] = isLander ? 1.0 : 0.0;

      if (isLander) {
        birdsOnWire.push({ idx: i, t: 0 });
      }

      // PHYSICS INIT
      const rank = i / COUNT; 
      rankRef.current[i] = rank;
      
      // CREATE DEPTH VARIANCE
      // X and Y random scatter - NARROWER FOR RIVER EFFECT
      offsetRef.current[i * 3 + 0] = (Math.random() - 0.5) * 3.0; 
      offsetRef.current[i * 3 + 1] = (Math.random() - 0.5) * 1.5; 
      
      // Z DEPTH SMOOTHING:
      // Previously had a gap between -5 and -2 causing "Large" vs "Small" sizes.
      // Now using a continuous biased distribution from +2 (Front) to -10 (Back).
      // (1 - r^2) biases values towards 1, creating a denser core near the camera/spine.
      const r = Math.random();
      const zDepth = (1.0 - r * r) * 12.0 - 10.0; // Results in range approx [-10, 2]
      
      offsetRef.current[i * 3 + 2] = zDepth;
      
      positionRef.current[i * 3 + 0] = offsetRef.current[i * 3 + 0];
      positionRef.current[i * 3 + 1] = offsetRef.current[i * 3 + 1];
      positionRef.current[i * 3 + 2] = offsetRef.current[i * 3 + 2];
    }

    // 3. Roosting Clusters (Only for Landers)
    const numClusters = 3 + Math.floor(Math.random() * 3); 
    const clusters = [];
    for(let k=0; k<numClusters; k++) {
      clusters.push({
        center: 0.2 + Math.random() * 0.6, // Keep closer to center screen
        spread: 0.1 + Math.random() * 0.2 
      });
    }

    birdsOnWire.forEach(bird => {
      const cluster = clusters[Math.floor(Math.random() * clusters.length)];
      const offset = (Math.random() - 0.5) * cluster.spread;
      bird.t = cluster.center + offset;
    });

    // 4. Social Distance (Spacing on wire)
    birdsOnWire.sort((a, b) => a.t - b.t);
    const MIN_DISTANCE = 0.012; // More spacing for fewer birds

    for (let iter = 0; iter < 10; iter++) { 
      for (let j = 0; j < birdsOnWire.length - 1; j++) {
        const birdA = birdsOnWire[j];
        const birdB = birdsOnWire[j + 1];
        const dist = birdB.t - birdA.t;
        
        if (dist < MIN_DISTANCE) {
          const push = (MIN_DISTANCE - dist) * 0.5;
          birdA.t -= push;
          birdB.t += push;
        }
      }
    }

    birdsOnWire.forEach(bird => {
      const finalT = Math.max(0.01, Math.min(0.99, bird.t));
      wireTArray[bird.idx] = finalT;
    });

    return {
      attributes: {
        random: randomArray,
        wireT: wireTArray,
        zOffset: zOffsetArray,
        textPosition: textPositions,
        lander: landerArray
      }
    };
  }, []);

  useEffect(() => {
    if (meshRef.current) {
      const tempObj = new THREE.Object3D();
      for (let i = 0; i < COUNT; i++) {
        tempObj.position.set(0,0,0); 
        tempObj.updateMatrix();
        meshRef.current.setMatrixAt(i, tempObj.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
      
      meshRef.current.geometry.setAttribute('aRandom', new THREE.InstancedBufferAttribute(attributes.random, 3));
      meshRef.current.geometry.setAttribute('aWireT', new THREE.InstancedBufferAttribute(attributes.wireT, 1));
      meshRef.current.geometry.setAttribute('aZOffset', new THREE.InstancedBufferAttribute(attributes.zOffset, 1));
      meshRef.current.geometry.setAttribute('aTextPosition', new THREE.InstancedBufferAttribute(attributes.textPosition, 3));
      meshRef.current.geometry.setAttribute('aLander', new THREE.InstancedBufferAttribute(attributes.lander, 1));
      
      // Dynamic Attributes
      meshRef.current.geometry.setAttribute('aBasePosition', new THREE.InstancedBufferAttribute(positionRef.current, 3));
      meshRef.current.geometry.setAttribute('aVelocity', new THREE.InstancedBufferAttribute(headingVelRef.current, 3));
    }
  }, [attributes]);

  useFrame((state, delta) => {
    if (!shaderRef.current || !meshRef.current) return;
    
    // SAFETY CHECK: Ensure attributes exist before updating
    const geo = meshRef.current.geometry;
    if (!geo.attributes.aBasePosition || !geo.attributes.aVelocity) return;

    const time = state.clock.getElapsedTime();

    // --- SPINE PHYSICS (The Leader) ---
    // Update head node to follow mouse
    const head = spineRef.current[0];
    // Adjusted multiplier for Zoomed Camera (Z=5) to keep birds in frame
    const targetX = mousePosition.x * 6.5; 
    const targetY = mousePosition.y * 4.0;
    
    // Head follows mouse
    head.x = THREE.MathUtils.lerp(head.x, targetX, delta * 5.0);
    head.y = THREE.MathUtils.lerp(head.y, targetY, delta * 5.0);
    head.z = THREE.MathUtils.lerp(head.z, 0, delta * 5.0);
    
    // Body segments follow previous segment
    for (let i = 1; i < SPINE_COUNT; i++) {
      const prev = spineRef.current[i - 1];
      const curr = spineRef.current[i];
      
      // Drag effect: 
      // Higher drag = tighter following.
      // With high count (50), we use a relatively high uniform drag to act like a rope.
      const drag = 8.0 + (i * 0.1); 
      
      curr.x = THREE.MathUtils.lerp(curr.x, prev.x, delta * drag);
      curr.y = THREE.MathUtils.lerp(curr.y, prev.y, delta * drag);
      curr.z = THREE.MathUtils.lerp(curr.z, prev.z, delta * drag);
    }

    // --- BIRD PHYSICS (The Followers) ---
    const positions = positionRef.current;
    const velocities = velocityRef.current;
    const offsets = offsetRef.current;
    const ranks = rankRef.current;
    
    // Physics params
    const stiffness = 2.5; 
    const damping = 0.96;

    for (let i = 0; i < COUNT; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;
      
      const rank = ranks[i]; // 0 to 1
      
      // Find position on spine
      // Map rank to spine index (float)
      const spineFloatIndex = rank * (SPINE_COUNT - 1);
      const idxA = Math.floor(spineFloatIndex);
      const idxB = Math.min(idxA + 1, SPINE_COUNT - 1);
      const alpha = spineFloatIndex - idxA;
      
      const nodeA = spineRef.current[idxA];
      const nodeB = spineRef.current[idxB];
      
      // Interpolated Spine Position
      const spineX = THREE.MathUtils.lerp(nodeA.x, nodeB.x, alpha);
      const spineY = THREE.MathUtils.lerp(nodeA.y, nodeB.y, alpha);
      const spineZ = THREE.MathUtils.lerp(nodeA.z, nodeB.z, alpha);

      // Target = Spine Point + Offset + Undulation
      let tx = spineX + offsets[ix];
      let ty = spineY + offsets[iy];
      let tz = spineZ + offsets[iz];

      // Add life/noise
      tx += Math.sin(time * 1.5 + offsets[iy]) * 0.2;
      ty += Math.cos(time * 1.2 + offsets[ix]) * 0.2;

      // Spring Physics
      const ax = (tx - positions[ix]) * stiffness;
      const ay = (ty - positions[iy]) * stiffness;
      const az = (tz - positions[iz]) * stiffness;

      velocities[ix] += ax * delta;
      velocities[iy] += ay * delta;
      velocities[iz] += az * delta;

      velocities[ix] *= damping;
      velocities[iy] *= damping;
      velocities[iz] *= damping;

      positions[ix] += velocities[ix] * delta;
      positions[iy] += velocities[iy] * delta;
      positions[iz] += velocities[iz] * delta;
    }

    // Compute heading from actual position delta (prev frame → this frame)
    const prevPos = prevPositionRef.current;
    const headingVel = headingVelRef.current;
    for (let i = 0; i < COUNT; i++) {
      const ix = i * 3, iy = i * 3 + 1;
      headingVel[ix] = positions[ix] - prevPos[ix];
      headingVel[iy] = positions[iy] - prevPos[iy];
      prevPos[ix] = positions[ix];
      prevPos[iy] = positions[iy];
    }

    // Flag attributes for update
    geo.attributes.aBasePosition.needsUpdate = true;
    geo.attributes.aVelocity.needsUpdate = true;


    // --- UNIFORM UPDATES ---
    shaderRef.current.uniforms.uTime.value = time;
    
    const timeSinceStart = (Date.now() - introStartTime.current) / 1000;
    const textFormValue = Math.max(0, 1.0 - Math.max(0, timeSinceStart - 1.5) * 0.5);
    shaderRef.current.uniforms.uFormText.value = textFormValue;

    const isRoosting = currentView !== 'NEST';
    const desiredState = isRoosting ? 1.0 : 0.0;
    const currentState = shaderRef.current.uniforms.uState.value;
    shaderRef.current.uniforms.uState.value = THREE.MathUtils.lerp(currentState, desiredState, delta * 2.0);

    let targetExplode = 1.0;
    if (transitionStage === 'GATHERING') targetExplode = 0.0;
    if (transitionStage === 'EXPLODING') targetExplode = 1.0;
    
    const currentExplode = shaderRef.current.uniforms.uExplode.value;
    const speed = transitionStage === 'GATHERING' ? 3.0 : 1.0;
    const newExplode = THREE.MathUtils.lerp(currentExplode, targetExplode, delta * speed);
    
    shaderRef.current.uniforms.uExplode.value = newExplode;
    shaderRef.current.uniforms.uAnchor.value.copy(anchorPoint);

    if (transitionStage === 'GATHERING' && newExplode < 0.05) {
      setTransitionStage('EXPLODING');
    }
  });

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uState: { value: 0 },
        uExplode: { value: 1.0 }, 
        uFormText: { value: 1.0 },
        uAnchor: { value: new THREE.Vector3(0,0,0) },
      },
      side: THREE.DoubleSide,
    });
  }, []);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <coneGeometry args={[0.08, 0.14, 3]} />
      <primitive object={shaderMaterial} ref={shaderRef} attach="material" />
    </instancedMesh>
  );
};