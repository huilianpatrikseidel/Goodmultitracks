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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { TrackTag, TRACK_TAG_HIERARCHY } from '../types';
import { Music, Guitar, Mic } from 'lucide-react';

interface FirstTimeSetupProps {
  onComplete: (selectedInstruments: TrackTag[], mainInstrument: TrackTag) => void;
}

// Mapeamento de rótulos para as tags
const TAG_LABELS: Record<TrackTag, string> = Object.entries(TRACK_TAG_HIERARCHY)
  .flatMap(([, tags]) => tags)
  .reduce((acc, tag) => {
    const label = tag
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    acc[tag] = label;
    return acc;
  }, {} as Record<TrackTag, string>);

// Mapeamento de ícones para as categorias
const TAG_ICONS: Record<string, React.ReactNode> = {
  drums: <Music className="w-5 h-5" />,
  percussion: <Music className="w-5 h-5" />,
  bass: <Guitar className="w-5 h-5" />,
  guitar: <Guitar className="w-5 h-5" />,
  keys: <Music className="w-5 h-5" />,
  piano: <Music className="w-5 h-5" />,
  vocals: <Mic className="w-5 h-5" />,
};

export function FirstTimeSetup({ onComplete }: FirstTimeSetupProps) {
  const [selectedInstruments, setSelectedInstruments] = useState<TrackTag[]>([]);
  const [mainInstrument, setMainInstrument] = useState<TrackTag | null>(null);

  const handleToggleInstrument = (tag: TrackTag) => {
    setSelectedInstruments((prev: TrackTag[]) => {
      if (prev.includes(tag)) {
        // If removing the main instrument, clear it
        if (tag === mainInstrument) {
          setMainInstrument(null);
        }
        return prev.filter((t: TrackTag) => t !== tag);
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
        <CardContent className="space-y-8">
          {Object.entries(TRACK_TAG_HIERARCHY)
            .filter(([category, tags]) => tags.length > 0 && !['click', 'guide'].includes(category))
            .map(([category, tags]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  {TAG_ICONS[category] || <Music className="w-5 h-5" />}
                  <h3 className="font-medium capitalize" style={{ color: '#F1F1F1' }}>
                    {category.replace('-', ' ')}
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 ml-7">
                  {(tags as readonly TrackTag[]).map((tag) => (
                    <div key={tag} className="flex items-center space-x-2">
                      <Checkbox
                        id={tag}
                        checked={selectedInstruments.includes(tag)}
                        onCheckedChange={() => handleToggleInstrument(tag)}
                      />
                      <Label
                        htmlFor={tag}
                        className="cursor-pointer"
                        style={{ color: '#E0E0E0' }}
                      >
                        {TAG_LABELS[tag] || tag}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}

          {/* Main Instrument Selection */}
          {selectedInstruments.length > 0 && (
            <div className="pt-6 border-t" style={{ borderColor: '#3A3A3A' }}>
              <Label htmlFor="main-instrument" className="mb-2 block" style={{ color: '#F1F1F1' }}>
                Select your main instrument (for track pinning)
              </Label>
              <Select
                value={mainInstrument || ''}
                onValueChange={(value: TrackTag) => setMainInstrument(value)}
              >
                <SelectTrigger id="main-instrument" style={{ backgroundColor: '#404040', borderColor: '#5A5A5A', color: '#F1F1F1' }}>
                  <SelectValue placeholder="Choose your main instrument" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: '#2B2B2B', borderColor: '#3A3A3A' }}>
                  {selectedInstruments.map((tag: TrackTag) => (
                    <SelectItem key={tag} value={tag} style={{ color: '#F1F1F1' }}>
                      {TAG_LABELS[tag]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleComplete}
            disabled={!canComplete}
            className="w-full"
            size="lg"
            style={{
              backgroundColor: canComplete ? '#3B82F6' : '#404040',
              color: '#FFFFFF',
            }}
          >
            Get Started
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
