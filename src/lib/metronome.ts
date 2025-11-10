/**
 * Metronome utility for generating click sounds
 * Creates audio clicks for strong beats and weak beats
 */

// Default frequencies
const DEFAULT_FREQUENCIES = {
  strongBeat: 1000,
  normalBeat: 800,
  subdivision: 600,
};

const STORAGE_KEY = 'metronome_frequencies';

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Get metronome frequencies from localStorage or return defaults
 */
export function getMetronomeFrequencies() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load metronome frequencies from localStorage');
  }
  return DEFAULT_FREQUENCIES;
}

/**
 * Save metronome frequencies to localStorage
 */
export function setMetronomeFrequencies(frequencies: typeof DEFAULT_FREQUENCIES) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(frequencies));
  } catch (e) {
    console.warn('Failed to save metronome frequencies to localStorage');
  }
}

/**
 * Reset metronome frequencies to defaults
 */
export function resetMetronomeFrequencies() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to reset metronome frequencies');
  }
}

/**
 * Play a metronome click
 * @param isStrongBeat - Whether this is a strong beat (first beat of measure)
 * @param volume - Volume level (0-1)
 * @param isSubdivision - Whether this is a subdivision click
 * @param customFreq - Custom frequency (optional)
 */
export function playMetronomeClick(
  isStrongBeat: boolean, 
  volume: number = 0.5,
  isSubdivision: boolean = false,
  customFreq?: number
) {
  const ctx = getAudioContext();
  const currentTime = ctx.currentTime;
  
  // Create oscillator for the click sound
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  // Get frequencies from settings or use defaults
  const frequencies = getMetronomeFrequencies();
  
  // Determine frequency
  let frequency: number;
  if (customFreq) {
    frequency = customFreq;
  } else if (isSubdivision) {
    frequency = frequencies.subdivision;
  } else if (isStrongBeat) {
    frequency = frequencies.strongBeat;
  } else {
    frequency = frequencies.normalBeat;
  }
  
  oscillator.frequency.setValueAtTime(frequency, currentTime);
  
  // Short, sharp click
  gainNode.gain.setValueAtTime(volume, currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.05);
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.start(currentTime);
  oscillator.stop(currentTime + 0.05);
}

/**
 * Calculate when the next metronome click should occur
 * @param currentTime - Current playback time in seconds
 * @param tempo - Tempo in BPM
 * @param timeSignature - Time signature (e.g., "4/4")
 * @returns Object with nextClickTime and isStrongBeat
 */
export function getNextMetronomeClick(
  currentTime: number,
  tempo: number,
  timeSignature: string = "4/4"
): { nextClickTime: number; isStrongBeat: boolean; beatNumber: number } {
  const [beatsPerMeasure] = timeSignature.split('/').map(Number);
  const beatDuration = 60 / tempo; // Duration of one beat in seconds
  
  // Calculate which beat we're on
  const totalBeats = Math.floor(currentTime / beatDuration);
  const beatNumber = (totalBeats % beatsPerMeasure) + 1;
  const nextClickTime = (totalBeats + 1) * beatDuration;
  const isStrongBeat = beatNumber === beatsPerMeasure; // Next click will be beat 1
  
  return { nextClickTime, isStrongBeat, beatNumber };
}

/**
 * Check if a metronome click should play at the current time
 * @param currentTime - Current playback time in seconds
 * @param lastClickTime - Time of the last click
 * @param tempo - Tempo in BPM
 * @param tolerance - Time tolerance in seconds for detecting a beat
 * @returns Whether a click should play now
 */
export function shouldPlayClick(
  currentTime: number,
  lastClickTime: number,
  tempo: number,
  tolerance: number = 0.02
): boolean {
  const beatDuration = 60 / tempo;
  const timeSinceLastClick = currentTime - lastClickTime;
  
  // Check if we've crossed a beat boundary
  return timeSinceLastClick >= (beatDuration - tolerance);
}

/**
 * Resume audio context (needed for some browsers that require user interaction)
 */
export function resumeAudioContext() {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
}

/**
 * Parse subdivision pattern (e.g., "2+3" or "3+2+2")
 * @param pattern - Subdivision pattern string
 * @returns Array of subdivision group sizes
 */
export function parseSubdivision(pattern: string): number[] {
  if (!pattern || !pattern.trim()) return [];
  
  return pattern
    .split('+')
    .map(s => parseInt(s.trim()))
    .filter(n => !isNaN(n) && n > 0);
}

/**
 * Check if time signature is compound (6/8, 9/8, 12/8)
 * @param timeSignature - Time signature string (e.g., "6/8")
 * @returns Whether it's a compound time signature
 */
export function isCompoundTime(timeSignature: string): boolean {
  const [numerator, denominator] = timeSignature.split('/').map(Number);
  return denominator === 8 && [6, 9, 12].includes(numerator);
}

/**
 * Get main beats for compound time signatures
 * For 6/8: 2 main beats, 9/8: 3 main beats, 12/8: 4 main beats
 * @param timeSignature - Time signature string
 * @returns Number of main beats (or beats per measure for simple time)
 */
export function getMainBeats(timeSignature: string, subdivision?: string): number {
  if (subdivision) {
    // For irregular time with subdivision pattern
    return parseSubdivision(subdivision).length;
  }
  
  const [numerator, denominator] = timeSignature.split('/').map(Number);
  
  // Compound time: divide by 3
  if (denominator === 8 && [6, 9, 12].includes(numerator)) {
    return numerator / 3;
  }
  
  // Simple time: use numerator as-is
  return numerator;
}

/**
 * Calculate which subdivision group a beat belongs to
 * @param beatNumber - Current beat number (1-indexed)
 * @param subdivision - Subdivision pattern (e.g., "2+3")
 * @returns { groupIndex: number, beatInGroup: number, isGroupStart: boolean }
 */
export function getSubdivisionInfo(
  beatNumber: number,
  subdivision: string
): { groupIndex: number; beatInGroup: number; isGroupStart: boolean } {
  const groups = parseSubdivision(subdivision);
  if (groups.length === 0) {
    return { groupIndex: 0, beatInGroup: 1, isGroupStart: true };
  }
  
  let totalBeats = 0;
  let currentBeat = ((beatNumber - 1) % groups.reduce((a, b) => a + b, 0)) + 1;
  
  for (let i = 0; i < groups.length; i++) {
    if (currentBeat <= totalBeats + groups[i]) {
      return {
        groupIndex: i,
        beatInGroup: currentBeat - totalBeats,
        isGroupStart: currentBeat === totalBeats + 1
      };
    }
    totalBeats += groups[i];
  }
  
  return { groupIndex: 0, beatInGroup: 1, isGroupStart: true };
}
