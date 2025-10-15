-- Enable required extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- Schema: Public tables keyed to auth.users (Supabase Auth)
-- Note: auth.users already exists; we store profile fields in profiles

-- PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  avatar_url text,
  bio text,
  role text not null default 'user', -- 'user' | 'author' | 'editor' | 'admin'
  followers_count integer not null default 0,
  following_count integer not null default 0,
  articles_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;

-- Profiles RLS
create policy "Public read profiles"
on public.profiles for select
to anon, authenticated
using (true);

create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Insert own profile (on signup sync)"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

-- ARTICLES
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  slug text unique,
  excerpt text,
  content_html text not null default '',
  cover_image_url text,
  tags text[] not null default '{}',
  category_id uuid,
  featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft','pending','published','archived')),
  likes integer not null default 0,
  views integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_articles_updated_at on public.articles;
create trigger trg_articles_updated_at
before update on public.articles
for each row execute procedure public.set_updated_at();

create index if not exists idx_articles_published_at on public.articles (published_at desc);
create index if not exists idx_articles_status on public.articles (status);
create index if not exists idx_articles_author on public.articles (author_id);
create index if not exists idx_articles_tags on public.articles using gin (tags);

alter table public.articles enable row level security;

-- Articles RLS
create policy "Read published articles"
on public.articles for select
to anon, authenticated
using (status = 'published');

create policy "Authors read own drafts"
on public.articles for select
to authenticated
using (author_id = auth.uid());

create policy "Authors insert own article"
on public.articles for insert
to authenticated
with check (author_id = auth.uid());

create policy "Authors update own article"
on public.articles for update
to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

create policy "Authors delete own article"
on public.articles for delete
to authenticated
using (author_id = auth.uid());

-- DRAFTS
create table if not exists public.drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content_html text not null default '',
  cover_image_url text,
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','submitted','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_drafts_updated_at on public.drafts;
create trigger trg_drafts_updated_at
before update on public.drafts
for each row execute procedure public.set_updated_at();

create index if not exists idx_drafts_user on public.drafts (user_id);
alter table public.drafts enable row level security;

-- Drafts RLS
create policy "Owner can read drafts"
on public.drafts for select
to authenticated
using (user_id = auth.uid());

create policy "Owner can insert drafts"
on public.drafts for insert
to authenticated
with check (user_id = auth.uid());

create policy "Owner can update drafts"
on public.drafts for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Owner can delete drafts"
on public.drafts for delete
to authenticated
using (user_id = auth.uid());

-- COMMENTS
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_comments_article on public.comments (article_id);
create index if not exists idx_comments_user on public.comments (user_id);

alter table public.comments enable row level security;

-- Comments RLS
create policy "Read comments of published articles"
on public.comments for select
to anon, authenticated
using (exists (
  select 1 from public.articles a
  where a.id = article_id and (a.status = 'published' or a.author_id = auth.uid())
));

create policy "Authenticated can add comments"
on public.comments for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can delete own comments"
on public.comments for delete
to authenticated
using (user_id = auth.uid());

-- FOLLOWS
create table if not exists public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followee_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create index if not exists idx_follows_followee on public.follows (followee_id);
create index if not exists idx_follows_follower on public.follows (follower_id);

alter table public.follows enable row level security;

-- Follows RLS
create policy "Read follows is public"
on public.follows for select
to anon, authenticated
using (true);

create policy "User can follow"
on public.follows for insert
to authenticated
with check (follower_id = auth.uid());

create policy "User can unfollow"
on public.follows for delete
to authenticated
using (follower_id = auth.uid());

-- Triggers to keep follower/following counts in profiles in sync
create or replace function public.sync_follow_counts()
returns trigger
language plpgsql
as $$
begin
  if (TG_OP = 'INSERT') then
    -- increment follower count for followee
    update public.profiles p set followers_count = p.followers_count + 1 where p.id = NEW.followee_id;
    -- increment following count for follower
    update public.profiles p set following_count = p.following_count + 1 where p.id = NEW.follower_id;
  elsif (TG_OP = 'DELETE') then
    update public.profiles p set followers_count = greatest(p.followers_count - 1, 0) where p.id = OLD.followee_id;
    update public.profiles p set following_count = greatest(p.following_count - 1, 0) where p.id = OLD.follower_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_sync_follow_counts on public.follows;
create trigger trg_sync_follow_counts
after insert or delete on public.follows
for each row execute function public.sync_follow_counts();

-- LIKES (optional; UI currently reads articles.likes)
create table if not exists public.likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, article_id)
);

create index if not exists idx_likes_article on public.likes (article_id);

alter table public.likes enable row level security;

create policy "Read likes public"
on public.likes for select
to anon, authenticated
using (true);

create policy "User can like"
on public.likes for insert
to authenticated
with check (user_id = auth.uid());

create policy "User can unlike"
on public.likes for delete
to authenticated
using (user_id = auth.uid());

