import React, { useState } from 'react';
import './App.css';
import { FormularioOS } from './components/FormularioOS';
import { FormularioPON } from './components/FormularioPON';
import { FormularioLINK } from './components/FormularioLINK';
import { GerenciarFormularios } from './components/GerenciarFormularios';
import { NavegacaoFormularios, TelaAtiva } from './components/NavegacaoFormularios';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Header } from './components/Header';
import { AuthProvider } from './shared/contexts/AuthContext';
import { OrdemServico } from './shared/types/os';
import { OrdemServicoPON } from './shared/types/pon';
import { OrdemServicoLINK } from './shared/types/link';
import { FormularioSalvo } from './shared/types/formularioSalvo';
import { formatarData } from './shared';

function App() {
  const [telaAtiva, setTelaAtiva] = useState<TelaAtiva>('GERENCIAR');
  const [formularioEditando, setFormularioEditando] = useState<FormularioSalvo | null>(null);

  const editarFormulario = (formulario: FormularioSalvo) => {
    setFormularioEditando(formulario);
    setTelaAtiva(formulario.tipo as TelaAtiva);
  };

  const novoFormulario = () => {
    setFormularioEditando(null);
    setTelaAtiva('CTO');
  };

  const voltarParaGerenciar = () => {
    setFormularioEditando(null);
    setTelaAtiva('GERENCIAR');
  };

  const handleSubmitCTO = (dados: OrdemServico) => {
    console.log('Dados da Ordem de Serviço CTO:', dados);
  };

  const handleSubmitPON = (dados: OrdemServicoPON) => {
    console.log('Dados da Ordem de Serviço PON:', dados);
  };

  const handleSubmitLINK = (dados: OrdemServicoLINK) => {
    console.log('Dados da Ordem de Serviço LINK:', dados);
  };

  const renderTelaAtiva = () => {
    if (telaAtiva === 'GERENCIAR') {
      return (
        <GerenciarFormularios
          onEditarFormulario={editarFormulario}
          onNovoFormulario={novoFormulario}
        />
      );
    }

    const dadosIniciais = formularioEditando?.dados;
    
    switch (telaAtiva) {
      case 'CTO':
        return <FormularioOS onSubmit={handleSubmitCTO} dadosIniciais={dadosIniciais} />;
      case 'PON':
        return <FormularioPON onSubmit={handleSubmitPON} dadosIniciais={dadosIniciais} />;
      case 'LINK':
        return <FormularioLINK onSubmit={handleSubmitLINK} dadosIniciais={dadosIniciais} />;
      default:
        return <FormularioOS onSubmit={handleSubmitCTO} dadosIniciais={dadosIniciais} />;
    }
  };

  return (
    <AuthProvider>
      <div className="App">
        <ProtectedRoute>
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            minHeight: '100vh'
          }}>
            <Header />
            
            <header style={{ 
              textAlign: 'center', 
              marginBottom: '20px',
              padding: '20px'
            }}>
              <h1 style={{ 
                color: '#007bff', 
                fontSize: '2.5rem',
                marginBottom: '10px',
                textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
              }}>
                🔧 Sistema de Ordem de Serviço
              </h1>
              <p style={{ 
                color: '#666', 
                fontSize: '1.1rem',
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                Registre e gerencie ordens de serviço técnico de forma eficiente
              </p>
              <p style={{ 
                fontSize: '0.9rem', 
                color: '#888',
                marginTop: '10px'
              }}>
                📅 {formatarData(new Date())}
              </p>
            </header>
            
            <NavegacaoFormularios 
              telaAtiva={telaAtiva}
              onMudarTela={(tela) => {
                setFormularioEditando(null);
                setTelaAtiva(tela);
              }}
              modoEdicao={!!formularioEditando}
              onVoltar={formularioEditando ? voltarParaGerenciar : undefined}
            />
            
            <main>
              {renderTelaAtiva()}
            </main>

            <footer style={{
              textAlign: 'center',
              padding: '40px 20px 20px',
              color: '#666',
              fontSize: '0.9rem'
            }}>
              <p>💻 Sistema desenvolvido com React + TypeScript</p>
              <p style={{ marginTop: '5px', fontSize: '0.8rem' }}>
                Tela ativa: <strong>{telaAtiva}</strong>
                {formularioEditando && (
                  <span style={{ marginLeft: '10px', color: '#856404' }}>
                    (Editando: {formularioEditando.codigoOS})
                  </span>
                )}
              </p>
            </footer>
          </div>
        </ProtectedRoute>
      </div>
    </AuthProvider>
  );
}

export default App;
