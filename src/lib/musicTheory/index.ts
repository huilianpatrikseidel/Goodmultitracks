// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
/**
 * ============================================================================
 * MUSIC THEORY LIBRARY - Main Entry Point
 * ============================================================================
 * A comprehensive music theory library with modular architecture.
 * 
 * Architecture:
 * - core: Fundamental types and interval definitions
 * - transposition: Note transposition with enharmonic accuracy
 * - chords: Chord construction and parsing
 * - scales: Scale generation and key analysis
 * - database: Pre-defined chord fingerings
 * - timeSignatures: Rhythm and meter analysis
 * - voicings: Instrument-specific chord voicings
 */

// Core exports - Intervals & Note Representation
export {
  NOTE_LETTERS,
  NOTE_TO_INDEX,
  NATURAL_NOTE_SEMITONES,
  INTERVAL_DEFINITIONS,
  parseNoteComponents,
  getAccidentalString,
  calculateInterval,
  noteToSemitone,
  areNotesEnharmonic,
  type IntervalObject,
} from './core';

// Transposition exports
export {
  transposeNote,
  transposeKey,
} from './transposition';

// Chord exports
export {
  CHORD_INTERVALS,
  buildChord,
  buildChordArray,
  buildChordWithBass,
  buildVoicedChord,
  parseChordName,
  generateChordName,
  ACCIDENTALS,
  QUALITIES,
  EXTENSIONS,
  type ParsedChord,
  type ChordResult,
} from './chords';

// Scale exports
export {
  SCALE_PATTERNS,
  getScaleNotes,
  isChordInKey,
  getKeySignature,
} from './scales';

// Database exports
export {
  CHORD_DATABASE,
  ROOT_NOTES,
} from './database';

// Time Signature exports
export {
  TIME_SIG_DENOMINATORS,
  TIME_SIG_PRESETS,
  getNoteValueFromDenominator,
  analyzeTimeSignature,
  getSubdivisionPresets,
  generateRhythmicPartitions,
  type TimeSignatureType,
  type TimeSignatureInfo,
  type NoteValue,
  type TempoInterpretation,
  type GroupingStrategy,
} from './timeSignatures';

// Voicing exports
export {
  getChordVoicing,
  generateGuitarVoicing,
  generateUkuleleVoicing,
  generateBassVoicing,
  generateBanjoVoicing,
  generateMandolinVoicing,
  optimizePianoVoicing,
  generatePianoVoicing10th,
  generatePianoVoicingRootless,
  GUITAR_TUNINGS,
  BASS_TUNINGS,
  BANJO_TUNINGS,
  MANDOLIN_TUNINGS,
  type HandSize,
} from './voicings';

// Analysis exports
export {
  getRomanNumeral,
  getInterval,
  getIntervalBetweenNotes,
  isChordDiatonic,
  getEnharmonicEquivalent,
  identifyChord,
  validateSlashChord,
  // Phase 3.2 - Advanced Analysis
  analyzeChordFunction,
  isBorrowedChord,
  analyzeSecondaryDominant,
  getSecondaryDominant,
  type ChordFunction,
  type ChordFunctionAnalysis,
  type BorrowedChordInfo,
  type SecondaryDominantInfo,
  type ChordIdentification,
} from './analysis';

// Rhythm exports
export {
  getMetronomeBeatPositions,
  getMetronomeClickStructure,
  getAccentLevel,
  getSubdivisionsPerBeat,
  type MetronomeClickStructure,
} from './rhythm';

// Time Conversion Helpers (Advanced)
export {
  measureToSecondsAdvanced,
  secondsToMeasureAdvanced,
  calculateSecondsPerMeasure,
  calculateSecondsPerBeat,
  calculateSecondsPerPulse,
  calculateBeatTime,
  calculatePulseTime,
  getPositionFromTime,
  formatPosition,
} from './helpers/timeConversion';

