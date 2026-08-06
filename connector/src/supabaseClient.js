import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

let client = null;

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('SUPABASE_URL/SUPABASE_SERVICE_KEY nao configurados (veja .env.example).');
  }
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }
  return client;
}

export { getSupabase };
