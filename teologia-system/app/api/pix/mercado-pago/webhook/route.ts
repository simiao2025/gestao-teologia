import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') || searchParams.get('topic')
        const dataId = searchParams.get('data.id') || searchParams.get('id')

        // Mercado Pago envia notificações de vários tipos. 
        // Estamos interessados em 'payment'.
        if ((type !== 'payment' && type !== 'merchant_order') || !dataId) {
            return NextResponse.json({ received: true })
        }

        // Criar cliente Admin do Supabase para ignorar RLS
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // 1. Configurar Mercado Pago
        const client = new MercadoPagoConfig({
            accessToken: process.env.MP_ACCESS_TOKEN || ''
        })
        const payment = new Payment(client)

        // 2. Consultar o status real do pagamento no Mercado Pago
        // Isso evita fraudes (alguém simulando um webhook)
        const mpPayment = await payment.get({ id: dataId })

        if (mpPayment.status === 'approved') {
            const pedidoId = mpPayment.external_reference

            if (pedidoId) {
                console.log(`Pagamento aprovado para o pedido: ${pedidoId}`)

                // 3. Atualizar o pedido no banco
                const { error: updateError } = await supabaseAdmin
                    .from('pedidos')
                    .update({ status: 'pago' })
                    .eq('id', pedidoId)

                if (updateError) {
                    console.error('Erro ao atualizar pedido via webhook:', updateError)
                    return NextResponse.json({ error: 'Erro ao atualizar pedido.' }, { status: 500 })
                }

                // 4. Registrar pagamento na tabela pagamentos_pix
                await supabaseAdmin.from('pagamentos_pix').insert({
                    pedido_id: pedidoId,
                    txid: dataId,
                    valor: mpPayment.transaction_amount,
                    status: 'pago',
                    data_pagamento: mpPayment.date_approved
                })

                // 5. Matricular o aluno na disciplina (CRÍTICO: Sem isso não aparece no painel do aluno)
                // Primeiro buscamos os detalhes do pedido para saber quem é o aluno e qual a disciplina
                const { data: pedidoDados, error: pedidoError } = await supabaseAdmin
                    .from('pedidos')
                    .select('aluno_id, disciplina_id')
                    .eq('id', pedidoId)
                    .single()

                if (pedidoDados && !pedidoError) {
                    // Verifica se já não existe matrícula para evitar duplicação
                    const { data: matriculaExistente, error: checkMatriculaError } = await supabaseAdmin
                        .from('alunos_disciplinas')
                        .select('id')
                        .eq('aluno_id', pedidoDados.aluno_id)
                        .eq('disciplina_id', pedidoDados.disciplina_id)
                        .single()

                    if (checkMatriculaError && checkMatriculaError.code !== 'PGRST116') { // PGRST116 means no rows found
                        console.error('Erro ao verificar matrícula existente:', checkMatriculaError)
                    } else if (!matriculaExistente) {
                        console.log(`Criando matrícula na disciplina ${pedidoDados.disciplina_id} para o aluno ${pedidoDados.aluno_id}`)

                        // Buscar subnúcleo atual do aluno para histórico
                        const { data: alunoData } = await supabaseAdmin
                            .from('alunos')
                            .select('subnucleo_id')
                            .eq('id', pedidoDados.aluno_id)
                            .single()

                        const subnucleoId = alunoData?.subnucleo_id

                        const { error: matriculaError } = await supabaseAdmin
                            .from('alunos_disciplinas')
                            .insert({
                                aluno_id: pedidoDados.aluno_id,
                                disciplina_id: pedidoDados.disciplina_id,
                                status: 'cursando',
                                criado_em: new Date().toISOString(),
                                subnucleo_id: subnucleoId // Histórico: onde foi cursado
                            })

                        if (matriculaError) {
                            console.error('Erro ao criar matrícula automática:', matriculaError)
                        } else {
                            console.log('Matrícula criada com sucesso para o aluno:', pedidoDados.aluno_id)
                        }
                    } else {
                        console.log('Aluno já matriculado nesta disciplina.')
                    }
                } else {
                    console.error('Não foi possível encontrar dados do pedido para matrícula:', pedidoId, pedidoError)
                }
            }
        }

        return NextResponse.json({ received: true })

    } catch (error: any) {
        console.error('Erro no Webhook Mercado Pago:', error)
        // Mercado Pago exige resposta 2xx mesmo em erro para não ficar tentando reenviar infinitamente se o erro for do nosso lado
        return NextResponse.json({ error: error.message }, { status: 200 })
    }
}
