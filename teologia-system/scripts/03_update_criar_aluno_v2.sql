-- Atualização da função criar_aluno para incluir novos campos de perfil
-- Suporta os novos campos como parâmetros opcionais

-- Primeiro, remova a função antiga para evitar conflitos de assinatura
-- (A assinatura antiga tinha 8 parâmetros)
DROP FUNCTION IF EXISTS criar_aluno(text, text, text, text, text, text, uuid, uuid);

CREATE OR REPLACE FUNCTION criar_aluno(
  p_nome text,
  p_email text,
  p_telefone text,
  p_cpf text,
  p_data_nascimento text,
  p_endereco text,
  p_subnucleo_id uuid,
  p_nivel_id uuid DEFAULT NULL,
  -- Novos parâmetros opcionais
  p_rg text DEFAULT NULL,
  p_estado_civil text DEFAULT NULL,
  p_naturalidade text DEFAULT NULL,
  p_uf_nascimento text DEFAULT NULL,
  p_escolaridade text DEFAULT NULL,
  p_profissao text DEFAULT NULL,
  p_cargo_igreja text DEFAULT NULL,
  p_congregacao text DEFAULT NULL,
  p_ja_estudou_teologia boolean DEFAULT FALSE,
  p_instituicao_teologia text DEFAULT NULL
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
  
  -- Inserir na tabela alunos com todos os campos
  INSERT INTO alunos (
    id, 
    cpf, 
    data_nascimento, 
    endereco, 
    subnucleo_id, 
    nivel_atual_id, 
    status,
    rg,
    estado_civil,
    naturalidade,
    uf_nascimento,
    escolaridade,
    profissao,
    cargo_igreja,
    congregacao,
    ja_estudou_teologia,
    instituicao_teologia
  )
  VALUES (
    v_user_id, 
    p_cpf, 
    p_data_nascimento::date, 
    p_endereco, 
    p_subnucleo_id, 
    p_nivel_id, 
    'ativo',
    p_rg,
    p_estado_civil,
    p_naturalidade,
    p_uf_nascimento,
    p_escolaridade,
    p_profissao,
    p_cargo_igreja,
    p_congregacao,
    p_ja_estudou_teologia,
    p_instituicao_teologia
  );
  
  RETURN v_user_id;
END;
$$;
