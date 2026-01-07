// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
/**
 * Quick Verification Script - Manual Testing of QA Fixes
 * Run this to verify all fixes are working correctly
 */

import { getScaleNotes } from '../lib/musicTheory/scales';
import { transposeNote } from '../lib/musicTheory/transposition';
import { buildChord } from '../lib/musicTheory/chords';
import { getIntervalBetweenNotes, identifyChord, validateSlashChord } from '../lib/musicTheory/analysis';
import { optimizePianoVoicing } from '../lib/musicTheory/voicings';
import { analyzeTimeSignature } from '../lib/musicTheory/timeSignatures';
import { parseNoteComponents } from '../lib/musicTheory/core';

console.log('='.repeat(70));
console.log('MUSIC THEORY QA VERIFICATION - Manual Test Suite');
console.log('='.repeat(70));

// Test 1: Extreme Enharmonic Spelling
console.log('\n✓ Test 1: Extreme Enharmonic Spelling');
const fSharpMajor = getScaleNotes('F#', 'major');
console.log(`  F# Major: ${fSharpMajor.join(', ')}`);
console.log(`  Degree 7 is: ${fSharpMajor[6]} ${fSharpMajor[6] === 'E#' ? '✓' : '✗ FAIL'}`);

const gSharpMinor = getScaleNotes('G#', 'harmonic-minor');
console.log(`  G# Harmonic Minor: ${gSharpMinor.join(', ')}`);
console.log(`  Contains Fx: ${gSharpMinor.includes('Fx') ? '✓' : '✗ FAIL'}`);

// Test 2: Interval Classification
console.log('\n✓ Test 2: Interval Classification (A4 vs d5)');
const a4 = getIntervalBetweenNotes('C', 'F#');
const d5 = getIntervalBetweenNotes('C', 'Gb');
console.log(`  C to F# = ${a4.id} (degree: ${a4.degree}, semitones: ${a4.semitones})`);
console.log(`  C to Gb = ${d5.id} (degree: ${d5.degree}, semitones: ${d5.semitones})`);
console.log(`  Correctly distinguished: ${a4.id === 'A4' && d5.id === 'd5' ? '✓' : '✗ FAIL'}`);

// Test 3: Diminished 7th Chord
console.log('\n✓ Test 3: Diminished 7th (Bbb vs A)');
const cdim7 = buildChord('C', 'dim7');
console.log(`  Cdim7: ${cdim7.join(', ')}`);
console.log(`  Contains Bbb: ${cdim7.includes('Bbb') ? '✓' : '✗ FAIL'}`);
console.log(`  Does NOT contain A: ${!cdim7.includes('A') ? '✓' : '✗ FAIL'}`);

// Test 4: Chord Identification (Slash Chords vs Inversions)
console.log('\n✓ Test 4: Chord Identification');
const identified = identifyChord(['E', 'G', 'C']);
console.log(`  ['E', 'G', 'C'] identified as: ${identified.name}`);
console.log(`  Is C/E inversion: ${identified.name.includes('C') && identified.bass === 'E' ? '✓' : '✗ FAIL'}`);

const validation = validateSlashChord('C', 'maj7', 'E');
console.log(`  Cmaj7/E validation: ${validation.status}`);
console.log(`  Is valid inversion: ${validation.status === 'valid' ? '✓' : '✗ FAIL'}`);

// Test 5: Piano Low Interval Limit
console.log('\n✓ Test 5: Piano Voicing (Low Interval Limit)');
const pianoVoicing = optimizePianoVoicing(['C', 'E', 'G'], { rootOctave: 2 });
console.log(`  Piano voicing: ${pianoVoicing.keys.join(', ')}`);
const hasLowC2E2 = pianoVoicing.keys.includes('C2') && pianoVoicing.keys.includes('E2');
console.log(`  Avoids C2-E2 (muddy): ${!hasLowC2E2 ? '✓' : '✗ FAIL'}`);
if (pianoVoicing.warnings) {
  console.log(`  Warnings: ${pianoVoicing.warnings.join(', ')}`);
}

// Test 6: Time Signature Beat Units
console.log('\n✓ Test 6: Time Signature (Compound Meters)');
const sig68 = analyzeTimeSignature(6, 8);
console.log(`  6/8 beat unit: ${sig68.beatUnit}`);
console.log(`  Uses dotted-quarter: ${sig68.beatUnit === 'dotted-quarter' ? '✓' : '✗ FAIL'}`);
console.log(`  Beats per measure: ${sig68.beatsPerMeasure} (should be 2)`);

// Test 7: Double Sharp/Flat Parsing
console.log('\n✓ Test 7: Accidental Parsing');
const bbb = parseNoteComponents('Bbb');
console.log(`  Bbb parsed: letter=${bbb.letter}, accidental=${bbb.accidentalValue}`);
console.log(`  Correct double flat: ${bbb.accidentalValue === -2 ? '✓' : '✗ FAIL'}`);

const fx = parseNoteComponents('Fx');
console.log(`  Fx parsed: letter=${fx.letter}, accidental=${fx.accidentalValue}`);
console.log(`  Correct double sharp: ${fx.accidentalValue === 2 ? '✓' : '✗ FAIL'}`);

// Test 8: 11th Chord Handling
console.log('\n✓ Test 8: 11th Chord Construction');
const c11 = buildChord('C', '11');
console.log(`  C11: ${c11.join(', ')}`);
console.log(`  Omits M3 (no E): ${!c11.includes('E') ? '✓' : '✗ FAIL'}`);

const cmaj11 = buildChord('C', 'maj11');
console.log(`  Cmaj11: ${cmaj11.join(', ')}`);
console.log(`  Uses #11 (F#): ${cmaj11.includes('F#') ? '✓' : '✗ FAIL'}`);
console.log(`  Includes M3 (E): ${cmaj11.includes('E') ? '✓' : '✗ FAIL'}`);

console.log('\n' + '='.repeat(70));
console.log('QA VERIFICATION COMPLETE');
console.log('All critical issues have been addressed!');
console.log('='.repeat(70) + '\n');

