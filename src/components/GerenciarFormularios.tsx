import React, { useState, useEffect } from 'react';
import { FormularioSalvo, StatusFormulario, TipoFormulario, obterCorStatus, obterCorTipo } from '../shared/types/formularioSalvo';
import { firebaseFormularioStorage } from '../shared/services/firebaseFormularioStorage';
import { formatarData } from '../shared/utils';
import { useAuth } from '../shared/contexts/AuthContext';
import { labelStyle, inputStyle, buttonStyle, cardStyle, badgeStyle, statCardStyle } from '../shared/styles/forms';
import { toast } from '../shared/components/Toast';
import { registrarAcaoAuditoria } from '../shared/utils/auditoriaHelper';

interface GerenciarFormulariosProps {
  onEditarFormulario: (formulario: FormularioSalvo) => void;
}

export const GerenciarFormularios: React.FC<GerenciarFormulariosProps> = ({
  onEditarFormulario
}) => {
  const { user, isAdmin } = useAuth();
  const [formularios, setFormularios] = useState<FormularioSalvo[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<StatusFormulario | 'todos'>('pendente');
  const [filtrosTipo, setFiltrosTipo] = useState<TipoFormulario[]>([]);
  const [dropdownTipoAberto, setDropdownTipoAberto] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [filtroUsuario, setFiltroUsuario] = useState<string>('todos');

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
  const [isOnline, setIsOnline] = useState(firebaseFormularioStorage.estaOnline());
  const [temDadosPendentes, setTemDadosPendentes] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; codigoOS: string } | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    carregarFormularios();

    const handleOnline = () => {
      setIsOnline(true);
      carregarFormularios();
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
      const uid = !isAdmin ? user?.uid : undefined;
      const formulariosCarregados = await firebaseFormularioStorage.obterTodos(uid);

      setFormularios(formulariosCarregados);
      setIsOnline(firebaseFormularioStorage.estaOnline());
      setTemDadosPendentes(firebaseFormularioStorage.temDadosPendentes());
    } catch (error) {
      console.error('Erro ao carregar formulários:', error);
    }
  };
  const usuariosUnicosMap = new Map<string, { uid: string; email: string; displayName?: string | null }>();
  formularios.forEach(f => {
    if (f.criadoPor && f.criadoPor.uid) {
      usuariosUnicosMap.set(f.criadoPor.uid, f.criadoPor);
    }
  });
  const usuariosUnicos = Array.from(usuariosUnicosMap.values());

  const formulariosFiltrados = formularios.filter(formulario => {
    const passaStatus = filtroStatus === 'todos' || formulario.status === filtroStatus;
    const passaTipo = filtrosTipo.length === 0 || filtrosTipo.includes(formulario.tipo as TipoFormulario);
    const passaBusca = busca === '' ||
      formulario.codigoOS.toLowerCase().includes(busca.toLowerCase()) ||
      formulario.id.toLowerCase().includes(busca.toLowerCase());
    const passaUsuario = !isAdmin || filtroUsuario === 'todos' || (formulario.criadoPor && formulario.criadoPor.uid === filtroUsuario);

    return passaStatus && passaTipo && passaBusca && passaUsuario;
  });

  const finalizarFormulario = async (id: string) => {
    try {
      const formulario = formularios.find(f => f.id === id);

      const sucesso = await firebaseFormularioStorage.atualizarStatus(id, 'finalizado');
      if (sucesso) {
        if (user && formulario) {
          await registrarAcaoAuditoria(user, 'FINALIZAR_FORMULARIO', {
            formularioId: id,
            codigoOS: formulario.codigoOS,
            tipoFormulario: formulario.tipo,
            statusAnterior: 'pendente',
            statusNovo: 'finalizado'
          });
        }

        carregarFormularios();
        toast.success('Formulário finalizado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao finalizar formulário:', error);
      toast.error('Erro ao finalizar formulário. Tente novamente.');
    }
  };

  const reabrirFormulario = async (id: string) => {
    try {
      const formulario = formularios.find(f => f.id === id);

      const sucesso = await firebaseFormularioStorage.atualizarStatus(id, 'pendente');
      if (sucesso) {
        if (user && formulario) {
          await registrarAcaoAuditoria(user, 'REABRIR_FORMULARIO', {
            formularioId: id,
            codigoOS: formulario.codigoOS,
            tipoFormulario: formulario.tipo,
            statusAnterior: 'finalizado',
            statusNovo: 'pendente'
          });
        }

        carregarFormularios();
        toast.success('Formulário reaberto com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao reabrir formulário:', error);
      toast.error('Erro ao reabrir formulário. Tente novamente.');
    }
  };

  const iniciarFormulario = async (id: string) => {
    try {
      const formulario = formularios.find(f => f.id === id);
      const sucesso = await firebaseFormularioStorage.atualizarStatus(id, 'pendente');
      if (sucesso) {
        if (user && formulario) {
          await registrarAcaoAuditoria(user, 'INICIAR_FORMULARIO', {
            formularioId: id,
            codigoOS: formulario.codigoOS,
            tipoFormulario: formulario.tipo,
            statusAnterior: formulario.status,
            statusNovo: 'pendente'
          });
        }

        carregarFormularios();
        toast.success('Serviço iniciado! Status alterado para Pendente.');
      }
    } catch (error) {
      console.error('Erro ao iniciar serviço:', error);
      toast.error('Erro ao iniciar serviço. Tente novamente.');
    }
  };

  const pausarFormulario = async (id: string) => {
    try {
      const formulario = formularios.find(f => f.id === id);
      const sucesso = await firebaseFormularioStorage.atualizarStatus(id, 'aguardando');
      if (sucesso) {
        if (user && formulario) {
          await registrarAcaoAuditoria(user, 'AGUARDAR_FORMULARIO', {
            formularioId: id,
            codigoOS: formulario.codigoOS,
            tipoFormulario: formulario.tipo,
            statusAnterior: formulario.status,
            statusNovo: 'aguardando'
          });
        }

        carregarFormularios();
        toast.success('Serviço colocado em Aguardando!');
      }
    } catch (error) {
      console.error('Erro ao colocar serviço em aguardando:', error);
      toast.error('Erro ao alterar status. Tente novamente.');
    }
  };

  const excluirFormulario = async (id: string, codigoOS: string) => {
    try {
      const formulario = formularios.find(f => f.id === id);

      const sucesso = await firebaseFormularioStorage.excluir(id);
      if (sucesso) {
        if (user && formulario) {
          await registrarAcaoAuditoria(user, 'EXCLUIR_FORMULARIO', {
            formularioId: id,
            codigoOS: formulario.codigoOS,
            tipoFormulario: formulario.tipo,
            observacoes: `Formulário excluído permanentemente`
          });
        }

        carregarFormularios();
        toast.success('Formulário excluído com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao excluir formulário:', error);
      toast.error('Erro ao excluir formulário. Tente novamente.');
    }
  };

  const sincronizarDados = async () => {
    try {
      await firebaseFormularioStorage.sincronizarDados();
      carregarFormularios();
      toast.success('Sincronização concluída!');
    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast.error('Erro na sincronização. Verifique sua conexão.');
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
      case 'aguardando': return '⏸️';
      case 'pendente': return '⏳';
      case 'finalizado': return '✅';
    }
  };

  const formulariosParaEstatistica = formularios.filter(formulario => {
    const passaTipo = filtrosTipo.length === 0 || filtrosTipo.includes(formulario.tipo as TipoFormulario);
    const passaBusca = busca === '' ||
      formulario.codigoOS.toLowerCase().includes(busca.toLowerCase()) ||
      formulario.id.toLowerCase().includes(busca.toLowerCase());
    const passaUsuario = !isAdmin || filtroUsuario === 'todos' || (formulario.criadoPor && formulario.criadoPor.uid === filtroUsuario);
    return passaTipo && passaBusca && passaUsuario;
  });

  const statsFiltradas = {
    total: formulariosParaEstatistica.length,
    pendentes: formulariosParaEstatistica.filter(f => f.status === 'pendente').length,
    finalizados: formulariosParaEstatistica.filter(f => f.status === 'finalizado').length,
    aguardando: formulariosParaEstatistica.filter(f => f.status === 'aguardando').length,
  };

  const formulariosParaEstatisticaTipo = formularios.filter(formulario => {
    const passaStatus = filtroStatus === 'todos' || formulario.status === filtroStatus;
    const passaBusca = busca === '' ||
      formulario.codigoOS.toLowerCase().includes(busca.toLowerCase()) ||
      formulario.id.toLowerCase().includes(busca.toLowerCase());
    const passaUsuario = !isAdmin || filtroUsuario === 'todos' || (formulario.criadoPor && formulario.criadoPor.uid === filtroUsuario);
    return passaStatus && passaBusca && passaUsuario;
  });

  const statsTipos = {
    todos: formulariosParaEstatisticaTipo.length,
    cto: formulariosParaEstatisticaTipo.filter(f => f.tipo === 'CTO').length,
    pon: formulariosParaEstatisticaTipo.filter(f => f.tipo === 'PON').length,
    link: formulariosParaEstatisticaTipo.filter(f => f.tipo === 'LINK').length,
    adequacao: formulariosParaEstatisticaTipo.filter(f => f.tipo === 'ADEQUACAO').length,
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{
        backgroundColor: 'var(--bg-card)',
        color: 'var(--text-main)',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ color: 'var(--text-main)', fontSize: '2rem', margin: 0, marginBottom: '8px' }}>
              Codryx Tech
            </h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>
              Gerenciamento de Formulários
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
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
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
          Filtrar por Status
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '15px',
          marginBottom: '20px'
        }}>
          {/* Card Total */}
          <div
            onClick={() => setFiltroStatus('todos')}
            onMouseEnter={() => setHoveredCard('total')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              ...statCardStyle,
              borderLeftColor: '#6c757d',
              cursor: 'pointer',
              transform: hoveredCard === 'total' ? 'translateY(-2px)' : 'none',
              boxShadow: hoveredCard === 'total' ? '0 4px 8px rgba(0,0,0,0.15)' : (filtroStatus === 'todos' ? '0 4px 6px rgba(0,0,0,0.12)' : '0 2px 4px rgba(0,0,0,0.1)'),
              backgroundColor: filtroStatus === 'todos' ? 'var(--border-color)' : 'var(--bg-card)',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>{statsFiltradas.total}</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '5px' }}>Total</div>
          </div>

          {/* Card Aguardando */}
          <div
            onClick={() => setFiltroStatus('aguardando')}
            onMouseEnter={() => setHoveredCard('aguardando')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              ...statCardStyle,
              borderLeftColor: '#17a2b8',
              cursor: 'pointer',
              transform: hoveredCard === 'aguardando' ? 'translateY(-2px)' : 'none',
              boxShadow: hoveredCard === 'aguardando' ? '0 4px 8px rgba(0,0,0,0.15)' : (filtroStatus === 'aguardando' ? '0 4px 6px rgba(0,0,0,0.12)' : '0 2px 4px rgba(0,0,0,0.1)'),
              backgroundColor: filtroStatus === 'aguardando' ? 'rgba(23, 162, 184, 0.15)' : 'var(--bg-card)',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>{statsFiltradas.aguardando}</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '5px' }}>Aguardando</div>
          </div>

          {/* Card Pendentes */}
          <div
            onClick={() => setFiltroStatus('pendente')}
            onMouseEnter={() => setHoveredCard('pendente')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              ...statCardStyle,
              borderLeftColor: '#ffc107',
              cursor: 'pointer',
              transform: hoveredCard === 'pendente' ? 'translateY(-2px)' : 'none',
              boxShadow: hoveredCard === 'pendente' ? '0 4px 8px rgba(0,0,0,0.15)' : (filtroStatus === 'pendente' ? '0 4px 6px rgba(0,0,0,0.12)' : '0 2px 4px rgba(0,0,0,0.1)'),
              backgroundColor: filtroStatus === 'pendente' ? 'rgba(255, 193, 7, 0.15)' : 'var(--bg-card)',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>{statsFiltradas.pendentes}</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '5px' }}>Pendentes</div>
          </div>

          {/* Card Finalizados */}
          <div
            onClick={() => setFiltroStatus('finalizado')}
            onMouseEnter={() => setHoveredCard('finalizado')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              ...statCardStyle,
              borderLeftColor: '#28a745',
              cursor: 'pointer',
              transform: hoveredCard === 'finalizado' ? 'translateY(-2px)' : 'none',
              boxShadow: hoveredCard === 'finalizado' ? '0 4px 8px rgba(0,0,0,0.15)' : (filtroStatus === 'finalizado' ? '0 4px 6px rgba(0,0,0,0.12)' : '0 2px 4px rgba(0,0,0,0.1)'),
              backgroundColor: filtroStatus === 'finalizado' ? 'rgba(40, 167, 69, 0.15)' : 'var(--bg-card)',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>{statsFiltradas.finalizados}</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '5px' }}>Finalizados</div>
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', marginTop: '10px' }}>
          Filtrar por Tipo
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '15px',
          marginBottom: '20px'
        }}>
          {/* Card Todos os Tipos */}
          <div
            onClick={() => setFiltrosTipo([])}
            onMouseEnter={() => setHoveredCard('tipo-todos')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              ...statCardStyle,
              borderLeftColor: '#6c757d',
              cursor: 'pointer',
              transform: hoveredCard === 'tipo-todos' ? 'translateY(-2px)' : 'none',
              boxShadow: hoveredCard === 'tipo-todos' ? '0 4px 8px rgba(0,0,0,0.15)' : (filtrosTipo.length === 0 ? '0 4px 6px rgba(0,0,0,0.12)' : '0 2px 4px rgba(0,0,0,0.1)'),
              backgroundColor: filtrosTipo.length === 0 ? 'var(--border-color)' : 'var(--bg-card)',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>{statsTipos.todos}</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '5px' }}>Todos os Tipos</div>
          </div>

          {/* Card CTO */}
          <div
            onClick={() => setFiltrosTipo(['CTO'])}
            onMouseEnter={() => setHoveredCard('tipo-cto')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              ...statCardStyle,
              borderLeftColor: '#007bff',
              cursor: 'pointer',
              transform: hoveredCard === 'tipo-cto' ? 'translateY(-2px)' : 'none',
              boxShadow: hoveredCard === 'tipo-cto' ? '0 4px 8px rgba(0,0,0,0.15)' : (filtrosTipo.includes('CTO') ? '0 4px 6px rgba(0,0,0,0.12)' : '0 2px 4px rgba(0,0,0,0.1)'),
              backgroundColor: filtrosTipo.includes('CTO') ? 'rgba(0, 123, 255, 0.15)' : 'var(--bg-card)',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>{statsTipos.cto}</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '5px' }}>CTO</div>
          </div>

          {/* Card PON */}
          <div
            onClick={() => setFiltrosTipo(['PON'])}
            onMouseEnter={() => setHoveredCard('tipo-pon')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              ...statCardStyle,
              borderLeftColor: '#28a745',
              cursor: 'pointer',
              transform: hoveredCard === 'tipo-pon' ? 'translateY(-2px)' : 'none',
              boxShadow: hoveredCard === 'tipo-pon' ? '0 4px 8px rgba(0,0,0,0.15)' : (filtrosTipo.includes('PON') ? '0 4px 6px rgba(0,0,0,0.12)' : '0 2px 4px rgba(0,0,0,0.1)'),
              backgroundColor: filtrosTipo.includes('PON') ? 'rgba(40, 167, 69, 0.15)' : 'var(--bg-card)',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>{statsTipos.pon}</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '5px' }}>PON</div>
          </div>

          {/* Card LINK */}
          <div
            onClick={() => setFiltrosTipo(['LINK'])}
            onMouseEnter={() => setHoveredCard('tipo-link')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              ...statCardStyle,
              borderLeftColor: '#dc3545',
              cursor: 'pointer',
              transform: hoveredCard === 'tipo-link' ? 'translateY(-2px)' : 'none',
              boxShadow: hoveredCard === 'tipo-link' ? '0 4px 8px rgba(0,0,0,0.15)' : (filtrosTipo.includes('LINK') ? '0 4px 6px rgba(0,0,0,0.12)' : '0 2px 4px rgba(0,0,0,0.1)'),
              backgroundColor: filtrosTipo.includes('LINK') ? 'rgba(220, 53, 69, 0.15)' : 'var(--bg-card)',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>{statsTipos.link}</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '5px' }}>LINK</div>
          </div>

          {/* Card ADEQUACAO */}
          <div
            onClick={() => setFiltrosTipo(['ADEQUACAO'])}
            onMouseEnter={() => setHoveredCard('tipo-adequacao')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              ...statCardStyle,
              borderLeftColor: '#267ecc',
              cursor: 'pointer',
              transform: hoveredCard === 'tipo-adequacao' ? 'translateY(-2px)' : 'none',
              boxShadow: hoveredCard === 'tipo-adequacao' ? '0 4px 8px rgba(0,0,0,0.15)' : (filtrosTipo.includes('ADEQUACAO') ? '0 4px 6px rgba(0,0,0,0.12)' : '0 2px 4px rgba(0,0,0,0.1)'),
              backgroundColor: filtrosTipo.includes('ADEQUACAO') ? 'rgba(38, 126, 204, 0.15)' : 'var(--bg-card)',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>{statsTipos.adequacao}</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '5px' }}>Adequação</div>
          </div>
        </div>

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
              <option value="aguardando">Aguardando</option>
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
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-main)',
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
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>▼</span>
            </div>

            {dropdownTipoAberto && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                marginTop: '4px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
                zIndex: 10,
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                <label style={{ display: 'block', padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontSize: '14px', color: 'var(--text-main)' }}>
                  <input
                    type="checkbox"
                    checked={filtrosTipo.length === 0}
                    onChange={() => setFiltrosTipo([])}
                    style={{ marginRight: '8px' }}
                  />
                  Todos
                </label>
                {(['CTO', 'PON', 'LINK', 'ADEQUACAO'] as TipoFormulario[]).map((tipo) => (
                  <label key={tipo} style={{ display: 'block', padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontSize: '14px', color: 'var(--text-main)' }}>
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

          {isAdmin && (
            <div>
              <label style={labelStyle}>Usuário:</label>
              <select
                value={filtroUsuario}
                onChange={(e) => setFiltroUsuario(e.target.value)}
                style={inputStyle}
              >
                <option value="todos">Todos os Usuários</option>
                {usuariosUnicos.map((u) => (
                  <option key={u.uid} value={u.uid}>
                    {u.displayName || u.email}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gap: '15px' }}>
        {formulariosFiltrados.length === 0 ? (
          <div style={{
            ...cardStyle,
            textAlign: 'center',
            padding: '60px 20px',
            color: 'var(--text-muted)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📝</div>
            <h3>Nenhum formulário encontrado</h3>
            <p>Use os filtros acima para encontrar formulários ou crie um novo.</p>
          </div>
        ) : (
          formulariosFiltrados.map(formulario => (
            <div key={formulario.id} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '1.5rem' }}>
                      {obterIconeTipo(formulario.tipo)}
                    </span>
                    <h3 style={{ margin: 0, color: 'var(--text-main)' }}>
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

                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '15px' }}>
                    <div>ID: {formulario.id}</div>
                    <div>Criado: {formatarData(new Date(formulario.dataCriacao))}</div>
                    <div>Modificado: {formatarData(new Date(formulario.dataModificacao))}</div>
                    {formulario.criadoPor && (
                      <div style={{ marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>👤 Criado por:</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>
                          {formulario.criadoPor.displayName || formulario.criadoPor.email}
                        </span>
                        {formulario.criadoPor.displayName && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({formulario.criadoPor.email})</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

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

                  {formulario.status === 'aguardando' && (
                    <button
                      onClick={() => iniciarFormulario(formulario.id)}
                      style={{
                        ...buttonStyle,
                        backgroundColor: '#007bff',
                        padding: '8px 12px',
                        fontSize: '14px'
                      }}
                    >
                      ▶️ Iniciar
                    </button>
                  )}

                  {formulario.status === 'pendente' && (
                    <>
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
                      <button
                        onClick={() => pausarFormulario(formulario.id)}
                        style={{
                          ...buttonStyle,
                          backgroundColor: '#6c757d',
                          padding: '8px 12px',
                          fontSize: '14px'
                        }}
                      >
                        ⏸️ Aguardar
                      </button>
                    </>
                  )}

                  {formulario.status === 'finalizado' && (
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
                    onClick={() => {
                      toast.warning(`Tem certeza que deseja excluir o formulário "${formulario.codigoOS}"?`);
                      setConfirmDelete({ id: formulario.id, codigoOS: formulario.codigoOS });
                    }}
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

      {confirmDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-main)',
            padding: '30px',
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🗑️</div>
            <h3 style={{ color: 'var(--text-main)', marginBottom: '10px' }}>Confirmar Exclusão</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
              Tem certeza que deseja excluir o formulário "<strong>{confirmDelete.codigoOS}</strong>"? Esta ação não pode ser desfeita.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  ...buttonStyle,
                  backgroundColor: '#6c757d',
                  padding: '10px 20px'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  excluirFormulario(confirmDelete.id, confirmDelete.codigoOS);
                  setConfirmDelete(null);
                }}
                style={{
                  ...buttonStyle,
                  backgroundColor: '#dc3545',
                  padding: '10px 20px'
                }}
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
