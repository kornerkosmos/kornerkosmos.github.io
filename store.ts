import { create } from 'zustand';
import { ViewState } from './types';
import * as THREE from 'three';

interface AppState {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  
  // Transition Logic
  anchorPoint: THREE.Vector3; // World space anchor
  setAnchorPoint: (point: THREE.Vector3) => void;
  
  transitionStage: 'IDLE' | 'GATHERING' | 'EXPLODING';
  setTransitionStage: (stage: 'IDLE' | 'GATHERING' | 'EXPLODING') => void;

  mousePosition: { x: number; y: number };
  setMousePosition: (x: number, y: number) => void;
}

export const useStore = create<AppState>((set) => ({
  currentView: 'NEST',
  setView: (view) => set({ currentView: view }),
  
  anchorPoint: new THREE.Vector3(0, 0, 0),
  setAnchorPoint: (point) => set({ anchorPoint: point }),
  
  transitionStage: 'EXPLODING', // Start exploding (intro)
  setTransitionStage: (stage) => set({ transitionStage: stage }),

  mousePosition: { x: 0, y: 0 },
  setMousePosition: (x, y) => set({ mousePosition: { x, y } }),
}));
