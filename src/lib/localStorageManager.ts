/**
 * Centralized LocalStorage Manager
 * 
 * CRITICAL: All localStorage access should go through this module
 * to prevent key naming conflicts and typos.
 */

// Storage Keys Registry
const KEYS = {
  // View Settings
  TRACK_HEIGHT: 'goodmultitracks_track_height',
  ZOOM_LEVEL: 'goodmultitracks_zoom_level',
  SHOW_TIME_RULER: 'goodmultitracks_show_time_ruler',
  SHOW_MEASURES_RULER: 'goodmultitracks_show_measures_ruler',
  SHOW_TEMPO_RULER: 'goodmultitracks_show_tempo_ruler',
  SHOW_CHORDS_RULER: 'goodmultitracks_show_chords_ruler',
  SHOW_SECTIONS_RULER: 'goodmultitracks_show_sections_ruler',
  RULER_ORDER: 'goodmultitracks_ruler_order',
  
  // Audio Settings
  METRONOME_FREQUENCIES: 'metronome_frequencies',
  AUDIO_OUTPUT_DEVICE: 'goodmultitracks_audio_output',
  
  // User Preferences
  THEME: 'goodmultitracks_theme',
  LANGUAGE: 'goodmultitracks_language',
  MAIN_INSTRUMENT: 'goodmultitracks_main_instrument',
  
  // First Time Setup
  FIRST_TIME_SETUP_COMPLETE: 'goodmultitracks_first_time_setup',
} as const;

type StorageKey = typeof KEYS[keyof typeof KEYS];

/**
 * Safe localStorage getter with fallback
 */
export function getItem<T = string>(key: StorageKey, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    
    // Try to parse as JSON if T is not string
    if (typeof defaultValue !== 'string') {
      return JSON.parse(item) as T;
    }
    return item as T;
  } catch (error) {
    console.warn(`Failed to read from localStorage: ${key}`, error);
    return defaultValue;
  }
}

/**
 * Safe localStorage setter
 */
export function setItem<T>(key: StorageKey, value: T): boolean {
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.warn(`Failed to write to localStorage: ${key}`, error);
    return false;
  }
}

/**
 * Safe localStorage remover
 */
export function removeItem(key: StorageKey): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Failed to remove from localStorage: ${key}`, error);
    return false;
  }
}

/**
 * Check if a key exists
 */
export function hasItem(key: StorageKey): boolean {
  try {
    return localStorage.getItem(key) !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Clear all app-related localStorage
 */
export function clearAll(): boolean {
  try {
    Object.values(KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    return true;
  } catch (error) {
    console.warn('Failed to clear localStorage', error);
    return false;
  }
}

// Export keys for use in components
export { KEYS };

// Type-safe helpers for specific settings
export const storage = {
  // View Settings
  getTrackHeight: () => getItem(KEYS.TRACK_HEIGHT, 'medium'),
  setTrackHeight: (value: string) => setItem(KEYS.TRACK_HEIGHT, value),
  
  getZoomLevel: () => getItem(KEYS.ZOOM_LEVEL, 1),
  setZoomLevel: (value: number) => setItem(KEYS.ZOOM_LEVEL, value),
  
  getRulerVisibility: (rulerId: string) => {
    const key = `goodmultitracks_show_${rulerId}_ruler` as StorageKey;
    return getItem(key, true);
  },
  setRulerVisibility: (rulerId: string, visible: boolean) => {
    const key = `goodmultitracks_show_${rulerId}_ruler` as StorageKey;
    return setItem(key, visible);
  },
  
  getRulerOrder: () => getItem(KEYS.RULER_ORDER, ['time', 'measures', 'sections', 'chords', 'tempo']),
  setRulerOrder: (order: string[]) => setItem(KEYS.RULER_ORDER, order),
  
  // Audio Settings
  getMetronomeFrequencies: () => getItem(KEYS.METRONOME_FREQUENCIES, {
    strongBeat: 1000,
    normalBeat: 800,
    subdivision: 600,
  }),
  setMetronomeFrequencies: (frequencies: any) => setItem(KEYS.METRONOME_FREQUENCIES, frequencies),
  
  // User Preferences
  getTheme: () => getItem(KEYS.THEME, 'dark'),
  setTheme: (theme: string) => setItem(KEYS.THEME, theme),
  
  getLanguage: () => getItem(KEYS.LANGUAGE, 'pt'),
  setLanguage: (lang: string) => setItem(KEYS.LANGUAGE, lang),
  
  getMainInstrument: () => getItem(KEYS.MAIN_INSTRUMENT, null),
  setMainInstrument: (instrument: string | null) => instrument ? setItem(KEYS.MAIN_INSTRUMENT, instrument) : removeItem(KEYS.MAIN_INSTRUMENT),
  
  // First Time Setup
  isFirstTimeSetupComplete: () => getItem(KEYS.FIRST_TIME_SETUP_COMPLETE, false),
  setFirstTimeSetupComplete: () => setItem(KEYS.FIRST_TIME_SETUP_COMPLETE, true),
};
