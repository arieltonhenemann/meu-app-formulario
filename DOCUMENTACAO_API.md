# 🔌 Documentação da API de Formulários OS

Esta documentação explica como configurar, autenticar, consumir e integrar a API de escrita (inserção) e leitura de formulários do sistema. A API está implementada utilizando **Vercel Serverless Functions** (Node.js/TypeScript) e interage diretamente com o **Firebase Firestore** utilizando o Firebase Admin SDK.

---

## 🔄 Fluxo de Integração para Sistemas Parceiros

Se você está integrando um sistema externo (por exemplo, um robô de abertura automática de Ordens de Serviço), o fluxo recomendado é:

```mermaid
sequenceDiagram
    participant Sistema Externo
    participant API Vercel
    participant Banco Firestore
    
    Note over Sistema Externo: 1. Abre O.S. no parceiro
    Sistema Externo->>API Vercel: POST /api/formularios (Com dados + x-api-key)
    API Vercel->>Banco Firestore: Salva formulário com Status "pendente"
    Banco Firestore-->>API Vercel: Confirma gravação
    API Vercel-->>Sistema Externo: Retorna 201 Created (Com ID gerado e datas)
    
    Note over Sistema Externo: 2. Técnicos preenchem dados no app
    
    Note over Sistema Externo: 3. Consulta periódica ou final
    Sistema Externo->>API Vercel: GET /api/formularios?codigoOS=OS-12345 (Com x-api-key)
    API Vercel->>Banco Firestore: Busca documento por codigoOS
    Banco Firestore-->>API Vercel: Retorna dados atuais
    API Vercel-->>Sistema Externo: Retorna 200 OK (Com status e dados preenchidos)
```

1. **Criação da O.S. (POST):** Quando uma O.S. é gerada no sistema parceiro, ele dispara uma requisição POST contendo a propriedade `codigoOS` dentro do objeto `dados`. A API retornará o `id` exclusivo (UUID) e os metadados gerados pelo servidor.
2. **Consulta e Validação (GET):** O sistema parceiro pode realizar buscas periódicas enviando o parâmetro de busca `codigoOS` na query string da requisição para verificar se o formulário correspondente foi preenchido pelos técnicos em campo e ler os resultados atualizados.

---

## ⚙️ Configuração no Painel da Vercel

Para que a API funcione corretamente em produção, você precisa adicionar as seguintes **variáveis de ambiente (Environment Variables)** no painel do seu projeto na Vercel:

### 1. Autenticação da API
* **`API_SECRET_TOKEN`**: A chave/token secreto que você escolher para proteger a sua API contra acessos não autorizados. Os clientes deverão fornecer este token nas requisições.
  * *Exemplo:* `meu-token-secreto-super-seguro-123`

### 2. Credenciais do Firebase Admin
Como a API roda no lado do servidor (Serverless), ela precisa de acesso administrativo para interagir com o Firestore sem passar pelas regras de segurança de cliente. Você pode configurar as credenciais de duas maneiras na Vercel:

#### **Método A (Recomendado - Chave Única)**
* **`FIREBASE_SERVICE_ACCOUNT`**: O conteúdo completo em formato JSON do arquivo de chave privada da conta de serviço do Firebase.
  * Para obter este arquivo:
    1. Acesse o Console do Firebase -> Configurações do Projeto -> Contas de Serviço.
    2. Clique em **Gerar nova chave privada**.
    3. Copie o conteúdo do arquivo `.json` baixado e cole como valor desta variável de ambiente na Vercel.

#### **Método B (Chaves Individuais)**
Se preferir não usar o JSON completo em uma única variável, você pode criar estas três variáveis separadas:
* **`FIREBASE_PROJECT_ID`**: O ID do seu projeto Firebase (ex: `cadastros-equipamentos`).
* **`FIREBASE_CLIENT_EMAIL`**: O e-mail da conta de serviço (ex: `firebase-adminsdk-xxxxx@cadastros-equipamentos.iam.gserviceaccount.com`).
* **`FIREBASE_PRIVATE_KEY`**: A chave privada gerada no console (incluindo as partes `-----BEGIN PRIVATE KEY-----` e `-----END PRIVATE KEY-----`).

---

## 🔒 Autenticação

Todas as requisições para a API devem incluir o token configurado no header HTTP. Há duas formas suportadas para enviar a chave:

