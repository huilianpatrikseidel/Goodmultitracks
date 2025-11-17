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
import { Slider } from './ui/slider'; // << IMPORTAÇÕES ADICIONADAS >>
import { Input } from './ui/input';
import { getWarpedTime as utilsGetWarpedTime, parseTimeInput, calculateBPMForSegment, audioTimeToGridTime } from '../lib/warpUtils';

import { Badge } from './ui/badge';
import { Song, AudioTrack, SectionMarker, TempoChange, ChordMarker, MixPreset, TrackTag, WarpMarker } from '../types';
import { Separator } from './ui/separator';
import { CreateProjectDialog } from './CreateProjectDialog'; 
import { TimelineEditorDialog } from './TimelineEditorDialog'; // << 1. SUBSTITUIR IMPORTAÇÃO
import { ChordDiagram } from './ChordDiagram';
import { Ruler } from './Ruler'; // << IMPORTAR O NOVO COMPONENTE
import { TrackNotesDialog } from './TrackNotesDialog'; // << IMPORTADO
import { gainToDb, gainToSlider, sliderToGain, formatDb, parseDbInput, hexToRgba } from '../lib/audioUtils';
import { usePlaybackEngine } from './usePlaybackEngine'; // << 1. IMPORTAR O NOVO HOOK
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
  onDragStart: (e: React.DragEvent<HTMLDivElement>, rulerId: string) => void;
}> = ({ rulerId, onDragStart }) => (
  <div
    draggable
    onDragStart={(e: React.DragEvent<HTMLDivElement>) => onDragStart(e, rulerId)}
    className="absolute left-1 top-1/2 -translate-y-1/2 p-1 cursor-grab active:cursor-grabbing opacity-30 hover:opacity-100 transition-opacity"
  >
    <GripVertical className="w-4 h-4 text-gray-400" />
  </div>
);

const RulerDropTarget: React.FC<{
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
}> = ({ onDrop, onDragOver }) => (
  <div
    className="absolute inset-0"
    onDrop={onDrop}
    onDragOver={onDragOver}
  />
);

// << REATORAÇÃO: Centralizando a lista de IDs de réguas >>
const ALL_RULER_IDS = ['time', 'measures', 'sections', 'chords', 'tempo'];


