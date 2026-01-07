// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
// @ts-nocheck
import { renderHook, act } from '@testing-library/react';
import { useViewSettings } from '../useViewSettings';

describe('useViewSettings', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useViewSettings());

    expect(result.current.trackHeight).toBe('medium');
    expect(result.current.zoom).toBe(1);
    expect(result.current.visibleRulers).toEqual(['time', 'measures', 'sections', 'chords', 'tempo']);
    expect(result.current.rulerOrder).toEqual(['time', 'measures', 'sections', 'chords', 'tempo']);
  });

  it('should load track height from localStorage', () => {
    localStorage.setItem('goodmultitracks_track_height', 'large');

    const { result } = renderHook(() => useViewSettings());

    expect(result.current.trackHeight).toBe('large');
  });

  it('should save track height to localStorage when changed', () => {
    const { result } = renderHook(() => useViewSettings());

    act(() => {
      result.current.setTrackHeight('small');
    });

    expect(localStorage.setItem).toHaveBeenCalledWith('goodmultitracks_track_height', 'small');
    expect(result.current.trackHeight).toBe('small');
  });

  it('should load zoom from localStorage', () => {
    localStorage.setItem('goodmultitracks_zoom', '2.5');

    const { result } = renderHook(() => useViewSettings());

    expect(result.current.zoom).toBe(2.5);
  });

  it('should save zoom to localStorage when changed', () => {
    const { result } = renderHook(() => useViewSettings());

    act(() => {
      result.current.setZoom(3.0);
    });

    expect(localStorage.setItem).toHaveBeenCalledWith('goodmultitracks_zoom', '3');
    expect(result.current.zoom).toBe(3.0);
  });

  it('should enforce zoom limits', () => {
    const { result } = renderHook(() => useViewSettings());

    act(() => {
      result.current.setZoom(10); // Above max
    });
    expect(result.current.zoom).toBe(8); // Max zoom

    act(() => {
      result.current.setZoom(0.1); // Below min
    });
    expect(result.current.zoom).toBe(0.5); // Min zoom
  });

  it('should handle fitToView zoom calculation', () => {
    const { result } = renderHook(() => useViewSettings());
    const duration = 180; // 3 minutes
    const containerWidth = 1000;

    act(() => {
      result.current.fitToView(duration, containerWidth);
    });

    const expectedZoom = containerWidth / (duration * 100);
    expect(result.current.zoom).toBeCloseTo(expectedZoom, 2);
  });

  it('should load visible rulers from localStorage', () => {
    localStorage.setItem('goodmultitracks_visible_rulers', JSON.stringify(['time', 'measures']));

    const { result } = renderHook(() => useViewSettings());

    expect(result.current.visibleRulers).toEqual(['time', 'measures']);
  });

  it('should save visible rulers to localStorage when changed', () => {
    const { result } = renderHook(() => useViewSettings());

    act(() => {
      result.current.setVisibleRulers(['time', 'chords']);
    });

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'goodmultitracks_visible_rulers',
      JSON.stringify(['time', 'chords'])
    );
  });

  it('should toggle ruler visibility', () => {
    const { result } = renderHook(() => useViewSettings());

    act(() => {
      result.current.toggleRuler('measures');
    });

    expect(result.current.visibleRulers).not.toContain('measures');

    act(() => {
      result.current.toggleRuler('measures');
    });

    expect(result.current.visibleRulers).toContain('measures');
  });

  it('should load ruler order from localStorage', () => {
    localStorage.setItem('goodmultitracks_ruler_order', JSON.stringify(['chords', 'time', 'measures', 'sections', 'tempo']));

    const { result } = renderHook(() => useViewSettings());

    expect(result.current.rulerOrder).toEqual(['chords', 'time', 'measures', 'sections', 'tempo']);
  });

  it('should save ruler order to localStorage when changed', () => {
    const { result } = renderHook(() => useViewSettings());

    const newOrder = ['tempo', 'sections', 'chords', 'measures', 'time'];
    act(() => {
      result.current.setRulerOrder(newOrder);
    });

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'goodmultitracks_ruler_order',
      JSON.stringify(newOrder)
    );
  });

  it('should migrate old config keys on initialization', () => {
    localStorage.setItem('dawplayer_track_height', 'large');
    localStorage.setItem('dawplayer_zoom', '2');

    const { result } = renderHook(() => useViewSettings());

    expect(result.current.trackHeight).toBe('large');
    expect(result.current.zoom).toBe(2);
    expect(localStorage.removeItem).toHaveBeenCalledWith('dawplayer_track_height');
    expect(localStorage.removeItem).toHaveBeenCalledWith('dawplayer_zoom');
  });

  it('should handle invalid localStorage values gracefully', () => {
    localStorage.setItem('goodmultitracks_zoom', 'invalid');
    localStorage.setItem('goodmultitracks_visible_rulers', 'not-json');

    const { result } = renderHook(() => useViewSettings());

    expect(result.current.zoom).toBe(1); // Default value
    expect(result.current.visibleRulers).toEqual(['time', 'measures', 'sections', 'chords', 'tempo']); // Default
  });
});

