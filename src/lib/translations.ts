export type Language = 'en' | 'pt';

export interface Translations {
  // App navigation
  library: string;
  setlists: string;
  settings: string;
  
  // Library
  songLibrary: string;
  searchSongs: string;
  importProject: string;
  createNew: string;
  songs: string;
  duration: string;
  tempo: string;
  tracks: string;
  play: string;
  edit: string;
  delete: string;
  addToSetlist: string;
  
  // Setlist
  setlistManager: string;
  searchSetlists: string;
  createSetlist: string;
  setlistName: string;
  noSetlists: string;
  createFirstSetlist: string;
  editSetlist: string;
  deleteSetlist: string;
  addSongs: string;
  removeSong: string;
  
  // Player
  backToLibrary: string;
  performanceMode: string;
  editMode: string;
  master: string;
  volume: string;
  pan: string;
  solo: string;
  mute: string;
  metronome: string;
  metronomeVolume: string;
  
  // Timeline
  timestamps: string;
  tempoTimeSignature: string;
  chords: string;
  sections: string;
  measures: string;
  insertChord: string;
  insertSection: string;
  insertTempo: string;
  
  // Performance Mode
  exitPerformance: string;
  previous: string;
  next: string;
  upNext: string;
  
  // Settings
  appSettings: string;
  appearance: string;
  theme: string;
  light: string;
  dark: string;
  system: string;
  language: string;
  english: string;
  portuguese: string;
  audio: string;
  audioOutput: string;
  bufferSize: string;
  sampleRate: string;
  midi: string;
  midiInput: string;
  enableMidi: string;
  midiChannel: string;
  playPause: string;
  stop: string;
  skipForward: string;
  skipBackward: string;
  about: string;
  version: string;
  
  // Dialogs
  cancel: string;
  save: string;
  create: string;
  close: string;
  confirm: string;
  
  // Create Project Dialog
  createProject: string;
  projectName: string;
  artist: string;
  defaultTempo: string;
  timeSignature: string;
  
  // Add to Setlist Dialog
  selectSetlist: string;
  addToExisting: string;
  
  // Timeline Editor
  editTimeline: string;
  chordInsertion: string;
  sectionInsertion: string;
  tempoInsertion: string;
  position: string;
  chord: string;
  section: string;
  tempoValue: string;
  root: string;
  accidental: string;
  quality: string;
  major: string;
  minor: string;
  augmented: string;
  diminished: string;
  dominant7: string;
  major7: string;
  minor7: string;
  extension: string;
  none: string;
  ninth: string;
  eleventh: string;
  thirteenth: string;
  bassNote: string;
  customizeDiagram: string;
  guitar: string;
  ukulele: string;
  piano: string;
  intro: string;
  verse: string;
  chorus: string;
  bridge: string;
  outro: string;
  interlude: string;
  solo: string;
  preChorus: string;
  
  // Notes Panel
  notes: string;
  songNotes: string;
  
  // Messages
  confirmDelete: string;
  confirmDeleteSong: string;
  confirmDeleteSetlist: string;
  noSongsInLibrary: string;
  importFirstSong: string;
  
  // Interactive Diagrams
  clickFretsToPlace: string;
  clickToMute: string;
  greenCircles: string;
  redCircles: string;
  blueDots: string;
  clickPianoKeys: string;
  selectedNotes: string;
  clickToToggle: string;
  blueDotsFingers: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // App navigation
    library: 'Library',
    setlists: 'Setlists',
    settings: 'Settings',
    
    // Library
    songLibrary: 'Song Library',
    searchSongs: 'Search songs...',
    importProject: 'Import Project',
    createNew: 'Create New',
    songs: 'songs',
    duration: 'Duration',
    tempo: 'Tempo',
    tracks: 'tracks',
    play: 'Play',
    edit: 'Edit',
    delete: 'Delete',
    addToSetlist: 'Add to Setlist',
    
    // Setlist
    setlistManager: 'Setlist Manager',
    searchSetlists: 'Search setlists...',
    createSetlist: 'Create Setlist',
    setlistName: 'Setlist Name',
    noSetlists: 'No setlists yet',
    createFirstSetlist: 'Create your first setlist to organize your songs',
    editSetlist: 'Edit Setlist',
    deleteSetlist: 'Delete Setlist',
    addSongs: 'Add Songs',
    removeSong: 'Remove from setlist',
    
    // Player
    backToLibrary: 'Back to Library',
    performanceMode: 'Performance Mode',
    editMode: 'Edit Mode',
    master: 'Master',
    volume: 'Volume',
    pan: 'Pan',
    solo: 'Solo',
    mute: 'Mute',
    metronome: 'Metronome',
    metronomeVolume: 'Metronome Volume',
    
    // Timeline
    timestamps: 'Timestamps',
    tempoTimeSignature: 'Tempo / Time Signature',
    chords: 'Chords',
    sections: 'Sections',
    measures: 'Measures',
    insertChord: 'Insert Chord',
    insertSection: 'Insert Section',
    insertTempo: 'Insert Tempo/Time Sig',
    
