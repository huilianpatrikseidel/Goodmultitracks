// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
import React from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from '../../../../components/icons/Icon';
import { Button } from '../../../../components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../../../components/ui/tooltip';
import { ZOOM } from '../../../../config/constants';

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToView: () => void;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onFitToView,
}) => {
  return (
    <div className="flex items-center justify-center gap-2 px-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded"
            style={{ backgroundColor: 'var(--daw-control)', color: '#F1F1F1', opacity: zoom <= ZOOM.MIN ? 0.5 : 1 }}
            onClick={onZoomOut}
            disabled={zoom <= ZOOM.MIN}
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
            style={{ backgroundColor: 'var(--daw-control)', color: '#F1F1F1', opacity: zoom >= ZOOM.MAX ? 0.5 : 1 }}
            onClick={onZoomIn}
            disabled={zoom >= ZOOM.MAX}
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
  );
};

