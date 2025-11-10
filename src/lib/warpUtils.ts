import { WarpMarker } from '../types';

// Pure helper: map a grid time (musical) to a source time (audio) using warp markers.
export function getWarpedTime(currentGridTime: number, warpMarkers: WarpMarker[], warpModeEnabled: boolean): number {
  if (!warpModeEnabled || warpMarkers.length < 2) {
    return currentGridTime;
  }

  const sortedMarkers = [...warpMarkers].sort((a, b) => a.gridTime - b.gridTime);

  // Find the two markers that bracket the current grid time
  let prevMarker: WarpMarker | null = null;
  let nextMarker: WarpMarker | null = null;

  for (const marker of sortedMarkers) {
    if (marker.gridTime <= currentGridTime) {
      prevMarker = marker;
    } else {
      nextMarker = marker;
      break;
    }
  }

  // Case 1: Before the first marker
  if (!prevMarker && nextMarker) {
    // Extrapolate backwards from the first two markers
    const firstMarker = sortedMarkers[0];
    const secondMarker = sortedMarkers[1];
    if (!secondMarker) return currentGridTime;

    const gridDiff = secondMarker.gridTime - firstMarker.gridTime;
    const sourceDiff = secondMarker.sourceTime - firstMarker.sourceTime;
    const rate = gridDiff === 0 ? 1 : sourceDiff / gridDiff;

    return firstMarker.sourceTime - ((firstMarker.gridTime - currentGridTime) * rate);
  }

  // Case 2: After the last marker
  if (prevMarker && !nextMarker) {
    // Extrapolate forwards from the last two markers
    const lastMarker = sortedMarkers[sortedMarkers.length - 1];
    const secondLastMarker = sortedMarkers[sortedMarkers.length - 2];
    if (!secondLastMarker) return currentGridTime;

    const gridDiff = lastMarker.gridTime - secondLastMarker.gridTime;
    const sourceDiff = lastMarker.sourceTime - secondLastMarker.sourceTime;
    const rate = gridDiff === 0 ? 1 : sourceDiff / gridDiff;

    return lastMarker.sourceTime + ((currentGridTime - lastMarker.gridTime) * rate);
  }

  // Case 3: Between two markers
  if (prevMarker && nextMarker) {
    const gridDiff = nextMarker.gridTime - prevMarker.gridTime;
    if (gridDiff === 0) return prevMarker.sourceTime; // Avoid division by zero

    const sourceDiff = nextMarker.sourceTime - prevMarker.sourceTime;
    const progress = (currentGridTime - prevMarker.gridTime) / gridDiff;

    return prevMarker.sourceTime + (progress * sourceDiff);
  }

  // Default case (e.g., only one marker)
  return currentGridTime;
}

// Parse a time input string which can be a float (seconds) or mm:ss(.ms)
export function parseTimeInput(input: string): number | null {
  if (!input || typeof input !== 'string') return null;
  input = input.trim();

  // If contains ':' assume mm:ss(.ms)
  if (input.includes(':')) {
    const parts = input.split(':').map(p => p.trim());
    if (parts.length === 2) {
      const minutes = parseFloat(parts[0]);
      const seconds = parseFloat(parts[1]);
      if (isNaN(minutes) || isNaN(seconds)) return null;
      return minutes * 60 + seconds;
    }
    // support h:mm:ss as well (rare) -> accumulate
    if (parts.length === 3) {
      const hours = parseFloat(parts[0]);
      const minutes = parseFloat(parts[1]);
      const seconds = parseFloat(parts[2]);
      if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return null;
      return hours * 3600 + minutes * 60 + seconds;
    }
    return null;
  }

  // Otherwise try float seconds
  const v = parseFloat(input);
  if (isNaN(v)) return null;
  return v;
}

// Calculate the local BPM between two warp markers
export function calculateLocalBPM(
  marker1: WarpMarker,
  marker2: WarpMarker,
  originalBPM: number
): number {
  const gridTimeDiff = Math.abs(marker2.gridTime - marker1.gridTime);
  const sourceTimeDiff = Math.abs(marker2.sourceTime - marker1.sourceTime);

  if (gridTimeDiff === 0 || sourceTimeDiff === 0) {
    return originalBPM; // Can't calculate, return original
  }

  // Local BPM = Original BPM * (source duration / grid duration)
  // If source is shorter than grid, audio plays faster (higher BPM)
  // If source is longer than grid, audio plays slower (lower BPM)
  const timeRatio = gridTimeDiff / sourceTimeDiff;
  return originalBPM * timeRatio;
}

// Get markers that bracket a given grid time
export function getAdjacentMarkers(
  gridTime: number,
  warpMarkers: WarpMarker[]
): { prev: WarpMarker | null; next: WarpMarker | null } {
  const sorted = [...warpMarkers].sort((a, b) => a.gridTime - b.gridTime);

  let prev: WarpMarker | null = null;
  let next: WarpMarker | null = null;

  for (const marker of sorted) {
    if (marker.gridTime <= gridTime) {
      prev = marker;
    } else if (!next) {
      next = marker;
    }
  }

  return { prev, next };
}

