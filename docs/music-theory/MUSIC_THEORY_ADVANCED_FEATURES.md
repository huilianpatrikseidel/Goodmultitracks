# Advanced Music Theory Features - "Musical Intelligence"

This document describes the advanced features added to the Music Theory engine to provide professional-level musical analysis and chord generation.

## 🎯 Overview

The music theory system has been enhanced with five major "Musical Intelligence" features:

1. **Guitar Algorithm Refinement** - Bass note priority and inversion detection
2. **Automatic Fingering Calculation** - Constraint-based finger assignment
3. **Alternate Tuning Support** - Configurable guitar tunings
4. **Harmonic Analysis** - Roman numeral chord analysis
5. **Anatomical Constraint Detection** - Realistic playability assessment

---

## 1. Guitar Algorithm Refinement (Inversions & Bass Notes)

### Problem Solved
Previously, the chord generator would produce any voicing where notes belonged to the chord, but didn't ensure the correct bass note. This could result in unwanted inversions.

### Solution
Implemented a **bass note scoring system** that prioritizes voicings based on the desired bass note:

- **Root Position Priority**: Voicings with the root in the bass receive maximum priority by default
- **Slash Chord Support**: When a slash chord is specified (e.g., `C/E`), the algorithm prioritizes the specified bass note

### Usage

```typescript
import { generateGuitarVoicing } from './lib/musicTheory';

// Generate C major in root position (C in bass)
const cMajor = generateGuitarVoicing(['C', 'E', 'G'], {
  rootNote: 'C'  // Prioritizes root in bass
});

// Generate C/E (first inversion - E in bass)
const cSlashE = generateGuitarVoicing(['C', 'E', 'G'], {
  rootNote: 'C',
  bassNote: 'E'  // Overrides root priority
});
```

### Technical Details
- `calculateBassNoteScore()` function evaluates each voicing
- Score of 100 for exact bass note match
- Score of 50 for neutral (no preference)
- Score of 0 for non-matching bass note

---

## 2. Automatic Fingering Calculation

### Problem Solved
The old system calculated fret positions but left finger assignments undefined, requiring manual fingering decisions.

### Solution
Implemented a **Constraint Satisfaction Heuristic** that automatically assigns fingers (1-4) based on:

- Fret position (lowest fret gets index finger)
- Barre chord detection (multiple strings on same fret)
- Ergonomic hand positioning

### Algorithm

```typescript
const calculateFingerAssignments = (voicing: number[]): number[] => {
  // Detects barre chords (2+ strings on lowest fret)
  // Assigns index finger (1) to barre
  // Distributes remaining fingers (2, 3, 4) to higher frets
  // Returns: [0, 3, 2, 0, 1, 0] where 0=open/muted, 1-4=fingers
};
```

### Example

For an F major barre chord:
```
Frets:   [1, 3, 3, 2, 1, 1]
Fingers: [1, 3, 4, 2, 1, 1]  // Index barres fret 1
                             // Middle on fret 2
                             // Ring on fret 3 (4th string)
                             // Pinky on fret 3 (3rd string)
```

### Usage

```typescript
const voicing = generateGuitarVoicing(['F', 'A', 'C']);
console.log(voicing.fingers); // [1, 3, 4, 2, 1, 1]
```

---

## 3. Alternate Tuning Support

### Problem Solved
Standard tuning (E A D G B E) was hardcoded, making it impossible to generate chords for alternate tunings.

### Solution
Refactored the tuning system to be **fully configurable**:

- `GuitarTuning` type for flexibility
- Pre-defined common tunings
- Custom tuning support

### Available Tunings

| Tuning | Notes | Use Case |
|--------|-------|----------|
| `standard` | E A D G B E | Default |
| `drop-d` | D A D G B E | Metal, rock |
| `dadgad` | D A D G A D | Celtic, folk |
| `open-g` | D G D G B D | Blues, slide guitar |
| `open-d` | D A D F# A D | Slide guitar |
| `eb-standard` | Eb Ab Db Gb Bb Eb | Half-step down |
| `d-standard` | D G C F A D | Whole-step down |

### Usage

