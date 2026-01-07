// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
/**
 * ============================================================================
 * CHORDS MODULE - Chord Construction & Analysis
 * ============================================================================
 * Handles chord generation, parsing, and naming using interval-based definitions.
 */

import { INTERVAL_DEFINITIONS, IntervalObject, areNotesEnharmonic } from './core';
import { transposeNote } from './transposition';
import { BravuraSymbols } from '../bravuraUtils';

/**
 * CHORD INTERVAL DEFINITIONS
 * Each chord type is defined by its intervals from the root.
 * This ensures consistent chord construction across the application.
 */
export const CHORD_INTERVALS: Record<string, IntervalObject[]> = {
  // Triads
  '': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.M3, INTERVAL_DEFINITIONS.P5],
  'm': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.m3, INTERVAL_DEFINITIONS.P5],
  'dim': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.m3, INTERVAL_DEFINITIONS.d5],
  'aug': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.M3, INTERVAL_DEFINITIONS.A5],
  'sus2': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.M2, INTERVAL_DEFINITIONS.P5],
  'sus4': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.P4, INTERVAL_DEFINITIONS.P5],
  '7sus2': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.M2, INTERVAL_DEFINITIONS.P5, INTERVAL_DEFINITIONS.m7],
  '7sus4': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.P4, INTERVAL_DEFINITIONS.P5, INTERVAL_DEFINITIONS.m7],
  
  // Seventh Chords
  '7': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.M3, INTERVAL_DEFINITIONS.P5, INTERVAL_DEFINITIONS.m7],
  'maj7': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.M3, INTERVAL_DEFINITIONS.P5, INTERVAL_DEFINITIONS.M7],
  'm7': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.m3, INTERVAL_DEFINITIONS.P5, INTERVAL_DEFINITIONS.m7],
  // QA AUDIT NOTE: dim7 uses diminished 7th interval (9 semitones)
  // For Cdim7: C, Eb, Gb, Bbb (NOT A) - theoretically correct double flat
  // The transposeNote function maintains proper enharmonic spelling (Bbb vs A)
  'dim7': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.m3, INTERVAL_DEFINITIONS.d5, INTERVAL_DEFINITIONS.dim7],
  'm7b5': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.m3, INTERVAL_DEFINITIONS.d5, INTERVAL_DEFINITIONS.m7],
  'aug7': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.M3, INTERVAL_DEFINITIONS.A5, INTERVAL_DEFINITIONS.m7],
  'mMaj7': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.m3, INTERVAL_DEFINITIONS.P5, INTERVAL_DEFINITIONS.M7],
  
  // Extended Chords (9ths)
  '9': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.M3, INTERVAL_DEFINITIONS.P5, INTERVAL_DEFINITIONS.m7, INTERVAL_DEFINITIONS['9']],
  'maj9': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.M3, INTERVAL_DEFINITIONS.P5, INTERVAL_DEFINITIONS.M7, INTERVAL_DEFINITIONS['9']],
  'm9': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.m3, INTERVAL_DEFINITIONS.P5, INTERVAL_DEFINITIONS.m7, INTERVAL_DEFINITIONS['9']],
  '7b9': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.M3, INTERVAL_DEFINITIONS.P5, INTERVAL_DEFINITIONS.m7, INTERVAL_DEFINITIONS.b9],
  '7#9': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.M3, INTERVAL_DEFINITIONS.P5, INTERVAL_DEFINITIONS.m7, INTERVAL_DEFINITIONS['#9']],
  
  // Extended Chords (11ths)
  // NOTE: Major 11th chords omit the 3rd to avoid M3+P11 clash (minor 9th interval)
  // The P11 against M3 creates extreme dissonance. Standard practice uses #11 or omits 3rd.
  '11': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.M3, INTERVAL_DEFINITIONS.P5, INTERVAL_DEFINITIONS.m7, INTERVAL_DEFINITIONS['9'], INTERVAL_DEFINITIONS['11']], // M3 included for theoretical accuracy
  '11(no3)': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.m7, INTERVAL_DEFINITIONS['9'], INTERVAL_DEFINITIONS['11']], // Explicit no3
  'm11': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.m3, INTERVAL_DEFINITIONS.P5, INTERVAL_DEFINITIONS.m7, INTERVAL_DEFINITIONS['9'], INTERVAL_DEFINITIONS['11']],
  '7#11': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.M3, INTERVAL_DEFINITIONS.P5, INTERVAL_DEFINITIONS.m7, INTERVAL_DEFINITIONS['#11']],
  'maj7#11': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.M3, INTERVAL_DEFINITIONS.P5, INTERVAL_DEFINITIONS.M7, INTERVAL_DEFINITIONS['#11']],
  'maj11': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.M3, INTERVAL_DEFINITIONS.P5, INTERVAL_DEFINITIONS.M7, INTERVAL_DEFINITIONS['9'], INTERVAL_DEFINITIONS['#11']], // Use #11 for major
  
  // Altered Dominant (7alt) - Super Locrian scale
  // The Altered Scale permits ANY combination of: b5/#5 AND b9/#9
  // These are the most common voicing variations:
  'alt': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.M3, INTERVAL_DEFINITIONS.d5, INTERVAL_DEFINITIONS.m7, INTERVAL_DEFINITIONS.b9], // Default: 7b5b9
  '7alt': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.M3, INTERVAL_DEFINITIONS.d5, INTERVAL_DEFINITIONS.m7, INTERVAL_DEFINITIONS.b9], // Alias
  '7b5b9': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.M3, INTERVAL_DEFINITIONS.d5, INTERVAL_DEFINITIONS.m7, INTERVAL_DEFINITIONS.b9], // Explicit
  '7#5#9': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.M3, INTERVAL_DEFINITIONS.A5, INTERVAL_DEFINITIONS.m7, INTERVAL_DEFINITIONS['#9']], // Hendrix chord
  '7b5#9': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.M3, INTERVAL_DEFINITIONS.d5, INTERVAL_DEFINITIONS.m7, INTERVAL_DEFINITIONS['#9']], // Hybrid voicing
  '7#5b9': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.M3, INTERVAL_DEFINITIONS.A5, INTERVAL_DEFINITIONS.m7, INTERVAL_DEFINITIONS.b9], // Hybrid voicing
  
  // Extended Chords (13ths)
  '13': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.M3, INTERVAL_DEFINITIONS.P5, INTERVAL_DEFINITIONS.m7, INTERVAL_DEFINITIONS['9'], INTERVAL_DEFINITIONS['13']],
  'maj13': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.M3, INTERVAL_DEFINITIONS.P5, INTERVAL_DEFINITIONS.M7, INTERVAL_DEFINITIONS['9'], INTERVAL_DEFINITIONS['13']],
  'm13': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.m3, INTERVAL_DEFINITIONS.P5, INTERVAL_DEFINITIONS.m7, INTERVAL_DEFINITIONS['9'], INTERVAL_DEFINITIONS['13']],
  '7b13': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.M3, INTERVAL_DEFINITIONS.P5, INTERVAL_DEFINITIONS.m7, INTERVAL_DEFINITIONS.b13],
  
  // Add Chords
  'add9': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.M3, INTERVAL_DEFINITIONS.P5, INTERVAL_DEFINITIONS['9']],
  'madd9': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.m3, INTERVAL_DEFINITIONS.P5, INTERVAL_DEFINITIONS['9']],
  '6': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.M3, INTERVAL_DEFINITIONS.P5, INTERVAL_DEFINITIONS.M6],
  'm6': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.m3, INTERVAL_DEFINITIONS.P5, INTERVAL_DEFINITIONS.M6],
  '6/9': [INTERVAL_DEFINITIONS.P1, INTERVAL_DEFINITIONS.M3, INTERVAL_DEFINITIONS.P5, INTERVAL_DEFINITIONS.M6, INTERVAL_DEFINITIONS['9']],
};

