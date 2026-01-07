// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
import React from 'react';
import { Play } from '../icons/Icon';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { playChord, playGuitarChord, playUkuleleChord } from '../../lib/chordPlayback';
import { useChordVoicing } from '../../hooks/useChordVoicing';

interface ChordDiagramProps {
  chord: string;
  isOpen: boolean;
  onClose: () => void;
  customDiagram?: {
    guitar: { frets: number[]; fingers: number[]; startFret?: number };
    ukulele: { frets: number[]; fingers: number[]; startFret?: number };
    piano: { keys: string[] };
    capo?: number;
  };
}







const GuitarDiagram: React.FC<{ chord: string; customData?: { frets: number[]; fingers: number[]; startFret?: number } }> = ({ chord, customData }) => {
  const voicing = useChordVoicing(chord, 'guitar');
  
  // Use custom data if provided, otherwise use generated voicing
  const { frets, fingers, startFret = 1 } = customData || voicing?.guitar || { frets: [0, 0, 0, 0, 0, 0], fingers: [0, 0, 0, 0, 0, 0] };
  const displayFret = startFret;
  
  if (!voicing && !customData) {
    return <div className="text-gray-400">Chord diagram not available</div>;
  }
  const strings = ['E', 'A', 'D', 'G', 'B', 'e'];

  const handlePlay = () => {
    playGuitarChord(frets);
  };

  return (
    <div className="flex flex-col items-center">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePlay}
        className="mb-3 gap-2"
      >
        <Play className="w-4 h-4" />
        Play Chord
      </Button>
      <svg width="200" height="280" viewBox="0 0 200 280" className="mb-2">
        {/* Fretboard */}
        {[...Array(5)].map((_, i) => (
          <line
            key={`fret-${i}`}
            x1="40"
            y1={60 + i * 40}
            x2="160"
            y2={60 + i * 40}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={i === 0 && displayFret === 1 ? "4" : "2"}
          />
        ))}
        {/* Strings */}
        {[...Array(6)].map((_, i) => (
          <line
            key={`string-${i}`}
            x1={40 + i * 24}
            y1="60"
            x2={40 + i * 24}
            y2="220"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="2"
          />
        ))}
        {/* Base fret number */}
        {displayFret > 1 && (
          <text x="20" y="65" fontSize="14" fill="hsl(var(--muted-foreground))">
            {displayFret}fr
          </text>
        )}
        {/* String labels */}
        {strings.map((str, i) => (
          <text
            key={`label-${i}`}
            x={40 + i * 24}
            y="250"
            fontSize="12"
            fill="hsl(var(--muted-foreground))"
            textAnchor="middle"
          >
            {str}
          </text>
        ))}
        {/* Fret markers and muted/open indicators */}
        {frets.map((fret, i) => {
          const x = 40 + i * 24;
          if (fret === -1) {
            // Muted string
            return (
              <g key={`marker-${i}`}>
                <line x1={x - 4} y1="36" x2={x + 4} y2="44" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />
                <line x1={x + 4} y1="36" x2={x - 4} y2="44" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />
              </g>
            );
          } else if (fret === 0) {
            // Open string
            return (
              <circle key={`marker-${i}`} cx={x} cy="40" r="6" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />
            );
          } else {
            // Fretted note - convert to relative position for display
            const relativeFret = fret - displayFret + 1;
            if (relativeFret >= 1 && relativeFret <= 5) {
              const y = 60 + (relativeFret - 0.5) * 40;
              const finger = fingers?.[i];
              return (
                <g key={`marker-${i}`}>
                  <circle cx={x} cy={y} r="10" fill="hsl(var(--primary))" />
                  {finger && finger > 0 && (
                    <text x={x} y={y + 4} fontSize="12" fill="hsl(var(--primary-foreground))" textAnchor="middle">
                      {finger}
                    </text>
                  )}
                </g>
              );
            }
            return null;
          }
        })}
      </svg>
      <div className="text-sm text-gray-600 space-y-1">
        <div>Finger positions: {fingers?.filter(f => f > 0).join(', ') || 'N/A'}</div>
        {voicing && (
          <Badge variant={voicing.source === 'database' ? 'default' : 'secondary'}>
            {voicing.source === 'database' ? 'Database' : 'Generated'}
          </Badge>
        )}
      </div>
    </div>
  );
};

