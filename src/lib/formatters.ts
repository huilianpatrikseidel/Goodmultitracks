export const formatBPM = (bpm: number): string => {
  // If it's an integer, return as is
  if (Number.isInteger(bpm)) {
    return bpm.toString();
  }
  // Otherwise, max 2 decimal places
  return parseFloat(bpm.toFixed(2)).toString();
};