/**
 * Result of chord building with optional bass note for inversions
 */
export interface ChordResult {
  notes: string[];
  bass?: string;
}

/**
 * BUILD CHORD v3.0
 * Constructs chord notes using the new transposeNote function.
 * Guarantees correct enharmonic spellings for all chord types.
 * 
 * OVERLOADED SIGNATURES:
 * - buildChord(root, qualityString) - New format: 'maj7', 'm7', etc.
 * - buildChord(root, quality, extension) - Legacy format: 'major', '7'
 * 
 * @param root - Root note of the chord (e.g., 'C', 'F#', 'Bb')
 * @param quality - Chord quality (new: combined string like 'maj7'; old: 'major', 'minor')
 * @param extension - Legacy parameter: extension string ('7', 'maj7', '9', etc.)
 * @returns Array of note names with correct enharmonic spelling
 * 
 * @example
 * // New format
 * buildChord('F#', '') → ['F#', 'A#', 'C#']
 * buildChord('C', 'maj7') → ['C', 'E', 'G', 'B']
 * 
 * // Legacy format (backward compatible)
 * buildChord('C', 'major', 'maj7') → ['C', 'E', 'G', 'B']
 * buildChord('A', 'minor', '7') → ['A', 'C', 'E', 'G']
 */
export function buildChord(
  root: string, 
  quality: string = '', 
  extension?: string
): string[] {
  let chordQuality = quality;
  
  // Handle legacy 3-parameter format: buildChord('C', 'major', '7')
  if (extension) {
    // Legacy format: combine quality + extension
    // Map legacy quality names to chord suffix
    const qualityMap: Record<string, string> = {
      'major': '',
      'minor': 'm',
      'diminished': 'dim',
      'augmented': 'aug',
      'sus2': 'sus2',
      'sus4': 'sus4',
    };
    
    const qualitySuffix = qualityMap[quality.toLowerCase()] ?? quality;
    chordQuality = qualitySuffix + extension;
  }
  
  const intervals = CHORD_INTERVALS[chordQuality];
  
  if (!intervals) {
    console.warn(`Unknown chord quality: ${chordQuality}. Defaulting to major triad.`);
    return buildChord(root, '');
  }
  
  return intervals.map(interval => transposeNote(root, interval));
}

