// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
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
  id: string;         // e.g., 'M3', 'P5', 'dim7', 'AA4', 'dd2'
  semitones: number;  // Chromatic distance (0-12+)
  degree: number;     // Diatonic distance (0=Unison, 1=2nd, 2=3rd, etc.)
  quality: 'P' | 'M' | 'm' | 'A' | 'd' | 'AA' | 'dd'; // Including doubly aug/dim
}

/**
 * CANONICAL INTERVAL DEFINITIONS
 * Single source of truth for all interval logic.
 * Every interval in the system references these definitions.
 * Now includes doubly augmented/diminished for theoretical analysis.
 */
export const INTERVAL_DEFINITIONS: Record<string, IntervalObject> = {
  // Perfect and Major/minor intervals (Octave 1)
  'P1':  { id: 'P1',  semitones: 0,  degree: 0, quality: 'P' },
  'A1':  { id: 'A1',  semitones: 1,  degree: 0, quality: 'A' },  // Augmented unison (C to C#)
  'AA1': { id: 'AA1', semitones: 2,  degree: 0, quality: 'AA' }, // Doubly augmented unison (C to Cx)
  'd2':  { id: 'd2',  semitones: 0,  degree: 1, quality: 'd' },  // Diminished 2nd (C to Dbb)
  'm2':  { id: 'm2',  semitones: 1,  degree: 1, quality: 'm' },
  'M2':  { id: 'M2',  semitones: 2,  degree: 1, quality: 'M' },
  'A2':  { id: 'A2',  semitones: 3,  degree: 1, quality: 'A' },
  'AA2': { id: 'AA2', semitones: 4,  degree: 1, quality: 'AA' }, // Doubly augmented 2nd
  'dd3': { id: 'dd3', semitones: 1,  degree: 2, quality: 'dd' }, // Doubly diminished 3rd
  'd3':  { id: 'd3',  semitones: 2,  degree: 2, quality: 'd' },  // Diminished 3rd
  'm3':  { id: 'm3',  semitones: 3,  degree: 2, quality: 'm' },
  'M3':  { id: 'M3',  semitones: 4,  degree: 2, quality: 'M' },
  'A3':  { id: 'A3',  semitones: 5,  degree: 2, quality: 'A' },  // Augmented 3rd
  'd4':  { id: 'd4',  semitones: 4,  degree: 3, quality: 'd' },  // Diminished 4th
  'P4':  { id: 'P4',  semitones: 5,  degree: 3, quality: 'P' },
  'A4':  { id: 'A4',  semitones: 6,  degree: 3, quality: 'A' },
  'AA4': { id: 'AA4', semitones: 7,  degree: 3, quality: 'AA' }, // Doubly augmented 4th
  'dd5': { id: 'dd5', semitones: 5,  degree: 4, quality: 'dd' }, // Doubly diminished 5th
  'd5':  { id: 'd5',  semitones: 6,  degree: 4, quality: 'd' },
  'P5':  { id: 'P5',  semitones: 7,  degree: 4, quality: 'P' },
  'A5':  { id: 'A5',  semitones: 8,  degree: 4, quality: 'A' },
  'AA5': { id: 'AA5', semitones: 9,  degree: 4, quality: 'AA' }, // Doubly augmented 5th
  'dd6': { id: 'dd6', semitones: 6,  degree: 5, quality: 'dd' }, // Doubly diminished 6th
  'd6':  { id: 'd6',  semitones: 7,  degree: 5, quality: 'd' },  // Diminished 6th
  'm6':  { id: 'm6',  semitones: 8,  degree: 5, quality: 'm' },
  'M6':  { id: 'M6',  semitones: 9,  degree: 5, quality: 'M' },
  'A6':  { id: 'A6',  semitones: 10, degree: 5, quality: 'A' },  // Augmented 6th (C to A#)
  'dd7': { id: 'dd7', semitones: 8,  degree: 6, quality: 'dd' }, // Doubly diminished 7th
  'dim7':{ id: 'dim7',semitones: 9,  degree: 6, quality: 'd' },
  'm7':  { id: 'm7',  semitones: 10, degree: 6, quality: 'm' },
  'M7':  { id: 'M7',  semitones: 11, degree: 6, quality: 'M' },
  'A7':  { id: 'A7',  semitones: 12, degree: 6, quality: 'A' },  // Augmented 7th
  'd8':  { id: 'd8',  semitones: 11, degree: 7, quality: 'd' },  // Diminished octave
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
 * Now supports arbitrary-length accidentals for theoretical robustness (###, bbbb, etc.)
 * @example parseNoteComponents('C#4') → { letter: 'C', accidentalStr: '#', accidentalValue: 1, octave: 4 }
 * @example parseNoteComponents('Fx') → { letter: 'F', accidentalStr: 'x', accidentalValue: 2, octave: undefined }
 * @example parseNoteComponents('F###') → { letter: 'F', accidentalStr: '###', accidentalValue: 3, octave: undefined }
 */
export function parseNoteComponents(note: string) {
  // Enhanced regex: supports arbitrary-length sharps/flats, x notation, and mixed notations
  const match = note.match(/^([A-G])(x|#+|b+)?(\d*)$/);
  if (!match) throw new Error(`Invalid note format: ${note}`);
  
  const letter = match[1];
  const accidentalStr = match[2] || '';
  const octave = match[3] ? parseInt(match[3]) : undefined;
  
  let accidentalValue = 0;
  
  // Parse accidental value
  if (accidentalStr === 'x') {
    accidentalValue = 2; // Double sharp
  } else if (accidentalStr.startsWith('#')) {
    accidentalValue = accidentalStr.length; // Count sharps
  } else if (accidentalStr.startsWith('b')) {
    accidentalValue = -accidentalStr.length; // Count flats (negative)
  }

  return { letter, accidentalStr, accidentalValue, octave };
}

/**
 * Convert accidental value to string representation
 * Supports up to quadruple sharps/flats for extreme theoretical analysis
 * @example getAccidentalString(1) → '#'
 * @example getAccidentalString(2) → 'x'
 * @example getAccidentalString(3) → '#x' (triple sharp)
 * @example getAccidentalString(-1) → 'b'
 * @example getAccidentalString(-2) → 'bb'
 */
export function getAccidentalString(value: number): string {
  if (value === 0) return '';
  if (value === 1) return '#';
  if (value === 2) return 'x';
  if (value === -1) return 'b';
  if (value === -2) return 'bb';
  
  // Extended support for triple/quadruple sharps (rarely used)
  if (value === 3) return '#x'; // or 'x#' - triple sharp
  if (value === -3) return 'bbb';
  
  // Extreme cases (theoretical)
  return value > 0 ? '#'.repeat(value) : 'b'.repeat(Math.abs(value));
}

/**
 * Calculate interval mathematically from degree and semitones
 * Used when specific interval not found in INTERVAL_DEFINITIONS
 * Supports doubly augmented/diminished intervals
 * 
 * @param degree - Diatonic degree (0=unison, 1=2nd, 2=3rd, etc.)
 * @param semitones - Chromatic semitones
 * @returns Calculated IntervalObject
 * 
 * @example
 * // Doubly augmented 4th: C to F## (degree 3, semitones 7)
 * calculateInterval(3, 7) → { id: 'AA4', semitones: 7, degree: 3, quality: 'AA' }
 */
export function calculateInterval(degree: number, semitones: number): IntervalObject {
  // Normalize degree to 0-7 range
  const normalizedDegree = degree % 7;
  
  // Get expected semitones for perfect/major interval at this degree
  const perfectDegrees = [0, 3, 4]; // Unison, 4th, 5th
  const isPerfectType = perfectDegrees.includes(normalizedDegree);
  
  // Calculate base semitones for this degree
  const baseSemitones = [0, 2, 4, 5, 7, 9, 11][normalizedDegree];
  
  // Determine quality based on semitone deviation
  const deviation = semitones - baseSemitones;
  
  let quality: IntervalObject['quality'];
  let id: string;
  
  if (isPerfectType) {
    // Perfect intervals (P1, P4, P5, P8)
    if (deviation === 0) {
      quality = 'P';
      id = `P${normalizedDegree + 1}`;
    } else if (deviation === 1) {
      quality = 'A';
      id = `A${normalizedDegree + 1}`;
    } else if (deviation === 2) {
      quality = 'AA';
      id = `AA${normalizedDegree + 1}`;
    } else if (deviation === -1) {
      quality = 'd';
      id = `d${normalizedDegree + 1}`;
    } else if (deviation === -2) {
      quality = 'dd';
      id = `dd${normalizedDegree + 1}`;
    } else {
      // Extreme cases - Handle arbitrary augmented/diminished intervals
      if (deviation > 0) {
        // Augmented (A, AA, AAA...)
        const count = deviation;
        quality = 'A'.repeat(count) as any;
      } else {
        // Diminished (d, dd, ddd...)
        // For perfect intervals, deviation -1 is d.
        const count = Math.abs(deviation);
        quality = 'd'.repeat(count) as any;
      }
      id = `${quality}${normalizedDegree + 1}`;
    }
  } else {
    // Major/minor intervals (2nd, 3rd, 6th, 7th)
    if (deviation === 0) {
      quality = 'M';
      id = `M${normalizedDegree + 1}`;
    } else if (deviation === -1) {
      quality = 'm';
      id = `m${normalizedDegree + 1}`;
    } else if (deviation === 1) {
      quality = 'A';
      id = `A${normalizedDegree + 1}`;
    } else if (deviation === 2) {
      quality = 'AA';
      id = `AA${normalizedDegree + 1}`;
    } else if (deviation === -2) {
      quality = 'd';
      id = `d${normalizedDegree + 1}`;
    } else if (deviation === -3) {
      quality = 'dd';
      id = `dd${normalizedDegree + 1}`;
    } else {
      // Extreme cases - Handle arbitrary augmented/diminished intervals
      if (deviation > 0) {
        // Augmented (A, AA, AAA...)
        const count = deviation;
        quality = 'A'.repeat(count) as any;
      } else {
        // Diminished (d, dd, ddd...)
        // For major intervals, deviation -1 is m, -2 is d.
        // So deviation -3 is dd (count 2). |dev| - 1 = count.
        const count = Math.abs(deviation) - 1;
        quality = 'd'.repeat(count) as any;
      }
      id = `${quality}${normalizedDegree + 1}`;
    }
  }
  
  return { id, semitones, degree: normalizedDegree, quality };
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

