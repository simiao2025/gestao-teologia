const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log('--- DIAGNOSTICANDO PEDIDOS ---');
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
        console.log(JSON.stringify(data[0], null, 2));
    }
}

check();
