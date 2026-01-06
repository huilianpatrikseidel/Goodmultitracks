import React, { useState } from 'react';
import { Save, Upload, Trash2, Plus } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '../../../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { AudioTrack, MixPreset } from '../../../../types';
import { toast } from 'sonner';

interface MixPresetsManagerProps {
  tracks: AudioTrack[];
  presets: MixPreset[];
  onSavePreset: (name: string) => void;
  onLoadPreset: (preset: MixPreset) => void;
  onDeletePreset: (presetId: string) => void;
}

export function MixPresetsManager({
  tracks,
  presets,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
}: MixPresetsManagerProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }

    onSavePreset(presetName);
    setPresetName('');
    setSaveDialogOpen(false);
    toast.success(`Mix preset "${presetName}" saved successfully`);
  };

  const handleLoadPreset = () => {
    if (!selectedPreset) {
      toast.error('Please select a preset to load');
      return;
    }

    const preset = presets.find(p => p.id === selectedPreset);
    if (!preset) {
      toast.error('Preset not found');
      return;
    }

    onLoadPreset(preset);
    toast.success(`Mix preset "${preset.name}" loaded successfully`);
  };

  const handleDeletePreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (window.confirm(`Are you sure you want to delete preset "${preset?.name}"?`)) {
      onDeletePreset(presetId);
      if (selectedPreset === presetId) {
        setSelectedPreset('');
      }
      toast.success(`Mix preset deleted`);
    }
  };

  return (
    <div className="space-y-2">
      {/* Save Preset */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full" 
            title="Save current mix as preset"
            style={{ backgroundColor: 'var(--daw-control)', color: '#F1F1F1', borderColor: 'var(--daw-border)' }}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Current Mix
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Mix Preset</DialogTitle>
            <DialogDescription>
              Save the current volume and mute settings as a mix preset.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                placeholder="e.g., Rehearsal Mix, Live Mix, etc."
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSavePreset();
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Current Settings:</Label>
              <div className="max-h-48 overflow-y-auto border rounded p-2 space-y-1">
                {tracks.map((track) => (
                  <div key={track.id} className="text-sm flex items-center justify-between">
                    <span className="font-medium">{track.name}</span>
                    <span className="text-gray-500">
                      {track.muted ? 'Muted' : `${Math.round(track.volume * 100)}%`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSavePreset}>Save Preset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Load Preset Section */}
      <div className="space-y-1">
        <Select value={selectedPreset} onValueChange={setSelectedPreset}>
          <SelectTrigger className="w-full" style={{ backgroundColor: 'var(--daw-control)', color: '#F1F1F1', borderColor: 'var(--daw-border)' }}>
            <SelectValue placeholder="Select preset..." />
          </SelectTrigger>
          <SelectContent>
            {presets.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-gray-500">No presets saved</div>
            ) : (
              presets.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleLoadPreset}
            disabled={!selectedPreset}
            title="Load selected preset"
            style={{ backgroundColor: 'var(--daw-control)', color: '#F1F1F1', borderColor: 'var(--daw-border)' }}
          >
            <Upload className="w-4 h-4 mr-1" />
            Load
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => selectedPreset && handleDeletePreset(selectedPreset)}
            disabled={!selectedPreset}
            title="Delete selected preset"
            style={{ backgroundColor: 'var(--daw-control)', color: '#F1F1F1', borderColor: 'var(--daw-border)' }}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

