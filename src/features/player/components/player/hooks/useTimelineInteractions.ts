import { useState, useRef, useCallback } from 'react';
import { Song } from '../../../../../types';

interface TimelineInteractionsProps {
  song: Song;
  zoom: number;
  snapEnabled: boolean;
  isPlaying: boolean;
  onSeek: (time: number) => void;
  onLoopSet: (start: number, end: number) => void;
}

export const useTimelineInteractions = ({
  song,
  zoom,
  snapEnabled,
  isPlaying,
  onSeek,
  onLoopSet,
}: TimelineInteractionsProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartTime, setDragStartTime] = useState<number | null>(null);
  const [hasDragged, setHasDragged] = useState(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const lastMouseMoveTimeRef = useRef<number>(0);

  const timelineScrollRef = useRef<HTMLDivElement>(null);

  const snapToMeasure = useCallback(
    (time: number): number => {
      if (!snapEnabled) return time;

      const tempo = song.tempo || 120;
      const [numerator] = (song.tempoChanges?.[0]?.timeSignature || '4/4')
        .split('/')
        .map(Number);
      const beatsPerMeasure = numerator || 4;
      const secondsPerBeat = 60 / tempo;
      const measureDuration = beatsPerMeasure * secondsPerBeat;

      const measureNumber = Math.round(time / measureDuration);
      return measureNumber * measureDuration;
    },
    [snapEnabled, song.tempo, song.tempoChanges]
  );

  const getTimeFromMouseX = useCallback(
    (mouseX: number, containerRect: DOMRect): number => {
      const relativeX = mouseX - containerRect.left;
      const timelineWidth = song.duration * zoom * 100;
      const scrollLeft = timelineScrollRef.current?.scrollLeft || 0;
      const adjustedX = relativeX + scrollLeft;
      const time = (adjustedX / timelineWidth) * song.duration;
      return Math.max(0, Math.min(song.duration, time));
    },
    [song.duration, zoom]
  );

  const handleWaveformMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isPlaying) return; // Don't allow scrubbing while playing

      const target = e.target as HTMLElement;
      const container = e.currentTarget;
      const rect = container.getBoundingClientRect();
      const time = getTimeFromMouseX(e.clientX, rect);

      setIsDragging(true);
      setDragStartTime(time);
      setDragStartX(e.clientX);
      setHasDragged(false);

      // Immediate seek on click
      const snappedTime = snapToMeasure(time);
      onSeek(snappedTime);
    },
    [isPlaying, getTimeFromMouseX, snapToMeasure, onSeek]
  );

  const handleWaveformMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging) return;

      // Throttle mouse move events (every 16ms = ~60fps)
      const now = Date.now();
      if (now - lastMouseMoveTimeRef.current < 16) return;
      lastMouseMoveTimeRef.current = now;

      const container = e.currentTarget;
      const rect = container.getBoundingClientRect();
      const time = getTimeFromMouseX(e.clientX, rect);

      // Mark as dragged if moved more than 5px
      if (dragStartX !== null && Math.abs(e.clientX - dragStartX) > 5) {
        setHasDragged(true);
      }

      const snappedTime = snapToMeasure(time);
      onSeek(snappedTime);
    },
    [isDragging, dragStartX, getTimeFromMouseX, snapToMeasure, onSeek]
  );

  const handleWaveformMouseUp = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging) return;

      const container = e.currentTarget;
      const rect = container.getBoundingClientRect();
      const endTime = getTimeFromMouseX(e.clientX, rect);

      // If user dragged significantly, create loop region
      if (hasDragged && dragStartTime !== null) {
        const start = Math.min(dragStartTime, endTime);
        const end = Math.max(dragStartTime, endTime);
        if (end - start > 0.5) {
          // Minimum 0.5s loop
          onLoopSet(snapToMeasure(start), snapToMeasure(end));
        }
      }

      setIsDragging(false);
      setDragStartTime(null);
      setDragStartX(null);
      setHasDragged(false);
    },
    [
      isDragging,
      hasDragged,
      dragStartTime,
      getTimeFromMouseX,
      snapToMeasure,
      onLoopSet,
    ]
  );

  return {
    isDragging,
    dragStartTime,
    hasDragged,
    timelineScrollRef,
    handleWaveformMouseDown,
    handleWaveformMouseMove,
    handleWaveformMouseUp,
  };
};
