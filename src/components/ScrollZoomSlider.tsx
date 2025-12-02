import React, { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from './ui/utils';

interface ScrollZoomSliderProps {
  /** Normalized start position (0.0 to 1.0) */
  start: number;
  /** Normalized end position (0.0 to 1.0) */
  end: number;
  /** Callback when the range changes */
  onChange: (range: { start: number; end: number }) => void;
  /** Minimum width of the viewport in normalized units (default: 0.01) */
  minWidth?: number;
  /** Optional class name for the container */
  className?: string;
}

type DragType = 'left' | 'right' | 'pan';

interface DragState {
  type: DragType;
  startX: number;
  initialStart: number;
  initialEnd: number;
}

export const ScrollZoomSlider: React.FC<ScrollZoomSliderProps> = ({
  start,
  end,
  onChange,
  minWidth = 0.01,
  className,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);

  // Helper to get normalized mouse position relative to track
  const getNormalizedX = useCallback((clientX: number) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    return Math.max(0, Math.min(1, x / rect.width));
  }, []);

  // Handle mouse down events
  const handleMouseDown = (e: React.MouseEvent, type: DragType) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragState({
      type,
      startX: e.clientX,
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
      const trackWidth = rect.width;
      
      // Calculate delta in normalized units
      // For pan, we use the delta from the start drag position
      // For handles, we recalculate the absolute position
      
      let newStart = dragState.initialStart;
      let newEnd = dragState.initialEnd;

      if (dragState.type === 'pan') {
        const deltaPixels = e.clientX - dragState.startX;
        const deltaNormalized = deltaPixels / trackWidth;
        
        newStart = dragState.initialStart + deltaNormalized;
        newEnd = dragState.initialEnd + deltaNormalized;

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
        
        // Double check to ensure we don't exceed bounds due to floating point errors
        newStart = Math.max(0, Math.min(1 - (dragState.initialEnd - dragState.initialStart), newStart));
        newEnd = Math.min(1, Math.max(dragState.initialEnd - dragState.initialStart, newEnd));

      } else if (dragState.type === 'left') {
        const currentVal = getNormalizedX(e.clientX);
        // Left handle logic:
        // 1. Calculate new start based on mouse position
        // 2. Clamp so it doesn't cross end - minWidth
        newStart = Math.min(currentVal, dragState.initialEnd - minWidth);
        newStart = Math.max(0, newStart); // Ensure >= 0
        newEnd = dragState.initialEnd; // End stays fixed

      } else if (dragState.type === 'right') {
        const currentVal = getNormalizedX(e.clientX);
        // Right handle logic:
        // 1. Calculate new end based on mouse position
        // 2. Clamp so it doesn't cross start + minWidth
        newEnd = Math.max(currentVal, dragState.initialStart + minWidth);
        newEnd = Math.min(1, newEnd); // Ensure <= 1
        newStart = dragState.initialStart; // Start stays fixed
      }

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
  }, [dragState, start, end, minWidth, onChange, getNormalizedX]);

  // Handle track click (reposition viewport)
  const handleTrackClick = (e: React.MouseEvent) => {
    // Only process if clicking directly on track (not on thumb or handles)
    if (e.target !== trackRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const clickX = getNormalizedX(e.clientX);
    const viewportWidth = end - start;
    
    // Center the viewport at the click position
    let newStart = clickX - (viewportWidth / 2);
    let newEnd = clickX + (viewportWidth / 2);
    
    // Clamp to bounds
    if (newStart < 0) {
      newStart = 0;
      newEnd = viewportWidth;
    }
    if (newEnd > 1) {
      newEnd = 1;
      newStart = 1 - viewportWidth;
    }
    
    onChange({ start: newStart, end: newEnd });
  };

  // Calculate styles
  const leftPercent = start * 100;
  const widthPercent = (end - start) * 100;

  return (
    <div 
      ref={trackRef}
      onClick={handleTrackClick}
      className={cn(
        "relative w-full select-none touch-none flex items-center border border-white/10 rounded-full cursor-pointer",
        className
      )}
      style={{ 
        backgroundColor: '#18181b',
        height: '14px' // Fixed height for the track (allows 12px internal height for thumb)
      }} 
    >
      {/* Viewport / Thumb (Visual Bar Only) */}
      <div
        className="absolute top-0 bottom-0 rounded-full group transition-colors cursor-grab active:cursor-grabbing hover:brightness-110"
        style={{
          left: `${leftPercent}%`,
          width: `${widthPercent}%`,
          backgroundColor: '#52525b',
          border: '1px solid #71717a',
          boxSizing: 'border-box'
        }}
        onMouseDown={(e) => handleMouseDown(e, 'pan')}
      />

      {/* Left Handle (Separated from Thumb to avoid clipping) */}
      <div
        className="absolute top-1/2 w-6 h-6 cursor-ew-resize z-20 group/handle"
        style={{ 
            left: `${leftPercent}%`,
            transform: 'translate(-50%, -50%)'
        }}
        onMouseDown={(e) => handleMouseDown(e, 'left')}
      >
        {/* Visual Circle */}
        <div 
            className="absolute top-1/2 left-1/2 w-3 h-3 bg-white rounded-full shadow-sm transition-transform hover:scale-150"
            style={{ transform: 'translate(-50%, -50%)' }}
        />
      </div>

      {/* Right Handle (Separated from Thumb to avoid clipping) */}
      <div
        className="absolute top-1/2 w-6 h-6 cursor-ew-resize z-20 group/handle"
        style={{ 
            left: `${(end * 100)}%`,
            transform: 'translate(-50%, -50%)'
        }}
        onMouseDown={(e) => handleMouseDown(e, 'right')}
      >
        {/* Visual Circle */}
        <div 
            className="absolute top-1/2 left-1/2 w-3 h-3 bg-white rounded-full shadow-sm transition-transform hover:scale-150"
            style={{ transform: 'translate(-50%, -50%)' }}
        />
      </div>
    </div>
  );
};
