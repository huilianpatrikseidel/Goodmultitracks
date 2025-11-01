/**
 * Audio utility functions for volume conversion and formatting
 * 
 * Volume System:
 * - Stored as linear gain (0 to ~2.0)
 * - 0.0 gain = -∞ dB (silent)
 * - 1.0 gain = 0 dB (unity/reference level)
 * - ~2.0 gain = +6 dB (maximum headroom)
 * 
 * Slider represents dB range from -60dB to +6dB
 */

const MIN_DB = -60; // -60dB is essentially silent
const MAX_DB = 6; // +6dB headroom

/**
 * Convert linear gain (0 to 1.12) to dB
 * 0.0 = -Infinity dB (silent)
 * 1.0 = 0 dB (unity gain)
 * 1.12 = +6 dB (max headroom, calculated as 10^(6/20))
 */
export function gainToDb(gain: number): number {
  if (isNaN(gain) || !isFinite(gain) || gain <= 0) return -Infinity;
  return 20 * Math.log10(gain);
}

/**
 * Convert dB to linear gain
 * -Infinity dB = 0.0 (silent)
 * 0 dB = 1.0 (unity gain)
 * +6 dB = ~1.995 (calculated as 10^(6/20))
 */
export function dbToGain(db: number): number {
  if (!isFinite(db) || db <= MIN_DB) return 0;
  return Math.pow(10, db / 20);
}

/**
 * Convert slider percentage (0-100) to dB
 * 0% = -Infinity dB
 * ~90.9% = 0 dB (unity gain)
 * 100% = +6 dB
 */
export function sliderToDb(sliderValue: number): number {
  if (sliderValue <= 0) return -Infinity;
  
  // Map 0-100 to MIN_DB to MAX_DB
  // Using a curve that makes 0dB fall at approximately 90.9%
  const normalizedValue = sliderValue / 100;
  const db = MIN_DB + (normalizedValue * (MAX_DB - MIN_DB));
  
  return db;
}

/**
 * Convert dB to slider percentage (0-100)
 */
export function dbToSlider(db: number): number {
  if (!isFinite(db) || db <= MIN_DB) return 0;
  
  const normalizedValue = (db - MIN_DB) / (MAX_DB - MIN_DB);
  return normalizedValue * 100;
}

/**
 * Convert slider percentage to gain (what we store)
 */
export function sliderToGain(sliderValue: number): number {
  if (isNaN(sliderValue) || !isFinite(sliderValue)) return 1.0; // Return unity gain if invalid
  const db = sliderToDb(sliderValue);
  return dbToGain(db);
}

/**
 * Convert gain (what we store) to slider percentage
 */
export function gainToSlider(gain: number): number {
  if (isNaN(gain) || !isFinite(gain)) return dbToSlider(0); // Return 0dB slider position if invalid
  const db = gainToDb(gain);
  return dbToSlider(db);
}

/**
 * Format dB value for display
 */
export function formatDb(db: number): string {
  if (!isFinite(db) || db <= MIN_DB) return '-∞';
  return db >= 0 ? `+${db.toFixed(1)}` : db.toFixed(1);
}

/**
 * Snap value to 0dB if close enough
 */
export function snapToUnity(sliderValue: number, threshold: number = 1.5): number {
  const unitySliderValue = dbToSlider(0); // ~90.9
  if (Math.abs(sliderValue - unitySliderValue) < threshold) {
    return unitySliderValue;
  }
  return sliderValue;
}

/**
 * Parse user input dB string to gain value
 */
export function parseDbInput(input: string): number | null {
  const cleaned = input.replace(/[^-+\d.]/g, '');
  const value = parseFloat(cleaned);
  
  if (isNaN(value)) return null;
  if (value < MIN_DB) return 0; // Return silent
  if (value > MAX_DB) return dbToGain(MAX_DB); // Cap at max
  
  return dbToGain(value);
}

/**
 * Convert hex color to rgba with specified opacity
 */
export function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
