-- Schema completo para Sistema Acadêmico Teologia
-- Supabase PostgreSQL

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABELA: usuarios (Base para autenticação)
-- =====================================================
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    telefone TEXT,
    senha_hash TEXT, -- Para uso futuro, por enquanto usamos Supabase Auth
    tipo TEXT NOT NULL CHECK (tipo IN ('aluno', 'monitor', 'diretoria', 'admin')),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para performance
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_tipo ON usuarios(tipo);

-- =====================================================
-- TABELA: subnucleos
-- =====================================================
CREATE TABLE subnucleos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    endereco TEXT,
    cidade TEXT NOT NULL,
    estado TEXT NOT NULL,
    monitor_id UUID REFERENCES usuarios(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subnucleos_monitor ON subnucleos(monitor_id);

-- =====================================================
-- TABELA: alunos
-- =====================================================
CREATE TABLE alunos (
    id UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    cpf TEXT UNIQUE NOT NULL,
    data_nascimento DATE NOT NULL,
    endereco TEXT NOT NULL,
    subnucleo_id UUID REFERENCES subnucleos(id),
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'trancado', 'concluído')),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_alunos_cpf ON alunos(cpf);
CREATE INDEX idx_alunos_subnucleo ON alunos(subnucleo_id);
CREATE INDEX idx_alunos_status ON alunos(status);

-- =====================================================
-- TABELA: monitores
-- =====================================================
CREATE TABLE monitores (
    id UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    telefone TEXT NOT NULL,
    email TEXT NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: diretoria
-- =====================================================
CREATE TABLE diretoria (
    id UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    cargo TEXT NOT NULL,
    telefone TEXT NOT NULL,
    email TEXT NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: disciplinas
-- =====================================================
CREATE TABLE disciplinas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nivel TEXT NOT NULL CHECK (nivel IN ('basico', 'medio', 'avancado')),
    codigo TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_disciplinas_nivel ON disciplinas(nivel);
CREATE INDEX idx_disciplinas_codigo ON disciplinas(codigo);

-- =====================================================
-- TABELA: livros
-- =====================================================
CREATE TABLE livros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    disciplina_id UUID NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    valor DECIMAL(10,2) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_livros_disciplina ON livros(disciplina_id);

-- =====================================================
-- TABELA: alunos_disciplinas (Progresso acadêmico)
-- =====================================================
CREATE TABLE alunos_disciplinas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    disciplina_id UUID NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('cursando', 'aprovado', 'reprovado', 'pendente')),
    nota DECIMAL(4,2),
    data_inicio DATE,
    data_conclusao DATE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar duplicatas
    UNIQUE(aluno_id, disciplina_id)
);

CREATE INDEX idx_alunos_disciplinas_aluno ON alunos_disciplinas(aluno_id);
CREATE INDEX idx_alunos_disciplinas_disciplina ON alunos_disciplinas(disciplina_id);
CREATE INDEX idx_alunos_disciplinas_status ON alunos_disciplinas(status);

-- =====================================================
-- TABELA: pedidos
-- =====================================================
CREATE TABLE pedidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    livro_id UUID NOT NULL REFERENCES livros(id) ON DELETE CASCADE,
    valor DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'enviado', 'entregue')),
    txid TEXT UNIQUE, -- Identificador único para o Pix
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pedidos_aluno ON pedidos(aluno_id);
CREATE INDEX idx_pedidos_status ON pedidos(status);
CREATE INDEX idx_pedidos_txid ON pedidos(txid);

-- =====================================================
-- TABELA: pagamentos_pix
-- =====================================================
CREATE TABLE pagamentos_pix (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    txid TEXT UNIQUE NOT NULL,
    copia_cola TEXT NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'gerado' CHECK (status IN ('gerado', 'pago', 'expirado')),
    data_pagamento TIMESTAMP WITH TIME ZONE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pagamentos_pix_pedido ON pagamentos_pix(pedido_id);
CREATE INDEX idx_pagamentos_pix_txid ON pagamentos_pix(txid);
CREATE INDEX idx_pagamentos_pix_status ON pagamentos_pix(status);

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para gerar TXID único
CREATE OR REPLACE FUNCTION gerar_txid()
RETURNS TEXT AS $$
DECLARE
    txid_text TEXT;
    txid_exists BOOLEAN := TRUE;
BEGIN
    WHILE txid_exists LOOP
        txid_text := 'TXID' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 16));
        SELECT EXISTS(SELECT 1 FROM pedidos WHERE txid = txid_text) INTO txid_exists;
    END LOOP;
    
    RETURN txid_text;
