import React from 'react';
import { X } from '../../../../components/icons/Icon';
import { NotesPanel } from '../../../../components/player';
import { MixerDock } from '../mixer/MixerDock';
import { AudioTrack } from '../../../../types';

interface DAWPanelsProps {
  mixerDockVisible: boolean;
  notesPanelVisible: boolean;
  song: any;
  orderedTracks: AudioTrack[];
  onCloseMixerDock: () => void;
  onCloseNotesPanel: () => void;
  onTrackVolumeChange: (trackId: string, volume: number) => void;
  onTrackMuteToggle: (trackId: string) => void;
  onTrackSoloToggle: (trackId: string) => void;
  onAddNote: (content: string, isPrivate: boolean, time?: number) => void;
  onDeleteNote: (noteId: string) => void;
}

export const DAWPanels: React.FC<DAWPanelsProps> = ({
  mixerDockVisible,
  notesPanelVisible,
  song,
  orderedTracks,
  onCloseMixerDock,
  onCloseNotesPanel,
  onTrackVolumeChange,
  onTrackMuteToggle,
  onTrackSoloToggle,
  onAddNote,
  onDeleteNote,
}) => {
  return (
    <>
      {mixerDockVisible && (
        <MixerDock
          tracks={orderedTracks}
          onTrackVolumeChange={onTrackVolumeChange}
          onTrackMuteToggle={onTrackMuteToggle}
          onTrackSoloToggle={onTrackSoloToggle}
          onClose={onCloseMixerDock}
        />
      )}

      {notesPanelVisible && song && (
        <div className="w-full flex flex-col border-t" style={{ backgroundColor: 'var(--daw-bg-contrast)', borderColor: 'var(--daw-border)', height: '240px' }}>
          <div className="h-10 border-b flex items-center justify-between px-3" style={{ backgroundColor: 'var(--daw-bg-bars)', borderColor: 'var(--daw-border)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--daw-text-primary)' }}>Song Notes</h3>
            <button onClick={onCloseNotesPanel} className="p-1 hover:bg-gray-700 rounded">
              <X className="w-4 h-4" style={{ color: 'var(--daw-text-primary)' }} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3" style={{ backgroundColor: 'var(--daw-bg-contrast)' }}>
            <NotesPanel
              notes={song.notes || []}
              currentUser={{ id: 'current-user', name: 'You' }}
              onAddNote={onAddNote}
              onDeleteNote={onDeleteNote}
            />
          </div>
        </div>
      )}
    </>
  );
};