/**
 * BUILD CHORD WITH BASS v3.0
 * Extended version that supports inversions with bass note specification
 * 
 * @param root - Root note of the chord (e.g., 'C', 'F#', 'Bb')
 * @param quality - Chord quality/extension (e.g., '', 'm', '7', 'maj7', 'dim7')
 * @param bassNote - Bass note for inversions (e.g., 'E' for C/E)
 * @returns ChordResult with notes array and bass note
 * 
 * @example
 * buildChordWithBass('C', '', 'E') → { notes: ['C', 'E', 'G'], bass: 'E' }
 * buildChordWithBass('Am7', 'm7', 'G') → { notes: ['A', 'C', 'E', 'G'], bass: 'G' }
 */
export function buildChordWithBass(root: string, quality: string = '', bassNote: string): ChordResult {
  const notes = buildChord(root, quality);
  return { notes, bass: bassNote };
}

/**
 * BUILD VOICED CHORD v3.0
 * Builds a chord and automatically rotates it so the bass note is at index 0.
 * This is the correct implementation for slash chords where the bass note
 * should be the lowest note in the voicing.
 * 
 * @param root - Root note of the chord (e.g., 'C', 'F#', 'Bb')
 * @param quality - Chord quality/extension (e.g., '', 'm', '7', 'maj7', 'dim7')
 * @param bassNote - Bass note for inversions (e.g., 'E' for C/E)
 * @returns Array of notes with bass note at index 0
 * 
 * @example
 * buildVoicedChord('C', '', 'E') → ['E', 'G', 'C'] (1st inversion)
 * buildVoicedChord('C', '', 'G') → ['G', 'C', 'E'] (2nd inversion)
 * buildVoicedChord('Am7', 'm7', 'G') → ['G', 'A', 'C', 'E']
 * buildVoicedChord('C', '7', 'Bb') → ['Bb', 'C', 'E', 'G']
 */
