import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { FormularioSalvo } from '../types/formularioSalvo';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface DadosRelatorio {
  tipo: string;
  codigoOS: string;
  data: string;
  regiao?: string;
  cto?: string;
  pon?: string;
  problema?: string;
  resolucao?: string;
  endereco?: string;
  localizacao?: string;
  links?: string;
  observacoes?: string;
}

export class ExportadorRelatorios {
  private formatarDadosParaRelatorio(formularios: FormularioSalvo[]): DadosRelatorio[] {
    console.log('📊 [ExportadorRelatorios] Formatando dados para relatório:', formularios.length, 'formulários');
    
    return formularios.map(formulario => {
      const dados = formulario.dados;
      const dataFormatada = formulario.dataCriacao 
        ? new Date(formulario.dataCriacao).toLocaleDateString('pt-BR')
        : 'N/A';

      const dadosBase: DadosRelatorio = {
        tipo: formulario.tipo,
        codigoOS: dados.codigoOS || 'N/A',
        data: dataFormatada,
      };

      // Adicionar campos específicos baseados no tipo
      switch (formulario.tipo) {
        case 'CTO':
          return {
            ...dadosBase,
            regiao: (dados as any).regiao || 'N/A',
            cto: (dados as any).cto || 'N/A',
            problema: (dados as any).problema || 'N/A',
            resolucao: (dados as any).resolucao || 'N/A',
            endereco: (dados as any).endereco || 'N/A',
            localizacao: (dados as any).localizacao || 'N/A',
          };
        
        case 'PON':
          return {
            ...dadosBase,
            regiao: (dados as any).regiao || 'N/A',
            pon: (dados as any).pon || 'N/A',
            problema: (dados as any).problema || 'N/A',
            resolucao: (dados as any).resolucao || 'N/A',
            endereco: (dados as any).endereco || 'N/A',
          };
        
        case 'LINK':
          const linksTexto = (dados as any).links 
            ? (dados as any).links.map((link: any, index: number) => 
                `Link ${index + 1}: ${link.link} → ${link.porta}`
              ).join('; ')
            : 'N/A';
          
          return {
            ...dadosBase,
            regiao: 'N/A', // LINK não tem região
            links: linksTexto,
            problema: (dados as any).problema || 'N/A',
            resolucao: (dados as any).resolucao || 'N/A',
            endereco: 'N/A', // LINK não tem endereço
          };
        
        default:
          return dadosBase;
      }
    });
  }

