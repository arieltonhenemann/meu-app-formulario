import React, { useState } from 'react';
import { NotebookForm } from '../types/equipment';
import { NotebookService } from '../services/notebookService';

interface CadastroNotebookProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CadastroNotebook: React.FC<CadastroNotebookProps> = ({ 
  onSuccess, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<NotebookForm>({
    marca: '',
    modelo: '',
    numeroSerie: '',
    processador: '',
    memoria: '',
    armazenamento: '',
    sistemaOperacional: '',
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
      if (!formData.numeroSerie.trim()) {
        throw new Error('Número de série é obrigatório');
      }
      if (!formData.processador.trim()) {
        throw new Error('Processador é obrigatório');
      }
      if (!formData.memoria.trim()) {
        throw new Error('Memória é obrigatória');
      }
      if (!formData.armazenamento.trim()) {
        throw new Error('Armazenamento é obrigatório');
      }
      if (!formData.sistemaOperacional.trim()) {
        throw new Error('Sistema operacional é obrigatório');
      }
      // Data de compra é opcional para equipamentos antigos
      if (formData.valorCompra <= 0) {
        throw new Error('Valor da compra deve ser maior que zero');
      }

      await NotebookService.criarNotebook(formData);
      
      // Limpar formulário
      setFormData({
        marca: '',
        modelo: '',
        numeroSerie: '',
        processador: '',
        memoria: '',
        armazenamento: '',
        sistemaOperacional: '',
        dataCompra: '',
        valorCompra: 0,
        observacoes: ''
      });

      if (onSuccess) {
        onSuccess();
      }

      alert('Notebook cadastrado com sucesso!');

    } catch (error: any) {
      setErro(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cadastro-notebook">
      <h2>Cadastrar Notebook</h2>
      
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
              <option value="Dell">Dell</option>
              <option value="Lenovo">Lenovo</option>
              <option value="HP">HP</option>
              <option value="Apple">Apple</option>
              <option value="Asus">Asus</option>
              <option value="Acer">Acer</option>
              <option value="Samsung">Samsung</option>
              <option value="Microsoft">Microsoft</option>
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
              placeholder="Ex: Latitude 5520"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="numeroSerie">Número de Série *</label>
          <input
            type="text"
            id="numeroSerie"
            name="numeroSerie"
            value={formData.numeroSerie}
            onChange={handleInputChange}
            required
            disabled={loading}
            placeholder="Número de série único do equipamento"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="processador">Processador *</label>
            <input
              type="text"
              id="processador"
              name="processador"
              value={formData.processador}
              onChange={handleInputChange}
              required
              disabled={loading}
              placeholder="Ex: Intel Core i7-11800H"
            />
          </div>

          <div className="form-group">
            <label htmlFor="memoria">Memória RAM *</label>
            <select
              id="memoria"
              name="memoria"
              value={formData.memoria}
              onChange={handleInputChange}
              required
              disabled={loading}
            >
              <option value="">Selecione...</option>
              <option value="4GB">4 GB</option>
              <option value="6GB">6 GB</option>
              <option value="8GB">8 GB</option>
              <option value="12GB">12 GB</option>
              <option value="16GB">16 GB</option>
              <option value="32GB">32 GB</option>
              <option value="64GB">64 GB</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="armazenamento">Armazenamento *</label>
            <select
              id="armazenamento"
              name="armazenamento"
              value={formData.armazenamento}
              onChange={handleInputChange}
              required
              disabled={loading}
            >
              <option value="">Selecione...</option>
              <option value="128GB SSD">128 GB SSD</option>
              <option value="256GB SSD">256 GB SSD</option>
              <option value="512GB SSD">512 GB SSD</option>
              <option value="1TB SSD">1 TB SSD</option>
              <option value="2TB SSD">2 TB SSD</option>
              <option value="128GB NVMe">128 GB NVMe</option>
              <option value="256GB NVMe">256 GB NVMe</option>
              <option value="512GB NVMe">512 GB NVMe</option>
              <option value="1TB NVMe">1 TB NVMe</option>
              <option value="2TB NVMe">2 TB NVMe</option>
              <option value="1TB HDD">1 TB HDD</option>
              <option value="2TB HDD">2 TB HDD</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="sistemaOperacional">Sistema Operacional *</label>
            <select
              id="sistemaOperacional"
              name="sistemaOperacional"
              value={formData.sistemaOperacional}
              onChange={handleInputChange}
              required
              disabled={loading}
            >
              <option value="">Selecione...</option>
              <option value="Windows 11 Pro">Windows 11 Pro</option>
              <option value="Windows 11 Home">Windows 11 Home</option>
              <option value="Windows 10 Pro">Windows 10 Pro</option>
              <option value="Windows 10 Home">Windows 10 Home</option>
              <option value="macOS">macOS</option>
              <option value="Ubuntu">Ubuntu</option>
              <option value="Linux">Linux</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="dataCompra">Data da Compra</label>
            <input
              type="date"
              id="dataCompra"
              name="dataCompra"
              value={formData.dataCompra}
              onChange={handleInputChange}
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
            placeholder="Informações adicionais sobre o notebook..."
          />
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Cadastrando...' : 'Cadastrar Notebook'}
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
