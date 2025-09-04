import React, { useState, useEffect } from 'react';
import { NotebookService } from '../services/notebookService';
import { FuncionarioService } from '../services/funcionarioService';
import { Notebook, Funcionario, StatusEquipamento } from '../types/equipment';
import { ModalEditarNotebook } from './ModalEditarNotebook';
import { ModalConfirmarExclusao } from './ModalConfirmarExclusao';

interface ListaNotebooksProps {
  onBack?: () => void;
}

export const ListaNotebooks: React.FC<ListaNotebooksProps> = ({ onBack }) => {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [notebookEditando, setNotebookEditando] = useState<Notebook | null>(null);
  const [notebookExcluindo, setNotebookExcluindo] = useState<Notebook | null>(null);
  const [carregandoAcao, setCarregandoAcao] = useState<string>('');

  const carregarDados = async () => {
    try {
      setLoading(true);
      setErro('');
      const [notebooksData, funcionariosData] = await Promise.all([
        NotebookService.buscarTodosNotebooks(),
        FuncionarioService.buscarTodosFuncionarios()
      ]);
      setNotebooks(notebooksData);
      setFuncionarios(funcionariosData);
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      setErro(error.message || 'Erro ao carregar notebooks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const notebooksFiltrados = filtroStatus 
    ? notebooks.filter(notebook => notebook.status === filtroStatus)
    : notebooks;

  const getFuncionarioNome = (funcionarioId?: string) => {
    if (!funcionarioId) return 'Não vinculado';
    const funcionario = funcionarios.find(f => f.id === funcionarioId);
    return funcionario ? funcionario.nome : 'Funcionário não encontrado';
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

  const handleEditarNotebook = (notebook: Notebook) => {
    setNotebookEditando(notebook);
  };

  const handleSalvarEdicao = async (dadosAtualizados: {
    marca: string;
    modelo: string;
    numeroSerie: string;
    processador: string;
    memoria: string;
    armazenamento: string;
    sistemaOperacional: string;
    valorCompra: number;
    dataCompra: string;
    observacoes: string;
  }) => {
    if (!notebookEditando) return;
    
    try {
      setCarregandoAcao('editando');
      await NotebookService.atualizarNotebookCompleto(notebookEditando.id, dadosAtualizados);
      
      // Atualizar lista local
      setNotebooks(prev => prev.map(notebook => 
        notebook.id === notebookEditando.id 
          ? { 
              ...notebook, 
              marca: dadosAtualizados.marca,
              modelo: dadosAtualizados.modelo,
              numeroSerie: dadosAtualizados.numeroSerie,
              configuracao: {
                processador: dadosAtualizados.processador,
                memoria: dadosAtualizados.memoria,
                armazenamento: dadosAtualizados.armazenamento,
                sistemaOperacional: dadosAtualizados.sistemaOperacional
              },
              valorCompra: dadosAtualizados.valorCompra,
              dataCompra: dadosAtualizados.dataCompra ? new Date(dadosAtualizados.dataCompra) : null,
              observacoes: dadosAtualizados.observacoes,
              updatedAt: new Date()
            }
          : notebook
      ));
      
      setNotebookEditando(null);
    } catch (error: any) {
      console.error('Erro ao editar notebook:', error);
      setErro(error.message || 'Erro ao editar notebook');
    } finally {
      setCarregandoAcao('');
    }
  };

  const handleDesvincularNotebook = async (notebook: Notebook) => {
    try {
      setCarregandoAcao(notebook.id);
      await NotebookService.desvincularNotebook(notebook.id);
      
      // Atualizar lista local
      setNotebooks(prev => prev.map(nb => 
        nb.id === notebook.id 
          ? { ...nb, funcionarioId: undefined, status: StatusEquipamento.DISPONIVEL, updatedAt: new Date() }
          : nb
      ));
      
    } catch (error: any) {
      console.error('Erro ao desvincular notebook:', error);
      setErro(error.message || 'Erro ao desvincular notebook');
    } finally {
      setCarregandoAcao('');
    }
  };

  const handleExcluirNotebook = async () => {
    if (!notebookExcluindo) return;
    
    try {
      setCarregandoAcao('excluindo');
      await NotebookService.excluirNotebook(notebookExcluindo.id);
      
      // Remover da lista local
      setNotebooks(prev => prev.filter(nb => nb.id !== notebookExcluindo.id));
      
      setNotebookExcluindo(null);
    } catch (error: any) {
      console.error('Erro ao excluir notebook:', error);
      setErro(error.message || 'Erro ao excluir notebook');
    } finally {
      setCarregandoAcao('');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <p>🔄 Carregando notebooks...</p>
      </div>
    );
  }

  return (
    <>
      <ModalEditarNotebook 
        notebook={notebookEditando}
        isOpen={!!notebookEditando}
        onClose={() => setNotebookEditando(null)}
        onSave={handleSalvarEdicao}
        loading={carregandoAcao === 'editando'}
      />

      <ModalConfirmarExclusao 
        isOpen={!!notebookExcluindo}
        titulo="Excluir Notebook"
        mensagem={`Tem certeza de que deseja excluir o notebook ${notebookExcluindo?.marca} ${notebookExcluindo?.modelo}? Esta ação não pode ser desfeita.`}
        onConfirmar={handleExcluirNotebook}
        onCancelar={() => setNotebookExcluindo(null)}
        loading={carregandoAcao === 'excluindo'}
      />
      
      <div className="lista-funcionarios">
      <div className="lista-header">
        <div>
          <h3>💻 Notebooks Cadastrados</h3>
          <p className="text-muted">Total: {notebooks.length} notebooks</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
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
        {notebooksFiltrados.length === 0 ? (
          <div className="sem-resultados">
            <p>📄 Nenhum notebook encontrado</p>
            {filtroStatus && (
              <p>Tente alterar o filtro de status ou remover o filtro.</p>
            )}
          </div>
        ) : (
          notebooksFiltrados.map(notebook => (
            <div key={notebook.id} className="funcionario-card">
              <div className="funcionario-info">
                <h4>{notebook.marca} {notebook.modelo}</h4>
                <p><strong>Número de Série:</strong> {notebook.numeroSerie}</p>
                <p><strong>Status:</strong> 
                  <span className={`status ${getStatusDisplay(notebook.status).className}`}>
                    {getStatusDisplay(notebook.status).text}
                  </span>
                </p>
                <p><strong>Funcionário:</strong> {getFuncionarioNome(notebook.funcionarioId)}</p>
                
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
                  <p><strong>Configuração:</strong></p>
                  <p>🖥️ CPU: {notebook.configuracao.processador}</p>
                  <p>💾 RAM: {notebook.configuracao.memoria}</p>
                  <p>💽 HD: {notebook.configuracao.armazenamento}</p>
                  <p>💿 OS: {notebook.configuracao.sistemaOperacional}</p>
                </div>
                
                <p><strong>Valor:</strong> R$ {notebook.valorCompra.toFixed(2)}</p>
                {notebook.dataCompra && (
                  <p className="data-admissao">
                    📅 Comprado em: {formatarData(notebook.dataCompra)}
                  </p>
                )}
                {!notebook.dataCompra && (
                  <p className="data-admissao" style={{ color: '#999' }}>
                    📅 Data de compra não informada
                  </p>
                )}
                <p className="data-admissao">
                  📝 Cadastrado em: {formatarData(notebook.createdAt)}
                </p>
                
                {notebook.observacoes && (
                  <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
                    <strong>Observações:</strong> {notebook.observacoes}
                  </p>
                )}
              </div>
              
              <div className="acoes-funcionario">
                <button 
                  className="btn btn-warning btn-small"
                  onClick={() => handleEditarNotebook(notebook)}
                  disabled={carregandoAcao === 'editando'}
                >
                  ✏️ Editar
                </button>
                <button 
                  className="btn btn-danger btn-small"
                  onClick={() => setNotebookExcluindo(notebook)}
                  disabled={carregandoAcao === 'excluindo'}
                >
                  🗑️ Excluir
                </button>
                {notebook.funcionarioId && (
                  <button 
                    className="btn btn-secondary btn-small"
                    onClick={() => handleDesvincularNotebook(notebook)}
                    disabled={carregandoAcao === notebook.id}
                  >
                    {carregandoAcao === notebook.id 
                      ? '🔄...' 
                      : '🔗 Desvincular'
                    }
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      </div>
    </>
  );
};
