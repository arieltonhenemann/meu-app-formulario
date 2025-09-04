import React, { useState, useEffect } from 'react';
import { 
  FuncionarioCompleto, 
  RelatorioEquipamento,
  StatusEquipamento,
  SetorFuncionario 
} from '../types/equipment';
import { VinculacaoService } from '../services/vinculacaoService';

type SectionType = 
  | 'dashboard' 
  | 'cadastro-funcionario' 
  | 'cadastro-notebook' 
  | 'cadastro-celular' 
  | 'cadastro-numero' 
  | 'vinculacao';

interface DashboardEquipamentosProps {
  onNavigate?: (section: SectionType) => void;
}

export const DashboardEquipamentos: React.FC<DashboardEquipamentosProps> = ({ 
  onNavigate 
}) => {
  const [funcionarios, setFuncionarios] = useState<FuncionarioCompleto[]>([]);
  const [relatorio, setRelatorio] = useState<RelatorioEquipamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string>('');
  const [filtro, setFiltro] = useState<'todos' | 'com_equipamentos' | 'sem_equipamentos'>('todos');
  const [filtroSetor, setFiltroSetor] = useState<string>('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setErro('');

      const [funcionariosData, relatorioData] = await Promise.all([
        VinculacaoService.buscarTodosFuncionariosComEquipamentos(),
        VinculacaoService.gerarRelatorioEquipamentos()
      ]);

      setFuncionarios(funcionariosData);
      setRelatorio(relatorioData);
    } catch (error: any) {
      setErro('Falha ao carregar dados do dashboard');
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDesvincularTodos = async (funcionarioId: string, nomeFuncionario: string) => {
    if (!window.confirm(`Deseja realmente desvincular todos os equipamentos de ${nomeFuncionario}?`)) {
      return;
    }

    try {
      const motivo = prompt('Motivo da desvinculação (opcional):');
      await VinculacaoService.desvincularTodosEquipamentos(funcionarioId, motivo || undefined);
      
      alert('Equipamentos desvinculados com sucesso!');
      await carregarDados();
    } catch (error: any) {
      alert(`Erro ao desvincular equipamentos: ${error.message}`);
    }
  };

  const handleDesvincularEquipamento = async (
    equipamentoId: string, 
    tipoEquipamento: 'notebook' | 'celular' | 'numero',
    nomeEquipamento: string
  ) => {
    if (!window.confirm(`Deseja realmente desvincular ${nomeEquipamento}?`)) {
      return;
    }

    try {
      const motivo = prompt('Motivo da desvinculação (opcional):');
      await VinculacaoService.desvincularEquipamento(equipamentoId, tipoEquipamento, motivo || undefined);
      
      alert('Equipamento desvinculado com sucesso!');
      await carregarDados();
    } catch (error: any) {
      alert(`Erro ao desvincular equipamento: ${error.message}`);
    }
  };

  const formatarData = (data: Date) => {
    return data.toLocaleDateString('pt-BR');
  };

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getStatusColor = (status: StatusEquipamento) => {
    switch (status) {
      case StatusEquipamento.DISPONIVEL:
        return 'status-disponivel';
      case StatusEquipamento.EM_USO:
        return 'status-em-uso';
      case StatusEquipamento.MANUTENCAO:
        return 'status-manutencao';
      case StatusEquipamento.INDISPONIVEL:
        return 'status-indisponivel';
      default:
        return '';
    }
  };

  const funcionariosFiltrados = funcionarios.filter(funcionario => {
    // Filtro por equipamentos
    let passaFiltroEquipamentos = true;
    switch (filtro) {
      case 'com_equipamentos':
        passaFiltroEquipamentos = !!(funcionario.notebook || funcionario.celular || funcionario.numeroTelefone);
        break;
      case 'sem_equipamentos':
        passaFiltroEquipamentos = !funcionario.notebook && !funcionario.celular && !funcionario.numeroTelefone;
        break;
      default:
        passaFiltroEquipamentos = true;
    }

    // Filtro por setor
    const passaFiltroSetor = filtroSetor ? funcionario.setor === filtroSetor : true;

    return passaFiltroEquipamentos && passaFiltroSetor;
  });

  if (loading) {
    return (
      <div className="dashboard-equipamentos">
        <h2>Dashboard de Equipamentos</h2>
        <div className="loading">Carregando dados...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-equipamentos">
      <div className="dashboard-header">
        <h2>Dashboard de Equipamentos</h2>
        <button onClick={() => carregarDados()} className="btn btn-outline">
          Atualizar Dados
        </button>
      </div>

      {erro && (
        <div className="alert alert-error">
          {erro}
        </div>
      )}

      {relatorio && (
        <div className="relatorio-cards">
          <div className="card">
            <h3>Funcionários</h3>
            <div className="card-stat">{relatorio.totalFuncionarios}</div>
            <div className="card-detail">
              {relatorio.funcionariosComEquipamentos} com equipamentos
            </div>
          </div>

          <div className="card">
            <h3>Notebooks</h3>
            <div className="card-stat">{relatorio.totalNotebooks}</div>
            <div className="card-detail">
              {relatorio.notebooksDisponiveis} disponíveis | {relatorio.notebooksEmUso} em uso
            </div>
          </div>

          <div className="card">
            <h3>Celulares</h3>
            <div className="card-stat">{relatorio.totalCelulares}</div>
            <div className="card-detail">
              {relatorio.celularesDisponiveis} disponíveis | {relatorio.celularesEmUso} em uso
            </div>
          </div>

          <div className="card">
            <h3>Números</h3>
            <div className="card-stat">{relatorio.totalNumeros}</div>
            <div className="card-detail">
              {relatorio.numerosDisponiveis} disponíveis | {relatorio.numerosEmUso} em uso
            </div>
          </div>
        </div>
      )}

      <div className="ações-rapidas">
        <h3>Ações Rápidas</h3>
        <div className="botoes-acoes">
          <button 
            className="btn btn-primary"
            onClick={() => onNavigate && onNavigate('cadastro-funcionario')}
          >
            Cadastrar Funcionário
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => onNavigate && onNavigate('cadastro-notebook')}
          >
            Cadastrar Notebook
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => onNavigate && onNavigate('cadastro-celular')}
          >
            Cadastrar Celular
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => onNavigate && onNavigate('cadastro-numero')}
          >
            Cadastrar Número
          </button>
          <button 
            className="btn btn-success"
            onClick={() => onNavigate && onNavigate('vinculacao')}
          >
            Vincular Equipamentos
          </button>
        </div>
      </div>

      <div className="lista-funcionarios">
        <div className="lista-header">
          <h3>Funcionários e Equipamentos</h3>
          <div className="filtros" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <select 
              value={filtro} 
              onChange={(e) => setFiltro(e.target.value as any)}
              className="select-filtro"
            >
              <option value="todos">Todos os funcionários</option>
              <option value="com_equipamentos">Com equipamentos</option>
              <option value="sem_equipamentos">Sem equipamentos</option>
            </select>
            
            <select 
              value={filtroSetor} 
              onChange={(e) => setFiltroSetor(e.target.value)}
              className="select-filtro"
            >
              <option value="">Todos os setores</option>
              {Object.values(SetorFuncionario).map(setor => (
                <option key={setor} value={setor}>{setor}</option>
              ))}
            </select>
            
            {(filtro !== 'todos' || filtroSetor) && (
              <button
                onClick={() => {
                  setFiltro('todos');
                  setFiltroSetor('');
                }}
                className="btn btn-outline btn-small"
                style={{ whiteSpace: 'nowrap' }}
              >
                🗑️ Limpar Filtros
              </button>
            )}
          </div>
        </div>

        <div className="funcionarios-grid">
          {funcionariosFiltrados.map(funcionario => (
            <div key={funcionario.id} className="funcionario-card">
              <div className="funcionario-info">
                <h4>{funcionario.nome}</h4>
                <p><strong>Setor:</strong> {funcionario.setor}</p>
                <p><strong>Status:</strong> <span style={{color: funcionario.ativo ? '#28a745' : '#dc3545'}}>{funcionario.ativo ? 'Ativo' : 'Inativo'}</span></p>
                <p className="data-cadastro">
                  Cadastrado em: {formatarData(funcionario.createdAt)}
                </p>
              </div>

              <div className="equipamentos-vinculados">
                {funcionario.notebook && (
                  <div className="equipamento-item">
                    <div className="equipamento-info">
                      <strong>Notebook:</strong> {funcionario.notebook.marca} {funcionario.notebook.modelo}
                      <br />
                      <small>S/N: {funcionario.notebook.numeroSerie}</small>
                      <br />
                      <span className={`status ${getStatusColor(funcionario.notebook.status)}`}>
                        {funcionario.notebook.status}
                      </span>
                    </div>
                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => handleDesvincularEquipamento(
                        funcionario.notebook!.id,
                        'notebook',
                        `${funcionario.notebook!.marca} ${funcionario.notebook!.modelo}`
                      )}
                    >
                      Desvincular
                    </button>
                  </div>
                )}

                {funcionario.celular && (
                  <div className="equipamento-item">
                    <div className="equipamento-info">
                      <strong>Celular:</strong> {funcionario.celular.marca} {funcionario.celular.modelo}
                      <br />
                      <small>IMEI: {funcionario.celular.imei}</small>
                      <br />
                      <span className={`status ${getStatusColor(funcionario.celular.status)}`}>
                        {funcionario.celular.status}
                      </span>
                    </div>
                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => handleDesvincularEquipamento(
                        funcionario.celular!.id,
                        'celular',
                        `${funcionario.celular!.marca} ${funcionario.celular!.modelo}`
                      )}
                    >
                      Desvincular
                    </button>
                  </div>
                )}

                {funcionario.numeroTelefone && (
                  <div className="equipamento-item">
                    <div className="equipamento-info">
                      <strong>Número:</strong> {funcionario.numeroTelefone.numero}
                      <br />
                      <small>{funcionario.numeroTelefone.operadora} - {funcionario.numeroTelefone.plano}</small>
                      <br />
                      <small>Valor: {formatarMoeda(funcionario.numeroTelefone.valorMensal)}/mês</small>
                      <br />
                      <span className={`status ${getStatusColor(funcionario.numeroTelefone.status)}`}>
                        {funcionario.numeroTelefone.status}
                      </span>
                    </div>
                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => handleDesvincularEquipamento(
                        funcionario.numeroTelefone!.id,
                        'numero',
                        funcionario.numeroTelefone!.numero
                      )}
                    >
                      Desvincular
                    </button>
                  </div>
                )}

                {!funcionario.notebook && !funcionario.celular && !funcionario.numeroTelefone && (
                  <div className="sem-equipamentos">
                    <p>Nenhum equipamento vinculado</p>
                    <button
                      className="btn btn-small btn-primary"
                      onClick={() => onNavigate && onNavigate('vinculacao')}
                    >
                      Vincular Equipamentos
                    </button>
                  </div>
                )}
              </div>

              {(funcionario.notebook || funcionario.celular || funcionario.numeroTelefone) && (
                <div className="acoes-funcionario">
                  <button
                    className="btn btn-small btn-warning"
                    onClick={() => handleDesvincularTodos(funcionario.id, funcionario.nome)}
                  >
                    Desvincular Todos
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {funcionariosFiltrados.length === 0 && (
          <div className="sem-resultados">
            <p>Nenhum funcionário encontrado com os filtros aplicados.</p>
          </div>
        )}
      </div>
    </div>
  );
};
