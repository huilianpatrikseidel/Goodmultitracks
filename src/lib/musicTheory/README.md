# Music Theory Library

Uma biblioteca modular de teoria musical com precisão enarmônica usando matemática baseada em graus (Degree Math).

## 📁 Arquitetura Modular

```
src/lib/musicTheory/
├── index.ts              # Ponto de entrada principal (re-exports)
├── core.ts               # Tipos fundamentais e definições de intervalos
├── transposition.ts      # Motor de transposição com precisão enarmônica
├── chords.ts             # Construção e análise de acordes
├── scales.ts             # Geração de escalas e análise de tonalidades
├── database.ts           # Fingerings pré-definidos (violão/piano/ukulele)
├── timeSignatures.ts     # Análise de fórmulas de compasso
└── voicings.ts           # Voicings específicos por instrumento
```

## 🎯 Características Principais

### ✅ Precisão Enarmônica
- **E#** vs **F** - contexto correto
- **B#** vs **C** - contexto correto  
- **Cb** vs **B** - contexto correto
- Dobrados sustenidos (x, ##) e dobrados bemóis (bb)

### ✅ Matemática Baseada em Graus
Usa sistema de coordenadas dual:
- **Eixo Diatônico** (degree): Define a letra (C→E sempre é uma 3ª)
- **Eixo Cromático** (semitones): Define o acidental necessário

## 📖 Uso

### Import Completo
```typescript
import { 
  transposeNote, 
  buildChord, 
  getScaleNotes 
} from './lib/musicTheory';
```

### Import Modular (recomendado para tree-shaking)
```typescript
import { transposeNote } from './lib/musicTheory/transposition';
import { buildChord } from './lib/musicTheory/chords';
import { getScaleNotes } from './lib/musicTheory/scales';
```

## 🎵 Exemplos

### Transposição
```typescript
import { transposeNote } from './lib/musicTheory/transposition';

transposeNote('F#', 'M7');  // → 'E#' ✓ (não F)
transposeNote('C', 'M3');   // → 'E'
transposeNote('C#', 'M3');  // → 'E#' ✓ (não F)
```

### Construção de Acordes
```typescript
import { buildChord } from './lib/musicTheory/chords';

buildChord('F#', '');        // → ['F#', 'A#', 'C#'] ✓
buildChord('C#', 'dim7');    // → ['C#', 'E', 'G', 'Bb']
buildChord('B#', 'maj7');    // → ['B#', 'Dx', 'Fx', 'Ax']
buildChord('C', 'm7');       // → ['C', 'Eb', 'G', 'Bb']
```

### Geração de Escalas
```typescript
import { getScaleNotes } from './lib/musicTheory/scales';

getScaleNotes('F#', 'major');
// → ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#'] ✓

getScaleNotes('C', 'dorian');
// → ['C', 'D', 'Eb', 'F', 'G', 'A', 'Bb']

getScaleNotes('A', 'harmonic-minor');
// → ['A', 'B', 'C', 'D', 'E', 'F', 'G#']
```

### Análise de Tonalidade
```typescript
import { isChordInKey } from './lib/musicTheory/scales';

isChordInKey('D', 'C', 'major');  // → true (D é o ii em C maior)
isChordInKey('Db', 'C', 'major'); // → false
```

### Voicings de Instrumentos
```typescript
import { getChordVoicing } from './lib/musicTheory/voicings';

const voicing = getChordVoicing('Cmaj7');
// {
//   notes: ['C', 'E', 'G', 'B'],
//   guitar: { frets: [...], fingers: [...] },
//   piano: { keys: ['C', 'E', 'G', 'B'] },
//   ukulele: { frets: [...], fingers: [...] }
// }
```

## 📚 Módulos Detalhados

### 1. **core.ts** - Fundação
- `IntervalObject` - Interface padrão para intervalos
- `INTERVAL_DEFINITIONS` - 25 intervalos canônicos
- `parseNoteComponents()` - Parse de notas (C#4 → componentes)
- `getAccidentalString()` - Converte valor para símbolo

### 2. **transposition.ts** - Motor de Transposição
- `transposeNote()` - Transposição com precisão enarmônica
- `transposeKey()` - Transposição legacy (mantém sufixos de acordes)

### 3. **chords.ts** - Acordes
- `buildChord()` - Constrói acordes a partir de intervalos
- `CHORD_INTERVALS` - 40+ tipos de acordes
- `parseChordName()` - Parse "Am7/G" → componentes
- `generateChordName()` - Componentes → "Am7/G"

### 4. **scales.ts** - Escalas
- `getScaleNotes()` - Gera notas de escala
- `SCALE_PATTERNS` - 10 escalas/modos
- `isChordInKey()` - Verifica se acorde está na tonalidade

### 5. **database.ts** - Fingerings
- `CHORD_DATABASE` - Posições para violão/piano/ukulele
- Fingerings para acordes maiores, menores, e variações

### 6. **timeSignatures.ts** - Compasso
- `analyzeTimeSignature()` - Classifica simples/composto/irregular
- `getSubdivisionPresets()` - Sugestões de subdivisão
- Tipos: `TimeSignatureInfo`, `NoteValue`

### 7. **voicings.ts** - Voicings
- `getChordVoicing()` - Retorna notas + fingerings
- `generateGuitarVoicing()` - Placeholder para geração
- `generateUkuleleVoicing()` - Placeholder para ukulele
- `optimizePianoVoicing()` - Placeholder para piano

## 🔧 Tipos Exportados

```typescript
// Core
type IntervalObject = {
  id: string;
  semitones: number;
  degree: number;
  quality: 'P' | 'M' | 'm' | 'A' | 'd';
}

// Chords
type ParsedChord = {
  root: string;
  accidental: string;
  quality: string;
  extension: string;
  bassNote: string;
}

// Time Signatures
type TimeSignatureType = 'simple' | 'compound' | 'irregular';
type NoteValue = 'whole' | 'half' | 'quarter' | 'eighth' | ...;
```

## ✅ Advanced Features

### Algorithmic Voicing Generation (NEW!)

**Full Implementation:**
- ✅ **ANY chord** - Exotic chords (C#sus4add9, Ebmaj7#11, etc.)
- ✅ **Alternative tunings** - Drop D, DADGAD, Open G, Half-Step Down, etc.
- ✅ **Playability scoring** - Finger stretch, barre complexity, muted strings
- ✅ **Voice leading** - Smooth transitions between chords
- ✅ **Database optimization** - Fast lookup for common chords (95% use cases)

**Example Usage:**
```typescript
import { generateGuitarVoicing, GUITAR_TUNINGS, buildChord } from './musicTheory';

// Exotic chord (algorithmic generation)
const notes = buildChord('C#', 'sus4');
const voicing = generateGuitarVoicing([...notes, 'D#'], {
  tuning: GUITAR_TUNINGS['drop-d'],
  bassNote: 'C#',
  maxFret: 12
});
// → { frets: [...], fingers: [...], startFret: ... }

// Common chord (database fallback - faster)
const cMajor = generateGuitarVoicing(['C', 'E', 'G']);
// → { frets: [-1, 3, 2, 0, 1, 0], ... } // Instant lookup
```

**Algorithm Details:** See [voicings.ts](src/lib/musicTheory/voicings.ts) implementation.

## 🧪 Testes

```bash
# Testes de enarmonia
npx vitest run src/lib/musicTheory.enharmonic.test.ts

# Build de produção
npm run build
```

## 📝 Escalas Suportadas

- **Major / Minor** (natural)
- **Harmonic Minor**
- **Melodic Minor** (ascending/descending)
- **Modos Gregos**: Dorian, Phrygian, Lydian, Mixolydian, Locrian

## 🎸 Acordes Suportados

### Tríades
- Major, Minor, Diminished, Augmented
- Sus2, Sus4

### Sétimas
- Dominant 7th (7)
- Major 7th (maj7)
- Minor 7th (m7)
- Diminished 7th (dim7)
- Half-Diminished (m7b5)
- Augmented 7th (aug7)
- Minor-Major 7th (mMaj7)

### Extensões
- 9th, maj9, m9, 7b9, 7#9
- 11th, 7#11, maj7#11
- 13th, maj13, m13, 7b13

### Add Chords
- add9, madd9, 6, m6, 6/9

## 🔄 Compatibilidade

A API antiga continua funcionando através de `src/lib/musicTheory.ts` que re-exporta todos os módulos. Código existente não precisa ser modificado.

## 🚀 Vantagens da Arquitetura Modular

1. **Tree-shaking** - Import apenas o necessário
2. **Manutenibilidade** - Responsabilidades separadas
3. **Testabilidade** - Módulos independentes
4. **Extensibilidade** - Fácil adicionar novos recursos
5. **Documentação** - Cada módulo auto-documentado

## 📄 Licença

Parte do projeto GoodMultitracks.
