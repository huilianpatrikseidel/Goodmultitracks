// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
import React from 'react';
import { X } from '../../../../components/icons/Icon';
import { RulerSidebarHeaders } from '../player/RulerSidebarHeaders';
import { RulersContainer } from '../player/RulersContainer';
import { TrackListSidebar, VerticalScrollbar, NotesPanel } from '../../../../components/player';
import { TimelineContainer } from '../player/TimelineContainer';
import { MixerDock } from '../mixer/MixerDock';
import { Song, AudioTrack, ChordMarker } from '../../../../types';

interface DAWWorkspaceProps {
  // Data
  song: Song;
  orderedTracks: AudioTrack[];
  currentTime: number;
  gridTime: number;
  tempo: number;
  zoom: number;
  loopStart: number | null;
  loopEnd: number | null;
  isPlaying: boolean;
  keyShift: number;
  
  // Layout state
  sidebarVisible: boolean;
  mixerVisible: boolean;
  mixerDockVisible: boolean;
  notesPanelVisible: boolean;
  trackHeight: 'small' | 'medium' | 'large';
  trackHeightPx: number;
  pinnedTracks: Set<string>;
  rulerVisibility: Record<string, boolean>;
  rulerOrder: string[];
  
  // Edit mode
  activeTool: 'marker' | 'warp' | null;
  warpMode: boolean;
  snapEnabled: boolean; // QA FIX: Added for global snap state
  
  // Dimensions
  containerWidth: number;
  pixelsPerSecond: number;
  
  // Refs
  rulerRef: React.RefObject<HTMLDivElement>;
  sidebarRef: React.RefObject<any>;
  timelineRef: React.RefObject<HTMLDivElement>;
  
  // Actions
  onRulerOrderChange: (order: string[]) => void;
  onTimeClick: (time: number) => void;
  onMarkerEdit: (marker: any, type: 'tempo' | 'timesig' | 'section' | 'chord') => void;
  onTempoMarkerAdd?: (time: number) => void;
  onChordAdd?: (time: number) => void;
  onWarpCommit: (warpedTime: number, originalTime: number) => void;
  onChordClick: (chordMarker: ChordMarker) => void;
  onTrackVolumeChange: (trackId: string, volume: number) => void;
  onTrackMuteToggle: (trackId: string) => void;
  onTrackSoloToggle: (trackId: string) => void;
  onTrackNameChange: (trackId: string, name: string) => void;
  onTrackColorChange: (trackId: string, color: string) => void;
  onTrackTagsChange: (trackId: string, tags: string[]) => void;
  onTrackNotesOpen: (track: AudioTrack | null) => void;
  onEditingTrackIdChange: (id: string | null) => void;
  onTrackNameInputChange: (value: string) => void;
  onPinnedTracksChange: (tracks: Set<string>) => void;
  onSidebarScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  onTimelineClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onTimelineMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onTimelineMouseUp: () => void;
  onTimelineScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  onVerticalScrollbarChange: (position: number) => void;
  getVerticalScrollRange: () => { position: number; viewportSize: number };
  onCloseMixerDock: () => void;
  onAddSongNote: (text: string) => void;
  onDeleteSongNote: (noteId: string) => void;
  setNotesPanelVisible: (visible: boolean) => void;
}