```typescript
import { generateGuitarVoicing, GUITAR_TUNINGS } from './lib/musicTheory';

// Generate chord in Drop D tuning
const dropDChord = generateGuitarVoicing(['D', 'F#', 'A'], {
  tuning: GUITAR_TUNINGS['drop-d']
});

// Generate chord in DADGAD
const dadgadChord = generateGuitarVoicing(['D', 'A', 'D'], {
  tuning: GUITAR_TUNINGS.dadgad
});

// Use custom tuning
const customTuning = [2, 7, 2, 7, 2, 7]; // D G D G D G
const customChord = generateGuitarVoicing(['D', 'G', 'B'], {
  tuning: customTuning
});
```

### Integration with Project

To support alternate tunings across your app, you can:

1. Add tuning selection to project settings
2. Store tuning preference in `ProjectContext`
3. Pass tuning to `getChordVoicing()`

```typescript
// Example integration
const projectTuning = useProjectContext().guitarTuning || 'standard';
const voicing = getChordVoicing('Dmaj7', 'D', GUITAR_TUNINGS[projectTuning]);
```

---

## 4. Harmonic Analysis (Roman Numerals)

### Problem Solved
Users couldn't understand the harmonic function of chords within a key (e.g., knowing a chord is the "V7" dominant).

### Solution
Implemented `getRomanNumeral()` function for complete harmonic analysis:

- Calculates scale degree from key center
- Determines major/minor quality
- Detects modal interchange (borrowed chords)
- Identifies secondary dominants (e.g., `V7/V`)

### Usage

```typescript
import { getRomanNumeral, parseChordName } from './lib/musicTheory';

const chord = parseChordName('G7');
const analysis = getRomanNumeral(chord, 'C'); // Returns: "V7"

// Minor key analysis
const chord2 = parseChordName('F');
const analysis2 = getRomanNumeral(chord2, 'Am'); // Returns: "bVI"

// Secondary dominant
const chord3 = parseChordName('D7');
const analysis3 = getRomanNumeral(chord3, 'C'); // Returns: "V7/V"
```

### Examples by Key

**In C Major:**
- `C` → `I` (tonic)
- `Dm` → `ii` (supertonic)
- `Em` → `iii` (mediant)
- `F` → `IV` (subdominant)
- `G7` → `V7` (dominant seventh)
- `Am` → `vi` (submediant)
- `Bdim` → `vii°` (leading tone diminished)
- `D7` → `V7/V` (secondary dominant)

**In A Minor:**
- `Am` → `i` (tonic)
- `Bdim` → `ii°` (supertonic diminished)
- `C` → `III` (mediant - relative major)
- `Dm` → `iv` (subdominant)
- `Em` → `v` (dominant)
- `F` → `VI` (submediant - relative major)
- `G` → `VII` (subtonic)

### Display Integration

You can display Roman numerals above chord diagrams:

```typescript
const ChordWithAnalysis = ({ chordName, projectKey }) => {
  const parsed = parseChordName(chordName);
  const roman = getRomanNumeral(parsed, projectKey);
  
  return (
    <div>
      <div className="roman-numeral">{roman}</div>
      <div className="chord-name">{chordName}</div>
      <ChordDiagram chord={chordName} />
    </div>
  );
};
```

---

## 5. Detection of "Impossible Chords" (Anatomical Constraints)

### Problem Solved
The `maxFretSpan = 4` filter prevented extremely wide stretches, but didn't catch all unplayable voicings (e.g., muted strings between fretted ones).

### Solution
Implemented `detectAnatomicalConstraints()` with two main checks:

#### A. Interrupted Strings Detection
Penalizes voicings with muted strings between fretted strings:

```
❌ BAD:  [-1, 3, -1, 5, 2, 0]  // String 2 muted between 1 and 3
                                // Requires awkward muting technique

✅ GOOD: [3, 5, 5, 3, 3, 3]    // Continuous barre chord
                                // Natural hand position
```

#### B. Difficult Stretches Detection
Penalizes large fret gaps on adjacent strings:

```
❌ BAD:  [1, 7, 5, 3, 2, 1]    // 6-fret jump from string 6 to 5
                                // Anatomically difficult

✅ GOOD: [1, 3, 3, 2, 1, 1]    // Max 2-fret difference
                                // Comfortable hand position
```

### Scoring System

```typescript
const detectAnatomicalConstraints = (voicing: number[]): number => {
  let penalty = 0;
  
  // +10 penalty for each interrupted string
  // +5 penalty for each stretch > 3 frets on adjacent strings
  
  return penalty; // Lower is better
};
```

### Integration

The constraint detection is automatically integrated into `generateGuitarVoicing()`:

