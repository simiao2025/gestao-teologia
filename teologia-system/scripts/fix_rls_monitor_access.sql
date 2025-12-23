-- Script para corrigir acesso do Monitor ao Lançamento de Notas

-- 1. Permitir que Monitores e Admins vejam os usuários (vínculo com Alunos)
DROP POLICY IF EXISTS "Admins podem ver tudo em usuarios" ON usuarios;
CREATE POLICY "Leitura de usuários para autenticados" 
ON usuarios FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Admins podem tudo em usuarios" 
ON usuarios FOR ALL 
TO authenticated 
USING ((SELECT tipo FROM usuarios WHERE id = auth.uid()) IN ('admin', 'diretoria'));

-- 2. Permitir que Monitores vejam Alunos de seus subnúcleos
DROP POLICY IF EXISTS "Admins podem ver tudo em alunos" ON alunos;
CREATE POLICY "Leitura de alunos para monitores da escala" 
ON alunos FOR SELECT 
TO authenticated 
USING (
    (SELECT tipo FROM usuarios WHERE id = auth.uid()) IN ('admin', 'diretoria')
    OR
    EXISTS (
        SELECT 1 FROM escalas_monitores em 
        WHERE em.monitor_id = auth.uid() 
        AND em.subnucleo_id = alunos.subnucleo_id
    )
);

CREATE POLICY "Admins podem tudo em alunos" 
ON alunos FOR ALL 
TO authenticated 
USING ((SELECT tipo FROM usuarios WHERE id = auth.uid()) IN ('admin', 'diretoria'));

-- 3. Permitir que Monitores vejam matrículas (alunos_disciplinas)
DROP POLICY IF EXISTS "Admins podem ver tudo em alunos_disciplinas" ON alunos_disciplinas;
CREATE POLICY "Leitura de matriculas para monitores da escala" 
ON alunos_disciplinas FOR SELECT 
TO authenticated 
USING (
    (SELECT tipo FROM usuarios WHERE id = auth.uid()) IN ('admin', 'diretoria')
    OR
    EXISTS (
        SELECT 1 FROM escalas_monitores em 
        INNER JOIN alunos a ON a.id = alunos_disciplinas.aluno_id
        WHERE em.monitor_id = auth.uid() 
        AND em.subnucleo_id = a.subnucleo_id
        AND em.disciplina_id = alunos_disciplinas.disciplina_id
    )
);

CREATE POLICY "Monitores podem atualizar notas de suas escalas" 
ON alunos_disciplinas FOR UPDATE 
TO authenticated 
USING (
    (SELECT tipo FROM usuarios WHERE id = auth.uid()) IN ('admin', 'diretoria')
    OR
    EXISTS (
        SELECT 1 FROM escalas_monitores em 
        INNER JOIN alunos a ON a.id = alunos_disciplinas.aluno_id
        WHERE em.monitor_id = auth.uid() 
        AND em.subnucleo_id = a.subnucleo_id
        AND em.disciplina_id = alunos_disciplinas.disciplina_id
    )
)
WITH CHECK (true);

CREATE POLICY "Admins podem tudo em alunos_disciplinas" 
ON alunos_disciplinas FOR ALL 
TO authenticated 
USING ((SELECT tipo FROM usuarios WHERE id = auth.uid()) IN ('admin', 'diretoria'));

-- 4. Liberar leitura de Disciplinas e Níveis para todos autenticados
DROP POLICY IF EXISTS "Admins podem ver tudo em disciplinas" ON disciplinas;
CREATE POLICY "Leitura de disciplinas para autenticados" 
ON disciplinas FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Admins podem ver tudo em niveis" ON niveis;
CREATE POLICY "Leitura de niveis para autenticados" 
ON niveis FOR SELECT 
TO authenticated 
USING (true);

-- 5. Garantir leitura de Subnúcleos para Monitores
DROP POLICY IF EXISTS "Admins podem ver tudo em subnucleos" ON subnucleos;
CREATE POLICY "Leitura de subnucleos para autenticados" 
ON subnucleos FOR SELECT 
TO authenticated 
USING (true);
