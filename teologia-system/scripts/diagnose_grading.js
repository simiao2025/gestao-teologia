const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log('--- DIAGNÓSTICO DE ALUNOS E MATRÍCULAS ---');

    // 1. Verificar Subnúcleos
    const { data: subnucleos } = await supabase.from('subnucleos').select('id, nome');
    console.log(`Subnúcleos encontrados: ${subnucleos?.length || 0}`);
    subnucleos?.forEach(s => console.log(` - [${s.id}] ${s.nome}`));

    // 2. Verificar Disciplinas
    const { data: disciplinas } = await supabase.from('disciplinas').select('id, nome, codigo');
    console.log(`\nDisciplinas encontradas: ${disciplinas?.length || 0}`);
    disciplinas?.slice(0, 5).forEach(d => console.log(` - [${d.id}] ${d.codigo}: ${d.nome}`));

    // 3. Verificar Alunos e seus Subnúcleos
    const { data: alunos } = await supabase.from('alunos').select('id, subnucleo_id, status');
    console.log(`\nTotal de Alunos: ${alunos?.length || 0}`);

    const alunosSemSubnucleo = alunos?.filter(a => !a.subnucleo_id).length || 0;
    console.log(` - Alunos sem subnúcleo: ${alunosSemSubnucleo}`);

    // 4. Verificar Matrículas (alunos_disciplinas)
    const { data: matriculas } = await supabase.from('alunos_disciplinas').select('status, disciplina_id, aluno_id');
    console.log(`\nTotal de Matrículas: ${matriculas?.length || 0}`);

    const statusCounts = {};
    matriculas?.forEach(m => {
        statusCounts[m.status] = (statusCounts[m.status] || 0) + 1;
    });
    console.log(' - Distribuição de Status:', statusCounts);

    // 5. Verificar se existe ao menos UMA combinação válida que deveria aparecer
    if (subnucleos?.length > 0 && disciplinas?.length > 0) {
        console.log('\nVerificando combinações que deveriam aparecer no Lançamento:');
        for (const sub of subnucleos) {
            for (const disc of disciplinas.slice(0, 3)) { // Limit to first 3 to avoid spam
                const matriculadosNoPolo = matriculas?.filter(m =>
                    m.disciplina_id === disc.id &&
                    m.status === 'cursando' &&
                    alunos?.find(a => a.id === m.aluno_id)?.subnucleo_id === sub.id
                );

                if (matriculadosNoPolo?.length > 0) {
                    console.log(` ✅ Subnúcleo: ${sub.nome} | Disciplina: ${disc.nome} -> ${matriculadosNoPolo.length} alunos`);
                }
            }
        }
    }
}

diagnose();