const PianoDiagram: React.FC<{ chord: string; customData?: { keys: string[] } }> = ({ chord, customData }) => {
  const voicing = useChordVoicing(chord, 'piano');
  
  // Use custom data if provided, otherwise use generated voicing
  const { keys } = customData || voicing?.piano || { keys: ['C', 'E', 'G'] };
  
  if (!voicing && !customData) {
    return <div className="text-gray-400">Chord diagram not available</div>;
  }
  const allKeys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const blackKeys = ['C#', 'D#', 'F#', 'G#', 'A#'];

  const handlePlay = () => {
    playChord(keys);
  };

  return (
    <div className="flex flex-col items-center">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePlay}
        className="mb-3 gap-2"
      >
        <Play className="w-4 h-4" />
        Play Chord
      </Button>
      <svg width="400" height="180" viewBox="0 0 400 180" className="mb-2">
        {/* White keys */}
        {allKeys.filter(k => !blackKeys.includes(k)).map((key, i) => {
          const x = 20 + i * 50;
          const isActive = keys.includes(key);
          return (
            <rect
              key={`white-${key}`}
              x={x}
              y="20"
              width="48"
              height="140"
              fill={isActive ? 'hsl(var(--primary))' : 'hsl(var(--background))'}
              stroke="hsl(var(--border))"
              strokeWidth="2"
              rx="4"
            />
          );
        })}
        {/* Black keys */}
        {allKeys.filter(k => blackKeys.includes(k)).map((key) => {
          const whiteKeyIndex = allKeys.indexOf(key) - Math.floor((allKeys.indexOf(key) + 1) / 2);
          const x = 20 + whiteKeyIndex * 50 + 35;
          const isActive = keys.includes(key);
          return (
            <rect
              key={`black-${key}`}
              x={x}
              y="20"
              width="26"
              height="90"
              fill={isActive ? 'hsl(var(--primary))' : 'hsl(var(--foreground))'}
              stroke="hsl(var(--border))"
              strokeWidth="2"
              rx="3"
            />
          );
        })}
        {/* Key labels */}
        {allKeys.filter(k => !blackKeys.includes(k)).map((key, i) => {
          const x = 20 + i * 50 + 24;
          return (
            <text
              key={`label-${key}`}
              x={x}
              y="150"
              fontSize="14"
              fill={keys.includes(key) ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))'}
              textAnchor="middle"
            >
              {key}
            </text>
          );
        })}
      </svg>
      <div className="text-sm text-muted-foreground space-y-1">
        <div>Notes: {keys.join(' - ')}</div>
        {voicing && (
          <Badge variant={voicing.source === 'database' ? 'default' : 'secondary'}>
            {voicing.source === 'database' ? 'Database' : 'Generated'}
          </Badge>
        )}
      </div>
    </div>
  );
};

