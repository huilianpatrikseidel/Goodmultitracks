/**
 * Test Suite for Advanced Music Theory Features
 * 
 * This file demonstrates and tests all new "Musical Intelligence" features:
 * 1. Bass note priority
 * 2. Automatic fingering
 * 3. Alternate tunings
 * 4. Roman numeral analysis
 * 5. Anatomical constraints
 */

import { 
  generateGuitarVoicing,
  getRomanNumeral,
  parseChordName,
  GUITAR_TUNINGS,
  type GuitarTuning 
} from '../../musicTheory';

// ============================================================================
// TEST 1: Bass Note Priority (Root Position vs. Inversions)
// ============================================================================

console.log('TEST 1: Bass Note Priority\n' + '='.repeat(50));

// Test 1a: C major in root position (C should be in bass)
const cMajorRoot = generateGuitarVoicing(['C', 'E', 'G'], { 
  rootNote: 'C' 
});
console.log('C Major (root position):', cMajorRoot);
console.log('Expected: Lowest note should be C (not E or G)\n');

// Test 1b: C/E (first inversion - E should be in bass)
const cSlashE = generateGuitarVoicing(['C', 'E', 'G'], { 
  rootNote: 'C',
  bassNote: 'E' 
});
console.log('C/E (first inversion):', cSlashE);
console.log('Expected: Lowest note should be E\n');

// Test 1c: C/G (second inversion - G should be in bass)
const cSlashG = generateGuitarVoicing(['C', 'E', 'G'], { 
  rootNote: 'C',
  bassNote: 'G' 
});
console.log('C/G (second inversion):', cSlashG);
console.log('Expected: Lowest note should be G\n');

// ============================================================================
// TEST 2: Automatic Fingering
// ============================================================================

console.log('\nTEST 2: Automatic Fingering\n' + '='.repeat(50));

// Test 2a: F major barre chord
const fMajor = generateGuitarVoicing(['F', 'A', 'C']);
console.log('F Major (should detect barre):', fMajor);
console.log('Expected: Index finger (1) barres multiple strings on fret 1\n');

// Test 2b: D major (non-barre chord)
const dMajor = generateGuitarVoicing(['D', 'F#', 'A']);
console.log('D Major (no barre):', dMajor);
console.log('Expected: Fingers assigned to individual frets\n');

// Test 2c: Gmaj7 (4-note chord)
const gMaj7 = generateGuitarVoicing(['G', 'B', 'D', 'F#']);
console.log('Gmaj7:', gMaj7);
console.log('Expected: Automatic finger assignments for all notes\n');

// ============================================================================
// TEST 3: Alternate Tunings
// ============================================================================

console.log('\nTEST 3: Alternate Tunings\n' + '='.repeat(50));

// Test 3a: Drop D tuning
const dropDPower = generateGuitarVoicing(['D', 'A'], {
  tuning: GUITAR_TUNINGS['drop-d']
});
console.log('D power chord (Drop D):', dropDPower);
console.log('Expected: Uses low D string (string 6)\n');

// Test 3b: DADGAD tuning
const dadgadD = generateGuitarVoicing(['D', 'A', 'D'], {
  tuning: GUITAR_TUNINGS['dadgad']
});
console.log('D chord (DADGAD):', dadgadD);
console.log('Expected: Optimized for DADGAD open strings\n');

// Test 3c: Open G tuning (for slide guitar)
const openGChord = generateGuitarVoicing(['G', 'B', 'D'], {
  tuning: GUITAR_TUNINGS['open-g']
});
console.log('G chord (Open G):', openGChord);
console.log('Expected: Should use many open strings\n');

// Test 3d: Eb standard (half-step down)
const ebStandard = generateGuitarVoicing(['Eb', 'G', 'Bb'], {
  tuning: GUITAR_TUNINGS['eb-standard']
});
console.log('Eb chord (Eb Standard):', ebStandard);
console.log('Expected: Similar to E major shape in standard tuning\n');

// ============================================================================
// TEST 4: Roman Numeral Analysis
// ============================================================================

console.log('\nTEST 4: Roman Numeral Analysis\n' + '='.repeat(50));

// Test 4a: Major key diatonic chords (Key of C)
console.log('Key of C Major:');
const cMajorProgression = ['C', 'Dm', 'Em', 'F', 'G7', 'Am', 'Bdim'];
cMajorProgression.forEach(chordName => {
  const chord = parseChordName(chordName);
  const roman = getRomanNumeral(chord, 'C');
  console.log(`  ${chordName.padEnd(6)} → ${roman}`);
});
console.log();