export function DAWWorkspace(props: DAWWorkspaceProps) {
  const {
    song,
    orderedTracks,
    currentTime,
    gridTime,
    tempo,
    zoom,
    loopStart,
    loopEnd,
    isPlaying,
    keyShift,
    sidebarVisible,
    mixerVisible,
    mixerDockVisible,
    notesPanelVisible,
    trackHeight,
    trackHeightPx,
    pinnedTracks,
    rulerVisibility,
    rulerOrder,
    activeTool,
    warpMode,
    containerWidth,
    pixelsPerSecond,
    rulerRef,
    sidebarRef,
    timelineRef,
    onRulerOrderChange,
    onTimeClick,
    onMarkerEdit,
    onTempoMarkerAdd,
    onChordAdd,
    onWarpCommit,
    onChordClick,
    onTrackVolumeChange,
    onTrackMuteToggle,
    onTrackSoloToggle,
    onTrackNameChange,
    onTrackColorChange,
    onTrackTagsChange,
    onTrackNotesOpen,
    onEditingTrackIdChange,
    onTrackNameInputChange,
    onPinnedTracksChange,
    onSidebarScroll,
    onTimelineClick,
    onTimelineMouseMove,
    onTimelineMouseUp,
    onTimelineScroll,
    onVerticalScrollbarChange,
    getVerticalScrollRange,
    onCloseMixerDock,
    onAddSongNote,
    onDeleteSongNote,
    setNotesPanelVisible,
  } = props;

  const visibleRulers = Object.keys(rulerVisibility).filter(k => rulerVisibility[k]);

  return (
    <>
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Rulers Row - Fixed Vertically */}
        <div className="flex flex-none h-auto border-b z-30" style={{ backgroundColor: 'var(--daw-bg-contrast)', borderColor: 'var(--daw-border)' }}>
          {/* Ruler Labels Sidebar */}
          {sidebarVisible && mixerVisible && (
            <div className="flex-none border-r" style={{ width: '280px', minWidth: '280px', maxWidth: '280px', backgroundColor: 'var(--daw-bg-contrast)', borderColor: 'var(--daw-border)' }}>
              <RulerSidebarHeaders
                visibleRulers={visibleRulers}
                rulerOrder={rulerOrder}
                onRulerOrderChange={onRulerOrderChange}
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
                pixelsPerSecond={pixelsPerSecond}
                containerWidth={containerWidth}
                visibleRulers={visibleRulers}
                rulerOrder={rulerOrder}
                snapEnabled={props.snapEnabled}
                onTimeClick={onTimeClick}
                onMarkerEdit={onMarkerEdit}
                onMarkerDelete={(id: string, type: 'tempo' | 'timesig' | 'section' | 'chord') => {}} // Implement delete if needed
                onTempoMarkerAdd={activeTool === 'marker' ? onTempoMarkerAdd : undefined}
                onChordAdd={activeTool === 'marker' ? onChordAdd : undefined}
                editMode={activeTool === 'marker'}
                keyShift={keyShift}
                warpMode={warpMode}
                onWarpCommit={onWarpCommit}
                onChordClick={(chordName: string) => {
                  const chordMarker = song?.chordMarkers?.find((m: ChordMarker) => m.chord === chordName);
                  if (chordMarker) onChordClick(chordMarker);
                }}
              />
          </div>
        </div>

        {/* Tracks Area - Synced Vertically */}
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
              onTrackVolumeChange={onTrackVolumeChange}
              onTrackMuteToggle={onTrackMuteToggle}
              onTrackSoloToggle={onTrackSoloToggle}
              onTrackNameChange={onTrackNameChange}
              onTrackColorChange={onTrackColorChange}
              onTrackTagsChange={onTrackTagsChange}
              onTrackNotesOpen={onTrackNotesOpen}
              onEditingTrackIdChange={onEditingTrackIdChange}
              onTrackNameInputChange={onTrackNameInputChange}
              onPinnedTracksChange={onPinnedTracksChange}
              onScroll={(scrollTop) => onSidebarScroll({ currentTarget: { scrollTop } } as React.UIEvent<HTMLDivElement>)}
            />
          )}

          {/* Timeline Container */}
          <TimelineContainer
            ref={timelineRef}
            song={song}
            currentTime={currentTime}
            zoom={zoom}
            pixelsPerSecond={pixelsPerSecond}
            filteredTracks={orderedTracks}
            loopStart={loopStart}
            loopEnd={loopEnd}
            trackHeightPx={trackHeightPx}
            onTimelineMouseDown={(e) => onTimelineClick(e as React.MouseEvent<HTMLDivElement>)}
            onTimelineMouseMove={(e) => onTimelineMouseMove(e as React.MouseEvent<HTMLDivElement>)}
            onTimelineMouseUp={onTimelineMouseUp}
            onScroll={(scrollLeft) => onTimelineScroll({ currentTarget: { scrollLeft } } as React.UIEvent<HTMLDivElement>)}
          />

          {/* Vertical Scrollbar */}
          <div className="w-4 flex-shrink-0" style={{ backgroundColor: 'var(--daw-bg-contrast)' }}>
            <VerticalScrollbar
              start={getVerticalScrollRange().position}
              end={getVerticalScrollRange().position + getVerticalScrollRange().viewportSize}
              onChange={(range) => onVerticalScrollbarChange(range.start)}
              minHeight={0.05}
            />
          </div>
        </div>
      </div>

      {/* Mixer Dock */}
      {mixerDockVisible && (
        <MixerDock
          tracks={orderedTracks}
          onTrackVolumeChange={onTrackVolumeChange}
          onTrackMuteToggle={onTrackMuteToggle}
          onTrackSoloToggle={onTrackSoloToggle}
          onClose={onCloseMixerDock}
        />
      )}

      {/* Notes Panel */}
      {notesPanelVisible && song && (
        <div className="w-full flex flex-col border-t" style={{ backgroundColor: 'var(--daw-bg-contrast)', borderColor: 'var(--daw-border)', height: '240px' }}>
          <div className="h-10 border-b flex items-center justify-between px-3" style={{ backgroundColor: 'var(--daw-bg-bars)', borderColor: 'var(--daw-border)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--daw-text-primary)' }}>Song Notes</h3>
            <button onClick={() => setNotesPanelVisible(false)} className="p-1 hover:bg-gray-700 rounded">
              <X className="w-4 h-4" style={{ color: 'var(--daw-text-primary)' }} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3" style={{ backgroundColor: 'var(--daw-bg-contrast)' }}>
            <NotesPanel
              notes={song.notes || []}
              currentUser={{ id: 'current-user', name: 'You' }}
              onAddNote={onAddSongNote}
              onDeleteNote={onDeleteSongNote}
            />
          </div>
        </div>
      )}
    </>
  );
}

