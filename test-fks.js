import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  console.log("Checking foreign keys for 'rules' table...");
  const { data, error } = await supabase.rpc('get_table_fks', { table_name: 'rules' });
  
  if (error) {
    console.log("RPC get_table_fks failed, trying direct query on information_schema...");
    const { data: data2, error: error2 } = await supabase
      .from('rules')
      .select('device_id')
      .limit(1);
    
    if (error2) {
      console.error("Direct query failed:", error2.message);
    } else {
      console.log("rules table has device_id column. Let's see if we can identify the FK relationship manually.");
    }
  } else {
    console.log("Foreign keys:", data);
  }
}

run();
