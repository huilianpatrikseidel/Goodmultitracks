export type TimeSignatureType = 'simple' | 'compound' | 'irregular';

export interface TimeSignatureInfo {
  numerator: number;
  denominator: number;
  type: TimeSignatureType;
  beatUnit: NoteValue; // The note value that gets one beat (the pulse)
  beatsPerMeasure: number;
  grouping: number[]; // How many denominator-notes are in each beat
}

export type NoteValue = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth' | '32nd' | 
                        'dotted-half' | 'dotted-quarter' | 'dotted-eighth';

// --- Constants ---

export const TIME_SIG_DENOMINATORS = [
  { value: '1', label: '1 (Whole Note)' },
  { value: '2', label: '2 (Half Note)' },
  { value: '4', label: '4 (Quarter Note)' },
  { value: '8', label: '8 (Eighth Note)' },
  { value: '16', label: '16 (Sixteenth Note)' },
  { value: '32', label: '32 (32nd Note)' },
];

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

export const ROOT_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

export const ACCIDENTALS = [
  { value: 'natural', label: 'Natural', symbol: '' }, 
  { value: 'sharp', label: '♯ (Sharp)', symbol: '#' },
  { value: 'flat', label: '♭ (Flat)', symbol: 'b' },
];

export const QUALITIES = [
  { value: 'major', label: 'Major', suffix: '' }, 
  { value: 'minor', label: 'Minor', suffix: 'm' },
  { value: 'diminished', label: 'Diminished', suffix: 'dim' }, 
  { value: 'augmented', label: 'Augmented', suffix: 'aug' },
  { value: 'sus2', label: 'Suspended 2nd', suffix: 'sus2' }, 
  { value: 'sus4', label: 'Suspended 4th', suffix: 'sus4' },
];

export const EXTENSIONS = [
  { value: 'none', label: 'None', suffix: '' }, 
  { value: '7', label: 'Dominant 7th', suffix: '7' },
  { value: 'maj7', label: 'Major 7th', suffix: 'maj7' }, 
  { value: '9', label: '9th', suffix: '9' },
  { value: 'maj9', label: 'Major 9th', suffix: 'maj9' }, 
  { value: '11', label: '11th', suffix: '11' },
  { value: '13', label: '13th', suffix: '13' }, 
  { value: '6', label: '6th', suffix: '6' },
  { value: 'add9', label: 'Add 9', suffix: 'add9' },
];

