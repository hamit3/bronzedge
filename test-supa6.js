import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data: d1 } = await supabase.from('device_status').select('*').limit(1);
  console.log("device status names:", Object.keys(d1?.[0] || {}));
  const { data: d2 } = await supabase.from('gnss_readings').select('*').limit(1);
  console.log("gnss names:", Object.keys(d2?.[0] || {}));
  const { data: d3 } = await supabase.from('devices').select('*').limit(1);
  console.log("devices:", Object.keys(d3?.[0] || {}));
}
run();
