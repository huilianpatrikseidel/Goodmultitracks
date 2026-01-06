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
  grouping: number[];
}

export type NoteValue = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth' | '32nd' | 
                        'dotted-half' | 'dotted-quarter' | 'dotted-eighth';

/**
 * Time signature denominator options
 */
export const TIME_SIG_DENOMINATORS = [
  { value: '1', label: '1 (Whole Note)' },
  { value: '2', label: '2 (Half Note)' },
  { value: '4', label: '4 (Quarter Note)' },
  { value: '8', label: '8 (Eighth Note)' },
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
 * Convert denominator to note value
 */
export const getNoteValueFromDenominator = (denominator: number): NoteValue => {
  switch (denominator) {
    case 1: return 'whole';
    case 2: return 'half';
    case 4: return 'quarter';
    case 8: return 'eighth';
    case 16: return 'sixteenth';
    case 32: return '32nd';
    default: return 'quarter';
  }
};

/**
 * Analyze time signature and determine type, beat unit, and grouping
 */
export const analyzeTimeSignature = (numerator: number, denominator: number, subdivision?: string): TimeSignatureInfo => {
  let type: TimeSignatureType = 'simple';
  let beatUnit: NoteValue;
  let beatsPerMeasure: number;
  let grouping: number[] = [];

  if (subdivision) {
    type = 'irregular';
    grouping = subdivision.split('+').map(Number);
    beatsPerMeasure = grouping.length;
    beatUnit = getNoteValueFromDenominator(denominator);
  } else if (numerator % 3 === 0 && numerator >= 6 && numerator <= 15) {
    // Compound meter: numerator divisible by 3, creates dotted beat units
    // Works for 6/8, 9/8, 12/8, 6/4, 9/4, 12/16, etc.
    type = 'compound';
    beatsPerMeasure = numerator / 3;
    
    // Determine dotted beat unit based on denominator
    if (denominator === 8) beatUnit = 'dotted-quarter';
    else if (denominator === 4) beatUnit = 'dotted-half';
    else if (denominator === 16) beatUnit = 'dotted-eighth';
    else beatUnit = getNoteValueFromDenominator(denominator); // fallback
    
    grouping = Array(beatsPerMeasure).fill(3);
  } else {
    type = 'simple';
    beatsPerMeasure = numerator;
    beatUnit = getNoteValueFromDenominator(denominator);
    grouping = Array(beatsPerMeasure).fill(1);
  }

  return {
    numerator,
    denominator,
    type,
    beatUnit,
    beatsPerMeasure,
    grouping
  };
};

/**
 * Get subdivision preset options for irregular meters
 */
export const getSubdivisionPresets = (numerator: number, denominator: number): string[] => {
  if (denominator === 8) {
    if (numerator === 5) return ['3+2', '2+3'];
    if (numerator === 7) return ['2+2+3', '3+2+2', '2+3+2'];
    if (numerator === 8) return ['3+3+2', '3+2+3'];
    if (numerator === 9) return ['2+2+2+3', '3+2+2+2'];
    if (numerator === 10) return ['3+3+2+2', '2+3+2+3'];
    if (numerator === 11) return ['3+3+3+2', '2+3+3+3'];
  }
  return [];
};
