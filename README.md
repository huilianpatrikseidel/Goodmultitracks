# GoodMultitracks

**Advanced Multi-track Music Player with Music Theory Engine**

This is the GoodMultitracks application - a sophisticated multi-track audio player with integrated music theory analysis, chord voicing generation, and professional music notation support.

Original design: https://www.figma.com/design/ZDQjWeW8cUemVb6PJxWywL/GoodMultitracks

---

## 🚀 Quick Start

### Installation
```bash
npm install
```

### Development
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run preview      # Preview production build
```

### Desktop App (Tauri)
```bash
npm run tauri dev    # Development mode
npm run tauri build  # Build desktop app
```

---

## 📚 Documentation

**Complete documentation is organized in the [`docs/`](./docs/) directory:**

### 📖 [Documentation Index](./docs/README.md)
Start here for a complete overview of all documentation.

### Quick Links

#### 🎵 Music Theory
- [API Reference](./docs/music-theory/MUSIC_THEORY_API_REFERENCE.md) - Complete API docs
- [Advanced Features](./docs/music-theory/MUSIC_THEORY_ADVANCED_FEATURES.md) - Advanced capabilities
- [Module Overview](./src/lib/musicTheory/README.md) - Quick overview

#### 🎼 Bravura Music Font
- [Implementation Guide](./docs/bravura/BRAVURA_IMPLEMENTATION.md) - Integration details
- [Quick Start](./docs/bravura/BRAVURA_README.md) - Getting started

#### 🏗️ Architecture
- [System Architecture](./docs/architecture/ARCHITECTURAL_REFACTORING.md) - Design & structure
- [Advanced Features](./docs/architecture/ADVANCED_FEATURES_SUMMARY.md) - Feature overview

#### 🔍 Quality Assurance
- [QA Reports](./docs/qa-reports/) - Audit reports and testing
- [Latest QA Summary](./docs/qa-reports/MUSIC_THEORY_QA_SUMMARY.md) - Recent audit

---

## ✨ Key Features

### 🎵 Music Theory Engine
- Complete scale and chord generation
- Advanced interval analysis
- Guitar/piano/ukulele voicings
- Alternative tunings support
- Voice leading optimization
- Time signature analysis (simple, compound, irregular)

### 🎼 Professional Music Notation
- Bravura SMuFL font integration
- Chord symbol rendering
- Music notation symbols
- Interactive chord diagrams

### 🎧 Audio Player
- Multi-track audio playback
- Independent track volume control
- Real-time audio effects
- Synchronized playback
- Performance mode

### 📚 Library Management
- Song organization
- Metadata management
- Setlist creation
- Search and filtering

---

## 🛠️ Technology Stack

- **Frontend:** React 18 + TypeScript 5
- **Build Tool:** Vite
- **UI:** Radix UI + Tailwind CSS
- **State:** Zustand
- **Audio:** Web Audio API
- **Desktop:** Tauri (Rust)
- **Music Font:** Bravura SMuFL

---

## 📦 Project Structure

```
GoodMultitracks/
├── docs/                    # 📚 Complete documentation
│   ├── music-theory/        # Music theory engine docs
│   ├── bravura/            # Music notation font docs
│   ├── architecture/       # System architecture docs
│   └── qa-reports/         # Quality assurance reports
│
├── src/
│   ├── features/           # Feature modules
│   │   ├── player/         # Audio player
│   │   ├── library/        # Library management
│   │   └── setlist/        # Performance mode
│   │
│   ├── lib/
│   │   └── musicTheory/    # 🎵 Music theory engine
│   │
│   ├── components/         # React components
│   ├── stores/            # State management
│   └── services/          # Business logic
│
└── src-tauri/             # Tauri backend (Rust)
```

---

## 🎯 Getting Started for Developers

1. **Clone and install:**
   ```bash
   git clone <repository-url>
   cd GoodMultitracks
   npm install
   ```

2. **Read the docs:**
   - Start with [Documentation Index](./docs/README.md)
   - Review [Music Theory API](./docs/music-theory/MUSIC_THEORY_API_REFERENCE.md)
   - Check [Development Guidelines](./src/guidelines/Guidelines.md)

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Explore the codebase:**
   - Music theory: `src/lib/musicTheory/`
   - Player feature: `src/features/player/`
   - Components: `src/components/`

---

## 🧪 Testing

```bash
# Run tests (when vitest is installed)
npm test

# Run specific test suite
npm test src/lib/musicTheory/__tests__/qa-verification.test.ts
```

---

## 📄 License

[Add your license here]

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Read the [Documentation](./docs/README.md)
2. Follow [Development Guidelines](./src/guidelines/Guidelines.md)
3. Write tests for new features
4. Update documentation

---

## 📞 Support

[Add support information here]

---

**Version:** 3.0  
**Last Updated:** January 6, 2026  
**Status:** Active Development

  