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
 * CRITICAL FIX: Strict validation to prevent invalid values like "++5..2"
 */
export function parseDbInput(input: string): number | null {
  // Remove whitespace
  const trimmed = input.trim();
  
  // Strict regex: optional sign, digits, optional decimal point with digits
  const validFormat = /^[+-]?\d+\.?\d*$/;
  
  if (!validFormat.test(trimmed)) {
    return null; // Invalid format
  }
  
  const value = parseFloat(trimmed);
  
  // Additional safety checks
  if (isNaN(value) || !isFinite(value)) return null;
  if (value < MIN_DB) return 0; // Return silent
  if (value > MAX_DB) return dbToGain(MAX_DB); // Cap at max
  
  return dbToGain(value);
}

/**
 * Generate waveform data safely with Worker Pool + Main Thread Fallback
 * CORREÇÃO CRÍTICA (QA 23/11/2025):
 * - Tenta Worker Pool primeiro (performance)
 * - Fallback para Main Thread se Worker falhar (garante dados)
 * - Nunca retorna dados aleatórios
 * 
 * @param file - Audio file to process
 * @param samples - Number of samples (optional, calculated from duration if not provided)
 * @returns Promise<{ waveform: number[], waveformMedium: number[], waveformOverview: number[], duration: number }>
 */
export async function generateWaveformFromFile(file: File, samples?: number): Promise<{ waveform: number[], waveformMedium: number[], waveformOverview: number[], duration: number }> {
  try {
    // Tenta usar o Pool de Workers
    const { getAudioWorkerPool } = await import('../../../workers/audioWorkerPool');
    const pool = getAudioWorkerPool();
    return await pool.processAudio(file, samples);
    
  } catch (workerError) {
    // Workers disabled in this environment - silently fallback to main thread
    // (Expected behavior, not an error)
    
    // Fallback: Processamento na Thread Principal
    // Pode travar UI momentaneamente, mas garante que dados sejam gerados
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const rawData = audioBuffer.getChannelData(0);
      const duration = audioBuffer.duration;
      
      // MULTI-LEVEL LOD FALLBACK (05/01/2026): Generate 3 levels like Worker
      const generateWaveformLevel = (targetSamples: number): number[] => {
        const blockSize = Math.max(1, Math.floor(rawData.length / targetSamples));
        const result: number[] = [];
        
        for (let i = 0; i < targetSamples; i++) {
          const start = blockSize * i;
          let max = 0;
          const step = blockSize > 500 ? 10 : 1;
          for (let j = 0; j < blockSize && start + j < rawData.length; j += step) {
            const val = Math.abs(rawData[start + j]);
            if (val > max) max = val;
          }
          result.push(max);
        }
        return result;
      };
      
      // Generate all 3 LOD levels
      const SAMPLES_PER_SECOND = 500;
      const detailSamples = samples || Math.ceil(duration * SAMPLES_PER_SECOND);
      
      const waveform = generateWaveformLevel(detailSamples);     // High detail
      const waveformMedium = generateWaveformLevel(20000);       // Medium detail
      const waveformOverview = generateWaveformLevel(2000);      // Low detail
      
      // Normalize all levels (use reduce to avoid stack overflow)
      const normalize = (arr: number[]): number[] => {
        const maxVal = arr.reduce((a, b) => Math.max(a, b), 0.001);
        return arr.map(v => v / maxVal);
      };
      
      return {
        waveform: normalize(waveform),
        waveformMedium: normalize(waveformMedium),
        waveformOverview: normalize(waveformOverview),
        duration
      };
      
    } catch (mainThreadError) {
      console.error('Critical: Failed to generate waveform on main thread:', mainThreadError);
      return { waveform: [], waveformMedium: [], waveformOverview: [], duration: 0 };
    }
  }
}