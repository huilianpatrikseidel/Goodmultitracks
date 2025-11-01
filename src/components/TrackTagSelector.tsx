import React from 'react';
import { Tag } from 'lucide-react';
import { Button } from './ui/button';
import { TrackTag, TRACK_TAG_HIERARCHY } from '../types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './ui/tooltip';

interface TrackTagSelectorProps {
  currentTag?: TrackTag;
  onTagChange: (tag: TrackTag) => void;
  disabled?: boolean;
}

const TAG_LABELS: Record<TrackTag, string> = {
  'acoustic-guitar': 'Acoustic Guitar',
  'bass': 'Bass',
  'electric-guitar': 'Electric Guitar',
  'keyboard-piano': 'Keyboard/Piano',
  'percussion': 'Percussion',
  'cajon': 'Cajón',
  'drums': 'Drums',
  'vocals-general': 'Vocals (General)',
  'lead-vocal': 'Lead Vocal',
  'backing-vocals': 'Backing Vocals',
  'other-elements': 'Other Elements',
};

const CATEGORY_LABELS = {
  percussion: 'Percussion',
  harmony: 'Harmony',
  vocals: 'Vocals',
};

export function TrackTagSelector({ currentTag, onTagChange, disabled }: TrackTagSelectorProps) {
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 gap-1"
              style={{
                backgroundColor: currentTag ? '#404040' : 'transparent',
                color: currentTag ? '#F1F1F1' : '#9E9E9E',
              }}
              disabled={disabled}
            >
              <Tag className="w-3 h-3" />
              {currentTag && <span className="text-xs">{TAG_LABELS[currentTag]}</span>}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Set Track Tag</TooltipContent>
      </Tooltip>

      <DropdownMenuContent
        className="w-56"
        style={{ backgroundColor: '#2B2B2B', borderColor: '#3A3A3A' }}
      >
        {/* Percussion */}
        <DropdownMenuLabel style={{ color: '#9E9E9E' }}>{CATEGORY_LABELS.percussion}</DropdownMenuLabel>
        {TRACK_TAG_HIERARCHY.percussion.map((tag) => (
          <Button
            key={tag}
            variant="ghost"
            size="sm"
            className="w-full justify-start px-2 py-1.5 h-auto"
            style={{
              backgroundColor: currentTag === tag ? '#3B82F6' : 'transparent',
              color: currentTag === tag ? '#F1F1F1' : '#D1D1D1',
            }}
            onClick={() => onTagChange(tag)}
          >
            {TAG_LABELS[tag]}
          </Button>
        ))}

        <DropdownMenuSeparator style={{ backgroundColor: '#3A3A3A' }} />

        {/* Harmony */}
        <DropdownMenuLabel style={{ color: '#9E9E9E' }}>{CATEGORY_LABELS.harmony}</DropdownMenuLabel>
        {TRACK_TAG_HIERARCHY.harmony.map((tag) => (
          <Button
            key={tag}
            variant="ghost"
            size="sm"
            className="w-full justify-start px-2 py-1.5 h-auto"
            style={{
              backgroundColor: currentTag === tag ? '#3B82F6' : 'transparent',
              color: currentTag === tag ? '#F1F1F1' : '#D1D1D1',
            }}
            onClick={() => onTagChange(tag)}
          >
            {TAG_LABELS[tag]}
          </Button>
        ))}

        <DropdownMenuSeparator style={{ backgroundColor: '#3A3A3A' }} />

        {/* Vocals */}
        <DropdownMenuLabel style={{ color: '#9E9E9E' }}>{CATEGORY_LABELS.vocals}</DropdownMenuLabel>
        {TRACK_TAG_HIERARCHY.vocals.map((tag) => (
          <Button
            key={tag}
            variant="ghost"
            size="sm"
            className="w-full justify-start px-2 py-1.5 h-auto"
            style={{
              backgroundColor: currentTag === tag ? '#3B82F6' : 'transparent',
              color: currentTag === tag ? '#F1F1F1' : '#D1D1D1',
            }}
            onClick={() => onTagChange(tag)}
          >
            {TAG_LABELS[tag]}
          </Button>
        ))}

        <DropdownMenuSeparator style={{ backgroundColor: '#3A3A3A' }} />

        {/* Other */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start px-2 py-1.5 h-auto"
          style={{
            backgroundColor: currentTag === 'other-elements' ? '#3B82F6' : 'transparent',
            color: currentTag === 'other-elements' ? '#F1F1F1' : '#D1D1D1',
          }}
          onClick={() => onTagChange('other-elements')}
        >
          {TAG_LABELS['other-elements']}
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
