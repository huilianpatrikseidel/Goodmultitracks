// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
/**
 * Time Conversion Helpers - Enhanced with MusicTheory Integration
 * 
 * Versões aprimoradas das funções de conversão tempo/compasso que usam
 * análise avançada de fórmulas de compasso.
 * 
 * Suporta:
 * - Compassos compostos (6/8, 9/8, 12/8)
 * - Compassos irregulares (5/8, 7/8, 5/4, 7/4)
 * - Denominadores não-diadicos (3, 6, 12)
 * - Tuplet meters com beatRatio
 */

import {
  analyzeTimeSignature,
  type TimeSignatureInfo,
} from '../timeSignatures';
import { TempoChange } from '../../../types';

/**
 * Convert measure number to seconds with advanced time signature support
 * 
 * @param measure - Target measure number (1-based)
 * @param tempoChanges - Array of tempo changes (time in SECONDS)
 * @param baseTempo - Initial tempo in BPM
 * @param timeSignature - Time signature (e.g., '4/4', '6/8', '7/8')
 * @returns Absolute time in seconds
 */
export function measureToSecondsAdvanced(
  measure: number,
  tempoChanges: TempoChange[],
  baseTempo: number,
  timeSignature: string = '4/4'
): number {
  // Analyze time signature to get precise measure duration
  const tsInfo = analyzeTimeSignature(timeSignature, baseTempo);
  
  const sortedChanges = [...tempoChanges].sort((a, b) => a.time - b.time);
  
  let currentSeconds = 0;
  let currentMeasure = 1;
  let currentTempo = baseTempo;
  let currentTSInfo = tsInfo;
  
  for (const change of sortedChanges) {
    if (change.time <= currentSeconds) {
      currentTempo = change.tempo;
      if (change.timeSignature) {
        currentTSInfo = analyzeTimeSignature(change.timeSignature, currentTempo);
      }
      continue;
    }
    
    // Calculate seconds per measure using analyzed info
    const secondsPerMeasure = calculateSecondsPerMeasure(currentTSInfo, currentTempo);
    const measuresUntilChange = (change.time - currentSeconds) / secondsPerMeasure;
    const targetMeasure = currentMeasure + measuresUntilChange;
    
    if (targetMeasure >= measure) {
      const remainingMeasures = measure - currentMeasure;
      return currentSeconds + (remainingMeasures * secondsPerMeasure);
    }
    
    currentSeconds = change.time;
    currentMeasure = targetMeasure;
    currentTempo = change.tempo;
    if (change.timeSignature) {
      currentTSInfo = analyzeTimeSignature(change.timeSignature, currentTempo);
    }
  }
  
  // Add remaining measures after last tempo change
  const remainingMeasures = measure - currentMeasure;
  if (remainingMeasures > 0) {
    const secondsPerMeasure = calculateSecondsPerMeasure(currentTSInfo, currentTempo);
    currentSeconds += remainingMeasures * secondsPerMeasure;
  }
  
  return currentSeconds;
}

/**
 * Convert seconds to measure number with advanced time signature support
 * 
 * @param seconds - Target time in seconds
 * @param tempoChanges - Array of tempo changes (time in SECONDS)
 * @param baseTempo - Initial tempo in BPM
 * @param timeSignature - Time signature (e.g., '4/4', '6/8', '7/8')
 * @returns Measure number (1-based, can be fractional)
 */
export function secondsToMeasureAdvanced(
  seconds: number,
  tempoChanges: TempoChange[],
  baseTempo: number,
  timeSignature: string = '4/4'
): number {
  const tsInfo = analyzeTimeSignature(timeSignature, baseTempo);
  const sortedChanges = [...tempoChanges].sort((a, b) => a.time - b.time);
  
  let currentSeconds = 0;
  let currentMeasure = 1;
  let currentTempo = baseTempo;
  let currentTSInfo = tsInfo;
  
  for (const change of sortedChanges) {
    if (change.time <= currentSeconds) {
      currentTempo = change.tempo;
      if (change.timeSignature) {
        currentTSInfo = analyzeTimeSignature(change.timeSignature, currentTempo);
      }
      continue;
    }
    
    if (change.time > seconds) {
      const remainingSeconds = seconds - currentSeconds;
      const secondsPerMeasure = calculateSecondsPerMeasure(currentTSInfo, currentTempo);
      const remainingMeasures = remainingSeconds / secondsPerMeasure;
      return currentMeasure + remainingMeasures;
    }
    
    const segmentSeconds = change.time - currentSeconds;
    const secondsPerMeasure = calculateSecondsPerMeasure(currentTSInfo, currentTempo);
    const segmentMeasures = segmentSeconds / secondsPerMeasure;
    
    currentSeconds = change.time;
    currentMeasure += segmentMeasures;
    currentTempo = change.tempo;
    if (change.timeSignature) {
      currentTSInfo = analyzeTimeSignature(change.timeSignature, currentTempo);
    }
  }
  
  const remainingSeconds = seconds - currentSeconds;
  const secondsPerMeasure = calculateSecondsPerMeasure(currentTSInfo, currentTempo);
  const remainingMeasures = remainingSeconds / secondsPerMeasure;
  
  return currentMeasure + remainingMeasures;
}

