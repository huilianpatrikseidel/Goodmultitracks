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
      trackSettings: song.tracks.map((track) => ({
        trackId: track.id,
        volume: track.volume ?? 1,
        pan: track.pan ?? 0,
        solo: track.solo ?? false,
        mute: track.mute ?? false,
      })),
    };

    setMixPresets((prev) => [...prev, preset]);
  }, [song.tracks]);

  const handleLoadMixPreset = useCallback((preset: MixPreset) => {
    if (!onSongUpdate) return;

    const updatedTracks = song.tracks.map((track) => {
      const setting = preset.trackSettings.find((s) => s.trackId === track.id);
      if (!setting) return track;

      return {
        ...track,
        volume: setting.volume,
        pan: setting.pan,
        solo: setting.solo,
        mute: setting.mute,
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
