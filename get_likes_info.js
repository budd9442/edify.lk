import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectLikes() {
  const { data: { user } } = await supabase.auth.getUser();
  console.log("Connected as:", user ? "Auth user" : "Anon / Service Role");
  
  // Can we get triggers from supabase if we have service key? No, postgrest doesn't show triggers usually.
  
  // Let's directly call the rpc or check what happens
}
inspectLikes();
