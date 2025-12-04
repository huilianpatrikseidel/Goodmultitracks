import React from 'react';
import { TransportHeader } from '../player/TransportHeader';

interface DAWHeaderProps {
  songTitle: string;
  songKey: string;
  isPlaying: boolean;
  currentTime: number;
  tempo: number;
  loopEnabled: boolean;
  metronomeEnabled: boolean;
  metronomeVolume: number;
  currentMeasure: string;
  currentTimeSignature: string;
  displayTempo: number;
  keyShift: number;
  trackHeight: 'small' | 'medium' | 'large';
  rulerVisibility: Record<string, boolean>;
  rulerOrder: string[];
  snapEnabled: boolean;
  activeTool: 'marker' | 'warp' | null;
  onBack: () => void;
  onPlayPause: () => void;
  onStop: () => void;
  onLoopToggle: () => void;
  onMetronomeToggle: () => void;
  onMetronomeVolumeChange: (volume: number) => void;
  onTempoChange: (tempo: number) => void;
  onKeyShiftChange: (shift: number) => void;
  onTrackHeightChange: (height: 'small' | 'medium' | 'large') => void;
  onRulerVisibilityChange: (ruler: string, visible: boolean) => void;
  onRulerOrderChange: (order: string[]) => void;
  onSnapToggle: () => void;
  onSnapModeChange: (mode: string) => void;
  onToolChange: (tool: 'marker' | 'warp' | null) => void;
}

export function DAWHeader(props: DAWHeaderProps) {
  return (
    <TransportHeader
      songTitle={props.songTitle}
      songKey={props.songKey}
      isPlaying={props.isPlaying}
      currentTime={props.currentTime}
      tempo={props.tempo}
      loopEnabled={props.loopEnabled}
      metronomeEnabled={props.metronomeEnabled}
      metronomeVolume={props.metronomeVolume}
      currentMeasure={props.currentMeasure}
      currentTimeSignature={props.currentTimeSignature}
      displayTempo={props.displayTempo}
      keyShift={props.keyShift}
      trackHeight={props.trackHeight}
      rulerVisibility={props.rulerVisibility}
      rulerOrder={props.rulerOrder}
      snapEnabled={props.snapEnabled}
      onBack={props.onBack}
      onPlayPause={props.onPlayPause}
      onStop={props.onStop}
      onLoopToggle={props.onLoopToggle}
      onMetronomeToggle={props.onMetronomeToggle}
      onMetronomeVolumeChange={props.onMetronomeVolumeChange}
      onTempoChange={props.onTempoChange}
      onKeyShiftChange={props.onKeyShiftChange}
      onTrackHeightChange={props.onTrackHeightChange}
      onRulerVisibilityChange={props.onRulerVisibilityChange}
      onRulerOrderChange={props.onRulerOrderChange}
      onSnapToggle={props.onSnapToggle}
      onSnapModeChange={props.onSnapModeChange}
      activeTool={props.activeTool}
      onToolChange={props.onToolChange}
    />
  );
}
