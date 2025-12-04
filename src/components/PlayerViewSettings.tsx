import React, { useState } from 'react';
import { Eye, EyeOff, GripVertical } from 'lucide-react';
import { ViewSettingsIcon } from './icons/CustomIcons';
import { useLanguage } from '../lib/LanguageContext';
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
  rulerOrder = ['time', 'measures', 'sections', 'chords', 'tempo'],
  onRulerOrderChange,
}: PlayerViewSettingsProps) {
  const { t } = useLanguage();
  const [draggedRulerId, setDraggedRulerId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const rulerConfigs: Record<string, RulerConfig> = {
    time: { id: 'time', label: t.time, visible: rulerVisibility['time'] },
    measures: { id: 'measures', label: t.measures, visible: rulerVisibility['measures'] },
    sections: { id: 'sections', label: t.sections, visible: rulerVisibility['sections'] },
    chords: { id: 'chords', label: t.chords, visible: rulerVisibility['chords'] },
    tempo: { id: 'tempo', label: t.tempo, visible: rulerVisibility['tempo'] },
  };

  const orderedRulers = rulerOrder.map(id => rulerConfigs[id]).filter(Boolean);

  const handleRulerToggle = (rulerId: string, isVisible: boolean) => {
    const newVisibility = { ...rulerVisibility, [rulerId]: isVisible };
    onRulerVisibilityChange(newVisibility);
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
              className="h-10 w-10"
              style={{ 
                backgroundColor: 'var(--daw-control)', 
                color: 'var(--daw-text-primary)',
                borderRadius: '8px'
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.backgroundColor = 'var(--daw-control-hover)';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.backgroundColor = 'var(--daw-control)';
              }}
            >
              <ViewSettingsIcon className="w-5 h-5" />
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
                    : { backgroundColor: 'var(--daw-control)', color: 'var(--daw-text-muted)', borderColor: 'var(--daw-border)' }
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
                    : { backgroundColor: 'var(--daw-control)', color: 'var(--daw-text-muted)', borderColor: 'var(--daw-border)' }
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
                    : { backgroundColor: 'var(--daw-control)', color: 'var(--daw-text-muted)', borderColor: 'var(--daw-border)' }
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
                  className={cn(
                    'flex items-center justify-between p-2 rounded transition-all',
                    onRulerOrderChange && 'cursor-move',
                    draggedRulerId === ruler.id ? 'opacity-50 scale-95' : 'opacity-100',
                    dropTargetId === ruler.id && draggedRulerId !== ruler.id && 'bg-blue-500/30'
                  )}
                  style={{ backgroundColor: 'var(--daw-control)' }}
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
                    onCheckedChange={(checked) => handleRulerToggle(ruler.id, checked)}
                    onClick={(e) => e.stopPropagation()}
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
