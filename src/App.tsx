import React, { useState, useEffect, Suspense } from 'react';
import { Music, ListMusic, Settings, Play } from 'lucide-react';

const DAWPlayer = React.lazy(() => import('./features/player/components/DAWPlayer').then(module => ({ default: module.DAWPlayer })));
const SettingsPanel = React.lazy(() => import('./components/SettingsPanel').then(module => ({ default: module.SettingsPanel })));

import { SongLibrary } from './features/library/components/SongLibrary';
import { SetlistManager } from './features/setlist/components/SetlistManager';
import { PerformanceMode } from './components/PerformanceMode';
import { FirstTimeSetup } from './components/FirstTimeSetup';
import { LoadingScreen } from './components/shared/LoadingScreen';
import { MobileNav } from './components/layout/MobileNav';
import { Button } from './components/ui/button';
import { Separator } from './components/ui/separator';
import { Song, Setlist, AudioTrack, TrackTag } from './types';
import { LanguageProvider, useLanguage } from './lib/LanguageContext';
import { ThemeProvider } from './lib/ThemeContext';
import { AudioContextProvider } from './features/player/context/AudioContextProvider';
import { storage } from './lib/localStorageManager';
import { ProjectService } from './services/ProjectService';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import { waveformStore } from './lib/waveformStore';