1. **Header Personalizado (`x-api-key`):**
   ```http
   x-api-key: SEU_API_SECRET_TOKEN
   ```

2. **Header de Autenticação Padrão (`Authorization`):**
   ```http
   Authorization: Bearer SEU_API_SECRET_TOKEN
   ```

Requisições sem o token ou com o token inválido retornarão `401 Unauthorized`.

---

## 📡 Endpoints

A URL base da sua API em produção será a URL do seu app na Vercel acrescida de `/api/formularios`.
* *Produção:* `https://meu-app-formulario.vercel.app/api/formularios`
* *Local:* `http://localhost:3000/api/formularios` (ao rodar com `vercel dev`)

---

### 1. Ler Formulários (GET)

Recupera uma lista de formulários salvos no Firestore, permitindo filtragens e buscas pontuais por identificadores exclusivos.

#### Parâmetros de Query (Opcionais)
* `id`: Filtra especificamente por um único ID gerado pela API (busca pontual e direta).
* `codigoOS`: Filtra pelo código de Ordem de Serviço preenchido na criação da O.S. (muito útil para integrações).
* `tipo`: Filtra pelo tipo de formulário (`CTO`, `PON`, `LINK`, `ADEQUACAO`).
* `status`: Filtra pelo status do formulário (`pendente`, `finalizado`, `aguardando`).
* `limit`: Limita o número de resultados (Padrão: `50`, Máximo: `100`).
* `orderBy`: Campo de ordenação (Padrão: `dataModificacao`). *Nota: Ignorado se `codigoOS` for fornecido para evitar erros de índices compostos.*

#### Exemplos de Requisição

```bash
# 1. Buscar uma O.S. específica pelo seu Código de Serviço (Integração)
curl -X GET "https://meu-app-formulario.vercel.app/api/formularios?codigoOS=OS-99882" \
  -H "x-api-key: SEU_API_SECRET_TOKEN"

# 2. Buscar pelo ID único do documento gerado na inserção
curl -X GET "https://meu-app-formulario.vercel.app/api/formularios?id=e2f47a61-9c12-40db-9087-fc068e1467ea" \
  -H "x-api-key: SEU_API_SECRET_TOKEN"

# 3. Listar as últimas 10 O.S. do tipo CTO pendentes
curl -X GET "https://meu-app-formulario.vercel.app/api/formularios?tipo=CTO&status=pendente&limit=10" \
  -H "x-api-key: SEU_API_SECRET_TOKEN"
```

```javascript
// Exemplo em JavaScript (Fetch) para buscar por codigoOS
const apiToken = "SEU_API_SECRET_TOKEN";
const codigoOS = "OS-99882";

fetch(`https://meu-app-formulario.vercel.app/api/formularios?codigoOS=${codigoOS}`, {
  method: "GET",
  headers: {
    "x-api-key": apiToken,
    "Content-Type": "application/json"
  }
})
.then(res => res.json())
.then(data => {
  if (data.length > 0) {
    console.log("Formulário encontrado:", data[0]);
  } else {
    console.log("Nenhum formulário encontrado para esta O.S.");
  }
})
.catch(err => console.error("Erro ao buscar:", err));
```

```python
# Exemplo em Python (Requests) para consultar o status de uma O.S.
import requests

url = "https://meu-app-formulario.vercel.app/api/formularios"
headers = {
    "x-api-key": "SEU_API_SECRET_TOKEN"
}
params = {
    "codigoOS": "OS-99882"
}

response = requests.get(url, headers=headers, params=params)
if response.status_code == 200:
    resultados = response.json()
    if resultados:
        print(f"Status da O.S.: {resultados[0]['status']}")
        print(f"Dados salvos: {resultados[0]['dados']}")
    else:
        print("O.S. não cadastrada no sistema de formulários.")
else:
    print(f"Erro {response.status_code}: {response.text}")
