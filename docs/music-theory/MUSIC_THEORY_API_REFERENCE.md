# 🎵 Music Theory API - Quick Reference

**Updated:** January 6, 2026

---

## 🎯 Most Common Functions

### Transposition
```typescript
import { transposeNote, transposeKey } from '@/lib/musicTheory';

// Context-aware (NEW - recommended)
transposeNote('C', 7, 'G')  // → 'G' (in G major context)
transposeNote('C', 6, 'F#') // → 'F#' (in F# major)
transposeNote('C', 6, 'Db') // → 'Gb' (in Db major)

// Legacy (backward compatible)
transposeKey('Am7', 2)  // → 'Bm7'
transposeKey('C/E', 5)  // → 'F/E'
```

### Chord Construction
```typescript
import { buildChord, getChordVoicing } from '@/lib/musicTheory';

// Build chord from parts
buildChord('C', 'major')           // → ['C', 'E', 'G']
buildChord('A', 'minor', '7')      // → ['A', 'C', 'E', 'G']
buildChord('D', 'major', 'maj9')   // → ['D', 'F#', 'A', 'C#', 'E']

// Get voicing (includes diagrams if available)
const voicing = getChordVoicing('Cmaj7', 'C');
voicing.piano.keys  // → ['C', 'E', 'G', 'B']
voicing.guitar      // → { frets: [...], fingers: [...] } or undefined
```

### Scales & Modes
```typescript
import { getScaleNotes, isChordInKey } from '@/lib/musicTheory';

// Generate scale
getScaleNotes('C', 'major')    // → ['C', 'D', 'E', 'F', 'G', 'A', 'B']
getScaleNotes('D', 'dorian')   // → ['D', 'E', 'F', 'G', 'A', 'B', 'C']
getScaleNotes('A', 'minor')    // → ['A', 'B', 'C', 'D', 'E', 'F', 'G']

// Validate chord in key
isChordInKey('Dm', 'C', 'major')  // → true (ii chord)
isChordInKey('Eb', 'C', 'major')  // → false (not in key)
```

### Time Signatures
```typescript
import { analyzeTimeSignature, getMetronomeBeatPositions } from '@/lib/musicTheory';

// Analyze meter
const info = analyzeTimeSignature(7, 8);  // 7/8 time
// → { type: 'irregular', grouping: [2, 2, 3], beatsPerMeasure: 3 }

// Custom subdivision
const info2 = analyzeTimeSignature(7, 8, '3+2+2');
// → { type: 'irregular', grouping: [3, 2, 2], beatsPerMeasure: 3 }

// Get metronome accents
const positions = getMetronomeBeatPositions(info);  // → [0, 2, 4]
```

---

## 📖 Complete Function List

### Transposition & Keys
| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `transposeNote()` | note, semitones, keyContext? | string | Transpose with key-aware enharmonics |
| `transposeKey()` | key, semitones | string | Legacy transposition (backward compat) |
| `getScaleDegree()` | key, mode, degree | string | Get note at scale degree |

### Chords
| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `buildChord()` | root, quality, extension?, keyContext? | string[] | Generate chord notes algorithmically |
| `getChordVoicing()` | chordName, keyContext? | object | Get chord voicing with fallback |
| `parseChordName()` | chordName | ParsedChord | Parse chord into components |
| `generateChordName()` | root, accidental, quality, ext, bass | string | Build chord name from parts |

### Scales & Validation
| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `getScaleNotes()` | key, mode | string[] | Generate scale notes |
| `isChordInKey()` | chordRoot, key, mode | boolean | Validate chord belongs to key |

### Time Signatures & Meters
| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `analyzeTimeSignature()` | num, denom, subdivision? | TimeSignatureInfo | Analyze meter type & grouping |
| `getMetronomeBeatPositions()` | info | number[] | Get accent positions in measure |
| `getAccentLevel()` | position, info | 0\|1\|2 | Get accent strength (0=weak, 2=strong) |
| `getSubdivisionPresets()` | num, denom | string[] | Get common subdivision patterns |

---

