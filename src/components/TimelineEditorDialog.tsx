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
import { toast } from 'sonner';
import { 
  analyzeTimeSignature, 
  getSubdivisionPresets, 
  parseChordName, 
  generateChordName,
  CHORD_DATABASE,
  TIME_SIG_DENOMINATORS,
  TIME_SIG_PRESETS,
  ROOT_NOTES,
  ACCIDENTALS,
  QUALITIES,
  EXTENSIONS
} from '../lib/musicTheory';

interface TimelineEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'tempo' | 'timesig' | 'section' | 'chord';
  currentTime: number; // Usado como fallback se não houver initialData
  initialData?: ChordMarker | SectionMarker | TempoChange | null; // Dados para edição
  onSubmit: (action: 'add' | 'update' | 'delete', data: any) => void; // Função unificada
}

const SECTION_TYPES = [
  { value: 'intro', label: 'Intro' }, { value: 'verse', label: 'Verse' }, { value: 'chorus', label: 'Chorus' },
  { value: 'bridge', label: 'Bridge' }, { value: 'outro', label: 'Outro' }, { value: 'pre-chorus', label: 'Pre-Chorus' },
  { value: 'instrumental', label: 'Instrumental' }, { value: 'tag', label: 'Tag' }, { value: 'custom', label: 'Custom' } // Adicionado custom
];

