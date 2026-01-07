// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
import React from 'react';
import { Label } from '../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import type { MetronomeMode } from '../../../../hooks/useMetronome';

interface MetronomeModeSelectProps {
  mode: MetronomeMode;
  onModeChange: (mode: MetronomeMode) => void;
  timeSignature?: string;
}

/**
 * PHASE 5: Metronome mode selector component
 * Allows switching between macro beats, all pulses, and accented modes
 */
export function MetronomeModeSelect({ mode, onModeChange, timeSignature }: MetronomeModeSelectProps) {
  // Determine if time signature is compound (6/8, 9/8, 12/8)
  const isCompound = timeSignature && /^(6|9|12)\/8$/.test(timeSignature);
  
  return (
    <div className="space-y-2">
      <Label className="text-sm" style={{ color: 'var(--daw-text-primary)' }}>
        Metronome Mode
      </Label>
      <Select value={mode} onValueChange={(value: string) => onModeChange(value as MetronomeMode)}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="macro">
            <div className="flex flex-col items-start">
              <span className="font-medium">Macro Beats</span>
              <span className="text-xs text-muted-foreground">
                {isCompound ? '2 beats in 6/8, 3 in 9/8' : 'Main beats only'}
              </span>
            </div>
          </SelectItem>
          <SelectItem value="all">
            <div className="flex flex-col items-start">
              <span className="font-medium">All Pulses</span>
              <span className="text-xs text-muted-foreground">
                {isCompound ? '6 pulses in 6/8, 9 in 9/8' : 'All subdivisions'}
              </span>
            </div>
          </SelectItem>
          <SelectItem value="accented">
            <div className="flex flex-col items-start">
              <span className="font-medium">Accented Pulses</span>
              <span className="text-xs text-muted-foreground">
                All pulses with hierarchical accents
              </span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
      
      {/* Visual indicator for current mode */}
      <div className="text-xs space-y-1" style={{ color: 'var(--daw-text-secondary)' }}>
        {mode === 'macro' && (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500" title="Downbeat" />
              <div className="w-2 h-2 rounded-full bg-blue-500 self-center" title="Beat" />
              <div className="w-2 h-2 rounded-full bg-blue-500 self-center" title="Beat" />
            </div>
            <span>Only main beats</span>
          </div>
        )}
        {mode === 'all' && (
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              <div className="w-3 h-3 rounded-full bg-red-500" title="Downbeat" />
              <div className="w-1.5 h-1.5 rounded-full bg-gray-400 self-center" title="Subdivision" />
              <div className="w-1.5 h-1.5 rounded-full bg-gray-400 self-center" title="Subdivision" />
              <div className="w-1.5 h-1.5 rounded-full bg-gray-400 self-center" title="Subdivision" />
            </div>
            <span>All equal volume</span>
          </div>
        )}
        {mode === 'accented' && (
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              <div className="w-3 h-3 rounded-full bg-red-500" title="Downbeat (forte)" />
              <div className="w-1.5 h-1.5 rounded-full bg-gray-400 self-center" title="Subdivision (piano)" />
              <div className="w-1.5 h-1.5 rounded-full bg-gray-400 self-center" title="Subdivision (piano)" />
              <div className="w-2 h-2 rounded-full bg-blue-500 self-center" title="Beat (mezzo)" />
              <div className="w-1.5 h-1.5 rounded-full bg-gray-400 self-center" title="Subdivision (piano)" />
              <div className="w-1.5 h-1.5 rounded-full bg-gray-400 self-center" title="Subdivision (piano)" />
            </div>
            <span>Dynamic accents</span>
          </div>
        )}
      </div>
      
      {/* Info box */}
      <div 
        className="text-xs p-2 rounded" 
        style={{ 
          backgroundColor: 'rgba(59, 130, 246, 0.1)', 
          borderLeft: '2px solid rgb(59, 130, 246)' 
        }}
      >
        <p className="text-blue-400">
          {mode === 'macro' && '💡 Perfect for feeling the groove in compound meters'}
          {mode === 'all' && '💡 Useful for learning complex rhythms'}
          {mode === 'accented' && '💡 Best for irregular meters like 5/8 or 7/8'}
        </p>
      </div>
    </div>
  );
}

/**
 * Example of how time signatures sound with different modes:
 * 
 * 6/8 in 'macro' mode: FORTE weak MÉDIO weak (2 beats)
 * 6/8 in 'all' mode: FORTE weak weak weak weak weak (6 equal pulses)
 * 6/8 in 'accented' mode: FORTE piano piano MÉDIO piano piano (2 groups)
 * 
 * 5/8 (2+3) in 'accented' mode: FORTE piano MÉDIO piano piano
 * 7/8 (2+2+3) in 'accented' mode: FORTE piano MÉDIO piano MÉDIO piano piano
 */

