# Music Theory Documentation

**Module:** Music Theory Engine  
**Version:** 3.0  
**Last Updated:** January 6, 2026

---

## 📚 Documentation Files

### Core Documentation

#### [API Reference](./MUSIC_THEORY_API_REFERENCE.md)
Complete API documentation for all music theory functions, types, and constants.

**Contents:**
- Core Functions (transposeNote, buildChord, getScaleNotes)
- Interval System
- Chord Construction
- Scale Generation
- Analysis Functions
- Type Definitions

**Audience:** Developers integrating the music theory engine

---

#### [Advanced Features](./MUSIC_THEORY_ADVANCED_FEATURES.md)
Documentation of advanced music theory capabilities.

**Contents:**
- Extended Harmonies (9ths, 11ths, 13ths, altered chords)
- Modal Scales (Dorian, Phrygian, Lydian, etc.)
- Jazz/Contemporary Features
- Theoretical Edge Cases

**Audience:** Advanced users, music theorists

---

### Implementation Guides

#### [Improvements](./MUSIC_THEORY_IMPROVEMENTS.md)
Overview of improvements from version 2.0 to 3.0.

**Contents:**
- Degree-Based Mathematics
- Enharmonic Spelling Accuracy
- Circle of Fifths Optimization
- Performance Enhancements

**Audience:** Developers, maintainers

---

#### [Migration Guide](./MUSIC_THEORY_MIGRATION.md)
Step-by-step guide for migrating from v2 to v3.

**Contents:**
- Breaking Changes
- API Updates
- Code Examples (Before/After)
- Deprecation Warnings

**Audience:** Developers upgrading existing code

---

### Voicing System

#### [Voicing Generation Implementation](./VOICING_GENERATION_IMPLEMENTATION.md)
Technical documentation of the algorithmic voicing engine.

**Contents:**
- Guitar Voicing Algorithm
- Piano Voicing Optimization
- Ukulele/Bass Voicing
- Playability Scoring
- Voice Leading

**Audience:** Developers, algorithm designers

---

#### [Voicing Algorithm Examples](./VOICING_ALGORITHM_EXAMPLES.md)
Practical examples and use cases for the voicing system.

**Contents:**
- Common Chord Voicings
- Alternative Tunings
- Voice Leading Examples
- Edge Cases

**Audience:** Musicians, developers

---

### Time Signature System

#### [Time Signature Implementation Summary](./TIME_SIGNATURE_IMPLEMENTATION_SUMMARY.md)
Complete documentation of the time signature analysis system.

**Contents:**
- Simple vs Compound Meters
- Irregular Meters (5/4, 7/8, etc.)
- Additive Time Signatures
- Tempo-Aware Analysis
- Irrational Meters

**Audience:** Developers, music theorists

---

#### [Time Signature Before/After](./TIME_SIGNATURE_BEFORE_AFTER.md)
Comparison of old vs new time signature implementation.

**Contents:**
- Problem Analysis
- Solution Design
- Performance Improvements
- Edge Case Handling

**Audience:** Maintainers, architects

---

## 🎯 Quick Reference

### Common Tasks

**Generate a Chord:**
```typescript
import { buildChord } from './lib/musicTheory/chords';
const cmaj7 = buildChord('C', 'maj7');
// → ['C', 'E', 'G', 'B']
```

**Transpose a Note:**
```typescript
import { transposeNote } from './lib/musicTheory/transposition';
const result = transposeNote('C', 'M3');
// → 'E'
```

**Get Scale Notes:**
```typescript
import { getScaleNotes } from './lib/musicTheory/scales';
const dMajor = getScaleNotes('D', 'major');
// → ['D', 'E', 'F#', 'G', 'A', 'B', 'C#']
```

**Generate Guitar Voicing:**
```typescript
import { generateGuitarVoicing } from './lib/musicTheory/voicings';
const voicing = generateGuitarVoicing(['G', 'B', 'D']);
// → { frets: [3, 2, 0, 0, 0, 3], fingers: [...] }
```

**Analyze Time Signature:**
```typescript
import { analyzeTimeSignature } from './lib/musicTheory/timeSignatures';
const sig = analyzeTimeSignature(6, 8);
// → { type: 'compound', beatUnit: 'dotted-quarter', beatsPerMeasure: 2 }
```

---

## 🔗 Related Documentation

- [Module Architecture](../../src/lib/musicTheory/ARCHITECTURE.md) - Internal structure
- [Module README](../../src/lib/musicTheory/README.md) - Quick overview
- [QA Reports](../qa-reports/) - Quality assurance audits

---

## 📊 Feature Matrix

| Feature | Basic | Advanced | Expert |
|---------|-------|----------|--------|
| Major/Minor Scales | ✅ | ✅ | ✅ |
| Modal Scales | ✅ | ✅ | ✅ |
| Triads | ✅ | ✅ | ✅ |
| 7th Chords | ✅ | ✅ | ✅ |
| Extended Chords (9, 11, 13) | ❌ | ✅ | ✅ |
| Altered Dominants | ❌ | ✅ | ✅ |
| Double Sharps/Flats | ❌ | ✅ | ✅ |
| Guitar Voicings | ✅ | ✅ | ✅ |
| Alternative Tunings | ❌ | ✅ | ✅ |
| Voice Leading | ❌ | ✅ | ✅ |
| Irregular Meters | ❌ | ✅ | ✅ |

---

**Module Status:** Production Ready ✅  
**Test Coverage:** Comprehensive  
**Maintenance:** Active
