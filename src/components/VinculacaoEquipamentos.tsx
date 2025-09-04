import React, { useState, useEffect } from 'react';
import { 
  Funcionario, 
  Notebook, 
  Celular, 
  NumeroTelefone, 
  VinculacaoForm 
} from '../types/equipment';
import { VinculacaoService } from '../services/vinculacaoService';
import { FuncionarioService } from '../services/funcionarioService';
import { NotebookService } from '../services/notebookService';
import { CelularService } from '../services/celularService';
import { NumeroTelefoneService } from '../services/numeroTelefoneService';

interface VinculacaoEquipamentosProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const VinculacaoEquipamentos: React.FC<VinculacaoEquipamentosProps> = ({ 
  onSuccess, 
  onCancel 
}) => {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [celulares, setCelulares] = useState<Celular[]>([]);
  const [numeros, setNumeros] = useState<NumeroTelefone[]>([]);
  
  const [formData, setFormData] = useState<VinculacaoForm>({
    funcionarioId: '',
    notebookId: '',
    celularId: '',
    numeroTelefoneId: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string>('');
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoadingData(true);
      const [funcionariosData, notebooksData, celularesData, numerosData] = await Promise.all([
        FuncionarioService.buscarTodosFuncionarios(),
        NotebookService.buscarNotebooksDisponiveis(),
        CelularService.buscarCelularesDisponiveis(),
        NumeroTelefoneService.buscarNumerosDisponiveis()
      ]);
      
      setFuncionarios(funcionariosData);
      setNotebooks(notebooksData);
      setCelulares(celularesData);
      setNumeros(numerosData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setErro('Falha ao carregar dados necessários');
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value || undefined
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      // Validação: pelo menos um funcionário deve ser selecionado
      if (!formData.funcionarioId) {
        throw new Error('Funcionário é obrigatório');
      }

      // Validação: pelo menos um equipamento deve ser selecionado
      if (!formData.notebookId && !formData.celularId && !formData.numeroTelefoneId) {
        throw new Error('Selecione pelo menos um equipamento para vincular');
      }

      // Limpar campos vazios
      const dadosLimpos: VinculacaoForm = {
        funcionarioId: formData.funcionarioId,
        ...(formData.notebookId && { notebookId: formData.notebookId }),
        ...(formData.celularId && { celularId: formData.celularId }),
        ...(formData.numeroTelefoneId && { numeroTelefoneId: formData.numeroTelefoneId })
      };

      await VinculacaoService.vincularEquipamentos(dadosLimpos);
      
      // Limpar formulário
      setFormData({
        funcionarioId: '',
        notebookId: '',
        celularId: '',
        numeroTelefoneId: ''
      });

      // Recarregar dados para atualizar listas
      await carregarDados();

      if (onSuccess) {
        onSuccess();
      }

      alert('Equipamentos vinculados com sucesso!');

    } catch (error: any) {
      setErro(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="vinculacao-equipamentos">
        <h2>Vincular Equipamentos</h2>
        <div className="loading">Carregando dados...</div>
      </div>
    );
  }

  const funcionarioSelecionado = funcionarios.find(f => f.id === formData.funcionarioId);

  return (
    <div className="vinculacao-equipamentos">
      <h2>Vincular Equipamentos ao Funcionário</h2>
      
      {erro && (
        <div className="alert alert-error">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="funcionarioId">Funcionário *</label>
          <select
            id="funcionarioId"
            name="funcionarioId"
            value={formData.funcionarioId}
            onChange={handleInputChange}
            required
            disabled={loading}
          >
            <option value="">Selecione um funcionário...</option>
            {funcionarios.map(funcionario => (
              <option key={funcionario.id} value={funcionario.id}>
                {funcionario.nome} - {funcionario.setor}
              </option>
            ))}
          </select>
        </div>

        {funcionarioSelecionado && (
          <div className="funcionario-info">
            <h3>Informações do Funcionário</h3>
            <p><strong>Nome:</strong> {funcionarioSelecionado.nome}</p>
            <p><strong>Setor:</strong> {funcionarioSelecionado.setor}</p>
            <p><strong>Status:</strong> <span style={{color: funcionarioSelecionado.ativo ? '#28a745' : '#dc3545'}}>{funcionarioSelecionado.ativo ? 'Ativo' : 'Inativo'}</span></p>
          </div>
        )}

        <div className="equipamentos-section">
          <h3>Equipamentos Disponíveis</h3>
          
          <div className="form-group">
            <label htmlFor="notebookId">Notebook</label>
            <select
              id="notebookId"
              name="notebookId"
              value={formData.notebookId || ''}
              onChange={handleInputChange}
              disabled={loading}
            >
              <option value="">Nenhum notebook</option>
              {notebooks.map(notebook => (
                <option key={notebook.id} value={notebook.id}>
                  {notebook.marca} {notebook.modelo} - {notebook.numeroSerie}
                </option>
              ))}
            </select>
            {notebooks.length === 0 && (
              <small className="text-muted">Nenhum notebook disponível</small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="celularId">Celular</label>
            <select
              id="celularId"
              name="celularId"
              value={formData.celularId || ''}
              onChange={handleInputChange}
              disabled={loading}
            >
              <option value="">Nenhum celular</option>
              {celulares.map(celular => (
                <option key={celular.id} value={celular.id}>
                  {celular.marca} {celular.modelo} - IMEI: {celular.imei}
                </option>
              ))}
            </select>
            {celulares.length === 0 && (
              <small className="text-muted">Nenhum celular disponível</small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="numeroTelefoneId">Número de Telefone</label>
            <select
              id="numeroTelefoneId"
              name="numeroTelefoneId"
              value={formData.numeroTelefoneId || ''}
              onChange={handleInputChange}
              disabled={loading}
            >
              <option value="">Nenhum número</option>
              {numeros.map(numero => (
                <option key={numero.id} value={numero.id}>
                  {numero.numero} - {numero.operadora} ({numero.plano})
                </option>
              ))}
            </select>
            {numeros.length === 0 && (
              <small className="text-muted">Nenhum número disponível</small>
            )}
          </div>
        </div>

        <div className="resumo-vinculacao">
          <h3>Resumo da Vinculação</h3>
          {formData.funcionarioId && (
            <div className="resumo-item">
              <strong>Funcionário:</strong> {funcionarios.find(f => f.id === formData.funcionarioId)?.nome}
            </div>
          )}
          {formData.notebookId && (
            <div className="resumo-item">
              <strong>Notebook:</strong> {notebooks.find(n => n.id === formData.notebookId)?.marca} {notebooks.find(n => n.id === formData.notebookId)?.modelo}
            </div>
          )}
          {formData.celularId && (
            <div className="resumo-item">
              <strong>Celular:</strong> {celulares.find(c => c.id === formData.celularId)?.marca} {celulares.find(c => c.id === formData.celularId)?.modelo}
            </div>
          )}
          {formData.numeroTelefoneId && (
            <div className="resumo-item">
              <strong>Número:</strong> {numeros.find(n => n.id === formData.numeroTelefoneId)?.numero}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading || !formData.funcionarioId || (!formData.notebookId && !formData.celularId && !formData.numeroTelefoneId)}
          >
            {loading ? 'Vinculando...' : 'Vincular Equipamentos'}
          </button>
          
          {onCancel && (
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
