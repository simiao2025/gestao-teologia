-- SQL para corrigir permissões (RLS) da tabela de PEDIDOS
-- Permite que alunos criem e vejam seus próprios pedidos

-- 1. Habilitar RLS na tabela (caso não esteja)
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- 2. Limpar políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "Alunos podem ver seus próprios pedidos" ON pedidos;
DROP POLICY IF EXISTS "Alunos podem criar seus próprios pedidos" ON pedidos;
DROP POLICY IF EXISTS "Alunos podem atualizar seus próprios pedidos" ON pedidos;

-- 3. Criar políticas de LEITURA (SELECT)
CREATE POLICY "Alunos podem ver seus próprios pedidos" 
ON pedidos FOR SELECT 
TO authenticated 
USING (
  auth.uid() = aluno_id OR 
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo != 'aluno')
);

-- 4. Criar políticas de INSERÇÃO (INSERT)
CREATE POLICY "Alunos podem criar seus próprios pedidos" 
ON pedidos FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() = aluno_id OR 
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo != 'aluno')
);

-- 5. Criar políticas de ATUALIZAÇÃO (UPDATE)
CREATE POLICY "Alunos podem atualizar seus próprios pedidos" 
ON pedidos FOR UPDATE 
TO authenticated 
USING (
  auth.uid() = aluno_id OR 
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo != 'aluno')
)
WITH CHECK (
  auth.uid() = aluno_id OR 
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo != 'aluno')
);

-- 6. Criar políticas de EXCLUSÃO (DELETE)
CREATE POLICY "Alunos podem deletar seus próprios pedidos" 
ON pedidos FOR DELETE 
TO authenticated 
USING (
  auth.uid() = aluno_id OR 
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo != 'aluno')
);

-- 7. Políticas para PAGAMENTOS_PIX
ALTER TABLE pagamentos_pix ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso aos pagamentos pix" ON pagamentos_pix;
CREATE POLICY "Acesso aos pagamentos pix" 
ON pagamentos_pix FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM pedidos 
    WHERE pedidos.id = pagamentos_pix.pedido_id 
    AND (pedidos.aluno_id = auth.uid() OR EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo != 'aluno'))
  )
);

