import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  {
    category: 'Playback',
    items: [
      { keys: ['Space'], description: 'Play / Pause' },
      { keys: ['Home'], description: 'Go to start' },
      { keys: ['End'], description: 'Go to end' },
      { keys: ['R'], description: 'Reset to start' },
      { keys: ['←'], description: 'Jump backward 5 seconds' },
      { keys: ['→'], description: 'Jump forward 5 seconds' },
      { keys: ['Shift', '←'], description: 'Previous section' },
      { keys: ['Shift', '→'], description: 'Next section' },
    ],
  },
  {
    category: 'View',
    items: [
      { keys: ['+'], description: 'Zoom in' },
      { keys: ['-'], description: 'Zoom out' },
      { keys: ['0'], description: 'Reset zoom' },
    ],
  },
  {
    category: 'Tools',
    items: [
      { keys: ['L'], description: 'Toggle loop' },
      { keys: ['M'], description: 'Toggle metronome' },
    ],
  },
];

export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate and control the player efficiently
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className="text-sm font-semibold mb-3 text-gray-700">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded hover:bg-gray-50"
                  >
                    <span className="text-sm text-gray-600">{item.description}</span>
                    <div className="flex gap-1">
                      {item.keys.map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          {keyIndex > 0 && (
                            <span className="text-gray-400 mx-1">+</span>
                          )}
                          <Badge
                            variant="secondary"
                            className="font-mono px-2 py-1 bg-gray-100 text-gray-700 border"
                          >
                            {key}
                          </Badge>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {section.category !== shortcuts[shortcuts.length - 1].category && (
                <Separator className="mt-4" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
          <strong>Tip:</strong> Most shortcuts won't work when typing in text fields
        </div>
      </DialogContent>
    </Dialog>
  );
}
