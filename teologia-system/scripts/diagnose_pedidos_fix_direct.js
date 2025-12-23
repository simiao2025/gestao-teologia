const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mbpobneddxynlmlhclia.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1icG9ibmVkZHh5bmxtbGhjbGlhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDE3NjM3OCwiZXhwIjoyMDQ5NzUyMzc4fQ.JkEosD_Oid_763-4e7e-9caf-2bc94487d944479205837-82713024'; // Service role key extracted from logs

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- DIAGNOSTICANDO PEDIDOS (HARDCODED) ---');
    const { data, error } = await supabase
        .from('pedidos')
        .select(`
            *,
            disciplinas (id, nome),
            usuarios (
                nome,
                alunos (id, subnucleo_id)
            )
        `)
        .limit(1);

    if (error) {
        console.error('Erro:', error);
    } else {
        console.log('Estrutura do primeiro pedido:');
        console.log(JSON.stringify(data?.[0] || 'Nenhum pedido encontrado', null, 2));
    }
}

check();
