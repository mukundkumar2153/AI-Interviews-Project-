-- ═══════════════════════════════════════════════════════════════════
-- InterviewAI — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

-- 1. USER PROFILES
create table if not exists public.user_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  role text default 'Software Developer',
  experience_level text default 'Mid-Level',
  resume_text text,
  resume_filename text,
  is_premium boolean default false,
  interviews_this_month integer default 0,
  streak_count integer default 0,
  last_interview_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. INTERVIEW SESSIONS
create table if not exists public.interview_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.user_profiles(id) on delete cascade,
  role text not null,
  mode text not null,          -- Technical / HR / Behavioral / Mixed
  difficulty text not null,    -- Beginner / Intermediate / Advanced
  persona text default 'Professional', -- Friendly / Strict / Panel
  company_pack text,           -- Amazon / TCS / Infosys etc.
  voice_mode boolean default false,
  question_count integer default 8,
  overall_score numeric(3,1),
  communication_score integer,
  technical_score integer,
  confidence_score integer,
  clarity_score integer,
  status text default 'in_progress', -- in_progress / completed
  ai_report jsonb,             -- Final AI generated report
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- 3. INTERVIEW QUESTIONS & ANSWERS
create table if not exists public.interview_qa (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.interview_sessions(id) on delete cascade,
  user_id uuid references public.user_profiles(id) on delete cascade,
  question_number integer not null,
  question text not null,
  is_followup boolean default false,
  parent_qa_id uuid references public.interview_qa(id),
  user_answer text,
  score integer,               -- 0-10
  communication integer,
  technical integer,
  confidence integer,
  clarity integer,
  strength text,
  improvement text,
  feedback_summary text,
  created_at timestamptz default now()
);

-- 4. DAILY CHALLENGES
create table if not exists public.daily_challenges (
  id uuid default gen_random_uuid() primary key,
  question text not null,
  role text not null,
  difficulty text default 'Intermediate',
  challenge_date date default current_date,
  created_at timestamptz default now()
);

-- 5. CHALLENGE COMPLETIONS
create table if not exists public.challenge_completions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.user_profiles(id) on delete cascade,
  challenge_id uuid references public.daily_challenges(id),
  answer text,
  score integer,
  completed_at timestamptz default now(),
  unique(user_id, challenge_id)
);

-- 6. LEADERBOARD VIEW
create or replace view public.leaderboard as
select
  up.id,
  up.full_name,
  up.avatar_url,
  up.role,
  count(s.id) as total_interviews,
  round(avg(s.overall_score), 1) as avg_score,
  max(s.overall_score) as best_score,
  up.streak_count
from public.user_profiles up
left join public.interview_sessions s
  on s.user_id = up.id and s.status = 'completed'
group by up.id, up.full_name, up.avatar_url, up.role, up.streak_count
order by avg_score desc nulls last;

-- 7. PAYMENTS / SUBSCRIPTIONS
create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.user_profiles(id) on delete cascade,
  razorpay_order_id text,
  razorpay_payment_id text,
  plan text default 'premium',  -- premium / company_pack
  pack_name text,               -- for company packs
  amount integer,               -- in paise (₹499 = 49900)
  status text default 'pending', -- pending / paid / failed
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table public.user_profiles enable row level security;
alter table public.interview_sessions enable row level security;
alter table public.interview_qa enable row level security;
alter table public.challenge_completions enable row level security;
alter table public.subscriptions enable row level security;

-- Policies: users can only see their own data
create policy "Users see own profile" on public.user_profiles
  for all using (auth.uid() = id);

create policy "Users see own sessions" on public.interview_sessions
  for all using (auth.uid() = user_id);

create policy "Users see own QAs" on public.interview_qa
  for all using (auth.uid() = user_id);

create policy "Users see own challenges" on public.challenge_completions
  for all using (auth.uid() = user_id);

create policy "Users see own subscriptions" on public.subscriptions
  for all using (auth.uid() = user_id);

-- Daily challenges are public readable
create policy "Anyone can read challenges" on public.daily_challenges
  for select using (true);

-- ── Auto-create profile on signup ─────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Update streak on interview completion ─────────────────────────────────────
create or replace function public.update_streak()
returns trigger language plpgsql security definer as $$
declare
  last_date date;
  today date := current_date;
begin
  if new.status = 'completed' and old.status = 'in_progress' then
    select last_interview_date into last_date
    from public.user_profiles where id = new.user_id;

    if last_date = today - interval '1 day' then
      -- Consecutive day — increment streak
      update public.user_profiles
      set streak_count = streak_count + 1,
          last_interview_date = today,
          interviews_this_month = interviews_this_month + 1,
          updated_at = now()
      where id = new.user_id;
    elsif last_date = today then
      -- Same day — just update count
      update public.user_profiles
      set interviews_this_month = interviews_this_month + 1,
          updated_at = now()
      where id = new.user_id;
    else
      -- Streak broken — reset to 1
      update public.user_profiles
      set streak_count = 1,
          last_interview_date = today,
          interviews_this_month = interviews_this_month + 1,
          updated_at = now()
      where id = new.user_id;
    end if;
  end if;
  return new;
end;
$$;

create or replace trigger on_interview_completed
  after update on public.interview_sessions
  for each row execute procedure public.update_streak();

-- ── Reset monthly count (run via Supabase CRON or pg_cron) ───────────────────
-- select cron.schedule('reset-monthly', '0 0 1 * *',
--   'update public.user_profiles set interviews_this_month = 0');

-- ── Sample daily challenges ───────────────────────────────────────────────────
insert into public.daily_challenges (question, role, difficulty, challenge_date) values
('Explain the difference between REST and GraphQL APIs with a real-world use case.', 'Software Developer', 'Intermediate', current_date),
('How would you handle a situation where your team disagrees with your decision?', 'HR', 'Intermediate', current_date),
('Describe a time when you exceeded your sales target. What was your strategy?', 'Sales Executive', 'Intermediate', current_date),
('What is the difference between supervised and unsupervised machine learning?', 'Data Analyst', 'Intermediate', current_date)
on conflict do nothing;