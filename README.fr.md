[English](./README.md) | [Português](./README.pt-br.md) | [Español](./README.es.md) | [Deutsch](./README.de.md) | [Italiano](./README.it.md) | [Français](./README.fr.md)

# GoodMultitracks

> **Remarque :** Ce projet est actuellement en **phase de développement actif (Alpha)**. Les fonctionnalités peuvent changer et une instabilité est à prévoir. Il n'y a pas encore de version officielle.

**GoodMultitracks** est un lecteur audio multipiste (stems) conçu dans un but éducatif : **permettre aux musiciens d'étudier les chansons en profondeur grâce à la séparation des pistes.**

Contrairement aux DAW traditionnels axés sur la production, l'accent est mis ici sur **l'apprentissage** et **l'analyse**. Le logiciel utilise un moteur de théorie musicale robuste pour contextualiser l'audio avec des informations harmoniques et rythmiques. Il sert aux groupes, aux groupes de louange d'église, entre autres applications.

## 🎯 Objectif et Vision

L'idée centrale est de fournir un outil où le musicien peut charger un fichier multipiste, isoler des instruments, comprendre la structure de la chanson et s'entraîner. Tout cela avec la possibilité d'une installation locale, sans frais, constituant une alternative aux plateformes de streaming multipistes en ligne. Vous faites le multipiste, créez un fichier unique qui peut être envoyé au groupe, et tout le monde profite d'un bon outil d'étude, 100% gratuit et local, sans services cloud ni télémétrie.

* **Actuel :** Un lecteur multipiste pour l'étude, avec visualisation de la forme d'onde et analyse théorique (accords, métriques).
* **Proche Avenir :** Devenir un **Lecteur VS (Virtual Soundcheck/Backing Tracks)** complet pour une utilisation en direct.

## 🚀 Fonctionnalités Principales

### Actuelles (En développement)
* **Lecteur Multipiste (style DAW) :** Contrôle individuel du volume, solo et sourdine (mute) pour chaque piste (stem).
* **Intelligence Musicale :** Système avancé de théorie musicale qui comprend et traite :
    * Harmonie et Accords.
    * Métriques et Signatures Temporelles (Time Signatures) complexes.
    * Transposition intelligente.
* **Visualisation Instrumentale :** Diagrammes interactifs pour Guitare, Piano et Ukulélé.
* **Gestion de Setlist :** Organisation des chansons pour l'étude ou (à l'avenir) la performance.
* **Environnement actuel :** Exécution axée sur le **Web (navigateur)** pendant le développement.
* **Builds :** Nous ne travaillons pas encore sur les builds/packaging (bureau/mobile).
* **Plateformes prévues :** Cible multiplateforme — **Bureau (Windows, macOS, Linux)** et **Mobile (Android, iOS)**.

### Feuille de Route (Roadmap) 🗺️
- [ ] Optimisation du moteur audio pour une faible latence.
- [ ] Mode "Performance" dédié pour une utilisation comme Lecteur VS en direct.
- [ ] Améliorations de la détection et de la synchronisation de la grille temporelle (Grid).
- [ ] Prise en charge étendue des formats de fichiers.
- [ ] Packaging multiplateforme (Bureau/Mobile) — Tauri/Capacitor.

## 🛠️ Technologies Utilisées

Le projet est construit sur une pile moderne et performante :

* **Cœur :** [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Outil de Build :** [Vite](https://vitejs.dev/)
* (Pas d'empaqueteurs natifs pour l'instant — possiblement, nous utiliserons Tauri/Capacitor)
* **Style :** Tailwind CSS.
* **Audio :** API Web Audio avec traitement personnalisé.

## 💻 Comment Exécuter le Projet

Puisque le projet est Open Source, vous pouvez le télécharger, étudier le code et l'exécuter sur votre machine.

### Prérequis
* [Node.js](https://nodejs.org/) (Version 18 ou supérieure recommandée)

### Étape par Étape

1.  **Cloner le dépôt :**
    ```bash
    git clone https://github.com/votre-utilisateur/goodmultitracks.git
    cd goodmultitracks
    ```

2.  **Installer les dépendances :**
    ```bash
    npm install
    ```

3.  **Pour exécuter dans le navigateur (Mode Web) :**
    ```bash
    npm run dev
    ```
    Remarque : les builds/packaging pour Bureau/Mobile ne sont **pas** encore activés. Cette étape sera ajoutée lorsque nous commencerons le support multiplateforme.

## 🤝 Comment Contribuer

Les contributions sont les bienvenues ! Si vous êtes développeur (Front-end, TypeScript, ou comprenez le DSP/Audio et WebAssembly) ou musicien avec des idées de fonctionnalités :

1.  Faites un Fork du projet.
2.  Créez une Branche pour votre Fonctionnalité (`git checkout -b feature/NouvelleFonctionnalite`).
3.  Commitez (`git commit -m 'Ajout de nouvelle fonctionnalité'`).
4.  Pushez (`git push origin feature/NouvelleFonctionnalite`).
5.  Ouvrez une Pull Request.

## 📄 Licence

Licencié sous **GNU GPL v2.0 (GPL-2.0-only)**. Consultez le fichier [LICENSE](./LICENSE) pour le texte complet.

---
*Développé avec ❤️ par Huilian Patrik Seidel*
