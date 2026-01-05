/**
 * UI Constants - Centralized configuration values
 * 
 * This file contains all "magic numbers" and hardcoded values
 * used throughout the application for consistency and easy maintenance.
 */

// ============ TRACK HEIGHTS ============
export const TRACK_HEIGHT = {
  SMALL: 64,
  MEDIUM: 96,
  LARGE: 128,
  XLARGE: 160,
} as const;

export const DEFAULT_TRACK_HEIGHT = TRACK_HEIGHT.MEDIUM;

// ============ ZOOM LEVELS ============
// Zoom é baseado em Pixels Per Second (PPS)
// BASE_PPS define quantos pixels representam 1 segundo de áudio no zoom 1.0 (100%)
export const ZOOM = {
  BASE_PPS: 50,    // 50 pixels por segundo no zoom base (1.0)
  MIN: 0.001,      // Permite visualizar horas de áudio numa tela só
  MAX: 20.0,       // Permite visualizar samples individuais
  DEFAULT: 1.0,    // 100% = 50 pixels/segundo
  STEP: 0.1,       // Incremento de 10% (para botões lineares)
  FACTOR: 1.2,     // Fator exponencial (20% de aumento/diminuição por scroll)
} as const;

// ============ TIMELINE DIMENSIONS ============
export const TIMELINE = {
  RULER_HEIGHT: 32, // Unified height for all rulers (was inconsistent 28-40px)
  SCROLLBAR_HEIGHT: 12,
  MIN_WIDTH: 800,
} as const;

// ============ SIDEBAR DIMENSIONS ============
export const SIDEBAR = {
  TRACK_LIST_WIDTH: 220,
  MIXER_DOCK_WIDTH: 300,
  NOTES_PANEL_WIDTH: 300,
} as const;

// ============ PLAYBACK CURSOR ============
export const CURSOR = {
  WIDTH: 2,
  COLOR: '#ef4444', // red-500
  Z_INDEX: 50,
} as const;

// ============ WAVEFORM RENDERING ============
export const WAVEFORM = {
  SAMPLE_RATE: 2, // Sample every N pixels for performance
  COLOR_PRIMARY: '#3b82f6', // blue-500
  COLOR_SECONDARY: '#60a5fa', // blue-400
  OPACITY: 0.8,
} as const;

// ============ LOD (LEVEL OF DETAIL) ============
/**
 * Multi-level LOD system for waveform rendering optimization
 * 
 * Performance targets:
 * - Low: <1ms render (overview navigation)
 * - Medium: <5ms render (normal editing)
 * - High: <16ms render (zoomed detail, 60fps)
 */
export const LOD = {
  // Zoom thresholds for automatic LOD switching
  LOW_ZOOM_THRESHOLD: 0.3,      // Below this: use overview (2k samples)
  MEDIUM_ZOOM_THRESHOLD: 1.5,   // Below this: use medium (20k samples)
  // Above medium threshold: use high detail (150k+ samples)
  
  // Sample counts for each LOD level
  OVERVIEW_SAMPLES: 2000,           // Low detail for distant view
  MEDIUM_SAMPLES: 20000,            // Medium detail for normal editing
  DETAIL_SAMPLES_PER_SECOND: 500,  // High detail: 500 samples/sec
  
  // Performance monitoring
  PERFORMANCE_WARNING_MS: 16,    // Warn if render takes > 1 frame (60fps)
  PERFORMANCE_LOG_ENABLED: false, // Toggle performance logging
} as const;

// ============ GRID LINES ============
export const GRID = {
  MEASURE_OPACITY: 1.0,
  BEAT_OPACITY: 0.6,
  SUBDIVISION_OPACITY: 0.3,
  COLOR: '#374151', // gray-700
  MIN_ZOOM_FOR_SUBDIVISIONS: 80,
} as const;

// ============ AUDIO ENGINE ============
export const AUDIO = {
  LOOKAHEAD_TIME: 0.2, // Schedule audio 200ms ahead
  METRONOME_FREQUENCIES: {
    STRONG_BEAT: 1000,
    NORMAL_BEAT: 800,
    SUBDIVISION: 600,
  },
  DEFAULT_VOLUME: 0.5,
  MAX_VOLUME: 10,
} as const;

// ============ ANIMATION ============
export const ANIMATION = {
  RAF_TARGET_FPS: 60, // requestAnimationFrame target
  SCROLL_SMOOTH_DURATION: 300, // ms
  FADE_DURATION: 200, // ms
} as const;

