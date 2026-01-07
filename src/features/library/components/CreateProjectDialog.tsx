// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
import React, { useState, useRef } from 'react';
import { Upload, FolderOpen, Plus, Music, Trash2, Image as ImageIcon } from '../../../components/icons/Icon';
import { BravuraSymbols, toBravuraAccidental } from '../../../lib/bravuraUtils';
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
import { Separator } from '../../../components/ui/separator';
import { Card, CardContent } from '../../../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { TrackTag, TRACK_TAG_HIERARCHY } from '../../../types';
import { toast } from 'sonner';

interface AudioFileTrack {
  file: File;
  channelName: string;
  tag?: TrackTag;
}

interface Author {
  id: string;
  name: string;
  role: string;
}

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject: (projectData: any) => Promise<void>;
}

const KEY_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const ACCIDENTALS = [
  { value: 'natural', label: BravuraSymbols.accidentalNatural },
  { value: 'sharp', label: BravuraSymbols.accidentalSharp },
  { value: 'flat', label: BravuraSymbols.accidentalFlat },
];
const MODES = [
  'Major',
  'Minor',
  'Ionian',
  'Dorian',
  'Phrygian',
  'Lydian',
  'Mixolydian',
  'Aeolian',
  'Locrian',
];

const TAG_LABELS: Record<TrackTag, string> = {
  'acoustic-guitar': 'Acoustic Guitar',
  'bass': 'Bass',
  'electric-guitar': 'Electric Guitar',
  'keyboard-piano': 'Keyboard/Piano',
  'keys': 'Keys',
  'percussion': 'Percussion',
  'cajon': 'Cajón',
  'drums': 'Drums',
  'vocals-general': 'Vocals (General)',
  'lead-vocal': 'Lead Vocal',
  'backing-vocals': 'Backing Vocals',
  'other-elements': 'Other Elements',
};

