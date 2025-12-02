import React, { useState } from 'react';
import { GripVertical } from 'lucide-react';
import { TIMELINE } from '../../../../config/constants';

interface RulerSidebarHeadersProps {
  visibleRulers: string[];
  rulerOrder: string[];
  onRulerOrderChange: (newOrder: string[]) => void;
}

const RULER_LABELS: Record<string, string> = {
  time: 'Time',
  measures: 'Measures',
  sections: 'Sections',
  chords: 'Chords',
  tempo: 'Tempo',
};

/**
 * RulerSidebarHeaders - Displays ruler names in the left sidebar
 * 
 * Syncs with RulersContainer to show labels for visible rulers
 * with matching heights for perfect alignment.
 * 
 * Supports drag-and-drop reordering for intuitive UX.
 */
export const RulerSidebarHeaders: React.FC<RulerSidebarHeadersProps> = ({
  visibleRulers,
  rulerOrder,
  onRulerOrderChange,
}) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  
  // Filter and sort rulers based on visibility and order
  const activeRulers = rulerOrder.filter(id => visibleRulers.includes(id));

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const newOrder = [...rulerOrder];
    const fromIndex = newOrder.indexOf(draggedId);
    const toIndex = newOrder.indexOf(targetId);
    
    // Move the item in the array
    newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, draggedId);
    
    onRulerOrderChange(newOrder);
    setDraggedId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  return (
    <div className="flex flex-col">
      {activeRulers.map((rulerId) => (
        <div
          key={rulerId}
          draggable
          onDragStart={(e) => handleDragStart(e, rulerId)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, rulerId)}
          onDragEnd={handleDragEnd}
          className={`flex items-center justify-start px-3 border-b text-xs font-medium uppercase tracking-wider cursor-grab active:cursor-grabbing transition-opacity ${
            draggedId === rulerId ? 'opacity-50' : 'opacity-100'
          }`}
          style={{
            height: `${TIMELINE.RULER_HEIGHT}px`,
            backgroundColor: 'var(--daw-bg-contrast)',
            borderColor: 'var(--daw-border)',
            color: 'var(--daw-text-secondary)',
          }}
        >
          <GripVertical className="w-3 h-3 mr-2 text-gray-500" />
          {RULER_LABELS[rulerId] || rulerId}
        </div>
      ))}
    </div>
  );
};
