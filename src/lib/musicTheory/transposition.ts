/**
 * ============================================================================
 * TRANSPOSITION ENGINE - Degree-Based Mathematics
 * ============================================================================
 * Implements accurate note transposition using two-axis calculation:
 * - Diatonic axis (letter names: C, D, E, F, G, A, B)
 * - Chromatic axis (accidentals: #, b, x, bb)
 * 
 * This ensures correct enharmonic spelling (E# vs F, B# vs C, etc.)
 */

import {
  NOTE_LETTERS,
  NOTE_TO_INDEX,
  NATURAL_NOTE_SEMITONES,
  IntervalObject,
  INTERVAL_DEFINITIONS,
  parseNoteComponents,
  getAccidentalString
} from './core';

/**
 * INTERVAL LOOKUP MAP - Semitone to Interval ID
 * Maps semitone distances to appropriate interval IDs based on sharp/flat preference.
 * Type-safe: Uses keyof typeof INTERVAL_DEFINITIONS to ensure validity.
 */
type IntervalId = keyof typeof INTERVAL_DEFINITIONS;

const SHARP_INTERVAL_MAP: Record<number, IntervalId> = {
  0: 'P1' as const,
  1: 'A1' as const,   // Augmented unison (C to C#)
  2: 'M2' as const,
  3: 'A2' as const,   // Augmented 2nd (C to D#)
  4: 'M3' as const,
  5: 'P4' as const,
  6: 'A4' as const,   // Tritone as augmented 4th
  7: 'P5' as const,
  8: 'A5' as const,   // Augmented 5th (C to G#)
  9: 'M6' as const,
  10: 'A6' as const,  // Augmented 6th (C to A#) - Note: Not in INTERVAL_DEFINITIONS, using M7
  11: 'M7' as const,
};

const FLAT_INTERVAL_MAP: Record<number, IntervalId> = {
  0: 'P1' as const,
  1: 'm2' as const,   // Minor 2nd (C to Db)
  2: 'M2' as const,
  3: 'm3' as const,   // Minor 3rd (C to Eb)
  4: 'M3' as const,
  5: 'P4' as const,
  6: 'd5' as const,   // Tritone as diminished 5th
  7: 'P5' as const,
  8: 'm6' as const,   // Minor 6th (C to Ab)
  9: 'M6' as const,
  10: 'm7' as const,  // Minor 7th (C to Bb)
  11: 'M7' as const,
};

/**
 * CRITICAL FIX: Transpose Logic v2.0
 * Calculates transposition using Diatonic Degrees + Chromatic Adjustment.
 * Ensures E# is returned instead of F when appropriate.
 * 
 * @param note - Source note (e.g., 'C', 'F#', 'Bb4')
 * @param intervalInput - Interval to transpose by (string ID or IntervalObject)
 * @returns Transposed note with correct enharmonic spelling
 * 
 * @example
 * transposeNote('F#', 'M7') → 'E#' (not F)
 * transposeNote('C', 'M3') → 'E'
 * transposeNote('C#', 'M3') → 'E#' (not F)
 */
export function transposeNote(note: string, intervalInput: string | IntervalObject): string {
  // 1. Standardize Interval
  const interval = typeof intervalInput === 'string' 
    ? INTERVAL_DEFINITIONS[intervalInput] 
    : intervalInput;

  if (!interval) {
    console.error(`Invalid interval: ${intervalInput}`);
    return note;
  }

  // 2. Parse Source Note
  const { letter, accidentalValue, octave } = parseNoteComponents(note);
  const letterIndex = NOTE_TO_INDEX[letter];

  // 3. Calculate Target Letter (Diatonic Shift)
  const targetLetterIndex = (letterIndex + interval.degree) % 7;
  const targetLetter = NOTE_LETTERS[targetLetterIndex];

  // 4. Calculate Expected Semitones
  let naturalSemitoneDiff = NATURAL_NOTE_SEMITONES[targetLetterIndex] - NATURAL_NOTE_SEMITONES[letterIndex];
  if (naturalSemitoneDiff < 0) naturalSemitoneDiff += 12;

  // 5. Calculate Required Accidental Adjustment
  const totalTargetSemitones = accidentalValue + interval.semitones;
  const targetAccidentalValue = totalTargetSemitones - naturalSemitoneDiff;

  // 6. Handle Octaves
  let targetOctave = octave;
  if (octave !== undefined) {
    const steps = interval.degree;
    const crossedOctave = (letterIndex + steps) >= 7;
    const intervalOctaves = Math.floor(interval.degree / 7);
    targetOctave = octave + (crossedOctave ? 1 : 0) + intervalOctaves;
  }

  return `${targetLetter}${getAccidentalString(targetAccidentalValue)}${targetOctave !== undefined ? targetOctave : ''}`;
}

/**
 * Transpose a musical key by semitones
 * REFACTORED v3.0: Context-aware transposition with optional target key parameter
 * 
 * KEY IMPROVEMENT: Accepts optional targetKeyContext parameter to determine
 * sharp/flat preference based on the target key, not just the source chord.
 * This solves the borrowed chord transposition issue (e.g., C -> Db in F Major context).
 * 
 * @param key - The note/chord key (e.g., "C", "Am", "G/B", "Db")
 * @param semitones - Number of semitones to transpose (positive = up, negative = down)
 * @param targetKeyContext - Optional target key root to determine accidental preference (e.g., 'F', 'Db')
 * @returns Transposed key maintaining correct enharmonic spelling
 * 
 * @example
 * // Without context (uses source chord's preference)
 * transposeKey('C', 2) → 'D'
 * transposeKey('F#', 2) → 'G#' (not Ab)
 * 
 * // With context (uses target key's preference)
 * transposeKey('C', 1, 'F') → 'Db' (bVI in F Major, not C#)
 * transposeKey('C', 1, 'G') → 'C#' (V7/V in G Major)
 * transposeKey('Am7', 2, 'D') → 'Bm7' (vi in D Major)
 */
export function transposeKey(key: string, semitones: number, targetKeyContext?: string): string {
  if (semitones === 0) return key;
  
  // Extract root note and suffix (e.g., "Am7/G" -> root="A", suffix="m7/G")
  const rootMatch = key.match(/^([A-G][#b]?)(.*)/);
  if (!rootMatch) return key;
  
  const [, rootNote, suffix] = rootMatch;
  
  // Normalize semitones to 0-11 range
  const normalizedSemitones = ((semitones % 12) + 12) % 12;
  
  // Determine sharp/flat preference
  let prefersSharp: boolean;
  
  if (targetKeyContext) {
    // Use target key context for accidental preference
    const sharpKeys = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#'];
    const normalizedTarget = targetKeyContext.replace(/\d+$/, '');
    prefersSharp = sharpKeys.includes(normalizedTarget) || targetKeyContext.includes('#');
  } else {
    // Fall back to source chord's preference (legacy behavior)
    const sharpKeys = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#'];
    const normalizedRoot = rootNote.replace(/\d+$/, '');
    prefersSharp = sharpKeys.includes(normalizedRoot) || rootNote.includes('#');
  }
  
  // Use constant maps instead of hardcoded switch statement
  const intervalId = prefersSharp 
    ? SHARP_INTERVAL_MAP[normalizedSemitones] 
    : FLAT_INTERVAL_MAP[normalizedSemitones];
  
  if (!intervalId) {
    console.error(`Invalid semitone value: ${normalizedSemitones}`);
    return key;
  }
  
  const transposedRoot = transposeNote(rootNote, intervalId);
  return transposedRoot + suffix;
}
