import React, { useState, useEffect } from 'react';
import { Notebook } from '../types/equipment';

interface ModalEditarNotebookProps {
  notebook: Notebook | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (dados: {
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
  }) => void;
  loading?: boolean;
}

export const ModalEditarNotebook: React.FC<ModalEditarNotebookProps> = ({
  notebook,
  isOpen,
  onClose,
  onSave,
  loading = false
}) => {
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [processador, setProcessador] = useState('');
  const [memoria, setMemoria] = useState('');
  const [armazenamento, setArmazenamento] = useState('');
  const [sistemaOperacional, setSistemaOperacional] = useState('');
  const [valorCompra, setValorCompra] = useState('');
  const [dataCompra, setDataCompra] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (notebook) {
      setMarca(notebook.marca);
      setModelo(notebook.modelo);
      setNumeroSerie(notebook.numeroSerie);
      setProcessador(notebook.configuracao.processador);
      setMemoria(notebook.configuracao.memoria);
      setArmazenamento(notebook.configuracao.armazenamento);
      setSistemaOperacional(notebook.configuracao.sistemaOperacional);
      setValorCompra(notebook.valorCompra.toString());
      setDataCompra(notebook.dataCompra ? notebook.dataCompra.toISOString().split('T')[0] : '');
      setObservacoes(notebook.observacoes || '');
      setErro('');
    }
  }, [notebook]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    // Validações
    if (!marca.trim()) {
      setErro('Marca é obrigatória');
      return;
    }

    if (!modelo.trim()) {
      setErro('Modelo é obrigatório');
      return;
    }

    if (!numeroSerie.trim()) {
      setErro('Número de série é obrigatório');
      return;
    }

    if (!processador.trim()) {
      setErro('Processador é obrigatório');
      return;
    }

    if (!memoria.trim()) {
      setErro('Memória é obrigatória');
      return;
    }

    if (!armazenamento.trim()) {
      setErro('Armazenamento é obrigatório');
      return;
    }

    if (!sistemaOperacional.trim()) {
      setErro('Sistema operacional é obrigatório');
      return;
    }

    if (!valorCompra || parseFloat(valorCompra) <= 0) {
      setErro('Valor de compra deve ser maior que zero');
      return;
    }

    // Data de compra é opcional para equipamentos antigos

    onSave({
      marca: marca.trim(),
      modelo: modelo.trim(),
      numeroSerie: numeroSerie.trim(),
      processador: processador.trim(),
      memoria: memoria.trim(),
      armazenamento: armazenamento.trim(),
      sistemaOperacional: sistemaOperacional.trim(),
      valorCompra: parseFloat(valorCompra),
      dataCompra: dataCompra,
      observacoes: observacoes.trim()
    });
  };

  const handleClose = () => {
    setErro('');
    onClose();
  };

  if (!isOpen || !notebook) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>💻 Editar Notebook</h3>
          <button 
            className="modal-close-btn"
            onClick={handleClose}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {erro && (
              <div className="alert alert-error">
                ❌ {erro}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="marca">Marca</label>
                <input
                  type="text"
                  id="marca"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                  placeholder="Ex: Dell, HP, Lenovo"
                  disabled={loading}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="modelo">Modelo</label>
                <input
                  type="text"
                  id="modelo"
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  placeholder="Ex: Inspiron 15, ThinkPad X1"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="numeroSerie">Número de Série</label>
              <input
                type="text"
                id="numeroSerie"
                value={numeroSerie}
                onChange={(e) => setNumeroSerie(e.target.value)}
                placeholder="Número de série do equipamento"
                disabled={loading}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="processador">Processador</label>
                <input
                  type="text"
                  id="processador"
                  value={processador}
                  onChange={(e) => setProcessador(e.target.value)}
                  placeholder="Ex: Intel i5-12400H"
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="memoria">Memória RAM</label>
                <select
                  id="memoria"
                  value={memoria}
                  onChange={(e) => setMemoria(e.target.value)}
                  disabled={loading}
                  required
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
                <label htmlFor="armazenamento">Armazenamento</label>
                <select
                  id="armazenamento"
                  value={armazenamento}
                  onChange={(e) => setArmazenamento(e.target.value)}
                  disabled={loading}
                  required
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
                <label htmlFor="sistemaOperacional">Sistema Operacional</label>
                <input
                  type="text"
                  id="sistemaOperacional"
                  value={sistemaOperacional}
                  onChange={(e) => setSistemaOperacional(e.target.value)}
                  placeholder="Ex: Windows 11 Pro"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="valorCompra">Valor de Compra (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  id="valorCompra"
                  value={valorCompra}
                  onChange={(e) => setValorCompra(e.target.value)}
                  placeholder="0.00"
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="dataCompra">Data de Compra</label>
                <input
                  type="date"
                  id="dataCompra"
                  value={dataCompra}
                  onChange={(e) => setDataCompra(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="observacoes">Observações</label>
              <textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Manutenções, trocas de peças, problemas identificados, etc..."
                rows={4}
                disabled={loading}
              />
              <small className="text-muted">
                ℹ️ Use este campo para registrar manutenções, trocas de peças, problemas e outras observações importantes.
              </small>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
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
              {loading ? '🔄 Salvando...' : '💾 Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
