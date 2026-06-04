import React, { useState, useEffect } from 'react';
import { OrdemServico, criarOSVazia } from '../shared/types/os';
import { gerarArquivoCTO } from '../shared/utils/gerarArquivoTxt';
import { firebaseFormularioStorage } from '../shared/services/firebaseFormularioStorage';
import { useAuth } from '../shared/contexts/AuthContext';
import { TxtModal } from './TxtModal';
import { labelStyle, inputStyle, buttonStyle, formContainerStyle, formCardStyle, textareaStyle } from '../shared/styles/forms';
import { toast } from '../shared/components/Toast';
import { registrarAcaoAuditoria } from '../shared/utils/auditoriaHelper';
import { StatusFormulario } from '../shared/types/formularioSalvo';

interface CtoData {
  c: string; // codigo
  e: string; // endereco_completo
  lat: string; // latitude
  lon: string; // longitude
}

interface FormularioOSProps {
  onSubmit?: (dados: OrdemServico) => void;
  dadosIniciais?: Partial<OrdemServico>;
  formularioId?: string;
  modoGerenciamento?: boolean;
  onFinalizar?: (formularioId: string) => void;
}

export const FormularioOS: React.FC<FormularioOSProps> = ({ onSubmit, dadosIniciais, formularioId, modoGerenciamento, onFinalizar }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<StatusFormulario>('pendente');
  const [formData, setFormData] = useState<OrdemServico>(() => {
    if (dadosIniciais) {
      return { ...criarOSVazia(), ...dadosIniciais };
    }
    return criarOSVazia();
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [txtModalAberto, setTxtModalAberto] = useState(false);
  const [txtConteudo, setTxtConteudo] = useState('');

  // Estados para autocompletar CTO
  const [allCtos, setAllCtos] = useState<CtoData[]>([]);
  const [ctoSuggestions, setCtoSuggestions] = useState<CtoData[]>([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    if (dadosIniciais) {
      setFormData({ ...criarOSVazia(), ...dadosIniciais });
    }
  }, [dadosIniciais]);

  useEffect(() => {
    const carregarBancoCtos = async () => {
      try {
        const response = await fetch('/ctos.json');
        if (response.ok) {
          const data = await response.json();
          setAllCtos(data);
        }
      } catch (err) {
        console.error('Erro ao carregar banco de dados de CTOs:', err);
      }
    };
    carregarBancoCtos();
  }, []);

  const handleChange = (field: keyof OrdemServico, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleCtoChange = (val: string) => {
    handleChange('cto', val);

    if (val.trim().length >= 2 && allCtos.length > 0) {
      const termo = val.toLowerCase();
      // Filtrar CTOs que contenham o termo digitado
      const filtered = allCtos
        .filter(c => c.c.toLowerCase().includes(termo))
        .slice(0, 8); // Mostrar no máximo 8 sugestões
      setCtoSuggestions(filtered);
      setMostrarSugestoes(filtered.length > 0);
    } else {
      setCtoSuggestions([]);
      setMostrarSugestoes(false);
    }
  };

  const selecionarCto = (ctoSel: CtoData) => {
    setFormData(prev => ({
      ...prev,
      cto: ctoSel.c,
      endereco: ctoSel.e || prev.endereco,
      localizacao: ctoSel.lat && ctoSel.lon 
        ? `https://www.google.com/maps/search/?api=1&query=${ctoSel.lat},${ctoSel.lon}` 
        : prev.localizacao
    }));
    setMostrarSugestoes(false);
  };

  const validarFormulario = (): boolean => {
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validarFormulario()) {
      try {
        console.log('Dados da O.S:', formData);
        onSubmit?.(formData);

        if (formularioId) {
          await firebaseFormularioStorage.atualizar(formularioId, formData);

          await registrarAcaoAuditoria(user, 'EDITAR_FORMULARIO', {
            formularioId,
            codigoOS: formData.codigoOS,
            tipoFormulario: 'CTO',
            dadosAlterados: formData
          });

          toast.success('Ordem de Serviço CTO atualizada com sucesso!');
        } else {
          const criadoPor = user ? {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName
          } : undefined;
          const formularioSalvo = await firebaseFormularioStorage.salvar('CTO', formData, criadoPor, status);

          await registrarAcaoAuditoria(user, 'CRIAR_FORMULARIO', {
            formularioId: formularioSalvo.id,
            codigoOS: formData.codigoOS,
            tipoFormulario: 'CTO'
          });

          gerarArquivoCTO(formData);

          toast.success('Ordem de Serviço CTO salva e arquivo TXT gerado com sucesso!');

          limparFormulario();
        }
      } catch (error) {
        console.error('Erro ao salvar formulário:', error);
        toast.error('Erro ao salvar. Os dados foram salvos localmente e serão sincronizados quando possível.');
      }
    }
  };

  const limparFormulario = () => {
    setFormData(criarOSVazia());
    setErrors({});
  };

  const handleGerarTxt = () => {
    try {
      const conteudo = gerarArquivoCTO(formData);
      setTxtConteudo(conteudo);
      setTxtModalAberto(true);
    } catch (err) {
      console.error('Erro ao gerar TXT:', err);
      toast.error('Erro ao gerar arquivo TXT.');
    }
  };

  return (
    <div style={formContainerStyle}>
      <div style={formCardStyle}>
        <h2 style={{
          textAlign: 'center',
          marginBottom: '30px',
          color: 'var(--text-main)',
          borderBottom: '2px solid #007bff',
          paddingBottom: '10px'
        }}>
          🏢 Ordem de Serviço — Cto
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: !modoGerenciamento ? '1fr 1fr 1fr' : '1fr 1fr',
            gap: '20px',
            marginBottom: '20px'
          }}>
            <div>
              <label style={labelStyle}>
                CÓDIGO DA O.S:
              </label>
              <input
                type="text"
                value={formData.codigoOS}
                onChange={(e) => handleChange('codigoOS', e.target.value)}
                style={inputStyle}
                placeholder="Ex: OS-2024-001"
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

            <div style={{ position: 'relative' }}>
              <label style={labelStyle}>
                CTO:
              </label>
              <input
                type="text"
                value={formData.cto}
                onChange={(e) => handleCtoChange(e.target.value)}
                onBlur={() => setTimeout(() => setMostrarSugestoes(false), 200)}
                onFocus={() => {
                  if (formData.cto.trim().length >= 2) {
                    handleCtoChange(formData.cto);
                  }
                }}
                style={inputStyle}
                placeholder="Ex: CTO-ABC-001"
                autoComplete="off"
              />
              {mostrarSugestoes && ctoSuggestions.length > 0 && (
                <ul style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--input-border)',
                  borderRadius: '4px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  listStyle: 'none',
                  margin: 0,
                  padding: 0,
                }}>
                  {ctoSuggestions.map((suggestion, idx) => (
                    <li
                      key={idx}
                      onClick={() => selecionarCto(suggestion)}
                      style={{
                        padding: '10px 12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--input-border)',
                        color: 'var(--text-main)',
                        fontSize: '13px',
                        transition: 'background-color 0.2s',
                        textAlign: 'left',
                        backgroundColor: hoveredIndex === idx ? 'rgba(0, 123, 255, 0.1)' : 'transparent',
                      }}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <div style={{ fontWeight: 'bold' }}>{suggestion.c}</div>
                      <div style={{ fontSize: '11px', color: '#6c757d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        📍 {suggestion.e}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>
                REGIÃO:
              </label>
              <input
                type="text"
                value={formData.regiao}
                onChange={(e) => handleChange('regiao', e.target.value)}
                style={inputStyle}
                placeholder="Ex: Centro, Norte, Sul"
              />
            </div>

            <div>
              <label style={labelStyle}>UPC OU APC:</label>
              <input
                type="text"
                value={formData.upcOuApc}
                onChange={(e) => handleChange('upcOuApc', e.target.value)}
                style={inputStyle}
                placeholder="Ex: UPC-001 ou APC-002"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>SPLITTER:</label>
              <input
                type="text"
                value={formData.splitter}
                onChange={(e) => handleChange('splitter', e.target.value)}
                style={inputStyle}
                placeholder="Ex: SP-001"
              />
            </div>

            <div>
              <label style={labelStyle}>IDENTIFICADA [S/N]:</label>
              <select
                value={formData.identificada}
                onChange={(e) => handleChange('identificada', e.target.value)}
                style={inputStyle}
              >
                <option value="">Selecione...</option>
                <option value="S">Sim</option>
                <option value="N">Não</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>NÍVEL ANTES:</label>
              <input
                type="text"
                value={formData.nivelAntes}
                onChange={(e) => handleChange('nivelAntes', e.target.value)}
                style={inputStyle}
                placeholder="Ex: -15 dBm"
              />
            </div>

            <div>
              <label style={labelStyle}>NÍVEL POS:</label>
              <input
                type="text"
                value={formData.nivelPos}
                onChange={(e) => handleChange('nivelPos', e.target.value)}
                style={inputStyle}
                placeholder="Ex: -10 dBm"
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>
              PROBLEMA:
            </label>
            <textarea
              value={formData.problema}
              onChange={(e) => handleChange('problema', e.target.value)}
              style={{
                ...textareaStyle,
                minHeight: '80px'
              }}
              placeholder="Descreva detalhadamente o problema encontrado..."
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>
              RESOLUÇÃO:
            </label>
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

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', marginTop: '30px' }}>
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
                      tipoFormulario: 'CTO',
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
              <button type="button" onClick={handleGerarTxt} style={{ ...buttonStyle, backgroundColor: '#17a2b8' }}>
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
        titulo="Visualização de Arquivo TXT - CTO"
      />
    </div>
  );
};
