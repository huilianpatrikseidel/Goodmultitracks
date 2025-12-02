import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Settings,
  X,
  Music2,
  Repeat,
} from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Song } from '../types';
import { Badge } from './ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { Label } from './ui/label';
import { getMainBeats, parseSubdivision, getSubdivisionInfo } from '../features/player/engine/metronome';
import { usePlaybackEngine } from '../features/player/hooks/usePlaybackEngine';
import { secondsToMeasure } from '../lib/timeUtils';

interface PerformanceModeProps {
  song: Song;
  onClose: () => void;
}

export function PerformanceMode({ song, onClose }: PerformanceModeProps) {
  // ARCHITECTURE FIX (QA 3.2): Use centralized playback engine instead of custom loop
  const { 
    isPlaying, 
    currentTime, 
    actions: playbackActions,
    metronomeEnabled,
    metronomeVolume,
    loopEnabled,
    loopStart,
    loopEnd
  } = usePlaybackEngine({ 
    song,
    initialTempo: song.tempo,
    warpModeEnabled: false
  });

  const [currentSection, setCurrentSection] = useState('');
  const [nextSection, setNextSection] = useState('');
  const [currentChord, setCurrentChord] = useState('');
  const [currentBPM, setCurrentBPM] = useState(song.tempo);
  const [currentTimeSignature, setCurrentTimeSignature] = useState('4/4');
  
  const lastBeatRef = useRef<number>(0);
  const [currentBeatInMeasure, setCurrentBeatInMeasure] = useState(1);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [showSubdivisions, setShowSubdivisions] = useState(false);
  const [subdivisionPattern, setSubdivisionPattern] = useState<string | undefined>(undefined);

  // Get current tempo info (with support for tempo curves)
  const getCurrentTempoInfo = (time: number) => {
    if (!song.tempoChanges || song.tempoChanges.length === 0) {
      return {
        tempo: song.tempo,
        timeSignature: '4/4',
        subdivision: undefined
      };
    }

    const sortedTempoChanges = [...song.tempoChanges].sort((a, b) => a.time - b.time);
    let current = sortedTempoChanges[0];
    
    for (const tc of sortedTempoChanges) {
      if (tc.time <= time) {
        current = tc;
      } else {
        break;
      }
    }
    
    let tempo = current.tempo;
    
    // Check for tempo curve interpolation
    if (current.curve && time >= current.time && time <= current.curve.targetTime) {
      const startTempo = current.tempo;
      const endTempo = current.curve.targetTempo;
      const duration = current.curve.targetTime - current.time;
      const progress = (time - current.time) / duration;
      
      if (current.curve.type === 'linear') {
        tempo = startTempo + (endTempo - startTempo) * progress;
      } else if (current.curve.type === 'exponential') {
        const easedProgress = 1 - Math.pow(1 - progress, 2);
        tempo = startTempo + (endTempo - startTempo) * easedProgress;
      }
    }
    
    return {
      tempo,
      timeSignature: current.timeSignature,
      subdivision: current.subdivision
    };
  };

  // Update musical context based on currentTime from engine
  useEffect(() => {
    const updateMusicalContext = (time: number) => {
      // 1. Update Section
      const activeMarker = song.markers
        ?.sort((a, b) => a.time - b.time)
        .slice()
        .reverse()
        .find((m) => m.time <= time);

      if (activeMarker) {
        setCurrentSection(activeMarker.label);
        
        // Find next section
        const currentIndex = song.markers?.findIndex(m => m.id === activeMarker.id) || 0;
        const nextMarker = song.markers?.[currentIndex + 1];
        setNextSection(nextMarker ? nextMarker.label : 'End');
      } else {
        setCurrentSection('Intro');
        setNextSection(song.markers?.[0]?.label || 'End');
      }

      // 2. Update Chord
      const activeChord = song.chordMarkers
        ?.sort((a, b) => a.time - b.time)
        .slice()
        .reverse()
        .find((c) => c.time <= time);

      if (activeChord) {
        setCurrentChord(activeChord.chord);
      } else {
        setCurrentChord('-');
      }

      // 3. Update Tempo/TimeSig
      const tempoInfo = getCurrentTempoInfo(time);
      setCurrentBPM(tempoInfo.tempo);
      setCurrentTimeSignature(tempoInfo.timeSignature);

      // 4. Update Beat Visualization
      const beatDuration = 60 / tempoInfo.tempo;
      const currentBeat = Math.floor(time / beatDuration);

      if (currentBeat > lastBeatRef.current) {
        const timeSignature = tempoInfo.timeSignature;
        const subdivision = tempoInfo.subdivision;
        
        setSubdivisionPattern(subdivision);
        
        const mainBeats = getMainBeats(timeSignature, subdivision);
        setBeatsPerMeasure(mainBeats);
        
        let beatNum = 1;
        
        if (subdivision) {
          const groups = parseSubdivision(subdivision);
          const totalSubdivisions = groups.reduce((a, b) => a + b, 0);
          const beatInCycle = (currentBeat % totalSubdivisions) + 1;
          const subdivInfo = getSubdivisionInfo(beatInCycle, subdivision);
          beatNum = subdivInfo.groupIndex + 1;
        } else {
          beatNum = (currentBeat % mainBeats) + 1;
        }
        
        setCurrentBeatInMeasure(beatNum);
        lastBeatRef.current = currentBeat;
      }
    };

    updateMusicalContext(currentTime);
  }, [currentTime, song]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    playbackActions.togglePlayPause();
  };

  const handleStop = () => {
    playbackActions.stop();
  };

  const handleRewind = () => {
    playbackActions.seek(Math.max(0, currentTime - 5));
  };

  const handleForward = () => {
    playbackActions.seek(Math.min(song.duration, currentTime + 5));
  };


  // Spacebar to play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if spacebar is pressed and not in an input field
      if (e.code === 'Space' && e.target instanceof HTMLElement) {
        const tagName = e.target.tagName.toLowerCase();
        if (tagName !== 'input' && tagName !== 'textarea' && !e.target.isContentEditable) {
          e.preventDefault();
          playbackActions.togglePlayPause();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update current and next sections
  useEffect(() => {
    const sorted = [...song.markers].sort((a, b) => a.time - b.time);
    const current = sorted.reverse().find((m) => m.time <= currentTime);
    const next = sorted.find((m) => m.time > currentTime);

    setCurrentSection(current?.label || 'Start');
    setNextSection(next?.label || 'End');
  }, [currentTime, song.markers]);

  // Update current chord
  useEffect(() => {
    if (!song.chordMarkers || song.chordMarkers.length === 0) {
      setCurrentChord('');
      return;
    }

    const sortedChords = [...song.chordMarkers].sort((a, b) => a.time - b.time);
    const current = sortedChords.reverse().find((c) => c.time <= currentTime);
    setCurrentChord(current?.chord || '');
  }, [currentTime, song.chordMarkers]);

  // Update current BPM and Time Signature
  useEffect(() => {
    const tempoInfo = getCurrentTempoInfo(currentTime);
    setCurrentBPM(tempoInfo.tempo);
    setCurrentTimeSignature(tempoInfo.timeSignature);
  }, [currentTime, song.tempoChanges, song.tempo]);

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * song.duration;
    playbackActions.seek(Math.max(0, Math.min(song.duration, newTime)));
  };

  const handleSectionClick = (marker: any) => {
    // Find the next section marker to set loop end
    const sorted = [...song.markers].sort((a, b) => a.time - b.time);
    const currentIndex = sorted.findIndex(m => m.id === marker.id);
    const nextMarker = sorted[currentIndex + 1];
    
    // Set loop to this section
    playbackActions.setLoopStart(marker.time);
    playbackActions.setLoopEnd(nextMarker ? nextMarker.time : song.duration);
    playbackActions.seek(marker.time);
    
    // Auto-enable loop if clicking a section
    playbackActions.setLoopEnabled(true);
  };

  const progressPercentage = (currentTime / song.duration) * 100;

  return (
    <div className="fixed inset-0 bg-black text-white z-50 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl mb-1">{song.title}</h1>
            <p className="text-xl text-gray-400">{song.artist}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-gray-800"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Current Chord - Extra Large Display */}
        {currentChord && (
          <div className="text-center mb-12">
            <div 
              className="font-mono tracking-wider"
              style={{ 
                fontSize: 'clamp(8rem, 20vw, 16rem)',
                lineHeight: '1',
                textShadow: '0 0 40px rgba(59, 130, 246, 0.5)',
              }}
            >
              {currentChord}
            </div>
          </div>
        )}

        {/* Current section */}
        <div className="text-center mb-8">
          <div className="text-5xl md:text-7xl mb-4 text-gray-300">{currentSection}</div>
          {nextSection && (
            <div className="text-xl text-gray-500">
              Next: {nextSection}
            </div>
          )}
        </div>

        {/* BPM and Time Signature */}
        <div className="flex items-center gap-6 mb-8">
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-1">BPM</div>
            <div className="text-3xl">{Math.round(currentBPM)}</div>
          </div>
          <div className="text-gray-600 text-4xl">|</div>
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-1">Time Signature</div>
            <div className="text-3xl">{currentTimeSignature}</div>
          </div>
        </div>

        {/* Metronome Beat Visualization */}
        {metronomeEnabled && isPlaying && (
          <div className="flex flex-col items-center gap-2 mb-8">
            {/* Main beats */}
            <div className="flex items-center gap-3">
              {Array.from({ length: beatsPerMeasure }).map((_, index) => {
                const beatNumber = index + 1;
                const isActive = beatNumber === currentBeatInMeasure;
                const isFirstBeat = beatNumber === 1;
                
                return (
                  <div
                    key={index}
                    className={`w-4 h-4 rounded-full transition-all duration-100 ${
                      isActive
                        ? isFirstBeat
                          ? 'bg-blue-500 scale-150 shadow-lg shadow-blue-500/50'
                          : 'bg-gray-400 scale-125 shadow-md shadow-gray-400/50'
                        : 'bg-gray-700'
                    }`}
                  />
                );
              })}
            </div>
            
            {/* Subdivision pattern display */}
            {showSubdivisions && subdivisionPattern && (
              <div className="text-xs text-gray-400">
                Pattern: {subdivisionPattern}
              </div>
            )}
          </div>
        )}

        {/* Time display */}
        <div className="text-4xl mb-8">
          {formatTime(currentTime)} / {formatTime(song.duration)}
        </div>

        {/* Progress bar with section markers */}
        <div className="w-full max-w-2xl mb-12">
          {/* Section markers above progress bar */}
          <div className="relative mb-2 h-8">
            {song.markers.map((marker) => {
              const position = (marker.time / song.duration) * 100;
              const isActive = marker.time <= currentTime && 
                (song.markers.find(m => m.time > currentTime)?.time || Infinity) > marker.time;
              
              return (
                <button
                  key={marker.id}
                  onClick={() => handleSectionClick(marker)}
                  className={`absolute -translate-x-1/2 px-2 py-1 text-xs rounded transition-all hover:scale-110 ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  style={{ left: `${position}%`, bottom: 0 }}
                  title={`Jump to ${marker.label} at ${formatTime(marker.time)}`}
                >
                  {marker.label}
                </button>
              );
            })}
          </div>
          
          {/* Progress bar */}
          <div 
            className="h-4 bg-gray-800 rounded-full overflow-hidden cursor-pointer hover:bg-gray-700 transition-colors relative"
            onClick={handleProgressBarClick}
          >
            {/* Section divisions */}
            {song.markers.map((marker) => {
              const position = (marker.time / song.duration) * 100;
              return (
                <div
                  key={`div-${marker.id}`}
                  className="absolute top-0 bottom-0 w-px bg-gray-600"
                  style={{ left: `${position}%` }}
                />
              );
            })}
            
            {/* Progress indicator */}
            <div
              className="h-full bg-white transition-all pointer-events-none"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          <Button
            variant="ghost"
            size="icon"
            className="w-16 h-16 text-white hover:bg-gray-800"
            onClick={() => {
              const sorted = [...song.markers].sort((a, b) => a.time - b.time);
              const prevMarker = sorted.reverse().find((m) => m.time < currentTime - 1);
              if (prevMarker) playbackActions.seek(prevMarker.time);
            }}
          >
            <SkipBack className="w-8 h-8" />
          </Button>

          <Button
            size="icon"
            className={`w-24 h-24 rounded-full ${
              isPlaying 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-green-800 text-white hover:bg-green-700'
            }`}
            onClick={() => playbackActions.togglePlayPause()}
          >
            {isPlaying ? (
              <Pause className="w-12 h-12" />
            ) : (
              <Play className="w-12 h-12" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="w-16 h-16 text-white hover:bg-gray-800"
            onClick={() => {
              const sorted = [...song.markers].sort((a, b) => a.time - b.time);
              const nextMarker = sorted.find((m) => m.time > currentTime);
              if (nextMarker) playbackActions.seek(nextMarker.time);
            }}
          >
            <SkipForward className="w-8 h-8" />
          </Button>
        </div>
      </div>

      {/* Footer - Quick info */}
      <div className="p-6 border-t border-gray-800">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-lg py-2 px-4 border-white text-white">
              Key: {song.key}
            </Badge>
            <Badge variant="outline" className="text-lg py-2 px-4 border-white text-white">
              {song.tempo} BPM
            </Badge>
            
            {/* Loop indicator and control */}
            {loopStart !== null && loopEnd !== null && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  playbackActions.setLoopEnabled(false);
                  playbackActions.setLoopStart(null);
                  playbackActions.setLoopEnd(null);
                }}
                className="gap-2 border-green-600 text-green-500 hover:bg-green-900"
              >
                <Repeat className="w-4 h-4" />
                Loop: {formatTime(loopStart)} - {formatTime(loopEnd)}
              </Button>
            )}
            
            {/* Metronome Control */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={`w-10 h-10 ${
                    metronomeEnabled 
                      ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700' 
                      : 'border-white text-white hover:bg-gray-800'
                  }`}
                >
                  <Music2 className="w-5 h-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 bg-gray-900 border-gray-700">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Metronome</Label>
                    <Button
                      variant={metronomeEnabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => playbackActions.setMetronomeEnabled(!metronomeEnabled)}
                    >
                      {metronomeEnabled ? 'ON' : 'OFF'}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Volume</Label>
                    <Slider
                      value={[metronomeVolume * 100]}
                      onValueChange={(value: number[]) => playbackActions.setMetronomeVolume(value[0] / 100)}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-400 text-right">
                      {Math.round(metronomeVolume * 100)}%
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                    <Label className="text-white text-sm">Show Subdivisions</Label>
                    <Button
                      variant={showSubdivisions ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowSubdivisions(!showSubdivisions)}
                    >
                      {showSubdivisions ? 'ON' : 'OFF'}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="text-sm text-gray-400">
            MIDI Controls Active • Performance Mode
          </div>
        </div>
      </div>
    </div>
  );
}
