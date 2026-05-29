import React, { useState } from 'react';
import { makeCurrentUserAdmin } from '../utils/makeAdmin';
import { toast } from '../shared/components/Toast';

export const EmergencyAdminButton: React.FC = () => {
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>('');
  const [showConfirm, setShowConfirm] = useState(false);

  const confirmMakeAdmin = async () => {
    setShowConfirm(false);
    setProcessing(true);
    setError('');
    setSuccess(false);

    try {
      console.log('🚨 EXECUTANDO FUNÇÃO DE EMERGÊNCIA...');
      await makeCurrentUserAdmin();

      setSuccess(true);
      toast.success('Seu usuário agora é administrador! Atualize a página.');

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: unknown) {
      console.error('❌ Erro:', err);
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      toast.error(`Erro: ${errorMessage}`);
    } finally {
      setProcessing(false);
    }
  };

  const cancelConfirm = () => {
    setShowConfirm(false);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      zIndex: 9999,
      background: '#dc3545',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(220, 53, 69, 0.3)',
      maxWidth: '300px',
      fontSize: '0.9rem'
    }}>
      <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
        🚨 EMERGÊNCIA - Sem Admin
      </div>

      <div style={{ marginBottom: '15px', fontSize: '0.8rem' }}>
        Use este botão apenas se não há administradores no sistema e você precisa se tornar um.
      </div>

      {showConfirm && (
        <div style={{
          background: '#fff',
          color: '#333',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '10px',
          fontSize: '0.85rem'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
            ⚠️ Confirmar ação de emergência?
          </div>
          <div style={{ marginBottom: '10px', lineHeight: '1.4' }}>
            Isso tornará seu usuário atual em administrador do sistema. Use apenas se não houver outros administradores.
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={confirmMakeAdmin}
              disabled={processing}
              style={{
                flex: 1,
                background: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: processing ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '0.8rem'
              }}
            >
              Confirmar
            </button>
            <button
              onClick={cancelConfirm}
              disabled={processing}
              style={{
                flex: 1,
                background: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: processing ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '0.8rem'
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {success && (
        <div style={{
          background: '#28a745',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '10px',
          fontSize: '0.8rem'
        }}>
          ✅ Sucesso! Atualizando página...
        </div>
      )}

      {error && (
        <div style={{
          background: '#721c24',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '10px',
          fontSize: '0.8rem'
        }}>
          ❌ Erro: {error}
        </div>
      )}

      <button
        onClick={() => setShowConfirm(true)}
        disabled={processing || success}
        style={{
          background: processing ? '#6c757d' : '#fff',
          color: processing ? '#fff' : '#dc3545',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: processing ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
          width: '100%'
        }}
      >
        {processing ? '⏳ Processando...' : '🔧 Tornar-me Admin'}
      </button>

      <div style={{
        marginTop: '10px',
        fontSize: '0.7rem',
        opacity: 0.8
      }}>
        ⚠️ Este botão desaparecerá após o uso
      </div>
    </div>
  );
};
