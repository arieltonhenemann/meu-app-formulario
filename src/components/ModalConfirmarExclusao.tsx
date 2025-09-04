import React from 'react';

interface ModalConfirmarExclusaoProps {
  isOpen: boolean;
  titulo: string;
  mensagem: string;
  onConfirmar: () => void;
  onCancelar: () => void;
  loading?: boolean;
}

export const ModalConfirmarExclusao: React.FC<ModalConfirmarExclusaoProps> = ({
  isOpen,
  titulo,
  mensagem,
  onConfirmar,
  onCancelar,
  loading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancelar}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h3>⚠️ {titulo}</h3>
          <button 
            className="modal-close-btn"
            onClick={onCancelar}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p style={{ margin: '0', fontSize: '1rem', lineHeight: '1.5' }}>
            {mensagem}
          </p>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancelar}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirmar}
            disabled={loading}
          >
            {loading ? '🔄 Excluindo...' : '🗑️ Excluir'}
          </button>
        </div>
      </div>
    </div>
  );
};