-- NOTIFICATIONS
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('like','comment','follow','article_approved','article_rejected','badge_earned','mention','success','error','award')),
  title text not null,
  message text not null,
  read boolean not null default false,
  action_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

-- Notifications RLS
create policy "User reads own notifications"
on public.notifications for select
to authenticated
using (user_id = auth.uid());

create policy "User marks own notifications read"
on public.notifications for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Optionally restrict inserts to service role only:
-- revoke insert on public.notifications from authenticated, anon;

-- QUIZZES
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  title text not null,
  questions_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_quizzes_updated_at on public.quizzes;
create trigger trg_quizzes_updated_at
before update on public.quizzes
for each row execute procedure public.set_updated_at();

create index if not exists idx_quizzes_article on public.quizzes (article_id);

alter table public.quizzes enable row level security;

-- Quizzes RLS (read public for published articles; modify by article author)
create policy "Read quizzes for published articles"
on public.quizzes for select
to anon, authenticated
using (exists (
  select 1 from public.articles a
  where a.id = article_id and (a.status = 'published' or a.author_id = auth.uid())
));

create policy "Article author can insert/update quizzes"
on public.quizzes for all
to authenticated
using (exists (
  select 1 from public.articles a
  where a.id = article_id and a.author_id = auth.uid()
))
with check (exists (
  select 1 from public.articles a
  where a.id = article_id and a.author_id = auth.uid()
));

-- DRAFTS: add quiz_questions_json to store generated/edited quiz data at draft time
alter table if exists public.drafts
  add column if not exists quiz_questions_json jsonb not null default '[]'::jsonb;

-- Optional index for queries filtering/sorting by quiz existence/size (lightweight)
-- create index if not exists idx_drafts_quiz_questions on public.drafts ((jsonb_array_length(quiz_questions_json)));

-- QUIZ ATTEMPTS
create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete cascade,
  score integer not null,
  total_questions integer not null,
  time_spent integer not null, -- seconds
  created_at timestamptz not null default now()
);

create index if not exists idx_attempts_article on public.quiz_attempts (article_id, score desc, time_spent asc);
create index if not exists idx_attempts_user on public.quiz_attempts (user_id, created_at desc);

alter table public.quiz_attempts enable row level security;

-- Quiz attempts RLS
create policy "Read attempts public"
on public.quiz_attempts for select
to anon, authenticated
using (true);

create policy "Insert own attempts"
on public.quiz_attempts for insert
to authenticated
with check (user_id = auth.uid());

-- OPTIONAL: helper view to compute article likes from likes table
-- create view public.article_likes as
-- select article_id, count(*)::int as likes_count
-- from public.likes group by article_id;

-- Seed a profile row on signup via SQL is not automatic; use a trigger (optional)

-- ARTICLE VIEWS
create table if not exists public.article_views (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  ip_address inet not null,
  viewed_at timestamptz not null default now(),
  view_date date not null default current_date
);

create unique index idx_article_views_unique_daily 
  on public.article_views (article_id, coalesce(user_id::text, ''), ip_address, view_date);
  
create index idx_article_views_article on public.article_views (article_id);
create index idx_article_views_user on public.article_views (user_id);

alter table public.article_views enable row level security;

create policy "Anyone can insert views"
  on public.article_views for insert
  to anon, authenticated
  with check (true);

create policy "Read views public"
  on public.article_views for select
  to anon, authenticated
  using (true);

-- Function to track article view
create or replace function public.track_article_view(
  p_article_id uuid,
  p_user_id uuid,
  p_ip_address inet
)
returns boolean
language plpgsql
security definer
as $$
declare
  inserted_count integer;
begin
  insert into public.article_views (article_id, user_id, ip_address, view_date)
  values (p_article_id, p_user_id, p_ip_address, current_date)
  on conflict do nothing;
  
  -- Check if a row was actually inserted by counting affected rows
  get diagnostics inserted_count = row_count;
  
  if inserted_count > 0 then
    update public.articles
    set views = views + 1
    where id = p_article_id;
    return true;
  end if;
  
  return false;
end;
$$;

-- Function to sync likes count from likes table
create or replace function public.sync_article_likes()
returns trigger
language plpgsql
as $$
begin
  if (TG_OP = 'INSERT') then
    update public.articles
    set likes = likes + 1
    where id = NEW.article_id;
  elsif (TG_OP = 'DELETE') then
    update public.articles
    set likes = likes - 1
    where id = OLD.article_id;
  end if;
  return null;
end;
$$;

-- Trigger to auto-sync likes
drop trigger if exists trg_sync_article_likes on public.likes;
create trigger trg_sync_article_likes
after insert or delete on public.likes
for each row execute function public.sync_article_likes();

-- OPTIONAL: Create storage buckets via supabase UI (avatars, articles)
-- Not SQL here; use Storage > Create bucket (public/private as needed)