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
import { Switch } from './ui/switch';
import { Plus, Edit3, Trash2 } from 'lucide-react'; // Adicionado Trash2
import { InteractiveGuitarDiagram } from './InteractiveGuitarDiagram';
import { InteractiveUkuleleDiagram } from './InteractiveUkuleleDiagram';
import { InteractivePianoDiagram } from './InteractivePianoDiagram';
import { ChordMarker, SectionMarker, TempoChange } from '../types'; // Importar tipos
import { useLanguage } from '../lib/LanguageContext'; // Importar useLanguage

// Chord database (simplificado - manter ou expandir conforme necessário)
const chordDatabase: Record<string, {
  guitar: { frets: number[]; fingers?: number[]; baseFret?: number };
  piano: { keys: string[] };
  ukulele: { frets: number[]; fingers?: number[] };
}> = {
  'C': { guitar: { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] }, piano: { keys: ['C', 'E', 'G'] }, ukulele: { frets: [0, 0, 0, 3], fingers: [0, 0, 0, 3] } },
  'D': { guitar: { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] }, piano: { keys: ['D', 'F#', 'A'] }, ukulele: { frets: [2, 2, 2, 0], fingers: [1, 1, 1, 0] } },
  'E': { guitar: { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] }, piano: { keys: ['E', 'G#', 'B'] }, ukulele: { frets: [4, 4, 4, 2], fingers: [3, 3, 3, 1] } },
  'F': { guitar: { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1] }, piano: { keys: ['F', 'A', 'C'] }, ukulele: { frets: [2, 0, 1, 0], fingers: [2, 0, 1, 0] } },
  'G': { guitar: { frets: [3, 2, 0, 0, 0, 3], fingers: [3, 2, 0, 0, 0, 4] }, piano: { keys: ['G', 'B', 'D'] }, ukulele: { frets: [0, 2, 3, 2], fingers: [0, 1, 3, 2] } },
  'A': { guitar: { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] }, piano: { keys: ['A', 'C#', 'E'] }, ukulele: { frets: [2, 1, 0, 0], fingers: [2, 1, 0, 0] } },
  'B': { guitar: { frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1] }, piano: { keys: ['B', 'D#', 'F#'] }, ukulele: { frets: [4, 3, 2, 2], fingers: [4, 3, 1, 2] } },
  'Am': { guitar: { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] }, piano: { keys: ['A', 'C', 'E'] }, ukulele: { frets: [2, 0, 0, 0], fingers: [1, 0, 0, 0] } },
  'Bm': { guitar: { frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1] }, piano: { keys: ['B', 'D', 'F#'] }, ukulele: { frets: [4, 2, 2, 2], fingers: [4, 1, 1, 1] } },
  'Cm': { guitar: { frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1] }, piano: { keys: ['C', 'Eb', 'G'] }, ukulele: { frets: [0, 3, 3, 3], fingers: [0, 1, 1, 1] } },
  'Dm': { guitar: { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] }, piano: { keys: ['D', 'F', 'A'] }, ukulele: { frets: [2, 2, 1, 0], fingers: [2, 3, 1, 0] } },
  'Em': { guitar: { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] }, piano: { keys: ['E', 'G', 'B'] }, ukulele: { frets: [0, 4, 3, 2], fingers: [0, 4, 3, 2] } },
  'Fm': { guitar: { frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1] }, piano: { keys: ['F', 'Ab', 'C'] }, ukulele: { frets: [1, 0, 1, 3], fingers: [1, 0, 2, 4] } },
  'Gm': { guitar: { frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1] }, piano: { keys: ['G', 'Bb', 'D'] }, ukulele: { frets: [0, 2, 3, 1], fingers: [0, 2, 3, 1] } },
  'Am7': { guitar: { frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0] }, piano: { keys: ['A', 'C', 'E', 'G'] }, ukulele: { frets: [0, 0, 0, 0], fingers: [0, 0, 0, 0] } },
  'C7': { guitar: { frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] }, piano: { keys: ['C', 'E', 'G', 'Bb'] }, ukulele: { frets: [0, 0, 0, 1], fingers: [0, 0, 0, 1] } },
  'D7': { guitar: { frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] }, piano: { keys: ['D', 'F#', 'A', 'C'] }, ukulele: { frets: [2, 2, 2, 3], fingers: [1, 1, 1, 2] } },
  'E7': { guitar: { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] }, piano: { keys: ['E', 'G#', 'B', 'D'] }, ukulele: { frets: [1, 2, 0, 2], fingers: [1, 2, 0, 3] } },
  'G7': { guitar: { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] }, piano: { keys: ['G', 'B', 'D', 'F'] }, ukulele: { frets: [0, 2, 1, 2], fingers: [0, 2, 1, 3] } },
};


