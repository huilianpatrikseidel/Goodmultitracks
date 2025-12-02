import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  Repeat,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ArrowLeft,
  Plus,
  Download,
  Clock,
  Music2,
  Grid3x3,
  PanelLeftClose,
  PanelLeft,
  Settings,
  Sliders,
  Keyboard,
  Save,
  StickyNote,
  X,
  GripVertical,
} from 'lucide-react';
import { PlayerViewSettings } from '../../../components/PlayerViewSettings';
import { PlaybackControls } from '../../../components/PlaybackControls';
import { KeyboardShortcutsHelp } from '../../../components/shared/KeyboardShortcutsHelp';
import { MixPresetsManager } from './mixer/MixPresetsManager';
import { MixerDock } from './mixer/MixerDock';
import { NotesPanel } from '../../../components/NotesPanel';
import { Button } from '../../../components/ui/button';
import { getWarpedTime as utilsGetWarpedTime } from '../utils/warpUtils';
import { Song, AudioTrack, SectionMarker, TempoChange, ChordMarker, MixPreset } from '../../../types';
import { Separator } from '../../../components/ui/separator';
import { CreateProjectDialog } from '../../../features/library/components/CreateProjectDialog'; 
import { TimelineEditorDialog } from '../../../components/TimelineEditorDialog';
import { ChordDiagram } from '../../../components/ChordDiagram';
import { TrackNotesDialog } from '../../../components/TrackNotesDialog';
import { ScrollZoomSlider } from '../../../components/ScrollZoomSlider';
import { VerticalScrollbar } from '../../../components/VerticalScrollbar';
import { ProjectProvider } from '../../../contexts/ProjectContext';
import { usePlaybackEngine } from '../hooks/usePlaybackEngine';
import { useKeyboardShortcuts } from './player/hooks/useKeyboardShortcuts';
import { useViewSettings } from './player/hooks/useViewSettings';
import { useTrackActions } from './player/hooks/useTrackActions';
import { TimelineContainer } from './player/TimelineContainer';
import { TransportHeader } from './player/TransportHeader';
import { TrackListSidebar } from '../../../components/TrackListSidebar';
import { BetaWarningBanner } from './BetaWarningBanner';
import { RulerSidebarHeaders } from './player/RulerSidebarHeaders';
import { storage } from '../../../lib/localStorageManager';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../components/ui/tooltip';
import { toast } from 'sonner';
import { useLanguage } from '../../../lib/LanguageContext';
import { RulersContainer } from './player/RulersContainer';
import { ZOOM } from '../../../config/constants';
import { measureToSeconds, secondsToMeasure, calculateWarpBPM } from '../../../lib/timeUtils';

interface DAWPlayerProps {
  song: Song | null;
  onSongUpdate?: (song: Song) => void;
  onPerformanceMode?: () => void;
  onBack: () => void;
  onCreateProject?: (projectData: any) => Promise<void>;
  onExportProject?: (song: Song) => void;
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

// ============================================================================
// TimelineNavigator - Componente de Scroll/Zoom (Range Slider)
// ============================================================================
const TimelineNavigator: React.FC<{
  songDuration: number;
  zoom: number;
  containerWidth: number;
  timelineRef: React.RefObject<HTMLDivElement | null>;
  onNavigate: (newZoom: number, newScrollLeft: number) => void;
}> = ({ songDuration, zoom, containerWidth, timelineRef, onNavigate }) => {
  const [range, setRange] = useState({ start: 0, end: 1 });
  const isDraggingRef = useRef(false);

  // Sync from Timeline to Slider
  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;

    const updateRange = () => {
      if (isDraggingRef.current) return;

      const scrollLeft = timeline.scrollLeft;
      const totalWidth = songDuration * ZOOM.BASE_PPS * zoom;
      
      if (totalWidth === 0) return;

      const start = scrollLeft / totalWidth;
      const end = (scrollLeft + containerWidth) / totalWidth;

      setRange({
        start: Math.max(0, start),
        end: Math.min(1, end)
      });
    };

    updateRange();
    timeline.addEventListener('scroll', updateRange);
    return () => timeline.removeEventListener('scroll', updateRange);
  }, [songDuration, zoom, containerWidth, timelineRef]);

  const handleSliderChange = React.useCallback(({ start, end }: { start: number; end: number }) => {
    isDraggingRef.current = true;
    setRange({ start, end });

    const widthPercent = end - start;
    if (widthPercent <= 0.0001) return;

    // Calculate new zoom
    const newTotalWidth = containerWidth / widthPercent;
    const newZoom = newTotalWidth / (songDuration * ZOOM.BASE_PPS);
    
    // Clamp zoom
    const clampedZoom = Math.max(ZOOM.MIN, Math.min(ZOOM.MAX, newZoom));
    
    // Calculate new scroll
    const actualTotalWidth = songDuration * ZOOM.BASE_PPS * clampedZoom;
    const newScrollLeft = start * actualTotalWidth;

    onNavigate(clampedZoom, newScrollLeft);
    
    setTimeout(() => {
        isDraggingRef.current = false;
    }, 100);
  }, [containerWidth, songDuration, onNavigate]);

  return (
    <div className="flex-1 px-4 flex items-center h-full">
      <ScrollZoomSlider
        start={range.start}
        end={range.end}
        onChange={handleSliderChange}
        className="h-5 w-full"
      />
    </div>
  );
};

