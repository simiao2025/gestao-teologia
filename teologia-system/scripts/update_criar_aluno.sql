-- SQL para atualizar a função criar_aluno no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- Primeiro, remova a função antiga
DROP FUNCTION IF EXISTS criar_aluno(text, text, text, text, text, text, uuid);

-- Crie a nova função com o parâmetro p_nivel_id
CREATE OR REPLACE FUNCTION criar_aluno(
  p_nome text,
  p_email text,
  p_telefone text,
  p_cpf text,
  p_data_nascimento text,
  p_endereco text,
  p_subnucleo_id uuid,
  p_nivel_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Gerar UUID para o novo usuário
  v_user_id := gen_random_uuid();
  
  -- Inserir na tabela usuarios
  INSERT INTO usuarios (id, nome, email, telefone, tipo)
  VALUES (v_user_id, p_nome, p_email, p_telefone, 'aluno');
  
  -- Inserir na tabela alunos
  INSERT INTO alunos (id, cpf, data_nascimento, endereco, subnucleo_id, nivel_atual_id, status)
  VALUES (v_user_id, p_cpf, p_data_nascimento::date, p_endereco, p_subnucleo_id, p_nivel_id, 'ativo');
  
  RETURN v_user_id;
END;
$$;

-- Nota: Se a coluna 'nivel_atual_id' não existir na tabela 'alunos', execute também:
-- ALTER TABLE alunos ADD COLUMN nivel_atual_id uuid REFERENCES niveis(id);
