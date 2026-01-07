// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
import { useTrackManager } from '../../../hooks/useTrackManager';
import { Song, AudioTrack, TrackTag } from '../../../../../types';

interface UseTrackActionsProps {
  song: Song | null;
  onSongUpdate?: (song: Song) => void;
}

export function useTrackActions({ song, onSongUpdate }: UseTrackActionsProps) {
  const trackManager = useTrackManager(song, onSongUpdate);

  // Use the handlers from trackManager directly
  const handleTrackVolumeChange = trackManager.handlers.handleTrackVolumeChange;
  const handleTrackMuteToggle = trackManager.handlers.handleTrackMuteToggle;
  const handleTrackSoloToggle = trackManager.handlers.handleTrackSoloToggle;

  const handleTrackNameChange = trackManager.handlers.handleTrackNameChange;
  const handleTrackColorChange = trackManager.handlers.handleTrackColorChange;
  const handleTrackTagChange = trackManager.handlers.handleTrackTagChange;

  return {
    handleTrackVolumeChange,
    handleTrackMuteToggle,
    handleTrackSoloToggle,
    handleTrackNameChange,
    handleTrackColorChange,
    handleTrackTagChange,
  };
}

