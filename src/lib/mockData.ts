import { Song, Setlist, User, AudioTrack, SectionMarker, ChordData, TempoChange, ChordMarker } from '../types'; // Adicionado TempoChange e ChordMarker

// Generate mock waveform data
const generateWaveform = (samples: number = 200): number[] => {
  return Array.from({ length: samples }, () => Math.random() * 0.8 + 0.1);
};

// Mock audio tracks - Função reutilizada
const createMockTracks = (count: number = 8, includeClickGuide: boolean = true): AudioTrack[] => {
    const baseTracks = [
      { idSuffix: 'drums', name: 'Drums', type: 'drums', color: '#60a5fa' },
      { idSuffix: 'bass', name: 'Bass', type: 'bass', color: '#ef4444' },
      { idSuffix: 'eg1', name: 'Electric Gtr 1', type: 'guitar', color: '#22c55e' },
      { idSuffix: 'keys', name: 'Keys', type: 'keys', color: '#f59e0b' },
      { idSuffix: 'vox', name: 'Lead Vocals', type: 'vocals', color: '#a855f7' },
      { idSuffix: 'bgv', name: 'Backing Vocals', type: 'vocals', color: '#ec4899' },
    ] as const; // Use 'as const' para tipos mais específicos

    const additionalTracks = includeClickGuide ? [
      { idSuffix: 'click', name: 'Click Track', type: 'click', color: '#14b8a6', output: 2 },
      { idSuffix: 'guide', name: 'Guide Cue', type: 'guide', color: '#f97316', output: 2 },
    ] as const : []; // Use 'as const' aqui também

    const allBaseTracks = [...baseTracks, ...additionalTracks];
    const tracksToCreate = Math.min(count, allBaseTracks.length);

    return allBaseTracks.slice(0, tracksToCreate).map((base, index) => ({
      id: `track-${base.idSuffix}-${Date.now() + index}`, // ID mais único
      name: base.name,
      type: base.type,
      volume: 1.0, // Default to 0dB
      muted: false,
      solo: false,
      waveformData: generateWaveform(),
      output: base.output || 1,
      color: base.color,
    }));
};

// Mock section markers - Função reutilizada
const createMockMarkers = (duration: number): SectionMarker[] => {
    // Ajusta os tempos dos marcadores com base na duração
    const scaleFactor = duration / 225; // Usa a duração original da primeira música como base
    return [
      { id: 'm1', time: 0 * scaleFactor, label: 'Intro', type: 'intro' },
      { id: 'm2', time: 15 * scaleFactor, label: 'Verse 1', type: 'verse' },
      { id: 'm3', time: 45 * scaleFactor, label: 'Chorus', type: 'chorus' },
      { id: 'm4', time: 75 * scaleFactor, label: 'Verse 2', type: 'verse' },
      { id: 'm5', time: 105 * scaleFactor, label: 'Chorus', type: 'chorus' },
      { id: 'm6', time: 135 * scaleFactor, label: 'Bridge', type: 'bridge' },
      { id: 'm7', time: 165 * scaleFactor, label: 'Chorus', type: 'chorus' },
      { id: 'm8', time: 195 * scaleFactor, label: 'Outro', type: 'outro' },
    ].filter(m => m.time < duration); // Garante que os marcadores estejam dentro da duração
};

// Mock chord data (simplificado para o projeto) - Função reutilizada
const createMockChords = (duration: number): ChordData[] => {
    // Simplificado para o projeto, apenas alguns acordes
    const scaleFactor = duration / 120; // Base de 2 minutos
    return [
      { time: 0 * scaleFactor, chord: 'G', duration: 4 * scaleFactor },
      { time: 8 * scaleFactor, chord: 'C', duration: 4 * scaleFactor },
      { time: 16 * scaleFactor, chord: 'D', duration: 4 * scaleFactor },
      { time: 24 * scaleFactor, chord: 'Em', duration: 4 * scaleFactor },
    ].filter(c => c.time < duration);
};

