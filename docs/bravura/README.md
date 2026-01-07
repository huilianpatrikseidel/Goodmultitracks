# Bravura Music Font Documentation

**Font:** Bravura SMuFL  
**Version:** 1.392  
**Provider:** Steinberg  
**Last Updated:** January 6, 2026

---

## 📚 Documentation Files

### [Bravura Implementation Guide](./BRAVURA_IMPLEMENTATION.md)
Complete guide to integrating Bravura music notation font.

**Contents:**
- Font Installation
- Symbol Mapping
- Component Integration
- Chord Diagram Rendering
- Performance Optimization

**Audience:** Developers implementing music notation

---

### [Local Structure](./BRAVURA_LOCAL_STRUCTURE.md)
Organization of local Bravura font files and assets.

**Contents:**
- File Structure
- Font Formats (WOFF2, TTF, OTF)
- Metadata Files
- CSS Integration

**Audience:** Build engineers, maintainers

---

### [Complete Reference](./BRAVURA_LOCAL_COMPLETE.md)
Comprehensive reference for all Bravura features.

**Contents:**
- Full Symbol Catalog
- Chord Symbol Mapping
- Accidental Rendering
- Dynamic Marks
- Articulations

**Audience:** Designers, advanced users

---

### [Quick Start](./BRAVURA_README.md)
Quick start guide for using Bravura in the application.

**Contents:**
- Basic Setup
- Common Use Cases
- Troubleshooting
- Examples

**Audience:** New developers

---

## 🎼 SMuFL (Standard Music Font Layout)

Bravura implements the SMuFL standard for music notation fonts:

- **Clefs:** Treble, Bass, Alto, Tenor
- **Notes:** Whole, Half, Quarter, Eighth, etc.
- **Accidentals:** ♯, ♭, ♮, 𝄪 (double sharp), 𝄫 (double flat)
- **Articulations:** Staccato, Accent, Tenuto, Marcato
- **Dynamics:** pp, p, mp, mf, f, ff
- **Time Signatures:** All common and compound meters
- **Chord Symbols:** Complete jazz/contemporary notation

---

## 🚀 Quick Start

### 1. Import Bravura Component
```typescript
import { BravuraSymbols } from '@/lib/bravuraUtils';
```

### 2. Render Accidentals
```typescript
const sharp = BravuraSymbols.sharp;      // '♯'
const flat = BravuraSymbols.flat;        // '♭'
const natural = BravuraSymbols.natural;  // '♮'
const doubleSharp = BravuraSymbols.doubleSharp; // '𝄪'
const doubleFlat = BravuraSymbols.doubleFlat;   // '𝄫'
```

### 3. Render Chord Symbols
```typescript
import { formatChordSymbol } from '@/lib/bravuraUtils';

const chord = formatChordSymbol('Cmaj7');
// Renders with proper music notation symbols
```

### 4. Use in Components
```tsx
import { BravuraChordSymbol } from '@/components/BravuraComponents';

<BravuraChordSymbol chord="Dmaj7" size="large" />
```

---

## 📦 Font Files

Located in: `src/fonts/bravura/`

```
bravura/
├── Bravura.woff2          # Web font (primary)
├── Bravura.ttf            # TrueType (fallback)
├── Bravura.otf            # OpenType (desktop)
├── bravura_metadata.json  # SMuFL metadata
└── README.md              # Font-specific docs
```

---

## 🎨 CSS Integration

The Bravura font is loaded via CSS:

```css
@font-face {
  font-family: 'Bravura';
  src: url('/fonts/bravura/Bravura.woff2') format('woff2'),
       url('/fonts/bravura/Bravura.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

.bravura-text {
  font-family: 'Bravura', serif;
  font-feature-settings: 'liga' on, 'calt' on;
}
```

---

## 🔧 Common Use Cases

### Chord Diagrams
```typescript
import { InteractiveGuitarDiagram } from '@/components';

<InteractiveGuitarDiagram 
  chord="Cmaj7"
  showBravuraSymbols={true}
/>
```

### Lead Sheets
```typescript
import { ChordSymbol } from '@/components';

<ChordSymbol 
  root="C"
  quality="maj7"
  bass="E"  // Slash chord
  useBravura={true}
/>
```

### Time Signatures
```typescript
import { TimeSignatureDisplay } from '@/components';

<TimeSignatureDisplay 
  numerator={6}
  denominator={8}
  useBravura={true}
/>
```

---

## 🔗 Related Documentation

- [Font Files](../../src/fonts/bravura/README.md) - Font directory documentation
- [Bravura Components](../../src/components/BravuraComponents.tsx) - React components
- [Music Theory](../music-theory/) - Music theory integration

---

## 📚 External Resources

- [SMuFL Specification](https://w3c.github.io/smufl/latest/)
- [Bravura Font Family](https://www.smufl.org/fonts/)
- [Steinberg Documentation](https://steinberg.github.io/bravura/)

---

## ⚠️ License

Bravura is licensed under the SIL Open Font License 1.1
- ✅ Free to use commercially
- ✅ Can be modified
- ✅ Can be redistributed
- ❌ Font name cannot be reused without modification

---

**Status:** Production Ready ✅  
**Performance:** Optimized WOFF2 format  
**Browser Support:** All modern browsers
