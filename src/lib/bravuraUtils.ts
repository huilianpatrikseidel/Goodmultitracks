/**
 * ============================================================================
 * BRAVURA MUSIC NOTATION UTILITIES
 * ============================================================================
 * Utilities for rendering music notation with the Bravura font (SMuFL).
 * 
 * Bravura is Steinberg's open-source music notation font that implements the
 * Standard Music Font Layout (SMuFL) specification.
 * 
 * @see https://www.smufl.org/
 * @see https://github.com/steinbergmedia/bravura
 */

/**
 * SMuFL (Standard Music Font Layout) codepoints for Bravura font
 * These are the Unicode characters used to display music notation symbols
 */
export const BravuraSymbols = {
  // Accidentals (U+E260 - U+E26F)
  accidentalFlat: '\uE260',
  accidentalNatural: '\uE261',
  accidentalSharp: '\uE262',
  accidentalDoubleSharp: '\uE263',
  accidentalDoubleFlat: '\uE264',
  
  // Clefs (U+E050 - U+E07F)
  gClef: '\uE050', // Treble clef
  fClef: '\uE062', // Bass clef
  cClef: '\uE05C', // Alto/Tenor clef
  
  // Noteheads (U+E0A0 - U+E0FF)
  noteheadBlack: '\uE0A4',
  noteheadHalf: '\uE0A3',
  noteheadWhole: '\uE0A2',
  noteheadDoubleWhole: '\uE0A0',
  
  // Individual notes (U+E1D0 - U+E1EF)
  noteDoubleWhole: '\uE1D0',
  noteWhole: '\uE1D2',
  noteHalfUp: '\uE1D3',
  noteHalfDown: '\uE1D4',
  noteQuarterUp: '\uE1D5',
  noteQuarterDown: '\uE1D6',
  note8thUp: '\uE1D7',
  note8thDown: '\uE1D8',
  note16thUp: '\uE1D9',
  note16thDown: '\uE1DA',
  note32ndUp: '\uE1DB',
  note32ndDown: '\uE1DC',
  
  // Rests (U+E4E0 - U+E4FF)
  restWhole: '\uE4E3',
  restHalf: '\uE4E4',
  restQuarter: '\uE4E5',
  rest8th: '\uE4E6',
  rest16th: '\uE4E7',
  rest32nd: '\uE4E8',
  
  // Time signatures (U+E080 - U+E09F)
  timeSig0: '\uE080',
  timeSig1: '\uE081',
  timeSig2: '\uE082',
  timeSig3: '\uE083',
  timeSig4: '\uE084',
  timeSig5: '\uE085',
  timeSig6: '\uE086',
  timeSig7: '\uE087',
  timeSig8: '\uE088',
  timeSig9: '\uE089',
  timeSigCommon: '\uE08A',
  timeSigCutCommon: '\uE08B',
  
  // Articulations (U+E4A0 - U+E4BF)
  articAccentAbove: '\uE4A0',
  articStaccatoAbove: '\uE4A2',
  articTenutoAbove: '\uE4A4',
  articStaccatissimoAbove: '\uE4A6',
  articMarcatoAbove: '\uE4AC',
  
  // Dynamics (U+E520 - U+E54F)
  dynamicPiano: '\uE520',
  dynamicMezzo: '\uE521',
  dynamicForte: '\uE522',
  dynamicRinforzando: '\uE523',
  dynamicSforzando: '\uE524',
  dynamicZ: '\uE525',
  
  // Barlines (U+E030 - U+E03F)
  barlineSingle: '\uE030',
  barlineDouble: '\uE031',
  barlineFinal: '\uE032',
  barlineRepeatLeft: '\uE040',
  barlineRepeatRight: '\uE041',
  
  // Repeat signs (U+E040 - U+E04F)
  repeat1Bar: '\uE500',
  repeat2Bars: '\uE501',
  segno: '\uE047',
  coda: '\uE048',
  dalSegno: '\uE045',
  daCapo: '\uE046',
  fine: '\uE050',
} as const;

/**
 * Convert standard music notation to Bravura symbols
 */
export function toBravuraAccidental(symbol: string): string {
  const map: Record<string, string> = {
    '♯': BravuraSymbols.accidentalSharp,
    '#': BravuraSymbols.accidentalSharp,
    '♭': BravuraSymbols.accidentalFlat,
    'b': BravuraSymbols.accidentalFlat,
    '♮': BravuraSymbols.accidentalNatural,
    '𝄪': BravuraSymbols.accidentalDoubleSharp,
    '##': BravuraSymbols.accidentalDoubleSharp,
    'x': BravuraSymbols.accidentalDoubleSharp,
    '𝄫': BravuraSymbols.accidentalDoubleFlat,
    'bb': BravuraSymbols.accidentalDoubleFlat,
  };
  return map[symbol] || symbol;
}

/**
 * Convert a note name with accidental to use Bravura font
 * Example: "C#" -> "C" + Bravura sharp symbol
 */
export function formatNoteWithBravura(note: string): { note: string; accidental?: string } {
  const match = note.match(/^([A-G])([#♯b♭♮]*)$/);
  if (!match) return { note };
  
  const [, noteName, accidental] = match;
  const bravuraAccidental = accidental ? toBravuraAccidental(accidental) : undefined;
  
  return {
    note: noteName,
    accidental: bravuraAccidental,
  };
}

/**
 * Format a chord symbol with Bravura accidentals
 * Example: "C#m7" -> "C" + sharp + "m7"
 */
export function formatChordWithBravura(chord: string): {
  root: string;
  accidental?: string;
  quality: string;
} {
  // Match root note with optional accidental, then the rest
  const match = chord.match(/^([A-G])([#♯b♭♮]?)(.*)/);
  if (!match) return { root: chord, quality: '' };
  
  const [, root, accidental, quality] = match;
  const bravuraAccidental = accidental ? toBravuraAccidental(accidental) : undefined;
  
  return {
    root,
    accidental: bravuraAccidental,
    quality,
  };
}

/**
 * Get time signature digits in Bravura font
 */
export function toBravuraTimeSignature(numerator: number, denominator: number): {
  numerator: string;
  denominator: string;
} {
  const digitMap: Record<number, string> = {
    0: BravuraSymbols.timeSig0,
    1: BravuraSymbols.timeSig1,
    2: BravuraSymbols.timeSig2,
    3: BravuraSymbols.timeSig3,
    4: BravuraSymbols.timeSig4,
    5: BravuraSymbols.timeSig5,
    6: BravuraSymbols.timeSig6,
    7: BravuraSymbols.timeSig7,
    8: BravuraSymbols.timeSig8,
    9: BravuraSymbols.timeSig9,
  };
  
  // Handle common time (4/4)
  if (numerator === 4 && denominator === 4) {
    return {
      numerator: BravuraSymbols.timeSigCommon,
      denominator: '',
    };
  }
  
  // Handle cut common time (2/2)
  if (numerator === 2 && denominator === 2) {
    return {
      numerator: BravuraSymbols.timeSigCutCommon,
      denominator: '',
    };
  }
  
  const numStr = numerator.toString();
  const denStr = denominator.toString();
  
  return {
    numerator: numStr.split('').map(d => digitMap[parseInt(d)] || d).join(''),
    denominator: denStr.split('').map(d => digitMap[parseInt(d)] || d).join(''),
  };
}

/**
 * React component props helper for adding Bravura font class
 */
export const bravuraClass = 'music-notation';
export const bravuraTextClass = 'music-text';
