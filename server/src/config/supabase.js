const { createClient } = require('@supabase/supabase-js');
const env = require('./env');

let supabaseUrl = (env.SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
if (supabaseUrl) {
  supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}
const supabaseKey = (env.SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '').trim();

let supabase = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log(`[Supabase Client] Successfully initialized for URL: ${supabaseUrl}`);
  } catch (err) {
    console.warn(`[Supabase Client] Initialization error: ${err.message}`);
  }
} else {
  console.log('[Supabase Client] Ready for credentials. Please set SUPABASE_URL and SUPABASE_ANON_KEY in server/.env');
}

module.exports = { supabase };
