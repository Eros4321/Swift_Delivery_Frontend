import React, { useEffect, useId, useState } from 'react';
import PrimaryActionButton from './PrimaryActionButton';
import '../styles/VendorInstructionModal.scss';

export interface VendorInstructionSubmission {
  instruction: string;
  saveForLater: boolean;
}

interface VendorInstructionModalProps {
  currentInstruction: string;
  errorMessage?: string | null;
  isSaving?: boolean;
  onDismiss: () => void;
  onSubmit: (submission: VendorInstructionSubmission) => void;
}

const VendorInstructionModal: React.FC<VendorInstructionModalProps> = ({
  currentInstruction,
  errorMessage,
  isSaving = false,
  onDismiss,
  onSubmit,
}) => {
  const [instruction, setInstruction] = useState(currentInstruction);
  const [saveForLater, setSaveForLater] = useState(false);
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
        className="vendor-instruction-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={errorMessage ? errorId : undefined}
      >
        <header className="vendor-instruction-modal__header">
          <h2 id={titleId}>Vendor Instruction</h2>
        </header>

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
        </form>
      </section>
    </div>
  );
};

export default VendorInstructionModal;
