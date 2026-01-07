/**
 * ============================================================================
 * TIME SIGNATURES MODULE - Rhythm & Meter Analysis
 * ============================================================================
 * Handles time signature classification, beat analysis, and subdivision.
 */

export type TimeSignatureType = 'simple' | 'compound' | 'irregular';

export interface TimeSignatureInfo {
  numerator: number;
  denominator: number;
  type: TimeSignatureType;
  beatUnit: NoteValue;
  beatsPerMeasure: number;
  pulsesPerMeasure: number; // Total pulses (e.g., 5 in 5/8)
  grouping: number[]; // How pulses group into beats (e.g., [3, 2])
  beatRatio?: number; // For tuplet meters: 4/6 = 2/3 (2 triplet quarters = 2/3 of standard measure)
  measureDurationInQuarters: number; // Total measure duration in quarter note units
}

export type NoteValue = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth' | '32nd' | 
                        'dotted-half' | 'dotted-quarter' | 'dotted-eighth';

/**
 * Time signature denominator options
 * Includes common dyadic denominators plus irrational/tuplet-based denominators
 */
export const TIME_SIG_DENOMINATORS = [
  { value: '1', label: '1 (Whole Note)' },
  { value: '2', label: '2 (Half Note)' },
  { value: '3', label: '3 (Triplet Half Note)' },
  { value: '4', label: '4 (Quarter Note)' },
  { value: '6', label: '6 (Triplet Quarter Note)' },
  { value: '8', label: '8 (Eighth Note)' },
  { value: '12', label: '12 (Triplet Eighth Note)' },
  { value: '16', label: '16 (Sixteenth Note)' },
  { value: '32', label: '32 (32nd Note)' },
];

/**
 * Common time signature presets
 */
export const TIME_SIG_PRESETS = [
  { numerator: '4', denominator: '4', label: '4/4 (Common Time)' },
  { numerator: '3', denominator: '4', label: '3/4 (Waltz)' },
  { numerator: '6', denominator: '8', label: '6/8' },
  { numerator: '2', denominator: '4', label: '2/4' },
  { numerator: '5', denominator: '4', label: '5/4' },
  { numerator: '7', denominator: '8', label: '7/8' },
  { numerator: '9', denominator: '8', label: '9/8' },
  { numerator: '12', denominator: '8', label: '12/8' },
];

/**
 * Check if a number is a power of 2 (dyadic denominator)
 */
const isPowerOfTwo = (n: number): boolean => n > 0 && (n & (n - 1)) === 0;

/**
 * Convert denominator to note value
 * Supports both dyadic (1, 2, 4, 8, 16, 32) and irrational denominators (3, 6, 12)
 */
export const getNoteValueFromDenominator = (denominator: number): NoteValue => {
  // Dyadic denominators (standard)
  switch (denominator) {
    case 1: return 'whole';
    case 2: return 'half';
    case 4: return 'quarter';
    case 8: return 'eighth';
    case 16: return 'sixteenth';
    case 32: return '32nd';
  }
  
  // Irrational/Tuplet-based denominators
  if (denominator === 3 || denominator === 6) return 'quarter'; // Triplet-based
  if (denominator === 12) return 'eighth'; // Triplet eighth
  
  // Fallback: find closest dyadic denominator
  if (denominator < 2) return 'whole';
  if (denominator < 4) return 'half';
  if (denominator < 8) return 'quarter';
  if (denominator < 16) return 'eighth';
  if (denominator < 32) return 'sixteenth';
  return '32nd';
};

export type TempoInterpretation = 'default' | 'fast' | 'slow' | 'very-slow';

/**
 * Grouping strategy for ambiguous meters (e.g., 6/4)
 * - 'auto': Automatic detection based on tempo and divisibility rules
 * - 'simple': Force simple meter interpretation (6/4 = 6 beats)
 * - 'compound': Force compound meter interpretation (6/4 = 2 beats of dotted-halves)
 */
export type GroupingStrategy = 'auto' | 'simple' | 'compound';

/**
 * Parse additive numerator string (e.g., "3+2+2") into grouping array
 */
const parseAdditiveNumerator = (numeratorStr: string): { total: number; grouping: number[] } | null => {
  if (!numeratorStr.includes('+')) return null;
  
  const grouping = numeratorStr.split('+').map(s => parseInt(s.trim(), 10));
  if (grouping.some(n => isNaN(n) || n <= 0)) return null;
  
  const total = grouping.reduce((sum, n) => sum + n, 0);
  return { total, grouping };
};