const UkuleleDiagram: React.FC<{ chord: string; customData?: { frets: number[]; fingers: number[]; startFret?: number } }> = ({ chord, customData }) => {
  const voicing = useChordVoicing(chord, 'ukulele');
  
  // Use custom data if provided, otherwise use generated voicing
  const { frets, fingers, startFret = 1 } = customData || voicing?.ukulele || { frets: [0, 0, 0, 0], fingers: [0, 0, 0, 0] };
  
  if (!voicing && !customData) {
    return <div className="text-gray-400">Chord diagram not available</div>;
  }
  const strings = ['G', 'C', 'E', 'A'];

  const handlePlay = () => {
    playUkuleleChord(frets);
  };

  return (
    <div className="flex flex-col items-center">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePlay}
        className="mb-3 gap-2"
      >
        <Play className="w-4 h-4" />
        Play Chord
      </Button>
      <svg width="160" height="280" viewBox="0 0 160 280" className="mb-2">
        {/* Fretboard */}
        {[...Array(5)].map((_, i) => (
          <line
            key={`fret-${i}`}
            x1="40"
            y1={60 + i * 40}
            x2="136"
            y2={60 + i * 40}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={i === 0 && startFret === 1 ? "4" : "2"}
          />
        ))}
        {/* Strings */}
        {[...Array(4)].map((_, i) => (
          <line
            key={`string-${i}`}
            x1={40 + i * 32}
            y1="60"
            x2={40 + i * 32}
            y2="220"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="2"
          />
        ))}
        {/* Fret number indicator when startFret > 1 */}
        {startFret > 1 && (
          <text x="20" y="65" fontSize="14" fill="hsl(var(--muted-foreground))">
            {startFret}fr
          </text>
        )}
        {/* String labels */}
        {strings.map((str, i) => (
          <text
            key={`label-${i}`}
            x={40 + i * 32}
            y="250"
            fontSize="12"
            fill="hsl(var(--muted-foreground))"
            textAnchor="middle"
          >
            {str}
          </text>
        ))}
        {/* Fret markers */}
        {frets.map((fret, i) => {
          const x = 40 + i * 32;
          if (fret === 0) {
            // Open string
            return (
              <circle key={`marker-${i}`} cx={x} cy="40" r="6" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />
            );
          } else {
            // Fretted note - convert to relative position for display
            const relativeFret = fret - startFret + 1;
            if (relativeFret >= 1 && relativeFret <= 5) {
              const y = 60 + (relativeFret - 0.5) * 40;
              const finger = fingers?.[i];
              return (
                <g key={`marker-${i}`}>
                  <circle cx={x} cy={y} r="10" fill="hsl(var(--primary))" />
                  {finger && finger > 0 && (
                    <text x={x} y={y + 4} fontSize="12" fill="hsl(var(--primary-foreground))" textAnchor="middle">
                      {finger}
                    </text>
                  )}
                </g>
              );
            }
            return null;
          }
        })}
      </svg>
      <div className="text-sm text-gray-600 space-y-1">
        <div>Finger positions: {fingers?.filter(f => f > 0).join(', ') || 'N/A'}</div>
        {voicing && (
          <Badge variant={voicing.source === 'database' ? 'default' : 'secondary'}>
            {voicing.source === 'database' ? 'Database' : 'Generated'}
          </Badge>
        )}
      </div>
    </div>
  );
};

export function ChordDiagram({ chord, isOpen, onClose, customDiagram }: ChordDiagramProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {chord} Chord
            {customDiagram?.capo && customDiagram.capo > 0 && (
              <span className="ml-3 text-lg text-orange-600">Capo {customDiagram.capo}</span>
            )}
          </DialogTitle>
          <DialogDescription>
            View chord diagrams for guitar, piano, and ukulele
            {customDiagram && <span className="ml-2 text-yellow-600">(Custom)</span>}
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="guitar" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="guitar">Guitar</TabsTrigger>
            <TabsTrigger value="piano">Piano</TabsTrigger>
            <TabsTrigger value="ukulele">Ukulele</TabsTrigger>
          </TabsList>
          <TabsContent value="guitar" className="mt-6 min-h-[320px] flex flex-col items-center justify-center">
            <GuitarDiagram chord={chord} customData={customDiagram?.guitar} />
          </TabsContent>
          <TabsContent value="piano" className="mt-6 min-h-[320px] flex flex-col items-center justify-center">
            <PianoDiagram chord={chord} customData={customDiagram?.piano} />
          </TabsContent>
          <TabsContent value="ukulele" className="mt-6 min-h-[320px] flex flex-col items-center justify-center">
            <UkuleleDiagram chord={chord} customData={customDiagram?.ukulele} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

