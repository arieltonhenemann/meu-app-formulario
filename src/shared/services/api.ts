// Serviço de API compartilhado entre web e mobile
import { ApiResponse, Usuario, Produto } from '../types';

const API_BASE_URL = 'https://api.meuapp.com'; // Substitua pela sua API

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          sucesso: false,
          erro: data.message || 'Erro na requisição',
        };
      }

      return {
        sucesso: true,
        dados: data,
      };
    } catch (error) {
      return {
        sucesso: false,
        erro: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  // Métodos para usuários
  async obterUsuario(id: string): Promise<ApiResponse<Usuario>> {
    return this.request<Usuario>(`/usuarios/${id}`);
  }

  async criarUsuario(usuario: Omit<Usuario, 'id'>): Promise<ApiResponse<Usuario>> {
    return this.request<Usuario>('/usuarios', {
      method: 'POST',
      body: JSON.stringify(usuario),
    });
  }

  // Métodos para produtos
  async listarProdutos(): Promise<ApiResponse<Produto[]>> {
    return this.request<Produto[]>('/produtos');
  }

  async obterProduto(id: string): Promise<ApiResponse<Produto>> {
    return this.request<Produto>(`/produtos/${id}`);
  }
}

export const apiService = new ApiService();
