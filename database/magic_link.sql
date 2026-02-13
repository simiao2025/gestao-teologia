-- Função para enviar magic link para novo aluno
CREATE OR REPLACE FUNCTION enviar_magic_link_aluno(
    p_email TEXT,
    p_token TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    magic_url TEXT;
BEGIN
    -- Construir URL do magic link
    magic_url := 'http://localhost:3000/login?token=' || p_token || '&email=' || encode(p_email, 'url');
    
    -- Aqui você pode integrar com um serviço de email
    -- Por enquanto, apenas log o magic link
    RAISE NOTICE 'Magic link gerado para %: %', p_email, magic_url;
    
    -- Retornar sucesso
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar e consumir magic link
CREATE OR REPLACE FUNCTION verificar_magic_link(
    p_token TEXT,
    p_email TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    token_valido BOOLEAN;
BEGIN
    -- Verificar se o token existe e é válido
    SELECT EXISTS(
        SELECT 1 
        FROM auth.users 
        WHERE confirmation_token = p_token 
        AND email = p_email 
        AND confirmation_sent_at > NOW() - INTERVAL '24 hours'
    ) INTO token_valido;
    
    -- Se válido, confirmar email e limpar token
    IF token_valido THEN
        UPDATE auth.users 
        SET 
            email_confirmed_at = NOW(),
            confirmation_token = NULL,
            confirmation_sent_at = NULL
        WHERE confirmation_token = p_token 
        AND email = p_email;
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
