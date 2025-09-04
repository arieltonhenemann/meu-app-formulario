import React, { useState, useEffect } from 'react';
import { Celular } from '../types/equipment';

interface ModalEditarCelularProps {
  celular: Celular | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (dadosAtualizados: {
    marca: string;
    modelo: string;
    imei: string;
    numeroSerie?: string;
    valorCompra: number;
    dataCompra: string;
    observacoes: string;
  }) => void;
  loading?: boolean;
}

export const ModalEditarCelular: React.FC<ModalEditarCelularProps> = ({
  celular,
  isOpen,
  onClose,
  onSave,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    imei: '',
    numeroSerie: '',
    valorCompra: 0,
    dataCompra: '',
    observacoes: ''
  });

  useEffect(() => {
    if (celular) {
      setFormData({
        marca: celular.marca || '',
        modelo: celular.modelo || '',
        imei: celular.imei || '',
        numeroSerie: celular.numeroSerie || '',
        valorCompra: celular.valorCompra || 0,
        dataCompra: celular.dataCompra ? celular.dataCompra.toISOString().split('T')[0] : '',
        observacoes: celular.observacoes || ''
      });
    }
  }, [celular]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.marca || !formData.modelo || !formData.imei) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    onSave({
      marca: formData.marca,
      modelo: formData.modelo,
      imei: formData.imei,
      numeroSerie: formData.numeroSerie || undefined,
      valorCompra: formData.valorCompra,
      dataCompra: formData.dataCompra,
      observacoes: formData.observacoes
    });
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📝 Editar Celular</h3>
          <button 
            className="modal-close-btn" 
            onClick={handleClose}
            disabled={loading}
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="marca">Marca *</label>
              <input
                type="text"
                id="marca"
                value={formData.marca}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="modelo">Modelo *</label>
              <input
                type="text"
                id="modelo"
                value={formData.modelo}
                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="imei">IMEI *</label>
              <input
                type="text"
                id="imei"
                value={formData.imei}
                onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                required
                disabled={loading}
                maxLength={15}
              />
            </div>

            <div className="form-group">
              <label htmlFor="numeroSerie">Número de Série</label>
              <input
                type="text"
                id="numeroSerie"
                value={formData.numeroSerie}
                onChange={(e) => setFormData({ ...formData, numeroSerie: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="valorCompra">Valor de Compra (R$) *</label>
              <input
                type="number"
                id="valorCompra"
                value={formData.valorCompra}
                onChange={(e) => setFormData({ ...formData, valorCompra: parseFloat(e.target.value) || 0 })}
                step="0.01"
                min="0"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="dataCompra">Data de Compra *</label>
              <input
                type="date"
                id="dataCompra"
                value={formData.dataCompra}
                onChange={(e) => setFormData({ ...formData, dataCompra: e.target.value })}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="observacoes">Observações</label>
            <textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={4}
              placeholder="Informações sobre manutenção, troca, reparos, etc."
              disabled={loading}
            />
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? '🔄 Salvando...' : '💾 Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
