import React, { useState } from 'react';
import { FuncionarioForm, SetorFuncionario } from '../types/equipment';
import { FuncionarioService } from '../services/funcionarioService';

interface CadastroFuncionarioProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CadastroFuncionario: React.FC<CadastroFuncionarioProps> = ({ 
  onSuccess, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<FuncionarioForm>({
    nome: '',
    setor: '',
    ativo: true
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      // Validações básicas
      if (!formData.nome.trim()) {
        throw new Error('Nome é obrigatório');
      }
      if (!formData.setor.trim()) {
        throw new Error('Setor é obrigatório');
      }

      await FuncionarioService.criarFuncionario(formData);
      
      // Limpar formulário
      setFormData({
        nome: '',
        setor: '',
        ativo: true
      });

      if (onSuccess) {
        onSuccess();
      }

      alert('Funcionário cadastrado com sucesso!');

    } catch (error: any) {
      setErro(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cadastro-funcionario">
      <h2>Cadastrar Funcionário</h2>
      
      {erro && (
        <div className="alert alert-error">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="nome">Nome *</label>
          <input
            type="text"
            id="nome"
            name="nome"
            value={formData.nome}
            onChange={handleInputChange}
            required
            disabled={loading}
            placeholder="Digite o nome completo do funcionário"
          />
        </div>

        <div className="form-group">
          <label htmlFor="setor">Setor *</label>
          <select
            id="setor"
            name="setor"
            value={formData.setor}
            onChange={handleInputChange}
            required
            disabled={loading}
          >
            <option value="">Selecione o setor...</option>
            {Object.values(SetorFuncionario).map(setor => (
              <option key={setor} value={setor}>{setor}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="ativo">Status</label>
          <select
            id="ativo"
            name="ativo"
            value={formData.ativo.toString()}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              ativo: e.target.value === 'true'
            }))}
            disabled={loading}
          >
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </select>
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Cadastrando...' : 'Cadastrar Funcionário'}
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