export function CreateProjectDialog({
  open,
  onOpenChange,
  onCreateProject,
}: CreateProjectDialogProps) {
  const [audioTracks, setAudioTracks] = useState<AudioFileTrack[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  
  // Metadata
  const [songName, setSongName] = useState('');
  const [artist, setArtist] = useState('');
  const [authors, setAuthors] = useState<Author[]>([]);
  const [coverArt, setCoverArt] = useState<File | null>(null);
  const [coverArtPreview, setCoverArtPreview] = useState<string>('');
  const coverArtInputRef = useRef<HTMLInputElement>(null);
  
  // Key signature
  const [keyName, setKeyName] = useState('C');
  const [accidental, setAccidental] = useState('natural');
  const [mode, setMode] = useState('Major');
  
  // Tempo and time signature
  const [tempo, setTempo] = useState('120');
  const [timeSignatureNumerator, setTimeSignatureNumerator] = useState('4');
  const [timeSignatureDenominator, setTimeSignatureDenominator] = useState('4');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newTracks = Array.from(e.target.files).map(file => ({
        file,
        channelName: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      }));
      setAudioTracks([...audioTracks, ...newTracks]);
    }
  };

  const handleChannelNameChange = (index: number, newName: string) => {
    const updated = [...audioTracks];
    updated[index].channelName = newName;
    setAudioTracks(updated);
  };

  const handleTagChange = (index: number, tag: TrackTag) => {
    const updated = [...audioTracks];
    updated[index].tag = tag;
    setAudioTracks(updated);
  };

  const handleRemoveTrack = (index: number) => {
    setAudioTracks(audioTracks.filter((_, i) => i !== index));
  };

  const handleCoverArtSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverArt(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverArtPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddAuthor = () => {
    setAuthors([...authors, { id: `author-${Date.now()}`, name: '', role: 'Composer' }]);
  };

  const handleRemoveAuthor = (id: string) => {
    setAuthors(authors.filter(a => a.id !== id));
  };

  const handleAuthorChange = (id: string, field: 'name' | 'role', value: string) => {
    setAuthors(authors.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const handleCreateProject = async () => {
    if (audioTracks.length === 0) {
      toast.error('Please add at least one audio file');
      return;
    }

    if (!songName.trim()) {
      toast.error('Please enter a song name');
      return;
    }

    // Validate that all tracks have tags
    const tracksWithoutTags = audioTracks.filter(track => !track.tag);
    if (tracksWithoutTags.length > 0) {
      toast.error('Please assign a tag to all tracks');
      return;
    }

    const accidentalSymbol = 
      accidental === 'sharp' ? BravuraSymbols.accidentalSharp : 
      accidental === 'flat' ? BravuraSymbols.accidentalFlat : '';
    
    const noteKey = `${keyName}${accidentalSymbol}`;
    const scaleType = mode.toLowerCase() === 'minor' ? 'minor' : 'major';

    const projectData = {
      songName: songName.trim(),
      artist: artist.trim() || 'Unknown Artist',
      authors: authors,
      coverArt: coverArt,
      coverArtPreview: coverArtPreview,
      key: noteKey,
      scale: scaleType as 'major' | 'minor',
      tempo: parseInt(tempo) || 120,
      timeSignature: `${timeSignatureNumerator}/${timeSignatureDenominator}`,
      tracks: audioTracks.map((track, index) => ({
        id: `track-${index}`,
        file: track.file,
        fileName: track.file.name,
        channelName: track.channelName,
        tag: track.tag,
      })),
    };

    setIsCreating(true);
    try {
      await onCreateProject(projectData);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setAudioTracks([]);
    setSongName('');
    setArtist('');
    setAuthors([]);
    setCoverArt(null);
    setCoverArtPreview('');
    setKeyName('C');
    setAccidental('natural');
    setMode('Major');
    setTempo('120');
    setTimeSignatureNumerator('4');
    setTimeSignatureDenominator('4');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Set up your multitrack project with audio files and initial parameters
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Metadata Section */}
          <div className="space-y-4">
            <h4>Song Information</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="song-name">Song Name *</Label>
                <Input
                  id="song-name"
                  value={songName}
                  onChange={(e) => setSongName(e.target.value)}
                  placeholder="Enter song name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="artist">Artist</Label>
                <Input
                  id="artist"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="Enter artist name"
                />
              </div>
            </div>

            {/* Cover Art */}
            <div className="space-y-2">
              <Label>Cover Art</Label>
              <div className="flex gap-4">
                {coverArtPreview && (
                  <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-gray-200">
                    <img src={coverArtPreview} alt="Cover" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    ref={coverArtInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverArtSelect}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => coverArtInputRef.current?.click()}
                    className="w-full"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    {coverArt ? 'Change Cover Art' : 'Upload Cover Art'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Authors */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Authors</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddAuthor}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Author
                </Button>
              </div>
              
              {authors.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Author Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {authors.map((author) => (
                        <TableRow key={author.id}>
                          <TableCell>
                            <Input
                              value={author.name}
                              onChange={(e) => handleAuthorChange(author.id, 'name', e.target.value)}
                              placeholder="Author name"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={author.role}
                              onValueChange={(value: string) => handleAuthorChange(author.id, 'role', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Composer">Composer</SelectItem>
                                <SelectItem value="Lyricist">Lyricist</SelectItem>
                                <SelectItem value="Music">Music</SelectItem>
                                <SelectItem value="Lyric Translation">Lyric Translation</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveAuthor(author.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Audio Files Section */}
          <div className="space-y-3">
            <h4>Audio Tracks</h4>
            
            <Card className="border-2 border-dashed">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="mb-1">Add Audio Files</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Select individual tracks (stems) or multiple audio files
                    </p>
                    <Input
                      id="file-upload"
                      type="file"
                      multiple
                      accept="audio/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button asChild variant="outline">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <FolderOpen className="w-4 h-4 mr-2" />
                        Browse Files
                      </label>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {audioTracks.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">File Name</TableHead>
                      <TableHead>Channel Name</TableHead>
                      <TableHead className="w-[180px]">Tag *</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {audioTracks.map((track, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-2">
                            <Music className="w-4 h-4 text-gray-400" />
                            <span className="truncate max-w-[120px]" title={track.file.name}>{track.file.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={track.channelName}
                            onChange={(e) => handleChannelNameChange(index, e.target.value)}
                            placeholder="Channel name"
                          />
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={track.tag || ''} 
                            onValueChange={(value: string) => handleTagChange(index, value as TrackTag)}
                          >
                            <SelectTrigger className={!track.tag ? 'border-red-500' : ''}>
                              <SelectValue placeholder="Select tag" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(TRACK_TAG_HIERARCHY)
                                .filter(([category, tags]) => tags.length > 0 && !['click', 'guide', 'other', 'orchestral', 'loops', 'piano'].includes(category))
                                .map(([category, tags]) => (
                                  <React.Fragment key={category}>
                                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 capitalize mt-2">{category.replace('-', ' ')}</div>
                                    {(tags as readonly TrackTag[]).map(tag => (
                                      <SelectItem key={tag} value={tag}>{TAG_LABELS[tag]}</SelectItem>
                                    ))}
                                  </React.Fragment>
                                ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveTrack(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <Separator />

          {/* Project Settings */}
          <div className="space-y-4">
            <h4>Project Settings</h4>
            
            {/* Key Signature */}
            <div className="space-y-2">
              <Label>Key Signature</Label>
              <div className="grid grid-cols-3 gap-2">
                <Select value={keyName} onValueChange={setKeyName}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KEY_NAMES.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={accidental} onValueChange={setAccidental}>
                  <SelectTrigger className="music-notation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCIDENTALS.map((acc) => (
                      <SelectItem key={acc.value} value={acc.value} className="music-notation">
                        {acc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={mode} onValueChange={setMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODES.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tempo */}
            <div className="space-y-2">
              <Label htmlFor="tempo">Tempo (BPM)</Label>
              <Input
                id="tempo"
                type="number"
                placeholder="120"
                value={tempo}
                onChange={(e) => setTempo(e.target.value)}
              />
            </div>

            {/* Time Signature */}
            <div className="space-y-2">
              <Label>Time Signature</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="ts-numerator" className="text-xs text-gray-600">
                    Numerator
                  </Label>
                  <Input
                    id="ts-numerator"
                    type="number"
                    placeholder="4"
                    value={timeSignatureNumerator}
                    onChange={(e) => setTimeSignatureNumerator(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="ts-denominator" className="text-xs text-gray-600">
                    Denominator
                  </Label>
                  <Input
                    id="ts-denominator"
                    type="number"
                    placeholder="4"
                    value={timeSignatureDenominator}
                    onChange={(e) => setTimeSignatureDenominator(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreateProject} disabled={isCreating}>
            <Plus className="w-4 h-4 mr-2" />
            {isCreating ? 'Processing audio...' : 'Create Project'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


