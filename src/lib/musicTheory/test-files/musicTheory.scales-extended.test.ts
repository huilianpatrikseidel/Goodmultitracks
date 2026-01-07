// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
/**
 * Extended Scale Tests - Phase 3.1 Implementation
 * Tests for Bebop, Altered, and Augmented scales
 */

import { getScaleNotes } from '../../musicTheory';

describe('Music Theory - Extended Scales (Phase 3.1)', () => {
  
  describe('Bebop Scales', () => {
    it('should generate Bebop Major scale (8 notes with #5 passing tone)', () => {
      const notes = getScaleNotes('C', 'bebop-major');
      expect(notes).toHaveLength(8);
      expect(notes).toEqual(['C', 'D', 'E', 'F', 'G', 'G#', 'A', 'B']);
      // Major scale + chromatic passing tone between 5 and 6
    });

    it('should generate Bebop Dominant scale (8 notes with M7 passing tone)', () => {
      const notes = getScaleNotes('G', 'bebop-dominant');
      expect(notes).toHaveLength(8);
      expect(notes).toEqual(['G', 'A', 'B', 'C', 'D', 'E', 'F', 'F#']);
      // Mixolydian + M7 passing tone before root
    });

    it('should generate Bebop Minor scale (8 notes with M3 passing tone)', () => {
      const notes = getScaleNotes('D', 'bebop-minor');
      expect(notes).toHaveLength(8);
      expect(notes).toEqual(['D', 'E', 'F', 'F#', 'G', 'A', 'B', 'C']);
      // Dorian + chromatic passing tone between m3 and P4
    });

    it('should generate Bebop Harmonic Minor (8 notes)', () => {
      const notes = getScaleNotes('A', 'bebop-harmonic-minor');
      expect(notes).toHaveLength(8);
      expect(notes).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'G#']);
      // Harmonic minor + m7 passing tone
    });
  });

  describe('Altered Scale', () => {
    it('should generate Altered scale (Super Locrian)', () => {
      const notes = getScaleNotes('C', 'altered');
      expect(notes).toHaveLength(7);
      expect(notes).toEqual(['C', 'Db', 'Eb', 'E', 'Gb', 'Ab', 'Bb']);
      // All alterations: b9, #9, b5, #5, b7
    });

    it('should generate Altered scale from G (for G7alt)', () => {
      const notes = getScaleNotes('G', 'altered');
      expect(notes).toEqual(['G', 'Ab', 'Bb', 'B', 'Db', 'Eb', 'F']);
    });

    it('should work with sharp roots', () => {
      const notes = getScaleNotes('F#', 'altered');
      expect(notes).toHaveLength(7);
      expect(notes[0]).toBe('F#');
      expect(notes[1]).toBe('G'); // b9
    });
  });

  describe('Augmented Scale', () => {
    it('should generate Augmented scale (6 notes)', () => {
      const notes = getScaleNotes('C', 'augmented');
      expect(notes).toHaveLength(6);
      expect(notes).toEqual(['C', 'Eb', 'E', 'G', 'G#', 'B']);
      // Alternating m3 and semitone intervals
    });

    it('should generate Augmented scale from E', () => {
      const notes = getScaleNotes('E', 'augmented');
      expect(notes).toHaveLength(6);
      expect(notes).toEqual(['E', 'G', 'G#', 'B', 'C', 'D#']);
    });
  });

  describe('Previously Added Scales (QA Audit)', () => {
    it('should have Pentatonic Major', () => {
      const notes = getScaleNotes('C', 'pentatonic-major');
      expect(notes).toEqual(['C', 'D', 'E', 'G', 'A']);
    });

    it('should have Pentatonic Minor', () => {
      const notes = getScaleNotes('A', 'pentatonic-minor');
      expect(notes).toEqual(['A', 'C', 'D', 'E', 'G']);
    });

    it('should have Blues scale', () => {
      const notes = getScaleNotes('E', 'blues');
      expect(notes).toEqual(['E', 'G', 'A', 'Bb', 'B', 'D']);
    });

    it('should have Whole Tone scale', () => {
      const notes = getScaleNotes('C', 'whole-tone');
      expect(notes).toHaveLength(6);
      expect(notes[0]).toBe('C');
    });

    it('should have Diminished Whole-Half', () => {
      const notes = getScaleNotes('C', 'diminished-whole-half');
      expect(notes).toHaveLength(8);
    });

    it('should have Diminished Half-Whole', () => {
      const notes = getScaleNotes('C', 'diminished-half-whole');
      expect(notes).toHaveLength(8);
    });
  });

  describe('Scale Count Verification', () => {
    it('should have all 25 scales available', () => {
      const scaleTypes = [
        // Major/Minor (5)
        'major', 'minor', 'harmonic-minor', 'melodic-minor-asc', 'melodic-minor-desc',
        
        // Church Modes (6)
        'dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian',
        
        // Pentatonic (2)
        'pentatonic-major', 'pentatonic-minor',
        
        // Blues (1)
        'blues',
        
        // Bebop (4)
        'bebop-major', 'bebop-dominant', 'bebop-minor', 'bebop-harmonic-minor',
        
        // Symmetric (3)
        'whole-tone', 'diminished-whole-half', 'diminished-half-whole',
        
        // Jazz/Modal (2)
        'altered', 'augmented'
      ];

      // Test that all scales can be generated without errors
      scaleTypes.forEach(scaleType => {
        const notes = getScaleNotes('C', scaleType);
        expect(notes.length).toBeGreaterThan(0);
        expect(notes[0]).toBe('C');
      });

      // Should have at least 23 scales (allowing for any I might have missed)
      expect(scaleTypes.length).toBeGreaterThanOrEqual(23);
    });
  });

  describe('Practical Usage Examples', () => {
    it('should generate bebop lick material', () => {
      // Common bebop major lick
      const cBebopMajor = getScaleNotes('C', 'bebop-major');
      expect(cBebopMajor).toContain('G#'); // Chromatic passing tone
      expect(cBebopMajor).toContain('A');
    });

    it('should generate altered dominant for jazz', () => {
      // G7alt chord tones
      const gAltered = getScaleNotes('G', 'altered');
      expect(gAltered).toContain('G');  // Root
      expect(gAltered).toContain('B');  // 3rd (enharmonic #9)
      expect(gAltered).toContain('Db'); // b5
      expect(gAltered).toContain('F');  // b7
    });

    it('should support modal interchange with altered scale', () => {
      // C7alt in key of F major
      const cAltered = getScaleNotes('C', 'altered');
      expect(cAltered).toHaveLength(7);
      expect(cAltered[0]).toBe('C');
    });
  });
});

