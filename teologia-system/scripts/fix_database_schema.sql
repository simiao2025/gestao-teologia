-- SQL para corrigir restrições de chave estrangeira e permitir a atualização do ID do usuário
-- Execute este script no SQL Editor do Supabase Dashboard caso receba erro 'still referenced from table "alunos"'

-- 1. Remover restrição antiga e adicionar com ON UPDATE CASCADE na tabela ALUNOS
ALTER TABLE alunos 
DROP CONSTRAINT IF EXISTS alunos_id_fkey,
ADD CONSTRAINT alunos_id_fkey 
  FOREIGN KEY (id) REFERENCES usuarios(id) 
  ON UPDATE CASCADE 
  ON DELETE CASCADE;

-- 2. Corrigir FKs em PEDIDOS (se existir restrição)
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'pedidos_aluno_id_fkey') THEN
    ALTER TABLE pedidos DROP CONSTRAINT pedidos_aluno_id_fkey;
  END IF;
END $$;
ALTER TABLE pedidos 
ADD CONSTRAINT pedidos_aluno_id_fkey 
  FOREIGN KEY (aluno_id) REFERENCES usuarios(id) 
  ON UPDATE CASCADE;

-- 3. Corrigir FKs em ALUNOS_DISCIPLINAS
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'alunos_disciplinas_aluno_id_fkey') THEN
    ALTER TABLE alunos_disciplinas DROP CONSTRAINT alunos_disciplinas_aluno_id_fkey;
  END IF;
END $$;
ALTER TABLE alunos_disciplinas 
ADD CONSTRAINT alunos_disciplinas_aluno_id_fkey 
  FOREIGN KEY (aluno_id) REFERENCES usuarios(id) 
  ON UPDATE CASCADE;

-- 4. Corrigir FK em SUBNUCLEOS (Monitor)
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'subnucleos_monitor_id_fkey') THEN
    ALTER TABLE subnucleos DROP CONSTRAINT subnucleos_monitor_id_fkey;
  END IF;
END $$;
ALTER TABLE subnucleos 
ADD CONSTRAINT subnucleos_monitor_id_fkey 
  FOREIGN KEY (monitor_id) REFERENCES usuarios(id) 
  ON UPDATE CASCADE;
