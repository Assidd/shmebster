import { useSyncExternalStore } from 'react';
import type { Canvas } from 'fabric';

let instance: Canvas | null = null;
const listeners = new Set<() => void>();

export function setCanvasInstance(canvas: Canvas | null) {
  instance = canvas;
  listeners.forEach((listener) => listener());
}

export function getCanvasInstance(): Canvas | null {
  return instance;
}

export function useCanvasInstance(): Canvas | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getCanvasInstance,
    () => null,
  );
}
