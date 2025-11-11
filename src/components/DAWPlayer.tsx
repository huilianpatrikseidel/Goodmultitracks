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
  Settings,
  Sliders,
  Layers,
  Keyboard,
  Pin,
  Save,
  GripVertical,
  StickyNote,
  Wand2,
  X,
} from 'lucide-react';
import { PlayerViewSettings } from './PlayerViewSettings';
import { TrackTagSelector } from './TrackTagSelector';
import { PlaybackControls } from './PlaybackControls';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { MixPresetsManager } from './MixPresetsManager';
import { MixerDock } from './MixerDock';
import { NotesPanel } from './NotesPanel';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Input } from './ui/input';
import { getWarpedTime as utilsGetWarpedTime, parseTimeInput, calculateLocalBPM, getAdjacentMarkers, generateDynamicTempos, audioTimeToGridTime } from '../lib/warpUtils';

import { Badge } from './ui/badge';
import { Song, AudioTrack, SectionMarker, TempoChange, ChordMarker, MixPreset, TrackTag, WarpMarker } from '../types';
import { Separator } from './ui/separator';
import { CreateProjectDialog } from './CreateProjectDialog';
import { TimelineEditorDialog } from './TimelineEditorDialog';
import { ChordDiagram } from './ChordDiagram';
import { TrackNotesDialog } from './TrackNotesDialog'; // << IMPORTADO
import { gainToDb, gainToSlider, sliderToGain, formatDb, parseDbInput, hexToRgba } from '../lib/audioUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { Label } from './ui/label';
import { playMetronomeClick, resumeAudioContext, getMainBeats, parseSubdivision, getSubdivisionInfo } from '../lib/metronome';
import { useLanguage } from '../lib/LanguageContext';

interface DAWPlayerProps {
  song: Song | null;
  onSongUpdate?: (song: Song) => void;
  onPerformanceMode?: () => void;
  onBack: () => void;
  onCreateProject?: (projectData: any) => void;
}

// Paleta de cores predefinida
const PRESET_COLORS = [
  '#60a5fa', '#ef4444', '#22c55e', '#f59e0b', '#a855f7', '#ec4899', '#14b8a6', '#f97316',
  '#84cc16', '#0ea5e9', '#d946ef', '#f43f5e', '#64748b', '#78716c', '#facc15', '#3b82f6',
];

