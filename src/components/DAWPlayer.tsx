import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  Repeat,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  ArrowLeft,
  Edit,
  Plus,
  Download,
  Clock,
  Music2,
  Pencil,
  Palette,
  Grid3x3,
  PanelLeftClose,
  PanelLeft,
  ChevronDown,
} from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Input } from './ui/input';
import { Song, AudioTrack, SectionMarker, TimeSignatureChange, TempoChange, ChordMarker } from '../types';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { CreateProjectDialog } from './CreateProjectDialog';
import { TimelineEditorDialog } from './TimelineEditorDialog';
import { ChordDiagram } from './ChordDiagram';
import { gainToDb, gainToSlider, sliderToGain, formatDb, parseDbInput, hexToRgba } from '../lib/audioUtils';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Label } from './ui/label';
import { playMetronomeClick, resumeAudioContext } from '../lib/metronome';
import { useLanguage } from '../lib/LanguageContext';

interface DAWPlayerProps {
  song: Song | null;
  onSongUpdate?: (song: Song) => void;
  onPerformanceMode?: () => void;
  onBack: () => void;
  onCreateProject?: (projectData: any) => void;
}

export function DAWPlayer({ song, onSongUpdate, onPerformanceMode, onBack, onCreateProject }: DAWPlayerProps) {
  const { t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [tempo, setTempo] = useState(100);
  const [keyShift, setKeyShift] = useState(0);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [tracks, setTracks] = useState<AudioTrack[]>(song?.tracks || []);
  const [zoom, setZoom] = useState(1);
  const [editMode, setEditMode] = useState(song?.source === 'project');
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [timelineEditorOpen, setTimelineEditorOpen] = useState(false);
  const [editorType, setEditorType] = useState<'tempo' | 'timesig' | 'section' | 'chord'>('section');
  const [containerWidth, setContainerWidth] = useState(1000);
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [trackNameInput, setTrackNameInput] = useState('');
  const [loopStart, setLoopStart] = useState<number | null>(null);
  const [loopEnd, setLoopEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartTime, setDragStartTime] = useState<number | null>(null);
  const [hasDragged, setHasDragged] = useState(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [isDraggingScrollbar, setIsDraggingScrollbar] = useState(false);
  const [isDraggingLeftHandle, setIsDraggingLeftHandle] = useState(false);
  const [isDraggingRightHandle, setIsDraggingRightHandle] = useState(false);
  const [handleDragStart, setHandleDragStart] = useState<{ x: number; zoom: number } | null>(null);
  const [scrollUpdate, setScrollUpdate] = useState(0);
  const [isDraggingVerticalScrollbar, setIsDraggingVerticalScrollbar] = useState(false);
  const [selectedChord, setSelectedChord] = useState<{ chord: string; customDiagram?: any } | null>(null);
  
  // Metronome state
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const [metronomeVolume, setMetronomeVolume] = useState(0.5); // Stored as linear gain
  const lastBeatRef = useRef<number>(0);
  
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const tracksScrollRef = useRef<HTMLDivElement>(null);
  const trackLabelsScrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wheelTimeoutRef = useRef<number | null>(null);
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const verticalScrollbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (song) {
      setTracks(song.tracks);
      // Auto-enable edit mode for projects, disable for imported songs
      setEditMode(song.source === 'project');
    }
  }, [song]);

  // Sync tracks back to song when they change
  useEffect(() => {
    if (song && onSongUpdate && JSON.stringify(tracks) !== JSON.stringify(song.tracks)) {
      onSongUpdate({ ...song, tracks });
    }
  }, [tracks]);

  // Measure container width for zoom calculation
  useEffect(() => {
    const measureWidth = () => {
      if (timelineScrollRef.current) {
        setContainerWidth(timelineScrollRef.current.clientWidth);
      }
    };
    
    measureWidth();
    window.addEventListener('resize', measureWidth);
    return () => window.removeEventListener('resize', measureWidth);
  }, []);

  // Resume audio context on play (required by some browsers)
  useEffect(() => {
    if (isPlaying) {
      resumeAudioContext();
    }
  }, [isPlaying]);

  // Simulate playback with metronome
  useEffect(() => {
    if (!isPlaying || !song) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const newTime = prev + (0.1 * tempo / 100);
        const endPoint = loopEnabled && loopEnd !== null ? loopEnd : song.duration;
        const startPoint = loopEnabled && loopStart !== null ? loopStart : 0;
        
        // Handle metronome clicks
        if (metronomeEnabled) {
          const actualTempo = song.tempo * (tempo / 100);
          const beatDuration = 60 / actualTempo;
          
          // Calculate current beat
          const currentBeat = Math.floor(newTime / beatDuration);
          
          // Play click if we've crossed to a new beat
          if (currentBeat > lastBeatRef.current) {
            const timeSignature = song.tempoChanges?.[0]?.timeSignature || "4/4";
            const [beatsPerMeasure] = timeSignature.split('/').map(Number);
            const beatInMeasure = (currentBeat % beatsPerMeasure) + 1;
            const isStrongBeat = beatInMeasure === 1;
            
            playMetronomeClick(isStrongBeat, metronomeVolume);
            lastBeatRef.current = currentBeat;
          }
        }
        
        if (newTime >= endPoint) {
          if (loopEnabled) {
            lastBeatRef.current = 0; // Reset beat counter on loop
            return startPoint;
          }
          setIsPlaying(false);
          lastBeatRef.current = 0;
          return 0;
        }
        return newTime;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, tempo, song, loopEnabled, loopStart, loopEnd, metronomeEnabled, metronomeVolume]);

  // Spacebar to play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if spacebar is pressed and not in an input field
      if (e.code === 'Space' && e.target instanceof HTMLElement) {
        const tagName = e.target.tagName.toLowerCase();
        if (tagName !== 'input' && tagName !== 'textarea' && !e.target.isContentEditable) {
          e.preventDefault();
          setIsPlaying((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTrackVolumeChange = (trackId: string, volume: number) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, volume } : t))
    );
  };

  const handleTrackMuteToggle = (trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, muted: !t.muted } : t))
    );
  };

  const handleTrackSoloToggle = (trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, solo: !t.solo } : t))
    );
  };

  const handleTrackNameChange = (trackId: string, newName: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, name: newName } : t))
    );
  };

  const handleTrackColorChange = (trackId: string, color: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, color } : t))
    );
  };

  const handleSectionClick = (markerIndex: number) => {
    if (!song) return;
    
    const marker = song.markers[markerIndex];
    const nextMarker = song.markers[markerIndex + 1];
    
    const sectionStart = marker.time;
    const sectionEnd = nextMarker ? nextMarker.time : song.duration;
    
    setLoopStart(sectionStart);
    setLoopEnd(sectionEnd);
    setLoopEnabled(true);
  };

  const startEditingTrackName = (trackId: string, currentName: string) => {
    setEditingTrackId(trackId);
    setTrackNameInput(currentName);
  };

  const finishEditingTrackName = () => {
    if (editingTrackId && trackNameInput.trim()) {
      handleTrackNameChange(editingTrackId, trackNameInput.trim());
    }
    setEditingTrackId(null);
    setTrackNameInput('');
  };

  // Sync scrolling between timeline and tracks
  const handleTimelineScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (tracksScrollRef.current) {
      tracksScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const handleTracksScroll = (e: React.UIEvent<HTMLDivElement>) => {
    // Sync horizontal scroll with timeline
    if (timelineScrollRef.current) {
      timelineScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
    // Sync vertical scroll with track labels
    if (trackLabelsScrollRef.current) {
      trackLabelsScrollRef.current.scrollTop = e.currentTarget.scrollTop;
    }
    // Force scrollbar to update
    setScrollUpdate(prev => prev + 1);
  };

  const handleWaveformMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!song) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const scrollLeft = e.currentTarget.scrollLeft || 0;
    const totalWidth = (containerWidth * zoom);
    const percentage = (x + scrollLeft) / totalWidth;
    const time = percentage * song.duration;
    
    setIsDragging(true);
    setDragStartTime(time);
    setDragStartX(e.clientX);
    setHasDragged(false);
  };

  const handleWaveformMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || dragStartTime === null || dragStartX === null || !song) return;
    
    // Only consider it a drag if moved more than 5 pixels
    if (Math.abs(e.clientX - dragStartX) > 5) {
      setHasDragged(true);
      
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const scrollLeft = e.currentTarget.scrollLeft || 0;
      const totalWidth = (containerWidth * zoom);
      const percentage = Math.max(0, Math.min(1, (x + scrollLeft) / totalWidth));
      const rawTime = percentage * song.duration;
      const time = snapToMeasure(rawTime);
      const snappedDragStart = snapToMeasure(dragStartTime);
      
      if (time < snappedDragStart) {
        setLoopStart(time);
        setLoopEnd(snappedDragStart);
      } else {
        setLoopStart(snappedDragStart);
        setLoopEnd(time);
      }
    }
  };

  const handleWaveformMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hasDragged && dragStartTime !== null && song) {
      // This was a click, not a drag
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const scrollLeft = e.currentTarget.scrollLeft || 0;
      const totalWidth = (containerWidth * zoom);
      const percentage = (x + scrollLeft) / totalWidth;
      const clickTime = percentage * song.duration;
      const snappedClickTime = snapToMeasure(clickTime);
      
      // Check if click is outside loop region
      if (loopStart !== null && loopEnd !== null) {
        if (snappedClickTime < loopStart || snappedClickTime > loopEnd) {
          setLoopStart(null);
          setLoopEnd(null);
        }
      }
      
      // Seek to clicked position
      setCurrentTime(Math.max(0, Math.min(snappedClickTime, song.duration)));
    }
    
    setIsDragging(false);
    setDragStartTime(null);
    setDragStartX(null);
    setHasDragged(false);
  };

  const handleCreateProjectSubmit = (projectData: any) => {
    if (onCreateProject) {
      onCreateProject(projectData);
      setEditMode(true);
    }
  };

  const handleExportProject = () => {
    if (!song) return;
    
    // Create XML content
    const xml = generateProjectXML(song);
    
    // Create a mock download (in a real app, this would create an actual ZIP file)
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${song.title.replace(/\s+/g, '_')}_project.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Project exported! In a real implementation, this would create a ZIP file with audio files and XML metadata.');
  };

  const generateProjectXML = (song: Song): string => {
    const tempoChanges = song.tempoChanges || [{ time: 0, tempo: song.tempo, timeSignature: '4/4' }];
    const chordMarkers = song.chordMarkers || [];
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<project>
  <metadata>
    <title>${escapeXml(song.title)}</title>
    <artist>${escapeXml(song.artist)}</artist>
    <key>${escapeXml(song.key)}</key>
    <tempo>${song.tempo}</tempo>
    <duration>${song.duration}</duration>
    <version>${escapeXml(song.version)}</version>
  </metadata>
  <tracks>
${song.tracks.map(track => `    <track>
      <id>${escapeXml(track.id)}</id>
      <name>${escapeXml(track.name)}</name>
      <type>${escapeXml(track.type)}</type>
      <volume>${track.volume}</volume>
    </track>`).join('\n')}
  </tracks>
  <markers>
${song.markers.map(marker => `    <marker>
      <id>${escapeXml(marker.id)}</id>
      <time>${marker.time}</time>
      <label>${escapeXml(marker.label)}</label>
      <type>${escapeXml(marker.type)}</type>
    </marker>`).join('\n')}
  </markers>
  <tempoChanges>
${tempoChanges.map(tc => `    <tempoChange>
      <time>${tc.time}</time>
      <tempo>${tc.tempo}</tempo>
      <timeSignature>${escapeXml(tc.timeSignature)}</timeSignature>
    </tempoChange>`).join('\n')}
  </tempoChanges>
  <chords>
${chordMarkers.map(chord => `    <chord>
      <time>${chord.time}</time>
      <chord>${escapeXml(chord.chord)}</chord>${chord.customDiagram ? `
      <customDiagram>
        <guitar>
          <frets>${chord.customDiagram.guitar.frets.join(',')}</frets>
          <fingers>${chord.customDiagram.guitar.fingers.join(',')}</fingers>
          <startFret>${chord.customDiagram.guitar.startFret || 1}</startFret>
        </guitar>
        <ukulele>
          <frets>${chord.customDiagram.ukulele.frets.join(',')}</frets>
          <fingers>${chord.customDiagram.ukulele.fingers.join(',')}</fingers>
          <startFret>${chord.customDiagram.ukulele.startFret || 1}</startFret>
        </ukulele>
        <piano>
          <keys>${chord.customDiagram.piano.keys.join(',')}</keys>
        </piano>${chord.customDiagram.capo ? `
        <capo>${chord.customDiagram.capo}</capo>` : ''}
      </customDiagram>` : ''}
    </chord>`).join('\n')}
  </chords>
</project>`;
  };

  const escapeXml = (str: string): string => {
    return str
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const openTimelineEditor = (type: 'tempo' | 'timesig' | 'section' | 'chord') => {
    setEditorType(type);
    setTimelineEditorOpen(true);
  };

  const handleAddTimelineItem = (itemData: any) => {
    if (!song || !onSongUpdate) return;

    let updatedSong = { ...song };

    switch (editorType) {
      case 'tempo':
        updatedSong.tempoChanges = [...(song.tempoChanges || []), {
          time: itemData.time,
          tempo: itemData.tempo,
          timeSignature: song.tempoChanges?.[0]?.timeSignature || '4/4',
        }].sort((a, b) => a.time - b.time);
        break;
      case 'timesig':
        updatedSong.tempoChanges = [...(song.tempoChanges || []), {
          time: itemData.time,
          tempo: song.tempo,
          timeSignature: itemData.timeSignature,
        }].sort((a, b) => a.time - b.time);
        break;
      case 'section':
        updatedSong.markers = [...song.markers, {
          id: `marker-${Date.now()}`,
          time: itemData.time,
          label: itemData.label,
          type: itemData.type || 'section',
        }].sort((a, b) => a.time - b.time);
        break;
      case 'chord':
        updatedSong.chordMarkers = [...(song.chordMarkers || []), {
          time: itemData.time,
          chord: itemData.chord,
          customDiagram: itemData.customDiagram,
        }].sort((a, b) => a.time - b.time);
        break;
    }

    onSongUpdate(updatedSong);
  };

  if (!song) {
    return (
      <div className="flex flex-col h-full bg-gray-900 text-white">
        <div className="bg-gray-800 border-b border-gray-700 p-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-gray-700"
            onClick={onBack}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h2>Player</h2>
          <div className="w-8" />
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Music2 className="w-16 h-16 mx-auto text-gray-600" />
            <div>
              <h3 className="mb-2">No Project Loaded</h3>
              <p className="text-sm text-gray-400 mb-4">
                Create a new project to start editing
              </p>
              <Button onClick={() => setCreateProjectOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </div>
          </div>
        </div>

        <CreateProjectDialog
          open={createProjectOpen}
          onOpenChange={setCreateProjectOpen}
          onCreateProject={handleCreateProjectSubmit}
        />
      </div>
    );
  }

  const isAnySolo = tracks.some((t) => t.solo);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Get current tempo and time signature at given time
  const getCurrentTempoInfo = (time: number) => {
    const tempoChanges = song.tempoChanges || [{ time: 0, tempo: song.tempo, timeSignature: '4/4' }];
    
    // Find the active tempo change at this time
    let activeTempo = tempoChanges[0];
    for (let i = 0; i < tempoChanges.length; i++) {
      if (tempoChanges[i].time <= time) {
        activeTempo = tempoChanges[i];
      } else {
        break;
      }
    }
    
    return activeTempo;
  };

  // Calculate current measure number at given time
  const getCurrentMeasure = (time: number) => {
    const tempoChanges = song.tempoChanges || [{ time: 0, tempo: song.tempo, timeSignature: '4/4' }];
    
    let measureCount = 1; // Measures are 1-indexed
    let currentMeasureTime = 0;
    
    while (currentMeasureTime < time) {
      // Find active tempo/time sig for this measure
      const currentTempo = tempoChanges.find((tc, i) => {
        const nextTc = tempoChanges[i + 1];
        return tc.time <= currentMeasureTime && (!nextTc || nextTc.time > currentMeasureTime);
      }) || tempoChanges[0];
      
      const [numerator] = (currentTempo.timeSignature || '4/4').split('/').map(Number);
      const beatsPerMeasure = numerator;
      const secondsPerBeat = 60 / currentTempo.tempo;
      const measureDuration = beatsPerMeasure * secondsPerBeat;
      
      currentMeasureTime += measureDuration;
      
      // If we haven't passed the target time yet, increment measure
      if (currentMeasureTime <= time) {
        measureCount++;
      }
    }
    
    return measureCount;
  };

  // Snap time to nearest measure boundary
  const snapToMeasure = (time: number): number => {
    if (!snapEnabled) return time;
    
    const tempoChanges = song.tempoChanges || [{ time: 0, tempo: song.tempo, timeSignature: '4/4' }];
    
    // Build array of all measure boundaries
    const measureBoundaries: number[] = [];
    let currentMeasureTime = 0;
    
    while (currentMeasureTime <= song.duration) {
      measureBoundaries.push(currentMeasureTime);
      
      // Find active tempo/time sig for this measure
      const currentTempo = tempoChanges.find((tc, i) => {
        const nextTc = tempoChanges[i + 1];
        return tc.time <= currentMeasureTime && (!nextTc || nextTc.time > currentMeasureTime);
      }) || tempoChanges[0];
      
      const [numerator] = (currentTempo.timeSignature || '4/4').split('/').map(Number);
      const beatsPerMeasure = numerator;
      const secondsPerBeat = 60 / currentTempo.tempo;
      const measureDuration = beatsPerMeasure * secondsPerBeat;
      
      currentMeasureTime += measureDuration;
    }
    
    // Find nearest measure boundary
    let nearestBoundary = measureBoundaries[0];
    let minDistance = Math.abs(time - nearestBoundary);
    
    for (const boundary of measureBoundaries) {
      const distance = Math.abs(time - boundary);
      if (distance < minDistance) {
        minDistance = distance;
        nearestBoundary = boundary;
      }
    }
    
    return nearestBoundary;
  };

  // At zoom = 1 (100%), timeline width equals container width (entire song visible)
  // At zoom > 1, timeline width is proportionally larger
  const timelineWidth = containerWidth * zoom;
  const playheadPosition = (currentTime / song.duration) * timelineWidth;

  // Calculate dynamic time marker interval based on zoom level
  // At 100% zoom: show every 10 seconds
  // At higher zoom: show more frequent markers
  const getTimeInterval = () => {
    if (zoom >= 8) return 1; // Every 1 second at 800%+
    if (zoom >= 4) return 2; // Every 2 seconds at 400%+
    if (zoom >= 2) return 5; // Every 5 seconds at 200%+
    return 10; // Every 10 seconds at 100%
  };

  // Generate time markers with dynamic interval
  const timeInterval = getTimeInterval();
  const timeMarkers = [];
  for (let i = 0; i <= song.duration; i += timeInterval) {
    timeMarkers.push(i);
  }

  // Generate measure bars with dynamic subdivision based on zoom
  const tempoChanges = song.tempoChanges || [{ time: 0, tempo: song.tempo, timeSignature: '4/4' }];
  
  // Calculate measure skip interval based on zoom level
  // This prevents overlapping measure numbers at low zoom
  const getMeasureSkip = () => {
    if (zoom >= 4) return 1;  // Show every measure at 400%+
    if (zoom >= 2) return 2;  // Show every 2nd measure at 200%+
    if (zoom >= 1.5) return 4; // Show every 4th measure at 150%+
    return 8; // Show every 8th measure at 100%
  };
  
  const measureSkip = getMeasureSkip();
  const showBeats = zoom >= 6; // Show beats at 600%+
  
  const measureBars = [];
  let currentMeasureTime = 0;
  let measureCount = 0;
  
  while (currentMeasureTime < song.duration) {
    const currentTempo = tempoChanges.find((tc, i) => {
      const nextTc = tempoChanges[i + 1];
      return tc.time <= currentMeasureTime && (!nextTc || nextTc.time > currentMeasureTime);
    }) || tempoChanges[0];
    
    const [numerator, denominator] = (currentTempo.timeSignature || '4/4').split('/').map(Number);
    const beatsPerMeasure = numerator;
    const secondsPerBeat = 60 / currentTempo.tempo;
    const measureDuration = beatsPerMeasure * secondsPerBeat;
    
    if (showBeats) {
      // Show individual beats at very high zoom
      for (let beat = 0; beat < beatsPerMeasure; beat++) {
        const beatTime = currentMeasureTime + (beat * secondsPerBeat);
        if (beatTime <= song.duration) {
          measureBars.push({
            time: beatTime,
            measure: beat === 0 ? measureCount + 1 : null,
            beat: beat + 1,
            isBeat: beat > 0,
          });
        }
      }
    } else {
      // Show measures with dynamic skipping
      const shouldShow = measureCount % measureSkip === 0;
      measureBars.push({
        time: currentMeasureTime,
        measure: shouldShow ? measureCount + 1 : null,
        beat: 1,
        isBeat: false,
      });
    }
    
    currentMeasureTime += measureDuration;
    measureCount++;
  }

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + (timelineScrollRef.current?.scrollLeft || 0);
    const percentage = x / timelineWidth;
    const rawTime = percentage * song.duration;
    const snappedTime = snapToMeasure(rawTime);
    setCurrentTime(Math.max(0, Math.min(snappedTime, song.duration)));
  };

  const resetMix = () => {
    setTracks((prev) =>
      prev.map((t) => ({
        ...t,
        volume: 1.0, // Reset to 0dB (unity gain)
        muted: false,
        solo: false,
      }))
    );
  };

  const chordProgression = song.chordMarkers || [
    { time: 0, chord: 'C' },
    { time: 30, chord: 'F' },
    { time: 60, chord: 'G' },
  ];

  // Zoom centered on a specific time point
  const zoomCentered = (newZoom: number, focusTime: number) => {
    if (!timelineScrollRef.current) return;
    
    const clampedZoom = Math.max(1, Math.min(8, newZoom));
    
    // Get current scroll position and viewport width
    const scrollLeft = timelineScrollRef.current.scrollLeft;
    const viewportWidth = timelineScrollRef.current.clientWidth;
    
    // Calculate the current timeline width and the focus point's pixel position
    const currentTimelineWidth = containerWidth * zoom;
    const focusPixelPosition = (focusTime / song.duration) * currentTimelineWidth;
    
    // Calculate how far the focus point is from the left edge of the viewport
    const focusOffsetInViewport = focusPixelPosition - scrollLeft;
    
    // Update zoom
    setZoom(clampedZoom);
    
    // Calculate new timeline width and new pixel position of the focus point
    const newTimelineWidth = containerWidth * clampedZoom;
    const newFocusPixelPosition = (focusTime / song.duration) * newTimelineWidth;
    
    // Calculate new scroll position to keep the focus point at the same viewport position
    const newScrollLeft = newFocusPixelPosition - focusOffsetInViewport;
    
    // Apply new scroll position on next frame
    requestAnimationFrame(() => {
      if (timelineScrollRef.current) {
        timelineScrollRef.current.scrollLeft = Math.max(0, newScrollLeft);
      }
    });
  };

  // Zoom centered on playhead (for +/- buttons)
  const handleZoomInOnPlayhead = () => {
    zoomCentered(zoom + 0.25, currentTime);
  };

  const handleZoomOutOnPlayhead = () => {
    zoomCentered(zoom - 0.25, currentTime);
  };

  // Handle wheel zoom with CTRL key
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!e.ctrlKey && !e.metaKey) return;
    
    e.preventDefault();
    
    // Clear any pending wheel timeout
    if (wheelTimeoutRef.current) {
      clearTimeout(wheelTimeoutRef.current);
    }
    
    // Get mouse position relative to timeline
    const rect = timelineScrollRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const scrollLeft = timelineScrollRef.current?.scrollLeft || 0;
    
    // Calculate the time at the mouse position
    const currentTimelineWidth = containerWidth * zoom;
    const mousePixelPosition = scrollLeft + mouseX;
    const mouseTime = (mousePixelPosition / currentTimelineWidth) * song.duration;
    
    // Determine zoom direction (negative deltaY = zoom in)
    const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(1, Math.min(8, zoom + zoomDelta));
    
    // Apply zoom centered on mouse position
    zoomCentered(newZoom, mouseTime);
  };

  // Custom scrollbar handlers
  const getScrollPercentage = () => {
    if (!tracksScrollRef.current) return 0;
    const scrollLeft = tracksScrollRef.current.scrollLeft;
    const scrollWidth = tracksScrollRef.current.scrollWidth;
    const clientWidth = tracksScrollRef.current.clientWidth;
    const maxScroll = scrollWidth - clientWidth;
    return maxScroll > 0 ? scrollLeft / maxScroll : 0;
  };

  const getVisiblePercentage = () => {
    if (!tracksScrollRef.current) return 1;
    const scrollWidth = tracksScrollRef.current.scrollWidth;
    const clientWidth = tracksScrollRef.current.clientWidth;
    return Math.min(1, clientWidth / scrollWidth);
  };

  const handleScrollbarMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollbarRef.current || !tracksScrollRef.current) return;
    
    const rect = scrollbarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const scrollbarWidth = rect.width;
    const visiblePercentage = getVisiblePercentage();
    const thumbWidth = scrollbarWidth * visiblePercentage;
    const thumbStart = getScrollPercentage() * (scrollbarWidth - thumbWidth);
    
    // Check if clicked on thumb or track
    if (clickX >= thumbStart && clickX <= thumbStart + thumbWidth) {
      setIsDraggingScrollbar(true);
    } else {
      // Clicked on track, jump to position
      const newPercentage = Math.max(0, Math.min(1, (clickX - thumbWidth / 2) / (scrollbarWidth - thumbWidth)));
      const scrollWidth = tracksScrollRef.current.scrollWidth;
      const clientWidth = tracksScrollRef.current.clientWidth;
      const maxScroll = scrollWidth - clientWidth;
      tracksScrollRef.current.scrollLeft = newPercentage * maxScroll;
    }
  };

  const handleScrollbarMouseMove = (e: MouseEvent) => {
    if (!isDraggingScrollbar && !isDraggingLeftHandle && !isDraggingRightHandle) return;
    if (!scrollbarRef.current || !tracksScrollRef.current) return;

    if (isDraggingScrollbar) {
      const rect = scrollbarRef.current.getBoundingClientRect();
      const scrollbarWidth = rect.width;
      const visiblePercentage = getVisiblePercentage();
      const thumbWidth = scrollbarWidth * visiblePercentage;
      const clickX = e.clientX - rect.left;
      
      const newPercentage = Math.max(0, Math.min(1, (clickX - thumbWidth / 2) / (scrollbarWidth - thumbWidth)));
      const scrollWidth = tracksScrollRef.current.scrollWidth;
      const clientWidth = tracksScrollRef.current.clientWidth;
      const maxScroll = scrollWidth - clientWidth;
      tracksScrollRef.current.scrollLeft = newPercentage * maxScroll;
    } else if (isDraggingLeftHandle || isDraggingRightHandle) {
      if (!handleDragStart) return;
      
      const deltaX = e.clientX - handleDragStart.x;
      const rect = scrollbarRef.current.getBoundingClientRect();
      const scrollbarWidth = rect.width;
      
      // Convert pixel movement to zoom change
      // Dragging outward = zoom out, dragging inward = zoom in
      const direction = isDraggingRightHandle ? 1 : -1;
      const zoomDelta = (deltaX * direction) / scrollbarWidth * 4; // Sensitivity factor
      const newZoom = Math.max(1, Math.min(8, handleDragStart.zoom - zoomDelta));
      setZoom(newZoom);
    }
  };

  const handleScrollbarMouseUp = () => {
    setIsDraggingScrollbar(false);
    setIsDraggingLeftHandle(false);
    setIsDraggingRightHandle(false);
    setHandleDragStart(null);
  };

  useEffect(() => {
    if (isDraggingScrollbar || isDraggingLeftHandle || isDraggingRightHandle) {
      window.addEventListener('mousemove', handleScrollbarMouseMove);
      window.addEventListener('mouseup', handleScrollbarMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleScrollbarMouseMove);
        window.removeEventListener('mouseup', handleScrollbarMouseUp);
      };
    }
  }, [isDraggingScrollbar, isDraggingLeftHandle, isDraggingRightHandle, zoom]);

  const handleLeftHandleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingLeftHandle(true);
    setHandleDragStart({ x: e.clientX, zoom });
  };

  const handleRightHandleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingRightHandle(true);
    setHandleDragStart({ x: e.clientX, zoom });
  };

  // Vertical scrollbar handlers
  const getVerticalScrollPercentage = () => {
    if (!tracksScrollRef.current) return 0;
    const scrollTop = tracksScrollRef.current.scrollTop;
    const scrollHeight = tracksScrollRef.current.scrollHeight;
    const clientHeight = tracksScrollRef.current.clientHeight;
    const maxScroll = scrollHeight - clientHeight;
    return maxScroll > 0 ? scrollTop / maxScroll : 0;
  };

  const getVerticalVisiblePercentage = () => {
    if (!tracksScrollRef.current) return 1;
    const scrollHeight = tracksScrollRef.current.scrollHeight;
    const clientHeight = tracksScrollRef.current.clientHeight;
    return Math.min(1, clientHeight / scrollHeight);
  };

  const handleVerticalScrollbarMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!verticalScrollbarRef.current || !tracksScrollRef.current) return;
    
    const rect = verticalScrollbarRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const scrollbarHeight = rect.height;
    const visiblePercentage = getVerticalVisiblePercentage();
    const thumbHeight = scrollbarHeight * visiblePercentage;
    const thumbStart = getVerticalScrollPercentage() * (scrollbarHeight - thumbHeight);
    
    // Check if clicked on thumb or track
    if (clickY >= thumbStart && clickY <= thumbStart + thumbHeight) {
      setIsDraggingVerticalScrollbar(true);
    } else {
      // Clicked on track, jump to position
      const newPercentage = Math.max(0, Math.min(1, (clickY - thumbHeight / 2) / (scrollbarHeight - thumbHeight)));
      const scrollHeight = tracksScrollRef.current.scrollHeight;
      const clientHeight = tracksScrollRef.current.clientHeight;
      const maxScroll = scrollHeight - clientHeight;
      tracksScrollRef.current.scrollTop = newPercentage * maxScroll;
    }
  };

  const handleVerticalScrollbarMouseMove = (e: MouseEvent) => {
    if (!isDraggingVerticalScrollbar) return;
    if (!verticalScrollbarRef.current || !tracksScrollRef.current) return;

    const rect = verticalScrollbarRef.current.getBoundingClientRect();
    const scrollbarHeight = rect.height;
    const visiblePercentage = getVerticalVisiblePercentage();
    const thumbHeight = scrollbarHeight * visiblePercentage;
    const clickY = e.clientY - rect.top;
    
    const newPercentage = Math.max(0, Math.min(1, (clickY - thumbHeight / 2) / (scrollbarHeight - thumbHeight)));
    const scrollHeight = tracksScrollRef.current.scrollHeight;
    const clientHeight = tracksScrollRef.current.clientHeight;
    const maxScroll = scrollHeight - clientHeight;
    tracksScrollRef.current.scrollTop = newPercentage * maxScroll;
  };

  const handleVerticalScrollbarMouseUp = () => {
    setIsDraggingVerticalScrollbar(false);
  };

  useEffect(() => {
    if (isDraggingVerticalScrollbar) {
      window.addEventListener('mousemove', handleVerticalScrollbarMouseMove);
      window.addEventListener('mouseup', handleVerticalScrollbarMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleVerticalScrollbarMouseMove);
        window.removeEventListener('mouseup', handleVerticalScrollbarMouseUp);
      };
    }
  }, [isDraggingVerticalScrollbar]);

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header Bar - Song Info */}
      <div className="bg-gray-850 border-b border-gray-700 px-4 py-2.5 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white hover:bg-gray-700"
          onClick={onBack}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 bg-gray-600" />

        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-gray-400">Song:</span>{' '}
            <span>{song.title}</span>
          </div>
          <div>
            <span className="text-gray-400">Key:</span>{' '}
            <Badge variant="secondary" className="ml-1">{song.key}</Badge>
          </div>
          <div>
            <span className="text-gray-400">Tempo:</span>{' '}
            <Badge variant="secondary" className="ml-1">{song.tempo} BPM</Badge>
          </div>
        </div>
      </div>

      {/* Controls Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 p-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Sidebar Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 px-3 gap-2 ${
              sidebarVisible ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-white hover:bg-gray-700'
            }`}
            onClick={() => setSidebarVisible(!sidebarVisible)}
          >
            {sidebarVisible ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeft className="w-4 h-4" />
            )}
            Sidebar
          </Button>

          <Separator orientation="vertical" className="h-6 bg-gray-600" />

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-white bg-gray-700 hover:bg-gray-600"
              onClick={() => {
                setIsPlaying(false);
                setCurrentTime(0);
              }}
            >
              <Square className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-12 w-12 text-white ${
                isPlaying 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-green-800 hover:bg-green-700'
              }`}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-10 w-10 ${
                loopEnabled ? 'text-blue-400 bg-blue-900 hover:bg-blue-800' : 'text-white bg-gray-700 hover:bg-gray-600'
              }`}
              onClick={() => setLoopEnabled(!loopEnabled)}
            >
              <Repeat className="w-5 h-5" />
            </Button>
            
            {/* Metronome with volume dropdown */}
            <DropdownMenu>
              <div className="flex items-center gap-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-10 w-10 rounded-r-none ${
                    metronomeEnabled ? 'text-blue-400 bg-blue-900 hover:bg-blue-800' : 'text-white bg-gray-700 hover:bg-gray-600'
                  }`}
                  onClick={() => setMetronomeEnabled(!metronomeEnabled)}
                >
                  <Music2 className="w-5 h-5" />
                </Button>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-10 w-6 rounded-l-none px-1 ${
                      metronomeEnabled ? 'text-blue-400 bg-blue-900 hover:bg-blue-800' : 'text-white bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
              </div>
              <DropdownMenuContent className="w-64 p-4 bg-gray-800 border-gray-700">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-white">{t.metronomeVolume}</Label>
                    <span className="text-sm text-gray-400">{formatDb(gainToDb(metronomeVolume))} dB</span>
                  </div>
                  <Slider
                    value={[gainToSlider(metronomeVolume)]}
                    onValueChange={([value]) => setMetronomeVolume(sliderToGain(value))}
                    max={100}
                    step={0.1}
                    className="w-full"
                    onDoubleClick={() => {
                      setMetronomeVolume(0.5); // Reset to -6dB (default metronome level)
                    }}
                  />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Separator orientation="vertical" className="h-6 bg-gray-600" />

          <div className="flex items-center gap-3">
            <div className="text-sm tabular-nums bg-gray-700 px-3 py-1 rounded">
              {formatTime(currentTime)} / {formatTime(song.duration)}
            </div>
            <div className="text-sm bg-gray-700 px-3 py-1 rounded flex items-center gap-2">
              <span className="text-gray-400">Measure:</span>
              <span className="tabular-nums">{getCurrentMeasure(currentTime)}</span>
            </div>
            <div className="text-sm bg-gray-700 px-3 py-1 rounded flex items-center gap-2">
              <span className="text-gray-400">TS:</span>
              <span>{getCurrentTempoInfo(currentTime).timeSignature}</span>
            </div>
            <div className="text-sm bg-gray-700 px-3 py-1 rounded flex items-center gap-2">
              <span className="text-gray-400">BPM:</span>
              <span className="tabular-nums">{getCurrentTempoInfo(currentTime).tempo}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Snap to Measure Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 px-3 gap-2 ${
                snapEnabled ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-white hover:bg-gray-700'
              }`}
              onClick={() => setSnapEnabled(!snapEnabled)}
            >
              <Grid3x3 className="w-4 h-4" />
              Snap
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6 bg-gray-600" />
          
          <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-gray-700 gap-2"
                onClick={() => openTimelineEditor('section')}
              >
                <Plus className="w-4 h-4" />
                Section
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-gray-700 gap-2"
                onClick={() => openTimelineEditor('chord')}
              >
                <Plus className="w-4 h-4" />
                Chord
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-gray-700 gap-2"
                onClick={() => openTimelineEditor('tempo')}
              >
                <Plus className="w-4 h-4" />
                Tempo
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-gray-700 gap-2"
                onClick={() => openTimelineEditor('timesig')}
              >
                <Plus className="w-4 h-4" />
                Time Sig
              </Button>
              <Separator orientation="vertical" className="h-6 bg-gray-600" />
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-gray-700 gap-2"
                onClick={handleExportProject}
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
              {song.source === 'imported' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-400 hover:bg-gray-700 gap-2"
                  onClick={() => setEditMode(false)}
                >
                  <Edit className="w-4 h-4" />
                  Done Editing
                </Button>
              )}
            </>
          ) : (
            <>
              {onPerformanceMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-gray-700 gap-2"
                  onClick={onPerformanceMode}
                >
                  <Maximize2 className="w-4 h-4" />
                  Performance Mode
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-gray-700 gap-2"
                onClick={resetMix}
              >
                <RefreshCw className="w-4 h-4" />
                Reset Mix
              </Button>
            </>
          )}
          </div>
        </div>
      </div>

      {/* Main Timeline and Tracks */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Timeline Rows */}
        <div className="bg-gray-800 border-b border-gray-700 flex">
          {/* Timeline Labels */}
          {sidebarVisible && (
          <div className="w-64 bg-gray-800 border-r border-gray-700">
            <div className="h-7 bg-gray-750 border-b border-gray-700 flex items-center justify-end px-2 text-xs text-gray-400">
              Time
            </div>
            <div className="h-7 bg-gray-800 border-b border-gray-700 flex items-center justify-end px-2 text-xs text-gray-400">
              {showBeats ? 'Beats' : 'Measures'}
            </div>
            <div className="h-7 bg-gray-750 border-b border-gray-700 flex items-center justify-end px-2 text-xs text-gray-400">
              Tempo/TS
            </div>
            <div className="h-7 bg-gray-800 border-b border-gray-700 flex items-center justify-end px-2 text-xs text-gray-400">
              Chords
            </div>
            <div className="h-8 bg-gray-750 border-b border-gray-700 flex items-center justify-end px-2 text-xs text-gray-400">
              Sections
            </div>
          </div>
          )}

          {/* Timeline Content */}
          <div
            ref={timelineScrollRef}
            className="flex-1 overflow-x-auto overflow-y-hidden hide-scrollbar"
            onScroll={handleTimelineScroll}
            onMouseDown={handleWaveformMouseDown}
            onMouseMove={handleWaveformMouseMove}
            onMouseUp={handleWaveformMouseUp}
            onMouseLeave={handleWaveformMouseUp}
            onWheel={handleWheel}
          >
            <div style={{ width: timelineWidth }} className="relative">
              {/* Time Row */}
              <div className="h-7 bg-gray-750 border-b border-gray-700 relative">
                {timeMarkers.map((time) => {
                  const position = (time / song.duration) * timelineWidth;
                  return (
                    <div
                      key={time}
                      className="absolute top-0 bottom-0 border-l border-gray-600"
                      style={{ left: position }}
                    >
                      <span className="absolute top-0.5 left-1 text-xs text-gray-500">
                        {formatTime(time)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Measure Bars Row */}
              <div className="h-7 bg-gray-800 border-b border-gray-700 relative">
                {measureBars.map((bar, i) => {
                  const position = (bar.time / song.duration) * timelineWidth;
                  // Skip rendering if no label to show (unless it's a beat marker)
                  if (!bar.measure && !bar.isBeat) return null;
                  
                  return (
                    <div
                      key={i}
                      className={`absolute top-0 bottom-0 border-l ${bar.isBeat ? 'border-gray-700' : 'border-gray-600'}`}
                      style={{ left: position }}
                    >
                      {bar.measure && (
                        <span className="absolute top-0.5 left-1 text-xs text-gray-500">
                          {bar.measure}
                        </span>
                      )}
                      {showBeats && bar.isBeat && (
                        <span className="absolute top-0.5 left-1 text-xs text-gray-600">
                          {bar.beat}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Tempo/Time Signature Row */}
              <div className="h-7 bg-gray-750 border-b border-gray-700 relative">
                {tempoChanges.map((change, i) => {
                  const position = (change.time / song.duration) * timelineWidth;
                  return (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0"
                      style={{ left: position }}
                    >
                      <Badge
                        variant="secondary"
                        className="absolute top-0.5 left-0 text-xs bg-purple-600 text-white"
                      >
                        {change.tempo} BPM · {change.timeSignature}
                      </Badge>
                    </div>
                  );
                })}
              </div>

              {/* Chords Row */}
              <div className="h-7 bg-gray-800 border-b border-gray-700 relative">
                {chordProgression.map((chord, i) => {
                  const position = (chord.time / song.duration) * timelineWidth;
                  return (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0"
                      style={{ left: position }}
                    >
                      <Badge
                        variant="secondary"
                        className="absolute top-0.5 left-0 text-xs bg-blue-600 text-white cursor-pointer hover:bg-blue-700 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedChord({ 
                            chord: chord.chord,
                            customDiagram: (chord as any).customDiagram 
                          });
                        }}
                      >
                        {chord.chord}
                      </Badge>
                    </div>
                  );
                })}
              </div>

              {/* Sections Row */}
              <div className="h-8 bg-gray-750 border-b border-gray-700 relative">
                {song.markers.map((marker, i) => {
                  const position = (marker.time / song.duration) * timelineWidth;
                  const nextMarker = song.markers[i + 1];
                  const width = nextMarker
                    ? ((nextMarker.time - marker.time) / song.duration) * timelineWidth
                    : timelineWidth - position;

                  const colorMap: Record<string, string> = {
                    intro: 'bg-green-600',
                    verse: 'bg-blue-600',
                    chorus: 'bg-red-600',
                    bridge: 'bg-yellow-600',
                    outro: 'bg-purple-600',
                  };

                  return (
                    <div
                      key={marker.id}
                      className={`absolute top-1 bottom-1 ${colorMap[marker.type] || 'bg-gray-600'} bg-opacity-30 border-l-2 ${colorMap[marker.type]?.replace('bg-', 'border-') || 'border-gray-600'} cursor-pointer hover:bg-opacity-50 transition-all`}
                      style={{ left: position, width }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSectionClick(i);
                      }}
                    >
                      <span className="absolute top-1 left-2 text-xs pointer-events-none">
                        {marker.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Loop region highlight in timeline */}
              {loopStart !== null && loopEnd !== null && (
                <>
                  <div
                    className="absolute top-0 bottom-0 bg-yellow-300 opacity-10 pointer-events-none z-5"
                    style={{ 
                      left: (loopStart / song.duration) * timelineWidth,
                      width: ((loopEnd - loopStart) / song.duration) * timelineWidth
                    }}
                  />
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-yellow-500 pointer-events-none z-5"
                    style={{ left: (loopStart / song.duration) * timelineWidth }}
                  />
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-yellow-500 pointer-events-none z-5"
                    style={{ left: (loopEnd / song.duration) * timelineWidth }}
                  />
                </>
              )}

              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-10"
                style={{ left: playheadPosition }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent border-t-red-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Tracks */}
        <div className="flex-1 flex overflow-hidden">
          {/* Track Labels */}
          {sidebarVisible && (
          <div 
            ref={trackLabelsScrollRef}
            className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-hidden"
            style={{ overflowY: 'hidden' }}
          >
            {tracks.map((track) => (
              <div 
                key={track.id} 
                className="h-24 border-b border-gray-700 flex"
                style={{ backgroundColor: hexToRgba(track.color || '#60a5fa', 0.3) }}
              >
                {/* Color indicator */}
                <div 
                  className="w-1 flex-shrink-0"
                  style={{ backgroundColor: track.color || '#60a5fa' }}
                />
                <div className="flex-1 p-2.5 flex flex-col justify-center gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                  {editMode && (
                    <div
                      className="w-4 h-4 rounded border-2 border-gray-500 cursor-pointer flex-shrink-0"
                      style={{ backgroundColor: track.color || '#60a5fa' }}
                      onClick={() => {
                        const colors = ['#60a5fa', '#ef4444', '#22c55e', '#f59e0b', '#a855f7', '#ec4899', '#14b8a6', '#f97316'];
                        const currentIndex = colors.indexOf(track.color || '#60a5fa');
                        const nextColor = colors[(currentIndex + 1) % colors.length];
                        handleTrackColorChange(track.id, nextColor);
                      }}
                    />
                  )}
                  {editMode && editingTrackId === track.id ? (
                    <input
                      type="text"
                      value={trackNameInput}
                      onChange={(e) => setTrackNameInput(e.target.value)}
                      onBlur={finishEditingTrackName}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') finishEditingTrackName();
                        if (e.key === 'Escape') {
                          setEditingTrackId(null);
                          setTrackNameInput('');
                        }
                      }}
                      autoFocus
                      className="flex-1 bg-gray-700 text-white text-sm px-2 py-1 rounded border border-blue-500 outline-none min-w-0"
                    />
                  ) : (
                    <span className="text-sm truncate flex-1 min-w-0">{track.name}</span>
                  )}
                  {editMode && editingTrackId !== track.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-gray-700 flex-shrink-0"
                      onClick={() => startEditingTrackName(track.id, track.name)}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-7 px-2.5 flex-shrink-0 ${
                      track.muted ? 'bg-red-600 hover:bg-red-700 text-white' : 'hover:bg-gray-700 text-gray-300'
                    }`}
                    style={track.muted 
                      ? { boxShadow: `0 0 0 2px ${track.color || '#60a5fa'}` } 
                      : { border: `2px solid ${track.color || '#60a5fa'}` }
                    }
                    onClick={() => handleTrackMuteToggle(track.id)}
                  >
                    M
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-7 px-2.5 flex-shrink-0 ${
                      track.solo ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'hover:bg-gray-700 text-gray-300'
                    }`}
                    style={track.solo 
                      ? { boxShadow: `0 0 0 2px ${track.color || '#60a5fa'}` } 
                      : { border: `2px solid ${track.color || '#60a5fa'}` }
                    }
                    onClick={() => handleTrackSoloToggle(track.id)}
                  >
                    S
                  </Button>
                  <Slider
                    value={[gainToSlider(track.volume)]}
                    max={100}
                    step={0.1}
                    className="w-18 flex-shrink-0"
                    onValueChange={(v) => {
                      handleTrackVolumeChange(track.id, sliderToGain(v[0]));
                    }}
                    onDoubleClick={() => {
                      handleTrackVolumeChange(track.id, 1.0); // Reset to 0dB (unity gain)
                    }}
                  />
                  <span className="text-xs text-gray-400 w-12 text-right flex-shrink-0">{formatDb(gainToDb(track.volume))} dB</span>
                </div>
                </div>
              </div>
            ))}
          </div>
          )}

          {/* Track Waveforms */}
          <div
            ref={tracksScrollRef}
            className="flex-1 overflow-x-auto overflow-y-auto hide-scrollbar"
            onScroll={handleTracksScroll}
            onMouseDown={handleWaveformMouseDown}
            onMouseMove={handleWaveformMouseMove}
            onMouseUp={handleWaveformMouseUp}
            onMouseLeave={handleWaveformMouseUp}
            onWheel={handleWheel}
          >
            <div style={{ width: timelineWidth, minHeight: '100%' }} className="relative">
              {tracks.map((track, index) => (
                <div
                  key={track.id}
                  className="h-24 border-b border-gray-700 relative bg-gray-850"
                >
                  {/* Track Name Stripe (when sidebar hidden) */}
                  {!sidebarVisible && (
                    <div 
                      className="absolute top-0 left-0 right-0 h-6 flex items-center justify-center z-10"
                      style={{ backgroundColor: hexToRgba(track.color || '#60a5fa', 0.8) }}
                    >
                      <span className="text-white text-sm font-bold">{track.name}</span>
                    </div>
                  )}
                  
                  {/* Waveform */}
                  <svg className="w-full h-full" preserveAspectRatio="none">
                    <path
                      d={generateWaveformPath(track.waveformData, timelineWidth, 96)}
                      fill={
                        isAnySolo
                          ? track.solo
                            ? (track.color || '#60a5fa')
                            : '#4b5563'
                          : track.muted
                          ? '#4b5563'
                          : (track.color || '#60a5fa')
                      }
                      stroke="none"
                      opacity={
                        isAnySolo
                          ? track.solo
                            ? 0.7
                            : 0.3
                          : track.muted
                          ? 0.3
                          : 0.7
                      }
                    />
                  </svg>
                  
                  {/* Loop region highlight for this track */}
                  {loopStart !== null && loopEnd !== null && (
                    <div
                      className="absolute top-0 bottom-0 bg-yellow-300 opacity-20 pointer-events-none"
                      style={{ 
                        left: (loopStart / song.duration) * timelineWidth,
                        width: ((loopEnd - loopStart) / song.duration) * timelineWidth
                      }}
                    />
                  )}
                  
                  {/* Playhead indicator for this track */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none"
                    style={{ left: playheadPosition }}
                  />
                </div>
              ))}
              
              {/* Loop start marker */}
              {loopStart !== null && (
                <div
                  className="absolute top-0 w-1 bg-yellow-500 pointer-events-none z-10"
                  style={{ 
                    left: (loopStart / song.duration) * timelineWidth,
                    height: tracks.length * 96
                  }}
                />
              )}
              
              {/* Loop end marker */}
              {loopEnd !== null && (
                <div
                  className="absolute top-0 w-1 bg-yellow-500 pointer-events-none z-10"
                  style={{ 
                    left: (loopEnd / song.duration) * timelineWidth,
                    height: tracks.length * 96
                  }}
                />
              )}
              
              {/* Global playhead line extending through all tracks */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-20"
                style={{ 
                  left: playheadPosition
                }}
              />
            </div>
          </div>

          {/* Vertical Scrollbar */}
          <div className="w-5 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="flex-1 px-1 py-3">
              <div
                ref={verticalScrollbarRef}
                className="relative w-full h-full bg-gray-700 rounded cursor-pointer"
                onMouseDown={handleVerticalScrollbarMouseDown}
              >
                {/* Scrollbar Thumb */}
                <div
                  className="absolute left-0 w-full bg-blue-600 rounded hover:bg-blue-500"
                  style={{
                    top: `${getVerticalScrollPercentage() * (100 - getVerticalVisiblePercentage() * 100)}%`,
                    height: `${getVerticalVisiblePercentage() * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar with Zoom Controls */}
      <div className="bg-gray-800 border-t border-gray-700 flex items-center h-5">
        {/* Zoom Controls - Aligned with sidebar */}
        <div className={`${sidebarVisible ? 'w-64 border-r' : 'w-auto'} border-gray-700 flex items-center justify-center gap-2 px-3`}>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-white hover:bg-gray-700"
            onClick={() => setZoom(Math.max(1, zoom - 0.5))}
            disabled={zoom <= 1}
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <span className="text-xs text-gray-400 w-14 text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-white hover:bg-gray-700"
            onClick={() => setZoom(Math.min(8, zoom + 0.5))}
            disabled={zoom >= 8}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Custom Scrollbar */}
        <div className="flex-1 px-3 py-1">
          <div
            ref={scrollbarRef}
            className="relative h-3 bg-gray-700 rounded cursor-pointer"
            onMouseDown={handleScrollbarMouseDown}
          >
            {/* Scrollbar Thumb with Handles */}
            <div
              className="absolute top-0 h-full bg-blue-600 rounded flex items-center justify-between"
              style={{
                left: `${getScrollPercentage() * (100 - getVisiblePercentage() * 100)}%`,
                width: `${getVisiblePercentage() * 100}%`,
              }}
            >
              {/* Left Handle */}
              <div
                className="w-2.5 h-full bg-blue-400 hover:bg-blue-300 cursor-ew-resize rounded-l flex items-center justify-center"
                onMouseDown={handleLeftHandleMouseDown}
              >
                <div className="w-0.5 h-1.5 bg-white rounded" />
              </div>
              
              {/* Right Handle */}
              <div
                className="w-2.5 h-full bg-blue-400 hover:bg-blue-300 cursor-ew-resize rounded-r flex items-center justify-center"
                onMouseDown={handleRightHandleMouseDown}
              >
                <div className="w-0.5 h-1.5 bg-white rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreateProjectDialog
        open={createProjectOpen}
        onOpenChange={setCreateProjectOpen}
        onCreateProject={handleCreateProjectSubmit}
      />

      <TimelineEditorDialog
        open={timelineEditorOpen}
        onOpenChange={setTimelineEditorOpen}
        type={editorType}
        currentTime={currentTime}
        onAdd={handleAddTimelineItem}
      />

      {selectedChord && (
        <ChordDiagram
          chord={selectedChord.chord}
          isOpen={!!selectedChord}
          onClose={() => setSelectedChord(null)}
          customDiagram={selectedChord.customDiagram}
        />
      )}
    </div>
  );
}

function generateWaveformPath(data: number[], width: number, height: number): string {
  const step = width / data.length;
  const centerY = height / 2;

  let path = `M 0 ${centerY}`;

  data.forEach((value, i) => {
    const x = i * step;
    const y = centerY - (value * centerY);
    path += ` L ${x} ${y}`;
  });

  // Mirror for bottom half
  for (let i = data.length - 1; i >= 0; i--) {
    const x = i * step;
    const y = centerY + (data[i] * centerY);
    path += ` L ${x} ${y}`;
  }

  path += ' Z';
  return path;
}
