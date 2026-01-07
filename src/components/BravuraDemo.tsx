import React from 'react';
import { 
  MusicNotation, 
  Accidental, 
  NoteName, 
  ChordSymbol, 
  TimeSignature,
  Clef 
} from '../components/BravuraComponents';
import { BravuraSymbols } from '../lib/bravuraUtils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

/**
 * Demonstração da fonte Bravura
 * Este componente mostra exemplos de uso dos símbolos musicais com Bravura
 */
export function BravuraDemo() {
  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Bravura Music Font - Demonstração</h1>

      {/* Acidentes */}
      <Card>
        <CardHeader>
          <CardTitle>Acidentes Musicais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Sustenido</p>
              <div className="text-4xl">
                <Accidental type="sharp" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Bemol</p>
              <div className="text-4xl">
                <Accidental type="flat" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Bequadro</p>
              <div className="text-4xl">
                <Accidental type="natural" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Dobrado Sustenido</p>
              <div className="text-4xl">
                <Accidental type="double-sharp" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Dobrado Bemol</p>
              <div className="text-4xl">
                <Accidental type="double-flat" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nomes de Notas */}
      <Card>
        <CardHeader>
          <CardTitle>Nomes de Notas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6 text-2xl">
            <NoteName note="C" />
            <NoteName note="C#" />
            <NoteName note="Db" />
            <NoteName note="D" />
            <NoteName note="D#" />
            <NoteName note="Eb" />
            <NoteName note="E" />
            <NoteName note="F" />
            <NoteName note="F#" />
            <NoteName note="Gb" />
            <NoteName note="G" />
            <NoteName note="G#" />
            <NoteName note="Ab" />
            <NoteName note="A" />
            <NoteName note="A#" />
            <NoteName note="Bb" />
            <NoteName note="B" />
          </div>
        </CardContent>
      </Card>

      {/* Símbolos de Acordes */}
      <Card>
        <CardHeader>
          <CardTitle>Símbolos de Acordes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-xl">
            <ChordSymbol chord="C" />
            <ChordSymbol chord="Cm" />
            <ChordSymbol chord="C7" />
            <ChordSymbol chord="Cmaj7" />
            <ChordSymbol chord="C#m" />
            <ChordSymbol chord="Dm7" />
            <ChordSymbol chord="F#dim" />
            <ChordSymbol chord="Gm7" />
            <ChordSymbol chord="Am9" />
            <ChordSymbol chord="Bbaug" />
            <ChordSymbol chord="Ebmaj7" />
            <ChordSymbol chord="A#sus4" />
          </div>
        </CardContent>
      </Card>

      {/* Fórmulas de Compasso */}
      <Card>
        <CardHeader>
          <CardTitle>Fórmulas de Compasso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-8 items-center">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">4/4 (Comum)</p>
              <div className="text-4xl">
                <TimeSignature numerator={4} denominator={4} />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">2/2 (Cortado)</p>
              <div className="text-4xl">
                <TimeSignature numerator={2} denominator={2} />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">3/4</p>
              <div className="text-3xl">
                <TimeSignature numerator={3} denominator={4} />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">6/8</p>
              <div className="text-3xl">
                <TimeSignature numerator={6} denominator={8} />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">7/8</p>
              <div className="text-3xl">
                <TimeSignature numerator={7} denominator={8} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claves */}
      <Card>
        <CardHeader>
          <CardTitle>Claves Musicais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-12 items-center">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Clave de Sol</p>
              <Clef type="treble" />
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Clave de Fá</p>
              <Clef type="bass" />
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Clave de Dó</p>
              <Clef type="alto" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Símbolos Diretos */}
      <Card>
        <CardHeader>
          <CardTitle>Outros Símbolos SMuFL</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Barra Simples</p>
              <span className="music-notation text-3xl">{BravuraSymbols.barlineSingle}</span>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Barra Dupla</p>
              <span className="music-notation text-3xl">{BravuraSymbols.barlineDouble}</span>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Barra Final</p>
              <span className="music-notation text-3xl">{BravuraSymbols.barlineFinal}</span>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Semibreve</p>
              <span className="music-notation text-3xl">{BravuraSymbols.noteWhole}</span>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Semínima</p>
              <span className="music-notation text-3xl">{BravuraSymbols.noteQuarterUp}</span>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Colcheia</p>
              <span className="music-notation text-3xl">{BravuraSymbols.note8thUp}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparação */}
      <Card>
        <CardHeader>
          <CardTitle>Comparação: Unicode Padrão vs Bravura</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-40 text-sm text-gray-600">Unicode Padrão:</div>
              <div className="text-2xl">C♯ D♭ E♮ F♯m7 G♭maj7</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-40 text-sm text-gray-600">Bravura (SMuFL):</div>
              <div className="text-2xl flex gap-2">
                <NoteName note="C#" />
                <NoteName note="Db" />
                <NoteName note="E" /><span className="music-notation">{BravuraSymbols.accidentalNatural}</span>
                <ChordSymbol chord="F#m7" />
                <ChordSymbol chord="Gbmaj7" />
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            A fonte Bravura oferece símbolos musicais profissionais com melhor alinhamento,
            peso e proporções otimizadas para notação musical.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
