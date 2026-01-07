// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, PanelLeftClose, PanelLeft, Sliders, StickyNote } from '../../../../components/icons/Icon';
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

// TimelineNavigator component
interface TimelineNavigatorProps {
  songDuration: number;
  zoom: number;
  containerWidth: number;
  timelineRef: React.RefObject<HTMLDivElement>;
  onNavigate: (newZoom: number, newScrollLeft: number) => void;
}

// Import dynamically to avoid circular dependencies
const TimelineNavigator = React.lazy(() => import('./TimelineNavigator').then(module => ({ default: module.TimelineNavigator })));

interface DAWFooterProps {
  // Layout state
  sidebarVisible: boolean;
  mixerVisible: boolean;
  mixerDockVisible: boolean;
  notesPanelVisible: boolean;
  mixPresetsPopoverOpen: boolean;
  
  // Data
  zoom: number;
  songDuration: number;
  containerWidth: number;
  orderedTracks: AudioTrack[];
  mixPresets: MixPreset[];
  
  // Refs
  timelineRef: React.RefObject<HTMLDivElement>;
  
  // Actions - Zoom
  onZoomOut: () => void;
  onZoomIn: () => void;
  onFitToView: () => void;
  onNavigate: (newZoom: number, newScrollLeft: number) => void;
  
  // Actions - Toggles
  onToggleSidebar: () => void;
  onToggleMixer: () => void;
  onToggleNotes: () => void;
  onPerformanceMode: () => void;
  onSetMixPresetsPopoverOpen: (open: boolean) => void;
  
  // Mix presets
  onSaveMixPreset: (name: string) => void;
  onLoadMixPreset: (presetId: string) => void;
  onDeleteMixPreset: (presetId: string) => void;
}

export function DAWFooter(props: DAWFooterProps) {
  const {
    sidebarVisible,
    mixerVisible,
    mixerDockVisible,
    notesPanelVisible,
    mixPresetsPopoverOpen,
    zoom,
    songDuration,
    containerWidth,
    orderedTracks,
    mixPresets,
    timelineRef,
    onZoomOut,
    onZoomIn,
    onFitToView,
    onNavigate,
    onToggleSidebar,
    onToggleMixer,
    onToggleNotes,
    onPerformanceMode,
    onSetMixPresetsPopoverOpen,
    onSaveMixPreset,
    onLoadMixPreset,
    onDeleteMixPreset,
  } = props;

  return (
    <>
      {/* Zoom Controls and Navigator Bar */}
      <div className="border-t flex items-center h-8" style={{ backgroundColor: 'var(--daw-bg-bars)', borderColor: 'var(--daw-border)' }}>
        <div className={`border-r flex items-center justify-center gap-2 px-2 flex-shrink-0`} style={{ width: sidebarVisible && mixerVisible ? '280px' : '0', minWidth: sidebarVisible && mixerVisible ? '280px' : '0', borderColor: 'var(--daw-border)' }}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded"
                style={{ backgroundColor: 'var(--daw-control)', color: '#F1F1F1', opacity: zoom <= 1 ? 0.5 : 1 }}
                onClick={onZoomOut}
                disabled={zoom <= 1}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom Out</TooltipContent>
          </Tooltip>
          <span className="text-xs tabular-nums w-14 text-center" style={{ color: '#9E9E9E' }}>
            {Math.round(zoom * 100)}%
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded"
                style={{ backgroundColor: 'var(--daw-control)', color: '#F1F1F1', opacity: zoom >= 8 ? 0.5 : 1 }}
                onClick={onZoomIn}
                disabled={zoom >= 8}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom In</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded"
                style={{ backgroundColor: 'var(--daw-control)', color: '#F1F1F1' }}
                onClick={onFitToView}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Fit to View</TooltipContent>
          </Tooltip>
        </div>

        <React.Suspense fallback={<div className="flex-1" />}>
          <TimelineNavigator
            songDuration={songDuration}
            zoom={zoom}
            containerWidth={containerWidth}
            timelineRef={timelineRef}
            onNavigate={onNavigate}
          />
        </React.Suspense>
      </div>

      {/* Bottom Toolbar */}
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
          <Popover open={mixPresetsPopoverOpen} onOpenChange={onSetMixPresetsPopoverOpen}>
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
                tracks={orderedTracks}
                presets={mixPresets}
                onSavePreset={onSaveMixPreset}
                onLoadPreset={(preset) => onLoadMixPreset(preset.id)}
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
    </>
  );
}

