import React, { useState, useEffect } from 'react';
import { Song, WarpMarker } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Trash2, Plus, Wand2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { useLanguage } from '../lib/LanguageContext';

interface TimeWarpToolProps {
  song: Song | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (warpMarkers: WarpMarker[]) => void;
}

export const TimeWarpTool: React.FC<TimeWarpToolProps> = ({
  song,
  isOpen,
  onClose,
  onSave,
}) => {
  const { t } = useLanguage();
  const [warpMarkers, setWarpMarkers] = useState<WarpMarker[]>([]);
  const [newSourceTime, setNewSourceTime] = useState('0');
  const [newGridTime, setNewGridTime] = useState('0');

  // Initialize warp markers from song
  useEffect(() => {
    if (song && isOpen) {
      setWarpMarkers(song.warpMarkers || []);
    }
  }, [song, isOpen]);

  // Add new warp marker
  const handleAddWarpMarker = () => {
    const sourceTime = parseFloat(newSourceTime);
    const gridTime = parseFloat(newGridTime);

    if (isNaN(sourceTime) || isNaN(gridTime)) {
      alert('Please enter valid numbers for times.');
      return;
    }

    // Check if marker already exists at this source time
    if (warpMarkers.some((m) => m.sourceTime === sourceTime)) {
      alert('A warp marker already exists at this source time.');
      return;
    }

    const newMarker: WarpMarker = {
      id: `warp-${Date.now()}`,
      sourceTime,
      gridTime,
    };

    setWarpMarkers((prev) => [...prev, newMarker].sort((a, b) => a.sourceTime - b.sourceTime));
    setNewSourceTime('0');
    setNewGridTime('0');
  };

  // Delete warp marker
  const handleDeleteMarker = (id: string) => {
    setWarpMarkers((prev) => prev.filter((m) => m.id !== id));
  };

  // Update warp marker time
  const handleUpdateMarker = (
    id: string,
    field: 'sourceTime' | 'gridTime',
    value: string
  ) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    setWarpMarkers((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, [field]: numValue }
          : m
      ).sort((a, b) => a.sourceTime - b.sourceTime)
    );
  };

  // Clear all markers
  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all warp markers?')) {
      setWarpMarkers([]);
    }
  };

  // Save changes
  const handleSave = () => {
    onSave(warpMarkers);
    onClose();
  };

  // Calculate warp effect (for preview)
  const calculateWarpEffect = (sourceTime: number): number => {
    if (warpMarkers.length === 0) return sourceTime;
    if (warpMarkers.length === 1) {
      const marker = warpMarkers[0];
      return sourceTime + (marker.gridTime - marker.sourceTime);
    }

    // Find the surrounding markers
    let lowerMarker = null;
    let upperMarker = null;

    for (let i = 0; i < warpMarkers.length; i++) {
      if (warpMarkers[i].sourceTime <= sourceTime) {
        lowerMarker = warpMarkers[i];
      }
      if (warpMarkers[i].sourceTime > sourceTime && !upperMarker) {
        upperMarker = warpMarkers[i];
        break;
      }
    }

    if (!lowerMarker && !upperMarker) return sourceTime;
    if (!upperMarker) {
      const delta = sourceTime - lowerMarker!.sourceTime;
      return lowerMarker!.gridTime + delta;
    }
    if (!lowerMarker) {
      const delta = sourceTime - upperMarker!.sourceTime;
      return upperMarker!.gridTime + delta;
    }

    // Linear interpolation between markers
    const ratio =
      (sourceTime - lowerMarker.sourceTime) /
      (upperMarker.sourceTime - lowerMarker.sourceTime);
    return (
      lowerMarker.gridTime +
      ratio * (upperMarker.gridTime - lowerMarker.gridTime)
    );
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return `${mins}:${secs.padStart(5, '0')}`;
  };

  if (!song) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            Time Warp Tool
          </DialogTitle>
          <DialogDescription>
            Create warp markers to synchronize audio timing with the musical grid.
            Map source audio times to desired grid times for tempo correction.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Marker Section */}
          <Card className="p-4 bg-muted/50">
            <h3 className="text-sm font-semibold mb-4">Add New Warp Marker</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source-time">Source Time (seconds)</Label>
                <Input
                  id="source-time"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newSourceTime}
                  onChange={(e) => setNewSourceTime(e.target.value)}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">
                  Time in the actual audio file
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="grid-time">Grid Time (seconds)</Label>
                <Input
                  id="grid-time"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newGridTime}
                  onChange={(e) => setNewGridTime(e.target.value)}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">
                  Desired time on musical grid
                </p>
              </div>
            </div>
            <Button
              onClick={handleAddWarpMarker}
              className="mt-4 w-full"
              variant="default"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Marker
            </Button>
          </Card>

          {/* Markers List */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold">
                Warp Markers ({warpMarkers.length})
              </h3>
              {warpMarkers.length > 0 && (
                <Button
                  onClick={handleClearAll}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  Clear All
                </Button>
              )}
            </div>

            {warpMarkers.length === 0 ? (
              <div className="p-6 text-center bg-muted/30 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">
                  No warp markers yet. Add markers to synchronize timing.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {warpMarkers.map((marker, index) => {
                  const warpEffect = calculateWarpEffect(marker.sourceTime);
                  const timeDiff = marker.gridTime - marker.sourceTime;
                  const timeDiffAbs = Math.abs(timeDiff);

                  return (
                    <Card key={marker.id} className="p-3">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Marker {index + 1}
                          </Label>
                          <p className="text-sm font-mono">
                            {formatTime(marker.sourceTime)}
                          </p>
                        </div>

                        <div>
                          <Label htmlFor={`source-${marker.id}`} className="text-xs">
                            Source
                          </Label>
                          <Input
                            id={`source-${marker.id}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={marker.sourceTime}
                            onChange={(e) =>
                              handleUpdateMarker(
                                marker.id,
                                'sourceTime',
                                e.target.value
                              )
                            }
                            className="text-xs"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`grid-${marker.id}`} className="text-xs">
                            Grid
                          </Label>
                          <Input
                            id={`grid-${marker.id}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={marker.gridTime}
                            onChange={(e) =>
                              handleUpdateMarker(
                                marker.id,
                                'gridTime',
                                e.target.value
                              )
                            }
                            className="text-xs"
                          />
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Shift
                          </p>
                          <Badge
                            variant={timeDiff > 0 ? 'default' : timeDiff < 0 ? 'destructive' : 'secondary'}
                            className="font-mono"
                          >
                            {timeDiff > 0 ? '+' : ''}{timeDiff.toFixed(2)}s
                          </Badge>
                        </div>

                        <Button
                          onClick={() => handleDeleteMarker(marker.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 w-full"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Preview info */}
                      <div className="mt-2 text-xs text-muted-foreground space-y-1">
                        <p>
                          Shift: {timeDiff > 0 ? '+' : ''}{timeDiff.toFixed(3)}s
                          {' '} | {' '}
                          {timeDiff !== 0 && (
                            <>
                              {timeDiff > 0 ? 'Slow down' : 'Speed up'} by{' '}
                              {timeDiffAbs.toFixed(2)}s
                            </>
                          )}
                        </p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Information */}
          <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
            <h4 className="text-sm font-semibold mb-2">How Time Warp Works</h4>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>
                • <strong>Source Time:</strong> The actual position in the audio file
              </li>
              <li>
                • <strong>Grid Time:</strong> Where this audio point should align on the
                musical grid
              </li>
              <li>
                • Position playback at a marker to hear the warp effect applied
              </li>
              <li>
                • Between markers, the warp effect is interpolated smoothly
              </li>
              <li>
                • Use multiple markers to correct timing throughout the song
              </li>
            </ul>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Warp Markers</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
