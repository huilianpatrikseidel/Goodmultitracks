/**
 * WaveformStore - External storage for heavy waveform data
 * 
 * ARCHITECTURE CHANGE (QA Report 26/11/2025):
 * Moved waveform data out of React State/Context to prevent
 * massive re-renders and memory duplication.
 * 
 * REACTIVITY FIX (26/11/2025):
 * Added Observer Pattern to notify React components when async
 * Worker processing completes. Fixes invisible waveforms bug.
 * 
 * This store acts as a singleton cache with reactive updates.
 */

type Listener = () => void;

class WaveformStore {
  private static instance: WaveformStore;
  private waveforms: Map<string, number[]> = new Map();      // High detail LOD
  private mediums: Map<string, number[]> = new Map();        // Medium detail LOD
  private overviews: Map<string, number[]> = new Map();      // Low detail LOD
  private listeners: Set<Listener> = new Set();
  private notifyTimeout: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): WaveformStore {
    if (!WaveformStore.instance) {
      WaveformStore.instance = new WaveformStore();
    }
    return WaveformStore.instance;
  }

  /**
   * Subscribe to waveform updates
   * @returns unsubscribe function
   */
  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all subscribed listeners (debounced to prevent stack overflow)
   */
  private notify(): void {
    // Debounce notifications to batch multiple updates
    if (this.notifyTimeout) {
      clearTimeout(this.notifyTimeout);
    }
    
    this.notifyTimeout = setTimeout(() => {
      this.listeners.forEach(listener => {
        try {
          listener();
        } catch (error) {
          console.error('Error in waveform store listener:', error);
        }
      });
      this.notifyTimeout = null;
    }, 0);
  }

  public setWaveform(trackId: string, data: number[]): void {
    this.waveforms.set(trackId, data);
    this.notify(); // Trigger React re-render
  }

  public getWaveform(trackId: string): number[] | undefined {
    return this.waveforms.get(trackId);
  }

  public setOverview(trackId: string, data: number[]): void {
    this.overviews.set(trackId, data);
    this.notify(); // Trigger React re-render
  }

  public getOverview(trackId: string): number[] | undefined {
    return this.overviews.get(trackId);
  }

  public setMedium(trackId: string, data: number[]): void {
    this.mediums.set(trackId, data);
    this.notify(); // Trigger React re-render
  }

  public getMedium(trackId: string): number[] | undefined {
    return this.mediums.get(trackId);
  }

  public clear(): void {
    this.waveforms.clear();
    this.mediums.clear();
    this.overviews.clear();
    this.notify(); // Trigger React re-render
  }
  
  public has(trackId: string): boolean {
      return this.waveforms.has(trackId);
  }
  
  public delete(trackId: string): void {
      this.waveforms.delete(trackId);
      this.mediums.delete(trackId);
      this.overviews.delete(trackId);
      this.notify(); // Trigger React re-render
  }
}

export const waveformStore = WaveformStore.getInstance();
