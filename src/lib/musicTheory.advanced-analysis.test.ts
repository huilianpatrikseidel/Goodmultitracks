/**
 * Advanced Harmonic Analysis Tests - Phase 3.2 Implementation
 * Tests for chord function analysis, borrowed chords, and secondary dominants
 */

import {
  analyzeChordFunction,
  isBorrowedChord,
  analyzeSecondaryDominant,
  getSecondaryDominant,
  type ChordFunction
} from './musicTheory';

describe('Music Theory - Advanced Harmonic Analysis (Phase 3.2)', () => {
  
  describe('analyzeChordFunction', () => {
    
    describe('Tonic Function', () => {
      it('should identify I as tonic in major', () => {
        const result = analyzeChordFunction('C', 'C', 'major');
        expect(result.function).toBe('tonic');
        expect(result.romanNumeral).toBe('I');
        expect(result.scaleDegree).toBe(1);
        expect(result.isDiatonic).toBe(true);
      });

      it('should identify vi as tonic function in major', () => {
        const result = analyzeChordFunction('Am', 'C', 'major');
        expect(result.function).toBe('tonic');
        expect(result.romanNumeral).toBe('VI');
        expect(result.scaleDegree).toBe(6);
      });

      it('should identify i as tonic in minor', () => {
        const result = analyzeChordFunction('Am', 'A', 'minor');
        expect(result.function).toBe('tonic');
        expect(result.scaleDegree).toBe(1);
      });
    });

    describe('Subdominant Function', () => {
      it('should identify IV as subdominant', () => {
        const result = analyzeChordFunction('F', 'C', 'major');
        expect(result.function).toBe('subdominant');
        expect(result.romanNumeral).toBe('IV');
        expect(result.scaleDegree).toBe(4);
        expect(result.isDiatonic).toBe(true);
      });

      it('should identify ii as subdominant', () => {
        const result = analyzeChordFunction('Dm', 'C', 'major');
        expect(result.function).toBe('subdominant');
        expect(result.romanNumeral).toBe('II');
        expect(result.scaleDegree).toBe(2);
      });

      it('should identify ii7 as subdominant', () => {
        const result = analyzeChordFunction('Dm7', 'C', 'major');
        expect(result.function).toBe('subdominant');
        expect(result.quality).toBe('m7');
      });
    });

    describe('Dominant Function', () => {
      it('should identify V as dominant', () => {
        const result = analyzeChordFunction('G', 'C', 'major');
        expect(result.function).toBe('dominant');
        expect(result.romanNumeral).toBe('V');
        expect(result.scaleDegree).toBe(5);
        expect(result.isDiatonic).toBe(true);
      });

      it('should identify V7 as dominant', () => {
        const result = analyzeChordFunction('G7', 'C', 'major');
        expect(result.function).toBe('dominant');
        expect(result.quality).toBe('7');
      });

      it('should identify vii° as dominant function', () => {
        const result = analyzeChordFunction('Bdim', 'C', 'major');
        expect(result.function).toBe('dominant');
        expect(result.scaleDegree).toBe(7);
      });
    });

    describe('Borrowed Chords', () => {
      it('should identify iv from parallel minor', () => {
        const result = analyzeChordFunction('Fm', 'C', 'major');
        expect(result.function).toBe('borrowed');
        expect(result.isDiatonic).toBe(false);
        expect(result.scaleDegree).toBe(4); // F is scale degree 4
      });

      it('should identify bVI from parallel minor', () => {
        const result = analyzeChordFunction('Ab', 'C', 'major');
        expect(result.function).toBe('borrowed');
        expect(result.isDiatonic).toBe(false);
      });

      it('should identify bVII from parallel minor', () => {
        const result = analyzeChordFunction('Bb', 'C', 'major');
        expect(result.function).toBe('borrowed');
        expect(result.isDiatonic).toBe(false);
      });
    });

    describe('Secondary Dominants', () => {
      it('should identify V7/V (D7 in C major)', () => {
        const result = analyzeChordFunction('D7', 'C', 'major');
        expect(result.function).toBe('secondary');
        expect(result.isDiatonic).toBe(false);
      });

      it('should identify V7/ii (A7 in C major)', () => {
        const result = analyzeChordFunction('A7', 'C', 'major');
        expect(result.function).toBe('secondary');
        expect(result.isDiatonic).toBe(false);
      });

      it('should identify V7/IV (C7 in C major)', () => {
        const result = analyzeChordFunction('C7', 'C', 'major');
        expect(result.function).toBe('secondary');
      });
    });
  });

  describe('isBorrowedChord', () => {
    
    describe('Parallel Key Borrowing', () => {
      it('should detect iv borrowed from parallel minor', () => {
        const result = isBorrowedChord('Fm', 'C', 'major');
        expect(result.isBorrowed).toBe(true);
        expect(result.sourceKey).toBe('C');
        expect(result.sourceMode).toBe('minor');
        expect(result.explanation).toContain('parallel minor');
      });

      it('should detect bVI borrowed from parallel minor', () => {
        const result = isBorrowedChord('Ab', 'C', 'major');
        expect(result.isBorrowed).toBe(true);
        expect(result.sourceMode).toBe('minor');
      });

      it('should detect bVII borrowed from parallel minor', () => {
        const result = isBorrowedChord('Bb', 'C', 'major');
        expect(result.isBorrowed).toBe(true);
        expect(result.sourceMode).toBe('minor');
      });

      it('should detect bIII borrowed from parallel minor', () => {
        const result = isBorrowedChord('Eb', 'C', 'major');
        expect(result.isBorrowed).toBe(true);
        expect(result.sourceMode).toBe('minor');
      });
    });

    describe('Non-Borrowed Chords', () => {
      it('should not flag diatonic I as borrowed', () => {
        const result = isBorrowedChord('C', 'C', 'major');
        expect(result.isBorrowed).toBe(false);
      });

      it('should not flag diatonic IV as borrowed', () => {
        const result = isBorrowedChord('F', 'C', 'major');
        expect(result.isBorrowed).toBe(false);
      });

      it('should not flag diatonic V as borrowed', () => {
        const result = isBorrowedChord('G', 'C', 'major');
        expect(result.isBorrowed).toBe(false);
      });
    });

    describe('Minor Key Borrowing', () => {
      it('should detect borrowed chords in minor keys', () => {
        const result = isBorrowedChord('C', 'A', 'minor');
        // C major is III in A minor - should be diatonic
        expect(result.isBorrowed).toBe(false);
      });

      it('should detect major I in minor (Picardy third)', () => {
        const result = isBorrowedChord('A', 'A', 'minor');
        // A major chord in A minor key
        expect(result.isBorrowed).toBe(true);
      });
    });
  });

  describe('analyzeSecondaryDominant', () => {
    
    describe('Secondary Dominant Detection', () => {
      it('should identify V7/V (D7 → G in C major)', () => {
        const result = analyzeSecondaryDominant('D7', 'C', 'major');
        expect(result.isSecondary).toBe(true);
        expect(result.type).toBe('dominant');
        expect(result.targetChord).toBe('G');
        expect(result.targetDegree).toBe(5);
        expect(result.romanNumeral).toBe('V7/V');
      });

      it('should identify V7/ii (A7 → Dm in C major)', () => {
        const result = analyzeSecondaryDominant('A7', 'C', 'major');
        expect(result.isSecondary).toBe(true);
        expect(result.targetChord).toBe('D');
        expect(result.targetDegree).toBe(2);
        expect(result.romanNumeral).toBe('V7/II');
      });

      it('should identify V7/IV (C7 → F in C major)', () => {
        const result = analyzeSecondaryDominant('C7', 'C', 'major');
        expect(result.isSecondary).toBe(true);
        expect(result.targetChord).toBe('F');
        expect(result.targetDegree).toBe(4);
      });

      it('should identify V7/vi (E7 → Am in C major)', () => {
        const result = analyzeSecondaryDominant('E7', 'C', 'major');
        expect(result.isSecondary).toBe(true);
        expect(result.targetChord).toBe('A');
        expect(result.targetDegree).toBe(6);
      });
    });

    describe('Secondary Leading Tone Detection', () => {
      it('should identify vii°/V (F#dim → G in C major)', () => {
        const result = analyzeSecondaryDominant('F#dim', 'C', 'major');
        expect(result.isSecondary).toBe(true);
        expect(result.type).toBe('leading-tone');
        expect(result.targetChord).toBe('G');
      });

      it('should identify vii°7 as secondary leading tone', () => {
        const result = analyzeSecondaryDominant('F#dim7', 'C', 'major');
        expect(result.isSecondary).toBe(true);
        expect(result.type).toBe('leading-tone');
      });
    });

    describe('Non-Secondary Chords', () => {
      it('should not identify diatonic V as secondary', () => {
        const result = analyzeSecondaryDominant('G', 'C', 'major');
        expect(result.isSecondary).toBe(false);
      });

      it('should not identify non-dominant quality as secondary', () => {
        const result = analyzeSecondaryDominant('Dm', 'C', 'major');
        expect(result.isSecondary).toBe(false);
      });

      it('should not identify major triads as secondary', () => {
        const result = analyzeSecondaryDominant('D', 'C', 'major');
        expect(result.isSecondary).toBe(false);
      });
    });
  });

  describe('getSecondaryDominant', () => {
    
    it('should return D7 as secondary dominant of G', () => {
      const result = getSecondaryDominant('G', 'C', 'major');
      expect(result).toBe('D7');
    });

    it('should return A7 as secondary dominant of Dm', () => {
      const result = getSecondaryDominant('Dm', 'C', 'major');
      expect(result).toBe('A7');
    });

    it('should return C7 as secondary dominant of F', () => {
      const result = getSecondaryDominant('F', 'C', 'major');
      expect(result).toBe('C7');
    });

    it('should return E7 as secondary dominant of Am', () => {
      const result = getSecondaryDominant('Am', 'C', 'major');
      expect(result).toBe('E7');
    });

    it('should return B7 as secondary dominant of Em', () => {
      const result = getSecondaryDominant('Em', 'C', 'major');
      expect(result).toBe('B7');
    });

    it('should work with sharp keys', () => {
      const result = getSecondaryDominant('D', 'G', 'major');
      expect(result).toBe('A7');
    });

    it('should work with flat keys', () => {
      const result = getSecondaryDominant('Bb', 'F', 'major');
      expect(result).toBe('F7');
    });
  });

  describe('Real-World Progressions', () => {
    
    it('should analyze ii-V-I progression', () => {
      const ii = analyzeChordFunction('Dm7', 'C', 'major');
      const V = analyzeChordFunction('G7', 'C', 'major');
      const I = analyzeChordFunction('C', 'C', 'major');

      expect(ii.function).toBe('subdominant');
      expect(V.function).toBe('dominant');
      expect(I.function).toBe('tonic');
    });

    it('should analyze I-IV-V progression', () => {
      const I = analyzeChordFunction('C', 'C', 'major');
      const IV = analyzeChordFunction('F', 'C', 'major');
      const V = analyzeChordFunction('G', 'C', 'major');

      expect(I.function).toBe('tonic');
      expect(IV.function).toBe('subdominant');
      expect(V.function).toBe('dominant');
    });

    it('should analyze I-vi-IV-V progression', () => {
      const I = analyzeChordFunction('C', 'C', 'major');
      const vi = analyzeChordFunction('Am', 'C', 'major');
      const IV = analyzeChordFunction('F', 'C', 'major');
      const V = analyzeChordFunction('G', 'C', 'major');

      expect(I.function).toBe('tonic');
      expect(vi.function).toBe('tonic');
      expect(IV.function).toBe('subdominant');
      expect(V.function).toBe('dominant');
    });

    it('should analyze progression with secondary dominants', () => {
      // I - V7/IV - IV - V - I
      const I = analyzeChordFunction('C', 'C', 'major');
      const V7ofIV = analyzeChordFunction('C7', 'C', 'major');
      const IV = analyzeChordFunction('F', 'C', 'major');

      expect(I.function).toBe('tonic');
      expect(V7ofIV.function).toBe('secondary');
      expect(IV.function).toBe('subdominant');
    });

    it('should analyze progression with borrowed chords', () => {
      // I - iv - V - I (with borrowed iv)
      const I = analyzeChordFunction('C', 'C', 'major');
      const iv = analyzeChordFunction('Fm', 'C', 'major');
      const V = analyzeChordFunction('G', 'C', 'major');

      expect(I.function).toBe('tonic');
      expect(iv.function).toBe('borrowed');
      expect(V.function).toBe('dominant');

      const borrowedInfo = isBorrowedChord('Fm', 'C', 'major');
      expect(borrowedInfo.isBorrowed).toBe(true);
      expect(borrowedInfo.sourceMode).toBe('minor');
    });

    it('should analyze jazz ii-V-I with secondary dominants', () => {
      // V7/ii - ii7 - V7 - I
      const V7ofii = analyzeSecondaryDominant('A7', 'C', 'major');
      const ii7 = analyzeChordFunction('Dm7', 'C', 'major');
      const V7 = analyzeChordFunction('G7', 'C', 'major');
      const I = analyzeChordFunction('Cmaj7', 'C', 'major');

      expect(V7ofii.isSecondary).toBe(true);
      expect(V7ofii.targetDegree).toBe(2);
      expect(ii7.function).toBe('subdominant');
      expect(V7.function).toBe('dominant');
      expect(I.function).toBe('tonic');
    });
  });

  describe('Edge Cases', () => {
    
    it('should handle chromatic chords that are not secondary dominants', () => {
      const result = analyzeChordFunction('Db', 'C', 'major');
      // Db is not diatonic and not a secondary dominant
      expect(result.isDiatonic).toBe(false);
    });

    it('should handle augmented chords', () => {
      const result = analyzeChordFunction('Caug', 'C', 'major');
      expect(result.isDiatonic).toBe(false);
    });

    it('should handle extended chords', () => {
      const result = analyzeChordFunction('Dm9', 'C', 'major');
      expect(result.function).toBe('subdominant');
    });

    it('should handle altered dominants', () => {
      const result = analyzeChordFunction('G7#5', 'C', 'major');
      expect(result.function).toBe('dominant');
    });
  });
});