END;
$$ LANGUAGE plpgsql;

-- Função para criar novo aluno automaticamente
CREATE OR REPLACE FUNCTION criar_aluno(
    p_nome TEXT,
    p_email TEXT,
    p_telefone TEXT,
    p_cpf TEXT,
    p_data_nascimento DATE,
    p_endereco TEXT,
    p_subnucleo_id UUID
)
RETURNS UUID AS $$
DECLARE
    usuario_id UUID;
BEGIN
    -- Criar usuário
    INSERT INTO usuarios (nome, email, telefone, tipo)
    VALUES (p_nome, p_email, p_telefone, 'aluno')
    RETURNING id INTO usuario_id;
    
    -- Criar aluno
    INSERT INTO alunos (id, cpf, data_nascimento, endereco, subnucleo_id)
    VALUES (usuario_id, p_cpf, p_data_nascimento, p_endereco, p_subnucleo_id);
    
    RETURN usuario_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS E TRATAMENTO DE DADOS
-- =====================================================

-- Trigger para gerar TXID automaticamente nos pedidos
CREATE OR REPLACE FUNCTION gerar_txid_pedido()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.txid IS NULL THEN
        NEW.txid := gerar_txid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_gerar_txid_pedido
    BEFORE INSERT ON pedidos
    FOR EACH ROW
    EXECUTE FUNCTION gerar_txid_pedido();

-- Trigger para sincronizar pedidos com pagamentos_pix
CREATE OR REPLACE FUNCTION sincronizar_pagamento()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar status do pedido quando pagamento é confirmado
    IF NEW.status = 'pago' AND OLD.status != 'pago' THEN
        UPDATE pedidos 
        SET status = 'pago' 
        WHERE id = NEW.pedido_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sincronizar_pagamento
    AFTER UPDATE ON pagamentos_pix
    FOR EACH ROW
    EXECUTE FUNCTION sincronizar_pagamento();

-- =====================================================
-- POLÍTICAS DE SEGURANÇA (RLS)
-- =====================================================

-- Habilitar RLS nas tabelas sensíveis
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos_pix ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários verem apenas seus próprios dados
CREATE POLICY "Usuários podem ver próprios dados" ON usuarios
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Alunos podem ver próprios dados" ON alunos
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Alunos podem ver próprios pedidos" ON pedidos
    FOR SELECT USING (auth.uid() = aluno_id);

CREATE POLICY "Alunos podem ver próprios pagamentos" ON pagamentos_pix
    FOR SELECT USING (
        pedido_id IN (
            SELECT id FROM pedidos WHERE aluno_id = auth.uid()
        )
    );

-- =====================================================
-- DADOS INICIAIS PARA TESTE
-- =====================================================

-- Inserir algumas disciplinas básicas
INSERT INTO disciplinas (nivel, codigo, nome, descricao) VALUES
('basico', 'TE001', 'Introdução à Teologia', 'Conceitos fundamentais da teologia'),
('basico', 'TE002', 'História da Igreja I', 'Período apostólico até Constantino'),
('medio', 'TE003', 'Teologia Sistemática', 'Estudo dos dogmas cristãos'),
('avancado', 'TE004', 'Hermenêutica Bíblica', 'Interpretação das Escrituras');

-- Inserir alguns livros
INSERT INTO livros (disciplina_id, titulo, descricao, valor) 
SELECT 
    d.id,
    'Livro de ' || d.nome,
    'Material didático oficial para ' || d.nome,
    29.90
FROM disciplinas d;

-- =====================================================
-- COMENTÁRIOS FINAIS
-- =====================================================

/*
Este schema implementa:
1. Estrutura completa do sistema acadêmico
2. Relacionamentos entre todas as entidades
3. Integridade referencial
4. Performance com índices
5. Segurança com RLS
6. Automação com triggers
7. Funções auxiliares
8. Dados iniciais para teste

O sistema está pronto para integração com Next.js e Supabase Auth.
*/