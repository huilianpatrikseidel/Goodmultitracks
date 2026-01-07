// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
/**
 * useMetronome Hook
 * 
 * PHASE 5: Hook para metrônomo inteligente com acentuação hierárquica.
 * Integra análise de fórmula de compasso para tocar clicks com acentos corretos.
 * 
 * Funcionalidades:
 * - Acentuação hierárquica (downbeat > beat > subdivision)
 * - Suporte a compassos irregulares (5/8, 7/8)
 * - Suporte a compassos compostos (6/8, 9/8, 12/8)
 * - 3 modos: macro beats, all pulses, accented pulses
 * - Volume dinâmico baseado em accentLevel
 * 
 * @example
 * const { scheduleMetronomeClicks, metronomeStructure } = useMetronome({
 *   timeSignature: '6/8',
 *   tempo: 120,
 *   mode: 'accented'
 * });
 * 
 * // Agendar clicks para a próxima medida
 * scheduleMetronomeClicks(audioContext, startTime, 1.0);
 */

import { useMemo, useCallback } from 'react';
import { useMusicTheory } from './useMusicTheory';
import { 
  calculatePulseTime,
  calculateBeatTime,
} from '../lib/musicTheory';
import { playMetronomeClick } from '../features/player/engine/metronome';

export type MetronomeMode = 'macro' | 'all' | 'accented';

export interface UseMetronomeOptions {
  /** Time signature (e.g., '4/4', '6/8', '7/8') */
  timeSignature: string;
  /** Tempo in BPM */
  tempo: number;
  /** Metronome mode (default: 'macro') */
  mode?: MetronomeMode;
  /** Subdivision pattern for irregular meters (e.g., '2+3' for 5/8) */
  subdivision?: string;
}

export interface MetronomeClick {
  /** Time offset from start of measure (in seconds) */
  time: number;
  /** Accent level: 2 = downbeat, 1 = beat, 0 = subdivision */
  accentLevel: number;
  /** Volume (0-1) based on accent level */
  volume: number;
  /** Whether this is a strong beat (downbeat) */
  isDownbeat: boolean;
  /** Whether this is a subdivision */
  isSubdivision: boolean;
  /** Pulse index in the measure */
  pulseIndex: number;
}

export interface UseMetronomeReturn {
  /** Array of clicks for one measure */
  clicks: MetronomeClick[];
  /** Time signature info from music theory analysis */
  timeSignatureInfo: any;
  /** Metronome click structure from music theory */
  metronomeStructure: any;
  /** Schedule clicks for playback */
  scheduleMetronomeClicks: (
    audioContext: AudioContext,
    measureStartTime: number,
    globalVolume: number
  ) => void;
  /** Get click info at specific time */
  getClickAtTime: (timeInMeasure: number) => MetronomeClick | null;
}

/**
 * Hook for intelligent metronome with hierarchical accents
 */
