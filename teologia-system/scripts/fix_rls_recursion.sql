-- Função segura para verificar permissões sem causar recursão
-- SECURITY DEFINER: roda com permissões de superusuário/dono, ignorando RLS da tabela usuarios
CREATE OR REPLACE FUNCTION public.is_admin_or_monitor()
RETURNS BOOLEAN AS $$
DECLARE
  user_tipo text;
BEGIN
  SELECT tipo INTO user_tipo
  FROM public.usuarios
  WHERE id = auth.uid();
  
  RETURN user_tipo IN ('admin', 'diretoria', 'monitor');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Corrigindo RLS da tabela ALUNOS
ALTER TABLE alunos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Alunos podem ver seus proprios dados" ON alunos;
DROP POLICY IF EXISTS "Admin e Monitores veem tudo em alunos" ON alunos;

CREATE POLICY "Politica de Leitura de Alunos"
ON alunos FOR SELECT
TO authenticated
USING (
  id = auth.uid() -- O próprio aluno
  OR
  is_admin_or_monitor() -- Admin/Monitor via função segura
);

-- Corrigindo RLS da tabela USUARIOS com limpeza agressiva de conflitos
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Remove policies antigas que podem estar causando recursão
DROP POLICY IF EXISTS "Usuarios autenticados podem ver nomes basicos" ON usuarios;
DROP POLICY IF EXISTS "Leitura de usuarios" ON usuarios;
DROP POLICY IF EXISTS "Enable read access for all users" ON usuarios;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON usuarios;
DROP POLICY IF EXISTS "Users can see their own data" ON usuarios;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON usuarios;
DROP POLICY IF EXISTS "Admin view all" ON usuarios;
DROP POLICY IF EXISTS "Leitura de usuarios pública para autenticados" ON usuarios;

-- Cria policy simples e não recursiva
CREATE POLICY "Leitura de usuarios pública para autenticados"
ON usuarios FOR SELECT
TO authenticated
USING (true); -- Permite ver IDs e nomes (necessário para relacionamentos)

-- Corrigindo RLS da tabela ESCALAS_MONITORES
ALTER TABLE escalas_monitores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Alunos podem ver escalas de monitores" ON escalas_monitores;

CREATE POLICY "Leitura de escalas monitores"
ON escalas_monitores FOR SELECT
TO authenticated
USING (
  is_admin_or_monitor() -- Admin vê tudo
  OR
  subnucleo_id IN (
    -- Aluno vê escalas do seu próprio subnúcleo
    -- Função segura para evitar recursão se necessário, mas aqui a query é simples
    SELECT subnucleo_id FROM alunos WHERE id = auth.uid()
  )
);
