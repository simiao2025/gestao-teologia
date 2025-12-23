-- Permitir que alunos vejam seus proprios dados na tabela alunos
DROP POLICY IF EXISTS "Alunos podem ver seus proprios dados" ON alunos;
CREATE POLICY "Alunos podem ver seus proprios dados"
ON alunos FOR SELECT
TO authenticated
USING (
  auth.uid() = id -- Assumindo que id do aluno é igual ao auth.uid()
  OR 
  auth.uid() IN (SELECT id FROM usuarios WHERE tipo IN ('admin', 'diretoria', 'monitor'))
);

-- Permitir leitura da tabela usuarios para saber nomes (monitor, etc)
-- Geralmente ja existe, mas reforçando leitura autenticada básica
DROP POLICY IF EXISTS "Usuarios autenticados podem ver nomes basicos" ON usuarios;
CREATE POLICY "Usuarios autenticados podem ver nomes basicos"
ON usuarios FOR SELECT
TO authenticated
USING (true); -- Permitir ver nomes de usuarios (necessário para ver nome do monitor)

-- Permitir que alunos vejam escalas de monitores para saber quem é seu monitor
DROP POLICY IF EXISTS "Alunos podem ver escalas de monitores" ON escalas_monitores;
CREATE POLICY "Alunos podem ver escalas de monitores"
ON escalas_monitores FOR SELECT
TO authenticated
USING (
  -- Admin/Diretoria/Monitor veem tudo
  (SELECT tipo FROM usuarios WHERE id = auth.uid()) IN ('admin', 'diretoria', 'monitor')
  OR
  -- Alunos veem escalas do seu subnúcleo
  subnucleo_id IN (SELECT subnucleo_id FROM alunos WHERE id = auth.uid())
);

-- Reforçar acesso a subnúcleos
DROP POLICY IF EXISTS "Leitura de subnucleos" ON subnucleos;
CREATE POLICY "Leitura de subnucleos"
ON subnucleos FOR SELECT
TO authenticated
USING (true); -- Subnúcleos são dados publicos para usuarios logados
