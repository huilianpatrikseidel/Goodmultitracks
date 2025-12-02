import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Slider } from './ui/slider';
import { Input } from './ui/input';
import { AudioTrack } from '../types';
import { gainToDb, gainToSlider, sliderToGain, sliderToDb, formatDb, parseDbInput, hexToRgba } from '../features/player/utils/audioUtils';

interface TrackControlProps {
  track: AudioTrack;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onSoloToggle: () => void;
  isAnySolo: boolean;
}

export function TrackControl({ 
  track, 
  onVolumeChange, 
  onMuteToggle, 
  onSoloToggle,
  isAnySolo 
}: TrackControlProps) {
  const isDimmed = isAnySolo && !track.solo;
  const [dbInput, setDbInput] = useState('');
  const [isEditingDb, setIsEditingDb] = useState(false);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [localSliderValue, setLocalSliderValue] = useState(gainToSlider(track.volume));
  const inputRef = useRef<HTMLInputElement>(null);

  // Calculate dB from local slider value when dragging, otherwise from track volume
  const displayDb = isDraggingSlider ? sliderToDb(localSliderValue) : gainToDb(track.volume);

  // Update local slider value when track volume changes (but not when dragging)
  useEffect(() => {
    if (!isDraggingSlider) {
      setLocalSliderValue(gainToSlider(track.volume));
    }
  }, [track.volume, isDraggingSlider]);

  // Update dB input display
  useEffect(() => {
    if (!isEditingDb) {
      setDbInput(formatDb(displayDb));
    }
  }, [displayDb, isEditingDb]);

  const handleSliderChange = (values: number[]) => {
    setLocalSliderValue(values[0]);
    // Only update display, don't commit to track.volume yet
  };

  const handleSliderPointerDown = () => {
    setIsDraggingSlider(true);
  };

  const handleSliderPointerUp = () => {
    // Commit the final value when dragging ends
    const newGain = sliderToGain(localSliderValue);
    onVolumeChange(newGain);
    setIsDraggingSlider(false);
  };

  const handleDbInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDbInput(e.target.value);
  };

  const handleDbInputBlur = () => {
    const gain = parseDbInput(dbInput);
    if (gain !== null) {
      onVolumeChange(gain);
      setLocalSliderValue(gainToSlider(gain));
    }
    setIsEditingDb(false);
    setDbInput(formatDb(displayDb));
  };

  const handleDbInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setIsEditingDb(false);
      setDbInput(formatDb(displayDb));
    }
  };

  return (
    <div 
      className={`flex items-center gap-3 p-3 border rounded-lg transition-opacity ${isDimmed ? 'opacity-40' : ''}`}
      style={{ backgroundColor: hexToRgba(track.color || '#60a5fa', 0.3) }}
    >
      {/* Color indicator */}
      <div 
        className="w-1 h-full rounded-full self-stretch"
        style={{ backgroundColor: track.color || '#60a5fa' }}
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="track-name text-sm truncate">{track.name}</span>
          <span className="text-xs text-gray-500 uppercase">{track.type}</span>
        </div>
        
        {/* Waveform visualization */}
        <div className="h-8 flex items-center gap-px">
          {track.waveformData.slice(0, 50).map((value, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                backgroundColor: track.color || '#60a5fa',
                height: `${value * 100}%`,
                opacity: track.muted ? 0.3 : 0.7,
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Volume slider */}
        <div className="flex items-center gap-2">
          {track.muted ? (
            <VolumeX className="w-4 h-4 text-gray-400" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
          <div 
            onPointerDown={handleSliderPointerDown}
            onPointerUp={handleSliderPointerUp}
            onPointerCancel={handleSliderPointerUp}
          >
            <Slider
              value={[localSliderValue]}
              onValueChange={handleSliderChange}
              max={100}
              step={0.1}
              className="w-24"
              disabled={track.muted}
            />
          </div>
          <Input
            ref={inputRef}
            value={dbInput}
            onChange={handleDbInputChange}
            onFocus={() => setIsEditingDb(true)}
            onBlur={handleDbInputBlur}
            onKeyDown={handleDbInputKeyDown}
            disabled={track.muted}
            className="w-16 h-8 text-xs text-center"
          />
        </div>

        {/* Mute/Solo buttons */}
        <button
          onClick={onMuteToggle}
          className={`track-control-button ${track.muted ? 'muted active' : ''}`}
        >
          M
        </button>
        <button
          onClick={onSoloToggle}
          className={`track-control-button ${track.solo ? 'solo active' : ''}`}
        >
          S
        </button>
      </div>
    </div>
  );
}
