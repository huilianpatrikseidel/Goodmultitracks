# Bravura Music Font - Guia de Implementação

## Visão Geral

A fonte **Bravura** foi implementada no projeto para renderização profissional de elementos musicais. Bravura é uma fonte de notação musical de código aberto desenvolvida pela Steinberg que implementa o padrão SMuFL (Standard Music Font Layout).

**Os arquivos da fonte estão armazenados localmente** em `src/fonts/bravura/` para garantir disponibilidade offline e controle de versão.

## Características

- ✅ Fonte de notação musical profissional
- ✅ Compatível com SMuFL (Standard Music Font Layout)
- ✅ Renderização de alta qualidade para símbolos musicais
- ✅ **Arquivos locais** - sem dependência de CDN externo
- ✅ Componentes React prontos para uso
- ✅ Utilitários TypeScript para conversão de símbolos

## Arquivos de Fonte

### Localização
Os arquivos da fonte estão em: **`src/fonts/bravura/`**

### Arquivos Incluídos
- `Bravura.otf` (500 KB) - Fonte principal OpenType
- `Bravura.woff` (944 KB) - Fonte Web Open Font Format
- `BravuraText.otf` (1.2 MB) - Fonte de texto OpenType
- `BravuraText.woff` (3.9 MB) - Fonte de texto WOFF
- `LICENSE.txt` - Licença SIL OFL 1.1
- `README.md` - Informações sobre a fonte

## Arquivos Criados

### 1. CSS da Fonte
**Arquivo:** `src/assets/fonts/bravura-font.css`

Define a fonte Bravura e classes utilitárias para notação musical:
- `.music-notation` - Aplica a fonte Bravura a elementos musicais
- `.music-text` - Aplica a fonte BravuraText
- Classes específicas para símbolos (`.sharp-symbol`, `.flat-symbol`, etc.)

### 2. Utilitários TypeScript
**Arquivo:** `src/lib/bravuraUtils.ts`

Exporta:
- `BravuraSymbols` - Objeto com todos os codepoints SMuFL
- `toBravuraAccidental()` - Converte símbolos Unicode padrão para Bravura
- `formatNoteWithBravura()` - Formata notas musicais com acidentes
- `formatChordWithBravura()` - Formata acordes com acidentes
- `toBravuraTimeSignature()` - Converte fórmulas de compasso

### 3. Componentes React
**Arquivo:** `src/components/BravuraComponents.tsx`

Componentes prontos para uso:
- `<MusicNotation>` - Wrapper para aplicar fonte Bravura
- `<Accidental>` - Exibe acidentes musicais
- `<NoteName>` - Exibe nomes de notas com acidentes
- `<ChordSymbol>` - Exibe símbolos de acordes
- `<TimeSignature>` - Exibe fórmulas de compasso
- `<Clef>` - Exibe claves musicais

## Como Usar

### 1. Símbolos Musicais Diretos

```tsx
import { BravuraSymbols } from '../lib/bravuraUtils';

// Sustenido
<span className="music-notation">{BravuraSymbols.accidentalSharp}</span>

// Bemol
<span className="music-notation">{BravuraSymbols.accidentalFlat}</span>

// Bequadro
<span className="music-notation">{BravuraSymbols.accidentalNatural}</span>
```

### 2. Componentes React

```tsx
import { NoteName, ChordSymbol, Accidental, TimeSignature } from '../components/BravuraComponents';

// Exibir uma nota
<NoteName note="C#" />

// Exibir um acorde
<ChordSymbol chord="Fm7" />

// Exibir um acidente
<Accidental type="sharp" />

// Exibir fórmula de compasso
<TimeSignature numerator={4} denominator={4} />
```

### 3. Utilitários para Formatação

```typescript
import { formatNoteWithBravura, formatChordWithBravura } from '../lib/bravuraUtils';

// Formatar nota
const { note, accidental } = formatNoteWithBravura('C#');
// note = 'C', accidental = '\uE262' (sharp em Bravura)

// Formatar acorde
const { root, accidental, quality } = formatChordWithBravura('Gm7');
// root = 'G', accidental = undefined, quality = 'm7'
```

### 4. Classe CSS Direta

```tsx
// Aplicar fonte Bravura a qualquer elemento
<div className="music-notation">
  {/* Conteúdo com símbolos musicais */}
</div>
```

## Símbolos Disponíveis

### Acidentes
- `accidentalSharp` (♯) - Sustenido
- `accidentalFlat` (♭) - Bemol  
- `accidentalNatural` (♮) - Bequadro
- `accidentalDoubleSharp` (𝄪) - Dobrado sustenido
- `accidentalDoubleFlat` (𝄫) - Dobrado bemol

### Claves
- `gClef` - Clave de Sol
- `fClef` - Clave de Fá
- `cClef` - Clave de Dó

### Figuras Musicais
- `noteWhole` - Semibreve
- `noteHalfUp`/`noteHalfDown` - Mínima
- `noteQuarterUp`/`noteQuarterDown` - Semínima
- `note8thUp`/`note8thDown` - Colcheia
- `note16thUp`/`note16thDown` - Semicolcheia

### Pausas
- `restWhole` - Pausa de semibreve
- `restHalf` - Pausa de mínima
- `restQuarter` - Pausa de semínima
- `rest8th` - Pausa de colcheia
- `rest16th` - Pausa de semicolcheia

### Fórmulas de Compasso
- `timeSig0` até `timeSig9` - Dígitos
- `timeSigCommon` - Compasso comum (C)
- `timeSigCutCommon` - Compasso cortado (¢)

### Dinâmicas
- `dynamicPiano` (p)
- `dynamicMezzo` (m)
- `dynamicForte` (f)
- `dynamicSforzando` (sf)

## Componentes Atualizados

Os seguintes componentes foram atualizados para usar a fonte Bravura:

1. **CreateProjectDialog** - Seletores de acidentes na configuração de tonalidade
2. **TimelineEditorDialog** - Editor de acordes e notas baixo
3. **musicTheory/chords.ts** - Constantes ACCIDENTALS

## Integração no Projeto

A fonte é carregada automaticamente via CDN no arquivo `main.tsx`:

```tsx
import "./assets/fonts/bravura-font.css";
```

## Referências

- [Bravura GitHub](https://github.com/steinbergmedia/bravura)
- [SMuFL Specification](https://www.smufl.org/)
- [Bravura NPM Package](https://www.npmjs.com/package/@smufl/bravura)

## Licença

Bravura é licenciada sob a **SIL Open Font License 1.1**, permitindo uso livre em projetos comerciais e não-comerciais.

## Exemplos Visuais

### Antes (Unicode padrão)
```
C♯ D♭ E♮
```

### Depois (Bravura)
```
C𝄪 D𝄫 E♮  (com renderização profissional SMuFL)
```

A diferença visual é significativa - os símbolos Bravura são desenhados especificamente para notação musical, com alinhamento, peso e proporções otimizadas.
