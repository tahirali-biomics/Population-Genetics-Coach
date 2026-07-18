-- Population Genetics Coach v1.0 production role and RLS corrections

-- Allow the application roles recognised by the frontend.
alter table public.profiles
  drop constraint if exists profiles_account_type_check;

alter table public.profiles
  add constraint profiles_account_type_check
  check (
    account_type in (
      'student',
      'coordinator',
      'manager',
      'admin',
      'app_manager'
    )
  );

-- Central helper used by staff-facing RLS policies.
create or replace function public.is_course_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where user_id = auth.uid()
      and account_type in (
        'coordinator',
        'manager',
        'admin',
        'app_manager'
      )
  );
$$;

revoke all on function public.is_course_staff() from public;
grant execute on function public.is_course_staff() to authenticated;

-- Courses and semesters must not be anonymously editable.
alter table public.courses enable row level security;
alter table public.semesters enable row level security;

drop policy if exists "authenticated read courses" on public.courses;
create policy "authenticated read courses"
on public.courses
for select
to authenticated
using (true);

drop policy if exists "staff manage courses" on public.courses;
create policy "staff manage courses"
on public.courses
for all
to authenticated
using (public.is_course_staff())
with check (public.is_course_staff());

drop policy if exists "authenticated read semesters" on public.semesters;
create policy "authenticated read semesters"
on public.semesters
for select
to authenticated
using (true);

drop policy if exists "staff manage semesters" on public.semesters;
create policy "staff manage semesters"
on public.semesters
for all
to authenticated
using (public.is_course_staff())
with check (public.is_course_staff());

-- Profiles: learners see themselves; staff may read course users.
drop policy if exists "staff read profiles" on public.profiles;
create policy "staff read profiles"
on public.profiles
for select
to authenticated
using (
  auth.uid() = user_id
  or public.is_course_staff()
);

-- Memberships.
drop policy if exists "staff read memberships" on public.course_members;
create policy "staff read memberships"
on public.course_members
for select
to authenticated
using (
  auth.uid() = user_id
  or public.is_course_staff()
);

drop policy if exists "staff manage memberships" on public.course_members;
create policy "staff manage memberships"
on public.course_members
for all
to authenticated
using (public.is_course_staff())
with check (public.is_course_staff());

-- Lesson progress.
drop policy if exists "staff read lesson progress" on public.lesson_progress;
create policy "staff read lesson progress"
on public.lesson_progress
for select
to authenticated
using (
  auth.uid() = user_id
  or public.is_course_staff()
);

-- Objective assessment attempts.
drop policy if exists "staff read learning attempts" on public.learning_attempts;
create policy "staff read learning attempts"
on public.learning_attempts
for select
to authenticated
using (
  auth.uid() = user_id
  or public.is_course_staff()
);

-- Workspace milestones.
drop policy if exists "staff read workspace progress" on public.workspace_progress;
create policy "staff read workspace progress"
on public.workspace_progress
for select
to authenticated
using (
  auth.uid() = user_id
  or public.is_course_staff()
);

-- Concept mastery.
drop policy if exists "staff read concept mastery" on public.concept_mastery;
create policy "staff read concept mastery"
on public.concept_mastery
for select
to authenticated
using (
  auth.uid() = user_id
  or public.is_course_staff()
);

-- Structured feedback.
drop policy if exists "own or staff read feedback" on public.feedback_responses;
create policy "own or staff read feedback"
on public.feedback_responses
for select
to authenticated
using (
  auth.uid() = user_id
  or public.is_course_staff()
);
