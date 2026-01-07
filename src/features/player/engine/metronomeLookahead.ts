// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
/**
 * ============================================================================
 * METRONOME LOOKAHEAD SCHEDULER
 * ============================================================================
 * 
 * CRITICAL PERFORMANCE FIX (QA Jan 2026):
 * Implements the "Lookahead Scheduler" pattern for precise audio timing.
 * 
 * WHY THIS IS NECESSARY:
 * - JavaScript timers (setTimeout, setInterval) are NOT precise enough for audio
 * - requestAnimationFrame runs at ~60fps = 16.6ms jitter (unacceptable for music)
 * - AudioContext scheduling is sample-accurate (sub-millisecond precision)
 * 
 * SOLUTION:
 * - Use setInterval to check "ahead" of current time (lookahead window)
 * - Schedule ALL notes in that window using AudioContext.currentTime
 * - Maintain nextNoteTime variable (no calculation from t=0)
 * - Visual feedback uses separate tolerance (decoupled from audio)
 * 
 * Based on: https://web.dev/audio-scheduling/
 */

import { playMetronomeClick } from './metronome';

interface SchedulerOptions {
  tempo: number;
  timeSignature?: string;
  subdivision?: string;
  scheduleAheadTime?: number;  // How far ahead to schedule (seconds)
  lookaheadInterval?: number;  // How often to check (milliseconds)
}

interface ScheduledNote {
  time: number;
  isStrongBeat: boolean;
  isSubdivision: boolean;
  beatNumber: number;
}

/**
 * Lookahead Scheduler for precise metronome timing
 * 
 * @example
 * const scheduler = new MetronomeLookaheadScheduler(audioContext, {
 *   tempo: 120,
 *   timeSignature: '4/4'
 * });
 * 
 * scheduler.start();
 * // Later...
 * scheduler.stop();
 */
export class MetronomeLookaheadScheduler {
  private audioContext: AudioContext;
  private tempo: number;
  private timeSignature: string;
  private subdivision?: string;
  
  // Lookahead parameters
  private scheduleAheadTime: number;  // How far ahead to schedule (seconds)
  private lookaheadInterval: number;   // How often to check (ms)
  
  // Scheduler state
  private nextNoteTime: number = 0;
  private currentBeat: number = 0;
  private timerID: number | null = null;
  private isPlaying: boolean = false;
  
  // Callbacks
  private onBeatScheduled?: (note: ScheduledNote) => void;
  
  constructor(
    audioContext: AudioContext,
    options: SchedulerOptions
  ) {
    this.audioContext = audioContext;
    this.tempo = options.tempo;
    this.timeSignature = options.timeSignature || '4/4';
    this.subdivision = options.subdivision;
    
    // Default to 25ms lookahead (schedules 2-3 beats ahead at 120bpm)
    this.scheduleAheadTime = options.scheduleAheadTime ?? 0.1;
    this.lookaheadInterval = options.lookaheadInterval ?? 25;
  }
  
  /**
   * Start the scheduler
   * @param startTime - When to start (in AudioContext time, defaults to "now")
   */
  start(startTime?: number): void {
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    this.currentBeat = 0;
    
    // Initialize nextNoteTime to current audio time or specified time
    this.nextNoteTime = startTime ?? this.audioContext.currentTime;
    
    // Start the lookahead loop
    this.scheduleLoop();
  }
  
  /**
   * Stop the scheduler
   */
  stop(): void {
    this.isPlaying = false;
    
    if (this.timerID !== null) {
      clearTimeout(this.timerID);
      this.timerID = null;
    }
  }
  
  /**
   * Update tempo (takes effect on next beat)
   */
  setTempo(tempo: number): void {
    this.tempo = tempo;
  }
  
  /**
   * Update time signature
   */
  setTimeSignature(timeSignature: string): void {
    this.timeSignature = timeSignature;
  }
  
  /**
   * Set callback for when a beat is scheduled
   */
  onBeat(callback: (note: ScheduledNote) => void): void {
    this.onBeatScheduled = callback;
  }
  
  /**
   * Main scheduling loop
   * Runs every lookaheadInterval (25ms) to check if notes need scheduling
   */
  private scheduleLoop = (): void => {
    if (!this.isPlaying) return;
    
    // Schedule all notes in the lookahead window
    while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.nextNoteTime);
      this.nextNote();
    }
    
    // Set timer for next check
    this.timerID = window.setTimeout(this.scheduleLoop, this.lookaheadInterval);
  };
  
  /**
   * Schedule a single note using AudioContext (sample-accurate)
   */
  private scheduleNote(time: number): void {
    const [beatsPerMeasure] = this.timeSignature.split('/').map(Number);
    const beatInMeasure = (this.currentBeat % beatsPerMeasure) + 1;
    const isStrongBeat = beatInMeasure === 1;
    
    // Schedule the audio click at EXACT time
    playMetronomeClick(
      this.audioContext,
      isStrongBeat,
      0.5,  // volume
      false,  // not subdivision
      undefined,  // default frequency
      time  // CRITICAL: Schedule at precise time
    );
    
    // Notify listeners (for visual feedback)
    if (this.onBeatScheduled) {
      this.onBeatScheduled({
        time,
        isStrongBeat,
        isSubdivision: false,
        beatNumber: beatInMeasure
      });
    }
  }
  
  /**
   * Advance to next note
   * CRITICAL: Increment nextNoteTime (don't calculate from t=0)
   */
  private nextNote(): void {
    const beatDuration = 60.0 / this.tempo;
    
    // CRITICAL FIX: Increment instead of recalculate
    // This prevents floating point drift over long sessions
    this.nextNoteTime += beatDuration;
    
    this.currentBeat++;
  }
  
  /**
   * Get current beat number (for visual display)
   * Note: This is the LAST SCHEDULED beat, not necessarily what's playing
   */
  getCurrentBeat(): number {
    const [beatsPerMeasure] = this.timeSignature.split('/').map(Number);
    return (this.currentBeat % beatsPerMeasure) + 1;
  }
  
  /**
   * Get the time of the next scheduled note
   */
  getNextNoteTime(): number {
    return this.nextNoteTime;
  }
}
