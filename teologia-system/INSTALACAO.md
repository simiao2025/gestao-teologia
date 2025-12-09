# 🚀 Guia de Instalação - Sistema Teologia

## Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase
- Projeto Supabase criado
- Chave PIX para pagamentos

## 1. Configuração do Supabase

### 1.1 Criar Projeto
1. Acesse [supabase.com](https://supabase.com)
2. Crie uma nova organização
3. Crie um novo projeto
4. Aguarde a criação (2-3 minutos)

### 1.2 Obter Credenciais
No painel do Supabase, vá em:
- **Settings** → **API**
- Copie a **Project URL**
- Copie a **anon public key**

### 1.3 Configurar Autenticação
1. Vá em **Authentication** → **Settings**
2. Configure o **Site URL**: `http://localhost:3000` (para desenvolvimento)
3. Configure **Redirect URLs**: `http://localhost:3000/**`

### 1.4 Executar Schema
1. Vá em **SQL Editor** no Supabase
2. Crie uma nova query
3. Copie todo o conteúdo do arquivo `database/schema.sql`
4. Execute a query (irá criar todas as tabelas e dados)

## 2. Instalação do Projeto

### 2.1 Instalar Dependências
```bash
cd sistema-teologia
npm install
```

### 2.2 Configurar Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz:

```env
# Supabase (obrigatório)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima

# PIX (obrigatório para pagamentos)
NEXT_PUBLIC_PIX_KEY=000.000.000-00  # Seu CPF
NEXT_PUBLIC_PIX_BENEFICIARIO=Seu Nome
NEXT_PUBLIC_PIX_CIDADE=Sua Cidade
NEXT_PUBLIC_PIX_BANCO=Banco do Brasil
```

### 2.3 Executar o Projeto
```bash
npm run dev
```

Acesse: `http://localhost:3000`

## 3. Primeiro Acesso

### 3.1 Criar Usuário Admin
Como o primeiro usuário será criado via matrícula, você pode:

**Opção 1 - Via SQL:**
```sql
INSERT INTO usuarios (nome, email, telefone, tipo) 
VALUES ('Admin', 'admin@teologia.com', '(11) 99999-9999', 'admin');
```

**Opção 2 - Via Matrícula:**
1. Acesse `/matricula`
2. Preencha o formulário normalmente
3. Edite o tipo via Supabase Dashboard

### 3.2 Configurar Usuário Admin
1. Vá em **Authentication** → **Users**
2. Encontre o usuário criado
3. Confirme o email se necessário

### 3.3 Primeiro Login
1. Acesse `/login`
2. Use as credenciais criadas
3. Acesse `/dashboard`

## 4. Configuração Inicial

### 4.1 Criar Subnúcleos
```sql
INSERT INTO subnucleos (nome, cidade, estado, endereco) VALUES
('Subnúcleo São Paulo', 'São Paulo', 'SP', 'Rua Exemplo, 123'),
('Subnúcleo Rio de Janeiro', 'Rio de Janeiro', 'RJ', 'Av. Exemplo, 456');
```

### 4.2 Criar Disciplinas
```sql
INSERT INTO disciplinas (nivel, codigo, nome, descricao) VALUES
('basico', 'TE001', 'Introdução à Teologia', 'Conceitos fundamentais'),
('basico', 'TE002', 'História da Igreja I', 'Período apostólico'),
('medio', 'TE003', 'Teologia Sistemática', 'Dogmas cristãos');
```

### 4.3 Criar Livros
```sql
INSERT INTO livros (disciplina_id, titulo, descricao, valor) 
SELECT d.id, 'Livro de ' || d.nome, 'Material oficial', 29.90
FROM disciplinas d;
```

## 5. Testes

### 5.1 Teste de Matrícula
1. Acesse `/matricula`
2. Preencha o formulário
3. Verifique se o usuário foi criado
4. Verifique se o aluno foi vinculado

### 5.2 Teste de Login
1. Acesse `/login`
2. Use as credenciais da matrícula
3. Verifique o redirecionamento correto

### 5.3 Teste de Pedido
1. Faça login como aluno
2. Vá para área do aluno
3. Faça um pedido de livro
4. Teste o PIX gerado

### 5.4 Teste Admin
1. Faça login como admin
2. Vá para `/dashboard`
3. Teste as funcionalidades CRUD
4. Verifique as estatísticas

## 6. Deploy

### 6.1 Vercel (Recomendado)
1. Conecte o repositório no Vercel
2. Configure as variáveis de ambiente
3. Deploy automático

### 6.2 Configurações de Produção
**Site URL**: `https://seu-dominio.com`
**Redirect URLs**: `https://seu-dominio.com/**`

### 6.3 Variáveis de Ambiente
No ambiente de produção, configure:
- URL do Supabase (produção)
- Chave PIX de produção
- URLs corretas

## 7. Manutenção

### 7.1 Backup do Banco
- Supabase faz backup automático
- Você pode exportar dados via SQL

### 7.2 Monitoramento
- Use o painel do Supabase para monitorar
- Verifique logs de autenticação
- Monitore performance das queries

### 7.3 Atualizações
- Sempre teste em desenvolvimento primeiro
- Use branches para mudanças grandes
- Mantenha dependências atualizadas

## 8. Solução de Problemas

### 8.1 Erro "Supabase connection failed"
- Verifique URL e chave no .env.local
- Confirme que o projeto está ativo

### 8.2 Erro "User not authenticated"
- Verifique configurações de Auth
- Confirme redirect URLs
- Verifique políticas RLS

### 8.3 PIX não funciona
- Verifique variáveis PIX
- Confirme chave válida
- Teste em ambiente de desenvolvimento

### 8.4 RLS bloqueando acesso
- Verifique políticas no Supabase
- Confirme que usuário está logado
- Teste com usuário admin

## 9. Suporte

Para suporte técnico:
1. Verifique os logs do navegador (F12)
2. Verifique logs do Supabase Dashboard
3. Consulte a documentação
4. Teste em ambiente limpo

---

**Desenvolvido por MiniMax Agent** | Sistema Acadêmico Completo