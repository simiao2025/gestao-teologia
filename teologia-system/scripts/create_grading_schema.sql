-- Adicionar colunas de notas na tabela alunos_disciplinas
ALTER TABLE alunos_disciplinas 
ADD COLUMN IF NOT EXISTS nota1 DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS nota2 DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS nota3 DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS nota4 DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS nota5 DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS nota_recuperacao DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS media_final DECIMAL(4,2);

-- Criar tabela de escalas de monitores
CREATE TABLE IF NOT EXISTS escalas_monitores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monitor_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    subnucleo_id UUID NOT NULL REFERENCES subnucleos(id) ON DELETE CASCADE,
    disciplina_id UUID NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(monitor_id, subnucleo_id, disciplina_id)
);

-- Habilitar RLS na nova tabela
ALTER TABLE escalas_monitores ENABLE ROW LEVEL SECURITY;

-- Políticas para escalas_monitores
CREATE POLICY "Admin pode tudo em escalas_monitores" 
ON escalas_monitores FOR ALL 
TO authenticated 
USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo IN ('admin', 'diretoria')));

CREATE POLICY "Monitor pode ver suas próprias escalas" 
ON escalas_monitores FOR SELECT 
TO authenticated 
USING (monitor_id = auth.uid());

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_escalas_monitor ON escalas_monitores(monitor_id);
CREATE INDEX IF NOT EXISTS idx_escalas_subnucleo ON escalas_monitores(subnucleo_id);
CREATE INDEX IF NOT EXISTS idx_escalas_disciplina ON escalas_monitores(disciplina_id);
