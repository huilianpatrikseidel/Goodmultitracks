// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
import React, { useState } from 'react';
import { Plus, ListMusic, Download, Search } from '../../../components/icons/Icon';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Separator } from '../../../components/ui/separator';
import { Badge } from '../../../components/ui/badge';
import { Setlist, Song } from '../../../types';

interface AddToSetlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  song: Song;
  setlists: Setlist[];
  songs: Song[];
  onAddToSetlist: (setlistId: string, songId: string) => void;
  onCreateSetlist: (name: string, songId: string) => void;
  onImportSetlist: () => void;
}

export function AddToSetlistDialog({
  open,
  onOpenChange,
  song,
  setlists,
  songs,
  onAddToSetlist,
  onCreateSetlist,
  onImportSetlist,
}: AddToSetlistDialogProps) {
  const [view, setView] = useState<'select' | 'create' | 'import'>('select');
  const [newSetlistName, setNewSetlistName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSetlists = setlists.filter((setlist) =>
    setlist.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateSetlist = () => {
    if (newSetlistName.trim()) {
      onCreateSetlist(newSetlistName, song.id);
      setNewSetlistName('');
      setView('select');
      onOpenChange(false);
    }
  };

  const handleAddToSetlist = (setlistId: string) => {
    onAddToSetlist(setlistId, song.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add "{song.title}" to Setlist</DialogTitle>
          <DialogDescription>
            Choose a setlist or create a new one
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {view === 'select' && (
            <>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setView('create')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Setlist
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setView('import')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Import Setlist
                </Button>
              </div>

              <Separator />

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search setlists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {filteredSetlists.length > 0 ? (
                    filteredSetlists.map((setlist) => {
                      const isAlreadyInSetlist = setlist.items.some(item => item.type === 'song' && item.id === song.id);
                      const songCount = setlist.items.filter(item => item.type === 'song').length;
                      
                      return (
                        <div
                          key={setlist.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <ListMusic className="w-4 h-4 text-gray-400" />
                              <span>{setlist.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {songCount} {songCount === 1 ? 'song' : 'songs'}
                              </Badge>
                            </div>
                          </div>
                          {isAlreadyInSetlist ? (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                              Added
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleAddToSetlist(setlist.id)}
                            >
                              Add
                            </Button>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <ListMusic className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No setlists found</p>
                      <Button
                        variant="link"
                        onClick={() => setView('create')}
                        className="mt-2"
                      >
                        Create your first setlist
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          )}

          {view === 'create' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="setlist-name">Setlist Name</Label>
                <Input
                  id="setlist-name"
                  placeholder="e.g., Sunday Service, Concert 2024..."
                  value={newSetlistName}
                  onChange={(e) => setNewSetlistName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateSetlist();
                    }
                  }}
                  autoFocus
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setView('select')}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateSetlist}
                  disabled={!newSetlistName.trim()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create & Add Song
                </Button>
              </div>
            </div>
          )}

          {view === 'import' && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <Download className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <h4 className="mb-2">Import Setlist</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Import setlists from Planning Center, ChurchTools, or JSON file
                </p>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full" onClick={onImportSetlist}>
                    <Download className="w-4 h-4 mr-2" />
                    Import from Planning Center
                  </Button>
                  <Button variant="outline" className="w-full" onClick={onImportSetlist}>
                    <Download className="w-4 h-4 mr-2" />
                    Import from ChurchTools
                  </Button>
                  <Button variant="outline" className="w-full" onClick={onImportSetlist}>
                    <Download className="w-4 h-4 mr-2" />
                    Import from JSON File
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setView('select')}>
                  Back
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


