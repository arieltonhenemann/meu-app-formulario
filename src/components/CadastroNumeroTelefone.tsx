import React, { useState } from 'react';
import { NumeroTelefoneForm } from '../types/equipment';
import { NumeroTelefoneService } from '../services/numeroTelefoneService';

interface CadastroNumeroTelefoneProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CadastroNumeroTelefone: React.FC<CadastroNumeroTelefoneProps> = ({ 
  onSuccess, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<NumeroTelefoneForm>({
    numero: '',
    operadora: '',
    plano: '',
    valorMensal: 0,
    dataAtivacao: '',
    observacoes: ''
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'valorMensal' ? parseFloat(value) || 0 : value
    }));
  };

  const formatarNumero = (numero: string) => {
    // Remove tudo que não é dígito
    const digitos = numero.replace(/\D/g, '');
    
    // Formatar como (XX) XXXXX-XXXX
    if (digitos.length <= 2) {
      return `(${digitos}`;
    } else if (digitos.length <= 7) {
      return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
    } else {
      return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7, 11)}`;
    }
  };

  const handleNumeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorFormatado = formatarNumero(e.target.value);
    setFormData(prev => ({
      ...prev,
      numero: valorFormatado
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      // Validações básicas
      if (!formData.numero.trim()) {
        throw new Error('Número de telefone é obrigatório');
      }
      if (!formData.operadora.trim()) {
        throw new Error('Operadora é obrigatória');
      }
      if (!formData.plano.trim()) {
        throw new Error('Plano é obrigatório');
      }
      if (!formData.dataAtivacao) {
        throw new Error('Data de ativação é obrigatória');
      }
      if (formData.valorMensal <= 0) {
        throw new Error('Valor mensal deve ser maior que zero');
      }

      // Validar formato do número
      const digitos = formData.numero.replace(/\D/g, '');
      if (digitos.length !== 11) {
        throw new Error('Número deve ter 11 dígitos (incluindo DDD)');
      }

      await NumeroTelefoneService.criarNumeroTelefone(formData);
      
      // Limpar formulário
      setFormData({
        numero: '',
        operadora: '',
        plano: '',
        valorMensal: 0,
        dataAtivacao: '',
        observacoes: ''
      });

      if (onSuccess) {
        onSuccess();
      }

      alert('Número de telefone cadastrado com sucesso!');

    } catch (error: any) {
      setErro(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cadastro-numero-telefone">
      <h2>Cadastrar Número de Telefone</h2>
      
      {erro && (
        <div className="alert alert-error">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="numero">Número de Telefone *</label>
            <input
              type="tel"
              id="numero"
              name="numero"
              value={formData.numero}
              onChange={handleNumeroChange}
              required
              disabled={loading}
              placeholder="(00) 00000-0000"
              maxLength={15}
            />
          </div>

          <div className="form-group">
            <label htmlFor="operadora">Operadora *</label>
            <select
              id="operadora"
              name="operadora"
              value={formData.operadora}
              onChange={handleInputChange}
              required
              disabled={loading}
            >
              <option value="">Selecione...</option>
              <option value="Vivo">Vivo</option>
              <option value="Claro">Claro</option>
              <option value="TIM">TIM</option>
              <option value="Oi">Oi</option>
              <option value="Algar">Algar</option>
              <option value="Nextel">Nextel</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="plano">Plano *</label>
            <select
              id="plano"
              name="plano"
              value={formData.plano}
              onChange={handleInputChange}
              required
              disabled={loading}
            >
              <option value="">Selecione...</option>
              <option value="Pré-pago">Pré-pago</option>
              <option value="Pós-pago">Pós-pago</option>
              <option value="Controle">Controle</option>
              <option value="Empresarial">Empresarial</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="valorMensal">Valor Mensal (R$) *</label>
            <input
              type="number"
              id="valorMensal"
              name="valorMensal"
              value={formData.valorMensal}
              onChange={handleInputChange}
              required
              disabled={loading}
              min="0"
              step="0.01"
              placeholder="0,00"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="dataAtivacao">Data de Ativação *</label>
          <input
            type="date"
            id="dataAtivacao"
            name="dataAtivacao"
            value={formData.dataAtivacao}
            onChange={handleInputChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="observacoes">Observações</label>
          <textarea
            id="observacoes"
            name="observacoes"
            value={formData.observacoes}
            onChange={handleInputChange}
            disabled={loading}
            rows={3}
            placeholder="Informações adicionais sobre o número..."
          />
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Cadastrando...' : 'Cadastrar Número'}
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
