import React from 'react';
import { labelStyle, inputStyle } from '../styles/forms';

interface CampoDataHoraProps {
  value?: string;
}

export const CampoDataHora: React.FC<CampoDataHoraProps> = ({ value }) => (
  <div style={{ marginBottom: '20px' }}>
    <label style={labelStyle}>DATA E HORA DE ABERTURA:</label>
    <input
      type="text"
      value={value || ''}
      readOnly
      style={{ ...inputStyle, cursor: 'default' }}
      placeholder="dd/mm/aaaa hh:mm:ss"
    />
  </div>
);
