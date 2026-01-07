// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
import React from 'react';
import { X, Play } from './icons/Icon';
import { useLanguage } from '../lib/LanguageContext';
import { playGuitarChord } from '../lib/chordPlayback';
import { Button } from './ui/button';

interface InteractiveGuitarDiagramProps {
  frets: number[];
  fingers: number[];
  startFret?: number;
  onChange: (frets: number[], fingers: number[]) => void;
}

export function InteractiveGuitarDiagram({ frets, fingers, startFret = 1, onChange }: InteractiveGuitarDiagramProps) {
  const { t } = useLanguage();
  const strings = ['E', 'A', 'D', 'G', 'B', 'e'];
  const numFrets = 5;
  
  // Handle clicking on a fret position
  const handleFretClick = (stringIndex: number, relativeFret: number) => {
    const newFrets = [...frets];
    const newFingers = [...fingers];
    
    // Convert relative fret to actual fret number
    const actualFret = relativeFret === 0 ? 0 : relativeFret + startFret - 1;
    
    // If clicking the same fret, clear it
    if (newFrets[stringIndex] === actualFret) {
      newFrets[stringIndex] = 0; // Set to open
      newFingers[stringIndex] = 0;
    } else {
      newFrets[stringIndex] = actualFret;
      // Play the note for auditory feedback
      const singleStringChord = [-1, -1, -1, -1, -1, -1];
      singleStringChord[stringIndex] = actualFret;
      playGuitarChord(singleStringChord, 0.5);

      // Auto-assign finger number (simple logic)
      if (actualFret > 0) {
        newFingers[stringIndex] = Math.min(4, relativeFret);
      } else {
        newFingers[stringIndex] = 0;
      }
    }
    
    onChange(newFrets, newFingers);
  };
  
  // Handle clicking string label to toggle mute
  const handleStringLabelClick = (stringIndex: number) => {
    const newFrets = [...frets];
    const newFingers = [...fingers];
    
    // Toggle between muted (-1) and open (0)
    if (newFrets[stringIndex] === -1) {
      newFrets[stringIndex] = 0;
      newFingers[stringIndex] = 0;
    } else {
      newFrets[stringIndex] = -1;
      newFingers[stringIndex] = 0;
    }
    
    onChange(newFrets, newFingers);
  };

  const handlePlayChord = () => {
    playGuitarChord(frets);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex items-center gap-3">
        <p className="text-sm text-muted-foreground">
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
      
      <svg 
        width="240" 
        height="320" 
        viewBox="0 0 240 320" 
        className="border rounded-lg bg-card"
        role="img"
        aria-label="Interactive guitar fretboard diagram"
      >
        {/* Fretboard horizontal lines */}
        {[...Array(numFrets)].map((_, i) => (
          <line
            key={`fret-${i}`}
            x1="50"
            y1={70 + i * 40}
            x2="210"
            y2={70 + i * 40}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={i === 0 ? "4" : "2"}
          />
        ))}
        
        {/* Strings (vertical lines) */}
        {[...Array(6)].map((_, i) => (
          <line
            key={`string-${i}`}
            x1={50 + i * 32}
            y1="70"
            x2={50 + i * 32}
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
        
        {/* String labels (clickable for mute) */}
        {strings.map((str, i) => {
          const x = 50 + i * 32;
          const isMuted = frets[i] === -1;
          
          return (
            <g key={`label-${i}`}>
              <rect
                x={x - 12}
                y="260"
                width="24"
                height="24"
                fill="transparent"
                cursor="pointer"
                onClick={() => handleStringLabelClick(i)}
                role="button"
                aria-label={`${str} string${isMuted ? ' (muted)' : ' (open)'}`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleStringLabelClick(i);
                  }
                }}
              />
              <text
                x={x}
                y="275"
                fontSize="14"
                fill={isMuted ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))'}
                textAnchor="middle"
                cursor="pointer"
                onClick={() => handleStringLabelClick(i)}
                style={{ userSelect: 'none' }}
              >
                {str}
              </text>
            </g>
          );
        })}
        
        {/* Fret markers and muted/open indicators */}
        {frets.map((fret, stringIndex) => {
          const x = 50 + stringIndex * 32;
          
          if (fret === -1) {
            // Muted string - X above nut
            return (
              <g key={`marker-${stringIndex}`}>
                <circle cx={x} cy="45" r="9" fill="hsl(var(--destructive))" />
                <line x1={x - 4} y1="41" x2={x + 4} y2="49" stroke="hsl(var(--destructive-foreground))" strokeWidth="2" />
                <line x1={x + 4} y1="41" x2={x - 4} y2="49" stroke="hsl(var(--destructive-foreground))" strokeWidth="2" />
              </g>
            );
          } else if (fret === 0) {
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
        {[...Array(6)].map((_, stringIndex) => (
          [...Array(numFrets)].map((_, fretIndex) => {
            const x = 50 + stringIndex * 32;
            const y = 70 + fretIndex * 40;
            const fretNumber = fretIndex + 1;
            
            return (
              <rect
                key={`click-${stringIndex}-${fretIndex}`}
                x={x - 16}
                y={y - 20}
                width="32"
                height="40"
                fill="transparent"
                cursor="pointer"
                onClick={() => handleFretClick(stringIndex, fretNumber)}
              />
            );
          })
        ))}
        
        {/* Open string clickable zones */}
        {[...Array(6)].map((_, stringIndex) => {
          const x = 50 + stringIndex * 32;
          
          return (
            <rect
              key={`open-${stringIndex}`}
              x={x - 16}
              y="30"
              width="32"
              height="30"
              fill="transparent"
              cursor="pointer"
              onClick={() => handleFretClick(stringIndex, 0)}
            />
          );
        })}
      </svg>
      
      <div className="text-xs text-gray-500 space-y-1 text-center max-w-xs">
        <p>• {t.greenCircles}</p>
        <p>• {t.redCircles}</p>
        <p>• {t.blueDots}</p>
      </div>
    </div>
  );
}

