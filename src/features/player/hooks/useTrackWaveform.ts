// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
/**
 * useTrackWaveform - Reactive hook for waveform data
 * 
 * REACTIVITY FIX (26/11/2025):
 * Connects React components to WaveformStore updates.
 * Automatically re-renders when async Worker processing completes.
 * 
 * MULTI-LEVEL LOD OPTIMIZATION (05/01/2026):
 * - zoom < 0.3: Overview array (2k points) - distant view, <1ms render
 * - zoom < 1.5: Medium array (20k points) - normal editing, <5ms render
 * - zoom >= 1.5: Detail array (150k points) - zoomed detail, <16ms render
 * 
 * Thresholds are configurable in constants.ts (LOD.LOW_ZOOM_THRESHOLD, etc.)
 */

import { useState, useEffect, useCallback } from 'react';
import { waveformStore } from '../../../lib/waveformStore';
import { LOD } from '../../../config/constants';

export function useTrackWaveform(trackId: string, zoom: number = 1): number[] {
  // MULTI-LEVEL LOD: Select appropriate detail level based on zoom
  const getData = useCallback(() => {
    // Level 1: Low detail (distant view)
    if (zoom < LOD.LOW_ZOOM_THRESHOLD) {
      const overview = waveformStore.getOverview(trackId);
      if (overview && overview.length > 0) {
        return overview;
      }
    }
    
    // Level 2: Medium detail (normal editing)
    if (zoom < LOD.MEDIUM_ZOOM_THRESHOLD) {
      const medium = waveformStore.getMedium(trackId);
      if (medium && medium.length > 0) {
        return medium;
      }
    }
    
    // Level 3: High detail (zoomed in) - fallback to full waveform
    return waveformStore.getWaveform(trackId) || [];
  }, [trackId, zoom]);

  const [data, setData] = useState<number[]>(() => getData());

  useEffect(() => {
    // Inscreve-se para updates assíncronos
    const unsubscribe = waveformStore.subscribe(() => {
      setData(getData());
    });

    // Atualiza imediatamente caso já tenha dados
    const currentData = getData();
    if (currentData.length > 0) {
      setData(currentData);
    }

    return unsubscribe;
  }, [getData]);

  return data;
}

