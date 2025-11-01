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

// Time signature options
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
        const cMajorData = chordDatabase['C'];
        setGuitarFrets(cMajorData?.guitar.frets || [-1, 3, 2, 0, 1, 0]);
        setGuitarFingers(cMajorData?.guitar.fingers || [0, 3, 2, 0, 1, 0]);
        setGuitarStartFret(cMajorData?.guitar.baseFret || 1);
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
            data.hidden = hidden;
            data.subdivision = subdivision.trim() || undefined;
            
            // Add tempo curve if enabled
            if (enableCurve) {
              const targetTempoValue = parseInt(targetTempo);
              const targetTimeValue = parseFloat(targetTime);
              if (isNaN(targetTempoValue) || targetTempoValue < 1) {
                alert('Please enter a valid target tempo (BPM)');
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
            break;
        case 'timesig':
            const num = parseInt(timeSignatureNumerator);
            const den = parseInt(timeSignatureDenominator);
            if (isNaN(num) || isNaN(den) || num < 1 || den < 1 || !Number.isInteger(Math.log2(den))) { alert('Please enter a valid time signature (e.g., 4/4, 3/4, 6/8)'); return; }
            data.timeSignature = `${num}/${den}`;
            // Mantém tempo existente se estiver editando, senão pega um default
            data.tempo = (isEditing && initialData && 'tempo' in initialData) ? initialData.tempo : parseInt(tempo);
            data.hidden = hidden;
            data.subdivision = subdivision.trim() || undefined;
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
            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="tempo">Tempo (BPM)</Label>
                <Input id="tempo" type="number" placeholder="120" value={tempo} onChange={(e) => setTempo(e.target.value)} />
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
              
              {/* Irregular Time Signature Subdivision */}
              <div className="space-y-2">
                <Label htmlFor="subdivision-tempo" className="text-sm">
                  Subdivision Pattern (optional)
                </Label>
                <Input
                  id="subdivision-tempo"
                  placeholder="e.g., 2+3 for 5/8"
                  value={subdivision}
                  onChange={(e) => setSubdivision(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  For metronome click patterns in irregular time signatures.
                </p>
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
                  onValueChange={(value) => {
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

              {/* Preview */}
              <div className="bg-[#1E1E1E] border border-[#2B2B2B] rounded-md p-3 text-center">
                <div className="text-xs text-muted-foreground mb-1">Preview</div>
                <div className="text-3xl font-mono">
                  {timeSignatureNumerator}<span className="text-muted-foreground">/</span>{timeSignatureDenominator}
                </div>
              </div>

              {/* Irregular Time Signature Subdivision */}
              <div className="space-y-2">
                <Label htmlFor="subdivision" className="text-sm">
                  Irregular Subdivision (optional)
                </Label>
                <Input
                  id="subdivision"
                  placeholder="e.g., 2+3 for 5/8, 3+2+2 for 7/8"
                  value={subdivision}
                  onChange={(e) => setSubdivision(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Define beat grouping for irregular time signatures. Leave empty for regular grouping.
                </p>
                {subdivision && (
                  <div className="bg-[#1E1E1E] border border-[#2B2B2B] rounded-md p-2 text-xs">
                    <span className="text-muted-foreground">Pattern:</span> {subdivision}
                  </div>
                )}
              </div>

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