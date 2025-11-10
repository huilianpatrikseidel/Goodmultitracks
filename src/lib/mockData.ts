import { Song, Setlist, User, AudioTrack, SectionMarker, ChordData, TempoChange, ChordMarker, SetlistItem, TrackTag } from '../types'; // Adicionado SetlistItem e TrackTag

// Generate mock waveform data
const generateWaveform = (samples: number = 200): number[] => {
  return Array.from({ length: samples }, () => Math.random() * 0.8 + 0.1);
};

// Mock audio tracks - Função reutilizada
const createMockTracks = (count: number = 8, includeClickGuide: boolean = true): AudioTrack[] => {
    // Definindo um tipo para os objetos base para garantir a consistência
    type BaseTrackInfo = {
        idSuffix: string;
        name: string;
        type: AudioTrack['type'];
        color: string;
        tag?: TrackTag;
        output?: number;
    };

    const baseTracks: ReadonlyArray<BaseTrackInfo> = [
      { idSuffix: 'drums', name: 'Drums', type: 'drums', color: '#60a5fa', tag: 'drums' as const },
      { idSuffix: 'bass', name: 'Bass', type: 'bass', color: '#ef4444', tag: 'bass' as const },
      { idSuffix: 'eg1', name: 'Electric Gtr 1', type: 'guitar', color: '#22c55e', tag: 'electric-guitar' as const },
      { idSuffix: 'keys', name: 'Keys', type: 'keys', color: '#f59e0b', tag: 'keyboard-piano' as const },
      { idSuffix: 'vox', name: 'Lead Vocals', type: 'vocals', color: '#a855f7', tag: 'lead-vocal' as const },
      { idSuffix: 'bgv', name: 'Backing Vocals', type: 'vocals', color: '#ec4899', tag: 'backing-vocals' as const },
    ];

    const additionalTracks: ReadonlyArray<BaseTrackInfo> = includeClickGuide ? [ { idSuffix: 'click', name: 'Click Track', type: 'click', color: '#14b8a6', output: 2 }, { idSuffix: 'guide', name: 'Guide Cue', type: 'guide', color: '#f97316', output: 2 }, ] : [];

    const allBaseTracks = [...baseTracks, ...additionalTracks];
    const tracksToCreate = Math.min(count, allBaseTracks.length);

    return allBaseTracks.slice(0, tracksToCreate).map((base, index) => ({
      id: `track-${base.idSuffix}-${Date.now().toString(36)}${index}`, // ID mais único
      name: base.name,
      type: base.type,
      volume: 1.0, // Default to 0dB
      muted: false,
      solo: false,
      waveformData: generateWaveform(),
      output: base.output || 1,
      color: base.color,
      tag: base.tag,
      notes: '',
    }));
};

// Mock section markers - Função reutilizada
const createMockMarkers = (duration: number): SectionMarker[] => {
    const scaleFactor = duration > 0 ? duration / 225 : 1;
    return [
      { id: `m1-${Date.now().toString(36)}`, time: 0 * scaleFactor, label: 'Intro', type: 'intro' as const },
      { id: `m2-${Date.now().toString(36)}`, time: 15 * scaleFactor, label: 'Verse 1', type: 'verse' as const },
      { id: `m3-${Date.now().toString(36)}`, time: 45 * scaleFactor, label: 'Chorus', type: 'chorus' as const },
      { id: `m4-${Date.now().toString(36)}`, time: 75 * scaleFactor, label: 'Verse 2', type: 'verse' as const },
      { id: `m5-${Date.now().toString(36)}`, time: 105 * scaleFactor, label: 'Chorus', type: 'chorus' as const },
      { id: `m6-${Date.now().toString(36)}`, time: 135 * scaleFactor, label: 'Bridge', type: 'bridge' as const },
      { id: `m7-${Date.now().toString(36)}`, time: 165 * scaleFactor, label: 'Chorus', type: 'chorus' as const },
      { id: `m8-${Date.now().toString(36)}`, time: 195 * scaleFactor, label: 'Outro', type: 'outro' as const },
    ].filter(m => m.time < duration);
};

