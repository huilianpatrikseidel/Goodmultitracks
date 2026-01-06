/**
 * ============================================================================
 * SCALES MODULE - Scale Generation & Analysis
 * ============================================================================
 * Defines scale patterns and provides functions for generating scale notes
 * and analyzing relationships between chords and keys.
 */

import { INTERVAL_DEFINITIONS, IntervalObject } from './core';
import { transposeNote } from './transposition';

/**
 * Scale patterns defined by interval sequences
 * Each scale is an array of IntervalObjects from the root
 */
export const SCALE_PATTERNS: Record<string, IntervalObject[]> = {
  // Major Scale and Natural Minor
  'major': [
    INTERVAL_DEFINITIONS.P1,
    INTERVAL_DEFINITIONS.M2,
    INTERVAL_DEFINITIONS.M3,
    INTERVAL_DEFINITIONS.P4,
    INTERVAL_DEFINITIONS.P5,
    INTERVAL_DEFINITIONS.M6,
    INTERVAL_DEFINITIONS.M7,
  ],
  'minor': [
    INTERVAL_DEFINITIONS.P1,
    INTERVAL_DEFINITIONS.M2,
    INTERVAL_DEFINITIONS.m3,
    INTERVAL_DEFINITIONS.P4,
    INTERVAL_DEFINITIONS.P5,
    INTERVAL_DEFINITIONS.m6,
    INTERVAL_DEFINITIONS.m7,
  ],
  
  // Harmonic and Melodic Minor
  'harmonic-minor': [
    INTERVAL_DEFINITIONS.P1,
    INTERVAL_DEFINITIONS.M2,
    INTERVAL_DEFINITIONS.m3,
    INTERVAL_DEFINITIONS.P4,
    INTERVAL_DEFINITIONS.P5,
    INTERVAL_DEFINITIONS.m6,
    INTERVAL_DEFINITIONS.M7,
  ],
  'melodic-minor-asc': [
    INTERVAL_DEFINITIONS.P1,
    INTERVAL_DEFINITIONS.M2,
    INTERVAL_DEFINITIONS.m3,
    INTERVAL_DEFINITIONS.P4,
    INTERVAL_DEFINITIONS.P5,
    INTERVAL_DEFINITIONS.M6,
    INTERVAL_DEFINITIONS.M7,
  ],
  'melodic-minor-desc': [
    INTERVAL_DEFINITIONS.P1,
    INTERVAL_DEFINITIONS.M2,
    INTERVAL_DEFINITIONS.m3,
    INTERVAL_DEFINITIONS.P4,
    INTERVAL_DEFINITIONS.P5,
    INTERVAL_DEFINITIONS.m6,
    INTERVAL_DEFINITIONS.m7,
  ],
  
  // Church Modes
  'dorian': [
    INTERVAL_DEFINITIONS.P1,
    INTERVAL_DEFINITIONS.M2,
    INTERVAL_DEFINITIONS.m3,
    INTERVAL_DEFINITIONS.P4,
    INTERVAL_DEFINITIONS.P5,
    INTERVAL_DEFINITIONS.M6,
    INTERVAL_DEFINITIONS.m7,
  ],
  'phrygian': [
    INTERVAL_DEFINITIONS.P1,
    INTERVAL_DEFINITIONS.m2,
    INTERVAL_DEFINITIONS.m3,
    INTERVAL_DEFINITIONS.P4,
    INTERVAL_DEFINITIONS.P5,
    INTERVAL_DEFINITIONS.m6,
    INTERVAL_DEFINITIONS.m7,
  ],
  'lydian': [
    INTERVAL_DEFINITIONS.P1,
    INTERVAL_DEFINITIONS.M2,
    INTERVAL_DEFINITIONS.M3,
    INTERVAL_DEFINITIONS.A4,
    INTERVAL_DEFINITIONS.P5,
    INTERVAL_DEFINITIONS.M6,
    INTERVAL_DEFINITIONS.M7,
  ],
  'mixolydian': [
    INTERVAL_DEFINITIONS.P1,
    INTERVAL_DEFINITIONS.M2,
    INTERVAL_DEFINITIONS.M3,
    INTERVAL_DEFINITIONS.P4,
    INTERVAL_DEFINITIONS.P5,
    INTERVAL_DEFINITIONS.M6,
    INTERVAL_DEFINITIONS.m7,
  ],
  'locrian': [
    INTERVAL_DEFINITIONS.P1,
    INTERVAL_DEFINITIONS.m2,
    INTERVAL_DEFINITIONS.m3,
    INTERVAL_DEFINITIONS.P4,
    INTERVAL_DEFINITIONS.d5,
    INTERVAL_DEFINITIONS.m6,
    INTERVAL_DEFINITIONS.m7,
  ],
};

/**
 * Get scale notes using degree-based transposition
 * Ensures correct enharmonic spelling for all scales
 * 
 * @param root - Root note of the scale (e.g., 'C', 'F#', 'Bb')
 * @param scale - Scale type (default: 'major')
 * @returns Array of note names with correct enharmonic spelling
 * 
 * @example
 * getScaleNotes('F#', 'major') → ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#']
 * getScaleNotes('C', 'dorian') → ['C', 'D', 'Eb', 'F', 'G', 'A', 'Bb']
 */
export function getScaleNotes(root: string, scale: string = 'major'): string[] {
  const pattern = SCALE_PATTERNS[scale];
  if (!pattern) {
    console.warn(`Unknown scale: ${scale}. Using major scale.`);
    return getScaleNotes(root, 'major');
  }
  
  return pattern.map(interval => transposeNote(root, interval));
}

/**
 * Check if a chord root is in a given key
 * 
 * @param chordRoot - Root note of the chord (e.g., 'D', 'F#')
 * @param keyRoot - Root note of the key (e.g., 'C', 'A')
 * @param scale - Scale type (default: 'major')
 * @returns true if the chord root is a scale degree in the key
 * 
 * @example
 * isChordInKey('D', 'C', 'major') → true (D is the ii in C major)
 * isChordInKey('Db', 'C', 'major') → false (Db is not in C major)
 */
export function isChordInKey(chordRoot: string, keyRoot: string, scale: string = 'major'): boolean {
  const scaleNotes = getScaleNotes(keyRoot, scale);
  // Normalize to compare just the letter and accidental (ignore octave)
  const normalizedChordRoot = chordRoot.replace(/\d+$/, '');
  const normalizedScaleNotes = scaleNotes.map(note => note.replace(/\d+$/, ''));
  return normalizedScaleNotes.includes(normalizedChordRoot);
}
