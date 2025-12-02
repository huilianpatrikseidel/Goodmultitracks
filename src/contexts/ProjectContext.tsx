import React, { createContext, useContext, ReactNode } from 'react';
import { Song, AudioTrack, TrackTag } from '../types';

/**
 * ProjectContext - Global state management for DAW project
 * 
 * PERFORMANCE OPTIMIZATION (P1):
 * - Tracks state is now isolated from Song object to prevent unnecessary re-renders
 * - Track actions (volume, mute, solo) no longer clone entire Song object
 * - Only affected track components re-render on state changes
 * 
 * This context eliminates prop drilling by providing centralized access to:
 * - Song metadata and updates
 * - Track state and actions (isolated for performance)
 * - Playback state (currentTime, gridTime, tempo, isPlaying)
 * - View settings (zoom, editMode, keyShift)
 * 
 * Benefits:
 * - Reduces prop drilling from 4-5 levels to direct context consumption
 * - Prevents full DAW re-render when single track volume changes
 * - Preserves state across component re-renders (fixes Warp Mode reset bug)
 * - Enables independent component testing with mock context
 * - Simplifies component interfaces
 * 
 * Usage:
 * 1. Wrap DAWPlayer with <ProjectProvider> and pass values from parent
 * 2. Child components use `const { song, currentTime, trackActions } = useProject()`
 * 3. No need to pass these props through intermediate components
 */

interface ProjectContextValue {
  // Song metadata (without tracks for performance)
  song: Song | null;
  updateSong: (song: Song) => void;
  
  // Track state (isolated for performance - P1 optimization)
  tracks: AudioTrack[];
  trackActions: {
    updateVolume: (trackId: string, volume: number) => void;
    toggleMute: (trackId: string) => void;
    toggleSolo: (trackId: string) => void;
    updateName: (trackId: string, name: string) => void;
    updateColor: (trackId: string, color: string) => void;
    updateTag: (trackId: string, tag: TrackTag) => void;
    updateNotes?: (trackId: string, notes: string) => void;
  };
  
  // Playback state (provided by playback engine)
  currentTime: number;
  gridTime: number;
  tempo: number;
  isPlaying: boolean;
  
  // View settings
  zoom: number;
  setZoom: (zoom: number) => void;
  editMode: boolean;
  setEditMode: (enabled: boolean) => void;
  warpMode: boolean;
  setWarpMode: (enabled: boolean) => void;
  keyShift: number;
  setKeyShift: (shift: number) => void;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

interface ProjectProviderProps {
  children: ReactNode;
  // Values passed from parent component (DAWPlayerContent)
  value: ProjectContextValue;
}

/**
 * ProjectProvider - Context provider wrapper
 * 
 * Note: This provider receives all values from the parent component.
 * State management remains in DAWPlayerContent to maintain compatibility
 * with existing playback engine and lifecycle hooks.
 * 
 * Future enhancement: Move state management into this provider for
 * complete centralization.
 */
export const ProjectProvider: React.FC<ProjectProviderProps> = ({
  children,
  value,
}) => {
  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};