/**
 * Analyze time signature and determine type, beat unit, and grouping
 * 
 * Classification Rules:
 * - Simple: Each beat divides into 2 (2/4, 3/4, 4/4)
 * - Compound: Each beat divides into 3, using dotted notes (6/8, 9/8, 12/8)
 * - Irregular: Asymmetric grouping (5/4, 7/8)
 * 
 * Special cases:
 * - 3/4, 3/8: Simple meters (3 beats), NOT compound
 * - 6/8, 9/8, 12/8: Compound meters (2, 3, 4 beats respectively)
 * - 15/8, 15/16: Can be compound (5 beats) or irregular depending on context
 * - Tempo affects interpretation: slow 6/8 can be conducted in 6, fast 3/4 as 1
 * 
 * @param numerator - Numeric value OR additive string (e.g., "3+2+2" for 7/8)
 * @param denominator - Beat unit denominator (supports irrational like 6, 12)
 * @param subdivision - Optional explicit subdivision override
 * @param tempo - Tempo interpretation affecting compound/simple classification
 * @param groupingStrategy - Force simple vs compound for ambiguous meters (6/4, 9/4)
 */
export const analyzeTimeSignature = (
  numerator: number | string,
  denominator: number,
  subdivision?: string,
  tempo: TempoInterpretation = 'default',
  groupingStrategy: GroupingStrategy = 'auto'
): TimeSignatureInfo => {
  let type: TimeSignatureType = 'simple';
  let beatUnit: NoteValue;
  let beatsPerMeasure: number;
  let numeratorValue: number;
  let pulsesPerMeasure: number;
  let grouping: number[] = [];

  // Handle additive numerator strings (e.g., "3+2+2" for 7/8)
  if (typeof numerator === 'string') {
    const parsed = parseAdditiveNumerator(numerator);
    if (parsed) {
      numeratorValue = parsed.total;
      pulsesPerMeasure = parsed.total;
      type = 'irregular';
      grouping = parsed.grouping;
      beatsPerMeasure = parsed.grouping.length;
      beatUnit = getNoteValueFromDenominator(denominator);
      
      const beatRatio = denominator === 6 ? 2/3 : denominator === 12 ? 1/3 : 1;
      const measureDurationInQuarters = (numeratorValue / denominator) * 4 * beatRatio;
      
      return {
        numerator: numeratorValue,
        denominator,
        type,
        beatUnit,
        beatsPerMeasure,
        pulsesPerMeasure,
        grouping,
        beatRatio: beatRatio !== 1 ? beatRatio : undefined,
        measureDurationInQuarters
      };
    } else {
      // Invalid format, parse as number
      numeratorValue = parseInt(numerator, 10);
      if (isNaN(numeratorValue)) numeratorValue = 4; // Fallback
    }
  } else {
    numeratorValue = numerator;
  }
  
  pulsesPerMeasure = numeratorValue;

  if (subdivision) {
    // User-provided subdivision string (e.g., \"3+2\" for 5/8)
    type = 'irregular';
    grouping = subdivision.split('+').map(Number);
    beatsPerMeasure = grouping.length;
    beatUnit = getNoteValueFromDenominator(denominator);
  } else if (numeratorValue % 3 === 0 && numeratorValue >= 6 && numeratorValue <= 15 && numeratorValue !== 3) {
    // Compound meter: numerator divisible by 3, creates dotted beat units
    // Excludes 3/4 and 3/8 (which are simple, not compound)
    // Works for 6/8, 9/8, 12/8, 15/8, 6/4, 9/4, 12/16, etc.
    
    // GROUPING STRATEGY OVERRIDE
    if (groupingStrategy === 'simple') {
      // Force simple meter (6/4 = 6 beats, not 2 dotted-halves)
      type = 'simple';
      beatsPerMeasure = numeratorValue;
      beatUnit = getNoteValueFromDenominator(denominator);
      grouping = Array(beatsPerMeasure).fill(1);
    } else if (groupingStrategy === 'compound') {
      // Force compound meter (always treat as dotted beats)
      type = 'compound';
      beatsPerMeasure = numeratorValue / 3;
      
      if (denominator === 8) beatUnit = 'dotted-quarter';
      else if (denominator === 4) beatUnit = 'dotted-half';
      else if (denominator === 16) beatUnit = 'dotted-eighth';
      else beatUnit = getNoteValueFromDenominator(denominator);
      
      grouping = Array(beatsPerMeasure).fill(3);
    } else {
      // AUTO: TEMPO-AWARE logic (existing behavior)
      // QA AUDIT CONFIRMED: Compound meters use dotted beat units
      // 6/8 = dotted-quarter (2 beats), NOT quarter note (which would create 3:2 polyrhythm)
      // This ensures metronome clicks align with the natural pulse
      if (tempo === 'very-slow' && numeratorValue === 6) {
        type = 'simple';
        beatsPerMeasure = numeratorValue;
        beatUnit = getNoteValueFromDenominator(denominator);
        grouping = Array(beatsPerMeasure).fill(1);
      } else {
        type = 'compound';
        beatsPerMeasure = numeratorValue / 3;
        
        if (denominator === 8) beatUnit = 'dotted-quarter';
        else if (denominator === 4) beatUnit = 'dotted-half';
        else if (denominator === 16) beatUnit = 'dotted-eighth';
        else beatUnit = getNoteValueFromDenominator(denominator);
        
        grouping = Array(beatsPerMeasure).fill(3);
      }
    }
  } else {
    // SMART DEFAULT LOGIC: Check if this should be irregular
    const presets = getSubdivisionPresets(numeratorValue, denominator);
    
    // TEMPO-AWARE: Fast 3/4 can be conducted in 1 (like compound)
    if (tempo === 'fast' && numeratorValue === 3) {
      type = 'simple';
      beatsPerMeasure = 1;
      beatUnit = getNoteValueFromDenominator(denominator);
      grouping = [3];
    } else if (presets.length > 0) {
      // This is an irregular meter (5, 7, 8, 10, 11, 13, etc.)
      // Use the FIRST (most common) grouping as the default
      type = 'irregular';
      grouping = presets[0].split('+').map(Number);
      beatsPerMeasure = grouping.length;
      beatUnit = getNoteValueFromDenominator(denominator);
    } else {
      // Simple meter: standard beat divisions (2/4, 3/4, 4/4, 1/4)
      type = 'simple';
      beatsPerMeasure = numeratorValue;
      beatUnit = getNoteValueFromDenominator(denominator);
      grouping = Array(beatsPerMeasure).fill(1);
    }
  }

  // Calculate beatRatio for tuplet-based meters
  // Irrational meters (4/6, 3/12) require tempo scaling for sequencer compatibility
  let beatRatio: number | undefined;
  if (denominator === 6) {
    // Triplet quarters: each "quarter" in 4/6 = (2/3) of a standard quarter
    beatRatio = 2/3;
  } else if (denominator === 12) {
    // Triplet eighths: each "eighth" in 3/12 = (2/3) of a standard eighth
    beatRatio = 2/3;
  } else if (denominator === 3) {
    // Triplet halves: each "half" in 2/3 = (2/3) of a standard half
    beatRatio = 2/3;
  }
  
  // Calculate measure duration in quarter notes
  // Formula: (numerator / denominator) * 4 * beatRatio
  // Examples: 
  //   4/4 = 4 quarters (beatRatio=1)
  //   6/8 = 3 quarters (beatRatio=1)
  //   4/6 = (4/6) * 4 * (2/3) = 1.778 quarters (NOT 2.667!)
  const measureDurationInQuarters = (numeratorValue / denominator) * 4 * (beatRatio || 1);

  return {
    numerator: numeratorValue,
    denominator,
    type,
    beatUnit,
    beatsPerMeasure,
    pulsesPerMeasure,
    grouping,
    beatRatio,
    measureDurationInQuarters
  };
};

