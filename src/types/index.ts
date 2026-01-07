// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
export const TRACK_TAG_HIERARCHY = {
  drums: ['drums'],
  percussion: ['percussion', 'cajon'],
  bass: ['bass'],
  guitar: ['acoustic-guitar', 'electric-guitar'],
  keys: ['keys', 'keyboard-piano'],
  vocals: ['vocals-general', 'lead-vocal', 'backing-vocals'],
  orchestral: [],
  loops: [],
  click: [],
  guide: [],
  piano: [],
  other: ['other-elements'],
} as const;

type AllTagsArray = typeof TRACK_TAG_HIERARCHY[keyof typeof TRACK_TAG_HIERARCHY];
export type TrackTag = AllTagsArray[number];

export interface AudioTrack {
  id: string;
  name: string;
  type: 'drums' | 'bass' | 'guitar' | 'keys' | 'vocals' | 'click' | 'guide' | 'other';
  volume: number;
  muted: boolean;
  solo: boolean;
  waveformData?: number[];
  waveformOverview?: number[];
  output?: number;
  color?: string;
  tag?: TrackTag;
  notes?: string;
  file?: File | Blob;
  url?: string;
  filename?: string;
}

export interface SectionMarker {
  id: string;
  time: number;
  label: string;
  type: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro' | 'pre-chorus' | 'instrumental' | 'tag' | 'custom';
}

export interface ChordData {
  time: number;
  chord: string;
  duration: number;
}

export interface ChordMarker {
  time: number;
  chord: string;
  startFret?: number;
  capo?: number;
  customDiagram?: {
    guitar: { frets: number[]; fingers: number[]; startFret?: number };
    ukulele: { frets: number[]; fingers: number[]; startFret?: number };
    piano: { keys: string[] };
    capo?: number;
  };
  /** PHASE 4: Harmonic analysis (auto-calculated) */
  analysis?: {
    romanNumeral: string;
    isDiatonic: boolean;
    isBorrowed: boolean;
    function: string;
    quality: string;
    notes: string[];
  };
}

export interface TempoChange {
  time: number;
  tempo: number;
  timeSignature: string;
  hidden?: boolean;
  subdivision?: string;
  curve?: {
    type: 'linear' | 'exponential';
    targetTempo: number;
    targetTime: number;
  };
}

export interface Loop {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
}

export interface MixPreset {
  id: string;
  name: string;
  tracks: {
    trackId: string;
    volume: number;
    muted: boolean;
  }[];
}

export interface Note {
  id: string;
  userId: string;
  content: string;
  time?: number; // Associada a um tempo na música
  isPrivate: boolean;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  key: string;
  scale?: 'major' | 'minor';
  tempo: number;
  duration: number;
  tracks: AudioTrack[];
  markers: SectionMarker[];
  chords: ChordData[];
  loops: Loop[];
  mixPresets: MixPreset[];
  notes: Note[];
  pdfUrl?: string;
  thumbnailUrl?: string;
  version: number | string;
  lastModified?: Date;
  createdBy?: string;
  tags: string[];
  tempoChanges?: TempoChange[];
  chordMarkers?: ChordMarker[];
  permissions?: {
    canEdit: boolean;
    canShare: boolean;
    canDelete: boolean;
  };
  source?: 'imported' | 'project';
}

export type SetlistItem =
  | { type: 'song'; id: string }
  | { type: 'note'; id: string; content: string };

export interface Setlist {
  id: string;
  name: string;
  items: SetlistItem[];
  createdBy: string;
  eventDate?: Date;
  notes?: string;
  pinned?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'leader' | 'musician';
  preferences: {
    defaultOutput?: number;
    midiDeviceId?: string;
    performanceMode?: boolean;
    selectedInstruments?: TrackTag[]; // From first time setup
    mainInstrument?: TrackTag; // Main instrument for track pinning
    theme?: 'light' | 'dark' | 'system'; // Theme preference
    metronomeSettings?: {
      downbeatFreq?: number; // Hz for downbeat
      beatFreq?: number; // Hz for other beats
      subdivisionFreq?: number; // Hz for subdivisions
      markSubdivisions?: boolean; // Show subdivisions
    };
    playerSettings?: {
      trackHeight?: 'small' | 'medium' | 'large';
      showTempoRuler?: boolean;
      showChordRuler?: boolean;
      showSectionRuler?: boolean;
      showTimeSignatureRuler?: boolean;
      rulerOrder?: string[]; // Order of rulers
    };
  };
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  currentSongId: string | null;
  tempo: number; // Percentage (100 = normal)
  keyShift: number; // Semitones
  loopEnabled: boolean;
  activeLoop: Loop | null;
}