// ============ KEYBOARD SHORTCUTS ============
export const SHORTCUTS = {
  PLAY_PAUSE: ' ', // Space
  STOP: 'Escape',
  ZOOM_IN: '=',
  ZOOM_OUT: '-',
  TOGGLE_METRONOME: 'm',
  TOGGLE_LOOP: 'l',
  SEEK_BACKWARD: 'ArrowLeft',
  SEEK_FORWARD: 'ArrowRight',
} as const;

// ============ SNAP TO GRID ============
export const SNAP = {
  TOLERANCE_PIXELS: 10, // Snap if within 10 pixels
  DEFAULT_UNIT: 'beat' as const,
} as const;

// ============ COLORS (complementing Tailwind) ============
export const COLORS = {
  // Track colors
  TRACK_COLORS: [
    '#ef4444', // red
    '#f59e0b', // amber
    '#10b981', // emerald
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
  ],
  
  // Status colors
  RECORDING: '#dc2626', // red-600
  PLAYING: '#16a34a', // green-600
  PAUSED: '#ca8a04', // yellow-600
  MUTED: '#6b7280', // gray-500
  SOLO: '#eab308', // yellow-500
  
  // UI states
  HOVER: '#1f2937', // gray-800
  SELECTED: '#1e40af', // blue-800
  DISABLED: '#4b5563', // gray-600
} as const;

// ============ PERFORMANCE ============
export const PERFORMANCE = {
  // Debounce/throttle delays
  RESIZE_DEBOUNCE: 150,
  SCROLL_THROTTLE: 16, // ~60fps
  SEARCH_DEBOUNCE: 300,
  
  // Rendering thresholds
  MAX_WAVEFORM_POINTS: 10000,
  VIRTUALIZATION_THRESHOLD: 50, // Start virtualizing after this many tracks
} as const;

// ============ VALIDATION ============
export const VALIDATION = {
  MIN_TEMPO: 20,
  MAX_TEMPO: 300,
  MIN_TRACK_NAME_LENGTH: 1,
  MAX_TRACK_NAME_LENGTH: 50,
  MAX_PROJECT_NAME_LENGTH: 100,
} as const;

// ============ LAYOUT DIMENSIONS (DAW-specific) ============
export const LAYOUT = {
  SIDEBAR_WIDTH: 280,
  TRANSPORT_HEIGHT: 64,
  BOTTOM_BAR_HEIGHT: 32,
  RULER_HEIGHT: 32, // Altura unificada das réguas
  MOBILE_BREAKPOINT: 768,
} as const;

// ============ DAW THEME COLORS ============
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

// ============ METRONOME CONFIGURATION ============
export const METRONOME = {
  DOWNBEAT_FREQ: 1000,
  BEAT_FREQ: 800,
  SUBDIVISION_FREQ: 600,
  CLICK_DURATION: 0.05,
  DEFAULT_VOLUME: 0.5,
} as const;

// ============ EXPORT/PROJECT PERSISTENCE ============
export const EXPORT = {
  EXTENSION: '.gmtk',
  TEST_EXTENSION: '.gmtkmock',
  COMPRESSION_LEVEL: 6,
  XML_ENCODING: 'UTF-8',
  XML_VERSION: '1.0',
} as const;

// ============ LOCAL STORAGE KEYS ============
export const STORAGE_KEYS = {
  LANGUAGE: 'goodmultitracks_language',
  THEME: 'goodmultitracks_theme',
  MAIN_INSTRUMENT: 'goodmultitracks_main_instrument',
  RECENT_PROJECTS: 'goodmultitracks_recent_projects',
  UI_PREFERENCES: 'goodmultitracks_ui_prefs',
  METRONOME_FREQUENCIES: 'metronome_frequencies',
} as const;

// ============ TYPE EXPORTS ============
export type TrackHeight = typeof TRACK_HEIGHT[keyof typeof TRACK_HEIGHT];
export type SnapUnit = 'measure' | 'beat' | 'subdivision';
export type PlaybackState = 'playing' | 'paused' | 'stopped';
export type LayoutKey = keyof typeof LAYOUT;
export type ZoomKey = keyof typeof ZOOM;
export type WaveformKey = keyof typeof WAVEFORM;
export type AudioKey = keyof typeof AUDIO;
export type DAWColorKey = keyof typeof DAW_COLORS;
export type GridKey = keyof typeof GRID;
export type PerformanceKey = keyof typeof PERFORMANCE;
export type MetronomeKey = keyof typeof METRONOME;
export type ExportKey = keyof typeof EXPORT;
