// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Music2, Trash2, ChevronDown, ChevronUp, Pin } from '../icons/Icon';
import { AudioTrack, TrackTag } from '../../types';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { gainToDb, gainToSlider, sliderToGain, formatDb, parseDbInput, sliderToDb } from '../../features/player/utils/audioUtils';
import { LAYOUT } from '../../config/constants';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';

interface TrackListSidebarProps {
  tracks: AudioTrack[];
  trackHeight: 'small' | 'medium' | 'large';
  editingTrackId: string | null;
  trackNameInput: string;
  pinnedTracks: Set<string>;
  onTrackNameChange: (trackId: string, name: string) => void;
  onTrackColorChange: (trackId: string, color: string) => void;
  onTrackVolumeChange: (trackId: string, volume: number) => void;
  onTrackMuteToggle: (trackId: string) => void;
  onTrackSoloToggle: (trackId: string) => void;
  onTrackTagsChange: (trackId: string, tags: TrackTag[]) => void;
  onTrackNotesOpen: (track: AudioTrack) => void;
  onEditingTrackIdChange: (trackId: string | null) => void;
  onTrackNameInputChange: (name: string) => void;
  onPinnedTracksChange: (pinnedTracks: Set<string>) => void;
  onScroll: (scrollTop: number) => void;
}

const TAG_LABELS: Record<string, string> = {
  drums: 'Drums',
  percussion: 'Percussion',
  cajon: 'Cajón',
  bass: 'Bass',
  'acoustic-guitar': 'Acoustic Guitar',
  'electric-guitar': 'Electric Guitar',
  keys: 'Keys',
  'keyboard-piano': 'Piano',
  'vocals-general': 'Vocals',
  'lead-vocal': 'Lead Vocal',
  'backing-vocals': 'Backing Vocals',
  'other-elements': 'Other',
};

/**
 * TrackListItem - Individual track item in the sidebar
 * Memoized to prevent re-renders when other tracks change
 * CRITICAL: Recebe propriedades PRIMITIVAS para evitar problema de referência
 */
interface TrackListItemProps {
  trackId: string;
  trackName: string;
  trackColor: string;
  trackVolume: number;
  trackMuted: boolean;
  trackSolo: boolean;
  trackHeightPx: number;
  isAnySolo: boolean;
  onVolumeChange: (trackId: string, volume: number) => void;
  onMuteToggle: (trackId: string) => void;
  onSoloToggle: (trackId: string) => void;
}

