/**
 * Metronome utility for generating click sounds
 * Creates audio clicks for strong beats and weak beats
 */

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Play a metronome click
 * @param isStrongBeat - Whether this is a strong beat (first beat of measure)
 * @param volume - Volume level (0-1)
 */
export function playMetronomeClick(isStrongBeat: boolean, volume: number = 0.5) {
  const ctx = getAudioContext();
  const currentTime = ctx.currentTime;
  
  // Create oscillator for the click sound
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  // Strong beat: higher pitch (1000Hz), Weak beat: lower pitch (800Hz)
  const frequency = isStrongBeat ? 1000 : 800;
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
