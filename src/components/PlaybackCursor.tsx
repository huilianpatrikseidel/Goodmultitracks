import React, { useMemo, useRef, useEffect } from 'react';
import { CURSOR } from '../config/constants';

interface PlaybackCursorProps {
  currentTime: number;
  duration: number;
  zoom: number;
  containerWidth?: number;
  isPlaying?: boolean;
}

/**
 * PlaybackCursor - Independent cursor component
 * 
 * P1 FIX: Cursor animado via requestAnimationFrame desacoplado do React
 * para movimento fluido sincronizado com vsync, sem jitter.
 * 
 * PERFORMANCE OPTIMIZATION: This component is separated from RulersContainer
 * to prevent re-rendering the entire ruler system on every frame.
 * Only the cursor position updates during playback.
 * 
 * Uses transform3d for hardware acceleration and smooth 60fps updates.
 */
export const PlaybackCursor: React.FC<PlaybackCursorProps> = ({
  currentTime,
  duration,
  zoom,
  containerWidth = 1000,
  isPlaying = false,
}) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef(currentTime);
  
  // Calculate pixel position (memoized to avoid recalculation on every render)
  const leftPosition = useMemo(() => {
    const pixelsPerSecond = (containerWidth * zoom / 100) / duration;
    return currentTime * pixelsPerSecond;
  }, [currentTime, duration, zoom, containerWidth]);
  
  // P1 FIX: Animação suave via RAF quando tocando
  useEffect(() => {
    if (!isPlaying || !cursorRef.current) {
      // Quando parado, usa posição do React normalmente
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${leftPosition}px, 0, 0)`;
      }
      lastTimeRef.current = currentTime;
      return;
    }
    
    const startTime = performance.now();
    const startPosition = leftPosition;
    const pps = (containerWidth * zoom / 100) / duration;
    
    const animate = (now: number) => {
      if (!cursorRef.current) return;
      
      const elapsed = (now - startTime) / 1000; // segundos
      const newPosition = startPosition + (elapsed * pps);
      
      cursorRef.current.style.transform = `translate3d(${newPosition}px, 0, 0)`;
      
      if (isPlaying) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, leftPosition, containerWidth, zoom, duration, currentTime]);

  return (
    <div
      ref={cursorRef}
      className="absolute top-0 bottom-0 pointer-events-none"
      style={{
        left: 0,
        width: CURSOR.WIDTH,
        transform: `translate3d(${leftPosition}px, 0, 0)`,
        zIndex: CURSOR.Z_INDEX,
        willChange: isPlaying ? 'transform' : 'auto', // Hint to browser for optimization
      }}
    >
      {/* Cursor line */}
      <div
        className="h-full"
        style={{
          width: CURSOR.WIDTH,
          backgroundColor: CURSOR.COLOR,
          boxShadow: `0 0 8px ${CURSOR.COLOR}`,
        }}
      />
      
      {/* Cursor handle (top) */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2"
        style={{
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: `8px solid ${CURSOR.COLOR}`,
        }}
      />
    </div>
  );
};

export default PlaybackCursor;