/**
 * Calculate seconds per measure from TimeSignatureInfo
 * 
 * Handles:
 * - Simple meters (4/4, 3/4, 2/4)
 * - Compound meters (6/8, 9/8, 12/8)
 * - Irregular meters (5/8, 7/8, 5/4, 7/4)
 * - Tuplet meters with beatRatio
 * 
 * @param tsInfo - Analyzed time signature information
 * @param tempo - Tempo in BPM
 * @returns Duration of one measure in seconds
 */
export function calculateSecondsPerMeasure(
  tsInfo: TimeSignatureInfo,
  tempo: number
): number {
  // Quarter note duration in seconds
  const quarterNoteDuration = 60 / tempo;
  
  // Base duration from measureDurationInQuarters
  let measureDuration = tsInfo.measureDurationInQuarters * quarterNoteDuration;
  
  // Apply beat ratio for tuplet meters
  // Example: 4/6 meter has beatRatio = 2/3
  // This means 4 triplet quarters = 2/3 of standard measure
  if (tsInfo.beatRatio !== undefined) {
    measureDuration *= tsInfo.beatRatio;
  }
  
  return measureDuration;
}

/**
 * Calculate beat duration in seconds from TimeSignatureInfo
 * 
 * @param tsInfo - Analyzed time signature information
 * @param tempo - Tempo in BPM (represents the beat unit)
 * @returns Duration of one beat in seconds
 */
export function calculateSecondsPerBeat(
  tsInfo: TimeSignatureInfo,
  tempo: number
): number {
  const measureDuration = calculateSecondsPerMeasure(tsInfo, tempo);
  return measureDuration / tsInfo.beatsPerMeasure;
}

/**
 * Calculate pulse duration in seconds from TimeSignatureInfo
 * 
 * Pulse is the smallest rhythmic unit (e.g., eighth notes in compound meters)
 * 
 * @param tsInfo - Analyzed time signature information
 * @param tempo - Tempo in BPM
 * @returns Duration of one pulse in seconds
 */
export function calculateSecondsPerPulse(
  tsInfo: TimeSignatureInfo,
  tempo: number
): number {
  const measureDuration = calculateSecondsPerMeasure(tsInfo, tempo);
  return measureDuration / tsInfo.pulsesPerMeasure;
}

/**
 * Calculate time position for a specific beat within a measure
 * 
 * @param measureStart - Start time of measure in seconds
 * @param beatNumber - Beat number (1-based)
 * @param tsInfo - Analyzed time signature information
 * @param tempo - Tempo in BPM
 * @returns Time position in seconds
 */
export function calculateBeatTime(
  measureStart: number,
  beatNumber: number,
  tsInfo: TimeSignatureInfo,
  tempo: number
): number {
  const beatDuration = calculateSecondsPerBeat(tsInfo, tempo);
  return measureStart + (beatNumber - 1) * beatDuration;
}

/**
 * Calculate time position for a specific pulse within a measure
 * 
 * @param measureStart - Start time of measure in seconds
 * @param pulseNumber - Pulse number (0-based, matching metronome structure)
 * @param tsInfo - Analyzed time signature information
 * @param tempo - Tempo in BPM
 * @returns Time position in seconds
 */
export function calculatePulseTime(
  measureStart: number,
  pulseNumber: number,
  tsInfo: TimeSignatureInfo,
  tempo: number
): number {
  const pulseDuration = calculateSecondsPerPulse(tsInfo, tempo);
  return measureStart + pulseNumber * pulseDuration;
}

/**
 * Get measure and beat position from time
 * 
 * @param seconds - Time in seconds
 * @param tempoChanges - Array of tempo changes
 * @param baseTempo - Initial tempo in BPM
 * @param timeSignature - Time signature
 * @returns Object with measure number (1-based) and beat within measure (1-based)
 */
export function getPositionFromTime(
  seconds: number,
  tempoChanges: TempoChange[],
  baseTempo: number,
  timeSignature: string = '4/4'
): { measure: number; beat: number; beatFraction: number } {
  const measureFloat = secondsToMeasureAdvanced(seconds, tempoChanges, baseTempo, timeSignature);
  const measure = Math.floor(measureFloat);
  const measureFraction = measureFloat - measure;
  
  const tsInfo = analyzeTimeSignature(timeSignature, baseTempo);
  const beatFloat = measureFraction * tsInfo.beatsPerMeasure + 1;
  const beat = Math.floor(beatFloat);
  const beatFraction = beatFloat - beat;
  
  return {
    measure: measure,
    beat: beat,
    beatFraction: beatFraction,
  };
}

/**
 * Format position as measure:beat string
 * 
 * @example
 * formatPosition({ measure: 5, beat: 3, beatFraction: 0.5 }) → "5.3.5"
 */
export function formatPosition(position: { measure: number; beat: number; beatFraction: number }): string {
  const beatSubdivision = Math.floor(position.beatFraction * 10);
  return `${position.measure}.${position.beat}.${beatSubdivision}`;
}

