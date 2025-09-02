import React, { useState, useEffect } from 'react';
import { OrdemServicoPON, criarPONVazia } from '../shared/types/pon';
import { gerarArquivoPON } from '../shared/utils/gerarArquivoTxt';
// import { compatibilityStorage } from '../shared/services/compatibilityStorage';
import { firebaseFormularioStorage } from '../shared/services/firebaseFormularioStorage';
import { useAuth } from '../shared/contexts/AuthContext';

interface FormularioPONProps {
  onSubmit?: (dados: OrdemServicoPON) => void;
  dadosIniciais?: any;
}

export const FormularioPON: React.FC<FormularioPONProps> = ({ onSubmit, dadosIniciais }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<OrdemServicoPON>(() => {
    if (dadosIniciais) {
      return { ...criarPONVazia(), ...dadosIniciais };
    }
    return criarPONVazia();
  });

  useEffect(() => {
    if (dadosIniciais) {
      setFormData({ ...criarPONVazia(), ...dadosIniciais });
    }
  }, [dadosIniciais]);

  const handleChange = (field: keyof OrdemServicoPON, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('Dados da O.S PON:', formData);
      onSubmit?.(formData);
      
      // Salvar no Firebase/localStorage
      const criadoPor = user ? {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName
      } : undefined;
      await firebaseFormularioStorage.salvar('PON', formData, criadoPor);
      
      // Gerar arquivo TXT
      gerarArquivoPON(formData);
      
      alert('Ordem de Serviço PON salva e arquivo TXT gerado com sucesso!');
      
      // Se não está editando, limpar formulário
      if (!dadosIniciais) {
        limparFormulario();
      }
    } catch (error) {
      console.error('Erro ao salvar formulário:', error);
      alert('Erro ao salvar. Os dados foram salvos localmente e serão sincronizados quando possível.');
    }
  };

  const limparFormulario = () => {
    setFormData(criarPONVazia());
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
          borderBottom: '2px solid #28a745',
          paddingBottom: '10px'
        }}>
          📡 Formulário de Abertura de Ordem PON
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Código da O.S */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>CÓDIGO DA O.S:</label>
            <input
              type="text"
              value={formData.codigoOS}
              onChange={(e) => handleChange('codigoOS', e.target.value)}
              style={inputStyle}
              placeholder="Ex: OS-PON-2024-001"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            {/* PON */}
            <div>
              <label style={labelStyle}>PON:</label>
              <input
                type="text"
                value={formData.pon}
                onChange={(e) => handleChange('pon', e.target.value)}
                style={inputStyle}
                placeholder="Ex: PON-001"
              />
            </div>

            {/* Região */}
            <div>
              <label style={labelStyle}>REGIÃO:</label>
              <input
                type="text"
                value={formData.regiao}
                onChange={(e) => handleChange('regiao', e.target.value)}
                style={inputStyle}
                placeholder="Ex: Centro, Norte, Sul"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            {/* Clientes Afetados */}
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

            {/* Média de Nível Pos */}
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
              placeholder="Descreva o problema encontrado na PON..."
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