  public async exportarParaPDF(
    formularios: FormularioSalvo[], 
    dataInicio: string, 
    dataFim: string
  ): Promise<void> {
    console.log('📄 [ExportadorRelatorios] Iniciando exportação para PDF');
    
    try {
      const dadosRelatorio = this.formatarDadosParaRelatorio(formularios);
      
      // Criar documento PDF
      const doc = new jsPDF();
      
      // Cabeçalho
      doc.setFontSize(18);
      doc.text('Relatório de Ordens de Serviço', 14, 22);
      
      doc.setFontSize(12);
      doc.text(`Período: ${dataInicio} até ${dataFim}`, 14, 32);
      doc.text(`Total de registros: ${dadosRelatorio.length}`, 14, 40);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 48);
      
      // Preparar dados para tabela
      const colunas = [
        'Tipo',
        'Código OS',
        'Data',
        'Região',
        'CTO/PON',
        'Problema',
        'Resolução',
        'Endereço'
      ];
      
      const linhas = dadosRelatorio.map(item => [
        item.tipo,
        item.codigoOS,
        item.data,
        item.regiao || item.cto || item.pon || 'N/A',
        item.cto || item.pon || 'N/A',
        item.problema || 'N/A',
        item.resolucao || 'N/A',
        item.endereco || 'N/A'
      ]);
      
      // Adicionar tabela
      doc.autoTable({
        head: [colunas],
        body: linhas,
        startY: 55,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { top: 60 },
        didDrawPage: function (data: any) {
          // Rodapé
          const pageHeight = doc.internal.pageSize.height;
          doc.setFontSize(8);
          doc.text(`Página ${doc.getCurrentPageInfo().pageNumber}`, data.settings.margin.left, pageHeight - 10);
        }
      });
      
      // Salvar arquivo
      const nomeArquivo = `relatorio-os-${dataInicio}-${dataFim}.pdf`;
      doc.save(nomeArquivo);
      
      console.log('✅ [ExportadorRelatorios] PDF gerado com sucesso:', nomeArquivo);
    } catch (error) {
      console.error('❌ [ExportadorRelatorios] Erro ao gerar PDF:', error);
      throw new Error('Erro ao gerar relatório PDF');
    }
  }

  public async exportarParaExcel(
    formularios: FormularioSalvo[], 
    dataInicio: string, 
    dataFim: string
  ): Promise<void> {
    console.log('📊 [ExportadorRelatorios] Iniciando exportação para Excel');
    
    try {
      const dadosRelatorio = this.formatarDadosParaRelatorio(formularios);
      
      // Preparar dados para Excel
      const dadosExcel = dadosRelatorio.map(item => ({
        'Tipo': item.tipo,
        'Código OS': item.codigoOS,
        'Data': item.data,
        'Região': item.regiao || 'N/A',
        'CTO': item.cto || 'N/A',
        'PON': item.pon || 'N/A',
        'Links': item.links || 'N/A',
        'Problema': item.problema || 'N/A',
        'Resolução': item.resolucao || 'N/A',
        'Endereço': item.endereco || 'N/A',
        'Localização': item.localizacao || 'N/A',
        'Observações': item.observacoes || 'N/A'
      }));

      // Criar planilha
      const ws = XLSX.utils.json_to_sheet(dadosExcel);
      
      // Ajustar largura das colunas
      const colWidths = [
        { wch: 8 },  // Tipo
        { wch: 15 }, // Código OS
        { wch: 12 }, // Data
        { wch: 15 }, // Região
        { wch: 12 }, // CTO
        { wch: 12 }, // PON
        { wch: 30 }, // Links
        { wch: 25 }, // Problema
        { wch: 25 }, // Resolução
        { wch: 30 }, // Endereço
        { wch: 20 }, // Localização
        { wch: 20 }  // Observações
      ];
      ws['!cols'] = colWidths;

      // Criar workbook com metadados
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Relatório OS');
      
      // Adicionar sheet de resumo
      const resumoData = [
        ['Relatório de Ordens de Serviço', ''],
        ['Período:', `${dataInicio} até ${dataFim}`],
        ['Total de registros:', dadosRelatorio.length.toString()],
        ['Gerado em:', new Date().toLocaleDateString('pt-BR')],
        ['Hora:', new Date().toLocaleTimeString('pt-BR')],
        ['', ''],
        ['Resumo por Tipo:', ''],
        ...this.gerarResumoPorTipo(dadosRelatorio)
      ];
      
      const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
      wsResumo['!cols'] = [{ wch: 20 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');
      
      // Salvar arquivo
      const nomeArquivo = `relatorio-os-${dataInicio}-${dataFim}.xlsx`;
      XLSX.writeFile(wb, nomeArquivo);
      
      console.log('✅ [ExportadorRelatorios] Excel gerado com sucesso:', nomeArquivo);
    } catch (error) {
      console.error('❌ [ExportadorRelatorios] Erro ao gerar Excel:', error);
      throw new Error('Erro ao gerar relatório Excel');
    }
  }

  private gerarResumoPorTipo(dados: DadosRelatorio[]): Array<[string, string]> {
    const resumo: Record<string, number> = {};
    
    dados.forEach(item => {
      resumo[item.tipo] = (resumo[item.tipo] || 0) + 1;
    });
    
    return Object.entries(resumo).map(([tipo, quantidade]) => [
      `${tipo}:`, quantidade.toString()
    ]);
  }

  public filtrarPorData(
    formularios: FormularioSalvo[], 
    dataInicio: string, 
    dataFim: string
  ): FormularioSalvo[] {
    console.log('📅 [ExportadorRelatorios] Filtrando por data:', { dataInicio, dataFim, total: formularios.length });
    
    if (!dataInicio && !dataFim) {
      console.log('📅 Sem filtros de data, retornando todos os formulários');
      return formularios;
    }

    const filtrados = formularios.filter(formulario => {
      if (!formulario.dataCriacao) {
        console.log('⚠️ Formulário sem data de criação, incluindo na busca');
        return true;
      }

      const dataFormulario = new Date(formulario.dataCriacao);
      dataFormulario.setHours(0, 0, 0, 0); // Normalizar para início do dia
      
      let dentroDoIntervalo = true;

      if (dataInicio) {
        const inicio = new Date(dataInicio);
        inicio.setHours(0, 0, 0, 0);
        dentroDoIntervalo = dentroDoIntervalo && dataFormulario >= inicio;
      }

      if (dataFim) {
        const fim = new Date(dataFim);
        fim.setHours(23, 59, 59, 999); // Final do dia
        dentroDoIntervalo = dentroDoIntervalo && dataFormulario <= fim;
      }

      return dentroDoIntervalo;
    });

    console.log(`📅 Filtrado: ${filtrados.length} de ${formularios.length} formulários`);
    return filtrados;
  }

  public gerarEstatisticas(formularios: FormularioSalvo[]) {
    const stats = {
      total: formularios.length,
      porTipo: {} as Record<string, number>,
      porRegiao: {} as Record<string, number>,
      porMes: {} as Record<string, number>
    };

    formularios.forEach(formulario => {
      // Contar por tipo
      stats.porTipo[formulario.tipo] = (stats.porTipo[formulario.tipo] || 0) + 1;
      
      // Contar por região (se existir)
      const regiao = (formulario.dados as any).regiao;
      if (regiao) {
        stats.porRegiao[regiao] = (stats.porRegiao[regiao] || 0) + 1;
      }
      
      // Contar por mês
      if (formulario.dataCriacao) {
        const mes = new Date(formulario.dataCriacao).toLocaleDateString('pt-BR', { 
          year: 'numeric', 
          month: 'long' 
        });
        stats.porMes[mes] = (stats.porMes[mes] || 0) + 1;
      }
    });

    return stats;
  }
}

export const exportadorRelatorios = new ExportadorRelatorios();
