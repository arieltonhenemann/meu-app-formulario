import React, { useState, useEffect } from 'react';
import {
    OrdemServicoAdequacao,
    ServicoAdequacao,
    criarAdequacaoVazia,
    criarServicoAdequacao,
    normalizarAdequacao,
    TIPOS_SERVICO_ADEQUACAO
} from '../../shared/types/adequacao';
import { gerarArquivoADEQUACAO } from '../../shared/utils/gerarArquivoTxt';
import { firebaseFormularioStorage } from '../../shared/services/firebaseFormularioStorage';
import { useAuth } from '../../shared/contexts/AuthContext';
import { TxtModal } from '../../shared/components/TxtModal';
import { CampoDataHora } from '../../shared/components/CampoDataHora';
import { labelStyle, inputStyle, buttonStyle, formContainerStyle, formCardStyle, textareaStyle } from '../../shared/styles/forms';
import { toast } from '../../shared/components/Toast';
import { registrarAcaoAuditoria } from '../../shared/utils/auditoriaHelper';
import { StatusFormulario } from '../../shared/types/formularioSalvo';

interface FormularioAdequacaoProps {
    onSubmit?: (dados: OrdemServicoAdequacao) => void;
    dadosIniciais?: Partial<OrdemServicoAdequacao>;
    formularioId?: string;
    modoGerenciamento?: boolean;
    onFinalizar?: (formularioId: string) => void;
}

