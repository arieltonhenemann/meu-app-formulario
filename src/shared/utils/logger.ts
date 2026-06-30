/**
 * Utilitário de log condicional.
 * Em produção (import.meta.env.PROD), nenhuma mensagem é exibida no console,
 * evitando vazamento de dados sensíveis (UIDs, emails, erros internos) para usuários finais.
 */
const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]): void => {
    if (isDev) console.log(...args);
  },
  warn: (...args: unknown[]): void => {
    if (isDev) console.warn(...args);
  },
  error: (...args: unknown[]): void => {
    if (isDev) console.error(...args);
  },
};