// Componente interno
const DAWPlayerContent: React.FC<{
  song: Song;
  onSongUpdate?: (song: Song) => void;
  onPerformanceMode?: () => void;
  onBack: () => void;
  onCreateProject?: (projectData: any) => void;
}> = ({ song, onSongUpdate, onPerformanceMode, onBack, onCreateProject }) => {

  const [keyShift, setKeyShift] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [editMode, setEditMode] = useState(song?.source === 'project');
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false); // << 2. RENOMEAR ESTADOS PARA CLAREZA
  const [editorType, setEditorType] = useState<'tempo' | 'timesig' | 'section' | 'chord'>('section');
  const [editingMarker, setEditingMarker] = useState<TempoChange | SectionMarker | ChordMarker | null>(null);
  const [containerWidth, setContainerWidth] = useState(1000);
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [trackNameInput, setTrackNameInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartTime, setDragStartTime] = useState<number | null>(null);
  const [hasDragged, setHasDragged] = useState(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [mixerVisible, setMixerVisible] = useState(true);
  const [mixerDockVisible, setMixerDockVisible] = useState(false);
  const [mixPresetsPopoverOpen, setMixPresetsPopoverOpen] = useState(false);
  const [isDraggingScrollbar, setIsDraggingScrollbar] = useState(false);
  const [isDraggingLeftHandle, setIsDraggingLeftHandle] = useState(false);
  const [isDraggingRightHandle, setIsDraggingRightHandle] = useState(false);
  const [handleDragStart, setHandleDragStart] = useState<{ x: number; scrollLeft: number } | null>(null);
  const [scrollUpdate, setScrollUpdate] = useState(0);
  const [isDraggingVerticalScrollbar, setIsDraggingVerticalScrollbar] = useState(false);
  const [selectedChord, setSelectedChord] = useState<{ chord: string; customDiagram?: any } | null>(null);
  const [editingChordMarker, setEditingChordMarker] = useState<ChordMarker | null>(null);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  // << ESTADOS DE WARP REMOVIDOS/SIMPLIFICADOS >>
  const [warpModeEnabled, setWarpModeEnabled] = useState(false);
  // Full tempo change objects (with timeSignature, curves, etc.)
  const [dynamicTempos, setDynamicTempos] = useState<TempoChange[]>([]);
  const [isDraggingTempoMarker, setIsDraggingTempoMarker] = useState(false);
  const [draggedTempoMarkerTime, setDraggedTempoMarkerTime] = useState<number | null>(null);
  
  const [editingTempoMarker, setEditingTempoMarker] = useState<TempoChange | null>(null);
  // << NOVO ESTADO >>: Para controlar os sliders de volume da sidebar
  const [sidebarSliderState, setSidebarSliderState] = useState<Record<string, { value: number; isDragging: boolean }>>({});

  // Mix presets state
  const [mixPresets, setMixPresets] = useState<MixPreset[]>([]);
  const [pinnedTracks, setPinnedTracks] = useState<Set<string>>(new Set());

  // Track notes state
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [selectedTrackForNotes, setSelectedTrackForNotes] = useState<AudioTrack | null>(null);
  const [notesPanelVisible, setNotesPanelVisible] = useState(false);

  const { isPlaying, currentTime, gridTime, tempo, loopEnabled, loopStart, loopEnd, metronomeEnabled, metronomeVolume, actions: playbackActions } = usePlaybackEngine({ song });

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

  // << NOVO EFEITO >>: Sincroniza o estado do slider da sidebar com as props da track
  useEffect(() => {
    if (song) {
      setSidebarSliderState((prevState: Record<string, { value: number; isDragging: boolean }>) => {
        const newState = { ...prevState };
        song.tracks.forEach((track: AudioTrack) => {
          // Apenas atualiza se não estiver arrastando
          if (!newState[track.id]?.isDragging) {
            newState[track.id] = { ...newState[track.id], value: gainToSlider(track.volume) };
          }
        });
        return newState;
      });
    }
  }, [song?.tracks]);

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

  // --- Custom scroll/zoom logic is handled elsewhere ---
  // Scrollbar horizontal customizada
  function getScrollPercentage(): number {
    if (!timelineScrollRef.current || timelineWidth <= containerWidth) return 0;
    return (timelineScrollRef.current.scrollLeft || 0) / (timelineWidth - containerWidth);
  }

  function getVisiblePercentage(): number {
    if (timelineWidth <= containerWidth) return 1;
    return containerWidth / timelineWidth;
  }

  // Drag handles para zoom horizontal - refatorado para estabilidade
  const [leftHandleDragStart, setLeftHandleDragStart] = useState<{ x: number; zoom: number; scrollLeft: number; rightEdgeTime: number } | null>(null);
  const [rightHandleDragStart, setRightHandleDragStart] = useState<{ x: number; zoom: number; scrollLeft: number; leftEdgeTime: number } | null>(null);

  useEffect(() => {
    let rafId: number | null = null;
    
    function onMouseMove(e: MouseEvent) {
      if (rafId) return; // Ignora se já há uma atualização pendente
      
      rafId = requestAnimationFrame(() => {
        // Handle esquerdo: fixa a ponta direita no tempo
        if (isDraggingLeftHandle && leftHandleDragStart && scrollbarRef.current && timelineScrollRef.current && song) {
          const rect = scrollbarRef.current.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const barWidth = rect.width;
          
          // Calcula onde o handle direito deve estar (fixo)
          const rightHandlePosition = (leftHandleDragStart.rightEdgeTime / song.duration) * barWidth;
          
          // Nova largura do thumb = distância entre mouse e handle direito
          let newThumbWidth = rightHandlePosition - mouseX;
          newThumbWidth = Math.max(20, Math.min(barWidth, newThumbWidth));
          
          // Novo zoom baseado na largura do thumb
          const newZoom = Math.max(1, Math.min(8, barWidth / newThumbWidth));
          const newTimelineWidth = containerWidth * newZoom;
          
          // Calcula novo scrollLeft para manter a borda direita fixa no tempo
          const newScrollLeft = (leftHandleDragStart.rightEdgeTime / song.duration) * newTimelineWidth - containerWidth;
          
          setZoom(newZoom);
          timelineScrollRef.current.scrollLeft = Math.max(0, Math.min(newScrollLeft, newTimelineWidth - containerWidth));
        }
        
        // Handle direito: fixa a ponta esquerda no tempo
        if (isDraggingRightHandle && rightHandleDragStart && scrollbarRef.current && timelineScrollRef.current && song) {
          const rect = scrollbarRef.current.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const barWidth = rect.width;
          
          // Calcula onde o handle esquerdo deve estar (fixo)
          const leftHandlePosition = (rightHandleDragStart.leftEdgeTime / song.duration) * barWidth;
          
          // Nova largura do thumb = distância entre handle esquerdo e mouse
          let newThumbWidth = mouseX - leftHandlePosition;
          newThumbWidth = Math.max(20, Math.min(barWidth, newThumbWidth));
          
          // Novo zoom baseado na largura do thumb
          const newZoom = Math.max(1, Math.min(8, barWidth / newThumbWidth));
          const newTimelineWidth = containerWidth * newZoom;
          
          // Calcula novo scrollLeft para manter a borda esquerda fixa no tempo
          const newScrollLeft = (rightHandleDragStart.leftEdgeTime / song.duration) * newTimelineWidth;
          
          setZoom(newZoom);
          timelineScrollRef.current.scrollLeft = Math.max(0, Math.min(newScrollLeft, newTimelineWidth - containerWidth));
        }
        
        rafId = null;
      });
    }
    
    function onMouseUp() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      setIsDraggingLeftHandle(false);
      setIsDraggingRightHandle(false);
      setLeftHandleDragStart(null);
      setRightHandleDragStart(null);
    }
    
    if (isDraggingLeftHandle || isDraggingRightHandle) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        if (rafId) cancelAnimationFrame(rafId);
      };
    }
  }, [isDraggingLeftHandle, isDraggingRightHandle, leftHandleDragStart, rightHandleDragStart, containerWidth, song]);

  function handleLeftHandleMouseDown(e: React.MouseEvent<HTMLDivElement>): void {
    if (!timelineScrollRef.current || !song) return;
    setIsDraggingLeftHandle(true);
    // Salva a posição da borda direita no tempo (tempo absoluto da música)
    const currentTimelineWidth = containerWidth * zoom;
    const scrollLeft = timelineScrollRef.current.scrollLeft;
    const rightEdgeTime = ((scrollLeft + containerWidth) / currentTimelineWidth) * song.duration;
    setLeftHandleDragStart({ x: e.clientX, zoom, scrollLeft, rightEdgeTime });
    e.stopPropagation();
  }
  function handleRightHandleMouseDown(e: React.MouseEvent<HTMLDivElement>): void {
    if (!timelineScrollRef.current || !song) return;
    setIsDraggingRightHandle(true);
    // Salva a posição da borda esquerda no tempo (tempo absoluto da música)
    const currentTimelineWidth = containerWidth * zoom;
    const scrollLeft = timelineScrollRef.current.scrollLeft;
    const leftEdgeTime = (scrollLeft / currentTimelineWidth) * song.duration;
    setRightHandleDragStart({ x: e.clientX, zoom, scrollLeft, leftEdgeTime });
    e.stopPropagation();
  }  function handleScrollbarMouseDown(e: React.MouseEvent<HTMLDivElement>): void {
    if (!timelineScrollRef.current || timelineWidth <= containerWidth) return;
    // Só inicia drag se clicar no thumb
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const thumbLeft = getScrollPercentage() * (rect.width - getVisiblePercentage() * rect.width);
    const thumbWidth = getVisiblePercentage() * rect.width;
    if (x >= thumbLeft && x <= thumbLeft + thumbWidth) {
      setIsDraggingScrollbar(true);
      setHandleDragStart({ x: e.clientX, scrollLeft: timelineScrollRef.current.scrollLeft });
      setIsDraggingScrollbar(true);
    } else {
      // Clique seco fora do thumb: move o scroll para a posição clicada
      const scrollableWidth = timelineWidth - containerWidth;
      const newScrollLeft = (x / rect.width) * scrollableWidth;
      timelineScrollRef.current.scrollLeft = newScrollLeft;
      setScrollUpdate((prev: number) => prev + 1);
    }
    e.stopPropagation();
  }

  // Scrollbar vertical customizada
  function getVerticalScrollPercentage(): number {
    if (!tracksScrollRef.current) return 0;
    const scrollTop = tracksScrollRef.current.scrollTop || 0;
    const maxScroll = tracksScrollRef.current.scrollHeight - tracksScrollRef.current.clientHeight;
    return maxScroll > 0 ? scrollTop / maxScroll : 0;
  }
  function getVerticalVisiblePercentage(): number {
    if (!tracksScrollRef.current) return 1;
    return tracksScrollRef.current.clientHeight / tracksScrollRef.current.scrollHeight;
  }
  // Drag do thumb vertical
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      // Drag do thumb vertical
      if (isDraggingVerticalScrollbar && verticalScrollbarRef.current && tracksScrollRef.current) {
        const rect = verticalScrollbarRef.current.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const scrollableHeight = tracksScrollRef.current.scrollHeight - tracksScrollRef.current.clientHeight;
        const newScrollTop = (y / rect.height) * scrollableHeight;
        tracksScrollRef.current.scrollTop = newScrollTop;
      }
      // Drag do thumb horizontal
      if (isDraggingScrollbar && handleDragStart && timelineScrollRef.current && timelineWidth > containerWidth) {
        const rect = scrollbarRef.current?.getBoundingClientRect();
        if (!rect) return;
        const delta = e.clientX - handleDragStart.x;
        const scrollableWidth = timelineWidth - containerWidth;
        const barWidth = rect.width;
        // O movimento do mouse é proporcional ao scrollableWidth
        const newScrollLeft = Math.max(0, Math.min(scrollableWidth, handleDragStart.scrollLeft + (delta * (scrollableWidth / (barWidth - getVisiblePercentage() * barWidth)))));
        timelineScrollRef.current.scrollLeft = newScrollLeft;
        setScrollUpdate((prev: number) => prev + 1);
      }
    }
    function onMouseUp() {
      setIsDraggingVerticalScrollbar(false);
      setIsDraggingScrollbar(false);
      setHandleDragStart(null);
    }
    if (isDraggingVerticalScrollbar || isDraggingScrollbar) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
    }
  }, [isDraggingVerticalScrollbar, isDraggingScrollbar, handleDragStart]);

  function handleVerticalScrollbarMouseDown(e: React.MouseEvent<HTMLDivElement>): void {
    setIsDraggingVerticalScrollbar(true);
    e.stopPropagation();
  }

  // Zoom controls
  function handleZoomOutOnPlayhead(): void {
    setZoom((prev: number) => Math.max(1, prev - 0.25));
  }
  function handleZoomInOnPlayhead(): void {
    setZoom((prev: number) => Math.min(8, prev + 0.25));
  }

  // Wheel scroll/zoom
  function handleWheel(e: React.WheelEvent<HTMLDivElement>): void {
    if (e.ctrlKey) {
      // Zoom com Ctrl + scroll
      if (e.deltaY < 0) handleZoomInOnPlayhead();
      else handleZoomOutOnPlayhead();
      e.preventDefault();
    }
  }


  const getWarpedTime = (currentGridTime: number): number => {
    if (!song) return currentGridTime;
    const tempos = dynamicTempos.length > 0 ? dynamicTempos : (song.tempoChanges || []);
    return utilsGetWarpedTime(currentGridTime, tempos, song.tempo, warpModeEnabled);
  };

  // Sync dynamicTempos with the song's tempoChanges
  useEffect(() => {
    if (song) {
      setDynamicTempos(song.tempoChanges || [{ time: 0, tempo: song.tempo, timeSignature: '4/4' }]);
    }
  }, [song?.tempoChanges, song?.tempo]);


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
          playbackActions.togglePlayPause(); // << 3. USAR AÇÕES DO HOOK >>
          playbackActions.togglePlayPause();
          return;
        }
        
        // Only allow other shortcuts when not in input field
        if (isInputField) return;
        
        // Home: Go to start
        if (e.code === 'Home') {
          e.preventDefault();
          playbackActions.seek(0);
          playbackActions.seek(0); // << 3. USAR AÇÕES DO HOOK >>
          return;
        }
        
        // End: Go to end
        if (e.code === 'End' && song) {
          e.preventDefault();
          playbackActions.seek(song.duration);
          playbackActions.seek(song.duration); // << 3. USAR AÇÕES DO HOOK >>
          return;
        }
        
        // L: Toggle loop
        if (e.code === 'KeyL' && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          playbackActions.setLoopEnabled((prev: boolean) => !prev);
          return;
        }
        
        // M: Toggle metronome
        if (e.code === 'KeyM' && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          playbackActions.setMetronomeEnabled((prev: boolean) => !prev);
          return;
        }
        
        // R: Reset to start
        if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          playbackActions.seek(0);
          playbackActions.seek(0); // << 3. USAR AÇÕES DO HOOK >>
          return;
        }
        
        // +/=: Zoom in
        if ((e.code === 'Equal' || e.code === 'NumpadAdd') && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setZoom((prev: number) => Math.min(8, prev + 0.25));
          return;
        }
        
        // -: Zoom out
        if ((e.code === 'Minus' || e.code === 'NumpadSubtract') && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setZoom((prev: number) => Math.max(1, prev - 0.25));
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
          playbackActions.seek(gridTime - 5);
          playbackActions.seek(gridTime - 5); // << 3. USAR AÇÕES DO HOOK >>
          return;
        }
        
        // Right Arrow: Jump forward (5 seconds)
        if (e.code === 'ArrowRight' && !e.shiftKey) {
          e.preventDefault();
          playbackActions.seek(gridTime + 5);
          playbackActions.seek(gridTime + 5); // << 3. USAR AÇÕES DO HOOK >>
          return;
        }
        
        // Shift+Left: Previous section
        if (e.code === 'ArrowLeft' && e.shiftKey && song) {
          e.preventDefault();
          const sorted = [...song.markers].sort((a, b) => a.time - b.time);
          const prevMarker = sorted.reverse().find((m) => m.time < gridTime - 1);
          if (prevMarker) {
            playbackActions.seek(prevMarker.time);
            playbackActions.seek(prevMarker.time); // << 3. USAR AÇÕES DO HOOK >>
          }
          return;
        }
        
        // Shift+Right: Next section
        if (e.code === 'ArrowRight' && e.shiftKey && song) {
          e.preventDefault();
          const sorted = [...song.markers].sort((a, b) => a.time - b.time);
          const nextMarker = sorted.find((m) => m.time > gridTime);
          if (nextMarker) {
            playbackActions.seek(nextMarker.time);
            playbackActions.seek(nextMarker.time); // << 3. USAR AÇÕES DO HOOK >>
          }
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown); // getWarpedTime removido
  }, [song, gridTime, playbackActions]);

  // << LÓGICA DE MANIPULAÇÃO DE TRACKS ATUALIZADA >>
  // Agora, em vez de usar `setTracks`, chamamos `onSongUpdate` diretamente.
  const handleTrackVolumeChange = (trackId: string, volume: number) => {
    if (!song || !onSongUpdate) return;
    const safeVolume = isNaN(volume) || !isFinite(volume) ? 1.0 : Math.max(0, Math.min(10, volume)); // Garante valor seguro
    const newTracks = song.tracks.map((t: AudioTrack) => (t.id === trackId ? { ...t, volume: safeVolume } : t));
    onSongUpdate({ ...song, tracks: newTracks });
  };

  const handleTrackMuteToggle = (trackId: string) => {
    if (!song || !onSongUpdate) return;
    const newTracks = song.tracks.map((t: AudioTrack) => (t.id === trackId ? { ...t, muted: !t.muted } : t));
    onSongUpdate({ ...song, tracks: newTracks });
  };

  const handleTrackSoloToggle = (trackId: string) => {
    if (!song || !onSongUpdate) return;
    const newTracks = song.tracks.map((t: AudioTrack) => (t.id === trackId ? { ...t, solo: !t.solo } : t));
    onSongUpdate({ ...song, tracks: newTracks });
  };

  const handleTrackNameChange = (trackId: string, newName: string) => {
    if (!song || !onSongUpdate) return;
    const newTracks = song.tracks.map((t: AudioTrack) => (t.id === trackId ? { ...t, name: newName } : t));
    onSongUpdate({ ...song, tracks: newTracks });
  };

  const handleTrackColorChange = (trackId: string, color: string) => {
    if (!song || !onSongUpdate) return;
    const newTracks = song.tracks.map((t: AudioTrack) => (t.id === trackId ? { ...t, color } : t));
    onSongUpdate({ ...song, tracks: newTracks });
  };

  const handleTrackTagChange = (trackId: string, tag: TrackTag) => {
    if (!song || !onSongUpdate) return;
    const newTracks = song.tracks.map((t: AudioTrack) => (t.id === trackId ? { ...t, tag } : t));
    onSongUpdate({ ...song, tracks: newTracks });
  };

  // << NOVA FUNÇÃO >>
  const handleSaveTrackNotes = (notes: string) => {
    if (!selectedTrackForNotes || !song || !onSongUpdate) return;
    const newTracks = song.tracks.map((t: AudioTrack) =>
      t.id === selectedTrackForNotes.id ? { ...t, notes } : t
    );
    onSongUpdate({ ...song, tracks: newTracks });
    // Fechar o dialog (o onOpenChange fará isso)
  };

  const handleSectionClick = (markerIndex: number) => {
    if (!song) return;

    const marker = song.markers[markerIndex];
    const nextMarker = song.markers[markerIndex + 1];

    const sectionStart = marker.time;
    const sectionEnd = nextMarker ? nextMarker.time : song.duration;

    playbackActions.seek(sectionStart);
    playbackActions.setLoopStart(sectionStart);
    playbackActions.setLoopEnd(sectionEnd);
    playbackActions.setLoopEnabled(true);
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
      tracks: (song?.tracks || [])
        .filter((t: AudioTrack) => !pinnedTracks.has(t.id)) // Only save non-pinned tracks
        .map((t: AudioTrack) => ({
          trackId: t.id,
          volume: t.volume,
          muted: t.muted,
        })),
    };
    setMixPresets((prev: MixPreset[]) => [...prev, newPreset]);
  };

  const handleLoadMixPreset = (presetId: string) => {
    const preset = mixPresets.find((p: MixPreset) => p.id === presetId);
    if (!preset) return;

    if (!song || !onSongUpdate) return;
    const newTracks = song.tracks.map((track: AudioTrack) => {
        // Skip pinned tracks
        if (pinnedTracks.has(track.id)) return track;

        const presetTrack = preset.tracks.find((pt: any) => pt.trackId === track.id);
        if (presetTrack) {
            return {
                ...track,
                volume: presetTrack.volume,
                muted: presetTrack.muted,
            };
        }
        return track;
    });

    // Chamar onSongUpdate com as novas tracks
    onSongUpdate({ ...song, tracks: newTracks });
  };

  const handleDeleteMixPreset = (presetId: string) => {
    setMixPresets((prev: MixPreset[]) => prev.filter((p: MixPreset) => p.id !== presetId));
  };

  const handleToggleTrackPin = (trackId: string) => {
    setPinnedTracks((prev: Set<string>) => {
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
  onSongUpdate?.({
      ...song,
      notes: [...(song.notes || []), newNote],
    });
  };

  const handleDeleteSongNote = (noteId: string) => {
    if (!song) return;
  onSongUpdate?.({
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


    setIsDragging(true);
    setDragStartTime(time);
    setDragStartX(e.clientX);
    setHasDragged(false);
  };

  const handleWaveformMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!song) return;

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
  playbackActions.setLoopStart(time);
  playbackActions.setLoopEnd(snappedDragStart);
      } else {
  playbackActions.setLoopStart(snappedDragStart);
  playbackActions.setLoopEnd(time);
      }
    }
  };

  const handleWaveformMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
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
          playbackActions.setLoopStart(null);
          playbackActions.setLoopEnd(null);
        }
      }

      // Seek to clicked position
      const newGridTime = Math.max(0, Math.min(snappedClickTime, song.duration));
      playbackActions.seek(newGridTime);
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

  // << 3. ATUALIZAR FUNÇÃO PARA ABRIR O EDITOR
  const openMarkerEditor = (type: 'tempo' | 'timesig' | 'section' | 'chord', data: TempoChange | SectionMarker | ChordMarker | null = null) => {
    setEditorType(type);
    setEditingMarker(data);
    setEditorOpen(true);
  };

  const handleTimelineItemSubmit = (action: 'add' | 'update' | 'delete', data: any) => {
    if (!song || !onSongUpdate) return;

    let updatedSong = { ...song };

    // << 4. AJUSTAR LÓGICA DE TIPO (REMOVER 'tempo_timesig')
    const itemType = editorType;

    switch (itemType) {
      case 'tempo':
      case 'timesig':
        const tempoChanges = updatedSong.tempoChanges || [];
        if (action === 'add') {
            updatedSong.tempoChanges = [...tempoChanges, data].sort((a, b) => a.time - b.time);
        } else if (action === 'update' && editingMarker) {
            updatedSong.tempoChanges = tempoChanges.map(tc => tc.time === editingMarker.time ? { ...tc, ...data } : tc);
        } else if (action === 'delete' && editingMarker) {
            updatedSong.tempoChanges = tempoChanges.filter(tc => tc.time !== editingMarker.time);
        }
        break;
      case 'section':
        if (action === 'update' && editingMarker) {
            updatedSong.markers = (updatedSong.markers || [])
                .map(marker => marker.id === (editingMarker as SectionMarker).id ? { ...marker, ...data } : marker)
                .sort((a, b) => a.time - b.time);
        } else if (action === 'delete' && editingMarker) {
            updatedSong.markers = (updatedSong.markers || [])
                .filter(marker => marker.id !== (editingMarker as SectionMarker).id)
                .sort((a, b) => a.time - b.time);
        } else if (action === 'add') {
            updatedSong.markers = [...(updatedSong.markers || []), {
                id: `marker-${Date.now()}`,
                ...data
            }].sort((a, b) => a.time - b.time);
        }
        break;
      case 'chord':
        if (action === 'update' && editingMarker) {
            updatedSong.chordMarkers = (updatedSong.chordMarkers || [])
                .map(marker => marker.time === editingMarker.time ? { ...marker, ...data } : marker)
                .sort((a, b) => a.time - b.time);
        } else if (action === 'delete' && editingMarker) {
            updatedSong.chordMarkers = (updatedSong.chordMarkers || [])
                .filter(marker => marker.time !== editingMarker.time)
                .sort((a, b) => a.time - b.time);
        } else if (action === 'add') {
            updatedSong.chordMarkers = [...(updatedSong.chordMarkers || []), data].sort((a, b) => a.time - b.time);
        }
        break;
    }

    onSongUpdate(updatedSong);
    setEditorOpen(false);
    setEditingMarker(null);
  };

  // << NOVA FUNÇÃO PARA O CLICK NO ACORDE >>
  const handleChordClick = (chord: ChordMarker) => {
    if (editMode) {
      // Em modo de edição, abre o editor de acordes
      openMarkerEditor('chord', chord);
    } else {
      // Em modo de visualização, mostra o diagrama
      setSelectedChord({ chord: chord.chord, customDiagram: chord.customDiagram });
    }
  };

  // << REATORAÇÃO: A lógica principal do player agora está aqui >>
  // O código restante do componente (a partir daqui) permanece o mesmo,
  // mas agora está dentro do `DAWPlayerContent`.


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

  // ... (o resto do JSX do return principal vai aqui)

  
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

  const currentTracks = song?.tracks || [];
  const isAnySolo = currentTracks.some((t) => t.solo);

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
  const timeMarkers: number[] = [];
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
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = '#5A5A5A'}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = '#404040'}
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
                  onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = '#5A5A5A'}
                  onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = '#404040'}
                  onClick={playbackActions.stop}
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
                  onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.backgroundColor = isPlaying ? '#22C55E' : '#5A5A5A'}
                  onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.backgroundColor = isPlaying ? '#4ADE80' : '#404040'}
                  onClick={playbackActions.togglePlayPause}
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
                  onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.backgroundColor = loopEnabled ? '#2563EB' : '#5A5A5A'}
                  onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.backgroundColor = loopEnabled ? '#3B82F6' : '#404040'}
                  onClick={() => playbackActions.setLoopEnabled(!loopEnabled)}
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
                  onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.backgroundColor = metronomeEnabled ? '#2563EB' : '#5A5A5A'}
                  onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.backgroundColor = metronomeEnabled ? '#3B82F6' : '#404040'}
                  onClick={() => playbackActions.setMetronomeEnabled(!metronomeEnabled)}
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
                  onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = metronomeEnabled ? '#2563EB' : '#5A5A5A'}
                  onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = metronomeEnabled ? '#3B82F6' : '#404040'}
                >
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 p-4" style={{ backgroundColor: '#2B2B2B', borderColor: '#3A3A3A' }}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm" style={{ color: '#F1F1F1' }}>Metronome Volume</Label>
                    <span className="text-sm" style={{ color: '#9E9E9E' }}>{formatDb(gainToDb(metronomeVolume))} dB</span>
                  </div>
                  <Slider
                    value={[gainToSlider(metronomeVolume)]}
                    onValueChange={([value]: [number]) => playbackActions.setMetronomeVolume(sliderToGain(value))}
                    max={100}
                    step={0.1}
                    className="w-full"
                    onDoubleClick={() => {
                      playbackActions.setMetronomeVolume(0.5);
                      playbackActions.setMetronomeVolume(0.5); // << 3. USAR AÇÕES DO HOOK >>
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
            onTempoChange={playbackActions.setTempo}
            keyShift={keyShift}
            onKeyShiftChange={setKeyShift}
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
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = snapEnabled ? '#2563EB' : '#5A5A5A'}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = snapEnabled ? '#3B82F6' : '#404040'}
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
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.backgroundColor = '#5A5A5A')}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.backgroundColor = '#404040')}
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
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = '#5A5A5A'}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = '#404040'}
                onClick={() => openMarkerEditor('section')}
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
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = '#5A5A5A'}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = '#404040'}
                onClick={() => openMarkerEditor('chord')}
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
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = '#5A5A5A'}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = '#404040'}
                onClick={() => openMarkerEditor('tempo')} // << 5. MUDAR PARA 'tempo' POR PADRÃO
              >
                <Clock className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add Tempo/Time Signature</TooltipContent>
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
                onClick={() => setWarpModeEnabled(!warpModeEnabled)}
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
            
                                        onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = '#5A5A5A'}
            
                                        onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = '#404040'}
            
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
                  onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = '#5A5A5A'}
                  onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = '#404040'}
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
                
                // Mapa de rótulos dos rulers
                const rulerLabelMap: Record<string, string> = {
                  time: 'Time',
                  measures: 'Measures',
                  tempo: 'Tempo',
                  chords: 'Chords',
                  sections: 'Sections',
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
            >{currentTracks.map((track) => (
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
                      <>
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
                      </>

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
                        onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = track.muted ? '#EF4444' : '#5A5A5A'}
                        onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = track.muted ? '#F87171' : '#404040'}
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
                        onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = track.solo ? '#F59E0B' : '#5A5A5A'}
                        onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = track.solo ? '#FBBF24' : '#404040'}
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
                              {sidebarSliderState[track.id]?.isDragging
                                ? formatDb(gainToDb(sliderToGain(sidebarSliderState[track.id].value)))
                                : formatDb(gainToDb(track.volume || 1.0))
                              }
                            </Button> 
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-48 p-3" style={{ backgroundColor: '#2B2B2B', borderColor: '#3A3A3A' }}>
                            <div className="flex items-center gap-2">
                              <Input
                                type="text"
                                defaultValue={formatDb(gainToDb(track.volume || 1.0))}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  // Este input não precisa de estado local complexo pois a mudança é em on-blur
                                }}
                                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                  const parsed = parseDbInput(e.target.value);
                                  if (parsed !== null && isFinite(parsed)) {
                                    handleTrackVolumeChange(track.id, parsed);
                                  } else {
                                    // Reseta para o valor atual se a entrada for inválida
                                    e.target.value = formatDb(gainToDb(track.volume || 1.0));
                                  }
                                }}
                                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                }}
                                onClick={(e: React.MouseEvent<HTMLInputElement>) => (e.target as HTMLInputElement).select()}
                                onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.target.select()}
                                className="h-8 text-center bg-gray-700 text-white border-gray-600"
                              />
                              <span className="text-sm text-gray-400">dB</span>
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {/* << SLIDER ATUALIZADO >> */}
                        <div
                          className="flex-1 min-w-0"
                          onPointerDown={() => {
                            setSidebarSliderState(prev => ({ ...prev, [track.id]: { ...prev[track.id], isDragging: true } }));
                          }}
                          onPointerUp={() => {
                            setSidebarSliderState(prev => {
                              const trackState = prev[track.id];
                              if (trackState) {
                                handleTrackVolumeChange(track.id, sliderToGain(trackState.value));
                              }
                              return { ...prev, [track.id]: { ...trackState, isDragging: false } };
                            });
                          }}
                        >
                          <Slider
                            value={[sidebarSliderState[track.id]?.value ?? gainToSlider(track.volume)]}
                            onValueChange={(values: number[]) => {
                              const value = values[0];
                              setSidebarSliderState(prev => ({ ...prev, [track.id]: { ...prev[track.id], value } }));
                            }}
                            max={100}
                            step={0.1}
                            className="w-full"
                            onDoubleClick={() => handleTrackVolumeChange(track.id, 1.0)}
                          />
                        </div>
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
            onContextMenu={(e) => { // << CONTEXT MENU PARA REMOVER PONTOS DE TEMPO >>
              if (!warpModeEnabled || !song || !onSongUpdate) return;

              const rect = (e.currentTarget as HTMLElement).closest('.tempo-ruler-interactive')?.getBoundingClientRect();
              if (!rect) return;

              const x = e.clientX - rect.left;
              const scrollLeft = timelineScrollRef.current?.scrollLeft || 0;
              const totalWidth = (containerWidth * zoom);
              
              const markerRadiusPx = 8;
              let markerClicked: TempoChange | null = null;

              for (const change of dynamicTempos) {
                if (change.time === 0) continue; // Cannot delete the first marker
                const gridPositionPx = (change.time / song.duration) * totalWidth;
                const distance = Math.abs((x + scrollLeft) - gridPositionPx);
                if (distance < markerRadiusPx) {
                  markerClicked = change;
                  break;
                }
              }

              if (markerClicked) {
                e.preventDefault();
                const newTempos = dynamicTempos.filter((t: TempoChange) => t.time !== markerClicked!.time);
                onSongUpdate({ ...song, tempoChanges: newTempos });
              }
            }}
          >
            <div style={{ width: timelineWidth }} className="relative">
              {/* Time Row */}
              {/* << REATORAÇÃO: Renderização das réguas agora usa o componente Ruler >> */}
              {rulerOrder.map(rulerId => {
                if (!rulerVisibility[rulerId]) return null;
 
                return (
                  <Ruler
                    key={rulerId}
                    rulerId={rulerId as any}
                    song={song}
                    timelineWidth={timelineWidth}
                    zoom={zoom}
                    editMode={editMode}
                    keyShift={keyShift}
                    showBeats={showBeats}
                    onRulerDrop={handleRulerDrop}
                    onRulerDragOver={handleRulerDragOver}
                    onSectionClick={handleSectionClick}
                    onTempoMarkerClick={(data) => openMarkerEditor('tempo', data)}
                    onChordClick={handleChordClick}
                  />
                );
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
            <div style={{ width: timelineWidth, minHeight: '100%', transition: 'transform 0s' }} className="relative tracks-content">{currentTracks.map((track, index) => (
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
                    height: currentTracks.length * getTrackHeightPx()
                  }}
                />
              )}

              {/* Loop end marker */}
              {loopEnd !== null && (
                <div
                  className="absolute top-0 w-1 bg-yellow-500 pointer-events-none z-10"
                  style={{
                    left: (loopEnd / song.duration) * timelineWidth,
                    height: currentTracks.length * getTrackHeightPx()
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
                  onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = '#7A7A7A'}
                  onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = '#5A5A5A'}
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
          tracks={currentTracks}
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
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => zoom > 1 && (e.currentTarget.style.backgroundColor = '#5A5A5A')}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => zoom > 1 && (e.currentTarget.style.backgroundColor = '#404040')}
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
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => zoom < 8 && (e.currentTarget.style.backgroundColor = '#5A5A5A')}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => zoom < 8 && (e.currentTarget.style.backgroundColor = '#404040')}
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
            className="relative rounded-full cursor-pointer"
            style={{ backgroundColor: '#171717', height: '6px' }}
            onMouseDown={handleScrollbarMouseDown}
          >
            {/* Scrollbar Thumb with Circular Handles */}
            <div
              className="absolute top-0 h-full rounded-full flex items-center justify-between"
              style={{
                backgroundColor: '#5A5A5A',
                left: `${getScrollPercentage() * (100 - getVisiblePercentage() * 100)}%`,
                width: `${getVisiblePercentage() * 100}%`,
                minWidth: '30px'
              }}
            >
              {/* Left Handle (Circle) */}
              <div
                className="rounded-full flex items-center justify-center cursor-ew-resize"
                style={{ 
                  backgroundColor: '#7A7A7A',
                  width: '14px',
                  height: '14px',
                  marginLeft: '-7px',
                  border: '1px solid #3A3A3A'
                }}
                onMouseDown={handleLeftHandleMouseDown}
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = '#9A9A9A'}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = '#7A7A7A'}
              />

              {/* Right Handle (Circle) */}
              <div
                className="rounded-full flex items-center justify-center cursor-ew-resize"
                style={{ 
                  backgroundColor: '#7A7A7A',
                  width: '14px',
                  height: '14px',
                  marginRight: '-7px',
                  border: '1px solid #3A3A3A'
                }}
                onMouseDown={handleRightHandleMouseDown}
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = '#9A9A9A'}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = '#7A7A7A'}
              />
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
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = '#5A5A5A'}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = '#404040'}
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
                <div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded"
                    style={{ backgroundColor: '#404040', color: '#F1F1F1' }}
                    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = '#5A5A5A'}
                    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = '#404040'}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
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
                      onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = '#5A5A5A'}
                      onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = '#404040'}
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
                <MixPresetsManager // << CORREÇÃO: Passar `song.mixPresets` >>
                  tracks={currentTracks}
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
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = mixerDockVisible ? '#3B82F6' : '#5A5A5A'}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = mixerDockVisible ? '#3B82F6' : '#404040'}
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
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = notesPanelVisible ? '#3B82F6' : '#5A5A5A'}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = notesPanelVisible ? '#3B82F6' : '#404040'}
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
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = '#5A5A5A'}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.backgroundColor = '#404040'}
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

      {/* << 6. RENDERIZAR O NOVO DIÁLOGO >> */}
      <TimelineEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        type={editorType}
        currentTime={currentTime}
        initialData={editingMarker}
        onSubmit={handleTimelineItemSubmit}
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
};

