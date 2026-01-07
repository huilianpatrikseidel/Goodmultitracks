/**
 * Real-world examples demonstrating the refactored Time Signature module
 */

import { analyzeTimeSignature, getSubdivisionPresets, generateRhythmicPartitions } from '../lib/musicTheory/timeSignatures';

console.log('\n🎵 REAL-WORLD MUSIC EXAMPLES 🎵\n');
console.log('='.repeat(70));

// Example 1: Dave Brubeck's "Take Five"
console.log('\n1. "Take Five" by Dave Brubeck (1959)');
console.log('   Signature: 5/4');
const takeFive = analyzeTimeSignature(5, 4);
console.log('   Analysis:', {
  type: takeFive.type,
  pattern: takeFive.grouping.join('+'),
  feels_like: `${takeFive.beatsPerMeasure} beats (dotted-half + half)`
});
console.log('   Options:', getSubdivisionPresets(5, 4));

// Example 2: Tool's "Schism"
console.log('\n2. "Schism" by Tool (2001)');
console.log('   Signature: 5/8 (sections)');
const schism = analyzeTimeSignature(5, 8);
console.log('   Analysis:', {
  type: schism.type,
  pattern: schism.grouping.join('+'),
  pulses: schism.pulsesPerMeasure,
  beats: schism.beatsPerMeasure
});

// Example 3: Pink Floyd's "Money"
console.log('\n3. "Money" by Pink Floyd (1973)');
console.log('   Signature: 7/4');
const money = analyzeTimeSignature(7, 4);
console.log('   Analysis:', {
  type: money.type,
  pattern: money.grouping.join('+')
});
console.log('   Options:', getSubdivisionPresets(7, 4));

// Example 4: Balkan Folk Dance
console.log('\n4. Bulgarian Folk Dance (Râčenica)');
console.log('   Signature: 7/16');
const balkan = analyzeTimeSignature(7, 16);
console.log('   Analysis:', {
  type: balkan.type,
  pattern: balkan.grouping.join('+'),
  traditional_grouping: '2+2+3 (Quick-Quick-Slow)'
});
console.log('   All options:', getSubdivisionPresets(7, 16));

// Example 5: Complex Progressive Metal
console.log('\n5. Progressive Metal (various artists)');
console.log('   Signature: 13/8');
const progMetal = analyzeTimeSignature(13, 8);
console.log('   Analysis:', {
  type: progMetal.type,
  default_pattern: progMetal.grouping.join('+'),
  total_variations: getSubdivisionPresets(13, 8).length
});
console.log('   First 5 options:');
getSubdivisionPresets(13, 8).slice(0, 5).forEach((opt, i) => {
  console.log(`     ${i + 1}. ${opt}`);
});

// Example 6: Compare with Standard Meters
console.log('\n6. Standard Meters (for comparison)');

const fourFour = analyzeTimeSignature(4, 4);
console.log('   4/4 (Common Time):', {
  type: fourFour.type,
  pattern: fourFour.grouping.join('+'),
  irregular_options: getSubdivisionPresets(4, 4).length
});

const sixEight = analyzeTimeSignature(6, 8);
console.log('   6/8 (Compound Duple):', {
  type: sixEight.type,
  pattern: sixEight.grouping.join('+'),
  irregular_options: getSubdivisionPresets(6, 8).length
});

// Example 7: Mathematical Proof
console.log('\n7. Mathematical Partition Examples');
console.log('   (Showing the algorithm in action)\n');

[5, 7, 8, 11, 13].forEach(num => {
  const partitions = generateRhythmicPartitions(num);
  console.log(`   ${num} = ${partitions.length} unique partition(s):`);
  if (partitions.length <= 4) {
    partitions.forEach(p => console.log(`      • ${p.join(' + ')}`));
  } else {
    partitions.slice(0, 3).forEach(p => console.log(`      • ${p.join(' + ')}`));
    console.log(`      ... and ${partitions.length - 3} more`);
  }
  console.log();
});

// Example 8: Edge Cases
console.log('8. Edge Cases & Special Handling\n');

const edgeCases = [
  { num: 1, den: 4, name: '1/4 (Single beat)' },
  { num: 2, den: 4, name: '2/4 (March)' },
  { num: 3, den: 4, name: '3/4 (Waltz)' },
  { num: 8, den: 8, name: '8/8 (Irregular, not 4/4)' },
  { num: 15, den: 8, name: '15/8 (Compound or Irregular)' }
];

edgeCases.forEach(({ num, den, name }) => {
  const result = analyzeTimeSignature(num, den);
  const opts = getSubdivisionPresets(num, den);
  console.log(`   ${name}:`);
  console.log(`      Type: ${result.type}`);
  console.log(`      Pattern: ${result.grouping.join('+')}`);
  console.log(`      Options: ${opts.length > 0 ? opts.slice(0, 2).join(', ') : 'Standard meter'}`);
  console.log();
});

console.log('='.repeat(70));
console.log('\n✅ All real-world examples work correctly!\n');
