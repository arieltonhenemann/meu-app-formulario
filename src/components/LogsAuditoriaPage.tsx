import React, { useState, useEffect } from 'react';
import { 
  LogAuditoria, 
  TipoAcaoAuditoria,
  obterIconeAcao,
  obterCorAcao,
  obterDescricaoAcao
} from '../shared/types/auditoria';
import { auditoriaService } from '../shared/services/auditoriaService';
import { formatarData } from '../shared';

export const LogsAuditoriaPage: React.FC = () => {
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [logsOriginais, setLogsOriginais] = useState<LogAuditoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroAcao, setFiltroAcao] = useState<TipoAcaoAuditoria | 'todas'>('todas');
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState('7'); // últimos 7 dias
  const [busca, setBusca] = useState('');
  const [estatisticas, setEstatisticas] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(auditoriaService.estaOnline());

  useEffect(() => {
    carregarLogs();
    carregarEstatisticas();

    // Monitorar status de conexão
    const handleOnline = () => {
      setIsOnline(true);
      carregarLogs(); // Recarregar quando voltar online
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

  useEffect(() => {
    aplicarFiltros();
  }, [logsOriginais, filtroAcao, filtroUsuario, filtroPeriodo, busca]);

  const carregarLogs = async () => {
    setLoading(true);
    try {
      const logsCarregados = await auditoriaService.obterLogs(1000); // Últimos 1000 logs
      setLogsOriginais(logsCarregados);
      setIsOnline(auditoriaService.estaOnline());
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarEstatisticas = async () => {
    try {
      const stats = await auditoriaService.obterEstatisticasAcoes();
      setEstatisticas(stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const aplicarFiltros = () => {
    let logsFiltrados = [...logsOriginais];

    // Filtro por ação
    if (filtroAcao !== 'todas') {
      logsFiltrados = logsFiltrados.filter(log => log.acao === filtroAcao);
    }

    // Filtro por usuário
    if (filtroUsuario) {
      logsFiltrados = logsFiltrados.filter(log => 
        log.usuario.email.toLowerCase().includes(filtroUsuario.toLowerCase()) ||
        (log.usuario.displayName && log.usuario.displayName.toLowerCase().includes(filtroUsuario.toLowerCase()))
      );
    }

    // Filtro por período
    if (filtroPeriodo !== 'todos') {
      const dias = parseInt(filtroPeriodo);
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - dias);
      
      logsFiltrados = logsFiltrados.filter(log => 
        new Date(log.timestamp) >= dataLimite
      );
    }

    // Busca geral
    if (busca) {
      logsFiltrados = logsFiltrados.filter(log => 
        obterDescricaoAcao(log).toLowerCase().includes(busca.toLowerCase()) ||
        log.detalhes.codigoOS?.toLowerCase().includes(busca.toLowerCase()) ||
        log.id.toLowerCase().includes(busca.toLowerCase())
      );
    }

    setLogs(logsFiltrados);
  };

  const obterUsuariosUnicos = () => {
    const usuarios = logsOriginais.map(log => log.usuario);
    const usuariosUnicos = usuarios.filter((usuario, index, self) => 
      index === self.findIndex(u => u.uid === usuario.uid)
    );
    return usuariosUnicos;
  };

  const formatarTimestamp = (timestamp: string) => {
    const data = new Date(timestamp);
    return {
      data: formatarData(data),
      hora: data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ fontSize: '3rem' }}>🔄</div>
        <div style={{ fontSize: '1.2rem', color: '#666' }}>Carregando logs de auditoria...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
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
              📊 Logs de Auditoria
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
                  {isOnline ? '🟢 Online' : '🔴 Offline (Cache Local)'}
                </span>
              </div>
              
              <div style={{ fontSize: '14px', color: '#666' }}>
                Total de logs: <strong>{logs.length}</strong>
              </div>
            </div>
          </div>
          
          <button
            onClick={carregarLogs}
            style={{
              ...buttonStyle,
              backgroundColor: '#007bff',
              padding: '12px 20px'
            }}
          >
            🔄 Atualizar
          </button>
        </div>

        {/* Estatísticas */}
        {estatisticas && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
            gap: '15px',
            marginBottom: '20px'
          }}>
            <div style={{ ...statCardStyle, borderLeftColor: '#6c757d' }}>
              <div style={statNumberStyle}>{estatisticas.total}</div>
              <div style={statLabelStyle}>Total de Ações</div>
            </div>
            <div style={{ ...statCardStyle, borderLeftColor: '#28a745' }}>
              <div style={statNumberStyle}>{estatisticas.porAcao.CRIAR_FORMULARIO || 0}</div>
              <div style={statLabelStyle}>Criações</div>
            </div>
            <div style={{ ...statCardStyle, borderLeftColor: '#17a2b8' }}>
              <div style={statNumberStyle}>{estatisticas.porAcao.EDITAR_FORMULARIO || 0}</div>
              <div style={statLabelStyle}>Edições</div>
            </div>
            <div style={{ ...statCardStyle, borderLeftColor: '#dc3545' }}>
              <div style={statNumberStyle}>{estatisticas.porAcao.EXCLUIR_FORMULARIO || 0}</div>
              <div style={statLabelStyle}>Exclusões</div>
            </div>
            <div style={{ ...statCardStyle, borderLeftColor: '#ffc107' }}>
              <div style={statNumberStyle}>{estatisticas.porAcao.FINALIZAR_FORMULARIO || 0}</div>
              <div style={statLabelStyle}>Finalizações</div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '15px' 
        }}>
          <div>
            <label style={labelStyle}>Buscar:</label>
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={inputStyle}
              placeholder="Código, usuário, descrição..."
            />
          </div>
          
          <div>
            <label style={labelStyle}>Ação:</label>
            <select
              value={filtroAcao}
              onChange={(e) => setFiltroAcao(e.target.value as TipoAcaoAuditoria | 'todas')}
              style={inputStyle}
            >
              <option value="todas">Todas</option>
              <option value="CRIAR_FORMULARIO">Criação</option>
              <option value="EDITAR_FORMULARIO">Edição</option>
              <option value="EXCLUIR_FORMULARIO">Exclusão</option>
              <option value="FINALIZAR_FORMULARIO">Finalização</option>
              <option value="REABRIR_FORMULARIO">Reabertura</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Usuário:</label>
            <select
              value={filtroUsuario}
              onChange={(e) => setFiltroUsuario(e.target.value)}
              style={inputStyle}
            >
              <option value="">Todos</option>
              {obterUsuariosUnicos().map(usuario => (
                <option key={usuario.uid} value={usuario.email}>
                  {usuario.displayName || usuario.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Período:</label>
            <select
              value={filtroPeriodo}
              onChange={(e) => setFiltroPeriodo(e.target.value)}
              style={inputStyle}
            >
              <option value="1">Último dia</option>
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 3 meses</option>
              <option value="todos">Todos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Logs */}
      <div style={{ display: 'grid', gap: '10px' }}>
        {logs.length === 0 ? (
          <div style={{
            ...cardStyle,
            textAlign: 'center',
            padding: '60px 20px',
            color: '#666'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📋</div>
            <h3>Nenhum log encontrado</h3>
            <p>Ajuste os filtros para visualizar diferentes logs de auditoria.</p>
          </div>
        ) : (
          logs.map(log => {
            const { data, hora } = formatarTimestamp(log.timestamp);
            
            return (
              <div key={log.id} style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {/* Informações principais */}
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{
                      fontSize: '1.5rem',
                      padding: '8px',
                      borderRadius: '50%',
                      backgroundColor: obterCorAcao(log.acao) + '20',
                      border: `2px solid ${obterCorAcao(log.acao)}`,
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {obterIconeAcao(log.acao)}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px',
                        marginBottom: '5px'
                      }}>
                        <span style={{ 
                          fontWeight: 'bold', 
                          fontSize: '1rem',
                          color: '#333'
                        }}>
                          {obterDescricaoAcao(log)}
                        </span>
                        
                        <span style={{
                          ...badgeStyle,
                          backgroundColor: obterCorAcao(log.acao),
                          color: 'white',
                          fontSize: '10px'
                        }}>
                          {log.acao.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div style={{ color: '#666', fontSize: '0.85rem' }}>
                        <span style={{ marginRight: '15px' }}>
                          👤 <strong>{log.usuario.displayName || log.usuario.email}</strong>
                        </span>
                        <span style={{ marginRight: '15px' }}>
                          📅 {data}
                        </span>
                        <span>
                          🕒 {hora}
                        </span>
                      </div>
                      
                      {/* Detalhes adicionais */}
                      {log.detalhes.formularioId && (
                        <div style={{ 
                          marginTop: '8px', 
                          fontSize: '0.8rem', 
                          color: '#888',
                          fontFamily: 'monospace'
                        }}>
                          ID: {log.detalhes.formularioId}
                        </div>
                      )}
                      
                      {log.detalhes.statusAnterior && log.detalhes.statusNovo && (
                        <div style={{ 
                          marginTop: '5px', 
                          fontSize: '0.85rem', 
                          color: '#495057'
                        }}>
                          Status: <span style={{ textDecoration: 'line-through', color: '#dc3545' }}>
                            {log.detalhes.statusAnterior}
                          </span> → <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                            {log.detalhes.statusNovo}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informações técnicas */}
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: '#adb5bd',
                    textAlign: 'right',
                    minWidth: '100px'
                  }}>
                    <div>Log: {log.id.slice(0, 8)}...</div>
                    {log.detalhes.tipoFormulario && (
                      <div style={{ 
                        marginTop: '4px',
                        padding: '2px 6px',
                        backgroundColor: '#e9ecef',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 'bold'
                      }}>
                        {log.detalhes.tipoFormulario}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {logs.length > 0 && (
        <div style={{
          textAlign: 'center',
          marginTop: '20px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          fontSize: '0.9rem',
          color: '#666'
        }}>
          Exibindo <strong>{logs.length}</strong> logs de um total de <strong>{logsOriginais.length}</strong> registros
          {!isOnline && (
            <div style={{ marginTop: '10px', color: '#856404' }}>
              ⚠️ Modo offline - alguns logs podem não estar sincronizados
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Estilos
const cardStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  padding: '15px 20px',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  border: '1px solid #e9ecef',
  transition: 'all 0.2s ease'
};

const statCardStyle: React.CSSProperties = {
  ...cardStyle,
  borderLeft: '4px solid',
  padding: '15px',
  textAlign: 'center'
};

const statNumberStyle: React.CSSProperties = {
  fontSize: '1.8rem',
  fontWeight: 'bold',
  color: '#333',
  margin: 0
};

const statLabelStyle: React.CSSProperties = {
  fontSize: '0.8rem',
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
  padding: '3px 6px',
  borderRadius: '10px',
  fontSize: '10px',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap'
};
