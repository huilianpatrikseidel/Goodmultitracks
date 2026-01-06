/**
 * ============================================================================
 * ANALYSIS MODULE - Harmonic Analysis & Music Theory Utilities
 * ============================================================================
 * Functions for analyzing harmonic relationships, roman numerals, and
 * musical context.
 */

import { getScaleNotes, isChordInKey } from './scales';
import { parseNoteComponents, areNotesEnharmonic } from './core';
import { parseChordName, buildChord } from './chords';
import { transposeNote } from './transposition';

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

// ============================================================================
// PHASE 3.2 - ADVANCED HARMONIC ANALYSIS
// ============================================================================

/**
 * Chord function types in tonal harmony
 */
export type ChordFunction = 
  | 'tonic'           // I, i, vi, VI - stable, home
  | 'subdominant'     // IV, iv, ii, ii° - pre-dominant, preparation
  | 'dominant'        // V, V7, vii° - tension, leading to tonic
  | 'borrowed'        // Borrowed from parallel key
  | 'secondary'       // Secondary dominant/leading tone
  | 'chromatic';      // Non-diatonic, not borrowed

/**
 * Extended chord function result with additional context
 */
export interface ChordFunctionAnalysis {
  function: ChordFunction;
  romanNumeral: string | null;
  scaleDegree: number | null;
  isDiatonic: boolean;
  notes: string[];
  quality: string;
}

/**
 * ADVANCED: Analyze the harmonic function of a chord in a key
 * Determines if chord is tonic, subdominant, dominant, borrowed, or secondary
 * 
 * @param chord - Chord name (e.g., 'Dm7', 'G7', 'Bb')
 * @param key - Key root (e.g., 'C', 'A')
 * @param mode - Key mode ('major' or 'minor', default 'major')
 * @returns ChordFunctionAnalysis object
 * 
 * @example
 * analyzeChordFunction('Dm7', 'C', 'major')
 *   → { function: 'subdominant', romanNumeral: 'ii7', scaleDegree: 2, isDiatonic: true }
 * 
 * analyzeChordFunction('G7', 'C', 'major')
 *   → { function: 'dominant', romanNumeral: 'V7', scaleDegree: 5, isDiatonic: true }
 * 
 * analyzeChordFunction('D7', 'C', 'major')
 *   → { function: 'secondary', romanNumeral: 'V7/V', scaleDegree: null, isDiatonic: false }
 * 
 * analyzeChordFunction('Fm', 'C', 'major')
 *   → { function: 'borrowed', romanNumeral: 'iv', scaleDegree: 4, isDiatonic: false }
 */
export function analyzeChordFunction(
  chord: string,
  key: string,
  mode: 'major' | 'minor' = 'major'
): ChordFunctionAnalysis {
  const parsed = parseChordName(chord);
  const chordRoot = parsed.root + (parsed.accidental === 'sharp' ? '#' : parsed.accidental === 'flat' ? 'b' : '');
  
  // Construct full quality string
  let qualityStr = '';
  if (parsed.quality === 'minor') qualityStr = 'm';
  else if (parsed.quality === 'diminished') qualityStr = 'dim';
  else if (parsed.quality === 'augmented') qualityStr = 'aug';
  
  if (parsed.extension !== 'none') {
    qualityStr += parsed.extension;
  }
  
  const chordNotes = buildChord(chordRoot, qualityStr);
  
  // Get scale notes for the key
  const scaleNotes = getScaleNotes(key, mode);
  const normalizedScaleNotes = scaleNotes.map(n => n.replace(/\d+$/, ''));
  
  // Check if chord root is in the scale
  const scaleDegree = normalizedScaleNotes.findIndex(n => 
    n === chordRoot || areNotesEnharmonic(n, chordRoot)
  );
  
  const isDiatonic = isChordDiatonic(chordNotes, key, mode);
  const romanNumeral = getRomanNumeral(chordRoot, key, mode);
  
  // Determine function
  let chordFunction: ChordFunction;
  
  if (scaleDegree === -1) {
    // Not in scale - check if secondary dominant
    const secondaryInfo = analyzeSecondaryDominant(chord, key, mode);
    if (secondaryInfo.isSecondary) {
      chordFunction = 'secondary';
    } else {
      chordFunction = 'chromatic';
    }
  } else if (!isDiatonic) {
    // In scale but chord quality doesn't match - likely borrowed
    chordFunction = 'borrowed';
  } else {
    // Diatonic - determine by scale degree
    if (mode === 'major') {
      if (scaleDegree === 0 || scaleDegree === 5) {
        chordFunction = 'tonic';
      } else if (scaleDegree === 3 || scaleDegree === 1) {
        chordFunction = 'subdominant';
      } else if (scaleDegree === 4 || scaleDegree === 6) {
        chordFunction = 'dominant';
      } else {
        chordFunction = 'tonic'; // Default for mediant
      }
    } else {
      // Minor mode
      if (scaleDegree === 0 || scaleDegree === 2) {
        chordFunction = 'tonic';
      } else if (scaleDegree === 3 || scaleDegree === 1) {
        chordFunction = 'subdominant';
      } else if (scaleDegree === 4 || scaleDegree === 6) {
        chordFunction = 'dominant';
      } else {
        chordFunction = 'tonic';
      }
    }
  }
  
  return {
    function: chordFunction,
    romanNumeral: romanNumeral || (scaleDegree >= 0 ? ROMAN_NUMERALS[scaleDegree] : null),
    scaleDegree: scaleDegree >= 0 ? scaleDegree + 1 : null,
    isDiatonic,
    notes: chordNotes,
    quality: qualityStr || 'major'
  };
}

