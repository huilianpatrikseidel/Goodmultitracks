import React, { useState, useMemo } from 'react';
import { Search, Music, Upload, ListPlus, Plus, SortAsc, SortDesc, ArrowDownAZ, ArrowUpAZ, Clock, View, List, Grid, ImageOff } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Song, Setlist } from '../../../types';
import { AddToSetlistDialog } from '../../setlist/components/AddToSetlistDialog';
import { CreateProjectDialog } from './CreateProjectDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '../../../components/ui/toggle-group';
import { cn } from '../../../components/ui/utils';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { storage } from '../../../lib/localStorageManager';

interface SongLibraryProps {
  songs: Song[];
  setlists: Setlist[];
  onSongSelect: (song: Song) => void;
  selectedSongId?: string;
  onAddToSetlist: (setlistId: string, songId: string) => void;
  onCreateSetlist: (name: string, songId: string) => void;
  onImportSetlist: () => void;
  onImportSong: () => void;
  onCreateProject: (projectData: any) => void;
  onImportProject?: (file: File) => void; // NOVO: importar .gmtk
}

type SortOption =
    | 'title_asc' | 'title_desc'
    | 'artist_asc' | 'artist_desc'
    | 'date_desc' | 'date_asc';

type ViewMode = 'grid-image' | 'grid-compact' | 'list';

