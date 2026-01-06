# Arquitetura da Biblioteca Music Theory

## 📊 Diagrama de Módulos

```
┌─────────────────────────────────────────────────────────────────┐
│                     musicTheory (index.ts)                      │
│                   Ponto de Entrada Principal                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ├─────────────────────────┐
                             │                         │
                             ▼                         ▼
        ┌────────────────────────────┐  ┌──────────────────────────┐
        │      core.ts               │  │   database.ts            │
        │  - IntervalObject          │  │  - CHORD_DATABASE        │
        │  - INTERVAL_DEFINITIONS    │  │  - ROOT_NOTES            │
        │  - parseNoteComponents()   │  │  - Fingerings (preset)   │
        │  - getAccidentalString()   │  └──────────────────────────┘
        └────────────┬───────────────┘
                     │
           ┌─────────┼─────────┐
           │         │         │
           ▼         ▼         ▼
┌──────────────┐ ┌─────────┐ ┌────────────────┐
│transposition │ │ chords  │ │    scales      │
│    .ts       │ │  .ts    │ │     .ts        │
├──────────────┤ ├─────────┤ ├────────────────┤
│transposeNote │ │buildChord│ │getScaleNotes   │
│transposeKey  │ │parseChord│ │isChordInKey    │
│              │ │genChord  │ │SCALE_PATTERNS  │
└──────────────┘ └─────┬───┘ └────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │   voicings.ts   │
              ├─────────────────┤
              │getChordVoicing  │
              │generateGuitar   │
              │generateUkulele  │
              │optimizePiano    │
              └─────────────────┘

┌────────────────────────────┐
│   timeSignatures.ts        │
├────────────────────────────┤
│analyzeTimeSignature        │
│getSubdivisionPresets       │
│TIME_SIG_PRESETS            │
└────────────────────────────┘
```

## 🔗 Dependências Entre Módulos

```
core.ts (fundação - sem dependências)
  ↓
  ├→ transposition.ts (usa core)
  │     ↓
  ├→ scales.ts (usa core + transposition)
  │     ↓
  └→ chords.ts (usa core + transposition)
        ↓
        └→ voicings.ts (usa chords + database)

database.ts (independente)
timeSignatures.ts (independente)
```

## 📦 Responsabilidades por Módulo

### **core.ts** - Fundação Matemática
```typescript
// Define os conceitos fundamentais
- IntervalObject interface
- 25 intervalos canônicos (P1, M2, M3, P4, P5, M6, M7, P8, 9, 11, 13)
- Funções de parse de notas
- Conversão de valores para símbolos
```

### **transposition.ts** - Motor de Cálculo
```typescript
// Lógica de transposição com precisão enarmônica
- transposeNote(): Degree Math (diatônico + cromático)
- transposeKey(): Compatibilidade legacy
```

### **chords.ts** - Construção de Acordes
```typescript
// Define e constrói acordes
- CHORD_INTERVALS: 40+ tipos (triads, 7ths, 9ths, 11ths, 13ths)
- buildChord(): Constrói usando intervalos
- parseChordName(): "Am7/G" → componentes
- generateChordName(): Componentes → string
```

### **scales.ts** - Escalas e Tonalidades
```typescript
// Gera escalas e analisa relações tonais
- SCALE_PATTERNS: 10 escalas/modos
- getScaleNotes(): Gera notas de escala
- isChordInKey(): Verifica pertinência tonal
```

### **database.ts** - Dados Estáticos
```typescript
// Fingerings pré-definidos para instrumentos
- CHORD_DATABASE: 30+ acordes com posições
- Estrutura: { guitar, piano, ukulele }
```

### **timeSignatures.ts** - Análise Rítmica
```typescript
// Classificação e análise de compassos
- analyzeTimeSignature(): Simples/Composto/Irregular
- getSubdivisionPresets(): Sugestões de subdivisão
- TIME_SIG_PRESETS: Compassos comuns
```

