import React from 'react';
import { CreateProjectDialog } from '../../../../features/library/components/CreateProjectDialog';
import { TimelineEditorDialog } from '../../../../components/TimelineEditorDialog';
import { ChordDiagram } from '../../../../components/ChordDiagram';
import { TrackNotesDialog } from '../../../../components/TrackNotesDialog';
import { AudioTrack, TempoChange, SectionMarker, ChordMarker } from '../../../../types';

interface DAWDialogsProps {
  createProjectOpen: boolean;
  editorOpen: boolean;
  editorType: 'tempo' | 'timesig' | 'section' | 'chord';
  editorInitialTime?: number;
  clickedTime: number;
  editingMarker: TempoChange | SectionMarker | ChordMarker | null;
  selectedChord: { chord: string; customDiagram?: any } | null;
  selectedTrackForNotes: AudioTrack | null;
  onCreateProjectOpenChange: (open: boolean) => void;
  onEditorOpenChange: (open: boolean) => void;
  onTimelineItemSubmit: (action: 'add' | 'update' | 'delete', data: any) => void;
  onChordClose: () => void;
  onTrackNotesOpenChange: (open: boolean) => void;
  onTrackNotesAdd: (trackId: string, note: string) => void;
  onTrackNotesDelete: (trackId: string, noteId: string) => void;
  trackNotes: Array<{ id: string; text: string; timestamp: number; userId: string }>;
}

export const DAWDialogs: React.FC<DAWDialogsProps> = ({
  createProjectOpen,
  editorOpen,
  editorType,
  editorInitialTime,
  clickedTime,
  editingMarker,
  selectedChord,
  selectedTrackForNotes,
  onCreateProjectOpenChange,
  onEditorOpenChange,
  onTimelineItemSubmit,
  onChordClose,
  onTrackNotesOpenChange,
  onTrackNotesAdd,
  onTrackNotesDelete,
  trackNotes,
}) => {
  return (
    <>
      <CreateProjectDialog
        open={createProjectOpen}
        onOpenChange={onCreateProjectOpenChange}
        onCreateProject={async () => {}}
      />

      <TimelineEditorDialog
        open={editorOpen}
        onOpenChange={onEditorOpenChange}
        type={editorType}
        currentTime={editorInitialTime ?? clickedTime}
        initialData={editingMarker}
        onSubmit={onTimelineItemSubmit}
      />

      {selectedChord && (
        <ChordDiagram
          chord={selectedChord.chord}
          isOpen={!!selectedChord}
          onClose={onChordClose}
          customDiagram={selectedChord.customDiagram}
        />
      )}

      {selectedTrackForNotes && (
        <TrackNotesDialog
          open={!!selectedTrackForNotes}
          onOpenChange={(open) => {
            if (!open) onTrackNotesOpenChange(false);
          }}
          trackName={selectedTrackForNotes.name}
          notes={selectedTrackForNotes.notes || ''}
          onSave={(notes) => onTrackNotesAdd(selectedTrackForNotes.id, notes)}
        />
      )}
    </>
  );
};
