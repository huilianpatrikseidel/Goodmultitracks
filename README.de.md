[English](./README.md) | [Português](./README.pt-br.md) | [Español](./README.es.md) | [Deutsch](./README.de.md) | [Italiano](./README.it.md) | [Français](./README.fr.md)

# GoodMultitracks

> **Hinweis:** Dieses Projekt befindet sich derzeit in einer **aktiven Entwicklungsphase (Alpha)**. Funktionen können sich ändern und Instabilität ist zu erwarten. Es gibt noch keine offizielle Veröffentlichungsversion.

**GoodMultitracks** ist ein Mehrspur-Audioplayer (Stems), der für pädagogische Zwecke entwickelt wurde: **Er ermöglicht Musikern, Songs tiefgehend unter Verwendung Ihrer Stems zu studieren.**

Im Gegensatz zu traditionellen DAWs, die auf Produktion ausgerichtet sind, liegt der Schwerpunkt hier auf **Lernen** und **Analyse**. Die Software verwendet eine robuste Musiktheorie-Engine, um das Audio mit harmonischen und rhythmischen Informationen zu kontextualisieren. Es dient Bands, Kirchenlobpreisgruppen und anderen Anwendungen.

## 🎯 Ziel und Vision

Die Kernidee ist es, ein Werkzeug bereitzustellen, mit dem der Musiker eine Mehrspur-Datei laden, Instrumente/Stems solo schalten, die Songstruktur verstehen und üben kann. All dies mit der Möglichkeit einer lokalen Installation, kostenlos, als Alternative zu Online-Multitrack-Streaming-Plattformen. Sie erstellen den Multitrack, erstellen eine einzelne Datei, die an die Band gesendet werden kann, und jeder genießt ein gutes Lernwerkzeug, 100% kostenlos und lokal, ohne Cloud-Dienste oder Telemetrie.

* **Aktuell:** Ein Mehrspur-Player zum Lernen, mit Wellenform-Visualisierung und theoretischer Analyse (Akkorde, Metriken).
* **Nahe Zukunft:** Ein vollständiger **VS Player (Virtual Soundcheck/Backing Tracks)** für den Live-Einsatz zu werden.

## 🚀 Hauptfunktionen

### Aktuell (In Entwicklung)
* **Mehrspur-Player (DAW-Stil):** Individuelle Lautstärke-, Solo- und Stummschaltungssteuerung für jede Spur/Stem.
* **Musikalische Intelligenz:** Erweitertes Musiktheorie-System, das Folgendes versteht und verarbeitet:
    * Harmonie und Akkorde.
    * Komplexe Metriken und Taktarten (Time Signatures).
    * Intelligente Transposition.
* **Instrumenten-Visualisierung:** Interaktive Diagramme für Gitarre, Klavier und Ukulele.
* **Setlist-Management:** Organisation von Songs zum Üben oder (in Zukunft) für Auftritte.
* **Aktuelle Umgebung:** Ausführung während der Entwicklung auf **Web (Browser)** fokussiert.
* **Builds:** Wir arbeiten noch nicht an Builds/Paketierung (Desktop/Mobile).
* **Geplante Plattformen:** Plattformübergreifendes Ziel — **Desktop (Windows, macOS, Linux)** und **Mobile (Android, iOS)**.

### Roadmap 🗺️
- [ ] Optimierung der Audio-Engine für niedrige Latenz.
- [ ] Dedizierter "Performance"-Modus für den Live-Einsatz als VS Player.
- [ ] Verbesserungen bei der Rhythmusraster-Erkennung und -Synchronisation (Grid).
- [ ] Erweiterte Unterstützung von Dateiformaten.
- [ ] Plattformübergreifende Paketierung (Desktop/Mobile) — Tauri/Capacitor.

## 🛠️ Verwendete Technologien

Das Projekt basiert auf einem modernen und leistungsfähigen Stack:

* **Kern:** [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Build-Tool:** [Vite](https://vitejs.dev/)
* (Vorerst keine nativen Packager — möglicherweise werden wir Tauri/Capacitor verwenden)
* **Styling:** Tailwind CSS.
* **Audio:** Web Audio API mit benutzerdefinierter Verarbeitung.

## 💻 Wie man das Projekt ausführt

Da das Projekt Open Source ist, können Sie es herunterladen, den Code studieren und auf Ihrem Computer ausführen.

### Voraussetzungen
* [Node.js](https://nodejs.org/) (Version 18 oder höher empfohlen)

### Schritt für Schritt

1.  **Repository klonen:**
    ```bash
    git clone https://github.com/dein-benutzername/goodmultitracks.git
    cd goodmultitracks
    ```

2.  **Abhängigkeiten installieren:**
    ```bash
    npm install
    ```

3.  **Im Browser ausführen (Web-Modus):**
    ```bash
    npm run dev
    ```
    Hinweis: Builds/Paketierung für Desktop/Mobile sind noch **nicht** aktiviert. Dieser Schritt wird hinzugefügt, wenn wir mit der plattformübergreifenden Unterstützung beginnen.

## 🤝 Wie man beiträgt

Beiträge sind sehr willkommen! Wenn Sie Entwickler (Front-End, TypeScript oder Kenntnisse in DSP/Audio und WebAssembly) oder Musiker mit Ideen für Funktionen sind:

1.  Forken Sie das Projekt.
2.  Erstellen Sie einen Branch für Ihr Feature (`git checkout -b feature/NeuesFeature`).
3.  Commiten Sie (`git commit -m 'Neues Feature hinzufügen'`).
4.  Pushen Sie (`git push origin feature/NeuesFeature`).
5.  Öffnen Sie einen Pull Request.

## 📄 Lizenz

Lizenziert unter **GNU GPL v2.0 (GPL-2.0-only)**. Siehe die Datei [LICENSE](./LICENSE) für den vollständigen Text.

---
*Entwickelt mit ❤️ von Huilian Patrik Seidel*
