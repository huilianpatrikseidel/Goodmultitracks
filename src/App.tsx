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
import { Song, Setlist, AudioTrack, SetlistItem } from './types'; // Ensure SetlistItem is imported if using recent Setlist changes
import { LanguageProvider, useLanguage } from './lib/LanguageContext'; // Keep LanguageProvider import

// AppContent remains largely the same, but WITHOUT the LanguageProvider wrapper inside it
function AppContent() {
  const { t } = useLanguage(); // Now this should work correctly
  const [songs, setSongs] = useState<Song[]>(mockSongs);
  const [setlists, setSetlists] = useState<Setlist[]>(mockSetlists);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null); // Initialize as null
  const [performanceMode, setPerformanceMode] = useState(false);
  const [activeView, setActiveView] = useState<'library' | 'setlists' | 'player' | 'settings'>('library');
  const [previousView, setPreviousView] = useState<'library' | 'setlists' | 'settings'>('library');
  const [activeTab, setActiveTab] = useState('library');

  // --- Handlers (Keep all your existing handlers here) ---
  const handleSongUpdate = (updatedSong: Song) => {
      setSongs((prev) => prev.map((s) => (s.id === updatedSong.id ? updatedSong : s)));
      if (selectedSong?.id === updatedSong.id) { setSelectedSong(updatedSong); }
  };

  const handleCreateSetlist = (name: string, songId?: string) => { // Updated based on mockData/types
    const newSetlist: Setlist = {
      id: `setlist-${Date.now().toString(36)}`,
      name,
      items: songId ? [{ type: 'song', id: songId }] : [], // Use items array
      createdBy: currentUser.id,
    };
    setSetlists((prev) => [newSetlist, ...prev]);
  };

   const handleUpdateSetlist = (updatedSetlist: Setlist) => {
       setSetlists(prev => prev.map(sl => sl.id === updatedSetlist.id ? updatedSetlist : sl));
   };

   const handleDeleteSetlist = (setlistId: string) => {
       setSetlists(prev => prev.filter(sl => sl.id !== setlistId));
   };


  const handleAddToSetlist = (setlistId: string, songId: string) => { // Updated based on mockData/types
    setSetlists((prev) =>
      prev.map((setlist) => {
        if (setlist.id === setlistId) {
          if (setlist.items.some(item => item.type === 'song' && item.id === songId)) {
            return setlist;
          }
          const newSongItem: SetlistItem = { type: 'song', id: songId };
          return { ...setlist, items: [...setlist.items, newSongItem] }; // Use items array
        }
        return setlist;
      })
    );
  };

  const handleCreateSetlistAndAddSong = (name: string, songId: string) => { // Needed by AddToSetlistDialog
    const newSetlist: Setlist = {
      id: `setlist-${Date.now().toString(36)}`,
      name,
      items: [{ type: 'song', id: songId }],
      createdBy: currentUser.id,
    };
    setSetlists((prev) => [newSetlist, ...prev]);
  };


  const handleImportSetlist = () => { alert('Import functionality needed.'); };
  const handleCreateProject = (projectData: any) => { /* ... (mantido como antes) ... */
     const colors = ['#60a5fa', '#ef4444', '#22c55e', '#f59e0b', '#a855f7', '#ec4899', '#14b8a6', '#f97316'];
     const mockTracks: AudioTrack[] = projectData.tracks.map((track: any, index: number) => ({ id: `track-proj-${Date.now().toString(36)}-${index}`, name: track.channelName, type: 'other' as const, volume: 1.0, muted: false, solo: false, waveformData: Array.from({ length: 200 }, () => Math.random() * 0.8 + 0.2), color: colors[index % colors.length], output: 1 }));
     const newProject: Song = { id: `project-${Date.now().toString(36)}`, title: projectData.songName || 'New Project', artist: projectData.artist || 'Unknown Artist', duration: 180, key: projectData.key || 'C Major', tempo: projectData.tempo || 120, version: '1.0', thumbnailUrl: projectData.coverArtPreview || '', tracks: mockTracks, markers: [], chords: [], loops: [], mixPresets: [], notes: [], tags: ['project'], tempoChanges: [{ time: 0, tempo: projectData.tempo || 120, timeSignature: projectData.timeSignature || '4/4', }], chordMarkers: [], permissions: { canEdit: true, canShare: false, canDelete: true, }, source: 'project', lastModified: new Date(), createdBy: currentUser.id, };
     setSongs((prev) => [newProject, ...prev]); setSelectedSong(newProject); setPreviousView(activeView as any); setActiveView('player'); setActiveTab('player');
  };
  const handleImportSong = () => { /* ... (mantido como antes) ... */
     const newImportedSong: Song = { id: `imported-${Date.now().toString(36)}`, title: `Imported Song ${songs.filter(s => s.source !== 'project').length + 1}`, artist: 'Various Artists', key: 'G Major', tempo: 100, duration: 210, tracks: [], markers: [], chords: [], chordMarkers: [], loops: [], mixPresets: [], notes: [], thumbnailUrl: '', version: 1, lastModified: new Date(), createdBy: currentUser.id, tags: ['imported'], source: 'imported', tempoChanges: [{ time: 0, tempo: 100, timeSignature: '4/4' }], permissions: { canEdit: false, canShare: false, canDelete: true }, };
      setSongs(prev => [newImportedSong, ...prev]); alert('Simulated importing a new song.');
  };

  const handleNavigateToSong = (songId: string) => {
      const songToSelect = songs.find(s => s.id === songId);
      if (songToSelect) {
          setSelectedSong(songToSelect);
          setPreviousView(activeView as any);
          setActiveView('player');
          setActiveTab('player');
      } else {
          console.error("Song not found:", songId);
          alert("Could not find the selected song.");
      }
  };

  const handleSongSelectFromLibrary = (song: Song) => {
    handleNavigateToSong(song.id);
  };

  const handleBackFromPlayer = () => {
    setActiveView(previousView);
    setActiveTab(previousView);
  };
   // --- Fim Handlers ---

  if (performanceMode && selectedSong) {
       return (<PerformanceMode song={selectedSong} onClose={() => setPerformanceMode(false)} />);
  }

  // O return de AppContent agora é apenas o JSX da UI
  return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
          {/* Desktop Header */}
          {activeView !== 'player' && (
             <header className="bg-white border-b sticky top-0 z-30 hidden md:block flex-shrink-0">
                 {/* ... (Conteúdo do Header mantido) ... */}
                 <div className="px-6 py-3"><div className="flex items-center justify-between"><div className="flex items-center gap-6"><div className="flex items-center gap-3"><Music className="w-8 h-8 text-blue-600"/><div><h1 className="text-xl font-semibold">GoodMultitracks</h1><p className="text-sm text-gray-600">Professional Study Player</p></div></div><Separator orientation="vertical" className="h-8"/><nav className="flex items-center gap-1"><Button variant={activeView==='library'?'secondary':'ghost'} onClick={()=>setActiveView('library')} className="gap-1.5 px-3 h-9"><Music className="w-4 h-4"/>{t.library}</Button><Button variant={activeView==='setlists'?'secondary':'ghost'} onClick={()=>setActiveView('setlists')} className="gap-1.5 px-3 h-9"><ListMusic className="w-4 h-4"/>{t.setlists}</Button><Button variant={activeView==='player'?'secondary':'ghost'} onClick={()=>{if(selectedSong){setPreviousView(activeView as any);setActiveView('player')}}} className="gap-1.5 px-3 h-9" disabled={!selectedSong}><Play className="w-4 h-4"/>Player</Button><Button variant={activeView==='settings'?'secondary':'ghost'} onClick={()=>setActiveView('settings')} className="gap-1.5 px-3 h-9"><Settings className="w-4 h-4"/>{t.settings}</Button></nav></div><div className="flex items-center gap-4">{selectedSong&&(<div className="text-sm text-gray-600 flex items-center gap-1"><Music className="w-4 h-4 inline opacity-70"/><span className="truncate max-w-[200px]">{selectedSong.title}</span></div>)}</div></div></div>
             </header>
          )}

          {/* Main Content */}
          <main className="flex-1 overflow-hidden">
            {/* Desktop Layout */}
            <div className="hidden md:flex h-full">
              {activeView === 'player' ? (
                <div className="flex-1 h-full overflow-hidden">
                  <DAWPlayer song={selectedSong} onSongUpdate={handleSongUpdate} onPerformanceMode={selectedSong ? () => setPerformanceMode(true) : undefined} onBack={handleBackFromPlayer} onCreateProject={handleCreateProject} />
                </div>
              ) : (
                <div className="flex-1 container mx-auto px-6 py-6 h-full overflow-y-auto">
                  {activeView === 'library' && (
                    <SongLibrary
                      songs={songs} setlists={setlists}
                      onSongSelect={handleSongSelectFromLibrary}
                      selectedSongId={selectedSong?.id}
                      onAddToSetlist={handleAddToSetlist}
                      onCreateSetlist={handleCreateSetlistAndAddSong} // Usa a função correta
                      onImportSetlist={handleImportSetlist}
                      onImportSong={handleImportSong}
                      onCreateProject={handleCreateProject}
                    />
                  )}
                  {activeView === 'setlists' && (
                    <SetlistManager
                      setlists={setlists} songs={songs}
                      onSongClick={handleNavigateToSong}
                      onCreateSetlist={handleCreateSetlist} // Usa a função correta
                      onUpdateSetlist={handleUpdateSetlist}
                      onDeleteSetlist={handleDeleteSetlist}
                    />
                  )}
                  {activeView === 'settings' && <SettingsPanel />}
                </div>
              )}
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden h-full pb-16 overflow-y-auto">
                 {activeTab === 'library' && <div className="p-4"><SongLibrary songs={songs} setlists={setlists} onSongSelect={handleSongSelectFromLibrary} selectedSongId={selectedSong?.id} onAddToSetlist={handleAddToSetlist} onCreateSetlist={handleCreateSetlistAndAddSong} onImportSetlist={handleImportSetlist} onImportSong={handleImportSong} onCreateProject={handleCreateProject}/></div>}
                 {activeTab === 'setlists' && <div className="p-4"><SetlistManager setlists={setlists} songs={songs} onSongClick={handleNavigateToSong} onCreateSetlist={handleCreateSetlist} onUpdateSetlist={handleUpdateSetlist} onDeleteSetlist={handleDeleteSetlist}/></div>}
                 {activeTab === 'player' && <div className="h-full"><DAWPlayer song={selectedSong} onSongUpdate={handleSongUpdate} onPerformanceMode={selectedSong?()=>setPerformanceMode(true):undefined} onBack={handleBackFromPlayer} onCreateProject={handleCreateProject}/></div>}
                 {activeTab === 'settings' && <div className="p-4"><SettingsPanel/></div>}
            </div>
          </main>

          {/* Mobile Navigation */}
          <div className="md:hidden flex-shrink-0">
            <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </div>
  );
}

// O componente App agora apenas envolve AppContent com o Provider
export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}