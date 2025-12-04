import { useState, useCallback } from 'react';
import { ZOOM } from '../../../../../config/constants';
import { Song } from '../../../../../types';

interface UseZoomControlsProps {
  zoom: number;
  setZoom: (zoom: number) => void;
  song: Song | null;
  containerWidth: number;
}

export const useZoomControls = ({ zoom, setZoom, song, containerWidth }: UseZoomControlsProps) => {
  const calculateFitZoom = useCallback(() => {
    if (!song || containerWidth === 0) return 1;
    return containerWidth / (song.duration * ZOOM.BASE_PPS);
  }, [song, containerWidth]);

  const handleZoomOutOnPlayhead = useCallback(() => {
    setZoom((prev: number) => Math.max(ZOOM.MIN, prev - 0.25));
  }, [setZoom]);

  const handleZoomInOnPlayhead = useCallback(() => {
    setZoom((prev: number) => Math.min(ZOOM.MAX, prev + 0.25));
  }, [setZoom]);

  const handleFitToView = useCallback(() => {
    const fitZoom = calculateFitZoom();
    const clampedZoom = Math.max(ZOOM.MIN, Math.min(ZOOM.MAX, fitZoom));
    setZoom(clampedZoom);
  }, [calculateFitZoom, setZoom]);

  return {
    handleZoomOutOnPlayhead,
    handleZoomInOnPlayhead,
    handleFitToView,
  };
};