export function SongLibrary({
  songs,
  setlists,
  onSongSelect,
  selectedSongId,
  onAddToSetlist,
  onCreateSetlist,
  onImportSetlist,
  onImportSong,
  onCreateProject,
  onImportProject,
}: SongLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [addToSetlistDialogOpen, setAddToSetlistDialogOpen] = useState(false);
  const [selectedSongForSetlist, setSelectedSongForSetlist] = useState<Song | null>(null);
  const [createProjectDialogOpen, setCreateProjectDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'imported' | 'projects'>('imported');
  const [sortOrder, setSortOrder] = useState<SortOption>('date_desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid-image');

  // Handler para file input de importação de projetos
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportProject) {
      onImportProject(file);
      // Reset input para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Contagens totais (baseado na busca)
  const { totalImportedCount, totalProjectsCount } = useMemo(() => {
    let imported = 0;
    let projects = 0;
    songs.forEach(song => {
        const matchesSearch =
            song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            song.artist.toLowerCase().includes(searchQuery.toLowerCase());
        if (matchesSearch) {
            if (song.source === 'project') {
                projects++;
            } else {
                imported++;
            }
        }
    });
    return { totalImportedCount: imported, totalProjectsCount: projects };
  }, [songs, searchQuery]);


  // Lista filtrada e ordenada para exibição
  const songsToDisplay = useMemo(() => {
    const listToFilter = songs.filter(song => {
        const isInCorrectTab = activeTab === 'imported' ? song.source !== 'project' : song.source === 'project';
        const matchesSearch =
            song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            song.artist.toLowerCase().includes(searchQuery.toLowerCase());
        return isInCorrectTab && matchesSearch;
    });

    return listToFilter.sort((a, b) => {
        switch (sortOrder) {
            case 'title_asc': return a.title.localeCompare(b.title);
            case 'title_desc': return b.title.localeCompare(a.title);
            case 'artist_asc': return a.artist.localeCompare(b.artist);
            case 'artist_desc': return b.artist.localeCompare(a.artist);
            case 'date_asc':
                const dateA = a.lastModified || new Date(0);
                const dateB = b.lastModified || new Date(0);
                return dateA.getTime() - dateB.getTime();
            case 'date_desc':
            default:
                const dateDescA = a.lastModified || new Date(0);
                const dateDescB = b.lastModified || new Date(0);
                return dateDescB.getTime() - dateDescA.getTime();
        }
    });
  }, [songs, searchQuery, sortOrder, activeTab]);

  const formatDuration = (duration: number) => {
      const mins = Math.floor(duration / 60);
      const secs = String(duration % 60).padStart(2, '0');
      return `${mins}:${secs}`;
  };

  // ---- Componentes de Renderização (Sem alteração) ----
  const renderSongCardImage = (song: Song) => (
    <Card key={song.id} className={cn("cursor-pointer transition-all hover:shadow-md overflow-hidden", selectedSongId === song.id ? 'ring-2 ring-blue-500' : '')} onClick={() => onSongSelect(song)}>
      {song.thumbnailUrl ? (<div className="aspect-video w-full bg-gray-200"><img src={song.thumbnailUrl} alt={song.title} className="w-full h-full object-cover"/></div>) : (<div className="aspect-video w-full bg-gray-100 flex items-center justify-center text-gray-400"><Music className="w-12 h-12" /></div>)}
      <CardContent className="p-4 space-y-2">
        <div><h3 className="truncate font-medium">{song.title}</h3><p className="text-sm text-gray-600 truncate">{song.artist}</p></div>
        <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap"><Badge variant="outline">{song.key}</Badge><Badge variant="outline">{song.tempo} BPM</Badge><Badge variant="outline">{formatDuration(song.duration)}</Badge></div>
        <Button variant="outline" size="sm" className="w-full mt-3" onClick={(e) => { e.stopPropagation(); setSelectedSongForSetlist(song); setAddToSetlistDialogOpen(true); }}><ListPlus className="w-4 h-4 mr-2" />Add to Setlist</Button>
      </CardContent>
    </Card>
  );
  const renderSongCardCompact = (song: Song) => (
      <Card key={song.id} className={cn("cursor-pointer transition-all hover:shadow-md", selectedSongId === song.id ? 'ring-2 ring-blue-500' : '')} onClick={() => onSongSelect(song)}>
        <CardContent className="p-3 space-y-1.5">
          <div><h3 className="truncate font-medium text-sm">{song.title}</h3><p className="text-xs text-gray-500 truncate">{song.artist}</p></div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 flex-wrap"><Badge variant="secondary" className="px-1.5 py-0.5 text-[10px]">{song.key}</Badge><Badge variant="secondary" className="px-1.5 py-0.5 text-[10px]">{song.tempo} BPM</Badge><Badge variant="secondary" className="px-1.5 py-0.5 text-[10px]">{formatDuration(song.duration)}</Badge></div>
          <Button variant="ghost" size="sm" className="w-full mt-2 h-7 text-xs" onClick={(e) => { e.stopPropagation(); setSelectedSongForSetlist(song); setAddToSetlistDialogOpen(true); }}><ListPlus className="w-3 h-3 mr-1" />Add to Setlist</Button>
        </CardContent>
      </Card>
  );
  const renderSongListItem = (song: Song) => (
    <div key={song.id} className={cn("flex items-center gap-4 p-3 border-b cursor-pointer hover:bg-gray-100 transition-colors", selectedSongId === song.id ? 'bg-blue-50' : '')} onClick={() => onSongSelect(song)}>
      <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">{song.thumbnailUrl ? (<img src={song.thumbnailUrl} alt={song.title} className="w-full h-full object-cover rounded" />) : (<Music className="w-5 h-5 text-gray-400" />)}</div>
      <div className="flex-1 min-w-0"><p className="truncate font-medium">{song.title}</p><p className="text-sm text-gray-500 truncate">{song.artist}</p></div>
      <div className="hidden sm:flex items-center gap-3 text-sm text-gray-600 w-48 flex-shrink-0 justify-end"><Badge variant="outline" className="w-16 justify-center truncate">{song.key}</Badge><span className="w-16 text-right truncate">{song.tempo} BPM</span><span className="w-12 text-right">{formatDuration(song.duration)}</span></div>
      <div className="flex-shrink-0"><Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); setSelectedSongForSetlist(song); setAddToSetlistDialogOpen(true); }} aria-label={`Add ${song.title} to setlist`}><ListPlus className="w-4 h-4" /></Button></div>
    </div>
  );
  // ---- Fim dos Componentes de Renderização ----

  const getContainerClasses = () => {
      switch(viewMode) {
          case 'grid-compact': return "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3";
          case 'list': return "flex flex-col border rounded-md overflow-hidden";
          case 'grid-image': default: return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4";
      }
  }
  const renderFunction = viewMode === 'list' ? renderSongListItem : viewMode === 'grid-compact' ? renderSongCardCompact : renderSongCardImage;


  return (
    // *** CORREÇÃO: Layout flexível vertical que preenche a altura ***
    <div className="space-y-4 flex flex-col h-full overflow-hidden">
      {/* Hidden file input para importar projetos */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".gmtk,.gmtkmock"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {/* Barra de Ferramentas (shrink-0) */}
      <div className="flex flex-wrap items-center gap-2 justify-between flex-shrink-0">
        {/* Lado Esquerdo */}
        <div className="flex items-center gap-2 flex-grow sm:flex-grow-0">
          <div className="relative flex-grow sm:flex-grow-0 sm:w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"/><Input placeholder="Search songs..." value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} className="pl-9"/></div>
          <Button onClick={()=>setCreateProjectDialogOpen(true)} size="sm" className="hidden sm:inline-flex"><Plus className="w-4 h-4 mr-1"/> Create</Button>
          <Button variant="outline" onClick={onImportSong} size="sm" className="hidden sm:inline-flex"><Upload className="w-4 h-4 mr-1"/> Import</Button>
          <Button variant="outline" onClick={()=>fileInputRef.current?.click()} size="sm" className="hidden sm:inline-flex"><Upload className="w-4 h-4 mr-1"/> Import Project</Button>
          <Button onClick={()=>setCreateProjectDialogOpen(true)} size="icon" className="sm:hidden"><Plus className="w-4 h-4"/></Button>
          <Button variant="outline" onClick={onImportSong} size="icon" className="sm:hidden"><Upload className="w-4 h-4"/></Button>
        </div>
        {/* Lado Direito */}
        <div className="flex items-center gap-2">
          <Select value={sortOrder} onValueChange={(value)=>setSortOrder(value as SortOption)}><SelectTrigger className="w-[180px] h-9 text-xs sm:text-sm"><SelectValue placeholder="Sort by..."/></SelectTrigger><SelectContent><SelectItem value="date_desc"><Clock className="w-4 h-4 mr-2 inline"/>Date Added (Newest)</SelectItem><SelectItem value="date_asc"><Clock className="w-4 h-4 mr-2 inline"/>Date Added (Oldest)</SelectItem><SelectItem value="title_asc"><ArrowDownAZ className="w-4 h-4 mr-2 inline"/>Title (A-Z)</SelectItem><SelectItem value="title_desc"><ArrowUpAZ className="w-4 h-4 mr-2 inline"/>Title (Z-A)</SelectItem><SelectItem value="artist_asc"><ArrowDownAZ className="w-4 h-4 mr-2 inline"/>Artist (A-Z)</SelectItem><SelectItem value="artist_desc"><ArrowUpAZ className="w-4 h-4 mr-2 inline"/>Artist (Z-A)</SelectItem></SelectContent></Select>
          <ToggleGroup type="single" value={viewMode} onValueChange={(v)=>{if(v)setViewMode(v as ViewMode)}} className="h-9"><ToggleGroupItem value="grid-image" className="px-2"><Grid className="w-4 h-4"/></ToggleGroupItem><ToggleGroupItem value="grid-compact" className="px-2"><ImageOff className="w-4 h-4"/></ToggleGroupItem><ToggleGroupItem value="list" className="px-2"><List className="w-4 h-4"/></ToggleGroupItem></ToggleGroup>
        </div>
      </div>

      {/* Abas e Conteúdo (flex-1) */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'imported' | 'projects')} className="w-full flex flex-col flex-1 overflow-hidden">
        {/* Lista de Abas (shrink-0) */}
        <TabsList className="w-full justify-start flex-shrink-0">
          <TabsTrigger value="imported" className="flex items-center gap-1.5">
            Imported
            <Badge variant={activeTab === 'imported' ? 'default' : 'secondary'} className="ml-1 px-1.5 text-[10px]">{totalImportedCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-1.5">
            Projects
            <Badge variant={activeTab === 'projects' ? 'default' : 'secondary'} className="ml-1 px-1.5 text-[10px]">{totalProjectsCount}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Conteúdo da Aba (flex-1 e overflow) */}
        <TabsContent value={activeTab} className="mt-4 flex-1 overflow-hidden">
          {/* *** CORREÇÃO: Adicionado ScrollArea *** */}
          <ScrollArea className="h-full pr-3"> {/* pr-3 para dar espaço à barra de rolagem */}
            {songsToDisplay.length > 0 ? (
              <div className={getContainerClasses()}>
                {songsToDisplay.map(renderFunction)}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                  <Music className="w-12 h-12 mx-auto mb-4 opacity-50"/>
                  <p>No {activeTab==='projects'?'projects':'imported songs'} found {searchQuery?'matching your search':''}</p>
                  {!searchQuery&&activeTab==='imported'&&(<Button variant="link" onClick={onImportSong} className="mt-2">Import your first song</Button>)}
                  {!searchQuery&&activeTab==='projects'&&(<Button variant="link" onClick={()=>setCreateProjectDialogOpen(true)} className="mt-2">Create your first project</Button>)}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Dialogs (mantidos no final) */}
      {selectedSongForSetlist && ( <AddToSetlistDialog open={addToSetlistDialogOpen} onOpenChange={setAddToSetlistDialogOpen} song={selectedSongForSetlist} setlists={setlists} songs={songs} onAddToSetlist={onAddToSetlist} onCreateSetlist={onCreateSetlist} onImportSetlist={onImportSetlist} /> )}
      <CreateProjectDialog open={createProjectDialogOpen} onOpenChange={setCreateProjectDialogOpen} onCreateProject={onCreateProject} />
    </div>
  );
}

