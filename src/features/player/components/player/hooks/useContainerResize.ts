// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
import React, { useEffect, useCallback } from 'react';
import { ZOOM } from '../../../../../config/constants';

interface UseContainerResizeProps {
  timelineRef: React.RefObject<HTMLDivElement | null>;
  setContainerWidth: (width: number) => void;
  song: any;
  containerWidth: number;
  setZoom: (zoom: number) => void;
}

export const useContainerResize = ({
  timelineRef,
  setContainerWidth,
  song,
  containerWidth,
  setZoom,
}: UseContainerResizeProps) => {
  useEffect(() => {
    const measureWidth = () => {
      if (timelineRef.current) {
        setContainerWidth(timelineRef.current.clientWidth);
      }
    };

    const timeoutId = setTimeout(measureWidth, 0);
    window.addEventListener('resize', measureWidth);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', measureWidth);
    };
  }, [timelineRef, setContainerWidth]);

  useEffect(() => {
    if (!song || containerWidth === 0) return;
    
    const targetZoom = containerWidth / (song.duration * ZOOM.BASE_PPS);
    const safeZoom = Math.max(ZOOM.MIN, Math.min(ZOOM.MAX, targetZoom));
    
    setZoom(safeZoom);
    
    if (timelineRef.current) {
      timelineRef.current.scrollLeft = 0;
    }
  }, [song?.id, containerWidth, setZoom, timelineRef]);
};
