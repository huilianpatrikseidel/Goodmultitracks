import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Pause,
  Square,
  Repeat,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ArrowLeft,
  Plus,
  Download,
  Clock,
  Music2,
  Grid3x3,
  PanelLeftClose,
  PanelLeft,
  Settings,
  Sliders,
  Keyboard,
  Save,
  StickyNote,
  X,
  GripVertical,
} from 'lucide-react';
import { transposeKey } from '../../../lib/musicTheory';
import { PlayerViewSettings } from '../../../components/PlayerViewSettings';
import { PlaybackControls } from '../../../components/PlaybackControls';
import { KeyboardShortcutsHelp } from '../../../components/shared/KeyboardShortcutsHelp';
import { MixPresetsManager } from './mixer/MixPresetsManager';
import { MixerDock } from './mixer/MixerDock';
import { NotesPanel } from '../../../components/NotesPanel';
import { Button } from '../../../components/ui/button';
import { getWarpedTime as utilsGetWarpedTime } from '../utils/warpUtils';
import { Song, AudioTrack, SectionMarker, TempoChange, ChordMarker, MixPreset } from '../../../types';
import { Separator } from '../../../components/ui/separator';
import { CreateProjectDialog } from '../../../features/library/components/CreateProjectDialog';
import { TimelineEditorDialog } from '../../../components/TimelineEditorDialog';
import { ChordDiagram } from '../../../components/ChordDiagram';
import { TrackNotesDialog } from '../../../components/TrackNotesDialog';
import { ScrollZoomSlider } from '../../../components/ScrollZoomSlider';
import { VerticalScrollbar } from '../../../components/VerticalScrollbar';
import { ProjectProvider } from '../../../contexts/ProjectContext';
import { usePlaybackEngine } from '../hooks/usePlaybackEngine';
import { useKeyboardShortcuts } from './player/hooks/useKeyboardShortcuts';
import { useViewSettings } from './player/hooks/useViewSettings';
import { useTrackActions } from './player/hooks/useTrackActions';
import { TimelineContainer } from './player/TimelineContainer';
import { TransportHeader } from './player/TransportHeader';
import { TrackListSidebar } from '../../../components/TrackListSidebar';
import { BetaWarningBanner } from './BetaWarningBanner';
import { RulerSidebarHeaders } from './player/RulerSidebarHeaders';
import { ZoomControls } from './player/ZoomControls';
import { BottomToolbar } from './player/BottomToolbar';
import { DAWSidePanels } from './player/DAWSidePanels';
import { DAWDialogs } from './player/DAWDialogs';
import { useDAWScrollSync } from './player/hooks/useDAWScrollSync';
import { useMixPresets } from './player/hooks/useMixPresets';
import { useTimelineEditing } from './player/hooks/useTimelineEditing';
import { useZoomControls } from './player/hooks/useZoomControls';
import { useDAWState } from './player/hooks/useDAWState';
import { useDAWHelpers } from './player/hooks/useDAWHelpers';
import { useWarpMode } from './player/hooks/useWarpMode';
import { useNotesHandlers } from './player/hooks/useNotesHandlers';
import { useContainerResize } from './player/hooks/useContainerResize';
import { DAWPanels } from './player/DAWPanels';
import { storage } from '../../../lib/localStorageManager';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../components/ui/tooltip';
import { toast } from 'sonner';
import { useLanguage } from '../../../lib/LanguageContext';
import { RulersContainer } from './player/RulersContainer';
import { ZOOM } from '../../../config/constants';
import { measureToSeconds, secondsToMeasure, calculateWarpBPM } from '../../../lib/timeUtils';

interface DAWPlayerProps {
  song: Song | null;
  onSongUpdate?: (song: Song) => void;
  onPerformanceMode?: () => void;
  onBack: () => void;
  onCreateProject?: (projectData: any) => Promise<void>;
  onExportProject?: (song: Song) => void;
}

// Paleta de cores predefinida
const PRESET_COLORS = [
  '#60a5fa', '#ef4444', '#22c55e', '#f59e0b', '#a855f7', '#ec4899', '#14b8a6', '#f97316',
  '#84cc16', '#0ea5e9', '#d946ef', '#f43f5e', '#64748b', '#78716c', '#facc15', '#3b82f6',
];

