import React, { useState } from 'react';
import { Plus, Trash2, Lock, Users } from './icons/Icon';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader } from './ui/card';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Note } from '../types';
import { Badge } from './ui/badge';

interface NotesPanelProps {
  notes: Note[];
  currentUser: { id: string; name: string };
  onAddNote: (content: string, isPrivate: boolean, time?: number) => void;
  onDeleteNote: (noteId: string) => void;
}

export function NotesPanel({ notes, currentUser, onAddNote, onDeleteNote }: NotesPanelProps) {
  const [newNote, setNewNote] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const handleAddNote = () => {
    if (newNote.trim()) {
      onAddNote(newNote, isPrivate);
      setNewNote('');
      setIsPrivate(false);
    }
  };

  const sortedNotes = [...notes].sort((a, b) => {
    if (a.time !== undefined && b.time !== undefined) {
      return a.time - b.time;
    }
    if (a.time !== undefined) return -1;
    if (b.time !== undefined) return 1;
    return 0;
  });

  const formatTime = (seconds?: number) => {
    if (seconds === undefined) return null;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2">Notes</h3>
        <p className="text-sm text-muted-foreground">
          Add personal notes or share with your team
        </p>
      </div>

      {/* Add new note */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <Textarea
            placeholder="Add a note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                id="private-note"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />
              <Label htmlFor="private-note" className="text-sm flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Private Note
              </Label>
            </div>
            <Button onClick={handleAddNote} disabled={!newNote.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Note
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notes list */}
      <div className="space-y-3">
        {sortedNotes.map((note) => (
          <Card key={note.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{note.userId === currentUser.id ? 'You' : 'Team Member'}</span>
                    {note.isPrivate ? (
                      <Badge variant="secondary" className="text-xs">
                        <Lock className="w-3 h-3 mr-1" />
                        Private
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        Shared
                      </Badge>
                    )}
                    {note.time !== undefined && (
                      <Badge variant="outline" className="text-xs">
                        {formatTime(note.time)}
                      </Badge>
                    )}
                  </div>
                </div>
                {note.userId === currentUser.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onDeleteNote(note.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{note.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {notes.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No notes yet</p>
        </div>
      )}
    </div>
  );
}
