/**
 * useMusicTheory Hook
 * 
 * Central hook para análise musical inteligente.
 * Fornece análise harmônica, escalas e funções tonais.
 * 
 * @example
 * const { scaleNotes, timeSignatureInfo, analyzeChord } = useMusicTheory('C', '4/4');
 * const analysis = analyzeChord('Dm7');
 * // → { romanNumeral: 'ii7', isDiatonic: true, function: 'subdominant' }
 */

import { useMemo, useCallback } from 'react';
import {
  getScaleNotes,
  isChordInKey,
  getRomanNumeral,
  analyzeChordFunction,
  parseChordName,
  analyzeTimeSignature,
  isBorrowedChord,
  type ChordFunctionAnalysis,
  type TimeSignatureInfo,
  type ParsedChord,
} from '../lib/musicTheory';

export interface ChordAnalysis {
  parsed: ParsedChord;
  romanNumeral: string | null;
  isDiatonic: boolean;
  functionAnalysis: ChordFunctionAnalysis | null;
  isBorrowed: boolean;
  borrowedFrom?: string;
}

export interface UseMusicTheoryOptions {
  /** Musical key (e.g., 'C', 'F#', 'Bb') */
  key: string;
  /** Time signature (e.g., '4/4', '6/8', '7/8') */
  timeSignature?: string;
  /** Scale type (default: 'major') */
  scale?: 'major' | 'minor' | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'aeolian' | 'locrian';
  /** Tempo in BPM (for tempo-aware time signature analysis) */
  tempo?: number;
}

export interface UseMusicTheoryReturn {
  /** Notes in the current scale */
  scaleNotes: string[];
  /** Analyzed time signature information */
  timeSignatureInfo: TimeSignatureInfo | null;
  /** Function to analyze a chord symbol */
  analyzeChord: (chordSymbol: string) => ChordAnalysis;
  /** Check if a chord is diatonic to the key */
  isChordDiatonic: (chordSymbol: string) => boolean;
  /** Get roman numeral for a chord */
  getChordRomanNumeral: (chordSymbol: string) => string | null;
}

/**
 * Hook for comprehensive music theory analysis
 */
export function useMusicTheory({
  key,
  timeSignature = '4/4',
  scale = 'major',
  tempo = 120,
}: UseMusicTheoryOptions): UseMusicTheoryReturn {
  // Memoize scale notes calculation
  const scaleNotes = useMemo(() => {
    return getScaleNotes(key, scale);
  }, [key, scale]);

  // Memoize time signature analysis
  const timeSignatureInfo = useMemo(() => {
    if (!timeSignature) return null;
    return analyzeTimeSignature(timeSignature, tempo);
  }, [timeSignature, tempo]);

  // Memoized function to check if chord is diatonic
  const isChordDiatonic = useCallback(
    (chordSymbol: string): boolean => {
      const parsed = parseChordName(chordSymbol);
      return isChordInKey(parsed.root, key, scale);
    },
    [key, scale]
  );

  // Memoized function to get roman numeral
  const getChordRomanNumeral = useCallback(
    (chordSymbol: string): string | null => {
      const parsed = parseChordName(chordSymbol);
      return getRomanNumeral(parsed.root, key, scale);
    },
    [key, scale]
  );

  // Main analysis function
  const analyzeChord = useCallback(
    (chordSymbol: string): ChordAnalysis => {
      const parsed = parseChordName(chordSymbol);
      const romanNumeral = getRomanNumeral(parsed.root, key, scale);
      const isDiatonic = isChordInKey(parsed.root, key, scale);
      const functionAnalysis = analyzeChordFunction(parsed.root, key);
      const borrowedInfo = isBorrowedChord(parsed.root, key);

      return {
        parsed,
        romanNumeral,
        isDiatonic,
        functionAnalysis,
        isBorrowed: borrowedInfo.isBorrowed,
        borrowedFrom: borrowedInfo.sourceKey,
      };
    },
    [key, scale]
  );

  return {
    scaleNotes,
    timeSignatureInfo,
    analyzeChord,
    isChordDiatonic,
    getChordRomanNumeral,
  };
}
