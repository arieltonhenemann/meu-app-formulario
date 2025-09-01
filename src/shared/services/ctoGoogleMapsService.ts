// Serviço para extrair dados de CTOs do Google My Maps público

export interface CTOData {
  codigo: string;
  nome: string;
  endereco: string;
  coordenadas: {
    lat: number;
    lng: number;
  };
  regiao?: string;
  observacoes?: string;
}

class CTOGoogleMapsService {
  private readonly MAP_ID = '1fC5GE_YbqwckRgHF29Hlt0SelrlklZR5';
  private readonly BASE_URL = 'https://www.google.com/maps/d/u/0/viewer';
  private ctosCache: CTOData[] = [];
  private lastUpdate: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  /**
   * Extrai dados do KML do Google My Maps
   */
  private async extrairDadosKML(): Promise<CTOData[]> {
    console.log('🗺️ [CTOGoogleMapsService] Extraindo dados do Google My Maps');

    try {
      // URL do KML público do Google My Maps
      const kmlUrl = `https://www.google.com/maps/d/u/0/kml?mid=${this.MAP_ID}`;
      
      console.log('📡 Tentando buscar KML:', kmlUrl);
      
      // Fazer requisição para o KML
      const response = await fetch(kmlUrl, {
        mode: 'cors',
        headers: {
          'Accept': 'application/vnd.google-earth.kml+xml, application/xml, text/xml'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const kmlText = await response.text();
      console.log('📄 KML recebido, tamanho:', kmlText.length);

      // Parse do XML/KML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(kmlText, 'text/xml');

      // Verificar se há erros de parsing
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        throw new Error('Erro ao fazer parse do KML');
      }

      // Extrair placemarks (marcadores)
      const placemarks = xmlDoc.querySelectorAll('Placemark');
      console.log('📍 Encontrados', placemarks.length, 'placemarks');

      const ctos: CTOData[] = [];

      placemarks.forEach((placemark, index) => {
        try {
          // Nome do placemark
          const nomeElement = placemark.querySelector('name');
          const nome = nomeElement?.textContent?.trim() || `CTO_${index + 1}`;

          // Descrição (pode conter informações extras)
          const descricaoElement = placemark.querySelector('description');
          const descricao = descricaoElement?.textContent?.trim() || '';

          // Coordenadas
          const coordinatesElement = placemark.querySelector('coordinates');
          const coordinatesText = coordinatesElement?.textContent?.trim();

          if (coordinatesText) {
            // Formato: longitude,latitude,altitude
            const coords = coordinatesText.split(',');
            const lng = parseFloat(coords[0]);
            const lat = parseFloat(coords[1]);

            if (!isNaN(lat) && !isNaN(lng)) {
              // Extrair código CTO do nome (assumindo que está no início)
              const codigoMatch = nome.match(/^([A-Z0-9-]+)/);
              const codigo = codigoMatch ? codigoMatch[1] : nome.substring(0, 10);

              const ctoData: CTOData = {
                codigo: codigo.toUpperCase(),
                nome: nome,
                endereco: this.extrairEndereco(nome, descricao),
                coordenadas: { lat, lng },
                regiao: this.extrairRegiao(nome, descricao),
                observacoes: descricao
              };

              ctos.push(ctoData);
              console.log('✅ CTO processada:', ctoData.codigo, '-', ctoData.endereco);
            }
          }
        } catch (error) {
          console.warn('⚠️ Erro ao processar placemark:', error);
        }
      });

      console.log('✅ [CTOGoogleMapsService] Extraídas', ctos.length, 'CTOs');
      return ctos;

    } catch (error) {
      console.error('❌ [CTOGoogleMapsService] Erro ao extrair dados:', error);
      
      // Fallback: usar dados de exemplo se não conseguir acessar
      console.log('🔄 Usando dados de exemplo como fallback');
      return this.getDadosExemplo();
    }
  }

  /**
   * Extrai endereço do nome ou descrição
   */
  private extrairEndereco(nome: string, descricao: string): string {
    // Tentar extrair endereço da descrição primeiro
    if (descricao) {
      // Procurar por padrões de endereço
      const enderecoMatch = descricao.match(/(?:Endereço|Rua|Av|Avenida|Praça)[:\s]+([^<\n]+)/i);
      if (enderecoMatch) {
        return enderecoMatch[1].trim();
      }
    }

    // Se não encontrar na descrição, tentar extrair do nome
    const parts = nome.split(' - ');
    if (parts.length > 1) {
      return parts.slice(1).join(' - ').trim();
    }

    // Fallback: usar o nome completo
    return nome;
  }

  /**
   * Extrai região do nome ou descrição
   */
  private extrairRegiao(nome: string, descricao: string): string {
    // Procurar por indicações de região
    const regiaoPatterns = [
      /(?:Região|Bairro|Zona)[:\s]+([^<\n,]+)/i,
      /(?:Centro|Norte|Sul|Leste|Oeste|Industrial)/i
    ];

    for (const pattern of regiaoPatterns) {
      const match = (descricao + ' ' + nome).match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }

    return 'Não especificada';
  }

  /**
   * Dados de exemplo caso não consiga acessar o Google Maps
   */
  private getDadosExemplo(): CTOData[] {
    return [
      {
        codigo: 'CTO001',
        nome: 'CTO001 - Centro da Cidade',
        endereco: 'Rua XV de Novembro, 123 - Centro',
        coordenadas: { lat: -25.4284, lng: -49.2733 },
        regiao: 'Centro'
      },
      {
        codigo: 'CTO002', 
        nome: 'CTO002 - Bairro Industrial',
        endereco: 'Av. das Indústrias, 456 - Industrial',
        coordenadas: { lat: -25.4500, lng: -49.3000 },
        regiao: 'Industrial'
      }
    ];
  }

  /**
   * Buscar CTO por código
   */
  public async buscarCTO(codigo: string): Promise<CTOData | null> {
    console.log('🔍 [CTOGoogleMapsService] Buscando CTO:', codigo);
    
    await this.atualizarCache();
    
    const codigoNormalizado = codigo.trim().toUpperCase();
    const cto = this.ctosCache.find(c => c.codigo === codigoNormalizado);
    
    if (cto) {
      console.log('✅ CTO encontrada:', cto);
      return cto;
    }

    console.log('❌ CTO não encontrada:', codigoNormalizado);
    return null;
  }

  /**
   * Buscar CTOs por região
   */
  public async buscarPorRegiao(regiao: string): Promise<CTOData[]> {
    await this.atualizarCache();
    
    return this.ctosCache.filter(cto => 
      cto.regiao?.toLowerCase().includes(regiao.toLowerCase()) ||
      cto.endereco.toLowerCase().includes(regiao.toLowerCase())
    );
  }

  /**
   * Listar todas as CTOs
   */
  public async listarTodas(): Promise<CTOData[]> {
    await this.atualizarCache();
    return [...this.ctosCache];
  }

  /**
   * Buscar CTOs próximas a uma coordenada
   */
  public async buscarProximas(lat: number, lng: number, raioKm: number = 5): Promise<CTOData[]> {
    await this.atualizarCache();

    return this.ctosCache.filter(cto => {
      const distancia = this.calcularDistancia(lat, lng, cto.coordenadas.lat, cto.coordenadas.lng);
      return distancia <= raioKm;
    });
  }

  /**
   * Atualizar cache se necessário
   */
  private async atualizarCache(): Promise<void> {
    const agora = Date.now();
    
    if (this.ctosCache.length === 0 || (agora - this.lastUpdate) > this.CACHE_DURATION) {
      console.log('🔄 [CTOGoogleMapsService] Atualizando cache');
      
      try {
        this.ctosCache = await this.extrairDadosKML();
        this.lastUpdate = agora;
        console.log('✅ Cache atualizado com', this.ctosCache.length, 'CTOs');
      } catch (error) {
        console.error('❌ Erro ao atualizar cache:', error);
        // Se falhar e não tiver dados, usar exemplos
        if (this.ctosCache.length === 0) {
          this.ctosCache = this.getDadosExemplo();
        }
      }
    }
  }

  /**
   * Calcular distância entre duas coordenadas (Haversine)
   */
  private calcularDistancia(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Obter estatísticas do cache
   */
  public async getEstatisticas(): Promise<{ 
    total: number; 
    regioes: string[]; 
    ultimaAtualizacao: Date 
  }> {
    await this.atualizarCache();
    
    const regioesMap = this.ctosCache.map(cto => cto.regiao).filter(Boolean) as string[];
    const regioes = Array.from(new Set(regioesMap));
    
    return {
      total: this.ctosCache.length,
      regioes: regioes as string[],
      ultimaAtualizacao: new Date(this.lastUpdate)
    };
  }

  /**
   * Forçar atualização do cache
   */
  public async forcarAtualizacao(): Promise<void> {
    console.log('🔄 Forçando atualização do cache');
    this.lastUpdate = 0; // Forçar atualização
    await this.atualizarCache();
  }
}

export const ctoGoogleMapsService = new CTOGoogleMapsService();
