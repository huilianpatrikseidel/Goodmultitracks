/**
 * Player Feature Module
 * 
 * This module encapsulates all DAW player functionality including:
 * - Audio playback engine
 * - Timeline visualization
 * - Waveform rendering
 * - Mixer controls
 * - Transport controls
 * - Audio utilities
 */

// Main Component
export { DAWPlayer } from './components/DAWPlayer';

// Hooks
export { usePlaybackEngine } from './hooks/usePlaybackEngine';
export { useTrackManager } from './hooks/useTrackManager';

// Utils
export * from './utils/audioUtils';
export * from './utils/warpUtils';
export * from './utils/gridUtils';

// Engine
export * from './engine/metronome';

// Context
export { AudioContextProvider, useAudioContext } from './context/AudioContextProvider';