const TrackListItem = React.memo<TrackListItemProps>(({
  trackId,
  trackName,
  trackColor,
  trackVolume,
  trackMuted,
  trackSolo,
  trackHeightPx,
  isAnySolo,
  onVolumeChange,
  onMuteToggle,
  onSoloToggle,
}) => {
  const isDimmed = isAnySolo && !trackSolo;
  
  // CRITICAL FIX (P0): Estado transiente para evitar jitter/flicker
  // Durante arraste: apenas localValue atualiza (UI responsiva)
  // Ao soltar: onVolumeChange é chamado (persiste no estado global)
  const [localValue, setLocalValue] = React.useState(gainToSlider(trackVolume));
  const [isDragging, setIsDragging] = React.useState(false);

  // Sincroniza localValue com prop APENAS quando não está arrastando
  React.useEffect(() => {
    if (!isDragging) {
      setLocalValue(gainToSlider(trackVolume));
    }
  }, [trackVolume, isDragging]);

  const handleValueChange = (vals: number[]) => {
    setLocalValue(vals[0]);
  };

  const handlePointerDown = () => {
    setIsDragging(true);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    // Confirma valor final apenas ao soltar (evita flood de updates)
    onVolumeChange(trackId, sliderToGain(localValue));
  };

  return (
    <div
      className={`border-b relative group box-border`}
      style={{ 
        height: `${trackHeightPx}px`, 
        minHeight: `${trackHeightPx}px`,
        maxHeight: `${trackHeightPx}px`,
        backgroundColor: 'var(--daw-bg-contrast)', 
        borderColor: 'var(--daw-border)',
        borderBottomWidth: '1px',
      }}
    >
      {/* Track Color Strip */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: trackColor || '#3b82f6' }}
      />

      <div className="p-2 pl-6 h-full flex flex-col justify-center gap-2">
        {/* Top Row: Name and Icons */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-sm truncate text-gray-200" title={trackName}>
              {trackName}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {/* P2 FIX: Acessibilidade - aria-label e estados para leitores de tela */}
            <Button
              variant="ghost"
              size="icon"
              className={`h-6 w-8 rounded-sm border-2 focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${trackMuted ? 'bg-red-600 text-white border-red-500 focus:ring-red-500' : 'bg-gray-800 text-gray-400 border-gray-600 hover:border-gray-500 focus:ring-gray-500'}`}
              onClick={() => onMuteToggle(trackId)}
              aria-label={trackMuted ? `Unmute ${trackName}` : `Mute ${trackName}`}
              aria-pressed={trackMuted}
              title={trackMuted ? "Unmute track" : "Mute track"}
            >
              <span className="text-[10px] font-bold">M</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-6 w-8 rounded-sm border-2 focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${trackSolo ? 'bg-yellow-500 text-black border-yellow-400 focus:ring-yellow-500' : 'bg-gray-800 text-gray-400 border-gray-600 hover:border-gray-500 focus:ring-gray-500'}`}
              onClick={() => onSoloToggle(trackId)}
              aria-label={trackSolo ? `Unsolo ${trackName}` : `Solo ${trackName}`}
              aria-pressed={trackSolo}
              title={trackSolo ? "Unsolo track" : "Solo track"}
            >
              <span className="text-[10px] font-bold">S</span>
            </Button>
          </div>
        </div>

        {/* Middle Row: Volume Slider - CORRIGIDO com estado transiente */}
        {/* P2 FIX: Acessibilidade com aria-label e aria-valuenow */}
        <div className="flex items-center gap-2">
          <Slider
            value={[localValue]}
            min={0}
            max={100}
            step={1}
            onValueChange={handleValueChange}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            className="flex-1"
            aria-label={`Volume for ${trackName}`}
            aria-valuenow={localValue}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={`${formatDb(sliderToDb(localValue))} decibels`}
          />
          <span className="text-[10px] tabular-nums text-gray-400 w-8 text-right font-mono" aria-hidden="true">
            {formatDb(sliderToDb(localValue))}
          </span>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // CRITICAL: Comparação de propriedades PRIMITIVAS - evita problema de referência
  return (
    prevProps.trackId === nextProps.trackId &&
    prevProps.trackName === nextProps.trackName &&
    prevProps.trackColor === nextProps.trackColor &&
    prevProps.trackVolume === nextProps.trackVolume &&
    prevProps.trackMuted === nextProps.trackMuted &&
    prevProps.trackSolo === nextProps.trackSolo &&
    prevProps.trackHeightPx === nextProps.trackHeightPx &&
    prevProps.isAnySolo === nextProps.isAnySolo
  );
});

TrackListItem.displayName = 'TrackListItem';

export const TrackListSidebar = React.memo(React.forwardRef<HTMLDivElement, TrackListSidebarProps>(({
  tracks,
  trackHeight,
  editingTrackId,
  trackNameInput,
  pinnedTracks,
  onTrackNameChange,
  onTrackColorChange,
  onTrackVolumeChange,
  onTrackMuteToggle,
  onTrackSoloToggle,
  onTrackTagsChange,
  onTrackNotesOpen,
  onEditingTrackIdChange,
  onTrackNameInputChange,
  onPinnedTracksChange,
  onScroll,
}, ref) => {
  const getTrackHeightPx = () => {
    switch (trackHeight) {
      case 'small': return 64;
      case 'large': return 128;
      default: return 96;
    }
  };

  // Callback simplificado - aplica mudança diretamente como metrônomo
  const handleVolumeChange = useCallback((trackId: string, volume: number) => {
    onTrackVolumeChange(trackId, volume);
  }, [onTrackVolumeChange]);

  const handleDbInputChange = (trackId: string, value: string, track: AudioTrack) => {
    const gain = parseDbInput(value);
    if (gain !== null) {
      onTrackVolumeChange(trackId, gain);
    }
  };

  const isAnySolo = tracks.some(t => t.solo);
  const trackHeightPx = getTrackHeightPx();

  const handlePinToggle = (trackId: string) => {
    const newPinned = new Set(pinnedTracks);
    if (newPinned.has(trackId)) {
      newPinned.delete(trackId);
    } else {
      newPinned.add(trackId);
    }
    onPinnedTracksChange(newPinned);
  };

  // CRITICAL FIX: Removed duplicate ordering logic - now handled centrally in DAWPlayer.tsx
  // The 'tracks' prop already comes pre-ordered with pinned tracks first

  // CRITICAL QA FIX: Implement REAL virtualization using useVirtualizer
  const scrollElementRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: tracks.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => trackHeightPx,
    overscan: 3, // Render 3 extra items above/below viewport for smooth scrolling
  });

  // Emit scroll events to parent
  const handleLocalScroll = (e: React.UIEvent<HTMLDivElement>) => {
    onScroll(e.currentTarget.scrollTop);
  };

  return (
    <div 
      ref={(node) => {
        scrollElementRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      className="track-list-sidebar-container flex-shrink-0 border-r flex flex-col overflow-y-auto"
      style={{ 
        width: `${LAYOUT.SIDEBAR_WIDTH}px`, 
        minWidth: `${LAYOUT.SIDEBAR_WIDTH}px`, 
        maxWidth: `${LAYOUT.SIDEBAR_WIDTH}px`, 
        backgroundColor: 'var(--daw-bg-contrast)', 
        borderColor: 'var(--daw-border)',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        paddingTop: 0,
        paddingBottom: 0,
      }}
      onScroll={handleLocalScroll}
    >
      {/* CRITICAL QA FIX: Virtualized Track List */}
      <div 
        className="flex-1 relative" 
        style={{ 
          height: `${virtualizer.getTotalSize()}px`,
          margin: 0, 
          padding: 0,
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const track = tracks[virtualItem.index];
          return (
            <div
              key={track.id}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <TrackListItem
                trackId={track.id}
                trackName={track.name}
                trackColor={track.color || '#3b82f6'}
                trackVolume={track.volume}
                trackMuted={track.muted}
                trackSolo={track.solo}
                trackHeightPx={trackHeightPx}
                isAnySolo={isAnySolo}
                onVolumeChange={handleVolumeChange}
                onMuteToggle={onTrackMuteToggle}
                onSoloToggle={onTrackSoloToggle}
              />
            </div>
          );
        })}
      </div>
      <style>{`
        .track-list-sidebar-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}));

TrackListSidebar.displayName = 'TrackListSidebar';
