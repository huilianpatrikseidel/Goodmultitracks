import React from 'react';
import { Ruler } from '../timeline/Ruler';
import { Song, ChordMarker, TempoChange } from '../../types';

interface RulersContainerProps {
  song: Song;
  currentTime: number;
  gridTime: number;
  tempo: number;
  zoom: number;
  pixelsPerSecond?: number;
  containerWidth: number;
  visibleRulers: string[];
  rulerOrder: string[];
  onTimeClick: (time: number) => void;
  onMarkerEdit?: (marker: any, type: 'tempo' | 'timesig' | 'section' | 'chord') => void;
  onMarkerDelete?: (markerId: string, type: 'tempo' | 'timesig' | 'section' | 'chord') => void;
  editMode: boolean;
  keyShift: number;
  onChordClick?: (chord: string, customDiagram?: any) => void;
  onLoopRegionChange?: (start: number, end: number) => void;
  loopStart?: number | null;
  loopEnd?: number | null;
  scrollLeft?: number;
  warpMode?: boolean;
  onWarpCommit?: (prevAnchor: number, draggedMeasure: number, newBpm: number) => void;
  onTempoMarkerAdd?: (time: number) => void;
  onChordAdd?: (time: number) => void;
}

/**
 * RulersContainer - Consolidates all timeline rulers
 * 
 * Responsibilities:
 * - Renders all visible rulers (time, measures, sections, chords, tempo)
 * - Manages ruler visibility and order
 * - Handles marker editing and deletion
 * - Provides consistent interaction patterns
 * 
 * This component isolates ruler rendering logic from the main timeline,
 * improving maintainability and enabling independent testing.
 */
export const RulersContainer: React.FC<RulersContainerProps> = React.memo(({
  song,
  currentTime,
  gridTime,
  tempo,
  zoom,
  pixelsPerSecond,
  containerWidth,
  visibleRulers,
  rulerOrder,
  onTimeClick,
  onMarkerEdit,
  onMarkerDelete,
  editMode,
  keyShift,
  onChordClick,
  onLoopRegionChange,
  loopStart,
  loopEnd,
  scrollLeft,
  warpMode = false,
  onWarpCommit,
  onTempoMarkerAdd,
  onChordAdd,
}) => {
  // Use pixelsPerSecond if provided, otherwise fallback to zoom * 100
  const pps = pixelsPerSecond || (zoom * 100);

  // Filter and sort rulers based on visibility and order
  const activeRulers = rulerOrder.filter(id => visibleRulers.includes(id));

  const handleChordClick = (chord: ChordMarker) => {
    if (onChordClick) {
      onChordClick(chord.chord, chord.customDiagram);
    }
  };

  const handleSectionClick = (markerIndex: number) => {
    if (editMode && !warpMode && onMarkerEdit && song.markers[markerIndex]) {
      onMarkerEdit(song.markers[markerIndex], 'section');
    }
  };

  const handleTempoMarkerClick = (data: TempoChange) => {
    if (editMode && !warpMode && onMarkerEdit) {
      onMarkerEdit(data, 'tempo');
    }
  };

  return (
    <div className="relative flex-shrink-0 z-10" style={{ width: `${song.duration * pps}px` }}>
      {/* Playback Cursor para as réguas */}
      <div className="absolute top-0 bottom-0 z-50 pointer-events-none" style={{ left: `${currentTime * pps}px` }}>
        <div className="absolute top-0 bottom-0" style={{ width: '2px', backgroundColor: '#ef4444' }}>
          {/* Triangle at top */}
          <div 
            className="absolute -top-0 left-1/2 -translate-x-1/2"
            style={{
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '8px solid #ef4444',
            }}
          />
        </div>
      </div>

      {activeRulers.map((rulerId) => (
        <Ruler
          key={rulerId}
          rulerId={rulerId as 'time' | 'measures' | 'sections' | 'chords' | 'tempo'}
          song={song}
          timelineWidth={song.duration * pps}
          zoom={zoom}
          editMode={editMode}
          keyShift={keyShift}
          showBeats={true}
          onRulerDrop={() => {}}
          onRulerDragOver={(e) => e.preventDefault()}
          onSectionClick={handleSectionClick}
          onTempoMarkerClick={handleTempoMarkerClick}
          onChordClick={handleChordClick}
          onTimeClick={onTimeClick}
          onLoopRegionChange={rulerId === 'measures' ? onLoopRegionChange : undefined}
          loopStart={loopStart}
          loopEnd={loopEnd}
          scrollLeft={scrollLeft}
          containerWidth={containerWidth}
          warpMode={warpMode}
          onWarpCommit={onWarpCommit}
          onTempoMarkerAdd={onTempoMarkerAdd}
          onChordAdd={onChordAdd}
        />
      ))}
    </div>
  );
});

RulersContainer.displayName = 'RulersContainer';
