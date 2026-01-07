// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
import React from 'react';
import { ArrowLeft, ChevronDown, Play, Pause, Square, Download } from '../../../../components/icons/Icon';
import { MetronomeIcon, SnapGridIcon, LoopIcon, WorkspaceIcon, MarkerEditorIcon, WarpGridIcon, PlayerModeIcon } from '../../../../components/icons/CustomIcons';
import { Button } from '../../../../components/ui/button';
import { Slider } from '../../../../components/ui/slider';
import { Label } from '../../../../components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../../components/ui/tooltip';
import { PlaybackControls, PlayerViewSettings } from '../../../../components/player';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../../components/ui/dropdown-menu';
import { gainToDb, gainToSlider, sliderToGain, formatDb } from '../../utils/audioUtils';
import { formatBPM, formatTime } from '../../../../lib/formatters';
import { MetronomeModeSelect } from './MetronomeModeSelect';
import type { MetronomeMode } from '../../../../hooks/useMetronome';

interface TransportHeaderProps {
  songTitle: string;
  songKey: string;
  songScale?: 'major' | 'minor';
  isPlaying: boolean;
  currentTime: number;
  tempo: number;
  loopEnabled: boolean;
  metronomeEnabled: boolean;
  metronomeVolume: number;
  metronomeMode?: MetronomeMode;
  keyShift: number;
  trackHeight: 'small' | 'medium' | 'large';
  rulerVisibility: Record<string, boolean>;
  rulerOrder: string[];
  currentMeasure: string;
  currentTimeSignature: string;
  displayTempo: number;
  snapEnabled?: boolean;
  snapMode?: 'measures' | 'markers' | 'time';
  onBack: () => void;
  onPlayPause: () => void;
  onStop: () => void;
  onLoopToggle: () => void;
  onMetronomeToggle: () => void;
  onMetronomeVolumeChange: (volume: number) => void;
  onMetronomeModeChange?: (mode: MetronomeMode) => void;
  onTempoChange: (tempo: number) => void;
  onKeyShiftChange: (shift: number) => void;
  onTrackHeightChange: (height: 'small' | 'medium' | 'large') => void;
  onRulerVisibilityChange: (visibility: Record<string, boolean>) => void;
  onRulerOrderChange: (order: string[]) => void;
  onSnapToggle?: () => void;
  onSnapModeChange?: (mode: 'measures' | 'markers' | 'time') => void;
  onExportProject?: () => void;
  activeTool?: 'marker' | 'warp' | null;
  onToolChange?: (tool: 'marker' | 'warp' | null) => void;
}

