import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type')
        const dataId = searchParams.get('data.id')

        // Mercado Pago envia notificações de vários tipos. 
        // Estamos interessados em 'payment'.
        if (type !== 'payment' || !dataId) {
            return NextResponse.json({ received: true })
        }

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
                const { error: updateError } = await supabase
                    .from('pedidos')
                    .update({ status: 'pago' })
                    .eq('id', pedidoId)

                if (updateError) {
                    console.error('Erro ao atualizar pedido via webhook:', updateError)
                    return NextResponse.json({ error: 'Erro ao atualizar pedido.' }, { status: 500 })
                }

                // 4. (Opcional) Registrar na tabela de pagamentos_pix
                await supabase.from('pagamentos_pix').insert({
                    pedido_id: pedidoId,
                    txid: dataId,
                    valor: mpPayment.transaction_amount,
                    status: 'pago',
                    data_pagamento: mpPayment.date_approved
                })
            }
        }

        return NextResponse.json({ received: true })

    } catch (error: any) {
        console.error('Erro no Webhook Mercado Pago:', error)
        // Mercado Pago exige resposta 2xx mesmo em erro para não ficar tentando reenviar infinitamente se o erro for do nosso lado
        return NextResponse.json({ error: error.message }, { status: 200 })
    }
}