/**
 * Borrowed chord detection result
 */
export interface BorrowedChordInfo {
  isBorrowed: boolean;
  sourceKey?: string;
  sourceMode?: 'major' | 'minor';
  explanation?: string;
}

/**
 * ADVANCED: Detect if a chord is borrowed from the parallel key
 * (e.g., Fm in C major is borrowed from C minor)
 * 
 * @param chord - Chord name (e.g., 'Fm', 'Ab', 'Bb')
 * @param key - Key root (e.g., 'C')
 * @param mode - Current key mode ('major' or 'minor', default 'major')
 * @returns BorrowedChordInfo object
 * 
 * @example
 * isBorrowedChord('Fm', 'C', 'major')
 *   → { isBorrowed: true, sourceKey: 'C', sourceMode: 'minor', explanation: 'iv from parallel minor' }
 * 
 * isBorrowedChord('Ab', 'C', 'major')
 *   → { isBorrowed: true, sourceKey: 'C', sourceMode: 'minor', explanation: 'bVI from parallel minor' }
 * 
 * isBorrowedChord('G', 'C', 'major')
 *   → { isBorrowed: false }
 */
export function isBorrowedChord(
  chord: string,
  key: string,
  mode: 'major' | 'minor' = 'major'
): BorrowedChordInfo {
  const parsed = parseChordName(chord);
  const chordRoot = parsed.root + (parsed.accidental === 'sharp' ? '#' : parsed.accidental === 'flat' ? 'b' : '');
  
  // Build full quality
  let qualityStr = '';
  if (parsed.quality === 'minor') qualityStr = 'm';
  else if (parsed.quality === 'diminished') qualityStr = 'dim';
  else if (parsed.quality === 'augmented') qualityStr = 'aug';
  if (parsed.extension !== 'none') qualityStr += parsed.extension;
  
  const chordNotes = buildChord(chordRoot, qualityStr);
  
  // Check if diatonic to current key
  const currentScale = mode;
  const isDiatonicToCurrent = isChordDiatonic(chordNotes, key, currentScale);
  
  if (isDiatonicToCurrent) {
    return { isBorrowed: false };
  }
  
  // Check if diatonic to parallel key
  const parallelMode = mode === 'major' ? 'minor' : 'major';
  const isDiatonicToParallel = isChordDiatonic(chordNotes, key, parallelMode);
  
  if (isDiatonicToParallel) {
    const romanNumeral = getRomanNumeral(chordRoot, key, parallelMode);
    return {
      isBorrowed: true,
      sourceKey: key,
      sourceMode: parallelMode,
      explanation: `${romanNumeral || '?'} from parallel ${parallelMode}`
    };
  }
  
  // Check other related keys (relative major/minor)
  if (mode === 'major') {
    // Check relative minor (e.g., Am for C major)
    const relativeMinorRoot = transposeNote(key, 'm6');
    const isDiatonicToRelative = isChordDiatonic(chordNotes, relativeMinorRoot, 'minor');
    
    if (isDiatonicToRelative) {
      const romanNumeral = getRomanNumeral(chordRoot, relativeMinorRoot, 'minor');
      return {
        isBorrowed: true,
        sourceKey: relativeMinorRoot,
        sourceMode: 'minor',
        explanation: `${romanNumeral || '?'} from relative minor (${relativeMinorRoot})`
      };
    }
  } else {
    // Check relative major (e.g., C major for A minor)
    const relativeMajorRoot = transposeNote(key, 'm3');
    const isDiatonicToRelative = isChordDiatonic(chordNotes, relativeMajorRoot, 'major');
    
    if (isDiatonicToRelative) {
      const romanNumeral = getRomanNumeral(chordRoot, relativeMajorRoot, 'major');
      return {
        isBorrowed: true,
        sourceKey: relativeMajorRoot,
        sourceMode: 'major',
        explanation: `${romanNumeral || '?'} from relative major (${relativeMajorRoot})`
      };
    }
  }
  
  return { isBorrowed: false };
}

/**
 * Secondary dominant/leading tone analysis result
 */
