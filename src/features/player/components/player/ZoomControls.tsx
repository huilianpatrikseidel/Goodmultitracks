import React from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../../../components/ui/tooltip';

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
  );
};
