// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
import React, { createContext, useContext, useRef, useEffect, ReactNode } from 'react';

interface AudioContextProviderProps {
  children: ReactNode;
}

interface AudioContextValue {
  audioContext: AudioContext | null;
  getAudioContext: () => AudioContext;
  resumeAudioContext: () => Promise<void>;
  suspendAudioContext: () => Promise<void>;
}

const AudioContextContext = createContext<AudioContextValue | undefined>(undefined);

/**
 * AudioContextProvider - Centralized Audio Context Management
 * 
 * CRITICAL: Manages the lifecycle of a single AudioContext instance across the entire application
 * to prevent memory leaks and browser limitations on multiple audio contexts.
 * 
 * Features:
 * - Single AudioContext instance (singleton pattern)
 * - Automatic resume on user interaction (handles autoplay policy)
 * - Proper cleanup on unmount
 * - Suspend/resume support for performance optimization
 */
export const AudioContextProvider: React.FC<AudioContextProviderProps> = ({ children }) => {
  const audioContextRef = useRef<AudioContext | null>(null);

  /**
   * Get or create the AudioContext instance
   */
  const getAudioContext = (): AudioContext => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  /**
   * Resume AudioContext (required for browser autoplay policy)
   * Should be called after user interaction
   */
  const resumeAudioContext = async (): Promise<void> => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  };

  /**
   * Suspend AudioContext to save CPU when not in use
   */
  const suspendAudioContext = async (): Promise<void> => {
    if (audioContextRef.current && audioContextRef.current.state === 'running') {
      await audioContextRef.current.suspend();
    }
  };

  /**
   * Cleanup on unmount - close the AudioContext
   */
  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  const value: AudioContextValue = {
    audioContext: audioContextRef.current,
    getAudioContext,
    resumeAudioContext,
    suspendAudioContext,
  };

  return (
    <AudioContextContext.Provider value={value}>
      {children}
    </AudioContextContext.Provider>
  );
};

/**
 * Hook to access the AudioContext
 * @throws Error if used outside of AudioContextProvider
 */
export const useAudioContext = (): AudioContextValue => {
  const context = useContext(AudioContextContext);
  if (!context) {
    throw new Error('useAudioContext must be used within an AudioContextProvider');
  }
  return context;
};

