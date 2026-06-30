import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';
import { randomUUID, timingSafeEqual } from 'crypto';

// ============================================================
// Configuração do Firebase Admin SDK (inicialização preguiçosa)
// ============================================================
const initializeFirebaseAdmin = () => {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Opção 1: JSON completo da conta de serviço (recomendado)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error) {
      console.error('Erro ao inicializar Firebase com FIREBASE_SERVICE_ACCOUNT:', error);
    }
  }

  // Opção 2: Variáveis individuais
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    try {
      const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
      return admin.initializeApp({
        credential: admin.credential.cert({
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
  } else if (!origin) {
    // Requisições server-to-server (sem header Origin) são permitidas —
    // a autenticação via API Key é o controle de acesso real nesses casos.
    res.setHeader('Access-Control-Allow-Origin', 'null');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
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

  // 3. Inicializar Firebase Admin
  let db: admin.firestore.Firestore;
  try {
    initializeFirebaseAdmin();
    db = admin.firestore();
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
        return res.status(200).json([{ id: doc.id, ...doc.data() }]);
      }

      let query: admin.firestore.Query = collectionRef;

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
      const parsedLimit = limit ? parseInt(limit.toString(), 10) : 50;
      const finalLimit = Math.min(Math.max(parsedLimit, 1), 100);
      query = query.limit(finalLimit);

      const snapshot = await query.get();
      const docs: admin.firestore.DocumentData[] = [];

      snapshot.forEach(doc => {
        docs.push({ id: doc.id, ...doc.data() });
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

      const { tipo, dados, status: statusParam, criadoPor: criadoPorParam } = body as {
        tipo: unknown;
        dados: unknown;
        status?: unknown;
        criadoPor?: unknown;
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

      // Validação de status
      const statusValidos = ['pendente', 'finalizado', 'aguardando'];
      const finalStatus =
        statusParam && typeof statusParam === 'string' && statusValidos.includes(statusParam)
          ? statusParam
          : 'pendente';

      // Identidade do criador
      const isValidCriadoPor =
        criadoPorParam &&
        typeof criadoPorParam === 'object' &&
        !Array.isArray(criadoPorParam) &&
        typeof (criadoPorParam as Record<string, unknown>).uid === 'string' &&
        typeof (criadoPorParam as Record<string, unknown>).email === 'string';

      const criadoPor = isValidCriadoPor
        ? {
            uid: (criadoPorParam as Record<string, unknown>).uid as string,
            email: (criadoPorParam as Record<string, unknown>).email as string,
            displayName: ((criadoPorParam as Record<string, unknown>).displayName as string) || null,
          }
        : {
            uid: 'api_system',
            email: 'api_system@internal.app',
            displayName: 'API System',
          };

      // Gerar UUID e timestamps
      const id = randomUUID();
      const agora = new Date().toISOString();
      const dadosObj = dados as Record<string, unknown>;
      const codigoOS =
        typeof dadosObj.codigoOS === 'string' && dadosObj.codigoOS
          ? dadosObj.codigoOS
          : `Sem código - ${id.slice(0, 6)}`;

      const novoFormulario = {
        id,
        tipo,
        status: finalStatus,
        dataCriacao: agora,
        dataModificacao: agora,
        codigoOS,
        criadoPor,
        dados,
      };

      // Salvar no Firestore usando o mesmo UUID como ID do documento
      await collectionRef.doc(id).set(novoFormulario);

      return res.status(201).json(novoFormulario);
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
