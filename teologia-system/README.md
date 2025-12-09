# Sistema Acadêmico - Curso de Teologia

Sistema completo para administração acadêmica e controle interno do Curso de Teologia, incluindo área pública, módulo administrativo, área do aluno e sistema de pagamentos via Pix.

## 🚀 Funcionalidades

### Área Pública
- ✅ Página inicial com informações institucionais
- ✅ Formulário de matrícula para novos alunos
- ✅ Login para alunos existentes
- ✅ Exibição de disciplinas e níveis de formação

### Área Administrativa
- ✅ Dashboard com estatísticas em tempo real
- ✅ Gestão completa de alunos
- ✅ Cadastro de disciplinas (básico, médio, avançado)
- ✅ Catálogo de livros por disciplina
- ✅ Controle de pedidos e pagamentos
- ✅ Filtros e buscas avançadas
- ✅ Relatórios e métricas

### Área do Aluno
- ✅ Dashboard personalizado
- ✅ Visualização de disciplinas cursando
- ✅ Pedidos de livros
- ✅ Pagamento via Pix com QR Code
- ✅ Histórico de pagamentos
- ✅ Progresso acadêmico

### Sistema de Pagamento Pix
- ✅ Geração de Pix copia e cola
- ✅ QR Code para pagamento
- ✅ Identificação única por TXID
- ✅ Status automático de pagamento
- ✅ Sem taxas (conta PF)

## 🛠️ Tecnologias

### Frontend
- **Next.js 14** com App Router
- **React 18** com Server/Client Components
- **TailwindCSS** para estilização
- **TypeScript** para tipagem
- **React Hook Form** + **Zod** para formulários

### Backend
- **Supabase** (PostgreSQL + Auth + Storage)
- **Row Level Security (RLS)**
- **Edge Functions** para lógicas complexas
- **Real-time subscriptions**

### Integrações
- **Pagamento via Pix** (chave estática)
- **Geração de QR Code**
- **Autenticação Supabase Auth**

## 📊 Estrutura do Banco

### Tabelas Principais
- `usuarios` - Base para todos os usuários
- `alunos` - Dados específicos dos alunos
- `disciplinas` - Disciplinas do curso
- `livros` - Catálogo de livros por disciplina
- `pedidos` - Pedidos de livros pelos alunos
- `pagamentos_pix` - Registros de pagamento
- `subnucleos` - Subnúcleos regionais
- `alunos_disciplinas` - Progresso acadêmico

### Relacionamentos
- Usuarios → Alunos (1:1)
- Disciplinas → Livros (1:N)
- Alunos → Pedidos (1:N)
- Pedidos → Pagamentos Pix (1:1)

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Área Pública  │    │  Área Aluno      │    │ Área Admin      │
│                 │    │                  │    │                 │
│ - Home          │    │ - Dashboard      │    │ - Dashboard     │
│ - Matrícula     │    │ - Disciplinas    │    │ - Alunos        │
│ - Login         │    │ - Pedidos        │    │ - Disciplinas   │
│ - Sobre         │    │ - Pagamentos     │    │ - Livros        │
└─────────────────┘    └──────────────────┘    │ - Pedidos       │
                                               │ - Subnúcleos    │
                                               └─────────────────┘
                                                        │
┌───────────────────────────────────────────────────────┼─────────────────┐
│                      Supabase Backend                           │
│                                                                   │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐     │
│ │   PostgreSQL    │ │   Auth Service  │ │   Edge Funcs    │     │
│ │                 │ │                 │ │                 │     │
│ │ - Tabelas       │ │ - JWT Tokens    │ │ - Pix Generate  │     │
│ │ - RLS Policies  │ │ - User Mgmt     │ │ - Webhooks      │     │
│ │ - Triggers      │ │ - Sessions      │ │ - Validations   │     │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘     │
└───────────────────────────────────────────────────────────────────┘
```

## 🚀 Instalação e Configuração

### 1. Clonar o Repositório
```bash
git clone <repository-url>
cd sistema-teologia
```

### 2. Instalar Dependências
```bash
npm install
# ou
yarn install
```

### 3. Configurar Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase

# PIX (Configurações do Pagamento)
NEXT_PUBLIC_PIX_KEY=seu_cpf_ou_chave_pix
NEXT_PUBLIC_PIX_BENEFICIARIO=Nome do Curso
NEXT_PUBLIC_PIX_CIDADE=Sua_Cidade
NEXT_PUBLIC_PIX_BANCO=Banco do Brasil
```

### 4. Configurar Banco de Dados

Execute o arquivo `database/schema.sql` no seu projeto Supabase:

1. Vá para o painel do Supabase
2. Entre em "SQL Editor"
3. Execute o conteúdo do arquivo `database/schema.sql`

### 5. Executar o Projeto
```bash
npm run dev
# ou
yarn dev
```

Acesse: `http://localhost:3000`

## 📱 Fluxos de Uso

