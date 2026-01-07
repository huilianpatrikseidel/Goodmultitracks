// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
import React, { useCallback, useRef } from 'react';
import { TrackWaveformRenderer } from './TrackWaveformRenderer';
import { Song, AudioTrack } from '../../../../types';

interface TimelineContainerProps {
  song: Song;
  currentTime: number;
  zoom: number;
  pixelsPerSecond?: number;
  filteredTracks: AudioTrack[];
  loopStart: number | null;
  loopEnd: number | null;
  trackHeightPx: number;
  onTimelineMouseDown: (e: React.MouseEvent) => void;
  onTimelineMouseMove: (e: React.MouseEvent) => void;
  onTimelineMouseUp: () => void;
  onScroll: (scrollLeft: number) => void;
}

/**
 * TimelineContainer - Main visualization area with waveforms
 * 
 * Renders waveforms for all tracks with loop region overlay and playback cursor
 */
export const TimelineContainer = React.memo(React.forwardRef<HTMLDivElement, TimelineContainerProps>(({
  song,
  currentTime,
  zoom,
  pixelsPerSecond,
  filteredTracks,
  loopStart,
  loopEnd,
  trackHeightPx,
  onTimelineMouseDown,
  onTimelineMouseMove,
  onTimelineMouseUp,
  onScroll,
}, ref) => {
  
  const parentRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef(0);
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    scrollPosRef.current = e.currentTarget.scrollLeft;
    onScroll(e.currentTarget.scrollLeft);
  }, [onScroll]);

  const pps = pixelsPerSecond || (zoom * 100);

  const loopRegionStyle = loopStart !== null && loopEnd !== null ? {
    left: `${loopStart * pps}px`,
    width: `${(loopEnd - loopStart) * pps}px`,
  } : undefined;

  return (
    <div 
      className="timeline-tracks-container flex-1 overflow-auto relative scrollbar-hide"
      style={{ 
        backgroundColor: 'var(--daw-bg-main)', 
        overflowY: 'auto',
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none', // IE/Edge
      }}
      ref={(node) => {
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
        (parentRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      onScroll={handleScroll}
    >
      <div 
        className="relative"
        style={{ 
          width: `${song.duration * pps}px`,
          height: `${Math.max(filteredTracks.length * trackHeightPx, 0)}px`,
          minHeight: '100%',
          paddingTop: 0,
          paddingBottom: 0,
        }}
        onClick={onTimelineMouseDown}
        onMouseDown={onTimelineMouseDown}
        onMouseMove={onTimelineMouseMove}
        onMouseUp={onTimelineMouseUp}
        onMouseLeave={onTimelineMouseUp}
      >
        <div className="absolute top-0 z-50 pointer-events-none" style={{ left: `${currentTime * pps}px`, height: '100%' }}>
          <div className="h-full" style={{ width: '2px', backgroundColor: '#ef4444', boxShadow: '0 0 4px rgba(239, 68, 68, 0.4)' }} />
        </div>

        <div 
          className="absolute inset-0 pointer-events-none" 
          style={{
            backgroundImage: 'linear-gradient(to right, var(--daw-grid) 1px, transparent 1px)',
            backgroundSize: '100px 100%',
            opacity: 0.3
          }}
        />

        {loopRegionStyle && (
          <div 
            className="absolute top-0 bottom-0 bg-yellow-500/10 border-l-2 border-r-2 border-yellow-500/50 z-10 pointer-events-none"
            style={loopRegionStyle}
          />
        )}

        {filteredTracks.map((track, index) => {
          return (
            <div
              key={track.id}
              className="track-lane absolute left-0 right-0 border-b box-border"
              style={{
                top: 0,
                height: `${trackHeightPx}px`,
                minHeight: `${trackHeightPx}px`,
                maxHeight: `${trackHeightPx}px`,
                transform: `translateY(${index * trackHeightPx}px)`,
                borderColor: 'var(--daw-border)',
                borderBottomWidth: '1px',
              }}
            >
              <div
                className="clip-box absolute rounded-md overflow-hidden border"
                style={{
                  left: 0,
                  top: '2px',
                  width: `${song.duration * pps}px`,
                  height: `calc(100% - 4px)`,
                  backgroundColor: `${track.color}20`,
                  borderColor: `${track.color}40`,
                  borderWidth: '1px',
                }}
              >
                <div
                  className="h-5 w-full flex items-center px-2"
                  style={{
                    backgroundColor: `${track.color}60`,
                  }}
                >
                  <span className="text-[10px] text-white truncate font-medium drop-shadow">
                    {track.name}
                  </span>
                </div>

                <TrackWaveformRenderer
                  trackId={track.id}
                  color={track.color || '#3b82f6'}
                  duration={song.duration}
                  pps={pps}
                  height={trackHeightPx - 28}
                  zoom={zoom}
                  scrollContainerRef={parentRef}
                  scrollPosRef={scrollPosRef}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}));

TimelineContainer.displayName = 'TimelineContainer';