/**
 * Generate dynamic tempo changes from warp markers.
 * This implements Warp Grid mode: the grid/tempo ruler is modified to match warp points,
 * while absolute audio times remain constant.
 * 
 * For each pair of adjacent warp markers:
 * - At marker1.gridTime: create a tempoChange with calculated BPM
 * - BPM is calculated so that audio duration between markers maps to grid duration
 * - This makes the musical grid align with the audio content
 * 
 * @param warpMarkers Array of warp markers defining grid adjustment points
 * @param originalBPM The base tempo (before warping)
 * @returns Array of tempo changes to be used during playback
 */
export interface GeneratedTempoChange {
  time: number; // Grid time where tempo change occurs
  tempo: number; // New BPM value
  timeSignature?: string; // Optional time signature (e.g., "4/4")
}

export function generateDynamicTempos(
  warpMarkers: WarpMarker[],
  originalBPM: number = 120
): GeneratedTempoChange[] {
  if (warpMarkers.length < 2) {
    return []; // Need at least 2 markers to define tempo regions
  }

  const sortedMarkers = [...warpMarkers].sort((a, b) => a.gridTime - b.gridTime);
  const tempoChanges: GeneratedTempoChange[] = [];

  // For each pair of adjacent markers, calculate the required BPM
  for (let i = 0; i < sortedMarkers.length - 1; i++) {
    const marker1 = sortedMarkers[i];
    const marker2 = sortedMarkers[i + 1];

    const gridDiff = marker2.gridTime - marker1.gridTime;
    const sourceDiff = marker2.sourceTime - marker1.sourceTime;

    if (gridDiff === 0 || sourceDiff === 0) {
      continue; // Skip invalid markers, tempo is infinite or zero
    }

    // Corrected Formula: newBPM = originalBPM * (sourceDuration / gridDuration)
    // If source is shorter (e.g., 1s) than grid (e.g., 2s), audio must play slower.
    // The ratio (1/2) correctly reduces the BPM.
    
    const calculatedBPM = originalBPM * (sourceDiff / gridDiff);

    // Clamp BPM to reasonable range (20-360 BPM, matching Cubase limits)
    const clampedBPM = Math.max(20, Math.min(360, calculatedBPM));

    // Create tempo change at the start of this grid region
    tempoChanges.push({
      time: marker1.gridTime,
      tempo: clampedBPM,
    });
  }

  // Sort by time to ensure correct order
  tempoChanges.sort((a, b) => a.time - b.time);

  // Deduplicate: if multiple tempos at same time, keep the last one
  const deduped: GeneratedTempoChange[] = [];
  for (let i = 0; i < tempoChanges.length; i++) {
    if (i === tempoChanges.length - 1 || tempoChanges[i].time !== tempoChanges[i + 1].time) {
      deduped.push(tempoChanges[i]);
    }
  }

  return deduped;
}

/**
 * Convert absolute audio time to grid time using a dynamic tempo map.
 * This is the core of "Warp Grid" mode playback, where the audio timeline is the master,
 * and the musical grid time is derived from it.
 *
 * @param currentAudioTime The current, linear time of the audio source in seconds.
 * @param tempoChanges An array of tempo changes defining the tempo map.
 * @param baseBPM The song's original BPM, used as a reference for conversion.
 * @returns The calculated grid time (musical time) in seconds.
 */
export function audioTimeToGridTime(
  currentAudioTime: number,
  tempoChanges: Array<{ time: number; tempo: number }>,
  baseBPM: number = 120
): number {
  if (!tempoChanges || tempoChanges.length === 0) {
    return currentAudioTime;
  }

  // Ensure tempo changes are sorted by time
  const sortedTempos = [...tempoChanges].sort((a, b) => a.time - b.time);

  let gridTime = 0;
  let lastGridTime = 0;
  let lastAudioTime = 0;

  for (let i = 0; i < sortedTempos.length; i++) {
    const currentTempoChange = sortedTempos[i];
    const nextTempoChange = sortedTempos[i + 1];

    // The grid time where this tempo section starts
    const gridStartTime = currentTempoChange.time;

    // If the audio time is before this tempo section even starts, we can stop.
    if (currentAudioTime < lastAudioTime) break;

    // Calculate the duration of the previous tempo section in grid time
    const gridSectionDuration = gridStartTime - lastGridTime;
    if (gridSectionDuration > 0) {
      const prevTempo = (sortedTempos[i - 1]?.tempo) || baseBPM;
      const tempoRatio = prevTempo / baseBPM;
      // Audio duration = Grid duration / tempo ratio
      const audioSectionDuration = gridSectionDuration / tempoRatio;
      lastAudioTime += audioSectionDuration;
      gridTime += gridSectionDuration;
    }

    // Check if the target audio time is within the audio segment corresponding to this tempo section
    if (currentAudioTime >= lastAudioTime) {
      const audioTimeIntoSection = currentAudioTime - lastAudioTime;
      const currentTempo = currentTempoChange.tempo;
      const tempoRatio = currentTempo / baseBPM;
      // Grid duration = Audio duration * tempo ratio
      const gridTimeIntoSection = audioTimeIntoSection * tempoRatio;
      return gridTime + gridTimeIntoSection;
    }

    lastGridTime = gridStartTime;
  }

  // If we're past all defined tempo changes, extrapolate using the last tempo
  const lastTempo = sortedTempos[sortedTempos.length - 1];
  const audioTimePastLastMarker = currentAudioTime - lastAudioTime;
  const tempoRatio = lastTempo.tempo / baseBPM;
  const gridTimePastLastMarker = audioTimePastLastMarker * tempoRatio;

  return gridTime + gridTimePastLastMarker;
}
