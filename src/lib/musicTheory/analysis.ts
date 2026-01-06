/**
 * ============================================================================
 * ANALYSIS MODULE - Harmonic Analysis & Music Theory Utilities
 * ============================================================================
 * Functions for analyzing harmonic relationships, roman numerals, and
 * musical context.
 */

import { getScaleNotes } from './scales';
import { parseNoteComponents } from './core';

/**
 * Scale degree to roman numeral mapping
 */
const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const ROMAN_NUMERALS_MINOR = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];

/**
 * Get the roman numeral for a chord in a given key
 * 
 * @param chordRoot - Root note of the chord (e.g., 'D', 'F#')
 * @param keyRoot - Root note of the key (e.g., 'C', 'A')
 * @param scale - Scale type ('major' or 'minor')
 * @returns Roman numeral representation (e.g., 'II', 'V', 'vi')
 * 
 * @example
 * getRomanNumeral('D', 'C', 'major') → 'II' (D is the supertonic in C major)
 * getRomanNumeral('E', 'A', 'minor') → 'v' (E is the dominant in A minor)
 * getRomanNumeral('F#', 'D', 'major') → 'III' (F# is the mediant in D major)
 */
export function getRomanNumeral(
  chordRoot: string, 
  keyRoot: string, 
  scale: string = 'major'
): string | null {
  const scaleNotes = getScaleNotes(keyRoot, scale);
  
  // Ensure chordRoot is a string
  const chordRootStr = String(chordRoot);
  
  // Normalize notes to compare (remove octave numbers)
  const normalizedChordRoot = chordRootStr.replace(/\d+$/, '');
  const normalizedScaleNotes = scaleNotes.map(note => note.replace(/\d+$/, ''));
  
  // Find the position in the scale
  const position = normalizedScaleNotes.indexOf(normalizedChordRoot);
  
  if (position === -1) {
    // Chord not in scale - could be borrowed or chromatic
    return null;
  }
  
  // Return appropriate roman numeral
  const isMinorScale = scale === 'minor' || scale === 'harmonic-minor' || scale === 'melodic-minor-asc';
  return isMinorScale ? ROMAN_NUMERALS_MINOR[position] : ROMAN_NUMERALS[position];
}

/**
 * Calculate the interval between two notes
 * Returns the interval that would transpose noteA to noteB
 * 
 * @param noteA - First note
 * @param noteB - Second note
 * @returns Interval in semitones
 * 
 * @example
 * getInterval('C', 'E') → 4 (Major 3rd)
 * getInterval('F', 'C') → 7 (Perfect 5th)
 */
export function getInterval(noteA: string, noteB: string): number {
  const noteToSemitone: Record<string, number> = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
    'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
  };
  
  const normalizedA = noteA.replace(/\d+$/, '');
  const normalizedB = noteB.replace(/\d+$/, '');
  
  const semitoneA = noteToSemitone[normalizedA] ?? 0;
  const semitoneB = noteToSemitone[normalizedB] ?? 0;
  
  let interval = semitoneB - semitoneA;
  if (interval < 0) interval += 12;
  
  return interval;
}

/**
 * Determine if a chord is diatonic to a key
 * (All notes of the chord exist in the scale)
 * 
 * @param chordNotes - Array of note names in the chord
 * @param keyRoot - Root note of the key
 * @param scale - Scale type
 * @returns true if all chord notes are in the scale
 */
export function isChordDiatonic(
  chordNotes: string[], 
  keyRoot: string, 
  scale: string = 'major'
): boolean {
  const scaleNotes = getScaleNotes(keyRoot, scale);
  const normalizedScaleNotes = scaleNotes.map(note => note.replace(/\d+$/, ''));
  
  return chordNotes.every(chordNote => {
    const normalizedChordNote = chordNote.replace(/\d+$/, '');
    return normalizedScaleNotes.includes(normalizedChordNote);
  });
}

/**
 * Find the closest enharmonic equivalent
 * Useful for simplifying double sharps/flats
 * 
 * @param note - Note to simplify (e.g., 'E#', 'Cb', 'Dx')
 * @returns Simplified enharmonic equivalent
 * 
 * @example
 * getEnharmonicEquivalent('E#') → 'F'
 * getEnharmonicEquivalent('Cb') → 'B'
 * getEnharmonicEquivalent('Dx') → 'E'
 */
export function getEnharmonicEquivalent(note: string): string {
  const { letter, accidentalValue } = parseNoteComponents(note);
  
  const noteLetters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const semitones = [0, 2, 4, 5, 7, 9, 11];
  
  const letterIndex = noteLetters.indexOf(letter);
  const totalSemitones = (semitones[letterIndex] + accidentalValue + 120) % 12;
  
  // Map to simple enharmonic
  const simpleNotes: Record<number, string> = {
    0: 'C', 1: 'C#', 2: 'D', 3: 'Eb', 4: 'E', 5: 'F',
    6: 'F#', 7: 'G', 8: 'Ab', 9: 'A', 10: 'Bb', 11: 'B'
  };
  
  return simpleNotes[totalSemitones] || note;
}
