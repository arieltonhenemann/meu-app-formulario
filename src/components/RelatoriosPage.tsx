import React, { useState, useEffect } from 'react';
import { FormularioSalvo } from '../shared/types/formularioSalvo';
import { firebaseFormularioStorage } from '../shared/services/firebaseFormularioStorage';
import { exportadorRelatorios } from '../shared/utils/exportarRelatorios';
import { toast } from '../shared/components/Toast';
import { formatarData } from '../shared/utils';

interface EstadoRelatorios {
  dataInicio: string;
  dataFim: string;
  formularios: FormularioSalvo[];
  formulariosFiltrados: FormularioSalvo[];
  carregando: boolean;
  estatisticas: { total: number; porTipo: Record<string, number> } | null;
  filtroTipo: string;
}

const obterCorTipo = (tipo: string) => {
  switch (tipo) {
    case 'CTO': return '#007bff';
    case 'PON': return '#28a745';
    case 'LINK': return '#dc3545';
    case 'ADEQUACAO': return '#d4a30e';
    default: return '#17a2b8';
  }
};

export const RelatoriosPage: React.FC = () => {
  const [estado, setEstado] = useState<EstadoRelatorios>({
    dataInicio: '',
    dataFim: '',
    formularios: [],
    formulariosFiltrados: [],
    carregando: true,
    estatisticas: null,
    filtroTipo: 'TODOS'
  });

  const [exportando, setExportando] = useState({
    pdf: false,
    excel: false
  });

  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Carregar todos os formulários ao iniciar
  useEffect(() => {
    carregarFormularios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Aplicar filtros sempre que mudarem
  useEffect(() => {
    aplicarFiltros();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado.dataInicio, estado.dataFim, estado.formularios, estado.filtroTipo]);

  const carregarFormularios = async () => {
    console.log('📊 [RelatoriosPage] Carregando formulários para relatórios');

    try {
      setEstado(prev => ({ ...prev, carregando: true }));

      const formularios = await firebaseFormularioStorage.obterTodos();
      console.log('📊 Formulários carregados:', formularios.length);

      setEstado(prev => ({
        ...prev,
        formularios,
        carregando: false
      }));

    } catch (error) {
      console.error('❌ Erro ao carregar formulários:', error);
      setEstado(prev => ({ ...prev, carregando: false }));
    }
  };

  const aplicarFiltros = () => {
    console.log('🔍 [RelatoriosPage] Aplicando filtros:', {
      dataInicio: estado.dataInicio,
      dataFim: estado.dataFim,
      filtroTipo: estado.filtroTipo,
      totalFormularios: estado.formularios.length
    });

    let filtrados = [...estado.formularios];

    // Filtro por data
    if (estado.dataInicio || estado.dataFim) {
      filtrados = exportadorRelatorios.filtrarPorData(filtrados, estado.dataInicio, estado.dataFim);
    }

    // Filtro por tipo
    if (estado.filtroTipo !== 'TODOS') {
      filtrados = filtrados.filter(f => f.tipo === estado.filtroTipo);
    }

    // Gerar estatísticas
    const estatisticas = exportadorRelatorios.gerarEstatisticas(filtrados);

    setEstado(prev => ({
      ...prev,
      formulariosFiltrados: filtrados,
      estatisticas
    }));

    console.log('✅ Filtros aplicados:', filtrados.length, 'formulários');
  };

  const definirDataInicio = (data: string) => {
    setEstado(prev => ({ ...prev, dataInicio: data }));
  };

  const definirDataFim = (data: string) => {
    setEstado(prev => ({ ...prev, dataFim: data }));
  };

  const definirFiltroTipo = (tipo: string) => {
    setEstado(prev => ({ ...prev, filtroTipo: tipo }));
  };

  const exportarPDF = async () => {
    console.log('📄 [RelatoriosPage] Iniciando exportação PDF');

    try {
      setExportando(prev => ({ ...prev, pdf: true }));

      const dataInicioTexto = estado.dataInicio || 'início';
      const dataFimTexto = estado.dataFim || 'hoje';

      await exportadorRelatorios.exportarParaPDF(
        estado.formulariosFiltrados,
        dataInicioTexto,
        dataFimTexto
      );

      toast.success('Relatório PDF gerado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao exportar PDF:', error);
      toast.error('Erro ao gerar relatório PDF. Tente novamente.');
    } finally {
      setExportando(prev => ({ ...prev, pdf: false }));
    }
  };

  const exportarExcel = async () => {
    console.log('📊 [RelatoriosPage] Iniciando exportação Excel');

    try {
      setExportando(prev => ({ ...prev, excel: true }));

      const dataInicioTexto = estado.dataInicio || 'início';
      const dataFimTexto = estado.dataFim || 'hoje';

      await exportadorRelatorios.exportarParaExcel(
        estado.formulariosFiltrados,
        dataInicioTexto,
        dataFimTexto
      );

      toast.success('Planilha Excel gerada com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao exportar Excel:', error);
      toast.error('Erro ao gerar planilha Excel. Tente novamente.');
    } finally {
      setExportando(prev => ({ ...prev, excel: false }));
    }
  };

  const limparFiltros = () => {
    setEstado(prev => ({
      ...prev,
      dataInicio: '',
      dataFim: '',
      filtroTipo: 'TODOS'
    }));
  };

  if (estado.carregando) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', marginBottom: '10px' }}>
          📊 Carregando dados para relatórios...
        </div>
        <div style={{ color: '#666' }}>
          Aguarde enquanto buscamos os formulários
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Cabeçalho */}
      <div style={{
        marginBottom: '30px',
        textAlign: 'center',
        borderBottom: '2px solid #428bca',
        paddingBottom: '15px'
      }}>
        <h2 style={{ margin: '0', color: '#428bca', fontSize: '28px' }}>
          📊 Relatórios de Ordens de Serviço
        </h2>
        <p style={{ margin: '5px 0 0 0', color: '#666' }}>
          Filtros, visualização e exportação de dados
        </p>
        <div style={{
          display: 'inline-block',
          marginTop: '10px',
          padding: '6px 12px',
          backgroundColor: '#fd7e14',
          color: 'white',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          🛡️ Acesso Restrito - Apenas Administradores
        </div>
      </div>

      {/* Filtros */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        color: 'var(--text-main)',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '25px',
        border: '1px solid var(--border-color)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: 'var(--text-main)' }}>
          🔍 Filtros
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          alignItems: 'end'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              📅 Data Início:
            </label>
            <input
              type="date"
              value={estado.dataInicio}
              onChange={(e) => definirDataInicio(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-main)',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              📅 Data Fim:
            </label>
            <input
              type="date"
              value={estado.dataFim}
              onChange={(e) => definirDataFim(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-main)',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              📋 Tipo:
            </label>
            <select
              value={estado.filtroTipo}
              onChange={(e) => definirFiltroTipo(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-main)',
                boxSizing: 'border-box'
              }}
            >
              <option value="TODOS">Todos os tipos</option>
              <option value="CTO">CTO</option>
              <option value="PON">PON</option>
              <option value="LINK">LINK</option>
              <option value="ADEQUACAO">ADEQUAÇÃO</option>
            </select>
          </div>

          <div>
            <button
              onClick={limparFiltros}
              style={{
                padding: '8px 15px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🗑️ Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      {estado.estatisticas && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '15px',
          marginBottom: '25px'
        }}>
          <div
            onClick={() => definirFiltroTipo('TODOS')}
            onMouseEnter={() => setHoveredCard('total')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              backgroundColor: estado.filtroTipo === 'TODOS' ? 'rgba(111, 66, 193, 0.15)' : 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderLeft: '4px solid #6f42c1',
              padding: '15px',
              borderRadius: '8px',
              textAlign: 'center',
              cursor: 'pointer',
              transform: hoveredCard === 'total' ? 'translateY(-2px)' : 'none',
              boxShadow: hoveredCard === 'total' ? '0 4px 8px rgba(0,0,0,0.15)' : (estado.filtroTipo === 'TODOS' ? '0 4px 6px rgba(0,0,0,0.12)' : '0 2px 4px rgba(0,0,0,0.02)'),
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6f42c1' }}>
              {estado.estatisticas.total}
            </div>
            <div style={{ color: 'var(--text-main)', fontSize: '14px', marginTop: '5px' }}>Total de Formulários</div>
          </div>

          {Object.entries(estado.estatisticas.porTipo).map(([tipo, quantidade]) => {
            const cor = obterCorTipo(tipo);
            return (
              <div
                key={tipo}
                onClick={() => definirFiltroTipo(tipo)}
                onMouseEnter={() => setHoveredCard(tipo)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  backgroundColor: estado.filtroTipo === tipo ? `${cor}26` : 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderLeft: `4px solid ${cor}`,
                  padding: '15px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transform: hoveredCard === tipo ? 'translateY(-2px)' : 'none',
                  boxShadow: hoveredCard === tipo ? '0 4px 8px rgba(0,0,0,0.15)' : (estado.filtroTipo === tipo ? '0 4px 6px rgba(0,0,0,0.12)' : '0 2px 4px rgba(0,0,0,0.02)'),
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: cor
                }}>
                  {quantidade as number}
                </div>
                <div style={{ color: 'var(--text-main)', fontSize: '14px', marginTop: '5px' }}>Formulários {tipo}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Botões de Exportação */}
      <div style={{
        display: 'flex',
        gap: '15px',
        marginBottom: '25px',
        justifyContent: 'center'
      }}>
        <button
          onClick={exportarPDF}
          disabled={exportando.pdf || estado.formulariosFiltrados.length === 0}
          style={{
            padding: '12px 24px',
            backgroundColor: exportando.pdf ? '#ccc' : '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: exportando.pdf ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {exportando.pdf ? '⏳ Gerando...' : '📄 Exportar PDF'}
        </button>

        <button
          onClick={exportarExcel}
          disabled={exportando.excel || estado.formulariosFiltrados.length === 0}
          style={{
            padding: '12px 24px',
            backgroundColor: exportando.excel ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: exportando.excel ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {exportando.excel ? '⏳ Gerando...' : '📊 Exportar Excel'}
        </button>
      </div>

      {/* Tabela de Dados */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        color: 'var(--text-main)',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{
          backgroundColor: '#428bca',
          color: 'white',
          padding: '15px',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          📋 Dados do Relatório ({estado.formulariosFiltrados.length} registros)
        </div>

        {estado.formulariosFiltrados.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>📭</div>
            <div style={{ fontSize: '18px', marginBottom: '10px' }}>
              Nenhum formulário encontrado
            </div>
            <div>
              Ajuste os filtros para ver os dados
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-app)' }}>
                  <th style={{ padding: '12px', borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>Tipo</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>Código OS</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>Data</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>Região</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>CTO/PON</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>Problema</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>Endereço</th>
                </tr>
              </thead>
              <tbody>
                {estado.formulariosFiltrados.map((formulario, index) => {
                  const dados = formulario.dados;
                  return (
                    <tr key={formulario.id || index} style={{
                      backgroundColor: index % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-app)'
                    }}>
                      <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: formulario.tipo === 'CTO' ? '#d4edda' :
                            formulario.tipo === 'PON' ? '#fff3cd' : '#e2e3e5',
                          color: formulario.tipo === 'CTO' ? '#155724' :
                            formulario.tipo === 'PON' ? '#856404' : '#383d41'
                        }}>
                          {formulario.tipo}
                        </span>
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                        {dados.codigoOS || 'N/A'}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                        {formulario.dataCriacao ? formatarData(new Date(formulario.dataCriacao)) : 'N/A'}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                        {'regiao' in dados ? dados.regiao : 'N/A'}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                        {'cto' in dados ? dados.cto : ('pon' in dados ? dados.pon : 'Links')}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6', maxWidth: '200px' }}>
                        <div
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={dados.problema || 'N/A'}
                        >
                          {dados.problema || 'N/A'}
                        </div>
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6', maxWidth: '200px' }}>
                        <div
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={'endereco' in dados ? dados.endereco : 'N/A'}
                        >
                          {'endereco' in dados ? dados.endereco : 'N/A'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Informações adicionais */}
      <div style={{
        marginTop: '25px',
        padding: '15px',
        backgroundColor: 'var(--bg-card)',
        borderRadius: '6px',
        fontSize: '14px',
        color: 'var(--text-muted)',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>ℹ️ Informações:</div>
        <ul style={{ margin: '0', paddingLeft: '20px' }}>
          <li>Use os filtros de data para selecionar um período específico</li>
          <li>O relatório PDF é otimizado para impressão</li>
          <li>A planilha Excel contém uma aba adicional com resumo</li>
          <li>Os dados são exportados exatamente como aparecem na tabela</li>
        </ul>
      </div>
    </div>
  );
};
