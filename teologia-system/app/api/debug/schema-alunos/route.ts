import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
    const { data, error } = await supabase
        .from('alunos')
        .select('*')
        .limit(1)

    return NextResponse.json({
        firstRecord: data ? data[0] : null,
        keys: data && data[0] ? Object.keys(data[0]) : [],
        error
    })
}
