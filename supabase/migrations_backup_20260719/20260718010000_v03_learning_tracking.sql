-- Population Genetics Coach v0.3 assessment/workspace tracking
create table if not exists public.learning_attempts (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, context_type text not null check (context_type in ('lesson','workspace')), context_id text not null, score integer not null, max_score integer not null, answers jsonb not null default '{}'::jsonb, ai_feedback jsonb, created_at timestamptz not null default now());
create table if not exists public.workspace_progress (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, workspace_id text not null, stage_index integer not null, completed boolean not null default false, draft text, ai_feedback jsonb, updated_at timestamptz not null default now(), unique(user_id,workspace_id,stage_index));
create table if not exists public.concept_mastery (user_id uuid not null references auth.users(id) on delete cascade, concept_id text not null, mastery integer not null check (mastery between 0 and 3), updated_at timestamptz not null default now(), primary key(user_id,concept_id));
alter table public.learning_attempts enable row level security; alter table public.workspace_progress enable row level security; alter table public.concept_mastery enable row level security;
drop policy if exists "own attempts" on public.learning_attempts;
create policy "own attempts" on public.learning_attempts for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
drop policy if exists "own workspace" on public.workspace_progress;
create policy "own workspace" on public.workspace_progress for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
drop policy if exists "own concepts" on public.concept_mastery;
create policy "own concepts" on public.concept_mastery for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
