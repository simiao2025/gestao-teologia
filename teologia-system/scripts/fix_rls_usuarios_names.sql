-- Política para permitir que Administradores e Monitores vejam dados de outros usuários
-- Isso resolve o problema dos nomes aparecendo como "N/A"

-- 1. Primeiro remover a política atual restritiva (opcional, mas bom para limpeza)
-- DROP POLICY IF EXISTS "Usuários podem ver próprios dados" ON usuarios;

-- 2. Criar a nova política abrangente para SELECT
CREATE POLICY "Admins e Monitores podem ver outros usuários"
ON usuarios
FOR SELECT
TO authenticated
USING (
    -- Admins e diretoria podem ver todos os usuários
    EXISTS (
        SELECT 1 FROM usuarios u 
        WHERE u.id = auth.uid() 
        AND u.tipo IN ('admin', 'diretoria')
    )
    OR
    -- Monitores podem ver todos os usuários (necessário para listar alunos)
    EXISTS (
        SELECT 1 FROM usuarios u 
        WHERE u.id = auth.uid() 
        AND u.tipo = 'monitor'
    )
    OR
    -- Usuários comuns podem ver seus próprios dados
    id = auth.uid()
);

-- NOTA: Se houver erro de recursão infinita, use a seguinte versão simplificada que usa auth.jwt():
/*
CREATE POLICY "Admins e Monitores podem ver outros usuários"
ON usuarios
FOR SELECT
TO authenticated
USING (
    (auth.jwt() ->> 'email') IN (SELECT email FROM usuarios WHERE tipo IN ('admin', 'diretoria', 'monitor'))
    OR id = auth.uid()
);
*/
