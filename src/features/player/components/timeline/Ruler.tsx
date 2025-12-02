import React, { useMemo } from 'react';
import { Badge } from '../../../../components/ui/badge';
import { Song, SectionMarker, TempoChange, ChordMarker } from '../../../../types';
import { TIMELINE } from '../../../../config/constants';
import { calculateGridLines, calculateMeasureBars } from '../../utils/gridUtils';
import { measureToSeconds, secondsToMeasure, calculateWarpBPM } from '../../../../lib/timeUtils';
import { useWarpInteraction } from '../../hooks/useWarpInteraction';
import { formatBPM } from '../../../../lib/formatters';

interface RulerProps {
  rulerId: 'time' | 'measures' | 'sections' | 'chords' | 'tempo';
  song: Song;
  timelineWidth: number;
  zoom: number;
  editMode: boolean;
  keyShift: number;
  showBeats: boolean;
  onRulerDrop: (e: React.DragEvent<HTMLDivElement>, rulerId: string) => void;
  onRulerDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onSectionClick: (markerIndex: number) => void;
  onTempoMarkerClick: (data: TempoChange) => void;
  onChordClick: (data: ChordMarker) => void;
  onTimeClick?: (time: number) => void;
  onTempoMarkerAdd?: (time: number) => void;
  onChordAdd?: (time: number) => void;
  hoverLineRef?: React.RefObject<HTMLDivElement>;
  onLoopRegionChange?: (start: number, end: number) => void;
  loopStart?: number | null;
  loopEnd?: number | null;
  scrollLeft?: number;
  containerWidth?: number;
  warpMode?: boolean;
  onWarpCommit?: (prevAnchor: number, draggedMeasure: number, newBpm: number) => void;
}

