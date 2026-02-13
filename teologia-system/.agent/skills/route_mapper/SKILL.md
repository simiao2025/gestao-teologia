---
name: Route Mapper (Contexto Técnico)
description: Mapeia as rotas da aplicação conectando UI, Componentes e API.
version: 1.0
---

# Route Mapper (Contexto Técnico)

Esta skill cria um "mapa da cidade" para o projeto, ligando as páginas visíveis ao usuário até o código que processa os dados. Essencial para entender o impacto de mudanças.

## Objetivo Principal

Gerar e manter atualizado o arquivo `.agent/memory/ROUTE_MAP.md`.

## Passo 1: Identificar Rotas (Frontend)

1.  **App Router**: Varra `app/` procurando por `page.tsx`.
2.  **Pages Router**: Varra `pages/` (se existir).
3.  **Estrutura da URL**: Determine a URL pública baseada no caminho do arquivo.

## Passo 2: Analisar Cadeia de Dependências

Para cada página identificada:

1.  **Componentes Chave**: Quais componentes principais ela renderiza? (ex: `StudentForm`, `PaymentList`).
2.  **Data Fetching**: Como ela busca dados?
    - Server Actions?
    - `fetch` direto em Client Components?
    - React Query / SWR?
    - `getServerSideProps` / `getStaticProps`?
3.  **Endpoints de API**: Quais rotas de API (`/api/...`) são chamadas?

## Passo 3: Persistência (Saída)

Escreva ou atualize o arquivo `.agent/memory/ROUTE_MAP.md` com o seguinte formato:

```markdown
# Mapa de Rotas e Fluxos

## Rota: `/alunos`

- **Arquivo**: `app/alunos/page.tsx`
- **Componentes Principais**:
  - `StudentListTable` (`components/students/StudentListTable.tsx`)
  - `NewStudentModal` (`components/students/NewStudentModal.tsx`)
- **Dependências de Backend**:
  - GET `/api/students` (Lista alunos)
  - POST `/api/students` (Cria aluno)
- **Notas**: Requer autenticação de nível 'admin' ou 'secretaria'.

## Rota: `/financeiro/dashboard`

...
```

## Como Usar

Execute esta skill quando precisar entender "onde as coisas acontecem" ou antes de alterar uma funcionalidade que spanneia front e back.
