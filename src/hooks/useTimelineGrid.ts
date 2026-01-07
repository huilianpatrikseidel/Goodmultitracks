// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
/**
 * useTimelineGrid Hook
 * 
 * Hook para cálculo inteligente de grid da timeline usando análise
 * avançada de fórmulas de compasso.
 * 
 * QA FIX (January 7, 2026): MUSICAL LOD HIERARCHY
 * ================================================
 * CRITICAL FIX: Level of Detail (LOD) now based on PIXELS PER MEASURE
 * instead of arbitrary zoom thresholds.
 * 
 * MUSICAL HIERARCHY (respects metric importance):
 * - Level 1: Measures every 4 bars (4-bar phrases) - extreme zoom out
 * - Level 2: All measures (bar lines)
 * - Level 3: Macro beats (strong beats: 1, 3 in 4/4; dotted quarters in 6/8)
 * - Level 4: All beats/pulses
 * - Level 5: 16th note subdivisions
 * 
 * THRESHOLDS (based on readability - minimum 30-50px gap):
 * - 15px per measure: Show measure numbers
 * - 25px per measure: Show all measures (not just every 4th)
 * - 50px per measure: Show macro beats (main tactus)
 * - 80px per measure: Show all beats/pulses
 * - 200px per measure: Show 16th note subdivisions
 * 
 * This ensures users ALWAYS see the correct metric hierarchy at any zoom level,
 * preventing the "unmusical decimation" bug where random beats were hidden.
 * 
 * ORIGINAL FEATURES (preserved):
 * - Compassos simples, compostos e irregulares
 * - Hierarquia de beats (macro beats vs. pulses)
 * - Níveis de acento (downbeat, beat, subdivision)
 * - Suporte a denominadores não-diadicos (3, 6, 12)
 * 
 * @example
 * const { gridLines, measureBars, timeSignatureInfo } = useTimelineGrid({
 *   duration: 180,
 *   tempo: 120,
 *   timeSignature: '6/8',
 *   zoom: 2.5
 * });
 * // gridLines contém hierarquia correta: 2 macro beats, 6 pulses
 */

import { useMemo } from 'react';
import {
  analyzeTimeSignature,
  getMetronomeClickStructure,
  type TimeSignatureInfo,
  type MetronomeClickStructure,
} from '../lib/musicTheory';
import { TempoChange } from '../types';

export interface GridLine {
  /** Position in seconds */
  position: number;
  /** Visual opacity (1.0 = strong, 0.6 = medium, 0.3 = weak) */
  opacity: number;
  /** Line type determines visual hierarchy */
  type: 'measure' | 'beat' | 'subdivision';
  /** Accent level (2 = downbeat, 1 = beat, 0 = subdivision) */
  accentLevel: number;
  /** Measure number (1-based, only for measure lines) */
  measureNumber?: number;
}

export interface MeasureBar {
  /** Position in seconds */
  position: number;
  /** Measure number (1-based) */
  measureNumber: number;
  /** Visual properties */
  visual: {
    height: string;
    width: number;
    color: string;
    opacity: number;
  };
  /** Time signature at this measure */
  timeSignature: string;
  /** Analyzed time signature info */
  info: TimeSignatureInfo;
}

export interface UseTimelineGridOptions {
  /** Total duration in seconds */
  duration: number;
  /** Base tempo in BPM */
  tempo: number;
  /** Time signature (default: '4/4') */
  timeSignature?: string;
  /** Show beat subdivisions */
  showBeats?: boolean;
  /** Show finer subdivisions (16th notes) */
  showSubdivisions?: boolean;
  /** Zoom level (affects subdivision visibility) */
  zoom?: number;
  /** Tempo changes array (time in SECONDS) */
  tempoChanges?: TempoChange[];
  /** Visible start time for viewport optimization (seconds) */
  visibleStart?: number;
  /** Visible end time for viewport optimization (seconds) */
  visibleEnd?: number;
}

export interface UseTimelineGridReturn {
  /** All grid lines with hierarchy */
  gridLines: GridLine[];
  /** Measure bars with analysis */
  measureBars: MeasureBar[];
  /** Current time signature info */
  timeSignatureInfo: TimeSignatureInfo;
  /** Metronome click structure */
  metronomeStructure: MetronomeClickStructure;
}

