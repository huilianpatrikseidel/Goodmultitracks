import { useState, useCallback } from 'react';
import { AudioTrack, Song, MixPreset, TrackTag } from '../types';

export const useTrackManager = (initialSong: Song | null, onSongUpdate?: (song: Song) => void) => {
  const [tracks, setTracks] = useState<AudioTrack[]>(initialSong?.tracks || []);
  const [pinnedTracks, setPinnedTracks] = useState<Set<string>>(new Set());

  const updateSong = useCallback((updatedSongData: Partial<Song>) => {
    if (initialSong && onSongUpdate) {
      onSongUpdate({ ...initialSong, ...updatedSongData });
    }
  }, [initialSong, onSongUpdate]);

  const handleTrackVolumeChange = useCallback((trackId: string, volume: number) => {
    const safeVolume = isNaN(volume) || !isFinite(volume) ? 1.0 : Math.max(0, Math.min(10, volume));
    setTracks(prev => prev.map(t => (t.id === trackId ? { ...t, volume: safeVolume } : t)));
  }, []);

  const handleTrackMuteToggle = useCallback((trackId: string) => {
    setTracks(prev => prev.map(t => (t.id === trackId ? { ...t, muted: !t.muted } : t)));
  }, []);

  const handleTrackSoloToggle = useCallback((trackId: string) => {
    setTracks(prev => prev.map(t => (t.id === trackId ? { ...t, solo: !t.solo } : t)));
  }, []);

  const handleTrackNameChange = useCallback((trackId: string, newName: string) => {
    setTracks(prev => prev.map(t => (t.id === trackId ? { ...t, name: newName } : t)));
  }, []);

  const handleTrackColorChange = useCallback((trackId: string, color: string) => {
    setTracks(prev => prev.map(t => (t.id === trackId ? { ...t, color } : t)));
  }, []);

  const handleTrackTagChange = useCallback((trackId: string, tag: TrackTag) => {
    setTracks(prev => prev.map(t => (t.id === trackId ? { ...t, tag } : t)));
  }, []);

  const handleSaveTrackNotes = useCallback((trackId: string, notes: string) => {
    setTracks(prev => prev.map(t => (t.id === trackId ? { ...t, notes } : t)));
  }, []);

  const handleToggleTrackPin = useCallback((trackId: string) => {
    setPinnedTracks(prev => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }
      return next;
    });
  }, []);

  const handleSavePreset = useCallback((name: string) => {
    if (!initialSong) return;

    const newPreset: MixPreset = {
      id: `preset-${Date.now()}`,
      name,
      tracks: tracks
        .filter(t => !pinnedTracks.has(t.id))
        .map(t => ({ trackId: t.id, volume: t.volume, muted: t.muted })),
    };

    const updatedPresets = [...(initialSong.mixPresets || []), newPreset];
    updateSong({ mixPresets: updatedPresets });
  }, [initialSong, tracks, pinnedTracks, updateSong]);

  const handleLoadPreset = useCallback((presetId: string) => {
    if (!initialSong || !initialSong.mixPresets) return;

    const preset = initialSong.mixPresets.find(p => p.id === presetId);
    if (!preset) return;

    setTracks(prev => {
      const updatedTracks = prev.map(track => {
        if (pinnedTracks.has(track.id)) return track;

        const presetTrack = preset.tracks.find(pt => pt.trackId === track.id);
        return presetTrack ? { ...track, volume: presetTrack.volume, muted: presetTrack.muted } : track;
      });

      // Move main instrument to top
      const mainInstrument = localStorage.getItem('goodmultitracks_main_instrument') as TrackTag | null;
      if (mainInstrument) {
        const mainTrackIndex = updatedTracks.findIndex(t => t.tag === mainInstrument);
        if (mainTrackIndex > 0) {
          const [mainTrack] = updatedTracks.splice(mainTrackIndex, 1);
          updatedTracks.unshift(mainTrack);
        }
      }
      return updatedTracks;
    });
  }, [initialSong, pinnedTracks]);

  const handleDeletePreset = useCallback((presetId: string) => {
    if (!initialSong) return;
    const updatedPresets = (initialSong.mixPresets || []).filter(p => p.id !== presetId);
    updateSong({ mixPresets: updatedPresets });
  }, [initialSong, updateSong]);

  return {
    tracks,
    setTracks,
    pinnedTracks,
    isAnySolo: tracks.some(t => t.solo),
    handlers: {
      handleTrackVolumeChange,
      handleTrackMuteToggle,
      handleTrackSoloToggle,
      handleTrackNameChange,
      handleTrackColorChange,
      handleTrackTagChange,
      handleSaveTrackNotes,
      handleToggleTrackPin,
    },
    presetHandlers: {
      handleSavePreset,
      handleLoadPreset,
      handleDeletePreset,
    },
  };
};