// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
import { useState, useCallback } from 'react';
import { Song, TempoChange, SectionMarker, ChordMarker } from '../../../../../types';

interface UseTimelineEditingProps {
  song: Song;
  onSongUpdate?: (song: Song) => void;
  editMode: boolean;
}

export const useTimelineEditing = ({ song, onSongUpdate, editMode }: UseTimelineEditingProps) => {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorType, setEditorType] = useState<'tempo' | 'timesig' | 'section' | 'chord'>('section');
  const [editingMarker, setEditingMarker] = useState<TempoChange | SectionMarker | ChordMarker | null>(null);
  const [clickedTime, setClickedTime] = useState<number>(0);

  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!editMode) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    // Convert to time based on zoom and scroll
    // This is a simplified version - actual implementation would need zoom/scroll context
    const time = clickX / 50; // BASE_PPS = 50
    setClickedTime(time);
  }, [editMode]);

  const handleTimelineItemSubmit = useCallback((action: 'add' | 'update' | 'delete', data: any) => {
    if (!onSongUpdate) return;

    let updatedSong = { ...song };

    // Determine type from data or editorType
    const type = editorType;

    switch (type) {
      case 'section':
        if (action === 'delete' && editingMarker) {
          updatedSong.markers = song.markers?.filter((s) => s.time !== editingMarker.time) || [];
        } else if (action === 'update' && editingMarker) {
          updatedSong.markers = song.markers?.map((s) =>
            s.time === editingMarker.time ? { ...s, ...data } : s
          ) || [];
        } else {
          // Add new
          updatedSong.markers = [...(song.markers || []), data];
        }
        break;

      case 'chord':
        if (action === 'delete' && editingMarker) {
          updatedSong.chordMarkers = song.chordMarkers?.filter((c) => c.time !== editingMarker.time) || [];
        } else if (action === 'update' && editingMarker) {
          updatedSong.chordMarkers = song.chordMarkers?.map((c) =>
            c.time === editingMarker.time ? { ...c, ...data } : c
          ) || [];
        } else {
          updatedSong.chordMarkers = [...(song.chordMarkers || []), data];
        }
        break;

      case 'tempo':
        if (action === 'delete' && editingMarker) {
          updatedSong.tempoChanges = song.tempoChanges?.filter((t) => t.time !== editingMarker.time) || [];
        } else if (action === 'update' && editingMarker) {
          updatedSong.tempoChanges = song.tempoChanges?.map((t) =>
            t.time === editingMarker.time ? { ...t, ...data } : t
          ) || [];
        } else {
          updatedSong.tempoChanges = [...(song.tempoChanges || []), data];
        }
        break;
    }

    onSongUpdate(updatedSong);
    setEditorOpen(false);
    setEditingMarker(null);
  }, [song, onSongUpdate, editingMarker, editorType]);

  const openEditor = useCallback((
    type: 'tempo' | 'timesig' | 'section' | 'chord',
    marker?: TempoChange | SectionMarker | ChordMarker,
    time?: number
  ) => {
    setEditorType(type);
    setEditingMarker(marker || null);
    if (time !== undefined) setClickedTime(time);
    setEditorOpen(true);
  }, []);

  return {
    editorOpen,
    setEditorOpen,
    editorType,
    editingMarker,
    clickedTime,
    handleTimelineClick,
    handleTimelineItemSubmit,
    openEditor,
  };
};

