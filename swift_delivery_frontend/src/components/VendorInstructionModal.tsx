import React, { useEffect, useId, useState } from 'react';
import type { SavedCartNote } from '../services/api';
import PrimaryActionButton from './PrimaryActionButton';
import backIcon from '../assets/back.svg';
import closeIcon from '../assets/close.svg';
import noteIcon from '../assets/note.svg';
import trashIcon from '../assets/TrashOutline.svg';
import '../styles/VendorInstructionModal.scss';

export interface VendorInstructionSubmission {
  instruction: string;
  saveForLater: boolean;
}

interface VendorInstructionModalProps {
  currentInstruction: string;
  errorMessage?: string | null;
  isSaving?: boolean;
  savedNotes?: SavedCartNote[];
  savedNotesError?: string | null;
  savedNotesAreLoading?: boolean;
  deletingSavedNoteId?: number | null;
  onDismiss: () => void;
  onDeleteSavedNote?: (savedNoteId: number) => void;
  onSubmit: (submission: VendorInstructionSubmission) => void;
}

const VendorInstructionModal: React.FC<VendorInstructionModalProps> = ({
  currentInstruction,
  errorMessage,
  isSaving = false,
  savedNotes = [],
  savedNotesError,
  savedNotesAreLoading = false,
  deletingSavedNoteId = null,
  onDismiss,
  onDeleteSavedNote,
  onSubmit,
}) => {
  const [instruction, setInstruction] = useState(currentInstruction);
  const [saveForLater, setSaveForLater] = useState(false);
  const [showSavedNotes, setShowSavedNotes] = useState(false);
  const titleId = useId();
  const instructionId = useId();
  const errorId = useId();
  const normalizedInstruction = instruction.trim();
  const isRemovingInstruction = !normalizedInstruction && Boolean(currentInstruction);
  const canSubmit = Boolean(normalizedInstruction) || isRemovingInstruction;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSaving) onDismiss();
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isSaving, onDismiss]);

  return (
    <div
      className="vendor-instruction-modal__backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) onDismiss();
      }}
    >
      <section
        className={`vendor-instruction-modal${showSavedNotes ? ' vendor-instruction-modal--saved' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={errorMessage ? errorId : undefined}
      >
        <header className="vendor-instruction-modal__header">
          {showSavedNotes && (
            <button
              type="button"
              className="vendor-instruction-modal__back"
              onClick={() => setShowSavedNotes(false)}
              aria-label="Back to vendor instruction"
            >
              <img src={backIcon} alt="" aria-hidden="true" />
            </button>
          )}
          <h2 id={titleId}>{showSavedNotes ? 'Saved notes' : 'Vendor Instruction'}</h2>
          {showSavedNotes && (
            <button
              type="button"
              className="vendor-instruction-modal__close"
              onClick={onDismiss}
              aria-label="Close saved notes"
            >
              <img src={closeIcon} alt="" aria-hidden="true" />
            </button>
          )}
        </header>

        {showSavedNotes ? (
          <div className="vendor-instruction-modal__saved-notes">
            {savedNotes.length > 0 ? (
              <ul>
                {savedNotes.map((savedNote) => (
                  <li key={savedNote.id}>
                    <button
                      type="button"
                      className="vendor-instruction-modal__saved-note"
                      onClick={() => {
                        setInstruction(savedNote.note);
                        setSaveForLater(false);
                        setShowSavedNotes(false);
                      }}
                      aria-label={`Use saved note: ${savedNote.note}`}
                    >
                      <img src={noteIcon} alt="" aria-hidden="true" />
                      <span>{savedNote.note}</span>
                    </button>
                    <button
                      type="button"
                      className="vendor-instruction-modal__delete-note"
                      onClick={() => onDeleteSavedNote?.(savedNote.id)}
                      disabled={deletingSavedNoteId === savedNote.id}
                      aria-label={`Delete saved note: ${savedNote.note}`}
                    >
                      <img src={trashIcon} alt="" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="vendor-instruction-modal__saved-empty">No saved notes yet.</p>
            )}

            {savedNotesError && (
              <p className="vendor-instruction-modal__saved-error" role="alert">
                {savedNotesError}
              </p>
            )}
          </div>
        ) : (
          <form
            className="vendor-instruction-modal__form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!canSubmit || isSaving) return;
              onSubmit({
                instruction: normalizedInstruction,
                saveForLater: saveForLater && Boolean(normalizedInstruction),
              });
            }}
          >
            <label className="vendor-instruction-modal__label" htmlFor={instructionId}>
              Instructions for vendor
            </label>
            <textarea
              id={instructionId}
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
              placeholder="Example: Please I want extra pepper"
              maxLength={500}
              rows={4}
              autoFocus
            />

            <label className="vendor-instruction-modal__save-option">
              <input
                type="checkbox"
                checked={saveForLater}
                onChange={(event) => setSaveForLater(event.target.checked)}
                disabled={isSaving}
              />
              <span>Save for later</span>
            </label>

            {errorMessage && (
              <p id={errorId} className="vendor-instruction-modal__error" role="alert">
                {errorMessage}
              </p>
            )}

            <PrimaryActionButton
              type="submit"
              className="vendor-instruction-modal__submit"
              disabled={!canSubmit || isSaving}
            >
              {isSaving
                ? 'Saving...'
                : isRemovingInstruction
                  ? 'Remove instructions'
                  : 'Add instructions'}
            </PrimaryActionButton>

            {savedNotesAreLoading && (
              <p className="vendor-instruction-modal__saved-status" role="status">
                Loading saved notes...
              </p>
            )}

            {!savedNotesAreLoading && savedNotes.length > 0 && (
              <button
                type="button"
                className="vendor-instruction-modal__view-saved"
                onClick={() => setShowSavedNotes(true)}
              >
                View saved notes <span aria-hidden="true">&rarr;</span>
              </button>
            )}

            {savedNotesError && (
              <p className="vendor-instruction-modal__saved-error" role="alert">
                {savedNotesError}
              </p>
            )}
          </form>
        )}
      </section>
    </div>
  );
};

export default VendorInstructionModal;