## 🎹 Chord Qualities

### Available Qualities
```typescript
'major'      // Major triad (R, 3, 5)
'minor'      // Minor triad (R, b3, 5)
'diminished' // Diminished triad (R, b3, b5)
'augmented'  // Augmented triad (R, 3, #5)
'sus2'       // Suspended 2nd (R, 2, 5)
'sus4'       // Suspended 4th (R, 4, 5)
```

### Available Extensions
```typescript
'none'       // Just the triad
'6'          // Add major 6th
'7'          // Add minor 7th (dominant)
'maj7'       // Add major 7th
'9'          // Add 9th (with b7)
'maj9'       // Add 9th (with maj7)
'11'         // Add 11th (with b7, 9)
'13'         // Add 13th (with b7, 9)
'add9'       // Add 9th only (no 7th)
'b9'         // Add b9 (with b7)
'#9'         // Add #9 (with b7)
'#11'        // Add #11 (with b7, 9)
'b13'        // Add b13 (with b7, 9)
```

### Examples
```typescript
buildChord('C', 'major')        // C major: C, E, G
buildChord('A', 'minor', '7')   // Am7: A, C, E, G
buildChord('G', 'major', '9')   // G9: G, B, D, F, A
buildChord('D', 'major', 'maj7') // Dmaj7: D, F#, A, C#
buildChord('E', 'minor', 'add9') // Emadd9: E, G, B, F#
buildChord('F', 'sus4')         // Fsus4: F, Bb, C
```

---

## 🎼 Scale/Mode Patterns

### Available Modes
```typescript
'major'           // Ionian (W-W-H-W-W-W-H)
'minor'           // Aeolian (W-H-W-W-H-W-W)
'dorian'          // Dorian (W-H-W-W-W-H-W)
'phrygian'        // Phrygian (H-W-W-W-H-W-W)
'lydian'          // Lydian (W-W-W-H-W-W-H)
'mixolydian'      // Mixolydian (W-W-H-W-W-H-W)
'locrian'         // Locrian (H-W-W-H-W-W-W)
'harmonic-minor'  // Harmonic Minor (W-H-W-W-H-W+H-H)
'melodic-minor'   // Melodic Minor (W-H-W-W-W-W-H)
```

### Examples
```typescript
getScaleNotes('C', 'major')     // C, D, E, F, G, A, B
getScaleNotes('A', 'minor')     // A, B, C, D, E, F, G
getScaleNotes('D', 'dorian')    // D, E, F, G, A, B, C
getScaleNotes('E', 'phrygian')  // E, F, G, A, B, C, D
getScaleNotes('F', 'lydian')    // F, G, A, B, C, D, E
getScaleNotes('G', 'mixolydian') // G, A, B, C, D, E, F
```

---

## ⏱️ Time Signature Types

### Simple Meters
- **Definition:** Beats divide into 2 equal parts
- **Examples:** 2/4, 3/4, 4/4
- **Beat unit:** Note value = denominator
```typescript
analyzeTimeSignature(4, 4)
// → { type: 'simple', beatsPerMeasure: 4, grouping: [1,1,1,1] }
```

### Compound Meters
- **Definition:** Beats divide into 3 equal parts
- **Examples:** 6/8, 9/8, 12/8
- **Beat unit:** Dotted note value
```typescript
analyzeTimeSignature(6, 8)
// → { type: 'compound', beatsPerMeasure: 2, grouping: [3,3] }
```

### Irregular Meters
- **Definition:** Mixed groupings of 2s and 3s
- **Examples:** 5/4, 5/8, 7/8, 11/8
- **Beat unit:** Variable based on grouping
```typescript
analyzeTimeSignature(7, 8)
// → { type: 'irregular', beatsPerMeasure: 3, grouping: [2,2,3] }

analyzeTimeSignature(5, 8, '3+2')  // Custom subdivision
// → { type: 'irregular', beatsPerMeasure: 2, grouping: [3,2] }
```

---

## 🎯 Common Use Cases