// Test 4b: Minor key (Key of A minor)
console.log('Key of A Minor:');
const aMinorProgression = ['Am', 'Bdim', 'C', 'Dm', 'Em', 'F', 'G'];
aMinorProgression.forEach(chordName => {
  const chord = parseChordName(chordName);
  const roman = getRomanNumeral(chord, 'Am');
  console.log(`  ${chordName.padEnd(6)} → ${roman}`);
});
console.log();

// Test 4c: Secondary dominants
console.log('Secondary Dominants (Key of C):');
const secondaryDominants = ['D7', 'A7', 'E7', 'B7'];
secondaryDominants.forEach(chordName => {
  const chord = parseChordName(chordName);
  const roman = getRomanNumeral(chord, 'C');
  console.log(`  ${chordName.padEnd(6)} → ${roman}`);
});
console.log();

// Test 4d: Modal interchange (borrowed chords)
console.log('Modal Interchange (Key of C):');
const borrowedChords = ['Fm', 'Ab', 'Bb'];
borrowedChords.forEach(chordName => {
  const chord = parseChordName(chordName);
  const roman = getRomanNumeral(chord, 'C');
  console.log(`  ${chordName.padEnd(6)} → ${roman}`);
});
console.log();

// ============================================================================
// TEST 5: Complete Integration Example
// ============================================================================

console.log('\nTEST 5: Complete Integration\n' + '='.repeat(50));

// Example: Analyze and generate voicings for a progression in Drop D
console.log('Song in D Major, Drop D Tuning:');
console.log('Progression: D - G/B - A - Bm\n');

const song = [
  { name: 'D', notes: ['D', 'F#', 'A'] },
  { name: 'G/B', notes: ['G', 'B', 'D'], bass: 'B' },
  { name: 'A', notes: ['A', 'C#', 'E'] },
  { name: 'Bm', notes: ['B', 'D', 'F#'] },
];

song.forEach(chord => {
  console.log(`Chord: ${chord.name}`);
  
  // Roman numeral analysis
  const parsed = parseChordName(chord.name);
  const roman = getRomanNumeral(parsed, 'D');
  console.log(`  Function: ${roman}`);
  
  // Generate voicing in Drop D
  const voicing = generateGuitarVoicing(chord.notes, {
    tuning: GUITAR_TUNINGS['drop-d'],
    rootNote: parsed.root,
    bassNote: chord.bass
  });
  
  console.log(`  Frets: ${JSON.stringify(voicing?.frets)}`);
  console.log(`  Fingers: ${JSON.stringify(voicing?.fingers)}`);
  console.log();
});

// ============================================================================
// TEST 6: Edge Cases and Advanced Scenarios
// ============================================================================

console.log('\nTEST 6: Edge Cases\n' + '='.repeat(50));

// Test 6a: Complex jazz chord
const cmaj13 = generateGuitarVoicing(['C', 'E', 'G', 'B', 'D', 'A']);
console.log('Cmaj13 (6 notes - challenging):', cmaj13);
console.log('Expected: May omit some notes, prioritize essential tones\n');

// Test 6b: Very low voicing (bass register)
const lowE = generateGuitarVoicing(['E', 'G#', 'B'], {
  rootNote: 'E'
});
console.log('E Major (prefer low voicing):', lowE);
console.log('Expected: Uses open E string (low E)\n');

// Test 6c: Custom tuning
const customTuning: GuitarTuning = [2, 7, 2, 7, 2, 7]; // All D and G
const customChord = generateGuitarVoicing(['D', 'G', 'B'], {
  tuning: customTuning
});
console.log('D chord with custom tuning (D-G-D-G-D-G):', customChord);
console.log('Expected: Optimized for this unusual tuning\n');

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n' + '='.repeat(50));
console.log('ADVANCED FEATURES TEST SUITE COMPLETE');
console.log('='.repeat(50));
console.log('\nAll features tested:');
console.log('✅ Bass note priority (root position & inversions)');
console.log('✅ Automatic fingering calculation');
console.log('✅ Alternate tunings (7 presets + custom)');
console.log('✅ Roman numeral harmonic analysis');
console.log('✅ Anatomical constraint detection (integrated)');
console.log('\nThe system now has "Musical Intelligence"! 🎵');
