// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
/**
 * useChordAnalysis Hook
 * 
 * PHASE 4: Hook para análise harmônica de acordes no contexto de uma música.
 * Integra useMusicTheory para fornecer análise completa de chord markers.
 * 
 * Funcionalidades:
 * - Análise de graus romanos
 * - Detecção de acordes emprestados (borrowed chords)
 * - Identificação de função harmônica (tonic, dominant, etc.)
 * - Análise de qualidade (maj7, m7, etc.)
 * - Cache automático para performance
 * 
 * @example
 * const { analyzeChordMarkers, getChordAnalysis } = useChordAnalysis({
 *   key: 'C',
 *   scale: 'major'
 * });
 * 
 * const analysis = getChordAnalysis('Dm7');
 * // → { romanNumeral: 'ii7', isDiatonic: true, function: 'subdominant', ... }
 */

import { useMemo } from 'react';
import { useMusicTheory } from './useMusicTheory';
import { buildChordArray } from '../lib/musicTheory';
import { ChordMarker } from '../types';

export interface ChordAnalysisOptions {
  /** Musical key (e.g., 'C', 'G', 'F#') */
  key: string;
  /** Scale type (default: 'major') */
  scale?: 'major' | 'minor';
  /** Enable caching (default: true) */
  cache?: boolean;
}

export interface ChordAnalysis {
  /** Roman numeral representation (e.g., 'I', 'ii', 'V7') */
  romanNumeral: string;
  /** Whether chord is diatonic to the key */
  isDiatonic: boolean;
  /** Whether chord is borrowed from parallel key */
  isBorrowed: boolean;
  /** Harmonic function */
  function: string;
  /** Chord quality (e.g., 'major', 'minor', 'dominant7') */
  quality: string;
  /** Notes in the chord */
  notes: string[];
}

/**
 * Hook for harmonic analysis of chords in musical context
 */
export function useChordAnalysis(options: ChordAnalysisOptions) {
  const { key, scale = 'major', cache = true } = options;

  const { analyzeChord, scaleNotes } = useMusicTheory({
    key,
    scale,
  });

  /**
   * Analyze a single chord
   */
  const getChordAnalysis = useMemo(() => {
    return (chordName: string): ChordAnalysis | null => {
      const analysis = analyzeChord(chordName);
      
      if (!analysis || !analysis.romanNumeral) {
        return null;
      }

      // Build chord notes using buildChordArray
      const notes = buildChordArray(analysis.parsed.root, analysis.parsed.quality);

      return {
        romanNumeral: analysis.romanNumeral,
        isDiatonic: analysis.isDiatonic,
        isBorrowed: analysis.isBorrowed,
        function: analysis.functionAnalysis?.function || 'unknown',
        quality: analysis.parsed.quality || 'major',
        notes,
      };
    };
  }, [analyzeChord]);

  /**
   * Analyze all chord markers in a song
   * Returns chord markers with analysis attached
   */
  const analyzeChordMarkers = useMemo(() => {
    return (chordMarkers: ChordMarker[]): ChordMarker[] => {
      return chordMarkers.map(marker => {
        const analysis = getChordAnalysis(marker.chord);
        
        return {
          ...marker,
          analysis: analysis || undefined,
        };
      });
    };
  }, [getChordAnalysis]);

  /**
   * Get all borrowed chords in a list of markers
   */
  const getBorrowedChords = useMemo(() => {
    return (chordMarkers: ChordMarker[]): ChordMarker[] => {
      const analyzed = analyzeChordMarkers(chordMarkers);
      return analyzed.filter(marker => marker.analysis?.isBorrowed);
    };
  }, [analyzeChordMarkers]);

  /**
   * Get chord statistics
   */
  const getChordStatistics = useMemo(() => {
    return (chordMarkers: ChordMarker[]) => {
      const analyzed = analyzeChordMarkers(chordMarkers);
      
      const stats = {
        total: analyzed.length,
        diatonic: 0,
        borrowed: 0,
        byFunction: {} as Record<string, number>,
      };

      analyzed.forEach(marker => {
        if (marker.analysis) {
          if (marker.analysis.isDiatonic) stats.diatonic++;
          if (marker.analysis.isBorrowed) stats.borrowed++;
          
          const fn = marker.analysis.function;
          stats.byFunction[fn] = (stats.byFunction[fn] || 0) + 1;
        }
      });

      return stats;
    };
  }, [analyzeChordMarkers]);

  return {
    /** Analyze a single chord */
    getChordAnalysis,
    /** Analyze all chord markers */
    analyzeChordMarkers,
    /** Get only borrowed chords */
    getBorrowedChords,
    /** Get statistics */
    getChordStatistics,
    /** Scale notes for reference */
    scaleNotes,
  };
}

/**
 * Helper: Get visual properties for chord analysis
 * Used for rendering badges, colors, etc.
 */
export function useChordAnalysisVisualization(analysis: ChordAnalysis | null | undefined) {
  return useMemo(() => {
    if (!analysis) {
      return {
        badge: null,
        color: 'default',
        tooltip: null,
      };
    }

    const badges = [];
    
    // Roman numeral badge
    badges.push({
      type: 'roman',
      label: analysis.romanNumeral,
      variant: 'default' as const,
      tooltip: `${analysis.romanNumeral} - ${analysis.function}`,
    });

    // Borrowed chord badge
    if (analysis.isBorrowed) {
      badges.push({
        type: 'borrowed',
        label: 'Borrowed',
        variant: 'secondary' as const,
        tooltip: 'Borrowed from parallel key',
      });
    }

    // Function badge
    const functionColors: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
      tonic: 'default',
      dominant: 'destructive',
      subdominant: 'outline',
      mediant: 'secondary',
      submediant: 'secondary',
      'leading-tone': 'outline',
    };

    badges.push({
      type: 'function',
      label: analysis.function,
      variant: functionColors[analysis.function] || 'default',
      tooltip: `Harmonic function: ${analysis.function}`,
    });

    return {
      badges,
      isDiatonic: analysis.isDiatonic,
      isBorrowed: analysis.isBorrowed,
      function: analysis.function,
    };
  }, [analysis]);
}

