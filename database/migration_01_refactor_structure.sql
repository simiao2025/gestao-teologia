-- Migration: Refatoração da Estrutura (Remover Livros, Adicionar Níveis)

-- 1. Criar Tabela Níveis
CREATE TABLE niveis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL, -- Ex: Básico, Médio, Avançado
    descricao TEXT,
    ordem INTEGER NOT NULL, -- 1, 2, 3...
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir Níveis Padrão
INSERT INTO niveis (nome, descricao, ordem) VALUES
('Básico', 'Nível fundamental de teologia', 1),
('Médio', 'Aprofundamento teológico', 2),
('Avançado', 'Especialização e hermenêutica', 3);

-- 2. Alterar Tabela Disciplinas
-- Adicionar coluna de valor (que estava em livros) e FK para nivel
ALTER TABLE disciplinas ADD COLUMN nivel_id UUID REFERENCES niveis(id);
ALTER TABLE disciplinas ADD COLUMN valor DECIMAL(10,2) DEFAULT 0.00;

-- Migrar dados da coluna antiga 'nivel' (texto) para 'nivel_id'
DO $$
DECLARE
    r_nivel RECORD;
BEGIN
    FOR r_nivel IN SELECT * FROM niveis LOOP
        UPDATE disciplinas 
        SET nivel_id = r_nivel.id 
        WHERE LOWER(nivel) = LOWER(r_nivel.nome); 
        -- Nota: A comparação simples pode falhar se houver acentos diferentes. 
        -- Assumindo 'basico' vs 'Básico'. 
        -- Vamos fazer updates diretos abaixo para garantir.
    END LOOP;
END $$;

-- Updates manuais para garantir a migração correta dos dados existentes no seed
UPDATE disciplinas SET nivel_id = (SELECT id FROM niveis WHERE ordem=1) WHERE nivel = 'basico';
UPDATE disciplinas SET nivel_id = (SELECT id FROM niveis WHERE ordem=2) WHERE nivel = 'medio';
UPDATE disciplinas SET nivel_id = (SELECT id FROM niveis WHERE ordem=3) WHERE nivel = 'avancado';

-- Remover a coluna antiga de nível (texto)
ALTER TABLE disciplinas DROP COLUMN nivel;

-- Atualizar preços (exemplo: migrar do livro para disciplina se houver correspondência 1:1)
-- Como a lógica muda de "Livro" para "Disciplina", vamos assumir um preço padrão ou copiar do livro antigo se existir.
UPDATE disciplinas d
SET valor = (
    SELECT l.valor FROM livros l WHERE l.disciplina_id = d.id LIMIT 1
);

-- 3. Alterar Tabela Alunos (Vínculo com Nível Atual)
ALTER TABLE alunos ADD COLUMN nivel_atual_id UUID REFERENCES niveis(id);
-- Setar nível básico para todos inicialmente
UPDATE alunos SET nivel_atual_id = (SELECT id FROM niveis WHERE ordem=1);

-- 4. Alterar Tabela Pedidos
-- Pedidos agora apontam para Disciplinas, não Livros.
ALTER TABLE pedidos ADD COLUMN disciplina_id UUID REFERENCES disciplinas(id);

-- Migrar dados: pegar a disciplina do livro que estava no pedido
UPDATE pedidos p
SET disciplina_id = (
    SELECT l.disciplina_id FROM livros l WHERE l.id = p.livro_id
);

-- Remover FK antiga
ALTER TABLE pedidos DROP COLUMN livro_id;

-- 5. Remover Tabela Livros
DROP TABLE livros;

-- 6. Recriar/Ajustar Views ou Índices se necessário
CREATE INDEX idx_disciplinas_nivel_id ON disciplinas(nivel_id);
CREATE INDEX idx_alunos_nivel_atual ON alunos(nivel_atual_id);
CREATE INDEX idx_pedidos_disciplina ON pedidos(disciplina_id);