export const TransportHeader: React.FC<TransportHeaderProps> = ({
  songTitle,
  songKey,
  songScale = 'major',
  isPlaying,
  currentTime,
  tempo,
  loopEnabled,
  metronomeEnabled,
  metronomeVolume,
  metronomeMode = 'macro',
  keyShift,
  trackHeight,
  rulerVisibility,
  rulerOrder,
  currentMeasure,
  currentTimeSignature,
  displayTempo,
  snapEnabled = false,
  snapMode = 'measures',
  onBack,
  onPlayPause,
  onStop,
  onLoopToggle,
  onMetronomeToggle,
  onMetronomeVolumeChange,
  onMetronomeModeChange,
  onTempoChange,
  onKeyShiftChange,
  onTrackHeightChange,
  onRulerVisibilityChange,
  onRulerOrderChange,
  onSnapToggle,
  onSnapModeChange,
  onExportProject,
  activeTool = null,
  onToolChange,
}) => {
  return (
    <div 
      className="border-b p-3 flex items-center justify-between gap-4"
      style={{ backgroundColor: 'var(--daw-bg-bars)', borderColor: 'var(--daw-border)' }}
    >
      {/* Left: Back Button + Song Name */}
      <div className="flex items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
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
              onClick={onBack}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Back to Library</TooltipContent>
        </Tooltip>
        <span className="text-lg font-medium" style={{ color: 'var(--daw-text-primary)' }}>
          {songTitle}
        </span>
      </div>

      {/* Center: Transport Controls + LCD Display + Metronome */}
      <div className="flex items-center gap-3">
        {/* Transport Controls */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
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
                onClick={onStop}
              >
                <Square className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Stop</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12"
                style={{ 
                  backgroundColor: isPlaying ? 'var(--primary)' : 'color-mix(in srgb, var(--primary) 10%, var(--daw-control))',
                  color: isPlaying ? 'var(--primary-foreground)' : 'var(--primary)',
                  borderRadius: '8px',
                  border: isPlaying ? 'none' : '1px solid var(--primary)'
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.backgroundColor = isPlaying ? 'var(--primary)' : 'color-mix(in srgb, var(--primary) 20%, var(--daw-control))';
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.backgroundColor = isPlaying ? 'var(--primary)' : 'color-mix(in srgb, var(--primary) 10%, var(--daw-control))';
                }}
                onClick={onPlayPause}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isPlaying ? 'Pause' : 'Play'}</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                style={{ 
                  backgroundColor: loopEnabled ? 'var(--primary)' : 'var(--daw-control)',
                  color: loopEnabled ? 'var(--primary-foreground)' : 'var(--daw-text-primary)',
                  borderRadius: '8px'
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                  if (!loopEnabled) e.currentTarget.style.backgroundColor = 'var(--daw-control-hover)';
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                  if (!loopEnabled) e.currentTarget.style.backgroundColor = 'var(--daw-control)';
                }}
                onClick={onLoopToggle}
              >
                <LoopIcon className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Loop</TooltipContent>
          </Tooltip>
        </div>

        {/* LCD Display Block */}
        <div 
          className="rounded-lg px-4 py-2 flex items-center gap-4"
          style={{ 
            backgroundColor: 'color-mix(in srgb, var(--primary) 5%, var(--daw-bg-main))', 
            border: '1px solid var(--daw-border)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
          }}
        >
          <div className="flex flex-col items-center" style={{ minWidth: '80px' }}>
            <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--daw-text-muted)' }}>Time</span>
            <span className="text-lg font-mono font-bold tabular-nums" style={{ color: 'var(--primary)' }}>
              {formatTime(currentTime)}
            </span>
          </div>
          <div className="w-px h-10" style={{ backgroundColor: 'var(--daw-border)' }} />
          <div className="flex flex-col items-center">
            <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--daw-text-muted)' }}>Measure</span>
            <span className="text-lg font-mono font-bold tabular-nums" style={{ color: 'var(--primary)' }}>
              {currentMeasure}
            </span>
          </div>
          <div className="w-px h-10" style={{ backgroundColor: 'var(--daw-border)' }} />
          <div className="flex flex-col items-center">
            <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--daw-text-muted)' }}>Tempo</span>
            <span className="text-lg font-mono font-bold tabular-nums" style={{ color: 'var(--primary)' }}>
              {formatBPM(displayTempo)}
            </span>
          </div>
          <div className="w-px h-10" style={{ backgroundColor: 'var(--daw-border)' }} />
          <div className="flex flex-col items-center">
            <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--daw-text-muted)' }}>Time Sig</span>
            <span className="text-lg font-mono font-bold" style={{ color: 'var(--primary)' }}>
              {currentTimeSignature}
            </span>
          </div>
          <div className="w-px h-10" style={{ backgroundColor: 'var(--daw-border)' }} />
          <div className="flex flex-col items-center">
            <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--daw-text-muted)' }}>Key</span>
            <span className="text-lg font-mono font-bold" style={{ color: 'var(--primary)' }}>
              {songKey} {songScale === 'minor' ? 'minor' : 'Major'}
            </span>
          </div>
        </div>

        {/* Metronome with volume dropdown */}
        <DropdownMenu>
          <div className="flex items-center gap-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-r-none"
                  style={{ 
                    backgroundColor: metronomeEnabled ? 'var(--primary)' : 'var(--daw-control)',
                    color: metronomeEnabled ? 'var(--primary-foreground)' : 'var(--daw-text-primary)',
                    borderRadius: '8px 0 0 8px'
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.currentTarget.style.backgroundColor = metronomeEnabled ? 'var(--primary)' : 'var(--daw-control-hover)';
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.currentTarget.style.backgroundColor = metronomeEnabled ? 'var(--primary)' : 'var(--daw-control)';
                  }}
                  onClick={onMetronomeToggle}
                >
                  <MetronomeIcon className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Metronome</TooltipContent>
            </Tooltip>
            
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-6 rounded-l-none px-1"
                style={{ 
                  backgroundColor: metronomeEnabled ? 'var(--primary)' : 'var(--daw-control)',
                  color: metronomeEnabled ? 'var(--primary-foreground)' : 'var(--daw-text-primary)',
                  borderRadius: '0 8px 8px 0',
                  borderLeft: '1px solid rgba(0,0,0,0.2)'
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.backgroundColor = metronomeEnabled ? 'var(--primary)' : 'var(--daw-control-hover)';
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.backgroundColor = metronomeEnabled ? 'var(--primary)' : 'var(--daw-control)';
                }}
              >
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
          </div>
          <DropdownMenuContent 
            className="w-64 p-4"
            style={{ backgroundColor: 'var(--daw-bg-bars)', borderColor: 'var(--daw-border)' }}
          >
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm" style={{ color: 'var(--daw-text-primary)' }}>
                    Metronome Volume
                  </Label>
                  <span className="text-sm" style={{ color: 'var(--daw-text-secondary)' }}>
                    {formatDb(gainToDb(metronomeVolume))} dB
                  </span>
                </div>
                <Slider
                  value={[gainToSlider(metronomeVolume)]}
                  onValueChange={(values: number[]) => onMetronomeVolumeChange(sliderToGain(values[0]))}
                  max={100}
                  step={0.1}
                  className="w-full"
                  onDoubleClick={() => {
                    onMetronomeVolumeChange(0.5); // Reset to -6dB
                  }}
                />
              </div>

              {/* PHASE 5: Metronome Mode Selector */}
              {onMetronomeModeChange && (
                <div className="pt-3 border-t" style={{ borderColor: 'var(--daw-border)' }}>
                  <MetronomeModeSelect 
                    mode={metronomeMode}
                    onModeChange={onMetronomeModeChange}
                    timeSignature={currentTimeSignature}
                  />
                </div>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Workspace Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-10 px-3 gap-2"
              style={{ 
                backgroundColor: activeTool ? 'var(--primary)' : 'var(--daw-control)',
                color: activeTool ? 'var(--primary-foreground)' : 'var(--daw-text-primary)',
                borderRadius: '8px'
              }}
            >
              {activeTool === 'marker' ? (
                <>
                  <MarkerEditorIcon className="w-4 h-4" />
                  <span className="text-xs font-medium">Marker Editor</span>
                </>
              ) : activeTool === 'warp' ? (
                <>
                  <WarpGridIcon className="w-4 h-4" />
                  <span className="text-xs font-medium">Warp Grid</span>
                </>
              ) : (
                <>
                  <PlayerModeIcon className="w-4 h-4" />
                  <span className="text-xs font-medium">Player Mode</span>
                </>
              )}
              <ChevronDown className="w-3 h-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48" style={{ backgroundColor: 'var(--daw-bg-bars)', borderColor: 'var(--daw-border)' }}>
            <DropdownMenuItem 
              onClick={() => onToolChange && onToolChange(null)}
              className="gap-2 cursor-pointer"
            >
              <PlayerModeIcon className="w-4 h-4" />
              <span>Player Mode</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onToolChange && onToolChange('marker')}
              className="gap-2 cursor-pointer"
            >
              <MarkerEditorIcon className="w-4 h-4" />
              <span>Marker Editor</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onToolChange && onToolChange('warp')}
              className="gap-2 cursor-pointer"
            >
              <WarpGridIcon className="w-4 h-4" />
              <span>Warp Grid Editor</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right: Snap + Settings */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              style={{ 
                backgroundColor: snapEnabled ? 'var(--primary)' : 'var(--daw-control)',
                color: snapEnabled ? 'var(--primary-foreground)' : 'var(--daw-text-primary)',
                borderRadius: '8px'
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.backgroundColor = snapEnabled ? 'var(--primary)' : 'var(--daw-control-hover)';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.backgroundColor = snapEnabled ? 'var(--primary)' : 'var(--daw-control)';
              }}
              onClick={onSnapToggle}
            >
              <SnapGridIcon className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {snapEnabled ? 'Snap enabled (measures)' : 'Snap disabled'}
          </TooltipContent>
        </Tooltip>
        
        <PlaybackControls
          tempo={tempo}
          onTempoChange={onTempoChange}
          keyShift={keyShift}
          onKeyShiftChange={onKeyShiftChange}
          originalKey={songKey}
        />

        <PlayerViewSettings
          trackHeight={trackHeight}
          onTrackHeightChange={onTrackHeightChange}
          rulerVisibility={rulerVisibility}
          onRulerVisibilityChange={onRulerVisibilityChange}
          rulerOrder={rulerOrder}
          onRulerOrderChange={onRulerOrderChange}
        />

        <Tooltip>
          <TooltipTrigger asChild>
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
              onClick={onExportProject}
            >
              <Download className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Export Project</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};


