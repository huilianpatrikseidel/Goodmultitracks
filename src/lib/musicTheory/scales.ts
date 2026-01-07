// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
/**
 * ============================================================================
 * SCALES MODULE - Scale Generation & Analysis
 * ============================================================================
 * Defines scale patterns and provides functions for generating scale notes
 * and analyzing relationships between chords and keys.
 */

import { INTERVAL_DEFINITIONS, IntervalObject, areNotesEnharmonic } from './core';
import { transposeNote } from './transposition';

/**
 * CIRCLE OF FIFTHS MAP
 * Maps keys to their position on the Circle of Fifths for O(1) key signature lookup.
 * Positive values = number of sharps, Negative values = number of flats
 * 
 * Major keys arranged by fifths: C(0) → G(1) → D(2) → A(3) → E(4) → B(5) → F#(6) → C#(7)
 * Flat keys: F(-1) → Bb(-2) → Eb(-3) → Ab(-4) → Db(-5) → Gb(-6) → Cb(-7)
 */
export const CIRCLE_OF_FIFTHS_MAJOR: Record<string, number> = {
  'C': 0,   // No sharps or flats
  'G': 1,   // 1 sharp (F#)
  'D': 2,   // 2 sharps (F#, C#)
  'A': 3,   // 3 sharps (F#, C#, G#)
  'E': 4,   // 4 sharps (F#, C#, G#, D#)
  'B': 5,   // 5 sharps (F#, C#, G#, D#, A#)
  'F#': 6,  // 6 sharps
  'C#': 7,  // 7 sharps
  'F': -1,  // 1 flat (Bb)
  'Bb': -2, // 2 flats (Bb, Eb)
  'Eb': -3, // 3 flats (Bb, Eb, Ab)
  'Ab': -4, // 4 flats (Bb, Eb, Ab, Db)
  'Db': -5, // 5 flats (Bb, Eb, Ab, Db, Gb)
  'Gb': -6, // 6 flats
  'Cb': -7, // 7 flats
};

/**
 * Circle of Fifths for Natural Minor keys (relative to major)
 * Each minor key is 3 semitones below its relative major
 */
const CIRCLE_OF_FIFTHS_MINOR: Record<string, number> = {
  'A': 0,   // Relative to C major
  'E': 1,   // Relative to G major
  'B': 2,   // Relative to D major
  'F#': 3,  // Relative to A major
  'C#': 4,  // Relative to E major
  'G#': 5,  // Relative to B major
  'D#': 6,  // Relative to F# major
  'A#': 7,  // Relative to C# major
  'D': -1,  // Relative to F major
  'G': -2,  // Relative to Bb major
  'C': -3,  // Relative to Eb major
  'F': -4,  // Relative to Ab major
  'Bb': -5, // Relative to Db major
  'Eb': -6, // Relative to Gb major
  'Ab': -7, // Relative to Cb major
};

/**
 * Order of sharps (for major keys)
 */
const SHARP_ORDER = ['F#', 'C#', 'G#', 'D#', 'A#', 'E#', 'B#'];

/**
 * Order of flats (for major keys)
 */
