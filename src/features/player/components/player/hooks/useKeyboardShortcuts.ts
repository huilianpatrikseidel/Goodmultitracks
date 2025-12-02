import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleLoop: () => void;
  onToggleMetronome: () => void;
  onGoToStart: () => void;
  onGoToEnd: () => void;
  onFitToView?: () => void;
  onToggleEditMode?: () => void;
  onToggleHelp?: () => void;
  disabled?: boolean;
}

export const useKeyboardShortcuts = ({
  isPlaying,
  onPlayPause,
  onStop,
  onZoomIn,
  onZoomOut,
  onToggleLoop,
  onToggleMetronome,
  onGoToStart,
  onGoToEnd,
  onFitToView,
  onToggleEditMode,
  onToggleHelp,
  disabled = false,
}: KeyboardShortcutsProps) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;

      // Ignore keyboard shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          onPlayPause();
          break;

        case 'KeyS':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onStop();
          }
          break;

        case 'Home':
          e.preventDefault();
          onGoToStart();
          break;

        case 'End':
          e.preventDefault();
          onGoToEnd();
          break;

        case 'Equal': // Plus key
        case 'NumpadAdd':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onZoomIn();
          }
          break;

        case 'Minus':
        case 'NumpadSubtract':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onZoomOut();
          }
          break;

        case 'KeyL':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onToggleLoop();
          }
          break;

        case 'KeyM':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onToggleMetronome();
          }
          break;

        case 'Slash':
          if (e.shiftKey) {
            // ? key
            e.preventDefault();
            onToggleHelp?.();
          }
          break;

        case 'KeyF':
          if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
            e.preventDefault();
            onFitToView?.();
          }
          break;

        case 'KeyE':
          if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
            e.preventDefault();
            onToggleEditMode?.();
          }
          break;

        default:
          break;
      }
    },
    [
      disabled,
      isPlaying,
      onPlayPause,
      onStop,
      onZoomIn,
      onZoomOut,
      onToggleLoop,
      onToggleMetronome,
      onGoToStart,
      onGoToEnd,
      onFitToView,
      onToggleEditMode,
      onToggleHelp,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return null; // This hook only handles side effects
};