// Mock chord markers (performance mode) - Função reutilizada
const createMockChordMarkers = (duration: number): ChordMarker[] => {
     const scaleFactor = duration > 0 ? duration / 120 : 1;
     return [
       { time: 0 * scaleFactor, chord: 'G' }, { time: 4 * scaleFactor, chord: 'G/B' },
       { time: 8 * scaleFactor, chord: 'C' }, { time: 12 * scaleFactor, chord: 'C/E' },
       { time: 16 * scaleFactor, chord: 'D' }, { time: 20 * scaleFactor, chord: 'Dsus4' },
       { time: 24 * scaleFactor, chord: 'Em' }, { time: 28 * scaleFactor, chord: 'C' },
       { time: 32 * scaleFactor, chord: 'G' },
     ].filter(c => c.time < duration);
};

// Mock songs
export const mockSongs: Song[] = [
  {
    id: 'song-1',
    title: 'Amazing Grace',
    artist: 'Traditional',
    key: 'C Major',
    tempo: 120,
    duration: 225,
    tracks: createMockTracks(8),
    markers: createMockMarkers(225),
    chords: [], // Manter vazio ou remover
    chordMarkers: createMockChordMarkers(225),
    loops: [ { id: 'loop-1', name: 'Chorus Loop', startTime: 45, endTime: 75 }, ],
    mixPresets: [], // Simplificado
    notes: [ { id: 'note-1', userId: 'user-1', content: 'Watch for the key change in the bridge', time: 135, isPrivate: false, }, ],
    thumbnailUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400',
    version: 1, lastModified: new Date('2025-10-20'), createdBy: 'admin-1', tags: ['worship', 'traditional'],
    source: 'imported',
    tempoChanges: [{ time: 0, tempo: 120, timeSignature: '4/4' }],
    permissions: { canEdit: false, canShare: false, canDelete: true }, // Ajustado
  },
  {
    id: 'song-2',
    title: 'How Great Is Our God',
    artist: 'Chris Tomlin',
    key: 'G Major', tempo: 76, duration: 240, tracks: createMockTracks(8),
    markers: createMockMarkers(240), chords: [], chordMarkers: createMockChordMarkers(240),
    loops: [], mixPresets: [], notes: [],
    thumbnailUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400',
    version: 2, lastModified: new Date('2025-10-22'), createdBy: 'admin-1', tags: ['worship', 'contemporary'],
    source: 'imported', tempoChanges: [{ time: 0, tempo: 76, timeSignature: '4/4' }],
    permissions: { canEdit: false, canShare: false, canDelete: true },
  },
   {
    id: 'song-3',
    title: 'Oceans',
    artist: 'Hillsong United',
    key: 'D Minor', tempo: 72, duration: 510, tracks: createMockTracks(8),
    markers: createMockMarkers(510), chords: [], chordMarkers: createMockChordMarkers(510),
    loops: [], mixPresets: [], notes: [],
    thumbnailUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    version: 1, lastModified: new Date('2025-10-15'), createdBy: 'user-2', tags: ['worship', 'ballad'],
    source: 'imported', tempoChanges: [{ time: 0, tempo: 72, timeSignature: '4/4' }],
    permissions: { canEdit: false, canShare: false, canDelete: true },
  },
  {
    id: 'song-4',
    title: 'Reckless Love',
    artist: 'Cory Asbury',
    key: 'E Major', tempo: 130, duration: 320, tracks: createMockTracks(8),
    markers: createMockMarkers(320), chords: [], chordMarkers: createMockChordMarkers(320),
    loops: [], mixPresets: [], notes: [],
    thumbnailUrl: 'https://images.unsplash.com/photo-1460667262436-cf19894f4774?w=400',
    version: 1, lastModified: new Date('2025-10-18'), createdBy: 'user-2', tags: ['worship', 'upbeat'],
    source: 'imported', tempoChanges: [{ time: 0, tempo: 130, timeSignature: '4/4' }],
    permissions: { canEdit: false, canShare: false, canDelete: true },
  },
  {
    id: 'song-5',
    title: 'Goodness of God',
    artist: 'Bethel Music',
    key: 'C Major', tempo: 123, duration: 378, tracks: createMockTracks(8),
    markers: createMockMarkers(378), chords: [], chordMarkers: createMockChordMarkers(378),
    loops: [], mixPresets: [], notes: [],
    thumbnailUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400',
    version: 1, lastModified: new Date('2025-10-10'), createdBy: 'admin-1', tags: ['worship', 'contemporary'],
    source: 'imported', tempoChanges: [{ time: 0, tempo: 123, timeSignature: '4/4' }],
    permissions: { canEdit: false, canShare: false, canDelete: true },
  },
  // --- PROJETO FICTÍCIO ---
  {
    id: 'project-1',
    title: 'My New Song Idea',
    artist: 'User', key: 'A Minor', tempo: 95, duration: 180,
    tracks: createMockTracks(4, false),
    markers: [ { id: 'm-proj-1', time: 0, label: 'Verse 1', type: 'verse' }, { id: 'm-proj-2', time: 60, label: 'Chorus', type: 'chorus' }, { id: 'm-proj-3', time: 120, label: 'Verse 2', type: 'verse' }, ],
    chords: [],
    chordMarkers: [ { time: 0, chord: 'Am' }, { time: 8, chord: 'G' }, { time: 16, chord: 'C' }, { time: 24, chord: 'F' }, { time: 60, chord: 'C' }, { time: 68, chord: 'G' }, { time: 76, chord: 'Am' }, { time: 84, chord: 'F' }, ],
    loops: [], mixPresets: [], notes: [], thumbnailUrl: '', version: '1.0', lastModified: new Date(), createdBy: 'user-1', tags: ['project', 'idea'],
    source: 'project',
    tempoChanges: [{ time: 0, tempo: 95, timeSignature: '4/4' }],
    permissions: { canEdit: true, canShare: false, canDelete: true, }, // Ajustado
  },
];

