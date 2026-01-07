// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
import { useState, useCallback, useEffect, useRef } from 'react';
import { AudioTrack, Song, MixPreset, TrackTag } from '../../../types';
import { storage } from '../../../lib/localStorageManager';

/**
 * Debounce utility function
 * CRITICAL (P0): Previne race conditions em volume slider
 */
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export const useTrackManager = (initialSong: Song | null, onSongUpdate?: (song: Song) => void) => {
  const [tracks, setTracks] = useState<AudioTrack[]>(initialSong?.tracks || []);
  const [pinnedTracks, setPinnedTracks] = useState<Set<string>>(new Set());
  
  // CRITICAL FIX (P0): Simplificado conforme recomendação QA
  // Ref para rastrear ID da música carregada
  const initializedRef = useRef<string | null>(null);
  
  // CRITICAL FIX (P0): Debounced update para prevenir render loop
  const debouncedUpdateSongRef = useRef<((updatedSongData: Partial<Song>) => void) | null>(null);

  // CRITICAL FIX (P0): Sincronização simplificada - sem bidirectional loop
  // Recomendação QA: "Desacoplar UI do Slider da lógica de negócio"
  // Apenas reinicializa se ID da música mudar (nova música carregada)
  useEffect(() => {
    const songId = initialSong?.id || null;
    
    // APENAS reseta tracks se for música COMPLETAMENTE DIFERENTE
    if (songId !== initializedRef.current) {
      if (initialSong?.tracks) {
        setTracks(initialSong.tracks);
        initializedRef.current = songId;
      }
    }
    // NOTA CRÍTICA: NÃO observa initialSong.tracks como dependência
    // O estado local É a fonte da verdade durante interação do usuário
    // Props só importam no carregamento inicial (song ID diferente)
  }, [initialSong?.id]);

  // Função para atualizar Song no parent (upstream: filho -> pai)
  const updateSong = useCallback((updatedSongData: Partial<Song>) => {
    if (initialSong && onSongUpdate) {
      onSongUpdate({ ...initialSong, ...updatedSongData });
    }
  }, [initialSong, onSongUpdate]);

  // CRITICAL FIX (P0): Inicializar debounced update
  useEffect(() => {
    debouncedUpdateSongRef.current = debounce((updatedSongData: Partial<Song>) => {
      if (initialSong && onSongUpdate) {
        onSongUpdate({ ...initialSong, ...updatedSongData });
      }
    }, 100); // 100ms debounce
  }, [initialSong, onSongUpdate]);

  // --- Handlers de Ação (Modificam estado local e disparam sync) ---

  const handleTrackVolumeChange = useCallback((trackId: string, volume: number) => {
    // Sanitização do input
    const safeVolume = isNaN(volume) || !isFinite(volume) ? 1.0 : Math.max(0, Math.min(10, volume));
    
    // 1. Atualização imediata do estado local para UI responsiva
    setTracks(prev => prev.map(t => (t.id === trackId ? { ...t, volume: safeVolume } : t)));
    
    // 2. Atualização debounced do parent (previne render loop)
    if (debouncedUpdateSongRef.current) {
      const updatedTracks = tracks.map(t => (t.id === trackId ? { ...t, volume: safeVolume } : t));
      debouncedUpdateSongRef.current({ tracks: updatedTracks });
    }
  }, [tracks]);

  const handleTrackMuteToggle = useCallback((trackId: string) => {
    setTracks(prev => {
      const next = prev.map(t => (t.id === trackId ? { ...t, muted: !t.muted } : t));
      updateSong({ tracks: next });
      return next;
    });
  }, [updateSong]);

  const handleTrackSoloToggle = useCallback((trackId: string) => {
    setTracks(prev => {
      const next = prev.map(t => (t.id === trackId ? { ...t, solo: !t.solo } : t));
      updateSong({ tracks: next });
      return next;
    });
  }, [updateSong]);

  const handleTrackNameChange = useCallback((trackId: string, newName: string) => {
    setTracks(prev => {
      const next = prev.map(t => (t.id === trackId ? { ...t, name: newName } : t));
      updateSong({ tracks: next });
      return next;
    });
  }, [updateSong]);

  const handleTrackColorChange = useCallback((trackId: string, color: string) => {
    setTracks(prev => {
      const next = prev.map(t => (t.id === trackId ? { ...t, color } : t));
      updateSong({ tracks: next });
      return next;
    });
  }, [updateSong]);

  const handleTrackTagChange = useCallback((trackId: string, tag: TrackTag) => {
    setTracks(prev => {
      const next = prev.map(t => (t.id === trackId ? { ...t, tag } : t));
      updateSong({ tracks: next });
      return next;
    });
  }, [updateSong]);

  const handleSaveTrackNotes = useCallback((trackId: string, notes: string) => {
    setTracks(prev => {
      const next = prev.map(t => (t.id === trackId ? { ...t, notes } : t));
      updateSong({ tracks: next });
      return next;
    });
  }, [updateSong]);

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

  // --- Gerenciamento de Presets ---

  const handleSavePreset = useCallback((name: string) => {
    if (!initialSong) return;

    const newPreset: MixPreset = {
      id: `preset-${Date.now()}`,
      name,
      tracks: tracks
        .filter(t => !pinnedTracks.has(t.id))
        .map(t => ({ trackId: t.id, volume: t.volume, muted: t.muted })),
    };

    if (onSongUpdate) {
        const updatedPresets = [...(initialSong.mixPresets || []), newPreset];
        onSongUpdate({ ...initialSong, mixPresets: updatedPresets });
    }
  }, [initialSong, tracks, pinnedTracks, onSongUpdate]);

  const handleLoadPreset = useCallback((presetId: string) => {
    if (!initialSong || !initialSong.mixPresets) return;

    const preset = initialSong.mixPresets.find(p => p.id === presetId);
    if (!preset) return;

    // Calcula o novo estado das tracks
    const newTracksState = tracks.map(track => {
        if (pinnedTracks.has(track.id)) return track;
        const presetTrack = preset.tracks.find(pt => pt.trackId === track.id);
        return presetTrack ? { ...track, volume: presetTrack.volume, muted: presetTrack.muted } : track;
    });

    // Lógica de instrumento principal
    const mainInstrument = storage.getMainInstrument() as TrackTag | null;
    if (mainInstrument) {
        const mainTrackIndex = newTracksState.findIndex(t => t.tag === mainInstrument);
        if (mainTrackIndex > 0) {
            const [mainTrack] = newTracksState.splice(mainTrackIndex, 1);
            newTracksState.unshift(mainTrack);
        }
    }

    // Atualiza local e remoto
    setTracks(newTracksState);
    updateSong({ tracks: newTracksState });

  }, [initialSong, pinnedTracks, tracks, updateSong]);

  const handleDeletePreset = useCallback((presetId: string) => {
    if (!initialSong || !onSongUpdate) return;
    const updatedPresets = (initialSong.mixPresets || []).filter(p => p.id !== presetId);
    onSongUpdate({ ...initialSong, mixPresets: updatedPresets });
  }, [initialSong, onSongUpdate]);

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
