# 🔄 Music Theory Module - Component Migration Guide

This guide helps you update components to use the improved music theory functions.

---

## Quick Reference

### What Changed?

| Old Function | New Function | Notes |
|--------------|--------------|-------|
| `CHORD_DATABASE[name]` | `getChordVoicing(name, key?)` | Auto-generates if not in DB |
| `transposeKey(chord, semitones)` | `transposeNote(note, semitones, key)` | Key-context aware |
| N/A | `buildChord(root, quality, ext, key?)` | NEW: Build any chord |
| N/A | `getScaleNotes(key, mode)` | NEW: Generate scale |
| N/A | `isChordInKey(chord, key, mode)` | NEW: Validate chords |
| N/A | `getMetronomeBeatPositions(info)` | NEW: Meter accents |

---

## 1. Updating Chord Diagrams

### Piano Diagram (`InteractivePianoDiagram.tsx`)

**BEFORE:**
```typescript
const chordData = CHORD_DATABASE[chordName];
if (!chordData) {
  return <div>Chord not found</div>;
}
const notes = chordData.piano.keys;
```

**AFTER:**
```typescript
import { getChordVoicing } from '@/lib/musicTheory';

// projectKey comes from ProjectContext or props
const chordData = getChordVoicing(chordName, projectKey);
const notes = chordData.piano.keys;
// Will always have notes, even for complex chords not in database
```

### Guitar Diagram (`InteractiveGuitarDiagram.tsx`)

**BEFORE:**
```typescript
const chordData = CHORD_DATABASE[chordName];
if (!chordData?.guitar) {
  return null;
}
```

**AFTER:**
```typescript
import { getChordVoicing } from '@/lib/musicTheory';

const chordData = getChordVoicing(chordName, projectKey);

// For now, guitar voicings still come from database
if (chordData.guitar) {
  // Use existing guitar voicing
} else {
  // Could show piano notes or message
  // "Guitar voicing not available, showing notes: {notes}"
}
```

### Ukulele Diagram (`InteractiveUkuleleDiagram.tsx`)

Same pattern as guitar diagram above.

---

## 2. Updating Chord Display Components

### ChordDiagram Component

**BEFORE:**
```typescript
const parsed = parseChordName(chordName);
const fullName = generateChordName(
  parsed.root, 
  parsed.accidental, 
  parsed.quality, 
  parsed.extension, 
  parsed.bassNote
);
```

**AFTER:**
```typescript
import { parseChordName, generateChordName, getChordVoicing } from '@/lib/musicTheory';

// Same parsing logic
const parsed = parseChordName(chordName);

// Get voicing with fallback
const voicing = getChordVoicing(chordName, projectKey);

// Display notes if available
<div className="chord-notes">
  {voicing.piano.keys.join(' - ')}
</div>
```

---

## 3. Updating Transposition Features

### Transposition UI (e.g., SettingsPanel)

**BEFORE:**
```typescript
const transposedChord = transposeKey(chord.name, semitones);
```

**AFTER:**
```typescript
import { transposeKey } from '@/lib/musicTheory';

// Option 1: Use legacy function (maintains backward compatibility)
const transposedChord = transposeKey(chord.name, semitones);

// Option 2: Use new context-aware function for individual notes
import { transposeNote } from '@/lib/musicTheory';

const parsed = parseChordName(chord.name);
const root = `${parsed.root}${getAccidentalSymbol(parsed.accidental)}`;
const newRoot = transposeNote(root, semitones, targetKey);
// Reconstruct chord name with new root
```

**Best Practice:**
```typescript
// For projects, store the key and use it for transposition
const { projectKey, projectMode } = useProjectContext();

// When transposing entire project
const transposeProject = (semitones: number) => {
  // Transpose the project key itself
  const newKey = transposeKey(projectKey, semitones);
  
  // Update all chords (they'll automatically use correct enharmonics)
  const newChords = chords.map(chord => ({
    ...chord,
    name: transposeKey(chord.name, semitones)
  }));
  
  return { newKey, newChords };
};
```

---

## 4. Adding Chord Validation

### Chord Input/Editor