// Componente exportado
export function DAWPlayer({ song, onSongUpdate, onPerformanceMode, onBack, onCreateProject }: DAWPlayerProps) {
  // End of DAWPlayerContent. Now render the outer DAWPlayer wrapper.
  if (!song) {
    return null as any;
  }

  return (
    <DAWPlayerContent
      song={song as Song}
      onSongUpdate={onSongUpdate}
      onPerformanceMode={onPerformanceMode}
      onBack={onBack}
      onCreateProject={onCreateProject}
    />
  );
}

function generateWaveformPath(data: number[] | undefined, width: number, height: number): string {
  // Simple, self-contained SVG path generator for waveform preview.
  // - `data` is expected to be an array of amplitudes in [-1, 1].
  // - The function downsamples/clamps the data to `width` points and
  //   returns a closed path suitable for an SVG <path d="..." /> attribute.
  if (!data || data.length === 0 || width <= 0 || height <= 0) return '';

  const samples = Math.max(1, Math.min(Math.floor(width), data.length));
  const step = data.length / samples;
  const mid = height / 2;

  const topPoints: string[] = [];
  for (let i = 0; i < samples; i++) {
    const idx = Math.floor(i * step);
    const v = Math.max(-1, Math.min(1, data[idx]));
    const x = (i / (samples - 1 || 1)) * width;
    const y = mid - v * (mid - 1); // leave 1px padding
    topPoints.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }

  // Build path: move to first top point, draw lines across top, then back across bottom
  let path = `M${topPoints[0].replace(',', ' ')}`;
  for (let i = 1; i < topPoints.length; i++) {
    path += ` L${topPoints[i].replace(',', ' ')}`;
  }

  // Bottom points: mirror amplitudes to create a closed filled shape
  for (let i = samples - 1; i >= 0; i--) {
    const [xStr, yStr] = topPoints[i].split(',');
    const x = parseFloat(xStr);
    // Mirror around mid to get bottom y
    const topY = parseFloat(yStr);
    const bottomY = mid + (mid - topY);
    path += ` L${x.toFixed(2)} ${bottomY.toFixed(2)}`;
  }

  path += ' Z';
  return path;
}