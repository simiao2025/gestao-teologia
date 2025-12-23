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

        // Get all paid orders
        const { data: pedidosPagos, error: pedidosError } = await supabaseAdmin
            .from('pedidos')
            .select('*')
            .eq('status', 'pago')

        if (pedidosError) throw pedidosError

        // Get all enrollments
        const { data: matriculas, error: matriculasError } = await supabaseAdmin
            .from('alunos_disciplinas')
            .select('*')

        if (matriculasError) throw matriculasError

        const report = {
            total_paid_orders: pedidosPagos?.length || 0,
            total_enrollments: matriculas?.length || 0,
            enrollments_by_status: {
                cursando: matriculas?.filter(m => m.status === 'cursando').length || 0,
                aprovado: matriculas?.filter(m => m.status === 'aprovado').length || 0,
                reprovado: matriculas?.filter(m => m.status === 'reprovado').length || 0,
                pendente: matriculas?.filter(m => m.status === 'pendente').length || 0
            },
            paid_orders: pedidosPagos?.map(p => ({
                id: p.id,
                aluno_id: p.aluno_id,
                disciplina_id: p.disciplina_id,
                valor: p.valor,
                criado_em: p.criado_em,
                has_enrollment: matriculas?.some(m =>
                    m.aluno_id === p.aluno_id && m.disciplina_id === p.disciplina_id
                )
            }))
        }

        return NextResponse.json(report, { status: 200 })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
