-- SCRIPT DE RECUPERAÇÃO DO SISTEMA
-- Este script remove as políticas complexas que causaram problemas e aplica regras simples e funcionais.

-- 1. Tabela USUARIOS (A causa provável do bloqueio de login)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Remove TODAS as policies anteriores para garantir limpeza
DROP POLICY IF EXISTS "Leitura de usuarios pública para autenticados" ON usuarios;
DROP POLICY IF EXISTS "Usuarios autenticados podem ver nomes basicos" ON usuarios;
DROP POLICY IF EXISTS "Leitura de usuarios" ON usuarios;
DROP POLICY IF EXISTS "Enable read access for all users" ON usuarios;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON usuarios;
DROP POLICY IF EXISTS "Users can see their own data" ON usuarios;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON usuarios;
DROP POLICY IF EXISTS "Admin view all" ON usuarios;
DROP POLICY IF EXISTS "Acesso total usuarios" ON usuarios;

-- Cria uma política de LEITURA irrestrita para autenticados (Resolve a RECURSÃO e permite login carregar dados)
CREATE POLICY "Recuperacao Leitura Usuarios"
ON usuarios FOR SELECT
TO authenticated
USING (true);

-- Cria uma política de EDIÇÃO para o próprio usuário (Permite alterar senha/perfil se necessário)
CREATE POLICY "Recuperacao Edicao Proprio Usuario"
ON usuarios FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 2. Tabela ALUNOS
ALTER TABLE alunos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Politica de Leitura de Alunos" ON alunos;
DROP POLICY IF EXISTS "Alunos podem ver seus proprios dados" ON alunos;
DROP POLICY IF EXISTS "Admin e Monitores veem tudo em alunos" ON alunos;

-- Permite leitura se for o próprio aluno OU se for admin/monitor/diretoria
-- Usando subquery direta sem função para evitar problemas de permissão de funcão
CREATE POLICY "Recuperacao Leitura Alunos"
ON alunos FOR SELECT
TO authenticated
USING (
  id = auth.uid() 
  OR 
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo IN ('admin', 'diretoria', 'monitor'))
);

-- 3. Tabela ESCALAS_MONITORES
ALTER TABLE escalas_monitores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura de escalas monitores" ON escalas_monitores;
DROP POLICY IF EXISTS "Alunos podem ver escalas de monitores" ON escalas_monitores;

-- Permite leitura geral para autenticados (Temporário para garantir que Monitor/Alunos vejam)
CREATE POLICY "Recuperacao Leitura Escalas"
ON escalas_monitores FOR SELECT
TO authenticated
USING (true);