### **voicings.ts** - Voicings de Instrumentos
```typescript
// Gera e otimiza voicings
- getChordVoicing(): Combina buildChord + database
- generateGuitarVoicing(): Placeholder para algoritmo
- generateUkuleleVoicing(): Placeholder
- optimizePianoVoicing(): Placeholder
```

## 🎯 Fluxo de Dados Típico

### Exemplo 1: Construir Acorde F# Major
```
User Input: buildChord('F#', '')
    ↓
chords.ts: CHORD_INTERVALS[''] = [P1, M3, P5]
    ↓
transposition.ts: transposeNote('F#', P1) → 'F#'
transposition.ts: transposeNote('F#', M3) → 'A#' ✓
transposition.ts: transposeNote('F#', P5) → 'C#'
    ↓
core.ts: degree calculation + semitone adjustment
    ↓
Result: ['F#', 'A#', 'C#']
```

### Exemplo 2: Obter Voicing de Acorde
```
User Input: getChordVoicing('Am7')
    ↓
voicings.ts: parseChordName('Am7')
    ↓
chords.ts: { root: 'A', quality: 'minor', extension: '7' }
    ↓
voicings.ts: buildChord('A', 'm7')
    ↓
chords.ts: CHORD_INTERVALS['m7'] = [P1, m3, P5, m7]
    ↓
transposition.ts: ['A', 'C', 'E', 'G']
    ↓
database.ts: CHORD_DATABASE lookup
    ↓
Result: {
  notes: ['A', 'C', 'E', 'G'],
  guitar: { frets: [-1, 0, 2, 0, 1, 0] },
  piano: { keys: ['A', 'C', 'E', 'G'] }
}
```

## 🔄 Comparação: Antes vs Depois

### Antes (musicTheory.ts monolítico)
```
❌ 735 linhas em 1 arquivo
❌ Responsabilidades misturadas
❌ Difícil encontrar código específico
❌ Import de tudo mesmo usando pouco
❌ Difícil testar isoladamente
```

### Depois (musicTheory/ modular)
```
✅ 9 arquivos especializados (~100 linhas cada)
✅ Responsabilidades separadas e claras
✅ Fácil navegar e manter
✅ Tree-shaking otimizado
✅ Testes modulares independentes
✅ Documentação por módulo
```

## 📈 Métricas

| Módulo            | Linhas | Exports | Imports de |
|-------------------|--------|---------|------------|
| core.ts           | 103    | 7       | -          |
| transposition.ts  | 75     | 2       | core       |
| chords.ts         | 185    | 8       | core, trans|
| scales.ts         | 125    | 3       | core, trans|
| database.ts       | 53     | 2       | -          |
| timeSignatures.ts | 95     | 7       | -          |
| voicings.ts       | 78     | 4       | chords, db |
| index.ts          | 47     | all     | all        |
| **Total**         | **761**| **33**  | -          |

## 🎓 Guia de Extensão

### Adicionar Nova Escala
1. Abrir `scales.ts`
2. Adicionar em `SCALE_PATTERNS`:
```typescript
'bebop': [
  INTERVAL_DEFINITIONS.P1,
  INTERVAL_DEFINITIONS.M2,
  // ...
]
```

### Adicionar Novo Tipo de Acorde
1. Abrir `chords.ts`
2. Adicionar em `CHORD_INTERVALS`:
```typescript
'sus#4': [
  INTERVAL_DEFINITIONS.P1,
  INTERVAL_DEFINITIONS.A4,
  INTERVAL_DEFINITIONS.P5
]
```

### Adicionar Fingerings
1. Abrir `database.ts`
2. Adicionar em `CHORD_DATABASE`:
```typescript
'Caug': {
  guitar: { frets: [...], fingers: [...] },
  piano: { keys: ['C', 'E', 'G#'] },
  ukulele: { frets: [...] }
}
```

## 🚀 Performance

- **Build size**: ~172KB (player-feature bundle)
- **Tree-shaking**: Import apenas módulos usados
- **No dependencies**: Biblioteca standalone
- **TypeScript**: Type-safe em 100%
