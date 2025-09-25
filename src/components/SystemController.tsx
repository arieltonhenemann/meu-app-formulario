import React, { useState, useEffect } from 'react';
import { useAuth } from '../shared/contexts/AuthContext';
import { userService } from '../shared/services/userService';
import { FormularioOS } from './FormularioOS';
import { FormularioPON } from './FormularioPON';
import { FormularioLINK } from './FormularioLINK';
import { GerenciarFormularios } from './GerenciarFormularios';
import { NavegacaoFormularios, TelaAtiva } from './NavegacaoFormularios';
import { Header } from './Header';
import { AdminPanel } from './AdminPanel';
import { RelatoriosPage } from './RelatoriosPage';
import { LogsAuditoriaPage } from './LogsAuditoriaPage';
import { GestaoEquipamentos } from './GestaoEquipamentos';
import { TelaSelecionarSistema } from './TelaSelecionarSistema';
import { ConditionalEmergencyButton } from './ConditionalEmergencyButton';
import { OrdemServico } from '../shared/types/os';
import { OrdemServicoPON } from '../shared/types/pon';
import { OrdemServicoLINK } from '../shared/types/link';
import { FormularioSalvo } from '../shared/types/formularioSalvo';
import { formatarData } from '../shared';

export const SystemController: React.FC = () => {
  const { user } = useAuth();
  const [telaAtiva, setTelaAtiva] = useState<TelaAtiva>('GERENCIAR');
  const [formularioEditando, setFormularioEditando] = useState<FormularioSalvo | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sistemaAtual, setSistemaAtual] = useState<'OS' | 'EQUIPAMENTOS' | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  
  // Função para voltar à tela de seleção de sistema (apenas para admins)
  const voltarParaTelaSelecionarSistema = () => {
    if (isAdmin) {
      setSistemaAtual(null);
    }
  };
  
  // Verificar se é admin e definir sistema padrão
  useEffect(() => {
    const verificarAdminEDefinirSistema = async () => {
      if (user?.uid) {
        setCheckingAdmin(true);
        try {
          const ehAdmin = await userService.verificarSeEhAdmin(user.uid);
          setIsAdmin(ehAdmin);
          
          // Se não for admin, direcionar automaticamente para sistema de OS
          if (!ehAdmin) {
            setSistemaAtual('OS');
          }
          // Se for admin, mostrar tela de seleção (sistemaAtual fica null)
        } catch (error) {
          console.error('Erro ao verificar admin:', error);
          // Em caso de erro, assumir que não é admin
          setIsAdmin(false);
          setSistemaAtual('OS');
        } finally {
          setCheckingAdmin(false);
        }
      } else {
        // Se não há usuário, resetar estados
        setCheckingAdmin(false);
        setIsAdmin(false);
        setSistemaAtual(null);
      }
    };
    verificarAdminEDefinirSistema();
  }, [user]);

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
    // Se estava editando, voltar para gerenciar após salvar
    if (formularioEditando) {
      setTimeout(() => voltarParaGerenciar(), 1000);
    }
  };

  const handleSubmitPON = (dados: OrdemServicoPON) => {
    console.log('Dados da Ordem de Serviço PON:', dados);
    // Se estava editando, voltar para gerenciar após salvar
    if (formularioEditando) {
      setTimeout(() => voltarParaGerenciar(), 1000);
    }
  };

  const handleSubmitLINK = (dados: OrdemServicoLINK) => {
    console.log('Dados da Ordem de Serviço LINK:', dados);
    // Se estava editando, voltar para gerenciar após salvar
    if (formularioEditando) {
      setTimeout(() => voltarParaGerenciar(), 1000);
    }
  };

  // Nova função para finalizar formulários
  const handleFinalizar = async (formularioId: string) => {
    try {
      const { firebaseFormularioStorage } = await import('../shared/services/firebaseFormularioStorage');
      const { auditoriaService } = await import('../shared/services/auditoriaService');
      
      // Obter dados do formulário antes de finalizar
      const formulario = formularioEditando;
      
      const sucesso = await firebaseFormularioStorage.atualizarStatus(formularioId, 'finalizado');
      if (sucesso) {
        // Registrar log de auditoria
        if (user && formulario) {
          await auditoriaService.registrarAcao('FINALIZAR_FORMULARIO', {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName
          }, {
            formularioId,
            codigoOS: formulario.codigoOS,
            tipoFormulario: formulario.tipo as 'CTO' | 'PON' | 'LINK',
            statusAnterior: 'pendente',
            statusNovo: 'finalizado'
          });
        }
        
        alert('Ordem de serviço finalizada com sucesso!');
        
        // Voltar para a tela de gerenciamento após finalizar
        setTimeout(() => voltarParaGerenciar(), 1000);
      }
    } catch (error) {
      console.error('Erro ao finalizar formulário:', error);
      alert('Erro ao finalizar. Tente novamente.');
    }
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

    if (telaAtiva === 'RELATORIOS') {
      if (!isAdmin) {
        // Redirecionar não-admins para gerenciar
        setTelaAtiva('GERENCIAR');
        return null;
      }
      return <RelatoriosPage />;
    }

    if (telaAtiva === 'LOGS') {
      if (!isAdmin) {
        // Redirecionar não-admins para gerenciar
        setTelaAtiva('GERENCIAR');
        return null;
      }
      return <LogsAuditoriaPage />;
    }

    // Telas administrativas - só admins podem acessar
    if (telaAtiva === 'ADMIN') {
      if (!isAdmin) {
        // Redirecionar não-admins para gerenciar
        setTelaAtiva('GERENCIAR');
        return null;
      }
      return <AdminPanel onVoltarTelaSelecionarSistema={voltarParaTelaSelecionarSistema} />;
    }

    const dadosIniciais = formularioEditando?.dados;
    const formularioId = formularioEditando?.id;
    const modoGerenciamento = !!formularioEditando; // Estamos no modo gerenciamento se está editando
    
    switch (telaAtiva) {
      case 'CTO':
        return (
          <FormularioOS 
            onSubmit={handleSubmitCTO} 
            dadosIniciais={dadosIniciais} 
            formularioId={formularioId}
            modoGerenciamento={modoGerenciamento}
            onFinalizar={handleFinalizar}
          />
        );
      case 'PON':
        return (
          <FormularioPON 
            onSubmit={handleSubmitPON} 
            dadosIniciais={dadosIniciais} 
            formularioId={formularioId}
            modoGerenciamento={modoGerenciamento}
            onFinalizar={handleFinalizar}
          />
        );
      case 'LINK':
        return (
          <FormularioLINK 
            onSubmit={handleSubmitLINK} 
            dadosIniciais={dadosIniciais} 
            formularioId={formularioId}
            modoGerenciamento={modoGerenciamento}
            onFinalizar={handleFinalizar}
          />
        );
      default:
        return (
          <FormularioOS 
            onSubmit={handleSubmitCTO} 
            dadosIniciais={dadosIniciais} 
            formularioId={formularioId}
            modoGerenciamento={modoGerenciamento}
            onFinalizar={handleFinalizar}
          />
        );
    }
  };

  // Mostrar loading enquanto verifica se é admin
  if (checkingAdmin) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔄</div>
          <h2 style={{ color: '#333', marginBottom: '10px' }}>Carregando...</h2>
          <p style={{ color: '#666', margin: 0 }}>Verificando permissões de acesso</p>
        </div>
      </div>
    );
  }

  // Se for admin e não escolheu sistema ainda, mostrar tela de seleção
  if (isAdmin && sistemaAtual === null) {
    return <TelaSelecionarSistema onSelecionarSistema={setSistemaAtual} />;
  }

  // Sistema de Equipamentos
  if (sistemaAtual === 'EQUIPAMENTOS') {
    return (
      <>
        <GestaoEquipamentos 
          isAdmin={isAdmin} 
          onVoltarTelaSelecionarSistema={voltarParaTelaSelecionarSistema}
        />
        <ConditionalEmergencyButton isAdmin={isAdmin} />
      </>
    );
  }

  // Sistema de OS (padrão)
  return (
    <div style={{ 
      backgroundColor: '#f8f9fa', 
      minHeight: '100vh'
    }}>
      <Header 
        isAdmin={isAdmin} 
        onVoltarTelaSelecionarSistema={voltarParaTelaSelecionarSistema}
      />
      
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

      <ConditionalEmergencyButton isAdmin={isAdmin} />

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
  );
};
