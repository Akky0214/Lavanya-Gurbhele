import React, { useEffect, useRef } from 'react';
import { SceneManager } from '../three/SceneManager';
import { SystemId, VisualMode, SimulationParams } from '../types/energy';

interface ThreeCanvasProps {
  currentSystemId: SystemId;
  visualMode: VisualMode;
  explodedOffset: number;
  simParams: SimulationParams;
  onSelectComponent: (partId: string, systemId: SystemId) => void;
  sceneManagerRef: React.MutableRefObject<SceneManager | null>;
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  currentSystemId,
  visualMode,
  explodedOffset,
  simParams,
  onSelectComponent,
  sceneManagerRef,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const manager = new SceneManager({
      container: mountRef.current,
      onSelectComponent,
    });
    sceneManagerRef.current = manager;

    return () => {
      manager.dispose();
      sceneManagerRef.current = null;
    };
  }, []);

  // Update system ID when changed
  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.switchSystem(currentSystemId);
    }
  }, [currentSystemId]);

  // Update visual mode
  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setVisualMode(visualMode);
    }
  }, [visualMode]);

  // Update exploded view slider
  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setExplodedOffset(explodedOffset);
    }
  }, [explodedOffset]);

  // Update simulation parameters (sun angle, ambient temp, etc.)
  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.updateSimParams(simParams);
    }
  }, [simParams]);

  return (
    <div id="tour-3d-viewport" className="absolute inset-0 w-full h-full overflow-hidden bg-slate-950">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};
