import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface UIState {
  // Zoom controls
  zoom: number;
  trackHeight: number;
  
  // Scroll position
  scrollLeft: number;
  
  // Panel visibility
  showNotesPanel: boolean;
  showMixerDock: boolean;
  showTrackList: boolean;
  
  // Modals
  isTimelineEditorOpen: boolean;
  editingMarker: any | null;
  
  // View settings
  showWaveforms: boolean;
  showGrid: boolean;
  showChords: boolean;
}

interface UIContextValue {
  state: UIState;
  
  // Zoom actions
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setTrackHeight: (height: number) => void;
  
  // Scroll actions
  setScrollLeft: (value: number) => void;
  
  // Panel toggles
  toggleNotesPanel: () => void;
  toggleMixerDock: () => void;
  toggleTrackList: () => void;
  
  // Modal controls
  openTimelineEditor: (marker?: any) => void;
  closeTimelineEditor: () => void;
  
  // View settings
  toggleWaveforms: () => void;
  toggleGrid: () => void;
  toggleChords: () => void;
}

const UIContext = createContext<UIContextValue | undefined>(undefined);

interface UIProviderProps {
  children: ReactNode;
}

/**
 * UIProvider - Centralized UI State Management
 * 
 * Manages all UI-related state (zoom, scroll, panel visibility, etc.)
 * to reduce re-renders and prevent the "God Component" anti-pattern.
 * 
 * This separates visual state from data state, improving performance
 * and making the codebase more maintainable.
 */
export const UIProvider: React.FC<UIProviderProps> = ({ children }) => {
  const [state, setState] = useState<UIState>({
    zoom: 50,
    trackHeight: 96,
    scrollLeft: 0,
    showNotesPanel: false,
    showMixerDock: false,
    showTrackList: true,
    isTimelineEditorOpen: false,
    editingMarker: null,
    showWaveforms: true,
    showGrid: true,
    showChords: true,
  });

  // Zoom controls
  const setZoom = useCallback((zoom: number) => {
    setState(prev => ({ ...prev, zoom: Math.max(10, Math.min(200, zoom)) }));
  }, []);

  const zoomIn = useCallback(() => {
    setState(prev => ({ ...prev, zoom: Math.min(200, prev.zoom + 10) }));
  }, []);

  const zoomOut = useCallback(() => {
    setState(prev => ({ ...prev, zoom: Math.max(10, prev.zoom - 10) }));
  }, []);

  const setTrackHeight = useCallback((height: number) => {
    setState(prev => ({ ...prev, trackHeight: height }));
  }, []);

  // Scroll controls
  const setScrollLeft = useCallback((value: number) => {
    setState(prev => ({ ...prev, scrollLeft: value }));
  }, []);

  // Panel toggles
  const toggleNotesPanel = useCallback(() => {
    setState(prev => ({ ...prev, showNotesPanel: !prev.showNotesPanel }));
  }, []);

  const toggleMixerDock = useCallback(() => {
    setState(prev => ({ ...prev, showMixerDock: !prev.showMixerDock }));
  }, []);

  const toggleTrackList = useCallback(() => {
    setState(prev => ({ ...prev, showTrackList: !prev.showTrackList }));
  }, []);

  // Modal controls
  const openTimelineEditor = useCallback((marker?: any) => {
    setState(prev => ({ 
      ...prev, 
      isTimelineEditorOpen: true,
      editingMarker: marker || null 
    }));
  }, []);

  const closeTimelineEditor = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isTimelineEditorOpen: false,
      editingMarker: null 
    }));
  }, []);

  // View settings
  const toggleWaveforms = useCallback(() => {
    setState(prev => ({ ...prev, showWaveforms: !prev.showWaveforms }));
  }, []);

  const toggleGrid = useCallback(() => {
    setState(prev => ({ ...prev, showGrid: !prev.showGrid }));
  }, []);

  const toggleChords = useCallback(() => {
    setState(prev => ({ ...prev, showChords: !prev.showChords }));
  }, []);

  const value: UIContextValue = {
    state,
    setZoom,
    zoomIn,
    zoomOut,
    setTrackHeight,
    setScrollLeft,
    toggleNotesPanel,
    toggleMixerDock,
    toggleTrackList,
    openTimelineEditor,
    closeTimelineEditor,
    toggleWaveforms,
    toggleGrid,
    toggleChords,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

/**
 * Hook to access UI state and actions
 * @throws Error if used outside of UIProvider
 */
export const useUI = (): UIContextValue => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
