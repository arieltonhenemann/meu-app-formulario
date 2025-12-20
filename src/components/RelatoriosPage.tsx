import React, { useState, useEffect } from 'react';
import { FormularioSalvo } from '../shared/types/formularioSalvo';
import { firebaseFormularioStorage } from '../shared/services/firebaseFormularioStorage';
import { exportadorRelatorios } from '../shared/utils/exportarRelatorios';

interface EstadoRelatorios {
  dataInicio: string;
  dataFim: string;
  formularios: FormularioSalvo[];
  formulariosFiltrados: FormularioSalvo[];
  carregando: boolean;
  estatisticas: any;
  filtroTipo: string;
}

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

  // Carregar todos os formulários ao iniciar
  useEffect(() => {
    carregarFormularios();
  }, []);

  // Aplicar filtros sempre que mudarem
  useEffect(() => {
    aplicarFiltros();
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

      alert('✅ Relatório PDF gerado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao exportar PDF:', error);
      alert('❌ Erro ao gerar relatório PDF. Tente novamente.');
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

      alert('✅ Planilha Excel gerada com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao exportar Excel:', error);
      alert('❌ Erro ao gerar planilha Excel. Tente novamente.');
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

  const formatarData = (data: any) => {
    if (!data) return 'N/A';
    return new Date(data).toLocaleDateString('pt-BR');
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
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '25px',
        border: '1px solid #dee2e6'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>
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
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
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
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
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
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
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
          <div style={{
            backgroundColor: '#e3f2fd',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
              {estado.estatisticas.total}
            </div>
            <div style={{ color: '#424242' }}>Total de Formulários</div>
          </div>

          {Object.entries(estado.estatisticas.porTipo).map(([tipo, quantidade]) => (
            <div key={tipo} style={{
              backgroundColor: tipo === 'CTO' ? '#e8f5e8' : tipo === 'PON' ? '#fff3e0' : '#f3e5f5',
              padding: '15px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '24px', fontWeight: 'bold',
                color: tipo === 'CTO' ? '#388e3c' : tipo === 'PON' ? '#f57c00' : '#7b1fa2'
              }}>
                {quantidade as number}
              </div>
              <div style={{ color: '#424242' }}>Formulários {tipo}</div>
            </div>
          ))}
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
        backgroundColor: 'white',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
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
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6', textAlign: 'left' }}>Tipo</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6', textAlign: 'left' }}>Código OS</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6', textAlign: 'left' }}>Data</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6', textAlign: 'left' }}>Região</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6', textAlign: 'left' }}>CTO/PON</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6', textAlign: 'left' }}>Problema</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6', textAlign: 'left' }}>Endereço</th>
                </tr>
              </thead>
              <tbody>
                {estado.formulariosFiltrados.map((formulario, index) => {
                  const dados = formulario.dados;
                  return (
                    <tr key={formulario.id || index} style={{
                      backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa'
                    }}>
                      <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
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
                        {formatarData(formulario.dataCriacao)}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                        {(dados as any).regiao || 'N/A'}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                        {(dados as any).cto || (dados as any).pon || 'Links'}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6', maxWidth: '200px' }}>
                        <div
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={(dados as any).problema || 'N/A'}
                        >
                          {(dados as any).problema || 'N/A'}
                        </div>
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6', maxWidth: '200px' }}>
                        <div
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={(dados as any).endereco || 'N/A'}
                        >
                          {(dados as any).endereco || 'N/A'}
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
        backgroundColor: '#f8f9fa',
        borderRadius: '6px',
        fontSize: '14px',
        color: '#666'
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