// << NOVO COMPONENTE INTERNO >>
const RulerHandle: React.FC<{
  rulerId: string;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, rulerId: string) => void;
}> = ({ rulerId, onDragStart }) => (
  <div
    draggable
    onDragStart={(e: React.DragEvent<HTMLDivElement>) => onDragStart(e, rulerId)}
    className="absolute left-1 top-1/2 -translate-y-1/2 p-1 cursor-grab active:cursor-grabbing opacity-30 hover:opacity-100 transition-opacity"
  >
    <GripVertical className="w-4 h-4 text-gray-400" />
  </div>
);

const RulerDropTarget: React.FC<{
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
}> = ({ onDrop, onDragOver }) => (
  <div
    className="absolute inset-0"
    onDrop={onDrop}
    onDragOver={onDragOver}
  />
);

// << REATORAÇÃO: Centralizando a lista de IDs de réguas >>
const ALL_RULER_IDS = ['time', 'measures', 'sections', 'chords', 'tempo'];

// ============================================================================
// TimelineNavigator - Componente de Scroll/Zoom (Range Slider)
// ============================================================================
const TimelineNavigator: React.FC<{
  songDuration: number;
  zoom: number;
  containerWidth: number;
  timelineRef: React.RefObject<HTMLDivElement | null>;
  onNavigate: (newZoom: number, newScrollLeft: number) => void;
}> = ({ songDuration, zoom, containerWidth, timelineRef, onNavigate }) => {
  const [range, setRange] = useState({ start: 0, end: 1 });
  const isDraggingRef = useRef(false);

  // Sync from Timeline to Slider
  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;

    const updateRange = () => {
      if (isDraggingRef.current) return;

      const scrollLeft = timeline.scrollLeft;
      const totalWidth = songDuration * ZOOM.BASE_PPS * zoom;
      
      if (totalWidth === 0) return;

      const start = scrollLeft / totalWidth;
      const end = (scrollLeft + containerWidth) / totalWidth;

      setRange({
        start: Math.max(0, start),
        end: Math.min(1, end)
      });
    };

    updateRange();
    timeline.addEventListener('scroll', updateRange);
    return () => timeline.removeEventListener('scroll', updateRange);
  }, [songDuration, zoom, containerWidth, timelineRef]);

  const handleSliderChange = React.useCallback(({ start, end }: { start: number; end: number }) => {
    isDraggingRef.current = true;
    setRange({ start, end });

    const widthPercent = end - start;
    if (widthPercent <= 0.0001) return;

    // Calculate new zoom
    const newTotalWidth = containerWidth / widthPercent;
    const newZoom = newTotalWidth / (songDuration * ZOOM.BASE_PPS);
    
    // Clamp zoom
    const clampedZoom = Math.max(ZOOM.MIN, Math.min(ZOOM.MAX, newZoom));
    
    // Calculate new scroll
    const actualTotalWidth = songDuration * ZOOM.BASE_PPS * clampedZoom;
    const newScrollLeft = start * actualTotalWidth;

    onNavigate(clampedZoom, newScrollLeft);
    
    setTimeout(() => {
        isDraggingRef.current = false;
    }, 100);
  }, [containerWidth, songDuration, onNavigate]);

  return (
    <div className="flex-1 px-4 flex items-center h-full">
      <ScrollZoomSlider
        start={range.start}
        end={range.end}
        onChange={handleSliderChange}
        className="h-5 w-full"
      />
    </div>
  );
};

// ============================================================================
// DAWPlayerContent - Componente interno extraído (CORREÇÃO DE BUG)
// ============================================================================
// IMPORTANTE: Este componente foi movido para fora do escopo de DAWPlayer
// para evitar que seja recriado a cada render, o que causava reset de estado
// (warpGridMode voltava a false após cada update)
// ============================================================================

interface DAWPlayerContentProps {
  song: Song;
  onSongUpdate?: (song: Song) => void;
  onPerformanceMode?: () => void;
  onBack: () => void;
  onExportProject?: (song: Song) => void;
}

