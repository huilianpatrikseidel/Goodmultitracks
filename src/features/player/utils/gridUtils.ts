// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
/**
 * Grid Utilities - Pure functions for timeline grid calculations
 * 
 * REFACTORED (Fase 3): Agora usa useTimelineGrid hook para análise avançada
 * de fórmulas de compasso, mantendo funções auxiliares para compatibilidade.
 * 
 * This module contains all the mathematical logic for calculating
 * measure bars, time markers, and grid positions in the timeline.
 * 
 * Separated from UI components for:
 * - Better testability (pure functions)
 * - Performance (can be memoized easily)
 * - Maintainability (single source of truth for grid math)
 * 
 * NOTA: Para novos componentes, use useTimelineGrid hook diretamente.
 * Estas funções são mantidas para compatibilidade com código legado.
 */

import { TempoChange } from '../../../types';
import { secondsToMeasure } from '../../../lib/timeUtils';
import { analyzeTimeSignature, getMetronomeClickStructure } from '../../../lib/musicTheory';

export interface MeasureBar {
  position: number; // Position in seconds
  measureNumber: number;
  isStrongBar: boolean; // Every 4th measure
}

export interface TimeMarker {
  position: number; // Position in seconds
  label: string;
  type: 'second' | 'minute' | 'beat';
}

export interface GridLine {
  position: number;
  opacity: number; // 1.0 for strong lines, 0.5 for weak lines
  type: 'measure' | 'beat' | 'subdivision';
  /** NEW: Accent level for hierarchy (2 = downbeat, 1 = beat, 0 = subdivision) */
  accentLevel?: number;
  /** NEW: Measure number (1-based, only for measure lines) */
  measureNumber?: number;
}

/**
 * Calculate measure bars for a given duration
 * P0 FIX: Otimizado para processar apenas janela visível
 * @param duration Total duration in seconds
 * @param tempo Base tempo in BPM
 * @param timeSignature Time signature (e.g., "4/4")
 * @param tempoChanges Optional tempo changes (time in SECONDS - see /docs/TIME_STANDARD.md)
 * @param visibleStartTime Início da janela visível (opcional)
 * @param visibleEndTime Fim da janela visível (opcional)
 * @returns Array of measure bar positions
 */
export function calculateMeasureBars(
  duration: number,
  tempo: number,
  timeSignature: string = '4/4',
  tempoChanges?: TempoChange[],
  visibleStartTime?: number,
  visibleEndTime?: number
): MeasureBar[] {
  const [beatsPerMeasure] = timeSignature.split('/').map(Number);
  const bars: MeasureBar[] = [];
  
  // Sort tempo changes by measure
  const sortedChanges = tempoChanges ? [...tempoChanges].sort((a, b) => a.time - b.time) : [];
  
  let currentMeasure = 1;
  let currentTime = 0;
  let currentTempo = tempo;
  
  // Optimization: Jump to visible start time if provided
  if (visibleStartTime !== undefined && visibleStartTime > 0) {
    // Use helper to find approximate measure number
    // We need to pass the tempo changes to get accurate measure number
    const startMeasureFloat = secondsToMeasure(visibleStartTime, sortedChanges, tempo, timeSignature);
    currentMeasure = Math.floor(startMeasureFloat);
    
    // We need to calculate the exact start time of this measure
    // This is expensive if we just jump, so we might need measureToSeconds too
    // But for now, let's just iterate from 0 if we don't have measureToSeconds imported
    // Wait, I can import measureToSeconds too.
    // Let's just iterate from 0 for correctness for now, or use measureToSeconds if I import it.
    // Since I didn't import measureToSeconds yet, let's add it to imports.
  }
  
  // Re-implementing the loop to be measure-based
  // We need to calculate exact time for the start measure if we jumped
  // Ideally we use measureToSeconds.
  // Let's assume we start from 0 for safety unless we import measureToSeconds.
  // But wait, I can just import it.
  
  // Let's use a simpler approach for now: Iterate from 0 but skip pushing until visibleStartTime.
  // This is O(N) where N is number of measures. For a 5 min song at 120bpm, N=150. Fast enough.
  
  let changeIndex = 0;
  
  // Find initial tempo
  // If we start at measure 1, tempo is base tempo.
  // If we have changes at measure 1, apply them.
  
  while (currentTime < duration) {
    // Apply tempo changes for current measure
    while (changeIndex < sortedChanges.length && sortedChanges[changeIndex].time <= currentMeasure) {
      currentTempo = sortedChanges[changeIndex].tempo;
      changeIndex++;
    }
    
    // Calculate duration of this measure
    const beatDuration = 60 / currentTempo;
    const measureDuration = beatDuration * beatsPerMeasure;
    
    // Check visibility
    const isVisible = 
      (visibleStartTime === undefined || currentTime + measureDuration >= visibleStartTime) &&
      (visibleEndTime === undefined || currentTime <= visibleEndTime);
      
    if (isVisible) {
      bars.push({
        position: currentTime,
        measureNumber: currentMeasure,
        isStrongBar: currentMeasure % 4 === 1,
      });
    }
    
    // Stop if we passed visible end time
    if (visibleEndTime !== undefined && currentTime > visibleEndTime) {
      break;
    }
    
    currentTime += measureDuration;
    currentMeasure++;
  }
  
  return bars;
}

