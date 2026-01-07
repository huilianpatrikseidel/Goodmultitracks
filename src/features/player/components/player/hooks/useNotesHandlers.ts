// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
import { useCallback } from 'react';
import { Song } from '../../../../../types';

interface UseNotesHandlersProps {
  song: Song;
  onSongUpdate?: (song: Song) => void;
}

export const useNotesHandlers = ({ song, onSongUpdate }: UseNotesHandlersProps) => {
  const handleAddSongNote = useCallback((content: string, isPrivate: boolean, time?: number) => {
    if (!song || !onSongUpdate) return;
    const newNote = {
      id: crypto.randomUUID(),
      userId: 'current-user',
      content,
      time,
      isPrivate,
    };
    onSongUpdate({
      ...song,
      notes: [...(song.notes || []), newNote],
    });
  }, [song, onSongUpdate]);

  const handleDeleteSongNote = useCallback((noteId: string) => {
    if (!song || !onSongUpdate) return;
    onSongUpdate({
      ...song,
      notes: (song.notes || []).filter(n => n.id !== noteId),
    });
  }, [song, onSongUpdate]);

  const handleSaveTrackNotes = useCallback((notes: string, trackId: string) => {
    if (!song || !onSongUpdate) return;
    const newTracks = song.tracks.map(t =>
      t.id === trackId ? { ...t, notes } : t
    );
    onSongUpdate({ ...song, tracks: newTracks });
  }, [song, onSongUpdate]);

  return {
    handleAddSongNote,
    handleDeleteSongNote,
    handleSaveTrackNotes,
  };
};

