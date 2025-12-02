// << DEFINIÇÃO ATUALIZADA E TIPO DINÂMICO >>
export const TRACK_TAG_HIERARCHY = {
  drums: ['drums'],
  percussion: ['percussion', 'cajon'],
  bass: ['bass'],
  guitar: ['acoustic-guitar', 'electric-guitar'],
  keys: ['keys', 'keyboard-piano'], // Corrigido para incluir a tag usada nos mocks
  vocals: ['vocals-general', 'lead-vocal', 'backing-vocals'],
  orchestral: [], // Adicionado para evitar erro de 'undefined'
  loops: [], // Adicionado para evitar erro de 'undefined'
  click: [], // Adicionado para corresponder ao tipo AudioTrack e evitar erro
  guide: [], // Adicionado para corresponder ao tipo AudioTrack e evitar erro
  piano: [], // Adicionado para corresponder às categorias usadas na UI
  other: ['other-elements'],
} as const;

// Gera o tipo TrackTag dinamicamente a partir do objeto TRACK_TAG_HIERARCHY
type AllTagsArray = typeof TRACK_TAG_HIERARCHY[keyof typeof TRACK_TAG_HIERARCHY];
export type TrackTag = AllTagsArray[number];

export interface AudioTrack {
  id: string;
  name: string;
  type: 'drums' | 'bass' | 'guitar' | 'keys' | 'vocals' | 'click' | 'guide' | 'other';
  volume: number;
  muted: boolean;
  solo: boolean;
  waveformData?: number[]; // OPTIONAL: Now stored in WaveformStore to improve performance
  waveformOverview?: number[]; // OTIMIZAÇÃO QA: LOD array para zoom distante (opcional, gerado via worker)
  output?: number; // Audio output routing
  color?: string; // Track color for visual identification
  tag?: TrackTag; // Mandatory tag for categorization
  notes?: string; // Track-specific notes
  
  // PERSISTENCE FIELDS: Added for .gmtk project file support
  file?: File | Blob; // Physical audio file for packaging into ZIP
  url?: string;       // Blob URL (blob:http://...) for <audio> element playback
  filename?: string;  // Original filename for reference in XML
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
  time: number; // Position in Measures (1-based)
  tempo: number;
  timeSignature: string;
  hidden?: boolean; // Hide from player view (only show in edit mode)
  subdivision?: string; // For irregular time signatures (e.g., "2+3" for 5/8)
  curve?: {
    // For gradual tempo changes (rallentando)
    type: 'linear' | 'exponential';
    targetTempo: number;
    targetTime: number;
  };
}

// TimeSignatureChange não é mais explicitamente necessário se incluído em TempoChange
// export interface TimeSignatureChange {
//   time: number;
//   timeSignature: string;
// }

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
  tempo: number;
  duration: number;
  tracks: AudioTrack[];
  markers: SectionMarker[];
  chords: ChordData[]; // Mantido por enquanto, mas pode ser removido se não usado
  loops: Loop[];
  mixPresets: MixPreset[];
  notes: Note[]; // Notas específicas da música
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
    canShare: boolean; // Pode ser removido se não houver compartilhamento
    canDelete: boolean;
  };
  source?: 'imported' | 'project';
}

// Novo tipo para item da setlist
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
  notes?: string; // Notas gerais da setlist
  pinned?: boolean; // Pin setlist to top
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