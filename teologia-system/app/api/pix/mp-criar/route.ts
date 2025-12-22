import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
    try {
        const { pedidoId, userEmail, userName } = await request.json()

        if (!pedidoId || !userEmail) {
            return NextResponse.json({ error: 'Pedido ID e Email são obrigatórios.' }, { status: 400 })
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // 1. Buscar detalhes do pedido no banco
        const { data: pedido, error: pedidoError } = await supabaseAdmin
            .from('pedidos')
            .select(`
                *,
                disciplinas (
                    nome
                )
            `)
            .eq('id', pedidoId)
            .single()

        if (pedidoError || !pedido) {
            console.error('Erro ao buscar pedido:', pedidoError)
            return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 })
        }

        // 2. Configurar Mercado Pago
        const client = new MercadoPagoConfig({
            accessToken: process.env.MP_ACCESS_TOKEN || ''
        })
        const payment = new Payment(client)

        // Validar URL de notificação (MP não aceita localhost)
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
        const notificationUrl = appUrl.includes('localhost')
            ? undefined
            : `${appUrl}/api/pix/mercado-pago/webhook`

        // 3. Criar pagamento PIX
        const paymentBody = {
            transaction_amount: Number(pedido.valor),
            description: `Curso Teologia - ${pedido.disciplinas?.nome || 'Material Didático'}`,
            payment_method_id: 'pix',
            payer: {
                email: userEmail,
                first_name: userName?.split(' ')[0] || 'Aluno',
                last_name: userName?.split(' ').slice(1).join(' ') || 'Sistema',
            },
            notification_url: notificationUrl,
            external_reference: pedido.id,
        }

        const mpResponse = await payment.create({ body: paymentBody })
            .catch((err) => {
                throw err
            })

        // 4. Salvar o ID do Mercado Pago e o copia e cola no pedido
        const point_of_interaction = mpResponse.point_of_interaction
        const qrCode = point_of_interaction?.transaction_data?.qr_code
        const qrCodeBase64 = point_of_interaction?.transaction_data?.qr_code_base64
        const mpId = mpResponse.id?.toString()

        const { error: updateError } = await supabaseAdmin
            .from('pedidos')
            .update({
                txid: mpId,
            })
            .eq('id', pedido.id)

        if (updateError) {
            console.error('Erro ao atualizar pedido com ID do MP:', updateError)
        }

        return NextResponse.json({
            id: mpId,
            qrCode: qrCode,
            qrCodeBase64: qrCodeBase64,
            status: mpResponse.status
        })

    } catch (error: any) {
        console.error('Erro ao criar pagamento Mercado Pago:', error)
        return NextResponse.json({
            error: 'Erro interno ao processar pagamento.',
            details: error.message || JSON.stringify(error)
        }, { status: 500 })
    }
}
