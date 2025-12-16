import React from 'react';
import { Play, Pause, Square, ChevronDown } from 'lucide-react';
import { MetronomeIcon, LoopIcon } from './icons/CustomIcons';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from './ui/dropdown-menu';
import { gainToDb, gainToSlider, sliderToGain, formatDb } from '../features/player/utils/audioUtils';
import { formatTime } from '../lib/formatters';

interface TransportBarProps {
  isPlaying: boolean;
  currentTime: number;
  tempo: number;
  songKey: string;
  loopEnabled: boolean;
  metronomeEnabled: boolean;
  metronomeVolume: number;
  currentMeasure: string;
  currentTimeSignature: string;
  displayTempo: number;
  onPlayPause: () => void;
  onStop: () => void;
  onLoopToggle: () => void;
  onMetronomeToggle: () => void;
  onMetronomeVolumeChange: (volume: number) => void;
}

const formatTimeLocal = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

export const TransportBar: React.FC<TransportBarProps> = ({
  isPlaying,
  currentTime,
  tempo,
  songKey,
  loopEnabled,
  metronomeEnabled,
  metronomeVolume,
  currentMeasure,
  currentTimeSignature,
  displayTempo,
  onPlayPause,
  onStop,
  onLoopToggle,
  onMetronomeToggle,
  onMetronomeVolumeChange,
}) => {
  return (
    <div className="flex items-center gap-4">
      {/* Transport Controls */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-neutral-100"
              style={{ 
                backgroundColor: 'var(--daw-control)',
                borderRadius: '8px'
              }}
              onClick={onStop}
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
              className="h-10 w-10 text-neutral-100"
              style={{ 
                backgroundColor: isPlaying ? '#10b981' : 'var(--daw-control)',
                borderRadius: '8px'
              }}
              onClick={onPlayPause}
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
              className="h-10 w-10 text-neutral-100"
              style={{ 
                backgroundColor: 'var(--daw-control)',
                borderRadius: '8px'
              }}
              onClick={onLoopToggle}
            >
              <LoopIcon className={`w-5 h-5 ${loopEnabled ? 'text-blue-400' : ''}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Loop</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-8 bg-neutral-700" />

      {/* Time Display */}
      <div className="flex flex-col items-center min-w-[100px]">
        <span className="text-2xl font-mono font-bold text-neutral-100 leading-none">
          {currentMeasure}
        </span>
        <span className="text-xs text-neutral-400 font-mono">
          {formatTimeLocal(currentTime)}
        </span>
      </div>

      <Separator orientation="vertical" className="h-8 bg-neutral-700" />

      {/* Tempo & Key */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <span className="text-xs text-neutral-400 uppercase">Tempo</span>
          <span className="text-sm font-bold text-neutral-100">{Math.round(displayTempo)} BPM</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-neutral-400 uppercase">Key</span>
          <span className="text-sm font-bold text-neutral-100">{songKey}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-neutral-400 uppercase">Time</span>
          <span className="text-sm font-bold text-neutral-100">{currentTimeSignature}</span>
        </div>
      </div>

      <div className="flex-1" />

      {/* Metronome Controls */}
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${metronomeEnabled ? 'text-blue-400 bg-blue-400/10' : 'text-neutral-400'}`}
              onClick={onMetronomeToggle}
            >
              <MetronomeIcon className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Metronome</TooltipContent>
        </Tooltip>
        
        <div className="w-24">
          <Slider
            value={[gainToSlider(metronomeVolume)]}
            min={0}
            max={100}
            step={1}
            onValueChange={(vals: number[]) => onMetronomeVolumeChange(sliderToGain(vals[0]))}
          />
        </div>
      </div>
    </div>
  );
};
