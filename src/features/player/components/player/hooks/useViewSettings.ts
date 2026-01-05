import { useState, useEffect, useCallback } from 'react';
import { storage } from '../../../../../lib/localStorageManager';

interface ViewSettings {
  trackHeight: 'small' | 'medium' | 'large';
  zoom: number;
  rulerVisibility: Record<string, boolean>;
  rulerOrder: string[];
  sidebarVisible: boolean;
  mixerVisible: boolean;
  mixerDockVisible: boolean;
  notesPanelVisible: boolean;
}

const ALL_RULER_IDS = ['time', 'measures', 'sections', 'chords', 'tempo'];

/**
 * ZOOM LEVELS AND LOD INTEGRATION:
 * 
 * Zoom Range: 0.5 (min) to 8.0 (max)
 * 
 * LOD Automatic Switching:
 * - 0.5 - 0.3: Overview LOD (2,000 samples) - Distant view, entire project visible
 * - 0.3 - 1.5: Medium LOD (20,000 samples) - Normal editing, balanced detail
 * - 1.5 - 8.0: Detail LOD (150k+ samples) - Zoomed detail, sample-level precision
 * 
 * Additional optimizations:
 * - Viewport culling: Only renders visible portion
 * - Dynamic step: Adapts render density to pixel ratio
 * - Peak detection: Preserves transients when downsampling
 * 
 * See: src/config/constants.ts (LOD thresholds)
 *      src/features/player/hooks/useTrackWaveform.ts (LOD selection logic)
 */

export const useViewSettings = () => {
  // Track Height
  const [trackHeight, setTrackHeight] = useState<'small' | 'medium' | 'large'>(() => {
    return storage.getTrackHeight() as 'small' | 'medium' | 'large';
  });

  // Zoom
  const [zoom, setZoom] = useState(1);

  // Ruler Order
  const [rulerOrder, setRulerOrder] = useState<string[]>(() => {
    return storage.getRulerOrder();
  });

  // Ruler Visibility
  const [rulerVisibility, setRulerVisibility] = useState<Record<string, boolean>>(() => {
    const visibility: Record<string, boolean> = {};
    ALL_RULER_IDS.forEach((id) => {
      visibility[id] = storage.getRulerVisibility(id);
    });
    return visibility;
  });

  // Panel visibility states
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [mixerVisible, setMixerVisible] = useState(true);
  const [mixerDockVisible, setMixerDockVisible] = useState(false);
  const [notesPanelVisible, setNotesPanelVisible] = useState(false);

  // Persist track height
  useEffect(() => {
    storage.setTrackHeight(trackHeight);
  }, [trackHeight]);

  // Persist ruler order
  useEffect(() => {
    storage.setRulerOrder(rulerOrder);
  }, [rulerOrder]);

  // Persist ruler visibility
  const handleRulerVisibilityChange = useCallback((rulerId: string, visible: boolean) => {
    setRulerVisibility((prev) => {
      const updated = { ...prev, [rulerId]: visible };
      storage.setRulerVisibility(rulerId, visible);
      return updated;
    });
  }, []);

  // Zoom controls (0.5 = min, 8.0 = max)
  // Increments: 0.5 per step
  // LOD switches automatically at 0.3 and 1.5 thresholds
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.5, 8)); // Max: 8.0
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.5, 0.5)); // Min: 0.5
  }, []);

  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(Math.max(0.5, Math.min(8, newZoom))); // Clamp: [0.5, 8.0]
  }, []);

  const getTrackHeightPx = useCallback(() => {
    switch (trackHeight) {
      case 'small':
        return 80;
      case 'large':
        return 180;
      default:
        return 120;
    }
  }, [trackHeight]);

  return {
    // State
    trackHeight,
    zoom,
    rulerVisibility,
    rulerOrder,
    sidebarVisible,
    mixerVisible,
    mixerDockVisible,
    notesPanelVisible,

    // Setters
    setTrackHeight,
    setZoom,
    setRulerVisibility,
    setRulerOrder,
    setSidebarVisible,
    setMixerVisible,
    setMixerDockVisible,
    setNotesPanelVisible,

    // Handlers
    handleRulerVisibilityChange,
    handleZoomIn,
    handleZoomOut,
    handleZoomChange,
    getTrackHeightPx,
  };
};
