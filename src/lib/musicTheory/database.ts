// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
/**
 * ============================================================================
 * CHORD DATABASE - Instrument Fingerings
 * ============================================================================
 * Pre-defined fingering positions for guitar, piano, and ukulele.
 * Contains common chord voicings and finger positions.
 */

/**
 * Chord fingering database for multiple instruments
 * Keys are chord names (e.g., 'C', 'Am', 'F#')
 * Values contain fingering data for guitar, piano, and ukulele
 */
export const CHORD_DATABASE: Record<string, {
  guitar: { frets: number[]; fingers?: number[]; startFret?: number };
  piano: { keys: string[] };
  ukulele: { frets: number[]; fingers?: number[]; startFret?: number };
}> = {
  // Natural Notes - Major
  'C': { guitar: { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] }, piano: { keys: ['C', 'E', 'G'] }, ukulele: { frets: [0, 0, 0, 3], fingers: [0, 0, 0, 3] } },
  'D': { guitar: { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] }, piano: { keys: ['D', 'F#', 'A'] }, ukulele: { frets: [2, 2, 2, 0], fingers: [1, 1, 1, 0] } },
  'E': { guitar: { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] }, piano: { keys: ['E', 'G#', 'B'] }, ukulele: { frets: [4, 4, 4, 2], fingers: [3, 3, 3, 1] } },
  'F': { guitar: { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1] }, piano: { keys: ['F', 'A', 'C'] }, ukulele: { frets: [2, 0, 1, 0], fingers: [2, 0, 1, 0] } },
  'G': { guitar: { frets: [3, 2, 0, 0, 0, 3], fingers: [3, 2, 0, 0, 0, 4] }, piano: { keys: ['G', 'B', 'D'] }, ukulele: { frets: [0, 2, 3, 2], fingers: [0, 1, 3, 2] } },
  'A': { guitar: { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] }, piano: { keys: ['A', 'C#', 'E'] }, ukulele: { frets: [2, 1, 0, 0], fingers: [2, 1, 0, 0] } },
  'B': { guitar: { frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1] }, piano: { keys: ['B', 'D#', 'F#'] }, ukulele: { frets: [4, 3, 2, 2], fingers: [4, 3, 1, 2] } },
  
  // Sharp Notes - Major
  'C#': { guitar: { frets: [-1, 4, 6, 6, 6, 4], fingers: [0, 1, 3, 4, 4, 1], startFret: 1 }, piano: { keys: ['C#', 'F', 'G#'] }, ukulele: { frets: [1, 1, 1, 4], fingers: [1, 1, 1, 4] } },
  'D#': { guitar: { frets: [-1, -1, 1, 3, 4, 3], fingers: [0, 0, 1, 2, 4, 3] }, piano: { keys: ['D#', 'G', 'A#'] }, ukulele: { frets: [0, 3, 3, 1], fingers: [0, 3, 4, 1] } },
  'F#': { guitar: { frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1] }, piano: { keys: ['F#', 'A#', 'C#'] }, ukulele: { frets: [3, 1, 2, 1], fingers: [3, 1, 2, 1] } },
  'G#': { guitar: { frets: [4, 6, 6, 5, 4, 4], fingers: [1, 3, 4, 2, 1, 1] }, piano: { keys: ['G#', 'C', 'D#'] }, ukulele: { frets: [5, 3, 4, 3], fingers: [3, 1, 2, 1] } },
  'A#': { guitar: { frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1] }, piano: { keys: ['A#', 'D', 'F'] }, ukulele: { frets: [3, 2, 1, 1], fingers: [3, 2, 1, 1] } },
  
  // Flat Notes - Major
  'Db': { guitar: { frets: [-1, 4, 6, 6, 6, 4], fingers: [0, 1, 3, 4, 4, 1], startFret: 1 }, piano: { keys: ['Db', 'F', 'Ab'] }, ukulele: { frets: [1, 1, 1, 4], fingers: [1, 1, 1, 4] } },
  'Eb': { guitar: { frets: [-1, -1, 1, 3, 4, 3], fingers: [0, 0, 1, 2, 4, 3] }, piano: { keys: ['Eb', 'G', 'Bb'] }, ukulele: { frets: [0, 3, 3, 1], fingers: [0, 3, 4, 1] } },
  'Gb': { guitar: { frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1] }, piano: { keys: ['Gb', 'Bb', 'Db'] }, ukulele: { frets: [3, 1, 2, 1], fingers: [3, 1, 2, 1] } },
  'Ab': { guitar: { frets: [4, 6, 6, 5, 4, 4], fingers: [1, 3, 4, 2, 1, 1] }, piano: { keys: ['Ab', 'C', 'Eb'] }, ukulele: { frets: [5, 3, 4, 3], fingers: [3, 1, 2, 1] } },
  'Bb': { guitar: { frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1] }, piano: { keys: ['Bb', 'D', 'F'] }, ukulele: { frets: [3, 2, 1, 1], fingers: [3, 2, 1, 1] } },
  
  // Minor Chords
  'Am': { guitar: { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] }, piano: { keys: ['A', 'C', 'E'] }, ukulele: { frets: [2, 0, 0, 0], fingers: [1, 0, 0, 0] } },
  'Bm': { guitar: { frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1] }, piano: { keys: ['B', 'D', 'F#'] }, ukulele: { frets: [4, 2, 2, 2], fingers: [4, 1, 1, 1] } },
  'Cm': { guitar: { frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1] }, piano: { keys: ['C', 'Eb', 'G'] }, ukulele: { frets: [0, 3, 3, 3], fingers: [0, 1, 1, 1] } },
  'Dm': { guitar: { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] }, piano: { keys: ['D', 'F', 'A'] }, ukulele: { frets: [2, 2, 1, 0], fingers: [2, 3, 1, 0] } },
  'Em': { guitar: { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] }, piano: { keys: ['E', 'G', 'B'] }, ukulele: { frets: [0, 4, 3, 2], fingers: [0, 4, 3, 2] } },
  'Fm': { guitar: { frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1] }, piano: { keys: ['F', 'Ab', 'C'] }, ukulele: { frets: [1, 0, 1, 3], fingers: [1, 0, 2, 4] } },
  'Gm': { guitar: { frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1] }, piano: { keys: ['G', 'Bb', 'D'] }, ukulele: { frets: [0, 2, 3, 1], fingers: [0, 2, 3, 1] } },
};

export const ROOT_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

