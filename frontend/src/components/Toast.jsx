import React, { useEffect } from 'react';

export function Toast({ title = 'Notification', message, type = 'info', onClose, duration = 3500 }) {
  useEffect(() => {
    if (duration > 0 && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [onClose, duration]);

  if (!message) return null;

  const isError = type === 'error';
  const isSuccess = type === 'success';

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 999999,
        background: isError ? '#fee2e2' : isSuccess ? '#ecfdf5' : '#eff6ff',
        color: isError ? '#991b1b' : isSuccess ? '#065f46' : '#1e40af',
        border: `1px solid ${isError ? '#f87171' : isSuccess ? '#34d399' : '#60a5fa'}`,
        padding: '14px 18px',
        borderRadius: '10px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        maxWidth: '400px',
        animation: 'fadeIn 0.3s ease'
      }}
    >
      <span style={{ fontSize: '20px' }}>{isError ? '⚠️' : isSuccess ? '✨' : 'ℹ️'}</span>
      <div style={{ flex: 1, fontSize: '14px', lineHeight: 1.4 }}>
        {title && <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{title}</div>}
        <div>{message}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '18px',
            color: 'inherit',
            fontWeight: 'bold',
            padding: '0 4px'
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

