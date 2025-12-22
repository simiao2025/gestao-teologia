import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    console.log('API-USUARIOS [POST]: Início da requisição')
    try {
        const body = await req.json()
        const { nome, email, senha, tipo } = body
        console.log('API-USUARIOS [POST]: Dados recebidos:', { nome, email, tipo, temSenha: !!senha })

        if (!email || !senha || !nome || !tipo) {
            console.warn('API-USUARIOS [POST]: Dados incompletos', body)
            return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
        }

        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('API-USUARIOS [POST]: Variáveis de ambiente faltando!')
            return NextResponse.json({ error: 'Configuração do servidor incompleta (Env Vars)' }, { status: 500 })
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const isConfirmed = tipo !== 'aluno'
        console.log(`API-USUARIOS [POST]: Criando usuário no Auth (Confirmado: ${isConfirmed})...`)
        // 1. Criar usuário no Auth (Admin)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: senha,
            email_confirm: isConfirmed,
            user_metadata: { nome, tipo }
        })

        if (authError) {
            if (authError.message.includes('already been registered')) {
                console.log('API-USUARIOS [POST]: E-mail já existe no Auth. Sincronizando...')
                // Buscar usuário existente por e-mail
                const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
                if (listError) throw listError

                const existingAuthUser = users.users.find(u => u.email === email)
                if (existingAuthUser) {
                    // Simular authData para continuar o fluxo
                    authData.user = existingAuthUser as any

                    // Atualizar metadados do usuário existente e CONFIRMAR e-mail se não for aluno
                    await supabaseAdmin.auth.admin.updateUserById(existingAuthUser.id, {
                        user_metadata: { nome, tipo },
                        password: senha,
                        email_confirm: isConfirmed // Segue a mesma lógica do cargo
                    })
                } else {
                    throw authError
                }
            } else {
                console.error('API-USUARIOS [POST]: Erro ao criar no Auth:', authError)
                return NextResponse.json({
                    error: 'Erro ao criar usuário na autenticação',
                    details: authError.message,
                    code: authError.status
                }, { status: 500 })
            }
        }

        console.log('API-USUARIOS [POST]: Usuário Auth criado!', authData.user.id)

        // 2. Inserir na tabela public.usuarios
        console.log('API-USUARIOS [POST]: Inserindo na tabela usuarios...')
        const { error: dbError } = await supabaseAdmin
            .from('usuarios')
            .upsert([{ // Usar upsert para ser mais resiliente
                id: authData.user.id,
                nome,
                email,
                tipo
            }], { onConflict: 'email' }) // Se já existir por email, tenta atualizar o ID

        if (dbError) {
            console.error('API-USUARIOS [POST]: Erro ao inserir no Banco:', dbError)
            return NextResponse.json({
                error: 'Usuário autenticado, mas erro ao salvar no banco de dados.',
                details: dbError.message,
                dbCode: dbError.code
            }, { status: 500 })
        }

        console.log('API-USUARIOS [POST]: Sucesso total!')
        return NextResponse.json({ success: true, user: authData.user })
    } catch (error: any) {
        console.error('API-USUARIOS [POST]: EXCEÇÃO CRÍTICA:', error)
        return NextResponse.json({
            error: 'Erro interno ao processar cadastro',
            details: error.message || error,
            stack: error.stack
        }, { status: 500 })
    }
}

