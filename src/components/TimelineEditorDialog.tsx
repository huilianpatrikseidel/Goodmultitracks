import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Plus, Edit3 } from 'lucide-react';
import { InteractiveGuitarDiagram } from './InteractiveGuitarDiagram';
import { InteractiveUkuleleDiagram } from './InteractiveUkuleleDiagram';
import { InteractivePianoDiagram } from './InteractivePianoDiagram';

// Chord database for auto-populating diagrams
const chordDatabase: Record<string, {
  guitar: { frets: number[]; fingers?: number[]; baseFret?: number };
  piano: { keys: string[] };
  ukulele: { frets: number[]; fingers?: number[] };
}> = {
  'C': {
    guitar: { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
    piano: { keys: ['C', 'E', 'G'] },
    ukulele: { frets: [0, 0, 0, 3], fingers: [0, 0, 0, 3] }
  },
  'D': {
    guitar: { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
    piano: { keys: ['D', 'F#', 'A'] },
    ukulele: { frets: [2, 2, 2, 0], fingers: [1, 1, 1, 0] }
  },
  'E': {
    guitar: { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
    piano: { keys: ['E', 'G#', 'B'] },
    ukulele: { frets: [4, 4, 4, 2], fingers: [3, 3, 3, 1] }
  },
  'F': {
    guitar: { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1] },
    piano: { keys: ['F', 'A', 'C'] },
    ukulele: { frets: [2, 0, 1, 0], fingers: [2, 0, 1, 0] }
  },
  'G': {
    guitar: { frets: [3, 2, 0, 0, 0, 3], fingers: [3, 2, 0, 0, 0, 4] },
    piano: { keys: ['G', 'B', 'D'] },
    ukulele: { frets: [0, 2, 3, 2], fingers: [0, 1, 3, 2] }
  },
  'A': {
    guitar: { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
    piano: { keys: ['A', 'C#', 'E'] },
    ukulele: { frets: [2, 1, 0, 0], fingers: [2, 1, 0, 0] }
  },
  'B': {
    guitar: { frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1] },
    piano: { keys: ['B', 'D#', 'F#'] },
    ukulele: { frets: [4, 3, 2, 2], fingers: [4, 3, 1, 2] }
  },
  'Am': {
    guitar: { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
    piano: { keys: ['A', 'C', 'E'] },
    ukulele: { frets: [2, 0, 0, 0], fingers: [1, 0, 0, 0] }
  },
  'Bm': {
    guitar: { frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1] },
    piano: { keys: ['B', 'D', 'F#'] },
    ukulele: { frets: [4, 2, 2, 2], fingers: [4, 1, 1, 1] }
  },
  'Cm': {
    guitar: { frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1] },
    piano: { keys: ['C', 'Eb', 'G'] },
    ukulele: { frets: [0, 3, 3, 3], fingers: [0, 1, 1, 1] }
  },
  'Dm': {
    guitar: { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
    piano: { keys: ['D', 'F', 'A'] },
    ukulele: { frets: [2, 2, 1, 0], fingers: [2, 3, 1, 0] }
  },
  'Em': {
    guitar: { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
    piano: { keys: ['E', 'G', 'B'] },
    ukulele: { frets: [0, 4, 3, 2], fingers: [0, 4, 3, 2] }
  },
  'Fm': {
    guitar: { frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1] },
    piano: { keys: ['F', 'Ab', 'C'] },
    ukulele: { frets: [1, 0, 1, 3], fingers: [1, 0, 2, 4] }
  },
  'Gm': {
    guitar: { frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1] },
    piano: { keys: ['G', 'Bb', 'D'] },
    ukulele: { frets: [0, 2, 3, 1], fingers: [0, 2, 3, 1] }
  },
  'Am7': {
    guitar: { frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0] },
    piano: { keys: ['A', 'C', 'E', 'G'] },
    ukulele: { frets: [0, 0, 0, 0], fingers: [0, 0, 0, 0] }
  },
  'C7': {
    guitar: { frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
    piano: { keys: ['C', 'E', 'G', 'Bb'] },
    ukulele: { frets: [0, 0, 0, 1], fingers: [0, 0, 0, 1] }
  },
  'D7': {
    guitar: { frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
    piano: { keys: ['D', 'F#', 'A', 'C'] },
    ukulele: { frets: [2, 2, 2, 3], fingers: [1, 1, 1, 2] }
  },
  'E7': {
    guitar: { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
    piano: { keys: ['E', 'G#', 'B', 'D'] },
    ukulele: { frets: [1, 2, 0, 2], fingers: [1, 2, 0, 3] }
  },
  'G7': {
    guitar: { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
    piano: { keys: ['G', 'B', 'D', 'F'] },
    ukulele: { frets: [0, 2, 1, 2], fingers: [0, 2, 1, 3] }
  },
};

interface TimelineEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'tempo' | 'timesig' | 'section' | 'chord';
  currentTime: number;
  onAdd: (data: any) => void;
}

const SECTION_TYPES = [
  { value: 'intro', label: 'Intro' },
  { value: 'verse', label: 'Verse' },
  { value: 'chorus', label: 'Chorus' },
  { value: 'bridge', label: 'Bridge' },
  { value: 'outro', label: 'Outro' },
  { value: 'pre-chorus', label: 'Pre-Chorus' },
  { value: 'instrumental', label: 'Instrumental' },
  { value: 'tag', label: 'Tag' },
];

const ROOT_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const ACCIDENTALS = [
  { value: 'natural', label: 'Natural', symbol: '' },
  { value: 'sharp', label: '♯ (Sharp)', symbol: '#' },
  { value: 'flat', label: '♭ (Flat)', symbol: 'b' },
];
const QUALITIES = [
  { value: 'major', label: 'Major', suffix: '' },
  { value: 'minor', label: 'Minor', suffix: 'm' },
  { value: 'diminished', label: 'Diminished', suffix: 'dim' },
  { value: 'augmented', label: 'Augmented', suffix: 'aug' },
  { value: 'sus2', label: 'Suspended 2nd', suffix: 'sus2' },
  { value: 'sus4', label: 'Suspended 4th', suffix: 'sus4' },
];
const EXTENSIONS = [
  { value: 'none', label: 'None', suffix: '' },
  { value: '7', label: 'Dominant 7th', suffix: '7' },
  { value: 'maj7', label: 'Major 7th', suffix: 'maj7' },
  { value: '9', label: '9th', suffix: '9' },
  { value: 'maj9', label: 'Major 9th', suffix: 'maj9' },
  { value: '11', label: '11th', suffix: '11' },
  { value: '13', label: '13th', suffix: '13' },
  { value: '6', label: '6th', suffix: '6' },
  { value: 'add9', label: 'Add 9', suffix: 'add9' },
];

export function TimelineEditorDialog({
  open,
  onOpenChange,
  type,
  currentTime,
  onAdd,
}: TimelineEditorDialogProps) {
  const [time, setTime] = useState('0');
  
  // Tempo change fields
  const [tempo, setTempo] = useState('120');
  
  // Time signature fields
  const [timeSignatureNumerator, setTimeSignatureNumerator] = useState('4');
  const [timeSignatureDenominator, setTimeSignatureDenominator] = useState('4');
  
  // Section fields
  const [sectionLabel, setSectionLabel] = useState('');
  const [sectionType, setSectionType] = useState('verse');
  
  // Chord fields
  const [chord, setChord] = useState('');
  const [rootNote, setRootNote] = useState('C');
  const [accidental, setAccidental] = useState('natural');
  const [quality, setQuality] = useState('major');
  const [extension, setExtension] = useState('none');
  const [bassNote, setBassNote] = useState('');
  const [customDiagramMode, setCustomDiagramMode] = useState(false);
  
  // Custom diagram fields
  const [guitarFrets, setGuitarFrets] = useState<number[]>([-1, 3, 2, 0, 1, 0]);
  const [guitarFingers, setGuitarFingers] = useState<number[]>([0, 3, 2, 0, 1, 0]);
  const [guitarStartFret, setGuitarStartFret] = useState(1);
  const [ukuleleFrets, setUkuleleFrets] = useState<number[]>([0, 0, 0, 3]);
  const [ukuleleFingers, setUkuleleFingers] = useState<number[]>([0, 0, 0, 3]);
  const [ukuleleStartFret, setUkuleleStartFret] = useState(1);
  const [pianoKeys, setPianoKeys] = useState<string[]>(['C', 'E', 'G']);
  const [capo, setCapo] = useState(0);

  useEffect(() => {
    if (open) {
      setTime(currentTime.toFixed(2));
    }
  }, [open, currentTime]);

  // Auto-generate chord name from components
  useEffect(() => {
    if (type === 'chord') {
      const accidentalSymbol = ACCIDENTALS.find(a => a.value === accidental)?.symbol || '';
      const qualitySuffix = QUALITIES.find(q => q.value === quality)?.suffix || '';
      const extensionSuffix = EXTENSIONS.find(e => e.value === extension)?.suffix || '';
      const chordName = `${rootNote}${accidentalSymbol}${qualitySuffix}${extensionSuffix}${bassNote ? '/' + bassNote : ''}`;
      setChord(chordName);
    }
  }, [rootNote, accidental, quality, extension, bassNote, type]);

  // Auto-update chord diagrams when chord changes
  useEffect(() => {
    if (type === 'chord' && chord && customDiagramMode) {
      // Look up chord in database (without bass note for lookup)
      const baseChord = chord.split('/')[0];
      const chordData = chordDatabase[baseChord];
      
      if (chordData) {
        // Update guitar diagram
        if (chordData.guitar) {
          setGuitarFrets(chordData.guitar.frets);
          setGuitarFingers(chordData.guitar.fingers || chordData.guitar.frets.map(() => 0));
          setGuitarStartFret(chordData.guitar.baseFret || 1);
        }
        
        // Update ukulele diagram
        if (chordData.ukulele) {
          setUkuleleFrets(chordData.ukulele.frets);
          setUkuleleFingers(chordData.ukulele.fingers || chordData.ukulele.frets.map(() => 0));
        }
        
        // Update piano diagram
        if (chordData.piano) {
          setPianoKeys(chordData.piano.keys);
        }
      }
    }
  }, [chord, type, customDiagramMode]);

  const handleAdd = () => {
    const timeValue = parseFloat(time);
    
    if (isNaN(timeValue) || timeValue < 0) {
      alert('Please enter a valid time');
      return;
    }

    let data: any = { time: timeValue };

    switch (type) {
      case 'tempo':
        const tempoValue = parseInt(tempo);
        if (isNaN(tempoValue) || tempoValue < 1) {
          alert('Please enter a valid tempo');
          return;
        }
        data.tempo = tempoValue;
        break;
      
      case 'timesig':
        const numerator = parseInt(timeSignatureNumerator);
        const denominator = parseInt(timeSignatureDenominator);
        if (isNaN(numerator) || isNaN(denominator) || numerator < 1 || denominator < 1) {
          alert('Please enter a valid time signature');
          return;
        }
        data.timeSignature = `${numerator}/${denominator}`;
        break;
      
      case 'section':
        if (!sectionLabel.trim()) {
          alert('Please enter a section label');
          return;
        }
        data.label = sectionLabel;
        data.type = sectionType;
        break;
      
      case 'chord':
        if (!chord.trim()) {
          alert('Please enter a chord');
          return;
        }
        data.chord = chord;
        
        // Add custom diagram data if customization is enabled
        if (customDiagramMode) {
          data.customDiagram = {
            guitar: { frets: guitarFrets, fingers: guitarFingers, startFret: guitarStartFret },
            ukulele: { frets: ukuleleFrets, fingers: ukuleleFingers, startFret: ukuleleStartFret },
            piano: { keys: pianoKeys },
            capo: capo > 0 ? capo : undefined
          };
        }
        break;
    }

    onAdd(data);
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setTime('0');
    setTempo('120');
    setTimeSignatureNumerator('4');
    setTimeSignatureDenominator('4');
    setSectionLabel('');
    setSectionType('verse');
    setChord('');
    setRootNote('C');
    setAccidental('natural');
    setQuality('major');
    setExtension('none');
    setBassNote('');
    setCustomDiagramMode(false);
    setGuitarFrets([-1, 3, 2, 0, 1, 0]);
    setGuitarFingers([0, 3, 2, 0, 1, 0]);
    setGuitarStartFret(1);
    setUkuleleFrets([0, 0, 0, 3]);
    setUkuleleFingers([0, 0, 0, 3]);
    setUkuleleStartFret(1);
    setPianoKeys(['C', 'E', 'G']);
    setCapo(0);
  };

  const getTitle = () => {
    switch (type) {
      case 'tempo':
        return 'Add Tempo Change';
      case 'timesig':
        return 'Add Time Signature Change';
      case 'section':
        return 'Add Song Section';
      case 'chord':
        return 'Add Chord';
      default:
        return 'Add Item';
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'tempo':
        return 'Add a tempo change marker to the timeline';
      case 'timesig':
        return 'Add a time signature change marker to the timeline';
      case 'section':
        return 'Add a song section marker to the timeline';
      case 'chord':
        return 'Add a chord marker to the timeline';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={type === 'chord' ? 'sm:max-w-[600px] max-h-[90vh] overflow-y-auto' : 'sm:max-w-[450px]'}>
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Time input (common for all types) */}
          <div className="space-y-2">
            <Label htmlFor="time">Time (seconds)</Label>
            <Input
              id="time"
              type="number"
              step="0.1"
              placeholder="0.00"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          {/* Type-specific fields */}
          {type === 'tempo' && (
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
          )}

          {type === 'timesig' && (
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
          )}

          {type === 'section' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="section-type">Section Type</Label>
                <Select value={sectionType} onValueChange={setSectionType}>
                  <SelectTrigger id="section-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTION_TYPES.map((st) => (
                      <SelectItem key={st.value} value={st.value}>
                        {st.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="section-label">Section Label</Label>
                <Input
                  id="section-label"
                  placeholder="e.g., Verse 1, Chorus"
                  value={sectionLabel}
                  onChange={(e) => setSectionLabel(e.target.value)}
                />
              </div>
            </>
          )}

          {type === 'chord' && (
            <div className="space-y-4">
              {/* Chord Builder */}
              <div className="space-y-3">
                <Label>Chord Builder</Label>
                
                {/* Root Note and Accidental */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="root-note" className="text-xs text-gray-600">
                      Root Note
                    </Label>
                    <Select value={rootNote} onValueChange={setRootNote}>
                      <SelectTrigger id="root-note">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROOT_NOTES.map((note) => (
                          <SelectItem key={note} value={note}>
                            {note}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="accidental" className="text-xs text-gray-600">
                      Accidental
                    </Label>
                    <Select value={accidental} onValueChange={setAccidental}>
                      <SelectTrigger id="accidental">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ACCIDENTALS.map((acc) => (
                          <SelectItem key={acc.value} value={acc.value}>
                            {acc.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Quality */}
                <div className="space-y-2">
                  <Label htmlFor="quality" className="text-xs text-gray-600">
                    Quality
                  </Label>
                  <Select value={quality} onValueChange={setQuality}>
                    <SelectTrigger id="quality">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QUALITIES.map((qual) => (
                        <SelectItem key={qual.value} value={qual.value}>
                          {qual.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Extension */}
                <div className="space-y-2">
                  <Label htmlFor="extension" className="text-xs text-gray-600">
                    Extension
                  </Label>
                  <Select value={extension} onValueChange={setExtension}>
                    <SelectTrigger id="extension">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXTENSIONS.map((ext) => (
                        <SelectItem key={ext.value} value={ext.value}>
                          {ext.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Bass Inversion */}
                <div className="space-y-2">
                  <Label htmlFor="bass-note" className="text-xs text-gray-600">
                    Bass Note (Inversion)
                  </Label>
                  <Select value={bassNote || 'none'} onValueChange={(val) => setBassNote(val === 'none' ? '' : val)}>
                    <SelectTrigger id="bass-note">
                      <SelectValue placeholder="None (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {ROOT_NOTES.map((note) => (
                        <SelectItem key={note} value={note}>
                          {note}
                        </SelectItem>
                      ))}
                      {ROOT_NOTES.map((note) => (
                        <SelectItem key={`${note}#`} value={`${note}#`}>
                          {note}♯
                        </SelectItem>
                      ))}
                      {ROOT_NOTES.map((note) => (
                        <SelectItem key={`${note}b`} value={`${note}b`}>
                          {note}♭
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Generated Chord Name */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <Label className="text-xs text-gray-600">Generated Chord</Label>
                  <p className="text-xl font-semibold text-blue-700">{chord || 'C'}</p>
                </div>
              </div>

              {/* Custom Diagram Editor */}
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCustomDiagramMode(!customDiagramMode)}
                  className="w-full"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  {customDiagramMode ? 'Hide' : 'Customize'} Chord Diagrams
                </Button>

                {customDiagramMode && (
                  <div className="border rounded-md p-4 space-y-4">
                    {/* Capo Input */}
                    <div className="space-y-2">
                      <Label htmlFor="capo" className="text-sm">
                        Capo Fret (0 = no capo)
                      </Label>
                      <Input
                        id="capo"
                        type="number"
                        min="0"
                        max="12"
                        placeholder="0"
                        value={capo}
                        onChange={(e) => setCapo(parseInt(e.target.value) || 0)}
                      />
                    </div>

                    <Tabs defaultValue="guitar">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="guitar">Guitar</TabsTrigger>
                        <TabsTrigger value="ukulele">Ukulele</TabsTrigger>
                        <TabsTrigger value="piano">Piano</TabsTrigger>
                      </TabsList>

                      {/* Guitar Tab */}
                      <TabsContent value="guitar" className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="guitar-start-fret" className="text-sm">
                            Diagram Start Fret
                          </Label>
                          <Input
                            id="guitar-start-fret"
                            type="number"
                            min="1"
                            max="15"
                            placeholder="1"
                            value={guitarStartFret}
                            onChange={(e) => setGuitarStartFret(parseInt(e.target.value) || 1)}
                          />
                          <p className="text-xs text-gray-500">
                            Set the starting fret number for the diagram (e.g., 5 for barre chords)
                          </p>
                        </div>
                        <InteractiveGuitarDiagram
                          frets={guitarFrets}
                          fingers={guitarFingers}
                          startFret={guitarStartFret}
                          onChange={(newFrets, newFingers) => {
                            setGuitarFrets(newFrets);
                            setGuitarFingers(newFingers);
                          }}
                        />
                      </TabsContent>

                      {/* Ukulele Tab */}
                      <TabsContent value="ukulele" className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="ukulele-start-fret" className="text-sm">
                            Diagram Start Fret
                          </Label>
                          <Input
                            id="ukulele-start-fret"
                            type="number"
                            min="1"
                            max="15"
                            placeholder="1"
                            value={ukuleleStartFret}
                            onChange={(e) => setUkuleleStartFret(parseInt(e.target.value) || 1)}
                          />
                          <p className="text-xs text-gray-500">
                            Set the starting fret number for the diagram
                          </p>
                        </div>
                        <InteractiveUkuleleDiagram
                          frets={ukuleleFrets}
                          fingers={ukuleleFingers}
                          startFret={ukuleleStartFret}
                          onChange={(newFrets, newFingers) => {
                            setUkuleleFrets(newFrets);
                            setUkuleleFingers(newFingers);
                          }}
                        />
                      </TabsContent>

                      {/* Piano Tab */}
                      <TabsContent value="piano" className="space-y-3">
                        <InteractivePianoDiagram
                          keys={pianoKeys}
                          onChange={(newKeys) => {
                            setPianoKeys(newKeys);
                          }}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
