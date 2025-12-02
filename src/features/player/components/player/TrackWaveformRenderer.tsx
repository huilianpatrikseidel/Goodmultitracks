/**
 * TrackWaveformRenderer - Reactive waveform display component
 * 
 * REACTIVITY FIX (26/11/2025):
 * Isolated component that re-renders only when waveform data arrives
 * from async Worker, without causing parent Timeline to re-render.
 * 
 * Uses useTrackWaveform hook to subscribe to WaveformStore updates.
 */

import React from 'react';
import { Waveform } from '../visuals';
import { useTrackWaveform } from '../../hooks/useTrackWaveform';

interface TrackWaveformRendererProps {
  trackId: string;
  color: string;
  duration: number;
  pps: number; // pixels per second
  height: number;
  zoom: number;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  scrollPosRef: React.MutableRefObject<number>;
}

export const TrackWaveformRenderer = React.memo<TrackWaveformRendererProps>(({
  trackId,
  color,
  duration,
  pps,
  height,
  zoom,
  scrollContainerRef,
  scrollPosRef,
}) => {
  // Hook reativo: atualiza automaticamente quando Worker terminar
  const waveformData = useTrackWaveform(trackId, zoom);

  return (
    <div className="waveform-container" style={{ height: 'calc(100% - 20px)' }}>
      <Waveform
        data={waveformData}
        width={duration * pps}
        height={height}
        fill={color || '#3b82f6'}
        opacity={0.8}
        useCanvas={true}
        scrollContainerRef={scrollContainerRef}
        scrollPosRef={scrollPosRef}
        zoom={zoom}
      />
    </div>
  );
});

TrackWaveformRenderer.displayName = 'TrackWaveformRenderer';
