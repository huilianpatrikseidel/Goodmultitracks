/**
 * Waveform Component - Adaptive renderer
 * Uses Canvas for rendering with fallback support
 */

import React from 'react';
import { WaveformCanvas } from './WaveformCanvas';
import { WaveformCanvasOffscreen } from './WaveformCanvasOffscreen';

interface WaveformProps {
  data: number[];
  width: number;
  height: number;
  fill?: string;
  opacity?: number;
  className?: string;
  useCanvas?: boolean;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  scrollPosRef?: React.MutableRefObject<number>;
  zoom?: number;
}

export function Waveform({ 
  data, 
  width, 
  height, 
  fill = '#60a5fa', 
  opacity = 0.8,
  className = '',
  useCanvas = true,
  scrollContainerRef,
  scrollPosRef,
  zoom = 1
}: WaveformProps) {
  
  const hasCanvasSupport = typeof HTMLCanvasElement !== 'undefined';
  const hasOffscreenCanvasSupport = false;
  
  if (useCanvas && hasOffscreenCanvasSupport) {
    return (
      <WaveformCanvasOffscreen
        data={data}
        width={width}
        height={height}
        fill={fill}
        opacity={opacity}
        className={className}
        zoom={zoom}
      />
    );
  }
  
  return (
    <WaveformCanvas
      data={data}
      width={width}
      height={height}
      fill={fill}
      opacity={opacity}
      className={className}
      scrollContainerRef={scrollContainerRef || { current: null }}
      scrollPosRef={scrollPosRef}
      zoom={zoom}
    />
  );
}

export { WaveformCanvas } from './WaveformCanvas';

