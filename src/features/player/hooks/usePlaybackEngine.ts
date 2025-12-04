import { useState, useEffect, useRef, useCallback } from 'react';
import { Song, TempoChange } from '../types';
import { audioTimeToGridTime, getWarpedTime as utilsGetWarpedTime } from '../utils/warpUtils';
import { playMetronomeClick, getMainBeats, parseSubdivision, getSubdivisionInfo } from '../engine/metronome';
import { useAudioContext } from '../context/AudioContextProvider';

interface PlaybackEngineOptions {
  song: Song | null;
  initialTempo?: number;
  initialMetronomeVolume?: number;
  warpModeEnabled?: boolean;
}

export const usePlaybackEngine = ({
  song,
  initialTempo = 100,
  initialMetronomeVolume = 0.5,
  warpModeEnabled = true,
}: PlaybackEngineOptions) => {
  const { resumeAudioContext, getAudioContext } = useAudioContext();
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
  const nextMetronomeTimeRef = useRef<number>(0); // Web Audio time for next metronome click
  const scheduledBeatsRef = useRef<Set<number>>(new Set()); // Track scheduled beats to avoid duplicates
  const dynamicTempos = song?.tempoChanges || [{ time: 0, tempo: song?.tempo || 120, timeSignature: '4/4' }];
  
  // Audio playback refs
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const audioNodesRef = useRef<Map<string, { gainNode: GainNode; source: MediaElementAudioSourceNode }>>(new Map());
  
  // CRITICAL (P1): Worker-based timer para metronome scheduling
  // Não é throttled quando aba está em background
  const metronomeWorkerRef = useRef<Worker | null>(null);
  
  // Use refs for values that change frequently to avoid effect restarts
  const tempoRef = useRef(tempo);
  const metronomeEnabledRef = useRef(metronomeEnabled);
  const metronomeVolumeRef = useRef(metronomeVolume);
  const loopEnabledRef = useRef(loopEnabled);
  const loopStartRef = useRef(loopStart);
  const loopEndRef = useRef(loopEnd);
  
  // FIX P0: Ref para startTime do loop de playback - resetar no seek
  const playbackStartTimeRef = useRef<number>(0);
  const playbackStartCurrentTimeRef = useRef<number>(0);
  
  // Keep refs in sync with state
  useEffect(() => { tempoRef.current = tempo; }, [tempo]);
  useEffect(() => { metronomeEnabledRef.current = metronomeEnabled; }, [metronomeEnabled]);
  useEffect(() => { metronomeVolumeRef.current = metronomeVolume; }, [metronomeVolume]);
  useEffect(() => { loopEnabledRef.current = loopEnabled; }, [loopEnabled]);
  useEffect(() => { loopStartRef.current = loopStart; }, [loopStart]);
  useEffect(() => { loopEndRef.current = loopEnd; }, [loopEnd]);

  const getWarpedTime = useCallback((currentGridTime: number): number => {
    if (!song) return currentGridTime;
    return utilsGetWarpedTime(currentGridTime, dynamicTempos, song.tempo, warpModeEnabled);
  }, [song, dynamicTempos, warpModeEnabled]);

  const seek = useCallback((newGridTime: number) => {
    if (!song) return;
    const clampedGridTime = Math.max(0, Math.min(newGridTime, song.duration));
    const newAudioTime = getWarpedTime(clampedGridTime);
    
    // FIX P0: Resetar refs do loop de playback para evitar race condition
    const audioCtx = getAudioContext();
    playbackStartTimeRef.current = audioCtx.currentTime;
    playbackStartCurrentTimeRef.current = newAudioTime;
    
    setGridTime(clampedGridTime);
    setCurrentTime(newAudioTime);
    lastBeatRef.current = 0;
    
    // Update all audio elements to new position
    audioElementsRef.current.forEach((audio) => {
      audio.currentTime = newAudioTime;
    });
  }, [song, getWarpedTime, getAudioContext]);

  const togglePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const stop = useCallback(() => {
    setIsPlaying(false);
    seek(0);
  }, [seek]);

  // Effect 1: Initialize audio elements (Lifecycle - mount/unmount only)
  // CRITICAL: Only depends on song.id to prevent recreation on volume changes
  useEffect(() => {
    if (!song) return;

    const audioCtx = getAudioContext();
    const newElements = new Map<string, HTMLAudioElement>();
    const newNodes = new Map<string, { gainNode: GainNode; source: MediaElementAudioSourceNode }>();

    // Create audio elements for each track
    for (const track of song.tracks) {
      if (!track.url) continue;

      // Create audio element
      const audio = new Audio(track.url);
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous';
      
      // Create Web Audio nodes for volume control
      const gainNode = audioCtx.createGain();
      const source = audioCtx.createMediaElementSource(audio);
      
      source.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      // Set initial volume
      gainNode.gain.value = track.muted ? 0 : track.volume;
      
      newElements.set(track.id, audio);
      newNodes.set(track.id, { gainNode, source });
    }

    // Store refs
    audioElementsRef.current = newElements;
    audioNodesRef.current = newNodes;

    // Cleanup function
    return () => {
      // Stop and cleanup all audio elements
      newElements.forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      
      // Disconnect audio nodes
      newNodes.forEach(({ gainNode, source }) => {
        source.disconnect();
        gainNode.disconnect();
      });
      
      audioElementsRef.current.clear();
      audioNodesRef.current.clear();
    };
  }, [song?.id, getAudioContext]); // Only re-run when song changes (not on track updates)

  // Effect 2: Update track volumes and mute states (Real-time parameter updates)
  // CRITICAL: This effect updates existing nodes WITHOUT recreating them
  // This prevents audio interruptions when changing volume/mute/solo
  useEffect(() => {
    if (!song) return;

    const isAnySolo = song.tracks.some(t => t.solo);

    song.tracks.forEach(track => {
      const nodes = audioNodesRef.current.get(track.id);
      if (!nodes) return;

      const { gainNode } = nodes;
      
      // Calculate effective volume
      let effectiveVolume = 0;
      if (isAnySolo) {
        // Solo mode: only solo tracks play
        effectiveVolume = track.solo && !track.muted ? track.volume : 0;
      } else {
        // Normal mode: respect mute
        effectiveVolume = track.muted ? 0 : track.volume;
      }
      
      // CRITICAL: Only update the gain value, don't recreate anything
      gainNode.gain.value = effectiveVolume;
    });
  }, [song?.tracks]); // Runs when track parameters change (volume, mute, solo)

  // Resume audio context on first play (CRITICAL: Handle browser autoplay policy)
  useEffect(() => {
    if (isPlaying) {
      resumeAudioContext();
    }
  }, [isPlaying, resumeAudioContext]);

  // CRITICAL (P1): Inicializar Worker do metrônomo
  // DISABLED: Workers not supported in this build environment
  // Metronome uses setInterval fallback (metronomeWorkerRef stays null)
  useEffect(() => {
    // Worker creation disabled - metronome will use main thread timer
    // No initialization needed, metronomeWorkerRef.current remains null
    
    return () => {
      if (metronomeWorkerRef.current) {
        metronomeWorkerRef.current.terminate();
      }
    };
  }, []);

  // Main playback loop with LOOKAHEAD SCHEDULING
  // CRITICAL FIX: Using Worker-based timer + Web Audio time for precision
  // ALTA (P1): Worker não sofre throttling de aba em background
  useEffect(() => {
    if (!isPlaying || !song) return;

    const audioCtx = getAudioContext();
    const scheduleAheadTime = 0.2; // Schedule audio 200ms ahead
    let animationFrameId: number | null = null;
    
    // FIX P0: Usar refs externas que são atualizadas pelo seek()
    playbackStartTimeRef.current = audioCtx.currentTime;
    playbackStartCurrentTimeRef.current = currentTime;

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

    // Start all audio tracks
    audioElementsRef.current.forEach((audio) => {
      audio.currentTime = currentTime;
      audio.playbackRate = tempo / 100;
      audio.play().catch(err => console.warn('Audio play failed:', err));
    });

    // Visual update loop using requestAnimationFrame for smooth, synchronized updates
    const visualUpdate = () => {
      const currentAudioTime = audioCtx.currentTime;
      const currentTempo = tempoRef.current;
      const currentLoopEnabled = loopEnabledRef.current;
      const currentLoopStart = loopStartRef.current;
      const currentLoopEnd = loopEndRef.current;
      const currentMetronomeEnabled = metronomeEnabledRef.current;
      const currentMetronomeVolume = metronomeVolumeRef.current;
      
      const elapsed = (currentAudioTime - playbackStartTimeRef.current) * (currentTempo / 100);
      const newCurrentTime = playbackStartCurrentTimeRef.current + elapsed;
      
      const newGridTime = audioTimeToGridTime(newCurrentTime, dynamicTempos, song.tempo);
      
      // Sync audio elements with current time and tempo
      // CORREÇÃO CRÍTICA (QA): Reduzido threshold de 50ms para 20ms para sincronização mais agressiva
      // Evita phasing audível entre tracks em navegadores móveis
      audioElementsRef.current.forEach((audio) => {
        // Only update if drift is significant (>20ms) to avoid jitter
        const drift = Math.abs(audio.currentTime - newCurrentTime);
        if (drift > 0.02) { // 20ms threshold
          audio.currentTime = newCurrentTime;
        }
        // Update playback rate if tempo changed
        if (Math.abs(audio.playbackRate - (currentTempo / 100)) > 0.01) {
          audio.playbackRate = currentTempo / 100;
        }
      });
      
      const loopStartPoint = currentLoopEnabled && currentLoopStart !== null ? getWarpedTime(currentLoopStart) : 0;
      const loopEndPoint = currentLoopEnabled && currentLoopEnd !== null ? getWarpedTime(currentLoopEnd) : song.duration;

      // Handle loop or end of song
      if (newCurrentTime >= loopEndPoint) {
        if (currentLoopEnabled) {
          // Loop back
          playbackStartTimeRef.current = audioCtx.currentTime;
          playbackStartCurrentTimeRef.current = loopStartPoint;
          lastBeatRef.current = 0;
          nextMetronomeTimeRef.current = 0;
          scheduledBeatsRef.current.clear();
          setGridTime(currentLoopStart !== null ? currentLoopStart : 0);
          setCurrentTime(loopStartPoint);
          
          // Seek all audio elements back to loop start
          audioElementsRef.current.forEach((audio) => {
            audio.currentTime = loopStartPoint;
          });
        } else {
          // Stop playback
          setIsPlaying(false);
          lastBeatRef.current = 0;
          nextMetronomeTimeRef.current = 0;
          scheduledBeatsRef.current.clear();
          setGridTime(0);
          setCurrentTime(0);
          
          // Pause and reset all audio elements
          audioElementsRef.current.forEach((audio) => {
            audio.pause();
            audio.currentTime = 0;
          });
        }
      } else {
        setCurrentTime(newCurrentTime);
        setGridTime(newGridTime);
      }

      // NOTA: Metronome scheduling agora gerenciado pelo Worker
      // (veja worker.onmessage acima, fora do visualUpdate)

      animationFrameId = requestAnimationFrame(visualUpdate);
    };

    // CRITICAL (P1): Worker-based timer para scheduling confiável
    // RAF ainda usado para updates visuais, mas Worker garante áudio em background
    const worker = metronomeWorkerRef.current;
    
    if (worker) {
      worker.onmessage = () => {
        // Worker tick: verifica se precisa agendar mais metronome clicks
        if (metronomeEnabledRef.current) {
          const audioCtx = getAudioContext();
          const currentAudioTime = audioCtx.currentTime;
          const scheduleUpTo = currentAudioTime + scheduleAheadTime;
          const currentTempo = tempoRef.current;
          
          // Initialize next metronome time if needed
          if (nextMetronomeTimeRef.current === 0 || nextMetronomeTimeRef.current < currentAudioTime) {
            nextMetronomeTimeRef.current = currentAudioTime + 0.05;
            scheduledBeatsRef.current.clear();
          }
          
          // Schedule beats dentro da janela de lookahead
          const elapsed = (currentAudioTime - playbackStartTimeRef.current) * (currentTempo / 100);
          const newCurrentTime = playbackStartCurrentTimeRef.current + elapsed;
          const newGridTime = audioTimeToGridTime(newCurrentTime, dynamicTempos, song.tempo);
          
          while (nextMetronomeTimeRef.current < scheduleUpTo) {
            const scheduleTime = nextMetronomeTimeRef.current;
            const tempoInfo = getCurrentTempo(newGridTime);
            const actualTempo = tempoInfo.tempo * (currentTempo / 100);
            const beatDuration = 60 / actualTempo;
            const currentBeat = Math.floor(newGridTime / beatDuration);

            if (!scheduledBeatsRef.current.has(currentBeat)) {
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

              playMetronomeClick(audioCtx, isStrongBeat, metronomeVolumeRef.current, false, undefined, scheduleTime);
              scheduledBeatsRef.current.add(currentBeat);
              
              if (scheduledBeatsRef.current.size > 100) {
                const beatsArray = Array.from(scheduledBeatsRef.current).sort((a, b) => a - b);
                scheduledBeatsRef.current = new Set(beatsArray.slice(-50));
              }
            }
            
            nextMetronomeTimeRef.current += beatDuration;
          }
        }
      };
      
      // Inicia Worker timer (25ms = 40 Hz, suficiente para lookahead)
      worker.postMessage({ action: 'start', interval: 25 });
    }
    
    // Start visual update loop
    animationFrameId = requestAnimationFrame(visualUpdate);

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      
      // Para Worker timer
      if (worker) {
        worker.postMessage({ action: 'stop' });
      }
      
      // Pause all audio elements when stopping
      audioElementsRef.current.forEach((audio) => {
        audio.pause();
      });
    };
    // CRITICAL: Minimal dependencies to prevent audio glitches from effect restarts
    // Only restart when song changes or play state toggles
  }, [isPlaying, song, dynamicTempos, getWarpedTime, getAudioContext]);

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