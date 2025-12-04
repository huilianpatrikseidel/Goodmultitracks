import { TempoChange } from '../types';

/**
 * TIME STANDARD ENFORCEMENT (QA Critical Fix)
 * ============================================
 * 
 * IMPORTANT: TempoChange.time is ALWAYS in SECONDS (not measures!)
 * See /docs/TIME_STANDARD.md for complete specification.
 * 
 * This file provides utilities to convert between:
 * - Measure numbers (1-based musical positions)
 * - Seconds (absolute time in audio timeline)
 * 
 * All conversions respect variable tempo maps.
 */

/**
 * Converts a measure number (1-based) to absolute time in seconds.
 * Handles variable tempo maps where TempoChange.time is in SECONDS.
 * 
 * @param measure - Target measure number (1-based)
 * @param tempoChanges - Array of tempo changes (time in SECONDS)
 * @param baseTempo - Initial tempo in BPM
 * @param timeSignature - Time signature (e.g., "4/4")
 * @returns Absolute time in seconds
 */
export function measureToSeconds(
  measure: number,
  tempoChanges: TempoChange[],
  baseTempo: number,
  timeSignature: string = '4/4'
): number {
  const [beatsPerMeasure] = timeSignature.split('/').map(Number);
  
  // CRITICAL FIX: TempoChange.time is in SECONDS, not measures
  // We need to convert this to a measure-based map for calculation
  const sortedChanges = [...tempoChanges].sort((a, b) => a.time - b.time);
  
  let currentSeconds = 0;
  let currentMeasure = 1; // 1-based
  let currentTempo = baseTempo;
  
  // Build a measure-based map from the second-based tempo changes
  // We need to track which tempo is active at each point
  
  for (const change of sortedChanges) {
    // Skip if this change is at or before our current position
    if (change.time <= currentSeconds) {
      currentTempo = change.tempo;
      continue;
    }
    
    // Calculate how many measures we can fit before this tempo change
    const secondsPerMeasure = (beatsPerMeasure * 60) / currentTempo;
    const measuresUntilChange = (change.time - currentSeconds) / secondsPerMeasure;
    const targetMeasure = currentMeasure + measuresUntilChange;
    
    // If our target measure is before this tempo change, we're done
    if (targetMeasure >= measure) {
      const remainingMeasures = measure - currentMeasure;
      return currentSeconds + (remainingMeasures * secondsPerMeasure);
    }
    
    // Otherwise, advance to the tempo change
    currentSeconds = change.time;
    currentMeasure = targetMeasure;
    currentTempo = change.tempo;
  }
  
  // Add remaining measures after the last tempo change
  const remainingMeasures = measure - currentMeasure;
  if (remainingMeasures > 0) {
    const secondsPerMeasure = (beatsPerMeasure * 60) / currentTempo;
    currentSeconds += remainingMeasures * secondsPerMeasure;
  }
  
  return currentSeconds;
}

/**
 * Converts absolute time in seconds to a measure number (1-based).
 * Handles variable tempo maps where TempoChange.time is in SECONDS.
 * 
 * @param seconds - Target time in seconds
 * @param tempoChanges - Array of tempo changes (time in SECONDS)
 * @param baseTempo - Initial tempo in BPM
 * @param timeSignature - Time signature (e.g., "4/4")
 * @returns Measure number (1-based, can be fractional)
 */
export function secondsToMeasure(
  seconds: number,
  tempoChanges: TempoChange[],
  baseTempo: number,
  timeSignature: string = '4/4'
): number {
  const [beatsPerMeasure] = timeSignature.split('/').map(Number);
  const sortedChanges = [...tempoChanges].sort((a, b) => a.time - b.time);
  
  let currentSeconds = 0;
  let currentMeasure = 1;
  let currentTempo = baseTempo;
  
  // CRITICAL FIX: TempoChange.time is in SECONDS, not measures
  for (const change of sortedChanges) {
    // Skip changes at or before our current position
    if (change.time <= currentSeconds) {
      currentTempo = change.tempo;
      continue;
    }
    
    // If target time is before this tempo change, calculate and return
    if (change.time > seconds) {
      const remainingSeconds = seconds - currentSeconds;
      const secondsPerMeasure = (beatsPerMeasure * 60) / currentTempo;
      const remainingMeasures = remainingSeconds / secondsPerMeasure;
      return currentMeasure + remainingMeasures;
    }
    
    // Calculate measures up to this tempo change
    const segmentSeconds = change.time - currentSeconds;
    const secondsPerMeasure = (beatsPerMeasure * 60) / currentTempo;
    const segmentMeasures = segmentSeconds / secondsPerMeasure;
    
    currentSeconds = change.time;
    currentMeasure += segmentMeasures;
    currentTempo = change.tempo;
  }
  
  // Calculate remaining measures after the last tempo change
  const remainingSeconds = seconds - currentSeconds;
  const secondsPerMeasure = (beatsPerMeasure * 60) / currentTempo;
  const remainingMeasures = remainingSeconds / secondsPerMeasure;
  
  return currentMeasure + remainingMeasures;
}

/**
 * Calculates the new BPM required to stretch a segment of measures to a specific duration in seconds.
 */
export function calculateWarpBPM(
  deltaMeasures: number,
  deltaSeconds: number,
  beatsPerMeasure: number
): number {
  if (deltaSeconds <= 0) return 120; // Fallback to safe default
  
  const bpm = (deltaMeasures * beatsPerMeasure * 60) / deltaSeconds;
  
  // Safety clamp to prevent engine crashes
  return Math.max(10, Math.min(999, bpm));
}