```

#### Resposta de Sucesso (`200 OK`)
Retorna um array JSON com os formulários correspondentes. Se nenhum for encontrado, retorna um array vazio `[]`.
```json
[
  {
    "id": "c1f7b8d4-51e1-4666-88b2-c70ac861fa50",
    "tipo": "CTO",
    "status": "pendente",
    "codigoOS": "OS-99882",
    "dataCriacao": "2026-06-01T22:30:00.000Z",
    "dataModificacao": "2026-06-01T22:30:00.000Z",
    "criadoPor": {
      "uid": "api_system",
      "email": "api_system@internal.app",
      "displayName": "API System"
    },
    "dados": {
      "codigoOS": "OS-99882",
      "cto": "CTO-A20",
      "regiao": "Norte",
      "upcOuApc": "APC",
      "splitter": "1x16",
      "identificada": "Sim",
      "nivelAntes": "-26.5",
      "nivelPos": "-19.2",
      "problema": "Sinal atenuado por curvatura",
      "resolucao": "Fibra reorganizada e conector limpo",
      "materialUtilizado": "Álcool isopropílico",
      "endereco": "Av. Brasil, 4520",
      "localizacao": "-25.4120,-49.2550"
    }
  }
]
```

---

### 2. Inserir Formulário (POST)

Cria um novo formulário no Firestore. O ID do formulário e as datas de criação/modificação serão gerados automaticamente.

#### Corpo da Requisição (JSON)
* `tipo` (obrigatório): `CTO`, `PON`, `LINK` ou `ADEQUACAO`.
* `dados` (obrigatório): Objeto contendo os campos específicos do formulário. A propriedade `codigoOS` deve estar incluída no nó `dados`.
* `status` (opcional): `pendente`, `finalizado` ou `aguardando`. (Padrão: `pendente`).
* `criadoPor` (opcional): Objeto contendo dados de identificação do autor (`uid` e `email` são obrigatórios se fornecido).

#### Estrutura dos Dados por Tipo de Formulário

##### Exemplo de payload para tipo `CTO`
```json
{
  "tipo": "CTO",
  "dados": {
    "codigoOS": "OS-99882",
    "cto": "CTO-A20",
    "regiao": "Norte",
    "upcOuApc": "APC",
    "splitter": "1x16",
    "identificada": "Sim",
    "nivelAntes": "-26.5",
    "nivelPos": "-19.2",
    "problema": "Sinal atenuado por curvatura de fibra externa",
    "resolucao": "Fibra reorganizada no poste e conector limpo",
    "materialUtilizado": "Álcool isopropílico, fita isolante",
    "endereco": "Av. Brasil, 4520",
    "localizacao": "-25.4120,-49.2550"
  }
}
```

##### Exemplo de payload para tipo `PON`
```json
{
  "tipo": "PON",
  "dados": {
    "codigoOS": "OS-99883",
    "olt": "OLT-01",
    "slot": "3",
    "pon": "4",
    "idOnu": "12",
    "tipoOnu": "Wi-Fi AC",
    "sn": "FHTT12345678",
    "sinalAntes": "-30",
    "sinalPos": "-20",
    "problema": "ONU desalinhada",
    "resolucao": "Troca de conector mecânico no cliente",
    "materialUtilizado": "1 Conector Click Fast",
    "endereco": "Rua das Flores, 12",
    "localizacao": "-25.4320,-49.2780"
  }
}
```

##### Exemplo de payload para tipo `LINK`
```json
{
  "tipo": "LINK",
  "dados": {
    "codigoOS": "OS-99884",
    "designacao": "LINK-MATRIZ-FILIAL",
    "regiao": "Sul",
    "tipoPorta": "Giga",
    "gponOuMetro": "MetroEthernet",
    "upcOuApc": "UPC",
    "identificada": "Sim",
    "sinal": "-10",
    "problema": "Sem problemas encontrados",
    "resolucao": "Instalação de link dedicada com teste de throughput",
    "materialUtilizado": "1 Cordão óptico LC-LC UPC 3m",
    "endereco": "Alameda Cabral, 123",
    "localizacao": "-25.4290,-49.2760"
  }
}
```

##### Exemplo de payload para tipo `ADEQUACAO`
```json
{
  "tipo": "ADEQUACAO",
  "dados": {
    "codigoOS": "OS-99885",
    "tipoServico": "Retirada",
    "tipoInfra": "Aérea",
    "materialUtilizado": "Nenhum",
    "problema": "Cliente cancelado",
    "resolucao": "Retirada de cabo drop e ONU do cliente",
    "endereco": "Rua XV de Novembro, 200",
    "localizacao": "-25.4277,-49.2611"
  }
}
```

#### Exemplos de Requisição

```bash
# Inserir formulário CTO via cURL
curl -X POST "https://meu-app-formulario.vercel.app/api/formularios" \
  -H "x-api-key: SEU_API_SECRET_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "CTO",
    "dados": {
      "codigoOS": "OS-99882",
      "cto": "CTO-A20",
      "regiao": "Norte",
      "upcOuApc": "APC",
      "splitter": "1x16",
      "identificada": "Sim",
      "nivelAntes": "-26.5",
      "nivelPos": "-19.2",
      "problema": "Sinal atenuado",
      "resolucao": "Conector limpo",
      "materialUtilizado": "Álcool isopropílico",
      "endereco": "Av. Brasil, 4520",
      "localizacao": "-25.4120,-49.2550"
    }
  }'
