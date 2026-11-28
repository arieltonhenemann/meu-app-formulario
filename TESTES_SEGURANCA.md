# Roteiro de testes — correções de segurança

Execute na pasta do projeto. Os testes automatizados já passaram nesta branch; os manuais
confirmam o comportamento em produção/local com o Firebase real.

## 1. Automatizados

```powershell
npm run build
npm run check:seguranca
npm audit --omit=dev
npx tsc --noEmit --target ES2020 --module commonjs --moduleResolution node --esModuleInterop --skipLibCheck --strict api/formularios.ts
```

Esperado:

- `build` termina com `✓ built` (avisos antigos de chunk/import dinâmico são tolerados).
- `check:seguranca` imprime `✅ OK: firebase-admin não é importado pelo cliente.`
- `npm audit --omit=dev` imprime `found 0 vulnerabilities`.
- O `tsc` da API não imprime erros.

## 2. Publicar as regras (obrigatório)

```powershell
firebase deploy --only firestore:rules --project <seu-projeto>
```

Sem isso, a produção continua com as regras antigas. Confirme no Firebase Console que
`firestore.rules` exibe `isValidAuditoriaLog()` com `usuarioId` e `usuarioEmail`.

## 3. App em `http://localhost:3000`

1. `npm start` (ou `npx vercel dev` para incluir a API).
2. Abrir `http://localhost:3000` — deve retornar 200 e o título
   `Codryx Tech - Gerenciamento de O.S`.
3. Console do navegador sem erros (`F12 → Console`).
4. Login, criação de O.S. CTO/PON/LINK/ADEQUAÇÃO e exportação TXT/PDF/Excel devem
   continuar funcionando (valida as atualizações de jsPDF, SheetJS e Firebase).

## 4. Autorização no Firestore

1. Cadastre um usuário novo e tente entrar: deve continuar **pendente** e não aprovar a si mesmo.
2. Logado como admin, aprove o usuário pelo painel — aprovação deve funcionar normalmente.
3. Como usuário comum, confirme que edição/exclusão de O.S. de outro usuário é negada.
4. Como admin, mude o status de uma O.S. aberta com o usuário comum logado em outra aba:
   a lista/dashboard dele deve atualizar **sem F5**.
5. Tente alterar `criadoPor`, `tipo` ou `dados` de uma O.S. pelo Console do Firebase com
   um usuário comum: a escrita deve ser negada pelas regras.

## 5. API (use `npx vercel dev` ou a URL publicada)

Defina `BASE` e `TOKEN` com os valores reais.

```powershell
$BASE = 'http://localhost:3000'
$TOKEN = 'SEU_API_SECRET_TOKEN'

# 5.1 Sem token -> 401
curl.exe -i "$BASE/api/formularios"

# 5.2 Com token -> 200 (lista vazia ou registros)
curl.exe -i -H "x-api-key: $TOKEN" "$BASE/api/formularios?limit=abc"

# 5.3 CORS: origem não autorizada NÃO deve receber Access-Control-Allow-Origin
curl.exe -i -X OPTIONS "$BASE/api/formularios" `
  -H 'Origin: https://site-malicioso.example' `
  -H 'Access-Control-Request-Method: GET'

# 5.4 criadoPor do corpo é ignorado -> resposta/trava no UID configurado no servidor
curl.exe -i -X POST "$BASE/api/formularios" `
  -H "x-api-key: $TOKEN" -H 'Content-Type: application/json' `
  -d '{"tipo":"CTO","dados":{"codigoOS":"TESTE-SEGURANCA"},"criadoPor":{"uid":"atacante","email":"x@y.z"}}'

# 5.5 Estrutura inválida -> 400
curl.exe -i -X POST "$BASE/api/formularios" `
  -H "x-api-key: $TOKEN" -H 'Content-Type: application/json' `
  -d '{"tipo":"CTO","dados":{"__proto__":{"poluido":true},"a":[1,2,3]}}'
```

Esperado para 5.4: `criadoPor.uid` igual a `API_IDENTIDADE_UID` (padrão `api_system`),
nunca `atacante`. Em 5.5 o campo `__proto__` deve ser removido sem afetar o objeto.

Depois rode 61 requisições seguidas com o token válido; a 61ª deve retornar **429**.
Em desenvolvimento local, reinicie `vercel dev` para zerar o contador.

## 6. Privacidade e auditoria

1. No navegador, `F12 → Application → Local Storage`:
   - as chaves terminam com o UID do usuário logado;
   - os valores **não** contêm o e-mail do usuário (`buscar por @`);
   - `displayName` pode aparecer, e-mail não.
2. Faça uma ação (criar/finalizar O.S.) e verifique no Firestore `logs_auditoria`:
   - campos no topo: `acao`, `usuarioId`, `usuarioEmail`, `timestamp`;
   - `usuarioId` é o UID da sessão;
   - tentativa de edição/exclusão do log por usuário comum deve ser negada.
3. A tela de erro em produção não deve mostrar mensagem técnica crua (dev mostra detalhe).

## 7. Resultado já verificado nesta branch

| Verificação | Resultado |
|---|---|
| `npm run build` | OK |
| `npm run check:seguranca` | OK |
| `npm audit --omit=dev` | 0 vulnerabilidades |
| Typecheck da API (`tsc`) | OK |
| `http://localhost:3000` | HTTP 200 |
| Console do navegador | sem erros |
| `git status` | branch `security/auditoria`, sem alterações pendentes |
| Deploy das regras | ✅ Publicado em `cadastros-equipamentos` em 27/11/2026 — `rules file compiled successfully` + `released rules to cloud.firestore` |

Após sua validação, posso mesclar `security/auditoria` em `main` e publicar no GitHub.