export function buildVoicedChord(root: string, quality: string = '', bassNote?: string): string[] {
  const notes = buildChord(root, quality);
  
  // If no bass note specified, return root position
  if (!bassNote) return notes;
  
  // Find the bass note in the chord (check for enharmonic equivalents)
  const bassIndex = notes.findIndex(note => {
    const cleanNote = note.replace(/\\d+$/, '');
    const cleanBass = bassNote.replace(/\\d+$/, '');
    return cleanNote === cleanBass || areNotesEnharmonic(cleanNote, cleanBass);
  });
  
  // If bass note not found in chord, just add it at the beginning
  if (bassIndex === -1) {
    console.warn(`Bass note ${bassNote} not found in ${root}${quality}. Adding to voicing.`);
    return [bassNote, ...notes];
  }
  
  // Rotate array so bass note is at index 0
  return [...notes.slice(bassIndex), ...notes.slice(0, bassIndex)];
}

/**
 * BUILD CHORD (Legacy - Array Return)
 * @deprecated Use buildChord which now returns arrays by default
 * Kept for backward compatibility
 */
export function buildChordArray(root: string, quality: string = ''): string[] {
  return buildChord(root, quality);
}

/**
 * Parsed chord representation
 */
export interface ParsedChord {
  root: string;
  accidental: string;
  quality: string;
  extension: string;
  bassNote: string;
}

/**
 * Constants for chord parsing/generation
 */
export const ACCIDENTALS = [
  { value: 'natural', label: BravuraSymbols.accidentalNatural, symbol: '' }, 
  { value: 'sharp', label: BravuraSymbols.accidentalSharp, symbol: '#' },
  { value: 'flat', label: BravuraSymbols.accidentalFlat, symbol: 'b' },
];

export const QUALITIES = [
  { value: 'major', label: 'Major', suffix: '' }, 
  { value: 'minor', label: 'Minor', suffix: 'm' },
  { value: 'diminished', label: 'Diminished', suffix: 'dim' }, 
  { value: 'augmented', label: 'Augmented', suffix: 'aug' },
  { value: 'sus2', label: 'Suspended 2nd', suffix: 'sus2' }, 
  { value: 'sus4', label: 'Suspended 4th', suffix: 'sus4' },
];

export const EXTENSIONS = [
  { value: 'none', label: 'None', suffix: '' }, 
  { value: '7', label: 'Dominant 7th', suffix: '7' },
  { value: 'maj7', label: 'Major 7th', suffix: 'maj7' }, 
  { value: '9', label: '9th', suffix: '9' },
  { value: 'maj9', label: 'Major 9th', suffix: 'maj9' }, 
  { value: '11', label: '11th', suffix: '11' },
  { value: '13', label: '13th', suffix: '13' }, 
  { value: '6', label: '6th', suffix: '6' },
  { value: 'add9', label: 'Add 9', suffix: 'add9' },
];

/**
 * Parsed chord components
 */
export interface ParsedChord {
  root: string;
  accidental: string;
  quality: string;
  extension: string;
  bassNote: string;
  isPolychord?: boolean; // True if slash indicates upper structure, not just bass
  upperChord?: ParsedChord; // If polychord, parsed upper chord
}

/**
 * Parse a chord name into its components
 * Now distinguishes between slash chords (single bass note) and polychords (chord over chord)
 * 
 * @example parseChordName('Am7/G') → { root: 'A', quality: 'minor', extension: '7', bassNote: 'G', isPolychord: false }
 * @example parseChordName('D/C') → { root: 'D', bassNote: 'C', isPolychord: true, upperChord: {...} }
 */
