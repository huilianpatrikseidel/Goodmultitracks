import React from 'react';
import { X } from '../../../../components/icons/Icon';
import { Button } from '../../../../components/ui/button';
import { Slider } from '../../../../components/ui/slider';
import { AudioTrack } from '../../../../types';
import { gainToDb, sliderToGain, gainToSlider, formatDb, sliderToDb } from '../../utils/audioUtils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../../components/ui/tooltip';

interface MixerDockProps {
  tracks: AudioTrack[];
  onTrackVolumeChange: (trackId: string, volume: number) => void;
  onTrackMuteToggle: (trackId: string) => void;
  onTrackSoloToggle: (trackId: string) => void;
  onClose: () => void;
}

/**
 * MixerFader - Individual fader component with transient state
 * CRITICAL FIX: Implementado padrão de estado transiente (igual ao TrackListSidebar)
 */
interface MixerFaderProps {
  track: AudioTrack;
  isAnySolo: boolean;
  onVolumeChange: (trackId: string, volume: number) => void;
  onMuteToggle: (trackId: string) => void;
  onSoloToggle: (trackId: string) => void;
}

const MixerFader = React.memo<MixerFaderProps>(({ 
  track, 
  isAnySolo, 
  onVolumeChange, 
  onMuteToggle, 
  onSoloToggle 
}) => {
  // CRITICAL FIX (P0): Estado transiente para evitar jitter/flicker
  // Mesma lógica aplicada no TrackListSidebar
  const [localValue, setLocalValue] = React.useState(gainToSlider(track.volume));
  const [isDragging, setIsDragging] = React.useState(false);

  // Sincroniza localValue com prop APENAS quando não está arrastando
  React.useEffect(() => {
    if (!isDragging) {
      setLocalValue(gainToSlider(track.volume));
    }
  }, [track.volume, isDragging]);

  const handleValueChange = (vals: number[]) => {
    setLocalValue(vals[0]);
  };

  const handlePointerDown = () => {
    setIsDragging(true);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    // Confirma valor final apenas ao soltar (evita flood de updates)
    onVolumeChange(track.id, sliderToGain(localValue));
  };

  const handleVolumeDoubleClick = () => {
    setLocalValue(gainToSlider(1.0));
    onVolumeChange(track.id, 1.0);
  };

  const isMutedBySolo = isAnySolo && !track.solo;
  const effectiveMuted = track.muted || isMutedBySolo;

  return (
    <div className="flex flex-col items-center gap-3 min-w-[70px]">
      {/* Track Name */}
      <div 
        className="text-xs text-center truncate w-full px-1 text-neutral-50"
        title={track.name}
      >
        {track.name}
      </div>

      {/* Vertical Fader */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className="h-full flex items-center"
                onDoubleClick={handleVolumeDoubleClick}
              >
                <Slider
                  orientation="vertical"
                  value={[localValue]}
                  min={0}
                  max={100}
                  step={0.1}
                  onValueChange={handleValueChange}
                  onPointerDown={handlePointerDown}
                  onPointerUp={handlePointerUp}
                  className="h-32"
                  disabled={effectiveMuted}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              {formatDb(sliderToDb(localValue))} • Double-click to reset
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Volume Display */}
      <div 
        className={`text-xs tabular-nums text-center min-w-[45px] ${
          effectiveMuted ? 'text-neutral-600' : 'text-neutral-400'
        }`}
      >
        {formatDb(sliderToDb(localValue))}
      </div>

      {/* Mute/Solo Buttons */}
      <Button
        variant="ghost"
        size="sm"
        className={`h-7 w-8 text-xs p-0 ${
          track.muted 
            ? 'bg-red-500 text-white hover:bg-red-600' 
            : 'bg-neutral-700 text-neutral-50 hover:bg-neutral-600'
        }`}
        onClick={() => onMuteToggle(track.id)}
      >
        M
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={`h-7 w-8 text-xs p-0 ${
          track.solo 
            ? 'bg-amber-400 text-black hover:bg-amber-500' 
            : 'bg-neutral-700 text-neutral-50 hover:bg-neutral-600'
        }`}
        onClick={() => onSoloToggle(track.id)}
      >
        S
      </Button>

      {/* Color Indicator */}
      <div
        className="w-full h-1 rounded"
        style={{ backgroundColor: track.color }}
      />
    </div>
  );
});

MixerFader.displayName = 'MixerFader';

export function MixerDock({
  tracks,
  onTrackVolumeChange,
  onTrackMuteToggle,
  onTrackSoloToggle,
  onClose,
}: MixerDockProps) {
  const isAnySolo = tracks.some((t) => t.solo);

  return (
    <div 
      className="w-full flex flex-col border-t h-[240px]"
      style={{ backgroundColor: 'var(--daw-bg-contrast)', borderColor: 'var(--daw-border)' }}
    >
      {/* Header */}
      <div 
        className="h-10 border-b flex items-center justify-between px-3 bg-neutral-800 border-neutral-700"
      >
        <h3 className="text-sm text-neutral-50">Mixer</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-neutral-400 hover:text-neutral-50"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Faders Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
        <div className="flex gap-4 h-full">
          {tracks.map((track) => (
            <MixerFader
              key={track.id}
              track={track}
              isAnySolo={isAnySolo}
              onVolumeChange={onTrackVolumeChange}
              onMuteToggle={onTrackMuteToggle}
              onSoloToggle={onTrackSoloToggle}
            />
          ))}
        </div>
      </div>
    </div>
  );
}