    // Performance Mode
    exitPerformance: 'Exit Performance Mode',
    previous: 'Previous',
    next: 'Next',
    upNext: 'Up Next',
    
    // Settings
    appSettings: 'App Settings',
    appearance: 'Appearance',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    language: 'Language',
    english: 'English',
    portuguese: 'Portuguese',
    audio: 'Audio',
    audioOutput: 'Audio Output Device',
    bufferSize: 'Buffer Size',
    sampleRate: 'Sample Rate',
    midi: 'MIDI',
    midiInput: 'MIDI Input Device',
    enableMidi: 'Enable MIDI Control',
    midiChannel: 'MIDI Channel',
    playPause: 'Play/Pause',
    stop: 'Stop',
    skipForward: 'Skip Forward',
    skipBackward: 'Skip Backward',
    about: 'About',
    version: 'Version',
    
    // Dialogs
    cancel: 'Cancel',
    save: 'Save',
    create: 'Create',
    close: 'Close',
    confirm: 'Confirm',
    
    // Create Project Dialog
    createProject: 'Create New Project',
    projectName: 'Project Name',
    artist: 'Artist',
    defaultTempo: 'Default Tempo',
    timeSignature: 'Time Signature',
    
    // Add to Setlist Dialog
    selectSetlist: 'Select a setlist',
    addToExisting: 'Add to existing setlist',
    
    // Timeline Editor
    editTimeline: 'Edit Timeline',
    chordInsertion: 'Chord Insertion',
    sectionInsertion: 'Section Insertion',
    tempoInsertion: 'Tempo/Time Signature Insertion',
    position: 'Position',
    chord: 'Chord',
    section: 'Section',
    tempoValue: 'Tempo',
    root: 'Root',
    accidental: 'Accidental',
    quality: 'Quality',
    major: 'Major',
    minor: 'Minor',
    augmented: 'Augmented',
    diminished: 'Diminished',
    dominant7: 'Dominant 7th',
    major7: 'Major 7th',
    minor7: 'Minor 7th',
    extension: 'Extension',
    none: 'None',
    ninth: '9th',
    eleventh: '11th',
    thirteenth: '13th',
    bassNote: 'Bass Note',
    customizeDiagram: 'Customize Diagram',
    guitar: 'Guitar',
    ukulele: 'Ukulele',
    piano: 'Piano',
    intro: 'Intro',
    verse: 'Verse',
    chorus: 'Chorus',
    bridge: 'Bridge',
    outro: 'Outro',
    interlude: 'Interlude',
    solo: 'Solo',
    preChorus: 'Pre-Chorus',
    
    // Notes Panel
    notes: 'Notes',
    songNotes: 'Song notes and reminders...',
    
    // Messages
    confirmDelete: 'Are you sure you want to delete this?',
    confirmDeleteSong: 'Are you sure you want to delete this song?',
    confirmDeleteSetlist: 'Are you sure you want to delete this setlist?',
    noSongsInLibrary: 'No songs in your library',
    importFirstSong: 'Import your first song to get started',
    
