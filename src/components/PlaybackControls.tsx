import React, { useState } from 'react';
import { Music, Guitar } from 'lucide-react';
import { PlaybackSettingsIcon } from './icons/CustomIcons';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './ui/tooltip';

interface PlaybackControlsProps {
  tempo: number;
  onTempoChange: (tempo: number) => void;
  keyShift: number;
  onKeyShiftChange: (keyShift: number) => void;
  disabled?: boolean;
  originalKey?: string; // Original song key
}

// Helper function to transpose key
const transposeKey = (key: string, semitones: number): string => {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const flatNotes = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  
  // Parse key (e.g., "Cm" -> "C" + "m")
  const isFlat = key.includes('b');
  const noteList = isFlat ? flatNotes : notes;
  const rootNote = key.match(/^[A-G][#b]?/)?.[0] || 'C';
  const suffix = key.replace(rootNote, '');
  
  let index = noteList.indexOf(rootNote);
  if (index === -1) {
    // Try to find in the other list
    index = (isFlat ? notes : flatNotes).indexOf(rootNote);
    if (index === -1) return key; // Return original if not found
  }
  
  const newIndex = (index + semitones + 12) % 12;
  return noteList[newIndex] + suffix;
};

export function PlaybackControls({
  tempo,
  onTempoChange,
  keyShift,
  onKeyShiftChange,
  disabled,
  originalKey = 'C',
}: PlaybackControlsProps) {
  const [capoFret, setCapoFret] = useState(0);
  
  // Calculate the effective transpose (keyShift) and the key seen by the player
  const effectiveTranspose = keyShift + capoFret;
  const playingKey = transposeKey(originalKey, keyShift);
  const displayKey = transposeKey(originalKey, effectiveTranspose);
  
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              style={{ 
                backgroundColor: 'var(--daw-control)', 
                color: 'var(--daw-text-primary)',
                borderRadius: '8px'
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.backgroundColor = 'var(--daw-control-hover)';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.backgroundColor = 'var(--daw-control)';
              }}
              disabled={disabled}
            >
              <PlaybackSettingsIcon className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Playback Settings</TooltipContent>
      </Tooltip>

      <DropdownMenuContent
        className="w-96 p-4"
        style={{ backgroundColor: '#2B2B2B', borderColor: '#3A3A3A' }}
        align="end"
      >
        <div className="space-y-5">
          {/* Tempo Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm flex items-center gap-2" style={{ color: '#F1F1F1' }}>
                <PlaybackSettingsIcon className="w-4 h-4" />
                Speed
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-sm tabular-nums" style={{ color: '#9E9E9E' }}>
                  {tempo}%
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onTempoChange(100)}
                  className="h-6 px-2 text-xs"
                  style={{
                    backgroundColor: tempo === 100 ? '#3B82F6' : '#404040',
                    color: '#F1F1F1',
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
            <Slider
              value={[tempo]}
              onValueChange={([value]: number[]) => onTempoChange(value)}
              min={50}
              max={150}
              step={1}
              className="w-full"
              onDoubleClick={() => onTempoChange(100)}
            />
            <div className="flex justify-between text-xs" style={{ color: '#6B6B6B' }}>
              <span>50%</span>
              <span>100%</span>
              <span>150%</span>
            </div>
          </div>

          <Separator style={{ backgroundColor: '#3A3A3A' }} />

          {/* Key Information */}
          <div className="space-y-2">
            <Label className="text-sm" style={{ color: '#F1F1F1' }}>
              Key Information
            </Label>
            <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-md" style={{ backgroundColor: '#1E1E1E', border: '1px solid #3A3A3A' }}>
              <div>
                <div className="text-xs mb-1" style={{ color: '#9E9E9E' }}>Original</div>
                <div className="text-lg" style={{ color: '#F1F1F1' }}>{originalKey}</div>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: '#9E9E9E' }}>Playing</div>
                <div className="text-lg" style={{ color: '#3B82F6' }}>{playingKey}</div>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: '#9E9E9E' }}>Display</div>
                <div className="text-lg" style={{ color: capoFret > 0 ? '#22c55e' : '#F1F1F1' }}>{displayKey}</div>
              </div>
            </div>
          </div>

          {/* Key Shift Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm flex items-center gap-2" style={{ color: '#F1F1F1' }}>
                <Music className="w-4 h-4" />
                Transpose
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-sm tabular-nums" style={{ color: '#9E9E9E' }}>
                  {keyShift > 0 ? '+' : ''}
                  {keyShift} {Math.abs(keyShift) === 1 ? 'semitone' : 'semitones'}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onKeyShiftChange(0)}
                  className="h-6 px-2 text-xs"
                  style={{
                    backgroundColor: keyShift === 0 ? '#3B82F6' : '#404040',
                    color: '#F1F1F1',
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
            <Slider
              value={[keyShift]}
              onValueChange={([value]: number[]) => onKeyShiftChange(value)}
              min={-12}
              max={12}
              step={1}
              className="w-full"
              onDoubleClick={() => onKeyShiftChange(0)}
            />
            <div className="flex justify-between text-xs" style={{ color: '#6B6B6B' }}>
              <span>-12</span>
              <span>0</span>
              <span>+12</span>
            </div>
          </div>

          {/* Capo Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm flex items-center gap-2" style={{ color: '#F1F1F1' }}>
                <Guitar className="w-4 h-4" />
                Capo Position
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-sm tabular-nums" style={{ color: '#9E9E9E' }}>
                  Fret {capoFret}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCapoFret(0)}
                  className="h-6 px-2 text-xs"
                  style={{
                    backgroundColor: capoFret === 0 ? '#3B82F6' : '#404040',
                    color: '#F1F1F1',
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
            <Slider
              value={[capoFret]}
              onValueChange={([value]: number[]) => setCapoFret(value)}
              min={0}
              max={12}
              step={1}
              className="w-full"
              onDoubleClick={() => setCapoFret(0)}
            />
            <div className="flex justify-between text-xs" style={{ color: '#6B6B6B' }}>
              <span>0</span>
              <span>6</span>
              <span>12</span>
            </div>
            <div className="text-xs" style={{ color: '#9E9E9E' }}>
              {capoFret > 0 
                ? `Chords shown are ${capoFret} semitone${capoFret > 1 ? 's' : ''} higher (play as if no capo)`
                : 'No capo - play chords as shown'
              }
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <Label className="text-sm" style={{ color: '#F1F1F1' }}>
              Quick Presets
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onTempoChange(75);
                  onKeyShiftChange(0);
                }}
                className="text-xs"
                style={{
                  backgroundColor: 'var(--daw-control)',
                  color: 'var(--daw-text-secondary)',
                  borderColor: 'var(--daw-border)',
                }}
              >
                Practice (75%)
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onTempoChange(100);
                  onKeyShiftChange(0);
                  setCapoFret(0);
                }}
                className="text-xs"
                style={{
                  backgroundColor: 'var(--daw-control)',
                  color: 'var(--daw-text-secondary)',
                  borderColor: 'var(--daw-border)',
                }}
              >
                Reset All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onTempoChange(100);
                  onKeyShiftChange(-2);
                }}
                className="text-xs"
                style={{
                  backgroundColor: 'var(--daw-control)',
                  color: 'var(--daw-text-secondary)',
                  borderColor: 'var(--daw-border)',
                }}
              >
                -2 semitones
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onTempoChange(100);
                  onKeyShiftChange(+2);
                }}
                className="text-xs"
                style={{
                  backgroundColor: 'var(--daw-control)',
                  color: 'var(--daw-text-secondary)',
                  borderColor: 'var(--daw-border)',
                }}
              >
                +2 semitones
              </Button>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
