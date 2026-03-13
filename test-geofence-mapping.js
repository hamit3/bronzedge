import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  console.log("Fetching rules to check config values...");
  const { data: rules, error } = await supabase.from('rules').select('name, config').limit(5);
  if (error) {
    console.error("Rules Error:", error.message);
    return;
  }
  
  const geofenceIds = rules.map(r => r.config?.geofence_id).filter(Boolean);
  console.log("Rule Geofence IDs in config:", geofenceIds);

  if (geofenceIds.length > 0) {
    const { data: geofences, error: gError } = await supabase
      .from('geofences')
      .select('id, name')
      .in('id', geofenceIds);
    
    if (gError) {
      console.error("Geofences Error:", gError.message);
    } else {
      console.log("Found Geofences:", geofences);
    }
  }
}

run();
