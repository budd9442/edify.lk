-- Fix the sync_article_likes trigger to run with SECURITY DEFINER
-- This allows any user who can insert a like to also increment the article's like count,
-- bypassing the RLS policy on the articles table which restricts updates to the author/editor.

CREATE OR REPLACE FUNCTION public.sync_article_likes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
begin
  if (TG_OP = 'INSERT') then
    update public.articles
    set likes = likes + 1
    where id = NEW.article_id;
  elsif (TG_OP = 'DELETE') then
    update public.articles
    set likes = greatest(0, likes - 1)
    where id = OLD.article_id;
  end if;
  return null;
end;
$$;
