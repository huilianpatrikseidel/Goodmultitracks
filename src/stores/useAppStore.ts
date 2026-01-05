import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Song, Setlist } from '../types';

interface AppState {
  // Songs
  songs: Song[];
  setSongs: (songs: Song[]) => void;
  addSong: (song: Song) => void;
  updateSong: (updatedSong: Song) => void;
  removeSong: (songId: string) => void;
  
  // Setlists
  setlists: Setlist[];
  setSetlists: (setlists: Setlist[]) => void;
  addSetlist: (setlist: Setlist) => void;
  updateSetlist: (updatedSetlist: Setlist) => void;
  removeSetlist: (setlistId: string) => void;
  
  // Selected Song
  selectedSong: Song | null;
  setSelectedSong: (song: Song | null) => void;
  
  // UI State
  activeView: 'library' | 'setlists' | 'player' | 'settings';
  setActiveView: (view: 'library' | 'setlists' | 'player' | 'settings') => void;
  
  previousView: 'library' | 'setlists' | 'settings';
  setPreviousView: (view: 'library' | 'setlists' | 'settings') => void;
  
  activeTab: string;
  setActiveTab: (tab: string) => void;
  
  performanceMode: boolean;
  setPerformanceMode: (enabled: boolean) => void;
  
  // Loading State
  isLoading: boolean;
  loadingProgress: number;
  loadingMessage: string;
  setLoading: (isLoading: boolean, progress?: number, message?: string) => void;
  
  // First Time Setup
  showFirstTimeSetup: boolean;
  setShowFirstTimeSetup: (show: boolean) => void;
  
  // User Preferences
  userPreferences: {
    theme: 'dark' | 'light';
    language: 'en' | 'pt';
    outputDevice: number;
    selectedInstruments?: string[];
    mainInstrument?: string;
  };
  setUserPreferences: (preferences: Partial<AppState['userPreferences']>) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        // Initial Songs State
        songs: [],
        setSongs: (songs) => set({ songs }),
        addSong: (song) => set((state) => ({ songs: [...state.songs, song] })),
        updateSong: (updatedSong) =>
          set((state) => ({
            songs: state.songs.map((s) => (s.id === updatedSong.id ? updatedSong : s)),
          })),
        removeSong: (songId) =>
          set((state) => ({
            songs: state.songs.filter((s) => s.id !== songId),
          })),
        
        // Initial Setlists State
        setlists: [],
        setSetlists: (setlists) => set({ setlists }),
        addSetlist: (setlist) => set((state) => ({ setlists: [...state.setlists, setlist] })),
        updateSetlist: (updatedSetlist) =>
          set((state) => ({
            setlists: state.setlists.map((sl) =>
              sl.id === updatedSetlist.id ? updatedSetlist : sl
            ),
          })),
        removeSetlist: (setlistId) =>
          set((state) => ({
            setlists: state.setlists.filter((sl) => sl.id !== setlistId),
          })),
        
        // Initial Selected Song State
        selectedSong: null,
        setSelectedSong: (song) => set({ selectedSong: song }),
        
        // Initial UI State
        activeView: 'library',
        setActiveView: (view) => set({ activeView: view }),
        
        previousView: 'library',
        setPreviousView: (view) => set({ previousView: view }),
        
        activeTab: 'library',
        setActiveTab: (tab) => set({ activeTab: tab }),
        
        performanceMode: false,
        setPerformanceMode: (enabled) => set({ performanceMode: enabled }),
        
        // Initial Loading State
        isLoading: false,
        loadingProgress: 0,
        loadingMessage: 'Initializing application...',
        setLoading: (isLoading, progress = 0, message = 'Loading...') =>
          set({ isLoading, loadingProgress: progress, loadingMessage: message }),
        
        // Initial First Time Setup State
        showFirstTimeSetup: false,
        setShowFirstTimeSetup: (show) => set({ showFirstTimeSetup: show }),
        
        // Initial User Preferences
        userPreferences: {
          theme: 'dark',
          language: 'en',
          outputDevice: 1,
        },
        setUserPreferences: (preferences) =>
          set((state) => ({
            userPreferences: { ...state.userPreferences, ...preferences },
          })),
      }),
      {
        name: 'goodmultitracks-storage',
        partialize: (state) => ({
          songs: state.songs,
          setlists: state.setlists,
          userPreferences: state.userPreferences,
        }),
      }
    ),
    { name: 'GoodMultitracks Store' }
  )
);
