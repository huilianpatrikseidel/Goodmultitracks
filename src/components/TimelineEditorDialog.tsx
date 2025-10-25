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

  // Função para limpar o formulário (usada ao abrir para adicionar)
    const resetForm = () => {
        setTime(currentTime.toFixed(2)); // Usa o currentTime passado
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
        // Reseta diagramas para C Major padrão
        const cMajorData = chordDatabase['C'];
        setGuitarFrets(cMajorData?.guitar.frets || [-1, 3, 2, 0, 1, 0]);
        setGuitarFingers(cMajorData?.guitar.fingers || [0, 3, 2, 0, 1, 0]);
        setGuitarStartFret(cMajorData?.guitar.baseFret || 1);
        setUkuleleFrets(cMajorData?.ukulele.frets || [0, 0, 0, 3]);
        setUkuleleFingers(cMajorData?.ukulele.fingers || [0, 0, 0, 3]);
        setUkuleleStartFret(1);
        setPianoKeys(cMajorData?.piano.keys || ['C', 'E', 'G']);
        setCapo(0);
    };


  // Parse do nome do acorde
  const parseChordName = (chordName: string = '') => { // Adiciona valor default
      if (!chordName) { // Reseta se o nome for vazio
          setRootNote('C'); setAccidental('natural'); setQuality('major'); setExtension('none'); setBassNote('');
          setChord('');
          return;
      }

      // Separa o baixo (ex: "Am7/G")
      const [mainChord, bassPart] = chordName.split('/');
      setBassNote(bassPart || '');

      // Regex mais robusto para parsear a parte principal
      const chordRegex = /^([A-G])([#b]?)(maj|m|min|dim|aug|sus2|sus4)?(13|11|9|7|6|add9|maj9|maj7)?(.*)$/;
      const match = mainChord.match(chordRegex);

      if (match) {
          const [, root, acc, qualSuffix, extSuffix, remainder] = match;

          setRootNote(root);
          setAccidental(acc === '#' ? 'sharp' : acc === 'b' ? 'flat' : 'natural');

          // Mapeia sufixos de qualidade
          let matchedQuality = 'major';
          if (qualSuffix === 'm' || qualSuffix === 'min') matchedQuality = 'minor';
          else if (qualSuffix === 'dim') matchedQuality = 'diminished';
          else if (qualSuffix === 'aug') matchedQuality = 'augmented';
          else if (qualSuffix === 'sus2') matchedQuality = 'sus2';
          else if (qualSuffix === 'sus4') matchedQuality = 'sus4';
          // Se maj estiver presente E não for maj7/maj9, considera major
          else if (qualSuffix === 'maj' && !extSuffix?.startsWith('maj')) matchedQuality = 'major';
          setQuality(matchedQuality);

          // Mapeia sufixos de extensão (considera 'maj' junto com 7 ou 9)
          let matchedExtension = 'none';
          if (qualSuffix === 'maj' && extSuffix === '7') matchedExtension = 'maj7';
          else if (qualSuffix === 'maj' && extSuffix === '9') matchedExtension = 'maj9';
          else if (extSuffix === '7') matchedExtension = '7';
          else if (extSuffix === '9') matchedExtension = '9';
          else if (extSuffix === '11') matchedExtension = '11';
          else if (extSuffix === '13') matchedExtension = '13';
          else if (extSuffix === '6') matchedExtension = '6';
          else if (extSuffix === 'add9') matchedExtension = 'add9';
          setExtension(matchedExtension);

          // Aqui você pode tratar 'remainder' para acordes mais complexos se necessário

      } else {
          // Fallback simples se o regex falhar
          console.warn("Could not parse chord name accurately:", chordName);
          setRootNote(chordName[0] || 'C');
          setAccidental('natural');
          setQuality('major');
          setExtension('none');
      }
      setChord(chordName); // Atualiza o estado do nome completo do acorde
  };

  // Efeito para preencher/resetar formulário
  useEffect(() => {
    if (open) { // Executa somente quando o dialog abre
        if (isEditing && initialData) {
            setTime(initialData.time.toFixed(2));
            if (type === 'chord') {
                const chordData = initialData as ChordMarker;
                parseChordName(chordData.chord); // Parse do nome
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
                    const dbData = chordDatabase[baseChord];
                    setGuitarFrets(dbData?.guitar?.frets || [-1,-1,-1,-1,-1,-1]);
                    setGuitarFingers(dbData?.guitar?.fingers || [0,0,0,0,0,0]);
                    setGuitarStartFret(dbData?.guitar?.baseFret || 1);
                    setUkuleleFrets(dbData?.ukulele?.frets || [0,0,0,0]);
                    setUkuleleFingers(dbData?.ukulele?.fingers || [0,0,0,0]);
                    setUkuleleStartFret(1);
                    setPianoKeys(dbData?.piano?.keys || []);
                    setCapo(0);
                }
            }
            // Adicionar preenchimento para outros tipos (tempo, section) aqui
            else if (type === 'tempo' && 'tempo' in initialData) {
                 setTempo(String(initialData.tempo));
            } else if (type === 'timesig' && 'timeSignature' in initialData) {
                 const [num, den] = initialData.timeSignature.split('/');
                 setTimeSignatureNumerator(num);
                 setTimeSignatureDenominator(den);
            } else if (type === 'section' && 'label' in initialData) {
                 setSectionLabel(initialData.label);
                 setSectionType(initialData.type || 'custom');
            }

        } else {
            resetForm(); // Limpa para adicionar novo
        }
    }
  }, [open, isEditing, initialData, type, currentTime]); // Depende de `open` para re-executar

  // Auto-gerar nome do acorde
  useEffect(() => {
    if (type === 'chord') {
      const accSymbol = ACCIDENTALS.find(a => a.value === accidental)?.symbol || '';
      const qualSuffix = QUALITIES.find(q => q.value === quality)?.suffix || '';
      const extSuffix = EXTENSIONS.find(e => e.value === extension)?.suffix || '';
      // Lógica especial para maj7/maj9
      let finalExtSuffix = extSuffix;
      if (extension === 'maj7' && quality !== 'major') finalExtSuffix = 'maj7'; // Garante maj7 se selecionado
      else if (extension === 'maj9' && quality !== 'major') finalExtSuffix = 'maj9';
      else if (quality === 'major' && (extension === 'maj7' || extension === 'maj9')) finalExtSuffix = extSuffix; // Usa sufixo da extensão se já for major
      else if (quality === 'major' && extension !== 'none') finalExtSuffix = extSuffix; // Usa sufixo da extensão se for major
      else if (quality !== 'major' && extension !== 'none') finalExtSuffix = extSuffix; // Usa sufixo da extensão se não for major


      const chordName = `${rootNote}${accSymbol}${qualSuffix}${finalExtSuffix}${bassNote ? '/' + bassNote : ''}`;
      setChord(chordName);
    }
  }, [rootNote, accidental, quality, extension, bassNote, type]);

  // Auto-atualizar diagramas padrão (se não estiver em modo custom)
  useEffect(() => {
    if (type === 'chord' && chord && !customDiagramMode) {
      const baseChord = chord.split('/')[0];
      const chordData = chordDatabase[baseChord];
      if (chordData) {
        setGuitarFrets(chordData.guitar?.frets || [-1,-1,-1,-1,-1,-1]);
        setGuitarFingers(chordData.guitar?.fingers || [0,0,0,0,0,0]);
        setGuitarStartFret(chordData.guitar?.baseFret || 1);
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
    if (isNaN(timeValue) || timeValue < 0) { alert('Please enter a valid time'); return; }

    let data: any = { time: timeValue };

    switch (type) {
        case 'tempo':
            const tempoValue = parseInt(tempo);
            if (isNaN(tempoValue) || tempoValue < 1) { alert('Please enter a valid tempo (BPM)'); return; }
            data.tempo = tempoValue;
            // Mantém timeSignature existente se estiver editando, senão pega um default
            data.timeSignature = (isEditing && initialData && 'timeSignature' in initialData) ? initialData.timeSignature : timeSignatureNumerator + '/' + timeSignatureDenominator;
            break;
        case 'timesig':
            const num = parseInt(timeSignatureNumerator);
            const den = parseInt(timeSignatureDenominator);
            if (isNaN(num) || isNaN(den) || num < 1 || den < 1 || !Number.isInteger(Math.log2(den))) { alert('Please enter a valid time signature (e.g., 4/4, 3/4, 6/8)'); return; }
            data.timeSignature = `${num}/${den}`;
            // Mantém tempo existente se estiver editando, senão pega um default
            data.tempo = (isEditing && initialData && 'tempo' in initialData) ? initialData.tempo : parseInt(tempo);
            break;
      case 'section':
        if (!sectionLabel.trim()) { alert('Please enter a section label'); return; }
        data.label = sectionLabel.trim();
        data.type = sectionType;
        break;
      case 'chord':
        if (!chord.trim()) { alert('Chord name is empty or invalid'); return; }
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
            <div className="space-y-1">
              <Label htmlFor="tempo">Tempo (BPM)</Label>
              <Input id="tempo" type="number" placeholder="120" value={tempo} onChange={(e) => setTempo(e.target.value)} />
            </div>
          )}

          {/* Campos Time Signature */}
          {type === 'timesig' && (
            <div className="space-y-2">
              <Label>Time Signature</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1"> <Label htmlFor="ts-num" className="text-xs text-muted-foreground">Numerator</Label> <Input id="ts-num" type="number" value={timeSignatureNumerator} onChange={(e)=>setTimeSignatureNumerator(e.target.value)}/> </div>
                <div className="space-y-1"> <Label htmlFor="ts-den" className="text-xs text-muted-foreground">Denominator</Label> <Input id="ts-den" type="number" value={timeSignatureDenominator} onChange={(e)=>setTimeSignatureDenominator(e.target.value)}/> </div>
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
                   <div className="space-y-1"><Label htmlFor="bass-note" className="text-xs text-muted-foreground">Bass Note</Label><Select value={bassNote||'none'} onValueChange={(v)=>setBassNote(v==='none'?'':v)}><SelectTrigger id="bass-note"><SelectValue placeholder="None"/></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem>{ROOT_NOTES.map(n=>(<React.Fragment key={n}><SelectItem value={n}>{n}</SelectItem><SelectItem value={`${n}#`}>{`${n}♯`}</SelectItem><SelectItem value={`${n}b`}>{`${n}♭`}</SelectItem></React.Fragment>))}</SelectContent></Select></div>
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