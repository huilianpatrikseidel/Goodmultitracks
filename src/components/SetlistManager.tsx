import React, { useState } from 'react';
import { ListMusic, Plus, Trash2, GripVertical, Users, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Setlist, Song } from '../types';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

interface SetlistManagerProps {
  setlists: Setlist[];
  songs: Song[];
  onSetlistSelect: (setlist: Setlist) => void;
  onCreateSetlist: (name: string) => void;
}

export function SetlistManager({
  setlists,
  songs,
  onSetlistSelect,
  onCreateSetlist,
}: SetlistManagerProps) {
  const [newSetlistName, setNewSetlistName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreateSetlist = () => {
    if (newSetlistName.trim()) {
      onCreateSetlist(newSetlistName);
      setNewSetlistName('');
      setDialogOpen(false);
    }
  };

  const getSongTitle = (songId: string) => {
    const song = songs.find((s) => s.id === songId);
    return song ? song.title : 'Unknown Song';
  };

  const formatDate = (date?: Date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl">Setlists</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Setlist
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Setlist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Input
                placeholder="Setlist name"
                value={newSetlistName}
                onChange={(e) => setNewSetlistName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateSetlist()}
              />
              <Button onClick={handleCreateSetlist} className="w-full">
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {setlists.map((setlist) => (
          <Card
            key={setlist.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onSetlistSelect(setlist)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <ListMusic className="w-5 h-5" />
                    <span>{setlist.name}</span>
                  </div>
                  {setlist.eventDate && (
                    <div className="flex items-center gap-1 mt-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(setlist.eventDate)}</span>
                    </div>
                  )}
                </div>
                <Badge variant="secondary">{setlist.songIds.length} songs</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {setlist.songIds.slice(0, 3).map((songId, index) => (
                  <div
                    key={songId}
                    className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded"
                  >
                    <span className="text-gray-500">{index + 1}.</span>
                    <span className="flex-1 truncate">{getSongTitle(songId)}</span>
                  </div>
                ))}
                {setlist.songIds.length > 3 && (
                  <div className="text-sm text-gray-500 text-center">
                    +{setlist.songIds.length - 3} more
                  </div>
                )}
              </div>

              {setlist.sharedWith.length > 0 && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>Shared with {setlist.sharedWith.length} people</span>
                </div>
              )}

              {setlist.notes && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm text-gray-600 italic line-clamp-2">
                    {setlist.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {setlists.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <ListMusic className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No setlists created yet</p>
          <p className="text-sm mt-2">Create your first setlist to get started</p>
        </div>
      )}
    </div>
  );
}
