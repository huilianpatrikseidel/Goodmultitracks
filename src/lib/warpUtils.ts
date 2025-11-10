import { WarpMarker } from '../types';

// Pure helper: map a grid time to a source (audio) time using warp markers.
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
    const rate = sourceDiff / gridDiff;

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
    const rate = sourceDiff / gridDiff;

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