**NEW FEATURE:**
```typescript
import { isChordInKey, parseChordName } from '@/lib/musicTheory';

const validateChord = (chordName: string) => {
  const parsed = parseChordName(chordName);
  const root = `${parsed.root}${getAccidentalSymbol(parsed.accidental)}`;
  
  const inKey = isChordInKey(root, projectKey, projectMode);
  
  if (!inKey) {
    // Show warning tooltip
    return {
      valid: true, // Chord is valid, just not diatonic
      warning: `${chordName} is not in ${projectKey} ${projectMode}. This may be intentional (borrowed chord, modulation, etc.)`
    };
  }
  
  return { valid: true, warning: null };
};
```

---

## 5. Adding Scale Display

### NEW Component: Scale Reference Panel

```typescript
import { getScaleNotes } from '@/lib/musicTheory';

export const ScaleReferencePanel = () => {
  const { projectKey, projectMode } = useProjectContext();
  const scaleNotes = getScaleNotes(projectKey, projectMode);
  
  return (
    <div className="scale-reference">
      <h3>{projectKey} {projectMode}</h3>
      <div className="scale-notes">
        {scaleNotes.map((note, i) => (
          <span key={i} className="scale-degree">
            {note} {i === 0 && '(tonic)'}
          </span>
        ))}
      </div>
    </div>
  );
};
```

---

## 6. Updating Metronome

### Metronome Engine (`metronome.ts`)

**BEFORE:**
```typescript
// Simple click on every beat
const clickInterval = 60 / bpm;
```

**AFTER:**
```typescript
import { 
  analyzeTimeSignature, 
  getMetronomeBeatPositions,
  getAccentLevel 
} from '@/lib/musicTheory';

class Metronome {
  private timeSignatureInfo: TimeSignatureInfo;
  
  setTimeSignature(num: number, denom: number, subdivision?: string) {
    this.timeSignatureInfo = analyzeTimeSignature(num, denom, subdivision);
  }
  
  tick(currentPosition: number) {
    const accentLevel = getAccentLevel(currentPosition, this.timeSignatureInfo);
    
    // Play click with appropriate volume
    const volume = accentLevel === 2 ? 1.0 :      // Downbeat
                   accentLevel === 1 ? 0.7 :      // Beat
                   0.4;                            // Subdivision
    
    const frequency = accentLevel === 2 ? 1000 :  // High for downbeat
                     accentLevel === 1 ? 800 :    // Medium for beats
                     600;                          // Lower for subdivisions
    
    this.playClick(frequency, volume);
  }
  
  getBeatDuration(): number {
    // Calculate based on grouping for irregular meters
    const { numerator, denominator } = this.timeSignatureInfo;
    const eighthNoteDuration = 60 / this.bpm / (denominator / 8);
    return eighthNoteDuration;
  }
}
```

---

## 7. Updating Project Creation

### CreateProjectDialog Component

**BEFORE:**
```typescript
// Mode was just metadata
<Select value={mode} onValueChange={setMode}>
  <SelectItem value="major">Major (Ionian)</SelectItem>
  <SelectItem value="minor">Minor (Aeolian)</SelectItem>
  {/* ... */}
</Select>
```

**AFTER:**
```typescript
import { SCALE_PATTERNS, getScaleNotes } from '@/lib/musicTheory';

const [key, setKey] = useState('C');
const [mode, setMode] = useState('major');

// Show preview of scale
const scaleNotes = getScaleNotes(key, mode);

<div className="key-signature-preview">
  <Select value={mode} onValueChange={setMode}>
    {Object.entries(SCALE_PATTERNS).map(([value, pattern]) => (
      <SelectItem key={value} value={value}>
        {pattern.description}
      </SelectItem>
    ))}
  </Select>
  
  <div className="scale-preview">
    Scale: {scaleNotes.join(' - ')}
  </div>
</div>
```

---

## 8. Adding Chord Suggestions

### NEW Feature: Smart Chord Suggestions

