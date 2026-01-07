// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
// Chord playback using Web Audio API
// MIGRATION NOTE: This module maintains backward compatibility with singleton pattern.
// For new code, use AudioContextProvider from contexts/AudioContextProvider.tsx

// Map note names to frequencies (A4 = 440Hz)
const noteFrequencies: Record<string, number> = {
  'C': 261.63,
  'C#': 277.18,
  'Db': 277.18,
  'D': 293.66,
  'D#': 311.13,
  'Eb': 311.13,
  'E': 329.63,
  'F': 349.23,
  'F#': 369.99,
  'Gb': 369.99,
  'G': 392.00,
  'G#': 415.30,
  'Ab': 415.30,
  'A': 440.00,
  'A#': 466.16,
  'Bb': 466.16,
  'B': 493.88,
};

// Create audio context (singleton)
// DEPRECATED: Use AudioContextProvider instead for new code
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Play a single note
 */
function playNote(frequency: number, duration: number, startTime: number, volume: number = 0.3): void {
  const ctx = getAudioContext();
  
  // Create oscillator for the note
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, startTime);
  
  // ADSR envelope for more natural sound
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01); // Attack
  gainNode.gain.exponentialRampToValueAtTime(volume * 0.7, startTime + 0.1); // Decay
  gainNode.gain.setValueAtTime(volume * 0.7, startTime + duration - 0.1); // Sustain
  gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration); // Release
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

/**
 * Play a chord (array of note names)
 */
export function playChord(notes: string[], duration: number = 1.5, volume: number = 0.25): void {
  const ctx = getAudioContext();
  const startTime = ctx.currentTime;
  
  // Play each note in the chord
  notes.forEach((note) => {
    const frequency = noteFrequencies[note];
    if (frequency) {
      playNote(frequency, duration, startTime, volume);
    }
  });
}

/**
 * Play guitar chord from fret positions
 * strings: array of 6 fret numbers, -1 means don't play that string
 * tuning: standard tuning ['E', 'A', 'D', 'G', 'B', 'E'] from low to high
 */
export function playGuitarChord(strings: number[], duration: number = 1.5): void {
  const standardTuning = ['E', 'A', 'D', 'G', 'B', 'E'];
  const notes: string[] = [];
  
  strings.forEach((fret, stringIndex) => {
    if (fret >= 0) {
      const openNote = standardTuning[stringIndex];
      const frequency = noteFrequencies[openNote];
      if (frequency) {
        // Calculate frequency for the fretted note
        const frettedFrequency = frequency * Math.pow(2, fret / 12);
        notes.push(openNote); // For simplicity, we use the note name (not entirely accurate for fretted notes)
      }
    }
  });
  
  // Play the notes
  const ctx = getAudioContext();
  const startTime = ctx.currentTime;
  
  strings.forEach((fret, stringIndex) => {
    if (fret >= 0) {
      const openNote = standardTuning[stringIndex];
      const frequency = noteFrequencies[openNote];
      if (frequency) {
        const frettedFrequency = frequency * Math.pow(2, fret / 12);
        playNote(frettedFrequency, duration, startTime + stringIndex * 0.03, 0.15);
      }
    }
  });
}

/**
 * Play ukulele chord from fret positions
 * strings: array of 4 fret numbers
 * tuning: standard tuning ['G', 'C', 'E', 'A'] from top to bottom
 */
export function playUkuleleChord(strings: number[], duration: number = 1.5): void {
  const standardTuning = ['G', 'C', 'E', 'A'];
  
  const ctx = getAudioContext();
  const startTime = ctx.currentTime;
  
  strings.forEach((fret, stringIndex) => {
    if (fret >= 0) {
      const openNote = standardTuning[stringIndex];
      const frequency = noteFrequencies[openNote];
      if (frequency) {
        const frettedFrequency = frequency * Math.pow(2, fret / 12);
        playNote(frettedFrequency, duration, startTime + stringIndex * 0.03, 0.2);
      }
    }
  });
}

