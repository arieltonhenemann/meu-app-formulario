import React, { useState, useEffect } from 'react';
import { Funcionario, SetorFuncionario } from '../types/equipment';

interface ModalEditarFuncionarioProps {
  funcionario: Funcionario | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (dados: { nome: string; setor: string; ativo: boolean }) => void;
  loading?: boolean;
}


export const ModalEditarFuncionario: React.FC<ModalEditarFuncionarioProps> = ({
  funcionario,
  isOpen,
  onClose,
  onSave,
  loading = false
}) => {
  const [nome, setNome] = useState('');
  const [setor, setSetor] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (funcionario) {
      setNome(funcionario.nome);
      setSetor(funcionario.setor);
      setAtivo(funcionario.ativo);
      setErro('');
    }
  }, [funcionario]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    // Validações
    if (!nome.trim()) {
      setErro('Nome é obrigatório');
      return;
    }

    if (!setor.trim()) {
      setErro('Setor é obrigatório');
      return;
    }

    onSave({ nome: nome.trim(), setor: setor.trim(), ativo });
  };

  const handleClose = () => {
    setErro('');
    onClose();
  };

  if (!isOpen || !funcionario) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>✏️ Editar Funcionário</h3>
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

            <div className="form-group">
              <label htmlFor="nome">Nome do Funcionário</label>
              <input
                type="text"
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Digite o nome completo"
                disabled={loading}
                maxLength={100}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="setor">Setor</label>
              <select
                id="setor"
                value={setor}
                onChange={(e) => setSetor(e.target.value)}
                disabled={loading}
                required
              >
                <option value="">Selecione um setor</option>
                {Object.values(SetorFuncionario).map(setorOption => (
                  <option key={setorOption} value={setorOption}>
                    {setorOption}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="status">Status do Funcionário</label>
              <select
                id="status"
                value={ativo ? 'true' : 'false'}
                onChange={(e) => setAtivo(e.target.value === 'true')}
                disabled={loading}
              >
                <option value="true">✅ Ativo</option>
                <option value="false">❌ Inativo</option>
              </select>
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
