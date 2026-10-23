// Utilitários compartilhados entre web e mobile

export const formatarMoeda = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
};

export const formatarData = (data: Date): string => {
  return new Intl.DateTimeFormat('pt-BR').format(data);
};

// Formata a data/hora no padrão dd/mm/aaaa hh:mm:ss
export const formatarDataHora = (data: Date = new Date()): string => {
  const pad = (valor: number): string => String(valor).padStart(2, '0');
  return `${pad(data.getDate())}/${pad(data.getMonth() + 1)}/${data.getFullYear()} ${pad(data.getHours())}:${pad(data.getMinutes())}:${pad(data.getSeconds())}`;
};

export const validarEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const gerarId = (): string => {
  return crypto.randomUUID();
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};
