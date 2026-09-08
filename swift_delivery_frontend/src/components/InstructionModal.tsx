import React, { useEffect, useId, useState } from 'react';
import type { SavedCartNote } from '../services/api';
import CheckboxOption from './CheckboxOption';
import ModalHeaderButton from './ModalHeaderButton';
import PrimaryActionButton from './PrimaryActionButton';
import { MobileLoadingSpinner } from './LoadingState';
import backIcon from '../assets/back.svg';
import closeIcon from '../assets/close.svg';
import noteIcon from '../assets/note.svg';
import trashIcon from '../assets/TrashOutline.svg';
import '../styles/VendorInstructionModal.scss';

export interface InstructionSubmission {
  instruction: string;
  saveForLater: boolean;
}

type InstructionAudience = 'vendor' | 'agent';

interface InstructionModalProps {
  audience: InstructionAudience;
  currentInstruction: string;
  errorMessage?: string | null;
  isSaving?: boolean;
  savedNotes?: SavedCartNote[];
  savedNotesError?: string | null;
  savedNotesAreLoading?: boolean;
  deletingSavedNoteId?: number | null;
  onDismiss: () => void;
  onDeleteSavedNote?: (savedNoteId: number) => void;
  onSubmit: (submission: InstructionSubmission) => void;
}

const modalCopy: Record<InstructionAudience, {
  title: string;
  instructionLabel: string;
  placeholder: string;
}> = {
  vendor: {
    title: 'Vendor Instruction',
    instructionLabel: 'Instructions for vendor',
    placeholder: 'Example: Please I want extra pepper',
  },
  agent: {
    title: 'Agent Instruction',
    instructionLabel: 'Instructions for agent',
    placeholder: 'Example: Call me when you arrive',
  },
};

const InstructionModal: React.FC<InstructionModalProps> = ({
  audience,
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
  const copy = modalCopy[audience];

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
      {(isSaving || savedNotesAreLoading || deletingSavedNoteId !== null) && (
        <MobileLoadingSpinner label="Updating your instructions" />
      )}

      <section
        className={`vendor-instruction-modal${showSavedNotes ? ' vendor-instruction-modal--saved' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={errorMessage ? errorId : undefined}
      >
        <header className="vendor-instruction-modal__header">
          {showSavedNotes && (
            <ModalHeaderButton
              variant="back"
              iconSrc={backIcon}
              onClick={() => setShowSavedNotes(false)}
              aria-label={`Back to ${audience} instruction`}
            />
          )}
          <h2 id={titleId}>{showSavedNotes ? 'Saved notes' : copy.title}</h2>
          {showSavedNotes && (
            <ModalHeaderButton
              variant="close"
              iconSrc={closeIcon}
              onClick={onDismiss}
              aria-label="Close saved notes"
            />
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
              {copy.instructionLabel}
            </label>
            <textarea
              id={instructionId}
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
              placeholder={copy.placeholder}
              maxLength={500}
              rows={4}
              autoFocus
            />

            <CheckboxOption
              containerClassName="vendor-instruction-modal__save-option"
              label="Save for later"
              checked={saveForLater}
              onChange={(event) => setSaveForLater(event.target.checked)}
              disabled={isSaving}
            />

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

export default InstructionModal;
