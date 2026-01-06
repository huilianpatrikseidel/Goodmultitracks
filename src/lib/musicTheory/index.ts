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
  type TimeSignatureType,
  type TimeSignatureInfo,
  type NoteValue,
} from './timeSignatures';

// Voicing exports
export {
  getChordVoicing,
  generateGuitarVoicing,
  generateUkuleleVoicing,
  optimizePianoVoicing,
  GUITAR_TUNINGS,
} from './voicings';

// Analysis exports
export {
  getRomanNumeral,
  getInterval,
  isChordDiatonic,
  getEnharmonicEquivalent,
} from './analysis';

// Rhythm exports
export {
  getMetronomeBeatPositions,
  getAccentLevel,
  getSubdivisionsPerBeat,
} from './rhythm';
