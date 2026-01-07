/**
 * useChordVoicing Hook
 * 
 * Hook para geração inteligente de voicings de acordes.
 * Combina database pré-definido com algoritmos de geração dinâmica.
 * 
 * Strategy:
 * 1. Tenta buscar no CHORD_DATABASE (fingerings pré-definidos)
 * 2. Se não encontrar, gera dinamicamente com algoritmos
 * 3. Permite customização (afinação, tamanho de mão, etc.)
 * 
 * @example
 * const voicing = useChordVoicing('Cmaj7', 'guitar', { 
 *   tuning: 'standard',
 *   handSize: 'medium'
 * });
 */

import { useMemo } from 'react';
import {
  parseChordName,
  buildChord,
  getChordVoicing,
  generateGuitarVoicing,
  generateUkuleleVoicing,
  optimizePianoVoicing,
  generatePianoVoicing10th,
  CHORD_DATABASE,
  GUITAR_TUNINGS,
  type HandSize,
} from '../lib/musicTheory';

export type InstrumentType = 'guitar' | 'piano' | 'ukulele';

export interface VoicingOptions {
  /** Guitar tuning (default: 'standard') */
  tuning?: keyof typeof GUITAR_TUNINGS | 'standard';
  /** Hand size for piano voicings (default: 'medium') */
  handSize?: HandSize;
  /** Starting fret for guitar (default: 0) */
  startFret?: number;
  /** Prefer open voicings (default: false) */
  preferOpen?: boolean;
  /** Maximum stretch in frets (guitar) */
  maxStretch?: number;
  /** Piano voicing style */
  pianoStyle?: 'compact' | 'tenth' | 'rootless';
}

export interface GuitarVoicing {
  frets: number[];
  fingers?: number[];
  startFret?: number;
  tuning: string;
}

export interface PianoVoicing {
  keys: string[];
  leftHand?: string[];
  rightHand?: string[];
}

export interface UkuleleVoicing {
  frets: number[];
  fingers?: number[];
  startFret?: number;
}

export interface ChordVoicing {
  notes: string[];
  guitar?: GuitarVoicing;
  piano?: PianoVoicing;
  ukulele?: UkuleleVoicing;
  source: 'database' | 'generated';
}

/**
 * Hook for intelligent chord voicing generation
 */
export function useChordVoicing(
  chord: string,
  instrument: InstrumentType,
  options: VoicingOptions = {}
): ChordVoicing | null {
  const {
    tuning = 'standard',
    handSize = 'medium',
    startFret = 0,
    preferOpen = false,
    maxStretch = 4,
    pianoStyle = 'compact',
  } = options;

  return useMemo(() => {
    // Parse chord name
    const parsed = parseChordName(chord);
    if (!parsed) {
      console.warn(`[useChordVoicing] Failed to parse chord: ${chord}`);
      return null;
    }

    // Build chord notes
    const quality = parsed.quality === 'major' ? '' : parsed.quality;
    const extension = parsed.extension === 'none' ? '' : parsed.extension;
    const chordType = quality + extension;
    const notes = buildChord(parsed.root, chordType);

    // Try database first
    const databaseVoicing = CHORD_DATABASE[chord];

    // If database has voicing for this instrument, use it
    if (databaseVoicing) {
      const result: ChordVoicing = {
        notes,
        source: 'database',
      };

      if (instrument === 'guitar' && databaseVoicing.guitar) {
        result.guitar = {
          ...databaseVoicing.guitar,
          tuning: tuning as string,
        };
      }

      if (instrument === 'piano' && databaseVoicing.piano) {
        result.piano = databaseVoicing.piano;
      }

      if (instrument === 'ukulele' && databaseVoicing.ukulele) {
        result.ukulele = databaseVoicing.ukulele;
      }

      // If database has the voicing, return it
      if (result.guitar || result.piano || result.ukulele) {
        return result;
      }
    }

    // Otherwise, generate dynamically
    const result: ChordVoicing = {
      notes,
      source: 'generated',
    };

    try {
      switch (instrument) {
        case 'guitar': {
          const tuningName = tuning === 'standard' ? 'standard' : tuning;
          const tuningArray = GUITAR_TUNINGS[tuningName];

          if (!tuningArray) {
            console.warn(`[useChordVoicing] Unknown tuning: ${tuning}`);
            return null;
          }

          const generated = generateGuitarVoicing(notes, {
            tuning: tuningArray,
            maxFret: startFret + maxStretch,
            preferredPosition: startFret,
          });

          if (generated) {
            result.guitar = {
              ...generated,
              tuning: tuningName,
            };
          }
          break;
        }

        case 'piano': {
          if (pianoStyle === 'tenth') {
            const voicing = generatePianoVoicing10th(notes);
            result.piano = {
              keys: [...voicing.leftHand, ...voicing.rightHand],
              leftHand: voicing.leftHand,
              rightHand: voicing.rightHand,
            };
          } else if (pianoStyle === 'rootless') {
            // Rootless voicing (omit root, common in jazz)
            const rootlessNotes = notes.slice(1);
            const midpoint = Math.floor(rootlessNotes.length / 2);
            result.piano = {
              keys: rootlessNotes,
              leftHand: rootlessNotes.slice(0, midpoint),
              rightHand: rootlessNotes.slice(midpoint),
            };
          } else {
            const voicing = optimizePianoVoicing(notes);
            const midpoint = Math.floor(voicing.keys.length / 2);
            result.piano = {
              keys: voicing.keys,
              leftHand: voicing.keys.slice(0, midpoint),
              rightHand: voicing.keys.slice(midpoint),
            };
          }
          break;
        }

        case 'ukulele': {
          const generated = generateUkuleleVoicing(notes);
          if (generated) {
            result.ukulele = generated;
          }
          break;
        }
      }
    } catch (error) {
      console.error(`[useChordVoicing] Error generating voicing:`, error);
      return null;
    }

    return result;
  }, [chord, instrument, tuning, handSize, startFret, preferOpen, maxStretch, pianoStyle]);
}

/**
 * Hook variant that returns voicings for all instruments at once
 */
export function useChordVoicings(
  chord: string,
  options: VoicingOptions = {}
): {
  guitar: ChordVoicing | null;
  piano: ChordVoicing | null;
  ukulele: ChordVoicing | null;
} {
  const guitar = useChordVoicing(chord, 'guitar', options);
  const piano = useChordVoicing(chord, 'piano', options);
  const ukulele = useChordVoicing(chord, 'ukulele', options);

  return { guitar, piano, ukulele };
}
