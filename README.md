[English](./README.md) | [Português](./README.pt-br.md) | [Español](./README.es.md) | [Deutsch](./README.de.md) | [Italiano](./README.it.md) | [Français](./README.fr.md)

# GoodMultitracks

> **Note:** This project is currently in **active development phase (Alpha)**. Features may change and instability is expected. There is no official release version yet.

**GoodMultitracks** is a multitrack audio player (stems) designed with an educational purpose: **allowing musicians to study songs deeply through track separation.**

Unlike traditional DAWs focused on production, the focus here is on **learning** and **analysis**. The software uses a robust music theory engine to contextualize audio with harmonic and rhythmic information.

## 🎯 Objective and Vision

The core idea is to provide a tool where the musician can load a multitrack file, isolate instruments, understand the song structure, and practice.

* **Current:** A multitrack player for study, with waveform visualization and theoretical analysis (chords, metrics).
* **Near Future:** To become a complete **VS Player (Virtual Soundcheck/Backing Tracks)** for live use.

## 🚀 Main Features

### Current (In development)
* **Multitrack Player (DAW-style):** Individual volume, solo, and mute control for each track (stem).
* **Musical Intelligence:** Advanced music theory system that understands and processes:
    * Harmony and Chords.
    * Complex Metrics and Time Signatures.
    * Intelligent transposition.
* **Instrument Visualization:** Interactive diagrams for Guitar, Piano, and Ukulele.
* **Setlist Management:** Organization of songs for study or (in the future) performance.
* **Current Environment:** Execution focused on **Web (browser)** during development.
* **Builds:** We are not yet working on builds/packaging (desktop/mobile).
* **Planned Platforms:** Cross-platform target — **Desktop (Windows, macOS, Linux)** and **Mobile (Android, iOS)**.

### Roadmap 🗺️
- [ ] Audio engine optimization for low latency.
- [ ] Dedicated "Performance" mode for live VS Player use.
- [ ] Improvements in grid detection and synchronization.
- [ ] Expanded file format support.
- [ ] Cross-platform packaging (Desktop/Mobile) — Tauri/Capacitor.

## 🛠️ Technologies Used

The project is built on a modern and performant stack:

* **Core:** [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Build Tool:** [Vite](https://vitejs.dev/)
* (No native packagers for now — desktop/mobile support will be defined in the future.)
* **Styling:** Tailwind CSS.
* **Audio:** Web Audio API with custom processing.

## 💻 How to Run the Project

Since the project is Open Source, you can download, study the code, and run it on your machine.

### Prerequisites
* [Node.js](https://nodejs.org/) (Version 18 or higher recommended)

### Step by Step

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/goodmultitracks.git
    cd goodmultitracks
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **To run in browser (Web Mode):**
    ```bash
    npm run dev
    ```
    Note: builds/packaging for Desktop/Mobile are **not** yet enabled. This step will be added when we start cross-platform support.

## 🤝 How to Contribute

Contributions are very welcome! If you are a developer (Front-end, TypeScript, or understand DSP/Audio) or a musician with feature ideas:

1.  Fork the project.
2.  Create a Branch for your Feature (`git checkout -b feature/NewFeature`).
3.  Commit (`git commit -m 'Adding new feature'`).
4.  Push (`git push origin feature/NewFeature`).
5.  Open a Pull Request.

## 📄 License

Licensed under **GNU GPL v2.0 (GPL-2.0-only)**. See the [LICENSE](./LICENSE) file for the full text.

---
*Developed with ❤️ by Huilian Patrik Seidel*
