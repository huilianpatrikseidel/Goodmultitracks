// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
import React, { useMemo } from 'react';
import { useChordAnalysis } from '../../hooks/useChordAnalysis';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

/**
 * Demonstração da análise harmônica com useChordAnalysis
 * Mostra exemplos de progressões com graus romanos, borrowed chords, e funções harmônicas
 */
export function ChordAnalysisDemo() {
  // Exemplo 1: Progressão diatônica em C Major
  const diatonicExample = useMemo(() => [
    { time: 0, chord: 'C' },
    { time: 4, chord: 'Am' },
    { time: 8, chord: 'F' },
    { time: 12, chord: 'G' },
  ], []);

  // Exemplo 2: Progressão com borrowed chords
  const borrowedExample = useMemo(() => [
    { time: 0, chord: 'C' },
    { time: 4, chord: 'Fm' },   // Borrowed de C minor
    { time: 8, chord: 'Ab' },   // Borrowed de C minor
    { time: 12, chord: 'G7' },
  ], []);

  // Exemplo 3: Progressão com acordes complexos
  const complexExample = useMemo(() => [
    { time: 0, chord: 'Cmaj7' },
    { time: 4, chord: 'Dm7' },
    { time: 8, chord: 'G7' },
    { time: 12, chord: 'Cmaj7' },
  ], []);

  const { analyzeChordMarkers, getChordStatistics, getBorrowedChords } = useChordAnalysis({
    key: 'C',
    scale: 'major',
  });

  const analyzedDiatonic = analyzeChordMarkers(diatonicExample);
  const analyzedBorrowed = analyzeChordMarkers(borrowedExample);
  const analyzedComplex = analyzeChordMarkers(complexExample);

  const borrowedChords = getBorrowedChords(analyzedBorrowed);
  const stats = getChordStatistics(analyzedBorrowed);

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Chord Analysis - Demonstração</h1>

      {/* Exemplo 1: Progressão Diatônica */}
      <Card>
        <CardHeader>
          <CardTitle>Exemplo 1: Progressão Diatônica (C Major)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Todos os acordes pertencem à escala de C maior. Observe os graus romanos e funções harmônicas.
            </p>
            <TooltipProvider>
              <div className="flex gap-4 flex-wrap">
                {analyzedDiatonic.map((chord, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="cursor-pointer hover:brightness-110 transition-all"
                          style={{
                            backgroundColor: chord.analysis?.isBorrowed ? '#f59e0b' : '#3b82f6',
                            color: '#fff',
                            fontSize: '14px',
                            fontWeight: '600',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: '1px solid rgba(0,0,0,0.2)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            whiteSpace: 'nowrap',
                            minWidth: '60px',
                            textAlign: 'center',
                          }}
                        >
                          {chord.chord}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <div className="text-xs space-y-1">
                          <div className="font-bold">{chord.chord}</div>
                          {chord.analysis && (
                            <>
                              <div>
                                <span className="text-muted-foreground">Roman:</span>{' '}
                                <span className="font-semibold">{chord.analysis.romanNumeral}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Function:</span>{' '}
                                {chord.analysis.function}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Quality:</span>{' '}
                                {chord.analysis.quality}
                              </div>
                            </>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                    
                    {/* Roman numeral */}
                    {chord.analysis && (
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: '700',
                          color: '#64748b',
                          backgroundColor: 'rgba(0,0,0,0.05)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        {chord.analysis.romanNumeral}
                      </div>
                    )}
                    
                    {/* Function badge */}
                    {chord.analysis && (
                      <Badge variant="outline" className="text-xs">
                        {chord.analysis.function}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      {/* Exemplo 2: Borrowed Chords */}
      <Card>
        <CardHeader>
          <CardTitle>Exemplo 2: Borrowed Chords (C Major com acordes emprestados)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Acordes Fm e Ab são emprestados de C minor. Note a cor laranja e o badge "borrowed".
            </p>
            <TooltipProvider>
              <div className="flex gap-4 flex-wrap">
                {analyzedBorrowed.map((chord, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="cursor-pointer hover:brightness-110 transition-all"
                          style={{
                            backgroundColor: chord.analysis?.isBorrowed ? '#f59e0b' : '#3b82f6',
                            color: '#fff',
                            fontSize: '14px',
                            fontWeight: '600',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: '1px solid rgba(0,0,0,0.2)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            whiteSpace: 'nowrap',
                            minWidth: '60px',
                            textAlign: 'center',
                          }}
                        >
                          {chord.chord}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <div className="text-xs space-y-1">
                          <div className="font-bold">{chord.chord}</div>
                          {chord.analysis && (
                            <>
                              <div>
                                <span className="text-muted-foreground">Roman:</span>{' '}
                                <span className="font-semibold">{chord.analysis.romanNumeral}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Function:</span>{' '}
                                {chord.analysis.function}
                              </div>
                              {chord.analysis.isBorrowed && (
                                <div className="text-orange-400 font-semibold">⚠ Borrowed chord</div>
                              )}
                            </>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                    
                    {/* Roman numeral */}
                    {chord.analysis && (
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: '700',
                          color: chord.analysis.isBorrowed ? '#f59e0b' : '#64748b',
                          backgroundColor: 'rgba(0,0,0,0.05)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        {chord.analysis.romanNumeral}
                      </div>
                    )}
                    
                    {/* Borrowed badge */}
                    {chord.analysis?.isBorrowed && (
                      <Badge variant="destructive" className="text-xs">
                        borrowed
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </TooltipProvider>

            {/* Statistics */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Estatísticas da Progressão:</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total de acordes:</span>{' '}
                  <span className="font-semibold">{stats.total}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Acordes diatônicos:</span>{' '}
                  <span className="font-semibold">{stats.diatonic}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Acordes emprestados:</span>{' '}
                  <span className="font-semibold text-orange-500">{stats.borrowed}</span>
                </div>
              </div>
              
              <h4 className="font-semibold mt-4 mb-2">Borrowed Chords Detectados:</h4>
              <div className="flex gap-2">
                {borrowedChords.map((chord, i) => (
                  <Badge key={i} variant="outline" className="text-orange-500">
                    {chord.chord} ({chord.analysis?.romanNumeral})
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exemplo 3: Acordes Complexos */}
      <Card>
        <CardHeader>
          <CardTitle>Exemplo 3: Acordes Complexos (7ª, 9ª, etc.)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Progressão ii-V-I com extensões. A análise funciona com acordes de 7ª, 9ª, sus, etc.
            </p>
            <TooltipProvider>
              <div className="flex gap-4 flex-wrap">
                {analyzedComplex.map((chord, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="cursor-pointer hover:brightness-110 transition-all"
                          style={{
                            backgroundColor: '#3b82f6',
                            color: '#fff',
                            fontSize: '14px',
                            fontWeight: '600',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: '1px solid rgba(0,0,0,0.2)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            whiteSpace: 'nowrap',
                            minWidth: '60px',
                            textAlign: 'center',
                          }}
                        >
                          {chord.chord}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <div className="text-xs space-y-1">
                          <div className="font-bold">{chord.chord}</div>
                          {chord.analysis && (
                            <>
                              <div>
                                <span className="text-muted-foreground">Roman:</span>{' '}
                                <span className="font-semibold">{chord.analysis.romanNumeral}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Function:</span>{' '}
                                {chord.analysis.function}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Notes:</span>{' '}
                                {chord.analysis.notes.join(', ')}
                              </div>
                            </>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                    
                    {chord.analysis && (
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: '700',
                          color: '#64748b',
                          backgroundColor: 'rgba(0,0,0,0.05)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        {chord.analysis.romanNumeral}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </TooltipProvider>
            
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm">
                <strong>💡 Dica:</strong> Esta é a famosa progressão ii-V-I do jazz. 
                O hook detecta automaticamente as extensões (maj7, 7) e mantém a análise harmônica correta.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações de uso */}
      <Card>
        <CardHeader>
          <CardTitle>Como Usar</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`import { useChordAnalysis } from '../hooks/useChordAnalysis';

const { 
  analyzeChordMarkers,
  getBorrowedChords,
  getChordStatistics 
} = useChordAnalysis({ 
  key: 'C', 
  scale: 'major' 
});

const analyzed = analyzeChordMarkers(chordMarkers);
const borrowed = getBorrowedChords(analyzed);
const stats = getChordStatistics(analyzed);`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

