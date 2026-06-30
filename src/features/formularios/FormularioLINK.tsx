import React, { useState, useEffect } from 'react';
import { OrdemServicoLINK, criarLINKVazia, LinkInfo, criarLinkVazio } from '../../shared/types/link';
import { gerarArquivoLINK } from '../../shared/utils/gerarArquivoTxt';
import { firebaseFormularioStorage } from '../../shared/services/firebaseFormularioStorage';
import { useAuth } from '../../shared/contexts/AuthContext';
import { TxtModal } from '../../shared/components/TxtModal';
import { labelStyle, inputStyle, buttonStyle, formContainerStyle, formCardStyle } from '../../shared/styles/forms';
import { toast } from '../../shared/components/Toast';
import { registrarAcaoAuditoria } from '../../shared/utils/auditoriaHelper';
import { StatusFormulario } from '../../shared/types/formularioSalvo';

interface FormularioLINKProps {
  onSubmit?: (dados: OrdemServicoLINK) => void;
  dadosIniciais?: Partial<OrdemServicoLINK>;
  formularioId?: string;
  modoGerenciamento?: boolean;
  onFinalizar?: (formularioId: string) => void;
}

export const FormularioLINK: React.FC<FormularioLINKProps> = ({ onSubmit, dadosIniciais, formularioId, modoGerenciamento, onFinalizar }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<StatusFormulario>('pendente');
  const [formData, setFormData] = useState<OrdemServicoLINK>(() => {
    if (dadosIniciais) {
      return { ...criarLINKVazia(), ...dadosIniciais };
    }
    return criarLINKVazia();
  });

  const [txtModalAberto, setTxtModalAberto] = useState(false);
  const [txtConteudo, setTxtConteudo] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (dadosIniciais) {
      setFormData({ ...criarLINKVazia(), ...dadosIniciais });
    }
  }, [dadosIniciais]);

  const handleChange = (field: keyof Omit<OrdemServicoLINK, 'links'>, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLinkChange = (linkId: string, field: keyof Omit<LinkInfo, 'id'>, value: string) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.map(link =>
        link.id === linkId
          ? { ...link, [field]: value }
          : link
      )
    }));
  };

  const adicionarLink = () => {
    setFormData(prev => ({
      ...prev,
      links: [...prev.links, criarLinkVazio()]
    }));
  };

  const removerLink = (linkId: string) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.filter(link => link.id !== linkId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      console.log('Dados da O.S LINK:', formData);

      if (formularioId) {
        await firebaseFormularioStorage.atualizar(formularioId, formData);

        await registrarAcaoAuditoria(user, 'EDITAR_FORMULARIO', {
          formularioId,
          codigoOS: formData.codigoOS,
          tipoFormulario: 'LINK',
          dadosAlterados: formData
        });

        toast.success('Ordem de Serviço LINK atualizada com sucesso!');
      } else {
        const criadoPor = user ? {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName
        } : undefined;
        const formularioSalvo = await firebaseFormularioStorage.salvar('LINK', formData, criadoPor, status);

        await registrarAcaoAuditoria(user, 'CRIAR_FORMULARIO', {
          formularioId: formularioSalvo.id,
          codigoOS: formData.codigoOS,
          tipoFormulario: 'LINK'
        });

        toast.success('Ordem de Serviço LINK salva com sucesso!');

        limparFormulario();
      }

      onSubmit?.(formData);
    } catch (error) {
      console.error('Erro ao salvar formulário:', error);
      toast.error('Erro ao salvar. Os dados foram salvos localmente e serão sincronizados quando possível.');
    }
  };

  const handleGerarTxt = () => {
    try {
      const conteudo = gerarArquivoLINK(formData);
      setTxtConteudo(conteudo);
      setTxtModalAberto(true);
    } catch (err) {
      console.error('Erro ao gerar TXT:', err);
      toast.error('Erro ao gerar arquivo TXT.');
    }
  };

  const limparFormulario = () => {
    setFormData(criarLINKVazia());
  };

  return (
    <div style={formContainerStyle}>
      <div style={formCardStyle}>
        <h2 style={{
          textAlign: 'center',
          marginBottom: '30px',
          color: 'var(--text-main)',
          borderBottom: '2px solid #dc3545',
          paddingBottom: '10px'
        }}>
          🔗 Ordem de Serviço — Link
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Código da O.S */}
          <div style={{
            display: !modoGerenciamento ? 'grid' : 'block',
            gridTemplateColumns: !modoGerenciamento ? '1fr 1fr' : 'none',
            gap: !modoGerenciamento ? '20px' : 'none',
            marginBottom: '20px'
          }}>
            <div>
              <label style={labelStyle}>CÓDIGO DA O.S:</label>
              <input
                type="text"
                value={formData.codigoOS}
                onChange={(e) => handleChange('codigoOS', e.target.value)}
                style={inputStyle}
                placeholder="Ex: OS-LINK-2024-001"
              />
            </div>
            {!modoGerenciamento && (
              <div>
                <label style={labelStyle}>STATUS INICIAL:</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusFormulario)}
                  style={inputStyle}
                >
                  <option value="pendente">⏳ Pendente</option>
                  <option value="aguardando">⏸️ Aguardando</option>
                </select>
              </div>
            )}
          </div>

          {/* Seção de Links Dinâmicos */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px',
              padding: '15px',
              backgroundColor: 'var(--bg-app)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <h3 style={{ color: 'var(--text-main)', fontSize: '18px', margin: 0 }}>
                🔗 Links Configurados: <span style={{ color: '#17a2b8', fontWeight: 'bold' }}>({formData.links.length})</span>
              </h3>
              <button
                type="button"
                onClick={adicionarLink}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                  ...buttonStyle,
                  backgroundColor: isHovered ? '#138496' : '#17a2b8',
                  fontSize: '14px',
                  padding: '10px 18px',
                  boxShadow: '0 2px 4px rgba(23, 162, 184, 0.3)',
                  transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.2s ease'
                }}
              >
                ➕ Adicionar Link
              </button>
            </div>

            {formData.links.map((link, index) => (
              <div key={link.id} style={{
                border: '2px solid var(--border-color)',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '15px',
                backgroundColor: 'var(--bg-app)',
                position: 'relative'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '15px'
                }}>
                  <h4 style={{
                    color: 'var(--text-main)',
                    fontSize: '16px',
                    margin: 0
                  }}>
                    🔗 LINK {index + 1}
                  </h4>

                  {formData.links.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removerLink(link.id)}
                      style={{
                        ...buttonStyle,
                        backgroundColor: '#dc3545',
                        fontSize: '12px',
                        padding: '5px 10px',
                        minWidth: 'auto'
                      }}
                    >
                      ❌ Remover
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <label style={labelStyle}>LINK:</label>
                    <input
                      type="text"
                      value={link.link}
                      onChange={(e) => handleLinkChange(link.id, 'link', e.target.value)}
                      style={inputStyle}
                      placeholder={`Ex: LINK-${String.fromCharCode(65 + index)}-001`}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>PORTA:</label>
                    <input
                      type="text"
                      value={link.porta}
                      onChange={(e) => handleLinkChange(link.id, 'porta', e.target.value)}
                      style={inputStyle}
                      placeholder={`Ex: Porta ${index + 1}`}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={labelStyle}>NÍVEL ANTES:</label>
                    <input
                      type="text"
                      value={link.nivelAntes}
                      onChange={(e) => handleLinkChange(link.id, 'nivelAntes', e.target.value)}
                      style={inputStyle}
                      placeholder="Ex: -15 dBm"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>NÍVEL POS:</label>
                    <input
                      type="text"
                      value={link.nivelPos}
                      onChange={(e) => handleLinkChange(link.id, 'nivelPos', e.target.value)}
                      style={inputStyle}
                      placeholder="Ex: -10 dBm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Problema */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>PROBLEMA:</label>
            <textarea
              value={formData.problema}
              onChange={(e) => handleChange('problema', e.target.value)}
              style={{
                ...inputStyle,
                minHeight: '80px',
                resize: 'vertical'
              }}
              placeholder="Descreva o problema encontrado nos links..."
            />
          </div>

          {/* Resolução */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>RESOLUÇÃO:</label>
            <textarea
              value={formData.resolucao}
              onChange={(e) => handleChange('resolucao', e.target.value)}
              style={{
                ...inputStyle,
                minHeight: '80px',
                resize: 'vertical'
              }}
              placeholder="Descreva as ações tomadas para resolver o problema..."
            />
          </div>

          {/* Material Utilizado */}
          <div style={{ marginBottom: '30px' }}>
            <label style={labelStyle}>MATERIAL UTILIZADO:</label>
            <textarea
              value={formData.materialUtilizado}
              onChange={(e) => handleChange('materialUtilizado', e.target.value)}
              style={{
                ...inputStyle,
                minHeight: '60px',
                resize: 'vertical'
              }}
              placeholder="Liste os materiais utilizados no reparo..."
            />
          </div>

          {/* Botões */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '15px',
            marginTop: '30px'
          }}>
            {/* Botão esquerdo - condicional baseado no modo */}
            {modoGerenciamento ? (
              <button
                type="button"
                onClick={async () => {
                  if (!formularioId) return;

                  try {
                    await firebaseFormularioStorage.atualizar(formularioId, formData);

                    await registrarAcaoAuditoria(user, 'EDITAR_FORMULARIO', {
                      formularioId,
                      codigoOS: formData.codigoOS,
                      tipoFormulario: 'LINK',
                      dadosAlterados: formData
                    });

                    onFinalizar && onFinalizar(formularioId);
                  } catch (error) {
                    console.error('Erro ao salvar antes de finalizar:', error);
                    toast.error('Erro ao salvar alterações. Tente novamente.');
                  }
                }}
                disabled={!formularioId}
                style={{
                  ...buttonStyle,
                  backgroundColor: '#ffc107',
                  color: '#212529',
                  flex: '1'
                }}
              >
                ✅ Finalizar Ordem
              </button>
            ) : (
              <button
                type="button"
                onClick={limparFormulario}
                style={{
                  ...buttonStyle,
                  backgroundColor: '#6c757d',
                  flex: '1'
                }}
              >
                🗑️ Limpar Formulário
              </button>
            )}

            {/* Grupo de ação (Gerar TXT + Salvar) */}
            <div style={{ display: 'flex', gap: '10px', flex: '2' }}>
              <button
                type="button"
                onClick={handleGerarTxt}
                aria-label="Gerar arquivo TXT"
                style={{
                  ...buttonStyle,
                  backgroundColor: '#17a2b8',
                  flex: '0 0 auto'
                }}
              >
                📄 Gerar TXT
              </button>

              <button
                type="submit"
                style={{
                  ...buttonStyle,
                  backgroundColor: '#dc3545',
                  flex: 1
                }}
              >
                💾 {modoGerenciamento ? 'Salvar Alterações' : 'Salvar'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <TxtModal
        isOpen={txtModalAberto}
        conteudo={txtConteudo}
        onClose={() => setTxtModalAberto(false)}
        titulo="Visualização de Arquivo TXT - LINK"
      />
    </div>
  );
};
