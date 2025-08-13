import React from 'react';

export default function ErrorBanner({ message, onClose }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        background: '#ffe6e6',
        border: '1px solid #f5c2c2',
        color: '#b10000',
        padding: '10px 14px',
        borderRadius: 8,
        margin: '10px 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        aria-label="Dismiss error"
        style={{ background: 'transparent', border: 'none', fontSize: 16, cursor: 'pointer' }}
      >
        ×
      </button>
    </div>
  );
}