export function useMetronome(options: UseMetronomeOptions): UseMetronomeReturn {
  const { timeSignature, tempo, mode = 'macro', subdivision } = options;

  // Get music theory analysis
  const { timeSignatureInfo } = useMusicTheory({
    key: 'C', // Key doesn't matter for metronome
    timeSignature,
    tempo,
  });

  // Import getMetronomeClickStructure from music theory library
  const metronomeStructure = useMemo(() => {
    // Use the timeSignatureInfo to get metronome structure
    // This comes from analyzeTimeSignature()
    if (!timeSignatureInfo) return null;
    
    const { getMetronomeClickStructure } = require('../lib/musicTheory');
    return getMetronomeClickStructure(timeSignatureInfo);
  }, [timeSignatureInfo]);

  /**
   * Generate clicks based on mode
   */
  const clicks = useMemo((): MetronomeClick[] => {
    if (!metronomeStructure || !timeSignatureInfo) return [];

    const clicksArray: MetronomeClick[] = [];
    const { numerator, denominator, beatsPerMeasure, beatUnit } = timeSignatureInfo;

    // Calculate seconds per measure
    const beatsInMeasure = metronomeStructure.macroBeats?.length || beatsPerMeasure;
    const secondsPerBeat = 60 / tempo;
    
    switch (mode) {
      case 'macro': {
        // Only macro beats (e.g., 2 beats in 6/8)
        const macroBeats = metronomeStructure.macroBeats || [];
        macroBeats.forEach((beatIndex: number, i: number) => {
          const time = calculateBeatTime(
            0, // measureStart (relative to measure start)
            beatIndex + 1, // beatNumber (1-based)
            timeSignatureInfo,
            tempo
          );
          
          clicksArray.push({
            time,
            accentLevel: beatIndex === 0 ? 2 : 1,
            volume: beatIndex === 0 ? 1.0 : 0.7,
            isDownbeat: beatIndex === 0,
            isSubdivision: false,
            pulseIndex: beatIndex,
          });
        });
        break;
      }

      case 'all': {
        // All pulses without accents (simple subdivision)
        const allPulses = metronomeStructure.allPulses || [];
        allPulses.forEach((pulseIndex: number) => {
          const time = calculatePulseTime(
            0, // measureStart (relative to measure start)
            pulseIndex, // pulseNumber (0-based)
            timeSignatureInfo,
            tempo
          );
          
          clicksArray.push({
            time,
            accentLevel: pulseIndex === 0 ? 2 : 0,
            volume: pulseIndex === 0 ? 1.0 : 0.4,
            isDownbeat: pulseIndex === 0,
            isSubdivision: pulseIndex !== 0,
            pulseIndex,
          });
        });
        break;
      }

      case 'accented': {
        // All pulses with hierarchical accents
        const allPulses = metronomeStructure.allPulses || [];
        const accentLevels = metronomeStructure.accentLevels || [];

        allPulses.forEach((pulseIndex: number, i: number) => {
          const accentLevel = accentLevels[i] || 0;
          const time = calculatePulseTime(
            0, // measureStart (relative to measure start)
            pulseIndex, // pulseNumber (0-based)
            timeSignatureInfo,
            tempo
          );

          // Map accent level to volume
          const volumeMap = {
            2: 1.0,   // Downbeat - forte
            1: 0.7,   // Beat - médio
            0: 0.4,   // Subdivision - fraco
          };

          clicksArray.push({
            time,
            accentLevel,
            volume: volumeMap[accentLevel as keyof typeof volumeMap] || 0.4,
            isDownbeat: pulseIndex === 0,
            isSubdivision: accentLevel === 0,
            pulseIndex,
          });
        });
        break;
      }
    }

    return clicksArray.sort((a, b) => a.time - b.time);
  }, [metronomeStructure, timeSignatureInfo, mode, tempo]);

  /**
   * Schedule metronome clicks in AudioContext time
   */
  const scheduleMetronomeClicks = useCallback(
    (
      audioContext: AudioContext,
      measureStartTime: number,
      globalVolume: number = 1.0
    ) => {
      clicks.forEach(click => {
        const scheduleTime = measureStartTime + click.time;
        const adjustedVolume = click.volume * globalVolume;

        playMetronomeClick(
          audioContext,
          click.isDownbeat,
          adjustedVolume,
          click.isSubdivision,
          undefined, // Use default frequencies
          scheduleTime
        );
      });
    },
    [clicks]
  );

  /**
   * Get click info at specific time within a measure
   */
  const getClickAtTime = useCallback(
    (timeInMeasure: number): MetronomeClick | null => {
      const tolerance = 0.02; // 20ms tolerance
      
      for (const click of clicks) {
        if (Math.abs(click.time - timeInMeasure) < tolerance) {
          return click;
        }
      }
      
      return null;
    },
    [clicks]
  );

  return {
    clicks,
    timeSignatureInfo,
    metronomeStructure,
    scheduleMetronomeClicks,
    getClickAtTime,
  };
}

/**
 * Helper hook for metronome visualization (e.g., blinking LED)
 */
export function useMetronomeVisualization(options: UseMetronomeOptions) {
  const { clicks } = useMetronome(options);

  return {
    /** Total number of clicks per measure */
    totalClicks: clicks.length,
    
    /** Clicks grouped by accent level */
    clicksByAccent: useMemo(() => {
      return {
        downbeats: clicks.filter(c => c.accentLevel === 2),
        beats: clicks.filter(c => c.accentLevel === 1),
        subdivisions: clicks.filter(c => c.accentLevel === 0),
      };
    }, [clicks]),
    
    /** Visual indicators for UI */
    indicators: useMemo(() => {
      return clicks.map(click => ({
        time: click.time,
        color: 
          click.accentLevel === 2 ? '#ef4444' :  // Red for downbeat
          click.accentLevel === 1 ? '#3b82f6' :  // Blue for beat
          '#64748b',                              // Gray for subdivision
        size: 
          click.accentLevel === 2 ? 'large' :
          click.accentLevel === 1 ? 'medium' :
          'small',
      }));
    }, [clicks]),
  };
}

