import React, { useState } from 'react';
import { Settings, Eye, EyeOff, GripVertical } from 'lucide-react';
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
  showTempoRuler: boolean;
  onShowTempoRulerChange: (show: boolean) => void;
  showChordRuler: boolean;
  onShowChordRulerChange: (show: boolean) => void;
  showSectionRuler: boolean;
  onShowSectionRulerChange: (show: boolean) => void;
  showTimeSignatureRuler: boolean;
  onShowTimeSignatureRulerChange: (show: boolean) => void;
  rulerOrder?: string[];
  onRulerOrderChange?: (order: string[]) => void;
}

export function PlayerViewSettings({
  trackHeight,
  onTrackHeightChange,
  showTempoRuler,
  onShowTempoRulerChange,
  showChordRuler,
  onShowChordRulerChange,
  showSectionRuler,
  onShowSectionRulerChange,
  showTimeSignatureRuler,
  onShowTimeSignatureRulerChange,
  rulerOrder = ['sections', 'chords', 'tempo', 'timesig'],
  onRulerOrderChange,
}: PlayerViewSettingsProps) {
  const [draggedRulerIndex, setDraggedRulerIndex] = useState<number | null>(null);

  // Create ruler configurations
  const rulerConfigs: Record<string, RulerConfig> = {
    sections: { id: 'sections', label: 'Sections', visible: showSectionRuler },
    chords: { id: 'chords', label: 'Chords', visible: showChordRuler },
    tempo: { id: 'tempo', label: 'Tempo/TS', visible: showTempoRuler },
    timesig: { id: 'timesig', label: 'Time Signature', visible: showTimeSignatureRuler },
  };

  const orderedRulers = rulerOrder.map(id => rulerConfigs[id]).filter(Boolean);

  const handleRulerToggle = (rulerId: string, newValue: boolean) => {
    switch (rulerId) {
      case 'sections':
        onShowSectionRulerChange(newValue);
        break;
      case 'chords':
        onShowChordRulerChange(newValue);
        break;
      case 'tempo':
        onShowTempoRulerChange(newValue);
        break;
      case 'timesig':
        onShowTimeSignatureRulerChange(newValue);
        break;
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedRulerIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedRulerIndex === null || draggedRulerIndex === dropIndex) {
      setDraggedRulerIndex(null);
      return;
    }

    const newOrder = [...rulerOrder];
    const [draggedItem] = newOrder.splice(draggedRulerIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItem);
    
    if (onRulerOrderChange) {
      onRulerOrderChange(newOrder);
    }
    
    setDraggedRulerIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedRulerIndex(null);
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
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    'flex items-center justify-between p-2 rounded transition-all',
                    'hover:bg-gray-800/50 cursor-move',
                    draggedRulerIndex === index && 'opacity-50 scale-95'
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
