export interface AudioTrack {
  id: string;
  name: string;
  type: 'drums' | 'bass' | 'guitar' | 'keys' | 'vocals' | 'click' | 'guide' | 'other';
  volume: number;
  muted: boolean;
  solo: boolean;
  waveformData: number[];
  output?: number; // Audio output routing
  color?: string; // Track color for visual identification
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
  startFret?: number; // Legacy field for backward compatibility
  capo?: number; // Legacy field for backward compatibility
  customDiagram?: {
    guitar: { frets: number[]; fingers: number[]; startFret?: number };
    ukulele: { frets: number[]; fingers: number[]; startFret?: number };
    piano: { keys: string[] };
    capo?: number;
  };
}

export interface TempoChange {
  time: number;
  tempo: number;
  timeSignature: string;
}

export interface TimeSignatureChange {
  time: number;
  timeSignature: string;
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
  time?: number;
  isPrivate: boolean;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  key: string;
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
  source?: 'imported' | 'project'; // Distinguish between imported songs and created projects
}

export type SetlistItem =
  | { type: 'song'; id: string }
  | { type: 'note'; id: string; content: string }; // Adiciona um ID para a nota também

export interface Setlist {
  id: string;
  name: string;
  // songIds: string[]; // << REMOVIDO
  items: SetlistItem[]; // << ADICIONADO: Array de músicas ou notas
  createdBy: string;
  // sharedWith: string[]; // << REMOVIDO
  eventDate?: Date;
  notes?: string; // Mantém notas gerais da setlist
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
