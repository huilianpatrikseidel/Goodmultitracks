import React from 'react';
import { PanelLeftClose, PanelLeft, Sliders, StickyNote, Maximize2 } from '../../../../components/icons/Icon';
import { Button } from '../../../../components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../../components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../../../components/ui/tooltip';
import { MixPresetsManager } from '../mixer/MixPresetsManager';
import { AudioTrack, MixPreset } from '../../../../types';

interface BottomToolbarProps {
  sidebarVisible: boolean;
  mixerDockVisible: boolean;
  notesPanelVisible: boolean;
  mixPresetsPopoverOpen: boolean;
  tracks: AudioTrack[];
  mixPresets: MixPreset[];
  onToggleSidebar: () => void;
  onToggleMixer: () => void;
  onToggleNotes: () => void;
  onPerformanceMode: () => void;
  onMixPresetsOpenChange: (open: boolean) => void;
  onSaveMixPreset: (name: string) => void;
  onLoadMixPreset: (preset: MixPreset) => void;
  onDeleteMixPreset: (id: string) => void;
}

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  sidebarVisible,
  mixerDockVisible,
  notesPanelVisible,
  mixPresetsPopoverOpen,
  tracks,
  mixPresets,
  onToggleSidebar,
  onToggleMixer,
  onToggleNotes,
  onPerformanceMode,
  onMixPresetsOpenChange,
  onSaveMixPreset,
  onLoadMixPreset,
  onDeleteMixPreset,
}) => {
  return (
    <div className="border-t flex items-center justify-between h-10 px-3" style={{ backgroundColor: 'var(--daw-bg-bars)', borderColor: 'var(--daw-border)' }}>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded"
              style={{ backgroundColor: 'var(--daw-control)', color: '#F1F1F1' }}
              onClick={onToggleSidebar}
            >
              {sidebarVisible ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{sidebarVisible ? 'Hide Sidebar' : 'Show Sidebar'}</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-center gap-1">
        <Popover open={mixPresetsPopoverOpen} onOpenChange={onMixPresetsOpenChange}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded" style={{ backgroundColor: 'var(--daw-control)', color: '#F1F1F1' }}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="6" y1="4" x2="6" y2="20" />
                    <rect x="4" y="7" width="4" height="3" rx="1" fill="currentColor" />
                    <line x1="12" y1="4" x2="12" y2="20" />
                    <rect x="10" y="11" width="4" height="3" rx="1" fill="currentColor" />
                    <line x1="18" y1="4" x2="18" y2="20" />
                    <rect x="16" y="9" width="4" height="3" rx="1" fill="currentColor" />
                  </svg>
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>Mix Presets</TooltipContent>
          </Tooltip>
          <PopoverContent align="center" className="w-72" style={{ backgroundColor: 'var(--daw-bg-bars)', borderColor: 'var(--daw-border)' }}>
            <MixPresetsManager
              tracks={tracks}
              presets={mixPresets}
              onSavePreset={onSaveMixPreset}
              onLoadPreset={onLoadMixPreset}
              onDeletePreset={onDeleteMixPreset}
            />
          </PopoverContent>
        </Popover>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded"
              style={{ backgroundColor: mixerDockVisible ? '#3B82F6' : 'var(--daw-control)', color: '#F1F1F1' }}
              onClick={onToggleMixer}
            >
              <Sliders className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{mixerDockVisible ? 'Hide Mixer' : 'Show Mixer'}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded"
              style={{ backgroundColor: notesPanelVisible ? '#3B82F6' : 'var(--daw-control)', color: '#F1F1F1' }}
              onClick={onToggleNotes}
            >
              <StickyNote className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{notesPanelVisible ? 'Hide Notes' : 'Show Notes'}</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded"
              style={{ backgroundColor: 'var(--daw-control)', color: '#F1F1F1' }}
              onClick={onPerformanceMode}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Performance Mode</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};
