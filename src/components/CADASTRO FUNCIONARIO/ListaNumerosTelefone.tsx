import React, { useState, useEffect } from 'react';
import { NumeroTelefoneService } from '../../services/numeroTelefoneService';
import { FuncionarioService } from '../../services/funcionarioService';
import { CelularService } from '../../services/celularService';
import { NumeroTelefone, Funcionario, Celular, StatusEquipamento } from '../../types/equipment';

interface ListaNumerosTelefoneProps {
  onBack?: () => void;
}

export const ListaNumerosTelefone: React.FC<ListaNumerosTelefoneProps> = ({ onBack }) => {
  const [numeros, setNumeros] = useState<NumeroTelefone[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [celulares, setCelulares] = useState<Celular[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [filtroOperadora, setFiltroOperadora] = useState<string>('');

  const carregarDados = async () => {
    try {
      setLoading(true);
      setErro('');
      const [numerosData, funcionariosData, celularesData] = await Promise.all([
        NumeroTelefoneService.buscarTodosNumeros(),
        FuncionarioService.buscarTodosFuncionarios(),
        CelularService.buscarTodosCelulares()
      ]);
      setNumeros(numerosData);
      setFuncionarios(funcionariosData);
      setCelulares(celularesData);
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      setErro(error.message || 'Erro ao carregar números de telefone');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const numerosFiltrados = numeros.filter(numero => {
    if (filtroStatus && numero.status !== filtroStatus) return false;
    if (filtroOperadora && numero.operadora !== filtroOperadora) return false;
    return true;
  });

  const operadorasUnicas = Array.from(new Set(numeros.map(num => num.operadora))).sort();

  const getFuncionarioNome = (funcionarioId?: string) => {
    if (!funcionarioId) return 'Não vinculado';
    const funcionario = funcionarios.find(f => f.id === funcionarioId);
    return funcionario ? funcionario.nome : 'Funcionário não encontrado';
  };

  const getCelularInfo = (celularId?: string) => {
    if (!celularId) return 'Não vinculado';
    const celular = celulares.find(c => c.id === celularId);
    return celular ? `${celular.marca} ${celular.modelo}` : 'Celular não encontrado';
  };

  const getStatusDisplay = (status: StatusEquipamento) => {
    switch (status) {
      case StatusEquipamento.DISPONIVEL:
        return { text: '🟢 Disponível', className: 'status-disponivel' };
      case StatusEquipamento.EM_USO:
        return { text: '🟡 Em Uso', className: 'status-em-uso' };
      case StatusEquipamento.MANUTENCAO:
        return { text: '🔴 Manutenção', className: 'status-manutencao' };
      case StatusEquipamento.INDISPONIVEL:
        return { text: '⚫ Indisponível', className: 'status-indisponivel' };
      default:
        return { text: '❓ Desconhecido', className: 'status-indisponivel' };
    }
  };

  const formatarData = (data: Date) => {
    return data.toLocaleDateString('pt-BR');
  };

  const formatarNumero = (numero: string) => {
    // Formatar número: 11987654321 -> (11) 98765-4321
    if (numero.length === 11) {
      return `(${numero.substring(0, 2)}) ${numero.substring(2, 7)}-${numero.substring(7)}`;
    } else if (numero.length === 10) {
      return `(${numero.substring(0, 2)}) ${numero.substring(2, 6)}-${numero.substring(6)}`;
    }
    return numero;
  };

  if (loading) {
    return (
      <div className="loading">
        <p>🔄 Carregando números de telefone...</p>
      </div>
    );
  }

  return (
    <div className="lista-funcionarios">
      <div className="lista-header">
        <div>
          <h3>📞 Números de Telefone Cadastrados</h3>
          <p className="text-muted">Total: {numeros.length} números</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select
            value={filtroOperadora}
            onChange={(e) => setFiltroOperadora(e.target.value)}
            className="select-filtro"
          >
            <option value="">Todas as Operadoras</option>
            {operadorasUnicas.map(operadora => (
              <option key={operadora} value={operadora}>{operadora}</option>
            ))}
          </select>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="select-filtro"
          >
            <option value="">Todos os Status</option>
            <option value={StatusEquipamento.DISPONIVEL}>🟢 Disponível</option>
            <option value={StatusEquipamento.EM_USO}>🟡 Em Uso</option>
            <option value={StatusEquipamento.MANUTENCAO}>🔴 Manutenção</option>
            <option value={StatusEquipamento.INDISPONIVEL}>⚫ Indisponível</option>
          </select>
          <button
            className="btn btn-primary btn-small"
            onClick={carregarDados}
          >
            🔄 Atualizar
          </button>
          {onBack && (
            <button
              className="btn btn-outline btn-small"
              onClick={onBack}
            >
              ← Voltar
            </button>
          )}
        </div>
      </div>

      {erro && (
        <div className="alert alert-error">
          ❌ {erro}
        </div>
      )}

      <div className="funcionarios-grid">
        {numerosFiltrados.length === 0 ? (
          <div className="sem-resultados">
            <p>📄 Nenhum número de telefone encontrado</p>
            {(filtroStatus || filtroOperadora) && (
              <p>Tente alterar os filtros ou removê-los.</p>
            )}
          </div>
        ) : (
          numerosFiltrados.map(numero => (
            <div key={numero.id} className="funcionario-card">
              <div className="funcionario-info">
                <h4>📞 {formatarNumero(numero.numero)}</h4>
                <p><strong>Operadora:</strong> {numero.operadora}</p>
                <p><strong>Plano:</strong> {numero.plano}</p>
                <p><strong>Status:</strong>
                  <span className={`status ${getStatusDisplay(numero.status).className}`}>
                    {getStatusDisplay(numero.status).text}
                  </span>
                </p>
                <p><strong>Funcionário:</strong> {getFuncionarioNome(numero.funcionarioId)}</p>
                <p><strong>Celular:</strong> {getCelularInfo(numero.celularId)}</p>

                <p><strong>Valor Mensal:</strong> R$ {numero.valorMensal.toFixed(2)}</p>
                <p className="data-admissao">
                  📅 Ativado em: {formatarData(numero.dataAtivacao)}
                </p>
                <p className="data-admissao">
                  📝 Cadastrado em: {formatarData(numero.createdAt)}
                </p>

                {numero.observacoes && (
                  <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
                    <strong>Observações:</strong> {numero.observacoes}
                  </p>
                )}
              </div>

              <div className="acoes-funcionario">
                <button
                  className="btn btn-warning btn-small"
                  onClick={() => {
                    // TODO: Implementar edição
                    alert(`Editar número: ${formatarNumero(numero.numero)}`);
                  }}
                >
                  ✏️ Editar
                </button>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => {
                    // TODO: Implementar alteração de status
                    alert(`Alterar status do número: ${formatarNumero(numero.numero)}`);
                  }}
                >
                  🔄 Status
                </button>
                {(numero.funcionarioId || numero.celularId) && (
                  <button
                    className="btn btn-danger btn-small"
                    onClick={() => {
                      // TODO: Implementar desvinculação
                      alert(`Desvincular número: ${formatarNumero(numero.numero)}`);
                    }}
                  >
                    🔗 Desvincular
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