/**
 * Hook for intelligent timeline grid calculation
 */
export function useTimelineGrid({
  duration,
  tempo,
  timeSignature = '4/4',
  showBeats = true,
  showSubdivisions = false,
  zoom = 1.0,
  tempoChanges = [],
  visibleStart,
  visibleEnd,
}: UseTimelineGridOptions): UseTimelineGridReturn {
  // Analyze time signature
  const timeSignatureInfo = useMemo(() => {
    return analyzeTimeSignature(timeSignature, tempo);
  }, [timeSignature, tempo]);

  // Get metronome structure for accent hierarchy
  const metronomeStructure = useMemo(() => {
    return getMetronomeClickStructure(timeSignatureInfo);
  }, [timeSignatureInfo]);

  // Calculate grid lines with MUSICAL LOD (pixels per measure)
  const gridLines = useMemo(() => {
    const lines: GridLine[] = [];
    const sortedChanges = [...tempoChanges].sort((a, b) => a.time - b.time);

    // QA FIX: Calculate pixels per second using BASE_PPS constant
    const BASE_PPS = 50; // pixels per second at zoom 1.0 (from constants.ts)
    const pixelsPerSecond = BASE_PPS * zoom;

    let currentTime = 0;
    let currentMeasure = 1;
    let currentTempo = tempo;
    let currentTimeSignature = timeSignature;
    let currentTSInfo = timeSignatureInfo;
    let currentMetronome = metronomeStructure;

    const startTime = visibleStart ?? 0;
    const endTime = visibleEnd ?? duration;

    let changeIndex = 0;

    while (currentTime < duration) {
      // Apply tempo/time signature changes
      while (changeIndex < sortedChanges.length && sortedChanges[changeIndex].time <= currentTime) {
        const change = sortedChanges[changeIndex];
        currentTempo = change.tempo;
        if (change.timeSignature) {
          currentTimeSignature = change.timeSignature;
          currentTSInfo = analyzeTimeSignature(currentTimeSignature, currentTempo);
          currentMetronome = getMetronomeClickStructure(currentTSInfo);
        }
        changeIndex++;
      }

      // Calculate measure duration
      const quarterNoteDuration = 60 / currentTempo;
      const measureDuration = currentTSInfo.measureDurationInQuarters * quarterNoteDuration;

      // QA FIX: Calculate pixels per measure (MUSICAL metric for LOD decisions)
      const pixelsPerMeasure = measureDuration * pixelsPerSecond;

      // QA FIX: Musical LOD hierarchy based on pixels per measure
      // This ensures proper metric hierarchy (Bar > Beat > Subdivision) at all zoom levels
      // Thresholds based on minimum 30-50px gap for readability
      const showMeasureNumbers = pixelsPerMeasure >= 15;  // Show measure numbers when readable
      const showAllMeasures = pixelsPerMeasure >= 25;     // Show all measures (not just every 4th)
      const showMacroBeats = pixelsPerMeasure >= 50;      // Show main beats (strong metric points)
      const showAllBeats = pixelsPerMeasure >= 80;        // Show all beats/pulses
      const showSixteenths = pixelsPerMeasure >= 200;     // Show 16th note subdivisions

      // Check if measure is visible
      const isVisible = currentTime + measureDuration >= startTime && currentTime <= endTime;

      // QA FIX: Only show measures based on LOD (respect metric hierarchy)
      if (isVisible && currentTime >= startTime) {
        // QA FIX: At extreme zoom out, show only every 4th measure (4-bar phrases)
        const shouldShowMeasure = showAllMeasures || (currentMeasure % 4 === 1);
        
        if (shouldShowMeasure) {
          // Add measure line (downbeat)
          lines.push({
            position: currentTime,
            opacity: 1.0,
            type: 'measure',
            accentLevel: 2,
            measureNumber: showMeasureNumbers ? currentMeasure : undefined,
          });

          // QA FIX: Add beat lines using MUSICAL hierarchy (not arbitrary zoom values)
          if (showBeats && showMacroBeats) {
            const pulseDuration = measureDuration / currentTSInfo.pulsesPerMeasure;

            currentMetronome.allPulses.forEach((pulseIndex, i) => {
              // Skip first pulse (already added as measure line)
              if (pulseIndex === 0) return;

              const pulseTime = currentTime + pulseIndex * pulseDuration;
              if (pulseTime >= startTime && pulseTime <= endTime && pulseTime < duration) {
                const accentLevel = currentMetronome.accentLevels[i];
                const isMacroBeat = currentMetronome.macroBeats.includes(pulseIndex);

                // QA FIX: MUSICAL LOD - respect metric hierarchy
                // Level 1: Show only macro beats (e.g., beats 1 and 3 in 4/4, or dotted quarters in 6/8)
                // Level 2: Show all beats/pulses
                let lineType: 'beat' | 'subdivision';
                let opacity: number;

                if (isMacroBeat) {
                  // Macro beat (main tactus) - always show when macro beats are enabled
                  lineType = 'beat';
                  opacity = accentLevel === 2 ? 1.0 : 0.6;
                } else {
                  // Subdivision (pulse within macro beat)
                  lineType = 'subdivision';
                  opacity = 0.3;

                  // QA FIX: Only show subdivisions when pixels per measure allows it
                  if (!showAllBeats) return;
                }

                lines.push({
                  position: pulseTime,
                  opacity,
                  type: lineType,
                  accentLevel,
                });
              }
            });

            // QA FIX: Add finer subdivisions (16th notes) based on MUSICAL LOD
            if (showSubdivisions && showSixteenths) {
              const sixteenthDuration = pulseDuration / 4;
              const totalSixteenths = currentTSInfo.pulsesPerMeasure * 4;

              for (let i = 1; i < totalSixteenths; i++) {
                // Skip positions that already have beats
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
      }

      // Advance to next measure
      currentTime += measureDuration;
      currentMeasure++;

      // Early exit if past visible end
      if (visibleEnd && currentTime > visibleEnd + measureDuration) {
        break;
      }
    }

    return lines;
  }, [
    duration,
    tempo,
    timeSignature,
    showBeats,
    showSubdivisions,
    zoom,
    tempoChanges,
    visibleStart,
    visibleEnd,
    timeSignatureInfo,
    metronomeStructure,
  ]);

  // Calculate measure bars with visual properties
  const measureBars = useMemo(() => {
    return gridLines
      .filter(line => line.type === 'measure' && line.measureNumber !== undefined)
      .map(line => {
        // Visual properties based on accent level and type
        const visual = {
          height: '100%',
          width: 2,
          color: 'rgba(255, 255, 255, 0.6)',
          opacity: line.opacity,
        };

        // Find active time signature at this position
        const activeChange = tempoChanges
          .filter(tc => tc.time <= line.position && tc.timeSignature)
          .sort((a, b) => b.time - a.time)[0];

        const activeTS = activeChange?.timeSignature || timeSignature;
        const activeTempo = activeChange?.tempo || tempo;
        const activeTSInfo = analyzeTimeSignature(activeTS, activeTempo);

        return {
          position: line.position,
          measureNumber: line.measureNumber!,
          visual,
          timeSignature: activeTS,
          info: activeTSInfo,
        };
      });
  }, [gridLines, tempoChanges, timeSignature]);

  return {
    gridLines,
    measureBars,
    timeSignatureInfo,
    metronomeStructure,
  };
}

/**
 * Helper: Convert grid lines to render-optimized format
 * Adds visual hierarchy properties for rendering
 */
export function useGridVisualization(gridLines: GridLine[]) {
  return useMemo(() => {
    return gridLines.map(line => {
      // Visual properties based on line type and accent
      let height: string;
      let width: number;
      let color: string;

      switch (line.type) {
        case 'measure':
          height = '100%';
          width = 2;
          color = 'rgba(255, 255, 255, 0.6)';
          break;
        case 'beat':
          height = line.accentLevel === 1 ? '70%' : '55%';
          width = line.accentLevel === 1 ? 1.5 : 1;
          color = line.accentLevel === 1 ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.25)';
          break;
        case 'subdivision':
          height = '30%';
          width = 1;
          color = 'rgba(255, 255, 255, 0.15)';
          break;
      }

      return {
        ...line,
        visual: {
          height,
          width,
          color,
          opacity: line.opacity,
        },
      };
    });
  }, [gridLines]);
}