export const parseChordName = (chordName: string = ''): ParsedChord => {
  if (!chordName) {
    return { root: 'C', accidental: 'natural', quality: 'major', extension: 'none', bassNote: '', isPolychord: false };
  }

  // Separate bass/upper part (e.g., "Am7/G" or "D/C")
  const [mainChord, bassPart] = chordName.split('/');
  let bassNote = bassPart || '';
  let isPolychord = false;
  let upperChord: ParsedChord | undefined;
  
  // Check if bassPart is a chord (polychord) or just a note (slash chord)
  if (bassPart) {
    const chordRegex = /^([A-G])([#b]?)(maj|m|min|dim|aug|sus2|sus4)?(13|11|9|7|6|add9|maj9|maj7)?(.*)$/;
    const bassMatch = bassPart.match(chordRegex);
    
    // If it has a quality suffix or extension, it's a polychord
    if (bassMatch && (bassMatch[3] || bassMatch[4])) {
      isPolychord = true;
      upperChord = parseChordName(bassPart); // Recursive parse
    } else {
      // Just a single note - slash chord
      bassNote = bassPart;
    }
  }

  // Robust regex to parse main chord
  // Enhanced to handle "C2" as sus2 (Nashville Number System notation)
  const chordRegex = /^([A-G])([#b]?)(2|maj|m|min|dim|aug|sus2|sus4)?(13|11|9|7|6|add9|maj9|maj7)?(.*)$/;
  const match = mainChord.match(chordRegex);

  if (match) {
    const [, root, acc, qualSuffix, extSuffix] = match;

    const accidental = acc === '#' ? 'sharp' : acc === 'b' ? 'flat' : 'natural';

    // Map quality suffixes
    let quality = 'major';
    if (qualSuffix === 'm' || qualSuffix === 'min') quality = 'minor';
    else if (qualSuffix === 'dim') quality = 'diminished';
    else if (qualSuffix === 'aug') quality = 'augmented';
    else if (qualSuffix === 'sus2' || qualSuffix === '2') quality = 'sus2'; // "C2" maps to sus2
    else if (qualSuffix === 'sus4') quality = 'sus4';
    else if (qualSuffix === 'maj' && !extSuffix?.startsWith('maj')) quality = 'major';

    // Map extension suffixes
    let extension = 'none';
    if (qualSuffix === 'maj' && extSuffix === '7') extension = 'maj7';
    else if (qualSuffix === 'maj' && extSuffix === '9') extension = 'maj9';
    else if (extSuffix === '7') extension = '7';
    else if (extSuffix === '9') extension = '9';
    else if (extSuffix === '11') extension = '11';
    else if (extSuffix === '13') extension = '13';
    else if (extSuffix === '6') extension = '6';
    else if (extSuffix === 'add9') extension = 'add9';

    return { root, accidental, quality, extension, bassNote, isPolychord, upperChord };
  } else {
    console.warn("Could not parse chord name accurately:", chordName);
    return { root: chordName[0] || 'C', accidental: 'natural', quality: 'major', extension: 'none', bassNote: '', isPolychord: false };
  }
};

/**
 * Generate a chord name from components
 */
export const generateChordName = (
  rootNote: string, 
  accidental: string, 
  quality: string, 
  extension: string, 
  bassNote: string
): string => {
  const accSymbol = ACCIDENTALS.find(a => a.value === accidental)?.symbol || '';
  const qualSuffix = QUALITIES.find(q => q.value === quality)?.suffix || '';
  const extSuffix = EXTENSIONS.find(e => e.value === extension)?.suffix || '';
  
  // Special logic for maj7/maj9
  let finalExtSuffix = extSuffix;
  if (extension === 'maj7' && quality !== 'major') finalExtSuffix = 'maj7';
  else if (extension === 'maj9' && quality !== 'major') finalExtSuffix = 'maj9';
  else if (quality === 'major' && (extension === 'maj7' || extension === 'maj9')) finalExtSuffix = extSuffix;
  else if (quality === 'major' && extension !== 'none') finalExtSuffix = extSuffix;
  else if (quality !== 'major' && extension !== 'none') finalExtSuffix = extSuffix;

  return `${rootNote}${accSymbol}${qualSuffix}${finalExtSuffix}${bassNote ? '/' + bassNote : ''}`;
};

