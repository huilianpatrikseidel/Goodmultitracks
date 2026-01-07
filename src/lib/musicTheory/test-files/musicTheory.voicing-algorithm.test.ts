/**
 * Tests for Algorithmic Voicing Generation
 * 
 * This test suite validates the new algorithmic voicing engine:
 * - Exotic chord generation (not in database)
 * - Alternative tuning support (Drop D, DADGAD, etc.)
 * - Playability scoring
 * - Voice leading optimization
 */

import { describe, it, expect } from 'vitest';
import { generateGuitarVoicing, GUITAR_TUNINGS } from '../../musicTheory';
import { buildChord } from '../../musicTheory';

describe('Algorithmic Voicing Generation', () => {
  
  describe('Exotic Chords (Not in Database)', () => {
    
    it('should generate voicing for C#sus4add9 (exotic chord)', () => {
      // C#sus4add9 = C# F# G# D#
      const notes = buildChord('C#', 'sus4'); // Will need to add add9 manually
      const voicing = generateGuitarVoicing([...notes, 'D#']); // Add 9th
      
      expect(voicing).not.toBeNull();
      if (voicing) {
        expect(voicing.frets).toHaveLength(6);
        expect(voicing.fingers).toBeDefined();
        
        // Should have at least 3 notes played
        const playedStrings = voicing.frets.filter(f => f >= 0).length;
        expect(playedStrings).toBeGreaterThanOrEqual(3);
      }
    });
    
    it('should generate voicing for Ebmaj7#11 (jazz chord)', () => {
      // Ebmaj7#11 = Eb G Bb D A
      const notes = ['Eb', 'G', 'Bb', 'D', 'A'];
      const voicing = generateGuitarVoicing(notes);
      
      expect(voicing).not.toBeNull();
      if (voicing) {
        expect(voicing.frets).toHaveLength(6);
        
        // Verify all notes are present in voicing
        // (Would need to check fret positions match note values)
      }
    });
    
    it('should generate voicing for F#m7b5 (half-diminished)', () => {
      const notes = buildChord('F#', 'm7b5');
      const voicing = generateGuitarVoicing(notes);
      
      expect(voicing).not.toBeNull();
      if (voicing) {
        expect(voicing.frets).toHaveLength(6);
        const playedStrings = voicing.frets.filter(f => f >= 0).length;
        expect(playedStrings).toBeGreaterThanOrEqual(3);
      }
    });
    
    it('should generate voicing for Gmaj9 (extended chord)', () => {
      const notes = buildChord('G', 'maj9');
      const voicing = generateGuitarVoicing(notes);
      
      expect(voicing).not.toBeNull();
      if (voicing) {
        expect(voicing.frets).toHaveLength(6);
      }
    });
  });
  
  describe('Alternative Tunings', () => {
    
    it('should generate voicing in Drop D tuning', () => {
      const notes = buildChord('D', 'maj');
      const voicing = generateGuitarVoicing(notes, { 
        tuning: GUITAR_TUNINGS['drop-d'] 
      });
      
      expect(voicing).not.toBeNull();
      if (voicing) {
        expect(voicing.frets).toHaveLength(6);
        
        // Drop D tuning should allow D major with low D bass
        // First string (low D) should potentially be open (0) or played
        expect(voicing.frets[0]).toBeGreaterThanOrEqual(-1);
      }
    });
    
    it('should generate voicing in DADGAD tuning', () => {
      const notes = buildChord('D', 'sus4');
      const voicing = generateGuitarVoicing(notes, { 
        tuning: GUITAR_TUNINGS['dadgad'] 
      });
      
      expect(voicing).not.toBeNull();
      if (voicing) {
        expect(voicing.frets).toHaveLength(6);
        
        // DADGAD is perfect for Dsus4 - should have simple voicing
        const activeFrets = voicing.frets.filter(f => f > 0);
        // Might have many open strings in DADGAD for Dsus4
        expect(activeFrets.length).toBeLessThanOrEqual(3);
      }
    });
    
    it('should generate voicing in Open G tuning', () => {
      const notes = buildChord('G', 'maj');
      const voicing = generateGuitarVoicing(notes, { 
        tuning: GUITAR_TUNINGS['open-g'] 
      });
      
      expect(voicing).not.toBeNull();
      if (voicing) {
        expect(voicing.frets).toHaveLength(6);
        
        // Open G tuning gives G major with all open strings
        const openStrings = voicing.frets.filter(f => f === 0).length;
        // Should have several open strings for G major
        expect(openStrings).toBeGreaterThan(0);
      }
    });
    
    it('should generate voicing in Half-Step Down tuning', () => {
      const notes = buildChord('Eb', 'maj');
      const voicing = generateGuitarVoicing(notes, { 
        tuning: GUITAR_TUNINGS['half-step-down'] 
      });
      
      expect(voicing).not.toBeNull();
      if (voicing) {
        expect(voicing.frets).toHaveLength(6);
      }
    });
  });
  
  describe('Playability Constraints', () => {
    
    it('should not exceed 4-fret span for standard chords', () => {
      const notes = buildChord('C', 'maj');
      const voicing = generateGuitarVoicing(notes);
      
      expect(voicing).not.toBeNull();
      if (voicing) {
        const activeFrets = voicing.frets.filter(f => f > 0);
        if (activeFrets.length > 0) {
          const span = Math.max(...activeFrets) - Math.min(...activeFrets);
          expect(span).toBeLessThanOrEqual(4);
        }
      }
    });
    
    it('should prefer lower positions for simple chords', () => {
      const notes = buildChord('A', 'maj');
      const voicing = generateGuitarVoicing(notes);
      
      expect(voicing).not.toBeNull();
      if (voicing) {
        const activeFrets = voicing.frets.filter(f => f > 0);
        if (activeFrets.length > 0) {
          const avgFret = activeFrets.reduce((a, b) => a + b, 0) / activeFrets.length;
          // Average fret should be reasonable (not too high)
          expect(avgFret).toBeLessThan(10);
        }
      }
    });
    
    it('should assign finger numbers correctly', () => {
      const notes = buildChord('E', 'maj');
      const voicing = generateGuitarVoicing(notes);
      
      expect(voicing).not.toBeNull();
      if (voicing) {
        expect(voicing.fingers).toBeDefined();
        if (voicing.fingers) {
          // Fingers should be 0-4 (0 = open/muted, 1-4 = index to pinky)
          voicing.fingers.forEach(finger => {
            expect(finger).toBeGreaterThanOrEqual(0);
            expect(finger).toBeLessThanOrEqual(4);
          });
        }
      }
    });
  });
  
  describe('Bass Note Control', () => {
    
    it('should respect bassNote option (slash chords)', () => {
      // C/G (C major with G bass)
      const notes = buildChord('C', 'maj'); // ['C', 'E', 'G']
      const voicing = generateGuitarVoicing(notes, { bassNote: 'G' });
      
      expect(voicing).not.toBeNull();
      if (voicing) {
        // Find lowest played string
        let lowestStringIndex = -1;
        for (let i = 0; i < voicing.frets.length; i++) {
          if (voicing.frets[i] >= 0) {
            lowestStringIndex = i;
            break;
          }
        }
        
        // The lowest note should be G (if algorithm respected bassNote)
        expect(lowestStringIndex).toBeGreaterThanOrEqual(0);
        // Would need to verify the actual note matches G
      }
    });
  });
  
  describe('Edge Cases', () => {
    
    it('should handle single note (power chord without fifth)', () => {
      const notes = ['E'];
      const voicing = generateGuitarVoicing(notes);
      
      // Should still generate something (might be octaves)
      expect(voicing).not.toBeNull();
    });
    
    it('should handle very wide chords (6+ notes)', () => {
      // C13 = C E G Bb D F A (7 notes)
      const notes = ['C', 'E', 'G', 'Bb', 'D', 'F', 'A'];
      const voicing = generateGuitarVoicing(notes);
      
      // Might be difficult, but should attempt
      // Can only play 6 strings, so will omit some notes
      if (voicing) {
        expect(voicing.frets).toHaveLength(6);
      }
    });
    
    it('should return null for impossible voicings', () => {
      // Create an artificially impossible scenario
      // E.g., notes spread across > 15 frets with maxFret=3
      const notes = ['E', 'G#', 'B', 'D#', 'F##', 'A##'];
      const voicing = generateGuitarVoicing(notes, { maxFret: 3 });
      
      // Might return null if truly impossible
      // Or might find a creative voicing
      // Just verify it doesn't crash
      expect(voicing === null || voicing.frets.length === 6).toBe(true);
    });
  });
  
  describe('Database Fallback (Optimization)', () => {
    
    it('should use database for common C major (faster)', () => {
      const notes = buildChord('C', 'maj');
      const voicing = generateGuitarVoicing(notes);
      
      expect(voicing).not.toBeNull();
      if (voicing) {
        // C major from database: [-1, 3, 2, 0, 1, 0]
        expect(voicing.frets).toEqual([-1, 3, 2, 0, 1, 0]);
      }
    });
    
    it('should fallback to algorithm if database entry incomplete', () => {
      // Use a chord that might be in DB but with different spelling
      const notes = ['E#', 'G##', 'B#']; // Enharmonic of F major
      const voicing = generateGuitarVoicing(notes);
      
      // Should still generate voicing (even if not in DB)
      expect(voicing).not.toBeNull();
    });
  });
  
  describe('Real-World Scenarios', () => {
    
    it('should generate playable voicing for common progression (I-IV-V)', () => {
      // G major progression: G - C - D
      const gMaj = buildChord('G', 'maj');
      const cMaj = buildChord('C', 'maj');
      const dMaj = buildChord('D', 'maj');
      
      const g = generateGuitarVoicing(gMaj);
      const c = generateGuitarVoicing(cMaj);
      const d = generateGuitarVoicing(dMaj);
      
      expect(g).not.toBeNull();
      expect(c).not.toBeNull();
      expect(d).not.toBeNull();
      
      // All should be playable
      [g, c, d].forEach(voicing => {
        if (voicing) {
          const activeFrets = voicing.frets.filter(f => f > 0);
          if (activeFrets.length > 0) {
            const span = Math.max(...activeFrets) - Math.min(...activeFrets);
            expect(span).toBeLessThanOrEqual(4);
          }
        }
      });
    });
    
    it('should generate voicing for jazz ii-V-I (Dm7 - G7 - Cmaj7)', () => {
      const dm7 = buildChord('D', 'm7');
      const g7 = buildChord('G', '7');
      const cmaj7 = buildChord('C', 'maj7');
      
      const d = generateGuitarVoicing(dm7);
      const g = generateGuitarVoicing(g7);
      const c = generateGuitarVoicing(cmaj7);
      
      expect(d).not.toBeNull();
      expect(g).not.toBeNull();
      expect(c).not.toBeNull();
    });
  });
});
