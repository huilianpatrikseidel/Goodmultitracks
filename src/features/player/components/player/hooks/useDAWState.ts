// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
import { useState, useEffect, useRef, useCallback } from 'react';
import { Song, AudioTrack } from '../../../../../types';
import type { MetronomeMode } from '../../../../../hooks/useMetronome';

interface UseDAWStateProps {
  song: Song;
}

export const useDAWState = ({ song }: UseDAWStateProps) => {
  const [keyShift, setKeyShift] = useState(0);
  const [editMode, setEditMode] = useState(song?.source === 'project');
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [containerWidth, setContainerWidth] = useState(1000);
  
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [mixerVisible, setMixerVisible] = useState(true);
  const [mixerDockVisible, setMixerDockVisible] = useState(false);
  const [mixPresetsPopoverOpen, setMixPresetsPopoverOpen] = useState(false);
  
  const [selectedChord, setSelectedChord] = useState<{ chord: string; customDiagram?: any } | null>(null);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [dynamicTempos, setDynamicTempos] = useState<any[]>([]);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartTime, setDragStartTime] = useState<number | null>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const [pinnedTracks, setPinnedTracks] = useState<Set<string>>(new Set());
  const [selectedTrackForNotes, setSelectedTrackForNotes] = useState<AudioTrack | null>(null);
  const [notesPanelVisible, setNotesPanelVisible] = useState(false);
  const [warpMode, setWarpMode] = useState(false);
  const [metronomeMode, setMetronomeMode] = useState<MetronomeMode>('macro');

  const rulerRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const hoveredContainerRef = useRef<'sidebar' | 'timeline' | null>(null);

  useEffect(() => {
    if (song) {
      setDynamicTempos(song.tempoChanges || [{ time: 0, tempo: song.tempo, timeSignature: '4/4' }]);
    }
  }, [song?.tempoChanges, song?.tempo]);

  return {
    keyShift,
    setKeyShift,
    editMode,
    setEditMode,
    createProjectOpen,
    setCreateProjectOpen,
    containerWidth,
    setContainerWidth,
    snapEnabled,
    setSnapEnabled,
    sidebarVisible,
    setSidebarVisible,
    mixerVisible,
    setMixerVisible,
    mixerDockVisible,
    setMixerDockVisible,
    mixPresetsPopoverOpen,
    setMixPresetsPopoverOpen,
    selectedChord,
    setSelectedChord,
    showShortcutsHelp,
    setShowShortcutsHelp,
    dynamicTempos,
    setDynamicTempos,
    isDragging,
    setIsDragging,
    dragStartTime,
    setDragStartTime,
    scrollTop,
    setScrollTop,
    pinnedTracks,
    setPinnedTracks,
    selectedTrackForNotes,
    setSelectedTrackForNotes,
    notesPanelVisible,
    setNotesPanelVisible,
    warpMode,
    setWarpMode,
    metronomeMode,
    setMetronomeMode,
    rulerRef,
    sidebarRef,
    timelineRef,
    hoveredContainerRef,
  };
};

