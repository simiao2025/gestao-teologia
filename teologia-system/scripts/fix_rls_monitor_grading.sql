-- Política RLS para permitir que monitores vejam alunos dos seus subnúcleos

-- Primeiro, verificar se RLS está habilitado na tabela alunos
-- Se não estiver, habilitar:
-- ALTER TABLE alunos ENABLE ROW LEVEL SECURITY;

-- Criar política para monitores verem alunos dos subnúcleos onde têm escala
CREATE POLICY "Monitores podem ver alunos dos seus subnúcleos"
ON alunos
FOR SELECT
TO authenticated
USING (
    -- Monitor pode ver alunos do subnúcleo onde ele tem escala
    EXISTS (
        SELECT 1 
        FROM escalas_monitores em
        WHERE em.monitor_id = auth.uid()
        AND em.subnucleo_id = alunos.subnucleo_id
    )
    OR
    -- Admins e diretoria podem ver todos
    EXISTS (
        SELECT 1 
        FROM usuarios u
        WHERE u.id = auth.uid() 
        AND u.tipo IN ('admin', 'diretoria')
    )
    OR
    -- Aluno pode ver seus próprios dados
    alunos.id = auth.uid()
);

-- Criar política para alunos_disciplinas
CREATE POLICY "Monitores podem ver matrículas dos seus alunos"
ON alunos_disciplinas
FOR SELECT
TO authenticated
USING (
    -- Monitor pode ver matrículas de alunos do seu subnúcleo na sua disciplina
    EXISTS (
        SELECT 1
        FROM escalas_monitores em
        INNER JOIN alunos a ON a.id = alunos_disciplinas.aluno_id
        WHERE em.monitor_id = auth.uid()
        AND em.subnucleo_id = a.subnucleo_id
        AND em.disciplina_id = alunos_disciplinas.disciplina_id
    )
    OR
    -- Admins e diretoria podem ver tudo
    EXISTS (
        SELECT 1
        FROM usuarios u
        WHERE u.id = auth.uid()
        AND u.tipo IN ('admin', 'diretoria')
    )
    OR
    -- Aluno pode ver suas próprias matrículas
    alunos_disciplinas.aluno_id = auth.uid()
);

-- Criar política para monitores atualizarem notas
CREATE POLICY "Monitores podem atualizar notas dos seus alunos"
ON alunos_disciplinas
FOR UPDATE
TO authenticated
USING (
    -- Monitor pode atualizar matrículas de alunos do seu subnúcleo na sua disciplina
    EXISTS (
        SELECT 1
        FROM escalas_monitores em
        INNER JOIN alunos a ON a.id = alunos_disciplinas.aluno_id
        WHERE em.monitor_id = auth.uid()
        AND em.subnucleo_id = a.subnucleo_id
        AND em.disciplina_id = alunos_disciplinas.disciplina_id
    )
    OR
    -- Admins e diretoria podem atualizar tudo
    EXISTS (
        SELECT 1
        FROM usuarios u
        WHERE u.id = auth.uid()
        AND u.tipo IN ('admin', 'diretoria')
    )
)
WITH CHECK (
    -- Mesma condição para o WITH CHECK
    EXISTS (
        SELECT 1
        FROM escalas_monitores em
        INNER JOIN alunos a ON a.id = alunos_disciplinas.aluno_id
        WHERE em.monitor_id = auth.uid()
        AND em.subnucleo_id = a.subnucleo_id
        AND em.disciplina_id = alunos_disciplinas.disciplina_id
    )
    OR
    EXISTS (
        SELECT 1
        FROM usuarios u
        WHERE u.id = auth.uid()
        AND u.tipo IN ('admin', 'diretoria')
    )
);