const TIME_SIG_DENOMINATORS = [
  { value: '1', label: '1 (Whole Note)' },
  { value: '2', label: '2 (Half Note)' },
  { value: '4', label: '4 (Quarter Note)' },
  { value: '8', label: '8 (Eighth Note)' },
  { value: '16', label: '16 (Sixteenth Note)' },
  { value: '32', label: '32 (32nd Note)' },
];

const TIME_SIG_PRESETS = [
  { numerator: '4', denominator: '4', label: '4/4 (Common Time)' },
  { numerator: '3', denominator: '4', label: '3/4 (Waltz)' },
  { numerator: '6', denominator: '8', label: '6/8' },
  { numerator: '2', denominator: '4', label: '2/4' },
  { numerator: '5', denominator: '4', label: '5/4' },
  { numerator: '7', denominator: '8', label: '7/8' },
  { numerator: '9', denominator: '8', label: '9/8' },
  { numerator: '12', denominator: '8', label: '12/8' },
];

const SECTION_TYPES = [
  { value: 'intro', label: 'Intro' }, { value: 'verse', label: 'Verse' }, { value: 'chorus', label: 'Chorus' },
  { value: 'bridge', label: 'Bridge' }, { value: 'outro', label: 'Outro' }, { value: 'pre-chorus', label: 'Pre-Chorus' },
  { value: 'instrumental', label: 'Instrumental' }, { value: 'tag', label: 'Tag' }, { value: 'custom', label: 'Custom' }
];

const ROOT_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const ACCIDENTALS = [
  { value: 'natural', label: 'Natural', symbol: '' }, { value: 'sharp', label: '♯ (Sharp)', symbol: '#' },
  { value: 'flat', label: '♭ (Flat)', symbol: 'b' },
];
const QUALITIES = [
  { value: 'major', label: 'Major', suffix: '' }, { value: 'minor', label: 'Minor', suffix: 'm' },
  { value: 'diminished', label: 'Diminished', suffix: 'dim' }, { value: 'augmented', label: 'Augmented', suffix: 'aug' },
  { value: 'sus2', label: 'Suspended 2nd', suffix: 'sus2' }, { value: 'sus4', label: 'Suspended 4th', suffix: 'sus4' },
];
const EXTENSIONS = [
  { value: 'none', label: 'None', suffix: '' }, { value: '7', label: 'Dominant 7th', suffix: '7' },
  { value: 'maj7', label: 'Major 7th', suffix: 'maj7' }, { value: '9', label: '9th', suffix: '9' },
  { value: 'maj9', label: 'Major 9th', suffix: 'maj9' }, { value: '11', label: '11th', suffix: '11' },
  { value: '13', label: '13th', suffix: '13' }, { value: '6', label: '6th', suffix: '6' },
  { value: 'add9', label: 'Add 9', suffix: 'add9' },
];

interface MarkerEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'tempo_timesig' | 'section' | 'chord';
  currentTime: number;
  initialData?: TempoChange | SectionMarker | ChordMarker | null;
  onSubmit: (action: 'add' | 'update' | 'delete', data: any) => void;
}

