import React, { useState, useEffect } from 'react';
import { OrdemServicoAdequacao, criarAdequacaoVazia } from '../shared/types/adequacao';
import { gerarArquivoADEQUACAO } from '../shared/utils/gerarArquivoTxt';
//import { compatibilityStorage } from '../shared/services/compatibilityStorage';
import { firebaseFormularioStorage } from '../shared/services/firebaseFormularioStorage';
import { useAuth } from '../shared/contexts/AuthContext';
import { auditoriaService } from '../shared/services/auditoriaService';
import type { TipoFormularioAuditoria } from '../shared/types/auditoria';
import { TxtModal } from './TxtModal';

interface FormularioAdequacaoProps {
    onSubmit?: (dados: OrdemServicoAdequacao) => void;
    dadosIniciais?: Partial<OrdemServicoAdequacao>;
    formularioId?: string;
    modoGerenciamento?: boolean;
    onFinalizar?: (formularioId: string) => void;
}

export const FormularioAdequacao: React.FC<FormularioAdequacaoProps> = ({ onSubmit, dadosIniciais, formularioId, modoGerenciamento, onFinalizar }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState<OrdemServicoAdequacao>(() => {
        if (dadosIniciais) {
            return { ...criarAdequacaoVazia(), ...dadosIniciais };
        }
        return criarAdequacaoVazia();
    });
    const [errors, setErrors] = useState<Partial<Record<keyof OrdemServicoAdequacao, string>>>({});

    const [txtModalAberto, setTxtModalAberto] = useState(false);
    const [txtConteudo, setTxtConteudo] = useState('');

    useEffect(() => {
        if (dadosIniciais) {
            setFormData({ ...criarAdequacaoVazia(), ...dadosIniciais });
        }
    }, [dadosIniciais]);

    const handleChange = (field: keyof OrdemServicoAdequacao, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Remove erro quando usuário começa a digitar
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    // Valida se a string é uma data existente no formato DD/MM/AAAA
    const validarData = (data: string): boolean => {
        if (!data) return false;
        const partes = data.split('/');
        if (partes.length !== 3) return false;

        const [dStr, mStr, yStr] = partes;
        if (!/^\d{1,2}$/.test(dStr) || !/^\d{1,2}$/.test(mStr) || !/^\d{4}$/.test(yStr)) return false;

        const d = parseInt(dStr, 10);
        const m = parseInt(mStr, 10);
        const y = parseInt(yStr, 10);

        if (m < 1 || m > 12) return false;

        // dias no mês (ano bissexto tratado automaticamente por Date)
        const diasNoMes = new Date(y, m, 0).getDate();
        if (d < 1 || d > diasNoMes) return false;

        return true;
    };

    const validarFormulario = (requireDates = false): boolean => {
        const newErrors: Partial<Record<keyof OrdemServicoAdequacao, string>> = {};

        // Se as datas são obrigatórias (finalizar), exigimos presença e validade
        if (requireDates) {
            if (!formData.datainicio || !validarData(formData.datainicio)) {
                newErrors.datainicio = 'Informe a data de início no formato DD/MM/AAAA (data válida).';
            }
            if (!formData.datatermino || !validarData(formData.datatermino)) {
                newErrors.datatermino = 'Informe a data de término no formato DD/MM/AAAA (data válida).';
            }
        } else {
            // Para salvar: datas são opcionais, mas se preenchidas devem ser válidas
            if (formData.datainicio && !validarData(formData.datainicio)) {
                newErrors.datainicio = 'Data de início inválida (DD/MM/AAAA).';
            }
            if (formData.datatermino && !validarData(formData.datatermino)) {
                newErrors.datatermino = 'Data de término inválida (DD/MM/AAAA).';
            }
        }

        // Se ambas as datas estiverem presentes e válidas (em qualquer modo), checar ordem
        if (!newErrors.datainicio && !newErrors.datatermino && formData.datainicio && formData.datatermino) {
            const [d1, m1, y1] = formData.datainicio.split('/').map(Number);
            const [d2, m2, y2] = formData.datatermino.split('/').map(Number);
            const dt1 = new Date(y1, m1 - 1, d1);
            const dt2 = new Date(y2, m2 - 1, d2);
            if (dt2 < dt1) newErrors.datatermino = 'Data de término não pode ser anterior à data de início.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        //if (validarFormulario()) {
        if (validarFormulario(false)) {
            // salva (data opcional)
            try {
                console.log('Dados da O.S:', formData);
                onSubmit?.(formData);

                // Verificar se está editando um formulário existente ou criando um novo
                if (formularioId) {
                    // Modo edição - atualizar formulário existente
                    await firebaseFormularioStorage.atualizar(formularioId, formData);

                    // Registrar log de auditoria
                    if (user) {
                        await auditoriaService.registrarAcao('EDITAR_FORMULARIO', {
                            uid: user.uid,
                            email: user.email || '',
                            displayName: user.displayName
                        }, {
                            formularioId,
                            codigoOS: formData.codigoOS,
                            tipoFormulario: 'ADEQUACAO' as TipoFormularioAuditoria,
                            dadosAlterados: formData
                        });
                    }

                    alert('Ordem de Serviço ADEQUAÇÃO atualizada com sucesso!');
                } else {
                    // Modo criação - criar novo formulário
                    const criadoPor = user ? {
                        uid: user.uid,
                        email: user.email || '',
                        displayName: user.displayName
                    } : undefined;
                    const formularioSalvo = await firebaseFormularioStorage.salvar('ADEQUACAO', formData, criadoPor);

                    // Registrar log de auditoria
                    if (user) {
                        await auditoriaService.registrarAcao('CRIAR_FORMULARIO', {
                            uid: user.uid,
                            email: user.email || '',
                            displayName: user.displayName
                        }, {
                            formularioId: formularioSalvo.id,
                            codigoOS: formData.codigoOS,
                            tipoFormulario: 'ADEQUACAO' as TipoFormularioAuditoria
                        });
                    }

                    // Geração de TXT movida para ação manual (botão "Gerar TXT")
                    alert('Ordem de Serviço ADEQUAÇÃO salva com sucesso!');

                    // Se não está editando, limpar formulário
                    limparFormulario();
                }
            } catch (error) {
                console.error('Erro ao salvar formulário:', error);
                alert('Erro ao salvar. Os dados foram salvos localmente e serão sincronizados quando possível.');
            }
        }
    };

    const limparFormulario = () => {
        setFormData(criarAdequacaoVazia());
        setErrors({});
    };

    // Formata enquanto o usuário digita: insere "/" após 2 e 4 dígitos
    const formatarDataInput = (value: string): string => {
        const somenteDigitos = value.replace(/\D/g, '').slice(0, 8); // ddmmyyyy
        if (somenteDigitos.length <= 2) return somenteDigitos;
        if (somenteDigitos.length <= 4) return `${somenteDigitos.slice(0, 2)}/${somenteDigitos.slice(2)}`;
        return `${somenteDigitos.slice(0, 2)}/${somenteDigitos.slice(2, 4)}/${somenteDigitos.slice(4, 8)}`;
    };

    const handleDateChange = (field: 'datainicio' | 'datatermino', rawValue: string) => {
        const formatted = formatarDataInput(rawValue);
        handleChange(field as keyof OrdemServicoAdequacao, formatted);
    };

    // Gerar TXT manualmente (handler do botão)
    const handleGerarTxt = () => {
        try {
            const conteudo = gerarArquivoADEQUACAO(formData);
            setTxtConteudo(conteudo);
            setTxtModalAberto(true);
        } catch (err) {
            console.error('Erro ao gerar TXT:', err);
            alert('Erro ao gerar arquivo TXT.');
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <div style={{
                backgroundColor: '#fff',
                padding: '30px',
                borderRadius: '10px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
                <h2 style={{
                    textAlign: 'center',
                    marginBottom: '30px',
                    color: '#333',
                    borderBottom: '2px solid #007bff',
                    paddingBottom: '10px'
                }}>
                    🛠️ Ordem de Serviço — Adequação
                </h2>

                <form onSubmit={handleSubmit}>
                    {/* Row 1: Código da O.S + Região */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                            <label htmlFor="codigoOS" style={labelStyle}>CÓDIGO DA O.S:</label>
                            <input id="codigoOS" name="codigoOS" type="text" value={formData.codigoOS} onChange={(e) => handleChange('codigoOS', e.target.value)} style={inputStyle} placeholder="Ex: 12345678" />
                        </div>
                        <div>
                            <label htmlFor="regiao" style={labelStyle}>REGIÃO:</label>
                            <input id="regiao" name="regiao" type="text" value={formData.regiao} onChange={(e) => handleChange('regiao', e.target.value)} style={inputStyle} placeholder="Ex: ATUBA" />
                        </div>
                    </div>

                    {/* Row 2: Tipo de Serviço + Tipo de Fibra */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                            <label htmlFor="tipodeservico" style={labelStyle}>TIPO DE SERVIÇO:</label>
                            <input id="tipodeservico" name="tipodeservico" type="text" value={formData.tipodeservico} onChange={(e) => handleChange('tipodeservico', e.target.value)} style={inputStyle} placeholder="Ex: ADEQUAÇÃO, TROCA DE CABO, CORDOALHA" />
                        </div>
                        <div>
                            <label htmlFor="tipodefibra" style={labelStyle}>TIPO DE FIBRA:</label>
                            <input id="tipodefibra" name="tipodefibra" type="text" value={formData.tipodefibra} onChange={(e) => handleChange('tipodefibra', e.target.value)} style={inputStyle} placeholder="Ex: FIBRA DE 6fo" />
                        </div>
                    </div>

                    {/* Row 3a: Metragem inicial e final */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                            <label htmlFor="metrageminicial" style={labelStyle}>METRAGEM INICIAL:</label>
                            <input id="metrageminicial" name="metrageminicial" type="text" value={formData.metrageminicial} onChange={(e) => handleChange('metrageminicial', e.target.value)} style={inputStyle} placeholder="Ex: 3KM" />
                        </div>
                        <div>
                            <label htmlFor="metragemfinal" style={labelStyle}>METRAGEM FINAL:</label>
                            <input id="metragemfinal" name="metragemfinal" type="text" value={formData.metragemfinal} onChange={(e) => handleChange('metragemfinal', e.target.value)} style={inputStyle} placeholder="Ex: 3KM" />
                        </div>
                    </div>

                    {/* Row 3b: Metragem cordoalha e total */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                            <label htmlFor="metragemcordoalha" style={labelStyle}>METRAGEM CORDOALHA:</label>
                            <input id="metragemcordoalha" name="metragemcordoalha" type="text" value={formData.metragemcordoalha} onChange={(e) => handleChange('metragemcordoalha', e.target.value)} style={inputStyle} placeholder="Ex: 2KM" />
                        </div>
                        <div>
                            <label htmlFor="metragemtotal" style={labelStyle}>METRAGEM TOTAL:</label>
                            <input id="metragemtotal" name="metragemtotal" type="text" value={formData.metragemtotal} onChange={(e) => handleChange('metragemtotal', e.target.value)} style={inputStyle} placeholder="Ex: 10KM" />
                        </div>
                    </div>

                    {/* Problema (textarea) */}
                    <div style={{ marginBottom: '20px' }}>
                        <label htmlFor="problema" style={labelStyle}>PROBLEMA:</label>
                        <textarea id="problema" name="problema" value={formData.problema} onChange={(e) => handleChange('problema', e.target.value)} style={textareaStyle} placeholder="Descreva o problema..." rows={3} />
                    </div>

                    {/* Trecho: Ponta A e Ponto B */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ ...labelStyle, marginBottom: '10px', display: 'block' }}>TRECHO:</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label htmlFor="pontoa" style={labelStyle}>PONTA A:</label>
                                <input id="pontoa" name="pontoa" type="text" value={formData.pontoa} onChange={(e) => handleChange('pontoa', e.target.value)} style={inputStyle} placeholder="Ex: CTO-001" />
                            </div>
                            <div>
                                <label htmlFor="pontob" style={labelStyle}>PONTO B:</label>
                                <input id="pontob" name="pontob" type="text" value={formData.pontob} onChange={(e) => handleChange('pontob', e.target.value)} style={inputStyle} placeholder="Ex: CTO-002" />
                            </div>
                        </div>
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

                    {/* Datas em uma linha */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                            <label htmlFor="datainicio" style={labelStyle}>DATA DE INÍCIO:</label>
                            <input
                                id="datainicio"
                                name="datainicio"
                                type="text"
                                value={formData.datainicio}
                                onChange={(e) => handleDateChange('datainicio', e.target.value)}
                                style={inputStyle}
                                placeholder="DD/MM/AAAA"
                                inputMode="numeric"
                            />
                            {errors.datainicio && <div style={{ color: '#dc3545', marginTop: 6 }}>{errors.datainicio}</div>}
                        </div>
                        <div>
                            <label htmlFor="datatermino" style={labelStyle}>DATA DE TÉRMINO:</label>
                            <input
                                id="datatermino"
                                name="datatermino"
                                type="text"
                                value={formData.datatermino}
                                onChange={(e) => handleDateChange('datatermino', e.target.value)}
                                style={inputStyle}
                                placeholder="DD/MM/AAAA"
                                inputMode="numeric"
                            />
                            {errors.datatermino && <div style={{ color: '#dc3545', marginTop: 6 }}>{errors.datatermino}</div>}
                        </div>
                    </div>

                    {/* Funcionário (full width) */}
                    <div style={{ marginBottom: '20px' }}>
                        <label htmlFor="funcionario" style={labelStyle}>FUNCIONÁRIO:</label>
                        <input id="funcionario" name="funcionario" type="text" value={formData.funcionario} onChange={(e) => handleChange('funcionario', e.target.value)} style={inputStyle} placeholder="Ex: NILTON" />
                    </div>

                    {/* Lançamento de fo + Adequação condomínio (Full width each due to long labels) */}
                    <div style={{ marginBottom: '20px' }}>
                        <label htmlFor="caboaereo" style={labelStyle}>LANÇAMENTO DE FO INCLUINDO CRUZETA COM CORDOALHA:</label>
                        <input id="caboaereo" name="caboaereo" type="text" value={formData.caboaereo} onChange={(e) => handleChange('caboaereo', e.target.value)} style={inputStyle} placeholder="Ex: 3KM DE FIBRA 6fo" />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label htmlFor="cabosubterraneo" style={labelStyle}>ADEQUAÇÃO EM CONDOMÍNIO AÉREO E SUBTERRÂNEO:</label>
                        <input id="cabosubterraneo" name="cabosubterraneo" type="text" value={formData.cabosubterraneo} onChange={(e) => handleChange('cabosubterraneo', e.target.value)} style={inputStyle} placeholder="Ex: 3KM DE FIBRA 6fo" />
                    </div>

                    {/* Retirada de fo + Lançamento/Espinamento */}
                    <div style={{ marginBottom: '20px' }}>
                        <label htmlFor="adequacao" style={labelStyle}>RETIRADA DE FO:</label>
                        <input id="adequacao" name="adequacao" type="text" value={formData.adequacao} onChange={(e) => handleChange('adequacao', e.target.value)} style={inputStyle} placeholder="Ex: O1 POSTE" />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label htmlFor="cordoalha" style={labelStyle}>LANÇAMENTO E ESPINAMENTO DE CABO E CORDOALHA EM SOBRA TÉCNICA E CTO P/POSTE:</label>
                        <input id="cordoalha" name="cordoalha" type="text" value={formData.cordoalha} onChange={(e) => handleChange('cordoalha', e.target.value)} style={inputStyle} placeholder="Ex: 01 CORDOALHA" />
                    </div>

                    {/* Equipagem em troca de poste */}
                    <div style={{ marginBottom: '20px' }}>
                        <label htmlFor="equipagem" style={labelStyle}>EQUIPAGEM EM TROCA DE POSTE:</label>
                        <input id="equipagem" name="equipagem" type="text" value={formData.equipagem} onChange={(e) => handleChange('equipagem', e.target.value)} style={inputStyle} placeholder="Ex: EQUIPAGEM COMPLETA" />
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

                                    // Para finalizar, as datas são obrigatórias
                                    if (!validarFormulario(true)) {
                                        alert('Corrija os erros antes de finalizar a ordem (datas obrigatórias).');
                                        return;
                                    }

                                    try {
                                        // Primeiro salvar as alterações
                                        await firebaseFormularioStorage.atualizar(formularioId, formData);

                                        // Registrar log de auditoria da edição
                                        if (user) {
                                            await auditoriaService.registrarAcao('EDITAR_FORMULARIO', {
                                                uid: user.uid,
                                                email: user.email || '',
                                                displayName: user.displayName
                                            }, {
                                                formularioId,
                                                codigoOS: formData.codigoOS,
                                                tipoFormulario: 'ADEQUACAO' as TipoFormularioAuditoria,
                                                dadosAlterados: formData
                                            });
                                        }

                                        // Depois finalizar
                                        onFinalizar && onFinalizar(formularioId);
                                        alert('Ordem finalizada com sucesso!');
                                    } catch (error) {
                                        console.error('Erro ao salvar antes de finalizar:', error);
                                        alert('Erro ao salvar alterações. Tente novamente.');
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

// Estilos
const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#333',
    fontSize: '14px'
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
};

const buttonStyle: React.CSSProperties = {
    padding: '12px 20px',
    border: 'none',
    borderRadius: '5px',
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'opacity 0.2s'
};

const textareaStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    resize: 'vertical'
};

