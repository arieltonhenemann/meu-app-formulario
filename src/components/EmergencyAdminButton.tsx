import React, { useState } from 'react';
import { makeCurrentUserAdmin } from '../utils/makeAdmin';

export const EmergencyAdminButton: React.FC = () => {
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>('');

  const handleMakeAdmin = async () => {
    if (!window.confirm('⚠️ FUNÇÃO DE EMERGÊNCIA\n\nIsso tornará seu usuário atual em administrador do sistema.\n\nUsar apenas se não houver outros administradores.\n\nContinuar?')) {
      return;
    }

    setProcessing(true);
    setError('');
    setSuccess(false);

    try {
      console.log('🚨 EXECUTANDO FUNÇÃO DE EMERGÊNCIA...');
      await makeCurrentUserAdmin();
      
      setSuccess(true);
      alert('✅ SUCESSO!\n\nSeu usuário agora é administrador!\n\nAtualize a página (F5) para ver as mudanças.');
      
      // Atualizar a página após 2 segundos
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (err: any) {
      console.error('❌ Erro:', err);
      setError(err.message);
      alert(`❌ ERRO: ${err.message}`);
    } finally {
      setProcessing(false);
    }
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
        onClick={handleMakeAdmin}
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
