import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';

interface TrackNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackName: string;
  notes: string;
  onSave: (notes: string) => void;
}

export function TrackNotesDialog({
  open,
  onOpenChange,
  trackName,
  notes,
  onSave,
}: TrackNotesDialogProps) {
  const [editedNotes, setEditedNotes] = useState(notes);

  React.useEffect(() => {
    setEditedNotes(notes);
  }, [notes, open]);

  const handleSave = () => {
    onSave(editedNotes);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ backgroundColor: '#2B2B2B', borderColor: '#3A3A3A' }}>
        <DialogHeader>
          <DialogTitle style={{ color: '#F1F1F1' }}>Track Notes</DialogTitle>
          <DialogDescription style={{ color: '#9E9E9E' }}>
            Add notes for {trackName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="Enter your notes here..."
            value={editedNotes}
            onChange={(e) => setEditedNotes(e.target.value)}
            rows={6}
            style={{
              backgroundColor: '#404040',
              borderColor: '#5A5A5A',
              color: '#F1F1F1',
            }}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              style={{ color: '#9E9E9E' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              style={{ backgroundColor: '#3B82F6', color: '#FFFFFF' }}
            >
              Save Notes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
