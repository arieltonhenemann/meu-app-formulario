import React from 'react';

export const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '5px',
  fontWeight: 'bold',
  color: 'var(--text-main)',
  fontSize: '14px'
};

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  border: '1px solid var(--input-border)',
  borderRadius: '4px',
  fontSize: '14px',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  backgroundColor: 'var(--input-bg)',
  color: 'var(--text-main)'
};

export const buttonStyle: React.CSSProperties = {
  padding: '12px 20px',
  border: 'none',
  borderRadius: '5px',
  color: 'white',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'opacity 0.2s'
};

export const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-card)',
  padding: '20px',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  border: '1px solid var(--border-color)'
};

export const formContainerStyle: React.CSSProperties = {
  maxWidth: '800px',
  margin: '0 auto',
  padding: '20px'
};

export const formCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-card)',
  padding: '30px',
  borderRadius: '10px',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  color: 'var(--text-main)'
};

export const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  border: '1px solid var(--input-border)',
  borderRadius: '4px',
  fontSize: '14px',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  resize: 'vertical',
  backgroundColor: 'var(--input-bg)',
  color: 'var(--text-main)'
};

export const badgeStyle: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: '12px',
  fontSize: '0.75rem',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap'
};

export const statCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-card)',
  padding: '15px',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  border: '1px solid var(--border-color)',
  borderLeft: '4px solid',
  color: 'var(--text-main)'
};

export const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '20px',
  marginBottom: '20px'
};

export const flexCenterStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};
