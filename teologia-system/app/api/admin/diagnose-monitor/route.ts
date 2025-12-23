import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/auth-server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const { isAdmin, error: authError } = await verifyAdminSession()
    if (!isAdmin) {
        return NextResponse.json({ error: authError || 'Acesso negado' }, { status: 403 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const monitorEmail = searchParams.get('email')

        if (!monitorEmail) {
            return NextResponse.json({ error: 'Email do monitor é obrigatório' }, { status: 400 })
        }

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

        // 1. Get monitor ID
        const { data: monitor } = await supabaseAdmin
            .from('usuarios')
            .select('id, nome')
            .eq('email', monitorEmail)
            .single()

        if (!monitor) {
            return NextResponse.json({ error: 'Monitor não encontrado' }, { status: 404 })
        }

        // 2. Get monitor's escalas
        const { data: escalas } = await supabaseAdmin
            .from('escalas_monitores')
            .select(`
                *,
                subnucleo:subnucleos(id, nome),
                disciplina:disciplinas(id, nome, codigo)
            `)
            .eq('monitor_id', monitor.id)

        // 3. For each escala, get students
        const escalasComAlunos = await Promise.all((escalas || []).map(async (escala) => {
            // Get students in this subnucleo
            const { data: alunosSubnucleo } = await supabaseAdmin
                .from('alunos')
                .select(`
                    id,
                    cpf,
                    subnucleo_id,
                    usuario:usuarios!inner(nome, email)
                `)
                .eq('subnucleo_id', escala.subnucleo_id)

            // Get enrollments for this discipline
            const alunoIds = alunosSubnucleo?.map(a => a.id) || []
            const { data: matriculas } = await supabaseAdmin
                .from('alunos_disciplinas')
                .select('*')
                .eq('disciplina_id', escala.disciplina_id)
                .in('aluno_id', alunoIds)

            return {
                escala_id: escala.id,
                subnucleo: escala.subnucleo,
                disciplina: escala.disciplina,
                total_alunos_subnucleo: alunosSubnucleo?.length || 0,
                total_matriculas: matriculas?.length || 0,
                matriculas_cursando: matriculas?.filter(m => m.status === 'cursando').length || 0,
                alunos: alunosSubnucleo?.map(a => ({
                    id: a.id,
                    nome: a.usuario?.nome,
                    email: a.usuario?.email,
                    cpf: a.cpf,
                    tem_matricula: matriculas?.some(m => m.aluno_id === a.id),
                    status_matricula: matriculas?.find(m => m.aluno_id === a.id)?.status
                }))
            }
        }))

        return NextResponse.json({
            monitor: {
                id: monitor.id,
                nome: monitor.nome
            },
            total_escalas: escalas?.length || 0,
            escalas: escalasComAlunos
        }, { status: 200 })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
