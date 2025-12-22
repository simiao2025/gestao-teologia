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
        console.log('[CRON] Iniciando verificação de lembretes WhatsApp...')

        // 1. Carregar Dados do Servidor (Antigos campos no DB agora são envs)
        const evolution_url = process.env.EVOLUTION_URL
        const evolution_apikey = process.env.EVOLUTION_APIKEY
        const evolution_instance = process.env.EVOLUTION_INSTANCE

        if (!evolution_url || !evolution_apikey || !evolution_instance) {
            console.warn('[CRON] Evolution API não configurada no servidor (.env.local).')
            return NextResponse.json({ error: 'Evolution API não configurada no servidor' }, { status: 400 })
        }

        // 2. Buscar Disciplinas com status 'proximo_pedido' e que possuem data limite
        const { data: disciplinas, error: discError } = await supabase
            .from('disciplinas')
            .select('*')
            .eq('status_acad', 'proximo_pedido')
            .not('data_limite_pedido', 'is', null)

        if (discError) {
            console.error('[CRON] Erro ao buscar disciplinas:', discError)
            return NextResponse.json({ error: 'Erro ao buscar disciplinas' }, { status: 500 })
        }

        if (!disciplinas || disciplinas.length === 0) {
            console.log('[CRON] Nenhuma disciplina ativa para pedidos no momento.')
            return NextResponse.json({ status: 'sem_disciplinas_ativas' })
        }

        const stats = {
            totalEnviados: 0,
            erros: 0,
            disciplinasProcessadas: [] as string[]
        }

        const now = new Date()

        for (const disc of disciplinas) {
            const deadline = new Date(disc.data_limite_pedido!)
            const hoursDiff = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60)

            let tipoLembrete: '48h' | '24h' | null = null

            // Regra 48h: Faltando entre 45h-48h e ainda não enviado
            if (hoursDiff > 45 && hoursDiff <= 48 && !disc.lembrete_48h_enviado) {
                tipoLembrete = '48h'
            }
            // Regra 24h: Faltando entre 21h-24h e ainda não enviado
            else if (hoursDiff > 21 && hoursDiff <= 24 && !disc.lembrete_24h_enviado) {
                tipoLembrete = '24h'
            }

            if (!tipoLembrete) continue

            console.log(`[CRON] Processando lembrete ${tipoLembrete} para: ${disc.nome}`)

            // 3. Resolver alunos que precisam de notificação
            // 3.1 Buscar IDs de alunos que pertencem ao nivel_id da disciplina
            const { data: alunosNoNivel } = await supabase
                .from('alunos')
                .select('id')
                .eq('nivel_id', disc.nivel_id)

            const idsAlunosNivel = alunosNoNivel?.map(a => a.id) || []
            if (idsAlunosNivel.length === 0) continue

            // 3.2 Buscar IDs de alunos que JÁ pediram esta disciplina
            const { data: jaPediram } = await supabase
                .from('pedidos')
                .select('aluno_id')
                .eq('disciplina_id', disc.id)

            const idsJaPediram = new Set(jaPediram?.map(p => p.aluno_id) || [])

            // 3.3 Filtrar apenas os que ainda NÃO pediram
            const idsParaNotificar = idsAlunosNivel.filter(id => !idsJaPediram.has(id))

            if (idsParaNotificar.length === 0) {
                console.log(`[CRON] Todos os alunos do nível ${disc.nivel_id} já pediram ${disc.nome}.`)
                // Atualizar flag para não processar de novo
                await supabase
                    .from('disciplinas')
                    .update(tipoLembrete === '48h' ? { lembrete_48h_enviado: true } : { lembrete_24h_enviado: true })
                    .eq('id', disc.id)
                continue
            }

            // 3.5 Buscar os dados de contato (usuarios) para esses IDs
            const { data: contatos } = await supabase
                .from('usuarios')
                .select('id, nome, telefone')
                .in('id', idsParaNotificar)

            if (!contatos || contatos.length === 0) continue

            console.log(`[CRON] Enviando ${contatos.length} mensagens para ${disc.nome}...`)

            // 4. Disparar via Evolution API
            for (const aluno of contatos) {
                if (!aluno.telefone) continue

                // Limpar telefone (apenas números e garantir DDI)
                let phone = aluno.telefone.replace(/\D/g, '')
                if (phone.length === 11) phone = '55' + phone // Assume BR se tiver 11 dígitos
                else if (phone.length === 10) phone = '55' + phone // Assume BR se tiver 10 dígitos

                const formattedDate = new Date(disc.data_limite_pedido!).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })

                const message = `A Paz do Senhor ${aluno.nome}, No sistema não consta o pedido do seu material da próxima disciplina ${disc.nome}. Faça o seu pedido antes do dia ${formattedDate}h. Obrigado!`

                try {
                    const response = await fetch(`${evolution_url}/message/sendText/${evolution_instance}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': evolution_apikey
                        },
                        body: JSON.stringify({
                            number: phone,
                            options: {
                                delay: 1200,
                                presence: 'composing'
                            },
                            textMessage: {
                                text: message
                            }
                        })
                    })

                    if (response.ok) {
                        stats.totalEnviados++
                    } else {
                        stats.erros++
                        const errorText = await response.text()
                        console.error(`[CRON] Erro Evolution API para ${aluno.nome}:`, errorText)
                    }
                } catch (err) {
                    console.error(`[CRON] Erro de rede para ${aluno.nome}:`, err)
                    stats.erros++
                }
            }

            // 5. Atualizar Flag na Disciplina
            await supabase
                .from('disciplinas')
                .update(tipoLembrete === '48h' ? { lembrete_48h_enviado: true } : { lembrete_24h_enviado: true })
                .eq('id', disc.id)

            stats.disciplinasProcessadas.push(disc.nome)
        }

        return NextResponse.json({
            success: true,
            summary: stats
        })

    } catch (error: any) {
        console.error('[CRON] Erro fatal na automação:', error)
        return NextResponse.json({ error: 'Erro interno', details: error.message }, { status: 500 })
    }
}
