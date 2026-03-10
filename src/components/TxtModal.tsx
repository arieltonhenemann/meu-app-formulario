import React, { useState } from 'react';

interface TxtModalProps {
    isOpen: boolean;
    conteudo: string;
    onClose: () => void;
    titulo?: string;
}

export const TxtModal: React.FC<TxtModalProps> = ({
    isOpen,
    conteudo,
    onClose,
    titulo = "Visualização do Texto"
}) => {
    const [copiado, setCopiado] = useState(false);

    if (!isOpen) return null;

    const handleCopiar = async () => {
        try {
            await navigator.clipboard.writeText(conteudo);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);
        } catch (err) {
            console.error('Erro ao copiar texto: ', err);
            alert('Não foi possível copiar o texto automaticamente.');
        }
    };

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                <div style={headerStyle}>
                    <h3 style={{ margin: 0, color: '#333' }}>{titulo}</h3>
                    <button onClick={onClose} style={closeButtonStyle}>✕</button>
                </div>

                <div style={contentAreaStyle}>
                    <textarea
                        readOnly
                        value={conteudo}
                        style={textAreaStyle}
                    />
                </div>

                <div style={footerStyle}>
                    <button
                        onClick={handleCopiar}
                        style={{
                            ...actionButtonStyle,
                            backgroundColor: copiado ? '#28a745' : '#007bff',
                        }}
                    >
                        {copiado ? '✅ Copiado!' : '📋 Copiar Texto'}
                    </button>

                    <button
                        onClick={onClose}
                        style={{
                            ...actionButtonStyle,
                            backgroundColor: '#6c757d',
                        }}
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

// Estilos
const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
};

const modalStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
};

const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #e9ecef',
};

const closeButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#6c757d',
    padding: '4px',
};

const contentAreaStyle: React.CSSProperties = {
    padding: '20px',
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
};

const textAreaStyle: React.CSSProperties = {
    width: '100%',
    height: '400px',
    padding: '12px',
    borderRadius: '4px',
    border: '1px solid #ced4da',
    fontSize: '14px',
    fontFamily: 'monospace',
    lineHeight: '1.5',
    resize: 'none',
    backgroundColor: '#f8f9fa',
    boxSizing: 'border-box'
};

const footerStyle: React.CSSProperties = {
    padding: '16px 20px',
    borderTop: '1px solid #e9ecef',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
};

const actionButtonStyle: React.CSSProperties = {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
};
