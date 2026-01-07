// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
import React from 'react';
import { Play } from '../icons/Icon';
import { useLanguage } from '../../lib/LanguageContext';
import { playUkuleleChord } from '../../lib/chordPlayback';
import { Button } from '../ui/button';

interface InteractiveUkuleleDiagramProps {
  frets: number[];
  fingers: number[];
  startFret?: number;
  onChange: (frets: number[], fingers: number[]) => void;
}

export function InteractiveUkuleleDiagram({ frets, fingers, startFret = 1, onChange }: InteractiveUkuleleDiagramProps) {
  const { t } = useLanguage();
  const strings = ['G', 'C', 'E', 'A'];
  const numFrets = 5;
  
  // Handle clicking on a fret position
  const handleFretClick = (stringIndex: number, relativeFret: number) => {
    const newFrets = [...frets];
    const newFingers = [...fingers];
    
    // Convert relative fret to actual fret number
    const actualFret = relativeFret === 0 ? 0 : relativeFret + startFret - 1;
    
    // If clicking the same fret, clear it to open
    if (newFrets[stringIndex] === actualFret) {
      newFrets[stringIndex] = 0;
      newFingers[stringIndex] = 0;
    } else {
      newFrets[stringIndex] = actualFret;
      // Play note
      const singleStringChord = [-1, -1, -1, -1];
      singleStringChord[stringIndex] = actualFret;
      playUkuleleChord(singleStringChord, 0.5);

      // Auto-assign finger number
      if (actualFret > 0) {
        newFingers[stringIndex] = Math.min(4, relativeFret);
      } else {
        newFingers[stringIndex] = 0;
      }
    }
    
    onChange(newFrets, newFingers);
  };

  const handlePlayChord = () => {
    playUkuleleChord(frets);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex items-center gap-3">
        <p className="text-sm text-gray-600">
          {t.clickFretsToPlace}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePlayChord}
          className="gap-2"
        >
          <Play className="w-4 h-4" />
          Play
        </Button>
      </div>
      
      <svg width="200" height="320" viewBox="0 0 200 320" className="border rounded-lg bg-card">
        {/* Fretboard horizontal lines */}
        {[...Array(numFrets)].map((_, i) => (
          <line
            key={`fret-${i}`}
            x1="50"
            y1={70 + i * 40}
            x2="170"
            y2={70 + i * 40}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={i === 0 ? "4" : "2"}
          />
        ))}
        
        {/* Strings (vertical lines) */}
        {[...Array(4)].map((_, i) => (
          <line
            key={`string-${i}`}
            x1={50 + i * 40}
            y1="70"
            x2={50 + i * 40}
            y2="230"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="2"
          />
        ))}
        
        {/* Fret number indicator when startFret > 1 */}
        {startFret > 1 && (
          <text
            x="25"
            y="90"
            fontSize="14"
            fill="hsl(var(--foreground))"
            textAnchor="middle"
            fontWeight="600"
          >
            {startFret}fr
          </text>
        )}
        
        {/* String labels */}
        {strings.map((str, i) => {
          const x = 50 + i * 40;
          
          return (
            <text
              key={`label-${i}`}
              x={x}
              y="275"
              fontSize="14"
              fill="hsl(var(--foreground))"
              textAnchor="middle"
              style={{ userSelect: 'none' }}
            >
              {str}
            </text>
          );
        })}
        
        {/* Fret markers */}
        {frets.map((fret, stringIndex) => {
          const x = 50 + stringIndex * 40;
          
          if (fret === 0) {
            // Open string - circle above nut
            return (
              <circle 
                key={`marker-${stringIndex}`} 
                cx={x} 
                cy="45" 
                r="7" 
                fill="none" 
                stroke="#22c55e" 
                strokeWidth="2.5" 
              />
            );
          } else {
            // Fretted note - convert to relative position
            const relativeFret = fret - startFret + 1;
            if (relativeFret >= 1 && relativeFret <= numFrets) {
              const y = 70 + (relativeFret - 0.5) * 40;
              const finger = fingers[stringIndex];
              
              return (
                <g key={`marker-${stringIndex}`}>
                  <circle cx={x} cy={y} r="11" fill="hsl(var(--primary))" />
                  {finger > 0 && (
                    <text 
                      x={x} 
                      y={y + 5} 
                      fontSize="13" 
                      fill="hsl(var(--primary-foreground))" 
                      textAnchor="middle"
                      fontWeight="600"
                    >
                      {finger}
                    </text>
                  )}
                </g>
              );
            }
            return null;
          }
        })}
        
        {/* Clickable zones for each fret position */}
        {[...Array(4)].map((_, stringIndex) => (
          [...Array(numFrets)].map((_, fretIndex) => {
            const x = 50 + stringIndex * 40;
            const y = 70 + fretIndex * 40;
            const fretNumber = fretIndex + 1;
            
            return (
              <rect
                key={`click-${stringIndex}-${fretIndex}`}
                x={x - 20}
                y={y - 20}
                width="40"
                height="40"
                fill="transparent"
                cursor="pointer"
                onClick={() => handleFretClick(stringIndex, fretNumber)}
              />
            );
          })
        ))}
        
        {/* Open string clickable zones */}
        {[...Array(4)].map((_, stringIndex) => {
          const x = 50 + stringIndex * 40;
          
          return (
            <rect
              key={`open-${stringIndex}`}
              x={x - 20}
              y="30"
              width="40"
              height="30"
              fill="transparent"
              cursor="pointer"
              onClick={() => handleFretClick(stringIndex, 0)}
            />
          );
        })}
      </svg>
      
      <div className="text-xs text-gray-500 text-center max-w-xs">
        <p>• {t.blueDotsFingers}</p>
      </div>
    </div>
  );
}

