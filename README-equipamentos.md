# 📱 Sistema de Gestão de Equipamentos

Um sistema completo para gerenciar funcionários e seus equipamentos corporativos (notebooks, celulares e números de telefone), desenvolvido com React, TypeScript e Firebase.

## ✨ Funcionalidades Principais

### 👥 Gestão de Funcionários
- ✅ Cadastro completo de funcionários (nome, email, cargo, departamento, etc.)
- ✅ Listagem e busca de funcionários
- ✅ Edição de dados dos funcionários
- ✅ Sistema de ativação/desativação

### 💻 Gestão de Notebooks
- ✅ Cadastro detalhado (marca, modelo, configuração, etc.)
- ✅ Controle de status (disponível, em uso, manutenção, indisponível)
- ✅ Rastreamento de valores e datas de compra
- ✅ Sistema de números de série

### 📱 Gestão de Celulares
- ✅ Cadastro com IMEI e especificações
- ✅ Controle de status
- ✅ Informações de compra e valor

### 📞 Gestão de Números de Telefone
- ✅ Cadastro com operadora e plano
- ✅ Controle de valores mensais
- ✅ Data de ativação

### 🔗 Sistema de Vinculação
- ✅ Vinculação de equipamentos aos funcionários
- ✅ Controle automático de status (disponível → em uso)
- ✅ Histórico de vinculações
- ✅ Desvinculação com motivos
- ✅ Possibilidade de vincular múltiplos equipamentos

### 📊 Dashboard e Relatórios
- ✅ Visão geral de todos os equipamentos
- ✅ Estatísticas em tempo real
- ✅ Filtros por status e funcionários
- ✅ Relatórios de utilização

## 🚀 Como Usar

### 1. Configuração do Firebase

1. Acesse o [Firebase Console](https://console.firebase.google.com)
2. Crie um novo projeto
3. Ative o Firestore Database
4. Crie as regras de segurança adequadas
5. Copie as configurações do seu projeto

### 2. Configuração do Ambiente

1. Copie o arquivo `.env.example` para `.env`
2. Substitua as variáveis pelas suas configurações do Firebase:

```env
REACT_APP_FIREBASE_API_KEY=sua_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=seu_projeto_id
REACT_APP_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
REACT_APP_FIREBASE_APP_ID=seu_app_id
```

### 3. Instalação de Dependências

As dependências do Firebase já estão incluídas no `package.json`. Execute:

```bash
npm install
```

### 4. Importação dos Componentes

No seu arquivo `App.tsx` ou onde desejar usar o sistema:

```typescript
import React from 'react';
import { GestaoEquipamentos } from './components/GestaoEquipamentos';
import './styles/equipamentos.css';

function App() {
  return (
    <div className="App">
      <GestaoEquipamentos />
    </div>
  );
}

export default App;
```

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── GestaoEquipamentos.tsx        # Componente principal
│   ├── DashboardEquipamentos.tsx     # Dashboard com relatórios
│   ├── CadastroFuncionario.tsx       # Formulário de funcionários
│   ├── CadastroNotebook.tsx          # Formulário de notebooks
│   ├── CadastroCelular.tsx           # Formulário de celulares
│   ├── CadastroNumeroTelefone.tsx    # Formulário de números
│   └── VinculacaoEquipamentos.tsx    # Sistema de vinculação
├── services/
│   ├── funcionarioService.ts         # CRUD funcionários
│   ├── notebookService.ts            # CRUD notebooks
│   ├── celularService.ts             # CRUD celulares
│   ├── numeroTelefoneService.ts      # CRUD números
│   └── vinculacaoService.ts          # Lógica de vinculação
├── types/
│   └── equipment.ts                  # Interfaces TypeScript
├── config/
│   └── firebase.ts                   # Configuração Firebase
└── styles/
    └── equipamentos.css              # Estilos do sistema
```

## 🗄️ Estrutura do Banco (Firestore)

### Coleções:
- **funcionarios**: Dados dos funcionários
- **notebooks**: Informações dos notebooks
- **celulares**: Dados dos celulares
- **numerostelefone**: Números de telefone
- **vinculacoes**: Histórico de vinculações

### Exemplo de Documento (Funcionário):
```json
{
  "nome": "João Silva",
  "email": "joao@empresa.com",
  "cargo": "Desenvolvedor",
  "departamento": "TI",
  "dataAdmissao": "2024-01-15T00:00:00Z",
  "telefone": "(11) 99999-9999",
  "ativo": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

## 🎯 Fluxo de Trabalho

### 1. Cadastro Inicial
1. Cadastre funcionários
2. Cadastre notebooks, celulares e números
3. Os equipamentos ficam com status "disponível"

### 2. Vinculação
1. Use o sistema de vinculação
2. Selecione o funcionário
3. Escolha os equipamentos disponíveis
4. Confirme a vinculação
5. Status muda automaticamente para "em uso"

### 3. Gestão Contínua
1. Use o dashboard para visualizar tudo
2. Desvincule equipamentos quando necessário
3. Acompanhe relatórios de utilização

## 🎨 Características da Interface

- **Design Responsivo**: Funciona em desktop, tablet e mobile
- **Interface Intuitiva**: Navegação simples e clara
- **Feedback Visual**: Status coloridos e alertas informativos
- **Formulários Validados**: Validação em tempo real
- **Dashboard Interativo**: Cards informativos e filtros

## 🔧 Personalização

### Departamentos
Edite o arquivo `CadastroFuncionario.tsx` para adicionar/remover departamentos:

```typescript
<option value="TI">Tecnologia da Informação</option>
<option value="RH">Recursos Humanos</option>
// Adicione mais departamentos aqui
```

### Marcas de Equipamentos
Edite os arquivos de cadastro para personalizar as marcas disponíveis.

### Status Personalizados
Modifique o enum `StatusEquipamento` em `types/equipment.ts` para adicionar novos status.

## 🚀 Próximos Passos

Para expandir o sistema, você pode:

1. **Adicionar Autenticação**: Integrar Firebase Auth
2. **Controle de Permissões**: Diferentes níveis de acesso
3. **Mais Tipos de Equipamentos**: Monitores, tablets, etc.
4. **Relatórios Avançados**: Exportação para Excel/PDF
5. **Notificações**: Alertas para equipamentos em manutenção
6. **Histórico Detalhado**: Logs de todas as operações
7. **Integração com APIs**: Importação de dados de RH
8. **Backup Automático**: Rotinas de backup dos dados

## 🆘 Suporte

Este sistema foi projetado para ser completo e fácil de usar. As principais funcionalidades incluem:

- ✅ Cadastros completos e validados
- ✅ Sistema robusto de vinculação
- ✅ Dashboard com métricas em tempo real
- ✅ Interface responsiva e moderna
- ✅ Código TypeScript bem tipado
- ✅ Arquitetura escalável com Firebase

Aproveite o seu sistema de gestão de equipamentos! 🎉