```typescript
const score = bassScore - anatomicalPenalty;
// Voicings are ranked: best bass note + best ergonomics = highest score
```

---

## 🔧 Complete API Reference

### Types

```typescript
export type GuitarTuning = number[]; // Semitones from C for each string

export interface ParsedChord {
  root: string;
  accidental: string;
  quality: string;
  extension: string;
  bassNote: string;
}
```

### Constants

```typescript
export const GUITAR_TUNING_STANDARD: GuitarTuning;
export const GUITAR_TUNINGS: Record<string, GuitarTuning>;
```

### Functions

```typescript
// Enhanced chord voicing generation
export const generateGuitarVoicing = (
  notes: string[], 
  options?: {
    maxFretSpan?: number;
    tuning?: GuitarTuning;
    rootNote?: string;
    bassNote?: string;
  }
): { frets: number[]; fingers?: number[]; startFret?: number } | undefined;

// Roman numeral analysis
export const getRomanNumeral = (
  chord: ParsedChord, 
  key: string
): string;

// Updated chord voicing retrieval
export const getChordVoicing = (
  chordName: string, 
  keyContext?: string,
  tuning?: GuitarTuning
): {
  guitar?: { frets: number[]; fingers?: number[]; startFret?: number };
  piano: { keys: string[] };
  ukulele?: { frets: number[]; fingers?: number[]; startFret?: number };
};
```

---

## 🎓 Educational Use Cases

### 1. Chord Function Labels
Display Roman numerals alongside chord names for music students learning harmonic analysis.

### 2. Tuning Experimentation
Allow users to explore how chords sound and look in different tunings (great for guitarists learning alternate tunings).

### 3. Fingering Reference
Show beginners the correct finger positioning for any generated chord.

### 4. Progression Analysis
Analyze entire chord progressions:

```typescript
const progression = ['C', 'Am', 'F', 'G7'];
const analysis = progression.map(chord => ({
  name: chord,
  roman: getRomanNumeral(parseChordName(chord), 'C')
}));
// Result: [
//   { name: 'C', roman: 'I' },
//   { name: 'Am', roman: 'vi' },
//   { name: 'F', roman: 'IV' },
//   { name: 'G7', roman: 'V7' }
// ]
```

---

## 🧪 Testing Examples

```typescript
// Test 1: Root position priority
const test1 = generateGuitarVoicing(['C', 'E', 'G'], { rootNote: 'C' });
// Expected: Lowest note should be C (not E or G)

// Test 2: Slash chord
const test2 = generateGuitarVoicing(['C', 'E', 'G'], { 
  rootNote: 'C', 
  bassNote: 'E' 
});
// Expected: Lowest note should be E

// Test 3: Drop D tuning
const test3 = generateGuitarVoicing(['D', 'A', 'D'], {
  tuning: GUITAR_TUNINGS['drop-d']
});
// Expected: Uses low D string effectively

// Test 4: Roman numeral - secondary dominant
const test4 = getRomanNumeral(parseChordName('D7'), 'C');
// Expected: "V7/V" (dominant of the dominant)

// Test 5: Fingering for barre chord
const test5 = generateGuitarVoicing(['F', 'A', 'C']);
// Expected: fingers array includes barre on fret 1
```

---

## 🚀 Future Enhancements

Potential additions for even more "Musical Intelligence":

1. **Voice Leading Analysis** - Detect smooth vs. awkward chord transitions
2. **Jazz Voicing Library** - Drop-2, drop-3, rootless voicings
3. **Chord Substitution Suggestions** - Recommend alternative chords
4. **Modal Interchange Detection** - Automatic borrowed chord identification
5. **Tension/Extension Recommendations** - Suggest adding 9ths, 11ths, 13ths
6. **Strumming Pattern Generation** - Based on time signature and genre
7. **Capo Simulation** - Transform voicings to use capo positions

---

## 📚 Related Documentation

- [MUSIC_THEORY_API_REFERENCE.md](./MUSIC_THEORY_API_REFERENCE.md) - Core API documentation
- [MUSIC_THEORY_IMPROVEMENTS.md](./MUSIC_THEORY_IMPROVEMENTS.md) - Evolution of the system
- [VOICING_GENERATION_IMPLEMENTATION.md](./VOICING_GENERATION_IMPLEMENTATION.md) - Algorithm details

---

*Last Updated: January 6, 2026*
*Author: Development Team*
*Status: ✅ Implemented and Production-Ready*
