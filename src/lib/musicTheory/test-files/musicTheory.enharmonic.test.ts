import { describe, it, expect } from 'vitest';
import { transposeNote, buildChord } from '../../musicTheory';

describe('Enharmonic Spelling - Degree Math Refactor', () => {
  
  describe('F# Major Scale', () => {
    it('should show E# instead of F', () => {
      const scale = [
        transposeNote('F#', 'P1'),   // F#
        transposeNote('F#', 'M2'),   // G#
        transposeNote('F#', 'M3'),   // A#
        transposeNote('F#', 'P4'),   // B
        transposeNote('F#', 'P5'),   // C#
        transposeNote('F#', 'M6'),   // D#
        transposeNote('F#', 'M7'),   // E# (NOT F!)
      ];
      
      expect(scale).toEqual(['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#']);
      expect(scale[6]).toBe('E#'); // Critical test!
    });
  });

  describe('F# Major Chord', () => {
    it('should use A# not Bb', () => {
      const chord = buildChord('F#', '');
      expect(chord).toEqual(['F#', 'A#', 'C#']);
    });
  });

  describe('Cb Major Chord', () => {
    it('should show Fb not E', () => {
      const chord = buildChord('Cb', '');
      expect(chord).toEqual(['Cb', 'Eb', 'Gb']);
    });
  });

  describe('C# dim7 Chord', () => {
    it('should use dim7 interval (9 semitones) not m7 (10 semitones)', () => {
      const chord = buildChord('C#', 'dim7');
      // C# - E - G - Bb (all minor 3rds)
      expect(chord).toEqual(['C#', 'E', 'G', 'Bb']);
    });
  });

  describe('B# Major Chord (double sharps)', () => {
    it('should use Dx (D double sharp) and Fx', () => {
      const chord = buildChord('B#', '');
      expect(chord).toEqual(['B#', 'Dx', 'Fx']);
    });
  });

  describe('E# Major Chord', () => {
    it('should use Gx (G double sharp) and B#', () => {
      const chord = buildChord('E#', '');
      expect(chord).toEqual(['E#', 'Gx', 'B#']);
    });
  });

  describe('Dbb Major Chord (double flats)', () => {
    it('should handle double flat roots', () => {
      const chord = buildChord('Dbb', '');
      expect(chord).toEqual(['Dbb', 'Fb', 'Abb']);
    });
  });

  describe('Individual Interval Tests', () => {
    it('C + M3 = E', () => {
      expect(transposeNote('C', 'M3')).toBe('E');
    });

    it('C# + M3 = E# (not F)', () => {
      expect(transposeNote('C#', 'M3')).toBe('E#');
    });

    it('Db + M3 = F (not E#)', () => {
      expect(transposeNote('Db', 'M3')).toBe('F');
    });

    it('F + M7 = E (not Fb)', () => {
      expect(transposeNote('F', 'M7')).toBe('E');
    });

    it('F# + M7 = E# (not F)', () => {
      expect(transposeNote('F#', 'M7')).toBe('E#');
    });
  });
});