```typescript
import { getScaleNotes, buildChord, isChordInKey } from '@/lib/musicTheory';

const getChordSuggestions = (projectKey: string, projectMode: string) => {
  const scaleNotes = getScaleNotes(projectKey, projectMode);
  
  // Build triads on each scale degree
  const suggestions = scaleNotes.map((note, degree) => {
    // Determine quality based on scale intervals
    // I, IV, V = major
    // ii, iii, vi = minor in major scale
    // etc.
    
    const quality = getChordQualityForDegree(degree, projectMode);
    const notes = buildChord(note, quality, 'none', projectKey);
    
    return {
      name: `${note}${quality === 'minor' ? 'm' : ''}`,
      notes,
      degree: degree + 1,
      function: getChordFunction(degree, projectMode)
    };
  });
  
  return suggestions;
};

// Example usage in UI
const { projectKey, projectMode } = useProjectContext();
const suggestions = getChordSuggestions(projectKey, projectMode);

<div className="chord-palette">
  <h3>Suggested Chords for {projectKey} {projectMode}</h3>
  {suggestions.map(chord => (
    <button 
      key={chord.name}
      onClick={() => insertChord(chord.name)}
      className="chord-suggestion"
    >
      {chord.degree} - {chord.name}
      <span className="function">{chord.function}</span>
    </button>
  ))}
</div>
```

---

## 9. Type Updates

### Project Type

```typescript
// types/index.ts
export interface Project {
  // ... existing fields
  key: string;           // NEW: 'C', 'G', 'F#', etc.
  mode: string;          // NEW: 'major', 'dorian', etc. (was metadata before)
  timeSignature: {
    numerator: number;
    denominator: number;
    subdivision?: string; // NEW: For irregular meters
  };
}
```

### Chord Type

```typescript
export interface Chord {
  // ... existing fields
  validation?: {         // NEW: Optional validation info
    inKey: boolean;
    warning?: string;
  };
}
```

---

## 10. Context Updates

### ProjectContext

**Add key context:**
```typescript
// contexts/ProjectContext.tsx
interface ProjectContextType {
  // ... existing
  projectKey: string;
  projectMode: string;
  setProjectKey: (key: string) => void;
  setProjectMode: (mode: string) => void;
}
```

**Usage in components:**
```typescript
const { projectKey, projectMode } = useProjectContext();

// Now available everywhere for proper music theory calculations
```

---

## 11. Testing Your Changes

### Unit Tests

```typescript
import { render, screen } from '@testing-library/react';
import { getChordVoicing, buildChord } from '@/lib/musicTheory';

describe('ChordDiagram with new functions', () => {
  it('should display complex chord', () => {
    const voicing = getChordVoicing('Cmaj9', 'C');
    expect(voicing.piano.keys).toContain('C');
    expect(voicing.piano.keys).toContain('E');
    expect(voicing.piano.keys).toContain('G');
    expect(voicing.piano.keys).toContain('B');
    expect(voicing.piano.keys).toContain('D');
  });
});
```

### Integration Tests

```typescript
describe('Full transposition flow', () => {
  it('should transpose project correctly', () => {
    const project = {
      key: 'C',
      mode: 'major',
      chords: ['C', 'Dm', 'G7']
    };
    
    const transposed = transposeProject(project, 2); // Up 2 semitones
    
    expect(transposed.key).toBe('D');
    expect(transposed.chords).toContain('D');
    expect(transposed.chords).toContain('Em');
    expect(transposed.chords).toContain('A7');
  });
});
```

---

## 12. Common Pitfalls

### ❌ Don't Do This:
```typescript
// Direct database access
const notes = CHORD_DATABASE['Cmaj9'].piano.keys; // Will fail!
```

### ✅ Do This Instead:
```typescript
const voicing = getChordVoicing('Cmaj9', projectKey);
const notes = voicing.piano.keys; // Always works
```

---

### ❌ Don't Do This:
```typescript
// Transposing without key context
transposeNote('C', 6); // Missing key context!
```

### ✅ Do This Instead:
```typescript
transposeNote('C', 6, 'F#'); // Returns 'F#'
transposeNote('C', 6, 'Db'); // Returns 'Gb'
```

---

## 13. Rollout Strategy

### Phase 1: Non-Breaking Changes
1. ✅ Add `getChordVoicing()` alongside existing database
2. ✅ Update piano diagram to use new function
3. ✅ Test thoroughly

### Phase 2: New Features
1. Add scale display panel
2. Add chord validation warnings
3. Add metronome accent improvements

### Phase 3: Full Migration
1. Update all components to use new functions
2. Add key context to all chord operations
3. Implement chord suggestions

---

## Need Help?

See:
- [Music Theory Improvements Documentation](./MUSIC_THEORY_IMPROVEMENTS.md)
- [Music Theory Tests](../src/lib/musicTheory.test.ts)
- Original QA Report (provided by user)

Questions? Check the test suite for usage examples!
