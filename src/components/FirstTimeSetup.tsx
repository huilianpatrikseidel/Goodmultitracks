import React, { useState } from 'react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { TrackTag, TRACK_TAG_HIERARCHY } from '../types';
import { Music, Guitar, Mic } from 'lucide-react';

interface FirstTimeSetupProps {
  onComplete: (selectedInstruments: TrackTag[], mainInstrument: TrackTag) => void;
}

const TRACK_TAG_LABELS: Record<TrackTag, string> = {
  'acoustic-guitar': 'Acoustic Guitar',
  'bass': 'Bass',
  'electric-guitar': 'Electric Guitar',
  'keyboard-piano': 'Keyboard/Piano',
  'percussion': 'Percussion',
  'cajon': 'Cajón',
  'drums': 'Drums',
  'vocals-general': 'Vocals (General)',
  'lead-vocal': 'Lead Vocal',
  'backing-vocals': 'Backing Vocals',
  'other-elements': 'Other Elements',
};

const TAG_ICONS: Record<string, React.ReactNode> = {
  percussion: <Music className="w-5 h-5" />,
  harmony: <Guitar className="w-5 h-5" />,
  vocals: <Mic className="w-5 h-5" />,
};

export function FirstTimeSetup({ onComplete }: FirstTimeSetupProps) {
  const [selectedInstruments, setSelectedInstruments] = useState<TrackTag[]>([]);
  const [mainInstrument, setMainInstrument] = useState<TrackTag | null>(null);

  const handleToggleInstrument = (tag: TrackTag) => {
    setSelectedInstruments((prev) => {
      if (prev.includes(tag)) {
        // If removing the main instrument, clear it
        if (tag === mainInstrument) {
          setMainInstrument(null);
        }
        return prev.filter((t) => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  const handleComplete = () => {
    if (selectedInstruments.length > 0 && mainInstrument) {
      onComplete(selectedInstruments, mainInstrument);
    }
  };

  const canComplete = selectedInstruments.length > 0 && mainInstrument !== null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ backgroundColor: '#171717' }}>
      <Card className="w-full max-w-3xl" style={{ backgroundColor: '#2B2B2B', borderColor: '#3A3A3A' }}>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Music className="w-8 h-8" style={{ color: '#F1F1F1' }} />
            <CardTitle className="text-2xl" style={{ color: '#F1F1F1' }}>Welcome to GoodMultitracks</CardTitle>
          </div>
          <CardDescription style={{ color: '#9E9E9E' }}>
            Select the instruments you play to personalize your experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Percussion Group */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              {TAG_ICONS.percussion}
              <h3 className="font-medium" style={{ color: '#F1F1F1' }}>Percussion</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 ml-7">
              {TRACK_TAG_HIERARCHY.percussion.map((tag) => (
                <div key={tag} className="flex items-center space-x-2">
                  <Checkbox
                    id={tag}
                    checked={selectedInstruments.includes(tag as TrackTag)}
                    onCheckedChange={() => handleToggleInstrument(tag as TrackTag)}
                  />
                  <Label
                    htmlFor={tag}
                    className="cursor-pointer"
                    style={{ color: '#E0E0E0' }}
                  >
                    {TRACK_TAG_LABELS[tag as TrackTag]}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Harmony Group */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              {TAG_ICONS.harmony}
              <h3 className="font-medium" style={{ color: '#F1F1F1' }}>Harmony</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 ml-7">
              {TRACK_TAG_HIERARCHY.harmony.map((tag) => (
                <div key={tag} className="flex items-center space-x-2">
                  <Checkbox
                    id={tag}
                    checked={selectedInstruments.includes(tag as TrackTag)}
                    onCheckedChange={() => handleToggleInstrument(tag as TrackTag)}
                  />
                  <Label
                    htmlFor={tag}
                    className="cursor-pointer"
                    style={{ color: '#E0E0E0' }}
                  >
                    {TRACK_TAG_LABELS[tag as TrackTag]}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Vocals Group */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              {TAG_ICONS.vocals}
              <h3 className="font-medium" style={{ color: '#F1F1F1' }}>Vocals</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 ml-7">
              {TRACK_TAG_HIERARCHY.vocals.map((tag) => (
                <div key={tag} className="flex items-center space-x-2">
                  <Checkbox
                    id={tag}
                    checked={selectedInstruments.includes(tag as TrackTag)}
                    onCheckedChange={() => handleToggleInstrument(tag as TrackTag)}
                  />
                  <Label
                    htmlFor={tag}
                    className="cursor-pointer"
                    style={{ color: '#E0E0E0' }}
                  >
                    {TRACK_TAG_LABELS[tag as TrackTag]}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Other */}
          <div>
            <div className="flex items-center space-x-2 ml-7">
              <Checkbox
                id="other-elements"
                checked={selectedInstruments.includes('other-elements')}
                onCheckedChange={() => handleToggleInstrument('other-elements')}
              />
              <Label
                htmlFor="other-elements"
                className="cursor-pointer"
                style={{ color: '#E0E0E0' }}
              >
                {TRACK_TAG_LABELS['other-elements']}
              </Label>
            </div>
          </div>

          {/* Main Instrument Selection */}
          {selectedInstruments.length > 0 && (
            <div className="pt-4 border-t" style={{ borderColor: '#3A3A3A' }}>
              <Label htmlFor="main-instrument" className="mb-2 block" style={{ color: '#F1F1F1' }}>
                Select your main instrument (for track pinning)
              </Label>
              <Select
                value={mainInstrument || ''}
                onValueChange={(value) => setMainInstrument(value as TrackTag)}
              >
                <SelectTrigger id="main-instrument" style={{ backgroundColor: '#404040', borderColor: '#5A5A5A', color: '#F1F1F1' }}>
                  <SelectValue placeholder="Choose your main instrument" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: '#2B2B2B', borderColor: '#3A3A3A' }}>
                  {selectedInstruments.map((tag) => (
                    <SelectItem key={tag} value={tag} style={{ color: '#F1F1F1' }}>
                      {TRACK_TAG_LABELS[tag]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Complete Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleComplete}
              disabled={!canComplete}
              className="px-8"
              style={{
                backgroundColor: canComplete ? '#3B82F6' : '#404040',
                color: '#FFFFFF',
              }}
            >
              Get Started
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