// Mock setlists com a nova estrutura 'items'
export const mockSetlists: Setlist[] = [
  {
    id: 'setlist-1',
    name: 'Sunday Service - Oct 27',
    items: [
        { type: 'song', id: 'song-1' },
        { type: 'note', id: 'note-s1-1', content: 'Intro talk about grace.' },
        { type: 'song', id: 'song-2' },
        { type: 'song', id: 'song-5' },
        { type: 'note', id: 'note-s1-2', content: 'Closing prayer.' },
    ],
    createdBy: 'admin-1',
    eventDate: new Date('2025-10-27'),
    notes: 'Remember to mute guide track for live performance',
  },
  {
    id: 'setlist-2',
    name: 'Wednesday Night Worship',
    items: [
        { type: 'song', id: 'song-3' },
        { type: 'song', id: 'song-4' },
    ],
    createdBy: 'user-2',
    eventDate: new Date('2025-10-30'),
  },
  {
    id: 'setlist-3',
    name: 'Practice Session',
    items: [
        { type: 'song', id: 'song-1' },
        { type: 'note', id: 'note-s3-1', content: 'Focus on transitions.' },
        { type: 'song', id: 'song-3' },
        { type: 'song', id: 'song-4' },
        { type: 'song', id: 'song-5' },
        { type: 'song', id: 'project-1' },
    ],
    createdBy: 'user-1',
  },
];

// Mock users
export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'John Musician',
    email: 'john@example.com',
    role: 'musician',
    preferences: {
      defaultOutput: 1,
      performanceMode: false,
      theme: 'system',
      selectedInstruments: ['electric-guitar', 'acoustic-guitar'],
      mainInstrument: 'electric-guitar',
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
      theme: 'dark',
      selectedInstruments: ['lead-vocal', 'keyboard-piano'],
      mainInstrument: 'lead-vocal',
    },
  },
  {
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    preferences: { defaultOutput: 1, performanceMode: false, theme: 'light' },
  },
];

export const currentUser = mockUsers[0];