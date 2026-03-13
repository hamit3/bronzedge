const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFetch() {
    console.log("Testing fetch from health_checks...");
    const { data, error } = await supabase
        .from('health_checks')
        .select('*')
        .limit(5);

    if (error) {
        console.error("Error fetching health_checks:", error);
    } else {
        console.log("Data fetched:", data);
        if (data.length === 0) {
            console.log("Table is empty or no access (RLS?)");
        }
    }
}

testFetch();
