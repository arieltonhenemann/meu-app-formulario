import React, { useState } from 'react';
import { useAuth } from '../shared/contexts/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../shared/config/firebase';

export const AdminSetup: React.FC = () => {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const criarConfigAdmin = async () => {
    if (!user) {
      setError('Usuário não logado');
      return;
    }

    if (!isFirebaseConfigured() || !db) {
      setError('Firebase não configurado');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      // Criar documento admin_settings/admins no Firestore
      await setDoc(doc(db, 'admin_settings', 'admins'), {
        lista: [user.uid]
      });

      setSuccess(true);
      alert('🎉 Configuração de admin criada com sucesso!\n\nRecarregue a página e clique na aba "🛡️ Admin" para acessar o painel.');
    } catch (error) {
      console.error('Erro ao criar admin:', error);
      setError('Erro ao criar configuração: ' + (error as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  if (!user) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        backgroundColor: '#fff3cd',
        margin: '20px',
        borderRadius: '10px'
      }}>
        <h3>⚠️ Usuário não logado</h3>
        <p>Faça login primeiro para configurar o admin.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{
          textAlign: 'center',
          marginBottom: '30px',
          color: '#333',
          borderBottom: '2px solid #17a2b8',
          paddingBottom: '10px'
        }}>
          ⚙️ Configuração de Administrador
        </h2>

        {/* Informações do Usuário */}
        <div style={{
          backgroundColor: '#e7f3ff',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px',
          border: '1px solid #bee5eb'
        }}>
          <h3 style={{ color: '#0c5460', marginBottom: '15px' }}>
            👤 Suas Informações
          </h3>
          <div style={{ fontSize: '14px', color: '#0c5460' }}>
            <p><strong>📧 Email:</strong> {user.email}</p>
            <p><strong>🆔 UID (ID único):</strong></p>
            <div style={{
              backgroundColor: '#d1ecf1',
              padding: '10px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '12px',
              wordBreak: 'break-all',
              border: '1px solid #bee5eb'
            }}>
              {user.uid}
            </div>
          </div>
        </div>

        {/* Status Atual */}
        <div style={{
          backgroundColor: user.isApproved ? '#d4edda' : '#fff3cd',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px',
          border: `1px solid ${user.isApproved ? '#c3e6cb' : '#ffeaa7'}`
        }}>
          <h3 style={{ 
            color: user.isApproved ? '#155724' : '#856404', 
            marginBottom: '10px' 
          }}>
            📊 Status Atual
          </h3>
          <p style={{ 
            color: user.isApproved ? '#155724' : '#856404',
            fontSize: '16px',
            margin: 0
          }}>
            <strong>Status de Aprovação:</strong> {user.statusInfo?.status || 'Não encontrado'}
          </p>
        </div>

        {/* Explicação */}
        <div style={{
          backgroundColor: '#fff3cd',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px',
          border: '1px solid #ffeaa7'
        }}>
          <h3 style={{ color: '#856404', marginBottom: '15px' }}>
            ℹ️ Como Funciona
          </h3>
          <ol style={{ color: '#856404', fontSize: '14px', paddingLeft: '20px' }}>
            <li>Copie seu <strong>UID</strong> (mostrado acima)</li>
            <li>Ou clique no botão abaixo para criar automaticamente</li>
            <li>Recarregue a página após a configuração</li>
            <li>Clique na aba <strong>"🛡️ Admin"</strong> para acessar o painel</li>
          </ol>
        </div>

        {/* Configuração Automática */}
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ color: '#333', marginBottom: '20px' }}>
            🚀 Configuração Automática
          </h3>
          
          {!success ? (
            <button
              onClick={criarConfigAdmin}
              disabled={isCreating}
              style={{
                backgroundColor: isCreating ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                padding: '15px 30px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: isCreating ? 'not-allowed' : 'pointer',
                marginBottom: '20px'
              }}
            >
              {isCreating ? '⏳ Configurando...' : '✨ Me Tornar Administrador'}
            </button>
          ) : (
            <div style={{
              backgroundColor: '#d4edda',
              color: '#155724',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #c3e6cb'
            }}>
              <h4>🎉 Sucesso!</h4>
              <p>Você foi configurado como administrador!</p>
              <p><strong>Próximo passo:</strong> Recarregue a página (F5) e clique em "🛡️ Admin"</p>
            </div>
          )}

          {error && (
            <div style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #f5c6cb'
            }}>
              <h4>❌ Erro</h4>
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Configuração Manual */}
        <div style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <h4 style={{ color: '#495057', marginBottom: '15px' }}>
            🛠️ Configuração Manual (se preferir)
          </h4>
          <ol style={{ color: '#495057', fontSize: '14px', paddingLeft: '20px' }}>
            <li>Acesse: <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer">Firebase Console</a></li>
            <li>Vá em <strong>Firestore Database</strong></li>
            <li>Crie coleção: <code>admin_settings</code></li>
            <li>Documento ID: <code>admins</code></li>
            <li>Campo: <code>lista</code> (tipo: array)</li>
            <li>Valor: <code>["{user.uid}"]</code></li>
          </ol>
        </div>
      </div>
    </div>
  );
};
