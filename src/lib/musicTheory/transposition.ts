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
 * REFACTORED: Now uses transposeNote internally for enharmonic accuracy
 * Maintains sharp/flat notation based on input
 * Supports chord suffixes (e.g., "Am7/G")
 * 
 * @param key - The note/chord key (e.g., "C", "Am", "G/B", "Db")
 * @param semitones - Number of semitones to transpose (positive = up, negative = down)
 * @returns Transposed key maintaining flat/sharp preference and chord structure
 * 
 * @example
 * transposeKey('C', 2) → 'D'
 * transposeKey('Am7', 2) → 'Bm7'
 * transposeKey('F#', 2) → 'G#' (not Ab, maintains sharp preference)
 */
export function transposeKey(key: string, semitones: number): string {
  if (semitones === 0) return key;
  
  // Extract root note and suffix (e.g., "Am7/G" -> root="A", suffix="m7/G")
  const rootMatch = key.match(/^([A-G][#b]?)(.*)/);
  if (!rootMatch) return key;
  
  const [, rootNote, suffix] = rootMatch;
  
  // Create interval object for transposition
  // Use octave wrapping to handle negative semitones
  const normalizedSemitones = ((semitones % 12) + 12) % 12;
  
  // Calculate degree (approximate - will be refined by transposeNote)
  // This is a simplified mapping for common intervals
  const semitoneToInterval: Record<number, string> = {
    0: 'P1',
    1: rootNote.includes('b') ? 'm2' : 'm2',
    2: 'M2',
    3: rootNote.includes('b') ? 'm3' : 'M2', // Prefer m3 for flats
    4: 'M3',
    5: 'P4',
    6: rootNote.includes('#') ? 'A4' : 'd5', // Context-aware tritone
    7: 'P5',
    8: rootNote.includes('b') ? 'm6' : 'A5',
    9: 'M6',
    10: 'm7',
    11: 'M7',
  };
  
  const intervalId = semitoneToInterval[normalizedSemitones] || 'P1';
  const transposedRoot = transposeNote(rootNote, intervalId);
  
  return transposedRoot + suffix;
}