function DAWPlayerContent({ song, onSongUpdate, onPerformanceMode, onBack, onExportProject }: DAWPlayerContentProps) {
  const { t } = useLanguage();

  // View settings
  const viewSettings = useViewSettings();
  const { zoom, setZoom, trackHeight, setTrackHeight, rulerVisibility, rulerOrder, setRulerOrder } = viewSettings;

  // State management via custom hook
  const dawState = useDAWState({ song });
  const {
    keyShift, setKeyShift, editMode, setEditMode, createProjectOpen, setCreateProjectOpen,
    containerWidth, setContainerWidth, snapEnabled, setSnapEnabled,
    sidebarVisible, setSidebarVisible, mixerVisible, setMixerVisible,
    mixerDockVisible, setMixerDockVisible, mixPresetsPopoverOpen, setMixPresetsPopoverOpen,
    selectedChord, setSelectedChord, showShortcutsHelp, setShowShortcutsHelp,
    dynamicTempos, isDragging, setIsDragging, scrollTop, setScrollTop,
    pinnedTracks, setPinnedTracks, selectedTrackForNotes, setSelectedTrackForNotes,
    notesPanelVisible, setNotesPanelVisible, warpMode, setWarpMode,
    rulerRef, sidebarRef, timelineRef, hoveredContainerRef
  } = dawState;

  // Playback engine
  const { isPlaying, currentTime, gridTime, tempo, loopEnabled, loopStart, loopEnd, metronomeEnabled, metronomeVolume, actions: playbackActions } = usePlaybackEngine({ 
    song, 
    warpModeEnabled: false 
  });

  // Track actions
  const trackActions = useTrackActions({ song, onSongUpdate });

  // Custom hooks
  const { mixPresets, handleSaveMixPreset, handleLoadMixPreset, handleDeleteMixPreset } = useMixPresets({ song, onSongUpdate });
  
  const { 
    editorOpen, setEditorOpen, editorType, editingMarker, clickedTime,
    handleTimelineClick, handleTimelineItemSubmit, openEditor
  } = useTimelineEditing({ song, onSongUpdate, editMode });

  const { handleZoomOutOnPlayhead, handleZoomInOnPlayhead, handleFitToView } = useZoomControls({ 
    zoom, setZoom, song, containerWidth 
  });

  const { scrollLeftRef, handleTimelineScroll, handleNavigatorChange } = useDAWScrollSync({
    zoom, setZoom, timelineRef, rulerRef, currentTime
  });

  const { getPixelsPerSecond, getTrackHeightPx, getCurrentMeasure, getCurrentTempoInfo, getCurrentTimeSignature } = useDAWHelpers({
    song, zoom, currentTime, trackHeight
  });

  const { handleWarpCommit } = useWarpMode({ song, onSongUpdate });
  
  const { handleAddSongNote, handleDeleteSongNote, handleSaveTrackNotes } = useNotesHandlers({ song, onSongUpdate });

  useContainerResize({ timelineRef, setContainerWidth, song, containerWidth, setZoom });

  const handleRulerVisibilityChange = (newVisibility: Record<string, boolean>) => {
    viewSettings.setRulerVisibility(newVisibility);
    // Salvar cada régua individualmente no storage
    Object.entries(newVisibility).forEach(([rulerId, visible]) => {
      storage.setRulerVisibility(rulerId, visible);
    });
  };

  const handleLoopRegionChange = (start: number, end: number) => {
    playbackActions.setLoopStart(start);
    playbackActions.setLoopEnd(end);
    playbackActions.setLoopEnabled(true);
  };

  const handleTimelineMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  // FIX QA: Handler de scroll vindo da Sidebar (com proteção Mutex)
  const handleSidebarScroll = React.useCallback((scrollTop: number) => {
    // Só sincroniza Timeline se o scroll vier da Sidebar (não da Timeline)
    if (hoveredContainerRef.current === 'timeline') return;
    
    if (timelineRef.current) {
      if (timelineRef.current.scrollTop !== scrollTop) {
        timelineRef.current.scrollTop = scrollTop;
      }
    }
  }, []);

  // Handler para VerticalScrollbar
  const handleVerticalScrollbarChange = React.useCallback((range: { start: number; end: number }) => {
    if (!timelineRef.current) return;
    
    const totalHeight = timelineRef.current.scrollHeight;
    const newScrollTop = range.start * totalHeight;
    
    // Atualizar scroll de ambos os containers
    timelineRef.current.scrollTop = newScrollTop;
    if (sidebarRef.current) {
      sidebarRef.current.scrollTop = newScrollTop;
    }
  }, []);

  // Calcular range vertical para scrollbar
  const getVerticalScrollRange = React.useCallback(() => {
    if (!timelineRef.current) return { start: 0, end: 1 };
    
    const scrollHeight = timelineRef.current.scrollHeight;
    const clientHeight = timelineRef.current.clientHeight;
    
    if (scrollHeight <= clientHeight) return { start: 0, end: 1 };
    
    const scrollTop = timelineRef.current.scrollTop;
    const start = scrollTop / scrollHeight;
    const end = (scrollTop + clientHeight) / scrollHeight;
    
    return { start, end };
  }, [scrollTop]);

  // Handlers vazios memoizados para evitar recriação
  const noOpMouseMove = React.useCallback((e: React.MouseEvent) => {}, []);
  const noOpTrackTags = React.useCallback((trackId: string, tags: any[]) => {}, []);
  const noOpEditingTrackId = React.useCallback(() => {}, []);
  const noOpTrackNameInput = React.useCallback(() => {}, []);
  
  // Handler para fechar MixerDock
  const handleCloseMixerDock = React.useCallback(() => {
    setMixerDockVisible(false);
  }, []);

  useKeyboardShortcuts({
    isPlaying,
    onPlayPause: playbackActions.togglePlayPause,
    onStop: () => playbackActions.seek(0),
    onToggleLoop: () => playbackActions.setLoopEnabled(!loopEnabled),
    onToggleMetronome: () => playbackActions.setMetronomeEnabled(!metronomeEnabled),
    onZoomIn: () => setZoom((prev) => Math.min(8, prev + 0.25)),
    onZoomOut: () => setZoom((prev) => Math.max(0.5, prev - 0.25)),
    onGoToStart: () => playbackActions.seek(0),
    onGoToEnd: () => playbackActions.seek(song?.duration || 0),
    onFitToView: () => {
      if (song && containerWidth > 0) {
        // FIX: Usar ZOOM.BASE_PPS (50) em vez de 100 hardcoded
        const targetZoom = containerWidth / (song.duration * ZOOM.BASE_PPS);
        const safeZoom = Math.max(ZOOM.MIN, Math.min(ZOOM.MAX, targetZoom));
        setZoom(safeZoom);
        handleTimelineScroll(0); // Garante que volta para o início
      }
    },
    onToggleEditMode: () => setEditMode((prev) => !prev),
  });

  // Mix Presets Functions - now handled by useMixPresets hook

  const handleToggleTrackPin = (trackId: string) => {
    setPinnedTracks((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }
      return next;
    });
  };

  const [editorInitialTime, setEditorInitialTime] = React.useState<number | null>(null);

  const handleChordClick = (chord: ChordMarker) => {
    if (editMode && !warpMode) {
      openEditor('chord', chord);
    } else {
      setSelectedChord({ chord: chord.chord, customDiagram: chord.customDiagram });
    }
  };

  if (!song) {
    return (
      <div className="flex flex-col h-full text-white" style={{ backgroundColor: 'var(--daw-bg-main)' }}>
        <div className="border-b p-3 flex items-center justify-between" style={{ backgroundColor: 'var(--daw-bg-bars)', borderColor: 'var(--daw-border)' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-white hover:bg-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Library
          </Button>
          <h2>Player</h2>
          <div className="w-8" />
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div>
              <h3 className="mb-2">No Project Loaded</h3>
              <p className="text-sm text-gray-400 mb-4">
                Create a new project or load one from the library
              </p>
            </div>
          </div>
        </div>
        
        <CreateProjectDialog
          open={false}
          onOpenChange={() => {}}
          onCreateProject={async () => {}}
        />
      </div>
    );
  }

  // Centralizar ordenação: pinned tracks primeiro, depois unpinned
  const orderedTracks = useMemo(() => {
    if (!song?.tracks) return [];
    const pinned = song.tracks.filter(t => pinnedTracks.has(t.id));
    const unpinned = song.tracks.filter(t => !pinnedTracks.has(t.id));
    return [...pinned, ...unpinned];
  }, [song?.tracks, pinnedTracks]);

  const handleTempoMarkerAdd = (time: number) => {
    openEditor('tempo', undefined, time);
  };

  // P1 OPTIMIZATION: Provide isolated track state and actions via context
  const projectContextValue = {
    song,
    updateSong: (updatedSong: Song) => {
      if (onSongUpdate) onSongUpdate(updatedSong);
    },
    // Track state and actions (P1 optimization - prevents full re-render)
    tracks: song?.tracks || [],
    trackActions: {
      updateVolume: trackActions.handleTrackVolumeChange,
      toggleMute: trackActions.handleTrackMuteToggle,
      toggleSolo: trackActions.handleTrackSoloToggle,
      updateName: trackActions.handleTrackNameChange,
      updateColor: trackActions.handleTrackColorChange,
      updateTag: trackActions.handleTrackTagChange,
    },
    currentTime,
    gridTime,
    tempo,
    isPlaying,
    zoom,
    setZoom,
    editMode,
    setEditMode,
    warpMode,
    setWarpMode,
    keyShift,
    setKeyShift,
  };

  const activeTool = warpMode ? 'warp' : (editMode ? 'marker' : null);

  const handleToolChange = (tool: 'marker' | 'warp' | null) => {
    if (tool === 'warp') {
      setWarpMode(true);
      setEditMode(true);
    } else if (tool === 'marker') {
      setWarpMode(false);
      setEditMode(true);
    } else {
      setWarpMode(false);
      setEditMode(false);
    }
  };

  return (
    <ProjectProvider value={projectContextValue}>
      <TooltipProvider>
        <div className="flex flex-col h-full text-white" style={{ backgroundColor: 'var(--daw-bg-main)' }}>
          {/* Top Bar - Using TransportHeader component */}
          <TransportHeader
            songTitle={song.title}
            songKey={song.key}
            isPlaying={isPlaying}
            currentTime={currentTime}
            tempo={tempo}
            loopEnabled={loopEnabled}
            metronomeEnabled={metronomeEnabled}
            metronomeVolume={metronomeVolume}
            currentMeasure={String(getCurrentMeasure())}
            currentTimeSignature={getCurrentTimeSignature()}
            displayTempo={tempo}
            keyShift={keyShift}
            trackHeight={trackHeight}
            rulerVisibility={rulerVisibility}
            rulerOrder={rulerOrder}
            snapEnabled={snapEnabled}
            onBack={onBack}
            onPlayPause={playbackActions.togglePlayPause}
            onStop={playbackActions.stop}
            onLoopToggle={() => playbackActions.setLoopEnabled(!loopEnabled)}
            onMetronomeToggle={() => playbackActions.setMetronomeEnabled(!metronomeEnabled)}
            onMetronomeVolumeChange={playbackActions.setMetronomeVolume}
            onTempoChange={playbackActions.setTempo}
            onKeyShiftChange={setKeyShift}
            onTrackHeightChange={setTrackHeight}
            onRulerVisibilityChange={handleRulerVisibilityChange}
            onRulerOrderChange={setRulerOrder}
            onSnapToggle={() => setSnapEnabled(!snapEnabled)}
            onSnapModeChange={(mode) => console.log('Snap mode:', mode)}
            activeTool={activeTool}
            onToolChange={handleToolChange}
          />

          {/* Beta Warning Banner */}
          <BetaWarningBanner />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            
            {/* Rulers Row - Fixed Vertically */}
            <div className="flex flex-none h-auto border-b z-30" style={{ backgroundColor: 'var(--daw-bg-contrast)', borderColor: 'var(--daw-border)' }}>
              {/* Ruler Labels Sidebar */}
              {sidebarVisible && mixerVisible && (
                <div className="flex-none border-r" style={{ width: '280px', minWidth: '280px', maxWidth: '280px', backgroundColor: 'var(--daw-bg-contrast)', borderColor: 'var(--daw-border)' }}>
                  <RulerSidebarHeaders
                    visibleRulers={Object.keys(rulerVisibility).filter(k => rulerVisibility[k])}
                    rulerOrder={rulerOrder}
                    onRulerOrderChange={setRulerOrder}
                  />
                </div>
              )}
              
              {/* Rulers Area - Synced Horizontally */}
              <div className="flex-1 overflow-x-hidden overflow-y-hidden" ref={rulerRef}>
                 <RulersContainer
                    song={song}
                    currentTime={currentTime}
                    gridTime={gridTime}
                    tempo={tempo}
                    zoom={zoom}
                    pixelsPerSecond={getPixelsPerSecond()}
                    containerWidth={containerWidth}
                    visibleRulers={Object.keys(rulerVisibility).filter(k => rulerVisibility[k])}
                    rulerOrder={rulerOrder}
                    onTimeClick={(time: number) => playbackActions.seek(time)}
                    onMarkerEdit={(marker: any, type: 'tempo' | 'timesig' | 'section' | 'chord') => openEditor(type, marker)}
                    onMarkerDelete={(id: string, type: 'tempo' | 'timesig' | 'section' | 'chord') => {}} // Implement delete if needed
                    onTempoMarkerAdd={activeTool === 'marker' ? handleTempoMarkerAdd : undefined}
                    editMode={activeTool === 'marker'}
                    keyShift={keyShift}
                    warpMode={warpMode}
                    onWarpCommit={handleWarpCommit}
                    onChordClick={(chordName: string) => {
                      const chordMarker = song?.chordMarkers?.find((m: ChordMarker) => m.chord === chordName);
                      if (chordMarker) handleChordClick(chordMarker);
                    }}
                  />
              </div>
            </div>

            {/* Tracks Area - Synced Vertically */}
            {/* P1 IMPROVEMENT: Mantendo estrutura master-slave mas com scroll sync otimizado */}
            <div className="flex-1 flex overflow-hidden relative">
              {/* Sidebar - Using TrackListSidebar component */}
              {sidebarVisible && mixerVisible && (
                <TrackListSidebar
                  ref={sidebarRef}
                  tracks={orderedTracks}
                  trackHeight={trackHeight}
                  editingTrackId={null}
                  trackNameInput=""
                  pinnedTracks={pinnedTracks}
                  onTrackVolumeChange={trackActions.handleTrackVolumeChange}
                  onTrackMuteToggle={trackActions.handleTrackMuteToggle}
                  onTrackSoloToggle={trackActions.handleTrackSoloToggle}
                  onTrackNameChange={trackActions.handleTrackNameChange}
                  onTrackColorChange={trackActions.handleTrackColorChange}
                  onTrackTagsChange={noOpTrackTags}
                  onTrackNotesOpen={setSelectedTrackForNotes}
                  onEditingTrackIdChange={noOpEditingTrackId}
                  onTrackNameInputChange={noOpTrackNameInput}
                  onPinnedTracksChange={setPinnedTracks}
                  onScroll={handleSidebarScroll}
                />
              )}

              {/* Timeline Container */}
              <TimelineContainer
                ref={timelineRef}
                song={song}
                currentTime={currentTime}
                zoom={zoom}
                pixelsPerSecond={getPixelsPerSecond()}
                filteredTracks={orderedTracks}
                loopStart={loopStart}
                loopEnd={loopEnd}
                trackHeightPx={getTrackHeightPx()}
                onTimelineMouseDown={handleTimelineClick}
                onTimelineMouseMove={noOpMouseMove}
                onTimelineMouseUp={handleTimelineMouseUp}
                onScroll={handleTimelineScroll}
              />

              {/* Vertical Scrollbar */}
              <div className="w-4 flex-shrink-0" style={{ backgroundColor: 'var(--daw-bg-contrast)' }}>
                <VerticalScrollbar
                  {...getVerticalScrollRange()}
                  onChange={handleVerticalScrollbarChange}
                  minHeight={0.05}
                />
              </div>
            </div>
          </div>

          {/* Panels: Mixer Dock and Notes */}
          <DAWPanels
            mixerDockVisible={mixerDockVisible}
            notesPanelVisible={notesPanelVisible}
            orderedTracks={orderedTracks}
            song={song}
            onTrackVolumeChange={trackActions.handleTrackVolumeChange}
            onTrackMuteToggle={trackActions.handleTrackMuteToggle}
            onTrackSoloToggle={trackActions.handleTrackSoloToggle}
            onCloseMixerDock={handleCloseMixerDock}
            onCloseNotesPanel={() => setNotesPanelVisible(false)}
            onAddNote={handleAddSongNote}
            onDeleteNote={handleDeleteSongNote}
          />

          {/* Bottom Bar */}
          <div className="border-t flex items-center h-8" style={{ backgroundColor: 'var(--daw-bg-bars)', borderColor: 'var(--daw-border)' }}>
            <div className={`border-r flex items-center flex-shrink-0`} style={{ width: sidebarVisible && mixerVisible ? '280px' : '0', minWidth: sidebarVisible && mixerVisible ? '280px' : '0', borderColor: 'var(--daw-border)' }}>
              <ZoomControls
                zoom={zoom}
                onZoomIn={handleZoomInOnPlayhead}
                onZoomOut={handleZoomOutOnPlayhead}
                onFitToView={handleFitToView}
              />
            </div>

            <TimelineNavigator
              songDuration={song.duration}
              zoom={zoom}
              containerWidth={containerWidth}
              timelineRef={timelineRef}
              onNavigate={handleNavigatorChange}
            />
          </div>

          {/* Bottom Toolbar */}
          <BottomToolbar
            sidebarVisible={sidebarVisible}
            mixerDockVisible={mixerDockVisible}
            notesPanelVisible={notesPanelVisible}
            mixPresetsPopoverOpen={mixPresetsPopoverOpen}
            tracks={orderedTracks}
            mixPresets={mixPresets}
            onToggleSidebar={() => setSidebarVisible(!sidebarVisible)}
            onToggleMixer={() => setMixerDockVisible(!mixerDockVisible)}
            onToggleNotes={() => setNotesPanelVisible(!notesPanelVisible)}
            onPerformanceMode={onPerformanceMode || (() => {})}
            onMixPresetsOpenChange={setMixPresetsPopoverOpen}
            onSaveMixPreset={handleSaveMixPreset}
            onLoadMixPreset={handleLoadMixPreset}
            onDeleteMixPreset={handleDeleteMixPreset}
          />

          {/* Dialogs */}
          <CreateProjectDialog
            open={createProjectOpen}
            onOpenChange={setCreateProjectOpen}
            onCreateProject={async () => {}}
          />

          <TimelineEditorDialog
            open={editorOpen}
            onOpenChange={setEditorOpen}
            type={editorType}
            currentTime={editorInitialTime ?? clickedTime}
            initialData={editingMarker}
            onSubmit={handleTimelineItemSubmit}
          />

          {selectedChord && (
            <ChordDiagram
              chord={selectedChord.chord}
              isOpen={!!selectedChord}
              onClose={() => setSelectedChord(null)}
              customDiagram={selectedChord.customDiagram}
            />
          )}

          {selectedTrackForNotes && (
            <TrackNotesDialog
              open={!!selectedTrackForNotes}
              onOpenChange={(open) => {
                if (!open) setSelectedTrackForNotes(null);
              }}
              trackName={selectedTrackForNotes.name}
              notes={selectedTrackForNotes.notes || ''}
              onSave={(notes) => handleSaveTrackNotes(notes, selectedTrackForNotes.id)}
            />
          )}

          <KeyboardShortcutsHelp
            isOpen={showShortcutsHelp}
            onClose={() => setShowShortcutsHelp(false)}
          />
        </div>
      </TooltipProvider>
    </ProjectProvider>
  );
}

// ============================================================================
// DAWPlayer - Componente wrapper principal
// ============================================================================

export function DAWPlayer({ song, onSongUpdate, onPerformanceMode, onBack, onCreateProject, onExportProject }: DAWPlayerProps) {
  if (!song) {
    return (
      <div className="flex flex-col h-full bg-gray-900 text-white">
        <div className="bg-gray-800 border-b border-gray-700 p-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-white hover:bg-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Library
          </Button>
          <h2>Player</h2>
          <div className="w-8" />
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div>
              <h3 className="mb-2">No Project Loaded</h3>
              <p className="text-sm text-gray-400 mb-4">
                Create a new project or load one from the library
              </p>
            </div>
          </div>
        </div>
        
        <CreateProjectDialog
          open={false}
          onOpenChange={() => {}}
          onCreateProject={onCreateProject || (async () => {})}
        />
      </div>
    );
  }

  return (
    <DAWPlayerContent
      song={song}
      onSongUpdate={onSongUpdate}
      onPerformanceMode={onPerformanceMode}
      onBack={onBack}
    />
  );
}