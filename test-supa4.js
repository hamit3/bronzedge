import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data: d1 } = await supabase.from('device_status').select('orientation').limit(5);
  console.log("device status orientations:", d1);
  const { data: d2 } = await supabase.from('gnss_readings').select('spd').limit(5);
  console.log("gnss speeds:", d2);
  const { data: d3 } = await supabase.from('raw_messages').select('*').limit(2);
  console.log("raw_msgs part:", JSON.stringify(d3));
}
run();
