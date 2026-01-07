# Architecture Documentation

**Project:** GoodMultitracks  
**Last Updated:** January 6, 2026

---

## 📚 Documentation Files

### [Architectural Refactoring](./ARCHITECTURAL_REFACTORING.md)
Major architectural changes and refactoring efforts.

**Contents:**
- Modular Architecture
- Component Separation
- State Management
- Performance Optimizations
- Code Organization

**Audience:** Senior developers, architects

---

### [Advanced Features Summary](./ADVANCED_FEATURES_SUMMARY.md)
Overview of all advanced features in the application.

**Contents:**
- Music Theory Engine
- Bravura Integration
- Player Controls
- Performance Mode
- Voicing System
- Time Signature Analysis

**Audience:** Product managers, developers

---

### [Versioning](./VERSIONING.md)
Version control and release management strategy.

**Contents:**
- Semantic Versioning
- Build Numbers
- Release Process
- Change Logs
- Breaking Changes

**Audience:** Release managers, maintainers

---

### [Time Standards](./TIME_STANDARD.md)
Standards for time handling across the application.

**Contents:**
- Time Representation
- Tempo Handling
- BPM Calculations
- Synchronization
- Audio/Visual Alignment

**Audience:** Audio engineers, developers

---

## 🏗️ System Architecture

### High-Level Overview

```
GoodMultitracks/
│
├── Frontend (React + TypeScript)
│   ├── Features/
│   │   ├── Player (Audio playback)
│   │   ├── Library (Song management)
│   │   └── Setlist (Performance mode)
│   │
│   ├── Components/ (UI components)
│   ├── Stores/ (State management)
│   └── Services/ (Business logic)
│
├── Music Theory Engine
│   ├── Core (Intervals, notes)
│   ├── Scales (Scale generation)
│   ├── Chords (Chord building)
│   ├── Analysis (Harmonic analysis)
│   ├── Voicings (Instrument voicings)
│   └── Time Signatures (Meter analysis)
│
├── Audio Engine
│   ├── Web Audio API integration
│   ├── Multi-track mixing
│   ├── Effects processing
│   └── Audio Workers
│
└── Backend (Tauri/Rust)
    ├── File system access
    ├── Audio file parsing
    └── Native integrations
```

---

## 🎯 Design Principles

### 1. **Modularity**
- Each module has a single, well-defined responsibility
- Loose coupling between modules
- Clear interfaces and contracts

### 2. **Performance**
- Lazy loading of heavy components
- Web Workers for intensive tasks
- Optimized rendering (React.memo, useMemo)
- Virtual scrolling for large lists

### 3. **Type Safety**
- TypeScript throughout
- Strict type checking enabled
- Comprehensive type definitions
- Runtime validation for external data

### 4. **Testability**
- Unit tests for business logic
- Integration tests for features
- Component tests for UI
- Mock services for testing

### 5. **Maintainability**
- Clear code organization
- Comprehensive documentation
- Consistent naming conventions
- Code review process

---

## 📦 Key Modules

### Music Theory Engine
**Location:** `src/lib/musicTheory/`  
**Responsibility:** All music theory calculations  
**Dependencies:** None (pure TypeScript)  
**Status:** Production ready

### Player Feature
**Location:** `src/features/player/`  
**Responsibility:** Audio playback and controls  
**Dependencies:** Web Audio API, Music Theory  
**Status:** Active development

### Library Feature
**Location:** `src/features/library/`  
**Responsibility:** Song organization and metadata  
**Dependencies:** Tauri backend  
**Status:** Production ready

### Setlist Feature
**Location:** `src/features/setlist/`  
**Responsibility:** Performance mode and live features  
**Dependencies:** Player, Library  
**Status:** Production ready

---

## 🔄 State Management

### Store Architecture
Using Zustand for state management:

```typescript
// Centralized stores
- playerStore (playback state)
- libraryStore (songs, metadata)
- setlistStore (performance state)
- settingsStore (user preferences)
```

### State Flow
```
User Action → Component → Store Action → State Update → Re-render
```

---

## 🚀 Performance Optimizations

### 1. **Code Splitting**
- Route-based splitting
- Dynamic imports for heavy features
- Lazy loading of non-critical components

### 2. **Asset Optimization**
- WOFF2 font formats
- Compressed images
- SVG for icons
- Tree-shaking unused code

### 3. **Rendering Optimization**
- React.memo for expensive components
- useMemo for heavy calculations
- useCallback for stable references
- Virtual scrolling (windowing)

### 4. **Audio Processing**
- Web Workers for audio analysis
- OfflineAudioContext for preprocessing
- Efficient buffer management

---

## 🔗 Related Documentation

- [Music Theory](../music-theory/) - Music theory engine docs
- [Bravura](../bravura/) - Music notation font
- [QA Reports](../qa-reports/) - Quality assurance
- [Player LOD Improvements](../../src/features/player/LOD_IMPROVEMENTS.md)
- [Development Guidelines](../../src/guidelines/Guidelines.md)

---

## 📊 Technology Stack

### Frontend
- **Framework:** React 18
- **Language:** TypeScript 5
- **Build Tool:** Vite
- **UI Library:** Radix UI
- **Styling:** Tailwind CSS
- **State:** Zustand
- **Audio:** Web Audio API

### Backend
- **Framework:** Tauri
- **Language:** Rust
- **Platform:** Desktop (Windows, macOS, Linux)

### Testing
- **Framework:** Vitest (planned)
- **E2E:** Playwright (planned)
- **Coverage:** Target 80%+

---

## 🛠️ Build & Deployment

### Development
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
```

### Desktop App
```bash
npm run tauri dev    # Tauri development mode
npm run tauri build  # Build desktop app
```

---

**Architecture Status:** Stable ✅  
**Last Major Refactor:** January 6, 2026  
**Next Review:** Q2 2026