function AppContent() {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Initializing application...');
  const [songs, setSongs] = useState<Song[]>([]);
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [performanceMode, setPerformanceMode] = useState(false);
  const [activeView, setActiveView] = useState<'library' | 'setlists' | 'player' | 'settings'>('library');
  const [previousView, setPreviousView] = useState<'library' | 'setlists' | 'settings'>('library');
  const [activeTab, setActiveTab] = useState('library');
  const [showFirstTimeSetup, setShowFirstTimeSetup] = useState(false);
  const [userPreferences, setUserPreferences] = useState({
    theme: 'dark' as const,
    language: 'en' as const,
    outputDevice: 1,
  });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to initialize", error);
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    const hasCompletedSetup = storage.isFirstTimeSetupComplete();
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
    storage.setFirstTimeSetupComplete();
    setShowFirstTimeSetup(false);
  };

  const cleanupSongResources = React.useCallback((song: Song | null) => {
    if (!song) return;
    
    song.tracks.forEach(track => {
      if (track.url && track.url.startsWith('blob:')) {
        URL.revokeObjectURL(track.url);
      }
    });
    
    if (song.thumbnailUrl && song.thumbnailUrl.startsWith('blob:')) {
      URL.revokeObjectURL(song.thumbnailUrl);
    }
  }, []);

  const handleSongUpdate = (updatedSong: Song) => {
    setSongs((prev) => prev.map((s) => (s.id === updatedSong.id ? updatedSong : s)));
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
      createdBy: 'user-1',
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

  /**
   * Importa um projeto .gmtk
   */
  const handleImportProject = async (file: File) => {
    try {
      setIsLoading(true);
      setLoadingMessage('Loading project...');
      
      const loadedSong = await ProjectService.loadProject(file);
      
      // Adiciona à biblioteca e seleciona
      setSongs(prev => [loadedSong, ...prev]);
      setSelectedSong(loadedSong);
      setActiveView('player');
      
      toast.success(`Project "${loadedSong.title}" loaded successfully`);
    } catch (error) {
      console.error('Error importing project:', error);
      toast.error('Failed to load project. Please check if the file is valid.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Exporta o projeto atual como .gmtk
   */
  const handleExportProject = async (song: Song) => {
    setIsLoading(true);
    setLoadingMessage('Packaging project files... this may take a moment.');
    
    try {
      await ProjectService.saveProject(song);
      toast.success('Project exported successfully!');
    } catch (error) {
      console.error('Error exporting project:', error);
      toast.error('Failed to save project');
    } finally {
      setIsLoading(false);
    }
  };

  // Import setlist (opens hidden file selector)
  const setlistFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportSetlist = () => {
    setlistFileInputRef.current?.click();
  };

  const handleSetlistFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      // Support either a single setlist or an array of setlists
      const imported = Array.isArray(parsed) ? parsed : [parsed];
      const normalized = imported.map((s: any, idx: number) => ({
        id: s.id || `setlist-${Date.now()}-${idx}`,
        name: s.name || s.title || 'Imported Setlist',
        items: Array.isArray(s.items) ? s.items : [],
        createdBy: s.createdBy || 'imported',
      }));
      setSetlists(prev => [...prev, ...normalized]);
      toast.success('Setlist(s) imported successfully');
    } catch (error) {
      console.error('Failed to import setlist:', error);
      toast.error('Failed to import setlist. Make sure the file is valid JSON.');
    } finally {
      if (setlistFileInputRef.current) setlistFileInputRef.current.value = '';
    }
  };

  // Import song(s) — opens hidden file selector
  const songFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportSong = () => {
    songFileInputRef.current?.click();
  };

  const handleSongFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newSongs: Song[] = files.map((file, idx) => {
      const id = `song-${Date.now()}-${idx}`;
      const url = URL.createObjectURL(file);
      return {
        id,
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: '',
        duration: 0,
        key: '',
        tempo: 120,
        version: '1.0',
        thumbnailUrl: '',
        tracks: [{
          id: `track-${id}-0`,
          name: file.name,
          type: 'other' as const,
          volume: 1.0,
          muted: false,
          solo: false,
          color: '#60a5fa',
          output: 1,
          file,
          filename: file.name,
          url,
        }],
        markers: [],
        chords: [],
        chordMarkers: [],
        loops: [],
        mixPresets: [],
        notes: [],
        tags: [],
        tempoChanges: [{ time: 0, tempo: 120, timeSignature: '4/4' }],
        permissions: { canEdit: true, canShare: true, canDelete: true },
        source: 'imported',
        lastModified: new Date(),
        createdBy: 'user-1',
      };
    });

    setSongs(prev => [...newSongs, ...prev]);
    toast.success(`${newSongs.length} song(s) imported`);
    if (songFileInputRef.current) songFileInputRef.current.value = '';
  };

  // Wrapper for create project so child prop names stay consistent
  const handleCreateNewProject = async (projectData: any) => handleCreateProject(projectData);

  const handleCreateProject = async (projectData: any) => {
    const colors = ['#60a5fa', '#ef4444', '#22c55e', '#f59e0b', '#a855f7', '#ec4899', '#14b8a6', '#f97316'];
    
    const toastId = toast.loading('Creating project...', {
      description: 'Analyzing audio files and generating waveforms...'
    });
    
    try {
      const { generateWaveformFromFile } = await import('./features/player/utils/audioUtils');
      
      let maxDuration = 0;
      
      const tracksPromises = projectData.tracks.map(async (track: any, index: number) => {
        try {
          if (track.file) {
            const result = await generateWaveformFromFile(track.file);
            
            waveformStore.setWaveform(track.id, result.waveform);
            if (result.waveformOverview) {
              waveformStore.setOverview(track.id, result.waveformOverview);
            }
            
            if (result.duration > maxDuration) {
              maxDuration = result.duration;
            }
          } else {
            waveformStore.setWaveform(track.id, []);
          }
        } catch (error) {
          console.warn(`Failed to generate waveform for ${track.channelName}:`, error);
          waveformStore.setWaveform(track.id, []);
        }
        
        return {
          id: track.id, 
          name: track.channelName, 
          type: 'other' as const,
          volume: 1.0, 
          muted: false, 
          solo: false,
          color: colors[index % colors.length],
          output: 1,
          file: track.file,
          filename: track.file?.name,
        };
      });
    
      const tracks = await Promise.all(tracksPromises);
      const finalDuration = maxDuration > 0 ? maxDuration : 180;

      const newProject: Song = {
        id: `project-${Date.now()}`,
        title: projectData.songName,
        artist: projectData.artist,
        duration: Math.ceil(finalDuration),
        key: projectData.key,
        tempo: projectData.tempo,
        version: '1.0',
        thumbnailUrl: projectData.coverArtPreview || '',
        tracks,
        markers: [],
        chords: [],
        chordMarkers: [],
        loops: [], 
        mixPresets: [], 
        notes: [], 
        tags: ['project'],
        tempoChanges: [{ time: 0, tempo: projectData.tempo, timeSignature: projectData.timeSignature, }],
        permissions: { canEdit: true, canShare: true, canDelete: true, },
        source: 'project',
        lastModified: new Date(),
        createdBy: 'user-1',
      };

      setSongs((prev) => [newProject, ...prev]);
      setSelectedSong(newProject);
      setPreviousView(activeView as any);
      setActiveView('player');
      setActiveTab('player');
      
      toast.success('Project created successfully!', {
        id: toastId,
        description: `${projectData.tracks.length} tracks ready to mix`
      });
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Failed to create project', {
        id: toastId,
        description: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  };

  const handleBackFromPlayer = () => {
    setActiveView(previousView);
    setActiveTab(previousView);
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
    if (selectedSong && selectedSong.id !== song.id) {
      cleanupSongResources(selectedSong);
    }
    
    setSelectedSong(song);
    setPreviousView(activeView as any);
    setActiveView('player');
    setActiveTab('player');
  };

  React.useEffect(() => {
    return () => {
      if (selectedSong) {
        cleanupSongResources(selectedSong);
      }
    };
  }, [selectedSong, cleanupSongResources]);

  // Revoke object URLs from songs that were removed or had tracks/thumbnails replaced
  const prevSongsRef = React.useRef<Song[]>([]);
  React.useEffect(() => {
    const prev = prevSongsRef.current;

    // Build maps for quick lookup
    const prevMap = new Map(prev.map(s => [s.id, s] as const));
    const currMap = new Map(songs.map(s => [s.id, s] as const));

    // 1) Songs removed entirely -> revoke resources
    for (const [id, prevSong] of prevMap.entries()) {
      if (!currMap.has(id)) {
        cleanupSongResources(prevSong);
      }
    }

    // 2) Songs present in both but with removed tracks or changed thumbnails
    for (const [id, currSong] of currMap.entries()) {
      const prevSong = prevMap.get(id);
      if (!prevSong) continue;

      const prevTrackUrls = new Set(prevSong.tracks.map(t => t.url).filter(Boolean));
      const currTrackUrls = new Set(currSong.tracks.map(t => t.url).filter(Boolean));

      // Revoke any track urls that existed before but not now
      for (const url of prevTrackUrls) {
        if (!currTrackUrls.has(url) && typeof url === 'string' && url.startsWith('blob:')) {
          try { URL.revokeObjectURL(url); } catch (e) { console.warn('Failed to revoke track url', e); }
        }
      }

      // Thumbnail changed or removed
      if (prevSong.thumbnailUrl && prevSong.thumbnailUrl !== currSong.thumbnailUrl && prevSong.thumbnailUrl.startsWith('blob:')) {
        try { URL.revokeObjectURL(prevSong.thumbnailUrl); } catch (e) { console.warn('Failed to revoke thumbnail url', e); }
      }
    }

    prevSongsRef.current = songs;
  }, [songs, cleanupSongResources]);

  if (isLoading) {
    return <LoadingScreen progress={loadingProgress} message={loadingMessage} />;
  }

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
    <div className="min-h-screen bg-background text-foreground flex flex-col h-screen">
      {/* Hidden inputs for imports */}
      <input ref={setlistFileInputRef} type="file" accept=".json" onChange={handleSetlistFileSelected} className="hidden" />
      <input ref={songFileInputRef} type="file" accept="audio/*" onChange={handleSongFileSelected} multiple className="hidden" />
      {activeView !== 'player' && (
        <header className="bg-background border-b sticky top-0 z-30 hidden md:block flex-shrink-0">
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
                
                <nav className="flex items-center gap-2">
                  <Button
                    variant={activeView === 'library' ? 'default' : 'ghost'}
                    onClick={() => setActiveView('library')}
                    className="gap-2"
                  >
                    <Music className="w-4 h-4" />
                    Library
                  </Button>
                  <Button
                    variant={activeView === 'setlists' ? 'default' : 'ghost'}
                    onClick={() => setActiveView('setlists')}
                    className="gap-2"
                  >
                    <ListMusic className="w-4 h-4" />
                    Setlists
                  </Button>
                  <Button
                    variant={activeView === 'player' ? 'default' : 'ghost'}
                    onClick={() => {
                      setPreviousView(activeView as any);
                      setActiveView('player');
                    }}
                    className="gap-2"
                    disabled={!selectedSong}
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
                    Settings
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

      <main className="flex-1 overflow-hidden">
        <div className="hidden md:flex h-full"> 
          {activeView === 'player' ? (
            <div className="flex-1 h-full overflow-hidden"> 
              <Suspense fallback={<LoadingScreen progress={50} message="Loading Player..." />}>
                <DAWPlayer
                  song={selectedSong}
                  onSongUpdate={handleSongUpdate}
                  onPerformanceMode={selectedSong ? () => setPerformanceMode(true) : undefined}
                  onBack={handleBackFromPlayer}
                  onCreateProject={handleCreateProject}
                  onExportProject={handleExportProject}
                />
              </Suspense>
            </div>
          ) : (
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
                  onImportProject={handleImportProject}
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

              {activeView === 'settings' && (
                <Suspense fallback={<LoadingScreen progress={50} message="Loading Settings..." />}>
                  <SettingsPanel />
                </Suspense>
              )}
            </div>
          )}
        </div>

        <div className="md:hidden h-full pb-16 overflow-y-auto">
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
                onImportProject={handleImportProject}
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
            <div className="h-full">
              <Suspense fallback={<LoadingScreen progress={50} message="Loading Player..." />}>
                <DAWPlayer
                  song={selectedSong}
                  onSongUpdate={handleSongUpdate}
                  onPerformanceMode={selectedSong ? () => setPerformanceMode(true) : undefined}
                  onBack={handleBackFromPlayer}
                  onCreateProject={handleCreateProject}
                  onExportProject={handleExportProject}
                />
              </Suspense>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-4">
              <Suspense fallback={<LoadingScreen progress={50} message="Loading Settings..." />}>
                <SettingsPanel />
              </Suspense>
            </div>
          )}
        </div>
      </main>

      <div className="md:hidden flex-shrink-0">
        <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <AudioContextProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </ThemeProvider>
    </AudioContextProvider>
  );
}