/**
 * Calculate time markers (seconds/minutes) for timeline ruler
 * @param duration Total duration in seconds
 * @param zoom Zoom level (affects marker density)
 * @returns Array of time markers
 */
export function calculateTimeMarkers(
  duration: number,
  zoom: number = 50
): TimeMarker[] {
  const markers: TimeMarker[] = [];
  
  // Determine interval based on zoom and duration
  let interval: number;
  if (zoom > 150 || duration < 30) {
    interval = 1; // Every second
  } else if (zoom > 100 || duration < 60) {
    interval = 5; // Every 5 seconds
  } else if (zoom > 50 || duration < 180) {
    interval = 10; // Every 10 seconds
  } else if (duration < 600) {
    interval = 30; // Every 30 seconds
  } else {
    interval = 60; // Every minute
  }
  
  for (let time = 0; time <= duration; time += interval) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    
    markers.push({
      position: time,
      label: `${minutes}:${seconds.toString().padStart(2, '0')}`,
      type: interval >= 60 ? 'minute' : 'second',
    });
  }
  
  return markers;
}

/**
 * Calculate beat markers for a measure
 * @param measureStart Start time of measure in seconds
 * @param tempo Tempo in BPM
 * @param timeSignature Time signature (e.g., "4/4")
 * @param subdivision Optional subdivision pattern (e.g., "2+3")
 * @returns Array of beat positions within the measure
 */
export function calculateBeatsInMeasure(
  measureStart: number,
  tempo: number,
  timeSignature: string = '4/4',
  subdivision?: string
): number[] {
  const [beatsPerMeasure] = timeSignature.split('/').map(Number);
  const beatDuration = 60 / tempo;
  const beats: number[] = [];
  
  if (subdivision) {
    // Handle irregular subdivision (e.g., "2+3" in 5/4)
    const groups = subdivision.split('+').map(s => parseInt(s.trim()));
    let currentBeat = 0;
    
    for (const groupSize of groups) {
      beats.push(measureStart + currentBeat * beatDuration);
      currentBeat += groupSize;
    }
  } else {
    // Regular beats
    for (let beat = 0; beat < beatsPerMeasure; beat++) {
      beats.push(measureStart + beat * beatDuration);
    }
  }
  
  return beats;
}

/**
 * Calculate grid lines for visual snap-to-grid
 * REFACTORED (Fase 3): Agora usa análise musical avançada com suporte a:
 * - Compassos compostos (6/8, 9/8, 12/8) com macro beats corretos  
 * - Compassos irregulares (5/8, 7/8) com accent patterns
 * - Hierarquia visual baseada em análise de teoria musical
 * 
 * P0 FIX: Otimizado para processar apenas janela visível
 * @param duration Total duration in seconds
 * @param tempo Base tempo in BPM
 * @param timeSignature Time signature
 * @param showSubdivisions Whether to show subdivision lines
 * @param zoom Zoom level (affects visibility of subdivisions)
 * @param visibleStartTime Início da janela visível (opcional, default 0)
 * @param visibleEndTime Fim da janela visível (opcional, default duration)
 * @returns Array of grid line positions and properties
 */
