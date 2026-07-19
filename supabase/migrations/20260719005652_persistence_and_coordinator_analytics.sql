-- Population Genetics Coach: persistence, scoped staff access, and coordinator analytics
-- Create with a current Supabase timestamp before pushing, e.g.
-- supabase migration new persistence_and_coordinator_analytics
-- Then replace the generated file contents with this SQL.

-- ---------------------------------------------------------------------------
-- 1. Student-owned write policies
-- ---------------------------------------------------------------------------

alter table public.lesson_progress enable row level security;
alter table public.learning_attempts enable row level security;
alter table public.workspace_progress enable row level security;
alter table public.concept_mastery enable row level security;
alter table public.feedback_responses enable row level security;
alter table public.conversation_turns enable row level security;

drop policy if exists "students select own lesson progress" on public.lesson_progress;
create policy "students select own lesson progress"
on public.lesson_progress for select to authenticated
using (auth.uid() = user_id or public.is_course_staff());

drop policy if exists "students insert own lesson progress" on public.lesson_progress;
create policy "students insert own lesson progress"
on public.lesson_progress for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "students update own lesson progress" on public.lesson_progress;
create policy "students update own lesson progress"
on public.lesson_progress for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "students select own attempts" on public.learning_attempts;
create policy "students select own attempts"
on public.learning_attempts for select to authenticated
using (auth.uid() = user_id or public.is_course_staff());

drop policy if exists "students insert own attempts" on public.learning_attempts;
create policy "students insert own attempts"
on public.learning_attempts for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "students select own workspace progress" on public.workspace_progress;
create policy "students select own workspace progress"
on public.workspace_progress for select to authenticated
using (auth.uid() = user_id or public.is_course_staff());

drop policy if exists "students insert own workspace progress" on public.workspace_progress;
create policy "students insert own workspace progress"
on public.workspace_progress for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "students update own workspace progress" on public.workspace_progress;
create policy "students update own workspace progress"
on public.workspace_progress for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "students select own concept mastery" on public.concept_mastery;
create policy "students select own concept mastery"
on public.concept_mastery for select to authenticated
using (auth.uid() = user_id or public.is_course_staff());

drop policy if exists "students insert own concept mastery" on public.concept_mastery;
create policy "students insert own concept mastery"
on public.concept_mastery for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "students update own concept mastery" on public.concept_mastery;
create policy "students update own concept mastery"
on public.concept_mastery for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "students select own feedback" on public.feedback_responses;
create policy "students select own feedback"
on public.feedback_responses for select to authenticated
using (user_id is null or auth.uid() = user_id or public.is_course_staff());

drop policy if exists "students insert own feedback" on public.feedback_responses;
create policy "students insert own feedback"
on public.feedback_responses for insert to authenticated
with check (user_id is null or auth.uid() = user_id);

drop policy if exists "students select own conversations" on public.conversation_turns;
create policy "students select own conversations"
on public.conversation_turns for select to authenticated
using (auth.uid() = user_id or public.is_course_staff());

drop policy if exists "students insert own conversations" on public.conversation_turns;
create policy "students insert own conversations"
on public.conversation_turns for insert to authenticated
with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 2. Course-scoped staff helper
-- Admin/app_manager: global access.
-- Coordinator/manager: only users sharing a course in which the caller is
-- a coordinator. This is safer than granting every coordinator global access.
-- ---------------------------------------------------------------------------

create or replace function public.can_view_course_user(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and p.account_type in ('admin', 'app_manager')
    )
    or exists (
      select 1
      from public.profiles p
      join public.course_members staff_cm
        on staff_cm.user_id = p.user_id
       and staff_cm.role = 'coordinator'
      join public.course_members target_cm
        on target_cm.course_id = staff_cm.course_id
       and target_cm.user_id = target_user_id
      where p.user_id = auth.uid()
        and p.account_type in ('coordinator', 'manager')
    );
$$;

revoke all on function public.can_view_course_user(uuid) from public;
grant execute on function public.can_view_course_user(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Coordinator roster RPC
-- Avoids multiplicative joins by aggregating each activity table separately.
-- ---------------------------------------------------------------------------

create or replace function public.get_course_student_summary(target_course_id bigint)
returns table (
  user_id uuid,
  display_name text,
  lessons_completed bigint,
  assessment_attempts bigint,
  mean_score_percent numeric,
  ai_interactions bigint,
  workspace_milestones bigint,
  last_active timestamptz
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if not (
    exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and p.account_type in ('admin', 'app_manager')
    )
    or exists (
      select 1
      from public.profiles p
      join public.course_members cm
        on cm.user_id = p.user_id
      where p.user_id = auth.uid()
        and p.account_type in ('coordinator', 'manager')
        and cm.course_id = target_course_id
        and cm.role = 'coordinator'
    )
  ) then
    raise exception 'Not authorised for this course';
  end if;

  return query
  with students as (
    select cm.user_id, coalesce(nullif(p.display_name, ''), 'Student') as display_name
    from public.course_members cm
    join public.profiles p on p.user_id = cm.user_id
    where cm.course_id = target_course_id
      and cm.role = 'student'
  ),
  lp as (
    select
      user_id,
      count(*) filter (where completed) as lessons_completed,
      max(updated_at) as last_active
    from public.lesson_progress
    group by user_id
  ),
  la as (
    select
      user_id,
      count(*) as assessment_attempts,
      round(avg(case when max_score > 0 then score::numeric * 100 / max_score end), 1)
        as mean_score_percent,
      max(created_at) as last_active
    from public.learning_attempts
    group by user_id
  ),
  ct as (
    select user_id, count(*) as ai_interactions, max(created_at) as last_active
    from public.conversation_turns
    group by user_id
  ),
  wp as (
    select
      user_id,
      count(*) filter (where completed) as workspace_milestones,
      max(updated_at) as last_active
    from public.workspace_progress
    group by user_id
  )
  select
    s.user_id,
    s.display_name,
    coalesce(lp.lessons_completed, 0),
    coalesce(la.assessment_attempts, 0),
    coalesce(la.mean_score_percent, 0),
    coalesce(ct.ai_interactions, 0),
    coalesce(wp.workspace_milestones, 0),
    nullif(
      greatest(
        coalesce(lp.last_active, '-infinity'::timestamptz),
        coalesce(la.last_active, '-infinity'::timestamptz),
        coalesce(ct.last_active, '-infinity'::timestamptz),
        coalesce(wp.last_active, '-infinity'::timestamptz)
      ),
      '-infinity'::timestamptz
    )
  from students s
  left join lp on lp.user_id = s.user_id
  left join la on la.user_id = s.user_id
  left join ct on ct.user_id = s.user_id
  left join wp on wp.user_id = s.user_id
  order by lower(s.display_name), s.user_id;
end;
$$;

revoke all on function public.get_course_student_summary(bigint) from public;
grant execute on function public.get_course_student_summary(bigint) to authenticated;