// Mock chord markers (performance mode) - Função reutilizada
const createMockChordMarkers = (duration: number): ChordMarker[] => {
    // Versão simplificada para o projeto
     const scaleFactor = duration / 120; // Base de 2 minutos
     return [
       { time: 0 * scaleFactor, chord: 'G' },
       { time: 4 * scaleFactor, chord: 'G/B' },
       { time: 8 * scaleFactor, chord: 'C' },
       { time: 12 * scaleFactor, chord: 'C/E' },
       { time: 16 * scaleFactor, chord: 'D' },
       { time: 20 * scaleFactor, chord: 'Dsus4' },
       { time: 24 * scaleFactor, chord: 'Em' },
       { time: 28 * scaleFactor, chord: 'C' },
       { time: 32 * scaleFactor, chord: 'G' },
     ].filter(c => c.time < duration);
};

// Mock songs
export const mockSongs: Song[] = [
  {
    id: 'song-1',
    title: 'Amazing Grace',
    artist: 'Traditional',
    key: 'C Major', // Ajustado
    tempo: 120,
    duration: 225,
    tracks: createMockTracks(8), // Cria 8 tracks padrão
    markers: createMockMarkers(225),
    chords: [], // Removido chords antigos
    chordMarkers: createMockChordMarkers(225),
    loops: [
      { id: 'loop-1', name: 'Chorus Loop', startTime: 45, endTime: 75 },
    ],
    mixPresets: [
      {
        id: 'preset-1',
        name: 'My Practice Mix',
        tracks: [
          { trackId: 'track-drums-1', volume: 0.5, muted: false }, // IDs precisam ser ajustados se createMockTracks mudar
          { trackId: 'track-vox-1', volume: 0.3, muted: false },
          { trackId: 'track-click-1', volume: 0.8, muted: false },
        ],
      },
    ],
    notes: [
      {
        id: 'note-1',
        userId: 'user-1',
        content: 'Watch for the key change in the bridge',
        time: 135,
        isPrivate: false,
      },
    ],
    thumbnailUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400',
    version: 1,
    lastModified: new Date('2025-10-20'),
    createdBy: 'admin-1',
    tags: ['worship', 'traditional'],
    source: 'imported', // Marcado como importado
    tempoChanges: [{ time: 0, tempo: 120, timeSignature: '4/4' }], // Adicionado tempoChanges
    permissions: { canEdit: false, canShare: true, canDelete: false }, // Permissões de exemplo
  },
  {
    id: 'song-2',
    title: 'How Great Is Our God',
    artist: 'Chris Tomlin',
    key: 'G Major', // Ajustado
    tempo: 76,
    duration: 240,
    tracks: createMockTracks(8),
    markers: createMockMarkers(240),
    chords: [],
    chordMarkers: createMockChordMarkers(240),
    loops: [],
    mixPresets: [],
    notes: [],
    thumbnailUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400',
    version: 2,
    lastModified: new Date('2025-10-22'),
    createdBy: 'admin-1',
    tags: ['worship', 'contemporary'],
    source: 'imported',
    tempoChanges: [{ time: 0, tempo: 76, timeSignature: '4/4' }],
    permissions: { canEdit: false, canShare: true, canDelete: false },
  },
  // ... (outras músicas importadas mantidas como antes)
  {
    id: 'song-3',
    title: 'Oceans',
    artist: 'Hillsong United',
    key: 'D Minor', // Ajustado
    tempo: 72,
    duration: 510,
    tracks: createMockTracks(8),
    markers: createMockMarkers(510),
    chords: [],
    chordMarkers: createMockChordMarkers(510),
    loops: [],
    mixPresets: [],
    notes: [],
    thumbnailUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    version: 1,
    lastModified: new Date('2025-10-15'),
    createdBy: 'user-2',
    tags: ['worship', 'ballad'],
    source: 'imported',
    tempoChanges: [{ time: 0, tempo: 72, timeSignature: '4/4' }],
    permissions: { canEdit: false, canShare: true, canDelete: false },
  },
  {
    id: 'song-4',
    title: 'Reckless Love',
    artist: 'Cory Asbury',
    key: 'E Major', // Ajustado
    tempo: 130,
    duration: 320,
    tracks: createMockTracks(8),
    markers: createMockMarkers(320),
    chords: [],
    chordMarkers: createMockChordMarkers(320),
    loops: [],
    mixPresets: [],
    notes: [],
    thumbnailUrl: 'https://images.unsplash.com/photo-1460667262436-cf19894f4774?w=400',
    version: 1,
    lastModified: new Date('2025-10-18'),
    createdBy: 'user-2',
    tags: ['worship', 'upbeat'],
    source: 'imported',
    tempoChanges: [{ time: 0, tempo: 130, timeSignature: '4/4' }],
    permissions: { canEdit: false, canShare: true, canDelete: false },
  },
  {
    id: 'song-5',
    title: 'Goodness of God',
    artist: 'Bethel Music',
    key: 'C Major', // Ajustado
    tempo: 123,
    duration: 378,
    tracks: createMockTracks(8),
    markers: createMockMarkers(378),
    chords: [],
    chordMarkers: createMockChordMarkers(378),
    loops: [],
    mixPresets: [],
    notes: [],
    thumbnailUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400',
    version: 1,
    lastModified: new Date('2025-10-10'),
    createdBy: 'admin-1',
    tags: ['worship', 'contemporary'],
    source: 'imported',
    tempoChanges: [{ time: 0, tempo: 123, timeSignature: '4/4' }],
    permissions: { canEdit: false, canShare: true, canDelete: false },
  },

  // --- NOVO PROJETO FICTÍCIO ---
  {
    id: 'project-1',
    title: 'My New Song Idea',
    artist: 'User', // Ou o nome do usuário atual
    key: 'A Minor',
    tempo: 95,
    duration: 180, // Duração inicial (pode ser ajustada)
    tracks: createMockTracks(4, false), // Cria 4 tracks básicas (sem click/guide)
    markers: [ // Marcadores iniciais simples
        { id: 'm-proj-1', time: 0, label: 'Verse 1', type: 'verse' },
        { id: 'm-proj-2', time: 60, label: 'Chorus', type: 'chorus' },
        { id: 'm-proj-3', time: 120, label: 'Verse 2', type: 'verse' },
    ],
    chords: [], // Sem chords antigos
    chordMarkers: [ // Acordes iniciais simples
        { time: 0, chord: 'Am' },
        { time: 8, chord: 'G' },
        { time: 16, chord: 'C' },
        { time: 24, chord: 'F' },
        { time: 60, chord: 'C' },
        { time: 68, chord: 'G' },
        { time: 76, chord: 'Am' },
        { time: 84, chord: 'F' },
    ],
    loops: [],
    mixPresets: [],
    notes: [],
    thumbnailUrl: '', // Sem thumbnail inicial
    version: '1.0', // Versão inicial como string
    lastModified: new Date(), // Data atual
    createdBy: 'user-1', // ID do usuário atual
    tags: ['project', 'idea'],
    source: 'project', // Marcado como projeto
    tempoChanges: [{ time: 0, tempo: 95, timeSignature: '4/4' }], // Tempo e TS iniciais
    permissions: { // Permissões completas para o criador
      canEdit: true,
      canShare: true,
      canDelete: true,
    },
  },
  // --- FIM DO NOVO PROJETO ---
];

