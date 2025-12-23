import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

/**
 * Utilitário para verificar se o usuário logado tem permissão de administrador
 * Deve ser usado dentro de Rotas de API (Route Handlers)
 */
export async function verifyAdminSession() {
    try {
        const cookieStore = cookies()
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!

        // Criar cliente com Service Role para bypassar RLS na verificação do cargo
        const supabase = createClient(supabaseUrl, supabaseServiceRole, {
            auth: {
                persistSession: false,
                autoRefreshToken: false
            }
        })

        // 1. Obter a sessão do usuário a partir dos cookies
        // Nota: No App Router, precisamos pegar o token manualmente ou usar o client auth
        // Como simplificação para ambiente Next.js, verificamos o usuário atual

        // Em um ambiente real com middleware de auth, o token estaria disponível.
        // Se não houver middleware robusto, buscamos a sessão do cliente logado se possível,
        // mas aqui usaremos a abordagem de verificar o usuário via auth.getUser() 
        // passando os cookies (se houver um helper para isso) ou apenas validando o token JWT.

        // Para este projeto (Next 14), a forma mais segura sem middleware de terceiros:
        const { data: { user }, error: authError } = await (createClient(supabaseUrl, supabaseAnonKey, {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        })).auth.getUser()

        if (authError || !user) {
            console.warn('verifyAdminSession: Sessão não encontrada ou erro de auth', authError?.message)
            return { isAdmin: false, error: 'Não autenticado' }
        }

        // 2. Verificar o 'tipo' na tabela 'usuarios'
        const { data: userData, error: dbError } = await supabase
            .from('usuarios')
            .select('tipo')
            .eq('id', user.id)
            .single()

        if (dbError || !userData) {
            console.error('verifyAdminSession: Erro ao buscar tipo do usuário no DB', dbError)
            return { isAdmin: false, error: 'Erro ao validar perfil' }
        }

        const allowed = ['admin', 'diretoria'].includes(userData.tipo)

        return {
            isAdmin: allowed,
            user: { ...user, tipo: userData.tipo },
            error: allowed ? null : 'Acesso negado: Requer privilégios de administrador'
        }
    } catch (err: any) {
        console.error('verifyAdminSession: Exceção crítica', err)
        return { isAdmin: false, error: 'Erro interno de validação' }
    }
}
