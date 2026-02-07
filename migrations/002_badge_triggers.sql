-- Migration: Badge Logic Triggers
-- Purpose: Move badge awarding logic to the database layer for robustness.

-- 1. Generic function to award a badge safely
create or replace function public.award_badge(
  p_user_id uuid,
  p_badge_id text,
  p_badge_name text,
  p_badge_desc text
)
returns void
language plpgsql
security definer
as $$
declare
  v_current_badges jsonb;
begin
  -- Get current badges, default to empty array
  select coalesce(badges, '[]'::jsonb) into v_current_badges
  from public.profiles
  where id = p_user_id;

  -- Check if badge already exists (using jsonb operator)
  if not (v_current_badges ? p_badge_id) then
    -- Update profile
    update public.profiles
    set badges = v_current_badges || to_jsonb(p_badge_id)
    where id = p_user_id;

    -- Create notification
    insert into public.notifications (user_id, type, title, message, action_url)
    values (
      p_user_id,
      'badge_earned',
      'New Badge Earned!',
      'You earned the "' || p_badge_name || '" badge: ' || p_badge_desc,
      '/profile/' || p_user_id
    );
  end if;
end;
$$;

-- 2. Trigger: Writer Badges (on articles insert)
create or replace function public.trg_check_writer_badges()
returns trigger
language plpgsql
as $$
declare
  v_count integer;
begin
  if NEW.status = 'published' then
    select count(*) into v_count
    from public.articles
    where author_id = NEW.author_id and status = 'published';

    if v_count >= 1 then
      perform public.award_badge(NEW.author_id, 'first_ink', 'First Ink', 'Published your first article');
    end if;
    if v_count >= 5 then
      perform public.award_badge(NEW.author_id, 'scribe', 'Scribe', 'Published 5 articles');
    end if;
    if v_count >= 10 then
      perform public.award_badge(NEW.author_id, 'wordsmith', 'Wordsmith', 'Published 10 articles');
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists on_article_published_badges on public.articles;
create trigger on_article_published_badges
after insert or update of status on public.articles
for each row
when (NEW.status = 'published')
execute function public.trg_check_writer_badges();

-- 3. Trigger: Quality Badges (on articles update views/likes)
create or replace function public.trg_check_quality_badges()
returns trigger
language plpgsql
as $$
begin
  -- Viral Hit (1000 views)
  if NEW.views >= 1000 and OLD.views < 1000 then
    perform public.award_badge(NEW.author_id, 'viral_hit', 'Viral Hit', 'One of your articles reached 1,000 views');
  end if;

  -- Crowd Favorite (100 likes)
  if NEW.likes >= 100 and OLD.likes < 100 then
    perform public.award_badge(NEW.author_id, 'crowd_favorite', 'Crowd Favorite', 'One of your articles reached 100 likes');
  end if;
  
  return NEW;
end;
$$;

drop trigger if exists on_article_stats_badges on public.articles;
create trigger on_article_stats_badges
after update of views, likes on public.articles
for each row
execute function public.trg_check_quality_badges();

-- 4. Trigger: Community Badges (on profiles update followers_count)
create or replace function public.trg_check_community_badges()
returns trigger
language plpgsql
as $$
begin
  if NEW.followers_count >= 10 and OLD.followers_count < 10 then
    perform public.award_badge(NEW.id, 'rising_star', 'Rising Star', 'Reached 10 followers');
  end if;
  if NEW.followers_count >= 100 and OLD.followers_count < 100 then
    perform public.award_badge(NEW.id, 'influencer', 'Influencer', 'Reached 100 followers');
  end if;
  if NEW.followers_count >= 1000 and OLD.followers_count < 1000 then
    perform public.award_badge(NEW.id, 'thought_leader', 'Thought Leader', 'Reached 1,000 followers');
  end if;
  return NEW;
end;
$$;

drop trigger if exists on_profile_followers_badges on public.profiles;
create trigger on_profile_followers_badges
after update of followers_count on public.profiles
for each row
execute function public.trg_check_community_badges();

-- 5. Trigger: Reader & Comment Badges (on comments insert)
create or replace function public.trg_check_comment_badges()
returns trigger
language plpgsql
as $$
declare
  v_count integer;
begin
  select count(*) into v_count from public.comments where user_id = NEW.user_id;
  
  if v_count >= 1 then
    perform public.award_badge(NEW.user_id, 'conversation_starter', 'Conversation Starter', 'Posted your first comment');
  end if;
  if v_count >= 50 then
    perform public.award_badge(NEW.user_id, 'debater', 'Debater', 'Posted 50 comments');
  end if;
  return NEW;
end;
$$;

drop trigger if exists on_comment_badges on public.comments;
create trigger on_comment_badges
after insert on public.comments
for each row
execute function public.trg_check_comment_badges();

-- 6. Trigger: Quiz Badges (on quiz_attempts insert)
create or replace function public.trg_check_quiz_badges()
returns trigger
language plpgsql
as $$
declare
  v_count integer;
begin
  select count(*) into v_count from public.quiz_attempts where user_id = NEW.user_id;

  if v_count >= 10 then
    perform public.award_badge(NEW.user_id, 'quiz_whiz', 'Quiz Whiz', 'Attempted 10 quizzes');
  end if;
  
  -- Leaderboard logic is complex for triggers (need relative rank); keeping simple for now or relying on App logic for rank badges
  -- Alternatively, can check if score = total_questions (Perfect Score)
  
  return NEW;
end;
$$;

drop trigger if exists on_quiz_attempt_badges on public.quiz_attempts;
create trigger on_quiz_attempt_badges
after insert on public.quiz_attempts
for each row
execute function public.trg_check_quiz_badges();
