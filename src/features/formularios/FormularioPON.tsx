import React, { useState, useEffect } from 'react';
import {
  OrdemServicoPON,
  PontoPON,
  criarPONVazia,
  criarPontoPONVazio,
  normalizarPON
} from '../../shared/types/pon';
import { gerarArquivoPON } from '../../shared/utils/gerarArquivoTxt';
import { firebaseFormularioStorage } from '../../shared/services/firebaseFormularioStorage';
import { useAuth } from '../../shared/contexts/AuthContext';
import { TxtModal } from '../../shared/components/TxtModal';
import { CampoDataHora } from '../../shared/components/CampoDataHora';
import { labelStyle, inputStyle, buttonStyle, formContainerStyle, formCardStyle, textareaStyle } from '../../shared/styles/forms';
import { toast } from '../../shared/components/Toast';
import { registrarAcaoAuditoria } from '../../shared/utils/auditoriaHelper';
import { StatusFormulario } from '../../shared/types/formularioSalvo';

interface FormularioPONProps {
  onSubmit?: (dados: OrdemServicoPON) => void;
  dadosIniciais?: Partial<OrdemServicoPON>;
  formularioId?: string;
  modoGerenciamento?: boolean;
  onFinalizar?: (formularioId: string) => void;
}

export const FormularioPON: React.FC<FormularioPONProps> = ({ onSubmit, dadosIniciais, formularioId, modoGerenciamento, onFinalizar }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<StatusFormulario>('pendente');
  const [formData, setFormData] = useState<OrdemServicoPON>(() => normalizarPON(dadosIniciais));

  const [txtModalAberto, setTxtModalAberto] = useState(false);
  const [txtConteudo, setTxtConteudo] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (dadosIniciais) {
      setFormData(normalizarPON(dadosIniciais));
    }
  }, [dadosIniciais]);

  const handleChange = (
    field: keyof Omit<OrdemServicoPON, 'pontos' | 'pon' | 'placa' | 'porta'>,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePontoChange = (pontoId: string, field: keyof Omit<PontoPON, 'id'>, value: string) => {
    setFormData(prev => ({
      ...prev,
      pontos: prev.pontos.map(ponto =>
        ponto.id === pontoId
          ? { ...ponto, [field]: value }
          : ponto
      )
    }));
  };

  const adicionarPonto = () => {
    setFormData(prev => ({
      ...prev,
      pontos: [...prev.pontos, criarPontoPONVazio()]
    }));
  };

  const removerPonto = (pontoId: string) => {
    setFormData(prev => ({
      ...prev,
      pontos: prev.pontos.filter(ponto => ponto.id !== pontoId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      console.log('Dados da O.S PON:', formData);

      if (formularioId) {
        await firebaseFormularioStorage.atualizar(formularioId, formData);

        await registrarAcaoAuditoria(user, 'EDITAR_FORMULARIO', {
          formularioId,
          codigoOS: formData.codigoOS,
          tipoFormulario: 'PON',
          dadosAlterados: formData
        });

        toast.success('Ordem de Serviço PON atualizada com sucesso!');
      } else {
        const criadoPor = user ? {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName
        } : undefined;
        const formularioSalvo = await firebaseFormularioStorage.salvar('PON', formData, criadoPor, status);

        await registrarAcaoAuditoria(user, 'CRIAR_FORMULARIO', {
          formularioId: formularioSalvo.id,
          codigoOS: formData.codigoOS,
          tipoFormulario: 'PON'
        });

        gerarArquivoPON(formData);

        toast.success('Ordem de Serviço PON salva e arquivo TXT gerado com sucesso!');

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
      const conteudo = gerarArquivoPON(formData);
      setTxtConteudo(conteudo);
      setTxtModalAberto(true);
    } catch (err) {
      console.error('Erro ao gerar TXT:', err);
      toast.error('Erro ao gerar arquivo TXT.');
    }
  };

  const limparFormulario = () => {
    setFormData(criarPONVazia());
  };

  return (
    <div style={formContainerStyle}>
      <div style={formCardStyle}>
        <h2 style={{
          textAlign: 'center',
          marginBottom: '30px',
          color: 'var(--text-main)',
          borderBottom: '2px solid #28a745',
          paddingBottom: '10px'
        }}>
          📡 Ordem de Serviço — Pon
        </h2>

        <form onSubmit={handleSubmit}>
          <CampoDataHora value={formData.dataHoraAbertura} />

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
                placeholder="Ex: 123456"
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
                  <option value="agendamento">📅 Agendamento</option>
                </select>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>REGIÃO:</label>
              <input
                type="text"
                value={formData.regiao}
                onChange={(e) => handleChange('regiao', e.target.value)}
                style={inputStyle}
                placeholder="Ex: Atuba, Palmares, etc."
              />
            </div>
          </div>

          {/* Seção de Pontos PON Dinâmicos */}
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
                📡 Pontos PON: <span style={{ color: '#28a745', fontWeight: 'bold' }}>({formData.pontos.length})</span>
              </h3>
              <button
                type="button"
                onClick={adicionarPonto}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                  ...buttonStyle,
                  backgroundColor: isHovered ? '#218838' : '#28a745',
                  fontSize: '14px',
                  padding: '10px 18px',
                  boxShadow: '0 2px 4px rgba(40, 167, 69, 0.3)',
                  transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.2s ease'
                }}
              >
                ➕ Adicionar PON
              </button>
            </div>

            {formData.pontos.map((ponto, index) => (
              <div key={ponto.id} style={{
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
                    📡 PON {index + 1}
                  </h4>

                  {formData.pontos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removerPonto(ponto.id)}
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={labelStyle}>PON:</label>
                    <input
                      type="text"
                      value={ponto.pon}
                      onChange={(e) => handlePontoChange(ponto.id, 'pon', e.target.value)}
                      style={inputStyle}
                      placeholder="Ex: AT 505"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>PLACA:</label>
                    <input
                      type="text"
                      value={ponto.placa}
                      onChange={(e) => handlePontoChange(ponto.id, 'placa', e.target.value)}
                      style={inputStyle}
                      placeholder="Ex: Placa 1"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>PORTA:</label>
                    <input
                      type="text"
                      value={ponto.porta}
                      onChange={(e) => handlePontoChange(ponto.id, 'porta', e.target.value)}
                      style={inputStyle}
                      placeholder="Ex: Porta 1"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>CLIENTES AFETADOS:</label>
              <input
                type="text"
                value={formData.clientesAfetados}
                onChange={(e) => handleChange('clientesAfetados', e.target.value)}
                style={inputStyle}
                placeholder="Ex: 15 clientes"
              />
            </div>

            <div>
              <label style={labelStyle}>MÉDIA DE NÍVEL POS:</label>
              <input
                type="text"
                value={formData.mediaNivelPos}
                onChange={(e) => handleChange('mediaNivelPos', e.target.value)}
                style={inputStyle}
                placeholder="Ex: -12 dBm"
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>PROBLEMA:</label>
            <textarea
              value={formData.problema}
              onChange={(e) => handleChange('problema', e.target.value)}
              style={{
                ...textareaStyle,
                minHeight: '80px'
              }}
              placeholder="Descreva o problema encontrado na PON..."
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>RESOLUÇÃO:</label>
            <textarea
              value={formData.resolucao}
              onChange={(e) => handleChange('resolucao', e.target.value)}
              style={{
                ...textareaStyle,
                minHeight: '80px'
              }}
              placeholder="Descreva as ações tomadas para resolver o problema..."
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>MATERIAL UTILIZADO:</label>
            <textarea
              value={formData.materialUtilizado}
              onChange={(e) => handleChange('materialUtilizado', e.target.value)}
              style={{
                ...textareaStyle,
                minHeight: '60px'
              }}
              placeholder="Liste os materiais utilizados no reparo..."
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>ENDEREÇO:</label>
            <input
              type="text"
              value={formData.endereco}
              onChange={(e) => handleChange('endereco', e.target.value)}
              style={inputStyle}
              placeholder="Endereço completo do local da O.S"
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={labelStyle}>LOCALIZAÇÃO:</label>
            <input
              type="text"
              value={formData.localizacao}
              onChange={(e) => handleChange('localizacao', e.target.value)}
              style={inputStyle}
              placeholder="Pontos de referência, coordenadas, etc."
            />
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '15px',
            marginTop: '30px'
          }}>
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
                      tipoFormulario: 'PON',
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
                  backgroundColor: '#28a745',
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
        titulo="Visualização de Arquivo TXT - PON"
      />
    </div>
  );
};
