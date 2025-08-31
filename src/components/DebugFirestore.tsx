import React, { useState } from 'react';
import { userService } from '../shared/services/userService';
import { useAuth } from '../shared/contexts/AuthContext';

export const DebugFirestore: React.FC = () => {
  const { user } = useAuth();
  const [isTestando, setIsTestando] = useState(false);
  const [resultado, setResultado] = useState<string>('');

  const testarSalvamento = async () => {
    if (!user) return;

    setIsTestando(true);
    setResultado('Iniciando teste...');

    try {
      console.log('🧪 TESTE: Tentando criar usuário teste no Firestore...');
      
      const testUID = 'test-' + Date.now();
      const testEmail = 'teste@debug.com';
      
      await userService.criarUsuarioStatus(testUID, testEmail, 'Usuário Teste');
      
      setResultado('✅ SUCESSO: Usuário teste criado no Firestore!');
      console.log('✅ TESTE PASSOU: Usuário salvo com sucesso');
      
    } catch (error) {
      console.error('❌ ERRO NO TESTE:', error);
      setResultado(`❌ ERRO: ${(error as Error).message}`);
    } finally {
      setIsTestando(false);
    }
  };

  const verificarPermissoes = () => {
    console.log('🔍 Verificando permissões...');
    console.log('👤 Usuário atual:', user);
    console.log('🆔 UID:', user?.uid);
    console.log('📧 Email:', user?.email);
    console.log('✅ Aprovado:', user?.isApproved);
    
    setResultado('Verifique o console para detalhes das permissões');
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', margin: '20px' }}>
      <h3 style={{ color: '#333', marginBottom: '20px' }}>
        🧪 Debug Firestore
      </h3>
      
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={testarSalvamento}
          disabled={isTestando}
          style={{
            backgroundColor: isTestando ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            marginRight: '10px',
            cursor: isTestando ? 'not-allowed' : 'pointer'
          }}
        >
          {isTestando ? '⏳ Testando...' : '🧪 Testar Salvamento'}
        </button>
        
        <button
          onClick={verificarPermissoes}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🔍 Verificar Permissões
        </button>
      </div>
      
      {resultado && (
        <div style={{
          padding: '15px',
          backgroundColor: resultado.includes('✅') ? '#d4edda' : '#f8d7da',
          color: resultado.includes('✅') ? '#155724' : '#721c24',
          borderRadius: '5px',
          fontFamily: 'monospace',
          fontSize: '14px'
        }}>
          {resultado}
        </div>
      )}
      
      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#fff3cd',
        borderRadius: '5px',
        fontSize: '14px'
      }}>
        <strong>💡 Como usar:</strong>
        <ol style={{ marginTop: '10px', paddingLeft: '20px' }}>
          <li>Clique em "🧪 Testar Salvamento"</li>
          <li>Veja se aparece sucesso ou erro</li>
          <li>Verifique o console (F12) para detalhes</li>
          <li>Se der erro, pode ser problema de permissões do Firestore</li>
        </ol>
      </div>
    </div>
  );
};
