import { useCallback } from 'react';
import { Song, TempoChange, ChordMarker } from '../../../../../types';
import { measureToSeconds, secondsToMeasure, calculateWarpBPM } from '../../../../../lib/timeUtils';

interface UseWarpModeProps {
  song: Song;
  onSongUpdate?: (song: Song) => void;
}

export const useWarpMode = ({ song, onSongUpdate }: UseWarpModeProps) => {
  const handleWarpCommit = useCallback((prevAnchor: number, draggedMeasure: number, newBpm: number) => {
    if (!song || !onSongUpdate) return;
    
    const newSong = { ...song };
    const tempoChanges = newSong.tempoChanges ? [...newSong.tempoChanges] : [];
    
    tempoChanges.sort((a, b) => a.time - b.time);
    
    const nextAnchor = tempoChanges.find(tc => tc.time > draggedMeasure);
    
    let nextAnchorTime = 0;
    let nextAnchorMeasure = 0;
    
    if (nextAnchor) {
      nextAnchorMeasure = nextAnchor.time;
      nextAnchorTime = measureToSeconds(nextAnchorMeasure, tempoChanges, song.tempo);
    }
    
    const prevIndex = tempoChanges.findIndex(tc => tc.time === prevAnchor);
    if (prevIndex >= 0) {
      tempoChanges[prevIndex] = { ...tempoChanges[prevIndex], tempo: newBpm };
    } else {
      if (prevAnchor === 1) {
         tempoChanges.push({ time: 1, tempo: newBpm, timeSignature: '4/4' });
      }
    }
    
    let draggedIndex = tempoChanges.findIndex(tc => tc.time === draggedMeasure);
    let draggedMarker = tempoChanges[draggedIndex];
    
    if (!draggedMarker) {
      const prev = tempoChanges.find(tc => tc.time === prevAnchor);
      draggedMarker = {
        time: draggedMeasure,
        tempo: prev ? prev.tempo : newBpm,
        timeSignature: prev ? prev.timeSignature : '4/4'
      };
      tempoChanges.push(draggedMarker);
    }
    
    tempoChanges.sort((a, b) => a.time - b.time);
    
    if (nextAnchor) {
      const newDraggedTime = measureToSeconds(draggedMeasure, tempoChanges, song.tempo);
      
      const deltaSeconds = nextAnchorTime - newDraggedTime;
      const deltaMeasures = nextAnchorMeasure - draggedMeasure;
      
      if (deltaSeconds > 0 && deltaMeasures > 0) {
        const [beats] = draggedMarker.timeSignature.split('/').map(Number);
        const compensatedBpm = calculateWarpBPM(deltaMeasures, deltaSeconds, beats);
        
        draggedMarker.tempo = compensatedBpm;
        
        const idx = tempoChanges.findIndex(tc => tc.time === draggedMeasure);
        if (idx >= 0) tempoChanges[idx] = draggedMarker;
      }
    }
    
    newSong.tempoChanges = tempoChanges;
    
    onSongUpdate(newSong);
  }, [song, onSongUpdate]);

  return { handleWarpCommit };
};
