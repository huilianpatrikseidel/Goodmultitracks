// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
import { TempoChange } from '../../../types';

// QA FIX 3.1: Cache for O(log N) warp calculations
// Maps the tempoChanges array object to a pre-calculated map of accumulated times
const warpMapCache = new WeakMap<object, WarpSegment[]>();

interface WarpSegment {
  startTime: number; // Grid time
  endTime: number;   // Grid time
  audioStartTime: number; // Audio time
  tempo: number;
}

function getWarpMap(tempoChanges: Omit<TempoChange, 'timeSignature'>[], baseTempo: number): WarpSegment[] {
  if (warpMapCache.has(tempoChanges)) {
    return warpMapCache.get(tempoChanges)!;
  }

  const sortedTempos = [...tempoChanges].sort((a, b) => a.time - b.time);
  const map: WarpSegment[] = [];
  
  let currentAudioTime = 0;
  let lastGridTime = 0;
  
  for (let i = 0; i < sortedTempos.length; i++) {
    const change = sortedTempos[i];
    const nextChange = sortedTempos[i + 1];
    
    // Fill gap from lastGridTime to this change (using baseTempo or previous tempo?)
    // Logic: The tempo active at time T determines the speed.
    // If change.time > lastGridTime, there was a segment before this change.
    // But usually tempoChanges cover the whole timeline or start at 0.
    // If the first change is at 0, we are good.
    // If not, we assume baseTempo from 0 to first change.
    
    if (change.time > lastGridTime) {
       // Segment before this change (using baseTempo if it's the first, or previous change's tempo)
       // Actually, the loop iterates through changes. The "active tempo" is determined by the *previous* change.
       // This loop structure is slightly wrong for "intervals".
       // Let's iterate intervals.
    }
  }
  
  // Correct approach: Iterate intervals defined by tempo changes
  // 1. Ensure there is a change at 0. If not, prepend one with baseTempo.
  const effectiveChanges = [...sortedTempos];
  if (effectiveChanges.length === 0 || effectiveChanges[0].time > 0) {
      effectiveChanges.unshift({ time: 0, tempo: baseTempo });
  }
  
  currentAudioTime = 0;
  
  for (let i = 0; i < effectiveChanges.length; i++) {
      const change = effectiveChanges[i];
      const nextTime = (i < effectiveChanges.length - 1) ? effectiveChanges[i+1].time : Number.MAX_VALUE;
      
      map.push({
          startTime: change.time,
          endTime: nextTime,
          audioStartTime: currentAudioTime,
          tempo: change.tempo
      });
      
      // Calculate audio duration of this segment
      if (nextTime !== Number.MAX_VALUE) {
          const gridDuration = nextTime - change.time;
          const rate = baseTempo / change.tempo;
          currentAudioTime += gridDuration * rate;
      }
  }
  
  warpMapCache.set(tempoChanges, map);
  return map;
}

/**
 * Calculates the warped source time for a given grid time.
 * This function maps a point on the musical grid to a point in the audio file's timeline.
 * @param gridTime The time on the musical grid.
 * @param tempoChanges An array of tempo changes that define the warp.
 * @param baseTempo The song's original base tempo.
 * @param warpModeEnabled A boolean indicating if warp mode is active.
 * @returns The corresponding time in the source audio file.
 */
export function getWarpedTime(gridTime: number, tempoChanges: Omit<TempoChange, 'timeSignature'>[], baseTempo: number, warpModeEnabled: boolean): number {
  if (!warpModeEnabled || tempoChanges.length === 0) {
    return gridTime; // No warp applied
  }

  // QA FIX 3.1: Use cached Warp Map for O(log N) lookup
  const map = getWarpMap(tempoChanges, baseTempo);
  
  // Binary Search for the segment containing gridTime
  let low = 0;
  let high = map.length - 1;
  let segment: WarpSegment | null = null;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const seg = map[mid];
    
    if (gridTime >= seg.startTime && gridTime < seg.endTime) {
      segment = seg;
      break;
    } else if (gridTime < seg.startTime) {
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }
  
  // If not found (e.g. beyond last segment, which has endTime MAX_VALUE), use last
  if (!segment && map.length > 0) {
      segment = map[map.length - 1];
  }
  
  if (segment) {
      const offsetInSegment = gridTime - segment.startTime;
      const rate = baseTempo / segment.tempo;
      return segment.audioStartTime + (offsetInSegment * rate);
  }

  return gridTime;
}

/**
 * Parses time input from formats like "mm:ss.xx" or seconds.
 * @param input The string input.
 * @returns The time in seconds, or null if invalid.
 */
export function parseTimeInput(input: string): number | null {
  if (/^\d+(\.\d+)?$/.test(input)) {
    return parseFloat(input);
  }
  const parts = input.match(/(\d+):(\d+(\.\d+)?)/);
  if (parts) {
    const minutes = parseInt(parts[1], 10);
    const seconds = parseFloat(parts[2]);
    return minutes * 60 + seconds;
  }
  return null;
}

/**
 * Calculates the grid time from a given audio time based on a tempo map.
 * This is the inverse of getWarpedTime and is crucial for syncing the playhead.
 * @param audioTime The current time in the audio file.
 * @param tempoChanges The array of tempo changes (can be dynamic).
 * @param baseTempo The song's original base tempo.
 * @returns The corresponding time on the musical grid.
 */
export function audioTimeToGridTime(audioTime: number, tempoChanges: Omit<TempoChange, 'timeSignature'>[], baseTempo: number): number {
  let gridTime = 0;
  let lastAudioTime = 0;
  let lastGridTime = 0;

  const allTempos = [{ time: 0, tempo: baseTempo }, ...tempoChanges].sort((a, b) => a.time - b.time);
  const uniqueTempos = allTempos.filter((t, i, arr) => i === 0 || t.time > arr[i - 1].time);

  for (let i = 1; i < uniqueTempos.length; i++) {
    const change = uniqueTempos[i];
    const gridSegmentDuration = change.time - lastGridTime;

    const lastTempo = uniqueTempos[i - 1].tempo;
    const rate = baseTempo / lastTempo;
    const audioSegmentDuration = gridSegmentDuration * rate;

    if (audioTime < lastAudioTime + audioSegmentDuration) {
      // The target audioTime is within this segment
      const audioInSegment = audioTime - lastAudioTime;
      const gridInSegment = audioInSegment / rate;
      return lastGridTime + gridInSegment;
    }

    lastAudioTime += audioSegmentDuration;
    lastGridTime = change.time;
  }

  // After the last tempo change
  const lastTempo = uniqueTempos[uniqueTempos.length - 1]?.tempo || baseTempo;
  const rate = baseTempo / lastTempo;
  const audioAfterLastChange = audioTime - lastAudioTime;
  const gridAfterLastChange = audioAfterLastChange / rate;

  return lastGridTime + gridAfterLastChange;
}
