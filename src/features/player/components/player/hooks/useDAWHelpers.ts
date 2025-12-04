import { useMemo } from 'react';
import { Song } from '../../../../../types';
import { ZOOM } from '../../../../../config/constants';
import { secondsToMeasure } from '../../../../../lib/timeUtils';

interface UseDAWHelpersProps {
  song: Song;
  zoom: number;
  currentTime: number;
  trackHeight: 'small' | 'medium' | 'large';
}

export const useDAWHelpers = ({ song, zoom, currentTime, trackHeight }: UseDAWHelpersProps) => {
  const getPixelsPerSecond = () => ZOOM.BASE_PPS * zoom;

  const getTrackHeightPx = () => {
    switch (trackHeight) {
      case 'small': return 64;
      case 'large': return 128;
      default: return 96;
    }
  };

  const getCurrentMeasure = () => {
    const tempoChanges = song.tempoChanges || [{ time: 0, tempo: song.tempo, timeSignature: '4/4' }];
    return Math.floor(secondsToMeasure(currentTime, tempoChanges, song.tempo));
  };

  const getCurrentTempoInfo = (time: number) => {
    const tempoChanges = song.tempoChanges || [{ time: 0, tempo: song.tempo, timeSignature: '4/4' }];
    const measure = secondsToMeasure(time, tempoChanges, song.tempo);
    const sortedChanges = [...tempoChanges].sort((a, b) => a.time - b.time);
    const activeTempoChange = sortedChanges.slice().reverse().find(tc => tc.time <= measure) || tempoChanges[0];
    return activeTempoChange;
  };

  const getCurrentTimeSignature = () => {
    return getCurrentTempoInfo(currentTime).timeSignature;
  };

  return {
    getPixelsPerSecond,
    getTrackHeightPx,
    getCurrentMeasure,
    getCurrentTempoInfo,
    getCurrentTimeSignature,
  };
};