export interface SecondaryDominantInfo {
  isSecondary: boolean;
  targetChord?: string;
  targetDegree?: number;
  romanNumeral?: string;
  type?: 'dominant' | 'leading-tone' | 'half-diminished';
  explanation?: string;
}

/**
 * ADVANCED: Analyze if a chord is a secondary dominant or secondary leading tone
 * (e.g., D7 in C major is V7/V, targeting G)
 * 
 * @param chord - Chord name (e.g., 'D7', 'E7', 'A7')
 * @param key - Key root (e.g., 'C')
 * @param mode - Key mode ('major' or 'minor', default 'major')
 * @returns SecondaryDominantInfo object
 * 
 * @example
 * analyzeSecondaryDominant('D7', 'C', 'major')
 *   → { isSecondary: true, targetChord: 'G', targetDegree: 5, romanNumeral: 'V7/V', type: 'dominant' }
 * 
 * analyzeSecondaryDominant('A7', 'C', 'major')
 *   → { isSecondary: true, targetChord: 'Dm', targetDegree: 2, romanNumeral: 'V7/ii', type: 'dominant' }
 * 
 * analyzeSecondaryDominant('F#dim7', 'C', 'major')
 *   → { isSecondary: true, targetChord: 'G', targetDegree: 5, romanNumeral: 'vii°7/V', type: 'leading-tone' }
 */
export function analyzeSecondaryDominant(
  chord: string,
  key: string,
  mode: 'major' | 'minor' = 'major'
): SecondaryDominantInfo {
  const parsed = parseChordName(chord);
  const chordRoot = parsed.root + (parsed.accidental === 'sharp' ? '#' : parsed.accidental === 'flat' ? 'b' : '');
  
  // Check if it's a dominant-type chord (major with m7, or diminished)
  const isDominantQuality = (
    parsed.extension === '7' && parsed.quality === 'major'
  );
  const isDiminishedQuality = parsed.quality === 'diminished';
  const isHalfDiminished = parsed.extension === 'm7b5';
  
  if (!isDominantQuality && !isDiminishedQuality && !isHalfDiminished) {
    return { isSecondary: false };
  }
  
  const scaleNotes = getScaleNotes(key, mode);
  const normalizedScaleNotes = scaleNotes.map(n => n.replace(/\d+$/, ''));
  
  // For each scale degree, check if this chord would be its V7 or vii°
  for (let i = 0; i < normalizedScaleNotes.length; i++) {
    const targetNote = normalizedScaleNotes[i];
    
    // Calculate what the V (dominant) of this target would be
    const expectedDominant = transposeNote(targetNote, 'P5');
    
    // Calculate what the vii° (leading tone) of this target would be
    const expectedLeadingTone = transposeNote(targetNote, 'M7');
    
    // Check if our chord matches
    if (areNotesEnharmonic(chordRoot, expectedDominant) && isDominantQuality) {
      const targetRoman = getRomanNumeral(targetNote, key, mode);
      return {
        isSecondary: true,
        targetChord: targetNote,
        targetDegree: i + 1,
        romanNumeral: `V7/${targetRoman || (i + 1)}`,
        type: 'dominant',
        explanation: `Secondary dominant resolving to ${targetRoman || targetNote}`
      };
    }
    
    if (areNotesEnharmonic(chordRoot, expectedLeadingTone) && (isDiminishedQuality || isHalfDiminished)) {
      const targetRoman = getRomanNumeral(targetNote, key, mode);
      const chordSymbol = isDiminishedQuality ? 'vii°' : 'viiø7';
      return {
        isSecondary: true,
        targetChord: targetNote,
        targetDegree: i + 1,
        romanNumeral: `${chordSymbol}/${targetRoman || (i + 1)}`,
        type: isHalfDiminished ? 'half-diminished' : 'leading-tone',
        explanation: `Secondary leading tone resolving to ${targetRoman || targetNote}`
      };
    }
  }
  
  return { isSecondary: false };
}

/**
 * UTILITY: Get the expected secondary dominant for a target chord
 * Useful for suggesting tonicizations
 * 
 * @param targetChord - Chord to tonicize (e.g., 'G', 'Dm')
 * @param key - Current key (e.g., 'C')
 * @param mode - Key mode
 * @returns The secondary dominant chord name
 * 
 * @example
 * getSecondaryDominant('G', 'C', 'major') → 'D7'
 * getSecondaryDominant('Dm', 'C', 'major') → 'A7'
 * getSecondaryDominant('Em', 'C', 'major') → 'B7'
 */
export function getSecondaryDominant(
  targetChord: string,
  key: string,
  mode: 'major' | 'minor' = 'major'
): string {
  const parsed = parseChordName(targetChord);
  const targetRoot = parsed.root + (parsed.accidental === 'sharp' ? '#' : parsed.accidental === 'flat' ? 'b' : '');
  
  // Calculate the V of the target (up a Perfect 5th)
  const dominantRoot = transposeNote(targetRoot, 'P5');
  
  return dominantRoot + '7';
}