export function MarkerEditorDialog({
  open,
  onOpenChange,
  type,
  currentTime,
  initialData,
  onSubmit,
}: MarkerEditorDialogProps) {
  const { t } = useLanguage();
  const isEditing = !!initialData;

  // Common state
  const [time, setTime] = useState('0');

  // Tempo state
  const [tempo, setTempo] = useState('120');
  const [enableCurve, setEnableCurve] = useState(false);
  const [curveType, setCurveType] = useState<'linear' | 'exponential'>('linear');
  const [targetTempo, setTargetTempo] = useState('120');
  const [targetTime, setTargetTime] = useState('0');

  // Time Signature state
  const [timeSignatureNumerator, setTimeSignatureNumerator] = useState('4');
  const [timeSignatureDenominator, setTimeSignatureDenominator] = useState('4');
  const [subdivision, setSubdivision] = useState('');

  // Common marker state
  const [hidden, setHidden] = useState(false);

  // Section state
  const [sectionLabel, setSectionLabel] = useState('');
  const [sectionType, setSectionType] = useState('verse');

  // Chord state
  const [chord, setChord] = useState('');
  const [chordRoot, setChordRoot] = useState('C');
  const [chordAccidental, setChordAccidental] = useState('natural');
  const [chordQuality, setChordQuality] = useState('major');
  const [chordExtension, setChordExtension] = useState('none');
  const [isCustomizingDiagram, setIsCustomizingDiagram] = useState(false);
  const [customDiagram, setCustomDiagram] = useState<any>(null);
  // ... (o resto do estado de acordes pode ser mantido como está)

  useEffect(() => {
    if (open) {
      if (isEditing && initialData) {
        setTime(initialData.time.toFixed(2));
        if (type === 'tempo_timesig' && 'tempo' in initialData) {
          const data = initialData as TempoChange;
          setTempo(String(data.tempo));
          const [num, den] = data.timeSignature.split('/');
          setTimeSignatureNumerator(num);
          setTimeSignatureDenominator(den);
          setHidden(data.hidden || false);
          setSubdivision(data.subdivision || '');
          if (data.curve) {
            setEnableCurve(true);
            setCurveType(data.curve.type);
            setTargetTempo(String(data.curve.targetTempo));
            setTargetTime(String(data.curve.targetTime));
          } else {
            setEnableCurve(false);
          }
        }
        if (type === 'section' && 'label' in initialData) {
          const data = initialData as SectionMarker;
          setSectionLabel(data.label);
          setSectionType(data.type);
        }
        if (type === 'chord' && 'chord' in initialData) {
          const data = initialData as ChordMarker;
          setChord(data.chord);
          // TODO: Deconstruct chord to set root, accidental, etc.
          if (data.customDiagram) {
            setIsCustomizingDiagram(true);
            setCustomDiagram(data.customDiagram);
          } else {
            setIsCustomizingDiagram(false);
            setCustomDiagram(null);
          }
        }
        // ... (lógica para 'section' e 'chord')
      } else {
        // Reset form for adding
        setTime(currentTime.toFixed(2));
        setTempo('120');
        setTimeSignatureNumerator('4');
        setTimeSignatureDenominator('4');
        setHidden(false);
        setSubdivision('');
        setEnableCurve(false);
        setSectionLabel('');
        setSectionType('verse');
        setChord('C');
        setChordRoot('C');
        setChordAccidental('natural');
        setChordQuality('major');
        setChordExtension('none');
        setIsCustomizingDiagram(false);
        // ... (reset para outros tipos)
      }
    }
  }, [open, isEditing, initialData, type, currentTime]);

  const handleSave = () => {
    const timeValue = parseFloat(time);
    if (isNaN(timeValue) || timeValue < 0) {
      alert('Please enter a valid time');
      return;
    }

    let data: any = { time: timeValue };

    if (type === 'tempo_timesig') {
      const tempoValue = parseInt(tempo);
      if (isNaN(tempoValue) || tempoValue < 1) {
        alert('Please enter a valid tempo (BPM)');
        return;
      }
      const num = parseInt(timeSignatureNumerator);
      const den = parseInt(timeSignatureDenominator);
      if (isNaN(num) || isNaN(den) || num < 1 || den < 1 || !Number.isInteger(Math.log2(den))) {
        alert('Please enter a valid time signature');
        return;
      }

      data.tempo = tempoValue;
      data.timeSignature = `${num}/${den}`;
      data.hidden = hidden;
      data.subdivision = subdivision.trim() || undefined;

      if (enableCurve) {
        const targetTempoValue = parseInt(targetTempo);
        const targetTimeValue = parseFloat(targetTime);
        if (isNaN(targetTempoValue) || targetTempoValue < 1) {
          alert('Please enter a valid target tempo');
          return;
        }
        if (isNaN(targetTimeValue) || targetTimeValue <= timeValue) {
          alert('Target time must be greater than start time');
          return;
        }
        data.curve = {
          type: curveType,
          targetTempo: targetTempoValue,
          targetTime: targetTimeValue,
        };
      }
    }
    if (type === 'section') {
      if (!sectionLabel.trim()) {
        alert('Please enter a section label');
        return;
      }
      data.label = sectionLabel.trim();
      data.type = sectionType;
    }
    if (type === 'chord') {
      if (!chord.trim()) {
        alert('Please enter a chord name');
        return;
      }
      data.chord = chord.trim();
      data.customDiagram = isCustomizingDiagram ? customDiagram : undefined;
    }
    // ... (lógica para 'section' e 'chord')

    onSubmit(isEditing ? 'update' : 'add', data);
  };

  const handleDelete = () => {
    if (isEditing) {
      onSubmit('delete', { id: (initialData as any)?.id, time: initialData?.time });
    }
  };

  const getTitle = () => {
    if (type === 'tempo_timesig') return isEditing ? 'Edit Marker' : 'Add Tempo/Time Signature Marker';
    if (type === 'section') return isEditing ? 'Edit Section' : 'Add Section';
    if (type === 'chord') return isEditing ? 'Edit Chord' : 'Add Chord';
    // ...
    return 'Edit Item';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-1">
            <Label htmlFor="time">Time (seconds)</Label>
            <Input id="time" type="number" step="0.01" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>

          {type === 'tempo_timesig' && (
            <Tabs defaultValue="tempo">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="tempo">Tempo</TabsTrigger>
                <TabsTrigger value="timesig">Time Signature</TabsTrigger>
              </TabsList>
              <TabsContent value="tempo" className="space-y-4 pt-4">
                <div className="space-y-1">
                  <Label htmlFor="tempo">Tempo (BPM)</Label>
                  <Input id="tempo" type="number" placeholder="120" value={tempo} onChange={(e) => setTempo(e.target.value)} />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="hidden-switch" checked={hidden} onCheckedChange={setHidden} />
                  <Label htmlFor="hidden-switch">Hide in Player Mode</Label>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch id="curve-switch" checked={enableCurve} onCheckedChange={setEnableCurve} />
                  <Label htmlFor="curve-switch">Enable Tempo Curve (Rall./Accel.)</Label>
                </div>
                {enableCurve && (
                  <div className="space-y-4 p-4 border rounded-md bg-gray-800/50">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="target-tempo">Target Tempo (BPM)</Label>
                        <Input id="target-tempo" type="number" value={targetTempo} onChange={(e) => setTargetTempo(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="target-time">Target Time (sec)</Label>
                        <Input id="target-time" type="number" step="0.01" value={targetTime} onChange={(e) => setTargetTime(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="curve-type">Curve Type</Label>
                      <Select value={curveType} onValueChange={(v: 'linear' | 'exponential') => setCurveType(v)}>
                        <SelectTrigger id="curve-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="linear">Linear</SelectItem>
                          <SelectItem value="exponential">Exponential</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Visual Preview Placeholder */}
                    <div className="h-24 bg-gray-900 rounded-md flex items-center justify-center text-sm text-gray-500">
                      Visual Curve Preview
                    </div>
                  </div>
                )}
                <div className="text-xs text-gray-400 pt-2">
                  Tempo markers define the BPM and time signature from this point forward until the next marker.
                  Hidden markers are only visible in Edit Mode.
                </div>
                {/* ... resto do form de tempo (curva, etc) */}
              </TabsContent>
              <TabsContent value="timesig" className="space-y-4 pt-4">
                {/* Conteúdo do formulário de Time Signature aqui */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="ts-num">Numerator</Label>
                    <Input id="ts-num" type="number" min="1" value={timeSignatureNumerator} onChange={(e) => setTimeSignatureNumerator(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="ts-den">Denominator</Label>
                    <Select value={timeSignatureDenominator} onValueChange={setTimeSignatureDenominator}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TIME_SIG_DENOMINATORS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="subdivision">Subdivision Pattern (for irregular time)</Label>
                  <Input id="subdivision" placeholder="e.g., 2+3 for 5/8" value={subdivision} onChange={(e) => setSubdivision(e.target.value)} />
                  <p className="text-xs text-gray-400 pt-1">
                    For time signatures like 5/8 or 7/8, define how the beats are grouped. Example: 7/8 could be "2+2+3".
                  </p>
                </div>
                {/* ... resto do form de time signature (subdivision, etc) */}
              </TabsContent>
            </Tabs>
          )}

          {type === 'section' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="section-type">Section Type</Label>
                <Select value={sectionType} onValueChange={setSectionType}>
                  <SelectTrigger id="section-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTION_TYPES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="section-label">Label</Label>
                <Input id="section-label" placeholder="e.g., Verse 1" value={sectionLabel} onChange={(e) => setSectionLabel(e.target.value)} />
              </div>
            </div>
          )}

          {type === 'chord' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Chord Name</Label>
                <Input placeholder="e.g., C#m7/G#" value={chord} onChange={(e) => setChord(e.target.value)} />
                <p className="text-xs text-gray-400 pt-1">
                  Enter the chord name directly. For custom diagrams, use the section below.
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Switch id="custom-diagram-switch" checked={isCustomizingDiagram} onCheckedChange={setIsCustomizingDiagram} />
                <Label htmlFor="custom-diagram-switch">Customize Chord Diagram</Label>
              </div>

              {isCustomizingDiagram && (
                <Tabs defaultValue="guitar" className="p-4 border rounded-md bg-gray-800/50">
                  <TabsList>
                    <TabsTrigger value="guitar">Guitar</TabsTrigger>
                    <TabsTrigger value="ukulele">Ukulele</TabsTrigger>
                    <TabsTrigger value="piano">Piano</TabsTrigger>
                  </TabsList>
                  <TabsContent value="guitar" className="pt-4">
                    <InteractiveGuitarDiagram
                      initialFrets={customDiagram?.guitar?.frets}
                      initialFingers={customDiagram?.guitar?.fingers}
                      initialBaseFret={customDiagram?.guitar?.startFret}
                      onChange={(data) => setCustomDiagram((prev: any) => ({
                        ...prev,
                        guitar: {
                          frets: data.frets,
                          fingers: data.fingers,
                          startFret: data.baseFret,
                        }
                      }))}
                    />
                  </TabsContent>
                  <TabsContent value="ukulele" className="pt-4">
                    <InteractiveUkuleleDiagram
                      initialFrets={customDiagram?.ukulele?.frets}
                      initialFingers={customDiagram?.ukulele?.fingers}
                      onChange={(data) => setCustomDiagram((prev: any) => ({
                        ...prev,
                        ukulele: {
                          frets: data.frets,
                          fingers: data.fingers,
                        }
                      }))}
                    />
                  </TabsContent>
                  <TabsContent value="piano" className="pt-4">
                    <InteractivePianoDiagram
                      initialKeys={customDiagram?.piano?.keys}
                      onChange={(data) => setCustomDiagram((prev: any) => ({
                        ...prev,
                        piano: {
                          keys: data.keys,
                        }
                      }))}
                    />
                  </TabsContent>
                </Tabs>
              )}
            </div>
          )}

          {/* ... (renderização para 'section' e 'chord') */}

        </div>
        <div className="flex gap-2 justify-end pt-4">
          {isEditing && (
            <Button variant="destructive" onClick={handleDelete} className="mr-auto">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>{isEditing ? 'Update' : 'Add'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
