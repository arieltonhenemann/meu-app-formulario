import React, { useState, useEffect } from 'react';
import { useAuth } from '../shared/contexts/AuthContext';
import { userService } from '../shared/services/userService';
import { UsuarioStatus } from '../shared/types/usuario';

export const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const [usuariosPendentes, setUsuariosPendentes] = useState<UsuarioStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [processando, setProcessando] = useState<string | null>(null);

  useEffect(() => {
    verificarAdminECarregar();
  }, [user]);

  const verificarAdminECarregar = async () => {
    if (!user) return;

    try {
      // Verificar se é admin
      const ehAdmin = await userService.verificarSeEhAdmin(user.uid);
      setIsAdmin(ehAdmin);

      if (ehAdmin) {
        // Carregar usuários pendentes
        const pendentes = await userService.listarUsuariosPendentes();
        setUsuariosPendentes(pendentes);
      }
    } catch (error) {
      console.error('Erro ao verificar admin:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const aprovarUsuario = async (uid: string) => {
    if (!user) return;

    const confirmacao = window.confirm('Tem certeza que deseja aprovar este usuário?');
    if (!confirmacao) return;

    setProcessando(uid);
    try {
      await userService.aprovarUsuario(uid, user.uid);
      // Recarregar lista
      await verificarAdminECarregar();
      alert('Usuário aprovado com sucesso!');
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      alert('Erro ao aprovar usuário. Tente novamente.');
    } finally {
      setProcessando(null);
    }
  };

  const rejeitarUsuario = async (uid: string) => {
    if (!user) return;

    const motivo = window.prompt(
      'Digite o motivo da rejeição (opcional):',
      'Não atende aos critérios de acesso'
    );

    if (motivo === null) return; // Cancelou

    setProcessando(uid);
    try {
      await userService.rejeitarUsuario(uid, motivo, user.uid);
      // Recarregar lista
      await verificarAdminECarregar();
      alert('Usuário rejeitado.');
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
      alert('Erro ao rejeitar usuário. Tente novamente.');
    } finally {
      setProcessando(null);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '20px' }}>⏳</div>
        <p>Verificando permissões...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        backgroundColor: '#fff3cd',
        margin: '20px',
        borderRadius: '10px',
        border: '1px solid #ffeaa7'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🚫</div>
        <h2 style={{ color: '#856404', marginBottom: '10px' }}>
          Acesso Negado
        </h2>
        <p style={{ color: '#856404' }}>
          Você não tem permissão para acessar o painel administrativo.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
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
          borderBottom: '2px solid #dc3545',
          paddingBottom: '10px'
        }}>
          🛡️ Painel de Administração
        </h2>

        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#495057', marginBottom: '20px' }}>
            👥 Usuários Pendentes de Aprovação ({usuariosPendentes.length})
          </h3>

          {usuariosPendentes.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              backgroundColor: '#d1ecf1',
              borderRadius: '8px',
              border: '1px solid #bee5eb'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>✅</div>
              <h4 style={{ color: '#0c5460', marginBottom: '10px' }}>
                Nenhum usuário pendente
              </h4>
              <p style={{ color: '#0c5460', margin: 0 }}>
                Todos os usuários estão aprovados ou rejeitados.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {usuariosPendentes.map((usuario) => (
                <div
                  key={usuario.uid}
                  style={{
                    border: '2px solid #ffc107',
                    borderRadius: '8px',
                    padding: '20px',
                    backgroundColor: '#fff3cd',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h4 style={{ color: '#856404', marginBottom: '8px' }}>
                      📧 {usuario.email}
                    </h4>
                    {usuario.displayName && (
                      <p style={{ color: '#856404', margin: '4px 0', fontSize: '14px' }}>
                        👤 Nome: {usuario.displayName}
                      </p>
                    )}
                    <p style={{ color: '#856404', margin: '4px 0', fontSize: '14px' }}>
                      📅 Registrado em: {usuario.dataCriacao.toLocaleDateString('pt-BR')} às {usuario.dataCriacao.toLocaleTimeString('pt-BR')}
                    </p>
                    <p style={{ color: '#856404', margin: '4px 0', fontSize: '12px' }}>
                      🆔 UID: {usuario.uid}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginLeft: '20px' }}>
                    <button
                      onClick={() => aprovarUsuario(usuario.uid)}
                      disabled={processando === usuario.uid}
                      style={{
                        backgroundColor: processando === usuario.uid ? '#95a5a6' : '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: processando === usuario.uid ? 'not-allowed' : 'pointer',
                        minWidth: '100px'
                      }}
                    >
                      {processando === usuario.uid ? '⏳ Processando...' : '✅ Aprovar'}
                    </button>

                    <button
                      onClick={() => rejeitarUsuario(usuario.uid)}
                      disabled={processando === usuario.uid}
                      style={{
                        backgroundColor: processando === usuario.uid ? '#95a5a6' : '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: processando === usuario.uid ? 'not-allowed' : 'pointer',
                        minWidth: '100px'
                      }}
                    >
                      {processando === usuario.uid ? '⏳ Processando...' : '❌ Rejeitar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: '#e7f3ff',
          borderRadius: '8px',
          border: '1px solid #bee5eb'
        }}>
          <h4 style={{ color: '#0c5460', marginBottom: '10px' }}>
            ℹ️ Instruções
          </h4>
          <ul style={{ color: '#0c5460', fontSize: '14px', paddingLeft: '20px' }}>
            <li>Revise cuidadosamente cada solicitação antes de aprovar</li>
            <li>Usuários aprovados terão acesso imediato ao sistema</li>
            <li>Usuários rejeitados não conseguirão acessar o sistema</li>
            <li>Você pode rejeitar um usuário fornecendo um motivo</li>
          </ul>
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            onClick={verificarAdminECarregar}
            style={{
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🔄 Atualizar Lista
          </button>
        </div>
      </div>
    </div>
  );
};
