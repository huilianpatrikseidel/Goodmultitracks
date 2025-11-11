import React from 'react';
import { Badge } from './ui/badge';
import { Song, SectionMarker, TempoChange, ChordMarker } from '../types';

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
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
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
}) => {
  // --- Time Ruler Logic ---
  const getTimeMarkers = () => {
    const getTimeInterval = () => {
      if (zoom >= 8) return 1;
      if (zoom >= 4) return 2;
      if (zoom >= 2) return 5;
      return 10;
    };
    const interval = getTimeInterval();
  const markers: number[] = [];
    for (let i = 0; i <= song.duration; i += interval) {
      markers.push(i);
    }
    return markers;
  };

  // --- Measures Ruler Logic ---
  const getMeasureBars = () => {
    const allTempoChanges = song.tempoChanges || [{ time: 0, tempo: song.tempo, timeSignature: '4/4' }];
    const tempoChanges = editMode ? allTempoChanges : allTempoChanges.filter(tc => !tc.hidden);

    const getMeasureSkip = () => {
      if (zoom >= 4) return 1;
      if (zoom >= 2) return 2;
      if (zoom >= 1.5) return 4;
      return 8;
    };
  const measureSkip = getMeasureSkip();

    const measureBars: { time: number; measure: number | null; beat: number; isBeat: boolean; isCompound?: boolean; isIrregular?: boolean }[] = [];
    let currentMeasureTime = 0;
    let measureCount = 0;

    while (currentMeasureTime < song.duration && measureCount < 1000) {
      const currentTempo = tempoChanges.slice().reverse().find(tc => tc.time <= currentMeasureTime) || tempoChanges[0];
      const [numerator, denominator] = (currentTempo.timeSignature || '4/4').split('/').map(Number);
      const beatsPerMeasure = numerator || 4;
      const secondsPerBeat = 60 / (currentTempo.tempo || song.tempo || 120);
      const measureDuration = beatsPerMeasure * secondsPerBeat;

      if (measureDuration <= 0 || !isFinite(measureDuration)) break;

      const isCompound = denominator === 8 && [6, 9, 12].includes(numerator);
      const isIrregular = !!currentTempo.subdivision;

  if (showBeats) {
        for (let beat = 0; beat < beatsPerMeasure; beat++) {
          const beatTime = currentMeasureTime + (beat * secondsPerBeat);
          if (beatTime <= song.duration) {
            measureBars.push({ time: beatTime, measure: beat === 0 ? measureCount + 1 : null, beat: beat + 1, isBeat: beat > 0, isCompound, isIrregular });
          }
        }
      } else {
        const shouldShow = measureCount % measureSkip === 0;
        measureBars.push({ time: currentMeasureTime, measure: shouldShow ? measureCount + 1 : null, beat: 1, isBeat: false, isCompound, isIrregular });
      }
      currentMeasureTime += measureDuration;
      measureCount++;
    }
    return measureBars;
  };

  switch (rulerId) {
    case 'time':
      return (
        <div className="h-7 border-b relative" style={{ backgroundColor: '#171717', borderColor: '#3A3A3A' }} onDrop={(e) => onRulerDrop(e, 'time')} onDragOver={onRulerDragOver}>
          {getTimeMarkers().map((time) => (
            <div key={time} className="absolute top-0 bottom-0 border-l" style={{ left: (time / song.duration) * timelineWidth, borderColor: '#3A3A3A' }}>
              <span className="absolute top-0.5 left-1 text-xs" style={{ color: '#9E9E9E' }}>{formatTime(time)}</span>
            </div>
          ))}
        </div>
      );

    case 'measures':
      return (
        <div className="h-7 border-b relative" style={{ backgroundColor: '#171717', borderColor: '#3A3A3A' }} onDrop={(e) => onRulerDrop(e, 'measures')} onDragOver={onRulerDragOver}>
          {getMeasureBars().map((bar, i) => {
            const position = (bar.time / song.duration) * timelineWidth;
            if (!bar.measure && !bar.isBeat) return null;
            let borderColor = '#3A3A3A';
            let backgroundColor = 'transparent';
            if (bar.isCompound) { borderColor = '#8B5CF6'; backgroundColor = 'rgba(139, 92, 246, 0.05)'; }
            else if (bar.isIrregular) { borderColor = '#F59E0B'; backgroundColor = 'rgba(245, 158, 11, 0.05)'; }
            else if (bar.isBeat) { borderColor = '#2B2B2B'; }
            return (
              <div key={i} className="absolute top-0 bottom-0 border-l transition-colors" style={{ left: position, borderColor, backgroundColor }} title={bar.isCompound ? 'Compound Time' : bar.isIrregular ? 'Irregular Time' : undefined}>
                {bar.measure && <span className="absolute top-0.5 left-1 text-xs font-semibold" style={{ color: bar.isCompound ? '#8B5CF6' : bar.isIrregular ? '#F59E0B' : '#9E9E9E' }}>{bar.measure}</span>}
                {showBeats && bar.isBeat && <span className="absolute top-0.5 left-1 text-xs" style={{ color: '#9E9E9E' }}>{bar.beat}</span>}
              </div>
            );
          })}
        </div>
      );

    case 'tempo':
      const tempoChanges = editMode ? (song.tempoChanges || []) : (song.tempoChanges || []).filter(tc => !tc.hidden);
      return (
        <div className="h-7 border-b relative" style={{ backgroundColor: '#171717', borderColor: '#3A3A3A' }} onDrop={(e) => onRulerDrop(e, 'tempo')} onDragOver={onRulerDragOver}>
          {tempoChanges.map((tc, index) => (
            <div
              key={`tempo-${index}`}
              className="absolute top-0 h-full flex items-center cursor-pointer group"
              style={{ left: `${(tc.time / song.duration) * 100}%` }}
              onClick={() => onTempoMarkerClick(tc)}
            >
              <div className="h-full w-px bg-yellow-500 opacity-50" />
              <div className="absolute top-1 -translate-x-1/2 flex flex-col items-center gap-1">
                <Badge variant="secondary" className="text-xs group-hover:bg-yellow-600">{tc.tempo} BPM</Badge>
                <Badge variant="outline" className="text-xs group-hover:bg-gray-600">{tc.timeSignature}</Badge>
              </div>
            </div>
          ))}
        </div>
      );

    case 'chords':
      return (
        <div className="h-7 border-b relative" style={{ backgroundColor: '#171717', borderColor: '#3A3A3A' }} onDrop={(e) => onRulerDrop(e, 'chords')} onDragOver={onRulerDragOver}>
          {(song.chordMarkers || []).map((chord, i) => (
            <div key={i} className="absolute top-0 bottom-0" style={{ left: (chord.time / song.duration) * timelineWidth }}>
              <Badge
                variant="secondary"
                className="absolute top-0.5 left-0 text-xs bg-blue-600 text-white cursor-pointer hover:bg-blue-700 transition-colors whitespace-nowrap"
                onClick={(e) => { e.stopPropagation(); onChordClick(chord); }}
              >
                {transposeKey(chord.chord, keyShift)}
              </Badge>
            </div>
          ))}
        </div>
      );

    case 'sections':
      return (
        <div className="h-8 border-b relative" style={{ backgroundColor: '#171717', borderColor: '#3A3A3A' }} onDrop={(e) => onRulerDrop(e, 'sections')} onDragOver={onRulerDragOver}>
          {song.markers.map((marker, i) => {
            const position = (marker.time / song.duration) * timelineWidth;
            const nextMarker = song.markers[i + 1];
            const width = nextMarker ? ((nextMarker.time - marker.time) / song.duration) * timelineWidth : timelineWidth - position;
            const colorMap: Record<string, string> = { intro: 'bg-green-600', verse: 'bg-blue-600', chorus: 'bg-red-600', bridge: 'bg-yellow-600', outro: 'bg-purple-600', 'pre-chorus': 'bg-pink-600', instrumental: 'bg-teal-600', tag: 'bg-gray-500', custom: 'bg-gray-400' };
            const bgColor = colorMap[marker.type] || colorMap.custom;
            const borderColor = bgColor.replace('bg-', 'border-');
            return (
              <div key={marker.id} className={`absolute top-1 bottom-1 ${bgColor} bg-opacity-30 border-l-2 ${borderColor} cursor-pointer hover:bg-opacity-50 transition-all`} style={{ left: position, width: Math.max(0, width) }} onClick={(e) => { e.stopPropagation(); onSectionClick(i); }}>
                <span className="absolute top-1 left-2 text-xs pointer-events-none truncate max-w-full pr-1">{marker.label}</span>
              </div>
            );
          })}
        </div>
      );

    default:
      return null;
  }
};