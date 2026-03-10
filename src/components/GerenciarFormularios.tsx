import React, { useState, useEffect } from 'react';
import { FormularioSalvo, StatusFormulario, TipoFormulario, obterCorStatus, obterCorTipo } from '../shared/types/formularioSalvo';
// import { compatibilityStorage } from '../shared/services/compatibilityStorage';
import { firebaseFormularioStorage } from '../shared/services/firebaseFormularioStorage';
import { formatarData } from '../shared';
import { auditoriaService } from '../shared/services/auditoriaService';
import { useAuth } from '../shared/contexts/AuthContext';
import type { TipoFormularioAuditoria } from '../shared/types/auditoria';

interface GerenciarFormulariosProps {
  onEditarFormulario: (formulario: FormularioSalvo) => void;
  onNovoFormulario: () => void;
}

export const GerenciarFormularios: React.FC<GerenciarFormulariosProps> = ({
  onEditarFormulario,
  onNovoFormulario
}) => {
  const { user } = useAuth();
  const [formularios, setFormularios] = useState<FormularioSalvo[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<StatusFormulario | 'todos'>('pendente');
  const [filtrosTipo, setFiltrosTipo] = useState<TipoFormulario[]>([]);
  const [dropdownTipoAberto, setDropdownTipoAberto] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickFora = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownTipoAberto(false);
      }
    };
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  const [busca, setBusca] = useState('');
  const [estatisticas, setEstatisticas] = useState({ total: 0, pendentes: 0, finalizados: 0, porTipo: { CTO: 0, PON: 0, LINK: 0, ADEQUACAO: 0 } });
  const [isOnline, setIsOnline] = useState(firebaseFormularioStorage.estaOnline());
  const [temDadosPendentes, setTemDadosPendentes] = useState(false);

  useEffect(() => {
    carregarFormularios();

    // Monitorar status de conexão
    const handleOnline = () => {
      setIsOnline(true);
      carregarFormularios(); // Recarregar quando voltar online
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const carregarFormularios = async () => {
    try {
      const formulariosCarregados = await firebaseFormularioStorage.obterTodos();
      const estatisticasCarregadas = await firebaseFormularioStorage.obterEstatisticas();

      setFormularios(formulariosCarregados);
      setEstatisticas(estatisticasCarregadas);
      setIsOnline(firebaseFormularioStorage.estaOnline());
      setTemDadosPendentes(firebaseFormularioStorage.temDadosPendentes());
    } catch (error) {
      console.error('Erro ao carregar formulários:', error);
    }
  };

  const formulariosFiltrados = formularios.filter(formulario => {
    const passaStatus = filtroStatus === 'todos' || formulario.status === filtroStatus;
    const passaTipo = filtrosTipo.length === 0 || filtrosTipo.includes(formulario.tipo as TipoFormulario);
    const passaBusca = busca === '' ||
      formulario.codigoOS.toLowerCase().includes(busca.toLowerCase()) ||
      formulario.id.toLowerCase().includes(busca.toLowerCase());

    return passaStatus && passaTipo && passaBusca;
  });

  const finalizarFormulario = async (id: string) => {
    try {
      // Obter dados do formulário antes de finalizar
      const formulario = formularios.find(f => f.id === id);

      const sucesso = await firebaseFormularioStorage.atualizarStatus(id, 'finalizado');
      if (sucesso) {
        // Registrar log de auditoria
        if (user && formulario) {
          await auditoriaService.registrarAcao('FINALIZAR_FORMULARIO', {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName
          }, {
            formularioId: id,
            codigoOS: formulario.codigoOS,
            tipoFormulario: formulario.tipo as TipoFormularioAuditoria,
            statusAnterior: 'pendente',
            statusNovo: 'finalizado'
          });
        }

        carregarFormularios();
        alert('Formulário finalizado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao finalizar formulário:', error);
      alert('Erro ao finalizar formulário. Tente novamente.');
    }
  };

  const reabrirFormulario = async (id: string) => {
    try {
      // Obter dados do formulário antes de reabrir
      const formulario = formularios.find(f => f.id === id);

      const sucesso = await firebaseFormularioStorage.atualizarStatus(id, 'pendente');
      if (sucesso) {
        // Registrar log de auditoria
        if (user && formulario) {
          await auditoriaService.registrarAcao('REABRIR_FORMULARIO', {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName
          }, {
            formularioId: id,
            codigoOS: formulario.codigoOS,
            tipoFormulario: formulario.tipo as TipoFormularioAuditoria,
            statusAnterior: 'finalizado',
            statusNovo: 'pendente'
          });
        }

        carregarFormularios();
        alert('Formulário reaberto com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao reabrir formulário:', error);
      alert('Erro ao reabrir formulário. Tente novamente.');
    }
  };

  const excluirFormulario = async (id: string, codigoOS: string) => {
    const confirmacao = window.confirm(`Tem certeza que deseja excluir o formulário "${codigoOS}"?`);
    if (confirmacao) {
      try {
        // Obter dados do formulário antes de excluir
        const formulario = formularios.find(f => f.id === id);

        const sucesso = await firebaseFormularioStorage.excluir(id);
        if (sucesso) {
          // Registrar log de auditoria
          if (user && formulario) {
            await auditoriaService.registrarAcao('EXCLUIR_FORMULARIO', {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName
            }, {
              formularioId: id,
              codigoOS: formulario.codigoOS,
              tipoFormulario: formulario.tipo as TipoFormularioAuditoria,
              observacoes: `Formulário excluído permanentemente`
            });
          }

          carregarFormularios();
          alert('Formulário excluído com sucesso!');
        }
      } catch (error) {
        console.error('Erro ao excluir formulário:', error);
        alert('Erro ao excluir formulário. Tente novamente.');
      }
    }
  };

  const sincronizarDados = async () => {
    try {
      await firebaseFormularioStorage.sincronizarDados();
      carregarFormularios();
      alert('Sincronização concluída!');
    } catch (error) {
      console.error('Erro na sincronização:', error);
      alert('Erro na sincronização. Verifique sua conexão.');
    }
  };

  const obterIconeTipo = (tipo: TipoFormulario) => {
    switch (tipo) {
      case 'CTO': return '🏢';
      case 'PON': return '📡';
      case 'LINK': return '🔗';
      case 'ADEQUACAO': return '🛠️';
    }
  };

  const obterIconeStatus = (status: StatusFormulario) => {
    switch (status) {
      case 'pendente': return '⏳';
      case 'finalizado': return '✅';
    }
  };

  // Computando as estatísticas considerando os filtros aplicados de Tipo e Busca.
  // Note: O filtro de Status não deve afetar estes contadores individuais para que possamos ver os pendentes/finalizados daqueles tipos, 
  // exceto se quisermos ignorar completamente na exibição. Na UI antiga, as estatísticas globais eram mostradas independentes dos filtros da tela ou então fixas.
  // Pelo requisito, vamos calcular o total com base no que *poderia* ser visto em todos os status, mas respeitando o Filtro de Tipo e a Busca informada.
  const formulariosParaEstatistica = formularios.filter(formulario => {
    const passaTipo = filtrosTipo.length === 0 || filtrosTipo.includes(formulario.tipo as TipoFormulario);
    const passaBusca = busca === '' ||
      formulario.codigoOS.toLowerCase().includes(busca.toLowerCase()) ||
      formulario.id.toLowerCase().includes(busca.toLowerCase());
    return passaTipo && passaBusca;
  });

  const statsFiltradas = {
    total: formulariosParaEstatistica.length,
    pendentes: formulariosParaEstatistica.filter(f => f.status === 'pendente').length,
    finalizados: formulariosParaEstatistica.filter(f => f.status === 'finalizado').length,
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Cabeçalho */}
      <div style={{
        backgroundColor: '#fff',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ color: '#333', fontSize: '2rem', margin: 0, marginBottom: '8px' }}>
              📋 Gerenciar Formulários
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {/* Status de conexão */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                borderRadius: '12px',
                backgroundColor: isOnline ? '#d4edda' : '#f8d7da',
                border: `1px solid ${isOnline ? '#c3e6cb' : '#f5c6cb'}`,
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                <span style={{ color: isOnline ? '#155724' : '#721c24' }}>
                  {isOnline ? '🟢 Online' : '🔴 Offline'}
                </span>
              </div>

              {/* Indicador de dados pendentes */}
              {temDadosPendentes && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#856404'
                }}>
                  ⏳ Dados pendentes
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {/* Botão de sincronização */}
            {temDadosPendentes && isOnline && (
              <button
                onClick={sincronizarDados}
                style={{
                  ...buttonStyle,
                  backgroundColor: '#ffc107',
                  color: '#000',
                  padding: '12px 20px'
                }}
              >
                🔄 Sincronizar
              </button>
            )}

            <button
              onClick={onNovoFormulario}
              style={{
                ...buttonStyle,
                backgroundColor: '#007bff',
                padding: '12px 24px'
              }}
            >
              ➕ Novo Formulário
            </button>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '15px',
          marginBottom: '20px'
        }}>
          <div style={{ ...statCardStyle, borderLeftColor: '#6c757d' }}>
            <div style={statNumberStyle}>{statsFiltradas.total}</div>
            <div style={statLabelStyle}>Total</div>
          </div>
          <div style={{ ...statCardStyle, borderLeftColor: '#ffc107' }}>
            <div style={statNumberStyle}>{statsFiltradas.pendentes}</div>
            <div style={statLabelStyle}>Pendentes</div>
          </div>
          <div style={{ ...statCardStyle, borderLeftColor: '#28a745' }}>
            <div style={statNumberStyle}>{statsFiltradas.finalizados}</div>
            <div style={statLabelStyle}>Finalizados</div>
          </div>
        </div>

        {/* Filtros */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px'
        }}>
          <div>
            <label style={labelStyle}>Buscar:</label>
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={inputStyle}
              placeholder="Código da O.S ou ID..."
            />
          </div>

          <div>
            <label style={labelStyle}>Status:</label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value as StatusFormulario | 'todos')}
              style={inputStyle}
            >
              <option value="todos">Todos</option>
              <option value="pendente">Pendentes</option>
              <option value="finalizado">Finalizados</option>
            </select>
          </div>

          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <label style={labelStyle}>Tipo:</label>
            <div
              style={{
                ...inputStyle,
                cursor: 'pointer',
                backgroundColor: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
              onClick={() => setDropdownTipoAberto(!dropdownTipoAberto)}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>
                {filtrosTipo.length === 0
                  ? 'Todos'
                  : filtrosTipo.map(t => t === 'ADEQUACAO' ? 'ADEQUAÇÃO' : t).join(', ')}
              </span>
              <span style={{ fontSize: '10px', color: '#666' }}>▼</span>
            </div>

            {dropdownTipoAberto && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginTop: '4px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                zIndex: 10,
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                <label style={{ display: 'block', padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', fontSize: '14px', color: '#333' }}>
                  <input
                    type="checkbox"
                    checked={filtrosTipo.length === 0}
                    onChange={() => setFiltrosTipo([])}
                    style={{ marginRight: '8px' }}
                  />
                  Todos
                </label>
                {(['CTO', 'PON', 'LINK', 'ADEQUACAO'] as TipoFormulario[]).map((tipo) => (
                  <label key={tipo} style={{ display: 'block', padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', fontSize: '14px', color: '#333' }}>
                    <input
                      type="checkbox"
                      checked={filtrosTipo.includes(tipo)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFiltrosTipo([...filtrosTipo, tipo]);
                        } else {
                          setFiltrosTipo(filtrosTipo.filter(t => t !== tipo));
                        }
                      }}
                      style={{ marginRight: '8px' }}
                    />
                    {tipo === 'ADEQUACAO' ? 'ADEQUAÇÃO' : tipo}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lista de Formulários */}
      <div style={{ display: 'grid', gap: '15px' }}>
        {formulariosFiltrados.length === 0 ? (
          <div style={{
            ...cardStyle,
            textAlign: 'center',
            padding: '60px 20px',
            color: '#666'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📝</div>
            <h3>Nenhum formulário encontrado</h3>
            <p>Use os filtros acima para encontrar formulários ou crie um novo.</p>
          </div>
        ) : (
          formulariosFiltrados.map(formulario => (
            <div key={formulario.id} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                {/* Informações principais */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '1.5rem' }}>
                      {obterIconeTipo(formulario.tipo)}
                    </span>
                    <h3 style={{ margin: 0, color: '#333' }}>
                      {formulario.codigoOS}
                    </h3>
                    <span style={{
                      ...badgeStyle,
                      backgroundColor: obterCorTipo(formulario.tipo),
                      color: 'white'
                    }}>
                      {formulario.tipo}
                    </span>
                    <span style={{
                      ...badgeStyle,
                      backgroundColor: obterCorStatus(formulario.status),
                      color: formulario.status === 'pendente' ? '#000' : '#fff'
                    }}>
                      {obterIconeStatus(formulario.status)} {formulario.status.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '15px' }}>
                    <div>ID: {formulario.id}</div>
                    <div>Criado: {formatarData(new Date(formulario.dataCriacao))}</div>
                    <div>Modificado: {formatarData(new Date(formulario.dataModificacao))}</div>
                    {formulario.criadoPor && (
                      <div style={{ marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>👤 Criado por:</span>
                        <span style={{ fontWeight: 'bold', color: '#495057' }}>
                          {formulario.criadoPor.displayName || formulario.criadoPor.email}
                        </span>
                        {formulario.criadoPor.displayName && (
                          <span style={{ fontSize: '0.8rem', color: '#6c757d' }}>({formulario.criadoPor.email})</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => onEditarFormulario(formulario)}
                    style={{
                      ...buttonStyle,
                      backgroundColor: '#17a2b8',
                      padding: '8px 12px',
                      fontSize: '14px'
                    }}
                  >
                    ✏️ Editar
                  </button>

                  {formulario.status === 'pendente' ? (
                    <button
                      onClick={() => finalizarFormulario(formulario.id)}
                      style={{
                        ...buttonStyle,
                        backgroundColor: '#28a745',
                        padding: '8px 12px',
                        fontSize: '14px'
                      }}
                    >
                      ✅ Finalizar
                    </button>
                  ) : (
                    <button
                      onClick={() => reabrirFormulario(formulario.id)}
                      style={{
                        ...buttonStyle,
                        backgroundColor: '#ffc107',
                        color: '#000',
                        padding: '8px 12px',
                        fontSize: '14px'
                      }}
                    >
                      🔄 Reabrir
                    </button>
                  )}

                  <button
                    onClick={() => excluirFormulario(formulario.id, formulario.codigoOS)}
                    style={{
                      ...buttonStyle,
                      backgroundColor: '#dc3545',
                      padding: '8px 12px',
                      fontSize: '14px'
                    }}
                  >
                    🗑️ Excluir
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Estilos
const cardStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  padding: '20px',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  border: '1px solid #e9ecef'
};

const statCardStyle: React.CSSProperties = {
  ...cardStyle,
  borderLeft: '4px solid',
  padding: '15px'
};

const statNumberStyle: React.CSSProperties = {
  fontSize: '2rem',
  fontWeight: 'bold',
  color: '#333',
  margin: 0
};

const statLabelStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  color: '#666',
  marginTop: '5px'
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '5px',
  fontWeight: 'bold',
  color: '#333',
  fontSize: '14px'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '14px',
  fontFamily: 'inherit',
  boxSizing: 'border-box'
};

const buttonStyle: React.CSSProperties = {
  padding: '10px 16px',
  border: 'none',
  borderRadius: '5px',
  color: 'white',
  fontSize: '14px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  whiteSpace: 'nowrap'
};

const badgeStyle: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: '12px',
  fontSize: '0.75rem',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap'
};
