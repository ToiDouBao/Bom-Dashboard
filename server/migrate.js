const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function migrate() {
    const db = JSON.parse(fs.readFileSync('./db.json'));
    const rows = Object.entries(db.updates).map(([line_no, val]) => ({
        line_no,
        status: val.status || null,
        attention: val.attention || false,
        remark: val.remark || ''
    }));

    console.log(`Migrating ${rows.length} records...`);

    const { error } = await supabase.from('item_updates').upsert(rows, { onConflict: 'line_no' });
    if (error) {
        console.error('Migration failed:', error.message);
        process.exit(1);
    }
    console.log(`Done. ${rows.length} records migrated to Supabase.`);
}

migrate();
