import React, { useState, useMemo } from 'react';
import { Settings, Eye, EyeOff, GripVertical } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext'; // << ADICIONADO
import { Button } from './ui/button';
import { Label } from './ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './ui/tooltip';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';
import { cn } from './ui/utils';

export interface RulerConfig {
  id: string;
  label: string;
  visible: boolean;
}

interface PlayerViewSettingsProps {
  trackHeight: 'small' | 'medium' | 'large';
  onTrackHeightChange: (height: 'small' | 'medium' | 'large') => void;
  rulerVisibility: Record<string, boolean>;
  onRulerVisibilityChange: (visibility: Record<string, boolean>) => void;
  rulerOrder?: string[];
  onRulerOrderChange?: (order: string[]) => void;
}

export function PlayerViewSettings({
  trackHeight,
  onTrackHeightChange,
  rulerVisibility,
  onRulerVisibilityChange,
  rulerOrder = ['time', 'measures', 'sections', 'chords', 'tempo'], // Ordem padrão consistente
  onRulerOrderChange,
}: PlayerViewSettingsProps) {
  const { t } = useLanguage(); // << ADICIONADO: Hook de tradução
  const [draggedRulerId, setDraggedRulerId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  // << CORREÇÃO: Usar traduções e visibilidade recebidas via props >>
  // Memoize rulerConfigs to ensure it updates when rulerVisibility changes
  const rulerConfigs = useMemo(() => ({
    time: { id: 'time', label: t.time || 'Time', visible: rulerVisibility['time'] ?? true },
    measures: { id: 'measures', label: t.measures || 'Measures', visible: rulerVisibility['measures'] ?? true },
    sections: { id: 'sections', label: t.sections || 'Sections', visible: rulerVisibility['sections'] ?? true },
    chords: { id: 'chords', label: t.chords || 'Chords', visible: rulerVisibility['chords'] ?? true },
    tempo: { id: 'tempo', label: t.tempo || 'Tempo', visible: rulerVisibility['tempo'] ?? true },
  }), [rulerVisibility, t]);

  // Ensure all rulers in rulerOrder are present, adding missing ones
  const finalRulerOrder = useMemo(() => {
    return rulerOrder.every(id => ['time', 'measures', 'sections', 'chords', 'tempo'].includes(id))
      ? rulerOrder
      : ['time', 'measures', 'sections', 'chords', 'tempo'];
  }, [rulerOrder]);

  const orderedRulers = useMemo(() => {
    return finalRulerOrder
      .map(id => rulerConfigs[id])
      .filter((ruler): ruler is RulerConfig => !!ruler && !!ruler.id);
  }, [finalRulerOrder, rulerConfigs]);

  // Debug: Log visibility changes
  React.useEffect(() => {
    console.debug('[PlayerViewSettings] Ruler visibility updated:', rulerVisibility);
    console.debug('[PlayerViewSettings] orderedRulers:', orderedRulers);
  }, [rulerVisibility, orderedRulers]);

  // << CORREÇÃO: Chamar onRulerVisibilityChange >>
  const handleRulerToggle = (rulerId: string, isVisible: boolean) => {
    console.debug(`[PlayerViewSettings] Toggle ruler '${rulerId}' to ${isVisible}`);
    const newVisibility = { ...rulerVisibility, [rulerId]: isVisible };
    console.debug('[PlayerViewSettings] New visibility:', newVisibility);
    onRulerVisibilityChange(newVisibility);
  };

  // Handle toggle with event stopping
  const handleRulerToggleWithStopPropagation = (rulerId: string) => (checked: boolean) => {
    handleRulerToggle(rulerId, checked);
  };

  const handleDragStart = (e: React.DragEvent, rulerId: string) => {
    setDraggedRulerId(rulerId);
    e.dataTransfer.setData('text/plain', rulerId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, rulerId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (rulerId !== dropTargetId) {
      setDropTargetId(rulerId);
    }
  };

  const handleDrop = (e: React.DragEvent, dropTargetRulerId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === dropTargetRulerId) {
      return;
    }

    const newOrder = [...rulerOrder];
    const draggedIndex = newOrder.indexOf(draggedId);
    const dropIndex = newOrder.indexOf(dropTargetRulerId);

    if (draggedIndex === -1 || dropIndex === -1) return;

    const [draggedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItem);

    if (onRulerOrderChange) {
      onRulerOrderChange(newOrder);
    }
  };

  const handleDragEnd = () => {
    setDraggedRulerId(null);
    setDropTargetId(null);
  };

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded"
              style={{ backgroundColor: '#404040', color: '#F1F1F1' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#5A5A5A')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#404040')}
            >
              <Settings className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>View Settings</TooltipContent>
      </Tooltip>

      <DropdownMenuContent
        className="w-72 p-4"
        style={{ backgroundColor: '#2B2B2B', borderColor: '#3A3A3A' }}
        align="end"
      >
        <div className="space-y-4">
          {/* Track Height */}
          <div className="space-y-2">
            <Label className="text-sm" style={{ color: '#F1F1F1' }}>
              Track Height
            </Label>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={trackHeight === 'small' ? 'default' : 'outline'}
                onClick={() => onTrackHeightChange('small')}
                className="flex-1"
                style={
                  trackHeight === 'small'
                    ? { backgroundColor: '#3B82F6', color: '#F1F1F1' }
                    : { backgroundColor: '#404040', color: '#9E9E9E', borderColor: '#5A5A5A' }
                }
              >
                Small
              </Button>
              <Button
                size="sm"
                variant={trackHeight === 'medium' ? 'default' : 'outline'}
                onClick={() => onTrackHeightChange('medium')}
                className="flex-1"
                style={
                  trackHeight === 'medium'
                    ? { backgroundColor: '#3B82F6', color: '#F1F1F1' }
                    : { backgroundColor: '#404040', color: '#9E9E9E', borderColor: '#5A5A5A' }
                }
              >
                Medium
              </Button>
              <Button
                size="sm"
                variant={trackHeight === 'large' ? 'default' : 'outline'}
                onClick={() => onTrackHeightChange('large')}
                className="flex-1"
                style={
                  trackHeight === 'large'
                    ? { backgroundColor: '#3B82F6', color: '#F1F1F1' }
                    : { backgroundColor: '#404040', color: '#9E9E9E', borderColor: '#5A5A5A' }
                }
              >
                Large
              </Button>
            </div>
          </div>

          <Separator style={{ backgroundColor: '#3A3A3A' }} />

          {/* Rulers Visibility with Drag and Drop */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm" style={{ color: '#F1F1F1' }}>
                Rulers
              </Label>
              <span className="text-xs" style={{ color: '#9E9E9E' }}>
                Drag to reorder
              </span>
            </div>

            <div className="space-y-1">
              {orderedRulers.map((ruler, index) => (
                <div
                  key={ruler.id}
                  draggable={!!onRulerOrderChange}
                  onDragStart={(e) => onRulerOrderChange && handleDragStart(e, ruler.id)}
                  onDragOver={(e) => onRulerOrderChange && handleDragOver(e, ruler.id)}
                  onDrop={(e) => onRulerOrderChange && handleDrop(e, ruler.id)}
                  onDragEnd={handleDragEnd}
                  onDragLeave={() => setDropTargetId(null)}
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    'flex items-center justify-between p-2 rounded transition-all',
                    onRulerOrderChange && 'cursor-move',
                    draggedRulerId === ruler.id ? 'opacity-50 scale-95' : 'opacity-100',
                    dropTargetId === ruler.id && draggedRulerId !== ruler.id && 'bg-blue-500/30'
                  )}
                  style={{ backgroundColor: '#404040' }}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <GripVertical 
                      className="w-4 h-4 cursor-grab active:cursor-grabbing" 
                      style={{ color: '#6B6B6B' }} 
                    />
                    {ruler.visible ? (
                      <Eye className="w-4 h-4" style={{ color: '#9E9E9E' }} />
                    ) : (
                      <EyeOff className="w-4 h-4" style={{ color: '#9E9E9E' }} />
                    )}
                    <span className="text-sm" style={{ color: '#F1F1F1' }}>
                      {ruler.label}
                    </span>
                  </div>
                  <Switch 
                    checked={ruler.visible} 
                    onCheckedChange={handleRulerToggleWithStopPropagation(ruler.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
