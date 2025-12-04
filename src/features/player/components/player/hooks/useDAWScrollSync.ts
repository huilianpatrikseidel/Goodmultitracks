import { useState, useEffect, useRef, useCallback } from 'react';
import { ZOOM } from '../../../../config/constants';

interface UseDAWScrollSyncProps {
  zoom: number;
  setZoom: (zoom: number) => void;
  timelineRef: React.RefObject<HTMLDivElement>;
  rulerRef: React.RefObject<HTMLDivElement>;
  currentTime: number;
}

export const useDAWScrollSync = ({
  zoom,
  setZoom,
  timelineRef,
  rulerRef,
  currentTime,
}: UseDAWScrollSyncProps) => {
  const scrollLeftRef = useRef(0);
  const pendingZoomScrollRef = useRef<number | null>(null);

  // Sincronização horizontal de scroll
  const syncHorizontalScroll = useCallback((scrollLeft: number) => {
    if (rulerRef.current) rulerRef.current.scrollLeft = scrollLeft;
  }, [rulerRef]);

  const handleTimelineScroll = useCallback((scrollLeft: number) => {
    scrollLeftRef.current = scrollLeft;
    syncHorizontalScroll(scrollLeft);
  }, [syncHorizontalScroll]);

  const handleNavigatorChange = useCallback((newZoom: number, newScrollLeft: number) => {
    setZoom(newZoom);
    if (timelineRef.current) timelineRef.current.scrollLeft = newScrollLeft;
    if (rulerRef.current) rulerRef.current.scrollLeft = newScrollLeft;
    scrollLeftRef.current = newScrollLeft;
  }, [setZoom, timelineRef, rulerRef]);

  // Wheel zoom handler
  useEffect(() => {
    const timelineElement = timelineRef.current;
    const rulerElement = rulerRef.current;

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;

      e.preventDefault();
      e.stopPropagation();

      const zoomFactor = e.deltaY > 0 ? (1 / ZOOM.FACTOR) : ZOOM.FACTOR;
      const newZoom = Math.max(ZOOM.MIN, Math.min(ZOOM.MAX, zoom * zoomFactor));
      
      if (newZoom === zoom) return;

      const rect = timelineRef.current?.getBoundingClientRect();
      const mouseX = rect ? e.clientX - rect.left : 0;
      const currentScroll = timelineRef.current?.scrollLeft || 0;
      const cursorAbsolutePos = currentScroll + mouseX;
      const oldPPS = ZOOM.BASE_PPS * zoom;
      const cursorTime = cursorAbsolutePos / oldPPS;
      
      setZoom(newZoom);

      const newPPS = ZOOM.BASE_PPS * newZoom;
      const newCursorAbsolutePos = cursorTime * newPPS;
      const newScroll = Math.max(0, newCursorAbsolutePos - mouseX);
      
      pendingZoomScrollRef.current = newScroll;
    };
    
    if (timelineElement) {
      timelineElement.addEventListener('wheel', handleWheel, { passive: false });
    }
    if (rulerElement) {
      rulerElement.addEventListener('wheel', handleWheel, { passive: false });
    }
    
    return () => {
      if (timelineElement) timelineElement.removeEventListener('wheel', handleWheel);
      if (rulerElement) rulerElement.removeEventListener('wheel', handleWheel);
    };
  }, [zoom, setZoom, timelineRef, rulerRef]);

  // Apply pending scroll after zoom
  useEffect(() => {
    if (pendingZoomScrollRef.current !== null) {
      const targetScroll = pendingZoomScrollRef.current;
      
      if (timelineRef.current) timelineRef.current.scrollLeft = targetScroll;
      if (rulerRef.current) rulerRef.current.scrollLeft = targetScroll;
      
      scrollLeftRef.current = targetScroll;
      pendingZoomScrollRef.current = null;
    }
  }, [zoom, timelineRef, rulerRef]);

  return {
    scrollLeftRef,
    handleTimelineScroll,
    handleNavigatorChange,
  };
};
