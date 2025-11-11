import { useState, useEffect, useRef, useCallback } from 'react';
import { Song, TempoChange } from '../types';
import { audioTimeToGridTime, getWarpedTime as utilsGetWarpedTime } from '../lib/warpUtils';
import { playMetronomeClick, resumeAudioContext, getMainBeats, parseSubdivision, getSubdivisionInfo } from '../lib/metronome';

interface PlaybackEngineOptions {
  song: Song | null;
  initialTempo?: number;
  initialMetronomeVolume?: number;
}

export const usePlaybackEngine = ({
  song,
  initialTempo = 100,
  initialMetronomeVolume = 0.5,
}: PlaybackEngineOptions) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // Audio time
  const [gridTime, setGridTime] = useState(0); // Musical time
  const [tempo, setTempo] = useState(initialTempo); // Playback speed %
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [loopStart, setLoopStart] = useState<number | null>(null);
  const [loopEnd, setLoopEnd] = useState<number | null>(null);
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const [metronomeVolume, setMetronomeVolume] = useState(initialMetronomeVolume);

  const lastBeatRef = useRef<number>(0);
  const dynamicTempos = song?.tempoChanges || [{ time: 0, tempo: song?.tempo || 120, timeSignature: '4/4' }];

  const getWarpedTime = useCallback((currentGridTime: number): number => {
    if (!song) return currentGridTime;
    return utilsGetWarpedTime(currentGridTime, dynamicTempos, song.tempo, true); // Assuming warp is always possible
  }, [song, dynamicTempos]);

  const seek = useCallback((newGridTime: number) => {
    if (!song) return;
    const clampedGridTime = Math.max(0, Math.min(newGridTime, song.duration));
    setGridTime(clampedGridTime);
    setCurrentTime(getWarpedTime(clampedGridTime));
    lastBeatRef.current = 0;
  }, [song, getWarpedTime]);

  const togglePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const stop = useCallback(() => {
    setIsPlaying(false);
    seek(0);
  }, [seek]);

  // Resume audio context on first play
  useEffect(() => {
    if (isPlaying) {
      resumeAudioContext();
    }
  }, [isPlaying]);

  // Main playback loop
  useEffect(() => {
    if (!isPlaying || !song) return;

    const interval = setInterval(() => {
      setCurrentTime((prevCurrentTime) => {
        // Helper to get interpolated tempo for curves
        const getCurrentTempo = (time: number): TempoChange => {
          let activeChange = dynamicTempos[0];
          for (const tc of dynamicTempos) {
            if (tc.time <= time) {
              activeChange = tc;
            } else {
              break;
            }
          }
          
          if (activeChange.curve && time >= activeChange.time && time <= activeChange.curve.targetTime) {
            const startTempo = activeChange.tempo;
            const endTempo = activeChange.curve.targetTempo;
            const duration = activeChange.curve.targetTime - activeChange.time;
            const progress = (time - activeChange.time) / duration;
            
            let interpolatedTempo = startTempo;
            if (activeChange.curve.type === 'linear') {
              interpolatedTempo = startTempo + (endTempo - startTempo) * progress;
            } else if (activeChange.curve.type === 'exponential') {
              const easedProgress = 1 - Math.pow(1 - progress, 2);
              interpolatedTempo = startTempo + (endTempo - startTempo) * easedProgress;
            }
            return { ...activeChange, tempo: interpolatedTempo };
          }
          
          return activeChange;
        };
        
        // Advance currentTime (audio time) linearly based on playback speed
        const newCurrentTime = prevCurrentTime + (0.1 * tempo / 100);

        // Calculate the new gridTime from the advanced audio time
        const newGridTime = audioTimeToGridTime(newCurrentTime, dynamicTempos, song.tempo);
        setGridTime(newGridTime);

        const loopStartPoint = loopEnabled && loopStart !== null ? getWarpedTime(loopStart) : 0;
        const loopEndPoint = loopEnabled && loopEnd !== null ? getWarpedTime(loopEnd) : song.duration;

        // Metronome logic (based on grid time)
        if (metronomeEnabled) {
          const tempoInfo = getCurrentTempo(newGridTime);
          const actualTempo = tempoInfo.tempo * (tempo / 100);
          const beatDuration = 60 / actualTempo;
          const currentBeat = Math.floor(newGridTime / beatDuration);

          if (currentBeat > lastBeatRef.current) {
            const timeSignature = tempoInfo.timeSignature || "4/4";
            const subdivision = tempoInfo.subdivision;
            const mainBeats = getMainBeats(timeSignature, subdivision);
            
            let isStrongBeat = false;
            if (subdivision) {
              const groups = parseSubdivision(subdivision);
              const totalSubdivisions = groups.reduce((a, b) => a + b, 0);
              const beatInCycle = (currentBeat % totalSubdivisions) + 1;
              isStrongBeat = getSubdivisionInfo(beatInCycle, subdivision).isGroupStart;
            } else {
              const beatInMeasure = (currentBeat % mainBeats) + 1;
              isStrongBeat = beatInMeasure === 1;
            }

            playMetronomeClick(isStrongBeat, metronomeVolume);
            lastBeatRef.current = currentBeat;
          }
        }

        // Handle loop or end of song
        if (newCurrentTime >= loopEndPoint) {
          if (loopEnabled) {
            lastBeatRef.current = 0;
            const newGridTimeOnLoop = loopStart !== null ? loopStart : 0;
            setGridTime(newGridTimeOnLoop);
            return loopStartPoint;
          }
          setIsPlaying(false);
          lastBeatRef.current = 0;
          setGridTime(0);
          return 0;
        }
        return newCurrentTime;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [
    isPlaying,
    song,
    tempo,
    loopEnabled,
    loopStart,
    loopEnd,
    metronomeEnabled,
    metronomeVolume,
    dynamicTempos,
    getWarpedTime,
  ]);

  return {
    isPlaying,
    currentTime,
    gridTime,
    tempo,
    loopEnabled,
    loopStart,
    loopEnd,
    metronomeEnabled,
    metronomeVolume,
    actions: {
      togglePlayPause,
      stop,
      seek,
      setTempo,
      setLoopEnabled,
      setLoopStart,
      setLoopEnd,
      setMetronomeEnabled,
      setMetronomeVolume,
    },
  };
};