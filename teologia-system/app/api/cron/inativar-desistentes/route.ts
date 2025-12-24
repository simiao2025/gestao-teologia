import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    // Proteção contra chamadas não autorizadas
    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    try {
        console.log('[CRON] Iniciando rotina de inativação de desistentes...')

        // 1. Calcular data de corte (60 dias atrás)
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - 60)
        const cutoffISO = cutoffDate.toISOString()

        // 2. Buscar disciplinas que tiveram data limite de pedido há mais de 60 dias
        const { data: disciplinasAtrasadas, error: discError } = await supabase
            .from('disciplinas')
            .select('id, nome, nivel_id, data_limite_pedido')
            .lt('data_limite_pedido', cutoffISO)

        if (discError) throw discError

        if (!disciplinasAtrasadas || disciplinasAtrasadas.length === 0) {
            return NextResponse.json({ status: 'sucesso', message: 'Nenhuma disciplina com prazo de 60 dias expirado.' })
        }

        const stats = {
            alunosInativados: 0,
            disciplinasVerificadas: disciplinasAtrasadas.length
        }

        for (const disc of disciplinasAtrasadas) {
            // 3. Buscar alunos ATIVOS desse nível
            const { data: alunosNoNivel, error: alunosError } = await supabase
                .from('alunos')
                .select('id')
                .eq('nivel_id', disc.nivel_id)
                .eq('status', 'ativo')

            if (alunosError) {
                console.error(`[CRON] Erro ao buscar alunos do nível ${disc.nivel_id}:`, alunosError)
                continue
            }

            if (!alunosNoNivel || alunosNoNivel.length === 0) continue

            const idsAlunosNivel = alunosNoNivel.map(a => a.id)

            // 4. Buscar quem JÁ pagou essa disciplina
            const { data: pedidosPagos, error: pedidosError } = await supabase
                .from('pedidos')
                .select('aluno_id')
                .eq('disciplina_id', disc.id)
                .eq('status', 'pago')

            if (pedidosError) {
                console.error(`[CRON] Erro ao buscar pedidos da disciplina ${disc.id}:`, pedidosError)
                continue
            }

            const idsPagos = new Set(pedidosPagos?.map(p => p.aluno_id) || [])

            // 5. Filtrar alunos que não pediram (ou não pagaram)
            const idsParaInativar = idsAlunosNivel.filter(id => !idsPagos.has(id))

            if (idsParaInativar.length > 0) {
                // 6. Atualizar status para 'desistente'
                const { error: updateError } = await supabase
                    .from('alunos')
                    .update({ status: 'desistente' })
                    .in('id', idsParaInativar)

                if (updateError) {
                    console.error(`[CRON] Erro ao inativar alunos da disciplina ${disc.nome}:`, updateError)
                } else {
                    stats.alunosInativados += idsParaInativar.length
                }
            }
        }

        return NextResponse.json({
            success: true,
            summary: stats
        })

    } catch (error: any) {
        console.error('[CRON] Erro fatal na rotina de inativação:', error)
        return NextResponse.json({ error: 'Erro interno', details: error.message }, { status: 500 })
    }
}