// << FUNÇÃO ADICIONADA (copiada de PlaybackControls.tsx) >>
// Helper function to transpose key
const transposeKey = (key: string, semitones: number): string => {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const flatNotes = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  
  // Parse key (e.g., "Cm" -> "C" + "m")
  const isFlat = key.includes('b');
  const noteList = isFlat ? flatNotes : notes;
  const rootNote = key.match(/^[A-G][#b]?/)?.[0] || 'C';
  const suffix = key.replace(rootNote, '');
  
  let index = noteList.indexOf(rootNote);
  if (index === -1) {
    // Try to find in the other list
    index = (isFlat ? notes : flatNotes).indexOf(rootNote);
    if (index === -1) return key; // Return original if not found
  }
  
  const newIndex = (index + semitones + 12) % 12;
  return noteList[newIndex] + suffix;
};

// << NOVO COMPONENTE INTERNO >>
const RulerHandle: React.FC<{
  rulerId: string;
  onDragStart: (e: React.DragEvent, rulerId: string) => void;
}> = ({ rulerId, onDragStart }) => (
  <div
    draggable
    onDragStart={(e) => onDragStart(e, rulerId)}
    className="absolute left-1 top-1/2 -translate-y-1/2 p-1 cursor-grab active:cursor-grabbing opacity-30 hover:opacity-100 transition-opacity"
  >
    <GripVertical className="w-4 h-4 text-gray-400" />
  </div>
);

const RulerDropTarget: React.FC<{
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
}> = ({ onDrop, onDragOver }) => (
  <div
    className="absolute inset-0"
    onDrop={onDrop}
    onDragOver={onDragOver}
  />
);

// << REATORAÇÃO: Centralizando a lista de IDs de réguas >>
const ALL_RULER_IDS = ['time', 'measures', 'sections', 'chords', 'tempo'];


export function DAWPlayer({ song, onSongUpdate, onPerformanceMode, onBack, onCreateProject }: DAWPlayerProps) {
  const { t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [gridTime, setGridTime] = useState(0);
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
  const [isDraggingWarpMarker, setIsDraggingWarpMarker] = useState(false);
  const [draggedWarpMarkerId, setDraggedWarpMarkerId] = useState<string | null>(null);
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [mixerVisible, setMixerVisible] = useState(true);
  const [mixerDockVisible, setMixerDockVisible] = useState(false);
  const [mixPresetsPopoverOpen, setMixPresetsPopoverOpen] = useState(false);
  const [isDraggingScrollbar, setIsDraggingScrollbar] = useState(false);
  const [isDraggingLeftHandle, setIsDraggingLeftHandle] = useState(false);
  const [isDraggingRightHandle, setIsDraggingRightHandle] = useState(false);
  const [handleDragStart, setHandleDragStart] = useState<{ x: number; zoom: number } | null>(null);
  const [scrollUpdate, setScrollUpdate] = useState(0);
  const [isDraggingVerticalScrollbar, setIsDraggingVerticalScrollbar] = useState(false);
  const [selectedChord, setSelectedChord] = useState<{ chord: string; customDiagram?: any } | null>(null);
  const [editingChordMarker, setEditingChordMarker] = useState<ChordMarker | null>(null);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [warpModeEnabled, setWarpModeEnabled] = useState(false);
  const [warpMarkers, setWarpMarkers] = useState<WarpMarker[]>(song?.warpMarkers || []);
  const [dynamicTempos, setDynamicTempos] = useState<Array<{ time: number; tempo: number }>>([]);
  const [hoveredWarpMarkerId, setHoveredWarpMarkerId] = useState<string | null>(null);
    const [editingWarpMarkerId, setEditingWarpMarkerId] = useState<string | null>(null);
    const [editingSourceInput, setEditingSourceInput] = useState('');
    const [editingGridInput, setEditingGridInput] = useState('');

    // Autofocus and ESC-to-cancel for inline warp editor
    useEffect(() => {
      if (!editingWarpMarkerId) return;

      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setEditingWarpMarkerId(null);
        }
      };

      window.addEventListener('keydown', handler);

      // Focus source input if present
      setTimeout(() => {
        try {
          const el = document.getElementById(`warp-src-${editingWarpMarkerId}`) as HTMLInputElement | null;
          if (el) el.focus();
        } catch (err) {
          // ignore
        }
      }, 0);

      return () => window.removeEventListener('keydown', handler);
    }, [editingWarpMarkerId]);
  
  // Mix presets state
  const [mixPresets, setMixPresets] = useState<MixPreset[]>([]);
  const [pinnedTracks, setPinnedTracks] = useState<Set<string>>(new Set());

  // Notes panel state
  const [notesPanelVisible, setNotesPanelVisible] = useState(false);

  // Metronome state
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const [metronomeVolume, setMetronomeVolume] = useState(0.5); // Stored as linear gain
  const lastBeatRef = useRef<number>(0);

  // Track notes state
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [selectedTrackForNotes, setSelectedTrackForNotes] = useState<AudioTrack | null>(null);

  // Open notes dialog when track is selected
  useEffect(() => {
    if (selectedTrackForNotes) {
      setNotesDialogOpen(true);
    }
  }, [selectedTrackForNotes]);

  // View settings with localStorage persistence
  const [trackHeight, setTrackHeight] = useState<'small' | 'medium' | 'large'>(() => {
    const saved = localStorage.getItem('goodmultitracks_track_height');
    return (saved as 'small' | 'medium' | 'large') || 'medium';
  });
  const [rulerOrder, setRulerOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('goodmultitracks_ruler_order');
    return saved ? JSON.parse(saved) : ALL_RULER_IDS; // Ordem padrão
  });
  const [rulerVisibility, setRulerVisibility] = useState<Record<string, boolean>>(() => {
    const visibility: Record<string, boolean> = {};
    // << CORREÇÃO: Usar a lista completa de IDs para inicializar a visibilidade >>
    ALL_RULER_IDS.forEach(id => {
      // Check for migration from old naming conventions
      let saved = localStorage.getItem(`goodmultitracks_show_${id}_ruler`);
      
      // Migrate old names if they exist
      if (saved === null) {
        if (id === 'measures') {
          saved = localStorage.getItem('goodmultitracks_show_timesig_ruler');
          if (saved !== null) {
            localStorage.setItem('goodmultitracks_show_measures_ruler', saved);
            localStorage.removeItem('goodmultitracks_show_timesig_ruler');
          }
        } else if (id === 'sections') {
          saved = localStorage.getItem('goodmultitracks_show_section_ruler');
          if (saved !== null) {
            localStorage.setItem('goodmultitracks_show_sections_ruler', saved);
            localStorage.removeItem('goodmultitracks_show_section_ruler');
          }
        } else if (id === 'chords') {
          saved = localStorage.getItem('goodmultitracks_show_chord_ruler');
          if (saved !== null) {
            localStorage.setItem('goodmultitracks_show_chords_ruler', saved);
            localStorage.removeItem('goodmultitracks_show_chord_ruler');
          }
        }
      }
      
      // Default to true if not found
      visibility[id] = saved === null ? true : saved === 'true';
    });
    return visibility;
  });


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
  }, [tracks, song, onSongUpdate]);

  // Save view settings to localStorage
  useEffect(() => {
    localStorage.setItem('goodmultitracks_track_height', trackHeight);
  }, [trackHeight]);

  useEffect(() => {
    localStorage.setItem('goodmultitracks_ruler_order', JSON.stringify(rulerOrder));
  }, [rulerOrder]);

  // << CORREÇÃO: Salvar visibilidade no localStorage >>
  const handleRulerVisibilityChange = (newVisibility: Record<string, boolean>) => {
    setRulerVisibility(newVisibility);
    Object.entries(newVisibility).forEach(([id, visible]) => {
      localStorage.setItem(`goodmultitracks_show_${id}_ruler`, String(visible));
    });
  };

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

  // << NOVAS FUNÇÕES PARA DRAG-AND-DROP DAS RÉGUAS >>
  const handleRulerDragStart = (e: React.DragEvent, rulerId: string) => {
    e.dataTransfer.setData('text/plain', rulerId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleRulerDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleRulerDrop = (e: React.DragEvent, dropTargetRulerId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === dropTargetRulerId) {
      return;
    }

    const currentOrder = [...rulerOrder];
    const draggedIndex = currentOrder.indexOf(draggedId);
    const dropIndex = currentOrder.indexOf(dropTargetRulerId);

    if (draggedIndex === -1 || dropIndex === -1) return;

    // Remove o item arrastado e o insere na nova posição
    const [draggedItem] = currentOrder.splice(draggedIndex, 1);
    currentOrder.splice(dropIndex, 0, draggedItem);

    // Atualiza o estado
    setRulerOrder(currentOrder);
    localStorage.setItem('goodmultitracks_ruler_order', JSON.stringify(currentOrder));
  };


  const getWarpedTime = (currentGridTime: number): number => {
    return utilsGetWarpedTime(currentGridTime, warpMarkers, warpModeEnabled);
  };

  // Generate dynamic tempos from warp markers and update the song's tempo map
  // This implements "Warp Grid" mode.
  useEffect(() => {
    if (!song || !onSongUpdate) return;

    const originalTempoChanges = song.tempoChanges?.filter(tc => !tc.hidden) || [];

    if (warpModeEnabled && warpMarkers.length >= 2) {
      const baseBPM = song.tempo || 120;
      const generatedTempos = generateDynamicTempos(warpMarkers, baseBPM);

      // Mark generated tempos as hidden
      const hiddenGeneratedTempos = generatedTempos.map(t => ({ ...t, hidden: true }));

      // Combine original (non-hidden) tempos with new hidden ones
      const newTempoMap = [...originalTempoChanges, ...hiddenGeneratedTempos].sort((a, b) => a.time - b.time);

      // Update song state if changed
      if (JSON.stringify(newTempoMap) !== JSON.stringify(song.tempoChanges)) {
        onSongUpdate({ ...song, tempoChanges: newTempoMap });
      }
      setDynamicTempos(newTempoMap);
    } else {
      // When warp is disabled or not enough markers, revert to original tempos
      if (JSON.stringify(originalTempoChanges) !== JSON.stringify(song.tempoChanges)) {
        onSongUpdate({ ...song, tempoChanges: originalTempoChanges });
      }
      setDynamicTempos(originalTempoChanges);
    }
  }, [warpModeEnabled, warpMarkers, song, onSongUpdate]);

  // Simulate playback with advanced metronome and tempo curves
  useEffect(() => {
    if (!isPlaying || !song) return;

    const interval = setInterval(() => {
      // Warp Grid Mode: currentTime (audio) advances linearly.
      // gridTime is calculated from currentTime based on the (potentially dynamic) tempo map.
      
      setCurrentTime((prevCurrentTime) => {
        // Get current tempo info (with tempo curve interpolation)
        const getCurrentTempo = (time: number): number => {
          const tempoChanges = dynamicTempos.length > 0 ? dynamicTempos : (song.tempoChanges || [{ time: 0, tempo: song.tempo, timeSignature: '4/4' }]);
          
          // Find active tempo change
          let activeChange = tempoChanges[0];
          for (const tc of tempoChanges) {
            if (tc.time <= time) {
              activeChange = tc;
            } else {
              break;
            }
          }
          
          // Check if there's a tempo curve active
          if (activeChange.curve && time >= activeChange.time && time <= activeChange.curve.targetTime) {
            const startTempo = activeChange.tempo;
            const endTempo = activeChange.curve.targetTempo;
            const duration = activeChange.curve.targetTime - activeChange.time;
            const progress = (time - activeChange.time) / duration;
            
            if (activeChange.curve.type === 'linear') {
              // Linear interpolation
              return startTempo + (endTempo - startTempo) * progress;
            } else if (activeChange.curve.type === 'exponential') {
              // Exponential interpolation (ease-out)
              const easedProgress = 1 - Math.pow(1 - progress, 2);
              return startTempo + (endTempo - startTempo) * easedProgress;
            }
          }
          
          return activeChange.tempo;
        };
        
        const currentBaseTempo = getCurrentTempo(prevCurrentTime);
        const actualTempo = currentBaseTempo * (tempo / 100);
        
        // Advance currentTime (audio time) linearly
        const newCurrentTime = prevCurrentTime + (0.1 * tempo / 100);

        // Calculate gridTime from the new audio time using the dynamic tempo map
        const allTempos = dynamicTempos.length > 0 ? dynamicTempos : (song.tempoChanges || [{ time: 0, tempo: song.tempo }]);
        const newGridTime = audioTimeToGridTime(newCurrentTime, allTempos, song.tempo);
        setGridTime(newGridTime);

        const endPoint = loopEnabled && loopEnd !== null ? loopEnd : song.duration;
        const startPoint = loopEnabled && loopStart !== null ? loopStart : 0;

        // Advanced metronome logic (still based on grid time)
        if (metronomeEnabled) {
          const beatDuration = 60 / actualTempo;
          const currentBeat = Math.floor(newGridTime / beatDuration);

          // Play click if we've crossed to a new beat
          if (currentBeat > lastBeatRef.current) {
            // Get current time signature and subdivision
            const tempoInfo = getCurrentTempoInfo(newGridTime);
            const timeSignature = tempoInfo.timeSignature || "4/4";
            const subdivision = tempoInfo.subdivision;
            
            // Calculate beats per measure (considering compound time and subdivisions)
            const mainBeats = getMainBeats(timeSignature, subdivision);
            
            let isStrongBeat = false;
            
            if (subdivision) {
              // Irregular time signature with subdivision pattern (e.g., "2+3" for 5/8)
              const groups = parseSubdivision(subdivision);
              const totalSubdivisions = groups.reduce((a, b) => a + b, 0);
              const beatInCycle = (currentBeat % totalSubdivisions) + 1;
              const subdivInfo = getSubdivisionInfo(beatInCycle, subdivision);
              isStrongBeat = subdivInfo.isGroupStart;
            } else {
              // Standard time signature
              const beatInMeasure = (currentBeat % mainBeats) + 1;
              isStrongBeat = beatInMeasure === 1;
            }

            playMetronomeClick(isStrongBeat, metronomeVolume);
            lastBeatRef.current = currentBeat;
          }
        }

        if (newCurrentTime >= endPoint) {
          if (loopEnabled) {
            lastBeatRef.current = 0; // Reset beat counter on loop
            const newGridTimeOnLoop = audioTimeToGridTime(startPoint, allTempos, song.tempo);
            setGridTime(newGridTimeOnLoop);
            return startPoint;
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
  }, [isPlaying, tempo, song, loopEnabled, loopStart, loopEnd, metronomeEnabled, metronomeVolume, dynamicTempos]);


  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we're in an input field
      if (e.target instanceof HTMLElement) {
        const tagName = e.target.tagName.toLowerCase();
        const isInputField = tagName === 'input' || tagName === 'textarea' || e.target.isContentEditable;
        
        // Spacebar: Play/Pause
        if (e.code === 'Space' && !isInputField) {
          e.preventDefault();
          setIsPlaying((prev) => !prev);
          return;
        }
        
        // Only allow other shortcuts when not in input field
        if (isInputField) return;
        
        // Home: Go to start
        if (e.code === 'Home') {
          e.preventDefault();
          setGridTime(0);
          setCurrentTime(getWarpedTime(0));
          return;
        }
        
        // End: Go to end
        if (e.code === 'End' && song) {
          e.preventDefault();
          setGridTime(song.duration);
          setCurrentTime(getWarpedTime(song.duration));
          return;
        }
        
        // L: Toggle loop
        if (e.code === 'KeyL' && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setLoopEnabled((prev) => !prev);
          return;
        }
        
        // M: Toggle metronome
        if (e.code === 'KeyM' && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setMetronomeEnabled((prev) => !prev);
          return;
        }
        
        // R: Reset to start
        if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setGridTime(0);
          setCurrentTime(0);
          return;
        }
        
        // +/=: Zoom in
        if ((e.code === 'Equal' || e.code === 'NumpadAdd') && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setZoom((prev) => Math.min(8, prev + 0.25));
          return;
        }
        
        // -: Zoom out
        if ((e.code === 'Minus' || e.code === 'NumpadSubtract') && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setZoom((prev) => Math.max(1, prev - 0.25));
          return;
        }
        
        // 0: Reset zoom
        if ((e.code === 'Digit0' || e.code === 'Numpad0') && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setZoom(1);
          return;
        }
        
        // Left Arrow: Jump backward (5 seconds)
        if (e.code === 'ArrowLeft' && !e.shiftKey) {
          e.preventDefault();
          setGridTime((prev) => {
            const newGridTime = Math.max(0, prev - 5);
            setCurrentTime(getWarpedTime(newGridTime));
            return newGridTime;
          });
          return;
        }
        
        // Right Arrow: Jump forward (5 seconds)
        if (e.code === 'ArrowRight' && !e.shiftKey) {
          e.preventDefault();
          setGridTime((prev) => {
            const newGridTime = song ? Math.min(song.duration, prev + 5) : prev;
            setCurrentTime(getWarpedTime(newGridTime));
            return newGridTime;
          });
          return;
        }
        
        // Shift+Left: Previous section
        if (e.code === 'ArrowLeft' && e.shiftKey && song) {
          e.preventDefault();
          const sorted = [...song.markers].sort((a, b) => a.time - b.time);
          const prevMarker = sorted.reverse().find((m) => m.time < gridTime - 1);
          if (prevMarker) {
            setGridTime(prevMarker.time);
            setCurrentTime(getWarpedTime(prevMarker.time));
          }
          return;
        }
        
        // Shift+Right: Next section
        if (e.code === 'ArrowRight' && e.shiftKey && song) {
          e.preventDefault();
          const sorted = [...song.markers].sort((a, b) => a.time - b.time);
          const nextMarker = sorted.find((m) => m.time > gridTime);
          if (nextMarker) {
            setGridTime(nextMarker.time);
            setCurrentTime(getWarpedTime(nextMarker.time));
          }
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [song, gridTime, getWarpedTime]);

  const handleTrackVolumeChange = (trackId: string, volume: number) => {
    // Ensure volume is a valid number to prevent crashes
    const safeVolume = isNaN(volume) || !isFinite(volume) ? 1.0 : Math.max(0, Math.min(10, volume));
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, volume: safeVolume } : t))
    );
  };

  const handleTrackMuteToggle = (trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          return { ...t, muted: !t.muted };
        }
        return t;
      })
    );
  };

  const handleTrackSoloToggle = (trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          return { ...t, solo: !t.solo };
        }
        return t;
      })
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

  const handleTrackTagChange = (trackId: string, tag: any) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, tag } : t))
    );
  };

  // << NOVA FUNÇÃO >>
  const handleSaveTrackNotes = (notes: string) => {
    if (!selectedTrackForNotes) return;
    setTracks(prev =>
      prev.map(t =>
        t.id === selectedTrackForNotes.id ? { ...t, notes } : t
      )
    );
    // Fechar o dialog (o onOpenChange fará isso)
  };

  const handleSectionClick = (markerIndex: number) => {
    if (!song) return;

    const marker = song.markers[markerIndex];
    const nextMarker = song.markers[markerIndex + 1];

    const sectionStart = marker.time;
    const sectionEnd = nextMarker ? nextMarker.time : song.duration;

    setGridTime(sectionStart);
    setCurrentTime(getWarpedTime(sectionStart));
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

  // Mix Presets Functions
  const handleSaveMixPreset = (name: string) => {
    const newPreset: MixPreset = {
      id: `preset-${Date.now()}`,
      name,
      tracks: tracks
        .filter(t => !pinnedTracks.has(t.id)) // Only save non-pinned tracks
        .map(t => ({
          trackId: t.id,
          volume: t.volume,
          muted: t.muted,
        })),
    };
    setMixPresets(prev => [...prev, newPreset]);
  };

  const handleLoadMixPreset = (presetId: string) => {
    const preset = mixPresets.find(p => p.id === presetId);
    if (!preset) return;

    setTracks(prev =>
      prev.map(track => {
        // Skip pinned tracks
        if (pinnedTracks.has(track.id)) return track;

        const presetTrack = preset.tracks.find(pt => pt.trackId === track.id);
        if (presetTrack) {
          return {
            ...track,
            volume: presetTrack.volume,
            muted: presetTrack.muted,
          };
        }
        return track;
      })
    );
  };

  const handleDeleteMixPreset = (presetId: string) => {
    setMixPresets(prev => prev.filter(p => p.id !== presetId));
  };

  const handleToggleTrackPin = (trackId: string) => {
    setPinnedTracks(prev => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }
      return next;
    });
  };

  // Song Notes Handlers
  const handleAddSongNote = (content: string, isPrivate: boolean, time?: number) => {
    if (!song) return;
    const newNote = {
      id: `note-${Date.now()}`,
      userId: 'current-user', // In a real app, this would come from auth
      content,
      time,
      isPrivate,
    };
    onSongUpdate({
      ...song,
      notes: [...(song.notes || []), newNote],
    });
  };

  const handleDeleteSongNote = (noteId: string) => {
    if (!song) return;
    onSongUpdate({
      ...song,
      notes: (song.notes || []).filter(n => n.id !== noteId),
    });
  };

  // Sync scrolling between timeline and tracks
  const handleTimelineScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    
    if (tracksScrollRef.current) {
      // Scroll the tracks area horizontally by translating the content
      const innerDiv = tracksScrollRef.current.querySelector('.tracks-content') as HTMLDivElement;
      if (innerDiv) {
        innerDiv.style.transform = `translateX(-${scrollLeft}px)`;
      }
    }
    // Force scrollbar to update
    setScrollUpdate(prev => prev + 1);
  };

  const handleTracksScroll = (e: React.UIEvent<HTMLDivElement>) => {
    // Only sync vertical scroll with track labels
    // Horizontal scroll is now controlled by timeline only
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
    const scrollLeft = timelineScrollRef.current?.scrollLeft || 0;
    const totalWidth = (containerWidth * zoom);
    const percentage = (x + scrollLeft) / totalWidth;
    const time = percentage * song.duration;

    if (warpModeEnabled) {
      const markerRadiusPx = 8; // Clickable radius around the handle
      let markerClicked = null;

      for (const marker of warpMarkers) {
        const gridPositionPx = (marker.gridTime / song.duration) * totalWidth;
        const distance = Math.abs((x + scrollLeft) - gridPositionPx);
        if (distance < markerRadiusPx) {
          markerClicked = marker;
          break;
        }
      }

      if (markerClicked) {
        // Start dragging existing marker
        setIsDraggingWarpMarker(true);
        setDraggedWarpMarkerId(markerClicked.id);
      } else {
        // Create a new marker and start dragging it (snap grid time to measure)
        const snapped = snapToMeasure(time);
        const newMarker: WarpMarker = {
          id: `warp-${Date.now()}`,
          sourceTime: time,
          gridTime: snapped,
        };
        setWarpMarkers(prev => [...prev, newMarker]);
        setIsDraggingWarpMarker(true);
        setDraggedWarpMarkerId(newMarker.id);
      }
      return; // Skip loop creation logic
    }


    setIsDragging(true);
    setDragStartTime(time);
    setDragStartX(e.clientX);
    setHasDragged(false);
  };

  const handleWaveformMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!song) return;

    if (isDraggingWarpMarker && draggedWarpMarkerId) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const scrollLeft = timelineScrollRef.current?.scrollLeft || 0;
      const totalWidth = (containerWidth * zoom);
      const percentage = Math.max(0, Math.min(1, (x + scrollLeft) / totalWidth));
      const rawTime = percentage * song.duration;
      const newGridTime = snapToMeasure(rawTime);

      setWarpMarkers(prev => prev.map(m => 
        m.id === draggedWarpMarkerId ? { ...m, gridTime: newGridTime } : m
      ));
      return; // Skip loop creation logic
    }

    if (!isDragging || dragStartTime === null || dragStartX === null) return;

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
    if (isDraggingWarpMarker) {
      setIsDraggingWarpMarker(false);
      setDraggedWarpMarkerId(null);
      // Persist changes
      if (song && onSongUpdate) {
        onSongUpdate({ ...song, warpMarkers });
      }
      return;
    }

    if (!hasDragged && dragStartTime !== null && song) {
      // This was a click, not a drag
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const scrollLeft = timelineScrollRef.current?.scrollLeft || 0;
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
      const newGridTime = Math.max(0, Math.min(snappedClickTime, song.duration));
      setGridTime(newGridTime);
      setCurrentTime(getWarpedTime(newGridTime));
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
    <version>${escapeXml(String(song.version))}</version>
  </metadata>
  <tracks>
${song.tracks.map(track => `    <track>
      <id>${escapeXml(track.id)}</id>
      <name>${escapeXml(track.name)}</name>
      <type>${escapeXml(track.type)}</type>
      <volume>${track.volume}</volume>
      <color>${escapeXml(track.color || '')}</color>
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
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
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
          timeSignature: song.tempoChanges?.find(tc => tc.time <= itemData.time)?.timeSignature || '4/4', // Mantém TS existente
        }].sort((a, b) => a.time - b.time);
        break;
      case 'timesig':
         // Atualiza ou adiciona a mudança de TS, mantendo o tempo existente
        const existingTempoIndex = updatedSong.tempoChanges?.findIndex(tc => tc.time === itemData.time) ?? -1;
        if (existingTempoIndex !== -1 && updatedSong.tempoChanges) {
          updatedSong.tempoChanges[existingTempoIndex].timeSignature = itemData.timeSignature;
        } else {
          updatedSong.tempoChanges = [...(updatedSong.tempoChanges || []), {
            time: itemData.time,
            tempo: getCurrentTempoInfo(itemData.time).tempo, // Pega o tempo atual naquele ponto
            timeSignature: itemData.timeSignature,
          }].sort((a, b) => a.time - b.time);
        }
        break;
      case 'section':
        updatedSong.markers = [...song.markers, {
          id: `marker-${Date.now()}`,
          time: itemData.time,
          label: itemData.label,
          type: itemData.type || 'custom',
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

const handleUpdateOrDeleteTimelineItem = (
    action: 'update' | 'delete',
    itemData: any,
    originalItem?: ChordMarker | SectionMarker | TempoChange
) => {
    if (!song || !onSongUpdate) return;

    let updatedSong = { ...song };
    const itemType = editorType;

    switch (itemType) {
        case 'chord':
            if (action === 'update' && originalItem) {
                updatedSong.chordMarkers = (updatedSong.chordMarkers || [])
                    .map(marker => marker.time === originalItem.time ? { ...itemData } : marker)
                    .sort((a, b) => a.time - b.time);
            } else if (action === 'delete' && originalItem) {
                 updatedSong.chordMarkers = (updatedSong.chordMarkers || [])
                    .filter(marker => marker.time !== originalItem.time)
                    .sort((a, b) => a.time - b.time);
            } else if (action === 'add') {
                 updatedSong.chordMarkers = [...(updatedSong.chordMarkers || []), {
                     time: itemData.time,
                     chord: itemData.chord,
                     customDiagram: itemData.customDiagram,
                 }].sort((a, b) => a.time - b.time);
            }
            break;
    }

    onSongUpdate(updatedSong);
    setEditingChordMarker(null);
    setTimelineEditorOpen(false);
};
  
  const isAnySolo = tracks.some((t) => t.solo);

  // Calculate track height based on setting
  const getTrackHeight = () => {
    switch (trackHeight) {
      case 'small':
        return 'h-16';
      case 'large':
        return 'h-32';
      default:
        return 'h-24';
    }
  };

  const getTrackHeightPx = () => {
    switch (trackHeight) {
      case 'small':
        return 64;
      case 'large':
        return 128;
      default:
        return 96;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const getCurrentTempoInfo = (time: number): TempoChange => {
    const tempoChanges = song.tempoChanges || [{ time: 0, tempo: song.tempo, timeSignature: '4/4' }];

    let activeTempo: TempoChange = {
        time: 0,
        tempo: song.tempo,
        timeSignature: '4/4'
    };
    for (let i = 0; i < tempoChanges.length; i++) {
      if (tempoChanges[i].time <= time) {
        activeTempo = tempoChanges[i];
      } else {
        break;
      }
    }

    return activeTempo;
  };

  // Get current time signature at given time
  const getCurrentTimeSignature = () => {
    return getCurrentTempoInfo(currentTime).timeSignature;
  };

  // Calculate current measure number at given time
  const getCurrentMeasure = () => {
    const time = currentTime;
    const tempoChanges = song.tempoChanges || [{ time: 0, tempo: song.tempo, timeSignature: '4/4' }];

    let measureCount = 1; // Measures are 1-indexed
    let currentMeasureTime = 0;

    while (currentMeasureTime < time && measureCount < 1000) { // Adicionado limite para evitar loop infinito
      // Find active tempo/time sig for this measure
      const currentTempo = tempoChanges.slice().reverse().find(tc => tc.time <= currentMeasureTime) || tempoChanges[0]; // Simplificado

      const [numerator] = (currentTempo.timeSignature || '4/4').split('/').map(Number);
      const beatsPerMeasure = numerator || 4; // Default para 4 se TS for inválido
      const secondsPerBeat = 60 / (currentTempo.tempo || song.tempo || 120); // Default robusto
      const measureDuration = beatsPerMeasure * secondsPerBeat;

      // Se a duração da medida for 0 ou inválida, interrompe
      if (measureDuration <= 0 || !isFinite(measureDuration)) {
        console.error("Invalid measure duration calculated:", measureDuration, currentTempo);
        break;
      }

      const nextMeasureTime = currentMeasureTime + measureDuration;

      // Se o tempo alvo está dentro desta medida
      if (time >= currentMeasureTime && time < nextMeasureTime) {
          break;
      }

      currentMeasureTime = nextMeasureTime;
      measureCount++;
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
    let measureCount = 0;

    while (currentMeasureTime <= song.duration + 1 && measureCount < 1000) { // Adicionado +1 e limite
      measureBoundaries.push(currentMeasureTime);

      // Find active tempo/time sig for this measure
      const currentTempo = tempoChanges.slice().reverse().find(tc => tc.time <= currentMeasureTime) || tempoChanges[0];

      const [numerator] = (currentTempo.timeSignature || '4/4').split('/').map(Number);
      const beatsPerMeasure = numerator || 4;
      const secondsPerBeat = 60 / (currentTempo.tempo || song.tempo || 120);
      const measureDuration = beatsPerMeasure * secondsPerBeat;

       if (measureDuration <= 0 || !isFinite(measureDuration)) {
         console.error("Invalid measure duration for snapping:", measureDuration, currentTempo);
         break;
       }

      currentMeasureTime += measureDuration;
      measureCount++;
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
  // Filter out hidden tempo markers when not in edit mode
  const allTempoChanges = song.tempoChanges || [{ time: 0, tempo: song.tempo, timeSignature: '4/4' }];
  const tempoChanges = editMode 
    ? allTempoChanges 
    : allTempoChanges.filter(tc => !tc.hidden);

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

  const measureBars: { time: number; measure: number | null; beat: number; isBeat: boolean; isCompound?: boolean; isIrregular?: boolean }[] = []; // Tipo explícito
  let currentMeasureTime = 0;
  let measureCount = 0;

  while (currentMeasureTime < song.duration && measureCount < 1000) { // Limite adicionado
    const currentTempo = tempoChanges.slice().reverse().find(tc => tc.time <= currentMeasureTime) || tempoChanges[0];

    const [numerator, denominator] = (currentTempo.timeSignature || '4/4').split('/').map(Number);
    const beatsPerMeasure = numerator || 4;
    const secondsPerBeat = 60 / (currentTempo.tempo || song.tempo || 120);
    const measureDuration = beatsPerMeasure * secondsPerBeat;

     if (measureDuration <= 0 || !isFinite(measureDuration)) {
       console.error("Invalid measure duration for bars:", measureDuration, currentTempo);
       break;
     }

    // Check if compound time (6/8, 9/8, 12/8)
    const isCompound = denominator === 8 && [6, 9, 12].includes(numerator);
    // Check if irregular (has subdivision pattern)
    const isIrregular = !!currentTempo.subdivision;

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
            isCompound,
            isIrregular,
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
        isCompound,
        isIrregular,
      });
    }

    currentMeasureTime += measureDuration;
    measureCount++;
  }


  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineScrollRef.current) return; // Verificação adicionada
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + (timelineScrollRef.current.scrollLeft || 0); // Correção scrollLeft
    const percentage = x / timelineWidth;
    const rawTime = percentage * song.duration;
    const snappedTime = snapToMeasure(rawTime);
    const newGridTime = Math.max(0, Math.min(snappedTime, song.duration));
    setGridTime(newGridTime);
    setCurrentTime(getWarpedTime(newGridTime));
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

  // Mix Presets Management
  const handleSavePreset = (name: string) => {
    if (!song || !onSongUpdate) return;
    
    const newPreset = {
      id: `preset-${Date.now()}`,
      name,
      tracks: tracks.map(t => ({
        trackId: t.id,
        volume: t.volume,
        muted: t.muted,
      })),
    };
    
    const updatedPresets = [...(song.mixPresets || []), newPreset];
    onSongUpdate({ ...song, mixPresets: updatedPresets });
  };

  const handleLoadPreset = (presetId: string) => {
    if (!song) return;
    
    const preset = song.mixPresets?.find(p => p.id === presetId);
    if (!preset) return;
    
    // Apply preset settings
    setTracks(prev => prev.map(track => {
      const presetTrack = preset.tracks.find(pt => pt.trackId === track.id);
      if (presetTrack) {
        return {
          ...track,
          volume: presetTrack.volume,
          muted: presetTrack.muted,
        };
      }
      return track;
    }));
    
    // << IMPLEMENTAÇÃO (FEATURE 4.1): LÓGICA DE PIN DESCOMENTADA >>
    // Track Pinning: Move main instrument to top if set in user preferences
    const mainInstrument = localStorage.getItem('goodmultitracks_main_instrument') as TrackTag | null;
    if (mainInstrument) {
      setTracks(prev => {
        const mainTrackIndex = prev.findIndex(t => t.tag === mainInstrument);
        if (mainTrackIndex > 0) {
          const newTracks = [...prev];
          const [mainTrack] = newTracks.splice(mainTrackIndex, 1);
          newTracks.unshift(mainTrack);
          return newTracks;
        }
        return prev;
      });
    }
  };

  const handleDeletePreset = (presetId: string) => {
    if (!song || !onSongUpdate) return;
    
    const updatedPresets = song.mixPresets?.filter(p => p.id !== presetId) || [];
    onSongUpdate({ ...song, mixPresets: updatedPresets });
  };

  const chordProgression = song.chordMarkers || []; // Usar chordMarkers

  // Zoom centered on a specific time point
  const zoomCentered = (newZoom: number, focusTime: number) => {
    if (!timelineScrollRef.current || !song) return; // Adicionado !song

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
    if (!e.ctrlKey && !e.metaKey || !song) return; // Adicionado !song

    e.preventDefault();

    // Clear any pending wheel timeout
    if (wheelTimeoutRef.current) {
      clearTimeout(wheelTimeoutRef.current);
    }

    // Get mouse position relative to timeline
    const rect = timelineScrollRef.current?.getBoundingClientRect();
    if (!rect || !timelineScrollRef.current) return; // Adicionado !timelineScrollRef.current

    const mouseX = e.clientX - rect.left;
    const scrollLeft = timelineScrollRef.current.scrollLeft || 0; // Correção scrollLeft

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
    if (!timelineScrollRef.current) return 0;
    const scrollLeft = timelineScrollRef.current.scrollLeft;
    const scrollWidth = timelineScrollRef.current.scrollWidth;
    const clientWidth = timelineScrollRef.current.clientWidth;
    const maxScroll = scrollWidth - clientWidth;
    return maxScroll > 0 ? scrollLeft / maxScroll : 0;
  };

  const getVisiblePercentage = () => {
    if (!timelineScrollRef.current) return 1;
    const scrollWidth = timelineScrollRef.current.scrollWidth;
    const clientWidth = timelineScrollRef.current.clientWidth;
    // Evita divisão por zero
    return scrollWidth > 0 ? Math.min(1, clientWidth / scrollWidth) : 1;
  };

  const handleScrollbarMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollbarRef.current || !timelineScrollRef.current) return;

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
      const scrollWidth = timelineScrollRef.current.scrollWidth;
      const clientWidth = timelineScrollRef.current.clientWidth;
      const maxScroll = scrollWidth - clientWidth;
      timelineScrollRef.current.scrollLeft = newPercentage * maxScroll;
    }
  };

   const handleScrollbarMouseMove = React.useCallback((e: MouseEvent) => { // Usar useCallback
     if (!isDraggingScrollbar && !isDraggingLeftHandle && !isDraggingRightHandle) return;
     if (!scrollbarRef.current || !timelineScrollRef.current) return;

     if (isDraggingScrollbar) {
       const rect = scrollbarRef.current.getBoundingClientRect();
       const scrollbarWidth = rect.width;
       const visiblePercentage = getVisiblePercentage();
       const thumbWidth = scrollbarWidth * visiblePercentage;
       const clickX = e.clientX - rect.left;

       const newPercentage = Math.max(0, Math.min(1, (clickX - thumbWidth / 2) / (scrollbarWidth - thumbWidth)));
       const scrollWidth = timelineScrollRef.current.scrollWidth;
       const clientWidth = timelineScrollRef.current.clientWidth;
       const maxScroll = scrollWidth - clientWidth;
       timelineScrollRef.current.scrollLeft = newPercentage * maxScroll;
     } else if (isDraggingLeftHandle || isDraggingRightHandle) {
       if (!handleDragStart) return;

       const deltaX = e.clientX - handleDragStart.x;
       const rect = scrollbarRef.current.getBoundingClientRect();
       const scrollbarWidth = rect.width;

       // 1:1 cursor movement to zoom ratio
       // More movement = more zoom change
       const direction = isDraggingRightHandle ? 1 : -1;
       const sensitivity = 0.01; // Adjust for smoother or faster zoom
       const zoomDelta = (deltaX * direction) * sensitivity;
       const newZoom = Math.max(1, Math.min(8, handleDragStart.zoom - zoomDelta));
       setZoom(newZoom);
     }
   }, [isDraggingScrollbar, isDraggingLeftHandle, isDraggingRightHandle, handleDragStart, getVisiblePercentage]); // Dependências


  const handleScrollbarMouseUp = React.useCallback(() => { // Usar useCallback
    setIsDraggingScrollbar(false);
    setIsDraggingLeftHandle(false);
    setIsDraggingRightHandle(false);
    setHandleDragStart(null);
  }, []); // Sem dependências

  useEffect(() => {
    if (isDraggingScrollbar || isDraggingLeftHandle || isDraggingRightHandle) {
      window.addEventListener('mousemove', handleScrollbarMouseMove);
      window.addEventListener('mouseup', handleScrollbarMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleScrollbarMouseMove);
        window.removeEventListener('mouseup', handleScrollbarMouseUp);
      };
    }
  }, [isDraggingScrollbar, isDraggingLeftHandle, isDraggingRightHandle, handleScrollbarMouseMove, handleScrollbarMouseUp]); // Dependências


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
     // Evita divisão por zero
    return scrollHeight > 0 ? Math.min(1, clientHeight / scrollHeight) : 1;
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

  const handleVerticalScrollbarMouseMove = React.useCallback((e: MouseEvent) => { // Usar useCallback
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
  }, [isDraggingVerticalScrollbar, getVerticalVisiblePercentage]); // Dependências


  const handleVerticalScrollbarMouseUp = React.useCallback(() => { // Usar useCallback
    setIsDraggingVerticalScrollbar(false);
  }, []); // Sem dependências

  useEffect(() => {
    if (isDraggingVerticalScrollbar) {
      window.addEventListener('mousemove', handleVerticalScrollbarMouseMove);
      window.addEventListener('mouseup', handleVerticalScrollbarMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleVerticalScrollbarMouseMove);
        window.removeEventListener('mouseup', handleVerticalScrollbarMouseUp);
      };
    }
  }, [isDraggingVerticalScrollbar, handleVerticalScrollbarMouseMove, handleVerticalScrollbarMouseUp]); // Dependências


  return (
    <TooltipProvider>
      <div className="flex flex-col h-full text-white" style={{ backgroundColor: '#1E1E1E' }}>
      {/* Top Bar (Main) - Fixed at top */}
      <div className="border-b px-4 py-3 flex items-center justify-between gap-4" style={{ backgroundColor: '#2B2B2B', borderColor: '#3A3A3A' }}>
        {/* Left: Back Button + Project Name */}
        <div className="flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded"
                style={{ backgroundColor: '#404040', color: '#F1F1F1' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5A5A5A'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#404040'}
                onClick={onBack}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Back to Library</TooltipContent>
          </Tooltip>

          <span className="text-lg" style={{ color: '#F1F1F1' }}>{song.title}</span>
        </div>

        {/* Center: Transport Controls + Info Box + Metronome */}
        <div className="flex items-center gap-4">
          {/* Transport Controls */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded"
                  style={{ backgroundColor: '#404040', color: '#F1F1F1' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5A5A5A'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#404040'}
                  onClick={() => {
                    setIsPlaying(false);
                    setGridTime(0);
                    setCurrentTime(0);
                  }}
                >
                  <Square className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Stop</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded"
                  style={{
                    backgroundColor: isPlaying ? '#4ADE80' : '#404040',
                    color: '#F1F1F1'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isPlaying ? '#22C55E' : '#5A5A5A'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isPlaying ? '#4ADE80' : '#404040'}
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isPlaying ? 'Pause' : 'Play'}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded"
                  style={{
                    backgroundColor: loopEnabled ? '#3B82F6' : '#404040',
                    color: '#F1F1F1'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = loopEnabled ? '#2563EB' : '#5A5A5A'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = loopEnabled ? '#3B82F6' : '#404040'}
                  onClick={() => setLoopEnabled(!loopEnabled)}
                >
                  <Repeat className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Loop</TooltipContent>
            </Tooltip>
          </div>

          {/* Info Box */}
          <div className="px-4 py-2 rounded flex items-center gap-4" style={{ backgroundColor: '#171717' }}>
            <div className="text-sm tabular-nums" style={{ color: '#F1F1F1' }}>
              {formatTime(currentTime)}
            </div>
            <Separator orientation="vertical" className="h-4" style={{ backgroundColor: '#3A3A3A' }} />
            <div className="text-sm" style={{ color: '#9E9E9E' }}>
              M: {getCurrentMeasure()}
            </div>
            <Separator orientation="vertical" className="h-4" style={{ backgroundColor: '#3A3A3A' }} />
            <div className="text-sm" style={{ color: '#9E9E9E' }}>
              {Math.round(song.tempo * (tempo / 100))} BPM
            </div>
            <Separator orientation="vertical" className="h-4" style={{ backgroundColor: '#3A3A3A' }} />
            <div className="text-sm" style={{ color: '#9E9E9E' }}>
              {getCurrentTimeSignature()}
            </div>
            <Separator orientation="vertical" className="h-4" style={{ backgroundColor: '#3A3A3A' }} />
            <Badge variant="secondary" style={{ backgroundColor: '#404040', color: '#F1F1F1' }}>
              {song.key}
            </Badge>
          </div>

          {/* Metronome */}
          <div className="flex items-center gap-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-r-none"
                  style={{
                    backgroundColor: metronomeEnabled ? '#3B82F6' : '#404040',
                    color: '#F1F1F1'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = metronomeEnabled ? '#2563EB' : '#5A5A5A'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = metronomeEnabled ? '#3B82F6' : '#404040'}
                  onClick={() => setMetronomeEnabled(!metronomeEnabled)}
                >
                  <Music2 className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Metronome</TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-6 rounded-l-none px-1"
                  style={{
                    backgroundColor: metronomeEnabled ? '#3B82F6' : '#404040',
                    color: '#F1F1F1'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = metronomeEnabled ? '#2563EB' : '#5A5A5A'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = metronomeEnabled ? '#3B82F6' : '#404040'}
                >
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 p-4" style={{ backgroundColor: '#2B2B2B', borderColor: '#3A3A3A' }}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm" style={{ color: '#F1F1F1' }}>{t.metronomeVolume}</Label>
                    <span className="text-sm" style={{ color: '#9E9E9E' }}>{formatDb(gainToDb(metronomeVolume))} dB</span>
                  </div>
                  <Slider
                    value={[gainToSlider(metronomeVolume)]}
                    onValueChange={([value]) => setMetronomeVolume(sliderToGain(value))}
                    max={100}
                    step={0.1}
                    className="w-full"
                    onDoubleClick={() => {
                      setMetronomeVolume(0.5);
                    }}
                  />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          <PlaybackControls
            tempo={tempo}
            onTempoChange={setTempo}
            originalKey={song.key}
          />

          <PlayerViewSettings
            trackHeight={trackHeight}
            onTrackHeightChange={setTrackHeight}
            rulerVisibility={rulerVisibility}
            onRulerVisibilityChange={handleRulerVisibilityChange}
            rulerOrder={rulerOrder}
            onRulerOrderChange={setRulerOrder} // Passando o setRulerOrder
          />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded"
                style={{
                  backgroundColor: snapEnabled ? '#3B82F6' : '#404040',
                  color: '#F1F1F1'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = snapEnabled ? '#2563EB' : '#5A5A5A'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = snapEnabled ? '#3B82F6' : '#404040'}
                onClick={() => setSnapEnabled(!snapEnabled)}
              >
                <Grid3x3 className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Snap to Measure</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded"
                style={{ backgroundColor: '#404040', color: '#F1F1F1' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#5A5A5A')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#404040')}
                onClick={() => setShowShortcutsHelp(true)}
              >
                <Keyboard className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Keyboard Shortcuts</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Second Bar (Edit Tools) - Only shown when editMode === true */}
      {editMode && (
        <div className="border-b px-4 py-2.5 flex items-center gap-2" style={{ backgroundColor: '#2B2B2B', borderColor: '#3A3A3A' }}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded"
                style={{ backgroundColor: '#404040', color: '#F1F1F1' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5A5A5A'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#404040'}
                onClick={() => openTimelineEditor('section')}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add Section</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded"
                style={{ backgroundColor: '#404040', color: '#F1F1F1' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5A5A5A'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#404040'}
                onClick={() => openTimelineEditor('chord')}
              >
                <Music2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add Chord</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded"
                style={{ backgroundColor: '#404040', color: '#F1F1F1' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5A5A5A'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#404040'}
                onClick={() => openTimelineEditor('tempo')}
              >
                <Clock className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add Tempo Change</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded"
                style={{ backgroundColor: '#404040', color: '#F1F1F1' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5A5A5A'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#404040'}
                onClick={() => openTimelineEditor('timesig')}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add Time Signature</TooltipContent>
          </Tooltip>
            
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded"
                style={{
                  backgroundColor: warpModeEnabled ? '#3B82F6' : '#404040',
                  color: '#F1F1F1'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = warpModeEnabled ? '#2563EB' : '#5A5A5A'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = warpModeEnabled ? '#3B82F6' : '#404040'}
                onClick={() => {
                  const newMode = !warpModeEnabled;
                  setWarpModeEnabled(newMode);
                  if (newMode && warpMarkers.length === 0 && song) {
                    const initialMarkers: WarpMarker[] = [
                      { id: 'warp-start', sourceTime: 0, gridTime: 0 },
                      { id: 'warp-end', sourceTime: song.duration, gridTime: song.duration },
                    ];
                    setWarpMarkers(initialMarkers);
                  }
                }}
              >
                <Wand2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Time Warp Tool</TooltipContent>
          </Tooltip>
          
            <Separator orientation="vertical" className="h-6" style={{ backgroundColor: '#3A3A3A' }} />                                  <Tooltip>
            
                                    <TooltipTrigger asChild>
            
                                      <Button
            
                                        variant="ghost"
            
                                        size="icon"
            
                                        className="h-9 w-9 rounded"
            
                                        style={{ backgroundColor: '#404040', color: '#F1F1F1' }}
            
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5A5A5A'}
            
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#404040'}
            
                                        onClick={handleExportProject}
            
                                      >
            
                                        <Download className="w-4 h-4" />
            
                                      </Button>
            
                                    </TooltipTrigger>
            
                                    <TooltipContent>Export Project</TooltipContent>
            
                                  </Tooltip>

          {song.source !== 'project' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded"
                  style={{ backgroundColor: '#404040', color: '#F1F1F1' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5A5A5A'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#404040'}
                  onClick={() => setEditMode(false)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Done Editing</TooltipContent>
            </Tooltip>
          )}
        </div>
      )}

      {/* Main Content Area - Flexible, takes remaining space */}
      <div className="flex-1 flex overflow-hidden" onWheel={handleWheel}>
        {/* Sidebar (Left) - Track List */}
        {sidebarVisible && mixerVisible && (
          <div className="w-64 border-r flex flex-col" style={{ backgroundColor: '#2B2B2B', borderColor: '#3A3A3A' }}>
            {/* Timeline Labels */}
            <div id="ruler-labels-container">
              {rulerOrder.map(rulerId => {
                if (!rulerVisibility[rulerId]) return null;
                
                // << CORREÇÃO: Usar o objeto de traduções 't' que é completo >>
                const rulerLabelMap: Record<string, string> = {
                  time: t.time,
                  measures: t.measures,
                  tempo: t.tempo,
                  chords: t.chords,
                  sections: t.sections,
                };
                const rulerLabel = rulerLabelMap[rulerId];
                const rulerHeight = rulerId === 'sections' ? 'h-8' : 'h-7';

                if (!rulerLabel) return null;

                return (
                  <div key={rulerId} className={`${rulerHeight} border-b flex items-center justify-end px-2 text-xs relative`} style={{ backgroundColor: '#2B2B2B', borderColor: '#3A3A3A', color: '#9E9E9E' }}>
                    <RulerHandle rulerId={rulerId} onDragStart={handleRulerDragStart} />
                    <RulerDropTarget onDrop={(e) => handleRulerDrop(e, rulerId)} onDragOver={handleRulerDragOver} />
                    {rulerLabel}
                  </div>
                );
              })}
            </div>

            {/* Track Labels with Faders */}
            <div
              ref={trackLabelsScrollRef}
              className="flex-1 overflow-y-hidden"
              style={{ backgroundColor: '#2B2B2B', overflowY: 'hidden' }}
            >
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className={`${getTrackHeight()} border-b flex`}
                  style={{ backgroundColor: hexToRgba(track.color || '#60a5fa', 0.2), borderColor: '#3A3A3A' }}
                >
                  <div
                    className="w-1 flex-shrink-0"
                    style={{ backgroundColor: track.color || '#60a5fa' }}
                  />
                  <div className="flex-1 p-2.5 flex flex-col justify-center gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {editMode ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-4 h-4 p-0 rounded border-2 border-gray-500 cursor-pointer flex-shrink-0"
                              style={{ backgroundColor: track.color || '#60a5fa' }}
                              aria-label={`Change color for track ${track.name}`}
                            />
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-2 bg-gray-700 border-gray-600">
                            <div className="grid grid-cols-4 gap-1">
                              {PRESET_COLORS.map((color) => (
                                <Button
                                  key={color}
                                  variant="ghost"
                                  size="sm"
                                  className="w-6 h-6 p-0 rounded border border-gray-500 hover:opacity-80"
                                  style={{ backgroundColor: color }}
                                  onClick={() => handleTrackColorChange(track.id, color)}
                                  aria-label={`Set color to ${color}`}
                                />
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <div
                          className="w-4 h-4 rounded border-2 border-gray-500 flex-shrink-0"
                          style={{ backgroundColor: track.color || '#60a5fa' }}
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
                        <div className="flex-1 flex items-center gap-1 min-w-0">
                          <span className="text-sm truncate">{track.name}</span>
                          {editMode && (
                            <TrackTagSelector
                              currentTag={track.tag}
                              onTagChange={(tag) => handleTrackTagChange(track.id, tag)}
                            />
                          )}
                        </div>
                      )}

                      {editMode && editingTrackId !== track.id && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-gray-700 flex-shrink-0"
                            onClick={() => startEditingTrackName(track.id, track.name)}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-gray-700 flex-shrink-0"
                                onClick={() => setSelectedTrackForNotes(track)}
                                style={{
                                  color: (track.notes && track.notes.length > 0) ? '#3B82F6' : '#9E9E9E'
                                }}
                              >
                                <StickyNote className="w-3 h-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Track Notes</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-gray-700 flex-shrink-0"
                                onClick={() => handleToggleTrackPin(track.id)}
                                style={{
                                  color: pinnedTracks.has(track.id) ? '#FBBF24' : '#9E9E9E'
                                }}
                              >
                                <Pin className={`w-3 h-3 ${pinnedTracks.has(track.id) ? 'fill-current' : ''}`} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {pinnedTracks.has(track.id) ? 'Unpin track (exclude from presets)' : 'Pin track (exclude from presets)'}
                            </TooltipContent>
                          </Tooltip>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2 min-w-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-9 flex-shrink-0"
                        style={{
                          backgroundColor: track.muted ? '#F87171' : '#404040',
                          color: '#FFFFFF'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = track.muted ? '#EF4444' : '#5A5A5A'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = track.muted ? '#F87171' : '#404040'}
                        onClick={() => handleTrackMuteToggle(track.id)}
                      >
                        M
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-9 flex-shrink-0"
                        style={{
                          backgroundColor: track.solo ? '#FBBF24' : '#404040',
                          color: '#FFFFFF'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = track.solo ? '#F59E0B' : '#5A5A5A'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = track.solo ? '#FBBF24' : '#404040'}
                        onClick={() => handleTrackSoloToggle(track.id)}
                      >
                        S
                      </Button>
                      <div className="flex-1 flex items-center gap-1 min-w-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs flex-shrink-0 hover:bg-gray-700"
                              style={{ color: '#F1F1F1' }}
                            >
                              {formatDb(gainToDb(track.volume || 1.0))}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-48 p-3" style={{ backgroundColor: '#2B2B2B', borderColor: '#3A3A3A' }}>
                            <div className="flex items-center gap-2">
                              <Input
                                type="text"
                                value={formatDb(gainToDb(track.volume || 1.0))}
                                onChange={(e) => {
                                  const parsed = parseDbInput(e.target.value);
                                  if (parsed !== null && isFinite(parsed)) {
                                    handleTrackVolumeChange(track.id, parsed);
                                  }
                                }}
                                className="h-8 text-center bg-gray-700 text-white border-gray-600"
                              />
                              <span className="text-sm text-gray-400">dB</span>
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Slider
                          value={[gainToSlider(track.volume || 1.0)]}
                          onValueChange={([value]) => handleTrackVolumeChange(track.id, sliderToGain(value))}
                          max={100}
                          step={0.1}
                          className="flex-1 min-w-0"
                          onDoubleClick={() => {
                            handleTrackVolumeChange(track.id, 1.0);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline and Tracks (Right) - with rulers and waveforms */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Timeline Rows */}
          <div
            ref={timelineScrollRef}
            className="border-b overflow-x-auto overflow-y-hidden hide-scrollbar"
            style={{ backgroundColor: '#171717', borderColor: '#3A3A3A' }}
            onScroll={handleTimelineScroll}
            onMouseDown={handleWaveformMouseDown}
            onMouseMove={handleWaveformMouseMove}
            onMouseUp={handleWaveformMouseUp}
            onMouseLeave={handleWaveformMouseUp}
            onContextMenu={(e) => {
              if (!warpModeEnabled || !song) return;

              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const scrollLeft = timelineScrollRef.current?.scrollLeft || 0;
              const totalWidth = (containerWidth * zoom);
              
              const markerRadiusPx = 8;
              let markerClicked = null;

              for (const marker of warpMarkers) {
                const gridPositionPx = (marker.gridTime / song.duration) * totalWidth;
                const distance = Math.abs((x + scrollLeft) - gridPositionPx);
                if (distance < markerRadiusPx) {
                  markerClicked = marker;
                  break;
                }
              }

              if (markerClicked) {
                e.preventDefault();
                const newMarkers = warpMarkers.filter(m => m.id !== markerClicked!.id);
                setWarpMarkers(newMarkers);
                if (onSongUpdate) {
                  onSongUpdate({ ...song, warpMarkers: newMarkers });
                }
              }
            }}
          >
            <div style={{ width: timelineWidth }} className="relative">
              {/* Time Row */}
              {/* << CORREÇÃO DEFINITIVA: Renderização correta das 5 réguas >> */}
              {rulerOrder.map(rulerId => {
                if (!rulerVisibility[rulerId]) return null;
 
                switch (rulerId) {
                  case 'time':
                    return (
                      <div key="time" className="h-7 border-b relative" style={{ backgroundColor: '#171717', borderColor: '#3A3A3A' }} onDrop={(e) => handleRulerDrop(e, 'time')} onDragOver={handleRulerDragOver}>
                        {timeMarkers.map((time) => {
                          const position = (time / song.duration) * timelineWidth;
                          return (
                            <div key={time} className="absolute top-0 bottom-0 border-l" style={{ left: position, borderColor: '#3A3A3A' }}>
                              <span className="absolute top-0.5 left-1 text-xs" style={{ color: '#9E9E9E' }}>{formatTime(time)}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  case 'measures':
                    return (
                      <div key="measures" className="h-7 border-b relative" style={{ backgroundColor: '#171717', borderColor: '#3A3A3A' }} onDrop={(e) => handleRulerDrop(e, 'measures')} onDragOver={handleRulerDragOver}>
                        {measureBars.map((bar, i) => {
                          const position = (bar.time / song.duration) * timelineWidth;
                          if (!bar.measure && !bar.isBeat) return null;
                          let borderColor = '#3A3A3A';
                          let backgroundColor = 'transparent';
                          if (bar.isCompound) {
                            borderColor = '#8B5CF6';
                            backgroundColor = 'rgba(139, 92, 246, 0.05)';
                          } else if (bar.isIrregular) {
                            borderColor = '#F59E0B';
                            backgroundColor = 'rgba(245, 158, 11, 0.05)';
                          } else if (bar.isBeat) {
                            borderColor = '#2B2B2B';
                          }
                          return (
                            <div key={i} className="absolute top-0 bottom-0 border-l transition-colors" style={{ left: position, borderColor, backgroundColor, }} title={bar.isCompound ? 'Compound Time' : bar.isIrregular ? 'Irregular Time' : undefined}>
                              {bar.measure && (
                                <span className="absolute top-0.5 left-1 text-xs font-semibold" style={{ color: bar.isCompound ? '#8B5CF6' : bar.isIrregular ? '#F59E0B' : '#9E9E9E' }}>{bar.measure}</span>
                              )}
                              {showBeats && bar.isBeat && (
                                <span className="absolute top-0.5 left-1 text-xs" style={{ color: '#9E9E9E' }}>{bar.beat}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  case 'tempo':
                    return (
                      <div key="tempo" className="h-7 border-b relative" style={{ backgroundColor: '#171717', borderColor: '#3A3A3A' }} onDrop={(e) => handleRulerDrop(e, 'tempo')} onDragOver={handleRulerDragOver}>
                        {(warpModeEnabled && warpMarkers.length > 1) ? (
                          <Badge variant="secondary" className="absolute top-0.5 left-2 text-xs bg-yellow-600 text-white">
                            Time Warp Active
                          </Badge>
                        ) : (
                          tempoChanges.map((change, i) => {
                            const position = (change.time / song.duration) * timelineWidth;
                            return (
                              <div key={i} className="absolute top-0 bottom-0" style={{ left: position }}>
                                <Badge variant="secondary" className="absolute top-0.5 left-0 text-xs bg-purple-600 text-white">
                                  {change.tempo} BPM · {change.timeSignature}
                                </Badge>
                              </div>
                            );
                          })
                        )}
                      </div>
                    );
                  case 'chords':
                    return (
                      <div key="chords" className="h-7 border-b relative" style={{ backgroundColor: '#171717', borderColor: '#3A3A3A' }} onDrop={(e) => handleRulerDrop(e, 'chords')} onDragOver={handleRulerDragOver}>
                        {chordProgression.map((chord, i) => {
                          const position = (chord.time / song.duration) * timelineWidth;
                          return (
                            <div key={i} className="absolute top-0 bottom-0" style={{ left: position }}>
                              <Badge variant="secondary" className="absolute top-0.5 left-0 text-xs bg-blue-600 text-white cursor-pointer hover:bg-blue-700 transition-colors whitespace-nowrap" onClick={(e) => {
                                e.stopPropagation();
                                if (editMode) {
                                  setEditingChordMarker(chord);
                                  setEditorType('chord');
                                  setTimelineEditorOpen(true);
                                } else {
                                  setSelectedChord({ chord: chord.chord, customDiagram: chord.customDiagram });
                                }
                              }}>
                                {transposeKey(chord.chord, keyShift)}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    );
                  case 'sections':
                    return (
                      <div key="sections" className="h-8 border-b relative" style={{ backgroundColor: '#171717', borderColor: '#3A3A3A' }} onDrop={(e) => handleRulerDrop(e, 'sections')} onDragOver={handleRulerDragOver}>
                        {song.markers.map((marker, i) => {
                          const position = (marker.time / song.duration) * timelineWidth;
                          const nextMarker = song.markers[i + 1];
                          const width = nextMarker ? ((nextMarker.time - marker.time) / song.duration) * timelineWidth : timelineWidth - position;
                          const colorMap: Record<string, string> = { intro: 'bg-green-600', verse: 'bg-blue-600', chorus: 'bg-red-600', bridge: 'bg-yellow-600', outro: 'bg-purple-600', 'pre-chorus': 'bg-pink-600', instrumental: 'bg-teal-600', tag: 'bg-gray-500', custom: 'bg-gray-400' };
                          const bgColor = colorMap[marker.type] || colorMap.custom;
                          const borderColor = bgColor.replace('bg-', 'border-');
                          return (
                            <div key={marker.id} className={`absolute top-1 bottom-1 ${bgColor} bg-opacity-30 border-l-2 ${borderColor} cursor-pointer hover:bg-opacity-50 transition-all`} style={{ left: position, width: Math.max(0, width) }} onClick={(e) => { e.stopPropagation(); handleSectionClick(i); }}>
                              <span className="absolute top-1 left-2 text-xs pointer-events-none truncate max-w-full pr-1">{marker.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  default:
                    return null;
                }
              })}

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

              {/* Warp Markers - always rendered (subtle when warpMode disabled) */}
              {warpMarkers.map(marker => {
                const gridPosition = (marker.gridTime / song.duration) * timelineWidth;
                const sourcePosition = (marker.sourceTime / song.duration) * timelineWidth;
                const showFull = warpModeEnabled;
                return (
                  <React.Fragment key={marker.id}>
                    {/* Line connecting source to grid (visible only when warp mode active) */}
                    {showFull && Math.abs(gridPosition - sourcePosition) > 2 && (
                      <div
                        className="absolute top-0 h-full border-l border-dashed pointer-events-none"
                        style={{
                          left: Math.min(gridPosition, sourcePosition),
                          width: Math.abs(gridPosition - sourcePosition),
                          borderColor: 'rgba(250, 204, 21, 0.7)',
                          height: '100%',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          borderTopWidth: '1px',
                        }}
                      />
                    )}

                    {/* Source Marker (thin line) - subtle when inactive */}
                    <div
                      className={`absolute top-0 bottom-0 w-0.5 ${showFull ? 'bg-yellow-300 opacity-50' : 'bg-yellow-600 opacity-20'} pointer-events-none`}
                      style={{ left: sourcePosition }}
                    />

                          {/* Grid Marker (handle) - clickable to open tool when inactive, draggable when active */}
                          <div
                            className={`absolute top-0 bottom-0 w-0.5 ${showFull ? 'bg-yellow-500 cursor-ew-resize z-20' : 'bg-yellow-500/30 z-10'}`}
                            style={{ left: gridPosition }}
                            onMouseEnter={() => setHoveredWarpMarkerId(marker.id)}
                            onMouseLeave={() => setHoveredWarpMarkerId(prev => (prev === marker.id ? null : prev))}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              // Open inline editor popup
                              setEditingWarpMarkerId(marker.id);
                              setEditingSourceInput(marker.sourceTime.toFixed(2));
                              setEditingGridInput(marker.gridTime.toFixed(2));
                            }}
                          >
                            <div className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full ${showFull ? 'bg-yellow-500 border-2 border-white' : 'bg-yellow-500/60 border-2 border-white/30'}`} />

                            {/* Shift label above handle */}
                            <div className={`absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-mono px-1 py-0.5 rounded ${showFull ? 'bg-yellow-600 text-white' : 'bg-yellow-600/40 text-white/80'}`}>
                              {((marker.gridTime - marker.sourceTime) >= 0 ? '+' : '') + (marker.gridTime - marker.sourceTime).toFixed(2) + 's'}
                            </div>
                            {/* Inline editor popup on double-click */}
                            {editingWarpMarkerId === marker.id && (
                              <div style={{ position: 'absolute', left: Math.min(Math.max(gridPosition, 16), Math.max(16, timelineWidth - 220)), top: -56, transform: 'translateX(-50%)', zIndex: 70 }}>
                                <div className="bg-white shadow rounded p-2 text-xs text-black w-56">
                                  <div className="flex items-center gap-2 mb-1">
                                    <label className="w-16">Source</label>
                                    <Input id={`warp-src-${marker.id}`} value={editingSourceInput} onChange={(e) => setEditingSourceInput(e.target.value)} />
                                  </div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <label className="w-16">Grid</label>
                                    <Input id={`warp-grid-${marker.id}`} value={editingGridInput} onChange={(e) => setEditingGridInput(e.target.value)} />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" size="sm" onClick={() => { setEditingWarpMarkerId(null); }}>Cancel</Button>
                                    <Button size="sm" onClick={() => {
                                      const srcParsed = parseTimeInput(editingSourceInput);
                                      const grdParsed = parseTimeInput(editingGridInput);
                                      if (srcParsed === null || grdParsed === null || !song) {
                                        return;
                                      }
                                      const newMarkers = warpMarkers.map(m => m.id === marker.id ? { ...m, sourceTime: srcParsed, gridTime: grdParsed } : m);
                                      setWarpMarkers(newMarkers);
                                      if (song && onSongUpdate) {
                                        onSongUpdate({ ...song, warpMarkers: newMarkers });
                                      }
                                      setEditingWarpMarkerId(null);
                                    }}>Save</Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          {/* Hover Tooltip (rendered near the handle when hovered) */}
                          {hoveredWarpMarkerId === marker.id && (
                            <div style={{ position: 'absolute', left: Math.min(Math.max(gridPosition, 16), Math.max(16, timelineWidth - 120)), top: 8, transform: 'translateX(-50%)', zIndex: 60 }}>
                              <div className="bg-black/80 text-white text-xs rounded px-2 py-1 whitespace-nowrap space-y-1">
                                <div>Grid: {formatTime(marker.gridTime)}</div>
                                <div>Source: {formatTime(marker.sourceTime)}</div>
                                <div>Shift: {((marker.gridTime - marker.sourceTime) >= 0 ? '+' : '') + (marker.gridTime - marker.sourceTime).toFixed(2)}s</div>
                                {/* Show local BPM if multiple markers exist */}
                                {warpMarkers.length > 1 && (() => {
                                  const { prev, next } = getAdjacentMarkers(marker.gridTime, warpMarkers);
                                  if (next) {
                                    const localBPM = calculateLocalBPM(marker, next, song.tempo);
                                    return <div className="border-t border-gray-600 pt-1 mt-1">To next: {localBPM.toFixed(1)} BPM</div>;
                                  }
                                  if (prev) {
                                    const localBPM = calculateLocalBPM(prev, marker, song.tempo);
                                    return <div className="border-t border-gray-600 pt-1 mt-1">From prev: {localBPM.toFixed(1)} BPM</div>;
                                  }
                                  return null;
                                })()}
                              </div>
                            </div>
                          )}
                  </React.Fragment>
                );
              })}

              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-10"
                style={{ left: playheadPosition }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent border-t-red-500" />
              </div>
            </div>
          </div>

          {/* Tracks Waveforms Container */}
          <div className="flex-1 flex overflow-hidden">
          {/* Track Waveforms */}
          <div
            ref={tracksScrollRef}
            className="flex-1 hide-scrollbar"
            style={{ overflowY: 'auto', overflowX: 'hidden' }}
            onScroll={handleTracksScroll}
            onMouseDown={handleWaveformMouseDown}
            onMouseMove={handleWaveformMouseMove}
            onMouseUp={handleWaveformMouseUp}
            onMouseLeave={handleWaveformMouseUp}
          >
            <div style={{ width: timelineWidth, minHeight: '100%', transition: 'transform 0s' }} className="relative tracks-content">
              {tracks.map((track, index) => (
                <div
                  key={track.id}
                  className={`${getTrackHeight()} border-b border-gray-700 relative bg-gray-850`}
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
                      d={generateWaveformPath(track.waveformData, timelineWidth, getTrackHeightPx())}
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
                    height: tracks.length * getTrackHeightPx()
                  }}
                />
              )}

              {/* Loop end marker */}
              {loopEnd !== null && (
                <div
                  className="absolute top-0 w-1 bg-yellow-500 pointer-events-none z-10"
                  style={{
                    left: (loopEnd / song.duration) * timelineWidth,
                    height: tracks.length * getTrackHeightPx()
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
          <div className="w-4 border-l flex flex-col" style={{ backgroundColor: '#2B2B2B', borderColor: '#3A3A3A' }}>
            <div className="flex-1 py-3 px-1">
              <div
                ref={verticalScrollbarRef}
                className="relative w-full h-full rounded cursor-pointer"
                style={{ backgroundColor: '#171717' }}
                onMouseDown={handleVerticalScrollbarMouseDown}
              >
                {/* Scrollbar Thumb */}
                <div
                  className="absolute left-0 w-full rounded"
                  style={{
                    backgroundColor: '#5A5A5A',
                    top: `${getVerticalScrollPercentage() * (100 - getVerticalVisiblePercentage() * 100)}%`,
                    height: `${getVerticalVisiblePercentage() * 100}%`,
                    minHeight: '20px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7A7A7A'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#5A5A5A'}
                />
              </div>
            </div>
          </div>
          </div>


        </div>
      </div>

      {/* Mixer Dock (Bottom) */}
      {mixerDockVisible && (
        <MixerDock
          tracks={tracks}
          onTrackVolumeChange={handleTrackVolumeChange}
          onTrackMuteToggle={handleTrackMuteToggle}
          onTrackSoloToggle={handleTrackSoloToggle}
          onClose={() => setMixerDockVisible(false)}
        />
      )}

      {/* Notes Panel (Bottom) */}
      {notesPanelVisible && song && (
        <div 
          className="w-full flex flex-col border-t"
          style={{ 
            backgroundColor: '#1E1E1E',
            borderColor: '#3A3A3A',
            height: '240px',
          }}
        >
          {/* Header */}
          <div 
            className="h-10 border-b flex items-center justify-between px-3"
            style={{ 
              backgroundColor: '#2B2B2B',
              borderColor: '#3A3A3A',
            }}
          >
            <h3 className="text-sm font-semibold" style={{ color: '#F1F1F1' }}>Song Notes</h3>
            <button
              onClick={() => setNotesPanelVisible(false)}
              className="p-1 hover:bg-gray-700 rounded"
            >
              <X className="w-4 h-4" style={{ color: '#F1F1F1' }} />
            </button>
          </div>

          {/* Content */}
          <div 
            className="flex-1 overflow-y-auto px-3 py-3"
            style={{ backgroundColor: '#1E1E1E' }}
          >
            <NotesPanel
              notes={song.notes || []}
              currentUser={{ id: 'current-user', name: 'You' }}
              onAddNote={handleAddSongNote}
              onDeleteNote={handleDeleteSongNote}
            />
          </div>
        </div>
      )}

      {/* Bottom Bar (Zoom + Scrollbar) */}
      <div className="border-t flex items-center h-8" style={{ backgroundColor: '#2B2B2B', borderColor: '#3A3A3A' }}>
        {/* Zoom Controls - Aligned with sidebar */}
        <div 
          className={`${sidebarVisible && mixerVisible ? 'w-64' : 'w-auto'} border-r flex items-center justify-center gap-2 px-3`}
          style={{ borderColor: '#3A3A3A' }}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded"
                style={{ 
                  backgroundColor: '#404040',
                  color: '#F1F1F1',
                  opacity: zoom <= 1 ? 0.5 : 1
                }}
                onMouseEnter={(e) => zoom > 1 && (e.currentTarget.style.backgroundColor = '#5A5A5A')}
                onMouseLeave={(e) => zoom > 1 && (e.currentTarget.style.backgroundColor = '#404040')}
                onClick={handleZoomOutOnPlayhead}
                disabled={zoom <= 1}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom Out</TooltipContent>
          </Tooltip>
          <span className="text-xs tabular-nums w-14 text-center" style={{ color: '#9E9E9E' }}>
            {Math.round(zoom * 100)}%
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded"
                style={{ 
                  backgroundColor: '#404040',
                  color: '#F1F1F1',
                  opacity: zoom >= 8 ? 0.5 : 1
                }}
                onMouseEnter={(e) => zoom < 8 && (e.currentTarget.style.backgroundColor = '#5A5A5A')}
                onMouseLeave={(e) => zoom < 8 && (e.currentTarget.style.backgroundColor = '#404040')}
                onClick={handleZoomInOnPlayhead}
                disabled={zoom >= 8}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom In</TooltipContent>
          </Tooltip>
        </div>

        {/* Custom Horizontal Scrollbar */}
        <div className="flex-1 px-3 py-1">
          <div
            ref={scrollbarRef}
            className="relative h-4 rounded cursor-pointer"
            style={{ backgroundColor: '#171717' }}
            onMouseDown={handleScrollbarMouseDown}
          >
            {/* Scrollbar Thumb with Handles */}
            <div
              className="absolute top-0 h-full rounded flex items-center justify-between"
              style={{
                backgroundColor: '#5A5A5A',
                left: `${getScrollPercentage() * (100 - getVisiblePercentage() * 100)}%`,
                width: `${getVisiblePercentage() * 100}%`,
                minWidth: '20px'
              }}
            >
              {/* Left Handle */}
              <div
                className="w-2.5 h-full rounded-l flex items-center justify-center cursor-ew-resize"
                style={{ backgroundColor: '#7A7A7A' }}
                onMouseDown={handleLeftHandleMouseDown}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#9A9A9A'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7A7A7A'}
              >
                <div className="w-0.5 h-2 rounded" style={{ backgroundColor: '#F1F1F1' }} />
              </div>

              {/* Right Handle */}
              <div
                className="w-2.5 h-full rounded-r flex items-center justify-center cursor-ew-resize"
                style={{ backgroundColor: '#7A7A7A' }}
                onMouseDown={handleRightHandleMouseDown}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#9A9A9A'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7A7A7A'}
              >
                <div className="w-0.5 h-2 rounded" style={{ backgroundColor: '#F1F1F1' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Toolbar (UI Controls) - Fixed at bottom */}
      <div className="border-t flex items-center justify-between h-10 px-3" style={{ backgroundColor: '#2B2B2B', borderColor: '#3A3A3A' }}>
        {/* Left: Sidebar Toggle + View Settings */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded"
                style={{ backgroundColor: '#404040', color: '#F1F1F1' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5A5A5A'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#404040'}
                onClick={() => setSidebarVisible(!sidebarVisible)}
              >
                {sidebarVisible ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{sidebarVisible ? 'Hide Sidebar' : 'Show Sidebar'}</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded"
                      style={{ backgroundColor: '#404040', color: '#F1F1F1' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5A5A5A'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#404040'}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>View Configuration</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start" className="w-56" style={{ backgroundColor: '#2B2B2B', borderColor: '#3A3A3A' }}>
              <div className="p-2 space-y-2">
                <div className="text-sm px-2 py-1" style={{ color: '#9E9E9E' }}>View Settings</div>
                <div className="text-xs px-2 py-1" style={{ color: '#7A7A7A' }}>
                  Track height, ruler options, and display preferences
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Center: Mix Presets, Mixer Dock */}
        <div className="flex items-center gap-1">
          <Popover open={mixPresetsPopoverOpen} onOpenChange={setMixPresetsPopoverOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded"
                      style={{ backgroundColor: '#404040', color: '#F1F1F1' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5A5A5A'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#404040'}
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                </span>
              </TooltipTrigger>
              <TooltipContent>Mix Presets</TooltipContent>
            </Tooltip>
            <PopoverContent 
              align="center" 
              className="w-72" 
              style={{ backgroundColor: '#2B2B2B', borderColor: '#3A3A3A' }}
            >
              <div className="space-y-3">
                <div className="text-sm" style={{ color: '#F1F1F1' }}>Mix Presets</div>
                <MixPresetsManager
                  tracks={tracks}
                  presets={mixPresets}
                  onSavePreset={handleSaveMixPreset}
                  onLoadPreset={handleLoadMixPreset}
                  onDeletePreset={handleDeleteMixPreset}
                />
              </div>
            </PopoverContent>
          </Popover>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded"
                style={{
                  backgroundColor: mixerDockVisible ? '#3B82F6' : '#404040',
                  color: '#F1F1F1'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = mixerDockVisible ? '#3B82F6' : '#5A5A5A'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = mixerDockVisible ? '#3B82F6' : '#404040'}
                onClick={() => setMixerDockVisible(!mixerDockVisible)}
              >
                <Sliders className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{mixerDockVisible ? 'Hide Mixer Dock' : 'Show Mixer Dock'}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded"
                style={{
                  backgroundColor: notesPanelVisible ? '#3B82F6' : '#404040',
                  color: '#F1F1F1'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = notesPanelVisible ? '#3B82F6' : '#5A5A5A'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notesPanelVisible ? '#3B82F6' : '#404040'}
                onClick={() => setNotesPanelVisible(!notesPanelVisible)}
              >
                <StickyNote className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{notesPanelVisible ? 'Hide Notes Panel' : 'Show Notes Panel'}</TooltipContent>
          </Tooltip>
        </div>

        {/* Right: Performance Mode */}
        <div className="flex items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded"
                style={{ backgroundColor: '#404040', color: '#F1F1F1' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5A5A5A'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#404040'}
                onClick={onPerformanceMode}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Performance Mode</TooltipContent>
          </Tooltip>
        </div>
      </div>


      {/* Dialogs */}
      <CreateProjectDialog
        open={createProjectOpen}
        onOpenChange={setCreateProjectOpen}
        onCreateProject={handleCreateProjectSubmit}
      />

      <TimelineEditorDialog
        open={timelineEditorOpen}
        onOpenChange={(isOpen) => {
            setTimelineEditorOpen(isOpen);
            if (!isOpen) {
                setEditingChordMarker(null);
            }
        }}
        type={editorType}
        currentTime={editingChordMarker ? editingChordMarker.time : currentTime}
        initialData={editingChordMarker}
        onSubmit={(action, data) => handleUpdateOrDeleteTimelineItem(action, data, editingChordMarker || undefined)}
      />

      {selectedChord && (
        <ChordDiagram
          chord={selectedChord.chord}
          isOpen={!!selectedChord}
          onClose={() => setSelectedChord(null)}
          customDiagram={selectedChord.customDiagram}
        />
      )}

      {/* << DIÁLOGO DE NOTAS ADICIONADO >> */}
      {selectedTrackForNotes && (
        <TrackNotesDialog
          open={!!selectedTrackForNotes}
          onOpenChange={(open) => {
            if (!open) setSelectedTrackForNotes(null);
          }}
          trackName={selectedTrackForNotes.name}
          notes={selectedTrackForNotes.notes || ''}
          onSave={handleSaveTrackNotes}
        />
      )}

      <KeyboardShortcutsHelp
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />
      </div>
    </TooltipProvider>
  );
}

function generateWaveformPath(data: number[] | undefined, width: number, height: number): string {
  // Se não houver dados ou a largura for 0, desenha uma linha reta no meio
  if (!data || data.length === 0 || width <= 0) {
      const centerY = height / 2;
      return `M 0 ${centerY} L ${width} ${centerY}`;
  }

  const step = width / data.length;
  const centerY = height / 2;

  let path = `M 0 ${centerY}`; // Começa no meio à esquerda

  // Desenha a parte superior da onda
  data.forEach((value, i) => {
    // Garante que o valor esteja entre 0 e 1 para evitar picos estranhos
    const normalizedValue = Math.max(0, Math.min(1, value));
    const x = i * step;
    // Multiplica por centerY para escalar a altura, subtrai para ir para cima
    const y = centerY - (normalizedValue * centerY);
    path += ` L ${x.toFixed(2)} ${y.toFixed(2)}`; // Limita casas decimais para performance
  });

   // Linha final na borda direita (no meio) para fechar a parte superior
  path += ` L ${width.toFixed(2)} ${centerY}`;

  // Desenha a parte inferior da onda (espelhada), voltando da direita para a esquerda
  // (Começamos do último ponto já adicionado: width, centerY)
  for (let i = data.length - 1; i >= 0; i--) {
      // Garante que o valor esteja entre 0 e 1
      const normalizedValue = Math.max(0, Math.min(1, data[i]));
      const x = i * step;
      // Adiciona a centerY para ir para baixo
      const y = centerY + (normalizedValue * centerY);
      path += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }

  // Linha final de volta ao ponto inicial (0, centerY) para fechar o caminho
  path += ' Z';
  return path;
}
