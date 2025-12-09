# 🚀 COMO EXECUTAR O SISTEMA TEOLOGIA

## 📋 PASSO A PASSO COMPLETO

### 1. PREPARAR O AMBIENTE

#### 1.1 Instalar Node.js
- Baixe e instale o Node.js 18+ de: https://nodejs.org
- Verifique a instalação: `node --version`

#### 1.2 Criar Conta Supabase
- Acesse: https://supabase.com
- Crie uma conta gratuita
- Crie um novo projeto
- Aguarde a criação (2-3 minutos)

### 2. CONFIGURAR BANCO DE DADOS

#### 2.1 Executar Schema SQL
1. No painel Supabase, vá em "SQL Editor"
2. Crie uma nova query
3. Copie TODO o conteúdo do arquivo: `database/schema.sql`
4. Execute a query (irá criar todas as tabelas)

#### 2.2 Configurar Auth
1. Vá em "Authentication" → "Settings"
2. Configure "Site URL": `http://localhost:3000`
3. Configure "Redirect URLs": `http://localhost:3000/**`

### 3. CONFIGURAR PROJETO

#### 3.1 Instalar Dependências
```bash
cd sistema-teologia
npm install
```

#### 3.2 Configurar Variáveis de Ambiente
Crie o arquivo `.env.local` na pasta raiz do projeto:

```env
# SUPABASE (obrigatório)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui

# PIX (obrigatório para pagamentos)
NEXT_PUBLIC_PIX_KEY=000.000.000-00  # Seu CPF
NEXT_PUBLIC_PIX_BENEFICIARIO=Seu Nome
NEXT_PUBLIC_PIX_CIDADE=Sua Cidade
NEXT_PUBLIC_PIX_BANCO=Banco do Brasil
```

**Como obter as credenciais do Supabase:**
1. Vá em "Settings" → "API"
2. Copie a "Project URL"
3. Copie a "anon public key"

### 4. EXECUTAR O PROJETO

#### 4.1 Iniciar o Servidor
```bash
npm run dev
```

#### 4.2 Acessar o Sistema
Abra o navegador em: `http://localhost:3000`

### 5. TESTAR O SISTEMA

#### 5.1 Primeiro Acesso
1. Acesse `/matricula`
2. Preencha o formulário de matrícula
3. Anote o email e senha utilizados

#### 5.2 Login
1. Acesse `/login`
2. Use as credenciais da matrícula
3. Verifique o redirecionamento para dashboard

#### 5.3 Testar Funcionalidades
- **Admin**: Gerenciar alunos, disciplinas, livros
- **Aluno**: Fazer pedidos e pagar via PIX
- **Estatísticas**: Ver métricas no dashboard

### 6. PROBLEMAS COMUNS

#### ❌ Erro "Supabase connection failed"
**Solução:**
1. Verifique URL e chave no `.env.local`
2. Confirme que o projeto Supabase está ativo
3. Reinicie o servidor: `Ctrl+C` e `npm run dev`

#### ❌ Erro "User not authenticated"
**Solução:**
1. Vá em Supabase → "Authentication" → "Settings"
2. Configure Site URL: `http://localhost:3000`
3. Configure Redirect URLs: `http://localhost:3000/**`

#### ❌ PIX não funciona
**Solução:**
1. Verifique as variáveis PIX no `.env.local`
2. Confirme que a chave PIX é válida
3. Teste em ambiente de desenvolvimento

#### ❌ Erro de dependências
**Solução:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### 7. PRIMEIRA CONFIGURAÇÃO

#### 7.1 Criar Primeiro Admin
```sql
-- Execute no SQL Editor do Supabase
INSERT INTO usuarios (nome, email, telefone, tipo) 
VALUES ('Admin', 'admin@teologia.com', '(11) 99999-9999', 'admin');
```

#### 7.2 Criar Subnúcleos
```sql
INSERT INTO subnucleos (nome, cidade, estado, endereco) VALUES
('Subnúcleo São Paulo', 'São Paulo', 'SP', 'Rua Exemplo, 123'),
('Subnúcleo Rio de Janeiro', 'Rio de Janeiro', 'RJ', 'Av. Exemplo, 456');
```

#### 7.3 Criar Disciplinas
```sql
INSERT INTO disciplinas (nivel, codigo, nome, descricao) VALUES
('basico', 'TE001', 'Introdução à Teologia', 'Conceitos fundamentais'),
('basico', 'TE002', 'História da Igreja I', 'Período apostólico'),
('medio', 'TE003', 'Teologia Sistemática', 'Dogmas cristãos');
```

### 8. DEPLOY EM PRODUÇÃO

#### 8.1 Vercel (Recomendado)
1. Crie conta no Vercel
2. Conecte seu repositório GitHub
3. Configure variáveis de ambiente:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - Variáveis PIX
4. Deploy automático

#### 8.2 Configurações de Produção
- **Site URL**: `https://seu-dominio.com`
- **Redirect URLs**: `https://seu-dominio.com/**`

### 9. ESTRUTURA DE ARQUIVOS

```
sistema-teologia/
├── app/                    # Páginas Next.js
├── components/             # Componentes React
├── lib/                   # Utilitários
├── database/
│   └── schema.sql         # Schema do banco
├── .env.local            # Variáveis de ambiente
├── package.json          # Dependências
├── tailwind.config.js    # Configuração Tailwind
├── next.config.js        # Configuração Next.js
├── tsconfig.json         # Configuração TypeScript
├── README.md             # Documentação
└── INSTALACAO.md         # Guia detalhado
```

### 10. COMANDOS ÚTEIS

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Executar em produção
npm start

# Lint do código
npm run lint
```

### 11. RECURSOS DISPONÍVEIS

#### ✅ Implementado
- Sistema completo de matrícula
- Autenticação com Supabase Auth
- Dashboard administrativo
- Gestão de alunos, disciplinas, livros
- Sistema de pedidos
- Pagamento via PIX
- Interface responsiva
- Filtros e buscas
- Métricas em tempo real

#### 🎯 Funcionalidades
- **Visitante**: Home, Matrícula, Login
- **Aluno**: Dashboard, Disciplinas, Pedidos, Pagamento PIX
- **Admin**: Dashboard, CRUD completo, Relatórios

### 12. SUPORTE

Se tiver dúvidas:
1. Consulte o `README.md`
2. Verifique o `INSTALACAO.md`
3. Leia os comentários no código
4. Teste em ambiente limpo

---

**🎉 SISTEMA PRONTO PARA USO!**

Com este guia, você terá o sistema funcionando em 10-15 minutos.

**Desenvolvido por MiniMax Agent** | Sistema Acadêmico Completo