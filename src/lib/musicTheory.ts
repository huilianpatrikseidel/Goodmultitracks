/**
 * ============================================================================
 * MUSIC THEORY LIBRARY - Main Entry Point
 * ============================================================================
 * A comprehensive music theory library with modular architecture.
 * 
 * This is the main entry point that re-exports all modules for compatibility.
 * For better tree-shaking, consider importing directly from submodules:
 * 
 * @example
 * // Instead of:
 * import { transposeNote, buildChord } from './lib/musicTheory';
 * 
 * // You can use:
 * import { transposeNote } from './lib/musicTheory/transposition';
 * import { buildChord } from './lib/musicTheory/chords';
 * 
 * Architecture:
 * - musicTheory/core: Fundamental types and interval definitions
 * - musicTheory/transposition: Note transposition with enharmonic accuracy
 * - musicTheory/chords: Chord construction and parsing
 * - musicTheory/scales: Scale generation and key analysis
 * - musicTheory/database: Pre-defined chord fingerings
 * - musicTheory/timeSignatures: Rhythm and meter analysis
 * - musicTheory/voicings: Instrument-specific chord voicings
 */

// Re-export everything from the modular library
export * from './musicTheory/index';
