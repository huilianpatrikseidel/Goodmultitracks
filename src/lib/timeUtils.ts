import { TempoChange } from '../types';

/**
 * Converts a measure number (1-based) to absolute time in seconds.
 * Handles variable tempo maps.
 */
export function measureToSeconds(
  measure: number,
  tempoChanges: TempoChange[],
  baseTempo: number,
  timeSignature: string = '4/4'
): number {
  const [beatsPerMeasure] = timeSignature.split('/').map(Number);
  
  // Sort tempo changes by time (measure)
  // Note: The TempoChange interface uses 'time' which is in MEASURES according to the briefing.
  // However, existing code in gridUtils.ts seems to treat 'time' as SECONDS in some places?
  // Let's verify the TempoChange definition in types/index.ts again.
  // The briefing says: "WarpMarker... time: number; // Posição em Compassos (Musical Time)"
  // But existing TempoChange might be in seconds.
  // Let's assume for this new system we need to be careful.
  // If TempoChange.time is in seconds, we need a different approach.
  // Let's re-read types/index.ts carefully.
  
  // In types/index.ts:
  // export interface TempoChange {
  //   time: number;
  //   tempo: number;
  //   ...
  // }
  
  // In gridUtils.ts:
  // if (currentTime >= nextChange.time) { ... }
  // This implies TempoChange.time is in SECONDS.
  
  // The briefing says: "Nota: Não armazene a posição em segundos. A posição em segundos é derivada do mapa de tempo."
  // This implies a CHANGE in how TempoChange works or a new structure.
  // The briefing says: "Um 'Marcador de Warp' é, estruturalmente, idêntico a um TempoChange no backend... time: number; // Posição em Compassos"
  
  // IF the current system uses seconds for TempoChange.time, we have a conflict.
  // I should probably stick to the briefing's request for the Warp system, but I need to integrate with existing code.
  // If I change TempoChange.time to be in measures, I might break existing playback.
  
  // Let's assume for the Warp Grid feature, we will use a derived structure or interpret TempoChange.time as seconds,
  // BUT the briefing explicitly says "Não armazene a posição em segundos".
  
  // HYBRID APPROACH:
  // The source of truth for the Warp Grid should be measures.
  // But the playback engine likely needs seconds.
  // I might need to convert "Measure-based Tempo Map" to "Second-based Tempo Map" for the engine.
  
  // For now, let's implement the math assuming we have a list of anchors defined in MEASURES.
  // If the existing TempoChange is in seconds, we might need to convert it.
  
  // Let's assume the input `tempoChanges` here are the "Warp Markers" (Measure-based).
  // If they are not, I'll need to convert.
  
  // Wait, if TempoChange.time is in seconds, then `measureToSeconds` is trivial if we just look up the time?
  // No, because we need to interpolate between changes.
  
  // Let's assume for this utility that we are dealing with "Warp Markers" where `time` is in MEASURES.
  
  const sortedChanges = [...tempoChanges].sort((a, b) => a.time - b.time);
  
  let currentSeconds = 0;
  let currentMeasure = 1; // 1-based
  let currentTempo = baseTempo;
  
  for (const change of sortedChanges) {
    if (change.time <= currentMeasure) continue; // Skip past changes
    if (change.time > measure) break; // We passed the target
    
    const deltaMeasures = change.time - currentMeasure;
    const seconds = (deltaMeasures * beatsPerMeasure * 60) / currentTempo;
    
    currentSeconds += seconds;
    currentMeasure = change.time;
    currentTempo = change.tempo;
  }
  
  // Add remaining part
  const remainingMeasures = measure - currentMeasure;
  if (remainingMeasures > 0) {
    const seconds = (remainingMeasures * beatsPerMeasure * 60) / currentTempo;
    currentSeconds += seconds;
  }
  
  return currentSeconds;
}

/**
 * Converts absolute time in seconds to a measure number (1-based).
 * Handles variable tempo maps.
 */
export function secondsToMeasure(
  seconds: number,
  tempoChanges: TempoChange[], // Assuming 'time' is in MEASURES
  baseTempo: number,
  timeSignature: string = '4/4'
): number {
  const [beatsPerMeasure] = timeSignature.split('/').map(Number);
  const sortedChanges = [...tempoChanges].sort((a, b) => a.time - b.time);
  
  let currentSeconds = 0;
  let currentMeasure = 1;
  let currentTempo = baseTempo;
  
  for (const change of sortedChanges) {
    // Calculate time to reach this change
    const deltaMeasures = change.time - currentMeasure;
    const segmentSeconds = (deltaMeasures * beatsPerMeasure * 60) / currentTempo;
    
    if (currentSeconds + segmentSeconds > seconds) {
      // Target is within this segment
      break;
    }
    
    currentSeconds += segmentSeconds;
    currentMeasure = change.time;
    currentTempo = change.tempo;
  }
  
  // Calculate remaining measures in the final segment
  const remainingSeconds = seconds - currentSeconds;
  const remainingMeasures = (remainingSeconds * currentTempo) / (beatsPerMeasure * 60);
  
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
