-- FASE 1: Alteração de Schema para Histórico de Transferência
-- Objetivo: Permitir que matrículas do passado fiquem "carimbadas" com o subnúcleo onde foram cursadas.

-- 1. Adicionar coluna se não existir
ALTER TABLE alunos_disciplinas 
ADD COLUMN IF NOT EXISTS subnucleo_id UUID REFERENCES subnucleos(id);

-- 2. Migração de Dados (População Inicial)
-- Para todos os registros existentes que não têm subnucleo_id, usamos o subnucleo ATUAL do aluno.
-- Isso preserva o estado atual como "histórico inicial".
UPDATE alunos_disciplinas ad
SET subnucleo_id = a.subnucleo_id
FROM alunos a
WHERE ad.aluno_id = (SELECT id FROM usuarios WHERE id = a.id) -- Ajuste se IDs forem iguais
  AND ad.subnucleo_id IS NULL;

-- Query alternativa se IDs de alunos != IDs de usuários e tiver FK
-- UPDATE alunos_disciplinas ad
-- SET subnucleo_id = a.subnucleo_id
-- FROM alunos a
-- WHERE ad.aluno_id = (SELECT id FROM usuarios WHERE id = a.id) OR ad.aluno_id = a.id
-- AND ad.subnucleo_id IS NULL;

-- Nota: Como sabemos (via RLS debug) que 'aluno_id' em 'alunos_disciplinas' refere-se ao Usuario.id (Auth UID),
-- E 'alunos.id' também refere-se ao usuario.id, o join a.id = ad.aluno_id deve funcionar direto se a modelagem for 1:1 limpa.
-- Vamos usar o mais simples e direto primeiro:

UPDATE alunos_disciplinas ad
SET subnucleo_id = a.subnucleo_id
FROM alunos a
WHERE a.id = ad.aluno_id -- Assumindo 1:1 entre PK de aluno e FK de aluno_id
  AND ad.subnucleo_id IS NULL;