export function TimelineEditorDialog({
  open,
  onOpenChange,
  type,
  currentTime,
  initialData,
  onSubmit,
}: TimelineEditorDialogProps) {
  const { t } = useLanguage(); // Usa traduções
  const isEditing = !!initialData;

  // Estados
  const [time, setTime] = useState('0');
  const [tempo, setTempo] = useState('120');
  const [timeSignatureNumerator, setTimeSignatureNumerator] = useState('4');
  const [timeSignatureDenominator, setTimeSignatureDenominator] = useState('4');
  const [hidden, setHidden] = useState(false); // Hide in player mode
  const [sectionLabel, setSectionLabel] = useState('');
  const [sectionType, setSectionType] = useState('verse');
  const [chord, setChord] = useState('');
  const [rootNote, setRootNote] = useState('C');
  const [accidental, setAccidental] = useState('natural');
  const [quality, setQuality] = useState('major');
  const [extension, setExtension] = useState('none');
  const [bassNote, setBassNote] = useState('');
  const [customDiagramMode, setCustomDiagramMode] = useState(false);
  const [guitarFrets, setGuitarFrets] = useState<number[]>([-1, 3, 2, 0, 1, 0]);
  const [guitarFingers, setGuitarFingers] = useState<number[]>([0, 3, 2, 0, 1, 0]);
  const [guitarStartFret, setGuitarStartFret] = useState(1);
  const [ukuleleFrets, setUkuleleFrets] = useState<number[]>([0, 0, 0, 3]);
  const [ukuleleFingers, setUkuleleFingers] = useState<number[]>([0, 0, 0, 3]);
  const [ukuleleStartFret, setUkuleleStartFret] = useState(1);
  const [pianoKeys, setPianoKeys] = useState<string[]>(['C', 'E', 'G']);
  const [capo, setCapo] = useState(0);
  
  // Irregular time signature subdivision
  const [subdivision, setSubdivision] = useState('');
  
  // Tempo curves
  const [enableCurve, setEnableCurve] = useState(false);
  const [curveType, setCurveType] = useState<'linear' | 'exponential'>('linear');
  const [targetTempo, setTargetTempo] = useState('120');
  const [targetTime, setTargetTime] = useState('0');

  // Novo estado para o tipo de time signature
  const [tsType, setTsType] = useState<'simple' | 'compound' | 'irregular'>('simple');

  // Função para limpar o formulário (usada ao abrir para adicionar)
    const resetForm = () => {
        setTime(currentTime.toFixed(2)); // Usa o currentTime passado
        setTempo('120');
        setTimeSignatureNumerator('4');
        setTimeSignatureDenominator('4');
        setHidden(false);
        setSectionLabel('');
        setSectionType('verse');
        setChord('');
        setRootNote('C');
        setAccidental('natural');
        setQuality('major');
        setExtension('none');
        setBassNote('');
        setCustomDiagramMode(false);
        // Reseta diagramas para C Major padrão
        const cMajorData = CHORD_DATABASE['C'];
        setGuitarFrets(cMajorData?.guitar.frets || [-1, 3, 2, 0, 1, 0]);
        setGuitarFingers(cMajorData?.guitar.fingers || [0, 3, 2, 0, 1, 0]);
        setGuitarStartFret(cMajorData?.guitar.startFret || 1);
        setUkuleleFrets(cMajorData?.ukulele.frets || [0, 0, 0, 3]);
        setUkuleleFingers(cMajorData?.ukulele.fingers || [0, 0, 0, 3]);
        setUkuleleStartFret(1);
        setPianoKeys(cMajorData?.piano.keys || ['C', 'E', 'G']);
        setCapo(0);
        setSubdivision('');
        setEnableCurve(false);
        setCurveType('linear');
        setTargetTempo('120');
        setTargetTime('0');
    };




  // Efeito para preencher/resetar formulário
  useEffect(() => {
    if (open) { // Executa somente quando o dialog abre
        if (isEditing && initialData) {
            setTime(initialData.time.toFixed(2));
            if (type === 'chord') {
                const chordData = initialData as ChordMarker;
                const parsed = parseChordName(chordData.chord);
                setRootNote(parsed.root);
                setAccidental(parsed.accidental);
                setQuality(parsed.quality);
                setExtension(parsed.extension);
                setBassNote(parsed.bassNote);
                setChord(chordData.chord);
                
                if (chordData.customDiagram) {
                    setCustomDiagramMode(true);
                    setGuitarFrets(chordData.customDiagram.guitar.frets);
                    setGuitarFingers(chordData.customDiagram.guitar.fingers);
                    setGuitarStartFret(chordData.customDiagram.guitar.startFret || 1);
                    setUkuleleFrets(chordData.customDiagram.ukulele.frets);
                    setUkuleleFingers(chordData.customDiagram.ukulele.fingers);
                    setUkuleleStartFret(chordData.customDiagram.ukulele.startFret || 1);
                    setPianoKeys(chordData.customDiagram.piano.keys);
                    setCapo(chordData.customDiagram.capo || 0);
                } else {
                    setCustomDiagramMode(false);
                    // Tenta popular diagramas padrão
                    const baseChord = chordData.chord.split('/')[0];
                    const dbData = CHORD_DATABASE[baseChord];
                    setGuitarFrets(dbData?.guitar?.frets || [-1,-1,-1,-1,-1,-1]);
                    setGuitarFingers(dbData?.guitar?.fingers || [0,0,0,0,0,0]);
                    setGuitarStartFret(dbData?.guitar?.startFret || 1);
                    setUkuleleFrets(dbData?.ukulele?.frets || [0,0,0,0]);
                    setUkuleleFingers(dbData?.ukulele?.fingers || [0,0,0,0]);
                    setUkuleleStartFret(1);
                    setPianoKeys(dbData?.piano?.keys || []);
                    setCapo(0);
                }
            }
            // Adicionar preenchimento para outros tipos (tempo, section) aqui
            else if (type === 'tempo' && 'tempo' in initialData) {
                 const tempoData = initialData as TempoChange;
                 setTempo(String(tempoData.tempo));
                 setHidden(tempoData.hidden || false);
                 setSubdivision(tempoData.subdivision || '');
                 if (tempoData.curve) {
                   setEnableCurve(true);
                   setCurveType(tempoData.curve.type);
                   setTargetTempo(String(tempoData.curve.targetTempo));
                   setTargetTime(String(tempoData.curve.targetTime));
                 }
            } else if (type === 'timesig' && 'timeSignature' in initialData) {
                 const timesigData = initialData as TempoChange;
                 const [num, den] = timesigData.timeSignature.split('/');
                 setTimeSignatureNumerator(num);
                 setTimeSignatureDenominator(den);
                 setHidden(timesigData.hidden || false);
                 setSubdivision(timesigData.subdivision || '');
            } else if (type === 'section' && 'label' in initialData) {
                 setSectionLabel(initialData.label);
                 setSectionType(initialData.type || 'custom');
            }

        } else {
            resetForm(); // Limpa para adicionar novo
        }
    }
  }, [open, isEditing, initialData, type, currentTime]); // Depende de `open` para re-executar

  // Auto-detect Time Signature Type
  useEffect(() => {
    const num = parseInt(timeSignatureNumerator);
    const den = parseInt(timeSignatureDenominator);
    if (!isNaN(num) && !isNaN(den)) {
      const info = analyzeTimeSignature(num, den, subdivision);
      setTsType(info.type);
    }
  }, [timeSignatureNumerator, timeSignatureDenominator, subdivision]);

  // Auto-gerar nome do acorde
  useEffect(() => {
    if (type === 'chord') {
      const chordName = generateChordName(rootNote, accidental, quality, extension, bassNote);
      setChord(chordName);
    }
  }, [rootNote, accidental, quality, extension, bassNote, type]);

  // Auto-atualizar diagramas padrão (se não estiver em modo custom)
  useEffect(() => {
    if (type === 'chord' && chord && !customDiagramMode) {
      const baseChord = chord.split('/')[0];
      const chordData = CHORD_DATABASE[baseChord];
      if (chordData) {
        setGuitarFrets(chordData.guitar?.frets || [-1,-1,-1,-1,-1,-1]);
        setGuitarFingers(chordData.guitar?.fingers || [0,0,0,0,0,0]);
        setGuitarStartFret(chordData.guitar?.startFret || 1);
        setUkuleleFrets(chordData.ukulele?.frets || [0,0,0,0]);
        setUkuleleFingers(chordData.ukulele?.fingers || [0,0,0,0]);
        setUkuleleStartFret(1);
        setPianoKeys(chordData.piano?.keys || []);
        // Não reseta capo aqui, pois pode ser intencional
      }
    }
  }, [chord, type, customDiagramMode]);


  // Salvar alterações
  const handleSave = () => {
    const timeValue = parseFloat(time);
    if (isNaN(timeValue) || timeValue < 0) { toast.error('Please enter a valid time'); return; }

    let data: any = { time: timeValue };

    switch (type) {
        case 'tempo':
            const tempoValue = parseInt(tempo);
            if (isNaN(tempoValue) || tempoValue < 1) { toast.error('Please enter a valid tempo (BPM)'); return; }
            data.tempo = tempoValue;
            // Use current state values for time signature
            data.timeSignature = `${timeSignatureNumerator}/${timeSignatureDenominator}`;
            data.hidden = hidden;
            data.subdivision = subdivision.trim() || undefined;
            
            // Add tempo curve if enabled
            if (enableCurve) {
              const targetTempoValue = parseInt(targetTempo);
              const targetTimeValue = parseFloat(targetTime);
              if (isNaN(targetTempoValue) || targetTempoValue < 1) {
                toast.error('Please enter a valid target tempo (BPM)');
                return;
              }
              if (isNaN(targetTimeValue) || targetTimeValue <= timeValue) {
                toast.error('Target time must be greater than start time');
                return;
              }
              data.curve = {
                type: curveType,
                targetTempo: targetTempoValue,
                targetTime: targetTimeValue,
              };
            }
            break;
        case 'timesig':
            const num = parseInt(timeSignatureNumerator);
            const den = parseInt(timeSignatureDenominator);
            if (isNaN(num) || isNaN(den) || num < 1 || den < 1 || !Number.isInteger(Math.log2(den))) { toast.error('Please enter a valid time signature (e.g., 4/4, 3/4, 6/8)'); return; }
            data.timeSignature = `${num}/${den}`;
            // Mantém tempo existente se estiver editando, senão pega um default
            data.tempo = (isEditing && initialData && 'tempo' in initialData) ? initialData.tempo : parseInt(tempo);
            data.hidden = hidden;
            data.subdivision = subdivision.trim() || undefined;
            break;
      case 'section':
        if (!sectionLabel.trim()) { toast.error('Please enter a section label'); return; }
        data.label = sectionLabel.trim();
        data.type = sectionType;
        break;
      case 'chord':
        if (!chord.trim()) { toast.error('Chord name is empty or invalid'); return; }
        data.chord = chord.trim();
        if (customDiagramMode) {
          data.customDiagram = {
            guitar: { frets: guitarFrets, fingers: guitarFingers, startFret: guitarStartFret },
            ukulele: { frets: ukuleleFrets, fingers: ukuleleFingers, startFret: ukuleleStartFret },
            piano: { keys: pianoKeys },
            capo: capo > 0 ? capo : undefined
          };
        } else {
            // Garante que customDiagram seja undefined se não estiver ativo
            data.customDiagram = undefined;
        }
        break;
    }

    onSubmit(isEditing ? 'update' : 'add', data);
  };

  // Excluir item
  const handleDelete = () => {
      if (isEditing) {
          onSubmit('delete', {}); // Envia ação delete, dados não são necessários aqui
      }
  };


  const getTitle = () => { /* ... mantido ... */
      switch(type){case 'tempo':return 'Add Tempo'; case 'timesig':return 'Add Time Sig'; case 'section':return 'Add Section'; case 'chord':return 'Add Chord'; default:return 'Add Item';}
  };
  const getDescription = () => { /* ... mantido ... */
       switch(type){case 'tempo':return 'Add tempo marker'; case 'timesig':return 'Add time signature marker'; case 'section':return 'Add section marker'; case 'chord':return 'Add chord marker'; default:return '';}
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={type === 'chord' ? 'sm:max-w-[600px] max-h-[90vh] overflow-y-auto' : 'sm:max-w-[450px]'}>
        <DialogHeader>
           <DialogTitle>{isEditing ? `Edit ${type}` : getTitle()}</DialogTitle>
           <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Time Input */}
          <div className="space-y-1">
            <Label htmlFor="time">Time (seconds)</Label>
            <Input id="time" type="number" step="0.01" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>

          {/* Campos Tempo */}
          {type === 'tempo' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="tempo">Tempo (BPM)</Label>
                <Input id="tempo" type="number" placeholder="120" value={tempo} onChange={(e) => setTempo(e.target.value)} />
              </div>

              {/* Time Signature Section */}
              <div className="space-y-3 border border-[#2B2B2B] rounded-md p-3">
                 <Label className="text-sm font-semibold">Time Signature</Label>
                 
                 <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <Label htmlFor="ts-num" className="text-xs text-muted-foreground">Numerator</Label>
                        <Input 
                          id="ts-num" 
                          type="number" 
                          min="1" 
                          max="32"
                          value={timeSignatureNumerator} 
                          onChange={(e)=>setTimeSignatureNumerator(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="ts-den" className="text-xs text-muted-foreground">Denominator</Label>
                        <Select 
                          value={timeSignatureDenominator} 
                          onValueChange={setTimeSignatureDenominator}
                        >
                          <SelectTrigger id="ts-den">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_SIG_DENOMINATORS.map(d => (
                              <SelectItem key={d.value} value={d.value}>{d.value}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                    </div>
                 </div>

                 {/* Type Display & Subdivision */}
                 <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-muted-foreground">
                        Type: <span className="font-semibold text-primary capitalize">{tsType}</span>
                    </div>
                    
                    {tsType === 'irregular' && (
                        <div className="flex items-center gap-2 flex-1 justify-end">
                            <div className="text-xs font-mono bg-black/20 px-2 py-1 rounded border border-white/10">
                                {subdivision || 'Default'}
                            </div>
                        </div>
                    )}
                 </div>
                 
                 {/* Visual Feedback */}
                 <div className="pt-2">
                    <TimeSignatureVisualizer 
                        numerator={parseInt(timeSignatureNumerator) || 4} 
                        denominator={parseInt(timeSignatureDenominator) || 4} 
                        subdivision={subdivision} 
                        onSubdivisionChange={setSubdivision}
                    />
                 </div>
              </div>
              
              {/* Tempo Curve (Rallentando/Accelerando) */}
              <div className="space-y-3 border border-[#2B2B2B] rounded-md p-3">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="enable-curve" 
                    checked={enableCurve} 
                    onCheckedChange={setEnableCurve} 
                  />
                  <Label htmlFor="enable-curve" className="text-sm cursor-pointer">
                    Enable Tempo Curve (Rallentando/Accelerando)
                  </Label>
                </div>
                
                {enableCurve && (
                  <div className="space-y-3 pl-6">
                    <div className="space-y-1">
                      <Label htmlFor="curve-type" className="text-xs text-muted-foreground">Curve Type</Label>
                      <Select value={curveType} onValueChange={(v: 'linear' | 'exponential') => setCurveType(v)}>
                        <SelectTrigger id="curve-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="linear">Linear (constant rate)</SelectItem>
                          <SelectItem value="exponential">Exponential (natural feel)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="target-tempo" className="text-xs text-muted-foreground">Target Tempo</Label>
                        <Input
                          id="target-tempo"
                          type="number"
                          placeholder="90"
                          value={targetTempo}
                          onChange={(e) => setTargetTempo(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="target-time" className="text-xs text-muted-foreground">Target Time (sec)</Label>
                        <Input
                          id="target-time"
                          type="number"
                          step="0.1"
                          placeholder="8.0"
                          value={targetTime}
                          onChange={(e) => setTargetTime(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="bg-[#1E1E1E] border border-[#2B2B2B] rounded-md p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground text-xs">Curve Preview:</p>
                        {parseInt(tempo) > parseInt(targetTempo) ? (
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            Rallentando (slowing down)
                          </span>
                        ) : parseInt(tempo) < parseInt(targetTempo) ? (
                          <span className="text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                            Accelerando (speeding up)
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-500/20 text-gray-400 border border-gray-500/30">
                            No change
                          </span>
                        )}
                      </div>
                      
                      {/* Visual curve graph */}
                      <div className="relative w-full h-16 bg-[#171717] rounded border border-[#2B2B2B] overflow-hidden">
                        <svg width="100%" height="100%" viewBox="0 0 200 60" preserveAspectRatio="none">
                          {/* Grid lines */}
                          <line x1="0" y1="15" x2="200" y2="15" stroke="#2B2B2B" strokeWidth="0.5" strokeDasharray="2,2" />
                          <line x1="0" y1="30" x2="200" y2="30" stroke="#2B2B2B" strokeWidth="0.5" strokeDasharray="2,2" />
                          <line x1="0" y1="45" x2="200" y2="45" stroke="#2B2B2B" strokeWidth="0.5" strokeDasharray="2,2" />
                          
                          {/* Tempo curve */}
                          {(() => {
                            const startTempo = parseInt(tempo) || 120;
                            const endTempo = parseInt(targetTempo) || 120;
                            const maxTempo = Math.max(startTempo, endTempo, 180);
                            const minTempo = Math.min(startTempo, endTempo, 60);
                            const tempoRange = maxTempo - minTempo || 1;
                            
                            // Calculate y positions (inverted for display)
                            const startY = 55 - ((startTempo - minTempo) / tempoRange) * 50;
                            const endY = 55 - ((endTempo - minTempo) / tempoRange) * 50;
                            
                            if (curveType === 'linear') {
                              // Linear curve - straight line
                              return (
                                <line 
                                  x1="10" 
                                  y1={startY} 
                                  x2="190" 
                                  y2={endY} 
                                  stroke={startTempo > endTempo ? "#60a5fa" : "#fb923c"}
                                  strokeWidth="2"
                                />
                              );
                            } else {
                              // Exponential curve - smooth path
                              const points: string[] = [];
                              for (let i = 0; i <= 20; i++) {
                                const t = i / 20;
                                // Exponential interpolation
                                const exponentialT = startTempo > endTempo 
                                  ? 1 - Math.pow(1 - t, 2) // Ease out for slowing
                                  : Math.pow(t, 2); // Ease in for speeding up
                                const currentTempo = startTempo + (endTempo - startTempo) * exponentialT;
                                const x = 10 + (t * 180);
                                const y = 55 - ((currentTempo - minTempo) / tempoRange) * 50;
                                points.push(`${x},${y}`);
                              }
                              return (
                                <polyline 
                                  points={points.join(' ')} 
                                  fill="none" 
                                  stroke={startTempo > endTempo ? "#60a5fa" : "#fb923c"}
                                  strokeWidth="2"
                                />
                              );
                            }
                          })()}
                          
                          {/* Start and end markers */}
                          <circle cx="10" cy={(() => {
                            const startTempo = parseInt(tempo) || 120;
                            const endTempo = parseInt(targetTempo) || 120;
                            const maxTempo = Math.max(startTempo, endTempo, 180);
                            const minTempo = Math.min(startTempo, endTempo, 60);
                            const tempoRange = maxTempo - minTempo || 1;
                            return 55 - ((startTempo - minTempo) / tempoRange) * 50;
                          })()} r="3" fill="#10b981" />
                          <circle cx="190" cy={(() => {
                            const startTempo = parseInt(tempo) || 120;
                            const endTempo = parseInt(targetTempo) || 120;
                            const maxTempo = Math.max(startTempo, endTempo, 180);
                            const minTempo = Math.min(startTempo, endTempo, 60);
                            const tempoRange = maxTempo - minTempo || 1;
                            return 55 - ((endTempo - minTempo) / tempoRange) * 50;
                          })()} r="3" fill="#ef4444" />
                        </svg>
                        
                        {/* Tempo labels */}
                        <div className="absolute top-1 left-2 text-[10px] text-green-400">
                          {tempo} BPM
                        </div>
                        <div className="absolute top-1 right-2 text-[10px] text-red-400">
                          {targetTempo} BPM
                        </div>
                      </div>
                      
                      {/* Duration info */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-muted-foreground">
                          Duration: {(parseFloat(targetTime) - parseFloat(time)).toFixed(2)}s
                        </span>
                        <span className="text-muted-foreground">
                          Change: {Math.abs(parseInt(targetTempo) - parseInt(tempo))} BPM
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              

              
              {/* Hide in Player Mode */}
              <div className="flex items-center space-x-2">
                <Switch id="hide-tempo" checked={hidden} onCheckedChange={setHidden} />
                <Label htmlFor="hide-tempo" className="text-sm cursor-pointer">
                  Hide in player mode (show only in edit mode)
                </Label>
              </div>
            </div>
          )}

          {/* Campos Time Signature */}
          {type === 'timesig' && (
            <div className="space-y-4">
              <Label>Time Signature</Label>
              
              {/* Preset Selector */}
              <div className="space-y-1">
                <Label htmlFor="ts-preset" className="text-xs text-muted-foreground">Common Presets</Label>
                <Select
                  value={`${timeSignatureNumerator}/${timeSignatureDenominator}`}
                  onValueChange={(value: string) => {
                    const [num, den] = value.split('/');
                    setTimeSignatureNumerator(num);
                    setTimeSignatureDenominator(den);
                  }}
                >
                  <SelectTrigger id="ts-preset">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SIG_PRESETS.map(preset => (
                      <SelectItem key={preset.label} value={`${preset.numerator}/${preset.denominator}`}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Manual Input */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Custom Time Signature</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="ts-num" className="text-xs text-muted-foreground">Numerator (Beats)</Label>
                    <Input 
                      id="ts-num" 
                      type="number" 
                      min="1" 
                      max="32"
                      value={timeSignatureNumerator} 
                      onChange={(e)=>setTimeSignatureNumerator(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="ts-den" className="text-xs text-muted-foreground">Denominator (Note Value)</Label>
                    <Select value={timeSignatureDenominator} onValueChange={setTimeSignatureDenominator}>
                      <SelectTrigger id="ts-den">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SIG_DENOMINATORS.map(den => (
                          <SelectItem key={den.value} value={den.value}>
                            {den.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Visual Preview */}
              <div className="space-y-2">
                 <Label className="text-xs text-muted-foreground">Note Groups (Visual Feedback)</Label>
                 <TimeSignatureVisualizer 
                    numerator={parseInt(timeSignatureNumerator) || 4} 
                    denominator={parseInt(timeSignatureDenominator) || 4} 
                    subdivision={subdivision}
                    onSubdivisionChange={setSubdivision}
                 />
              </div>

              {/* Subdivision Selection - Interactive */}
              {tsType === 'irregular' && (
                <div className="space-y-2">
                  <Label className="text-sm">
                    Beat Grouping (Drag to Rearrange)
                  </Label>
                  
                  {/* Common presets for irregular meters */}
                  {(() => {
                      const num = parseInt(timeSignatureNumerator);
                      const den = parseInt(timeSignatureDenominator);
                      const presets = getSubdivisionPresets(num, den);
                      
                      if (presets.length > 0) {
                          return (
                              <div className="flex flex-wrap gap-2 mb-2">
                                  {presets.map(sub => (
                                      <Button 
                                          key={sub} 
                                          type="button" 
                                          variant={subdivision === sub ? "default" : "outline"} 
                                          size="sm"
                                          onClick={() => setSubdivision(sub)}
                                          className="text-xs h-7"
                                      >
                                          {sub}
                                      </Button>
                                  ))}
                              </div>
                          );
                      }
                      return null;
                  })()}

                  <p className="text-xs text-muted-foreground mb-2">
                    💡 Drag the note groups in the visualization above to rearrange beat grouping for this irregular time signature.
                  </p>
                </div>
              )}

              {/* Hide in Player Mode */}
              <div className="flex items-center space-x-2">
                <Switch id="hide-timesig" checked={hidden} onCheckedChange={setHidden} />
                <Label htmlFor="hide-timesig" className="text-sm cursor-pointer">
                  Hide in player mode (show only in edit mode)
                </Label>
              </div>
            </div>
          )}

          {/* Campos Section */}
          {type === 'section' && (
            <>
              <div className="space-y-1">
                <Label htmlFor="section-type">Section Type</Label>
                <Select value={sectionType} onValueChange={setSectionType}> <SelectTrigger id="section-type"><SelectValue/></SelectTrigger> <SelectContent>{SECTION_TYPES.map(st=>(<SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>))}</SelectContent> </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="section-label">Section Label</Label>
                <Input id="section-label" value={sectionLabel} onChange={(e) => setSectionLabel(e.target.value)} />
              </div>
            </>
          )}

          {/* Campos Chord */}
          {type === 'chord' && (
            <div className="space-y-4">
               {/* Chord Builder */}
               <div className="space-y-3 border p-4 rounded-md">
                  <Label className="text-base font-medium">Chord Builder</Label>
                   {/* Root/Accidental */}
                   <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1"><Label htmlFor="root-note" className="text-xs text-muted-foreground">Root</Label><Select value={rootNote} onValueChange={setRootNote}><SelectTrigger id="root-note"><SelectValue/></SelectTrigger><SelectContent>{ROOT_NOTES.map(n=>(<SelectItem key={n} value={n}>{n}</SelectItem>))}</SelectContent></Select></div>
                      <div className="space-y-1"><Label htmlFor="accidental" className="text-xs text-muted-foreground">Accidental</Label><Select value={accidental} onValueChange={setAccidental}><SelectTrigger id="accidental"><SelectValue/></SelectTrigger><SelectContent>{ACCIDENTALS.map(a=>(<SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>))}</SelectContent></Select></div>
                   </div>
                   {/* Quality */}
                   <div className="space-y-1"><Label htmlFor="quality" className="text-xs text-muted-foreground">Quality</Label><Select value={quality} onValueChange={setQuality}><SelectTrigger id="quality"><SelectValue/></SelectTrigger><SelectContent>{QUALITIES.map(q=>(<SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>))}</SelectContent></Select></div>
                   {/* Extension */}
                   <div className="space-y-1"><Label htmlFor="extension" className="text-xs text-muted-foreground">Extension</Label><Select value={extension} onValueChange={setExtension}><SelectTrigger id="extension"><SelectValue/></SelectTrigger><SelectContent>{EXTENSIONS.map(e=>(<SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>))}</SelectContent></Select></div>
                   {/* Bass Note */}
                   <div className="space-y-1"><Label htmlFor="bass-note" className="text-xs text-muted-foreground">Bass Note</Label><Select value={bassNote||'none'} onValueChange={(v: string)=>setBassNote(v==='none'?'':v)}><SelectTrigger id="bass-note"><SelectValue placeholder="None"/></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem>{ROOT_NOTES.map(n=>(<React.Fragment key={n}><SelectItem value={n}>{n}</SelectItem><SelectItem value={`${n}#`}>{`${n}♯`}</SelectItem><SelectItem value={`${n}b`}>{`${n}♭`}</SelectItem></React.Fragment>))}</SelectContent></Select></div>
                   {/* Generated Chord */}
                   <div className="pt-2"><Label className="text-xs text-muted-foreground">Generated Chord</Label><p className="text-lg font-semibold">{chord || '-'}</p></div>
               </div>

              {/* Custom Diagram Editor */}
              <div className="space-y-2">
                 <Button type="button" variant="outline" onClick={()=>setCustomDiagramMode(!customDiagramMode)} className="w-full"> <Edit3 className="w-4 h-4 mr-2"/> {customDiagramMode?'Hide':'Customize'} Diagrams </Button>
                 {customDiagramMode && ( <div className="border rounded-md p-4 space-y-4">
                     {/* Capo */} <div className="space-y-1"><Label htmlFor="capo">Capo Fret</Label><Input id="capo" type="number" min="0" max="12" value={capo} onChange={(e)=>setCapo(parseInt(e.target.value)||0)}/></div>
                     {/* Tabs */} <Tabs defaultValue="guitar">
                         <TabsList className="grid w-full grid-cols-3"> <TabsTrigger value="guitar">Guitar</TabsTrigger> <TabsTrigger value="ukulele">Ukulele</TabsTrigger> <TabsTrigger value="piano">Piano</TabsTrigger> </TabsList>
                         <TabsContent value="guitar" className="mt-4 space-y-3">
                             <div className="space-y-1"><Label htmlFor="guitar-start-fret">Start Fret</Label><Input id="guitar-start-fret" type="number" min="1" max="15" value={guitarStartFret} onChange={(e)=>setGuitarStartFret(parseInt(e.target.value)||1)}/></div>
                             <InteractiveGuitarDiagram frets={guitarFrets} fingers={guitarFingers} startFret={guitarStartFret} onChange={(f,fin)=>{setGuitarFrets(f);setGuitarFingers(fin)}}/>
                         </TabsContent>
                         <TabsContent value="ukulele" className="mt-4 space-y-3">
                              <div className="space-y-1"><Label htmlFor="ukulele-start-fret">Start Fret</Label><Input id="ukulele-start-fret" type="number" min="1" max="15" value={ukuleleStartFret} onChange={(e)=>setUkuleleStartFret(parseInt(e.target.value)||1)}/></div>
                              <InteractiveUkuleleDiagram frets={ukuleleFrets} fingers={ukuleleFingers} startFret={ukuleleStartFret} onChange={(f,fin)=>{setUkuleleFrets(f);setUkuleleFingers(fin)}}/>
                         </TabsContent>
                         <TabsContent value="piano" className="mt-4 space-y-3"> <InteractivePianoDiagram keys={pianoKeys} onChange={setPianoKeys}/> </TabsContent>
                     </Tabs>
                 </div> )}
              </div>
            </div>
          )}
        </div>

        {/* Botões */}
        <div className="flex gap-2 justify-end pt-4">
           {isEditing && (
               <Button variant="destructive" onClick={handleDelete} className="mr-auto">
                   <Trash2 className="w-4 h-4 mr-2" /> Delete
               </Button>
           )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {isEditing ? 'Update' : <><Plus className="w-4 h-4 mr-2" />Add</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const TimeSignatureVisualizer = ({ 
  numerator, 
  denominator, 
  subdivision,
  onSubdivisionChange
}: { 
  numerator: number; 
  denominator: number; 
  subdivision?: string;
  onSubdivisionChange?: (newSubdivision: string) => void;
}) => {
  const info = analyzeTimeSignature(numerator, denominator, subdivision);
  const { grouping, type } = info;

  const [localGrouping, setLocalGrouping] = React.useState<number[]>(grouping);
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    setLocalGrouping(grouping);
  }, [JSON.stringify(grouping)]);

  // Render SVG
  const noteSpacing = 60;
  const startX = 50;
  const baseY = 40;
  const stemHeight = 35;

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (type !== 'irregular' || !onSubdivisionChange) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Set a transparent image or similar if needed, but default is usually fine
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (type !== 'irregular' || !onSubdivisionChange) return;
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newGrouping = [...localGrouping];
    const [removed] = newGrouping.splice(draggedIndex, 1);
    newGrouping.splice(index, 0, removed);
    
    setLocalGrouping(newGrouping);
    setDraggedIndex(index);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.preventDefault();
    if (type !== 'irregular' || !onSubdivisionChange || draggedIndex === null) return;
    
    setDraggedIndex(null);
    
    // Update subdivision string
    const newSubdivision = localGrouping.join('+');
    if (newSubdivision !== subdivision) {
      onSubdivisionChange(newSubdivision);
    }
  };

  const isInteractive = type === 'irregular' && onSubdivisionChange;

  // Render interactive beat blocks for irregular meters
  if (isInteractive) {
    return (
      <div className="w-full p-4 bg-[#171717] rounded-md border border-[#2B2B2B] space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="text-lg">✋</span>
          <span>Drag beat groups to rearrange the meter pattern</span>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Time Signature Display */}
          <div className="flex flex-col items-center justify-center bg-[#1F1F1F] border border-[#333] rounded px-3 py-2">
            <span className="text-2xl font-bold leading-none">{numerator}</span>
            <div className="w-full h-[1px] bg-[#444] my-0.5"></div>
            <span className="text-2xl font-bold leading-none">{denominator}</span>
          </div>

          <div className="text-2xl text-muted-foreground">=</div>

          {/* Draggable Beat Groups */}
          <div className="flex gap-2 flex-wrap">
            {localGrouping.map((groupSize, index) => (
              <div
                key={index}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className={`
                  flex items-center justify-center gap-1 px-4 py-3 rounded-lg border-2
                  transition-all duration-200 select-none
                  ${draggedIndex === index 
                    ? 'opacity-40 scale-95 border-blue-500/50 bg-blue-500/10' 
                    : 'opacity-100 scale-100 border-[#333] bg-[#1F1F1F] hover:border-blue-500/30 hover:bg-[#252525]'
                  }
                  cursor-move
                `}
              >
                <span className="text-xl font-bold">{groupSize}</span>
                <span className="text-xs text-muted-foreground">
                  {groupSize === 3 ? '♩.' : groupSize === 2 ? '♩' : '♪'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Current pattern display */}
        <div className="text-xs text-center text-muted-foreground">
          Pattern: {localGrouping.join(' + ')} = {numerator}
        </div>
      </div>
    );
  }

  // Regular SVG visualization for simple/compound meters
  return (
    <div className="w-full overflow-x-auto p-4 bg-[#171717] rounded-md border border-[#2B2B2B]">
      <div className="flex justify-center">
        <svg height="80" width={Math.max(300, startX + localGrouping.length * noteSpacing + 40)}>
          {/* Staff line */}
          <line x1="0" y1={baseY} x2="100%" y2={baseY} stroke="#444" strokeWidth="1" />
          
          {/* Time Signature Text */}
          <text x="10" y={baseY - 5} fontFamily="serif" fontSize="24" fontWeight="bold" fill="#e5e5e5">
              {numerator}
          </text>
          <text x="10" y={baseY + 20} fontFamily="serif" fontSize="24" fontWeight="bold" fill="#e5e5e5">
              {denominator}
          </text>

        {localGrouping.map((groupSize, index) => {
            const x = startX + 40 + (index * noteSpacing);
            const elements = [];
            
            // Determine symbol based on groupSize and denominator
            let isFilled = true;
            let hasStem = true;
            let hasFlag = false;
            let isDotted = false;
            
            // Logic for Pulse Representation
            if (denominator === 8) {
                if (groupSize === 3) { // Dotted Quarter
                    isFilled = true; hasStem = true; isDotted = true; hasFlag = false;
                } else if (groupSize === 2) { // Quarter
                    isFilled = true; hasStem = true; isDotted = false; hasFlag = false;
                } else { // Eighth (default)
                    isFilled = true; hasStem = true; isDotted = false; hasFlag = true;
                }
            } else if (denominator === 4) {
                if (groupSize === 3) { // Dotted Half
                    isFilled = false; hasStem = true; isDotted = true; hasFlag = false;
                } else if (groupSize === 2) { // Half
                    isFilled = false; hasStem = true; isDotted = false; hasFlag = false;
                } else { // Quarter
                    isFilled = true; hasStem = true; isDotted = false; hasFlag = false;
                }
            } else if (denominator === 2) {
                 if (groupSize === 1) { // Half
                    isFilled = false; hasStem = true; isDotted = false; hasFlag = false;
                 }
            } else if (denominator === 1) {
                 if (groupSize === 1) { // Whole
                    isFilled = false; hasStem = false; isDotted = false; hasFlag = false;
                 }
            }

            // Draw Note Head
            if (isFilled) {
                 elements.push(<ellipse key={`head-${index}`} cx={x} cy={baseY} rx="6" ry="5" fill="#e5e5e5" transform={`rotate(-15 ${x} ${baseY})`} />);
            } else {
                 elements.push(<ellipse key={`head-${index}`} cx={x} cy={baseY} rx="6" ry="5" fill="none" stroke="#e5e5e5" strokeWidth="2" transform={`rotate(-15 ${x} ${baseY})`} />);
            }

            // Draw Stem
            if (hasStem) {
                elements.push(<line key={`stem-${index}`} x1={x + 5} y1={baseY} x2={x + 5} y2={baseY - stemHeight} stroke="#e5e5e5" strokeWidth="1.5" />);
            }

            // Draw Dot
            if (isDotted) {
                elements.push(<circle key={`dot-${index}`} cx={x + 12} cy={baseY} r="2" fill="#e5e5e5" />);
            }

            // Draw Flag
            if (hasFlag) {
                 elements.push(<path key={`flag-${index}`} d={`M${x+5},${baseY - stemHeight} Q${x+15},${baseY - stemHeight + 10} ${x+10},${baseY - stemHeight + 25}`} fill="none" stroke="#e5e5e5" strokeWidth="2" />);
            }

            return <g key={index}>{elements}</g>;
        })}
        </svg>
      </div>
    </div>
  );
};