// Mock setlists (sem alterações)
export const mockSetlists: Setlist[] = [
  {
    id: 'setlist-1',
    name: 'Sunday Service - Oct 27',
    songIds: ['song-1', 'song-2', 'song-5'],
    createdBy: 'admin-1',
    sharedWith: ['user-1', 'user-2'],
    eventDate: new Date('2025-10-27'),
    notes: 'Remember to mute guide track for live performance',
  },
  {
    id: 'setlist-2',
    name: 'Wednesday Night Worship',
    songIds: ['song-3', 'song-4'],
    createdBy: 'user-2',
    sharedWith: ['user-1'],
    eventDate: new Date('2025-10-30'),
  },
  {
    id: 'setlist-3',
    name: 'Practice Session',
    songIds: ['song-1', 'song-3', 'song-4', 'song-5', 'project-1'], // Adicionado o projeto
    createdBy: 'user-1',
    sharedWith: [],
  },
];

// Mock users (sem alterações)
export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'John Musician',
    email: 'john@example.com',
    role: 'musician',
    preferences: {
      defaultOutput: 1,
      performanceMode: false,
    },
  },
  {
    id: 'user-2',
    name: 'Sarah Leader',
    email: 'sarah@example.com',
    role: 'leader',
    preferences: {
      defaultOutput: 1,
      performanceMode: true,
    },
  },
  {
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    preferences: {
      defaultOutput: 1,
      performanceMode: false,
    },
  },
];

export const currentUser = mockUsers[0]; // Mantido como user-1