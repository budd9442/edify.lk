import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("URL:", supabaseUrl ? "Found" : "Missing");

  // Get an article
  const { data: articles, error: err1 } = await supabase
    .from('articles')
    .select('id, likes')
    .limit(1);

  if (err1 || !articles || articles.length === 0) {
    console.error("Error fetching article:", err1);
    return;
  }
  
  const article = articles[0];
  console.log(`Article ${article.id} - initial likes: ${article.likes}`);

  // Create a mock user or use an existing one for the like
  // We'll just try to insert a like with a random UUID if RLS allows it (Service Role ignores RLS)
  const dummyUserId = '00000000-0000-0000-0000-000000000000';
  
  console.log("Inserting like...");
  const { error: err2 } = await supabase
    .from('likes')
    .insert({ article_id: article.id, user_id: dummyUserId });
    
  if (err2) {
    console.error("Error inserting like:", err2);
  } else {
    console.log("Like inserted successfully.");
  }
  
  // Wait a second for trigger
  await new Promise(r => setTimeout(r, 1000));
  
  // Re-fetch article
  const { data: articlesAfter } = await supabase
    .from('articles')
    .select('id, likes')
    .eq('id', article.id);
    
  console.log(`Article ${article.id} - likes after insert: ${articlesAfter?.[0]?.likes}`);
  
  // Cleanup
  console.log("Removing like...");
  const { error: err3 } = await supabase
    .from('likes')
    .delete()
    .eq('article_id', article.id)
    .eq('user_id', dummyUserId);
    
  if (err3) console.error("Error deleting like:", err3);
  
  // Wait a second for trigger
  await new Promise(r => setTimeout(r, 1000));
  
  // Re-fetch article again
  const { data: articlesFinal } = await supabase
    .from('articles')
    .select('id, likes')
    .eq('id', article.id);
    
  console.log(`Article ${article.id} - likes after delete: ${articlesFinal?.[0]?.likes}`);
}
test();
