import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  let mockCallbacks: any;

  beforeEach(() => {
    mockCallbacks = {
      onPlayPause: jest.fn(),
      onStop: jest.fn(),
      onToggleLoop: jest.fn(),
      onToggleMetronome: jest.fn(),
      onZoomIn: jest.fn(),
      onZoomOut: jest.fn(),
      onFitToView: jest.fn(),
      onGoToStart: jest.fn(),
      onGoToEnd: jest.fn(),
      onToggleEditMode: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call onPlayPause when Space is pressed', () => {
    renderHook(() => useKeyboardShortcuts(mockCallbacks));

    const event = new KeyboardEvent('keydown', { code: 'Space' });
    window.dispatchEvent(event);

    expect(mockCallbacks.onPlayPause).toHaveBeenCalledTimes(1);
  });

  it('should call onStop when Ctrl+Space is pressed', () => {
    renderHook(() => useKeyboardShortcuts(mockCallbacks));

    const event = new KeyboardEvent('keydown', { code: 'Space', ctrlKey: true });
    window.dispatchEvent(event);

    expect(mockCallbacks.onStop).toHaveBeenCalledTimes(1);
    expect(mockCallbacks.onPlayPause).not.toHaveBeenCalled();
  });

  it('should call onToggleLoop when Ctrl+L is pressed', () => {
    renderHook(() => useKeyboardShortcuts(mockCallbacks));

    const event = new KeyboardEvent('keydown', { key: 'l', ctrlKey: true });
    window.dispatchEvent(event);

    expect(mockCallbacks.onToggleLoop).toHaveBeenCalledTimes(1);
  });

  it('should call onToggleMetronome when Ctrl+M is pressed', () => {
    renderHook(() => useKeyboardShortcuts(mockCallbacks));

    const event = new KeyboardEvent('keydown', { key: 'm', ctrlKey: true });
    window.dispatchEvent(event);

    expect(mockCallbacks.onToggleMetronome).toHaveBeenCalledTimes(1);
  });

  it('should call onZoomIn when Ctrl+Plus is pressed', () => {
    renderHook(() => useKeyboardShortcuts(mockCallbacks));

    const event = new KeyboardEvent('keydown', { key: '+', ctrlKey: true });
    window.dispatchEvent(event);

    expect(mockCallbacks.onZoomIn).toHaveBeenCalledTimes(1);
  });

  it('should call onZoomOut when Ctrl+Minus is pressed', () => {
    renderHook(() => useKeyboardShortcuts(mockCallbacks));

    const event = new KeyboardEvent('keydown', { key: '-', ctrlKey: true });
    window.dispatchEvent(event);

    expect(mockCallbacks.onZoomOut).toHaveBeenCalledTimes(1);
  });

  it('should call onFitToView when Ctrl+0 is pressed', () => {
    renderHook(() => useKeyboardShortcuts(mockCallbacks));

    const event = new KeyboardEvent('keydown', { key: '0', ctrlKey: true });
    window.dispatchEvent(event);

    expect(mockCallbacks.onFitToView).toHaveBeenCalledTimes(1);
  });

  it('should call onGoToStart when Home is pressed', () => {
    renderHook(() => useKeyboardShortcuts(mockCallbacks));

    const event = new KeyboardEvent('keydown', { key: 'Home' });
    window.dispatchEvent(event);

    expect(mockCallbacks.onGoToStart).toHaveBeenCalledTimes(1);
  });

  it('should call onGoToEnd when End is pressed', () => {
    renderHook(() => useKeyboardShortcuts(mockCallbacks));

    const event = new KeyboardEvent('keydown', { key: 'End' });
    window.dispatchEvent(event);

    expect(mockCallbacks.onGoToEnd).toHaveBeenCalledTimes(1);
  });

  it('should call onToggleEditMode when Ctrl+E is pressed', () => {
    renderHook(() => useKeyboardShortcuts(mockCallbacks));

    const event = new KeyboardEvent('keydown', { key: 'e', ctrlKey: true });
    window.dispatchEvent(event);

    expect(mockCallbacks.onToggleEditMode).toHaveBeenCalledTimes(1);
  });

  it('should prevent default for zoom shortcuts', () => {
    renderHook(() => useKeyboardShortcuts(mockCallbacks));

    const event = new KeyboardEvent('keydown', { key: '+', ctrlKey: true });
    const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
    
    window.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should not call callbacks when input/textarea is focused', () => {
    renderHook(() => useKeyboardShortcuts(mockCallbacks));

    // Create and focus an input element
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent('keydown', { code: 'Space' });
    Object.defineProperty(event, 'target', { value: input });
    window.dispatchEvent(event);

    expect(mockCallbacks.onPlayPause).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it('should cleanup event listener on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useKeyboardShortcuts(mockCallbacks));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});
