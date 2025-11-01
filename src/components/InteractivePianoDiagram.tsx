import React, { useRef, useEffect } from 'react';
import { Play } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { ScrollArea } from './ui/scroll-area';
import { playChord } from '../lib/chordPlayback';
import { Button } from './ui/button';

interface InteractivePianoDiagramProps {
  keys: string[];
  onChange: (keys: string[]) => void;
}

export function InteractivePianoDiagram({ keys, onChange }: InteractivePianoDiagramProps) {
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Two octaves of keys
  const octave1Keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave2Keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const allKeys = [
    ...octave1Keys.map(k => `${k}4`),
    ...octave2Keys.map(k => `${k}5`)
  ];
  
  const blackKeys = ['C#', 'D#', 'F#', 'G#', 'A#'];
  const whiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  
  // Auto-scroll to middle C on mount
  useEffect(() => {
    if (scrollRef.current) {
      // Scroll to show middle C (around octave 4)
      scrollRef.current.scrollLeft = 200;
    }
  }, []);
  
  const handleKeyClick = (key: string) => {
    const newKeys = [...keys];
    const index = newKeys.indexOf(key);
    
    if (index > -1) {
      newKeys.splice(index, 1);
    } else {
      newKeys.push(key);
    }
    
    onChange(newKeys);
  };

  const getKeyName = (fullKey: string): string => {
    return fullKey.replace(/[0-9]/g, '');
  };

  const isBlackKey = (keyName: string): boolean => {
    return keyName.includes('#');
  };

  const isCKey = (fullKey: string): boolean => {
    return fullKey.startsWith('C');
  };

  const handlePlayChord = () => {
    // Remove octave numbers for playChord function
    const noteNames = keys.map(key => getKeyName(key));
    playChord(noteNames);
  };

  return (
    <div className="flex flex-col items-center space-y-4 w-full">
      <div className="flex items-center gap-3">
        <p className="text-sm text-gray-600">
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
      
      <div className="w-full max-w-full overflow-x-auto border rounded-lg bg-gray-100 p-4" ref={scrollRef}>
        <svg width="860" height="200" viewBox="0 0 860 200" className="min-w-[860px]">
          {/* White keys with C markers */}
          {allKeys.filter(k => !isBlackKey(getKeyName(k))).map((fullKey, i) => {
            const x = 20 + i * 56;
            const isActive = keys.includes(fullKey);
            const isC = isCKey(fullKey);
            
            return (
              <g key={`white-${fullKey}`}>
                <rect
                  x={x}
                  y="20"
                  width="54"
                  height="150"
                  fill={isActive ? '#2563eb' : 'white'}
                  stroke={isC ? '#dc2626' : '#333'}
                  strokeWidth={isC ? '3' : '2'}
                  rx="4"
                  cursor="pointer"
                  onClick={() => handleKeyClick(fullKey)}
                />
                {/* C marker dot */}
                {isC && (
                  <circle
                    cx={x + 27}
                    cy="155"
                    r="4"
                    fill={isActive ? 'white' : '#dc2626'}
                  />
                )}
                <text
                  x={x + 27}
                  y="140"
                  fontSize="12"
                  fill={isActive ? 'white' : '#666'}
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
            const baseKeyIndex = blackKeys.indexOf(keyName);
            
            // Calculate position based on octave and black key pattern
            let whiteKeyOffset = 0;
            if (keyName === 'C#') whiteKeyOffset = 0;
            else if (keyName === 'D#') whiteKeyOffset = 1;
            else if (keyName === 'F#') whiteKeyOffset = 3;
            else if (keyName === 'G#') whiteKeyOffset = 4;
            else if (keyName === 'A#') whiteKeyOffset = 5;
            
            const totalWhiteKeyIndex = octaveIndex * 7 + whiteKeyOffset;
            const x = 20 + totalWhiteKeyIndex * 56 + 40;
            const isActive = keys.includes(fullKey);
            
            return (
              <rect
                key={`black-${fullKey}`}
                x={x}
                y="20"
                width="28"
                height="95"
                fill={isActive ? '#1e40af' : '#333'}
                stroke="#000"
                strokeWidth="2"
                rx="3"
                cursor="pointer"
                onClick={() => handleKeyClick(fullKey)}
              />
            );
          })}
        </svg>
      </div>
      
      <div className="text-xs text-gray-500 space-y-1 text-center max-w-md">
        <p><strong>{t.selectedNotes}</strong> {keys.length > 0 ? keys.join(', ') : t.none}</p>
        <p className="text-gray-400">{t.clickToToggle}</p>
        <p className="text-gray-400 italic">Red markers indicate C notes • Scroll horizontally to view all keys</p>
      </div>
    </div>
  );
}