// Chord database
export const CHORD_DATABASE: Record<string, {
  guitar: { frets: number[]; fingers?: number[]; startFret?: number };
  piano: { keys: string[] };
  ukulele: { frets: number[]; fingers?: number[]; startFret?: number };
}> = {
  'C': { guitar: { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] }, piano: { keys: ['C', 'E', 'G'] }, ukulele: { frets: [0, 0, 0, 3], fingers: [0, 0, 0, 3] } },
  'C#': { guitar: { frets: [-1, 4, 6, 6, 6, 4], fingers: [0, 1, 3, 4, 4, 1], startFret: 1 }, piano: { keys: ['C#', 'F', 'G#'] }, ukulele: { frets: [1, 1, 1, 4], fingers: [1, 1, 1, 4] } },
  'Db': { guitar: { frets: [-1, 4, 6, 6, 6, 4], fingers: [0, 1, 3, 4, 4, 1], startFret: 1 }, piano: { keys: ['Db', 'F', 'Ab'] }, ukulele: { frets: [1, 1, 1, 4], fingers: [1, 1, 1, 4] } },
  'D': { guitar: { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] }, piano: { keys: ['D', 'F#', 'A'] }, ukulele: { frets: [2, 2, 2, 0], fingers: [1, 1, 1, 0] } },
  'D#': { guitar: { frets: [-1, -1, 1, 3, 4, 3], fingers: [0, 0, 1, 2, 4, 3] }, piano: { keys: ['D#', 'G', 'A#'] }, ukulele: { frets: [0, 3, 3, 1], fingers: [0, 3, 4, 1] } },
  'Eb': { guitar: { frets: [-1, -1, 1, 3, 4, 3], fingers: [0, 0, 1, 2, 4, 3] }, piano: { keys: ['Eb', 'G', 'Bb'] }, ukulele: { frets: [0, 3, 3, 1], fingers: [0, 3, 4, 1] } },
  'E': { guitar: { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] }, piano: { keys: ['E', 'G#', 'B'] }, ukulele: { frets: [4, 4, 4, 2], fingers: [3, 3, 3, 1] } },
  'F': { guitar: { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1] }, piano: { keys: ['F', 'A', 'C'] }, ukulele: { frets: [2, 0, 1, 0], fingers: [2, 0, 1, 0] } },
  'F#': { guitar: { frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1] }, piano: { keys: ['F#', 'A#', 'C#'] }, ukulele: { frets: [3, 1, 2, 1], fingers: [3, 1, 2, 1] } },
  'Gb': { guitar: { frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1] }, piano: { keys: ['Gb', 'Bb', 'Db'] }, ukulele: { frets: [3, 1, 2, 1], fingers: [3, 1, 2, 1] } },
  'G': { guitar: { frets: [3, 2, 0, 0, 0, 3], fingers: [3, 2, 0, 0, 0, 4] }, piano: { keys: ['G', 'B', 'D'] }, ukulele: { frets: [0, 2, 3, 2], fingers: [0, 1, 3, 2] } },
  'G#': { guitar: { frets: [4, 6, 6, 5, 4, 4], fingers: [1, 3, 4, 2, 1, 1] }, piano: { keys: ['G#', 'C', 'D#'] }, ukulele: { frets: [5, 3, 4, 3], fingers: [3, 1, 2, 1] } },
  'Ab': { guitar: { frets: [4, 6, 6, 5, 4, 4], fingers: [1, 3, 4, 2, 1, 1] }, piano: { keys: ['Ab', 'C', 'Eb'] }, ukulele: { frets: [5, 3, 4, 3], fingers: [3, 1, 2, 1] } },
  'A': { guitar: { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] }, piano: { keys: ['A', 'C#', 'E'] }, ukulele: { frets: [2, 1, 0, 0], fingers: [2, 1, 0, 0] } },
  'A#': { guitar: { frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1] }, piano: { keys: ['A#', 'D', 'F'] }, ukulele: { frets: [3, 2, 1, 1], fingers: [3, 2, 1, 1] } },
  'Bb': { guitar: { frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1] }, piano: { keys: ['Bb', 'D', 'F'] }, ukulele: { frets: [3, 2, 1, 1], fingers: [3, 2, 1, 1] } },
  'B': { guitar: { frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1] }, piano: { keys: ['B', 'D#', 'F#'] }, ukulele: { frets: [4, 3, 2, 2], fingers: [4, 3, 1, 2] } },
  'Am': { guitar: { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] }, piano: { keys: ['A', 'C', 'E'] }, ukulele: { frets: [2, 0, 0, 0], fingers: [1, 0, 0, 0] } },
  'Bm': { guitar: { frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1] }, piano: { keys: ['B', 'D', 'F#'] }, ukulele: { frets: [4, 2, 2, 2], fingers: [4, 1, 1, 1] } },
  'Cm': { guitar: { frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1] }, piano: { keys: ['C', 'Eb', 'G'] }, ukulele: { frets: [0, 3, 3, 3], fingers: [0, 1, 1, 1] } },
  'Dm': { guitar: { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] }, piano: { keys: ['D', 'F', 'A'] }, ukulele: { frets: [2, 2, 1, 0], fingers: [2, 3, 1, 0] } },
  'Em': { guitar: { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] }, piano: { keys: ['E', 'G', 'B'] }, ukulele: { frets: [0, 4, 3, 2], fingers: [0, 4, 3, 2] } },
  'Fm': { guitar: { frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1] }, piano: { keys: ['F', 'Ab', 'C'] }, ukulele: { frets: [1, 0, 1, 3], fingers: [1, 0, 2, 4] } },
  'Gm': { guitar: { frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1] }, piano: { keys: ['G', 'Bb', 'D'] }, ukulele: { frets: [0, 2, 3, 1], fingers: [0, 2, 3, 1] } },
  'Am7': { guitar: { frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0] }, piano: { keys: ['A', 'C', 'E', 'G'] }, ukulele: { frets: [0, 0, 0, 0], fingers: [0, 0, 0, 0] } },
  'C7': { guitar: { frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] }, piano: { keys: ['C', 'E', 'G', 'Bb'] }, ukulele: { frets: [0, 0, 0, 1], fingers: [0, 0, 0, 1] } },
  'D7': { guitar: { frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] }, piano: { keys: ['D', 'F#', 'A', 'C'] }, ukulele: { frets: [2, 2, 2, 3], fingers: [1, 1, 1, 2] } },
  'E7': { guitar: { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] }, piano: { keys: ['E', 'G#', 'B', 'D'] }, ukulele: { frets: [1, 2, 0, 2], fingers: [1, 2, 0, 3] } },
  'G7': { guitar: { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] }, piano: { keys: ['G', 'B', 'D', 'F'] }, ukulele: { frets: [0, 2, 1, 2], fingers: [0, 2, 1, 3] } },
  'C/E': { guitar: { frets: [0, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] }, piano: { keys: ['E', 'G', 'C'] }, ukulele: { frets: [0, 0, 0, 3], fingers: [0, 0, 0, 3] } },
  'G/B': { guitar: { frets: [-1, 2, 0, 0, 0, 3], fingers: [0, 2, 0, 0, 0, 3] }, piano: { keys: ['B', 'D', 'G'] }, ukulele: { frets: [0, 2, 3, 2], fingers: [0, 1, 3, 2] } },
};

