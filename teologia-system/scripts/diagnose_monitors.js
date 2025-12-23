const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log('--- DIAGNOSTICO COMPLETO ---');

    console.log('\n--- 1. Subnucleos ---');
    const { data: subnucleos } = await supabase.from('subnucleos').select('id, nome, monitor_id');
    subnucleos?.forEach(s => console.log(`Subnucleo: ${s.nome} (${s.id}) | Monitor: ${s.monitor_id}`));

    console.log('\n--- 2. Escalas ---');
    const { data: escalas } = await supabase.from('escalas_monitores').select('subnucleo_id, disciplina_id, monitor_id');
    escalas?.forEach(e => console.log(`Escala: Sub[${e.subnucleo_id}] Disc[${e.disciplina_id}] Mon[${e.monitor_id}]`));

    console.log('\n--- 3. Matriculas (all relevant) ---');
    const { data: matriculas } = await supabase
        .from('alunos_disciplinas')
        .select(`
            id,
            status,
            disciplina_id,
            usuario:usuarios(
                nome,
                aluno:alunos(subnucleo_id)
            )
        `)
        .in('status', ['cursando', 'recuperacao', 'aprovado', 'reprovado']);

    matriculas?.forEach(m => {
        const u = m.usuario;
        const a = Array.isArray(u.aluno) ? u.aluno[0] : u.aluno;
        console.log(`Matricula: Student[${u.nome}] Disc[${m.disciplina_id}] Sub[${a?.subnucleo_id}] Status[${m.status}]`);
    });
}

diagnose().catch(err => console.error(err));
