/**
 * UI Constants for GoodMultitracks Player
 * 
 * QA FIX: Centralized constants to replace hardcoded values
 * Makes responsive design and theming easier to maintain
 */

// ========================================
// LAYOUT DIMENSIONS
// ========================================

export const LAYOUT = {
  /** Width of track sidebar (mixer panel) */
  SIDEBAR_WIDTH: 280,
  
  /** Height of transport controls bar */
  TRANSPORT_HEIGHT: 64,
  
  /** Height of bottom status bar */
  BOTTOM_BAR_HEIGHT: 32,
  
  /** Height of ruler container */
  RULER_HEIGHT: 80,
  
  /** Track heights (user preference) */
  TRACK_HEIGHT: {
    SMALL: 60,
    MEDIUM: 80,
    LARGE: 120,
  },
  
  /** Default track height */
  TRACK_HEIGHT_DEFAULT: 80,
  
  /** Minimum container width before mobile layout */
  MOBILE_BREAKPOINT: 768,
} as const;

// ========================================
// ZOOM & TIME
// ========================================

export const ZOOM = {
  /** Base pixels per second at zoom=1 */
  BASE_PPS: 100,
  
  /** Minimum zoom level */
  MIN: 0.1,
  
  /** Maximum zoom level */
  MAX: 10,
  
  /** Zoom step for increment/decrement */
  STEP: 0.1,
  
  /** Default zoom level */
  DEFAULT: 1,
} as const;

// ========================================
// WAVEFORM RENDERING
// ========================================

export const WAVEFORM = {
  /** Samples per second for high-quality waveform */
  SAMPLES_PER_SECOND: 500,
  
  /** Samples for overview (low-quality for distant zoom) */
  OVERVIEW_SAMPLES: 2000,
  
  /** Canvas RAF throttle (ms) */
  RAF_THROTTLE: 16, // ~60fps
  
  /** Viewport buffer (tracks rendered outside visible area) */
  OVERSCAN_COUNT: 5,
} as const;

// ========================================
// AUDIO ENGINE
// ========================================

export const AUDIO = {
  /** Audio context sample rate (Hz) */
  SAMPLE_RATE: 44100,
  
  /** Sync threshold (seconds) before correcting drift */
  SYNC_THRESHOLD: 0.02,
  
  /** Fade duration for mute/unmute (seconds) */
  FADE_DURATION: 0.01,
  
  /** Worker pool size limit */
  MAX_WORKERS: 4,
  
  /** Maximum project size (bytes) - 2GB */
  MAX_PROJECT_SIZE: 2 * 1024 * 1024 * 1024,
} as const;

// ========================================
// COLORS (DAW Theme)
// ========================================

export const DAW_COLORS = {
  BG_MAIN: '#171717',
  BG_CONTRAST: '#1E1E1E',
  BG_BARS: '#2B2B2B',
  BORDER: '#3A3A3A',
  GRID: '#2B2B2B',
  TEXT_PRIMARY: '#E5E5E5',
  TEXT_SECONDARY: '#9E9E9E',
  ACCENT_BLUE: '#3B82F6',
  ACCENT_RED: '#EF4444',
  ACCENT_GREEN: '#22C55E',
  ACCENT_YELLOW: '#F59E0B',
} as const;

// ========================================
// GRID & RULERS
// ========================================

export const GRID = {
  /** Grid line spacing (pixels) at zoom=1 */
  LINE_SPACING: 100,
  
  /** Grid opacity */
  OPACITY: 0.3,
  
  /** Snap threshold (pixels) */
  SNAP_THRESHOLD: 10,
} as const;

// ========================================
// PERFORMANCE
// ========================================

export const PERFORMANCE = {
  /** Debounce time for resize events (ms) */
  RESIZE_DEBOUNCE: 150,
  
  /** Throttle time for scroll events (ms) */
  SCROLL_THROTTLE: 16,
  
  /** Maximum tracks before warning */
  MAX_TRACKS_WARNING: 50,
  
  /** Waveform cache TTL (ms) - 5 minutes */
  WAVEFORM_CACHE_TTL: 5 * 60 * 1000,
} as const;

// ========================================
// METRONOME
// ========================================

export const METRONOME = {
  /** Default downbeat frequency (Hz) */
  DOWNBEAT_FREQ: 1000,
  
  /** Default beat frequency (Hz) */
  BEAT_FREQ: 800,
  
  /** Default subdivision frequency (Hz) */
  SUBDIVISION_FREQ: 600,
  
  /** Click duration (seconds) */
  CLICK_DURATION: 0.05,
  
  /** Default volume (0-1) */
  DEFAULT_VOLUME: 0.5,
} as const;

// ========================================
// EXPORT / PERSISTENCE
// ========================================

export const EXPORT = {
  /** .gmtk file extension */
  EXTENSION: '.gmtk',
  
  /** .gmtkmock test file extension */
  TEST_EXTENSION: '.gmtkmock',
  
  /** ZIP compression level (0-9) */
  COMPRESSION_LEVEL: 6,
  
  /** XML encoding */
  XML_ENCODING: 'UTF-8',
  
  /** XML version */
  XML_VERSION: '1.0',
} as const;

// ========================================
// TYPE EXPORTS
// ========================================

export type LayoutKey = keyof typeof LAYOUT;
export type ZoomKey = keyof typeof ZOOM;
export type WaveformKey = keyof typeof WAVEFORM;
export type AudioKey = keyof typeof AUDIO;
export type DAWColorKey = keyof typeof DAW_COLORS;
export type GridKey = keyof typeof GRID;
export type PerformanceKey = keyof typeof PERFORMANCE;
export type MetronomeKey = keyof typeof METRONOME;
export type ExportKey = keyof typeof EXPORT;
