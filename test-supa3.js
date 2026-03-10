import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data: d1 } = await supabase.from('gnss_readings').select('*').limit(5);
  console.log("gnss sample:", d1);
  const { data: d2 } = await supabase.from('device_status').select('*').limit(2);
  console.log("device_status:", d2);
  const { data: d3 } = await supabase.from('temp_readings').select('*').limit(2);
  console.log("temp_readings:", d3);
}
run();
