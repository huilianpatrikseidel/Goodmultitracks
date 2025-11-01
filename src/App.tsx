import React, { useState, useEffect } from 'react';
import { Music, ListMusic, Settings, Play } from 'lucide-react';
import { DAWPlayer } from './components/DAWPlayer';
import { SongLibrary } from './components/SongLibrary';
import { SetlistManager } from './components/SetlistManager';
import { SettingsPanel } from './components/SettingsPanel';
import { PerformanceMode } from './components/PerformanceMode';
import { FirstTimeSetup } from './components/FirstTimeSetup';
import { MobileNav } from './components/MobileNav';
import { Button } from './components/ui/button';
import { Separator } from './components/ui/separator';
import { mockSongs, mockSetlists, currentUser } from './lib/mockData';
import { Song, Setlist, AudioTrack, TrackTag } from './types';
import { LanguageProvider, useLanguage } from './lib/LanguageContext';
import { ThemeProvider } from './lib/ThemeContext';

function AppContent() {
  const { t } = useLanguage();
  const [songs, setSongs] = useState<Song[]>(mockSongs);
  const [setlists, setSetlists] = useState<Setlist[]>(mockSetlists);
  const [selectedSong, setSelectedSong] = useState<Song | null>(mockSongs[0]); // Mantido o default para teste
  const [performanceMode, setPerformanceMode] = useState(false);
  const [activeView, setActiveView] = useState<'library' | 'setlists' | 'player' | 'settings'>('library');
  const [previousView, setPreviousView] = useState<'library' | 'setlists' | 'settings'>('library');
  const [activeTab, setActiveTab] = useState('library');
  const [showFirstTimeSetup, setShowFirstTimeSetup] = useState(false);
  const [userPreferences, setUserPreferences] = useState(currentUser.preferences);

  // Check if first time setup is needed
  useEffect(() => {
    const hasCompletedSetup = localStorage.getItem('goodmultitracks_setup_complete');
    if (!hasCompletedSetup) {
      setShowFirstTimeSetup(true);
    }
  }, []);

  const handleFirstTimeSetupComplete = (selectedInstruments: TrackTag[], mainInstrument: TrackTag) => {
    const updatedPreferences = {
      ...userPreferences,
      selectedInstruments,
      mainInstrument,
    };
    setUserPreferences(updatedPreferences);
    localStorage.setItem('goodmultitracks_setup_complete', 'true');
    setShowFirstTimeSetup(false);
  };

  const handleSongUpdate = (updatedSong: Song) => {
    setSongs((prev) => prev.map((s) => (s.id === updatedSong.id ? updatedSong : s)));
    // Atualiza a música selecionada se for a mesma
    if (selectedSong && updatedSong.id === selectedSong.id) {
        setSelectedSong(updatedSong);
    }
  };

  // Setlist functions using new structure with items
  const handleCreateSetlist = (name: string, songId?: string) => {
    const newSetlist: Setlist = {
      id: `setlist-${Date.now()}`,
      name,
      items: songId ? [{ type: 'song', id: songId }] : [],
      createdBy: currentUser.id,
    };
    setSetlists((prev) => [...prev, newSetlist]);
  };

  const handleAddToSetlist = (setlistId: string, songId: string) => {
    setSetlists((prev) =>
      prev.map((setlist) => {
        if (setlist.id === setlistId) {
          const songAlreadyExists = setlist.items.some(
            (item) => item.type === 'song' && item.id === songId
          );
          if (songAlreadyExists) {
            return setlist;
          }
          return { ...setlist, items: [...setlist.items, { type: 'song', id: songId }] };
        }
        return setlist;
      })
    );
  };

  const handleUpdateSetlist = (updatedSetlist: Setlist) => {
    setSetlists((prev) =>
      prev.map((setlist) => (setlist.id === updatedSetlist.id ? updatedSetlist : setlist))
    );
  };

  const handleDeleteSetlist = (setlistId: string) => {
    setSetlists((prev) => prev.filter((setlist) => setlist.id !== setlistId));
  };

  const handleReorderSetlists = (reorderedSetlists: Setlist[]) => {
    setSetlists(reorderedSetlists);
  };

  const handleImportSetlist = () => {
    alert('Import functionality would connect to external services');
  };

  const handleCreateProject = (projectData: any) => {
    const colors = ['#60a5fa', '#ef4444', '#22c55e', '#f59e0b', '#a855f7', '#ec4899', '#14b8a6', '#f97316'];
    const mockTracks: AudioTrack[] = projectData.tracks.map((track: any, index: number) => ({
      id: track.id, name: track.channelName, type: 'other' as const,
      volume: 1.0, muted: false, solo: false,
      waveformData: Array.from({ length: 200 }, () => Math.random() * 0.8 + 0.2),
      color: colors[index % colors.length],
      output: 1, // Adicionado output
    }));

    const newProject: Song = {
      id: `project-${Date.now()}`,
      title: projectData.songName,
      artist: projectData.artist,
      duration: 180, // Duração mock
      key: projectData.key,
      tempo: projectData.tempo,
      version: '1.0',
      thumbnailUrl: projectData.coverArtPreview || '',
      tracks: mockTracks,
      markers: [],
      chords: [], // Manter a estrutura original
      chordMarkers: [], // Manter a estrutura original
      loops: [], mixPresets: [], notes: [], tags: ['project'],
      tempoChanges: [{ time: 0, tempo: projectData.tempo, timeSignature: projectData.timeSignature, }],
      permissions: { canEdit: true, canShare: true, canDelete: true, },
      source: 'project',
      lastModified: new Date(), // Adicionado
      createdBy: currentUser.id, // Adicionado
    };

    setSongs((prev) => [newProject, ...prev]);
    setSelectedSong(newProject);
    setPreviousView(activeView as any);
    setActiveView('player');
    setActiveTab('player');
  };

  const handleImportSong = () => {
    alert('Import song functionality needed.');
  };

  const handleSetlistSelect = (setlist: Setlist) => {
    const firstSongItem = setlist.items.find((item) => item.type === 'song');
    if (firstSongItem && firstSongItem.type === 'song') {
      const firstSong = songs.find((s) => s.id === firstSongItem.id);
      if (firstSong) {
        setSelectedSong(firstSong);
        setPreviousView('setlists');
        setActiveView('player');
        setActiveTab('player');
      }
    }
  };

  const handleSongClick = (songId: string) => {
    const song = songs.find((s) => s.id === songId);
    if (song) {
      handleSongSelect(song);
    }
  };

  const handleSongSelect = (song: Song) => {
    setSelectedSong(song);
    setPreviousView(activeView as any);
    setActiveView('player');
    setActiveTab('player');
  };

  const handleBackFromPlayer = () => {
    setActiveView(previousView);
    setActiveTab(previousView);
  };

  const handleCreateNewProject = (projectData: any) => {
    handleCreateProject(projectData);
  };

  // Show first time setup if needed
  if (showFirstTimeSetup) {
    return <FirstTimeSetup onComplete={handleFirstTimeSetupComplete} />;
  }

  if (performanceMode && selectedSong) {
    return (
      <PerformanceMode song={selectedSong} onClose={() => setPerformanceMode(false)} />
    );
  }

  return (
    // *** CORREÇÃO: Definido h-screen aqui para o container flex principal ***
    <div className="min-h-screen bg-gray-50 flex flex-col h-screen">
      {/* Desktop Header */}
      {activeView !== 'player' && (
        <header className="bg-white border-b sticky top-0 z-30 hidden md:block flex-shrink-0"> {/* Adicionado flex-shrink-0 */}
          <div className="px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <Music className="w-8 h-8 text-blue-600" />
                  <div>
                    {/* Título original do App.tsx */}
                    <h1 className="text-xl">GoodMultitracks</h1> 
                    <p className="text-sm text-gray-600">Professional Study Player</p>
                  </div>
                </div>
                
                <Separator orientation="vertical" className="h-8" />
                
                <nav className="flex items-center gap-2">
                  <Button
                    variant={activeView === 'library' ? 'default' : 'ghost'} // Variant original
                    onClick={() => setActiveView('library')}
                    className="gap-2"
                  >
                    <Music className="w-4 h-4" />
                    {t.library}
                  </Button>
                  <Button
                    variant={activeView === 'setlists' ? 'default' : 'ghost'} // Variant original
                    onClick={() => setActiveView('setlists')}
                    className="gap-2"
                  >
                    <ListMusic className="w-4 h-4" />
                    {t.setlists}
                  </Button>
                  <Button
                    variant={activeView === 'player' ? 'default' : 'ghost'} // Variant original
                    onClick={() => {
                      setPreviousView(activeView as any);
                      setActiveView('player');
                    }}
                    className="gap-2"
                    disabled={!selectedSong} // Desabilitar se nenhuma música selecionada
                  >
                    <Play className="w-4 h-4" />
                    Player
                  </Button>
                  <Button
                    variant={activeView === 'settings' ? 'default' : 'ghost'} // Variant original
                    onClick={() => setActiveView('settings')}
                    className="gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    {t.settings}
                  </Button>
                </nav>
              </div>
              
              <div className="flex items-center gap-4">
                {selectedSong && (
                  <div className="text-sm text-gray-600">
                    <Music className="w-4 h-4 inline mr-1" />
                    {selectedSong.title}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {/* Desktop Layout *** CORREÇÃO: Adicionado 'flex' e 'h-full' *** */}
        <div className="hidden md:flex h-full"> 
          {activeView === 'player' ? (
            // *** CORREÇÃO: Adicionado 'flex-1' e 'overflow-hidden' ***
            <div className="flex-1 h-full overflow-hidden"> 
              <DAWPlayer
                song={selectedSong}
                onSongUpdate={handleSongUpdate}
                onPerformanceMode={selectedSong ? () => setPerformanceMode(true) : undefined}
                onBack={handleBackFromPlayer}
                onCreateProject={handleCreateProject}
              />
            </div>
          ) : (
            // *** CORREÇÃO: Adicionado 'flex-1', 'h-full', 'overflow-y-auto' ***
            <div className="flex-1 container mx-auto px-6 py-6 h-full overflow-y-auto"> 
              {activeView === 'library' && (
                <SongLibrary
                  songs={songs}
                  setlists={setlists}
                  onSongSelect={handleSongSelect}
                  selectedSongId={selectedSong?.id}
                  onAddToSetlist={handleAddToSetlist}
                  onCreateSetlist={handleCreateSetlist}
                  onImportSetlist={handleImportSetlist}
                  onImportSong={handleImportSong}
                  onCreateProject={handleCreateNewProject}
                />
              )}

              {activeView === 'setlists' && (
                <SetlistManager
                  setlists={setlists}
                  songs={songs}
                  onSongClick={handleSongClick}
                  onCreateSetlist={handleCreateSetlist}
                  onUpdateSetlist={handleUpdateSetlist}
                  onDeleteSetlist={handleDeleteSetlist}
                  onReorderSetlists={handleReorderSetlists}
                />
              )}

              {activeView === 'settings' && <SettingsPanel />}
            </div>
          )}
        </div>

        {/* Mobile Layout *** CORREÇÃO: Ajustado h-full e pb-16 *** */}
        <div className="md:hidden h-full pb-16 overflow-y-auto"> {/* pb-16 para barra de navegação */}
          {activeTab === 'library' && (
            <div className="p-4">
              <SongLibrary
                songs={songs}
                setlists={setlists}
                onSongSelect={handleSongSelect}
                selectedSongId={selectedSong?.id}
                onAddToSetlist={handleAddToSetlist}
                onCreateSetlist={handleCreateSetlist}
                onImportSetlist={handleImportSetlist}
                onImportSong={handleImportSong}
                onCreateProject={handleCreateNewProject}
              />
            </div>
          )}

          {activeTab === 'setlists' && (
            <div className="p-4">
              <SetlistManager
                setlists={setlists}
                songs={songs}
                onSongClick={handleSongClick}
                onCreateSetlist={handleCreateSetlist}
                onUpdateSetlist={handleUpdateSetlist}
                onDeleteSetlist={handleDeleteSetlist}
                onReorderSetlists={handleReorderSetlists}
              />
            </div>
          )}

          {activeTab === 'player' && (
             // *** CORREÇÃO: h-full para preencher o espaço de scroll ***
            <div className="h-full">
              <DAWPlayer
                song={selectedSong}
                onSongUpdate={handleSongUpdate}
                onPerformanceMode={selectedSong ? () => setPerformanceMode(true) : undefined}
                onBack={handleBackFromPlayer}
                onCreateProject={handleCreateProject}
              />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-4">
              <SettingsPanel />
            </div>
          )}
        </div>
      </main>

      {/* Mobile Navigation (movido para fora do 'main' e 'flex-shrink-0') */}
      <div className="md:hidden flex-shrink-0">
        <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ThemeProvider>
  );
}