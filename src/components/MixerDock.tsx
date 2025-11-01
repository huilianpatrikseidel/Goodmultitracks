import React from 'react';
import { X, Volume2 } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { AudioTrack } from '../types';
import { gainToDb, sliderToGain, gainToSlider, formatDb } from '../lib/audioUtils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

interface MixerDockProps {
  tracks: AudioTrack[];
  onTrackVolumeChange: (trackId: string, volume: number) => void;
  onTrackMuteToggle: (trackId: string) => void;
  onTrackSoloToggle: (trackId: string) => void;
  onClose: () => void;
}

export function MixerDock({
  tracks,
  onTrackVolumeChange,
  onTrackMuteToggle,
  onTrackSoloToggle,
  onClose,
}: MixerDockProps) {
  const isAnySolo = tracks.some((t) => t.solo);

  const handleVolumeDoubleClick = (trackId: string) => {
    onTrackVolumeChange(trackId, 1.0);
  };

  return (
    <div 
      className="w-full flex flex-col border-t"
      style={{ 
        backgroundColor: '#1E1E1E',
        borderColor: '#3A3A3A',
        height: '240px',
      }}
    >
      {/* Header */}
      <div 
        className="h-10 border-b flex items-center justify-between px-3"
        style={{ 
          backgroundColor: '#2B2B2B',
          borderColor: '#3A3A3A',
        }}
      >
        <h3 className="text-sm" style={{ color: '#F1F1F1' }}>Mixer</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onClose}
          style={{ color: '#9E9E9E' }}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Faders Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
        <div className="flex gap-4 h-full">
          {tracks.map((track) => {
            const isMutedBySolo = isAnySolo && !track.solo;
            const effectiveMuted = track.muted || isMutedBySolo;
            const dbValue = gainToDb(track.volume);

            return (
              <div 
                key={track.id} 
                className="flex flex-col items-center gap-3"
                style={{ minWidth: '70px' }}
              >
                {/* Track Name */}
                <div 
                  className="text-xs text-center truncate w-full px-1"
                  style={{ color: '#F1F1F1' }}
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
                          onDoubleClick={() => handleVolumeDoubleClick(track.id)}
                        >
                          <Slider
                            orientation="vertical"
                            value={[gainToSlider(track.volume)]}
                            onValueChange={(value) => {
                              const newVolume = sliderToGain(value[0]);
                              onTrackVolumeChange(track.id, newVolume);
                            }}
                            min={0}
                            max={100}
                            step={1}
                            className="h-32"
                            disabled={effectiveMuted}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        {formatDb(dbValue)} • Double-click to reset
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Volume Display */}
                <div 
                  className="text-xs tabular-nums text-center"
                  style={{ 
                    color: effectiveMuted ? '#666666' : '#9E9E9E',
                    minWidth: '45px',
                  }}
                >
                  {formatDb(dbValue)}
                </div>

                {/* Mute/Solo Buttons */}
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-8 text-xs p-0"
                    onClick={() => onTrackMuteToggle(track.id)}
                    style={{
                      backgroundColor: track.muted ? '#EF4444' : '#404040',
                      color: track.muted ? '#FFFFFF' : '#F1F1F1',
                    }}
                    onMouseEnter={(e) => {
                      if (!track.muted) {
                        e.currentTarget.style.backgroundColor = '#5A5A5A';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!track.muted) {
                        e.currentTarget.style.backgroundColor = '#404040';
                      }
                    }}
                  >
                    M
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-8 text-xs p-0"
                    onClick={() => onTrackSoloToggle(track.id)}
                    style={{
                      backgroundColor: track.solo ? '#FBBF24' : '#404040',
                      color: track.solo ? '#000000' : '#F1F1F1',
                    }}
                    onMouseEnter={(e) => {
                      if (!track.solo) {
                        e.currentTarget.style.backgroundColor = '#5A5A5A';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!track.solo) {
                        e.currentTarget.style.backgroundColor = '#404040';
                      }
                    }}
                  >
                    S
                  </Button>
                </div>

                {/* Color Indicator */}
                <div
                  className="w-full h-1 rounded"
                  style={{ backgroundColor: track.color || '#60a5fa' }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
