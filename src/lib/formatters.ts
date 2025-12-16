export const formatBPM = (bpm: number): string => {
  // If it's an integer, return as is
  if (Number.isInteger(bpm)) {
    return bpm.toString();
  }
  // Otherwise, max 2 decimal places
  return parseFloat(bpm.toFixed(2)).toString();
};
/**
 * Format seconds to MM:SS format
 * @param seconds - Time in seconds
 * @returns Formatted time string (mm:ss)
 */
export const formatTime = (seconds?: number): string => {
  if (seconds === undefined || seconds === null) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};