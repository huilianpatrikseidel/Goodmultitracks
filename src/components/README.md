# Components Directory Structure

This directory contains all React components organized by functionality.

## 📁 Directory Organization

### `/demos` - Demo Components
Demonstration and example components:
- `BravuraDemo.tsx` - Music notation font demonstrations
- `ChordAnalysisDemo.tsx` - Chord analysis examples

### `/diagrams` - Interactive Music Diagrams
Interactive instrument diagrams for music notation:
- `ChordDiagram.tsx` - Chord diagram viewer
- `InteractiveGuitarDiagram.tsx` - Guitar fretboard editor
- `InteractivePianoDiagram.tsx` - Piano keyboard editor
- `InteractiveUkuleleDiagram.tsx` - Ukulele fretboard editor

### `/layout` - Layout Components
Application layout and structural components

### `/music` - Music Notation Components
Music notation and display components:
- `BravuraComponents.tsx` - Bravura font music notation components

### `/player` - Player Components
Audio player related components:
- `PlaybackControls.tsx` - Playback control UI
- `PlayerViewSettings.tsx` - Player view configuration
- `TrackListSidebar.tsx` - Track list sidebar
- `ScrollZoomSlider.tsx` - Zoom control
- `VerticalScrollbar.tsx` - Custom scrollbar
- `NotesPanel.tsx` - Notes display panel
- `TrackNotesDialog.tsx` - Track notes editor
- `TrackTagSelector.tsx` - Track tag selector
- `TimelineEditorDialog.tsx` - Timeline/chord editor

### `/shared` - Shared Components
Reusable components used across features:
- `KeyboardShortcutsHelp.tsx` - Keyboard shortcuts help
- `LoadingScreen.tsx` - Loading screen

### `/ui` - UI Primitives
Base UI components (shadcn/ui):
- Buttons, inputs, dialogs, cards, etc.
- Low-level reusable UI elements

## 📝 Import Examples

```typescript
// Import from specific category
import { ChordDiagram, InteractiveGuitarDiagram } from '@/components/diagrams';
import { PlaybackControls, PlayerViewSettings } from '@/components/player';
import { MusicNotation, Accidental } from '@/components/music';

// Import UI primitives
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
```

## ✨ Benefits

- **Clear organization** - Components grouped by functionality
- **Easy discovery** - Find components based on their purpose
- **Better imports** - Use index files for cleaner imports
- **Scalability** - Easy to add new components in the right place
- **Maintainability** - Reduced coupling, clear dependencies
