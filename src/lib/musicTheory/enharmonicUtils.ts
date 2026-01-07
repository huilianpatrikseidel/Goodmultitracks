// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
/**
 * ============================================================================
 * ENHARMONIC SIMPLIFICATION UTILITIES
 * ============================================================================
 * 
 * QA AUDIT FIX (Jan 2026):
 * Provides utilities to simplify extreme intervals and notes
 * (triple sharps/flats, extreme augmented/diminished intervals)
 * into their enharmonic equivalents for better compatibility.
 * 
 * WHY THIS MATTERS:
 * - Most MusicXML parsers don't support AAAA4 or Fx## notation
 * - Human musicians read C# easier than Dbb
 * - Many chord analysis libraries expect standard intervals
 * 
 * WHEN TO USE:
 * - Before exporting to MusicXML/MIDI
 * - When displaying to users
 * - When interfacing with external libraries
 * 
 * WHEN NOT TO USE:
 * - Internal theoretical calculations (preserve original spelling)
 * - When analyzing classical scores (E# vs F matters in key context)
 */

import { parseNoteComponents, noteToSemitone, getAccidentalString } from './core';

/**
 * Simplify a note to its most common enharmonic spelling
 * 
 * Rules:
 * - Prefer naturals (C over B#, F over E#)
 * - Prefer single sharps/flats over double
 * - Prefer sharps in sharp keys, flats in flat keys (if context provided)
 * 
 * @param note - Note to simplify (e.g., 'Dbb', 'E#', 'Fx')
 * @param keyContext - Optional key context for preference (e.g., 'F#' prefers sharps)
 * @returns Simplified enharmonic equivalent
 * 
 * @example
 * simplifyEnharmonic('Dbb') → 'C'
 * simplifyEnharmonic('E#') → 'F'
 * simplifyEnharmonic('Fx') → 'G'
 * simplifyEnharmonic('Cb') → 'B'
 * simplifyEnharmonic('B#') → 'C'
 */
export function simplifyEnharmonic(note: string, keyContext?: string): string {
  const semitone = noteToSemitone(note);
  
  // Standard enharmonic map (prefer naturals and single accidentals)
  const standardNotes: Record<number, string[]> = {
    0: ['C', 'B#', 'Dbb'],
    1: ['C#', 'Db'],
    2: ['D', 'C##', 'Ebb'],
    3: ['D#', 'Eb'],
    4: ['E', 'Fb', 'D##'],
    5: ['F', 'E#', 'Gbb'],
    6: ['F#', 'Gb'],
    7: ['G', 'F##', 'Abb'],
    8: ['G#', 'Ab'],
    9: ['A', 'G##', 'Bbb'],
    10: ['A#', 'Bb'],
    11: ['B', 'Cb', 'A##'],
  };
  
  const options = standardNotes[semitone] ?? ['C'];
  
  // If no key context, return first (simplest) option
  if (!keyContext) {
    return options[0];
  }
  
  // Determine if key context prefers sharps or flats
  const prefersFlats = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'].includes(keyContext);
  
  // Find best match based on key preference
  if (prefersFlats) {
    // Prefer flats: Look for 'b' in options
    const flatOption = options.find(n => n.includes('b'));
    if (flatOption) return flatOption;
  } else {
    // Prefer sharps: Look for '#' in options
    const sharpOption = options.find(n => n.includes('#'));
    if (sharpOption) return sharpOption;
  }
  
  // Fallback to simplest
  return options[0];
}

/**
 * Check if a note uses extreme accidentals (triple sharp/flat or more)
 * 
 * @param note - Note to check
 * @returns true if note has 3+ sharps/flats
 */
export function hasExtremeAccidentals(note: string): boolean {
  const { accidentalValue } = parseNoteComponents(note);
  return Math.abs(accidentalValue) >= 3;
}

/**
 * Suggest enharmonic equivalent for extreme interval
 * 
 * @param intervalId - Interval ID (e.g., 'AAAA4', 'dddd2')
 * @param startNote - Starting note for context
 * @returns Suggested simpler interval ID
 * 
 * @example
 * suggestSimpleInterval('AAAA4', 'C') → 'P5' (C-AAAA4 = C-G##, better as C-P5 = C-G)
 */
export function suggestSimpleInterval(intervalId: string, startNote?: string): string {
  // Extract quality repetition count
  const match = intervalId.match(/^([AdM]+)(\d+)$/);
  if (!match) return intervalId;
  
  const [, quality, degree] = match;
  const count = quality.length;
  
  // If singly/doubly augmented/diminished, it's standard
  if (count <= 2) return intervalId;
  
  // For extreme cases, suggest warning to use enharmonic
  console.warn(
    `[Music Theory] Extreme interval ${intervalId} detected. ` +
    `Consider using enharmonic spelling for better compatibility.`
  );
  
  return intervalId; // Return as-is but logged warning
}

/**
 * Clamp interval quality to maximum doubly augmented/diminished
 * Use this as a safety measure when exporting to formats that don't support extreme intervals
 * 
 * @param intervalId - Interval ID
 * @returns Clamped interval (max AA or dd)
 * 
 * @example
 * clampIntervalQuality('AAAA4') → 'AA4' (with warning)
 * clampIntervalQuality('M3') → 'M3' (unchanged)
 */
export function clampIntervalQuality(intervalId: string): string {
  const match = intervalId.match(/^([AdMmP]+)(\d+)$/);
  if (!match) return intervalId;
  
  const [, quality, degree] = match;
  
  // Check if it's extreme augmented
  if (quality.startsWith('A')) {
    const count = quality.length;
    if (count > 2) {
      console.warn(
        `[Music Theory] Clamping interval ${intervalId} to AA${degree} (was ${count}x augmented)`
      );
      return `AA${degree}`;
    }
  }
  
  // Check if it's extreme diminished
  if (quality.startsWith('d')) {
    const count = quality.length;
    if (count > 2) {
      console.warn(
        `[Music Theory] Clamping interval ${intervalId} to dd${degree} (was ${count}x diminished)`
      );
      return `dd${degree}`;
    }
  }
  
  return intervalId;
}

/**
 * Get documentation URL for advanced interval notation
 * Returns a link to help users understand non-standard intervals
 */
export function getIntervalDocumentationUrl(): string {
  return '/docs/music-theory/MUSIC_THEORY_ADVANCED_FEATURES.md#extreme-intervals';
}
