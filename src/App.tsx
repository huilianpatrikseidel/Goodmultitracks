import React, { useState } from 'react';
import { Music, ListMusic, Settings, Play } from 'lucide-react';
import { DAWPlayer } from './components/DAWPlayer';
import { SongLibrary } from './components/SongLibrary';
import { SetlistManager } from './components/SetlistManager';
import { SettingsPanel } from './components/SettingsPanel';
import { PerformanceMode } from './components/PerformanceMode';
import { MobileNav } from './components/MobileNav';
import { Button } from './components/ui/button';
import { Separator } from './components/ui/separator';
import { mockSongs, mockSetlists, currentUser } from './lib/mockData';
import { Song, Setlist, AudioTrack } from './types';
import { LanguageProvider, useLanguage } from './lib/LanguageContext';

function AppContent() {
  const { t } = useLanguage();
  const [songs, setSongs] = useState<Song[]>(mockSongs);
  const [setlists, setSetlists] = useState<Setlist[]>(mockSetlists);
  const [selectedSong, setSelectedSong] = useState<Song | null>(mockSongs[0]);
  const [performanceMode, setPerformanceMode] = useState(false);
  const [activeView, setActiveView] = useState<'library' | 'setlists' | 'player' | 'settings'>('library');
  const [previousView, setPreviousView] = useState<'library' | 'setlists' | 'settings'>('library');
  const [activeTab, setActiveTab] = useState('library');

  const handleSongUpdate = (updatedSong: Song) => {
    setSongs((prev) => prev.map((s) => (s.id === updatedSong.id ? updatedSong : s)));
    setSelectedSong(updatedSong);
  };

  const handleCreateSetlist = (name: string, songId?: string) => {
    const newSetlist: Setlist = {
      id: `setlist-${Date.now()}`,
      name,
      songIds: songId ? [songId] : [],
      createdBy: currentUser.id,
      sharedWith: [],
    };
    setSetlists((prev) => [...prev, newSetlist]);
  };

  const handleAddToSetlist = (setlistId: string, songId: string) => {
    setSetlists((prev) =>
      prev.map((setlist) => {
        if (setlist.id === setlistId) {
          // Don't add if already in setlist
          if (setlist.songIds.includes(songId)) {
            return setlist;
          }
          return {
            ...setlist,
            songIds: [...setlist.songIds, songId],
          };
        }
        return setlist;
      })
    );
  };

  const handleImportSetlist = () => {
    // Mock import functionality
    alert('Import functionality would connect to external services like Planning Center or ChurchTools');
  };

  const handleCreateProject = (projectData: any) => {
    // Create tracks from the uploaded files
    const colors = ['#60a5fa', '#ef4444', '#22c55e', '#f59e0b', '#a855f7', '#ec4899', '#14b8a6', '#f97316'];
    const mockTracks: AudioTrack[] = projectData.tracks.map((track: any, index: number) => ({
      id: track.id,
      name: track.channelName,
      type: 'other' as const,
      volume: 1.0, // 0dB unity gain
      muted: false,
      solo: false,
      waveformData: Array.from({ length: 200 }, () => Math.random() * 0.8 + 0.2),
      color: colors[index % colors.length],
    }));

    const newProject: Song = {
      id: `project-${Date.now()}`,
      title: projectData.songName,
      artist: projectData.artist,
      duration: 180, // 3 minutes default (would be determined by audio file in real app)
      key: projectData.key,
      tempo: projectData.tempo,
      version: '1.0',
      thumbnailUrl: projectData.coverArtPreview || '',
      tracks: mockTracks,
      markers: [],
      chords: [],
      loops: [],
      mixPresets: [],
      notes: [],
      tags: [],
      tempoChanges: [{
        time: 0,
        tempo: projectData.tempo,
        timeSignature: projectData.timeSignature,
      }],
      chordMarkers: [],
      permissions: {
        canEdit: true,
        canShare: true,
        canDelete: true,
      },
      source: 'project',
    };

    // Add project to songs library
    setSongs((prev) => [...prev, newProject]);
    setSelectedSong(newProject);
    setPreviousView(activeView as any);
    setActiveView('player');
    setActiveTab('player');
  };

  const handleImportSong = () => {
    // Mock import functionality
    alert('Import functionality: Select a .zip file containing audio files and project.xml to import a song into the library.');
  };

  const handleSetlistSelect = (setlist: Setlist) => {
    if (setlist.songIds.length > 0) {
      const firstSong = songs.find((s) => s.id === setlist.songIds[0]);
      if (firstSong) {
        setSelectedSong(firstSong);
        setPreviousView('setlists');
        setActiveView('player');
        setActiveTab('player');
      }
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
    // Create the project and navigate to player
    handleCreateProject(projectData);
  };

  if (performanceMode && selectedSong) {
    return (
      <PerformanceMode song={selectedSong} onClose={() => setPerformanceMode(false)} />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Desktop Header with Integrated Navigation - Hidden when in player mode */}
      {activeView !== 'player' && (
        <header className="bg-white border-b sticky top-0 z-30 hidden md:block">
          <div className="px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <Music className="w-8 h-8 text-blue-600" />
                  <div>
                    <h1 className="text-xl">GoodMultitracks</h1>
                    <p className="text-sm text-gray-600">Professional Study Player</p>
                  </div>
                </div>
                
                <Separator orientation="vertical" className="h-8" />
                
                {/* Integrated Navigation */}
                <nav className="flex items-center gap-2">
                  <Button
                    variant={activeView === 'library' ? 'default' : 'ghost'}
                    onClick={() => setActiveView('library')}
                    className="gap-2"
                  >
                    <Music className="w-4 h-4" />
                    {t.library}
                  </Button>
                  <Button
                    variant={activeView === 'setlists' ? 'default' : 'ghost'}
                    onClick={() => setActiveView('setlists')}
                    className="gap-2"
                  >
                    <ListMusic className="w-4 h-4" />
                    {t.setlists}
                  </Button>
                  <Button
                    variant={activeView === 'player' ? 'default' : 'ghost'}
                    onClick={() => {
                      setPreviousView(activeView as any);
                      setActiveView('player');
                    }}
                    className="gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Player
                  </Button>
                  <Button
                    variant={activeView === 'settings' ? 'default' : 'ghost'}
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
        {/* Desktop Layout */}
        <div className="hidden md:block h-full">
          {activeView === 'player' ? (
            <div className="h-screen">
              <DAWPlayer
                song={selectedSong}
                onSongUpdate={handleSongUpdate}
                onPerformanceMode={selectedSong ? () => setPerformanceMode(true) : undefined}
                onBack={handleBackFromPlayer}
                onCreateProject={handleCreateProject}
              />
            </div>
          ) : (
            <div className="container mx-auto px-6 py-6">
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
                  onSetlistSelect={handleSetlistSelect}
                  onCreateSetlist={handleCreateSetlist}
                />
              )}

              {activeView === 'settings' && <SettingsPanel />}
            </div>
          )}
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden h-full">
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
                onSetlistSelect={handleSetlistSelect}
                onCreateSetlist={handleCreateSetlist}
              />
            </div>
          )}

          {activeTab === 'player' && (
            <div className="h-[calc(100vh-4rem)]">
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

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