export function calculateGridLines(
  duration: number,
  tempo: number,
  timeSignature: string = '4/4',
  showSubdivisions: boolean = true,
  zoom: number = 50,
  visibleStartTime?: number,
  visibleEndTime?: number,
  tempoChanges?: TempoChange[]
): GridLine[] {
  const lines: GridLine[] = [];
  
  // Sort tempo changes by time (in SECONDS)
  const sortedChanges = tempoChanges ? [...tempoChanges].sort((a, b) => a.time - b.time) : [];
  
  let currentMeasure = 1;
  let currentTime = 0;
  let currentTempo = tempo;
  let currentTimeSignature = timeSignature;
  
  // REFACTORED: Analyze time signature with musicTheory
  let tsInfo = analyzeTimeSignature(currentTimeSignature, currentTempo);
  let metronome = getMetronomeClickStructure(tsInfo);
  
  let changeIndex = 0;
  
  // P0 FIX: Calcular apenas a janela visível + buffer
  const startTime = Math.max(0, (visibleStartTime ?? 0));
  const endTime = Math.min(duration, (visibleEndTime ?? duration));
  
  // Iterate from beginning to track changes correctly
  while (currentTime < duration) {
    // REFACTORED: Apply tempo/time signature changes for current TIME (not measure)
    while (changeIndex < sortedChanges.length && sortedChanges[changeIndex].time <= currentTime) {
      const change = sortedChanges[changeIndex];
      currentTempo = change.tempo;
      if (change.timeSignature) {
        currentTimeSignature = change.timeSignature;
        tsInfo = analyzeTimeSignature(currentTimeSignature, currentTempo);
        metronome = getMetronomeClickStructure(tsInfo);
      }
      changeIndex++;
    }
    
    // REFACTORED: Calculate measure duration using analyzed info
    const quarterNoteDuration = 60 / currentTempo;
    const measureDuration = tsInfo.measureDurationInQuarters * quarterNoteDuration;
    
    // Check visibility (with buffer)
    const isVisible = currentTime + measureDuration >= startTime && currentTime <= endTime;
    
    if (isVisible) {
      // Measure line (downbeat - strongest)
      if (currentTime >= startTime) {
        lines.push({
          position: currentTime,
          opacity: 1.0,
          type: 'measure',
          accentLevel: 2,
          measureNumber: currentMeasure,
        });
      }
      
      // REFACTORED: Beat/pulse lines using metronome structure from music theory
      if (showSubdivisions || zoom > 25) {
        const pulseDuration = measureDuration / tsInfo.pulsesPerMeasure;
        
        metronome.allPulses.forEach((pulseIndex, i) => {
          // Skip first pulse (already added as measure line)
          if (pulseIndex === 0) return;
          
          const pulseTime = currentTime + pulseIndex * pulseDuration;
          if (pulseTime >= startTime && pulseTime <= endTime && pulseTime < duration) {
            const accentLevel = metronome.accentLevels[i];
            const isMacroBeat = metronome.macroBeats.includes(pulseIndex);
            
            // Determine line type and opacity based on hierarchy
            if (isMacroBeat) {
              // Macro beat (main tactus) - medium strength
              lines.push({
                position: pulseTime,
                opacity: accentLevel === 2 ? 1.0 : 0.6,
                type: 'beat',
                accentLevel,
              });
            } else if (showSubdivisions && zoom > 50) {
              // Subdivision (pulse within macro beat) - weak
              lines.push({
                position: pulseTime,
                opacity: 0.3,
                type: 'subdivision',
                accentLevel,
              });
            }
          }
        });
        
        // Finer subdivisions (16th notes) - only if zoomed in significantly
        if (showSubdivisions && zoom > 80) {
          const sixteenthDuration = pulseDuration / 4;
          const totalSixteenths = tsInfo.pulsesPerMeasure * 4;
          
          for (let i = 1; i < totalSixteenths; i++) {
            // Skip positions that already have pulses
            if (i % 4 === 0) continue;
            
            const sixteenthTime = currentTime + i * sixteenthDuration;
            if (sixteenthTime >= startTime && sixteenthTime <= endTime && sixteenthTime < duration) {
              lines.push({
                position: sixteenthTime,
                opacity: 0.2,
                type: 'subdivision',
                accentLevel: 0,
              });
            }
          }
        }
      }
    }
    
    currentTime += measureDuration;
    currentMeasure++;
    
    // Early exit if past visible end
    if (visibleEndTime && currentTime > visibleEndTime + measureDuration) {
      break;
    }
  }
  
  return lines;
}

/**
 * Snap a time position to the nearest grid line
 * @param time Time position in seconds
 * @param tempo Tempo in BPM
 * @param snapUnit 'measure' | 'beat' | 'subdivision'
 * @param beatsPerMeasure Number of beats per measure
 * @returns Snapped time position
 */
export function snapToGrid(
  time: number,
  tempo: number,
  snapUnit: 'measure' | 'beat' | 'subdivision' = 'beat',
  beatsPerMeasure: number = 4
): number {
  const beatDuration = 60 / tempo;
  let gridSize: number;
  
  switch (snapUnit) {
    case 'measure':
      gridSize = beatDuration * beatsPerMeasure;
      break;
    case 'beat':
      gridSize = beatDuration;
      break;
    case 'subdivision':
      gridSize = beatDuration / 4; // 16th notes
      break;
  }
  
  return Math.round(time / gridSize) * gridSize;
}

/**
 * Convert pixel position to time
 * @param pixelX Pixel position on timeline
 * @param zoom Zoom level
 * @param duration Total duration
 * @param containerWidth Container width in pixels
 * @returns Time in seconds
 */
export function pixelToTime(
  pixelX: number,
  zoom: number,
  duration: number,
  containerWidth: number = 1000
): number {
  const pixelsPerSecond = (containerWidth * zoom / 100) / duration;
  return pixelX / pixelsPerSecond;
}

/**
 * Convert time to pixel position
 * @param time Time in seconds
 * @param zoom Zoom level
 * @param duration Total duration
 * @param containerWidth Container width in pixels
 * @returns Pixel position
 */
export function timeToPixel(
  time: number,
  zoom: number,
  duration: number,
  containerWidth: number = 1000
): number {
  const pixelsPerSecond = (containerWidth * zoom / 100) / duration;
  return time * pixelsPerSecond;
}
