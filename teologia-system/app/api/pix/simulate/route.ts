
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Initialize Supabase with Service Role Key for admin privileges (to update status if RLS restricts)
// If SERVICE_ROLE is not available, try with standard client, but for backend mutations, Service Role is safer/better.
// However, I'll use the environment variables as defined in lib/supabase.ts but we might need the service role key.
// Let's assume for this "Dev Simulation" the user (student) might not have permission to update their own status to 'pago'.
// So we definitely want a service role client here if possible. 
// If specific env var not present, we will fallback to anon key but it might fail if RLS is strict.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
    try {
        const { pedidoId } = await request.json()

        if (!pedidoId) {
            return NextResponse.json({ error: 'Pedido ID is required' }, { status: 400 })
        }

        // Update the order status to 'pago'
        const { data, error } = await supabase
            .from('pedidos')
            .update({ status: 'pago' })
            .eq('id', pedidoId)
            .select()

        if (error) {
            console.error('Error updating order:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, data })
    } catch (error) {
        console.error('Internal error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
