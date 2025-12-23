-- Migração: Adicionar campos de endereço detalhados (Cidade, UF, CEP)
-- Adiciona campos para melhor geocalização e logística de materiais

ALTER TABLE alunos 
ADD COLUMN IF NOT EXISTS cidade VARCHAR(100),
ADD COLUMN IF NOT EXISTS estado CHAR(2),
ADD COLUMN IF NOT EXISTS cep VARCHAR(10);

-- Comentários para documentação no banco
COMMENT ON COLUMN alunos.cidade IS 'Cidade de residência do aluno';
COMMENT ON COLUMN alunos.estado IS 'Estado (UF) de residência do aluno';
COMMENT ON COLUMN alunos.cep IS 'CEP do endereço de residência';
