// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
/**
 * ============================================================================
 * BRAVURA MUSIC NOTATION - React Components
 * ============================================================================
 * React components for displaying music notation with the Bravura font.
 */

import React from 'react';
import { BravuraSymbols, formatNoteWithBravura, formatChordWithBravura } from '../../lib/bravuraUtils';

interface MusicNotationProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrapper component that applies Bravura font to its children
 */
export const MusicNotation: React.FC<MusicNotationProps> = ({ children, className = '' }) => {
  return (
    <span className={`music-notation ${className}`}>
      {children}
    </span>
  );
};

interface AccidentalProps {
  type: 'sharp' | 'flat' | 'natural' | 'double-sharp' | 'double-flat';
  className?: string;
}

/**
 * Component for displaying musical accidentals
 */
export const Accidental: React.FC<AccidentalProps> = ({ type, className = '' }) => {
  const symbols = {
    'sharp': BravuraSymbols.accidentalSharp,
    'flat': BravuraSymbols.accidentalFlat,
    'natural': BravuraSymbols.accidentalNatural,
    'double-sharp': BravuraSymbols.accidentalDoubleSharp,
    'double-flat': BravuraSymbols.accidentalDoubleFlat,
  };

  return (
    <span className={`music-notation ${className}`}>
      {symbols[type]}
    </span>
  );
};

interface NoteNameProps {
  note: string;
  className?: string;
}

/**
 * Component for displaying note names with proper accidental formatting
 * @example <NoteName note="C#" /> renders "C" with a Bravura sharp
 */
export const NoteName: React.FC<NoteNameProps> = ({ note, className = '' }) => {
  const { note: noteName, accidental } = formatNoteWithBravura(note);
  
  return (
    <span className={className}>
      {noteName}
      {accidental && <span className="music-notation">{accidental}</span>}
    </span>
  );
};

interface ChordSymbolProps {
  chord: string;
  className?: string;
}

/**
 * Component for displaying chord symbols with proper accidental formatting
 * @example <ChordSymbol chord="C#m7" /> renders "C" with sharp + "m7"
 */
export const ChordSymbol: React.FC<ChordSymbolProps> = ({ chord, className = '' }) => {
  const { root, accidental, quality } = formatChordWithBravura(chord);
  
  return (
    <span className={className}>
      {root}
      {accidental && <span className="music-notation">{accidental}</span>}
      {quality}
    </span>
  );
};

interface TimeSignatureProps {
  numerator: number;
  denominator: number;
  className?: string;
}

/**
 * Component for displaying time signatures with Bravura font
 */
export const TimeSignature: React.FC<TimeSignatureProps> = ({ 
  numerator, 
  denominator, 
  className = '' 
}) => {
  // Use special symbols for common time (4/4) and cut time (2/2)
  if (numerator === 4 && denominator === 4) {
    return (
      <span className={`music-notation time-signature ${className}`}>
        {BravuraSymbols.timeSigCommon}
      </span>
    );
  }
  
  if (numerator === 2 && denominator === 2) {
    return (
      <span className={`music-notation time-signature ${className}`}>
        {BravuraSymbols.timeSigCutCommon}
      </span>
    );
  }

  // For other time signatures, display numerator over denominator
  return (
    <span className={`time-signature ${className}`}>
      <span className="block text-center leading-none">{numerator}</span>
      <span className="block text-center leading-none">{denominator}</span>
    </span>
  );
};

interface ClefProps {
  type: 'treble' | 'bass' | 'alto';
  className?: string;
}

/**
 * Component for displaying musical clefs
 */
export const Clef: React.FC<ClefProps> = ({ type, className = '' }) => {
  const clefs = {
    'treble': BravuraSymbols.gClef,
    'bass': BravuraSymbols.fClef,
    'alto': BravuraSymbols.cClef,
  };

  return (
    <span className={`music-notation ${className}`} style={{ fontSize: '2em' }}>
      {clefs[type]}
    </span>
  );
};

