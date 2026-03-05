import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

console.log("URL:", supabaseUrl ? "Found" : "Missing");

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
  console.log("Checking if RLS prevents likes...");
}

checkRLS();
