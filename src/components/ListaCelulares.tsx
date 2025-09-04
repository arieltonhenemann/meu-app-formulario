import React, { useState, useEffect } from 'react';
import { CelularService } from '../services/celularService';
import { FuncionarioService } from '../services/funcionarioService';
import { Celular, Funcionario, StatusEquipamento } from '../types/equipment';
import { ModalEditarCelular } from './ModalEditarCelular';
import { ModalConfirmarExclusao } from './ModalConfirmarExclusao';

interface ListaCelularesProps {
  onBack?: () => void;
}

export const ListaCelulares: React.FC<ListaCelularesProps> = ({ onBack }) => {
  const [celulares, setCelulares] = useState<Celular[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [celularEditando, setCelularEditando] = useState<Celular | null>(null);
  const [celularExcluindo, setCelularExcluindo] = useState<Celular | null>(null);
  const [carregandoAcao, setCarregandoAcao] = useState<string>('');

  const carregarDados = async () => {
    try {
      setLoading(true);
      setErro('');
      const [celularesData, funcionariosData] = await Promise.all([
        CelularService.buscarTodosCelulares(),
        FuncionarioService.buscarTodosFuncionarios()
      ]);
      setCelulares(celularesData);
      setFuncionarios(funcionariosData);
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      setErro(error.message || 'Erro ao carregar celulares');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const celularesFiltrados = filtroStatus 
    ? celulares.filter(celular => celular.status === filtroStatus)
    : celulares;

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

  const mascaraIMEI = (imei: string) => {
    // Formatar IMEI: 123456-78-901234-5 -> 123456-78-******-*
    if (imei.length >= 8) {
      return imei.substring(0, 8) + '*'.repeat(imei.length - 8);
    }
    return imei;
  };

  const handleEditarCelular = (celular: Celular) => {
    setCelularEditando(celular);
  };

  const handleSalvarEdicao = async (dadosAtualizados: {
    marca: string;
    modelo: string;
    imei: string;
    numeroSerie?: string;
    valorCompra: number;
    dataCompra: string;
    observacoes: string;
  }) => {
    if (!celularEditando) return;
    
    try {
      setCarregandoAcao('editando');
      await CelularService.atualizarCelularCompleto(celularEditando.id, dadosAtualizados);
      
      // Atualizar lista local
      setCelulares(prev => prev.map(celular => 
        celular.id === celularEditando.id 
          ? { 
              ...celular, 
              marca: dadosAtualizados.marca,
              modelo: dadosAtualizados.modelo,
              imei: dadosAtualizados.imei,
              numeroSerie: dadosAtualizados.numeroSerie || '',
              valorCompra: dadosAtualizados.valorCompra,
              dataCompra: new Date(dadosAtualizados.dataCompra),
              observacoes: dadosAtualizados.observacoes,
              updatedAt: new Date()
            }
          : celular
      ));
      
      setCelularEditando(null);
    } catch (error: any) {
      console.error('Erro ao editar celular:', error);
      setErro(error.message || 'Erro ao editar celular');
    } finally {
      setCarregandoAcao('');
    }
  };

  const handleDesvincularCelular = async (celular: Celular) => {
    try {
      setCarregandoAcao(celular.id);
      await CelularService.desvincularCelular(celular.id);
      
      // Atualizar lista local
      setCelulares(prev => prev.map(cel => 
        cel.id === celular.id 
          ? { ...cel, funcionarioId: undefined, status: StatusEquipamento.DISPONIVEL, updatedAt: new Date() }
          : cel
      ));
      
    } catch (error: any) {
      console.error('Erro ao desvincular celular:', error);
      setErro(error.message || 'Erro ao desvincular celular');
    } finally {
      setCarregandoAcao('');
    }
  };

  const handleExcluirCelular = async () => {
    if (!celularExcluindo) return;
    
    try {
      setCarregandoAcao('excluindo');
      await CelularService.excluirCelular(celularExcluindo.id);
      
      // Remover da lista local
      setCelulares(prev => prev.filter(cel => cel.id !== celularExcluindo.id));
      
      setCelularExcluindo(null);
    } catch (error: any) {
      console.error('Erro ao excluir celular:', error);
      setErro(error.message || 'Erro ao excluir celular');
    } finally {
      setCarregandoAcao('');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <p>🔄 Carregando celulares...</p>
      </div>
    );
  }

  return (
    <>
      <ModalEditarCelular 
        celular={celularEditando}
        isOpen={!!celularEditando}
        onClose={() => setCelularEditando(null)}
        onSave={handleSalvarEdicao}
        loading={carregandoAcao === 'editando'}
      />

      <ModalConfirmarExclusao 
        isOpen={!!celularExcluindo}
        titulo="Excluir Celular"
        mensagem={`Tem certeza de que deseja excluir o celular ${celularExcluindo?.marca} ${celularExcluindo?.modelo}? Esta ação não pode ser desfeita.`}
        onConfirmar={handleExcluirCelular}
        onCancelar={() => setCelularExcluindo(null)}
        loading={carregandoAcao === 'excluindo'}
      />
      
      <div className="lista-funcionarios">
      <div className="lista-header">
        <div>
          <h3>📱 Celulares Cadastrados</h3>
          <p className="text-muted">Total: {celulares.length} celulares</p>
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
        {celularesFiltrados.length === 0 ? (
          <div className="sem-resultados">
            <p>📄 Nenhum celular encontrado</p>
            {filtroStatus && (
              <p>Tente alterar o filtro de status ou remover o filtro.</p>
            )}
          </div>
        ) : (
          celularesFiltrados.map(celular => (
            <div key={celular.id} className="funcionario-card">
              <div className="funcionario-info">
                <h4>📱 {celular.marca} {celular.modelo}</h4>
                <p><strong>IMEI:</strong> {mascaraIMEI(celular.imei)}</p>
                {celular.numeroSerie && (
                  <p><strong>Número de Série:</strong> {celular.numeroSerie}</p>
                )}
                <p><strong>Status:</strong> 
                  <span className={`status ${getStatusDisplay(celular.status).className}`}>
                    {getStatusDisplay(celular.status).text}
                  </span>
                </p>
                <p><strong>Funcionário:</strong> {getFuncionarioNome(celular.funcionarioId)}</p>
                
                <p><strong>Valor:</strong> R$ {celular.valorCompra.toFixed(2)}</p>
                <p className="data-admissao">
                  📅 Comprado em: {formatarData(celular.dataCompra)}
                </p>
                <p className="data-admissao">
                  📝 Cadastrado em: {formatarData(celular.createdAt)}
                </p>
                
                {celular.observacoes && (
                  <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
                    <strong>Observações:</strong> {celular.observacoes}
                  </p>
                )}
              </div>
              
              <div className="acoes-funcionario">
                <button 
                  className="btn btn-warning btn-small"
                  onClick={() => handleEditarCelular(celular)}
                  disabled={carregandoAcao === 'editando'}
                >
                  ✏️ Editar
                </button>
                <button 
                  className="btn btn-danger btn-small"
                  onClick={() => setCelularExcluindo(celular)}
                  disabled={carregandoAcao === 'excluindo'}
                >
                  🗑️ Excluir
                </button>
                {celular.funcionarioId && (
                  <button 
                    className="btn btn-secondary btn-small"
                    onClick={() => handleDesvincularCelular(celular)}
                    disabled={carregandoAcao === celular.id}
                  >
                    {carregandoAcao === celular.id 
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