export async function PATCH(req: Request) {
    try {
        const { id, nome, email, senha, tipo } = await req.json()

        if (!id) {
            return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 })
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const isConfirmed = tipo !== 'aluno'
        // 1. Atualizar no Auth (Admin)
        const updateData: any = {
            user_metadata: { nome, tipo },
            email_confirm: isConfirmed
        }
        if (senha) updateData.password = senha
        if (email) updateData.email = email

        let authData: any = null
        let authError: any = null

        // Tentar atualizar por ID primeiro
        const { data: primaryUpdate, error: primaryError } = await supabaseAdmin.auth.admin.updateUserById(id, updateData)
        authData = primaryUpdate
        authError = primaryError

        if (authError && (authError.message.includes('not found') || authError.status === 404)) {
            console.log('ID não encontrado no Auth, tentando buscar por e-mail...', email)

            // Tentar buscar por e-mail para ver se já existe com outro ID
            const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
            if (listError) throw listError

            const existingUser = users.users.find(u => u.email === email)

            if (existingUser) {
                console.log('Usuário encontrado por e-mail no Auth. Sincronizando ID...', existingUser.id)
                // Atualizar o ID no banco e então os dados no Auth
                await supabaseAdmin.from('usuarios').update({ id: existingUser.id, nome, email, tipo }).eq('email', email)
                const { data: syncUpdate, error: syncError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, updateData)
                if (syncError) throw syncError
                authData = syncUpdate
                authError = null
            } else {
                console.log('Usuário não existe no Auth. Criando...', email)
                const { data: newData, error: createError } = await supabaseAdmin.auth.admin.createUser({
                    email,
                    password: senha || '123456',
                    email_confirm: isConfirmed,
                    user_metadata: { nome, tipo }
                })
                if (createError) throw createError
                authData = newData
                authError = null
                // Atualizar o ID no banco para o novo ID criado
                await supabaseAdmin.from('usuarios').update({ id: authData.user.id, nome, email, tipo }).eq('email', email)
            }
        } else if (authError) {
            throw authError
        }

        // 2. Atualizar na tabela public.usuarios
        const { error: dbError } = await supabaseAdmin
            .from('usuarios')
            .update({
                nome,
                email,
                tipo
            })
            .eq('id', id)

        if (dbError) {
            console.error('Erro DB Admin Update:', dbError)
            return NextResponse.json({
                message: 'Usuário atualizado no Auth, mas erro ao sincronizar no banco.',
                error: dbError.message
            }, { status: 500 })
        }

        return NextResponse.json({ success: true, user: authData.user })
    } catch (error: any) {
        console.error('Erro na API de Usuários (PATCH):', error)
        return NextResponse.json({
            error: 'Erro ao atualizar usuário',
            details: error.message || error
        }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 })
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // 1. Tentar deletar dependências de Aluno (devido a FKs)
        // Ordem: Pagamentos -> Pedidos -> Aluno_Disciplina -> Aluno -> Usuario

        // Buscar pedidos do aluno para limpar pagamentos vinculados
        const { data: userPedidos } = await supabaseAdmin
            .from('pedidos')
            .select('id')
            .eq('aluno_id', id)

        if (userPedidos && userPedidos.length > 0) {
            const pedidoIds = userPedidos.map(p => p.id)
            await supabaseAdmin.from('pagamentos_pix').delete().in('pedido_id', pedidoIds)
            await supabaseAdmin.from('pedidos').delete().eq('aluno_id', id)
        }

        // Limpar registros acadêmicos
        await supabaseAdmin.from('aluno_disciplina').delete().eq('aluno_id', id)

        // Limpar o registro de aluno
        await supabaseAdmin.from('alunos').delete().eq('id', id)

        // 2. Deletar na tabela public.usuarios
        const { error: dbError } = await supabaseAdmin
            .from('usuarios')
            .delete()
            .eq('id', id)

        if (dbError) {
            console.error('Erro ao deletar no DB:', dbError)
            return NextResponse.json({
                error: 'Erro ao deletar registro no banco de dados',
                details: dbError.message
            }, { status: 500 })
        }

        // 3. Deletar no Auth (Admin)
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)
        if (authError && !authError.message.includes('not found')) {
            console.error('Erro ao deletar no Auth:', authError)
            return NextResponse.json({
                error: 'Usuário deletado do banco, mas erro ao remover do Auth',
                details: authError.message
            }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Erro na API de Usuários (DELETE):', error)
        return NextResponse.json({
            error: 'Erro interno ao deletar usuário',
            details: error.message || error
        }, { status: 500 })
    }
}