// Helper function to transpose key
const transposeKey = (key: string, semitones: number): string => {
    if (semitones === 0) return key;
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const flatNotes = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    
    const isFlat = key.includes('b');
    const noteList = isFlat ? flatNotes : notes;
    const rootNote = key.match(/^[A-G][#b]?/)?.[0] || 'C';
    const suffix = key.replace(rootNote, '');
    
    let index = noteList.indexOf(rootNote);
    if (index === -1) {
      index = (isFlat ? notes : flatNotes).indexOf(rootNote);
      if (index === -1) return key;
    }
    
    const newIndex = (index + semitones + 12) % 12;
    return noteList[newIndex] + suffix;
};

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const Ruler: React.FC<RulerProps> = ({
  rulerId,
  song,
  timelineWidth,
  zoom,
  editMode,
  keyShift,
  showBeats,
  onRulerDrop,
  onRulerDragOver,
  onSectionClick,
  onTempoMarkerClick,
  onChordClick,
  onTimeClick,
  onTempoMarkerAdd,
  onChordAdd,
  hoverLineRef,
  onLoopRegionChange,
  loopStart = null,
  loopEnd = null,
  scrollLeft = 0,
  containerWidth = 1000,
  warpMode = false,
  onWarpCommit,
}) => {
  // Warp Grid State (via Hook)
  const { 
    isWarpDragging, 
    warpState, 
    warpGhostTime, 
    handleWarpMouseDown 
  } = useWarpInteraction({
    song,
    timelineWidth,
    onWarpCommit,
    warpMode
  });

  // Estado para loop dragging
  const [isLoopDragging, setIsLoopDragging] = React.useState(false);
  const [loopDragStart, setLoopDragStart] = React.useState<number | null>(null);
  const [ghostCursorTime, setGhostCursorTime] = React.useState<number | null>(null);
  const [snapEnabled, setSnapEnabled] = React.useState(true);
  const [isTempoExpanded, setIsTempoExpanded] = React.useState(false);

  // Helper: Snap to nearest beat/measure
  const snapToGrid = (time: number): number => {
    if (!snapEnabled || gridLines.length === 0) return time;
    
    // Binary search to find insertion point
    let low = 0;
    let high = gridLines.length - 1;
    
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (gridLines[mid].position < time) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    
    // low is the index of the first element > time
    // Check low and low-1
    const nextLine = gridLines[low];
    const prevLine = gridLines[low - 1];
    
    if (nextLine && prevLine) {
      return (time - prevLine.position < nextLine.position - time) ? prevLine.position : nextLine.position;
    } else if (nextLine) {
      return nextLine.position;
    } else if (prevLine) {
      return prevLine.position;
    }
    
    return time;
  };

  // Handler para converter clique em tempo
  const handleRulerInteraction = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();

    // Warp Mode Interaction
    if (warpMode && rulerId === 'measures') {
      const handled = handleWarpMouseDown(e, rect);
      if (handled) return;
    }
    
    // Loop Drag Logic (Measures Ruler only)
    // Block Loop Dragging if Warp Mode is active
    if (!warpMode && rulerId === 'measures' && onLoopRegionChange && e.clientY - rect.top > TIMELINE.RULER_HEIGHT / 2) {
       e.stopPropagation();
       const x = e.clientX - rect.left;
       const time = (x / timelineWidth) * song.duration;
       const snapped = snapToGrid(time);
       setIsLoopDragging(true);
       setLoopDragStart(snapped);
       return;
    }

    // Tempo/Chord Insertion Logic
    // Only allow adding if editMode is active AND NOT in Warp Mode
    if (editMode && !warpMode) {
        if (rulerId === 'tempo' && onTempoMarkerAdd) {
           const x = e.clientX - rect.left;
           const time = (x / timelineWidth) * song.duration;
           const snapped = snapToGrid(time);
           onTempoMarkerAdd(snapped);
           return;
        }
        
        if (rulerId === 'chords' && onChordAdd) {
           const x = e.clientX - rect.left;
           const time = (x / timelineWidth) * song.duration;
           const snapped = snapToGrid(time);
           onChordAdd(snapped);
           return;
        }
    }

    // Seek Logic (Default)
    // Block Seek if Warp Mode is active (to avoid accidental jumps)
    if (!warpMode) {
      const x = e.clientX - rect.left;
      const clickedTime = (x / timelineWidth) * song.duration;
      const snappedTime = snapToGrid(clickedTime);
      
      if (onTimeClick && e.clientY - rect.top < TIMELINE.RULER_HEIGHT / 2) {
        onTimeClick(Math.max(0, Math.min(snappedTime, song.duration)));
      }
    }
  };

  // Global mouse move and up for Warp (Handled by Hook)
  // React.useEffect(() => { ... }) removed.

  // --- Time Ruler Logic ---
  const getTimeMarkers = () => {
    const getTimeInterval = () => {
      if (zoom >= 8) return 1;
      if (zoom >= 4) return 2;
      if (zoom >= 2) return 5;
      if (zoom >= 0.5) return 10;
      return 30; // Less frequent markers when zoomed out
    };
    const interval = getTimeInterval();
    const markers: number[] = [];
    // Optimize loop: only generate markers for visible area if we had scroll info, 
    // but for now just generate all (it's fast enough for reasonable durations)
    for (let i = 0; i <= song.duration; i += interval) {
      markers.push(i);
    }
    return markers;
  };

  // PERFORMANCE OPTIMIZATION (P1): Arredonda zoom para evitar recálculo a cada pixel
  // Recalcula apenas quando zoom muda significativamente (0.1 = 10% de diferença)
  const roundedZoom = useMemo(() => Math.round(zoom * 10) / 10, [zoom]);

  // --- Measures Ruler Logic using gridUtils (Memoized for performance) ---
  const gridLines = useMemo(() => {
    // CRITICAL FIX: Não filtramos mais por viewport (scrollLeft/containerWidth)
    // Renderizamos a estrutura lógica da música inteira.
    // O gridUtils.ts já possui otimizações de LOD (zoom) para não gerar milhões de linhas.
    // CSS com position: absolute e container com overflow: auto fazem a virtualização visual.
    
    return calculateGridLines(
      song.duration,
      song.tempo || 120,
      '4/4', // Default time signature, overridden by tempoChanges
      showBeats, // Show subdivisions based on showBeats prop
      roundedZoom * 100, // Convert zoom to a scale gridUtils expects
      undefined, // Início visível removido (renderiza tudo)
      undefined,  // Fim visível removido (renderiza tudo)
      song.tempoChanges // Pass tempo changes for irregular meters
    );
  }, [song.duration, song.tempo, song.tempoChanges, editMode, roundedZoom, showBeats]);

  // Convert grid lines to measure bars for rendering with visual hierarchy + virtualização
  const getMeasureBars = useMemo(() => {
    const measureBars: { 
      time: number; 
      measure: number | null; 
      beat: number; 
      isBeat: boolean; 
      isCompound?: boolean; 
      isIrregular?: boolean;
      opacity: number;
      height: string; // Hierarquia visual
      width: number; // Espessura da linha
      color: string; // Cor baseada na força do beat
    }[] = [];
    
    let measureCount = 0;
    let lastMeasureTime = -1;
    let lastLabelPixelPosition = -100; // Collision detection
    const minPixelDistance = 50; // Mínimo 50px entre labels
    
    // LOD Adaptativo baseado em pixels por beat (mais robusto que zoom bruto)
    const pps = (timelineWidth / song.duration);
    const pixelsPerBeat = (60 / (song.tempo || 120)) * pps;
    const showBeatsAtThisZoom = showBeats && pixelsPerBeat >= 25; // Beats se houver >= 25px de espaço
    const showSubdivisionsAtThisZoom = showBeats && pixelsPerBeat >= 80; // Subdivisões se >= 80px
    
    // P0 FIX: gridLines já vem pré-filtrado pela janela visível, não precisa filtrar novamente
    // As linhas já foram calculadas apenas para a viewport em calculateGridLines
    
    gridLines.forEach((line, index) => {
      
      if (line.type === 'measure') {
        measureCount++;
        lastMeasureTime = line.position;
        
        // Collision detection baseada em pixels
        const pixelPosition = (line.position / song.duration) * timelineWidth;
        const hasSpace = (pixelPosition - lastLabelPixelPosition) >= minPixelDistance;
        const shouldShowNumber = hasSpace;
        
        if (shouldShowNumber) {
          lastLabelPixelPosition = pixelPosition;
        }
        
        measureBars.push({
          time: line.position,
          measure: shouldShowNumber ? measureCount : null,
          beat: 1,
          isBeat: false,
          opacity: line.opacity,
          height: '100%', // Compasso: altura máxima
          width: 2, // Linha mais espessa
          color: 'rgba(255,255,255,0.6)', // Cor forte
        });
      } else if (line.type === 'beat' && showBeatsAtThisZoom) {
        const beatsSinceMeasure = gridLines
          .slice(0, index)
          .filter(l => l.position > lastMeasureTime && l.type === 'beat')
          .length;
        
        // Detectar tempos fortes em compassos compostos (6/8, 12/8)
        const beatNumber = beatsSinceMeasure + 2;
        const isStrongSubBeat = beatNumber === 4 || beatNumber === 7 || beatNumber === 10; // Ex: tempo 4 em 6/8
        
        measureBars.push({
          time: line.position,
          measure: null,
          beat: beatNumber,
          isBeat: true,
          opacity: line.opacity,
          height: isStrongSubBeat ? '70%' : '55%', // Tempo forte vs. fraco
          width: isStrongSubBeat ? 1.5 : 1,
          color: isStrongSubBeat ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.25)',
        });
      } else if (line.type === 'subdivision' && showSubdivisionsAtThisZoom) {
        measureBars.push({
          time: line.position,
          measure: null,
          beat: 0,
          isBeat: true,
          opacity: line.opacity * 0.5,
          height: '30%', // Subdivisão: altura mínima
          width: 1,
          color: 'rgba(255,255,255,0.15)', // Muito sutil
        });
      }
    });
    
    return measureBars;
  }, [gridLines, zoom, showBeats, song.duration, timelineWidth, song.tempo, scrollLeft, containerWidth]);

  switch (rulerId) {
    case 'time':
      return (
        <div 
          className="border-b relative cursor-pointer" 
          style={{ 
            height: `${TIMELINE.RULER_HEIGHT}px`,
            width: `${timelineWidth}px`,
            backgroundColor: 'var(--daw-bg-contrast)', 
            borderColor: 'var(--daw-border)' 
          }} 
          onDrop={(e) => onRulerDrop(e, 'time')} 
          onDragOver={onRulerDragOver}
          onMouseDown={handleRulerInteraction}
        >
          {getTimeMarkers().map((time) => (
            <div key={time} className="absolute top-0 bottom-0 border-l" style={{ left: (time / song.duration) * timelineWidth, borderColor: 'var(--daw-border)' }}>
              <span className="absolute top-0.5 left-1 text-[10px]" style={{ color: 'var(--daw-text-secondary)' }}>
                {formatTime(time)}
              </span>
            </div>
          ))}
        </div>
      );

    case 'measures':
      return (
        <div 
          className="border-b relative cursor-pointer transition-colors duration-300"
          style={{ 
            height: `${TIMELINE.RULER_HEIGHT}px`,
            width: `${timelineWidth}px`,
            backgroundColor: warpMode ? 'rgba(249, 115, 22, 0.15)' : 'var(--daw-bg-contrast)', 
            borderColor: warpMode ? '#f97316' : 'var(--daw-border)' 
          }}
          onDrop={(e) => onRulerDrop(e, 'measures')}  
          onDragOver={onRulerDragOver}
          onMouseDown={handleRulerInteraction}
          onMouseMove={(e) => {
            // Ghost cursor
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const time = (x / timelineWidth) * song.duration;
            const snapped = snapToGrid(time);
            setGhostCursorTime(snapped);
            
            // Loop dragging
            if (isLoopDragging && loopDragStart !== null && onLoopRegionChange) {
              const start = Math.min(loopDragStart, snapped);
              const end = Math.max(loopDragStart, snapped);
              onLoopRegionChange(start, end);
            }
          }}
          onMouseUp={() => {
            if (isLoopDragging) {
              setIsLoopDragging(false);
              setLoopDragStart(null);
            }
          }}
          onMouseLeave={() => {
            setGhostCursorTime(null);
            if (isLoopDragging) {
              setIsLoopDragging(false);
              setLoopDragStart(null);
            }
          }}
        >
          {getMeasureBars.map((bar, i) => {
            const position = (bar.time / song.duration) * timelineWidth;
            if (!bar.measure && !bar.isBeat) return null;
            
            // Hierarquia visual: altura, cor e espessura baseadas no tipo
            const lineHeight = bar.height;
            const lineWidth = bar.width;
            const lineColor = bar.color;
            const textColor = 'var(--daw-text-secondary)';
            
            // Calcular top offset para centralizar linhas menores
            const topOffset = lineHeight === '100%' ? '0' : 
                             lineHeight === '70%' ? '15%' :
                             lineHeight === '55%' ? '22.5%' : '35%';
            
            // Check for special time signatures from tempo changes
            const currentTempo = song.tempoChanges?.find(tc => Math.abs(tc.time - bar.time) < 0.01);
            const isCompound = currentTempo && currentTempo.timeSignature && 
              currentTempo.timeSignature.includes('8') && 
              ['6/8', '9/8', '12/8'].includes(currentTempo.timeSignature);
            const isIrregular = currentTempo && !!currentTempo.subdivision;
            
            return (
              <div 
                key={i} 
                className={`absolute transition-colors ${warpMode ? 'hover:bg-orange-400/30' : ''}`}
                style={{ 
                  left: position, 
                  top: topOffset,
                  height: lineHeight,
                  width: `${lineWidth}px`,
                  backgroundColor: lineColor,
                }} 
                title={bar.isCompound ? 'Compound Time' : bar.isIrregular ? 'Irregular Time' : undefined}
              >
                {bar.measure && (
                  <span className="absolute -top-4 left-1 text-[10px] font-semibold whitespace-nowrap" style={{ color: textColor }}>
                    {bar.measure}
                  </span>
                )}
                {showBeats && bar.isBeat && bar.beat > 0 && (
                  <span className="absolute -top-4 left-1 text-[9px] whitespace-nowrap" style={{ color: 'var(--daw-text-muted)' }}>
                    {bar.beat}
                  </span>
                )}
              </div>
            );
          })}

          {/* Warp Anchors Layer - Only for actual tempo changes */}
          {warpMode && (song.tempoChanges || []).map((tc, index) => {
             const seconds = measureToSeconds(tc.time, song.tempoChanges || [], song.tempo);
             const position = (seconds / song.duration) * timelineWidth;
             
             return (
               <div 
                 key={`warp-anchor-${index}`}
                 className="absolute -top-0.5 -left-1.5 w-3 h-3 z-20 pointer-events-none"
                 style={{ 
                   left: position,
                   borderLeft: '6px solid transparent',
                   borderRight: '6px solid transparent',
                   borderTop: '6px solid #f97316', 
                   filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))'
                 }}
               />
             );
          })}
          
          {/* Ghost Cursor - mostra onde o cursor vai "grudar" com snap */}
          {ghostCursorTime !== null && !warpMode && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-cyan-400/50 pointer-events-none transition-all duration-75"
              style={{ left: (ghostCursorTime / song.duration) * timelineWidth }}
            >
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-cyan-500 text-white text-[9px] rounded whitespace-nowrap">
                {formatTime(ghostCursorTime)}
              </div>
            </div>
          )}

          {/* Warp Ghost Line (Orange Overlay) */}
          {warpGhostTime !== null && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-orange-500 z-50 pointer-events-none"
              style={{ left: (warpGhostTime / song.duration) * timelineWidth }}
            >
               <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-orange-500 text-white text-[9px] rounded whitespace-nowrap font-bold">
                WARP
              </div>
               {/* Ghost Anchor Triangle following mouse */}
               <div 
                 className="absolute -top-0.5 -left-1.5 w-3 h-3 z-50"
                 style={{ 
                   borderLeft: '6px solid transparent',
                   borderRight: '6px solid transparent',
                   borderTop: '6px solid #f97316', 
                   filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))'
                 }}
               />
            </div>
          )}

          {/* Loop region preview durante dragging */}
          {isLoopDragging && loopDragStart !== null && ghostCursorTime !== null && (
            <div
              className="absolute top-0 bottom-0 bg-yellow-500/20 border-l-2 border-r-2 border-yellow-500/60 pointer-events-none"
              style={{
                left: (Math.min(loopDragStart, ghostCursorTime) / song.duration) * timelineWidth,
                width: (Math.abs(ghostCursorTime - loopDragStart) / song.duration) * timelineWidth,
              }}
            />
          )}
        </div>
      );

    case 'tempo':
      const tempoChanges = editMode ? (song.tempoChanges || []) : (song.tempoChanges || []).filter(tc => !tc.hidden);
      const sortedTempoChanges = [...tempoChanges].sort((a, b) => a.time - b.time);

      return (
        <div 
          className="tempo-ruler-interactive border-b relative cursor-pointer transition-all duration-300" 
          style={{ 
            height: isTempoExpanded ? '120px' : `${TIMELINE.RULER_HEIGHT}px`,
            width: `${timelineWidth}px`,
            backgroundColor: 'var(--daw-bg-contrast)', 
            borderColor: 'var(--daw-border)' 
          }} 
          onDrop={(e) => onRulerDrop(e, 'tempo')} 
          onDragOver={onRulerDragOver}
          onMouseDown={handleRulerInteraction}
        >
          {/* Expand/Collapse Button */}
          <div 
             className="absolute left-0 top-0 bottom-0 w-4 z-50 flex items-center justify-center hover:bg-white/10 cursor-pointer text-[10px] text-muted-foreground"
             onClick={(e) => { e.stopPropagation(); setIsTempoExpanded(!isTempoExpanded); }}
             title={isTempoExpanded ? "Collapse Tempo View" : "Expand Tempo View"}
          >
             <div className={`transform transition-transform ${isTempoExpanded ? 'rotate-90' : 'rotate-0'}`}>
                ▶
             </div>
          </div>

          {/* Visual Curve (if expanded) */}
          {isTempoExpanded && (
             <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
                {/* Simple line graph connecting tempo points */}
                <polyline 
                   points={sortedTempoChanges.map(tc => {
                      const x = (measureToSeconds(tc.time, song.tempoChanges || [], song.tempo) / song.duration) * timelineWidth;
                      // Map tempo 60-200 to height 100%-0%
                      const y = 120 - ((Math.min(Math.max(tc.tempo, 60), 200) - 60) / 140) * 120;
                      return `${x},${y}`;
                   }).join(' ')}
                   fill="none"
                   stroke="#f97316"
                   strokeWidth="2"
                />
             </svg>
          )}

          {sortedTempoChanges.map((tc, index) => {
            const prevTc = index > 0 ? sortedTempoChanges[index - 1] : null;
            const showTimeSig = !prevTc || prevTc.timeSignature !== tc.timeSignature;
            const seconds = measureToSeconds(tc.time, song.tempoChanges || [], song.tempo);
            
            return (
            <div
              key={`tempo-${index}`}
              className="absolute top-0.5 flex items-start cursor-pointer group z-10"
              style={{ left: (seconds / song.duration) * timelineWidth }}
              onClick={(e) => { 
                  e.stopPropagation(); 
                  e.preventDefault(); // Prevent adding new marker
                  if (editMode) onTempoMarkerClick(tc); 
              }}
            >
              <div className="absolute top-0 bottom-0 w-px" style={{ backgroundColor: '#f97316', opacity: 0.4, height: isTempoExpanded ? '120px' : '100%' }} />
              <div className="absolute top-0 -translate-x-1/2 flex gap-1 flex-col items-center">
                <div
                  className="hover:brightness-110 transition-all"
                  style={{
                    backgroundColor: '#f97316',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: '600',
                    padding: '3px 6px',
                    borderRadius: '3px',
                    border: '1px solid rgba(0,0,0,0.2)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {formatBPM(tc.tempo)}
                </div>
                
                {showTimeSig && (
                    <div
                      className="hover:brightness-110 transition-all mt-0.5"
                      style={{
                        backgroundColor: '#6b7280',
                        color: '#fff',
                        fontSize: '10px',
                        fontWeight: '600',
                        padding: '3px 6px',
                        borderRadius: '3px',
                        border: '1px solid rgba(0,0,0,0.2)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {tc.timeSignature}
                    </div>
                )}
              </div>
            </div>
          )})}
        </div>
      );

    case 'chords':
      return (
        <div 
          className="border-b relative cursor-pointer" 
          style={{ 
            height: `${TIMELINE.RULER_HEIGHT}px`,
            width: `${timelineWidth}px`,
            backgroundColor: 'var(--daw-bg-contrast)', 
            borderColor: 'var(--daw-border)' 
          }} 
          onDrop={(e) => onRulerDrop(e, 'chords')} 
          onDragOver={onRulerDragOver}
          onMouseDown={handleRulerInteraction}
        >
          {(song.chordMarkers || []).map((chord, i) => (
            <div key={i} className="absolute top-0.5" style={{ left: (chord.time / song.duration) * timelineWidth }}>
              <div
                className="cursor-pointer hover:brightness-110 transition-all"
                style={{
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: '600',
                  padding: '3px 6px',
                  borderRadius: '3px',
                  border: '1px solid rgba(0,0,0,0.2)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                  whiteSpace: 'nowrap'
                }}
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); onChordClick(chord); }}
              >
                {transposeKey(chord.chord, keyShift)}
              </div>
            </div>
          ))}
        </div>
      );

    case 'sections':
      return (
        <div 
          className="border-b relative cursor-pointer" 
          style={{ 
            height: `${TIMELINE.RULER_HEIGHT}px`,
            width: `${timelineWidth}px`,
            backgroundColor: 'var(--daw-bg-contrast)', 
            borderColor: 'var(--daw-border)' 
          }} 
          onDrop={(e) => onRulerDrop(e, 'sections')} 
          onDragOver={onRulerDragOver}
          onMouseDown={handleRulerInteraction}
        >
          {song.markers.map((marker, i) => {
            const position = (marker.time / song.duration) * timelineWidth;
            const nextMarker = song.markers[i + 1];
            const width = nextMarker ? ((nextMarker.time - marker.time) / song.duration) * timelineWidth : timelineWidth - position;
            
            const colorMap: Record<string, { bg: string, text: string }> = { 
              intro: { bg: '#22c55e', text: '#fff' },
              verse: { bg: '#3b82f6', text: '#fff' },
              chorus: { bg: '#ef4444', text: '#fff' },
              bridge: { bg: '#f59e0b', text: '#fff' },
              outro: { bg: '#8b5cf6', text: '#fff' },
              'pre-chorus': { bg: '#ec4899', text: '#fff' },
              instrumental: { bg: '#14b8a6', text: '#fff' },
              tag: { bg: '#64748b', text: '#fff' },
              custom: { bg: '#6b7280', text: '#fff' }
            };
            const colors = colorMap[marker.type] || colorMap.custom;
            
            return (
              <div 
                key={marker.id} 
                className="absolute top-0.5 cursor-pointer hover:brightness-110 transition-all"
                style={{ 
                  left: position, 
                  width: Math.max(40, width - 4),
                  height: '24px',
                  backgroundColor: colors.bg,
                  borderRadius: '3px',
                  border: '1px solid rgba(0,0,0,0.2)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                }} 
                onClick={(e) => { e.stopPropagation(); onSectionClick(i); }}
              >
                <span 
                  className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold pointer-events-none truncate px-2"
                  style={{ color: colors.text }}
                >
                  {marker.label}
                </span>
              </div>
            );
          })}
        </div>
      );

    default:
      return null;
  }
};