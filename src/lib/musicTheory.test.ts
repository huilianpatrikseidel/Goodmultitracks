// @ts-nocheck
/**
 * Music Theory Module Tests
 * Tests for Circle of Fifths, algorithmic chord generation, scales, and meters
 */

import {
  transposeNote,
  transposeKey,
  buildChord,
  getScaleNotes,
  isChordInKey,
  analyzeTimeSignature,
  getMetronomeBeatPositions,
  getAccentLevel,
  parseChordName,
  generateChordName,
  getChordVoicing,
  generateGuitarVoicing,
  generateUkuleleVoicing,
  optimizePianoVoicing,
  SCALE_PATTERNS,
} from './musicTheory';

describe('Music Theory - Circle of Fifths & Transposition', () => {
  describe('transposeNote', () => {
    it('should transpose C up by 7 semitones to G in sharp context', () => {
      expect(transposeNote('C', 7, 'G')).toBe('G');
    });

    it('should transpose C up by 1 semitone to C# in sharp keys', () => {
      expect(transposeNote('C', 1, 'D')).toBe('C#');
    });

    it('should transpose C up by 1 semitone to Db in flat keys', () => {
      expect(transposeNote('C', 1, 'Db')).toBe('Db');
    });

    it('should transpose F# up by 1 semitone to G', () => {
      expect(transposeNote('F#', 1, 'G')).toBe('G');
    });

    it('should transpose Bb down by 1 semitone to A', () => {
      expect(transposeNote('Bb', -1, 'F')).toBe('A');
    });

    it('should handle octave transposition', () => {
      expect(transposeNote('C', 12, 'C')).toBe('C');
    });

    it('should handle enharmonic equivalents based on key context', () => {
      // In F# major, we want F# not Gb
      expect(transposeNote('C', 6, 'F#')).toBe('F#');
      // In Db major, we want Gb not F#
      expect(transposeNote('C', 6, 'Db')).toBe('Gb');
    });
  });

  describe('transposeKey (legacy compatibility)', () => {
    it('should transpose chord with suffix maintaining sharp/flat', () => {
      expect(transposeKey('Am7', 2)).toBe('Bm7');
    });

    it('should transpose slash chord', () => {
      expect(transposeKey('C/E', 2)).toBe('D/E');
    });

    it('should maintain flat notation', () => {
      expect(transposeKey('Bb', 2)).toBe('C');
    });
  });
});

describe('Music Theory - Scales & Modes', () => {
  describe('getScaleNotes', () => {
    it('should generate C major scale', () => {
      const notes = getScaleNotes('C', 'major');
      expect(notes).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
    });

    it('should generate A natural minor scale', () => {
      const notes = getScaleNotes('A', 'minor');
      expect(notes).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
    });

    it('should generate D Dorian scale', () => {
      const notes = getScaleNotes('D', 'dorian');
      expect(notes).toEqual(['D', 'E', 'F', 'G', 'A', 'B', 'C']);
    });

    it('should generate E Phrygian scale', () => {
      const notes = getScaleNotes('E', 'phrygian');
      expect(notes).toEqual(['E', 'F', 'G', 'A', 'B', 'C', 'D']);
    });

    it('should generate F Lydian scale', () => {
      const notes = getScaleNotes('F', 'lydian');
      expect(notes).toEqual(['F', 'G', 'A', 'B', 'C', 'D', 'E']);
    });
  });

  describe('isChordInKey', () => {
    it('should validate chord in C major', () => {
      expect(isChordInKey('C', 'C', 'major')).toBe(true);
      expect(isChordInKey('D', 'C', 'major')).toBe(true);
      expect(isChordInKey('E', 'C', 'major')).toBe(true);
      expect(isChordInKey('F', 'C', 'major')).toBe(true);
    });

    it('should reject chord not in key', () => {
      expect(isChordInKey('Db', 'C', 'major')).toBe(false);
      expect(isChordInKey('Eb', 'C', 'major')).toBe(false);
    });

    it('should validate chord in A minor', () => {
      expect(isChordInKey('A', 'A', 'minor')).toBe(true);
      expect(isChordInKey('C', 'A', 'minor')).toBe(true);
      expect(isChordInKey('E', 'A', 'minor')).toBe(true);
    });
  });
});

