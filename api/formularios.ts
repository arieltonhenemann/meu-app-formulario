import type { VercelRequest, VercelResponse } from '@vercel/node';
import { cert, getApp, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, type DocumentData, type Firestore, type Query } from 'firebase-admin/firestore';
import { createHash, randomUUID, timingSafeEqual } from 'crypto';

// ============================================================
// Configuração do Firebase Admin SDK (inicialização preguiçosa)
// ============================================================
const initializeFirebaseAdmin = (): App => {
  if (getApps().length > 0) {
    return getApp();
  }

  // Opção 1: JSON completo da conta de serviço (recomendado)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      return initializeApp({
        credential: cert(serviceAccount),
      });
    } catch (error) {
      console.error('Erro ao inicializar Firebase com FIREBASE_SERVICE_ACCOUNT:', error);
    }
  }

  // Opção 2: Variáveis individuais
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    try {
      const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: formattedPrivateKey,
        }),
      });
    } catch (error) {
      console.error('Erro ao inicializar Firebase com variáveis individuais:', error);
    }
  }

  throw new Error(
    'Firebase Admin credentials não configuradas. Configure FIREBASE_SERVICE_ACCOUNT ou (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).'
  );
};

// ============================================================
// Utilitários de Segurança
// ============================================================

/**
 * Comparação de strings em tempo constante para prevenir timing attacks.
 * Retorna false se os comprimentos diferirem (evita vazar tamanho do token).
 */
const secureCompare = (a: string, b: string): boolean => {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
      // Executa a comparação de qualquer forma para não vazar timing via curto-circuito
      timingSafeEqual(bufA, Buffer.alloc(bufA.length));
      return false;
    }
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
};

/**
 * Valida e retorna origens CORS permitidas a partir da variável de ambiente.
 * Se ALLOWED_ORIGINS não estiver configurada, permite somente o domínio de produção
 * do próprio app na Vercel.
 */
const getAllowedOrigins = (): string[] => {
  const envOrigins = process.env.ALLOWED_ORIGINS;
  if (envOrigins) {
    return envOrigins.split(',').map(o => o.trim()).filter(Boolean);
  }
  // Fallback: domínio padrão do projeto na Vercel
  return ['https://meu-app-formulario.vercel.app'];
};

const setCorsHeaders = (req: VercelRequest, res: VercelResponse): void => {
  const origin = req.headers['origin'] as string | undefined;
  const allowedOrigins = getAllowedOrigins();

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
  res.setHeader('Access-Control-Max-Age', '600');
  res.setHeader('Vary', 'Origin');
};

/** Limita o tamanho máximo do payload JSON aceito (50 KB). */
const MAX_PAYLOAD_BYTES = 50 * 1024;

const isPayloadTooLarge = (body: unknown): boolean => {
  try {
    return Buffer.byteLength(JSON.stringify(body), 'utf8') > MAX_PAYLOAD_BYTES;
  } catch {
    return true;
  }
};

/** Retorna detalhes de erro somente em ambiente de desenvolvimento. */
const safeErrorDetails = (message: string): string | undefined => {
  return process.env.NODE_ENV === 'development' ? message : undefined;
};

/**
 * Identidade da integração: derivada do servidor, nunca do corpo da requisição.
 * A API usa o Admin SDK e ignora as regras do Firestore, então confiar em
 * `criadoPor` enviado pelo cliente permitiria falsificar autoria.
 */
const getIdentidadeIntegracao = () => ({
  uid: process.env.API_IDENTIDADE_UID || 'api_system',
  email: process.env.API_IDENTIDADE_EMAIL || 'api_system@internal.app',
  displayName: process.env.API_IDENTIDADE_NOME || 'API System',
});

/** Rate limit simples em memória (por instância da função). */
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 60;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

const aplicarRateLimit = (chave: string): boolean => {
  const agora = Date.now();
  const atual = rateBuckets.get(chave);

  if (!atual || agora >= atual.resetAt) {
    rateBuckets.set(chave, { count: 1, resetAt: agora + RATE_WINDOW_MS });
    return true;
  }
  if (atual.count >= RATE_MAX) return false;
  atual.count += 1;
  return true;
};

const chaveCliente = (req: VercelRequest, providedKey: string): string => {
  const encaminhado = req.headers['x-forwarded-for'];
  const ip = (typeof encaminhado === 'string' ? encaminhado.split(',')[0]?.trim() : '')
    || req.socket?.remoteAddress
    || 'ip-desconhecido';
  const hash = createHash('sha256').update(providedKey).digest('hex').slice(0, 16);
  return `${ip}:${hash}`;
};

