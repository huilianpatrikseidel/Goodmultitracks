/**
 * ============================================================================
 * RHYTHM MODULE - Metronome & Accent Analysis
 * ============================================================================
 * Functions for rhythm analysis, metronome beat positions, and accent levels.
 */

import { TimeSignatureInfo } from './timeSignatures';

/**
 * Get metronome beat positions for a time signature
 * Returns array of beat positions (0-based) that should be clicked
 * 
 * @param timeSignature - Analyzed time signature info
 * @returns Array of beat positions
 * 
 * @example
 * // For 4/4 time
 * getMetronomeBeatPositions(info) → [0, 1, 2, 3]
 * 
 * // For 6/8 time (compound)
 * getMetronomeBeatPositions(info) → [0, 3] (2 dotted quarter beats)
 */
export function getMetronomeBeatPositions(timeSignature: TimeSignatureInfo): number[] {
  const positions: number[] = [];
  
  if (timeSignature.type === 'compound') {
    // Compound meters: click on each dotted beat
    // e.g., 6/8 = 2 beats, 9/8 = 3 beats, 12/8 = 4 beats
    const beatsPerMeasure = timeSignature.beatsPerMeasure;
    const subdivisions = timeSignature.numerator / beatsPerMeasure; // Usually 3
    
    for (let i = 0; i < beatsPerMeasure; i++) {
      positions.push(i * subdivisions);
    }
  } else if (timeSignature.type === 'irregular') {
    // Irregular meters: click on each group start
    let position = 0;
    for (const groupSize of timeSignature.grouping) {
      positions.push(position);
      position += groupSize;
    }
  } else {
    // Simple meters: click on each beat
    for (let i = 0; i < timeSignature.beatsPerMeasure; i++) {
      positions.push(i);
    }
  }
  
  return positions;
}

/**
 * Get accent level for a specific beat position
 * 
 * @param beatIndex - Beat position (0-based)
 * @param timeSignature - Analyzed time signature info
 * @returns Accent level (0 = weak, 1 = medium, 2 = strong)
 * 
 * @example
 * // For 4/4 time
 * getAccentLevel(0, info) → 2 (downbeat - strong)
 * getAccentLevel(1, info) → 1 (weak)
 * getAccentLevel(2, info) → 1 (medium)
 * getAccentLevel(3, info) → 1 (weak)
 */
export function getAccentLevel(beatIndex: number, timeSignature: TimeSignatureInfo): number {
  // Downbeat is always strongest
  if (beatIndex === 0) return 2;
  
  if (timeSignature.type === 'compound') {
    // In compound meters, each main beat gets medium accent
    const subdivisions = timeSignature.numerator / timeSignature.beatsPerMeasure;
    const isMainBeat = beatIndex % subdivisions === 0;
    return isMainBeat ? 1 : 0;
  } else if (timeSignature.type === 'irregular') {
    // In irregular meters, group starts get medium accent
    let position = 0;
    for (const groupSize of timeSignature.grouping) {
      if (beatIndex === position) return 1; // Group start
      position += groupSize;
    }
    return 0; // Subdivision
  } else {
    // Simple meters: traditional accent patterns
    const { beatsPerMeasure } = timeSignature;
    
    // Common patterns
    if (beatsPerMeasure === 4) {
      // 4/4: Strong-weak-medium-weak
      return beatIndex === 2 ? 1 : (beatIndex === 0 ? 2 : 0);
    } else if (beatsPerMeasure === 3) {
      // 3/4: Strong-weak-weak
      return beatIndex === 0 ? 2 : 0;
    } else if (beatsPerMeasure === 2) {
      // 2/4: Strong-weak
      return beatIndex === 0 ? 2 : 0;
    } else {
      // Default: all beats except downbeat are weak
      return beatIndex === 0 ? 2 : 1;
    }
  }
}

/**
 * Get subdivision pattern for a time signature
 * Useful for displaying sub-beat divisions in UI
 * 
 * @param timeSignature - Analyzed time signature info
 * @returns Number of subdivisions per beat
 */
export function getSubdivisionsPerBeat(timeSignature: TimeSignatureInfo): number {
  if (timeSignature.type === 'compound') {
    // Compound meters divide into 3 (triplets)
    return 3;
  } else {
    // Simple meters typically divide into 2 or 4
    return timeSignature.denominator <= 4 ? 2 : 4;
  }
}
