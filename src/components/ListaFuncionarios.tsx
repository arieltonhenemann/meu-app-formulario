import React, { useState, useEffect } from 'react';
import { FuncionarioService } from '../services/funcionarioService';
import { Funcionario } from '../types/equipment';
import { ModalEditarFuncionario } from './ModalEditarFuncionario';

interface ListaFuncionariosProps {
  onBack?: () => void;
}

export const ListaFuncionarios: React.FC<ListaFuncionariosProps> = ({ onBack }) => {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string>('');
  const [filtroSetor, setFiltroSetor] = useState<string>('');
  const [funcionarioEditando, setFuncionarioEditando] = useState<Funcionario | null>(null);
  const [carregandoAcao, setCarregandoAcao] = useState<string>('');

  const carregarFuncionarios = async () => {
    try {
      setLoading(true);
      setErro('');
      const dados = await FuncionarioService.buscarTodosFuncionarios();
      setFuncionarios(dados);
    } catch (error: any) {
      console.error('Erro ao carregar funcionários:', error);
      setErro(error.message || 'Erro ao carregar funcionários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarFuncionarios();
  }, []);

  const funcionariosFiltrados = filtroSetor 
    ? funcionarios.filter(func => func.setor === filtroSetor)
    : funcionarios;

  const setoresUnicos = Array.from(new Set(funcionarios.map(func => func.setor))).sort();

  const formatarData = (data: Date) => {
    return data.toLocaleDateString('pt-BR');
  };

  const handleEditarFuncionario = (funcionario: Funcionario) => {
    setFuncionarioEditando(funcionario);
  };

  const handleSalvarEdicao = async (dadosAtualizados: { nome: string; setor: string; ativo: boolean }) => {
    if (!funcionarioEditando) return;
    
    try {
      setCarregandoAcao('editando');
      await FuncionarioService.atualizarFuncionario(funcionarioEditando.id, dadosAtualizados);
      
      // Atualizar lista local
      setFuncionarios(prev => prev.map(func => 
        func.id === funcionarioEditando.id 
          ? { ...func, ...dadosAtualizados, updatedAt: new Date() }
          : func
      ));
      
      setFuncionarioEditando(null);
    } catch (error: any) {
      console.error('Erro ao editar funcionário:', error);
      setErro(error.message || 'Erro ao editar funcionário');
    } finally {
      setCarregandoAcao('');
    }
  };

  const handleToggleStatus = async (funcionario: Funcionario) => {
    try {
      setCarregandoAcao(funcionario.id);
      
      if (funcionario.ativo) {
        await FuncionarioService.desativarFuncionario(funcionario.id);
      } else {
        await FuncionarioService.reativarFuncionario(funcionario.id);
      }
      
      // Atualizar lista local
      setFuncionarios(prev => prev.map(func => 
        func.id === funcionario.id 
          ? { ...func, ativo: !func.ativo, updatedAt: new Date() }
          : func
      ));
      
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      setErro(error.message || 'Erro ao alterar status do funcionário');
    } finally {
      setCarregandoAcao('');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <p>🔄 Carregando funcionários...</p>
      </div>
    );
  }

  return (
    <>
      <ModalEditarFuncionario 
        funcionario={funcionarioEditando}
        isOpen={!!funcionarioEditando}
        onClose={() => setFuncionarioEditando(null)}
        onSave={handleSalvarEdicao}
        loading={carregandoAcao === 'editando'}
      />
      
      <div className="lista-funcionarios">
      <div className="lista-header">
        <div>
          <h3>👥 Funcionários Cadastrados</h3>
          <p className="text-muted">Total: {funcionarios.length} funcionários</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select 
            value={filtroSetor} 
            onChange={(e) => setFiltroSetor(e.target.value)}
            className="select-filtro"
          >
            <option value="">Todos os Setores</option>
            {setoresUnicos.map(setor => (
              <option key={setor} value={setor}>{setor}</option>
            ))}
          </select>
          <button 
            className="btn btn-primary btn-small"
            onClick={carregarFuncionarios}
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
        {funcionariosFiltrados.length === 0 ? (
          <div className="sem-resultados">
            <p>📄 Nenhum funcionário encontrado</p>
            {filtroSetor && (
              <p>Tente alterar o filtro de setor ou remover o filtro.</p>
            )}
          </div>
        ) : (
          funcionariosFiltrados.map(funcionario => (
            <div key={funcionario.id} className="funcionario-card">
              <div className="funcionario-info">
                <h4>{funcionario.nome}</h4>
                <p><strong>Setor:</strong> {funcionario.setor}</p>
                <p><strong>Status:</strong> 
                  <span className={`status ${funcionario.ativo ? 'status-disponivel' : 'status-indisponivel'}`}>
                    {funcionario.ativo ? '✅ Ativo' : '❌ Inativo'}
                  </span>
                </p>
                <p className="data-admissao">
                  📅 Cadastrado em: {formatarData(funcionario.createdAt)}
                </p>
                {funcionario.updatedAt && funcionario.createdAt.getTime() !== funcionario.updatedAt.getTime() && (
                  <p className="data-admissao">
                    🔄 Última atualização: {formatarData(funcionario.updatedAt)}
                  </p>
                )}
              </div>
              
              <div className="acoes-funcionario">
                <button 
                  className="btn btn-warning btn-small"
                  onClick={() => handleEditarFuncionario(funcionario)}
                  disabled={carregandoAcao === 'editando'}
                >
                  ✏️ Editar
                </button>
                <button 
                  className={`btn btn-small ${funcionario.ativo ? 'btn-danger' : 'btn-success'}`}
                  onClick={() => handleToggleStatus(funcionario)}
                  disabled={carregandoAcao === funcionario.id}
                >
                  {carregandoAcao === funcionario.id 
                    ? '🔄...' 
                    : funcionario.ativo ? '🚫 Desativar' : '✅ Reativar'
                  }
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      </div>
    </>
  );
};
