import React from 'react';
import { MixerDock } from '../mixer/MixerDock';
import { NotesPanel } from '../../../../components/NotesPanel';
import { AudioTrack } from '../../../../types';

interface DAWSidePanelsProps {
  mixerDockVisible: boolean;
  notesPanelVisible: boolean;
  tracks: AudioTrack[];
  notes: Array<{ id: string; text: string; timestamp: number; userId: string }>;
  currentUser: { id: string; name: string };
  onCloseMixerDock: () => void;
  onTrackVolumeChange: (trackId: string, volume: number) => void;
  onTrackSoloChange: (trackId: string) => void;
  onTrackMuteChange: (trackId: string) => void;
  onAddNote: (text: string) => void;
  onDeleteNote: (noteId: string) => void;
}

export const DAWSidePanels: React.FC<DAWSidePanelsProps> = ({
  mixerDockVisible,
  notesPanelVisible,
  tracks,
  notes,
  currentUser,
  onCloseMixerDock,
  onTrackVolumeChange,
  onTrackSoloChange,
  onTrackMuteChange,
  onAddNote,
  onDeleteNote,
}) => {
  return (
    <>
      {mixerDockVisible && (
        <div className="absolute top-0 right-0 w-80 h-full border-l z-40" style={{ backgroundColor: 'var(--daw-bg-contrast)', borderColor: 'var(--daw-border)' }}>
          <MixerDock
            tracks={tracks}
            onClose={onCloseMixerDock}
            onTrackVolumeChange={onTrackVolumeChange}
            onTrackSoloToggle={onTrackSoloChange}
            onTrackMuteToggle={onTrackMuteChange}
          />
        </div>
      )}

      {notesPanelVisible && (
        <div className="absolute top-0 right-0 w-96 h-full border-l z-40" style={{ backgroundColor: 'var(--daw-bg-contrast)', borderColor: 'var(--daw-border)' }}>
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-3 py-3" style={{ backgroundColor: 'var(--daw-bg-contrast)' }}>
              <NotesPanel
                notes={notes.map(n => ({
                  id: n.id,
                  userId: n.userId,
                  content: n.text,
                  isPrivate: false,
                  time: n.timestamp
                }))}
                currentUser={currentUser}
                onAddNote={onAddNote}
                onDeleteNote={onDeleteNote}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
