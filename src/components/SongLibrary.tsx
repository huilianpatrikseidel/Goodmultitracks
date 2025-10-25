import React, { useState } from 'react';
import { Search, Music, Upload, ListPlus, Plus } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Song, Setlist } from '../types';
import { AddToSetlistDialog } from './AddToSetlistDialog';
import { CreateProjectDialog } from './CreateProjectDialog';

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
}

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
}: SongLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [addToSetlistDialogOpen, setAddToSetlistDialogOpen] = useState(false);
  const [selectedSongForSetlist, setSelectedSongForSetlist] = useState<Song | null>(null);
  const [createProjectDialogOpen, setCreateProjectDialogOpen] = useState(false);

  const filteredSongs = songs.filter((song) => {
    const matchesSearch =
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  // Separate projects from imported songs
  const projects = filteredSongs.filter((song) => song.source === 'project');
  const importedSongs = filteredSongs.filter((song) => song.source === 'imported');

  const renderSongCard = (song: Song) => (
    <Card
      key={song.id}
      className={`cursor-pointer transition-all hover:shadow-md ${
        selectedSongId === song.id ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={() => onSongSelect(song)}
    >
      <CardContent className="p-4">
        {song.thumbnailUrl && (
          <div className="aspect-video w-full mb-3 rounded overflow-hidden bg-gray-200">
            <img
              src={song.thumbnailUrl}
              alt={song.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="space-y-2">
          <div>
            <h3 className="truncate">{song.title}</h3>
            <p className="text-sm text-gray-600 truncate">{song.artist}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Badge variant="outline">{song.key}</Badge>
            <span>•</span>
            <span>{song.tempo} BPM</span>
            <span>•</span>
            <span>{Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, '0')}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedSongForSetlist(song);
              setAddToSetlistDialogOpen(true);
            }}
          >
            <ListPlus className="w-4 h-4 mr-2" />
            Add to Setlist
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search songs by title or artist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setCreateProjectDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Project
        </Button>
        <Button variant="outline" onClick={onImportSong}>
          <Upload className="w-4 h-4 mr-2" />
          Import Song
        </Button>
      </div>

      <Tabs defaultValue="imported" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="imported" className="flex items-center gap-2">
            Imported Songs
            <Badge variant="secondary" className="ml-1">{importedSongs.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            Projects
            <Badge variant="secondary" className="ml-1">{projects.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="imported" className="mt-4">
          {importedSongs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {importedSongs.map(renderSongCard)}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No imported songs found</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="projects" className="mt-4">
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map(renderSongCard)}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No projects found</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedSongForSetlist && (
        <AddToSetlistDialog
          open={addToSetlistDialogOpen}
          onOpenChange={setAddToSetlistDialogOpen}
          song={selectedSongForSetlist}
          setlists={setlists}
          songs={songs}
          onAddToSetlist={onAddToSetlist}
          onCreateSetlist={onCreateSetlist}
          onImportSetlist={onImportSetlist}
        />
      )}

      <CreateProjectDialog
        open={createProjectDialogOpen}
        onOpenChange={setCreateProjectDialogOpen}
        onCreateProject={onCreateProject}
      />
    </div>
  );
}
