# Mapa de Rotas e Fluxos (Gerado via Route Mapper)

## Padrão Arquitetural Detectado

- **Router**: Next.js App Router (`app/` directory).
- **Data Fetching Preferencial**: Client-side fetch direto via `supabase` client (ex: `dashboard/page.tsx`).
- **API Routes**: Usadas para operações privilegiadas ou integrações externas (ex: Pix, Cron).

## Rota: `/dashboard` (Admin Home)

- **Arquivo**: `app/dashboard/page.tsx`
- **Tipo**: Client Component (`use client`)
- **Componentes Principais**:
  - `Layout` (`components/layout.tsx`)
  - `Card`, `Button` (Shadcn UI)
- **Dados (Supabase Direct)**:
  - `alunos`: Contagem de alunos.
  - `disciplinas`: Contagem de disciplinas.
  - `niveis`: Contagem de níveis.
  - `pedidos`: Lista de pedidos recentes e pendentes.

## Sub-rotas do Dashboard

_(Inferidas pela estrutura de diretórios e links)_

- `/dashboard/alunos`: Gestão de Estudantes.
- `/dashboard/disciplinas`: Gestão de Grade Curricular.
- `/dashboard/niveis`: Gestão de Níveis Acadêmicos.
- `/dashboard/pedidos`: Gestão Financeira/Pedidos.
- `/dashboard/configuracoes`: Ajustes do Sistema.

## Endpoints de API (`app/api/`)

- `/api/admin/*`: Operações administrativas privilegiadas.
- `/api/pix/*`: Integração de pagamentos.
- `/api/cron/*`: Tarefas agendadas.
- `/api/usuarios/*`: Gestão de usuários do sistema.

## Rota: `/login`

- **Arquivo**: `app/login/page.tsx` (Inferido)
- **Responsabilidade**: Autenticação de usuários.

## Rota: `/matricula`

- **Arquivo**: `app/matricula/page.tsx` (Inferido)
- **Responsabilidade**: Formulário público de inscrição de alunos.
