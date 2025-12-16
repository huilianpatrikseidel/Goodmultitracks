import React from 'react';
import { SectionMarker, ChordData } from '../types';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card';
import { formatTime } from '../lib/formatters';

interface TimelineProps {
  duration: number;
  currentTime: number;
  markers: SectionMarker[];
  chords: ChordData[];
  onSeek: (time: number) => void;
  loopStart?: number | null;
  loopEnd?: number | null;
  onMouseDown?: (e: React.MouseEvent<HTMLDivElement>, duration: number) => void;
  onMouseMove?: (e: React.MouseEvent<HTMLDivElement>, duration: number) => void;
  onMouseUp?: (e: React.MouseEvent<HTMLDivElement>, duration: number) => void;
}

const chordDiagrams: Record<string, { guitar: string; keys: string }> = {
  C: { guitar: 'x32010', keys: 'C-E-G' },
  G: { guitar: '320003', keys: 'G-B-D' },
  Am: { guitar: 'x02210', keys: 'A-C-E' },
  F: { guitar: '133211', keys: 'F-A-C' },
  D: { guitar: 'xx0232', keys: 'D-F#-A' },
  E: { guitar: '022100', keys: 'E-G#-B' },
};

export function Timeline({ 
  duration, 
  currentTime, 
  markers, 
  chords, 
  onSeek,
  loopStart,
  loopEnd,
  onMouseDown,
  onMouseMove,
  onMouseUp
}: TimelineProps) {
  const progressPercentage = (currentTime / duration) * 100;

  return (
    <div className="space-y-3">
      {/* Chords display */}
      <div className="relative h-8">
        {chords.map((chord, i) => {
          const leftPosition = (chord.time / duration) * 100;
          const isActive = currentTime >= chord.time && currentTime < chord.time + chord.duration;
          const diagram = chordDiagrams[chord.chord] || { guitar: 'Unknown', keys: 'Unknown' };

          return (
            <HoverCard key={i} openDelay={0} closeDelay={0}>
              <HoverCardTrigger asChild>
                <div
                  className={`absolute px-2 py-1 rounded text-xs cursor-pointer transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white scale-110'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  style={{ left: `${leftPosition}%` }}
                >
                  {chord.chord}
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-64">
                <div className="space-y-2">
                  <h4>{chord.chord} Chord</h4>
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="text-gray-600">Guitar:</span> {diagram.guitar}
                    </div>
                    <div>
                      <span className="text-gray-600">Keys:</span> {diagram.keys}
                    </div>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          );
        })}
      </div>

      {/* Timeline with markers */}
      <div className="relative">
        {/* Section markers */}
        <div className="relative h-12 mb-1">
          {markers.map((marker) => {
            const leftPosition = (marker.time / duration) * 100;
            const markerColors = {
              intro: 'bg-green-500',
              verse: 'bg-blue-500',
              chorus: 'bg-purple-500',
              bridge: 'bg-orange-500',
              outro: 'bg-red-500',
              custom: 'bg-gray-500',
            };

            return (
              <div
                key={marker.id}
                className="absolute top-0 flex flex-col items-start"
                style={{ left: `${leftPosition}%` }}
              >
                <div className={`w-1 h-12 ${markerColors[marker.type]}`} />
                <span className="text-xs mt-1 whitespace-nowrap">{marker.label}</span>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div
          className="relative h-3 bg-gray-200 rounded-full cursor-pointer overflow-hidden"
          onMouseDown={onMouseDown ? (e) => onMouseDown(e, duration) : undefined}
          onMouseMove={onMouseMove ? (e) => onMouseMove(e, duration) : undefined}
          onMouseUp={onMouseUp ? (e) => onMouseUp(e, duration) : undefined}
          onMouseLeave={onMouseUp ? (e) => onMouseUp(e, duration) : undefined}
        >
          {/* Loop region highlight */}
          {loopStart !== null && loopEnd !== null && (
            <div
              className="absolute top-0 h-full bg-yellow-300 opacity-30"
              style={{ 
                left: `${(loopStart / duration) * 100}%`,
                width: `${((loopEnd - loopStart) / duration) * 100}%`
              }}
            />
          )}
          {/* Loop start marker */}
          {loopStart !== null && (
            <div
              className="absolute top-0 h-full w-0.5 bg-yellow-500"
              style={{ left: `${(loopStart / duration) * 100}%` }}
            />
          )}
          {/* Loop end marker */}
          {loopEnd !== null && (
            <div
              className="absolute top-0 h-full w-0.5 bg-yellow-500"
              style={{ left: `${(loopEnd / duration) * 100}%` }}
            />
          )}
          <div
            className="absolute top-0 left-0 h-full bg-blue-600 transition-all"
            style={{ width: `${progressPercentage}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-600 rounded-full shadow-lg"
            style={{ left: `calc(${progressPercentage}% - 8px)` }}
          />
        </div>

        {/* Time display */}
        <div className="flex justify-between mt-1 text-sm text-gray-600">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