### Para Alunos
1. **Matrícula**: Preencher formulário no site
2. **Login**: Acessar com email/senha
3. **Disciplinas**: Ver disciplinas disponíveis
4. **Pedidos**: Solicitar livros
5. **Pagamento**: Pagar via Pix (QR Code ou copia/cola)
6. **Status**: Acompanhar status do pedido

### Para Administradores
1. **Dashboard**: Visualizar estatísticas
2. **Alunos**: Gerenciar cadastro de alunos
3. **Disciplinas**: Cadastrar disciplinas por nível
4. **Livros**: Gerenciar catálogo por disciplina
5. **Pedidos**: Controlar pedidos e status
6. **Relatórios**: Filtrar e exportar dados

## 🔧 Configuração do Supabase

### 1. Criar Projeto
1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote a URL e chave anônima

### 2. Configurar Auth
1. Vá em "Authentication" → "Settings"
2. Configure o site URL: `http://localhost:3000`
3. Configure redirect URLs

### 3. Configurar RLS
O schema já inclui políticas RLS para:
- Usuários veem apenas seus próprios dados
- Alunos veem apenas seus pedidos
- Admins têm acesso completo

### 4. Executar Schema
Execute o arquivo `database/schema.sql` para:
- Criar todas as tabelas
- Configurar relacionamentos
- Adicionar políticas de segurança
- Inserir dados de teste

## 💰 Sistema de Pagamento Pix

### Como Funciona
1. **Geração**: Sistema gera Pix com TXID único (ID do pedido)
2. **QR Code**: Aluno escaneia ou copia código
3. **Pagamento**: Pagamento é feito via app bancário
4. **Identificação**: TXID identifica o pagamento automaticamente
5. **Status**: Sistema atualiza status do pedido

### Configuração PIX
Configure as variáveis de ambiente com seus dados:
- **Chave Pix**: Seu CPF, CNPJ, email, telefone ou chave aleatória
- **Beneficiário**: Nome que aparecerá no pagamento
- **Banco**: Nome do seu banco
- **Cidade**: Sua cidade

### Sem Taxas
O sistema usa Pix estático em conta PF, sem taxas do sistema.

## 📊 Métricas e Relatórios

### Dashboard Admin
- Total de alunos por status
- Pedidos pendentes vs pagos
- Taxa de conversão de pagamentos
- Disciplinas mais populares

### Filtros Disponíveis
- Busca por nome, email, CPF
- Filtro por status do aluno
- Filtro por subnúcleo
- Filtro por disciplina

## 🔒 Segurança

### Row Level Security (RLS)
- Cada usuário vê apenas seus próprios dados
- Políticas de acesso por tipo de usuário
- Validações no banco de dados

### Autenticação
- JWT tokens via Supabase Auth
- Sessions persistentes
- Proteção de rotas

## 🚀 Deploy

### Vercel (Recomendado)
1. Conecte repositório no Vercel
2. Configure variáveis de ambiente
3. Deploy automático

### Netlify
1. Build: `npm run build`
2. Publish: `out/` (para SSG) ou configurar SSR

### Supabase
- Banco já configurado
- Edge Functions opcionais
- Real-time subscriptions

## 🛠️ Desenvolvimento

### Scripts Disponíveis
```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run start        # Servidor de produção
npm run lint         # Lint do código
```

### Estrutura de Arquivos
```
├── app/                    # Next.js App Router
│   ├── page.tsx           # Página inicial
│   ├── matricula/         # Página de matrícula
│   ├── login/             # Página de login
│   └── dashboard/         # Área administrativa
├── components/            # Componentes React
│   ├── ui/               # Componentes básicos
│   ├── layout.tsx        # Layout admin
│   ├── login-form.tsx    # Formulário de login
│   └── matricula-form.tsx # Formulário de matrícula
├── lib/                   # Utilitários
│   ├── supabase.ts       # Cliente Supabase
│   ├── pix-utils.ts      # Utilitários PIX
│   ├── validations.ts    # Esquemas Zod
│   └── utils.ts          # Funções utilitárias
└── database/
    └── schema.sql        # Schema do banco
```

## 🆘 Suporte

### Problemas Comuns

**Erro de conexão com Supabase**
- Verificar URL e chave no .env.local
- Confirmar que projeto está ativo

**Pix não funcionando**
- Verificar variáveis de ambiente PIX
- Confirmar chave PIX válida
- Verificar formato do TXID

**RLS bloqueando acesso**
- Verificar políticas no Supabase
- Confirmar que usuário está logado
- Verificar tipo de usuário

### Logs e Debug
- Console do navegador para erros JS
- Supabase Dashboard para logs do banco
- Network tab para API calls

## 📄 Licença

Este projeto é privado e pertence ao Curso de Teologia.

## 🤝 Contribuição

Para contribuir com o projeto:
1. Fork do repositório
2. Criar branch para feature
3. Commit das alterações
4. Push para branch
5. Criar Pull Request

---

**Desenvolvido por MiniMax Agent** | Sistema Acadêmico Completo para Curso de Teologia