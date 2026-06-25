import React, { useState, Suspense, lazy } from 'react';
import { useAuth } from '../shared/contexts/AuthContext';
import { GerenciarFormularios } from './GerenciarFormularios';
import { NavegacaoFormularios, TelaAtiva } from './NavegacaoFormularios';
import { Header } from './Header';

const FormularioOS = lazy(() => import('./FormularioOS').then(m => ({ default: m.FormularioOS })));
const FormularioPON = lazy(() => import('./FormularioPON').then(m => ({ default: m.FormularioPON })));
const FormularioLINK = lazy(() => import('./FormularioLINK').then(m => ({ default: m.FormularioLINK })));
const FormularioAdequacao = lazy(() => import('./FormularioAdequacao').then(m => ({ default: m.FormularioAdequacao })));
const AdminPanel = lazy(() => import('./AdminPanel').then(m => ({ default: m.AdminPanel })));
const RelatoriosPage = lazy(() => import('./RelatoriosPage').then(m => ({ default: m.RelatoriosPage })));
const LogsAuditoriaPage = lazy(() => import('./LogsAuditoriaPage').then(m => ({ default: m.LogsAuditoriaPage })));

import { OrdemServico } from '../shared/types/os';
import { OrdemServicoPON } from '../shared/types/pon';
import { OrdemServicoLINK } from '../shared/types/link';
import { OrdemServicoAdequacao } from '../shared/types/adequacao';
import { FormularioSalvo } from '../shared/types/formularioSalvo';
import { formatarData } from '../shared/utils';
import { firebaseFormularioStorage } from '../shared/services/firebaseFormularioStorage';
import { toast } from '../shared/components/Toast';
import { registrarAcaoAuditoria } from '../shared/utils/auditoriaHelper';
import type { TipoFormularioAuditoria } from '../shared/types/auditoria';

export const SystemController: React.FC = () => {
  const { user, isAdmin, checkingAdmin } = useAuth();
  const [telaAtiva, setTelaAtiva] = useState<TelaAtiva>('GERENCIAR');
  const [formularioEditando, setFormularioEditando] = useState<FormularioSalvo | null>(null);

  const editarFormulario = (formulario: FormularioSalvo) => {
    setFormularioEditando(formulario);
    setTelaAtiva(formulario.tipo as TelaAtiva);
  };

  const voltarParaGerenciar = () => {
    setFormularioEditando(null);
    setTelaAtiva('GERENCIAR');
  };

  const handleSubmit = async (_dados: OrdemServico | OrdemServicoPON | OrdemServicoLINK | OrdemServicoAdequacao) => {
    voltarParaGerenciar();
  };

  const handleFinalizar = async (formularioId: string) => {
    try {
      const formulario = formularioEditando;
      const sucesso = await firebaseFormularioStorage.atualizarStatus(formularioId, 'finalizado');
      if (sucesso) {
        if (user && formulario) {
          await registrarAcaoAuditoria(user, 'FINALIZAR_FORMULARIO', {
            formularioId,
            codigoOS: formulario.codigoOS,
            tipoFormulario: formulario.tipo as TipoFormularioAuditoria,
            statusAnterior: formulario.status,
            statusNovo: 'finalizado',
          });
        }
        toast.success('Ordem de serviço finalizada com sucesso!');
        voltarParaGerenciar();
      }
    } catch (error) {
      console.error('Erro ao finalizar formulário:', error);
      toast.error('Erro ao finalizar. Tente novamente.');
    }
  };

  const renderTelaAtiva = () => {
    if (telaAtiva === 'GERENCIAR') {
      return (
        <GerenciarFormularios
          onEditarFormulario={editarFormulario}
        />
      );
    }

    if (telaAtiva === 'RELATORIOS' || telaAtiva === 'LOGS' || telaAtiva === 'ADMIN') {
      if (!isAdmin) {
        setTelaAtiva('GERENCIAR');
        return null;
      }
      const SuspenseFallback = () => (
        <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
          <div style={{ fontSize: '2rem', marginBottom: '15px' }}>⏳</div>
          <p>Carregando...</p>
        </div>
      );
      if (telaAtiva === 'RELATORIOS') return <Suspense fallback={<SuspenseFallback />}><RelatoriosPage /></Suspense>;
      if (telaAtiva === 'LOGS') return <Suspense fallback={<SuspenseFallback />}><LogsAuditoriaPage /></Suspense>;
      return <Suspense fallback={<SuspenseFallback />}><AdminPanel /></Suspense>;
    }

    const dadosIniciais = formularioEditando?.dados;
    const formularioId = formularioEditando?.id;
    const modoGerenciamento = !!formularioEditando;

    const SuspenseFallback = () => (
      <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
        <div style={{ fontSize: '2rem', marginBottom: '15px' }}>⏳</div>
        <p>Carregando formulário...</p>
      </div>
    );

    const formProps = {
      onSubmit: handleSubmit,
      dadosIniciais,
      formularioId,
      modoGerenciamento,
      onFinalizar: handleFinalizar,
    };

    switch (telaAtiva) {
      case 'CTO':
        return <Suspense fallback={<SuspenseFallback />}><FormularioOS {...formProps} /></Suspense>;
      case 'PON':
        return <Suspense fallback={<SuspenseFallback />}><FormularioPON {...formProps} /></Suspense>;
      case 'LINK':
        return <Suspense fallback={<SuspenseFallback />}><FormularioLINK {...formProps} /></Suspense>;
      case 'ADEQUACAO':
        return <Suspense fallback={<SuspenseFallback />}><FormularioAdequacao {...formProps} /></Suspense>;
      default:
        return <Suspense fallback={<SuspenseFallback />}><FormularioOS {...formProps} /></Suspense>;
    }
  };

  if (checkingAdmin) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'var(--bg-card)',
          color: 'var(--text-main)',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔄</div>
          <h2 style={{ color: 'var(--text-main)', marginBottom: '10px' }}>Carregando...</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Verificando permissões de acesso</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'var(--bg-app)',
      color: 'var(--text-main)',
      minHeight: '100vh',
      transition: 'background-color 0.3s ease, color 0.3s ease'
    }}>
      <Header />

      <header style={{
        textAlign: 'center',
        marginBottom: '20px',
        padding: '20px'
      }}>
        <h1 style={{
          color: 'var(--btn-primary, #007bff)',
          fontSize: '2.5rem',
          marginBottom: '10px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.05)'
        }}>
          🔧 Sistema de Ordem de Serviço
        </h1>
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '1.1rem',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          Registre e gerencie ordens de serviço técnico de forma eficiente
        </p>
        <p style={{
          fontSize: '0.9rem',
          color: 'var(--text-muted)',
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
        color: 'var(--text-muted)',
        fontSize: '0.9rem'
      }}>
        <p style={{ marginTop: '5px', fontSize: '0.8rem' }}>
          Tela ativa: <strong>{telaAtiva}</strong>
          {formularioEditando && (
            <span style={{ marginLeft: '10px', color: 'var(--status-pendente)' }}>
              (Editando: {formularioEditando.codigoOS})
            </span>
          )}
        </p>
      </footer>
    </div>
  );
};