export const FormularioAdequacao: React.FC<FormularioAdequacaoProps> = ({ onSubmit, dadosIniciais, formularioId, modoGerenciamento, onFinalizar }) => {
    const { user } = useAuth();
    const [status, setStatus] = useState<StatusFormulario>('pendente');
    const [formData, setFormData] = useState<OrdemServicoAdequacao>(() => normalizarAdequacao(dadosIniciais));
    const [txtModalAberto, setTxtModalAberto] = useState(false);
    const [txtConteudo, setTxtConteudo] = useState('');

    useEffect(() => {
        if (dadosIniciais) {
            setFormData(normalizarAdequacao(dadosIniciais));
        }
    }, [dadosIniciais]);

    const handleChange = (field: keyof OrdemServicoAdequacao, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleServicoChange = (
        servicoId: string,
        field: keyof Omit<ServicoAdequacao, 'id' | 'tipo'>,
        value: string
    ) => {
        setFormData(prev => ({
            ...prev,
            servicos: prev.servicos.map(servico =>
                servico.id === servicoId
                    ? { ...servico, [field]: value }
                    : servico
            )
        }));
    };

    const alterarTipoServico = (servicoId: string, tipo: ServicoAdequacao['tipo']) => {
        setFormData(prev => ({
            ...prev,
            servicos: prev.servicos.map(servico =>
                servico.id === servicoId
                    ? { ...servico, tipo }
                    : servico
            )
        }));
    };

    const adicionarServico = () => {
        setFormData(prev => ({
            ...prev,
            servicos: [...prev.servicos, criarServicoAdequacao()]
        }));
    };

    const removerServico = (servicoId: string) => {
        setFormData(prev => ({
            ...prev,
            servicos: prev.servicos.filter(servico => servico.id !== servicoId)
        }));
    };

    const campoServico = (
        label: string,
        servicoId: string,
        field: keyof Omit<ServicoAdequacao, 'id' | 'tipo'>,
        placeholder: string
    ) => (
        <div>
            <label style={labelStyle}>{label}:</label>
            <input
                type="text"
                value={formData.servicos.find(servico => servico.id === servicoId)?.[field] || ''}
                onChange={(e) => handleServicoChange(servicoId, field, e.target.value)}
                style={inputStyle}
                placeholder={placeholder}
            />
        </div>
    );

    const renderCamposServico = (servico: ServicoAdequacao) => {
        const gradeStyle: React.CSSProperties = {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '15px'
        };

        switch (servico.tipo) {
            case 'LANCAMENTO':
                return (
                    <div style={gradeStyle}>
                        {campoServico('TIPO DE FIBRA', servico.id, 'tipoFibra', 'Ex: FIBRA DE 6fo')}
                        {campoServico('METRAGEM INICIAL', servico.id, 'metragemInicial', 'Ex: 3KM')}
                        {campoServico('METRAGEM FINAL', servico.id, 'metragemFinal', 'Ex: 3KM')}
                        {campoServico('METRAGEM CORDOALHA', servico.id, 'metragemCordoalha', 'Ex: 2KM')}
                        {campoServico('METRAGEM TOTAL', servico.id, 'metragemTotal', 'Ex: 10KM')}
                        {campoServico('PONTO A', servico.id, 'pontoA', 'Ex: CTO-001')}
                        {campoServico('PONTO B', servico.id, 'pontoB', 'Ex: CTO-002')}
                    </div>
                );
            case 'ADEQUACAO_CONDOMINIO':
                return (
                    <div style={gradeStyle}>
                        {campoServico('CONDOMÍNIO', servico.id, 'condominio', 'Ex: Residencial Central')}
                        {campoServico('QUANTIDADE DE BLOCOS', servico.id, 'quantidadeBlocos', 'Ex: 4')}
                        {campoServico('METRAGEM INICIAL', servico.id, 'metragemInicial', 'Ex: 3KM')}
                        {campoServico('METRAGEM FINAL', servico.id, 'metragemFinal', 'Ex: 3KM')}
                        {campoServico('METRAGEM AÉREA', servico.id, 'metragemAerea', 'Ex: 2KM')}
                        {campoServico('METRAGEM SUBTERRÂNEA', servico.id, 'metragemSubterranea', 'Ex: 1KM')}
                    </div>
                );
            case 'ADEQUACAO_POSTE':
                return (
                    <div style={gradeStyle}>
                        {campoServico('LOCALIZAÇÃO', servico.id, 'localizacao', 'Ex: Rua das Flores, 120')}
                        {campoServico('QUANTIDADE DE POSTES', servico.id, 'quantidadePostes', 'Ex: 3')}
                    </div>
                );
            case 'RETIRADA_CABO':
                return (
                    <div style={gradeStyle}>
                        {campoServico('LOCALIZAÇÃO', servico.id, 'localizacao', 'Ex: Rua das Flores, 120')}
                        {campoServico('PONTO A', servico.id, 'pontoA', 'Ex: CTO-001')}
                        {campoServico('PONTO B', servico.id, 'pontoB', 'Ex: CTO-002')}
                        {campoServico('METRAGEM RETIRADA', servico.id, 'metragemRetirada', 'Ex: 500M')}
                    </div>
                );
            case 'ACAO_COPEL':
                return (
                    <div style={gradeStyle}>
                        {campoServico('LOCALIZAÇÃO', servico.id, 'localizacao', 'Ex: Rua das Flores, 120')}
                        {campoServico('PONTO A', servico.id, 'pontoA', 'Ex: CTO-001')}
                        {campoServico('PONTO B', servico.id, 'pontoB', 'Ex: CTO-002')}
                    </div>
                );
            case 'TROCA_PLAQUETAS':
                return (
                    <div style={gradeStyle}>
                        {campoServico('QUANTIDADE DE POSTES', servico.id, 'quantidadePostes', 'Ex: 5')}
                        {campoServico('REGIÃO', servico.id, 'regiao', 'Ex: ATUBA')}
                    </div>
                );
            default:
                return (
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px' }}>
                        Selecione o tipo de serviço para exibir os campos correspondentes.
                    </p>
                );
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            console.log('Dados da O.S:', formData);

                if (formularioId) {
                    await firebaseFormularioStorage.atualizar(formularioId, formData);

                    await registrarAcaoAuditoria(user, 'EDITAR_FORMULARIO', {
                        formularioId,
                        codigoOS: formData.codigoOS,
                        tipoFormulario: 'ADEQUACAO',
                        dadosAlterados: formData
                    });

                    toast.success('Ordem de Serviço ADEQUAÇÃO atualizada com sucesso!');
                } else {
                    const criadoPor = user ? {
                        uid: user.uid,
                        email: user.email || '',
                        displayName: user.displayName
                    } : undefined;
                    const formularioSalvo = await firebaseFormularioStorage.salvar('ADEQUACAO', formData, criadoPor, status);

                    await registrarAcaoAuditoria(user, 'CRIAR_FORMULARIO', {
                        formularioId: formularioSalvo.id,
                        codigoOS: formData.codigoOS,
                        tipoFormulario: 'ADEQUACAO'
                    });

                    toast.success('Ordem de Serviço ADEQUAÇÃO salva com sucesso!');

                    limparFormulario();
                }

                onSubmit?.(formData);
        } catch (error) {
            console.error('Erro ao salvar formulário:', error);
            toast.error('Erro ao salvar. Os dados foram salvos localmente e serão sincronizados quando possível.');
        }
    };

    const limparFormulario = () => {
        setFormData(criarAdequacaoVazia());
    };

    const handleGerarTxt = () => {
        try {
            const conteudo = gerarArquivoADEQUACAO(formData);
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
                    🛠️ Ordem de Serviço — Adequação
                </h2>

                <form onSubmit={handleSubmit}>
                    <CampoDataHora value={formData.dataHoraAbertura} />

                    {/* Row 1: Código da O.S + Região (+ Status Inicial) */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: !modoGerenciamento ? '1fr 1fr 1fr' : '1fr 1fr',
                        gap: '20px',
                        marginBottom: '20px'
                    }}>
                        <div>
                            <label htmlFor="codigoOS" style={labelStyle}>CÓDIGO DA O.S:</label>
                            <input id="codigoOS" name="codigoOS" type="text" value={formData.codigoOS} onChange={(e) => handleChange('codigoOS', e.target.value)} style={inputStyle} placeholder="Ex: 12345678" />
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
                        <div>
                            <label htmlFor="regiao" style={labelStyle}>REGIÃO:</label>
                            <input id="regiao" name="regiao" type="text" value={formData.regiao} onChange={(e) => handleChange('regiao', e.target.value)} style={inputStyle} placeholder="Ex: ATUBA" />
                        </div>
                    </div>

                    {/* Serviços dinâmicos */}
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
                                🛠️ Serviços Configurados: <span style={{ color: '#17a2b8', fontWeight: 'bold' }}>({formData.servicos.length})</span>
                            </h3>
                            <button
                                type="button"
                                onClick={adicionarServico}
                                style={{
                                    ...buttonStyle,
                                    backgroundColor: '#17a2b8',
                                    fontSize: '14px',
                                    padding: '10px 18px',
                                    boxShadow: '0 2px 4px rgba(23, 162, 184, 0.3)'
                                }}
                            >
                                ➕ Adicionar Serviço
                            </button>
                        </div>

                        {formData.servicos.map((servico, index) => (
                            <div
                                key={servico.id}
                                style={{
                                    border: '2px solid var(--border-color)',
                                    borderRadius: '8px',
                                    padding: '20px',
                                    marginBottom: '15px',
                                    backgroundColor: 'var(--bg-app)'
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '15px'
                                }}>
                                    <h4 style={{ color: 'var(--text-main)', fontSize: '16px', margin: 0 }}>
                                        🛠️ SERVIÇO {index + 1}
                                    </h4>

                                    {formData.servicos.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removerServico(servico.id)}
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

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={labelStyle}>TIPO DE SERVIÇO:</label>
                                    <select
                                        value={servico.tipo}
                                        onChange={(e) => alterarTipoServico(servico.id, e.target.value as ServicoAdequacao['tipo'])}
                                        style={inputStyle}
                                    >
                                        <option value="">Selecione o tipo de serviço...</option>
                                        {TIPOS_SERVICO_ADEQUACAO.map(tipo => (
                                            <option key={tipo.valor} value={tipo.valor}>
                                                {tipo.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {renderCamposServico(servico)}
                            </div>
                        ))}
                    </div>

                    {/* Problema (textarea) */}
                    <div style={{ marginBottom: '20px' }}>
                        <label htmlFor="problema" style={labelStyle}>PROBLEMA:</label>
                        <textarea id="problema" name="problema" value={formData.problema} onChange={(e) => handleChange('problema', e.target.value)} style={textareaStyle} placeholder="Descreva o problema..." rows={3} />
                    </div>

                    {/* Resolução (textarea) */}
                    <div style={{ marginBottom: '20px' }}>
                        <label htmlFor="resolucao" style={labelStyle}>RESOLUÇÃO:</label>
                        <textarea id="resolucao" name="resolucao" value={formData.resolucao} onChange={(e) => handleChange('resolucao', e.target.value)} style={textareaStyle} placeholder="Descreva a resolução..." rows={3} />
                    </div>

                    {/* Material utilizado (textarea) */}
                    <div style={{ marginBottom: '20px' }}>
                        <label htmlFor="materialutilizado" style={labelStyle}>MATERIAL UTILIZADO:</label>
                        <textarea id="materialutilizado" name="materialutilizado" value={formData.materialutilizado} onChange={(e) => handleChange('materialutilizado', e.target.value)} style={textareaStyle} placeholder="Ex: 01 CORDOALHA" rows={2} />
                    </div>

                    {/* Funcionário (full width) */}
                    <div style={{ marginBottom: '20px' }}>
                        <label htmlFor="funcionario" style={labelStyle}>FUNCIONÁRIO:</label>
                        <input id="funcionario" name="funcionario" type="text" value={formData.funcionario} onChange={(e) => handleChange('funcionario', e.target.value)} style={inputStyle} placeholder="Ex: NILTON" />
                    </div>

                    {/* Botões */}
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
                                            tipoFormulario: 'ADEQUACAO',
                                            dadosAlterados: formData
                                        });

                                        onFinalizar && onFinalizar(formularioId);
                                        toast.success('Ordem finalizada com sucesso!');
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
                                style={{ ...buttonStyle, backgroundColor: '#6c757d', flex: '1' }}
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
                                style={{ ...buttonStyle, backgroundColor: '#17a2b8', flex: '0 0 auto' }}
                            >
                                📄 Gerar TXT
                            </button>

                            <button
                                type="submit"
                                style={{ ...buttonStyle, backgroundColor: '#28a745', flex: 1 }}
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
                titulo="Visualização de Arquivo TXT - ADEQUAÇÃO"
            />
        </div>
    );
};