// ============================================================================
// DAWPlayerContent - Componente interno extraído (CORREÇÃO DE BUG)
// ============================================================================
// IMPORTANTE: Este componente foi movido para fora do escopo de DAWPlayer
// para evitar que seja recriado a cada render, o que causava reset de estado
// (warpGridMode voltava a false após cada update)
// ============================================================================

interface DAWPlayerContentProps {
  song: Song;
  onSongUpdate?: (song: Song) => void;
  onPerformanceMode?: () => void;
  onBack: () => void;
  onExportProject?: (song: Song) => void;
}

function DAWPlayerContent({ song, onSongUpdate, onPerformanceMode, onBack, onExportProject }: DAWPlayerContentProps) {
  const { t } = useLanguage();

  const [keyShift, setKeyShift] = useState(0);
  const viewSettings = useViewSettings();
  const { zoom, setZoom, trackHeight, setTrackHeight, rulerVisibility, rulerOrder, setRulerOrder } = viewSettings;
  const [editMode, setEditMode] = useState(song?.source === 'project');
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorType, setEditorType] = useState<'tempo' | 'timesig' | 'section' | 'chord'>('section');
  const [editingMarker, setEditingMarker] = useState<TempoChange | SectionMarker | ChordMarker | null>(null);
  const [containerWidth, setContainerWidth] = useState(1000);
  
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [mixerVisible, setMixerVisible] = useState(true);
  const [mixerDockVisible, setMixerDockVisible] = useState(false);
  const [mixPresetsPopoverOpen, setMixPresetsPopoverOpen] = useState(false);
  
  // P0 FIX: Desacoplado do estado React para evitar re-render storm
  // Usamos apenas ref para coordenadas de scroll em tempo real
  const scrollLeftRef = useRef(0);
  const [selectedChord, setSelectedChord] = useState<{ chord: string; customDiagram?: any } | null>(null);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [clickedTime, setClickedTime] = useState<number>(0);
  const [dynamicTempos, setDynamicTempos] = useState<TempoChange[]>([]);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartTime, setDragStartTime] = useState<number | null>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const [mixPresets, setMixPresets] = useState<MixPreset[]>([]);
  const [pinnedTracks, setPinnedTracks] = useState<Set<string>>(new Set());

  const [selectedTrackForNotes, setSelectedTrackForNotes] = useState<AudioTrack | null>(null);
  const [notesPanelVisible, setNotesPanelVisible] = useState(false);
  const [warpMode, setWarpMode] = useState(false);

  const { isPlaying, currentTime, gridTime, tempo, loopEnabled, loopStart, loopEnd, metronomeEnabled, metronomeVolume, actions: playbackActions } = usePlaybackEngine({ 
    song, 
    warpModeEnabled: false 
  });

  const trackActions = useTrackActions({ song, onSongUpdate });

  const rulerRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Armazena scroll pendente para aplicação atômica no próximo render (fix race condition)
  const pendingZoomScrollRef = useRef<number | null>(null);
  
  // FIX QA: Rastrear onde o mouse está para evitar loop de scroll infinito
  const hoveredContainerRef = useRef<'sidebar' | 'timeline' | null>(null);

  // Calculate zoom factor to fit entire project to screen
  // Zoom é baseado em ZOOM.BASE_PPS (50 pixels/segundo)
  const calculateFitZoom = () => {
    if (!song || containerWidth === 0) return 1;
    // Formula: containerWidth = duration * BASE_PPS * zoom
    // Resolve para zoom: zoom = containerWidth / (duration * BASE_PPS)
    return containerWidth / (song.duration * ZOOM.BASE_PPS);
  };

  // Calculate actual pixels per second based on zoom
  // PPS = BASE_PPS * zoom
  const getPixelsPerSecond = () => {
    return ZOOM.BASE_PPS * zoom;
  };

  useEffect(() => {
    const measureWidth = () => {
      // FIX: Usar timelineRef que está anexada ao TimelineContainer
      if (timelineRef.current) {
        setContainerWidth(timelineRef.current.clientWidth);
      }
    };

    // Delay para garantir que React montou o DOM
    const timeoutId = setTimeout(measureWidth, 0);
    window.addEventListener('resize', measureWidth);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', measureWidth);
    };
  }, []);

  // Auto Fit Zoom quando song é carregada pela primeira vez
  useEffect(() => {
    if (!song || containerWidth === 0) return;
    
    // Usa a duração da song (que já considera markers, sections, etc)
    // Removido 0.95 para ocupar 100% da largura (sem padding)
    const targetZoom = containerWidth / (song.duration * ZOOM.BASE_PPS);
    const safeZoom = Math.max(ZOOM.MIN, Math.min(ZOOM.MAX, targetZoom));
    
    setZoom(safeZoom);
    
    // Scroll para o início
    if (timelineRef.current) {
      timelineRef.current.scrollLeft = 0;
    }
  }, [song?.id, containerWidth]); // Executa apenas quando song.id ou containerWidth mudam

  const handleRulerVisibilityChange = (newVisibility: Record<string, boolean>) => {
    viewSettings.setRulerVisibility(newVisibility);
    // Salvar cada régua individualmente no storage
    Object.entries(newVisibility).forEach(([rulerId, visible]) => {
      storage.setRulerVisibility(rulerId, visible);
    });
  };

  const handleZoomOutOnPlayhead = () => {
    const newZoom = Math.max(ZOOM.MIN, zoom - ZOOM.STEP);
    setZoom(newZoom);
  };

  const handleZoomInOnPlayhead = () => {
    const newZoom = Math.min(ZOOM.MAX, zoom + ZOOM.STEP);
    setZoom(newZoom);
  };

  const handleFitToView = () => {
    if (!song || containerWidth === 0) return;
    
    // Usa a duração da song (que já considera todo o conteúdo)
    // Removido 0.95 para ocupar 100% da largura (sem padding)
    const targetZoom = containerWidth / (song.duration * ZOOM.BASE_PPS);
    
    // Garante que respeita os limites absolutos
    const safeZoom = Math.max(ZOOM.MIN, Math.min(ZOOM.MAX, targetZoom));
    
    setZoom(safeZoom);
    // Reseta o scroll para o início
    handleTimelineScroll(0);
  };

  const handleLoopRegionChange = (start: number, end: number) => {
    playbackActions.setLoopStart(start);
    playbackActions.setLoopEnd(end);
    playbackActions.setLoopEnabled(true);
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!song || !timelineRef.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    // FIX: rect.left já compensa o scroll (é negativo quando scrollado)
    // Adicionar scrollLeft novamente causava dupla contagem
    const x = e.clientX - rect.left;
    const pps = getPixelsPerSecond();
    const clickedTime = x / pps;
    
    playbackActions.seek(clickedTime);
  };

  // Wheel listener para zoom exponencial focado no playhead (com passive:false para preventDefault funcionar)
  useEffect(() => {
    const timelineElement = timelineRef.current;
    const rulerElement = rulerRef.current;
    
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();

        // 1. Calcular novo zoom (Exponencial)
        const zoomFactor = e.deltaY > 0 ? (1 / ZOOM.FACTOR) : ZOOM.FACTOR;
        const newZoom = Math.max(ZOOM.MIN, Math.min(ZOOM.MAX, zoom * zoomFactor));
        
        if (newZoom === zoom) return;

        // 2. Calcular a posição do cursor do mouse na timeline
        const rect = timelineRef.current?.getBoundingClientRect();
        const mouseX = rect ? e.clientX - rect.left : 0; // Posição do mouse relativa ao container visível
        
        const currentScroll = timelineRef.current?.scrollLeft || 0;
        
        // Posição absoluta do cursor na timeline (em pixels no zoom antigo)
        const cursorAbsolutePos = currentScroll + mouseX;
        
        // Converter para tempo e depois para nova posição em pixels
        const oldPPS = ZOOM.BASE_PPS * zoom;
        const cursorTime = cursorAbsolutePos / oldPPS;
        
        // 3. Aplicar novo zoom
        setZoom(newZoom);

        // 4. Calcular novo Scroll para manter o cursor na mesma posição visual
        const newPPS = ZOOM.BASE_PPS * newZoom;
        const newCursorAbsolutePos = cursorTime * newPPS;
        
        // Novo scroll = Nova Posição Absoluta do Cursor - Offset do Mouse na Tela
        // Isso mantém o ponto sob o cursor "fixo" enquanto o zoom acontece
        const newScroll = Math.max(0, newCursorAbsolutePos - mouseX);
        
        // FIX: Agendar scroll para useLayoutEffect (após DOM update, antes de paint)
        // Evita race condition onde scroll é aplicado antes da largura mudar
        pendingZoomScrollRef.current = newScroll;
      }
    };
    
    if (timelineElement) {
      timelineElement.addEventListener('wheel', handleWheel, { passive: false });
    }
    if (rulerElement) {
      rulerElement.addEventListener('wheel', handleWheel, { passive: false });
    }
    
    return () => {
      if (timelineElement) timelineElement.removeEventListener('wheel', handleWheel);
      if (rulerElement) rulerElement.removeEventListener('wheel', handleWheel);
    };
  }, [zoom, setZoom, currentTime]);

  useEffect(() => {
    if (song) {
      setDynamicTempos(song.tempoChanges || [{ time: 0, tempo: song.tempo, timeSignature: '4/4' }]);
    }
  }, [song?.tempoChanges, song?.tempo]);

  // FIX: Aplicação atômica do scroll após zoom (useLayoutEffect = após DOM update, antes de paint)
  React.useLayoutEffect(() => {
    if (pendingZoomScrollRef.current !== null) {
      const targetScroll = pendingZoomScrollRef.current;
      
      // Aplica scroll simultaneamente em timeline e ruler
      if (timelineRef.current) timelineRef.current.scrollLeft = targetScroll;
      if (rulerRef.current) rulerRef.current.scrollLeft = targetScroll;
      
      // Sincroniza ref de tracking
      scrollLeftRef.current = targetScroll;
      
      // Limpa pendente
      pendingZoomScrollRef.current = null;
    }
  }, [zoom]); // Roda sempre que zoom muda

  // Sincronização horizontal de scroll via refs
  const syncHorizontalScroll = React.useCallback((scrollLeft: number) => {
    if (rulerRef.current) rulerRef.current.scrollLeft = scrollLeft;
  }, []);

  // Handlers memoizados para evitar recriação e re-renders desnecessários
  // P0 FIX: Não dispara setState para evitar re-render storm a 60fps+
  const handleTimelineScroll = React.useCallback((scrollLeft: number) => {
    scrollLeftRef.current = scrollLeft;
    syncHorizontalScroll(scrollLeft);
  }, []);

  const handleNavigatorChange = React.useCallback((newZoom: number, newScrollLeft: number) => {
    setZoom(newZoom);
    // Force scroll update immediately
    if (timelineRef.current) timelineRef.current.scrollLeft = newScrollLeft;
    if (rulerRef.current) rulerRef.current.scrollLeft = newScrollLeft;
    scrollLeftRef.current = newScrollLeft;
  }, [setZoom]);
  
  // FIX QA: Sync vertical com Mutex para evitar loop infinito
  // Ref para rastrear a fonte ativa do scroll ('timeline' ou 'sidebar')
  const scrollingSourceRef = useRef<'timeline' | 'sidebar' | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const timelineEl = timelineRef.current;
    const sidebarEl = sidebarRef.current;
    if (!timelineEl || !sidebarEl) return;
    
    // Handler de scroll da Timeline
    const handleTimelineScroll = () => {
      // Se a sidebar estiver controlando o scroll, ignorar
      if (scrollingSourceRef.current === 'sidebar') return;
      
      // Marcar timeline como fonte
      scrollingSourceRef.current = 'timeline';
      
      // Sincronizar sidebar
      if (sidebarEl.scrollTop !== timelineEl.scrollTop) {
        sidebarEl.scrollTop = timelineEl.scrollTop;
      }
      setScrollTop(timelineEl.scrollTop);
      
      // Debounce para limpar a fonte
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        scrollingSourceRef.current = null;
      }, 100);
    };
    
    // Handler de scroll da Sidebar
    const handleSidebarScroll = () => {
      // Se a timeline estiver controlando o scroll, ignorar
      if (scrollingSourceRef.current === 'timeline') return;
      
      // Marcar sidebar como fonte
      scrollingSourceRef.current = 'sidebar';
      
      // Sincronizar timeline
      if (timelineEl.scrollTop !== sidebarEl.scrollTop) {
        timelineEl.scrollTop = sidebarEl.scrollTop;
      }
      
      // Debounce para limpar a fonte
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        scrollingSourceRef.current = null;
      }, 100);
    };
    
    timelineEl.addEventListener('scroll', handleTimelineScroll, { passive: true });
    sidebarEl.addEventListener('scroll', handleSidebarScroll, { passive: true });
    
    return () => {
      timelineEl.removeEventListener('scroll', handleTimelineScroll);
      sidebarEl.removeEventListener('scroll', handleSidebarScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  const handleTimelineMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  // FIX QA: Handler de scroll vindo da Sidebar (com proteção Mutex)
  const handleSidebarScroll = React.useCallback((scrollTop: number) => {
    // Só sincroniza Timeline se o scroll vier da Sidebar (não da Timeline)
    if (hoveredContainerRef.current === 'timeline') return;
    
    if (timelineRef.current) {
      if (timelineRef.current.scrollTop !== scrollTop) {
        timelineRef.current.scrollTop = scrollTop;
      }
    }
  }, []);

  // Handler para VerticalScrollbar
  const handleVerticalScrollbarChange = React.useCallback((range: { start: number; end: number }) => {
    if (!timelineRef.current) return;
    
    const totalHeight = timelineRef.current.scrollHeight;
    const newScrollTop = range.start * totalHeight;
    
    // Atualizar scroll de ambos os containers
    timelineRef.current.scrollTop = newScrollTop;
    if (sidebarRef.current) {
      sidebarRef.current.scrollTop = newScrollTop;
    }
  }, []);

  // Calcular range vertical para scrollbar
  const getVerticalScrollRange = React.useCallback(() => {
    if (!timelineRef.current) return { start: 0, end: 1 };
    
    const scrollHeight = timelineRef.current.scrollHeight;
    const clientHeight = timelineRef.current.clientHeight;
    
    if (scrollHeight <= clientHeight) return { start: 0, end: 1 };
    
    const scrollTop = timelineRef.current.scrollTop;
    const start = scrollTop / scrollHeight;
    const end = (scrollTop + clientHeight) / scrollHeight;
    
    return { start, end };
  }, [scrollTop]);

  // Handlers vazios memoizados para evitar recriação
  const noOpMouseMove = React.useCallback((e: React.MouseEvent) => {}, []);
  const noOpTrackTags = React.useCallback((trackId: string, tags: any[]) => {}, []);
  const noOpEditingTrackId = React.useCallback(() => {}, []);
  const noOpTrackNameInput = React.useCallback(() => {}, []);
  
  // Handler para fechar MixerDock
  const handleCloseMixerDock = React.useCallback(() => {
    setMixerDockVisible(false);
  }, []);

  // Novo: Função para aplicar Warp em uma medida âncora
  const handleWarpCommit = (prevAnchor: number, draggedMeasure: number, newBpm: number) => {
    if (!song) return;
    
    const newSong = { ...song };
    const tempoChanges = newSong.tempoChanges ? [...newSong.tempoChanges] : [];
    
    // Sort changes
    tempoChanges.sort((a, b) => a.time - b.time);
    
    // 1. Find Next Anchor and its Target Time (before modification)
    const nextAnchor = tempoChanges.find(tc => tc.time > draggedMeasure);
    
    let nextAnchorTime = 0;
    let nextAnchorMeasure = 0;
    
    if (nextAnchor) {
      nextAnchorMeasure = nextAnchor.time;
      nextAnchorTime = measureToSeconds(nextAnchorMeasure, tempoChanges, song.tempo);
    }
    
    // 2. Update Prev Anchor BPM
    const prevIndex = tempoChanges.findIndex(tc => tc.time === prevAnchor);
    if (prevIndex >= 0) {
      tempoChanges[prevIndex] = { ...tempoChanges[prevIndex], tempo: newBpm };
    } else {
      if (prevAnchor === 1) {
         tempoChanges.push({ time: 1, tempo: newBpm, timeSignature: '4/4' });
      }
    }
    
    // 3. Create/Update Marker at Dragged Measure
    let draggedIndex = tempoChanges.findIndex(tc => tc.time === draggedMeasure);
    let draggedMarker = tempoChanges[draggedIndex];
    
    if (!draggedMarker) {
      // Create new
      const prev = tempoChanges.find(tc => tc.time === prevAnchor);
      draggedMarker = {
        time: draggedMeasure,
        tempo: prev ? prev.tempo : newBpm, // Placeholder
        timeSignature: prev ? prev.timeSignature : '4/4'
      };
      tempoChanges.push(draggedMarker);
    }
    
    // Sort again
    tempoChanges.sort((a, b) => a.time - b.time);
    
    // 4. Calculate Compensation BPM for [Dragged, Next]
    if (nextAnchor) {
      // Calculate new time of Dragged Measure using the updated Prev BPM
      const newDraggedTime = measureToSeconds(draggedMeasure, tempoChanges, song.tempo);
      
      const deltaSeconds = nextAnchorTime - newDraggedTime;
      const deltaMeasures = nextAnchorMeasure - draggedMeasure;
      
      if (deltaSeconds > 0 && deltaMeasures > 0) {
        const [beats] = draggedMarker.timeSignature.split('/').map(Number);
        const compensatedBpm = calculateWarpBPM(deltaMeasures, deltaSeconds, beats);
        
        // Update Dragged Marker BPM
        draggedMarker.tempo = compensatedBpm;
        
        // Update in array
        const idx = tempoChanges.findIndex(tc => tc.time === draggedMeasure);
        if (idx >= 0) tempoChanges[idx] = draggedMarker;
      }
    }
    
    newSong.tempoChanges = tempoChanges;
    
    if (onSongUpdate) onSongUpdate(newSong);
  };

  const [editorInitialTime, setEditorInitialTime] = React.useState<number | null>(null);

  useKeyboardShortcuts({
    isPlaying,
    onPlayPause: playbackActions.togglePlayPause,
    onStop: () => playbackActions.seek(0),
    onToggleLoop: () => playbackActions.setLoopEnabled(!loopEnabled),
    onToggleMetronome: () => playbackActions.setMetronomeEnabled(!metronomeEnabled),
    onZoomIn: () => setZoom((prev) => Math.min(8, prev + 0.25)),
    onZoomOut: () => setZoom((prev) => Math.max(0.5, prev - 0.25)),
    onGoToStart: () => playbackActions.seek(0),
    onGoToEnd: () => playbackActions.seek(song?.duration || 0),
    onFitToView: () => {
      if (song && containerWidth > 0) {
        // FIX: Usar ZOOM.BASE_PPS (50) em vez de 100 hardcoded
        const targetZoom = containerWidth / (song.duration * ZOOM.BASE_PPS);
        const safeZoom = Math.max(ZOOM.MIN, Math.min(ZOOM.MAX, targetZoom));
        setZoom(safeZoom);
        handleTimelineScroll(0); // Garante que volta para o início
      }
    },
    onToggleEditMode: () => setEditMode((prev) => !prev),
  });

  // Mix Presets Functions
  const handleSaveMixPreset = (name: string) => {
    const newPreset: MixPreset = {
      id: crypto.randomUUID(),
      name,
      tracks: (song?.tracks || [])
        .filter((t: AudioTrack) => !pinnedTracks.has(t.id))
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
    if (!preset || !song || !onSongUpdate) return;
    
    const newTracks = song.tracks.map((track: AudioTrack) => {
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
      id: crypto.randomUUID(),
      userId: 'current-user',
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

  const openMarkerEditor = (type: 'tempo' | 'timesig' | 'section' | 'chord', data: TempoChange | SectionMarker | ChordMarker | null = null, timeOverride?: number) => {
    setEditorType(type);
    setEditingMarker(data);
    setEditorInitialTime(timeOverride ?? null);
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
                id: crypto.randomUUID(),
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

  const handleChordClick = (chord: ChordMarker) => {
    if (editMode && !warpMode) {
      openMarkerEditor('chord', chord);
    } else {
      setSelectedChord({ chord: chord.chord, customDiagram: chord.customDiagram });
    }
  };

  const handleSaveTrackNotes = (notes: string) => {
    if (!selectedTrackForNotes || !song || !onSongUpdate) return;
    const newTracks = song.tracks.map((t: AudioTrack) =>
      t.id === selectedTrackForNotes.id ? { ...t, notes } : t
    );
    onSongUpdate({ ...song, tracks: newTracks });
  };

  if (!song) {
    return (
      <div className="flex flex-col h-full text-white" style={{ backgroundColor: 'var(--daw-bg-main)' }}>
        <div className="border-b p-3 flex items-center justify-between" style={{ backgroundColor: 'var(--daw-bg-bars)', borderColor: 'var(--daw-border)' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-white hover:bg-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Library
          </Button>
          <h2>Player</h2>
          <div className="w-8" />
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div>
              <h3 className="mb-2">No Project Loaded</h3>
              <p className="text-sm text-gray-400 mb-4">
                Create a new project or load one from the library
              </p>
            </div>
          </div>
        </div>
        
        <CreateProjectDialog
          open={false}
          onOpenChange={() => {}}
          onCreateProject={async () => {}}
        />
      </div>
    );
  }

  const currentTracks = song?.tracks || [];

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

  const handleTempoMarkerAdd = (time: number) => {
    openMarkerEditor('tempo', null, time);
  };

  const handleChordAdd = (time: number) => {
    openMarkerEditor('chord', null, time);
  };

  // P1 OPTIMIZATION: Provide isolated track state and actions via context
  const projectContextValue = {
    song,
    updateSong: (updatedSong: Song) => {
      if (onSongUpdate) onSongUpdate(updatedSong);
    },
    // Track state and actions (P1 optimization - prevents full re-render)
    tracks: song?.tracks || [],
    trackActions: {
      updateVolume: trackActions.handleTrackVolumeChange,
      toggleMute: trackActions.handleTrackMuteToggle,
      toggleSolo: trackActions.handleTrackSoloToggle,
      updateName: trackActions.handleTrackNameChange,
      updateColor: trackActions.handleTrackColorChange,
      updateTag: trackActions.handleTrackTagChange,
    },
    currentTime,
    gridTime,
    tempo,
    isPlaying,
    zoom,
    setZoom,
    editMode,
    setEditMode,
    warpMode,
    setWarpMode,
    keyShift,
    setKeyShift,
  };

  const activeTool = warpMode ? 'warp' : (editMode ? 'marker' : null);

  const handleToolChange = (tool: 'marker' | 'warp' | null) => {
    if (tool === 'warp') {
      setWarpMode(true);
      setEditMode(true);
    } else if (tool === 'marker') {
      setWarpMode(false);
      setEditMode(true);
    } else {
      setWarpMode(false);
      setEditMode(false);
    }
  };

  return (
    <ProjectProvider value={projectContextValue}>
      <TooltipProvider>
        <div className="flex flex-col h-full text-white" style={{ backgroundColor: 'var(--daw-bg-main)' }}>
          {/* Top Bar - Using TransportHeader component */}
          <TransportHeader
            songTitle={song.title}
            songKey={song.key}
            isPlaying={isPlaying}
            currentTime={currentTime}
            tempo={tempo}
            loopEnabled={loopEnabled}
            metronomeEnabled={metronomeEnabled}
            metronomeVolume={metronomeVolume}
            currentMeasure={String(getCurrentMeasure())}
            currentTimeSignature={getCurrentTimeSignature()}
            displayTempo={tempo}
            keyShift={keyShift}
            trackHeight={trackHeight}
            rulerVisibility={rulerVisibility}
            rulerOrder={rulerOrder}
            snapEnabled={snapEnabled}
            onBack={onBack}
            onPlayPause={playbackActions.togglePlayPause}
            onStop={playbackActions.stop}
            onLoopToggle={() => playbackActions.setLoopEnabled(!loopEnabled)}
            onMetronomeToggle={() => playbackActions.setMetronomeEnabled(!metronomeEnabled)}
            onMetronomeVolumeChange={playbackActions.setMetronomeVolume}
            onTempoChange={playbackActions.setTempo}
            onKeyShiftChange={setKeyShift}
            onTrackHeightChange={setTrackHeight}
            onRulerVisibilityChange={handleRulerVisibilityChange}
            onRulerOrderChange={setRulerOrder}
            onSnapToggle={() => setSnapEnabled(!snapEnabled)}
            onSnapModeChange={(mode) => console.log('Snap mode:', mode)}
            activeTool={activeTool}
            onToolChange={handleToolChange}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            
            {/* Rulers Row - Fixed Vertically */}
            <div className="flex flex-none h-auto border-b z-30" style={{ backgroundColor: 'var(--daw-bg-contrast)', borderColor: 'var(--daw-border)' }}>
              {/* Ruler Labels Sidebar */}
              {sidebarVisible && mixerVisible && (
                <div className="flex-none border-r" style={{ width: '280px', minWidth: '280px', maxWidth: '280px', backgroundColor: 'var(--daw-bg-contrast)', borderColor: 'var(--daw-border)' }}>
                  <RulerSidebarHeaders
                    visibleRulers={Object.keys(rulerVisibility).filter(k => rulerVisibility[k])}
                    rulerOrder={rulerOrder}
                    onRulerOrderChange={setRulerOrder}
                  />
                </div>
              )}
              
              {/* Rulers Area - Synced Horizontally */}
              <div className="flex-1 overflow-x-hidden overflow-y-hidden" ref={rulerRef}>
                 <RulersContainer
                    song={song}
                    currentTime={currentTime}
                    gridTime={gridTime}
                    tempo={tempo}
                    zoom={zoom}
                    pixelsPerSecond={getPixelsPerSecond()}
                    containerWidth={containerWidth}
                    visibleRulers={Object.keys(rulerVisibility).filter(k => rulerVisibility[k])}
                    rulerOrder={rulerOrder}
                    onTimeClick={(time: number) => playbackActions.seek(time)}
                    onMarkerEdit={(marker: any, type: 'tempo' | 'timesig' | 'section' | 'chord') => openMarkerEditor(type, marker)}
                    onMarkerDelete={(id: string, type: 'tempo' | 'timesig' | 'section' | 'chord') => {}} // Implement delete if needed
                    onTempoMarkerAdd={activeTool === 'marker' ? handleTempoMarkerAdd : undefined}
                    onChordAdd={activeTool === 'marker' ? handleChordAdd : undefined}
                    editMode={activeTool === 'marker'}
                    keyShift={keyShift}
                    warpMode={warpMode}
                    onWarpCommit={handleWarpCommit}
                    onChordClick={(chordName: string) => {
                      const chordMarker = song?.chordMarkers?.find((m: ChordMarker) => m.chord === chordName);
                      if (chordMarker) handleChordClick(chordMarker);
                    }}
                  />
              </div>
            </div>

            {/* Tracks Area - Synced Vertically */}
            {/* P1 IMPROVEMENT: Mantendo estrutura master-slave mas com scroll sync otimizado */}
            <div className="flex-1 flex overflow-hidden relative">
              {/* Sidebar - Using TrackListSidebar component */}
              {sidebarVisible && mixerVisible && (
                <TrackListSidebar
                  ref={sidebarRef}
                  tracks={currentTracks}
                  trackHeight={trackHeight}
                  editingTrackId={null}
                  trackNameInput=""
                  pinnedTracks={pinnedTracks}
                  onTrackVolumeChange={trackActions.handleTrackVolumeChange}
                  onTrackMuteToggle={trackActions.handleTrackMuteToggle}
                  onTrackSoloToggle={trackActions.handleTrackSoloToggle}
                  onTrackNameChange={trackActions.handleTrackNameChange}
                  onTrackColorChange={trackActions.handleTrackColorChange}
                  onTrackTagsChange={noOpTrackTags}
                  onTrackNotesOpen={setSelectedTrackForNotes}
                  onEditingTrackIdChange={noOpEditingTrackId}
                  onTrackNameInputChange={noOpTrackNameInput}
                  onPinnedTracksChange={setPinnedTracks}
                  onScroll={handleSidebarScroll}
                />
              )}

              {/* Timeline Container */}
              <TimelineContainer
                ref={timelineRef}
                song={song}
                currentTime={currentTime}
                zoom={zoom}
                pixelsPerSecond={getPixelsPerSecond()}
                filteredTracks={currentTracks}
                loopStart={loopStart}
                loopEnd={loopEnd}
                trackHeightPx={getTrackHeightPx()}
                isPlaying={isPlaying}
                onTimelineMouseDown={handleTimelineClick}
                onTimelineMouseMove={noOpMouseMove}
                onTimelineMouseUp={handleTimelineMouseUp}
                onScroll={handleTimelineScroll}
              />

              {/* Vertical Scrollbar */}
              <div className="w-4 flex-shrink-0" style={{ backgroundColor: 'var(--daw-bg-contrast)' }}>
                <VerticalScrollbar
                  {...getVerticalScrollRange()}
                  onChange={handleVerticalScrollbarChange}
                  minHeight={0.05}
                />
              </div>
            </div>
          </div>

          {/* Mixer Dock */}
          {mixerDockVisible && (
            <MixerDock
              tracks={currentTracks}
              onTrackVolumeChange={trackActions.handleTrackVolumeChange}
              onTrackMuteToggle={trackActions.handleTrackMuteToggle}
              onTrackSoloToggle={trackActions.handleTrackSoloToggle}
              onClose={handleCloseMixerDock}
            />
          )}

          {/* Notes Panel */}
          {notesPanelVisible && song && (
            <div className="w-full flex flex-col border-t" style={{ backgroundColor: 'var(--daw-bg-contrast)', borderColor: 'var(--daw-border)', height: '240px' }}>
              <div className="h-10 border-b flex items-center justify-between px-3" style={{ backgroundColor: 'var(--daw-bg-bars)', borderColor: 'var(--daw-border)' }}>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--daw-text-primary)' }}>Song Notes</h3>
                <button onClick={() => setNotesPanelVisible(false)} className="p-1 hover:bg-gray-700 rounded">
                  <X className="w-4 h-4" style={{ color: 'var(--daw-text-primary)' }} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-3" style={{ backgroundColor: 'var(--daw-bg-contrast)' }}>
                <NotesPanel
                  notes={song.notes || []}
                  currentUser={{ id: 'current-user', name: 'You' }}
                  onAddNote={handleAddSongNote}
                  onDeleteNote={handleDeleteSongNote}
                />
              </div>
            </div>
          )}

          {/* Bottom Bar */}
          <div className="border-t flex items-center h-8" style={{ backgroundColor: 'var(--daw-bg-bars)', borderColor: 'var(--daw-border)' }}>
            <div className={`border-r flex items-center justify-center gap-2 px-2 flex-shrink-0`} style={{ width: sidebarVisible && mixerVisible ? '280px' : '0', minWidth: sidebarVisible && mixerVisible ? '280px' : '0', borderColor: 'var(--daw-border)' }}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded"
                    style={{ backgroundColor: '#404040', color: '#F1F1F1', opacity: zoom <= 1 ? 0.5 : 1 }}
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
                    style={{ backgroundColor: '#404040', color: '#F1F1F1', opacity: zoom >= 8 ? 0.5 : 1 }}
                    onClick={handleZoomInOnPlayhead}
                    disabled={zoom >= 8}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom In</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded"
                    style={{ backgroundColor: '#404040', color: '#F1F1F1' }}
                    onClick={handleFitToView}
                  >
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Fit to View</TooltipContent>
              </Tooltip>
            </div>

            <TimelineNavigator
              songDuration={song.duration}
              zoom={zoom}
              containerWidth={containerWidth}
              timelineRef={timelineRef}
              onNavigate={handleNavigatorChange}
            />
          </div>

          {/* Bottom Toolbar */}
          <div className="border-t flex items-center justify-between h-10 px-3" style={{ backgroundColor: 'var(--daw-bg-bars)', borderColor: 'var(--daw-border)' }}>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded"
                    style={{ backgroundColor: '#404040', color: '#F1F1F1' }}
                    onClick={() => setSidebarVisible(!sidebarVisible)}
                  >
                    {sidebarVisible ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{sidebarVisible ? 'Hide Sidebar' : 'Show Sidebar'}</TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center gap-1">
              <Popover open={mixPresetsPopoverOpen} onOpenChange={setMixPresetsPopoverOpen}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded" style={{ backgroundColor: '#404040', color: '#F1F1F1' }}>
                        <Save className="w-4 h-4" />
                      </Button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Mix Presets</TooltipContent>
                </Tooltip>
                <PopoverContent align="center" className="w-72" style={{ backgroundColor: 'var(--daw-bg-bars)', borderColor: 'var(--daw-border)' }}>
                  <MixPresetsManager
                    tracks={currentTracks}
                    presets={mixPresets}
                    onSavePreset={handleSaveMixPreset}
                    onLoadPreset={handleLoadMixPreset}
                    onDeletePreset={handleDeleteMixPreset}
                  />
                </PopoverContent>
              </Popover>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded"
                    style={{ backgroundColor: mixerDockVisible ? '#3B82F6' : '#404040', color: '#F1F1F1' }}
                    onClick={() => setMixerDockVisible(!mixerDockVisible)}
                  >
                    <Sliders className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{mixerDockVisible ? 'Hide Mixer' : 'Show Mixer'}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded"
                    style={{ backgroundColor: notesPanelVisible ? '#3B82F6' : '#404040', color: '#F1F1F1' }}
                    onClick={() => setNotesPanelVisible(!notesPanelVisible)}
                  >
                    <StickyNote className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{notesPanelVisible ? 'Hide Notes' : 'Show Notes'}</TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded"
                    style={{ backgroundColor: '#404040', color: '#F1F1F1' }}
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
            onCreateProject={async () => {}}
          />

          <TimelineEditorDialog
            open={editorOpen}
            onOpenChange={setEditorOpen}
            type={editorType}
            currentTime={editorInitialTime ?? clickedTime}
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
    </ProjectProvider>
  );
}

// ============================================================================
// DAWPlayer - Componente wrapper principal
// ============================================================================

export function DAWPlayer({ song, onSongUpdate, onPerformanceMode, onBack, onCreateProject, onExportProject }: DAWPlayerProps) {
  if (!song) {
    return (
      <div className="flex flex-col h-full bg-gray-900 text-white">
        <div className="bg-gray-800 border-b border-gray-700 p-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-white hover:bg-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Library
          </Button>
          <h2>Player</h2>
          <div className="w-8" />
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div>
              <h3 className="mb-2">No Project Loaded</h3>
              <p className="text-sm text-gray-400 mb-4">
                Create a new project or load one from the library
              </p>
            </div>
          </div>
        </div>
        
        <CreateProjectDialog
          open={false}
          onOpenChange={() => {}}
          onCreateProject={onCreateProject || (async () => {})}
        />
      </div>
    );
  }

  return (
    <DAWPlayerContent
      song={song}
      onSongUpdate={onSongUpdate}
      onPerformanceMode={onPerformanceMode}
      onBack={onBack}
    />
  );
}
