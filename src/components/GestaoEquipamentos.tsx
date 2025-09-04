import React, { useState, useEffect, useRef } from 'react';
import { DashboardEquipamentos } from './DashboardEquipamentos';
import { CadastroFuncionario } from './CadastroFuncionario';
import { CadastroNotebook } from './CadastroNotebook';
import { CadastroCelular } from './CadastroCelular';
import { CadastroNumeroTelefone } from './CadastroNumeroTelefone';
import { VinculacaoEquipamentos } from './VinculacaoEquipamentos';
import { ListaFuncionarios } from './ListaFuncionarios';
import { ListaNotebooks } from './ListaNotebooks';
import { ListaCelulares } from './ListaCelulares';
import { ListaNumerosTelefone } from './ListaNumerosTelefone';

type SectionType = 
  | 'dashboard' 
  | 'cadastro-funcionario' 
  | 'cadastro-notebook' 
  | 'cadastro-celular' 
  | 'cadastro-numero' 
  | 'vinculacao'
  | 'lista-funcionarios'
  | 'lista-notebooks'
  | 'lista-celulares'
  | 'lista-numeros';

interface GestaoEquipamentosProps {
  isAdmin?: boolean;
  onVoltarTelaSelecionarSistema?: () => void;
}

export const GestaoEquipamentos: React.FC<GestaoEquipamentosProps> = ({
  isAdmin = false,
  onVoltarTelaSelecionarSistema
}) => {
  const [currentSection, setCurrentSection] = useState<SectionType>('dashboard');
  const [cadastrosDropdownOpen, setCadastrosDropdownOpen] = useState(false);
  const [listagensDropdownOpen, setListagensDropdownOpen] = useState(false);
  const cadastrosDropdownRef = useRef<HTMLDivElement>(null);
  const listagensDropdownRef = useRef<HTMLDivElement>(null);

  const handleNavigate = (section: SectionType) => {
    setCurrentSection(section);
    setCadastrosDropdownOpen(false); // Fechar dropdowns ao navegar
    setListagensDropdownOpen(false);
  };

  const handleBackToDashboard = () => {
    setCurrentSection('dashboard');
  };

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cadastrosDropdownRef.current && !cadastrosDropdownRef.current.contains(event.target as Node)) {
        setCadastrosDropdownOpen(false);
      }
      if (listagensDropdownRef.current && !listagensDropdownRef.current.contains(event.target as Node)) {
        setListagensDropdownOpen(false);
      }
    };

    if (cadastrosDropdownOpen || listagensDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [cadastrosDropdownOpen, listagensDropdownOpen]);

  const getSectionTitle = () => {
    switch (currentSection) {
      case 'dashboard':
        return 'Dashboard - Gestão de Equipamentos';
      case 'cadastro-funcionario':
        return 'Cadastro de Funcionário';
      case 'cadastro-notebook':
        return 'Cadastro de Notebook';
      case 'cadastro-celular':
        return 'Cadastro de Celular';
      case 'cadastro-numero':
        return 'Cadastro de Número de Telefone';
      case 'vinculacao':
        return 'Vinculação de Equipamentos';
      case 'lista-funcionarios':
        return 'Lista de Funcionários';
      case 'lista-notebooks':
        return 'Lista de Notebooks';
      case 'lista-celulares':
        return 'Lista de Celulares';
      case 'lista-numeros':
        return 'Lista de Números de Telefone';
      default:
        return 'Gestão de Equipamentos';
    }
  };

  return (
    <div className="gestao-equipamentos">
      <header className="app-header">
        <div className="header-content">
          <h1 onClick={handleBackToDashboard} style={{ cursor: 'pointer', margin: 0 }}>
            📱 Gestão de Equipamentos
          </h1>
          <nav className="main-nav">
            {isAdmin && onVoltarTelaSelecionarSistema && (
              <button 
                className="nav-btn"
                onClick={onVoltarTelaSelecionarSistema}
                title="Voltar à tela de seleção de sistema"
              >
                ↩️ Trocar Sistema
              </button>
            )}
            <button 
              className={`nav-btn ${currentSection === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleNavigate('dashboard')}
            >
              Dashboard
            </button>
            
            {/* Dropdown Cadastros */}
            <div className="nav-dropdown" ref={cadastrosDropdownRef}>
              <button 
                className="nav-btn dropdown-toggle"
                onClick={() => {
                  setCadastrosDropdownOpen(!cadastrosDropdownOpen);
                  setListagensDropdownOpen(false);
                }}
              >
                ➕ Cadastros {cadastrosDropdownOpen ? '▲' : '▼'}
              </button>
              <div className={`dropdown-menu ${cadastrosDropdownOpen ? 'show' : ''}`}>
                <button onClick={() => handleNavigate('cadastro-funcionario')}>
                  👥 Novo Funcionário
                </button>
                <button onClick={() => handleNavigate('cadastro-notebook')}>
                  💻 Novo Notebook
                </button>
                <button onClick={() => handleNavigate('cadastro-celular')}>
                  📱 Novo Celular
                </button>
                <button onClick={() => handleNavigate('cadastro-numero')}>
                  📞 Novo Número
                </button>
              </div>
            </div>
            
            {/* Dropdown Listagens */}
            <div className="nav-dropdown" ref={listagensDropdownRef}>
              <button 
                className="nav-btn dropdown-toggle"
                onClick={() => {
                  setListagensDropdownOpen(!listagensDropdownOpen);
                  setCadastrosDropdownOpen(false);
                }}
              >
                📄 Listagens {listagensDropdownOpen ? '▲' : '▼'}
              </button>
              <div className={`dropdown-menu ${listagensDropdownOpen ? 'show' : ''}`}>
                <button onClick={() => handleNavigate('lista-funcionarios')}>
                  👥 Ver Funcionários
                </button>
                <button onClick={() => handleNavigate('lista-notebooks')}>
                  💻 Ver Notebooks
                </button>
                <button onClick={() => handleNavigate('lista-celulares')}>
                  📱 Ver Celulares
                </button>
                <button onClick={() => handleNavigate('lista-numeros')}>
                  📞 Ver Números
                </button>
              </div>
            </div>
            
            <button 
              className={`nav-btn ${currentSection === 'vinculacao' ? 'active' : ''}`}
              onClick={() => handleNavigate('vinculacao')}
            >
              🔗 Vincular Equipamentos
            </button>
          </nav>
        </div>
      </header>

      <main className="main-content">
        <div className="content-header">
          <h2>{getSectionTitle()}</h2>
          {currentSection !== 'dashboard' && (
            <button 
              className="btn btn-outline"
              onClick={handleBackToDashboard}
            >
              ← Voltar ao Dashboard
            </button>
          )}
        </div>

        <div className="content-body">
          {currentSection === 'dashboard' && (
            <DashboardEquipamentos onNavigate={handleNavigate} />
          )}

          {currentSection === 'cadastro-funcionario' && (
            <CadastroFuncionario 
              onSuccess={handleBackToDashboard}
              onCancel={handleBackToDashboard}
            />
          )}

          {currentSection === 'cadastro-notebook' && (
            <CadastroNotebook 
              onSuccess={handleBackToDashboard}
              onCancel={handleBackToDashboard}
            />
          )}

          {currentSection === 'cadastro-celular' && (
            <CadastroCelular 
              onSuccess={handleBackToDashboard}
              onCancel={handleBackToDashboard}
            />
          )}

          {currentSection === 'cadastro-numero' && (
            <CadastroNumeroTelefone 
              onSuccess={handleBackToDashboard}
              onCancel={handleBackToDashboard}
            />
          )}

          {currentSection === 'vinculacao' && (
            <VinculacaoEquipamentos 
              onSuccess={handleBackToDashboard}
              onCancel={handleBackToDashboard}
            />
          )}

          {currentSection === 'lista-funcionarios' && (
            <ListaFuncionarios onBack={handleBackToDashboard} />
          )}

          {currentSection === 'lista-notebooks' && (
            <ListaNotebooks onBack={handleBackToDashboard} />
          )}

          {currentSection === 'lista-celulares' && (
            <ListaCelulares onBack={handleBackToDashboard} />
          )}

          {currentSection === 'lista-numeros' && (
            <ListaNumerosTelefone onBack={handleBackToDashboard} />
          )}
        </div>
      </main>
    </div>
  );
};
