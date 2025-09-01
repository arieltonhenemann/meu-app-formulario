import React, { useState, useEffect } from 'react';
import { OrdemServico, criarOSVazia } from '../shared/types/os';
import { gerarArquivoCTO } from '../shared/utils/gerarArquivoTxt';
// import { compatibilityStorage } from '../shared/services/compatibilityStorage';
import { firebaseFormularioStorage } from '../shared/services/firebaseFormularioStorage';
import { ctoGoogleMapsService } from '../shared/services/ctoGoogleMapsService';

interface FormularioOSProps {
  onSubmit?: (dados: OrdemServico) => void;
  dadosIniciais?: any;
  formularioId?: string; // ID do formulário para edição
}

export const FormularioOS: React.FC<FormularioOSProps> = ({ onSubmit, dadosIniciais, formularioId }) => {
  const [formData, setFormData] = useState<OrdemServico>(() => {
    if (dadosIniciais) {
      return { ...criarOSVazia(), ...dadosIniciais };
    }
    return criarOSVazia();
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [buscandoCTO, setBuscandoCTO] = useState(false);
  const [ultimaBusca, setUltimaBusca] = useState('');

  useEffect(() => {
    if (dadosIniciais) {
      setFormData({ ...criarOSVazia(), ...dadosIniciais });
    }
  }, [dadosIniciais]);

  const handleChange = (field: keyof OrdemServico, value: string) => {
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

    // Se o campo alterado for CTO, buscar dados automaticamente
    if (field === 'cto' && value.trim() !== '') {
      buscarDadosCTO(value.trim());
    }
  };

  const buscarDadosCTO = async (codigoCTO: string) => {
    // Evitar buscas repetidas
    if (codigoCTO === ultimaBusca || buscandoCTO) {
      return;
    }

    console.log('🔍 Buscando dados para CTO:', codigoCTO);
    setBuscandoCTO(true);
    setUltimaBusca(codigoCTO);

    try {
      const dadosCTO = await ctoGoogleMapsService.buscarCTO(codigoCTO);
      
      if (dadosCTO) {
        console.log('✅ Dados encontrados:', dadosCTO);
        
        // Preencher campos automaticamente
        setFormData(prev => ({
          ...prev,
          endereco: dadosCTO.endereco,
          regiao: dadosCTO.regiao || prev.regiao,
          localizacao: dadosCTO.coordenadas ? 
            `${dadosCTO.coordenadas.lat}, ${dadosCTO.coordenadas.lng}` : 
            prev.localizacao
        }));

        // Mostrar feedback visual
        showCTOFoundFeedback(dadosCTO);
      } else {
        console.log('❌ CTO não encontrada:', codigoCTO);
        showCTONotFoundFeedback(codigoCTO);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar CTO:', error);
      showCTOErrorFeedback();
    } finally {
      setBuscandoCTO(false);
    }
  };

  const showCTOFoundFeedback = (dados: any) => {
    // Criar notificação temporária
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      z-index: 1000;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    notification.innerHTML = `
      ✅ CTO encontrada!<br>
      <small>Endereço: ${dados.endereco}</small>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 4000);
  };

  const showCTONotFoundFeedback = (codigo: string) => {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ffc107;
      color: #856404;
      padding: 15px 20px;
      border-radius: 8px;
      z-index: 1000;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    notification.innerHTML = `
      ⚠️ CTO "${codigo}" não encontrada<br>
      <small>Preencha manualmente os campos</small>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
  };

  const showCTOErrorFeedback = () => {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #dc3545;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      z-index: 1000;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    notification.innerHTML = `
      ❌ Erro ao buscar dados da CTO<br>
      <small>Verifique sua conexão</small>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
  };

  const validarFormulario = (): boolean => {
    // Todos os campos são opcionais agora
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validarFormulario()) {
      try {
        console.log('Dados da O.S:', formData);
        onSubmit?.(formData);
        
        // Verificar se estamos editando um formulário existente
        if (formularioId && dadosIniciais) {
          // Modo edição - atualizar formulário existente
          await firebaseFormularioStorage.atualizar(formularioId, formData);
          alert('Ordem de Serviço CTO atualizada com sucesso!');
        } else {
          // Modo criação - criar novo formulário
          await firebaseFormularioStorage.salvar('CTO', formData);
          alert('Ordem de Serviço CTO salva e arquivo TXT gerado com sucesso!');
          
          // Limpar formulário após criar novo
          limparFormulario();
        }
        
        // Gerar arquivo TXT
        gerarArquivoCTO(formData);
        
      } catch (error) {
        console.error('Erro ao salvar formulário:', error);
        const acao = formularioId ? 'atualizar' : 'salvar';
        alert(`Erro ao ${acao}. Os dados foram salvos localmente e serão sincronizados quando possível.`);
      }
    }
  };

  const limparFormulario = () => {
    setFormData(criarOSVazia());
    setErrors({});
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
          🏢 Formulário de Abertura de Ordem CTO
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            {/* Código da O.S */}
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

            {/* CTO */}
            <div>
              <label style={labelStyle}>
                CTO:
                {buscandoCTO && (
                  <span style={{ marginLeft: '10px', color: '#007bff', fontSize: '12px' }}>
                    🔍 Buscando...
                  </span>
                )}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={formData.cto}
                  onChange={(e) => handleChange('cto', e.target.value)}
                  style={{
                    ...inputStyle,
                    paddingRight: buscandoCTO ? '40px' : '10px',
                    borderColor: buscandoCTO ? '#007bff' : '#ddd'
                  }}
                  placeholder="Ex: CTO-ABC-001 (preenchimento automático)"
                />
                {buscandoCTO && (
                  <div style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#007bff',
                    fontSize: '14px'
                  }}>
                    ⟳
                  </div>
                )}
              </div>
              <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                💡 Digite o código da CTO para preenchimento automático do endereço e localização
              </small>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            {/* Região */}
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

            {/* UPC ou APC */}
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
            {/* Splitter */}
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

            {/* Identificada */}
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
            {/* Nível Antes */}
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

            {/* Nível Pos */}
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

          {/* Problema */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>
              PROBLEMA:
            </label>
            <textarea
              value={formData.problema}
              onChange={(e) => handleChange('problema', e.target.value)}
              style={{
                ...inputStyle,
                minHeight: '80px',
                resize: 'vertical'
              }}
              placeholder="Descreva detalhadamente o problema encontrado..."
            />
          </div>

          {/* Resolução */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>
              RESOLUÇÃO:
            </label>
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
          <div style={{ marginBottom: '20px' }}>
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

          {/* Endereço */}
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

          {/* Localização */}
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

          {/* Botões */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            gap: '15px',
            marginTop: '30px' 
          }}>
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
            
            <button
              type="submit"
              style={{
                ...buttonStyle,
                backgroundColor: '#28a745',
                flex: '2'
              }}
            >
              💾 Salvar e Gerar TXT
            </button>
          </div>
        </form>
      </div>
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

