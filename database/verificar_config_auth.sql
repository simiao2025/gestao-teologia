-- Script para verificar configuração de autenticação do Supabase
-- Execute no SQL Editor do Supabase

-- 1. Verificar configurações atuais de autenticação
SELECT * FROM auth.config WHERE key IN ('site_url', 'redirect_whitelist');

-- 2. Verificar se há configurações de URL no sistema
SELECT 
    key,
    value,
    created_at,
    updated_at
FROM auth.config 
WHERE key LIKE '%url%' 
   OR key LIKE '%redirect%' 
   OR key LIKE '%site%'
ORDER BY key;

-- 3. Verificar logs de autenticação recentes para identificar problemas
SELECT 
    event,
    user_id,
    ip_address,
    created_at,
    metadata
FROM auth.audit_log 
WHERE created_at >= NOW() - INTERVAL '1 hour'
  AND event IN ('magic_link', 'login', 'signup')
ORDER BY created_at DESC
LIMIT 10;

-- 4. Verificar se há policies que possam estar bloqueando
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'auth' OR tablename = 'users';

-- 5. Verificar configuração do JWT
SELECT 
    iss AS issuer,
    aud AS audience,
    exp AS expiration_time
FROM jwt();

-- 6. Testar se auth.uid() funciona (deve retornar NULL no SQL Editor)
SELECT 
    auth.uid() AS current_uid,
    auth.jwt() AS current_jwt;

-- 7. Verificar se há algum problema com a tabela auth.users
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_emails,
    COUNT(CASE WHEN last_sign_in_at >= NOW() - INTERVAL '1 hour' THEN 1 END) as recent_signins
FROM auth.users;

-- 8. Verificar se há configurações de tempo de expiração
SELECT 
    key,
    value,
    created_at
FROM auth.config 
WHERE key LIKE '%expir%' 
   OR key LIKE '%time%' 
   OR key LIKE '%duration%'
ORDER BY key;

-- Instruções:
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Verifique se o site_url está configurado como http://localhost:3001
-- 3. Verifique se http://localhost:3001/auth/callback está na redirect_whitelist
-- 4. Se necessário, atualize as configurações com:
--    UPDATE auth.config SET value = 'http://localhost:3001' WHERE key = 'site_url';
--    UPDATE auth.config SET value = '["http://localhost:3001/auth/callback"]' WHERE key = 'redirect_whitelist';
