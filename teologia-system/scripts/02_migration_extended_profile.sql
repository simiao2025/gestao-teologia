-- Migração: Adicionar colunas para Perfil Estendido de Alunos
-- Adiciona campos pessoais, eclesiásticos e acadêmicos

ALTER TABLE alunos 
ADD COLUMN IF NOT EXISTS rg VARCHAR(20),
ADD COLUMN IF NOT EXISTS estado_civil VARCHAR(20),
ADD COLUMN IF NOT EXISTS naturalidade VARCHAR(100),
ADD COLUMN IF NOT EXISTS uf_nascimento CHAR(2),
ADD COLUMN IF NOT EXISTS escolaridade VARCHAR(50),
ADD COLUMN IF NOT EXISTS profissao VARCHAR(100),
ADD COLUMN IF NOT EXISTS cargo_igreja VARCHAR(100),
ADD COLUMN IF NOT EXISTS congregacao VARCHAR(100),
ADD COLUMN IF NOT EXISTS ja_estudou_teologia BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS instituicao_teologia VARCHAR(150);

-- Comentários para documentação no banco
COMMENT ON COLUMN alunos.rg IS 'Documento de Identidade do aluno';
COMMENT ON COLUMN alunos.estado_civil IS 'Estado civil do aluno';
COMMENT ON COLUMN alunos.naturalidade IS 'Cidade de nascimento';
COMMENT ON COLUMN alunos.uf_nascimento IS 'Estado de nascimento';
COMMENT ON COLUMN alunos.escolaridade IS 'Nível de escolaridade';
COMMENT ON COLUMN alunos.profissao IS 'Profissão ou ocupação principal';
COMMENT ON COLUMN alunos.cargo_igreja IS 'Cargo ou função na igreja';
COMMENT ON COLUMN alunos.congregacao IS 'Nome da congregação/igreja local';
COMMENT ON COLUMN alunos.ja_estudou_teologia IS 'Se o aluno já teve formação teológica prévia';
COMMENT ON COLUMN alunos.instituicao_teologia IS 'Nome da instituição onde estudou teologia anteriormente';
