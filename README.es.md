[English](./README.md) | [Português](./README.pt-br.md) | [Español](./README.es.md) | [Deutsch](./README.de.md) | [Italiano](./README.it.md) | [Français](./README.fr.md)

# GoodMultitracks

> **Nota:** Este proyecto se encuentra actualmente en **fase activa de desarrollo (Alfa)**. Las funcionalidades pueden cambiar y se espera cierta inestabilidad. Aún no hay una versión oficial de lanzamiento.

**GoodMultitracks** es un reproductor de audio multipista (stems) diseñado con un propósito educativo: **permitir a los músicos estudiar canciones profundamente usando tus stems.**

A diferencia de los DAWs tradicionales enfocados en la producción, el enfoque aquí es el **aprendizaje** y el **análisis**. El software utiliza un motor robusto de teoría musical para contextualizar el audio con información armónica y rítmica. Sirve para bandas, grupos de alabanza de iglesias, entre otras aplicaciones.

## 🎯 Objetivo y Visión

La idea central es proporcionar una herramienta donde el músico pueda cargar un archivo multipista, solear instrumentos/stems, comprender la estructura de la canción y practicar. Todo esto con la posibilidad de una instalación local, sin costo, siendo una alternativa a las plataformas de streaming de multipistas online. Haces el multitrack, creas un único archivo que se puede enviar a la banda, y todos disfrutan de una buena herramienta de estudio, 100% gratuita y local, sin servicios en la nube ni telemetría.

* **Actual:** Un reproductor multipista para estudio, con visualización de formas de onda e análisis teórico (acordes, métricas).
* **Futuro Próximo:** Convertirse en un **Reproductor VS (Virtual Soundcheck/Backing Tracks)** completo para uso en vivo.

## 🚀 Funcionalidades Principales

### Actuales (En desarrollo)
* **Reproductor Multipista (estilo DAW):** Control individual de volumen, solo y silencio (mute) para cada pista/stem.
* **Inteligencia Musical:** Sistema avanzado de teoría musical que comprende y procesa:
    * Armonía y Acordes.
    * Métricas y Fórmulas de Compás (Time Signatures) complejas.
    * Transposición inteligente.
* **Visualización Instrumental:** Diagramas interactivos para Guitarra, Piano y Ukelele.
* **Gestión de Setlist:** Organización de canciones para estudio o (en el futuro) actuación.
* **Entorno actual:** Ejecución enfocada en **Web (navegador)** durante el desarrollo.
* **Compilaciones:** Aún no estamos trabajando en compilaciones/empaquetado (escritorio/móvil).
* **Plataformas previstas:** Objetivo multiplataforma — **Escritorio (Windows, macOS, Linux)** y **Móvil (Android, iOS)**.

### Hoja de Ruta (Roadmap) 🗺️
- [ ] Optimización del motor de audio para baja latencia.
- [ ] Modo "Performance" dedicado para uso como Reproductor VS en vivo.
- [ ] Mejoras en la detección y sincronización de cuadrículas de tiempo (Grid).
- [ ] Soporte expandido a formatos de archivo.
- [ ] Empaquetado multiplataforma (Escritorio/Móvil) — Tauri/Capacitor.

## 🛠️ Tecnologías Utilizadas

El proyecto está construido sobre una pila moderna y de alto rendimiento:

* **Core:** [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Herramienta de Construcción:** [Vite](https://vitejs.dev/)
* (Sin empaquetadores nativos por ahora — posiblemente, utilizaremos Tauri/Capacitor)
* **Estilos:** Tailwind CSS.
* **Audio:** Web Audio API con procesamiento personalizado.

## 💻 Cómo Ejecutar el Proyecto

Dado que el proyecto es Open Source, puedes descargar, estudiar el código y ejecutarlo en tu máquina.

### Requisitos Previos
* [Node.js](https://nodejs.org/) (Versión 18 o superior recomendada)

### Paso a Paso

1.  **Clona el repositorio:**
    ```bash
    git clone https://github.com/tu-usuario/goodmultitracks.git
    cd goodmultitracks
    ```

2.  **Instala las dependencias:**
    ```bash
    npm install
    ```

3.  **Para ejecutar en el navegador (Modo Web):**
    ```bash
    npm run dev
    ```
    Nota: las compilaciones/empaquetado para Escritorio/Móvil aún **no** están habilitadas. Este paso se agregará cuando comencemos el soporte multiplataforma.

## 🤝 Cómo Contribuir

¡Las contribuciones son muy bienvenidas! Si eres desarrollador (Front-end, TypeScript, o entiendes de DSP/Audio y WebAssembly) o músico con ideas de funcionalidades:

1.  Haz un Fork del proyecto.
2.  Crea una Branch para tu Feature (`git checkout -b feature/NuevaFuncionalidad`).
3.  Haz el Commit (`git commit -m 'Agregando nueva funcionalidad'`).
4.  Haz el Push (`git push origin feature/NuevaFuncionalidad`).
5.  Abre un Pull Request.

## 📄 Licencia

Licenciado bajo **GNU GPL v2.0 (GPL-2.0-only)**. Consulta el archivo [LICENSE](./LICENSE) para el texto completo.

---
*Desarrollado con ❤️ por Huilian Patrik Seidel*