// --- Functions ---

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

export const analyzeTimeSignature = (numerator: number, denominator: number, subdivision?: string): TimeSignatureInfo => {
  let type: TimeSignatureType = 'simple';
  let beatsPerMeasure = numerator;
  let beatUnit = getNoteValueFromDenominator(denominator);
  let grouping: number[] = [];

  // Check for Compound Time (Numerator 6, 9, 12, 15...)
  // Compound time has a numerator that is a multiple of 3 (but not 3 itself usually, though 3/8 can be treated as 1 beat of dotted quarter in fast tempos, usually it's simple triple).
  // Standard definition: Top number is 6, 9, 12.
  if (denominator >= 4 && (numerator === 6 || numerator === 9 || numerator === 12)) {
    type = 'compound';
    beatsPerMeasure = numerator / 3;
    
    // Beat unit becomes dotted version of the next larger note value
    // e.g. 6/8 -> beat is dotted quarter. Denom 8 (eighth) -> next up is 4 (quarter) -> dotted.
    if (denominator === 8) beatUnit = 'dotted-quarter';
    else if (denominator === 4) beatUnit = 'dotted-half';
    else if (denominator === 16) beatUnit = 'dotted-eighth';
    
    // Grouping is always 3s
    for (let i = 0; i < beatsPerMeasure; i++) {
      grouping.push(3);
    }
  } 
  // Check for Simple Time (Numerator 2, 3, 4)
  else if (numerator === 2 || numerator === 3 || numerator === 4) {
    type = 'simple';
    beatsPerMeasure = numerator;
    beatUnit = getNoteValueFromDenominator(denominator);
    // Grouping is 1s (each beat is one denominator-note)
    for (let i = 0; i < beatsPerMeasure; i++) {
      grouping.push(1);
    }
  }
  // Irregular / Complex
  else {
    type = 'irregular';
    // For irregular, we rely on subdivision or defaults
    // e.g. 5/8 -> 3+2 or 2+3.
    // The "beat" is not consistent. It's a mix of simple and compound beats.
    
    let remaining = numerator;
    const customGroups = subdivision ? subdivision.split('+').map(s => parseInt(s.trim())).filter(n => !isNaN(n)) : [];
    
    if (customGroups.length > 0 && customGroups.reduce((a,b) => a+b, 0) === numerator) {
      grouping = customGroups;
    } else {
      // Default grouping logic for irregulars
      if (numerator === 5) grouping = [3, 2];
      else if (numerator === 7) grouping = [2, 2, 3]; // Common default
      else {
        // Generic fallback: fill with 2s, end with 3 if odd, or whatever fits
        // Actually, usually we want larger groups first or last.
        // Let's just fill with 2s and add a 3 if needed? 
        // Or just treat as N beats of 1.
        // Better default: try to group by 3s then 2s?
        // Let's stick to 1s if we don't know, or maybe just treat as simple beats if denominator is small?
        // If denominator is 8, we usually group.
        if (denominator >= 8) {
             while (remaining > 0) {
                if (remaining >= 3) { grouping.push(3); remaining -= 3; }
                else { grouping.push(2); remaining -= 2; }
            }
        } else {
            for(let i=0; i<numerator; i++) grouping.push(1);
        }
      }
    }
    beatsPerMeasure = grouping.length;
    // Beat unit is variable, so we might just say 'quarter' or 'dotted-quarter' depending on the group size
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

export const getSubdivisionPresets = (numerator: number, denominator: number): string[] => {
  if (denominator === 8) {
    if (numerator === 5) return ['3+2', '2+3'];
    if (numerator === 7) return ['2+2+3', '3+2+2', '2+3+2'];
    if (numerator === 8) return ['3+3+2', '3+2+3']; // 8/8 is sometimes treated as irregular
    if (numerator === 9) return ['2+2+2+3', '3+2+2+2']; // 9/8 irregular option
    if (numerator === 10) return ['3+3+2+2', '2+3+2+3'];
    if (numerator === 11) return ['3+3+3+2', '2+3+3+3'];
  }
  return [];
};

export interface ParsedChord {
  root: string;
  accidental: string;
  quality: string;
  extension: string;
  bassNote: string;
}

export const parseChordName = (chordName: string = ''): ParsedChord => {
  if (!chordName) {
    return { root: 'C', accidental: 'natural', quality: 'major', extension: 'none', bassNote: '' };
  }

  // Separa o baixo (ex: "Am7/G")
  const [mainChord, bassPart] = chordName.split('/');
  const bassNote = bassPart || '';

  // Regex mais robusto para parsear a parte principal
  const chordRegex = /^([A-G])([#b]?)(maj|m|min|dim|aug|sus2|sus4)?(13|11|9|7|6|add9|maj9|maj7)?(.*)$/;
  const match = mainChord.match(chordRegex);

  if (match) {
      const [, root, acc, qualSuffix, extSuffix] = match;

      const accidental = acc === '#' ? 'sharp' : acc === 'b' ? 'flat' : 'natural';

      // Mapeia sufixos de qualidade
      let quality = 'major';
      if (qualSuffix === 'm' || qualSuffix === 'min') quality = 'minor';
      else if (qualSuffix === 'dim') quality = 'diminished';
      else if (qualSuffix === 'aug') quality = 'augmented';
      else if (qualSuffix === 'sus2') quality = 'sus2';
      else if (qualSuffix === 'sus4') quality = 'sus4';
      // Se maj estiver presente E não for maj7/maj9, considera major
      else if (qualSuffix === 'maj' && !extSuffix?.startsWith('maj')) quality = 'major';

      // Mapeia sufixos de extensão (considera 'maj' junto com 7 ou 9)
      let extension = 'none';
      if (qualSuffix === 'maj' && extSuffix === '7') extension = 'maj7';
      else if (qualSuffix === 'maj' && extSuffix === '9') extension = 'maj9';
      else if (extSuffix === '7') extension = '7';
      else if (extSuffix === '9') extension = '9';
      else if (extSuffix === '11') extension = '11';
      else if (extSuffix === '13') extension = '13';
      else if (extSuffix === '6') extension = '6';
      else if (extSuffix === 'add9') extension = 'add9';

      return { root, accidental, quality, extension, bassNote };
  } else {
      console.warn("Could not parse chord name accurately:", chordName);
      return { root: chordName[0] || 'C', accidental: 'natural', quality: 'major', extension: 'none', bassNote: '' };
  }
};

export const generateChordName = (
  rootNote: string, 
  accidental: string, 
  quality: string, 
  extension: string, 
  bassNote: string
): string => {
  const accSymbol = ACCIDENTALS.find(a => a.value === accidental)?.symbol || '';
  const qualSuffix = QUALITIES.find(q => q.value === quality)?.suffix || '';
  const extSuffix = EXTENSIONS.find(e => e.value === extension)?.suffix || '';
  
  // Lógica especial para maj7/maj9
  let finalExtSuffix = extSuffix;
  if (extension === 'maj7' && quality !== 'major') finalExtSuffix = 'maj7'; // Garante maj7 se selecionado
  else if (extension === 'maj9' && quality !== 'major') finalExtSuffix = 'maj9';
  else if (quality === 'major' && (extension === 'maj7' || extension === 'maj9')) finalExtSuffix = extSuffix; // Usa sufixo da extensão se já for major
  else if (quality === 'major' && extension !== 'none') finalExtSuffix = extSuffix; // Usa sufixo da extensão se for major
  else if (quality !== 'major' && extension !== 'none') finalExtSuffix = extSuffix; // Usa sufixo da extensão se não for major

  return `${rootNote}${accSymbol}${qualSuffix}${finalExtSuffix}${bassNote ? '/' + bassNote : ''}`;
};