/** Remove PII das respostas e mantém só o UID do criador. */
const projetarFormulario = (d: DocumentData, id: string) => ({
  id,
  tipo: d.tipo,
  status: d.status,
  codigoOS: d.codigoOS,
  dataCriacao: d.dataCriacao,
  dataModificacao: d.dataModificacao,
  criadoPor: d.criadoPor ? { uid: d.criadoPor.uid } : undefined,
  dados: d.dados,
});

/** Aceita apenas estruturas simples e bloqueia chaves de prototype pollution. */
const CHAVES_PROIBIDAS = new Set(['__proto__', 'constructor', 'prototype']);

const sanitizarDados = (valor: unknown, profundidade = 0): unknown => {
  if (profundidade > 3) throw new Error('estrutura muito profunda');

  if (valor === null || typeof valor === 'boolean' || typeof valor === 'number') return valor;

  if (typeof valor === 'string') {
    if (valor.length > 2000) throw new Error('texto muito longo');
    return valor;
  }

  if (Array.isArray(valor)) {
    if (valor.length > 200) throw new Error('lista muito grande');
    return valor.map(item => sanitizarDados(item, profundidade + 1));
  }

  if (typeof valor === 'object') {
    const entrada = valor as Record<string, unknown>;
    const chaves = Object.keys(entrada);
    if (chaves.length > 100) throw new Error('objeto muito grande');

    const saida: Record<string, unknown> = {};
    for (const chave of chaves) {
      if (CHAVES_PROIBIDAS.has(chave)) continue;
      saida[chave] = sanitizarDados(entrada[chave], profundidade + 1);
    }
    return saida;
  }

  throw new Error('tipo de dado inválido');
};

