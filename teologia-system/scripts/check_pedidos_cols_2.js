const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    // Check columns via a query to an empty result
    const { data, error } = await supabase.from('pedidos').select('*').limit(1);
    if (error) {
        console.error(error);
    } else {
        if (data && data.length > 0) {
            console.log('Columns found in first record:', Object.keys(data[0]));
        } else {
            console.log('No records found in pedidos to check column names.');
            // Try to find columns via RPC or just select one column that might exist
            const { error: e2 } = await supabase.from('pedidos').select('aluno_id').limit(1);
            console.log('Exists aluno_id?', !e2);
            const { error: e3 } = await supabase.from('pedidos').select('usuario_id').limit(1);
            console.log('Exists usuario_id?', !e3);
        }
    }
}

check();