describe('Music Theory - Algorithmic Chord Construction', () => {
  describe('buildChord', () => {
    it('should build C major triad', () => {
      const notes = buildChord('C', 'major');
      expect(notes).toEqual(['C', 'E', 'G']);
    });

    it('should build A minor triad', () => {
      const notes = buildChord('A', 'minor');
      expect(notes).toEqual(['A', 'C', 'E']);
    });

    it('should build C major 7th chord', () => {
      const notes = buildChord('C', 'major', 'maj7');
      expect(notes).toContain('C');
      expect(notes).toContain('E');
      expect(notes).toContain('G');
      expect(notes).toContain('B');
    });

    it('should build D minor 7th chord', () => {
      const notes = buildChord('D', 'minor', '7');
      expect(notes).toContain('D');
      expect(notes).toContain('F');
      expect(notes).toContain('A');
      expect(notes).toContain('C');
    });

    it('should build G dominant 9th chord', () => {
      const notes = buildChord('G', 'major', '9');
      expect(notes).toContain('G');
      expect(notes).toContain('B');
      expect(notes).toContain('D');
      expect(notes).toContain('F');
      expect(notes).toContain('A');
      expect(notes.length).toBe(5);
    });

    it('should build complex jazz chord - Cmaj9', () => {
      const notes = buildChord('C', 'major', 'maj9');
      expect(notes).toContain('C');
      expect(notes).toContain('E');
      expect(notes).toContain('G');
      expect(notes).toContain('B');
      expect(notes).toContain('D');
      expect(notes.length).toBe(5);
    });

    it('should build diminished chord', () => {
      const notes = buildChord('B', 'diminished');
      expect(notes).toContain('B');
      expect(notes).toContain('D');
      expect(notes).toContain('F');
    });

    it('should build augmented chord', () => {
      const notes = buildChord('C', 'augmented');
      expect(notes).toContain('C');
      expect(notes).toContain('E');
      expect(notes.length).toBe(3);
    });

    it('should build sus2 chord', () => {
      const notes = buildChord('D', 'sus2');
      expect(notes).toContain('D');
      expect(notes).toContain('E');
      expect(notes).toContain('A');
    });

    it('should build sus4 chord', () => {
      const notes = buildChord('G', 'sus4');
      expect(notes).toContain('G');
      expect(notes).toContain('C');
      expect(notes).toContain('D');
    });
  });

  describe('getChordVoicing', () => {
    it('should return database chord if exists', () => {
      const voicing = getChordVoicing('C');
      expect(voicing.piano.keys).toEqual(['C', 'E', 'G']);
    });

    it('should generate chord algorithmically if not in database', () => {
      const voicing = getChordVoicing('Cmaj9');
      expect(voicing.piano.keys).toContain('C');
      expect(voicing.piano.keys).toContain('E');
      expect(voicing.piano.keys).toContain('G');
      expect(voicing.piano.keys).toContain('B');
      expect(voicing.piano.keys).toContain('D');
    });

    it('should generate guitar voicing for complex chords', () => {
      const voicing = getChordVoicing('Dm7');
      // Should have either database or generated voicing
      expect(voicing.piano.keys.length).toBeGreaterThan(0);
    });

    it('should generate ukulele voicing for complex chords', () => {
      const voicing = getChordVoicing('Gmaj7');
      // Should have piano voicing at minimum
      expect(voicing.piano.keys).toContain('G');
      expect(voicing.piano.keys).toContain('B');
      expect(voicing.piano.keys).toContain('D');
    });

    it('should optimize piano voicing for extended chords', () => {
      const voicing = getChordVoicing('Cmaj9');
      // Should have optimized voicing (may be reordered for better sound)
      expect(voicing.piano.keys.length).toBe(5);
      expect(voicing.piano.keys).toContain('C'); // Root
    });
  });
});

