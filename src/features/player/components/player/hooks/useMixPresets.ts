import { useState, useCallback } from 'react';
import { Song, MixPreset, AudioTrack } from '../../../../../types';

interface UseMixPresetsProps {
  song: Song;
  onSongUpdate?: (song: Song) => void;
}

export const useMixPresets = ({ song, onSongUpdate }: UseMixPresetsProps) => {
  const [mixPresets, setMixPresets] = useState<MixPreset[]>([]);

  const handleSaveMixPreset = useCallback((name: string) => {
    const preset: MixPreset = {
      id: `preset-${Date.now()}`,
      name,
      tracks: song.tracks.map((track) => ({
        trackId: track.id,
        volume: track.volume ?? 1,
        muted: track.muted ?? false,
      })),
    };

    setMixPresets((prev) => [...prev, preset]);
  }, [song.tracks]);

  const handleLoadMixPreset = useCallback((preset: MixPreset) => {
    if (!onSongUpdate) return;

    const updatedTracks = song.tracks.map((track) => {
      const setting = preset.tracks.find((s) => s.trackId === track.id);
      if (!setting) return track;

      return {
        ...track,
        volume: setting.volume,
        muted: setting.muted,
      };
    });

    onSongUpdate({ ...song, tracks: updatedTracks });
  }, [song, onSongUpdate]);

  const handleDeleteMixPreset = useCallback((id: string) => {
    setMixPresets((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return {
    mixPresets,
    handleSaveMixPreset,
    handleLoadMixPreset,
    handleDeleteMixPreset,
  };
};
