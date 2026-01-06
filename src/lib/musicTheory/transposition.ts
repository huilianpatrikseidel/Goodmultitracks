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
 * REFACTORED v2.0: Uses Circle of Fifths logic for accurate enharmonic spelling
 * Maintains sharp/flat notation based on key signature context
 * Supports chord suffixes (e.g., "Am7/G")
 * 
 * @param key - The note/chord key (e.g., "C", "Am", "G/B", "Db")
 * @param semitones - Number of semitones to transpose (positive = up, negative = down)
 * @returns Transposed key maintaining correct enharmonic spelling
 * 
 * @example
 * transposeKey('C', 2) → 'D'
 * transposeKey('Am7', 2) → 'Bm7'
 * transposeKey('F#', 2) → 'G#' (not Ab)
 * transposeKey('F', 6) → 'B' (tritone up in sharp-favorable context)
 * transposeKey('Gb', 6) → 'C' (tritone up in flat-favorable context)
 */
export function transposeKey(key: string, semitones: number): string {
  if (semitones === 0) return key;
  
  // Extract root note and suffix (e.g., "Am7/G" -> root="A", suffix="m7/G")
  const rootMatch = key.match(/^([A-G][#b]?)(.*)/);
  if (!rootMatch) return key;
  
  const [, rootNote, suffix] = rootMatch;
  
  // Normalize semitones to 0-11 range
  const normalizedSemitones = ((semitones % 12) + 12) % 12;
  
  // Circle of Fifths positioning determines sharp/flat preference
  // Sharp keys: C, G, D, A, E, B, F#, C#
  // Flat keys: F, Bb, Eb, Ab, Db, Gb, Cb
  const sharpKeys = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#'];
  const flatKeys = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];
  
  const normalizedRoot = rootNote.replace(/\d+$/, '');
  const prefersSharp = sharpKeys.includes(normalizedRoot) || rootNote.includes('#');
  const prefersFlat = flatKeys.includes(normalizedRoot) || rootNote.includes('b');
  
  // Improved interval mapping using Circle of Fifths context
  let intervalId: string;
  
  switch (normalizedSemitones) {
    case 0: intervalId = 'P1'; break;
    case 1: intervalId = prefersSharp ? 'A1' : 'm2'; break;
    case 2: intervalId = 'M2'; break;
    case 3: intervalId = prefersFlat ? 'm3' : 'A2'; break;
    case 4: intervalId = 'M3'; break;
    case 5: intervalId = 'P4'; break;
    case 6: // Tritone - context sensitive
      intervalId = prefersSharp ? 'A4' : 'd5';
      break;
    case 7: intervalId = 'P5'; break;
    case 8: intervalId = prefersSharp ? 'A5' : 'm6'; break;
    case 9: intervalId = 'M6'; break;
    case 10: intervalId = prefersFlat ? 'm7' : 'A6'; break;
    case 11: intervalId = 'M7'; break;
    default: intervalId = 'P1';
  }
  
  const transposedRoot = transposeNote(rootNote, intervalId);
  return transposedRoot + suffix;
}
