import React, { useState } from 'react';
import { CelularForm } from '../types/equipment';
import { CelularService } from '../services/celularService';

interface CadastroCelularProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CadastroCelular: React.FC<CadastroCelularProps> = ({ 
  onSuccess, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<CelularForm>({
    marca: '',
    modelo: '',
    numeroSerie: '',
    imei: '',
    dataCompra: '',
    valorCompra: 0,
    observacoes: ''
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'valorCompra' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      // Validações básicas
      if (!formData.marca.trim()) {
        throw new Error('Marca é obrigatória');
      }
      if (!formData.modelo.trim()) {
        throw new Error('Modelo é obrigatório');
      }
      if (!formData.imei.trim()) {
        throw new Error('IMEI é obrigatório');
      }
      if (!formData.dataCompra) {
        throw new Error('Data de compra é obrigatória');
      }
      if (formData.valorCompra <= 0) {
        throw new Error('Valor da compra deve ser maior que zero');
      }

      // Validar IMEI (15 dígitos)
      if (!/^\d{15}$/.test(formData.imei)) {
        throw new Error('IMEI deve ter exatamente 15 dígitos');
      }

      await CelularService.criarCelular(formData);
      
      // Limpar formulário
      setFormData({
        marca: '',
        modelo: '',
        numeroSerie: '',
        imei: '',
        dataCompra: '',
        valorCompra: 0,
        observacoes: ''
      });

      if (onSuccess) {
        onSuccess();
      }

      alert('Celular cadastrado com sucesso!');

    } catch (error: any) {
      setErro(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cadastro-celular">
      <h2>Cadastrar Celular</h2>
      
      {erro && (
        <div className="alert alert-error">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="marca">Marca *</label>
            <select
              id="marca"
              name="marca"
              value={formData.marca}
              onChange={handleInputChange}
              required
              disabled={loading}
            >
              <option value="">Selecione...</option>
              <option value="Apple">Apple</option>
              <option value="Samsung">Samsung</option>
              <option value="Motorola">Motorola</option>
              <option value="Xiaomi">Xiaomi</option>
              <option value="LG">LG</option>
              <option value="Huawei">Huawei</option>
              <option value="OnePlus">OnePlus</option>
              <option value="Google">Google</option>
              <option value="Sony">Sony</option>
              <option value="Nokia">Nokia</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="modelo">Modelo *</label>
            <input
              type="text"
              id="modelo"
              name="modelo"
              value={formData.modelo}
              onChange={handleInputChange}
              required
              disabled={loading}
              placeholder="Ex: iPhone 13, Galaxy S22"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="numeroSerie">Número de Série</label>
            <input
              type="text"
              id="numeroSerie"
              name="numeroSerie"
              value={formData.numeroSerie}
              onChange={handleInputChange}
              disabled={loading}
              placeholder="Número de série (opcional)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="imei">IMEI *</label>
            <input
              type="text"
              id="imei"
              name="imei"
              value={formData.imei}
              onChange={handleInputChange}
              required
              disabled={loading}
              placeholder="15 dígitos (ex: 123456789012345)"
              maxLength={15}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="dataCompra">Data da Compra *</label>
            <input
              type="date"
              id="dataCompra"
              name="dataCompra"
              value={formData.dataCompra}
              onChange={handleInputChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="valorCompra">Valor da Compra (R$) *</label>
            <input
              type="number"
              id="valorCompra"
              name="valorCompra"
              value={formData.valorCompra}
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
          <label htmlFor="observacoes">Observações</label>
          <textarea
            id="observacoes"
            name="observacoes"
            value={formData.observacoes}
            onChange={handleInputChange}
            disabled={loading}
            rows={3}
            placeholder="Informações adicionais sobre o celular..."
          />
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Cadastrando...' : 'Cadastrar Celular'}
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
