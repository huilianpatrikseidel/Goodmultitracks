// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
import { useState, useEffect, useCallback } from 'react';
import { Song } from '../../../types';
import { measureToSeconds, secondsToMeasure, calculateWarpBPM } from '../../../lib/timeUtils';

interface UseWarpInteractionProps {
  song: Song;
  timelineWidth: number;
  onWarpCommit?: (prevAnchor: number, draggedMeasure: number, newBpm: number) => void;
  warpMode?: boolean;
}

export const useWarpInteraction = ({
  song,
  timelineWidth,
  onWarpCommit,
  warpMode
}: UseWarpInteractionProps) => {
  const [isWarpDragging, setIsWarpDragging] = useState(false);
  const [warpState, setWarpState] = useState<{
    dragMeasure: number;
    anchorMeasure: number;
    anchorTime: number;
    startPixel: number;
    originalTime: number;
  } | null>(null);
  const [warpGhostTime, setWarpGhostTime] = useState<number | null>(null);

  const handleWarpMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>, rect: DOMRect) => {
    if (!warpMode) return false;

    e.preventDefault();
    e.stopPropagation();
    
    const x = e.clientX - rect.left;
    const time = (x / timelineWidth) * song.duration;
    
    const tempoChanges = song.tempoChanges || [];
    const measureFloat = secondsToMeasure(time, tempoChanges, song.tempo);
    const clickedMeasure = Math.round(measureFloat);
    
    // Find previous anchor
    const sortedChanges = [...tempoChanges].sort((a, b) => a.time - b.time);
    const prevChange = sortedChanges.slice().reverse().find(tc => tc.time < clickedMeasure);
    const anchorMeasure = prevChange ? prevChange.time : 1;
    
    if (clickedMeasure <= anchorMeasure) return true; // Can't warp start or backwards
    
    const anchorTime = measureToSeconds(anchorMeasure, tempoChanges, song.tempo);
    const originalTime = measureToSeconds(clickedMeasure, tempoChanges, song.tempo);
    
    setWarpState({
      dragMeasure: clickedMeasure,
      anchorMeasure,
      anchorTime,
      startPixel: e.clientX,
      originalTime
    });
    setIsWarpDragging(true);
    setWarpGhostTime(originalTime);
    return true;
  }, [warpMode, timelineWidth, song]);

  useEffect(() => {
    if (!isWarpDragging || !warpState) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      document.body.style.cursor = 'col-resize';
      
      const deltaPixels = e.clientX - warpState.startPixel;
      const pps = timelineWidth / song.duration;
      const deltaSeconds = deltaPixels / pps;
      const newTime = warpState.originalTime + deltaSeconds;
      
      // Update ghost line
      if (newTime > warpState.anchorTime) {
          setWarpGhostTime(newTime);
      }
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      document.body.style.cursor = 'default';
      
      const deltaPixels = e.clientX - warpState.startPixel;
      const pps = timelineWidth / song.duration;
      const deltaSeconds = deltaPixels / pps;
      
      const newTime = warpState.originalTime + deltaSeconds;
      
      // Clamp: newTime must be > anchorTime
      if (newTime <= warpState.anchorTime) {
        setIsWarpDragging(false);
        setWarpState(null);
        setWarpGhostTime(null);
        return;
      }
      
      const deltaMeasures = warpState.dragMeasure - warpState.anchorMeasure;
      const segmentDuration = newTime - warpState.anchorTime;
      
      const change = (song.tempoChanges || []).find(tc => tc.time === warpState.anchorMeasure);
      const ts = change ? change.timeSignature : '4/4';
      const [beats] = ts.split('/').map(Number);
      
      const newBpm = calculateWarpBPM(deltaMeasures, segmentDuration, beats);
      
      if (onWarpCommit) {
        onWarpCommit(warpState.anchorMeasure, warpState.dragMeasure, newBpm);
      }
      
      setIsWarpDragging(false);
      setWarpState(null);
      setWarpGhostTime(null);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
  }, [isWarpDragging, warpState, timelineWidth, song, onWarpCommit]);

  return {
    isWarpDragging,
    warpState,
    warpGhostTime,
    handleWarpMouseDown
  };
};

