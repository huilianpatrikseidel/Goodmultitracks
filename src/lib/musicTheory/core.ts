/**
 * ============================================================================
 * MUSIC THEORY CORE - Intervals & Note Representation
 * ============================================================================
 * Foundational types and constants for music theory operations.
 * This module defines the core interval system using degree-based mathematics.
 */

/**
 * Basic note letter definitions
 */
export const NOTE_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
export const NOTE_TO_INDEX: Record<string, number> = { 
  C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 
};

/**
 * Natural semitone positions (C=0) used to calculate necessary accidentals
 */
export const NATURAL_NOTE_SEMITONES = [0, 2, 4, 5, 7, 9, 11];

/**
 * CORE: Interval Object
 * The standard representation for all musical intervals.
 * Uses two-axis coordinate system: diatonic (degree) + chromatic (semitones)
 */
export interface IntervalObject {
  id: string;         // e.g., 'M3', 'P5', 'dim7'
  semitones: number;  // Chromatic distance (0-12+)
  degree: number;     // Diatonic distance (0=Unison, 1=2nd, 2=3rd, etc.)
  quality: 'P' | 'M' | 'm' | 'A' | 'd'; // Perfect, Major, minor, Augmented, diminished
}

/**
 * CANONICAL INTERVAL DEFINITIONS
 * Single source of truth for all interval logic.
 * Every interval in the system references these definitions.
 */
export const INTERVAL_DEFINITIONS: Record<string, IntervalObject> = {
  // Perfect and Major/minor intervals (Octave 1)
  'P1':  { id: 'P1',  semitones: 0,  degree: 0, quality: 'P' },
  'm2':  { id: 'm2',  semitones: 1,  degree: 1, quality: 'm' },
  'M2':  { id: 'M2',  semitones: 2,  degree: 1, quality: 'M' },
  'A2':  { id: 'A2',  semitones: 3,  degree: 1, quality: 'A' },
  'm3':  { id: 'm3',  semitones: 3,  degree: 2, quality: 'm' },
  'M3':  { id: 'M3',  semitones: 4,  degree: 2, quality: 'M' },
  'P4':  { id: 'P4',  semitones: 5,  degree: 3, quality: 'P' },
  'A4':  { id: 'A4',  semitones: 6,  degree: 3, quality: 'A' },
  'd5':  { id: 'd5',  semitones: 6,  degree: 4, quality: 'd' },
  'P5':  { id: 'P5',  semitones: 7,  degree: 4, quality: 'P' },
  'A5':  { id: 'A5',  semitones: 8,  degree: 4, quality: 'A' },
  'm6':  { id: 'm6',  semitones: 8,  degree: 5, quality: 'm' },
  'M6':  { id: 'M6',  semitones: 9,  degree: 5, quality: 'M' },
  'dim7':{ id: 'dim7',semitones: 9,  degree: 6, quality: 'd' },
  'm7':  { id: 'm7',  semitones: 10, degree: 6, quality: 'm' },
  'M7':  { id: 'M7',  semitones: 11, degree: 6, quality: 'M' },
  'P8':  { id: 'P8',  semitones: 12, degree: 7, quality: 'P' },
  
  // Extended intervals (9ths, 11ths, 13ths)
  'b9':  { id: 'b9',  semitones: 13, degree: 8, quality: 'm' },
  '9':   { id: '9',   semitones: 14, degree: 8, quality: 'M' },
  '#9':  { id: '#9',  semitones: 15, degree: 8, quality: 'A' },
  '11':  { id: '11',  semitones: 17, degree: 10, quality: 'P' },
  '#11': { id: '#11', semitones: 18, degree: 10, quality: 'A' },
  'b13': { id: 'b13', semitones: 20, degree: 12, quality: 'm' },
  '13':  { id: '13',  semitones: 21, degree: 12, quality: 'M' },
};

/**
 * Parse a note into its components
 * @example parseNoteComponents('C#4') → { letter: 'C', accidentalStr: '#', accidentalValue: 1, octave: 4 }
 */
export function parseNoteComponents(note: string) {
  const match = note.match(/^([A-G])(bb|b|#|x|##)?(\d*)$/);
  if (!match) throw new Error(`Invalid note format: ${note}`);
  
  const letter = match[1];
  const accidentalStr = match[2] || '';
  const octave = match[3] ? parseInt(match[3]) : undefined;
  
  let accidentalValue = 0;
  if (accidentalStr === '#') accidentalValue = 1;
  else if (accidentalStr === 'x' || accidentalStr === '##') accidentalValue = 2;
  else if (accidentalStr === 'b') accidentalValue = -1;
  else if (accidentalStr === 'bb') accidentalValue = -2;

  return { letter, accidentalStr, accidentalValue, octave };
}

/**
 * Convert accidental value to string representation
 * @example getAccidentalString(1) → '#'
 * @example getAccidentalString(2) → 'x'
 * @example getAccidentalString(-1) → 'b'
 */
export function getAccidentalString(value: number): string {
  if (value === 0) return '';
  if (value === 1) return '#';
  if (value === 2) return 'x';
  if (value === -1) return 'b';
  if (value === -2) return 'bb';
  return value > 0 ? '#'.repeat(value) : 'b'.repeat(Math.abs(value));
}

/**
 * Calculate the semitone value of a note
 * Used for enharmonic comparisons
 * @example noteToSemitone('C') → 0
 * @example noteToSemitone('C#') → 1
 * @example noteToSemitone('Db') → 1
 * @example noteToSemitone('F') → 5
 */
export function noteToSemitone(note: string): number {
  const { letter, accidentalValue } = parseNoteComponents(note);
  const letterIndex = NOTE_TO_INDEX[letter];
  const naturalSemitone = NATURAL_NOTE_SEMITONES[letterIndex];
  return (naturalSemitone + accidentalValue + 12) % 12;
}

/**
 * Check if two notes are enharmonic equivalents
 * E.g., C# and Db, E# and F, Cb and B
 * 
 * @param noteA - First note (e.g., 'C#', 'Ex', 'Dbb')
 * @param noteB - Second note (e.g., 'Db', 'F', 'C')
 * @returns true if notes represent the same pitch
 * 
 * @example
 * areNotesEnharmonic('C#', 'Db') → true
 * areNotesEnharmonic('E#', 'F') → true
 * areNotesEnharmonic('B#', 'C') → true
 * areNotesEnharmonic('C', 'D') → false
 */
export function areNotesEnharmonic(noteA: string, noteB: string): boolean {
  // Remove octave numbers for comparison
  const cleanA = noteA.replace(/\d+$/, '');
  const cleanB = noteB.replace(/\d+$/, '');
  
  // If notes are exactly the same, they're enharmonic
  if (cleanA === cleanB) return true;
  
  // Compare semitone values
  return noteToSemitone(cleanA) === noteToSemitone(cleanB);
}
