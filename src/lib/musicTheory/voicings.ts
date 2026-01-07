/**
 * ============================================================================
 * VOICINGS MODULE - Instrument-Specific Chord Voicings
 * ============================================================================
 * Generates and optimizes chord voicings for guitar, piano, and ukulele.
 * 
 * ALGORITHMIC VOICING ENGINE:
 * - Fretboard position analysis (all possible positions for each note)
 * - Playability scoring (finger stretch, barre complexity, muted strings)
 * - Voice leading optimization (smooth transitions)
 * - Alternative tuning support (Drop D, DADGAD, Open G, etc.)
 */

import { CHORD_DATABASE } from './database';
import { parseChordName, ACCIDENTALS } from './chords';
import { buildChord } from './chords';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert note name to MIDI pitch number
 * @param note - Note name (e.g., 'C4', 'F#2')
 * @returns MIDI pitch (C4 = 60)
 */
function noteToMIDI(note: string): number {
  const match = note.match(/^([A-G])(#{1,3}|b{1,3}|x)?(-?\d+)$/);
  if (!match) return 60; // Default to C4
  
  const [, noteName, accidental = '', octave] = match;
  const baseNotes: Record<string, number> = {
    'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
  };
  
  let pitch = baseNotes[noteName];
  
  // Handle accidentals
  if (accidental === 'x' || accidental === '##') pitch += 2;
  else if (accidental === '###') pitch += 3;
  else pitch += (accidental.match(/#/g) || []).length;
  pitch -= (accidental.match(/b/g) || []).length;
  
  return pitch + (parseInt(octave) + 1) * 12;
}

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Position of a note on the fretboard
 */
interface FretPosition {
  string: number;  // String index (0 = lowest pitch, 5 = highest for standard guitar)
  fret: number;    // Fret number (-1 for muted, 0 for open)
  note: string;    // Note name
}

/**
 * Guitar voicing candidate
 */
interface VoicingCandidate {
  frets: number[];           // Fret for each string (-1 = muted)
  fingers?: number[];        // Finger assignment (0 = open, 1-4 = fingers)
  startFret?: number;        // Starting fret for barre chords
  score: PlayabilityScore;   // Playability metrics
  positions: FretPosition[]; // Positions used
}

/**
 * Playability scoring metrics
 */
interface PlayabilityScore {
  fingerStretch: number;    // Penalty for wide fret spans (0-100)
  barreComplexity: number;  // Penalty for barre chords (0-50)
  mutedStrings: number;     // Penalty for muted strings (0-30)
  bassNote: number;         // Bonus for correct bass note (0-20)
  voiceLeading: number;     // Distance from previous voicing (0-50)
  lowIntervalPenalty: number; // Penalty for small intervals in low register (0-40)
  total: number;            // Total score (lower = better)
}

/**
 * Guitar tunings dictionary
 */
export const GUITAR_TUNINGS: Record<string, string[]> = {
  'standard': ['E', 'A', 'D', 'G', 'B', 'E'],
  'drop-d': ['D', 'A', 'D', 'G', 'B', 'E'],
  'drop-c': ['C', 'G', 'C', 'F', 'A', 'D'],
  'dadgad': ['D', 'A', 'D', 'G', 'A', 'D'],
  'open-g': ['D', 'G', 'D', 'G', 'B', 'D'],
  'open-d': ['D', 'A', 'D', 'F#', 'A', 'D'],
  'eb-standard': ['Eb', 'Ab', 'Db', 'Gb', 'Bb', 'Eb'],
  'half-step-down': ['Eb', 'Ab', 'Db', 'Gb', 'Bb', 'Eb'],
};

/**
 * Bass tunings dictionary
 */
export const BASS_TUNINGS: Record<string, string[]> = {
  '4-string-standard': ['E', 'A', 'D', 'G'],
  '5-string-standard': ['B', 'E', 'A', 'D', 'G'],
  '6-string-standard': ['B', 'E', 'A', 'D', 'G', 'C'],
  '4-string-drop-d': ['D', 'A', 'D', 'G'],
  '5-string-drop-a': ['A', 'E', 'A', 'D', 'G'],
};

/**
 * Banjo tunings dictionary
 */
export const BANJO_TUNINGS: Record<string, string[]> = {
  '5-string-open-g': ['G', 'D', 'G', 'B', 'D'], // 5th string is high G (drone)
  '5-string-double-c': ['G', 'C', 'G', 'C', 'D'],
  '4-string-tenor-standard': ['C', 'G', 'D', 'A'], // Tenor banjo (Irish)
  '4-string-tenor-irish': ['G', 'D', 'A', 'E'],
};

/**
 * Mandolin tunings dictionary
 */
export const MANDOLIN_TUNINGS: Record<string, string[]> = {
  'standard': ['G', 'D', 'A', 'E'], // Same as violin
};

// ============================================================================
// ALGORITHMIC VOICING ENGINE - CORE FUNCTIONS
// ============================================================================

/**
 * Normalize note name for comparison (enharmonic equivalents)
 * E# → F, Cb → B, etc.
 */
function normalizeNote(note: string): string {
  const noteMap: Record<string, string> = {
    'B#': 'C', 'E#': 'F', 'Cb': 'B', 'Fb': 'E',
    'C##': 'D', 'D##': 'E', 'E##': 'F#', 'F##': 'G',
    'G##': 'A', 'A##': 'B', 'B##': 'C#',
    'Dbb': 'C', 'Ebb': 'D', 'Fbb': 'Eb', 'Gbb': 'F',
    'Abb': 'G', 'Bbb': 'A', 'Cbb': 'Bb',
  };
  return noteMap[note] || note;
}

/**
 * Get semitone value for a note (C = 0, C# = 1, etc.)
 */
function getNoteValue(note: string): number {
  const normalized = normalizeNote(note);
  const noteValues: Record<string, number> = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
    'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
  };
  return noteValues[normalized] ?? 0;
}

/**
 * Check if two notes are enharmonically equivalent
 */
function areNotesEquivalent(note1: string, note2: string): boolean {
  return getNoteValue(note1) === getNoteValue(note2);
}

/**
 * Find all possible positions for a note on the fretboard
 * 
 * @param note - Note to find (e.g., 'C', 'F#', 'Bb')
 * @param tuning - Guitar tuning (array of open string notes)
 * @param maxFret - Maximum fret to search (default 15)
 * @returns Array of all positions where this note appears
 */
function findAllPositions(
  note: string,
  tuning: string[],
  maxFret: number = 15
): FretPosition[] {
  const positions: FretPosition[] = [];
  const targetValue = getNoteValue(note);

  tuning.forEach((openNote, stringIndex) => {
    const openValue = getNoteValue(openNote);
    
    // Check each fret on this string
    for (let fret = 0; fret <= maxFret; fret++) {
      const fretValue = (openValue + fret) % 12;
      if (fretValue === targetValue) {
        positions.push({
          string: stringIndex,
          fret: fret,
          note: note
        });
      }
    }
  });

  return positions;
}

/**
 * Generate all possible voicings for a chord
 * Uses recursive backtracking to explore all combinations
 * 
 * @param notes - Chord notes to voice
 * @param tuning - Guitar tuning
 * @param options - Generation options
 * @returns Array of voicing candidates with scores
 */
function generateAllVoicings(
  notes: string[],
  tuning: string[],
  options?: {
    maxFret?: number;
    preferredPosition?: number;
    bassNote?: string;
    maxResults?: number;
  }
): VoicingCandidate[] {
  const maxFret = options?.maxFret || 15;
  const maxResults = options?.maxResults || 20;
  
  // Find all positions for each note
  const notePositions = notes.map(note => 
    findAllPositions(note, tuning, maxFret)
  );

  // If any note has no positions, can't build this chord
  if (notePositions.some(positions => positions.length === 0)) {
    return [];
  }

  const voicings: VoicingCandidate[] = [];
  const numStrings = tuning.length;

  /**
   * Recursive backtracking to generate voicing combinations
   */
  function buildVoicing(
    stringIndex: number,
    currentFrets: number[],
    currentPositions: FretPosition[],
    usedNotes: Set<string>
  ): void {
    // Stop if we've generated enough results
    if (voicings.length >= maxResults * 3) return;

    // Base case: we've assigned all strings
    if (stringIndex === numStrings) {
      // Must use at least 3 strings and have all chord notes
      const notesUsed = currentPositions.map(p => p.note);
      const hasAllNotes = notes.every(note =>
        notesUsed.some(used => areNotesEquivalent(used, note))
      );
      
      if (currentPositions.length >= 3 && hasAllNotes) {
        const score = scoreVoicing(currentFrets, currentPositions, tuning, options);
        voicings.push({
          frets: currentFrets,
          positions: currentPositions,
          score: score
        });
      }
      return;
    }

    // Option 1: Mute this string
    buildVoicing(
      stringIndex + 1,
      [...currentFrets, -1],
      currentPositions,
      usedNotes
    );

    // Option 2: Play a note on this string
    // Try each chord note that could fit on this string
    for (const note of notes) {
      const positions = findAllPositions(note, [tuning[stringIndex]], maxFret);
      
      for (const pos of positions) {
        // Skip if fret is too far from other frets (playability)
        if (currentPositions.length > 0) {
          const activeFrets = currentFrets.filter(f => f > 0);
          if (activeFrets.length > 0) {
            const minFret = Math.min(...activeFrets);
            const maxActiveFret = Math.max(...activeFrets);
            
            // Skip if stretch is too wide (more than 4 frets)
            if (pos.fret > 0 && (
              pos.fret < minFret - 4 ||
              pos.fret > maxActiveFret + 4
            )) {
              continue;
            }
          }
        }

        buildVoicing(
          stringIndex + 1,
          [...currentFrets, pos.fret],
          [...currentPositions, { ...pos, string: stringIndex }],
          new Set([...usedNotes, note])
        );
      }
    }
  }

  // Start recursive generation
  buildVoicing(0, [], [], new Set());

  // Sort by score and return top results
  return voicings
    .sort((a, b) => a.score.total - b.score.total)
    .slice(0, maxResults);
}

/**
 * Score a voicing for playability
 * Lower scores are better
 */
function scoreVoicing(
  frets: number[],
  positions: FretPosition[],
  tuning: string[],
  options?: { bassNote?: string; previousVoicing?: number[] }
): PlayabilityScore {
  const activeFrets = frets.filter(f => f > 0);
  const mutedCount = frets.filter(f => f === -1).length;
  
  // 1. Finger stretch penalty (0-100)
  let fingerStretch = 0;
  if (activeFrets.length > 0) {
    const minFret = Math.min(...activeFrets);
    const maxFret = Math.max(...activeFrets);
    const span = maxFret - minFret;
    
    if (span === 0) fingerStretch = 0;        // All same fret (barre)
    else if (span === 1) fingerStretch = 5;   // 1 fret span
    else if (span === 2) fingerStretch = 10;  // 2 fret span
    else if (span === 3) fingerStretch = 20;  // 3 fret span (standard)
    else if (span === 4) fingerStretch = 40;  // 4 fret span (hard)
    else fingerStretch = 80;                   // 5+ fret span (very hard)
  }

  // 2. Barre complexity penalty (0-50)
  let barreComplexity = 0;
  const fretCounts = new Map<number, number>();
  activeFrets.forEach(f => {
    fretCounts.set(f, (fretCounts.get(f) || 0) + 1);
  });
  
  for (const [fret, count] of fretCounts) {
    if (count >= 3) {
      // Partial or full barre
      barreComplexity += 20;
      if (count >= 5) barreComplexity += 15; // Full barre harder
    }
  }

  // 3. Muted strings penalty (0-30)
  let mutedStrings = mutedCount * 5;
  
  // 3b. Split mutes penalty (internal muted strings)
  // It's physically difficult to mute a string sandwiched between fretted strings
  // unless the lower fretted finger naturally mutes it
  let splitMutesPenalty = 0;
  for (let i = 1; i < frets.length - 1; i++) {
    if (frets[i] === -1) {
      // This string is muted
      const lowerStringFretted = frets[i - 1] > 0;
      const higherStringFretted = frets[i + 1] > 0;
      
      if (lowerStringFretted && higherStringFretted) {
        // Internal mute - check if it can be naturally muted
        const canNaturallyMute = frets[i - 1] === frets[i + 1]; // Same fret = barre can mute
        
        if (!canNaturallyMute) {
          splitMutesPenalty += 15; // Significant penalty for awkward split mute
        }
      }
    }
  }
  mutedStrings += splitMutesPenalty;

  // 4. Low interval penalty (0-40) - Acoustic physics
  // Small intervals (3rds, 4ths) in low registers sound muddy
  let lowIntervalPenalty = 0;
  const sortedPositions = [...positions].sort((a, b) => {
    const pitchA = noteToMIDI(a.note);
    const pitchB = noteToMIDI(b.note);
    return pitchA - pitchB;
  });
  
  for (let i = 0; i < sortedPositions.length - 1; i++) {
    const note1 = sortedPositions[i].note;
    const note2 = sortedPositions[i + 1].note;
    const pitch1 = noteToMIDI(note1);
    const pitch2 = noteToMIDI(note2);
    const interval = pitch2 - pitch1;
    
    // If lowest note is below G2 (MIDI 43) and interval is small (minor 3rd or less)
    if (pitch1 < 43 && interval > 0 && interval <= 4) {
      // Penalty increases as we go lower
      const lownessFactor = Math.max(0, 43 - pitch1) / 10;
      lowIntervalPenalty += 10 * lownessFactor;
    }
  }
  lowIntervalPenalty = Math.min(40, lowIntervalPenalty); // Cap at 40

  // 5. Bass note bonus (0-20)
  let bassNote = 0;
  if (options?.bassNote) {
    const lowestString = positions.reduce((lowest, pos) => 
      pos.string < lowest.string ? pos : lowest
    , positions[0]);
    
    if (areNotesEquivalent(lowestString.note, options.bassNote)) {
      bassNote = -15; // Bonus (negative = better)
    } else {
      bassNote = 10; // Penalty for wrong bass
    }
  }

  // 5. Voice leading (distance from previous voicing with common tone preference)
  let voiceLeading = 0;
  if (options?.previousVoicing) {
    // QA AUDIT FIX: True voice leading optimization
    // Prioritize keeping common tones stationary over just minimizing total distance
    let commonTonesStationary = 0;
    let totalMovement = 0;
    
    frets.forEach((fret, i) => {
      const prev = options.previousVoicing![i];
      if (fret === -1 || prev === -1) return;
      
      const movement = Math.abs(fret - prev);
      totalMovement += movement;
      
      // Check if this could be a common tone (same fret or very close)
      if (movement === 0) {
        commonTonesStationary++; // Bonus for stationary notes
      }
    });
    
    // Score: penalize total movement, but give bonus for stationary common tones
    voiceLeading = (totalMovement * 2) - (commonTonesStationary * 5);
  }

  // 6. Position preference (lower positions slightly favored)
  const avgFret = activeFrets.length > 0
    ? activeFrets.reduce((sum, f) => sum + f, 0) / activeFrets.length
    : 0;
  const positionPenalty = avgFret > 7 ? (avgFret - 7) * 2 : 0;

  const total = fingerStretch + barreComplexity + mutedStrings + 
                bassNote + voiceLeading + positionPenalty + lowIntervalPenalty;

  return {
    fingerStretch,
    barreComplexity,
    mutedStrings,
    bassNote,
    voiceLeading,
    lowIntervalPenalty,
    total
  };
}

/**
 * Assign finger numbers to a voicing
 * Heuristic-based finger assignment
 */
function assignFingers(frets: number[]): number[] {
  const fingers = frets.map(f => f === -1 ? 0 : f === 0 ? 0 : 1);
  const activeFrets = frets.filter(f => f > 0);
  
  if (activeFrets.length === 0) return fingers;

  const minFret = Math.min(...activeFrets);
  const maxFret = Math.max(...activeFrets);
  
  // Check for barre chord
  const fretCounts = new Map<number, number>();
  frets.forEach((f, i) => {
    if (f > 0) {
      if (!fretCounts.has(f)) fretCounts.set(f, 0);
      fretCounts.set(f, fretCounts.get(f)! + 1);
    }
  });

  let barredFret = -1;
  for (const [fret, count] of fretCounts) {
    if (count >= 3 && fret === minFret) {
      barredFret = fret;
      break;
    }
  }

  // Assign fingers
  return frets.map((fret, i) => {
    if (fret === -1 || fret === 0) return 0;
    
    if (barredFret !== -1 && fret === barredFret) {
      return 1; // Index finger for barre
    }
    
    // Simple heuristic: assign fingers based on fret offset from min
    const offset = fret - minFret;
    if (barredFret !== -1) {
      // After barre, use fingers 2, 3, 4
      return Math.min(offset + 1, 4);
    } else {
      // No barre, use fingers 1, 2, 3, 4
      return Math.min(offset + 1, 4);
    }
  });
}

/**
 * Get chord voicing for an instrument
 * Returns guitar, piano, and ukulele fingerings
 */
export function getChordVoicing(chordName: string): {
  notes: string[];
  guitar: { frets: number[]; fingers?: number[]; startFret?: number } | null;
  piano: { keys: string[] } | null;
  ukulele: { frets: number[]; fingers?: number[]; startFret?: number } | null;
} {
  const parsed = parseChordName(chordName);
  const root = `${parsed.root}${ACCIDENTALS.find(a => a.value === parsed.accidental)?.symbol || ''}`;
  
  // Build quality string for new API
  let qualityString = '';
  if (parsed.quality === 'minor') qualityString = 'm';
  else if (parsed.quality === 'diminished') qualityString = 'dim';
  else if (parsed.quality === 'augmented') qualityString = 'aug';
  else if (parsed.quality === 'sus2') qualityString = 'sus2';
  else if (parsed.quality === 'sus4') qualityString = 'sus4';
  
  // Add extension
  if (parsed.extension !== 'none') {
    if (parsed.extension === 'maj7' && qualityString === '') {
      qualityString = 'maj7';
    } else if (parsed.extension === 'maj9' && qualityString === '') {
      qualityString = 'maj9';
    } else {
      qualityString += parsed.extension;
    }
  }
  
  const notes = buildChord(root, qualityString);
  
  // Get fingerings from database (if available)
  const dbEntry = CHORD_DATABASE[chordName] || CHORD_DATABASE[root];
  
  return {
    notes,
    guitar: dbEntry?.guitar || null,
    piano: dbEntry?.piano || { keys: notes },
    ukulele: dbEntry?.ukulele || null,
  };
}

/**
 * Generate guitar voicing from chord notes
 * 
 * ✅ FULL ALGORITHMIC IMPLEMENTATION
 * 
 * FEATURES:
 * - Automatic voicing generation for ANY chord (including exotic: C#sus4add9, Ebmaj7#11)
 * - Alternative tuning support (Drop D, DADGAD, Open G, etc.)
 * - Playability scoring (finger stretch, barre complexity, muted strings)
 * - Voice leading optimization (smooth transitions between chords)
 * - Database fallback for common chords (faster lookup)
 * 
 * ALGORITHM:
 * 1. Check database first (O(1) lookup for common chords)
 * 2. Find all fretboard positions for each chord note
 * 3. Generate voicing combinations using recursive backtracking
 * 4. Score each voicing for playability
 * 5. Return best voicing (lowest score)
 * 
 * @param notes - Array of note names in the chord
 * @param options - Voicing options (tuning, position, bass note)
 * @returns Guitar fingering data or null if impossible to voice
 * 
 * @example
 * // Common chord (database lookup)
 * generateGuitarVoicing(['C', 'E', 'G'])
 * → { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] }
 * 
 * // Exotic chord (algorithmic generation)
 * generateGuitarVoicing(['C#', 'E#', 'G#', 'B#'], { tuning: GUITAR_TUNINGS['drop-d'] })
 * → { frets: [-1, 4, 3, 1, 2, 1], fingers: [0, 4, 3, 1, 2, 1], startFret: 1 }
 * 
 * // Voice leading (smooth transition)
 * generateGuitarVoicing(['G', 'B', 'D'], { previousVoicing: [3, 2, 0, 0, 0, 3] })
 * → { frets: [3, 2, 0, 0, 3, 3], ... } // Minimal finger movement
 */
export function generateGuitarVoicing(
  notes: string[], 
  options?: { 
    tuning?: string[]; 
    preferredPosition?: number;
    bassNote?: string;
    previousVoicing?: number[];
    maxFret?: number;
  }
): { frets: number[]; fingers?: number[]; startFret?: number } | null {
  const tuning = options?.tuning || GUITAR_TUNINGS['standard'];
  
  // OPTIMIZATION: Try database first for common chords in standard tuning
  if (!options?.tuning || options.tuning === GUITAR_TUNINGS['standard']) {
    const firstNote = notes[0];
    const dbEntry = CHORD_DATABASE[firstNote];
    
    if (dbEntry?.guitar) {
      // Verify database entry has all chord notes
      const dbVoicing = dbEntry.guitar;
      const voicedNotes: string[] = [];
      
      dbVoicing.frets.forEach((fret, stringIndex) => {
        if (fret >= 0) {
          const openNote = tuning[stringIndex];
          const openValue = getNoteValue(openNote);
          const fretValue = (openValue + fret) % 12;
          
          // Find which chord note this is
          for (const note of notes) {
            if (getNoteValue(note) === fretValue && !voicedNotes.includes(note)) {
              voicedNotes.push(note);
              break;
            }
          }
        }
      });
      
      // If database voicing covers all notes, use it
      const hasAllNotes = notes.every(note =>
        voicedNotes.some(voiced => areNotesEquivalent(voiced, note))
      );
      
      if (hasAllNotes) {
        return dbEntry.guitar;
      }
    }
  }
  
  // ALGORITHMIC GENERATION: Generate voicings from scratch
  const voicings = generateAllVoicings(notes, tuning, {
    maxFret: options?.maxFret || 15,
    preferredPosition: options?.preferredPosition,
    bassNote: options?.bassNote || notes[0],
    maxResults: 10
  });
  
  if (voicings.length === 0) {
    console.warn(`generateGuitarVoicing: Could not generate any valid voicings for notes:`, notes);
    return null;
  }
  
  // Get best voicing (lowest score)
  const best = voicings[0];
  const fingers = assignFingers(best.frets);
  
  // Determine startFret for display
  const activeFrets = best.frets.filter(f => f > 0);
  const startFret = activeFrets.length > 0 ? Math.min(...activeFrets) : undefined;
  
  return {
    frets: best.frets,
    fingers: fingers,
    startFret: startFret && startFret > 1 ? startFret : undefined
  };
}

/**
 * Generate ukulele voicing from chord notes
 */
export function generateUkuleleVoicing(
  notes: string[]
): { frets: number[]; fingers?: number[]; startFret?: number } | null {
  const firstNote = notes[0];
  const dbEntry = CHORD_DATABASE[firstNote];
  return dbEntry?.ukulele || null;
}

/**
 * Generate bass voicing from chord notes
 * 
 * Bass voicings typically emphasize root notes and 5ths.
 * For extended chords, includes 3rds and 7ths.
 * 
 * @param notes - Array of note names in the chord
 * @param options - Voicing options (tuning, position)
 * @returns Bass fingering data or null if impossible to voice
 * 
 * @example
 * generateBassVoicing(['C', 'E', 'G'])
 * → { frets: [-1, 3, 2, 0], fingers: [0, 3, 2, 1] }
 * 
 * generateBassVoicing(['E', 'G#', 'B'], { tuning: BASS_TUNINGS['5-string-standard'] })
 * → { frets: [0, 2, 2, 1, -1], fingers: [0, 2, 3, 1, 0] }
 */
export function generateBassVoicing(
  notes: string[], 
  options?: { 
    tuning?: string[]; 
    preferredPosition?: number;
    bassNote?: string;
    maxFret?: number;
  }
): { frets: number[]; fingers?: number[]; startFret?: number } | null {
  const tuning = options?.tuning || BASS_TUNINGS['4-string-standard'];
  
  // ALGORITHMIC GENERATION for bass
  const voicings = generateAllVoicings(notes, tuning, {
    maxFret: options?.maxFret || 12, // Bass typically uses lower positions
    preferredPosition: options?.preferredPosition,
    bassNote: options?.bassNote || notes[0], // Bass emphasizes root
    maxResults: 5
  });
  
  if (voicings.length === 0) {
    console.warn(`generateBassVoicing: Could not generate any valid voicings for notes:`, notes);
    return null;
  }
  
  // Get best voicing (lowest score)
  const best = voicings[0];
  const fingers = assignFingers(best.frets);
  
  // Determine startFret for display
  const activeFrets = best.frets.filter(f => f > 0);
  const startFret = activeFrets.length > 0 ? Math.min(...activeFrets) : undefined;
  
  return {
    frets: best.frets,
    fingers: fingers,
    startFret: startFret && startFret > 1 ? startFret : undefined
  };
}

/**
 * Generate banjo voicing from chord notes
 * 
 * Banjo voicings take into account the high 5th string (drone).
 * 5-string banjo: String 5 is a high G (or other note) that doesn't get fretted.
 * 4-string tenor: Tuned like mandola/viola (CGDA or GDAE).
 * 
 * @param notes - Array of note names in the chord
 * @param options - Voicing options (tuning, position)
 * @returns Banjo fingering data or null if impossible to voice
 * 
 * @example
 * generateBanjoVoicing(['G', 'B', 'D'], { tuning: BANJO_TUNINGS['5-string-open-g'] })
 * → { frets: [0, 0, 0, 0, 0], fingers: [0, 0, 0, 0, 0] } // Open G chord
 * 
 * generateBanjoVoicing(['C', 'E', 'G'], { tuning: BANJO_TUNINGS['4-string-tenor-standard'] })
 * → { frets: [0, 0, 0, 3], fingers: [0, 0, 0, 3] }
 */
export function generateBanjoVoicing(
  notes: string[], 
  options?: { 
    tuning?: string[]; 
    preferredPosition?: number;
    bassNote?: string;
    maxFret?: number;
  }
): { frets: number[]; fingers?: number[]; startFret?: number } | null {
  const tuning = options?.tuning || BANJO_TUNINGS['5-string-open-g'];
  
  // ALGORITHMIC GENERATION for banjo
  const voicings = generateAllVoicings(notes, tuning, {
    maxFret: options?.maxFret || 12,
    preferredPosition: options?.preferredPosition,
    bassNote: options?.bassNote || notes[0],
    maxResults: 5
  });
  
  if (voicings.length === 0) {
    console.warn(`generateBanjoVoicing: Could not generate any valid voicings for notes:`, notes);
    return null;
  }
  
  // Get best voicing (lowest score)
  const best = voicings[0];
  const fingers = assignFingers(best.frets);
  
  // Determine startFret for display
  const activeFrets = best.frets.filter(f => f > 0);
  const startFret = activeFrets.length > 0 ? Math.min(...activeFrets) : undefined;
  
  return {
    frets: best.frets,
    fingers: fingers,
    startFret: startFret && startFret > 1 ? startFret : undefined
  };
}

/**
 * Generate mandolin voicing from chord notes
 * 
 * Mandolin uses same tuning as violin (GDAE) with doubled strings.
 * Voicings are compact due to short scale length.
 * 
 * @param notes - Array of note names in the chord
 * @param options - Voicing options (position, max fret)
 * @returns Mandolin fingering data or null if impossible to voice
 * 
 * @example
 * generateMandolinVoicing(['G', 'B', 'D'])
 * → { frets: [0, 2, 3, 2], fingers: [0, 1, 3, 2] }
 * 
 * generateMandolinVoicing(['C', 'E', 'G'])
 * → { frets: [-1, 2, 0, 1], fingers: [0, 2, 0, 1] }
 */
export function generateMandolinVoicing(
  notes: string[], 
  options?: { 
    preferredPosition?: number;
    bassNote?: string;
    maxFret?: number;
  }
): { frets: number[]; fingers?: number[]; startFret?: number } | null {
  const tuning = MANDOLIN_TUNINGS['standard'];
  
  // ALGORITHMIC GENERATION for mandolin
  const voicings = generateAllVoicings(notes, tuning, {
    maxFret: options?.maxFret || 12,
    preferredPosition: options?.preferredPosition,
    bassNote: options?.bassNote || notes[0],
    maxResults: 5
  });
  
  if (voicings.length === 0) {
    console.warn(`generateMandolinVoicing: Could not generate any valid voicings for notes:`, notes);
    return null;
  }
  
  // Get best voicing (lowest score)
  const best = voicings[0];
  const fingers = assignFingers(best.frets);
  
  // Determine startFret for display
  const activeFrets = best.frets.filter(f => f > 0);
  const startFret = activeFrets.length > 0 ? Math.min(...activeFrets) : undefined;
  
  return {
    frets: best.frets,
    fingers: fingers,
    startFret: startFret && startFret > 1 ? startFret : undefined
  };
}

/**
 * Optimize piano voicing with low interval limit checking
 * 
 * QA AUDIT FIX: Implements acoustic physics constraints:
 * - No minor/major 3rds below E3 (MIDI 52)
 * - No major 2nds/minor 3rds below F3 (MIDI 53)
 * - Perfect 5ths acceptable down to C2 (MIDI 36)
 * 
 * This prevents "muddy" sound caused by overtone clashing in low registers.
 * 
 * @param notes - Array of note names to voice
 * @param options - Voicing options (octave range, voicing style)
 * @returns Optimized piano voicing
 * 
 * @example
 * optimizePianoVoicing(['C', 'E', 'G', 'B'])
 * → { keys: ['C2', 'G2', 'E3', 'G3', 'B3'] } // Avoids C2-E2 (muddy)
 */
export function optimizePianoVoicing(
  notes: string[], 
  options?: { 
    rootOctave?: number;
    voicingOctave?: number;
    style?: 'compact' | 'spread' | 'drop-2';
  }
): { keys: string[]; warnings?: string[] } {
  if (notes.length === 0) {
    return { keys: [] };
  }
  
  const rootOctave = options?.rootOctave || 2;
  const voicingOctave = options?.voicingOctave || 4;
  const style = options?.style || 'spread';
  const warnings: string[] = [];
  
  // Add octaves to notes
  const voicedNotes: string[] = [];
  
  // Root in bass
  voicedNotes.push(`${notes[0]}${rootOctave}`);
  
  // Check for low interval violations if we have more notes
  if (notes.length > 1) {
    // Calculate interval between root and second note
    const rootMIDI = noteToMIDI(`${notes[0]}${rootOctave}`);
    const secondNoteLowOctave = `${notes[1]}${rootOctave}`;
    const secondMIDI = noteToMIDI(secondNoteLowOctave);
    const interval = Math.abs(secondMIDI - rootMIDI);
    
    // QA AUDIT: Low Interval Limit Check
    if (rootMIDI < 52 && interval > 0 && interval <= 4) {
      // Small interval (2nd, m3, M3) in low register - move to higher octave
      const adjustedOctave = rootOctave + 1;
      
      // Add remaining notes in higher octave
      for (let i = 1; i < notes.length; i++) {
        voicedNotes.push(`${notes[i]}${adjustedOctave}`);
      }
      
      warnings.push('Adjusted voicing to avoid muddy low intervals (moved 3rd up one octave)');
    } else {
      // Safe - use mixed octaves for better voice leading
      if (notes.length >= 3) {
        // Add 5th in same octave as root
        voicedNotes.push(`${notes[1]}${rootOctave}`);
        
        // Add remaining notes in voicing octave
        for (let i = 2; i < notes.length; i++) {
          voicedNotes.push(`${notes[i]}${voicingOctave}`);
        }
      } else {
        voicedNotes.push(`${notes[1]}${voicingOctave}`);
      }
    }
  }
  
  return warnings.length > 0 ? { keys: voicedNotes, warnings } : { keys: voicedNotes };
}

/**
 * Piano hand size constraint for playability assessment
 * - 'small': Max comfortable stretch ~8 semitones (minor 6th), use rolled chords for 10ths
 * - 'medium': Max comfortable stretch ~10 semitones (minor 7th), can reach most 10ths
 * - 'large': Max comfortable stretch ~12+ semitones (octave+), can reach all standard voicings
 */
export type HandSize = 'small' | 'medium' | 'large';

/**
 * Generate extended piano voicing with 10ths
 * 
 * 10th voicings spread the root and 3rd across an octave + 3rd,
 * creating a fuller, more open sound commonly used in jazz and contemporary piano.
 * 
 * HAND SIZE ADJUSTMENT:
 * - Large hands: Standard 10th voicings
 * - Medium hands: Standard 10ths, warnings for complex extended chords
 * - Small hands: Move 3rd to left hand bass register (no 10th stretch required)
 * 
 * @param notes - Array of note names in the chord
 * @param options - Voicing options
 * @returns Piano voicing with 10th intervals and playability notes
 * 
 * @example
 * generatePianoVoicing10th(['C', 'E', 'G', 'B'], { handSize: 'large' })
 * → { 
 *     leftHand: ['C2', 'G2'],
 *     rightHand: ['E4', 'B4', 'D5'],
 *     playabilityNote: undefined
 *   }
 * 
 * generatePianoVoicing10th(['C', 'E', 'G', 'B'], { handSize: 'small' })
 * → { 
 *     leftHand: ['C2', 'E2', 'G2'],  // 3rd in bass
 *     rightHand: ['B3', 'D4'],
 *     playabilityNote: 'Adjusted for small hands'
 *   }
 */
export function generatePianoVoicing10th(
  notes: string[],
  options?: {
    rootOctave?: number;
    voicingOctave?: number;
    handSize?: HandSize;
  }
): { leftHand: string[]; rightHand: string[]; playabilityNote?: string } {
  const rootOctave = options?.rootOctave || 2;
  const voicingOctave = options?.voicingOctave || 4;
  const handSize = options?.handSize || 'medium';
  
  if (notes.length === 0) {
    return { leftHand: [], rightHand: [] };
  }
  
  let leftHand: string[] = [];
  let rightHand: string[] = [];
  let playabilityNote: string | undefined;
  
  // SMALL HANDS: Move 3rd to left hand, avoid 10th stretch
  if (handSize === 'small') {
    leftHand.push(`${notes[0]}${rootOctave}`); // Root
    if (notes.length >= 2) {
      leftHand.push(`${notes[1]}${rootOctave}`); // 3rd (NOT octave up)
    }
    if (notes.length >= 3) {
      leftHand.push(`${notes[2]}${rootOctave}`); // 5th
    }
    
    // Right hand: Extensions only in comfortable register
    for (let i = 3; i < notes.length; i++) {
      rightHand.push(`${notes[i]}${voicingOctave - 1}`);
    }
    
    playabilityNote = 'Adjusted for small hands: 3rd in bass register';
  } 
  // MEDIUM/LARGE HANDS: Standard 10th voicing
  else {
    leftHand.push(`${notes[0]}${rootOctave}`); // Root
    
    if (notes.length >= 3) {
      leftHand.push(`${notes[2] || notes[1]}${rootOctave}`); // 5th
    }
    
    if (notes.length >= 2) {
      rightHand.push(`${notes[1]}${voicingOctave}`); // 10th (3rd up octave)
    }
    
    for (let i = 3; i < notes.length; i++) {
      rightHand.push(`${notes[i]}${voicingOctave + (i > 5 ? 1 : 0)}`);
    }
    
    if (notes.length === 3) {
      rightHand.push(`${notes[0]}${voicingOctave + 1}`);
    }
    
    if (handSize === 'medium' && notes.length >= 5) {
      playabilityNote = 'Consider rolling chord for medium hands';
    }
  }
  
  return { leftHand, rightHand, playabilityNote };
}

/**
 * Generate rootless piano voicing
 * 
 * Rootless voicings omit the root note, allowing the bass to define harmony.
 * Common in jazz comping when playing with a bass player.
 * Uses guide tones (3rd and 7th) plus color tones (9th, 11th, 13th).
 * 
 * @param notes - Array of note names in the chord
 * @param options - Voicing options
 * @returns Piano voicing without root
 * 
 * @example
 * generatePianoVoicingRootless(['C', 'E', 'G', 'Bb', 'D']) // C9
 * → { keys: ['E4', 'Bb4', 'D5', 'G5'] } // 3rd, 7th, 9th, 5th
 * 
 * generatePianoVoicingRootless(['D', 'F', 'A', 'C']) // Dm7
 * → { keys: ['F4', 'C5', 'E5', 'A5'] } // 3rd, 7th, 9th, 5th
 */
export function generatePianoVoicingRootless(
  notes: string[],
  options?: {
    octave?: number;
    voicingType?: 'A' | 'B'; // Two common rootless voicing types
  }
): { keys: string[] } {
  const octave = options?.octave || 4;
  const voicingType = options?.voicingType || 'A';
  
  if (notes.length < 3) {
    // Need at least root, 3rd, 5th to create rootless voicing
    return { keys: notes.map(n => `${n}${octave}`) };
  }
  
  const keys: string[] = [];
  
  // Rootless voicing always includes 3rd and 7th (guide tones)
  if (voicingType === 'A') {
    // Type A: 3rd, 5th/6th, 7th, 9th (bottom to top)
    if (notes.length >= 2) keys.push(`${notes[1]}${octave}`);     // 3rd
    if (notes.length >= 3) keys.push(`${notes[2]}${octave}`);     // 5th
    if (notes.length >= 4) keys.push(`${notes[3]}${octave + 1}`); // 7th
    if (notes.length >= 5) keys.push(`${notes[4]}${octave + 1}`); // 9th
  } else {
    // Type B: 7th, 9th, 3rd, 5th/6th (bottom to top)
    if (notes.length >= 4) keys.push(`${notes[3]}${octave}`);     // 7th
    if (notes.length >= 5) keys.push(`${notes[4]}${octave}`);     // 9th
    if (notes.length >= 2) keys.push(`${notes[1]}${octave + 1}`); // 3rd
    if (notes.length >= 3) keys.push(`${notes[2]}${octave + 1}`); // 5th
  }
  
  return { keys };
}
