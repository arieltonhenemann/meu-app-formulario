// Hook compartilhado para gerenciar estado do usuário
import { useState, useEffect } from 'react';
import { Usuario, ApiResponse } from '../types';
import { apiService } from '../services/api';

export const useUsuario = (userId?: string) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregarUsuario = async (id: string) => {
    setCarregando(true);
    setErro(null);
    
    try {
      const response: ApiResponse<Usuario> = await apiService.obterUsuario(id);
      
      if (response.sucesso && response.dados) {
        setUsuario(response.dados);
      } else {
        setErro(response.erro || 'Erro ao carregar usuário');
      }
    } catch (error) {
      setErro('Erro inesperado ao carregar usuário');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (userId) {
      carregarUsuario(userId);
    }
  }, [userId]);

  return {
    usuario,
    carregando,
    erro,
    recarregar: () => userId && carregarUsuario(userId),
  };
};