// ============================================================
// Handler principal
// ============================================================
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Configurar headers CORS
  setCorsHeaders(req, res);

  // Tratar requisições preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Validar autenticação (API Key — comparação em tempo constante)
  const apiSecretToken = process.env.API_SECRET_TOKEN;

  if (!apiSecretToken) {
    return res.status(500).json({
      error: 'Configuração do Servidor',
      message: 'O token secreto da API (API_SECRET_TOKEN) não está configurado no servidor.',
    });
  }

  const providedKey = (
    req.headers['x-api-key'] ||
    req.headers['authorization']?.toString().replace('Bearer ', '')
  ) as string | undefined;

  if (!providedKey || !secureCompare(providedKey, apiSecretToken)) {
    return res.status(401).json({
      error: 'Não Autorizado',
      message: "API Key inválida ou ausente. Forneça a chave no header 'x-api-key' ou 'Authorization: Bearer <token>'.",
    });
  }

  if (!aplicarRateLimit(chaveCliente(req, providedKey))) {
    return res.status(429).json({
      error: 'Muitas Requisições',
      message: 'Limite de requisições excedido. Tente novamente em instantes.',
    });
  }

  // 3. Inicializar Firebase Admin
  let db: Firestore;
  try {
    db = getFirestore(initializeFirebaseAdmin());
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Erro ao conectar ao Firebase:', message);
    return res.status(500).json({
      error: 'Erro do Servidor',
      message: 'Não foi possível conectar ao banco de dados.',
      details: safeErrorDetails(message),
    });
  }

  const collectionRef = db.collection('formularios');

  // ============================================================
  // 4. GET — Leitura de formulários
  // ============================================================
  if (req.method === 'GET') {
    try {
      const { tipo, status, limit, orderBy: orderField, codigoOS, id } = req.query;

      // Busca pontual por ID do documento (acesso direto e eficiente)
      if (id && typeof id === 'string') {
        const doc = await collectionRef.doc(id).get();
        if (!doc.exists) {
          return res.status(200).json([]);
        }
        return res.status(200).json([projetarFormulario(doc.data() || {}, doc.id)]);
      }

      let query: Query = collectionRef;

      // Filtros opcionais
      if (codigoOS) {
        query = query.where('codigoOS', '==', codigoOS);
      }
      if (tipo) {
        query = query.where('tipo', '==', tipo);
      }
      if (status) {
        query = query.where('status', '==', status);
      }

      // Ordenação: omitida quando codigoOS está presente para evitar índices compostos
      if (!codigoOS) {
        const CAMPOS_ORDENACAO_VALIDOS = ['dataModificacao', 'dataCriacao', 'codigoOS', 'status', 'tipo'];
        const field = typeof orderField === 'string' && CAMPOS_ORDENACAO_VALIDOS.includes(orderField) 
          ? orderField 
          : 'dataModificacao';
        query = query.orderBy(field, 'desc');
      }

      // Limite (Padrão: 50, Máximo: 100)
      const parsedLimit = Number.parseInt(String(limit ?? '50'), 10);
      const finalLimit = Number.isFinite(parsedLimit)
        ? Math.min(Math.max(parsedLimit, 1), 100)
        : 50;
      query = query.limit(finalLimit);

      const snapshot = await query.get();
      const docs: DocumentData[] = [];

      snapshot.forEach(doc => {
        docs.push(projetarFormulario(doc.data(), doc.id));
      });

      return res.status(200).json(docs);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Erro ao buscar formulários:', message);
      return res.status(500).json({
        error: 'Erro na Leitura',
        message: 'Erro ao ler formulários do banco de dados.',
        details: safeErrorDetails(message),
      });
    }
  }

  // ============================================================
  // 5. POST — Inserção de formulário
  // ============================================================
  if (req.method === 'POST') {
    try {
      const body = req.body;

      // Validação: body deve ser um objeto JSON
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return res.status(400).json({
          error: 'Corpo Inválido',
          message: 'O corpo da requisição deve ser um objeto JSON.',
        });
      }

      // Validação: tamanho máximo do payload (50 KB)
      if (isPayloadTooLarge(body)) {
        return res.status(413).json({
          error: 'Payload Muito Grande',
          message: 'O corpo da requisição excede o limite máximo de 50 KB.',
        });
      }

      const { tipo, dados, status: statusParam } = body as {
        tipo: unknown;
        dados: unknown;
        status?: unknown;
      };

      // Validação do tipo
      const tiposValidos = ['CTO', 'PON', 'LINK', 'ADEQUACAO'];
      if (!tipo || typeof tipo !== 'string' || !tiposValidos.includes(tipo)) {
        return res.status(400).json({
          error: 'Tipo Inválido',
          message: `O campo 'tipo' é obrigatório e deve ser um dos seguintes: ${tiposValidos.join(', ')}`,
        });
      }

      // Validação dos dados
      if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
        return res.status(400).json({
          error: 'Dados Inválidos',
          message: "O campo 'dados' é obrigatório e deve ser um objeto contendo as informações da O.S.",
        });
      }

      let dadosSanitizados: Record<string, unknown>;
      try {
        dadosSanitizados = sanitizarDados(dados) as Record<string, unknown>;
      } catch {
        return res.status(400).json({
          error: 'Dados Inválidos',
          message: 'A estrutura de dados contém campos ou valores não aceitos.',
        });
      }

      // Validação de status
      const statusValidos = ['pendente', 'finalizado', 'aguardando', 'agendamento'];
      const finalStatus =
        statusParam && typeof statusParam === 'string' && statusValidos.includes(statusParam)
          ? statusParam
          : 'pendente';

      // Identidade do criador: sempre derivada da configuração do servidor.
      // O campo `criadoPor` enviado pelo cliente é ignorado.
      const criadoPor = getIdentidadeIntegracao();

      // Gerar UUID e timestamps
      const id = randomUUID();
      const agora = new Date().toISOString();
      const codigoOS =
        typeof dadosSanitizados.codigoOS === 'string' && dadosSanitizados.codigoOS
          ? dadosSanitizados.codigoOS
          : `Sem código - ${id.slice(0, 6)}`;

      const novoFormulario = {
        id,
        tipo,
        status: finalStatus,
        dataCriacao: agora,
        dataModificacao: agora,
        dataAlteracaoStatus: agora,
        codigoOS,
        criadoPor,
        dados: dadosSanitizados,
      };

      // Salvar no Firestore usando o mesmo UUID como ID do documento
      await collectionRef.doc(id).set(novoFormulario);

      return res.status(201).json(projetarFormulario(novoFormulario, id));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Erro ao inserir formulário:', message);
      return res.status(500).json({
        error: 'Erro na Inserção',
        message: 'Erro ao gravar formulário no banco de dados.',
        details: safeErrorDetails(message),
      });
    }
  }

  // Método não suportado
  return res.status(405).json({
    error: 'Método Não Permitido',
    message: `Método ${req.method} não é suportado. Use GET ou POST.`,
  });
}
