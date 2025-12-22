-- Migração Fase 1: Ciclo Acadêmico e Configurações

-- 1. Atualizar a tabela de disciplinas com os novos campos de controle
ALTER TABLE disciplinas 
ADD COLUMN IF NOT EXISTS status_acad text DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS data_limite_pedido timestamp with time zone,
ADD COLUMN IF NOT EXISTS lembrete_enviado boolean DEFAULT false;

-- Adicionar restrição de valores para o status (opcional, mas recomendado)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'disciplinas_status_acad_check') THEN
        ALTER TABLE disciplinas 
        ADD CONSTRAINT disciplinas_status_acad_check 
        CHECK (status_acad IN ('pendente', 'proximo_pedido', 'ja_pedido', 'finalizado'));
    END IF;
END $$;

-- 2. Criar tabela de configuração do sistema
CREATE TABLE IF NOT EXISTS config_sistema (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Identidade
    nome_instituicao text DEFAULT 'Sistema Teologia',
    logo_url text,
    -- Contato e APIs
    whatsapp_secretaria text,
    evolution_url text,
    evolution_apikey text,
    evolution_instance text,
    -- Mercado Pago
    mp_access_token text,
    mp_public_key text,
    -- Timestamps
    criado_em timestamp with time zone DEFAULT now(),
    atualizado_em timestamp with time zone DEFAULT now()
);

-- 3. Habilitar RLS em config_sistema
ALTER TABLE config_sistema ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas para config_sistema
-- Apenas admins podem ler e editar
CREATE POLICY "Admins podem ver as configurações" 
ON config_sistema FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM usuarios 
        WHERE id = auth.uid() AND tipo IN ('admin', 'diretoria')
    )
);

CREATE POLICY "Admins podem atualizar as configurações" 
ON config_sistema FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM usuarios 
        WHERE id = auth.uid() AND tipo IN ('admin', 'diretoria')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM usuarios 
        WHERE id = auth.uid() AND tipo IN ('admin', 'diretoria')
    )
);

-- 5. Inserir registro inicial se não existir
INSERT INTO config_sistema (whatsapp_secretaria)
SELECT '5500000000000' -- Valor padrão
WHERE NOT EXISTS (SELECT 1 FROM config_sistema);
