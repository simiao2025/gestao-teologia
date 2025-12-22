const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumn() {
    console.log('Checking aluno table structure...');
    // We can't describe table directly via client, but we can try to select the column
    const { data, error } = await supabase
        .from('alunos')
        .select('nivel_atual_id')
        .limit(1);

    if (error) {
        console.error('Error selecting nivel_atual_id:', error);
        if (error.code === 'PGRST204') { // Column not found typically or similar
            console.log('Column likely missing.');
        }
    } else {
        console.log('Column nivel_atual_id exists!');
    }
}

checkColumn();
