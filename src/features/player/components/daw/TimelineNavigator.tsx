import React, { useState, useEffect, useRef } from 'react';
import { ScrollZoomSlider } from '../../../../components/player';
import { ZOOM } from '../../../../config/constants';

interface TimelineNavigatorProps {
  songDuration: number;
  zoom: number;
  containerWidth: number;
  timelineRef: React.RefObject<HTMLDivElement | null>;
  onNavigate: (newZoom: number, newScrollLeft: number) => void;
}

export function TimelineNavigator({ 
  songDuration, 
  zoom, 
  containerWidth, 
  timelineRef, 
  onNavigate 
}: TimelineNavigatorProps) {
  const [range, setRange] = useState({ start: 0, end: 1 });
  const isDraggingRef = useRef(false);

  // Sync from Timeline to Slider
  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;

    const updateRange = () => {
      if (isDraggingRef.current) return;

      const scrollLeft = timeline.scrollLeft;
      const totalWidth = songDuration * ZOOM.BASE_PPS * zoom;
      
      if (totalWidth === 0) return;

      const start = scrollLeft / totalWidth;
      const end = (scrollLeft + containerWidth) / totalWidth;

      setRange({
        start: Math.max(0, start),
        end: Math.min(1, end)
      });
    };

    updateRange();
    timeline.addEventListener('scroll', updateRange);
    return () => timeline.removeEventListener('scroll', updateRange);
  }, [songDuration, zoom, containerWidth, timelineRef]);

  const handleSliderChange = React.useCallback(({ start, end }: { start: number; end: number }) => {
    isDraggingRef.current = true;
    setRange({ start, end });

    const widthPercent = end - start;
    if (widthPercent <= 0.0001) return;

    // Calculate new zoom
    const newTotalWidth = containerWidth / widthPercent;
    const newZoom = newTotalWidth / (songDuration * ZOOM.BASE_PPS);
    
    // Clamp zoom
    const clampedZoom = Math.max(ZOOM.MIN, Math.min(ZOOM.MAX, newZoom));
    
    // Calculate new scroll
    const actualTotalWidth = songDuration * ZOOM.BASE_PPS * clampedZoom;
    const newScrollLeft = start * actualTotalWidth;

    onNavigate(clampedZoom, newScrollLeft);
    
    setTimeout(() => {
        isDraggingRef.current = false;
    }, 100);
  }, [containerWidth, songDuration, onNavigate]);

  return (
    <div className="flex-1 px-4 flex items-center h-full">
      <ScrollZoomSlider
        start={range.start}
        end={range.end}
        onChange={handleSliderChange}
        className="h-5 w-full"
      />
    </div>
  );
}
