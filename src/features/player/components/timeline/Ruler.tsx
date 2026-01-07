// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
import React, { useMemo } from 'react';
import { Badge } from '../../../../components/ui/badge';
import { Song, SectionMarker, TempoChange, ChordMarker } from '../../../../types';
import { TIMELINE } from '../../../../config/constants';
import { transposeKey } from '../../../../lib/musicTheory';
import { snapToGrid } from '../../utils/gridUtils'; // QA FIX: Import from gridUtils to avoid duplication
import { useTimelineGrid } from '../../../../hooks/useTimelineGrid'; // QA FIX: Use modern hook instead of legacy calculateGridLines
import { measureToSeconds, secondsToMeasure, calculateWarpBPM } from '../../../../lib/timeUtils';
import { useWarpInteraction } from '../../hooks/useWarpInteraction';
import { formatBPM, formatTime } from '../../../../lib/formatters';
import { useChordAnalysis } from '../../../../hooks/useChordAnalysis';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../../components/ui/tooltip';

interface RulerProps {
  rulerId: 'time' | 'measures' | 'sections' | 'chords' | 'tempo';
  song: Song;
  timelineWidth: number;
  zoom: number;
  editMode: boolean;
  keyShift: number;
  showBeats: boolean;
  snapEnabled: boolean; // QA FIX: Added - must receive from global state, not hardcoded
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

export const Ruler: React.FC<RulerProps> = ({
  rulerId,
  song,
  timelineWidth,
  zoom,
  snapEnabled, // QA FIX: Receive from props, not hardcoded state
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
  // PHASE 4: Chord analysis hook
  const { analyzeChordMarkers } = useChordAnalysis({
    key: song.key || 'C',
    scale: song.scale || 'major',
  });

  // Analyze chord markers with harmonic analysis
  const analyzedChordMarkers = useMemo(() => {
    return analyzeChordMarkers(song.chordMarkers || []);
  }, [analyzeChordMarkers, song.chordMarkers]);

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
  const [loopDragEnd, setLoopDragEnd] = React.useState<number | null>(null);
  const [ghostCursorTime, setGhostCursorTime] = React.useState<number | null>(null);
  const [isTempoExpanded, setIsTempoExpanded] = React.useState(false);
  // QA FIX: snapEnabled is now a prop from global state, removed hardcoded useState(true)
  // QA FIX: snapToGrid is now imported from gridUtils to avoid duplication

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
    // FIXED: Remover restrição da metade inferior - permitir arrastar em qualquer lugar da régua
    if (!warpMode && rulerId === 'measures' && onLoopRegionChange && e.shiftKey) {
       e.stopPropagation();
       const x = e.clientX - rect.left;
       const time = (x / timelineWidth) * song.duration;
       const snapped = snapEnabled ? snapToGrid(time, song.tempo || 120, 'beat', 4) : time;
       setIsLoopDragging(true);
       setLoopDragStart(snapped);
       setLoopDragEnd(snapped); // Inicializar com mesmo valor
       return;
    }

    // Tempo/Chord Insertion Logic
    // Only allow adding if editMode is active AND NOT in Warp Mode
    if (editMode && !warpMode) {
        if (rulerId === 'tempo' && onTempoMarkerAdd) {
           const x = e.clientX - rect.left;
           const time = (x / timelineWidth) * song.duration;
           const snapped = snapEnabled ? snapToGrid(time, song.tempo || 120, 'beat', 4) : time;
           onTempoMarkerAdd(snapped);
           return;
        }
        
        if (rulerId === 'chords' && onChordAdd) {
           const x = e.clientX - rect.left;
           const time = (x / timelineWidth) * song.duration;
           const snapped = snapEnabled ? snapToGrid(time, song.tempo || 120, 'beat', 4) : time;
           onChordAdd(snapped);
           return;
        }
    }

    // Seek Logic (Default)
    // Block Seek if Warp Mode is active (to avoid accidental jumps)
    if (!warpMode) {
      const x = e.clientX - rect.left;
      // QA CERTIFICATION: Mathematical time calculation (NOT visual grid iteration)
      // FORMULA: time = (x / timelineWidth) * duration
      // COMPLEXITY: O(1) - no iteration over grid lines
      const exactTime = (x / timelineWidth) * song.duration;
      
      // QA CERTIFICATION: Snap is CONDITIONAL - only applied when snapEnabled is true
      // When snapEnabled is FALSE, the playhead moves to the EXACT calculated time
      // This enables "freehand" positioning at any float value (e.g., 1.234s)
      const targetTime = snapEnabled 
        ? snapToGrid(exactTime, song.tempo || 120, 'beat', 4) 
        : exactTime;
      
      if (onTimeClick && e.clientY - rect.top < TIMELINE.RULER_HEIGHT / 2) {
        onTimeClick(Math.max(0, Math.min(targetTime, song.duration)));
      }
    }
  };

  // Global mouse move and up for Warp (Handled by Hook)
  // React.useEffect(() => { ... }) removed.

  // PERFORMANCE: Round zoom to prevent recalculation on every pixel change
  const roundedZoom = useMemo(() => Math.round(zoom * 10) / 10, [zoom]);

  // Calculate visible viewport window for virtualization
  const { visibleStartTime, visibleEndTime } = useMemo(() => {
    if (!containerWidth || !timelineWidth || scrollLeft === undefined) {
      return { visibleStartTime: undefined, visibleEndTime: undefined };
    }
    
    // Calculate time range visible in viewport
    const startTime = Math.max(0, (scrollLeft / timelineWidth) * song.duration);
    const endTime = Math.min(song.duration, ((scrollLeft + containerWidth) / timelineWidth) * song.duration);
    
    return {
      visibleStartTime: startTime,
      visibleEndTime: endTime
    };
  }, [scrollLeft, containerWidth, timelineWidth, song.duration]);

  // --- Time Ruler Logic (Virtualized) ---
  const getTimeMarkers = useMemo(() => {
    const getTimeInterval = () => {
      if (zoom >= 8) return 1;
      if (zoom >= 4) return 2;
      if (zoom >= 2) return 5;
      if (zoom >= 0.5) return 10;
      return 30; // Less frequent markers when zoomed out
    };
    
    const interval = getTimeInterval();
    const markers: number[] = [];
    
    // Viewport culling: only generate markers within visible window + buffer
    const bufferTime = interval * 2; // 2 intervals buffer on each side
    const startTime = Math.max(0, (visibleStartTime ?? 0) - bufferTime);
    const endTime = Math.min(song.duration, (visibleEndTime ?? song.duration) + bufferTime);
    
    // Snap to interval boundaries
    const startMarker = Math.floor(startTime / interval) * interval;
    const endMarker = Math.ceil(endTime / interval) * interval;
    
    for (let i = startMarker; i <= endMarker && i <= song.duration; i += interval) {
      markers.push(i);
    }
    
    return markers;
  }, [zoom, song.duration, visibleStartTime, visibleEndTime]);

  // QA FIX: Use modern useTimelineGrid hook instead of legacy calculateGridLines
  // This eliminates dead code and uses the superior time signature analysis
  const { gridLines } = useTimelineGrid({
    duration: song.duration,
    tempo: song.tempo || 120,
    timeSignature: song.tempoChanges?.[0]?.timeSignature || '4/4',
    showBeats: showBeats,
    showSubdivisions: false,
    zoom: roundedZoom * 100,
    tempoChanges: song.tempoChanges,
    visibleStart: visibleStartTime,
    visibleEnd: visibleEndTime,
  });

  // Convert grid lines to measure bars for rendering with visual hierarchy
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
    
    let lastMeasureTime = -1;
    
    // QA FIX: LOD is now handled by useTimelineGrid hook with superior time signature analysis
    // No need for manual pixel calculations here - just render what we receive from the hook
    
    gridLines.forEach((line, index) => {
      
      if (line.type === 'measure') {
        lastMeasureTime = line.position;
        
        // QA FIX: Always show measure number - LOD filtering already happened in useTimelineGrid
        // The gridLines array only contains measures that should be visible at this zoom level
        measureBars.push({
          time: line.position,
          measure: line.measureNumber || null, // Use measure number from gridLines (semantic source)
          beat: 1,
          isBeat: false,
          opacity: line.opacity,
          height: '100%', // Compasso: altura máxima
          width: 2, // Linha mais espessa
          color: 'rgba(255,255,255,0.6)', // Cor forte
        });
      } else if (line.type === 'beat') {
        // QA FIX: Calcular beat number relativo ao compasso atual
        const beatsSinceMeasure = gridLines
          .slice(0, index)
          .filter(l => l.position > lastMeasureTime && l.type === 'beat')
          .length;
        
        // Beat number dentro do compasso (1-based, começando em 2 porque 1 é o downbeat/measure)
        const beatNumber = beatsSinceMeasure + 2; // +2 porque beat 1 é o downbeat (measure line)
        const isStrongSubBeat = line.accentLevel === 2; // Use accent level from music theory analysis
        
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
      } else if (line.type === 'subdivision') {
        // QA FIX: Subdivisions are already filtered by LOD in gridUtils
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
  }, [gridLines, showBeats, song.duration, timelineWidth]);

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
          {getTimeMarkers.map((time) => (
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
            const snapped = snapEnabled ? snapToGrid(time, song.tempo || 120, 'beat', 4) : time;
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
              setLoopDragEnd(null); // Reset loopDragEnd
            }
          }}
          onMouseLeave={() => {
            setGhostCursorTime(null);
            if (isLoopDragging) {
              setIsLoopDragging(false);
              setLoopDragStart(null);
              setLoopDragEnd(null); // Reset loopDragEnd
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
          <TooltipProvider>
            {analyzedChordMarkers.map((chord, i) => (
              <div key={i} className="absolute top-0.5 flex flex-col gap-0.5" style={{ left: (chord.time / song.duration) * timelineWidth }}>
                {/* Main chord button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="cursor-pointer hover:brightness-110 transition-all"
                      style={{
                        backgroundColor: chord.analysis?.isBorrowed ? '#f59e0b' : '#3b82f6',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: '600',
                        padding: '3px 7px',
                        borderRadius: '3px',
                        border: '1px solid rgba(0,0,0,0.2)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                        whiteSpace: 'nowrap'
                      }}
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); onChordClick(chord); }}
                    >
                      {transposeKey(chord.chord, keyShift)}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <div className="text-xs space-y-1">
                      <div className="font-bold">{transposeKey(chord.chord, keyShift)}</div>
                      {chord.analysis && (
                        <>
                          <div>
                            <span className="text-muted-foreground">Roman:</span>{' '}
                            <span className="font-semibold">{chord.analysis.romanNumeral}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Function:</span>{' '}
                            {chord.analysis.function}
                          </div>
                          {chord.analysis.isBorrowed && (
                            <div className="text-orange-400">⚠ Borrowed chord</div>
                          )}
                        </>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>

                {/* Roman numeral badge - below chord */}
                {chord.analysis && (
                  <div
                    className="text-center"
                    style={{
                      fontSize: '9px',
                      fontWeight: '600',
                      color: chord.analysis.isBorrowed ? '#f59e0b' : '#64748b',
                      backgroundColor: 'rgba(0,0,0,0.05)',
                      padding: '1px 4px',
                      borderRadius: '2px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {chord.analysis.romanNumeral}
                  </div>
                )}
              </div>
            ))}
          </TooltipProvider>
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
