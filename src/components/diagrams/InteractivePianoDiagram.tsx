// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
import React, { useRef, useEffect } from 'react';
import { Play } from '../icons/Icon';
import { useLanguage } from '../../lib/LanguageContext';
import { ScrollArea } from '../ui/scroll-area';
import { playChord } from '../../lib/chordPlayback';
import { Button } from '../ui/button';
import { CIRCLE_OF_FIFTHS_MAJOR } from '../../lib/musicTheory/scales';
import { areNotesEnharmonic } from '../../lib/musicTheory';

interface InteractivePianoDiagramProps {
  keys: string[];
  onChange: (keys: string[]) => void;
  keySignature?: string;
}

export function InteractivePianoDiagram({ keys, onChange, keySignature = 'C' }: InteractivePianoDiagramProps) {
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Determine if we should use flats based on key signature
  const useFlats = (CIRCLE_OF_FIFTHS_MAJOR[keySignature] || 0) < 0 || keySignature === 'F';

  // Two octaves of keys
  const sharpKeys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const flatKeys = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  
  const currentKeys = useFlats ? flatKeys : sharpKeys;
  
  const octave1Keys = currentKeys;
  const octave2Keys = currentKeys;
  const allKeys = [
    ...octave1Keys.map(k => `${k}4`),
    ...octave2Keys.map(k => `${k}5`)
  ];
  
  const blackKeys = useFlats 
    ? ['Db', 'Eb', 'Gb', 'Ab', 'Bb'] 
    : ['C#', 'D#', 'F#', 'G#', 'A#'];
    
  // Helper to check if a key is active (handling enharmonic spelling)
  const isKeyActive = (keyNote: string) => {
    return keys.some(k => k === keyNote || areNotesEnharmonic(k, keyNote));
  };

  const whiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  
  // Auto-scroll to middle C on mount
  useEffect(() => {
    if (scrollRef.current) {
      // Scroll to show middle C (around octave 4)
      scrollRef.current.scrollLeft = 200;
    }
  }, []);
  
  const handleKeyClick = (key: string) => {
    // Play the note immediately for auditive feedback
    playChord([getKeyName(key)], 0.5);

    const newKeys = [...keys];
    const index = newKeys.indexOf(key);
    
    if (index > -1) {
      newKeys.splice(index, 1);
    } else {
      newKeys.push(key);
    }
    
    onChange(newKeys);
  };

  const handleKeyDown = (e: React.KeyboardEvent, key: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleKeyClick(key);
    }
  };

  const getKeyName = (fullKey: string): string => {
    return fullKey.replace(/[0-9]/g, '');
  };

  const isBlackKey = (keyName: string): boolean => {
    return keyName.includes('#') || keyName.includes('b');
  };

  const isCKey = (fullKey: string): boolean => {
    return fullKey.startsWith('C') && !fullKey.includes('#') && !fullKey.includes('b');
  };

  const handlePlayChord = () => {
    // Remove octave numbers for playChord function
    const noteNames = keys.map(key => getKeyName(key));
    playChord(noteNames);
  };

  return (
    <div className="flex flex-col items-center space-y-4 w-full">
      <div className="flex items-center gap-3">
        <p className="text-sm text-muted-foreground">
          {t.clickPianoKeys}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePlayChord}
          className="gap-2"
          disabled={keys.length === 0}
        >
          <Play className="w-4 h-4" />
          Play
        </Button>
      </div>
      
      <div className="w-full max-w-full overflow-x-auto border rounded-lg bg-muted/30 p-4" ref={scrollRef}>
        <svg 
          width="860" 
          height="200" 
          viewBox="0 0 860 200" 
          className="min-w-[860px]"
          role="img"
          aria-label="Interactive piano keyboard diagram"
        >
          {/* White keys with C markers */}
          {allKeys.filter(k => !isBlackKey(getKeyName(k))).map((fullKey, i) => {
            const x = 20 + i * 56;
            const isActive = isKeyActive(fullKey);
            const isC = isCKey(fullKey);
            
            return (
              <g key={`white-${fullKey}`}>
                <rect
                  x={x}
                  y="20"
                  width="54"
                  height="150"
                  fill={isActive ? 'hsl(var(--primary))' : 'hsl(var(--background))'}
                  stroke={isC ? 'hsl(var(--destructive))' : 'hsl(var(--border))'}
                  strokeWidth={isC ? '3' : '2'}
                  rx="4"
                  cursor="pointer"
                  onClick={() => handleKeyClick(fullKey)}
                  onKeyDown={(e) => handleKeyDown(e, fullKey)}
                  role="button"
                  aria-label={`${getKeyName(fullKey)} key${isActive ? ' (selected)' : ''}`}
                  tabIndex={0}
                />
                {/* C marker dot */}
                {isC && (
                  <circle
                    cx={x + 27}
                    cy="155"
                    r="4"
                    fill={isActive ? 'hsl(var(--primary-foreground))' : 'hsl(var(--destructive))'}
                  />
                )}
                <text
                  x={x + 27}
                  y="140"
                  fontSize="12"
                  fill={isActive ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))'}
                  textAnchor="middle"
                  cursor="pointer"
                  onClick={() => handleKeyClick(fullKey)}
                  style={{ userSelect: 'none' }}
                >
                  {getKeyName(fullKey)}
                </text>
              </g>
            );
          })}
          
          {/* Black keys */}
          {allKeys.filter(k => isBlackKey(getKeyName(k))).map((fullKey) => {
            const keyName = getKeyName(fullKey);
            const octave = fullKey.replace(/[^0-9]/g, '');
            const octaveIndex = parseInt(octave) - 4;
            // Calculate baseKeyIndex carefully with flats/sharps
            // Normalize for index finding if needed, but blackKeys array matches currentKeys mode
            let whiteKeyOffset = 0;
            
            // Map note names to white key offset (C=0, D=1, E=2, F=3, G=4, A=5, B=6)
            // Black keys: C#/Db(0), D#/Eb(1), F#/Gb(3), G#/Ab(4), A#/Bb(5)
            if (keyName === 'C#' || keyName === 'Db') whiteKeyOffset = 0;
            else if (keyName === 'D#' || keyName === 'Eb') whiteKeyOffset = 1;
            else if (keyName === 'F#' || keyName === 'Gb') whiteKeyOffset = 3;
            else if (keyName === 'G#' || keyName === 'Ab') whiteKeyOffset = 4;
            else if (keyName === 'A#' || keyName === 'Bb') whiteKeyOffset = 5;
            
            const totalWhiteKeyIndex = octaveIndex * 7 + whiteKeyOffset;
            const x = 20 + totalWhiteKeyIndex * 56 + 40;
            const isActive = isKeyActive(fullKey);
            
            return (
              <rect
                key={`black-${fullKey}`}
                x={x}
                y="20"
                width="28"
                height="95"
                fill={isActive ? 'hsl(var(--primary))' : 'hsl(var(--foreground))'}
                stroke="hsl(var(--border))"
                strokeWidth="2"
                role="button"
                aria-label={`${keyName} key${isActive ? ' (selected)' : ''}`}
                tabIndex={0}
                rx="3"
                cursor="pointer"
                onKeyDown={(e) => handleKeyDown(e, fullKey)}
                onClick={() => handleKeyClick(fullKey)}
              />
            );
          })}
        </svg>
      </div>
      
      <div className="text-xs text-muted-foreground space-y-1 text-center max-w-md">
        <p><strong>{t.selectedNotes}</strong> {keys.length > 0 ? keys.join(', ') : t.none}</p>
        <p className="opacity-70">{t.clickToToggle}</p>
        <p className="opacity-70 italic">Red markers indicate C notes • Scroll horizontally to view all keys</p>
      </div>
    </div>
  );
}