    // Interactive Diagrams
    clickFretsToPlace: 'Click on frets to place fingers, click string labels to mute/unmute',
    clickToMute: 'Click string labels to mute/unmute',
    greenCircles: 'Green circles = open/active strings',
    redCircles: 'Red circles with ✕ = muted strings',
    blueDots: 'Blue dots = finger positions',
    clickPianoKeys: 'Click on piano keys to build your chord',
    selectedNotes: 'Selected notes:',
    clickToToggle: 'Click keys to toggle selection',
    blueDotsFingers: 'Blue dots show finger positions on the fretboard',
  },
  pt: {
    // App navigation
    library: 'Biblioteca',
    setlists: 'Setlists',
    settings: 'Configurações',
    
    // Library
    songLibrary: 'Biblioteca de Músicas',
    searchSongs: 'Buscar músicas...',
    importProject: 'Importar Projeto',
    createNew: 'Criar Novo',
    songs: 'músicas',
    duration: 'Duração',
    tempo: 'Tempo',
    tracks: 'faixas',
    play: 'Tocar',
    edit: 'Editar',
    delete: 'Excluir',
    addToSetlist: 'Adicionar à Setlist',
    
    // Setlist
    setlistManager: 'Gerenciador de Setlists',
    searchSetlists: 'Buscar setlists...',
    createSetlist: 'Criar Setlist',
    setlistName: 'Nome da Setlist',
    noSetlists: 'Nenhuma setlist ainda',
    createFirstSetlist: 'Crie sua primeira setlist para organizar suas músicas',
    editSetlist: 'Editar Setlist',
    deleteSetlist: 'Excluir Setlist',
    addSongs: 'Adicionar Músicas',
    removeSong: 'Remover da setlist',
    
    // Player
    backToLibrary: 'Voltar à Biblioteca',
    performanceMode: 'Modo Performance',
    editMode: 'Modo Edição',
    master: 'Master',
    volume: 'Volume',
    pan: 'Pan',
    solo: 'Solo',
    mute: 'Mudo',
    metronome: 'Metrônomo',
    metronomeVolume: 'Volume do Metrônomo',
    
    // Timeline
    timestamps: 'Timestamps',
    tempoTimeSignature: 'Tempo / Fórmula de Compasso',
    chords: 'Acordes',
    sections: 'Seções',
    measures: 'Compassos',
    insertChord: 'Inserir Acorde',
    insertSection: 'Inserir Seção',
    insertTempo: 'Inserir Tempo/Fórmula',
    
    // Performance Mode
    exitPerformance: 'Sair do Modo Performance',
    previous: 'Anterior',
    next: 'Próxima',
    upNext: 'A Seguir',
    
    // Settings
    appSettings: 'Configurações do App',
    appearance: 'Aparência',
    theme: 'Tema',
    light: 'Claro',
    dark: 'Escuro',
    system: 'Sistema',
    language: 'Idioma',
    english: 'Inglês',
    portuguese: 'Português',
    audio: 'Áudio',
    audioOutput: 'Dispositivo de Saída de Áudio',
    bufferSize: 'Tamanho do Buffer',
    sampleRate: 'Taxa de Amostragem',
    midi: 'MIDI',
    midiInput: 'Dispositivo de Entrada MIDI',
    enableMidi: 'Habilitar Controle MIDI',
    midiChannel: 'Canal MIDI',
    playPause: 'Play/Pause',
    stop: 'Parar',
    skipForward: 'Avançar',
    skipBackward: 'Retroceder',
    about: 'Sobre',
    version: 'Versão',
    
    // Dialogs
    cancel: 'Cancelar',
    save: 'Salvar',
    create: 'Criar',
    close: 'Fechar',
    confirm: 'Confirmar',
    
    // Create Project Dialog
    createProject: 'Criar Novo Projeto',
    projectName: 'Nome do Projeto',
    artist: 'Artista',
    defaultTempo: 'Tempo Padrão',
    timeSignature: 'Fórmula de Compasso',
    
    // Add to Setlist Dialog
    selectSetlist: 'Selecione uma setlist',
    addToExisting: 'Adicionar a uma setlist existente',
    
    // Timeline Editor
    editTimeline: 'Editar Timeline',
    chordInsertion: 'Inserção de Acorde',
    sectionInsertion: 'Inserção de Seção',
    tempoInsertion: 'Inserção de Tempo/Fórmula',
    position: 'Posição',
    chord: 'Acorde',
    section: 'Seção',
    tempoValue: 'Tempo',
    root: 'Fundamental',
    accidental: 'Acidente',
    quality: 'Qualidade',
    major: 'Maior',
    minor: 'Menor',
    augmented: 'Aumentado',
    diminished: 'Diminuto',
    dominant7: '7ª Dominante',
    major7: '7ª Maior',
    minor7: '7ª Menor',
    extension: 'Extensão',
    none: 'Nenhuma',
    ninth: '9ª',
    eleventh: '11ª',
    thirteenth: '13ª',
    bassNote: 'Nota do Baixo',
    customizeDiagram: 'Personalizar Diagrama',
    guitar: 'Violão',
    ukulele: 'Ukulele',
    piano: 'Piano',
    intro: 'Intro',
    verse: 'Verso',
    chorus: 'Refrão',
    bridge: 'Ponte',
    outro: 'Outro',
    interlude: 'Interlúdio',
    solo: 'Solo',
    preChorus: 'Pré-Refrão',
    
    // Notes Panel
    notes: 'Notas',
    songNotes: 'Notas e lembretes da música...',
    
    // Messages
    confirmDelete: 'Tem certeza que deseja excluir?',
    confirmDeleteSong: 'Tem certeza que deseja excluir esta música?',
    confirmDeleteSetlist: 'Tem certeza que deseja excluir esta setlist?',
    noSongsInLibrary: 'Nenhuma música na sua biblioteca',
    importFirstSong: 'Importe sua primeira música para começar',
    
    // Interactive Diagrams
    clickFretsToPlace: 'Clique nos trastes para posicionar dedos, clique nas cordas para mutar/desmutar',
    clickToMute: 'Clique nas cordas para mutar/desmutar',
    greenCircles: 'Círculos verdes = cordas abertas/ativas',
    redCircles: 'Círculos vermelhos com ✕ = cordas mudas',
    blueDots: 'Pontos azuis = posições dos dedos',
    clickPianoKeys: 'Clique nas teclas do piano para montar seu acorde',
    selectedNotes: 'Notas selecionadas:',
    clickToToggle: 'Clique nas teclas para alternar seleção',
    blueDotsFingers: 'Pontos azuis mostram posições dos dedos no braço',
  },
};

export function getTranslation(lang: Language): Translations {
  return translations[lang];
}
