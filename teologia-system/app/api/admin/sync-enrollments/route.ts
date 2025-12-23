import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/auth-server'

export const dynamic = 'force-dynamic'

export async function GET() {
    const { isAdmin, error: authError } = await verifyAdminSession()
    if (!isAdmin) {
        return NextResponse.json({ error: authError || 'Acesso negado' }, { status: 403 })
    }

    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // 1. Get all paid orders
        const { data: pedidos, error: pedidosError } = await supabaseAdmin
            .from('pedidos')
            .select('*')
            .eq('status', 'pago')

        if (pedidosError) throw pedidosError

        const results = {
            total_paid: pedidos.length,
            fixed: 0,
            already_enrolled: 0,
            details: [] as string[]
        }

        // 2. Check and fix enrollments
        for (const pedido of pedidos) {
            const { data: enrollment } = await supabaseAdmin
                .from('alunos_disciplinas')
                .select('id')
                .eq('aluno_id', pedido.aluno_id)
                .eq('disciplina_id', pedido.disciplina_id)
                .single()

            if (!enrollment) {
                // Fix: Create missing enrollment
                const { error: insertError } = await supabaseAdmin
                    .from('alunos_disciplinas')
                    .insert({
                        aluno_id: pedido.aluno_id,
                        disciplina_id: pedido.disciplina_id,
                        status: 'cursando',
                        criado_em: new Date().toISOString()
                    })

                if (insertError) {
                    results.details.push(`Failed to enroll order ${pedido.id}: ${insertError.message}`)
                } else {
                    results.fixed++
                    results.details.push(`Fixed: Enrolled student ${pedido.aluno_id} in discipline ${pedido.disciplina_id}`)
                }
            } else {
                results.already_enrolled++
            }
        }

        return NextResponse.json(results)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