/**
 * Generate all unique rhythmic partitions of a number using binary (2) and ternary (3) groupings.
 * This is the core algorithm for irregular meter analysis.
 * 
 * @param target - The numerator to partition (e.g., 5, 7, 13)
 * @returns Array of all valid partitions as number arrays
 * 
 * Examples:
 * - generateRhythmicPartitions(5) => [[3, 2], [2, 3]]
 * - generateRhythmicPartitions(7) => [[3, 2, 2], [2, 3, 2], [2, 2, 3]]
 * - generateRhythmicPartitions(13) => [[3, 3, 3, 2, 2], [3, 3, 2, 3, 2], ...]
 */
export const generateRhythmicPartitions = (target: number): number[][] => {
  const results: number[][] = [];
  const seen = new Set<string>();

  function findCombinations(currentSum: number, currentPath: number[]) {
    if (currentSum === target) {
      const key = currentPath.join(',');
      if (!seen.has(key)) {
        seen.add(key);
        results.push([...currentPath]);
      }
      return;
    }
    if (currentSum > target) return;

    // Try adding a 3 (Ternary pulse) - standard dotted-eighth group
    findCombinations(currentSum + 3, [...currentPath, 3]);
    // Try adding a 2 (Binary pulse) - standard eighth group
    findCombinations(currentSum + 2, [...currentPath, 2]);
  }

  findCombinations(0, []);
  return results;
};

/**
 * Get subdivision preset options for irregular meters.
 * Now works for ANY numerator and denominator combination.
 * 
 * Removes the hardcoded denominator === 8 restriction.
 * Uses the algorithmic partition generator instead of switch statements.
 */
export const getSubdivisionPresets = (numerator: number, denominator: number): string[] => {
  // Determine if this numerator should be treated as irregular
  // Skip simple (2, 3, 4) and standard compound (6, 9, 12) meters
  const isStandardSimple = numerator <= 4;
  const isStandardCompound = numerator % 3 === 0 && numerator >= 6 && numerator <= 15 && numerator !== 3;
  
  if (isStandardSimple || isStandardCompound) {
    return []; // No irregular subdivisions needed for standard meters
  }

  // Generate all rhythmic partitions mathematically
  const partitions = generateRhythmicPartitions(numerator);
  
  // Convert number arrays to subdivision strings (e.g., [3, 2] => "3+2")
  return partitions.map(partition => partition.join('+'));
};