const FLAT_ORDER = ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'Fb'];

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
  
  // Pentatonic Scales
  'pentatonic-major': [
    INTERVAL_DEFINITIONS.P1,
    INTERVAL_DEFINITIONS.M2,
    INTERVAL_DEFINITIONS.M3,
    INTERVAL_DEFINITIONS.P5,
    INTERVAL_DEFINITIONS.M6,
  ],
  'pentatonic-minor': [
    INTERVAL_DEFINITIONS.P1,
    INTERVAL_DEFINITIONS.m3,
    INTERVAL_DEFINITIONS.P4,
    INTERVAL_DEFINITIONS.P5,
    INTERVAL_DEFINITIONS.m7,
  ],
  
  // Blues Scale
  'blues': [
    INTERVAL_DEFINITIONS.P1,
    INTERVAL_DEFINITIONS.m3,
    INTERVAL_DEFINITIONS.P4,
    INTERVAL_DEFINITIONS.d5,
    INTERVAL_DEFINITIONS.P5,
    INTERVAL_DEFINITIONS.m7,
  ],
  
  // Symmetric Scales
  'whole-tone': [
    INTERVAL_DEFINITIONS.P1,
    INTERVAL_DEFINITIONS.M2,
    INTERVAL_DEFINITIONS.M3,
    INTERVAL_DEFINITIONS.A4,
    INTERVAL_DEFINITIONS.A5,
    { id: 'A6', semitones: 10, degree: 5, quality: 'A' }, // Augmented 6th
  ],
  'diminished-whole-half': [
    INTERVAL_DEFINITIONS.P1,
    INTERVAL_DEFINITIONS.M2,
    INTERVAL_DEFINITIONS.m3,
    INTERVAL_DEFINITIONS.P4,
    INTERVAL_DEFINITIONS.d5,
    INTERVAL_DEFINITIONS.m6,
    { id: 'dim7', semitones: 9, degree: 6, quality: 'd' },
    INTERVAL_DEFINITIONS.M7,
  ],
  'diminished-half-whole': [
    INTERVAL_DEFINITIONS.P1,
    INTERVAL_DEFINITIONS.m2,
    INTERVAL_DEFINITIONS.m3,
    INTERVAL_DEFINITIONS.M3,
    INTERVAL_DEFINITIONS.A4,
    INTERVAL_DEFINITIONS.P5,
    INTERVAL_DEFINITIONS.M6,
    INTERVAL_DEFINITIONS.m7,
  ],
  
  // Bebop Scales
  'bebop-major': [
    INTERVAL_DEFINITIONS.P1,
    INTERVAL_DEFINITIONS.M2,
    INTERVAL_DEFINITIONS.M3,
    INTERVAL_DEFINITIONS.P4,
    INTERVAL_DEFINITIONS.P5,
    INTERVAL_DEFINITIONS.A5,  // Chromatic passing tone
    INTERVAL_DEFINITIONS.M6,
    INTERVAL_DEFINITIONS.M7,
  ],
  'bebop-dominant': [
    INTERVAL_DEFINITIONS.P1,
    INTERVAL_DEFINITIONS.M2,
    INTERVAL_DEFINITIONS.M3,
    INTERVAL_DEFINITIONS.P4,
    INTERVAL_DEFINITIONS.P5,
    INTERVAL_DEFINITIONS.M6,
    INTERVAL_DEFINITIONS.m7,
    INTERVAL_DEFINITIONS.M7,  // Chromatic passing tone
  ],
  'bebop-minor': [
    INTERVAL_DEFINITIONS.P1,
    INTERVAL_DEFINITIONS.M2,
    INTERVAL_DEFINITIONS.m3,
    INTERVAL_DEFINITIONS.M3,  // Chromatic passing tone
    INTERVAL_DEFINITIONS.P4,
    INTERVAL_DEFINITIONS.P5,
    INTERVAL_DEFINITIONS.M6,
    INTERVAL_DEFINITIONS.m7,
  ],
  'bebop-harmonic-minor': [
    INTERVAL_DEFINITIONS.P1,
    INTERVAL_DEFINITIONS.M2,
    INTERVAL_DEFINITIONS.m3,
    INTERVAL_DEFINITIONS.P4,
    INTERVAL_DEFINITIONS.P5,
    INTERVAL_DEFINITIONS.m6,
    INTERVAL_DEFINITIONS.m7,
    INTERVAL_DEFINITIONS.M7,  // Chromatic passing tone
  ],
  
  // Jazz/Modal Scales
  'altered': [
    INTERVAL_DEFINITIONS.P1,
    INTERVAL_DEFINITIONS.m2,
    INTERVAL_DEFINITIONS.m3,
    INTERVAL_DEFINITIONS.M3,  // Enharmonic to d4
    INTERVAL_DEFINITIONS.d5,
    INTERVAL_DEFINITIONS.m6,
    INTERVAL_DEFINITIONS.m7,
  ],
  'augmented': [
    INTERVAL_DEFINITIONS.P1,
    INTERVAL_DEFINITIONS.m3,
    INTERVAL_DEFINITIONS.M3,
    INTERVAL_DEFINITIONS.P5,
    INTERVAL_DEFINITIONS.A5,
    INTERVAL_DEFINITIONS.M7,
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
 * Get the key signature (number of sharps or flats) for a given key
 * OPTIMIZED v3.0: Uses Circle of Fifths lookup for O(1) performance
 * 
 * @param root - Root note of the key (e.g., 'C', 'F#', 'Bb')
 * @param scale - Scale type (default: 'major')
 * @returns Object with sharps/flats count and the actual accidentals
 * 
 * @example
 * getKeySignature('C', 'major') → { sharps: 0, flats: 0, accidentals: [] }
 * getKeySignature('D', 'major') → { sharps: 2, flats: 0, accidentals: ['F#', 'C#'] }
 * getKeySignature('Bb', 'major') → { sharps: 0, flats: 2, accidentals: ['Bb', 'Eb'] }
 * getKeySignature('A', 'minor') → { sharps: 0, flats: 0, accidentals: [] }
 * getKeySignature('E', 'minor') → { sharps: 1, flats: 0, accidentals: ['F#'] }
 */
export function getKeySignature(root: string, scale: string = 'major'): { sharps: number; flats: number; accidentals: string[] } {
  const cleanRoot = root.replace(/\d+$/, ''); // Remove octave if present
  
  // Determine which Circle of Fifths map to use
  const isMinorVariant = scale === 'minor' || scale === 'harmonic-minor' || scale === 'melodic-minor-asc';
  const circleMap = isMinorVariant ? CIRCLE_OF_FIFTHS_MINOR : CIRCLE_OF_FIFTHS_MAJOR;
  
  // Get position on Circle of Fifths
  const position = circleMap[cleanRoot];
  
  // If not in map, fall back to scale generation method
  if (position === undefined) {
    console.warn(`Key ${cleanRoot} not in Circle of Fifths. Using scale analysis.`);
    return getKeySignatureFromScale(cleanRoot, scale);
  }
  
  // Calculate sharps or flats from position
  if (position > 0) {
    // Sharp keys
    const accidentals = SHARP_ORDER.slice(0, position);
    return { sharps: position, flats: 0, accidentals };
  } else if (position < 0) {
    // Flat keys
    const numFlats = Math.abs(position);
    const accidentals = FLAT_ORDER.slice(0, numFlats);
    return { sharps: 0, flats: numFlats, accidentals };
  } else {
    // C major or A minor (no accidentals)
    return { sharps: 0, flats: 0, accidentals: [] };
  }
}

/**
 * Fallback method: Get key signature by generating scale and counting accidentals
 * Used for non-standard scales or keys not in Circle of Fifths map
 * 
 * @internal
 */
function getKeySignatureFromScale(root: string, scale: string): { sharps: number; flats: number; accidentals: string[] } {
  const scaleNotes = getScaleNotes(root, scale);
  
  const sharps: string[] = [];
  const flats: string[] = [];
  
  // Check each note for accidentals
  scaleNotes.forEach(note => {
    const cleanNote = note.replace(/\d+$/, ''); // Remove octave
    if (cleanNote.includes('#') || cleanNote.includes('x')) {
      if (!sharps.includes(cleanNote)) sharps.push(cleanNote);
    } else if (cleanNote.includes('b')) {
      if (!flats.includes(cleanNote)) flats.push(cleanNote);
    }
  });
  
  return {
    sharps: sharps.length,
    flats: flats.length,
    accidentals: sharps.length > 0 ? sharps : flats
  };
}

/**
 * Check if a chord root is in a given key
 * Uses enharmonic comparison to handle equivalent notes (e.g., C# vs Db)
 * 
 * @param chordRoot - Root note of the chord (e.g., 'D', 'F#')
 * @param keyRoot - Root note of the key (e.g., 'C', 'A')
 * @param scale - Scale type (default: 'major')
 * @returns true if the chord root is a scale degree in the key
 * 
 * @example
 * isChordInKey('D', 'C', 'major') → true (D is the ii in C major)
 * isChordInKey('Db', 'C', 'major') → false (Db is not in C major)
 * isChordInKey('F#', 'Gb', 'major') → true (F# and Gb are enharmonic, scale contains Gb)
 */
export function isChordInKey(chordRoot: string, keyRoot: string, scale: string = 'major'): boolean {
  const scaleNotes = getScaleNotes(keyRoot, scale);
  // Normalize to compare just the letter and accidental (ignore octave)
  const normalizedChordRoot = chordRoot.replace(/\d+$/, '');
  
  // Check for exact match or enharmonic equivalent
  return scaleNotes.some(note => {
    const normalizedNote = note.replace(/\d+$/, '');
    return normalizedNote === normalizedChordRoot || areNotesEnharmonic(normalizedNote, normalizedChordRoot);
  });
}

