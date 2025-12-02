/**
 * useTrackWaveform - Reactive hook for waveform data
 * 
 * REACTIVITY FIX (26/11/2025):
 * Connects React components to WaveformStore updates.
 * Automatically re-renders when async Worker processing completes.
 * 
 * LOD OPTIMIZATION:
 * - zoom < 0.5: Uses overview array (2000 points, lightweight)
 * - zoom >= 0.5: Uses full waveform (150k points, high detail)
 */

import { useState, useEffect, useCallback } from 'react';
import { waveformStore } from '../../../lib/waveformStore';

export function useTrackWaveform(trackId: string, zoom: number = 1): number[] {
  // LOD: Decide qual array usar baseado no zoom
  // Zoom < 0.5 = muito distante, usa overview
  const getData = useCallback(() => {
    const useOverview = zoom < 0.5;
    if (useOverview) {
      const overview = waveformStore.getOverview(trackId);
      if (overview && overview.length > 0) {
        return overview;
      }
    }
    
    // Fallback para waveform completa
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
