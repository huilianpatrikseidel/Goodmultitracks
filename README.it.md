[English](./README.md) | [Português](./README.pt-br.md) | [Español](./README.es.md) | [Deutsch](./README.de.md) | [Italiano](./README.it.md) | [Français](./README.fr.md)

# GoodMultitracks

> **Nota:** Questo progetto è attualmente in **fase di sviluppo attivo (Alpha)**. Le funzionalità potrebbero cambiare ed è prevista instabilità. Non esiste ancora una versione ufficiale di rilascio.

**GoodMultitracks** è un lettore audio multitraccia (stems) progettato con uno scopo educativo: **permettere ai musicisti di studiare le canzoni in profondità usando i tuoi stems.**

A differenza delle DAW tradizionali focalizzate sulla produzione, l'attenzione qui è sull'**apprendimento** e sull'**analisi**. Il software utilizza un robusto motore di teoria musicale per contestualizzare l'audio con informazioni armoniche e ritmiche. Serve a band, gruppi di lode in chiesa, tra le altre applicazioni.

## 🎯 Obiettivo e Visione

L'idea centrale è fornire uno strumento in cui il musicista possa caricare un file multitraccia, mettere in solo strumenti/stems, comprendere la struttura della canzone ed esercitarsi. Tutto questo con la possibilità di un'installazione locale, senza costi, essendo un'alternativa alle piattaforme di streaming multitraccia online. Fai il multitraccia, crei un unico file che può essere inviato alla band, e tutti godono di un buon strumento di studio, 100% gratuito e locale, senza servizi cloud o telemetria.

* **Attuale:** Un lettore multitraccia per lo studio, con visualizzazione della forma d'onda e analisi teorica (accordi, metriche).
* **Futuro Prossimo:** Diventare un completo **VS Player (Virtual Soundcheck/Backing Tracks)** per l'uso dal vivo.

## 🚀 Funzionalità Principali

### Attuali (In sviluppo)
* **Lettore Multitraccia (stile DAW):** Controllo individuale di volume, solo e mute per ogni traccia/stem.
* **Intelligenza Musicale:** Sistema avanzato di teoria musicale che comprende ed elabora:
    * Armonia e Accordi.
    * Metriche e Tempi (Time Signatures) complessi.
    * Trasposizione intelligente.
* **Visualizzazione Strumentale:** Diagrammi interattivi per Chitarra, Pianoforte e Ukulele.
* **Gestione Setlist:** Organizzazione delle canzoni per lo studio o (in futuro) per l'esibizione.
* **Ambiente attuale:** Esecuzione focalizzata su **Web (browser)** durante lo sviluppo.
* **Build:** Non stiamo ancora lavorando su build/pacchettizzazione (desktop/mobile).
* **Piattaforme previste:** Obiettivo multipiattaforma — **Desktop (Windows, macOS, Linux)** e **Mobile (Android, iOS)**.

### Roadmap 🗺️
- [ ] Ottimizzazione del motore audio per bassa latenza.
- [ ] Modalità "Performance" dedicata per l'uso come VS Player dal vivo.
- [ ] Miglioramenti nel rilevamento e sincronizzazione della griglia temporale (Grid).
- [ ] Supporto esteso ai formati di file.
- [ ] Pacchettizzazione multipiattaforma (Desktop/Mobile) — Tauri/Capacitor.

## 🛠️ Tecnologie Utilizzate

Il progetto è costruito su uno stack moderno e performante:

* **Core:** [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Build Tool:** [Vite](https://vitejs.dev/)
* (Nessun pacchettizzatore nativo per ora — possibilmente, utilizzeremo Tauri/Capacitor)
* **Stile:** Tailwind CSS.
* **Audio:** Web Audio API con elaborazione personalizzata.

## 💻 Come Eseguire il Progetto

Poiché il progetto è Open Source, puoi scaricarlo, studiare il codice ed eseguirlo sulla tua macchina.

### Prerequisiti
* [Node.js](https://nodejs.org/) (Versione 18 o superiore raccomandata)

### Passo dopo Passo

1.  **Clona il repository:**
    ```bash
    git clone https://github.com/tuo-username/goodmultitracks.git
    cd goodmultitracks
    ```

2.  **Installa le dipendenze:**
    ```bash
    npm install
    ```

3.  **Per eseguire nel browser (Modalità Web):**
    ```bash
    npm run dev
    ```
    Nota: le build/pacchettizzazione per Desktop/Mobile **non** sono ancora abilitate. Questo passaggio verrà aggiunto quando inizieremo il supporto multipiattaforma.

## 🤝 Come Contribuire

I contributi sono molto benvenuti! Se sei uno sviluppatore (Front-end, TypeScript, o capisci di DSP/Audio e WebAssembly) o un musicista con idee per funzionalità:

1.  Fai un Fork del progetto.
2.  Crea un Branch per la tua Feature (`git checkout -b feature/NuovaFunzionalita`).
3.  Fai il Commit (`git commit -m 'Aggiunta nuova funzionalità'`).
4.  Fai il Push (`git push origin feature/NuovaFunzionalita`).
5.  Apri una Pull Request.

## 📄 Licenza

Licenziato sotto **GNU GPL v2.0 (GPL-2.0-only)**. Consulta il file [LICENSE](./LICENSE) per il testo completo.

---
*Sviluppato con ❤️ da Huilian Patrik Seidel*
