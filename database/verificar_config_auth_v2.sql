-- Script para verificar configuração de autenticação do Supabase (Versão Corrigida)
-- Execute no SQL Editor do Supabase

-- 1. Verificar se schema auth existe e suas tabelas
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'auth' 
   OR table_name LIKE '%auth%'
   OR table_name LIKE '%config%'
ORDER BY table_schema, table_name;

-- 2. Verificar views relacionadas à autenticação
SELECT 
    table_schema,
    table_name
FROM information_schema.views 
WHERE table_schema = 'auth' 
   OR table_name LIKE '%auth%'
   OR table_name LIKE '%config%'
ORDER BY table_schema, table_name;

-- 3. Verificar funções de autenticação
SELECT 
    routine_schema,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'auth' 
   OR routine_name LIKE '%auth%'
ORDER BY routine_schema, routine_name;

-- 4. Verificar se existe tabela auth.users
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'auth' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- 5. Verificar logs de autenticação se existirem
SELECT 
    schemaname,
    tablename
FROM pg_tables 
WHERE schemaname = 'auth'
   OR tablename LIKE '%audit%'
   OR tablename LIKE '%log%'
ORDER BY schemaname, tablename;

-- 6. Verificar configurações do sistema que possam afetar auth
SELECT 
    name,
    setting
FROM pg_settings 
WHERE name LIKE '%auth%' 
   OR name LIKE '%jwt%' 
   OR name LIKE '%session%'
ORDER BY name;

-- 7. Verificar se auth.uid() funciona
SELECT 
    auth.uid() AS current_uid,
    auth.jwt() AS current_jwt,
    auth.email() AS current_email;

-- 8. Verificar extensões instaladas relacionadas à autenticação
SELECT 
    extname,
    extversion,
    extnamespace::regnamespace AS schema
FROM pg_extension 
WHERE extname LIKE '%auth%' 
   OR extname LIKE '%jwt%'
ORDER BY extname;

-- 9. Testar consulta simples na auth.users
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_emails
FROM auth.users;

-- 10. Verificar se há triggers ou functions que possam interferir
SELECT 
    event_object_schema,
    event_object_table,
    trigger_name,
    action_timing,
    action_condition,
    action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'auth'
   OR trigger_name LIKE '%auth%'
ORDER BY event_object_schema, event_object_table;

-- Instruções:
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Verifique quais tabelas/views realmente existem no schema auth
-- 3. Se auth.config não existir, as configurações devem ser feitas via painel do Supabase
-- 4. Se auth.users existir, o sistema de autenticação está ativo
