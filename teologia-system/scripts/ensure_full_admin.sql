-- SQL para garantir acesso total ao administrador

-- 1. Promover o usuário atual a admin
-- Substitua 'seu-email@exemplo.com' pelo seu email de login
UPDATE usuarios 
SET tipo = 'admin' 
WHERE email = 'simacjr@hotmail.com';

-- 2. Garantir que RLS permita acesso total para admins nas tabelas principais

-- Tabela: usuarios
DROP POLICY IF EXISTS "Usuários podem ver próprios dados" ON usuarios;
DROP POLICY IF EXISTS "Admins e Monitores podem ver outros usuários" ON usuarios;
CREATE POLICY "Admins podem ver tudo em usuarios" ON usuarios FOR ALL TO authenticated USING (
    (SELECT tipo FROM usuarios WHERE id = auth.uid()) IN ('admin', 'diretoria')
    OR id = auth.uid()
);

-- Tabela: alunos
DROP POLICY IF EXISTS "Alunos podem ver próprios dados" ON alunos;
DROP POLICY IF EXISTS "Permitir inserção de alunos" ON alunos;
DROP POLICY IF EXISTS "Monitores podem ver alunos dos seus subnúcleos" ON alunos;
CREATE POLICY "Admins podem ver tudo em alunos" ON alunos FOR ALL TO authenticated USING (
    (SELECT tipo FROM usuarios WHERE id = auth.uid()) IN ('admin', 'diretoria')
    OR id = auth.uid()
);

-- Tabela: alunos_disciplinas (Histórico/Notas)
DROP POLICY IF EXISTS "Monitores podem ver matrículas dos seus alunos" ON alunos_disciplinas;
DROP POLICY IF EXISTS "Monitores podem atualizar notas dos seus alunos" ON alunos_disciplinas;
CREATE POLICY "Admins podem ver tudo em alunos_disciplinas" ON alunos_disciplinas FOR ALL TO authenticated USING (
    (SELECT tipo FROM usuarios WHERE id = auth.uid()) IN ('admin', 'diretoria')
    OR aluno_id = auth.uid()
);

-- Tabela: pedidos
DROP POLICY IF EXISTS "Alunos podem ver próprios pedidos" ON pedidos;
CREATE POLICY "Admins podem ver tudo em pedidos" ON pedidos FOR ALL TO authenticated USING (
    (SELECT tipo FROM usuarios WHERE id = auth.uid()) IN ('admin', 'diretoria')
    OR aluno_id = auth.uid()
);

-- Tabela: subnucleos
DROP POLICY IF EXISTS "Admins podem ver tudo em subnucleos" ON subnucleos;
CREATE POLICY "Admins podem ver tudo em subnucleos" ON subnucleos FOR ALL TO authenticated USING (
    (SELECT tipo FROM usuarios WHERE id = auth.uid()) IN ('admin', 'diretoria')
    OR monitor_id = auth.uid()
);

-- Tabela: disciplinas
CREATE POLICY "Admins podem ver tudo em disciplinas" ON disciplinas FOR ALL TO authenticated USING (
    (SELECT tipo FROM usuarios WHERE id = auth.uid()) IN ('admin', 'diretoria')
);

-- Tabela: niveis
CREATE POLICY "Admins podem ver tudo em niveis" ON niveis FOR ALL TO authenticated USING (
    (SELECT tipo FROM usuarios WHERE id = auth.uid()) IN ('admin', 'diretoria')
);

-- Tabela: config_sistema
CREATE POLICY "Admins podem ver tudo em config_sistema" ON config_sistema FOR ALL TO authenticated USING (
    (SELECT tipo FROM usuarios WHERE id = auth.uid()) IN ('admin', 'diretoria')
);

-- Tabela: pagamentos_pix
CREATE POLICY "Admins podem ver tudo em pagamentos_pix" ON pagamentos_pix FOR ALL TO authenticated USING (
    (SELECT tipo FROM usuarios WHERE id = auth.uid()) IN ('admin', 'diretoria')
);
