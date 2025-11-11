import { TempoChange } from '../types';

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

  let audioTime = 0;
  let lastGridTime = 0;
  let lastTempo = baseTempo;

  const sortedTempos = [...tempoChanges].sort((a, b) => a.time - b.time);

  for (const change of sortedTempos) {
    if (gridTime < change.time) {
      break; // We found the segment
    }
    const gridSegmentDuration = change.time - lastGridTime;
    const rate = baseTempo / lastTempo;
    audioTime += gridSegmentDuration * rate;
    lastGridTime = change.time;
    lastTempo = change.tempo;
  }

  // Calculate time within the final segment
  const gridInSegment = gridTime - lastGridTime;
  const rate = baseTempo / lastTempo;
  audioTime += gridInSegment * rate;

  return audioTime;
}

/**
 * Calculates the required BPM for a segment to match a grid duration to an audio duration.
 * @param gridDuration The duration in musical grid time.
 * @param audioDuration The duration in real audio time.
 * @param baseBPM The song's original base BPM.
 * @returns The calculated BPM for the segment.
 */
export function calculateBPMForSegment(gridDuration: number, audioDuration: number, baseBPM: number): number {
  if (gridDuration <= 0 || audioDuration <= 0) {
    return baseBPM; // Avoid division by zero or invalid states
  }

  // The "rate" tells us how fast source time passes relative to grid time.
  // A rate > 1.0 means audio time is faster than grid time (needs higher BPM to compensate).
  // A rate < 1.0 means audio time is slower than grid time (needs lower BPM to compensate).
  const rate = audioDuration / gridDuration;
  const localBPM = baseBPM / rate;

  // As per user request, cap at 360 BPM.
  return Math.min(localBPM, 360);
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