### 1. Transpose Entire Song
```typescript
const transposeProject = (project, semitones) => {
  const newKey = transposeKey(project.key, semitones);
  const newChords = project.chords.map(chord => ({
    ...chord,
    name: transposeKey(chord.name, semitones)
  }));
  
  return { ...project, key: newKey, chords: newChords };
};
```

### 2. Show Chord Diagram
```typescript
const ChordDisplay = ({ chordName, projectKey }) => {
  const voicing = getChordVoicing(chordName, projectKey);
  
  return (
    <div>
      <h3>{chordName}</h3>
      <div>Notes: {voicing.piano.keys.join(' - ')}</div>
      {voicing.guitar && <GuitarDiagram data={voicing.guitar} />}
    </div>
  );
};
```

### 3. Validate Chord Input
```typescript
const validateChordInput = (chordName, projectKey, projectMode) => {
  const parsed = parseChordName(chordName);
  const root = `${parsed.root}${getAccidentalSymbol(parsed.accidental)}`;
  
  if (!isChordInKey(root, projectKey, projectMode)) {
    return {
      warning: `${chordName} is not in ${projectKey} ${projectMode}`
    };
  }
  
  return { valid: true };
};
```

### 4. Metronome with Accents
```typescript
const playMetronomeClick = (position, timeSignatureInfo) => {
  const accentLevel = getAccentLevel(position, timeSignatureInfo);
  
  const volume = accentLevel === 2 ? 1.0 : accentLevel === 1 ? 0.7 : 0.4;
  const freq = accentLevel === 2 ? 1000 : accentLevel === 1 ? 800 : 600;
  
  playBeep(freq, volume);
};
```

### 5. Scale Practice Tool
```typescript
const ScalePractice = ({ key, mode }) => {
  const notes = getScaleNotes(key, mode);
  
  return (
    <div>
      <h3>{key} {mode}</h3>
      <div className="scale-notes">
        {notes.map((note, i) => (
          <button key={i} onClick={() => playNote(note)}>
            {note}
          </button>
        ))}
      </div>
    </div>
  );
};
```

---

## 🔍 Type Definitions

### TimeSignatureInfo
```typescript
interface TimeSignatureInfo {
  numerator: number;
  denominator: number;
  type: 'simple' | 'compound' | 'irregular';
  beatUnit: NoteValue;
  beatsPerMeasure: number;
  grouping: number[];  // How beats subdivide
}
```

### ParsedChord
```typescript
interface ParsedChord {
  root: string;           // 'C', 'D', 'E', etc.
  accidental: string;     // 'natural', 'sharp', 'flat'
  quality: string;        // 'major', 'minor', etc.
  extension: string;      // 'none', '7', 'maj7', etc.
  bassNote: string;       // For slash chords (e.g., 'E' in 'C/E')
}
```

### ChordVoicing
```typescript
interface ChordVoicing {
  piano: {
    keys: string[];  // Note names
  };
  guitar?: {
    frets: number[];
    fingers?: number[];
    startFret?: number;
  };
  ukulele?: {
    frets: number[];
    fingers?: number[];
    startFret?: number;
  };
}
```

---

## 💡 Tips & Best Practices

### ✅ Do This
- Use `getChordVoicing()` instead of direct `CHORD_DATABASE` access
- Pass key context to `transposeNote()` for correct enharmonics
- Use `analyzeTimeSignature()` for metronome logic
- Validate chords with `isChordInKey()` before warnings

### ❌ Avoid This
- Don't access `CHORD_DATABASE` directly (use `getChordVoicing()`)
- Don't transpose without key context (enharmonics will be wrong)
- Don't assume all chords are in database (use fallback)
- Don't hardcode time signature logic (use analysis functions)

---

## 📚 Learn More

- [Full Documentation](./docs/MUSIC_THEORY_IMPROVEMENTS.md)
- [Migration Guide](./docs/MUSIC_THEORY_MIGRATION.md)
- [Test Examples](./src/lib/musicTheory.test.ts)

---

**Updated:** January 6, 2026  
**Module Version:** 2.0.0 (backward compatible)