```

```javascript
// Inserir via JavaScript (Fetch)
const payload = {
  tipo: "CTO",
  dados: {
    codigoOS: "OS-99882",
    cto: "CTO-A20",
    regiao: "Norte",
    upcOuApc: "APC",
    splitter: "1x16",
    identificada: "Sim",
    nivelAntes: "-26.5",
    nivelPos: "-19.2",
    problema: "Sinal atenuado",
    resolucao: "Conector limpo",
    materialUtilizado: "Álcool isopropílico",
    endereco: "Av. Brasil, 4520",
    localizacao: "-25.4120,-49.2550"
  }
};

fetch("https://meu-app-formulario.vercel.app/api/formularios", {
  method: "POST",
  headers: {
    "x-api-key": "SEU_API_SECRET_TOKEN",
    "Content-Type": "application/json"
  },
  body: JSON.stringify(payload)
})
.then(res => res.json())
.then(data => console.log("Salvo com sucesso!", data))
.catch(err => console.error(err));
```

```python
# Inserir via Python (Criar novo formulário a partir do robô)
import requests

url = "https://meu-app-formulario.vercel.app/api/formularios"
headers = {
    "x-api-key": "SEU_API_SECRET_TOKEN",
    "Content-Type": "application/json"
}
payload = {
    "tipo": "CTO",
    "dados": {
        "codigoOS": "OS-99882",
        "cto": "CTO-A20",
        "regiao": "Norte",
        "upcOuApc": "APC",
        "splitter": "1x16",
        "identificada": "Sim",
        "nivelAntes": "-26.5",
        "nivelPos": "-19.2",
        "problema": "Sinal atenuado",
        "resolucao": "Conector limpo",
        "materialUtilizado": "Álcool isopropílico",
        "endereco": "Av. Brasil, 4520",
        "localizacao": "-25.4120,-49.2550"
    }
}

response = requests.post(url, headers=headers, json=payload)
if response.status_code == 201:
    dados_criados = response.json()
    print(f"Formulário criado com sucesso. ID gerado: {dados_criados['id']}")
else:
    print(f"Falha na criação. Código: {response.status_code}, Erro: {response.text}")
```

#### Resposta de Sucesso (`201 Created`)
Retorna o objeto criado com as propriedades geradas automaticamente (`id`, `dataCriacao`, `dataModificacao`, `status`, `criadoPor`).
```json
{
  "id": "e2f47a61-9c12-40db-9087-fc068e1467ea",
  "tipo": "CTO",
  "status": "pendente",
  "dataCriacao": "2026-06-01T22:31:40.123Z",
  "dataModificacao": "2026-06-01T22:31:40.123Z",
  "codigoOS": "OS-99882",
  "criadoPor": {
    "uid": "api_system",
    "email": "api_system@internal.app",
    "displayName": "API System"
  },
  "dados": {
    "codigoOS": "OS-99882",
    "cto": "CTO-A20",
    "regiao": "Norte",
    "upcOuApc": "APC",
    "splitter": "1x16",
    "identificada": "Sim",
    "nivelAntes": "-26.5",
    "nivelPos": "-19.2",
    "problema": "Sinal atenuado",
    "resolucao": "Conector limpo",
    "materialUtilizado": "Álcool isopropílico",
    "endereco": "Av. Brasil, 4520",
    "localizacao": "-25.4120,-49.2550"
  }
}
```

---

## 🚫 Códigos de Erro HTTP Comuns

* **`400 Bad Request`**: Parâmetros inválidos ou corpo da requisição JSON malformado (por exemplo, payload vazio ou tipo incorreto).
* **`401 Unauthorized`**: Token de autenticação inválido ou ausente no header (`x-api-key` ou `Authorization`).
* **`405 Method Not Allowed`**: Método HTTP não suportado (ex: usar PUT ou DELETE).
* **`500 Internal Server Error`**: Erro de configuração das credenciais Firebase no servidor ou falha ao salvar dados no Firestore.
