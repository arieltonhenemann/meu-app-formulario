// Tipos compartilhados entre web e mobile
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  avatar?: string;
}

export interface Produto {
  id: string;
  nome: string;
  preco: number;
  descricao: string;
  imagem?: string;
}

export interface ApiResponse<T> {
  sucesso: boolean;
  dados?: T;
  erro?: string;
}

export interface ConfigApp {
  apiUrl: string;
  versao: string;
  ambiente: 'desenvolvimento' | 'producao';
}
