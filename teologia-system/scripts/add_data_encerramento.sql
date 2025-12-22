-- Adiciona campo para data de encerramento da disciplina
ALTER TABLE disciplinas 
ADD COLUMN IF NOT EXISTS data_encerramento TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN disciplinas.data_encerramento IS 'Data em que a disciplina foi finalizada no ciclo acadêmico';
