# Sistema de Formulários OS

> Plataforma web para registro, gerenciamento e integração de Ordens de Serviço técnicas em campo.

[![Deploy](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://meu-app-formulario.vercel.app)
[![Firebase](https://img.shields.io/badge/Banco-Firebase_Firestore-orange?logo=firebase)](https://firebase.google.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev)

---

## Sobre o Projeto

Sistema web desenvolvido para o registro de Ordens de Serviço de infraestrutura óptica (CTO, PON, LINK e ADEQUAÇÃO). Permite que técnicos de campo criem e atualizem formulários de OS através da interface web, e que sistemas parceiros integrem suas operações via **API REST** para criação e leitura automática de formulários.

### Principais Funcionalidades

- 📋 **4 tipos de formulário**: CTO, PON, LINK e ADEQUAÇÃO
- 🔄 **Gestão de status**: Pendente → Aguardando → Finalizado
- 👥 **Controle de acesso**: Cadastro de usuários com aprovação manual pelo administrador
- 🛡️ **Painel administrativo**: Aprovação/rejeição de usuários e logs de auditoria
- 📊 **Relatórios**: Exportação em PDF e Excel
- 📄 **Exportação TXT**: Geração de arquivo de texto com resumo da OS
- 🌐 **API REST**: Integração com sistemas externos para criação e leitura de formulários
- 📶 **Suporte offline**: Dados salvos localmente e sincronizados ao reconectar
- 🔔 **Notificações**: Sistema de toasts não-bloqueantes

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Frontend** | React 19, TypeScript, Vite |
| **Backend (API)** | Vercel Serverless Functions (Node.js/TypeScript) |
| **Banco de dados** | Firebase Firestore |
| **Autenticação** | Firebase Authentication |
| **Hospedagem** | Vercel |
| **Exportação** | jsPDF, jspdf-autotable, SheetJS (xlsx) |

---

## Pré-requisitos

- [Node.js](https://nodejs.org) 18+
- [Vercel CLI](https://vercel.com/docs/cli) (para rodar a API localmente)
- Conta no [Firebase](https://firebase.google.com)
- Conta na [Vercel](https://vercel.com)

---

## Configuração do Ambiente

### 1. Clonar e instalar dependências

```bash
git clone https://github.com/seu-usuario/meu-app-formulario.git
cd meu-app-formulario
npm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo de exemplo e preencha com seus valores:

```bash
cp .env.example .env
```

Edite o `.env` com as configurações do Firebase e do token da API. Consulte o `.env.example` para ver todas as variáveis necessárias e suas descrições.

### 3. Rodar localmente (Frontend + API)

```bash
npx vercel dev
```

> ⚠️ Use sempre `vercel dev` para desenvolvimento local. O comando `npm start` inicia apenas o frontend Vite, sem a API Serverless.

Acesse em: `http://localhost:3000`

---

## Estrutura do Projeto

```
meu-app-formulario/
├── api/
│   └── formularios.ts          # API Serverless — endpoint REST principal
├── src/
│   ├── App.tsx                  # Componente raiz (ErrorBoundary + AuthProvider)
│   ├── components/              # Componentes de página e UI
│   │   ├── Login.tsx
│   │   ├── SystemController.tsx # Roteamento interno entre telas
│   │   ├── GerenciarFormularios.tsx
│   │   ├── FormularioOS.tsx     # Formulário CTO
│   │   ├── FormularioPON.tsx
│   │   ├── FormularioLINK.tsx
│   │   ├── FormularioAdequacao.tsx
│   │   ├── AdminPanel.tsx
│   │   ├── RelatoriosPage.tsx
│   │   ├── LogsAuditoriaPage.tsx
│   │   └── ProtectedRoute.tsx
│   └── shared/
│       ├── components/          # Componentes reutilizáveis (Toast, ErrorBoundary)
│       ├── contexts/            # AuthContext — estado global de autenticação
│       ├── services/            # Serviços Firebase (auth, formulários, auditoria, usuários)
│       ├── types/               # Interfaces e tipos TypeScript
│       └── utils/               # Helpers de exportação, auditoria e formatação
├── firestore.rules              # Regras de segurança do Firestore
├── .env.example                 # Modelo de variáveis de ambiente
├── DOCUMENTACAO_API.md          # Documentação completa da API REST
├── vercel.json                  # Configuração de rotas da Vercel
└── vite.config.ts
```

---

## API REST

A API permite que sistemas externos criem e consultem formulários de OS programaticamente. Toda requisição deve incluir o token de autenticação no header.

```http
POST /api/formularios        # Criar novo formulário
GET  /api/formularios        # Listar e filtrar formulários
GET  /api/formularios?id=... # Buscar por ID único
GET  /api/formularios?codigoOS=... # Buscar por código de OS
```

Consulte a **[documentação completa da API](./DOCUMENTACAO_API.md)** para exemplos de requisição em cURL, JavaScript e Python, estrutura dos payloads por tipo de formulário e todos os filtros disponíveis.

### Exemplo rápido — criar um formulário CTO

```bash
curl -X POST "https://meu-app-formulario.vercel.app/api/formularios" \
  -H "x-api-key: SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "CTO",
    "dados": {
      "codigoOS": "OS-12345",
      "cto": "CTO-A01",
      "regiao": "Centro",
      "problema": "Sem sinal",
      "resolucao": "Conector refeito",
      "endereco": "Rua Principal, 100"
    }
  }'
```

---

## Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Chave de API do Firebase (frontend) | ✅ |
| `VITE_FIREBASE_AUTH_DOMAIN` | Domínio de autenticação Firebase | ✅ |
| `VITE_FIREBASE_PROJECT_ID` | ID do projeto Firebase | ✅ |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket de armazenamento Firebase | ✅ |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ID do remetente Firebase | ✅ |
| `VITE_FIREBASE_APP_ID` | ID do app Firebase | ✅ |
| `API_SECRET_TOKEN` | Token secreto para autenticar requisições na API | ✅ |
| `FIREBASE_SERVICE_ACCOUNT` | JSON da Service Account Firebase (para a API) | ✅ |
| `ALLOWED_ORIGINS` | Origens CORS permitidas, separadas por vírgula | Opcional |

> As variáveis prefixadas com `VITE_` são usadas pelo frontend (Vite). As demais são usadas pela API Serverless na Vercel e **não devem ser prefixadas com `VITE_`**.

---

## Segurança

- **Autenticação da API**: Token via header `x-api-key` com comparação em tempo constante (proteção contra timing attacks)
- **CORS configurável**: Origens permitidas definidas via variável de ambiente `ALLOWED_ORIGINS`
- **Limite de payload**: Requisições POST com body acima de 50 KB são rejeitadas
- **Erros opacos**: Detalhes de erro interno não são expostos em produção
- **Regras do Firestore**: Usuários só leem/escrevem os próprios formulários; admins têm acesso total
- **Aprovação de usuários**: Novos cadastros ficam pendentes até aprovação manual pelo administrador
- **Logs de auditoria**: Todas as ações relevantes são registradas na coleção `logs_auditoria`

---

## Deploy

O projeto é implantado automaticamente na Vercel a cada push na branch principal.

### Configurar variáveis na Vercel

1. Acesse o painel do projeto em [vercel.com](https://vercel.com)
2. Vá em **Settings → Environment Variables**
3. Adicione todas as variáveis listadas acima (seção Variáveis de Ambiente)

### Build manual

```bash
npm run build
```

---

## Licença

Uso interno. Todos os direitos reservados.
