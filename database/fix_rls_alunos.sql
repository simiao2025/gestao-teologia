-- Desabilitar RLS na tabela alunos para permitir matrícula pública
ALTER TABLE alunos DISABLE ROW LEVEL SECURITY;

-- Remover policies existentes se houver
DROP POLICY IF EXISTS "Alunos podem ver próprios dados" ON alunos;

-- Manter RLS apenas para SELECT (proteção de dados)
ALTER TABLE alunos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alunos podem ver próprios dados" ON alunos
    FOR SELECT USING (auth.uid() = id);

-- Permitir INSERT para qualquer usuário (matrícula pública)
CREATE POLICY "Permitir inserção de alunos" ON alunos
    FOR INSERT WITH CHECK (true);