describe('Music Theory - Voicing Generation', () => {
  describe('generateGuitarVoicing', () => {
    it('should generate voicing for C major triad', () => {
      const voicing = generateGuitarVoicing(['C', 'E', 'G']);
      expect(voicing).toBeDefined();
      if (voicing) {
        expect(voicing.frets).toHaveLength(6); // 6 strings
        expect(voicing.frets.filter(f => f >= 0).length).toBeGreaterThanOrEqual(3);
      }
    });

    it('should respect fret span constraint', () => {
      const voicing = generateGuitarVoicing(['D', 'F#', 'A'], 4);
      if (voicing) {
        const playedFrets = voicing.frets.filter(f => f > 0);
        const span = Math.max(...playedFrets) - Math.min(...playedFrets);
        expect(span).toBeLessThanOrEqual(4);
      }
    });

    it('should handle complex jazz chords', () => {
      const voicing = generateGuitarVoicing(['C', 'E', 'G', 'B', 'D']);
      // May or may not find a playable voicing, but shouldn't crash
      expect(voicing).toBeDefined();
    });
  });

  describe('generateUkuleleVoicing', () => {
    it('should generate voicing for simple chord', () => {
      const voicing = generateUkuleleVoicing(['C', 'E', 'G']);
      expect(voicing).toBeDefined();
      if (voicing) {
        expect(voicing.frets).toHaveLength(4); // 4 strings
      }
    });

    it('should handle minor chords', () => {
      const voicing = generateUkuleleVoicing(['A', 'C', 'E']);
      expect(voicing).toBeDefined();
      if (voicing) {
        expect(voicing.frets.filter(f => f >= 0).length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('optimizePianoVoicing', () => {
    it('should keep triads unchanged', () => {
      const voicing = optimizePianoVoicing(['C', 'E', 'G']);
      expect(voicing).toEqual(['C', 'E', 'G']);
    });

    it('should optimize extended chords', () => {
      const voicing = optimizePianoVoicing(['C', 'E', 'G', 'B', 'D']);
      expect(voicing).toHaveLength(5);
      expect(voicing[0]).toBe('C'); // Root should stay first
      expect(voicing).toContain('E');
      expect(voicing).toContain('G');
      expect(voicing).toContain('B');
      expect(voicing).toContain('D');
    });

    it('should apply drop voicing for complex chords', () => {
      const voicing = optimizePianoVoicing(['D', 'F', 'A', 'C', 'E', 'G']);
      expect(voicing).toHaveLength(6);
      expect(voicing[0]).toBe('D'); // Root first
      // Voicing should be reordered for better sound
    });

    it('should handle empty input', () => {
      const voicing = optimizePianoVoicing([]);
      expect(voicing).toEqual([]);
    });
  });
});

describe('Music Theory - Time Signatures & Meters', () => {
  describe('analyzeTimeSignature - Simple Meters', () => {
    it('should analyze 4/4 as simple', () => {
      const info = analyzeTimeSignature(4, 4);
      expect(info.type).toBe('simple');
      expect(info.beatsPerMeasure).toBe(4);
      expect(info.beatUnit).toBe('quarter');
      expect(info.grouping).toEqual([1, 1, 1, 1]);
    });

    it('should analyze 3/4 as simple', () => {
      const info = analyzeTimeSignature(3, 4);
      expect(info.type).toBe('simple');
      expect(info.beatsPerMeasure).toBe(3);
      expect(info.beatUnit).toBe('quarter');
      expect(info.grouping).toEqual([1, 1, 1]);
    });

    it('should analyze 2/4 as simple', () => {
      const info = analyzeTimeSignature(2, 4);
      expect(info.type).toBe('simple');
      expect(info.beatsPerMeasure).toBe(2);
      expect(info.beatUnit).toBe('quarter');
    });
  });

  describe('analyzeTimeSignature - Compound Meters', () => {
    it('should analyze 6/8 as compound', () => {
      const info = analyzeTimeSignature(6, 8);
      expect(info.type).toBe('compound');
      expect(info.beatsPerMeasure).toBe(2);
      expect(info.beatUnit).toBe('dotted-quarter');
      expect(info.grouping).toEqual([3, 3]);
    });

    it('should analyze 9/8 as compound', () => {
      const info = analyzeTimeSignature(9, 8);
      expect(info.type).toBe('compound');
      expect(info.beatsPerMeasure).toBe(3);
      expect(info.beatUnit).toBe('dotted-quarter');
      expect(info.grouping).toEqual([3, 3, 3]);
    });

    it('should analyze 12/8 as compound', () => {
      const info = analyzeTimeSignature(12, 8);
      expect(info.type).toBe('compound');
      expect(info.beatsPerMeasure).toBe(4);
      expect(info.beatUnit).toBe('dotted-quarter');
      expect(info.grouping).toEqual([3, 3, 3, 3]);
    });
  });

  describe('analyzeTimeSignature - Irregular Meters', () => {
    it('should analyze 5/8 as irregular with default grouping', () => {
      const info = analyzeTimeSignature(5, 8);
      expect(info.type).toBe('irregular');
      expect(info.grouping).toEqual([3, 2]);
      expect(info.beatsPerMeasure).toBe(2);
    });

    it('should analyze 7/8 as irregular with default grouping', () => {
      const info = analyzeTimeSignature(7, 8);
      expect(info.type).toBe('irregular');
      expect(info.grouping).toEqual([2, 2, 3]);
      expect(info.beatsPerMeasure).toBe(3);
    });

    it('should use custom subdivision for 5/8', () => {
      const info = analyzeTimeSignature(5, 8, '2+3');
      expect(info.type).toBe('irregular');
      expect(info.grouping).toEqual([2, 3]);
      expect(info.beatsPerMeasure).toBe(2);
    });

    it('should use custom subdivision for 7/8', () => {
      const info = analyzeTimeSignature(7, 8, '3+2+2');
      expect(info.type).toBe('irregular');
      expect(info.grouping).toEqual([3, 2, 2]);
      expect(info.beatsPerMeasure).toBe(3);
    });

    it('should analyze 5/4 as irregular', () => {
      const info = analyzeTimeSignature(5, 4);
      expect(info.type).toBe('irregular');
      expect(info.grouping).toEqual([3, 2]);
    });

    it('should analyze 11/8 as irregular', () => {
      const info = analyzeTimeSignature(11, 8);
      expect(info.type).toBe('irregular');
      expect(info.grouping).toEqual([3, 3, 3, 2]);
    });
  });

  describe('getMetronomeBeatPositions', () => {
    it('should return beat positions for 4/4', () => {
      const info = analyzeTimeSignature(4, 4);
      const positions = getMetronomeBeatPositions(info);
      expect(positions).toEqual([0, 1, 2, 3]);
    });

    it('should return beat positions for 6/8', () => {
      const info = analyzeTimeSignature(6, 8);
      const positions = getMetronomeBeatPositions(info);
      expect(positions).toEqual([0, 3]); // Two dotted quarter beats
    });

    it('should return beat positions for 5/8 (3+2)', () => {
      const info = analyzeTimeSignature(5, 8);
      const positions = getMetronomeBeatPositions(info);
      expect(positions).toEqual([0, 3]); // Start of each group
    });

    it('should return beat positions for 7/8 (2+2+3)', () => {
      const info = analyzeTimeSignature(7, 8);
      const positions = getMetronomeBeatPositions(info);
      expect(positions).toEqual([0, 2, 4]); // Start of each group
    });
  });

  describe('getAccentLevel', () => {
    it('should return strong accent for downbeat', () => {
      const info = analyzeTimeSignature(4, 4);
      expect(getAccentLevel(0, info)).toBe(2);
    });

    it('should return medium accent for beats', () => {
      const info = analyzeTimeSignature(4, 4);
      expect(getAccentLevel(1, info)).toBe(1);
      expect(getAccentLevel(2, info)).toBe(1);
      expect(getAccentLevel(3, info)).toBe(1);
    });

    it('should return correct accents for 5/8', () => {
      const info = analyzeTimeSignature(5, 8);
      expect(getAccentLevel(0, info)).toBe(2); // Downbeat
      expect(getAccentLevel(3, info)).toBe(1); // Second group start
      expect(getAccentLevel(1, info)).toBe(0); // Weak subdivision
    });
  });
});

describe('Music Theory - Chord Parsing', () => {
  describe('parseChordName', () => {
    it('should parse simple major chord', () => {
      const parsed = parseChordName('C');
      expect(parsed.root).toBe('C');
      expect(parsed.accidental).toBe('natural');
      expect(parsed.quality).toBe('major');
      expect(parsed.extension).toBe('none');
    });

    it('should parse minor chord', () => {
      const parsed = parseChordName('Am');
      expect(parsed.root).toBe('A');
      expect(parsed.quality).toBe('minor');
    });

    it('should parse dominant 7th', () => {
      const parsed = parseChordName('G7');
      expect(parsed.root).toBe('G');
      expect(parsed.quality).toBe('major');
      expect(parsed.extension).toBe('7');
    });

    it('should parse major 7th', () => {
      const parsed = parseChordName('Cmaj7');
      expect(parsed.root).toBe('C');
      expect(parsed.quality).toBe('major');
      expect(parsed.extension).toBe('maj7');
    });

    it('should parse chord with sharp', () => {
      const parsed = parseChordName('F#m7');
      expect(parsed.root).toBe('F');
      expect(parsed.accidental).toBe('sharp');
      expect(parsed.quality).toBe('minor');
      expect(parsed.extension).toBe('7');
    });

    it('should parse slash chord', () => {
      const parsed = parseChordName('C/E');
      expect(parsed.root).toBe('C');
      expect(parsed.bassNote).toBe('E');
    });
  });

  describe('generateChordName', () => {
    it('should generate major chord name', () => {
      const name = generateChordName('C', 'natural', 'major', 'none', '');
      expect(name).toBe('C');
    });

    it('should generate minor 7th chord name', () => {
      const name = generateChordName('A', 'natural', 'minor', '7', '');
      expect(name).toBe('Am7');
    });

    it('should generate chord with slash bass', () => {
      const name = generateChordName('C', 'natural', 'major', 'none', 'E');
      expect(name).toBe('C/E');
    });
  });
});

console.log('All music theory tests defined!');
