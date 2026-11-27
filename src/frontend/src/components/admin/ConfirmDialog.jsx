import React, { useEffect, useState, useRef } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger', // 'danger' | 'primary'
  inputLabel = null,
  inputPlaceholder = '',
  defaultInputValue = '',
  busy = false,
  onConfirm,
  onCancel,
}) {
  const [inputValue, setInputValue] = useState(defaultInputValue);
  const inputRef = useRef(null);
  const cancelBtnRef = useRef(null);
  const onCancelRef = useRef(onCancel);
  const busyRef = useRef(busy);

  onCancelRef.current = onCancel;
  busyRef.current = busy;

  // Reset input and focus ONLY when isOpen transitions to true (immune to parent re-renders)
  useEffect(() => {
    if (!isOpen) return;
    setInputValue(defaultInputValue || '');
    const timer = setTimeout(() => {
      if (inputLabel && inputRef.current) {
        inputRef.current.focus();
      } else if (tone === 'danger' && cancelBtnRef.current) {
        cancelBtnRef.current.focus();
      }
    }, 20);
    return () => clearTimeout(timer);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Esc key listener using stable refs
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !busyRef.current) {
        onCancelRef.current?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm?.(inputLabel ? inputValue : undefined);
  };

  return (
    <div
      className="ad-confirm-backdrop"
      role="presentation"
      onClick={() => !busy && onCancel?.()}
    >
      <div
        className="ad-confirm-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ad-confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ad-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {tone === 'danger' && (
              <span className="ad-confirm-icon-danger">
                <AlertTriangle size={18} />
              </span>
            )}
            <h3 id="ad-confirm-title" className="ad-drawer-title">{title}</h3>
          </div>
          <button
            type="button"
            className="ad-icon-close"
            onClick={() => !busy && onCancel?.()}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="ad-modal-form">
          {message && (
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {message}
            </p>
          )}

          {inputLabel && (
            <div className="form-group" style={{ marginTop: 4 }}>
              <label htmlFor="ad-confirm-input" className="form-label" style={{ fontWeight: 600 }}>
                {inputLabel}
              </label>
              <input
                ref={inputRef}
                id="ad-confirm-input"
                type="text"
                className="form-input"
                placeholder={inputPlaceholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
            <button
              ref={cancelBtnRef}
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={busy}
              onClick={onCancel}
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              className={`btn btn-sm ${tone === 'danger' ? 'ad-btn-danger' : 'btn-primary'}`}
              disabled={busy}
            >
              {busy ? 'Processing...' : confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
