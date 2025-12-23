-- SCRIPT DE EMERGÊNCIA - DESATIVAR RLS PARA RESTAURAR ACESSO
-- Este script desativa temporariamente a segurança (RLS) das tabelas críticas para eliminar o Erro 500 (Recursão Infinita).
-- Execute isso para o sistema voltar a funcionar imediatamente.

-- 1. Tabela CONFIG_SISTEMA (Está bloqueando o carregamento inicial)
ALTER TABLE config_sistema DISABLE ROW LEVEL SECURITY;

-- 2. Tabela USUARIOS (Está bloqueando o login e identificação)
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;

-- 3. Tabela ALUNOS (Está bloqueando a visualização de dados do aluno)
ALTER TABLE alunos DISABLE ROW LEVEL SECURITY;

-- 4. Tabela ESCALAS_MONITORES
ALTER TABLE escalas_monitores DISABLE ROW LEVEL SECURITY;

-- 5. Outras tabelas auxiliares que podem ter sido afetadas
ALTER TABLE subnucleos DISABLE ROW LEVEL SECURITY;
ALTER TABLE alunos_disciplinas DISABLE ROW LEVEL SECURITY;

-- NOTA: Após o sistema voltar, podemos reativar o RLS (ENABLE ROW LEVEL SECURITY)
-- com políticas corrigidas e testadas uma a uma, mas primeiro vamos garantir que tudo funcione.
