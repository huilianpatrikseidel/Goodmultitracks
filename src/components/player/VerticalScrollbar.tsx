import React, { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from './ui/utils';

interface VerticalScrollbarProps {
  /** Normalized start position (0.0 to 1.0) */
  start: number;
  /** Normalized end position (0.0 to 1.0) */
  end: number;
  /** Callback when the range changes */
  onChange: (range: { start: number; end: number }) => void;
  /** Minimum height of the viewport in normalized units (default: 0.01) */
  minHeight?: number;
  /** Optional class name for the container */
  className?: string;
}

interface DragState {
  startY: number;
  initialStart: number;
  initialEnd: number;
}

export const VerticalScrollbar: React.FC<VerticalScrollbarProps> = ({
  start,
  end,
  onChange,
  minHeight = 0.01,
  className,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);

  // Helper to get normalized mouse position relative to track
  const getNormalizedY = useCallback((clientY: number) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const y = clientY - rect.top;
    return Math.max(0, Math.min(1, y / rect.height));
  }, []);

  // Handle mouse down on thumb
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragState({
      startY: e.clientY,
      initialStart: start,
      initialEnd: end,
    });
  };

  // Global mouse move handler
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!trackRef.current) return;

      const rect = trackRef.current.getBoundingClientRect();
      const trackHeight = rect.height;
      
      // Calculate delta in normalized units
      const deltaPixels = e.clientY - dragState.startY;
      const deltaNormalized = deltaPixels / trackHeight;
      
      let newStart = dragState.initialStart + deltaNormalized;
      let newEnd = dragState.initialEnd + deltaNormalized;

      // Clamp pan to bounds
      if (newStart < 0) {
        const offset = 0 - newStart;
        newStart += offset;
        newEnd += offset;
      }
      if (newEnd > 1) {
        const offset = 1 - newEnd;
        newStart += offset;
        newEnd += offset;
      }
      
      // Double check to ensure we don't exceed bounds
      newStart = Math.max(0, Math.min(1 - (dragState.initialEnd - dragState.initialStart), newStart));
      newEnd = Math.min(1, Math.max(dragState.initialEnd - dragState.initialStart, newEnd));

      // Only update if values changed significantly
      if (Math.abs(newStart - start) > 0.0001 || Math.abs(newEnd - end) > 0.0001) {
        onChange({ start: newStart, end: newEnd });
      }
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, start, end, onChange]);

  // Handle track click (reposition viewport)
  const handleTrackClick = (e: React.MouseEvent) => {
    // Only process if clicking directly on track (not on thumb)
    if (e.target !== trackRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const clickY = getNormalizedY(e.clientY);
    const viewportHeight = end - start;
    
    // Center the viewport at the click position
    let newStart = clickY - (viewportHeight / 2);
    let newEnd = clickY + (viewportHeight / 2);
    
    // Clamp to bounds
    if (newStart < 0) {
      newStart = 0;
      newEnd = viewportHeight;
    }
    if (newEnd > 1) {
      newEnd = 1;
      newStart = 1 - viewportHeight;
    }
    
    onChange({ start: newStart, end: newEnd });
  };

  // Calculate styles
  const topPercent = start * 100;
  const heightPercent = (end - start) * 100;

  return (
    <div 
      ref={trackRef}
      onClick={handleTrackClick}
      className={cn(
        "relative h-full select-none touch-none flex justify-center border border-white/10 rounded-full cursor-pointer",
        className
      )}
      style={{ 
        backgroundColor: '#18181b',
        width: '14px' // Fixed width for the track
      }} 
    >
      {/* Viewport / Thumb (Visual Bar Only) */}
      <div
        className="absolute left-0 right-0 rounded-full transition-colors cursor-grab active:cursor-grabbing hover:brightness-110"
        style={{
          top: `${topPercent}%`,
          height: `${heightPercent}%`,
          backgroundColor: '#52525b',
          border: '1px solid #71717a',
          boxSizing: 'border-box'
        }}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
};
